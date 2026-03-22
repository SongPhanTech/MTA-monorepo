import { queryClient } from '@api/index'
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
import { useStore } from '@tanstack/react-store'
import type { ExamList, SubjectClass } from '@workspace/db/client'
import { useCountExam, useFindManyExam, useFindManyRoom } from '@workspace/db/hooks'
import { sqlTransaction } from '@workspace/libs/api/model'
import { useCreateExams, useMergeExam, useUnmergeExam } from '@workspace/libs/api/training'
import { fastIsEqual, formatLecturerName } from '@workspace/libs/utils'
import { useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
import { cn } from '@workspace/ui/lib/utils'
import {
    Button,
    Checkbox,
    Col,
    Flex,
    Form,
    Input,
    InputNumber,
    message,
    Popover,
    Row,
    Switch,
} from 'antd'
import type { TableRowSelection } from 'antd/lib/table/interface'
import _ from 'lodash'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { keHoachThiStore } from '..'

interface Props {
    setActiveKey: (key: string) => void
}

type SubjectClassFormType = {
    list: Record<
        string,
        {
            rooms?: Array<{ roomId: string; quantity: number }>
            session: number
            isChanged?: boolean
        }
    >
}

type ButtonFormType = {
    mergeClasses: boolean
}

export default function DanhSachKeHoachThi({ setActiveKey }: Props) {
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const { id: semesterId } = useSemesterStore()
    const { options: examTypeOptions, getExamTypeLabel } = useExamTypeOptions()

    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>()

    const { selectedExamId } = useStore(keHoachThiStore)
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        examType: undefined,
    })
    const [open, setOpen] = useState(false)
    const { showSpinner, hideSpinner } = useSpinner()

    const [form] = Form.useForm<SubjectClassFormType>()
    const listChanges = Form.useWatch('list', form)
    const [formButton] = Form.useForm<ButtonFormType>()

    const where = useMemo(
        () => ({
            deletedAt: null,
            subjectClass: {
                some: {
                    trainingObjectTypeId,
                    semesterId,
                    ...(filters.searchText && {
                        name: {
                            contains: filters.searchText,
                            mode: 'insensitive' as const,
                        },
                    }),
                    ...(filters.examType &&
                        filters.examType.length > 0 && {
                            subject: {
                                examType: {
                                    in: filters.examType,
                                },
                            },
                        }),
                },
            },
        }),
        [filters.examType, filters.searchText, semesterId, trainingObjectTypeId]
    )

    const { data: exams = [], refetch: refetchExams } = useFindManyExam({
        where,
        include: {
            subjectClass: {
                include: {
                    mainLecturer: {
                        include: {
                            userProfile: {
                                select: {
                                    fullname: true,
                                    academicDegreeType: true,
                                    academicRankType: true,
                                },
                            },
                        },
                    },
                    room: {
                        select: {
                            id: true,
                            name: true,
                            examCapacity: true,
                        },
                    },
                    subject: true,
                    _count: {
                        select: {
                            subjectClassStudent: true,
                        },
                    },
                },
                orderBy: {
                    code: 'asc',
                },
            },
            examRooms: {
                select: {
                    roomId: true,
                    capacity: true,
                    examList: {
                        select: {
                            createdExamCode: true,
                            lockExamCode: true,
                        },
                    },
                },
                where: {
                    roomId: {
                        not: null,
                    },
                },
            },
        },
        orderBy: [{ subjectVersionId: 'asc' }, { code: 'asc' }],
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count, refetch: refetchCount } = useCountExam({
        where,
    })

    const { data: rooms = [] } = useFindManyRoom({
        where: {
            deletedAt: null,
            OR: [{ trainingRoom: true }, { examRoom: true }],
        },
        select: {
            id: true,
            name: true,
            examCapacity: true,
            trainingRoom: true,
        },
    })

    const resetField = () => {
        if (exams && rooms.length > 0) {
            form.setFieldsValue({
                list: exams.reduce(
                    (acc, exam) => {
                        acc[exam.id] = {
                            rooms:
                                exam.examRooms
                                    .filter((er) => !!er.roomId)
                                    ?.map((er) => ({
                                        roomId: er.roomId ?? '',
                                        quantity: er.capacity,
                                    })) || [],
                            isChanged: false,
                            session: exam.session ?? 1,
                        }
                        return acc
                    },
                    {} as SubjectClassFormType['list']
                ),
            })
        }
    }

    // biome-ignore lint/correctness/useExhaustiveDependencies: <skip function>
    useEffect(() => {
        resetField()
    }, [exams, rooms])

    const { mutateAsync: createExam } = useCreateExams()
    const { mutateAsync: mergeExam } = useMergeExam()
    const { mutateAsync: unmergeExam } = useUnmergeExam()

    const rowSelection: TableRowSelection = {
        selectedRowKeys: selectedRowKeys,
        onChange: (selectedKeys: React.Key[], selectedRows) => {
            setSelectedRowKeys(selectedKeys)
            if (selectedKeys.length === 0) {
                setSelectedSubjectId(undefined)
                return
            }
            setSelectedSubjectId(selectedRows[0]?.subjectClass?.[0]?.subjectId)
        },
        getCheckboxProps(record) {
            return {
                disabled:
                    record.subjectClass?.[0]?.subjectId !== selectedSubjectId &&
                    selectedSubjectId !== undefined,
            }
        },
        hideSelectAll: true,
        columnWidth: 70,
        columnTitle: 'Ghép/Tách',
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

    const handleSubmitExam = async () => {
        const data = form.getFieldsValue()
        try {
            showSpinner()
            if (trainingObjectTypeId && semesterId) {
                const listChanges = Object.entries(data.list)
                    .filter(([_, value]) => value.isChanged)
                    .map(([key, value]) => ({
                        examId: key,
                        rooms: value.rooms ?? [],
                        session: Array.from({ length: value.session }).map((_, index) => ({
                            sessionNumber: index + 1,
                        })),
                    }))
                const res = await sqlTransaction([
                    {
                        model: 'ExamPaper' as const,
                        operation: 'deleteMany',
                        data: {
                            where: {
                                examCode: null,
                                examList: {
                                    examRoom: {
                                        examId: {
                                            in: listChanges.map(({ examId }) => examId),
                                        },
                                    },
                                },
                            },
                        },
                    },
                    {
                        model: 'ExamList' as const,
                        operation: 'deleteMany',
                        data: {
                            where: {
                                examRoom: {
                                    examId: {
                                        in: listChanges.map(({ examId }) => examId),
                                    },
                                },
                            },
                        },
                    },
                    {
                        model: 'ExamRoom' as const,
                        operation: 'deleteMany',
                        data: {
                            where: {
                                examId: {
                                    in: listChanges.map(({ examId }) => examId),
                                },
                            },
                        },
                    },
                    ...listChanges.map(({ examId, rooms: selectedRooms, session }) => ({
                        model: 'Exam' as const,
                        operation: 'update',
                        data: {
                            data: {
                                examRooms: {
                                    create: selectedRooms.map((room) => ({
                                        roomId: room.roomId,
                                        capacity: room.quantity,
                                        examList: {
                                            create: session.map((s) => ({
                                                start: s.sessionNumber,
                                                end: s.sessionNumber,
                                            })),
                                        },
                                    })),
                                },
                                session: session.length,
                            },
                            where: {
                                id: examId,
                            },
                        },
                    })),
                ])
                if (res.status !== 200) {
                    throw new Error('Lưu kế hoạch thi thất bại')
                }
                message.success('Lưu kế hoạch thi thành công')
                queryClient.invalidateQueries({
                    queryKey: ['zenstack', 'Exam'],
                })
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
                queryClient.invalidateQueries({
                    queryKey: ['zenstack', 'Exam'],
                })
                formButton.resetFields()
                setOpen(false)
                refetchExams()
                refetchCount()
            }
        } catch (error: any) {
            message.error(error?.message || 'Tạo kế hoạch thi thất bại')
        } finally {
            hideSpinner()
        }
    }

    const handleMergeExam = async () => {
        try {
            showSpinner()

            if (selectedRowKeys.length < 2) {
                message.error('Vui lòng chọn ít nhất 2 kỳ thi để ghép')
                return
            }

            const res = await mergeExam({
                data: {
                    examIds: selectedRowKeys as string[],
                },
            })

            if (res.status !== 200) {
                message.error(res.data.message)
                return
            }

            message.success(res.data.message)
            refetchExams()
            setSelectedRowKeys([])
            setSelectedSubjectId(undefined)
        } catch (error: any) {
            message.error(error?.message || 'Ghép lớp không thành công')
        } finally {
            hideSpinner()
        }
    }

    const handleUnmergeExam = async () => {
        try {
            showSpinner()

            if (selectedRowKeys) {
                const res = await unmergeExam({
                    data: {
                        examId: selectedRowKeys[0] as string,
                    },
                })

                if (res.status !== 200) {
                    message.error(res.data.message)
                }

                message.success(res.data.message)
                refetchExams()
                setSelectedRowKeys([])
                setSelectedSubjectId(undefined)
            }
        } catch (error: any) {
            message.error(error?.message || 'Tách lớp không thành công')
        } finally {
            hideSpinner()
        }
    }

    return (
        <Row gutter={[8, 0]} className="w-full">
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
                            <Button type="dashed">0. Tạo kế hoạch thi</Button>
                        </Popover>
                        <Button
                            type="primary"
                            className="bg-blue-500"
                            onClick={handleMergeExam}
                            disabled={selectedRowKeys.length < 2}
                        >
                            Ghép lớp
                        </Button>
                        <Button
                            type="primary"
                            className="bg-orange-500"
                            onClick={handleUnmergeExam}
                            disabled={selectedRowKeys.length !== 1}
                        >
                            Tách lớp
                        </Button>
                        <Button type="primary" onClick={handleSubmitExam}>
                            Lưu
                        </Button>
                        <Button type="primary" danger onClick={() => resetField()}>
                            Hủy
                        </Button>
                    </Flex>
                </Flex>
            </Col>

            <Col span={24}>
                <Form
                    form={form}
                    onValuesChange={(changedValue) => {
                        const examId = Object.keys(changedValue.list)[0]
                        form.setFieldsValue({
                            list: {
                                ...form.getFieldValue('list'),
                                [examId]: {
                                    ...form.getFieldValue('list')[examId],
                                    isChanged: fastIsEqual(
                                        {
                                            ...form.getFieldValue('list')[examId],
                                            ...changedValue.list[examId],
                                        },
                                        form.getFieldValue('list')[examId]
                                    ),
                                },
                            },
                        })
                    }}
                >
                    <Table
                        rowKey="id"
                        rowSelection={{
                            type: 'checkbox',
                            ...rowSelection,
                        }}
                        maxHeight={'calc(100vh - 350px)'}
                        onRow={(record) => ({
                            // onClick: () => {
                            //     const selectedKeys = [...selectedRowKeys]
                            //     if (
                            //         selectedSubjectId &&
                            //         record.subjectClass?.[0]?.subjectId !== selectedSubjectId
                            //     ) {
                            //         return
                            //     }
                            //     const index = selectedKeys.indexOf(record.id)
                            //     if (index >= 0) {
                            //         selectedKeys.splice(index, 1)
                            //     } else {
                            //         selectedKeys.push(record.id)
                            //     }
                            //     setSelectedRowKeys(selectedKeys)
                            //     setSelectedSubjectId(
                            //         selectedKeys.length > 0
                            //             ? record.subjectClass?.[0]?.subjectId
                            //             : undefined
                            //     )
                            // },
                            className: cn(
                                selectedExamId === record.id &&
                                    'bg-orange-100 [&>td]:bg-orange-100 [&>td]:hover:bg-orange-100',
                                record.subjectClass?.[0]?.subjectId !== selectedSubjectId &&
                                    selectedSubjectId !== undefined &&
                                    'bg-gray-400',
                                listChanges?.[record.id]?.isChanged && 'bg-yellow-100'
                            ),
                            onClick: (e) => {
                                const target = e.target as HTMLElement
                                if (
                                    target.closest('.ant-select') ||
                                    target.closest('.ant-popover') ||
                                    target.closest('.ant-input') ||
                                    target.closest('.ant-table-row-selection')
                                ) {
                                    e.stopPropagation()
                                    return
                                }
                                keHoachThiStore.setState({
                                    selectedExamId: record?.id,
                                })
                            },
                            onDoubleClick: (e) => {
                                const target = e.target as HTMLElement
                                if (
                                    target.closest('.ant-select') ||
                                    target.closest('.ant-popover') ||
                                    target.closest('.ant-input') ||
                                    target.closest('.ant-table-row-selection')
                                ) {
                                    e.stopPropagation()
                                    return
                                }
                                keHoachThiStore.setState({
                                    selectedExamId: record?.id,
                                })
                                setActiveKey?.('2')
                            },
                        })}
                        data={exams}
                        columns={[
                            {
                                title: 'TT',
                                align: 'center',
                                width: 40,
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * numberOfPages,
                            },
                            {
                                title: 'Tên môn học',
                                align: 'center',
                                width: 200,
                                render: (_, record) => {
                                    const name = record.subjectClass?.[0]?.subject?.name || ''
                                    return (
                                        <div className="text-left">
                                            <HighlightText
                                                text={`${name} (${record.subjectClass?.[0]?.subject?.credit || ''})`}
                                                searchText={filters.searchText}
                                            />
                                        </div>
                                    )
                                },
                            },
                            {
                                title: 'Mã LMH - Giảng viên',
                                align: 'center',
                                width: 200,
                                render: (_, record) => {
                                    return record.subjectClass?.length ? (
                                        <TextTruncate
                                            arr={record.subjectClass.map((item: any) => {
                                                return {
                                                    key: item.id,
                                                    label: [
                                                        item.code,
                                                        formatLecturerName(item.mainLecturer),
                                                    ]
                                                        .filter(Boolean)
                                                        .join(' - '),
                                                }
                                            })}
                                        />
                                    ) : (
                                        ''
                                    )
                                },
                            },
                            {
                                title: 'Số SV',
                                align: 'center',
                                width: 45,
                                render: (_, record) =>
                                    record.subjectClass?.reduce(
                                        (
                                            total: number,
                                            sc: SubjectClass & {
                                                _count?: { subjectClassStudent?: number }
                                            }
                                        ) => total + (sc._count?.subjectClassStudent || 0),
                                        0
                                    ) || 0,
                            },
                            {
                                title: 'Hình thức thi',
                                align: 'center',
                                width: 80,
                                render: (_, record) => {
                                    const examType = record.subjectClass?.[0]?.subject?.examType
                                    return examType ? getExamTypeLabel(examType) : ''
                                },
                            },
                            {
                                title: 'Trạng thái NĐ',
                                width: 90,
                                align: 'center',
                                render: (__, record) => {
                                    return record.subjectClass?.[0]?.enteredExamScore ? (
                                        'Đã nhập điểm thi'
                                    ) : record.subjectClass?.[0]?.enteredScore ? (
                                        'Đã nhập điểm TX,ĐK'
                                    ) : (
                                        <div className="text-red-500">Chưa nhập điểm</div>
                                    )
                                },
                            },
                            {
                                title: 'Khóa nhập ĐQT',
                                align: 'center',
                                width: 90,
                                render: (_, record) => {
                                    return (
                                        <Checkbox
                                            indeterminate={
                                                !record?.subjectClass?.every?.(
                                                    (sc: SubjectClass) => sc.isLockScore
                                                ) &&
                                                record?.subjectClass.some(
                                                    (sc: SubjectClass) => sc.isLockScore
                                                )
                                            }
                                            checked={record?.subjectClass.every(
                                                (sc: SubjectClass) => sc.isLockScore
                                            )}
                                        />
                                    )
                                },
                            },
                            {
                                title: 'Khóa DTS',
                                align: 'center',
                                width: 60,
                                render: (_, record) => {
                                    const lockExamSessions = record.lockExamSessions
                                    return <Checkbox checked={lockExamSessions} />
                                },
                            },
                            {
                                title: 'Đánh phách',
                                align: 'center',
                                width: 70,
                                render: (_, record) => {
                                    return (
                                        <Checkbox
                                            indeterminate={
                                                !record?.examRooms?.every?.(
                                                    (er: { examList: ExamList[] }) =>
                                                        er.examList.every(
                                                            (el) => el.createdExamCode
                                                        )
                                                ) &&
                                                record?.examRooms?.some(
                                                    (er: { examList: ExamList[] }) =>
                                                        er.examList?.some(
                                                            (el) => el.createdExamCode
                                                        )
                                                )
                                            }
                                            checked={record?.examRooms?.every?.(
                                                (sc: { examList: ExamList[] }) =>
                                                    sc.examList.every((el) => el.createdExamCode)
                                            )}
                                        />
                                    )
                                },
                            },
                            {
                                title: 'Khóa phách',
                                align: 'center',
                                width: 70,
                                render: (_, record) => {
                                    return (
                                        <Checkbox
                                            indeterminate={
                                                !record?.examRooms?.every?.(
                                                    (er: { examList: ExamList[] }) =>
                                                        er.examList.every((el) => el.lockExamCode)
                                                ) &&
                                                record?.examRooms?.some(
                                                    (er: { examList: ExamList[] }) =>
                                                        er.examList?.some((el) => el.lockExamCode)
                                                )
                                            }
                                            checked={record?.examRooms?.every?.(
                                                (sc: { examList: ExamList[] }) =>
                                                    sc.examList.every((el) => el.lockExamCode)
                                            )}
                                        />
                                    )
                                },
                            },
                            {
                                title: 'Danh sách phòng',
                                align: 'center',
                                width: 350,
                                render: (_, record) => {
                                    return (
                                        <>
                                            <Form.Item
                                                className="m-0"
                                                hidden
                                                name={['list', record.id, 'isChanged']}
                                            />
                                            <Form.Item
                                                className="m-0"
                                                name={['list', record.id, 'rooms']}
                                            >
                                                <RoomSelector
                                                    disabled={record?.examRooms?.some(
                                                        (er: { examList: ExamList[] }) =>
                                                            er.examList?.some(
                                                                (el) => el.lockExamCode
                                                            )
                                                    )}
                                                    rooms={rooms.map((room) => ({
                                                        id: room.id,
                                                        capacity: room.examCapacity ?? 0,
                                                        name: room.name,
                                                    }))}
                                                />
                                            </Form.Item>
                                        </>
                                    )
                                },
                            },
                            {
                                title: 'Số ca thi',
                                align: 'center',
                                width: 60,
                                render: (_, record) => {
                                    return (
                                        <Form.Item
                                            className="m-0"
                                            name={['list', record.id, 'session']}
                                        >
                                            <InputNumber
                                                disabled={record?.examRooms?.some(
                                                    (er: { examList: ExamList[] }) =>
                                                        er.examList?.some((el) => el.lockExamCode)
                                                )}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                }}
                                                className="w-full"
                                                controls={false}
                                                step={1}
                                                max={6}
                                                min={1}
                                            />
                                        </Form.Item>
                                    )
                                },
                            },
                            // {
                            //     title: 'Giảng viên 1',
                            //     align: 'center',
                            //     width: 100,
                            //     render: (_, record) => {
                            //         const lecturerName =
                            //             record.subjectClass?.[0]?.mainLecturer?.userProfile
                            //                 ?.fullname
                            //         return <div className="text-left">{lecturerName || ''}</div>
                            //     },
                            // },
                            {
                                title: 'Ngày thi',
                                align: 'center',
                                width: 60,
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
