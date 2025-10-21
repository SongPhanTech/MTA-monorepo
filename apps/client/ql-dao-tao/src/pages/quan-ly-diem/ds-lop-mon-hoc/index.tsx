import FormItem from '@components/commons/form-item'
import Table from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import { useExamTypeOptions } from '@hooks/examType'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { useSession } from '@workspace/auth/react'
import type { Prisma, SubjectClass, SubjectVersion } from '@workspace/db/client'
import {
    useCountSubjectClass,
    useCreateExam,
    useFindManySubjectClass,
    useUpdateSubjectClass,
} from '@workspace/db/hooks'
import { sqlTransaction } from '@workspace/libs/api/model'
import { listUser } from '@workspace/libs/constants'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION, ROUTER_PATH } from '@workspace/router'
import { useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
import {
    Button,
    Col,
    DatePicker,
    Flex,
    Form,
    Input,
    InputNumber,
    message,
    Popover,
    Row,
    Switch,
    Tooltip,
} from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import _ from 'lodash'
import { CalendarPlus, Search } from 'lucide-react'
import { useRouter } from 'next/router'
import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'

const { RangePicker } = DatePicker
type TimeScore = {
    time: [Dayjs, Dayjs]
    beforeDays: number
    fromDays: number
}
type TimeScoreExam = {
    examScoreDeadline: Dayjs
    beforeDays: number
}

type HoldAnExam = {
    isGroupBySubject: boolean
}

type SubjectClassRelation = Prisma.SubjectClassGetPayload<{
    include: {
        subject: true
        subjectClassStudent: {
            include: {
                student: true
            }
        }
    }
}>

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
    })
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const { id: semesterId } = useSemesterStore()
    const handleNavigate = (id: string) => {
        router.push(`${ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_QL_DIEM_CC_TX}?subjectClassId=${id}`)
    }

    const handleNavigateThi = (id: string) => {
        router.push(`${ROUTER_PATH.QL_DAO_TAO.QUAN_LY_DIEM_QL_DIEM_THI}?subjectClassId=${id}`)
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
    //#region Mới
    /* Mới */
    const { mutateAsync: updateSubjectClass } = useUpdateSubjectClass()
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
            ...(filters.mainLecturer
                ? {
                      mainLecturer: {
                          userProfile: {
                              OR: [
                                  {
                                      firstName: {
                                          contains: filters.mainLecturer,
                                          mode: 'insensitive' as const,
                                      },
                                  },
                                  {
                                      lastName: {
                                          contains: filters.mainLecturer,
                                          mode: 'insensitive' as const,
                                      },
                                  },
                              ],
                          },
                      },
                  }
                : {}),
            ...(filters.enterGradeLecturer
                ? {
                      enterGradeLecturer: {
                          userProfile: {
                              OR: [
                                  {
                                      firstName: {
                                          contains: filters.enterGradeLecturer,
                                          mode: 'insensitive' as const,
                                      },
                                  },
                                  {
                                      lastName: {
                                          contains: filters.enterGradeLecturer,
                                          mode: 'insensitive' as const,
                                      },
                                  },
                              ],
                          },
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
            active: true,
            deletedAt: null,
            cancelled: false,
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

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        form.setFieldsValue({
            time: [],
        })
        formExam.setFieldsValue({
            examScoreDeadline: '',
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
    const handleFilterApply = (newFilters: Partial<FilterProps>) => {
        setFilters((prev) => {
            const updatedFilters = { ...prev, ...newFilters }
            debouncedRefetch()
            return updatedFilters
        })
    }
    /* Mới */
    // #endregion
    const handleCheckExamDate = () => {
        dataTable.forEach((item: SubjectClass) => {
            if (item.examDate) {
                if (!item.examScoreDeadline) {
                    const examDate = new Date(item.examDate)
                    const examScoreDeadline = new Date(examDate.getTime() + 7 * 24 * 60 * 60 * 1000)
                    item.examScoreDeadline = examScoreDeadline
                    if (item.examScoreDeadline <= new Date(new Date().setHours(24, 0, 0, 0))) {
                        item.isLockExamScore = true
                    } else if (examDate >= new Date(new Date().setHours(24, 0, 0, 0))) {
                        item.isLockExamScore = true
                    } else {
                        item.isLockExamScore = false
                    }
                    updateSubjectClass({
                        where: { id: item.id },
                        data: {
                            examScoreDeadline,
                            isLockExamScore: item.isLockExamScore,
                        },
                    }).catch((error) => {
                        message.error('Error updating examScoreDeadline for item:', error)
                    })
                } else {
                    const examDate = new Date(item.examDate)
                    if (item.examScoreDeadline < new Date(new Date().setHours(24, 0, 0, 0))) {
                        item.isLockExamScore = true
                    } else if (examDate >= new Date(new Date().setHours(24, 0, 0, 0))) {
                        item.isLockExamScore = true
                    } else {
                        item.isLockExamScore = false
                    }
                    updateSubjectClass({
                        where: { id: item.id },
                        data: { isLockExamScore: item.isLockExamScore },
                    }).catch((error) => {
                        message.error('Error updating examScoreDeadline for item:', error)
                    })
                }
                // Kiểm tra và cập nhật scoreDeadline
                if (!item.scoreDeadline) {
                    const examDate = new Date(item.examDate)
                    const scoreDeadline = new Date(examDate.getTime() - 7 * 24 * 60 * 60 * 1000)
                    item.scoreDeadline = scoreDeadline
                    if (item.scoreDeadline < new Date()) {
                        item.isLockScore = true
                    } else {
                        item.isLockScore = false
                    }
                    updateSubjectClass({
                        where: { id: item.id },
                        data: { scoreDeadline, isLockScore: item.isLockScore },
                    }).catch((error) => {
                        message.error('Error updating scoreDeadline for item:', error)
                    })
                } else {
                    if (item.scoreDeadline < new Date()) {
                        item.isLockScore = true
                    } else {
                        item.isLockScore = false
                    }
                    updateSubjectClass({
                        where: { id: item.id },
                        data: { isLockScore: item.isLockScore },
                    }).catch((error) => {
                        message.error('Error updating scoreDeadline for item:', error)
                    })
                }
            }
        })
    }

    // const rowClassName = (record:any) => {
    //     if (record.examType ==='OfflineWritten') return 'bg-red-50'
    //     return ''
    //     }

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        handleCheckExamDate()
    }, [])

    const handleUpdateTime = async (values: TimeScore) => {
        try {
            showSpinner()
            const res = await sqlTransaction([
                {
                    model: 'SubjectClass',
                    operation: 'findMany',
                    data: {
                        where,
                    },
                },
            ])
            if (res?.status === 200 && res?.data.length > 0) {
                const list: any = res?.data[0]
                let listTransaction: any = []
                listTransaction = list.map((i: SubjectClass) => {
                    if (i?.examDate && values?.beforeDays && values?.fromDays) {
                        const scoreDeadLineStart = dayjs(i?.examDate)
                            .subtract(values?.fromDays, 'day')
                            .toDate()
                        const scoreDeadline = dayjs(scoreDeadLineStart)
                            .add(values?.beforeDays, 'day')
                            .toDate()
                        return {
                            model: 'SubjectClass',
                            operation: 'update',
                            data: {
                                where: { id: i.id },
                                data: {
                                    scoreDeadLineStart,
                                    scoreDeadline,
                                },
                            },
                        }
                    }
                    return {
                        model: 'SubjectClass',
                        operation: 'update',
                        data: {
                            where: { id: i.id },
                            data: {
                                scoreDeadLineStart: values?.time[0].toDate(),
                                scoreDeadline: values?.time[1].toDate(),
                            },
                        },
                    }
                })
                if (listTransaction?.length > 0) {
                    const resUpdate = await sqlTransaction(listTransaction)
                    if (resUpdate?.status === 200) {
                        message.success('Cập nhật thời gian nhập điểm TX/CC thành công')
                        debouncedRefetch()
                        form.resetFields()
                        setOpen(false)
                    }
                }
            }
        } catch (error: any) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const handleUpdateTimeScore = async (values: TimeScoreExam) => {
        try {
            showSpinner()
            const res = await sqlTransaction([
                {
                    model: 'SubjectClass',
                    operation: 'findMany',
                    data: {
                        where,
                    },
                },
            ])
            if (res?.status === 200 && res?.data.length > 0) {
                const list: any = res?.data[0]
                let listTransaction: any = []
                listTransaction = list.map((i: SubjectClass) => {
                    if (i?.examDate && values?.beforeDays) {
                        const examScoreDeadline = dayjs(i?.examDate)
                            .add(values?.beforeDays, 'day')
                            .toDate()
                        return {
                            model: 'SubjectClass',
                            operation: 'update',
                            data: {
                                where: { id: i.id },
                                data: {
                                    examScoreDeadline,
                                },
                            },
                        }
                    }
                    return {
                        model: 'SubjectClass',
                        operation: 'update',
                        data: {
                            where: { id: i.id },
                            data: {
                                examScoreDeadline: values?.examScoreDeadline,
                            },
                        },
                    }
                })
                if (listTransaction?.length > 0) {
                    const resUpdate = await sqlTransaction(listTransaction)
                    if (resUpdate?.status === 200) {
                        message.success('Cập nhật thời gian nhập điểm TX/CC thành công')
                        debouncedRefetch()
                        form.resetFields()
                        setOpen(false)
                    }
                }
            }
        } catch (error: any) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { mutateAsync: createExam } = useCreateExam()

    const handleUpdateHoldAnExam = async (values: HoldAnExam) => {
        try {
            showSpinner()

            const res = await sqlTransaction([
                {
                    model: 'SubjectClass',
                    operation: 'findMany',
                    data: {
                        where: {
                            deletedAt: null,
                            cancelled: false,
                            enteredScore: true,
                            ...(semesterId ? { semesterId } : {}),
                            ...(trainingObjectTypeId ? { trainingObjectTypeId } : {}),
                        },
                        include: {
                            subjectClassStudent: {
                                where: {
                                    exempted: false,
                                    examBanned: false,
                                    withdrew: false,
                                },
                                include: {
                                    student: true,
                                },
                            },
                        },
                    },
                },
            ])

            if (res.status === 200 && res.data.length > 0) {
                const subjectClasses = res.data[0] as SubjectClassRelation[]

                if (values.isGroupBySubject) {
                    const groupedClasses = subjectClasses.reduce(
                        (acc, subjectClass) => {
                            const key = `${subjectClass.subjectId}_${subjectClass.trainingObjectTypeId}_${subjectClass.semesterId}`

                            if (!acc[key]) {
                                acc[key] = {
                                    subjectClassIds: [],
                                    studentSubjectScores: [],
                                }
                            }

                            acc[key].subjectClassIds.push(subjectClass.id)

                            const studentScoreIds = subjectClass.subjectClassStudent.map(
                                (scs) => scs.id
                            )
                            acc[key].studentSubjectScores.push(...studentScoreIds)

                            return acc
                        },
                        {} as Record<
                            string,
                            { subjectClassIds: string[]; studentSubjectScores: string[] }
                        >
                    )

                    const examData = Object.values(groupedClasses).map((group) => ({
                        subjectClass: {
                            connect: group.subjectClassIds.map((id) => ({ id })),
                        },
                        studentSubjectScore: {
                            connect: group.studentSubjectScores.map((id) => ({ id })),
                        },
                    }))

                    for (const exam of examData) {
                        await createExam({ data: exam })
                    }

                    message.success('Tạo danh sách thi thành công')
                    router.push(ROUTER_PATH.QL_DAO_TAO.TO_CHUC_THI_DANH_SACH_THI)
                } else {
                    const examData = subjectClasses.map((subjectClass) => ({
                        subjectClass: {
                            connect: [{ id: subjectClass.id }],
                        },
                        studentSubjectScore: {
                            connect: subjectClass.subjectClassStudent.map((scs) => ({
                                id: scs.id,
                            })),
                        },
                    }))

                    for (const exam of examData) {
                        await createExam({ data: exam })
                    }

                    message.success('Tạo danh sách thi thành công')
                    router.push(ROUTER_PATH.QL_DAO_TAO.TO_CHUC_THI_DANH_SACH_THI)
                }
            }
        } catch (error: any) {
            message.error('Đã có lỗi xảy ra khi tạo danh sách thi')
        } finally {
            hideSpinner()
        }
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
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                            </Flex>
                        </Col>
                        <Col span={6}>
                            <Flex justify="end" gap={4}>
                                {can(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_GIAO_DUC_QUAN_LY_LOP_MON_HOC,
                                    'XEM_TAT_CA'
                                ) && (
                                    <>
                                        <Popover
                                            content={
                                                <Form
                                                    form={formHoldAnExam}
                                                    initialValues={{
                                                        isGroupBySubject: false,
                                                    }}
                                                    onFinish={handleUpdateHoldAnExam}
                                                >
                                                    <FormItem
                                                        form={formHoldAnExam}
                                                        name="isGroupBySubject"
                                                        label="Gộp theo môn học"
                                                        className="mb-2"
                                                        valuePropName="checked"
                                                    >
                                                        <Switch />
                                                    </FormItem>
                                                    <Col span={24} className="text-right mt-4">
                                                        <Button type="primary" htmlType="submit">
                                                            Xác nhận
                                                        </Button>
                                                    </Col>
                                                </Form>
                                            }
                                            title="Sửa lên danh sách thi"
                                            trigger="click"
                                            placement="bottomRight"
                                            open={openHoldAnExam}
                                            onOpenChange={setOpenHoldAnExam}
                                        >
                                            <Button type="primary">Lên danh sách thi</Button>
                                        </Popover>
                                        <Popover
                                            content={
                                                <Form
                                                    form={form}
                                                    initialValues={{ isOverride: false }}
                                                    onFinish={handleUpdateTime}
                                                >
                                                    <FormItem
                                                        form={form}
                                                        name={'beforeDays'}
                                                        label="Số ngày nhập điểm TX,CC"
                                                        className="mb-2"
                                                    >
                                                        <InputNumber
                                                            className="w-full"
                                                            min={0}
                                                            step={0}
                                                            placeholder="Nhập số ngày nhập điểm TX,CC"
                                                        />
                                                    </FormItem>
                                                    <FormItem
                                                        form={form}
                                                        className="mb-2"
                                                        name={'fromDays'}
                                                        label="Thời gian NĐ tính theo ngày thi"
                                                    >
                                                        <InputNumber
                                                            className="w-full"
                                                            min={0}
                                                            step={0}
                                                            placeholder="Nhập thời gian nhập điểm tính theo ngày thi"
                                                        />
                                                    </FormItem>
                                                    <FormItem
                                                        form={form}
                                                        name={'time'}
                                                        label="Thời gian nhập điểm TX,CC"
                                                    >
                                                        <RangePicker
                                                            format={'DD/MM/YYYY'}
                                                            placeholder={['Bắt đầu', 'Kết thúc']}
                                                        />
                                                    </FormItem>
                                                    <Col span={24} className="text-right mt-4">
                                                        <Button type="primary" htmlType="submit">
                                                            Xác nhận
                                                        </Button>
                                                    </Col>
                                                </Form>
                                            }
                                            title="Sửa thời gian nhập điểm TX,CC"
                                            trigger="click"
                                            placement="bottomRight"
                                            open={open}
                                            onOpenChange={setOpen}
                                        >
                                            <Button
                                                // onClick={() => handleModal()}
                                                type="primary"
                                            >
                                                Thời gian nhập điểm TX/CC
                                            </Button>
                                        </Popover>
                                        <Popover
                                            content={
                                                <Form
                                                    form={formExam}
                                                    initialValues={{ isOverride: false }}
                                                    onFinish={handleUpdateTimeScore}
                                                >
                                                    <FormItem
                                                        form={form}
                                                        name={'beforeDays'}
                                                        label="Số ngày nhập điểm thi"
                                                        className="mb-2"
                                                    >
                                                        <InputNumber
                                                            className="w-full"
                                                            min={0}
                                                            step={0}
                                                            placeholder="Nhập số ngày nhập điểm thi"
                                                        />
                                                    </FormItem>
                                                    <FormItem
                                                        form={formExam}
                                                        name={'examScoreDeadline'}
                                                        label="Hạn nhập điểm thi"
                                                    >
                                                        <DatePicker
                                                            format={'DD/MM/YYYY'}
                                                            placeholder={'Hạn nhập điểm thi'}
                                                            className="w-full"
                                                        />
                                                    </FormItem>
                                                    <Col span={24} className="text-right mt-4">
                                                        <Button type="primary" htmlType="submit">
                                                            Xác nhận
                                                        </Button>
                                                    </Col>
                                                </Form>
                                            }
                                            title="Sửa thời gian nhập điểm thi"
                                            trigger="click"
                                            placement="bottomRight"
                                            open={openExam}
                                            onOpenChange={setOpenExam}
                                        >
                                            <Button
                                                // onClick={() => handleModal()}
                                                type="primary"
                                            >
                                                Hạn nhập điểm thi
                                            </Button>
                                        </Popover>
                                    </>
                                )}
                            </Flex>
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <Table
                        filters={filters}
                        setFilters={setFilters}
                        rowKey="id"
                        id="training-category"
                        // rowClassName={rowClassName}
                        // rowSelection={rowSelection}
                        columns={[
                            {
                                title: 'STT',
                                width: 60,
                                align: 'center',
                                fixed: 'left',
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
                                dataIndex: 'name',
                                width: 200,
                                align: 'center',
                                type: 'input',
                                render: (text, record: { subject?: SubjectVersion }) =>
                                    record.subject?.name || text,
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
                                title: 'Hình thức thi',
                                dataIndex: 'examType',
                                align: 'center',
                                width: 150,
                                type: 'select',
                                options: options,
                                render: (__, record: { subject?: SubjectVersion }) => {
                                    return record?.subject?.examType ? (
                                        <div
                                            className={`${record?.subject?.examType === 'OfflineWritten' ? 'text-red-500' : ''}`}
                                        >
                                            {getExamTypeLabel(record?.subject?.examType)}
                                        </div>
                                    ) : (
                                        ''
                                    )
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
                                title: 'Số ngày',
                                width: 100,
                                align: 'center',
                                render: (__, record) => {
                                    const today = dayjs()
                                    const scoreDeadline = dayjs(record?.scoreDeadline)
                                    const examScoreDeadline = dayjs(record?.examScoreDeadline)

                                    if (!scoreDeadline && !examScoreDeadline) {
                                        return '-'
                                    }

                                    let daysRemaining: number
                                    let deadlineType: string

                                    if (today?.isBefore(scoreDeadline)) {
                                        daysRemaining = scoreDeadline?.diff(today, 'day')
                                        deadlineType = 'ĐQT'
                                    } else if (today?.isBefore(examScoreDeadline)) {
                                        daysRemaining = examScoreDeadline?.diff(today, 'day')
                                        deadlineType = 'ĐT'
                                    } else {
                                        return <div className="text-red-500">Hết hạn</div>
                                    }

                                    return (
                                        <Tooltip
                                            title={`Còn ${daysRemaining} ngày trước hạn ${deadlineType}`}
                                        >
                                            <span
                                                style={{
                                                    color:
                                                        daysRemaining <= 3
                                                            ? 'red'
                                                            : daysRemaining <= 7
                                                              ? 'orange'
                                                              : 'green',
                                                    fontWeight: 'bold',
                                                    marginLeft: '5px',
                                                }}
                                            >
                                                {daysRemaining}
                                            </span>
                                        </Tooltip>
                                    )
                                },
                            },
                            {
                                title: 'Ngày nhập ĐQT',
                                dataIndex: 'scoreDeadLineStart',
                                width: 150,
                                align: 'center',
                                type: 'date',
                                render: (record: string) =>
                                    record ? dayjs(record).format('DD/MM/YYYY') : '',
                            },
                            {
                                title: 'Hạn ĐQT',
                                width: 120,
                                dataIndex: 'scoreDeadline',
                                align: 'center',
                                type: 'date',
                                render: (_, record) => (
                                    <div
                                        className={`${dayjs().isBefore(record?.scoreDeadline) ? '' : 'text-red-500'}`}
                                    >
                                        {record.scoreDeadline
                                            ? dayjs(record.scoreDeadline).format('DD/MM/YYYY')
                                            : ''}
                                    </div>
                                ),
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
                                title: 'Hạn ĐT',
                                width: 120,
                                align: 'center',
                                type: 'date',
                                render: (record) => {
                                    // const today = dayjs()
                                    // const scoreDeadline = dayjs(record?.scoreDeadline)
                                    // const examScoreDeadline = dayjs(record?.examScoreDeadline)

                                    // if (!scoreDeadline && !examScoreDeadline) {
                                    //     return '-'
                                    // }

                                    // let daysRemaining: number
                                    // let deadlineType: string

                                    // if (today?.isBefore(scoreDeadline)) {
                                    //     daysRemaining = scoreDeadline?.diff(today, 'day')
                                    //     deadlineType = 'ĐQT'
                                    // }
                                    // else if (today?.isBefore(examScoreDeadline)) {
                                    //     daysRemaining = examScoreDeadline?.diff(today, 'day')
                                    //     deadlineType = 'ĐT'
                                    // } else {
                                    //     return ''
                                    // }

                                    return (
                                        <div
                                            className={`${dayjs().isBefore(record?.examScoreDeadline) ? '' : 'text-red-500'}`}
                                        >
                                            {record.examScoreDeadline
                                                ? dayjs(record.examScoreDeadline).format(
                                                      'DD/MM/YYYY'
                                                  )
                                                : ''}
                                            {/* <Tooltip
                                            title={`Còn ${daysRemaining} ngày trước hạn ${deadlineType}`}
                                        >
                                            <span
                                                style={{
                                                    color:
                                                        daysRemaining <= 3
                                                            ? 'red'
                                                            : daysRemaining <= 7
                                                              ? 'orange'
                                                              : 'green',
                                                    fontWeight: 'bold',
                                                    marginLeft: '5px',
                                                }}
                                            >
                                                - {daysRemaining}
                                            </span>
                                        </Tooltip> */}
                                        </div>
                                    )
                                },
                            },

                            {
                                title: 'Giảng viên',
                                width: 150,
                                align: 'center',
                                type: 'input',
                                dataIndex: 'mainLecturer',
                                render: (text, record: any) => {
                                    const mainLecturer = record.mainLecturer
                                        ? `${record.mainLecturer.userProfile.lastName} ${record.mainLecturer.userProfile.firstName}`
                                        : ''
                                    const extraLecturer = record.extraLecturer
                                        ? `${record.extraLecturer.userProfile.lastName} ${record.extraLecturer.userProfile.firstName}`
                                        : ''
                                    return (
                                        <ul>
                                            {mainLecturer && <li>- {mainLecturer}</li>}
                                            {extraLecturer && <li>- {extraLecturer}</li>}
                                        </ul>
                                    )
                                },
                            },
                            {
                                title: 'Giảng viên NĐ',
                                width: 150,
                                align: 'center',
                                type: 'input',
                                dataIndex: 'enterGradeLecturer',
                                render: (text, record: any) => {
                                    const enterGradeLecturer = record.enterGradeLecturer
                                        ? `${record.enterGradeLecturer.userProfile.lastName} ${record.enterGradeLecturer.userProfile.firstName}`
                                        : ''
                                    return <span>{enterGradeLecturer}</span>
                                },
                            },

                            {
                                title: 'Đơn vị phụ trách',
                                dataIndex: 'danhSachLop',
                                width: 130,
                                align: 'center',
                                render: (text, record: any) => {
                                    return (
                                        <span>
                                            {record.subject?.managementOrganization?.sMa || ''}
                                        </span>
                                    )
                                },
                            },
                            // {
                            //     title: 'Trạng thái',
                            //     dataIndex: 'trangThai',
                            //     width: 150,
                            //     align: 'center',
                            //     render: (text, record) => {
                            //         if (record.active === true || record.active === 'active') {
                            //             return <Tag color="green">Đang hoạt động</Tag>
                            //         }
                            //         if (record.active === false || record.active === 'inactive') {
                            //             return <Tag color="red">Kết thúc</Tag>
                            //         }
                            //         return ''
                            //     },
                            // },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                hidden: !canSome(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DS_LOP_MON_HOC,
                                    'NHAP_DIEM'
                                ),
                                render: (_, { id, subject }) => {
                                    if (id) {
                                        return (
                                            <Row className="flex justify-center items-center gap-2 text-[#028850]">
                                                {(profileId === listUser.lecturer ||
                                                    !!subject?.oneType) && (
                                                    <Tooltip
                                                        title="Nhập điểm TX/CC"
                                                        placement="top"
                                                    >
                                                        <CalendarPlus
                                                            size={16}
                                                            onClick={() => handleNavigate(id)}
                                                            strokeWidth={2}
                                                        />
                                                    </Tooltip>
                                                )}

                                                <Tooltip title="Nhập điểm thi" placement="top">
                                                    <CalendarPlus
                                                        size={16}
                                                        onClick={() => handleNavigateThi(id)}
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
