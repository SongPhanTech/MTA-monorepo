import DatePicker from '@components/commons/date-picker'
import FormItem from '@components/commons/form-item'
import Select from '@components/commons/select'
import Table from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import { useExamTypeOptions } from '@hooks/examType'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { cn } from '@lib/utils'
import { useSession } from '@workspace/auth/react'
import { $Enums, type Prisma, type SubjectVersion } from '@workspace/db/client'
import {
    useCountSubjectClass,
    useFindManyFixedClass,
    useFindManySubjectClass,
} from '@workspace/db/hooks'
import {
    setExamScoreDeadLine,
    setScoreDeadLine,
    useCreateExams,
} from '@workspace/libs/api/training'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION, ROUTER_PATH } from '@workspace/router'
import { useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
import {
    DatePicker as AntdDatePicker,
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
    Tag,
    Tooltip,
} from 'antd'
import locale from 'antd/es/date-picker/locale/vi_VN'
import dayjs, { type Dayjs } from 'dayjs'
import _ from 'lodash'
import { CalendarPlus, Search } from 'lucide-react'
import { useRouter } from 'next/router'
import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

type TimeScore = {
    time: [Dayjs, Dayjs]
    startPadding: number
    endPadding: number
    overwrite: boolean
}
type TimeScoreExam = {
    endDate: Dayjs
    endPadding: number
    overwrite: boolean
}

type HoldAnExam = {
    isGroupBySubject: boolean
}

export default function ClassSubject() {
    const { canSome, can } = useAbility()
    const { showSpinner, hideSpinner } = useSpinner()
    const router = useRouter()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    const { options, getExamTypeLabel } = useExamTypeOptions()
    const [open, setOpen] = useState(false)
    const [openExam, setOpenExam] = useState(false)
    const [openHoldAnExam, setOpenHoldAnExam] = useState(false)
    const [form] = Form.useForm<TimeScore>()
    const [formExam] = Form.useForm<TimeScoreExam>()
    const [formHoldAnExam] = Form.useForm<HoldAnExam>()
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        code: '',
        name: '',
        examType: undefined,
        schoolYearId: undefined,
        semesterId: undefined,
        startDate: undefined,
        endDate: undefined,
        examDate: undefined,
        credit: undefined,
        mainLecturer: undefined,
        enterGradeLecturer: undefined,
        fixedClassId: undefined,
    })
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const { id: semesterId } = useSemesterStore()

    const { onOpen, onClose } = useDisclosure<string>({
        tag: 'PutDeadlineScoreModal',
        onClose: () => {
            debouncedRefetch()
        },
    })

    const handleSchedule = (id: string) => {
        onOpen(id)
    }
    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }

    //#endregion

    const canReadAll = can(
        QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DS_LOP_MON_HOC,
        'XEM_TAT_CA'
    )

    const { data: session } = useSession()
    const profileId = session?.sDM_NhanVienId || ''

    // Lấy danh sách FixedClass
    const { data: fixedClasses = [] } = useFindManyFixedClass(
        {
            where: {
                ...((trainingObjectTypeId || semesterId) && {
                    trainingCourse: {
                        ...(trainingObjectTypeId && { trainingObjectTypeId }),
                        ...(semesterId && { semesterStartId: semesterId }),
                    },
                }),
            },
            include: {
                trainingCourse: {
                    include: {
                        trainingObjectType: true,
                        semesterStart: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
            // skip: trainingCourses.length ? 0 : 1,
        },
        {
            enabled: !!trainingObjectTypeId || !!semesterId,
        }
    )
    //#region Mới
    /* Mới */

    const where = useMemo(() => {
        return {
            ...(semesterId ? { semesterId } : {}),
            ...(trainingObjectTypeId ? { trainingObjectTypeId } : {}),
            ...(filters.searchText && filters.searchText !== ''
                ? {
                      OR: [
                          {
                              name: {
                                  contains: filters.searchText,
                                  mode: 'insensitive',
                              },
                          },
                          {
                              code: {
                                  contains: filters.searchText,
                                  mode: 'insensitive',
                              },
                          },
                      ],
                  }
                : {}),
            ...(filters.code && filters.code !== ''
                ? {
                      code: {
                          contains: filters.searchText || filters.code,
                          mode: 'insensitive',
                      },
                  }
                : {}),
            ...(filters.name && filters.name !== ''
                ? {
                      name: {
                          contains: filters.name,
                          mode: 'insensitive',
                      },
                  }
                : {}),

            ...(filters.examType
                ? {
                      examType: {
                          in: filters.examType,
                      },
                  }
                : {}),
            ...(filters.fixedClassId
                ? {
                      fixedClasses: {
                          some: {
                              id: filters.fixedClassId,
                          },
                      },
                  }
                : {}),
            ...(filters.mainLecturer
                ? {
                      mainLecturer: {
                          userProfile: filters.mainLecturer
                              ? {
                                    fullname: {
                                        contains: filters.mainLecturer,
                                        mode: 'insensitive' as const,
                                    },
                                }
                              : {},
                      },
                  }
                : {}),
            ...(filters.enterGradeLecturer
                ? {
                      enterGradeLecturer: {
                          userProfile: filters.enterGradeLecturer
                              ? {
                                    fullname: {
                                        contains: filters.enterGradeLecturer,
                                        mode: 'insensitive' as const,
                                    },
                                }
                              : {},
                      },
                  }
                : {}),

            ...(filters.startDate?.length === 2
                ? {
                      startDate: {
                          gte: dayjs(filters.startDate?.[0], 'DD/MM/YYYY').toDate(),
                          lte: dayjs(filters.startDate?.[1], 'DD/MM/YYYY').toDate(),
                      },
                  }
                : {}),
            ...(filters.endDate?.length === 2
                ? {
                      endDate: {
                          gte: dayjs(filters.endDate?.[0], 'DD/MM/YYYY').toDate(),
                          lte: dayjs(filters.endDate?.[1], 'DD/MM/YYYY').toDate(),
                      },
                  }
                : {}),
            ...(filters.examDate?.length === 2
                ? {
                      examDate: {
                          gte: dayjs(filters.examDate?.[0], 'DD/MM/YYYY').toDate(),
                          lte: dayjs(filters.examDate?.[1], 'DD/MM/YYYY').toDate(),
                      },
                  }
                : {}),

            ...(!canReadAll
                ? {
                      mainLecturer: {
                          userProfileId: profileId,
                      },
                  } //Nếu không có quyền xem tất cả thì chỉ được xem lớp do mình giảng dạy
                : {}),
            deletedAt: null,
            cancelled: false,
            active: true,
            status: 'OFFICIAL',
        } satisfies Prisma.SubjectClassWhereInput
    }, [filters, semesterId, trainingObjectTypeId, profileId, canReadAll])

    const { data: dataTable = [], refetch } = useFindManySubjectClass({
        where,
        include: {
            subject: {
                include: {
                    managementOrganization: true,
                },
            },
            mainLecturer: {
                include: { userProfile: true },
            },
            extraLecturer: {
                include: { userProfile: true },
            },
            enterGradeLecturer: {
                include: { userProfile: true },
            },
            subjectClassStudent: {
                include: {
                    student: { include: { userProfile: true } },
                },
            },
        },
        orderBy: {
            code: 'asc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        // form.setFieldsValue({
        //     time: [],
        // })
        formExam.setFieldsValue({
            endDate: undefined,
        })
    }, [filters])

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )

    const { data: count } = useCountSubjectClass({
        where,
    })

    const handleUpdateTime = async (values: TimeScore) => {
        try {
            showSpinner()
            const { status, data } = await setScoreDeadLine({
                classIds: selectedRowKeys as string[],
                startPadding: values.startPadding,
                endPadding: values.endPadding,
                startDate: values.time?.[0]?.startOf('day').toISOString(),
                endDate: values.time?.[1]?.endOf('day').toISOString(),
                overwrite: values.overwrite,
                trainingObjectTypeId,
                semesterId,
            })
            if (status === 200) {
                message.success('Cập nhật thời gian nhập điểm ĐK/CC thành công')
                debouncedRefetch()
                form.resetFields()
                setOpen(false)
            } else {
                console.error(data)
            }
        } catch (error: any) {
            console.error(error)
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const handleUpdateTimeScore = async (values: TimeScoreExam) => {
        try {
            showSpinner()
            const { status, data } = await setExamScoreDeadLine({
                classIds: selectedRowKeys as string[],
                endPadding: values.endPadding,
                endDate: values.endDate?.toISOString(),
                overwrite: values.overwrite,
                trainingObjectTypeId,
                semesterId,
            })
            if (status === 200) {
                message.success('Cập nhật thời gian nhập điểm thi thành công')
                debouncedRefetch()
                form.resetFields()
                setOpen(false)
            } else {
                console.error(data)
            }
        } catch (error: any) {
            console.error(error)
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { mutateAsync: createExam } = useCreateExams()

    const handleUpdateHoldAnExam = async (values: HoldAnExam) => {
        try {
            showSpinner()

            if (semesterId && trainingObjectTypeId) {
                const res = await createExam({
                    data: {
                        semesterId,
                        trainingObjectTypeId,
                        isGroupBySubject: values.isGroupBySubject,
                    },
                })

                if (res.status !== 200) {
                    message.error(res.data.message || 'Lên danh sách thi thất bại')
                    return
                }

                message.success('Lên danh sách thi thành công')
                router.push(ROUTER_PATH.QL_DAO_TAO.TO_CHUC_THI_DANH_SACH_THI)
            }
        } catch (error: any) {
            message.error('Đã có lỗi xảy ra khi tạo danh sách thi')
        } finally {
            hideSpinner()
        }
    }

    const rowSelection = {
        selectedRowKeys,
        onChange: (newSelectedRowKeys: React.Key[]) => {
            setSelectedRowKeys(newSelectedRowKeys)
        },
    }

    return (
        <div>
            <Row>
                <Col span={24}>
                    <Row align="top" justify="space-between">
                        <Col span={12}>
                            <Flex>
                                <Col span={8}>
                                    <Form.Item className="m-0" name="searchText">
                                        <Select
                                            options={fixedClasses.map((i) => {
                                                return {
                                                    value: i.id,
                                                    label: `${i?.code} - ${i.name}`,
                                                }
                                            })}
                                            id="search"
                                            onChange={(e) => handleFilterChange('fixedClassId', e)}
                                            placeholder="Chọn lớp quản lý"
                                            style={{ height: 32 }}
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item className="m-0" name="searchText">
                                        <Input
                                            id="search"
                                            onChange={(e) =>
                                                handleFilterChange('searchText', e.target.value)
                                            }
                                            placeholder="Tìm kiếm lớp..."
                                            style={{ height: 32 }}
                                            prefix={
                                                <Search
                                                    size={15}
                                                    style={{
                                                        color: 'rgba(0, 0, 0, 0.25)',
                                                    }}
                                                />
                                            }
                                            className="w-full ml-3"
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                            </Flex>
                        </Col>
                        <Col span={6}>
                            <Flex justify="end" align="center" gap={4}>
                                {can(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DS_LOP_MON_HOC,
                                    'XEM_TAT_CA'
                                ) && (
                                    <>
                                        {selectedRowKeys.length > 0 && (
                                            <p>(Đang chọn {selectedRowKeys.length} lớp)</p>
                                        )}
                                        <Popover
                                            content={
                                                <Form
                                                    className="max-w-56"
                                                    form={form}
                                                    initialValues={{
                                                        isOverride: false,
                                                    }}
                                                    onFinish={handleUpdateTime}
                                                >
                                                    <FormItem
                                                        form={form}
                                                        name="startPadding"
                                                        label="Ngày thi - Ngày bắt đầu"
                                                        className="mb-2"
                                                    >
                                                        <InputNumber
                                                            className="w-full"
                                                            min={0}
                                                            step={1}
                                                            placeholder="14"
                                                        />
                                                    </FormItem>
                                                    <FormItem
                                                        form={form}
                                                        className="mb-2 w-full"
                                                        name="endPadding"
                                                        label="Ngày thi - Ngày kết thúc"
                                                    >
                                                        <InputNumber
                                                            className="w-full"
                                                            min={0}
                                                            step={1}
                                                            placeholder="7"
                                                        />
                                                    </FormItem>
                                                    <FormItem
                                                        layout="vertical"
                                                        form={form}
                                                        name="time"
                                                        label={
                                                            <Tooltip
                                                                title={
                                                                    'Dành cho những lớp chưa có ngày thi'
                                                                }
                                                            >
                                                                Thời gian nhập điểm quá trình
                                                            </Tooltip>
                                                        }
                                                        className="italic"
                                                    >
                                                        <AntdDatePicker.RangePicker
                                                            locale={locale}
                                                            format="DD/MM/YYYY"
                                                            placeholder={['Bắt đầu', 'Kết thúc']}
                                                        />
                                                    </FormItem>
                                                    <FormItem
                                                        form={form}
                                                        className="mb-2"
                                                        name="overwrite"
                                                        label="Ghi đè hạn cũ"
                                                    >
                                                        <Switch className="mx-auto" />
                                                    </FormItem>
                                                    <Col span={24} className="text-right mt-4">
                                                        <Button type="primary" htmlType="submit">
                                                            Xác nhận
                                                        </Button>
                                                    </Col>
                                                </Form>
                                            }
                                            title="Gán hạn nhập điểm quá trình"
                                            trigger="click"
                                            placement="bottomRight"
                                            open={open}
                                            onOpenChange={setOpen}
                                        >
                                            <Button type="primary">Đặt hạn nhập điểm ĐK/CC</Button>
                                        </Popover>
                                        <Popover
                                            content={
                                                <Form
                                                    className="max-w-56"
                                                    form={formExam}
                                                    initialValues={{ isOverride: false }}
                                                    onFinish={handleUpdateTimeScore}
                                                >
                                                    <FormItem
                                                        form={form}
                                                        name="endPadding"
                                                        label="Ngày kết thúc - Ngày thi"
                                                        className="mb-2"
                                                    >
                                                        <InputNumber
                                                            className="w-full"
                                                            min={0}
                                                            step={0}
                                                            placeholder="7"
                                                        />
                                                    </FormItem>
                                                    <FormItem
                                                        className="italic"
                                                        layout="vertical"
                                                        form={formExam}
                                                        name="endDate"
                                                        label={
                                                            <Tooltip
                                                                title={
                                                                    'Dành cho những lớp chưa có ngày thi'
                                                                }
                                                            >
                                                                Thời gian nhập điểm thi
                                                            </Tooltip>
                                                        }
                                                    >
                                                        <DatePicker
                                                            format="DD/MM/YYYY"
                                                            placeholder="Hạn nhập điểm thi"
                                                            className="w-full"
                                                        />
                                                    </FormItem>
                                                    <FormItem
                                                        form={form}
                                                        className="mb-2"
                                                        name="overwrite"
                                                        label="Ghi đè hạn cũ"
                                                    >
                                                        <Switch className="mx-auto" />
                                                    </FormItem>
                                                    <Col span={24} className="text-right mt-4">
                                                        <Button type="primary" htmlType="submit">
                                                            Xác nhận
                                                        </Button>
                                                    </Col>
                                                </Form>
                                            }
                                            title="Gán hạn nhập điểm thi"
                                            trigger="click"
                                            placement="bottomRight"
                                            open={openExam}
                                            onOpenChange={setOpenExam}
                                        >
                                            <Button type="primary">Đặt hạn nhập điểm thi</Button>
                                        </Popover>
                                    </>
                                )}
                            </Flex>
                        </Col>
                    </Row>
                </Col>

                <Col span={24} className="mt-4">
                    <Table
                        filters={filters}
                        setFilters={setFilters}
                        rowKey="id"
                        id="training-category"
                        className="table-subject-score"
                        // rowClassName={rowClassName}
                        rowSelection={rowSelection}
                        onRow={(record) => {
                            return {
                                className: cn(
                                    record?.subject?.examType === 'OfflineWritten'
                                        ? 'text-blue-500'
                                        : '',
                                    dayjs()?.isAfter(record?.scoreDeadline) && !record?.enteredScore
                                        ? 'text-red-500'
                                        : '',
                                    dayjs().isAfter(record?.examScoreDeadline) &&
                                        !record?.enteredExamScore
                                        ? 'text-red-600'
                                        : ''
                                ),
                            }
                        }}
                        columns={[
                            {
                                title: 'STT',
                                width: 40,
                                align: 'center',
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Mã lớp',
                                dataIndex: 'code',
                                align: 'center',
                                width: 120,
                                type: 'input',
                            },
                            {
                                title: 'Môn học',
                                width: 175,
                                align: 'left',
                                type: 'input',
                                render: (_, record) => (
                                    <p>
                                        {record.type === $Enums.SubjectClassType.RETAKE ? (
                                            <Tag color={'blue'} className="p-0 px-1">
                                                Học lại
                                            </Tag>
                                        ) : record.type === $Enums.SubjectClassType.REEXAM ? (
                                            <Tag color={'yellow'} className="p-0 px-1">
                                                Thi lại
                                            </Tag>
                                        ) : null}
                                        {record.subject?.name} ({record.subject?.credit})
                                    </p>
                                ),
                            },
                            // {
                            //     title: 'Số TC',
                            //     dataIndex: 'credit',
                            //     width: 80,
                            //     align: 'center',
                            //     type: 'order',
                            //     render: (text, record: { subject?: SubjectVersion }) =>
                            //         record.subject?.credit || text,
                            // },
                            {
                                title: 'Thi',
                                dataIndex: 'examType',
                                align: 'center',
                                width: 100,
                                type: 'select',
                                options: options,
                                render: (__, record: { subject?: SubjectVersion }) => {
                                    return record?.subject?.examType ? (
                                        <div
                                        // className={`${record?.subject?.examType === 'OfflineWritten' ? 'text-red-500' : ''}`}
                                        >
                                            {getExamTypeLabel(record?.subject?.examType)}
                                        </div>
                                    ) : (
                                        ''
                                    )
                                },
                            },
                            {
                                title: 'Trạng thái NĐ',
                                width: 120,
                                align: 'center',
                                render: (__, record) => {
                                    return record?.enteredExamScore ? (
                                        'Đã nhập điểm thi'
                                    ) : record?.enteredScore ? (
                                        'Đã nhập điểm TX,ĐK'
                                    ) : (
                                        <div className="text-red-500">Chưa nhập điểm</div>
                                    )
                                },
                            },
                            {
                                title: <Tooltip title="Môn 1 đầu điểm">Môn 1 ĐĐ</Tooltip>,
                                width: 80,
                                align: 'center',
                                render: (__, record) => {
                                    return <Checkbox checked={record?.subject?.onePoint} />
                                },
                            },
                            // {
                            //     title: 'Ngày bắt đầu',
                            //     dataIndex: 'startDate',
                            //     width: 150,
                            //     align: 'center',
                            //     type: 'date',
                            //     render: (record: string) =>
                            //         record ? dayjs(record).format('DD/MM/YYYY') : '',
                            // },

                            {
                                title: 'Ngày NĐQT',
                                dataIndex: 'scoreDeadLineStart',
                                width: 120,
                                align: 'center',
                                type: 'date',
                                render: (record: string) =>
                                    record ? dayjs(record).format('DD/MM/YYYY') : '',
                            },
                            {
                                title: 'Hạn NĐQT',
                                width: 120,
                                dataIndex: 'scoreDeadline',
                                align: 'center',
                                type: 'date',
                                render: (_, record) => (
                                    <div
                                    // className={`${dayjs().isBefore(record?.scoreDeadline) ? '' : 'text-red-500'}`}
                                    >
                                        {record?.scoreDeadline
                                            ? dayjs(record.scoreDeadline).format('DD/MM/YYYY')
                                            : ''}
                                    </div>
                                ),
                            },
                            {
                                title: 'Hạn ĐQT',
                                width: 100,
                                align: 'center',
                                render: (__, record) => {
                                    const today = dayjs()
                                    if (!record?.scoreDeadline) {
                                        return '-'
                                    }
                                    const scoreDeadline = dayjs(record?.scoreDeadline)

                                    let daysRemaining: number

                                    if (today?.isBefore(scoreDeadline)) {
                                        daysRemaining = scoreDeadline?.diff(today, 'day')
                                    } else {
                                        return <div className="text-red-500">Hết hạn</div>
                                    }

                                    return (
                                        <Tooltip title={`Còn ${daysRemaining} ngày trước hạn ĐQT`}>
                                            <span>{daysRemaining}</span>
                                        </Tooltip>
                                    )
                                },
                            },
                            {
                                title: 'Ngày thi',
                                dataIndex: 'examDate',
                                width: 120,
                                align: 'center',
                                type: 'date',
                                render: (record: string) =>
                                    record ? dayjs(record).format('DD/MM/YYYY') : '',
                            },
                            {
                                title: 'Hạn NĐT',
                                width: 120,
                                align: 'center',
                                type: 'date',
                                render: (record) => {
                                    return (
                                        <div
                                        // className={`${dayjs().isBefore(record?.examScoreDeadline) ? '' : 'text-red-500'}`}
                                        >
                                            {record?.examScoreDeadline
                                                ? dayjs(record.examScoreDeadline).format(
                                                      'DD/MM/YYYY'
                                                  )
                                                : ''}
                                        </div>
                                    )
                                },
                            },

                            {
                                title: 'Hạn ĐT',
                                width: 100,
                                align: 'center',
                                render: (__, record) => {
                                    const today = dayjs()
                                    if (!record.examScoreDeadline) {
                                        return '-'
                                    }
                                    const examScoreDeadline = dayjs(record?.examScoreDeadline)

                                    let daysRemaining: number

                                    if (today?.isBefore(examScoreDeadline)) {
                                        daysRemaining = examScoreDeadline?.diff(today, 'day')
                                    } else {
                                        return <div className="text-red-500">Hết hạn</div>
                                    }

                                    return (
                                        <Tooltip title={`Còn ${daysRemaining} ngày trước hạn ĐT`}>
                                            <span>{daysRemaining}</span>
                                        </Tooltip>
                                    )
                                },
                            },

                            {
                                title: 'Giảng viên 1',
                                width: 150,
                                align: 'center',
                                type: 'input',
                                dataIndex: 'mainLecturer',
                                render: (text, record: any) => {
                                    const mainLecturer = record.mainLecturer
                                        ? `${record.mainLecturer.userProfile.lastName} ${record.mainLecturer.userProfile.firstName}`
                                        : ''

                                    return <ul>{mainLecturer && <li>- {mainLecturer}</li>}</ul>
                                },
                            },

                            {
                                title: 'Giảng viên NĐ',
                                width: 150,
                                align: 'center',
                                type: 'input',
                                dataIndex: 'mainLecturer',
                                render: (text, record: any) => {
                                    const enterGradeLecturer = record.enterGradeLecturer
                                        ? `${record.enterGradeLecturer.userProfile.lastName} ${record.enterGradeLecturer.userProfile.firstName}`
                                        : ''
                                    return (
                                        <ul>
                                            {enterGradeLecturer && <li>- {enterGradeLecturer}</li>}
                                        </ul>
                                    )
                                },
                            },
                            {
                                title: 'ĐV phụ trách',
                                dataIndex: 'danhSachLop',
                                width: 100,
                                align: 'center',
                                render: (text, record: any) => {
                                    return (
                                        <span>
                                            {record.subject?.managementOrganization?.sMa || ''}
                                        </span>
                                    )
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                hidden: !canSome(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DS_LOP_MON_HOC,
                                    'NHAP_DIEM'
                                ),
                                render: (_, { id, subject }) => {
                                    if (id) {
                                        return (
                                            <Row className="flex justify-center items-center gap-2 text-[#028850]">
                                                <Tooltip title="Đặt hạn nhập điểm" placement="top">
                                                    <CalendarPlus
                                                        size={16}
                                                        onClick={() => handleSchedule(id)}
                                                        strokeWidth={2}
                                                    />
                                                </Tooltip>
                                            </Row>
                                        )
                                    }
                                    return ''
                                },
                            },
                        ]}
                        data={dataTable}
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
                </Col>
            </Row>
        </div>
    )
}

ClassSubject.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
