import FormItem from '@components/commons/form-item'
import Select from '@components/commons/select'
import RoomSelector from '@components/commons/select-room-table'
import Table from '@components/commons/table'
import TextTruncate from '@components/commons/text-truncate'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import { useExamTypeOptions } from '@hooks/examType'
import useSpinner from '@hooks/spinner'
import { formatDate } from '@lib/utils'
import type { SubjectClass } from '@workspace/db/client'
import { useCountExam, useFindManyExam, useFindManyRoom } from '@workspace/db/hooks'
import { useCreateExams } from '@workspace/libs/api/training'
import { useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
import { Button, Checkbox, Col, Flex, Form, Input, message, Popover, Row, Switch } from 'antd'
import type { TableRowSelection } from 'antd/lib/table/interface'
import _ from 'lodash'
import { useCallback, useState } from 'react'

interface Props {
    onSelectSubjectClass: (id: string | null) => void
    setActiveKey: (key: string) => void
}

type SubjectClassFormType = {
    list: Record<
        string,
        {
            isLockScore?: boolean
            lockExamSessions?: boolean
            createdExamCode?: boolean
            lockExamCode?: boolean
            rooms?: string[]
        }
    >
}

type ButtonFormType = {
    mergeClasses: boolean
}

export default function DanhSachKeHoachThi({ onSelectSubjectClass, setActiveKey }: Props) {
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const { id: semesterId } = useSemesterStore()
    const { options: examTypeOptions, getExamTypeLabel } = useExamTypeOptions()

    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        examType: undefined,
    })
    const [open, setOpen] = useState(false)
    const { showSpinner, hideSpinner } = useSpinner()

    const [form] = Form.useForm<SubjectClassFormType>()
    const [formButton] = Form.useForm<ButtonFormType>()

    console.log(selectedRowKeys)

    const { data: exams = [], refetch: refetchExams } = useFindManyExam({
        where: {
            subjectClass: {
                some: {
                    trainingObjectTypeId,
                    semesterId,
                },
            },
        },
        include: {
            subjectClass: {
                include: {
                    mainLecturer: {
                        include: {
                            userProfile: {
                                select: {
                                    fullname: true,
                                },
                            },
                        },
                    },
                    room: {
                        select: {
                            id: true,
                            name: true,
                            capacity: true,
                        },
                    },
                    subject: true,
                    _count: {
                        select: {
                            subjectClassStudent: true,
                        },
                    },
                },
            },
            studentSubjectScore: true,
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    console.log('exams', exams)

    const { data: count } = useCountExam()

    const { data: rooms = [] } = useFindManyRoom({
        where: {
            deletedAt: null,
            OR: [{ trainingRoom: true }, { examRoom: true }],
        },
        select: {
            id: true,
            name: true,
            capacity: true,
        },
    })

    const { mutateAsync: createExam } = useCreateExams()

    const rowSelection: TableRowSelection = {
        selectedRowKeys: selectedRowKeys,
        onChange: (selectedKeys: React.Key[]) => {
            setSelectedRowKeys(selectedKeys)
        },
    }

    const debouncedSearch = useCallback(
        _.debounce((value: string) => {
            setFilters((prev) => ({
                ...prev,
                searchText: value,
            }))
        }, 500),
        []
    )

    const HighlightText = ({ text, searchText }: { text: string; searchText?: string }) => {
        if (!searchText) return <>{text}</>

        const parts = text.split(new RegExp(`(${searchText})`, 'gi'))

        return (
            <>
                {parts.map((part) =>
                    part.toLowerCase() === searchText.toLocaleLowerCase() ? (
                        <span key={part} className="text-yellow-800 bg-yellow-300 font-semibold">
                            {part}
                        </span>
                    ) : (
                        part
                    )
                )}
            </>
        )
    }

    const handleSubmitExam = () => {
        const data = form.getFieldsValue()
        console.log(data)
    }

    const handleCreateExam = async () => {
        try {
            showSpinner()
            const dataSubmit = formButton.getFieldsValue()
            if (trainingObjectTypeId && semesterId) {
                const res = await createExam({
                    data: {
                        isGroupBySubject: dataSubmit.mergeClasses,
                        semesterId: semesterId,
                        trainingObjectTypeId: trainingObjectTypeId,
                    },
                })

                if (res.status !== 200) {
                    message.error(res.data.message)
                    return
                }

                message.success('Tạo kế hoạch thi thành công')
                refetchExams()
                formButton.resetFields()
                setOpen(false)
            }
        } catch (error: any) {
            message.error(error?.message || 'Tạo kế hoạch thi thất bại')
        } finally {
            hideSpinner()
        }
    }

    return (
        <Row gutter={[8, 0]}>
            <Col span={24}>
                <Flex justify="space-between" align="center">
                    <Flex gap={8}>
                        <Input
                            placeholder="Tìm kiếm"
                            className="w-60"
                            allowClear
                            onChange={(e) => debouncedSearch(e.target.value)}
                        />
                        <Select
                            allowClear
                            mode="multiple"
                            placeholder="Chọn hình thức thi"
                            className="w-60"
                            options={examTypeOptions.map((opt) => ({
                                label: opt.label,
                                value: opt.value,
                            }))}
                            onChange={(value) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    examType: value,
                                }))
                            }
                        />
                    </Flex>
                    <Flex justify="end" gap={8}>
                        <Popover
                            content={
                                <Form
                                    form={formButton}
                                    className="max-w-56"
                                    initialValues={{
                                        mergeClasses: false,
                                    }}
                                    onFinish={handleCreateExam}
                                >
                                    <FormItem
                                        form={formButton}
                                        name="mergeClasses"
                                        label="Ghép lớp"
                                        valuePropName="checked"
                                    >
                                        <Switch
                                            checkedChildren="Ghép lớp"
                                            unCheckedChildren="Riêng"
                                        />
                                    </FormItem>
                                    <Col span={24} className="text-right mt-4">
                                        <Button type="primary" htmlType="submit">
                                            Xác nhận
                                        </Button>
                                    </Col>
                                </Form>
                            }
                            title="Ghép lớp kỳ thi"
                            trigger="click"
                            placement="bottomRight"
                            open={open}
                            onOpenChange={setOpen}
                        >
                            <Button type="primary">Tạo kế hoạch thi</Button>
                        </Popover>

                        <Button type="primary" onClick={handleSubmitExam}>
                            Lưu
                        </Button>
                        <Button type="primary">Hủy</Button>
                    </Flex>
                </Flex>
            </Col>

            <Col span={24}>
                <Form form={form}>
                    <Table
                        rowKey="id"
                        rowSelection={{
                            type: 'checkbox',
                            ...rowSelection,
                        }}
                        // onRow={(record) => ({
                        //     // onClick: () => {
                        //     //     setSelectedRowKey(record?.id)
                        //     //     onSelectSubjectClass(record?.id)
                        //     // },
                        //     onDoubleClick: (e) => {
                        //         const target = e.target as HTMLElement
                        //         if (
                        //             target.closest('.ant-select') ||
                        //             target.closest('.ant-popover') ||
                        //             target.closest('.ant-input') ||
                        //             target.closest('.ant-table-row-selection')
                        //         ) {
                        //             e.stopPropagation()
                        //             return
                        //         }
                        //         onSelectSubjectClass(record?.id)
                        //         setSelectedRowKey(record?.id)
                        //         setActiveKey?.('2')
                        //     },
                        // })}
                        data={exams}
                        columns={[
                            {
                                title: 'STT',
                                align: 'center',
                                width: 30,
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * numberOfPages,
                            },
                            {
                                title: 'Tên môn học',
                                align: 'center',
                                width: 150,
                                render: (_, record) => {
                                    const name = record.subjectClass?.[0]?.subject?.name || ''
                                    return (
                                        <div className="text-left">
                                            <HighlightText
                                                text={name}
                                                searchText={filters.searchText}
                                            />
                                        </div>
                                    )
                                },
                            },
                            {
                                title: 'Mã LMH',
                                align: 'center',
                                width: 30,
                                render: (_, record) => {
                                    return record.subjectClass.length ? (
                                        <TextTruncate
                                            arr={record.subjectClass.map((item: SubjectClass) => {
                                                return {
                                                    key: item.id,
                                                    label: item.code,
                                                }
                                            })}
                                        />
                                    ) : (
                                        ''
                                    )
                                },
                            },
                            {
                                title: 'Số tín chỉ',
                                align: 'center',
                                width: 50,
                                render: (_, record) =>
                                    record.subjectClass?.[0]?.subject?.credit || '',
                            },
                            {
                                title: 'Số sinh viên',
                                align: 'center',
                                width: 60,
                                render: (_, record) =>
                                    record.subjectClass?.[0]?._count.subjectClassStudent || 0,
                            },
                            {
                                title: 'Hình thức thi',
                                align: 'center',
                                width: 60,
                                render: (_, record) => {
                                    const examType = record.subjectClass?.[0]?.subject?.examType
                                    return examType ? getExamTypeLabel(examType) : ''
                                },
                            },
                            {
                                title: 'Khóa nhập ĐQT',
                                align: 'center',
                                width: 60,
                                render: (_, record) => {
                                    const isLockScore = record.subjectClass?.[0]?.isLockScore
                                    return (
                                        <Form.Item
                                            className="mb-0"
                                            name={['list', record.id, 'isLockScore']}
                                            valuePropName="checked"
                                        >
                                            <span className="pointer-events-none">
                                                <Checkbox checked={isLockScore} />
                                            </span>
                                        </Form.Item>
                                    )
                                },
                            },
                            {
                                title: 'Khóa DTS',
                                align: 'center',
                                width: 40,
                                render: (_, record) => {
                                    const lockExamSessions = record.lockExamSessions
                                    return (
                                        <Form.Item
                                            className="mb-0"
                                            name={['list', record.id, 'lockExamSessions']}
                                            valuePropName="checked"
                                        >
                                            <span className="pointer-events-none">
                                                <Checkbox checked={lockExamSessions} />
                                            </span>
                                        </Form.Item>
                                    )
                                },
                            },
                            {
                                title: 'Đánh phách',
                                align: 'center',
                                width: 40,
                                render: (_, record) => {
                                    const createdExamCode = record.createdExamCode
                                    return (
                                        <Form.Item
                                            className="mb-0"
                                            name={['list', record.id, 'createdExamCode']}
                                            valuePropName="checked"
                                        >
                                            <span className="pointer-events-none">
                                                <Checkbox checked={createdExamCode} />
                                            </span>
                                        </Form.Item>
                                    )
                                },
                            },
                            {
                                title: 'Khóa phách',
                                align: 'center',
                                width: 40,
                                render: (_, record) => {
                                    const lockExamCode = record.lockExamCode
                                    return (
                                        <Form.Item
                                            className="mb-0"
                                            name={['list', record.id, 'lockExamCode']}
                                            valuePropName="checked"
                                        >
                                            <span className="pointer-events-none">
                                                <Checkbox checked={lockExamCode} />
                                            </span>
                                        </Form.Item>
                                    )
                                },
                            },
                            {
                                title: 'Danh sách phòng',
                                align: 'center',
                                width: 170,
                                render: (_, record) => {
                                    return (
                                        <Form.Item
                                            className="mb-0"
                                            name={['list', record.id, 'rooms']}
                                            initialValue={
                                                record.subjectClass?.[0]?.room
                                                    ? [
                                                          {
                                                              name: record.subjectClass?.[0]?.room
                                                                  .name,
                                                              roomId: record.subjectClass?.[0]?.room
                                                                  .id,
                                                              quantity:
                                                                  record.subjectClass?.[0]?.room
                                                                      .capacity,
                                                          },
                                                      ]
                                                    : []
                                            }
                                        >
                                            <RoomSelector rooms={rooms} />
                                        </Form.Item>
                                    )
                                },
                            },
                            {
                                title: 'Giảng viên 1',
                                align: 'center',
                                width: 100,
                                render: (_, record) => {
                                    const lecturerName =
                                        record.subjectClass?.[0]?.mainLecturer?.userProfile
                                            ?.fullname
                                    return <div className="text-left">{lecturerName || ''}</div>
                                },
                            },
                            {
                                title: 'Ngày thi',
                                align: 'center',
                                width: 20,
                                render: (_, record) => {
                                    const examDate = record.subjectClass?.[0]?.examDate
                                    return examDate ? formatDate(examDate) : undefined
                                },
                            },
                        ]}
                        pagination={{
                            current: currentPage,
                            pageSize: numberOfPages,
                            total: count,
                            onChange: (page, pageSize) => {
                                if (numberOfPages === pageSize) {
                                    setCurrentPage(page)
                                } else {
                                    setCurrentPage(1)
                                    setNumberOfPages(pageSize)
                                }
                            },
                            showTotal: (total, range) =>
                                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
                        }}
                    />
                </Form>
            </Col>
        </Row>
    )
}
