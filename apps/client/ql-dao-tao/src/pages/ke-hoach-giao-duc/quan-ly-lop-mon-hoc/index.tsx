import DatePicker from '@components/commons/date-picker'
import TreeSelectDepartment from '@components/commons/department-select/TreeSelectDepartment'
import FormItem from '@components/commons/form-item'
import LectureTreeSelect from '@components/commons/lecture-select-multi/TreeSelectLecture'
import Select from '@components/commons/select'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE, SUBJECT_CLASS_SCHEDULE_TYPE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import { useExamTypeOptions } from '@hooks/examType'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { buildOrgTree } from '@lib/utils'
import { emptyObjectIf } from '@workspace/constant'
import type { $Enums, Prisma, SubjectClassSchedule } from '@workspace/db/client'
import {
    useCountSubjectClass,
    useDeleteSubjectClass,
    useFindManyDM_DonVi,
    useFindManySubjectClass,
    useFindManyTrainingCourse,
    useUpdateManySubjectClass,
} from '@workspace/db/hooks'
import { sqlTransaction } from '@workspace/libs/api/model'
import { useAbility, useOrgPermissions } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION } from '@workspace/router'
import { dayjs, useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
import { cn } from '@workspace/ui/lib/utils'
import { Button, Checkbox, Col, Flex, Form, message, Popconfirm, Popover, Row, Switch } from 'antd'
import type { Dayjs } from 'dayjs'
import _ from 'lodash'
import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

type DataSubmit = Prisma.SubjectClassGetPayload<{
    include: {
        semester: true
        mainLecturer: {
            include: {
                userProfile: true
            }
        }
        subject: {
            include: {
                managementOrganization: true
            }
        }
        extraLecturer: {
            include: {
                userProfile: true
            }
        }
        enterGradeLecturer: {
            include: {
                userProfile: true
            }
        }
        room: {
            include: {
                building: {
                    include: {
                        trainingLocation: true
                    }
                }
            }
        }
        subjectClassStudent: true
        subjectClassTimes: true
    }
}> & { rowSpan?: number }

type TeachingAssignmentForm = {
    subjectClass: Record<
        string,
        {
            lecturerId: string | null
            extraLecturerId: string | null
            enterGradeLecturerId: string | null
            lecturerAssignmentDeadline: Dayjs | null
            examType: $Enums.ExamType | null
            roomId: string | null
        }
    >
}

type BaoDayForm = {
    deadline: string
    isOverride: boolean
}

export default function TeachingAssignment() {
    const { can, canSome } = useAbility()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        code: '',
        name: '',
        trainingCourseId: null,
        trainingMajorId: null,
        lecturerId: undefined,
        credit: undefined,
        maxStudent: undefined,
        subjectClassStudent: undefined,
        mainLecturer: undefined,
        extraLecturer: undefined,
        enterGradeLecturer: undefined,
        examType: undefined,
        organization: undefined,
        room: undefined,
        pcgd: undefined,
    })

    const [form] = Form.useForm<TeachingAssignmentForm>()
    const [formBaoDay] = Form.useForm<BaoDayForm>()

    const { id: semesterId } = useSemesterStore()
    const [isEdit, setIsEdit] = useState(false)
    const { options, getExamTypeLabel } = useExamTypeOptions()
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const canXemTatCa = can(
        QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_GIAO_DUC_QUAN_LY_LOP_MON_HOC,
        'XEM_TAT_CA'
    )

    const canSua = can(
        QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_GIAO_DUC_QUAN_LY_LOP_MON_HOC,
        'SUA'
    )

    const isBoMon = canXemTatCa && canSua
    // const isBoMon = !canXemTatCa && canSua

    const where = useMemo(
        () =>
            ({
                ...(filters.name
                    ? {
                          name: { contains: filters.name, mode: 'insensitive' as const },
                      }
                    : {}),
                ...(filters.code
                    ? {
                          code: { contains: filters.code, mode: 'insensitive' as const },
                      }
                    : {}),

                ...(filters.examType
                    ? {
                          examType: {
                              in: filters.examType,
                          },
                      }
                    : {}),
                ...(filters.schedule
                    ? {
                          schedule: {
                              in: filters.schedule,
                          },
                      }
                    : {}),
                ...(semesterId
                    ? {
                          semester: {
                              id: semesterId,
                          },
                      }
                    : {}),
                ...(filters.trainingCourseId
                    ? {
                          subjectClassStudent: {
                              some: {
                                  student: {
                                      fixedClass: {
                                          trainingCourseId: filters.trainingCourseId,
                                      },
                                  },
                              },
                          },
                      }
                    : {}),
                ...(filters.trainingMajorId
                    ? {
                          subject: {
                              managementOrganization: {
                                  trainingMajors: {
                                      some: {
                                          id: filters.trainingMajorId,
                                      },
                                  },
                              },
                          },
                      }
                    : {}),
                ...(filters.organization && filters.organization.length > 0
                    ? {
                          subject: {
                              managementOrganizationId: {
                                  in: filters.organization,
                              },
                          },
                      }
                    : {}),
                ...(filters.lecturerId?.length === 1
                    ? {
                          ...(filters.lecturerId[0]
                              ? { lecturerId: { not: null } }
                              : { lecturerId: null }),
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
                ...(filters.extraLecturer
                    ? {
                          extraLecturer: {
                              userProfile: {
                                  OR: [
                                      {
                                          firstName: {
                                              contains: filters.extraLecturer,
                                              mode: 'insensitive' as const,
                                          },
                                      },
                                      {
                                          lastName: {
                                              contains: filters.extraLecturer,
                                              mode: 'insensitive' as const,
                                          },
                                      },
                                  ],
                              },
                          },
                      }
                    : {}),
                ...(filters.room
                    ? {
                          room: {
                              building: {
                                  trainingLocation: {
                                      name: {
                                          contains: filters.room,
                                          mode: 'insensitive' as const,
                                      },
                                  },
                              },
                          },
                      }
                    : {}),
                ...(filters.pcgd
                    ? {
                          lecturerId: { not: null },
                          extraLecturerId: { not: null },
                          submitLecturerAssignmentAt: { not: null },
                      }
                    : {}),
                deletedAt: null,
                active: true,
                trainingObjectTypeId,
                ...(!isBoMon
                    ? {
                          lecturerAssignmentDeadline: {
                              not: null,
                          },
                      }
                    : {}),
            }) satisfies Prisma.SubjectClassWhereInput,
        [filters, semesterId, trainingObjectTypeId, isBoMon]
    )

    const { data = [], refetch } = useFindManySubjectClass(
        {
            where: {
                ...where,
            },
            include: {
                semester: true,
                mainLecturer: {
                    include: {
                        userProfile: true,
                    },
                },
                subject: {
                    include: {
                        managementOrganization: true,
                    },
                },
                extraLecturer: {
                    include: {
                        userProfile: true,
                    },
                },
                enterGradeLecturer: {
                    include: {
                        userProfile: true,
                    },
                },
                room: {
                    include: {
                        building: {
                            include: {
                                trainingLocation: true,
                            },
                        },
                    },
                },
                subjectClassStudent: true,
                subjectClassTimes: true,
            },
            orderBy: [
                ...emptyObjectIf(
                    [
                        {
                            subject: {
                                credit: filters.credit,
                            },
                        },
                    ],
                    !!filters.credit
                ),
                ...emptyObjectIf(
                    [
                        {
                            maxStudent: filters.maxStudent,
                        },
                    ],
                    !!filters.maxStudent
                ),
                ...emptyObjectIf(
                    [
                        {
                            subjectClassStudent: {
                                _count: filters.subjectClassStudent,
                            },
                        },
                    ],
                    !!filters.subjectClassStudent
                ),
                {
                    code: 'asc',
                },
            ],
            take: numberOfPages,
            skip: (currentPage - 1) * numberOfPages,
        },
        {
            enabled: !!semesterId && !!trainingObjectTypeId,
            refetchOnWindowFocus: false,
        }
    )

    const { data: count } = useCountSubjectClass({
        where: {
            ...where,
        },
    })

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )

    const { showSpinner, hideSpinner } = useSpinner()

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }

    const { mutateAsync: updateManySubjectClass } = useUpdateManySubjectClass()

    const guiBaoDay = async (values: BaoDayForm) => {
        try {
            setIsEdit(false)
            showSpinner()
            await updateManySubjectClass({
                data: {
                    lecturerAssignmentDeadline: dayjs(values.deadline).endOf('day').toDate(),
                },
                where: {
                    trainingObjectTypeId,
                    semesterId,
                    ...(values.isOverride
                        ? {}
                        : {
                              lecturerAssignmentDeadline: null,
                          }),
                },
            })
            message.success('Báo dạy thành công')
            debouncedRefetch()
            formBaoDay.resetFields()
        } catch (error: any) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const orgId = useOrgPermissions()

    const { data: manageOrgData = [] } = useFindManyDM_DonVi()
    const treeData = buildOrgTree(manageOrgData, canXemTatCa ? '0' : orgId)

    const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
        orderBy: { name: 'asc' },
        where: { trainingObjectTypeId, deletedAt: null, active: true },
    })

    async function handleSaveData(values: TeachingAssignmentForm) {
        try {
            setIsEdit(false)
            showSpinner()
            const res = await sqlTransaction(
                Object.entries(values.subjectClass).map(([id, subjectClass]) => ({
                    model: 'SubjectClass',
                    operation: 'update',
                    data: {
                        where: { id },
                        data: {
                            lecturerId: subjectClass.lecturerId,
                            extraLecturerId: subjectClass.extraLecturerId,
                            enterGradeLecturerId: subjectClass.enterGradeLecturerId,
                            lecturerAssignmentDeadline: subjectClass.lecturerAssignmentDeadline
                                ? subjectClass.lecturerAssignmentDeadline?.toDate()
                                : null,
                        },
                    },
                }))
            )
            if (res.status !== 200) {
                throw new Error('Lỗi khi phân công giảng dạy')
            }
            debouncedRefetch()
            message.success('Phân công giảng dạy thành công')
        } catch (error: any) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    async function handleGuiPCGD() {
        try {
            setIsEdit(false)
            showSpinner()
            await updateManySubjectClass({
                data: {
                    submitLecturerAssignmentAt: new Date(),
                    lecturerAssignmentDeadline: new Date(),
                },
                where: {
                    trainingObjectTypeId,
                    semesterId,
                    lecturerId: { not: null },
                    extraLecturerId: { not: null },
                    lecturerAssignmentDeadline: { not: null },
                    submitLecturerAssignmentAt: null,
                },
            })
            message.success('Gửi PCGD thành công')
            debouncedRefetch()
            formBaoDay.resetFields()
        } catch (error: any) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { mutateAsync: deleteSubjectClass } = useDeleteSubjectClass()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await deleteSubjectClass({
                where: {
                    id,
                },
            })
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { onOpen: onOpenModalNhapTKB } = useDisclosure<string>({
        tag: 'ModalNhapTKB',
    })

    const { onOpen } = useDisclosure<string>({
        tag: 'PutOpenSubjectClassModal',
    })

    const { onOpen: onOpenEditSubjectClass } = useDisclosure<string>({
        tag: 'PutOneSubjectClassModal',
    })

    const dataWithRowSpan = useMemo(() => {
        if (data) {
            const countSubjectClassBySubjectId: Record<string, number> = {}
            data.forEach((subjectClass) => {
                countSubjectClassBySubjectId[subjectClass.subjectId] =
                    (countSubjectClassBySubjectId[subjectClass.subjectId] || 0) + 1
            })
            return data.map((subjectClass) => {
                const cloneCount = countSubjectClassBySubjectId[subjectClass.subjectId]
                countSubjectClassBySubjectId[subjectClass.subjectId] = 0
                return {
                    ...subjectClass,
                    rowSpan: cloneCount,
                }
            })
        }
        return []
    }, [data])

    const handleModal = () => {
        onOpen()
    }

    const handleCancel = () => {
        setIsEdit(false)
        resetForm()
    }

    const resetForm = useCallback(() => {
        form.setFieldsValue({
            subjectClass: dataWithRowSpan.reduce(
                (acc, curr) => {
                    acc[curr.id] = {
                        lecturerId: curr.lecturerId,
                        extraLecturerId: curr.extraLecturerId,
                        enterGradeLecturerId: curr.enterGradeLecturerId,
                        lecturerAssignmentDeadline: curr.lecturerAssignmentDeadline
                            ? dayjs(curr.lecturerAssignmentDeadline)
                            : null,
                        examType: curr.examType,
                        roomId: curr.roomId,
                    }
                    return acc
                },
                {} as TeachingAssignmentForm['subjectClass']
            ),
        })
    }, [dataWithRowSpan, form])

    useEffect(() => {
        if (resetForm) {
            resetForm()
        }
    }, [resetForm])

    return (
        <div>
            <Row gutter={[8, 8]}>
                <Col span={24}>
                    <Flex justify="end" gap={4}>
                        {can(
                            QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_GIAO_DUC_QUAN_LY_LOP_MON_HOC,
                            'THEM'
                        ) && (
                            <Button
                                onClick={() => handleModal()}
                                //TODO: handle save
                                type="primary"
                            >
                                Thêm mới lớp MH
                            </Button>
                        )}
                        {can(
                            QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_GIAO_DUC_QUAN_LY_LOP_MON_HOC,
                            'XEM_TAT_CA'
                        ) && (
                            <Popover
                                content={
                                    <Form
                                        form={formBaoDay}
                                        initialValues={{ isOverride: false }}
                                        onFinish={guiBaoDay}
                                    >
                                        <FormItem
                                            form={formBaoDay}
                                            name={'deadline'}
                                            label="Hạn PCGD"
                                        >
                                            <DatePicker />
                                        </FormItem>
                                        <FormItem
                                            form={formBaoDay}
                                            name={'isOverride'}
                                            label="Ghi đè PCGD"
                                            className="mt-2"
                                        >
                                            <Switch />
                                        </FormItem>
                                        <Col span={24} className="text-right mt-4">
                                            <Button type="primary" htmlType="submit">
                                                Gửi báo dạy
                                            </Button>
                                        </Col>
                                    </Form>
                                }
                                title="Báo dạy cho Khoa/Viện/Bộ môn"
                                trigger="click"
                                placement="bottomRight"
                            >
                                <Button type="primary">1.Báo dạy</Button>
                            </Popover>
                        )}
                        {isEdit ? (
                            <>
                                <Button
                                    onClick={() => form.submit()}
                                    type="primary"
                                    disabled={!data.length}
                                >
                                    Lưu
                                </Button>
                                <Button
                                    onClick={() => handleCancel()}
                                    type="primary"
                                    disabled={!data.length}
                                >
                                    Hủy
                                </Button>
                            </>
                        ) : (
                            can(
                                QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_GIAO_DUC_QUAN_LY_LOP_MON_HOC,
                                'SUA'
                            ) && (
                                <Button
                                    onClick={() => setIsEdit(true)}
                                    //TODO: handle save
                                    type="primary"
                                    disabled={!data.length}
                                >
                                    2.PCGD
                                </Button>
                            )
                        )}
                        {can(
                            QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_GIAO_DUC_QUAN_LY_LOP_MON_HOC,
                            'SUA'
                        ) && (
                            // TODO: Bỏ check quyền xem tất cả khi hoàn thành xong
                            // !can(
                            //     QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_GIAO_DUC_QUAN_LY_LOP_MON_HOC,
                            //     'XEM_TAT_CA'
                            // ) &&
                            <Popconfirm
                                title="Xác nhận gửi phân công giảng dạy?"
                                placement="topRight"
                                description="Các lớp môn học đã gửi phân công giảng dạy sẽ không thể chỉnh sửa, vui lòng kiểm tra kỹ trước khi gửi."
                                onConfirm={handleGuiPCGD}
                            >
                                <Button
                                    //TODO: handle save
                                    type="primary"
                                    disabled={!data.length}
                                >
                                    3.Gửi PCGD
                                </Button>
                            </Popconfirm>
                        )}
                        {can(
                            QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_GIAO_DUC_QUAN_LY_LOP_MON_HOC,
                            'XEM_TAT_CA'
                        ) && <Button type="primary">4.Xuất báo dạy</Button>}
                        {can(
                            QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_GIAO_DUC_QUAN_LY_LOP_MON_HOC,
                            'NHAP_EXCEL'
                        ) && (
                            <Button
                                type="primary"
                                onClick={() => onOpenModalNhapTKB(semesterId || '')}
                            >
                                <EditIcon stroke="white" />
                                5.Nhập từ TKB
                            </Button>
                        )}
                    </Flex>
                </Col>
                <Col span={4}>
                    <Select
                        placeholder="Chọn khoá"
                        options={trainingCourseData.map((i) => {
                            return {
                                value: i.id,
                                label: i.name,
                            }
                        })}
                        style={{ width: '100%' }}
                        onChange={(val) => handleFilterChange('trainingCourseId', val)}
                        allowClear
                    />
                </Col>
                <Col span={7}>
                    <TreeSelectDepartment
                        className="w-full"
                        rootId={canXemTatCa ? '0' : orgId}
                        onChange={(val) => handleFilterChange('organization', val)}
                    />
                </Col>
                <Col span={24}>
                    <Form form={form} onFinish={handleSaveData}>
                        {canXemTatCa && (
                            <p className="mt-1">
                                Khoa/Viện/Bộ môn chỉ có thể nhìn thấy lớp môn học có hạn phân công
                                giảng dạy.
                            </p>
                        )}
                        <Table
                            rowKey="id"
                            id="training-category"
                            filters={filters}
                            setFilters={(value) => {
                                setFilters(value)
                                setCurrentPage(1)
                            }}
                            columns={[
                                {
                                    title: 'TT',
                                    width: 35,
                                    align: 'center',
                                    render: (_, __, index) =>
                                        index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                                },
                                {
                                    title: 'PCGD',
                                    align: 'center',
                                    width: 80,
                                    type: 'select',
                                    dataIndex: 'pcgd',
                                    options: [
                                        { value: true, label: 'Đã phân công giảng dạy' },
                                        { value: false, label: 'Chưa phân công giảng dạy' },
                                    ],
                                    render: (_, record) => (
                                        <Checkbox
                                            checked={
                                                record.lecturerId &&
                                                record.extraLecturerId &&
                                                record.submitLecturerAssignmentAt
                                            }
                                        />
                                    ),
                                },
                                {
                                    title: 'Hạn PCGD',
                                    dataIndex: 'lecturerAssignmentDeadline',
                                    width: 100,
                                    align: 'center',
                                    render: (_, record) =>
                                        canXemTatCa && isEdit ? (
                                            <FormItem
                                                form={form}
                                                name={[
                                                    'subjectClass',
                                                    record.id,
                                                    'lecturerAssignmentDeadline',
                                                ]}
                                            >
                                                <DatePicker
                                                    suffixIcon={null}
                                                    className="px-1"
                                                    placeholder="Chọn ngày"
                                                />
                                            </FormItem>
                                        ) : record.lecturerAssignmentDeadline ? (
                                            <p
                                                className={cn(
                                                    dayjs(
                                                        record.lecturerAssignmentDeadline
                                                    ).isBefore(dayjs().startOf('day')) && 'text-red-600'
                                                )}
                                            >
                                                {dayjs(record.lecturerAssignmentDeadline).format(
                                                    'DD/MM/YYYY'
                                                )}
                                            </p>
                                        ) : (
                                            ''
                                        ),
                                },
                                {
                                    title: 'Mã LMH',
                                    dataIndex: 'code',
                                    width: 120,
                                    align: 'center',
                                    type: 'input',
                                },
                                {
                                    title: 'Tên môn học',
                                    dataIndex: 'name',
                                    width: 200,
                                    align: 'center',
                                    type: 'input',
                                    onCell: (record) => ({
                                        rowSpan: record.rowSpan,
                                    }),
                                },
                                {
                                    title: 'STC',
                                    dataIndex: 'credit',
                                    width: 70,
                                    align: 'center',
                                    type: 'order',
                                    distinctFilters: ['maxStudent', 'subjectClassStudent'],
                                    render: (_, record) =>
                                        record.subject?.credit ? record.subject?.credit : '',
                                },
                                {
                                    title: 'Kíp học',
                                    dataIndex: 'schedule',
                                    align: 'center',
                                    width: 100,
                                    type: 'select',
                                    options: Object.entries(SUBJECT_CLASS_SCHEDULE_TYPE).map(
                                        ([key, value_]) => {
                                            return {
                                                label: value_,
                                                value: key,
                                            }
                                        }
                                    ),
                                    render: (value: SubjectClassSchedule) =>
                                        SUBJECT_CLASS_SCHEDULE_TYPE[
                                            value as keyof typeof SUBJECT_CLASS_SCHEDULE_TYPE
                                        ],
                                },
                                {
                                    title: 'Số SV',
                                    dataIndex: 'subjectClassStudent',
                                    width: 80,
                                    align: 'center',
                                    type: 'order',
                                    distinctFilters: ['maxStudent', 'credit'],
                                    render: (_, record) =>
                                        (record.subjectClassStudent
                                            ? record.subjectClassStudent.length
                                            : record.maxStudent) ?? 0,
                                },

                                {
                                    title: 'Giảng viên 1',
                                    width: 200,
                                    align: 'center',
                                    type: 'input',
                                    dataIndex: 'mainLecturer',
                                    render: (__, record) =>
                                        isEdit ? (
                                            <FormItem
                                                form={form}
                                                name={['subjectClass', record.id, 'lecturerId']}
                                            >
                                                <LectureTreeSelect
                                                    placeholder="Chọn giảng viên"
                                                    ignoreLectureIds={
                                                        record?.extraLecturerId
                                                            ? [record?.extraLecturerId]
                                                            : []
                                                    }
                                                    organizationId={
                                                        record?.subject?.managementOrganizationId
                                                    }
                                                />
                                            </FormItem>
                                        ) : (
                                            (record?.mainLecturer?.userProfile?.fullname ?? '-')
                                        ),
                                },
                                {
                                    title: 'Giảng viên 2',
                                    width: 200,
                                    align: 'center',
                                    type: 'input',
                                    dataIndex: 'extraLecturer',
                                    render: (__, record) =>
                                        isEdit ? (
                                            <FormItem
                                                form={form}
                                                name={[
                                                    'subjectClass',
                                                    record.id,
                                                    'extraLecturerId',
                                                ]}
                                            >
                                                <LectureTreeSelect
                                                    placeholder="Chọn giảng viên"
                                                    ignoreLectureIds={
                                                        record?.lecturerId
                                                            ? [record?.lecturerId]
                                                            : []
                                                    }
                                                    organizationId={
                                                        record?.subject?.managementOrganizationId
                                                    }
                                                />
                                            </FormItem>
                                        ) : (
                                            (record?.extraLecturer?.userProfile?.fullname ?? '-')
                                        ),
                                },
                                {
                                    title: 'Hình thức thi',
                                    dataIndex: 'examType',
                                    align: 'center',
                                    width: 160,
                                    type: 'select',
                                    options: options,
                                    render: (__, record) =>
                                        isEdit ? (
                                            <FormItem
                                                form={form}
                                                name={['subjectClass', record.id, 'examType']}
                                            >
                                                <Select options={options} disabled={!isEdit} />
                                            </FormItem>
                                        ) : record.examType ? (
                                            getExamTypeLabel(record.examType)
                                        ) : (
                                            '-'
                                        ),
                                },

                                {
                                    title: 'Khu vực',
                                    dataIndex: 'room',
                                    align: 'center',
                                    width: 150,
                                    type: 'input',
                                    render: (value) =>
                                        value?.building?.trainingLocation?.name
                                            ? value?.building?.trainingLocation?.name
                                            : '',
                                },
                                {
                                    title: 'Phòng học',
                                    dataIndex: 'room',
                                    align: 'center',
                                    width: 120,
                                    render: (value) => value?.name || '',
                                },
                                {
                                    title: 'Giảng viên nhập điểm',
                                    width: 200,
                                    align: 'center',
                                    render: (__, record) =>
                                        isEdit ? (
                                            <FormItem
                                                form={form}
                                                name={[
                                                    'subjectClass',
                                                    record.id,
                                                    'enterGradeLecturerId',
                                                ]}
                                            >
                                                <LectureTreeSelect
                                                    placeholder="Chọn giảng viên"
                                                    organizationId={
                                                        record?.subject?.managementOrganizationId
                                                    }
                                                />
                                            </FormItem>
                                        ) : (
                                            (record?.enterGradeLecturer?.userProfile?.fullname ??
                                            '-')
                                        ),
                                },

                                // {
                                //     title: 'Ngày thi',
                                //     dataIndex: 'examDate',
                                //     align: 'center',
                                //     width: 100,
                                //     render: (value) => (value ? formatDate(value) : ''),
                                // },

                                // {
                                //     title: 'Hạn nhập điểm CC/TX',
                                //     dataIndex: 'scoreDeadline',
                                //     width: 200,
                                //     align: 'center',
                                //     render: (value) => (value ? formatDate(value) : ''),
                                // },
                                // {
                                //     title: 'Hạn nhập điểm thi',
                                //     dataIndex: 'examScoreDeadline',
                                //     width: 170,
                                //     align: 'center',
                                //     render: (value) => (value ? formatDate(value) : ''),
                                // },

                                // {
                                //     title: 'Thời khoá biểu',
                                //     width: 150,
                                //     align: 'center',
                                //     dataIndex: 'subjectClassTimes',
                                //     render: (subjectClassTimes: SubjectClassTime[]) => {
                                //         return subjectClassTimes?.map?.((tkb: SubjectClassTime) => {
                                //             return (
                                //                 <p>
                                //                     {tkb.dayOfWeek === 8 ? 'CN' : `T${tkb.dayOfWeek}`} -{' '}
                                //                     {tkb.startPeriod} - {tkb.endPeriod}
                                //                 </p>
                                //             )
                                //         })
                                //     },
                                // },
                                // {
                                //     title: 'Số SV tối đa',
                                //     dataIndex: 'maxStudent',
                                //     width: 150,
                                //     align: 'center',
                                //     type: 'order',
                                //     distinctFilters: ['credit', 'subjectClassStudent'],
                                // },
                                {
                                    title: 'ĐV phụ trách',
                                    dataIndex: 'subject',
                                    width: 150,
                                    align: 'center',
                                    type: 'tree_select',
                                    options: treeData,
                                    render: (value) => value?.managementOrganization?.sMa || '',
                                },
                                // {
                                //     title: 'Điểm bằng nhau',
                                //     dataIndex: 'subject',
                                //     width: 150,
                                //     align: 'center',
                                //     render: (value) => (
                                //         <Checkbox checked={value.subjectEquivalentType} disabled />
                                //     ),
                                // },
                                {
                                    title: 'Thao tác',
                                    width: 100,
                                    align: 'center',
                                    fixed: 'right',
                                    hidden: !canSome(
                                        QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_GIAO_DUC_QUAN_LY_LOP_MON_HOC,
                                        'SUA',
                                        'XOA'
                                    ),
                                    render: (record, { id }) => {
                                        if (id) {
                                            return (
                                                <Row className="justify-center gap-2">
                                                    {can(
                                                        QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_GIAO_DUC_QUAN_LY_LOP_MON_HOC,
                                                        'SUA'
                                                    ) && (
                                                        <EditIcon
                                                            onClick={onOpenEditSubjectClass.bind(
                                                                null,
                                                                id
                                                            )}
                                                            className="text-sm text-blue-700 cursor-pointer"
                                                        />
                                                    )}
                                                    {can(
                                                        QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_GIAO_DUC_QUAN_LY_LOP_MON_HOC,
                                                        'XOA'
                                                    ) && (
                                                        <DeleteIcon
                                                            popConfirm={{
                                                                onConfirm: () => handleDelete(id),
                                                            }}
                                                            disabled={
                                                                record?.subjectClassStudent
                                                                    ?.length > 0
                                                            }
                                                        />
                                                    )}
                                                </Row>
                                            )
                                        }
                                        return ''
                                    },
                                },
                            ]}
                            data={dataWithRowSpan}
                            pagination={{
                                current: currentPage,
                                pageSize: numberOfPages,
                                total: count,

                                onChange: (page, pageSize) => {
                                    console.log(page, pageSize)

                                    if (numberOfPages === pageSize) {
                                        setCurrentPage(page)
                                    } else {
                                        setCurrentPage(1)
                                        setNumberOfPages(pageSize)
                                    }
                                },
                            }}
                        />
                    </Form>
                </Col>
            </Row>
        </div>
    )
}

TeachingAssignment.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
