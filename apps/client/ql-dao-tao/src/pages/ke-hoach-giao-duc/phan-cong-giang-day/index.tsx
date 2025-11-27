import { queryClient } from '@api/index'
import DatePicker from '@components/commons/date-picker'
import TreeSelectDepartment from '@components/commons/department-select/TreeSelectDepartment'
import FormItem from '@components/commons/form-item'
import LectureTreeSelect from '@components/commons/lecture-select-multi/TreeSelectLecture'
import Select from '@components/commons/select'
import TableCollapse from '@components/commons/tableCollapse'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE, SUBJECT_CLASS_SCHEDULE_TYPE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import { useExamTypeOptions } from '@hooks/examType'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { buildOrgTree } from '@lib/utils'
import { emptyObjectIf, getMinioUrl } from '@workspace/constant'
import {
    $Enums,
    type Prisma,
    type SubjectClass,
    type SubjectClassSchedule,
} from '@workspace/db/client'
import {
    useCountDM_DonVi,
    useCountSubjectClass,
    useDeleteSubjectClass,
    useFindManyBuilding,
    useFindManyDM_DonVi,
    useFindManyTrainingLocation,
    useUpdateManySubjectClass,
} from '@workspace/db/hooks'
import { sqlTransaction } from '@workspace/libs/api/model'
import { exportFromTemplate } from '@workspace/libs/template-excel'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION } from '@workspace/router'
import { dayjs, useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
import { cn } from '@workspace/ui/lib/utils'
import {
    Affix,
    Button,
    Checkbox,
    Col,
    Divider,
    Flex,
    Form,
    message,
    Popover,
    Row,
    Switch,
    TreeSelect,
} from 'antd'
import type { Dayjs } from 'dayjs'
import _ from 'lodash'
import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

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
            trainingLocationId: string | null
            submitLecturerAssignmentAt?: boolean | null
            approveLecturerAssignmentAt?: boolean | null
            isEdit?: boolean
            cancelled: boolean
        }
    >
}

type BaoDayForm = {
    deadline: string
    isOverride: boolean
}

type XepKhuVucForm = {
    trainingLocationId: string
    isOverride: boolean
}

export default function PhanCongGiangDay({
    hocLai = false,
    khoaBoMon = false,
}: {
    hocLai?: boolean
    khoaBoMon?: boolean
}) {
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
        approved: undefined,
    })

    const [form] = Form.useForm<TeachingAssignmentForm>()

    const subjectClassForm = Form.useWatch('subjectClass', form) || {}

    const [formBaoDay] = Form.useForm<BaoDayForm>()
    const [formXepKhuVuc] = Form.useForm<XepKhuVucForm>()

    const { id: semesterId } = useSemesterStore()
    const { options, getExamTypeLabel } = useExamTypeOptions()
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const canXemTatCa = can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_GIAO_DUC, 'XEM_TAT_CA')

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
                ...(filters.pcgd && filters.pcgd.length === 1 && filters.pcgd[0]
                    ? {
                          lecturerId: { not: null },
                          extraLecturerId: { not: null },
                          submitLecturerAssignmentAt: { not: null },
                      }
                    : {}),
                ...(filters.pcgd && filters.pcgd.length === 1 && !filters.pcgd[0]
                    ? {
                          OR: [
                              {
                                  lecturerId: null,
                              },
                              {
                                  extraLecturerId: null,
                              },
                              {
                                  submitLecturerAssignmentAt: null,
                              },
                          ],
                      }
                    : {}),
                ...(filters.approved && filters.approved.length === 1 && filters.approved[0]
                    ? {
                          approveLecturerAssignmentAt: { not: null },
                      }
                    : {}),
                ...(filters.approved && filters.approved.length === 1 && !filters.approved[0]
                    ? {
                          approveLecturerAssignmentAt: null,
                      }
                    : {}),
                subject: {
                    ...(filters.organization && filters.organization.length > 0
                        ? {
                              managementOrganizationId: {
                                  in: filters.organization,
                              },
                          }
                        : {}),
                    planTrainingSubject: {
                        some: {
                            planTraining: {
                                semesterId,
                                trainingObjectTypeId,
                            },
                        },
                    },
                },
                deletedAt: null,
                active: true,
                trainingObjectTypeId,
                ...(khoaBoMon
                    ? {
                          lecturerAssignmentDeadline: {
                              not: null,
                          },
                      }
                    : {}),
                type: hocLai ? $Enums.SubjectClassType.RETAKE : $Enums.SubjectClassType.NORMAL,
            }) satisfies Prisma.SubjectClassWhereInput,
        [filters, semesterId, trainingObjectTypeId, khoaBoMon, hocLai]
    )
    const orgId = window.contextData?.organizationId

    const { data: dmDonViData = [], refetch } = useFindManyDM_DonVi(
        {
            include: {
                subjectVersions: {
                    select: {
                        subjectClass: {
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
                                room: true,
                                trainingLocation: true,
                                subjectClassStudent: true,
                                subjectClassTimes: true,
                                fixedClasses: {
                                    select: {
                                        code: true,
                                        _count: {
                                            select: {
                                                students: {
                                                    where: {
                                                        deletedAt: null,
                                                        active: true,
                                                        status: 'ENROLLED',
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
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
                        },
                    },
                },
            },
            take: numberOfPages,
            skip: (currentPage - 1) * numberOfPages,
            where: {
                bActive: true,
                subjectVersions: {
                    some: {
                        subjectClass: {
                            some: {
                                ...where,
                            },
                        },
                    },
                },
                Id: !khoaBoMon ? undefined : orgId,
                // sParentId: !khoaBoMon ? undefined : orgId,
            },
        },
        {
            enabled: !!semesterId && !!trainingObjectTypeId,
            refetchOnWindowFocus: false,
        }
    )

    const { data: countSubjectClassOfficial = 0 } = useCountSubjectClass({
        where: {
            status: 'OFFICIAL',
            trainingObjectTypeId,
            semesterId,
            active: true,
            deletedAt: null,
            cancelled: false,
            type: hocLai ? $Enums.SubjectClassType.RETAKE : $Enums.SubjectClassType.NORMAL,
        },
    })

    const { data: countSubjectClass = 0 } = useCountSubjectClass({
        where: {
            trainingObjectTypeId,
            semesterId,
            active: true,
            deletedAt: null,
            cancelled: false,
            type: hocLai ? $Enums.SubjectClassType.RETAKE : $Enums.SubjectClassType.NORMAL,
        },
    })

    const { data: count } = useCountDM_DonVi({
        where: {
            bActive: true,
            subjectVersions: {
                some: {
                    subjectClass: {
                        some: {
                            ...where,
                        },
                    },
                },
            },
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
            showSpinner()
            await updateManySubjectClass({
                data: {
                    lecturerAssignmentDeadline: dayjs(values.deadline).endOf('day').toDate(),
                    sendLecturerAssignmentAt: new Date(),
                },
                where: {
                    trainingObjectTypeId,
                    semesterId,
                    ...(values.isOverride
                        ? {}
                        : {
                              lecturerAssignmentDeadline: null,
                          }),
                    type: hocLai ? $Enums.SubjectClassType.RETAKE : $Enums.SubjectClassType.NORMAL,
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

    const { data: manageOrgData = [] } = useFindManyDM_DonVi()
    const treeData = buildOrgTree(manageOrgData, !khoaBoMon ? '0' : orgId)

    const { data: trainingLocationData = [] } = useFindManyTrainingLocation({
        orderBy: { name: 'asc' },
        where: { deletedAt: null, active: true },
    })

    const { data: buildingData = [] } = useFindManyBuilding({
        orderBy: { name: 'asc' },
        where: { deletedAt: null, active: true },
        include: {
            rooms: {
                where: {
                    deletedAt: null,
                    active: true,
                },
            },
        },
    })

    async function handleSaveData() {
        try {
            showSpinner()
            const res = await sqlTransaction(
                Object.entries(subjectClassForm)
                    .filter(([_, subjectClass]) => subjectClass.isEdit)
                    .map(([id, subjectClass]) => ({
                        model: 'SubjectClass',
                        operation: 'update',
                        data: {
                            where: { id },
                            data: {
                                lecturerAssignmentDeadline: subjectClass.lecturerAssignmentDeadline
                                    ? subjectClass.lecturerAssignmentDeadline?.toDate()
                                    : null,
                                examType: subjectClass.examType ?? null,
                                roomId: subjectClass.roomId ?? null,
                                trainingLocationId: subjectClass.trainingLocationId ?? null,
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

    async function handleSaveKhoaBoMon() {
        try {
            showSpinner()
            const res = await sqlTransaction(
                Object.entries(subjectClassForm)
                    .filter(([_, subjectClass]) => subjectClass.isEdit)
                    .map(([id, subjectClass]) => ({
                        model: 'SubjectClass',
                        operation: 'update',
                        data: {
                            where: { id },
                            data: {
                                examType: subjectClass.examType ?? null,
                                roomId: subjectClass.roomId ?? null,
                                lecturerId: subjectClass.lecturerId ?? null,
                                extraLecturerId: subjectClass.extraLecturerId ?? null,
                                enterGradeLecturerId: subjectClass.enterGradeLecturerId ?? null,
                            },
                        },
                    }))
            )
            if (res.status !== 200) {
                throw new Error('Lỗi khi lưu phân công giảng dạy')
            }
            debouncedRefetch()
            message.success('Lưu phân công giảng dạy thành công')
        } catch (error: any) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    async function handleGuiPCGD() {
        try {
            showSpinner()
            await updateManySubjectClass({
                data: {
                    submitLecturerAssignmentAt: new Date(),
                },
                where: {
                    trainingObjectTypeId,
                    semesterId,
                    lecturerId: { not: null },
                    extraLecturerId: { not: null },
                    lecturerAssignmentDeadline: { not: null },
                    submitLecturerAssignmentAt: null,
                    approveLecturerAssignmentAt: null,
                    type: hocLai ? $Enums.SubjectClassType.RETAKE : $Enums.SubjectClassType.NORMAL,
                },
            })
            message.success('Gửi PCGD thành công')
            form.resetFields()
            debouncedRefetch()
        } catch (error: any) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    async function handleTuChoiPCGD() {
        try {
            showSpinner()
            await updateManySubjectClass({
                data: {
                    submitLecturerAssignmentAt: null,
                },
                where: {
                    trainingObjectTypeId,
                    semesterId,
                    id: {
                        in: Object.entries(subjectClassForm)
                            .filter(([_, subjectClass]) => subjectClass.approveLecturerAssignmentAt)
                            .map(([id]) => id),
                    },
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

    async function handleDuyetPCGD() {
        try {
            showSpinner()
            await updateManySubjectClass({
                data: {
                    approveLecturerAssignmentAt: new Date(),
                },
                where: {
                    trainingObjectTypeId,
                    semesterId,
                    id: {
                        in: Object.entries(subjectClassForm)
                            .filter(([_, subjectClass]) => subjectClass.approveLecturerAssignmentAt)
                            .map(([id]) => id),
                    },
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

    const { onOpen: onOpenEditSubjectClass } = useDisclosure<string>({
        tag: 'PutOneSubjectClassModal',
    })

    const dataWithRowSpan = useMemo(() => {
        if (dmDonViData) {
            const countSubjectClassBySubjectId: Record<string, number> = {}
            dmDonViData.forEach((dmDonVi) => {
                dmDonVi.subjectVersions.forEach((sv) => {
                    sv.subjectClass.forEach((subjectClass) => {
                        countSubjectClassBySubjectId[subjectClass.subjectId] =
                            (countSubjectClassBySubjectId[subjectClass.subjectId] || 0) + 1
                    })
                })
            })

            const mapWithCount = dmDonViData.map((dmDonVi) => ({
                ...dmDonVi,
                id: dmDonVi.Id,
                children: dmDonVi.subjectVersions.flatMap((sv) =>
                    sv.subjectClass.map((subjectClass) => {
                        const cloneCount = countSubjectClassBySubjectId[subjectClass.subjectId]
                        countSubjectClassBySubjectId[subjectClass.subjectId] = 0
                        return {
                            ...subjectClass,
                            rowSpan: cloneCount,
                        }
                    })
                ),
            }))
            return mapWithCount
        }
        return []
    }, [dmDonViData])

    const resetForm = useCallback(() => {
        form.setFieldsValue({
            subjectClass: dataWithRowSpan
                .flatMap((e) => e.children)
                .reduce(
                    (acc, curr) => {
                        acc[curr.id] = {
                            lecturerId: curr.lecturerId ?? null,
                            extraLecturerId: curr.extraLecturerId ?? null,
                            enterGradeLecturerId: curr.enterGradeLecturerId ?? null,
                            lecturerAssignmentDeadline: curr.lecturerAssignmentDeadline
                                ? dayjs(curr.lecturerAssignmentDeadline)
                                : null,
                            examType: curr.examType,
                            roomId: curr.roomId,
                            trainingLocationId: curr.trainingLocationId ?? null,
                            isEdit: false,
                            cancelled: !!curr.cancelled,
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
                    <Affix offsetTop={105} style={{ zIndex: 1000 }}>
                        <Flex justify="space-between" gap={4} className="bg-white py-1">
                            <Col span={8}>
                                <TreeSelectDepartment
                                    className="w-full"
                                    rootId={!khoaBoMon ? '0' : orgId}
                                    onChange={(val) => handleFilterChange('organization', val)}
                                />
                            </Col>
                            <Flex gap={4}>
                                {khoaBoMon &&
                                    can(
                                        QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KHOA_BO_MON_PHAN_CONG_GIANG_DAY,
                                        'SUA'
                                    ) && (
                                        <Button
                                            onClick={() => handleSaveKhoaBoMon()}
                                            type="primary"
                                            disabled={
                                                !dmDonViData.length ||
                                                Object.entries(subjectClassForm).filter(
                                                    ([_, subjectClass]) => subjectClass.isEdit
                                                ).length === 0
                                            }
                                        >
                                            Lưu
                                        </Button>
                                    )}
                                {khoaBoMon &&
                                    can(
                                        QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KHOA_BO_MON_PHAN_CONG_GIANG_DAY,
                                        'SUA'
                                    ) && (
                                        <Popover
                                            content={
                                                <Flex gap={12} className="text-right mt-4">
                                                    <Button
                                                        type="primary"
                                                        className="bg-yellow-400 text-black"
                                                        onClick={async () => {
                                                            try {
                                                                showSpinner()
                                                                await updateManySubjectClass({
                                                                    data: {
                                                                        submitLecturerAssignmentAt:
                                                                            new Date(),
                                                                    },
                                                                    where: {
                                                                        lecturerId: { not: null },
                                                                        extraLecturerId: {
                                                                            not: null,
                                                                        },
                                                                        lecturerAssignmentDeadline:
                                                                            { not: null },
                                                                        submitLecturerAssignmentAt:
                                                                            null,
                                                                        approveLecturerAssignmentAt:
                                                                            null,
                                                                        type: hocLai
                                                                            ? $Enums
                                                                                  .SubjectClassType
                                                                                  .RETAKE
                                                                            : $Enums
                                                                                  .SubjectClassType
                                                                                  .NORMAL,
                                                                        trainingObjectTypeId,
                                                                        semesterId,
                                                                        id: {
                                                                            in: Object.entries(
                                                                                subjectClassForm
                                                                            )
                                                                                .filter(
                                                                                    ([
                                                                                        _,
                                                                                        subjectClass,
                                                                                    ]) =>
                                                                                        subjectClass.submitLecturerAssignmentAt
                                                                                )
                                                                                .map(([id]) => id),
                                                                        },
                                                                    },
                                                                })
                                                                message.success(
                                                                    'Gửi PCGD thành công'
                                                                )
                                                                form.resetFields()
                                                                debouncedRefetch()
                                                            } catch (error: any) {
                                                                message.error(
                                                                    'Đã xảy ra lỗi, vui lòng kiểm tra lại'
                                                                )
                                                            } finally {
                                                                hideSpinner()
                                                            }
                                                        }}
                                                        disabled={
                                                            Object.entries(subjectClassForm).filter(
                                                                ([_, subjectClass]) =>
                                                                    subjectClass.submitLecturerAssignmentAt
                                                            ).length === 0
                                                        }
                                                    >
                                                        Gửi PCGD{' '}
                                                        {
                                                            Object.entries(subjectClassForm).filter(
                                                                ([_, subjectClass]) =>
                                                                    subjectClass.submitLecturerAssignmentAt
                                                            ).length
                                                        }{' '}
                                                        lớp MH đã chọn
                                                    </Button>
                                                    <Button
                                                        type="primary"
                                                        onClick={handleGuiPCGD}
                                                        className="bg-orange-500"
                                                    >
                                                        Gửi PCGD lớp MH đã phân công
                                                    </Button>
                                                </Flex>
                                            }
                                            title="Gửi phân công giảng dạy"
                                            trigger="click"
                                            placement="bottomRight"
                                        >
                                            <Button type="primary" disabled={!dmDonViData.length}>
                                                Gửi PCGD
                                            </Button>
                                        </Popover>
                                    )}
                                {!khoaBoMon && (
                                    <Popover
                                        content={
                                            <Form
                                                form={formXepKhuVuc}
                                                initialValues={{ isOverride: false }}
                                                onFinish={async (values: XepKhuVucForm) => {
                                                    try {
                                                        showSpinner()
                                                        const res = await sqlTransaction([
                                                            {
                                                                model: 'SubjectClass',
                                                                operation: 'updateMany',
                                                                data: {
                                                                    where: {
                                                                        trainingObjectTypeId,
                                                                        semesterId,
                                                                        status: $Enums
                                                                            .SubjectClassStatus
                                                                            .DRAFT,
                                                                        ...(!values.isOverride
                                                                            ? {
                                                                                  trainingLocationId:
                                                                                      null,
                                                                              }
                                                                            : {}),
                                                                    },
                                                                    data: {
                                                                        trainingLocationId:
                                                                            values.trainingLocationId ??
                                                                            null,
                                                                    },
                                                                },
                                                            },
                                                        ])
                                                        if (res.status !== 200) {
                                                            throw new Error('Lỗi khi xếp khu vực')
                                                        }
                                                        debouncedRefetch()
                                                        message.success('Xếp khu vực thành công')
                                                    } catch (error: any) {
                                                        message.error(
                                                            'Đã xảy ra lỗi, vui lòng kiểm tra lại'
                                                        )
                                                    } finally {
                                                        hideSpinner()
                                                    }
                                                }}
                                            >
                                                <FormItem
                                                    form={formXepKhuVuc}
                                                    name={'trainingLocationId'}
                                                    required
                                                    label="Khu vực đào tạo"
                                                >
                                                    <Select
                                                        options={trainingLocationData.map((e) => ({
                                                            label: e.name,
                                                            value: e.id,
                                                        }))}
                                                        allowClear
                                                        showSearch
                                                        filterOption={(input, option) =>
                                                            (option?.label ?? '')
                                                                .toString()
                                                                .toLowerCase()
                                                                .includes(input.toLowerCase())
                                                        }
                                                        dropdownStyle={{
                                                            width: 400,
                                                            maxHeight: 400,
                                                        }}
                                                    />
                                                </FormItem>
                                                <FormItem
                                                    form={formXepKhuVuc}
                                                    name={'isOverride'}
                                                    label="Ghi đè khu vực đã xếp"
                                                    className="mt-2"
                                                >
                                                    <Switch />
                                                </FormItem>
                                                <Col span={24} className="text-right mt-4">
                                                    <Button type="primary" htmlType="submit">
                                                        Xếp khu vực
                                                    </Button>
                                                </Col>
                                            </Form>
                                        }
                                        title="Xếp khu vực nhanh"
                                        trigger="click"
                                        placement="bottomRight"
                                    >
                                        <Button type="dashed">Xếp khu vực (nhanh)</Button>
                                    </Popover>
                                )}
                                {!khoaBoMon && (
                                    <Button
                                        onClick={() => handleSaveData()}
                                        type="default"
                                        className="text-primary"
                                    >
                                        0. Lưu kế hoạch
                                    </Button>
                                )}
                                {!khoaBoMon && (
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
                                                    required
                                                    label="Hạn phân công giảng dạy"
                                                >
                                                    <DatePicker />
                                                </FormItem>
                                                <FormItem
                                                    form={formBaoDay}
                                                    name={'isOverride'}
                                                    label="Ghi đè hạn PCGD"
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
                                        <Button type="primary" className="bg-red-500">
                                            1.Báo dạy
                                        </Button>
                                    </Popover>
                                )}
                                {!khoaBoMon &&
                                    can(
                                        QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_GIAO_DUC,
                                        'DUYET'
                                    ) && (
                                        <Popover
                                            content={
                                                <Flex gap={12} className="text-right mt-4">
                                                    <Button
                                                        type="primary"
                                                        disabled={
                                                            Object.entries(subjectClassForm).filter(
                                                                ([_, subjectClass]) =>
                                                                    subjectClass.approveLecturerAssignmentAt
                                                            ).length === 0
                                                        }
                                                        danger
                                                        onClick={handleTuChoiPCGD}
                                                    >
                                                        Từ chối duyệt{' '}
                                                        {
                                                            Object.entries(subjectClassForm).filter(
                                                                ([_, subjectClass]) =>
                                                                    subjectClass.approveLecturerAssignmentAt
                                                            ).length
                                                        }{' '}
                                                        LMH
                                                    </Button>
                                                    <Button
                                                        type="primary"
                                                        onClick={handleDuyetPCGD}
                                                        disabled={
                                                            Object.entries(subjectClassForm).filter(
                                                                ([_, subjectClass]) =>
                                                                    subjectClass.approveLecturerAssignmentAt
                                                            ).length === 0
                                                        }
                                                    >
                                                        Duyệt{' '}
                                                        {
                                                            Object.entries(subjectClassForm).filter(
                                                                ([_, subjectClass]) =>
                                                                    subjectClass.approveLecturerAssignmentAt
                                                            ).length
                                                        }{' '}
                                                        LMH
                                                    </Button>
                                                </Flex>
                                            }
                                            title="Duyệt báo dạy"
                                            trigger="click"
                                            placement="bottomRight"
                                        >
                                            <Button type="primary">2. Duyệt báo dạy</Button>
                                        </Popover>
                                    )}
                                {!khoaBoMon && (
                                    <Button
                                        onClick={async () => {
                                            try {
                                                const res = await sqlTransaction([
                                                    {
                                                        model: 'SubjectClass',
                                                        operation: 'findMany',
                                                        data: {
                                                            where,
                                                            select: {
                                                                submitLecturerAssignmentAt: true,
                                                                schedule: true,
                                                                examType: true,
                                                                mainLecturer: {
                                                                    select: {
                                                                        userProfile: {
                                                                            select: {
                                                                                fullname: true,
                                                                            },
                                                                        },
                                                                    },
                                                                },
                                                                subject: {
                                                                    select: {
                                                                        code: true,
                                                                        name: true,
                                                                        credit: true,
                                                                        period: true,
                                                                        managementOrganization: {
                                                                            select: {
                                                                                sTen: true,
                                                                                sMa: true,
                                                                                sParentId: true,
                                                                            },
                                                                        },
                                                                    },
                                                                },
                                                                extraLecturer: {
                                                                    select: {
                                                                        userProfile: {
                                                                            select: {
                                                                                fullname: true,
                                                                            },
                                                                        },
                                                                    },
                                                                },
                                                                fixedClasses: {
                                                                    select: {
                                                                        code: true,
                                                                        _count: {
                                                                            select: {
                                                                                students: {
                                                                                    where: {
                                                                                        deletedAt:
                                                                                            null,
                                                                                        active: true,
                                                                                        status: 'ENROLLED',
                                                                                    },
                                                                                },
                                                                            },
                                                                        },
                                                                    },
                                                                },
                                                                room: {
                                                                    select: {
                                                                        name: true,
                                                                    },
                                                                },
                                                                trainingLocation: {
                                                                    select: {
                                                                        name: true,
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    },
                                                    {
                                                        model: 'Semester',
                                                        operation: 'findUnique',
                                                        data: {
                                                            where: { id: semesterId },
                                                            select: {
                                                                semesterType: true,
                                                                schoolYear: {
                                                                    select: {
                                                                        startDate: true,
                                                                        endDate: true,
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    },
                                                    {
                                                        model: 'DM_DonVi',
                                                        operation: 'findMany',
                                                        data: {
                                                            where: {
                                                                bActive: true,
                                                            },
                                                            select: {
                                                                sMa: true,
                                                                Id: true,
                                                                sTen: true,
                                                                sParentId: true,
                                                            },
                                                        },
                                                    },
                                                ])

                                                if (res.status !== 200) {
                                                    throw new Error('Lỗi khi xuất báo dạy')
                                                }

                                                const payload = res.data[0] as Array<{
                                                    schedule: string
                                                    examType: $Enums.ExamType | null
                                                    mainLecturer: any
                                                    subject: {
                                                        code: string
                                                        name: string
                                                        credit: number
                                                        period: number
                                                        managementOrganization: {
                                                            sTen: string
                                                            sMa: string
                                                            sParentId: any
                                                        }
                                                    }
                                                    submitLecturerAssignmentAt: Date | null
                                                    sendLecturerAssignmentAt: Date | null
                                                    extraLecturer: any
                                                    fixedClasses: Array<{
                                                        code: string
                                                        _count: {
                                                            students: number
                                                        }
                                                    }>
                                                    room: {
                                                        name: string
                                                    }
                                                    trainingLocation: {
                                                        name: string
                                                    }
                                                }>
                                                const semesterPayload = res.data[1] as {
                                                    semesterType: $Enums.SemesterType
                                                    schoolYear: {
                                                        startDate: Date
                                                        endDate: Date
                                                    }
                                                }

                                                const orgPayload = res.data[2] as Array<{
                                                    sMa: string
                                                    Id: string
                                                    sTen: string
                                                    sParentId: string
                                                }>

                                                const hocKy = (() => {
                                                    if (
                                                        semesterPayload.semesterType ===
                                                        $Enums.SemesterType.FIRST
                                                    )
                                                        return '1'
                                                    if (
                                                        semesterPayload.semesterType ===
                                                        $Enums.SemesterType.SECOND
                                                    )
                                                        return '2'
                                                    if (
                                                        semesterPayload.semesterType ===
                                                        $Enums.SemesterType.SUMMER
                                                    )
                                                        return 'Hè'
                                                    if (
                                                        semesterPayload.semesterType ===
                                                        $Enums.SemesterType.FIRST_SUPPLEMENTARY
                                                    )
                                                        return 'Phụ 1'
                                                    if (
                                                        semesterPayload.semesterType ===
                                                        $Enums.SemesterType.SECOND_SUPPLEMENTARY
                                                    )
                                                        return 'Phụ 2'
                                                    return ''
                                                })()

                                                const namHoc = (() => {
                                                    const startYear = dayjs(
                                                        semesterPayload.schoolYear.startDate
                                                    ).year()
                                                    const endYear = startYear + 1
                                                    return `${startYear} - ${endYear}`
                                                })()

                                                const groupedPayload = Object.groupBy(
                                                    payload,
                                                    (item) =>
                                                        item?.subject?.managementOrganization
                                                            ?.sMa || 'MTA'
                                                )
                                                exportFromTemplate({
                                                    templateUrl: getMinioUrl(
                                                        '/mta/template/ke-hoach-dao-tao/bao-day.xlsx'
                                                    ),
                                                    fileName: `Bao_day_${dayjs().format('DD_MM_YYYY')}.xlsx`,
                                                    fontFamily: 'Tahoma',
                                                    fontSize: 9,
                                                    sheets: Object.entries(groupedPayload).map(
                                                        ([sMa, items = []]) => {
                                                            const ngayGui = dayjs.unix(
                                                                Math.min(
                                                                    ...items.map(
                                                                        (i) =>
                                                                            dayjs(
                                                                                i.sendLecturerAssignmentAt
                                                                            ).unix() ??
                                                                            Number.POSITIVE_INFINITY
                                                                    )
                                                                )
                                                            )
                                                            const ngayNhan = dayjs.unix(
                                                                Math.max(
                                                                    ...items.map(
                                                                        (i) =>
                                                                            dayjs(
                                                                                i.sendLecturerAssignmentAt
                                                                            ).unix() ??
                                                                            Number.NEGATIVE_INFINITY
                                                                    )
                                                                )
                                                            )

                                                            const boMon = orgPayload.find(
                                                                (e) => e.sMa === sMa
                                                            )

                                                            const khoa = orgPayload.find(
                                                                (e) => e.Id === boMon?.sParentId
                                                            )

                                                            const itemBySubjectCode =
                                                                Object.groupBy(
                                                                    items,
                                                                    (item) => item.subject.code
                                                                )

                                                            return {
                                                                tableStartCell: {
                                                                    col: 1,
                                                                    row: 10,
                                                                },
                                                                data: {
                                                                    khoa: khoa?.sTen || '',
                                                                    bo_mon: boMon?.sTen || '',
                                                                    ngay_gui: `Ngày ${ngayGui.format('DD')} tháng ${ngayGui.format('MM')} năm ${ngayGui.format(
                                                                        'YYYY'
                                                                    )}`,
                                                                    ngay_nhan: `Ngày ${ngayNhan.format('DD')} tháng ${ngayNhan.format('MM')} năm ${ngayNhan.format(
                                                                        'YYYY'
                                                                    )}`,
                                                                    hoc_ky: hocKy,
                                                                    nam_hoc: namHoc,
                                                                },
                                                                rows: Object.entries(
                                                                    itemBySubjectCode
                                                                ).flatMap(
                                                                    (
                                                                        [_, subjectItems = []],
                                                                        idxOfSubject
                                                                    ) => {
                                                                        return subjectItems.map(
                                                                            (item, index) => {
                                                                                const rowSpan =
                                                                                    index === 0
                                                                                        ? subjectItems.length
                                                                                        : 1
                                                                                return {
                                                                                    cells: [
                                                                                        {
                                                                                            value:
                                                                                                idxOfSubject +
                                                                                                1,
                                                                                            rowSpan,
                                                                                            align: 'center',
                                                                                        },
                                                                                        {
                                                                                            value: item
                                                                                                .subject
                                                                                                .code,
                                                                                            rowSpan,
                                                                                        },
                                                                                        {
                                                                                            value: item
                                                                                                .subject
                                                                                                .name,
                                                                                            rowSpan,
                                                                                        },
                                                                                        {
                                                                                            value: item
                                                                                                .subject
                                                                                                .credit,
                                                                                            rowSpan,
                                                                                            align: 'right',
                                                                                        },
                                                                                        {
                                                                                            value: Math.floor(
                                                                                                item
                                                                                                    .subject
                                                                                                    .period /
                                                                                                    15
                                                                                            ), // dvht
                                                                                            rowSpan,
                                                                                            align: 'right',
                                                                                        },
                                                                                        {
                                                                                            value: item
                                                                                                .subject
                                                                                                .period, //
                                                                                            rowSpan,
                                                                                            align: 'right',
                                                                                        },
                                                                                        {
                                                                                            value: subjectItems.length, //
                                                                                            rowSpan,
                                                                                            align: 'right',
                                                                                        },
                                                                                        {
                                                                                            value: item.schedule
                                                                                                ? SUBJECT_CLASS_SCHEDULE_TYPE[
                                                                                                      item.schedule as keyof typeof SUBJECT_CLASS_SCHEDULE_TYPE
                                                                                                  ]
                                                                                                : '',
                                                                                            align: 'center',
                                                                                        },
                                                                                        {
                                                                                            value: item.fixedClasses.reduce(
                                                                                                (
                                                                                                    acc,
                                                                                                    curr
                                                                                                ) =>
                                                                                                    acc +
                                                                                                    curr
                                                                                                        ._count
                                                                                                        .students,
                                                                                                0
                                                                                            ),
                                                                                        },
                                                                                        {
                                                                                            value: item.fixedClasses
                                                                                                .map(
                                                                                                    (
                                                                                                        fc
                                                                                                    ) =>
                                                                                                        fc.code
                                                                                                )
                                                                                                .join(
                                                                                                    ', '
                                                                                                ),
                                                                                        },
                                                                                        {
                                                                                            value:
                                                                                                item
                                                                                                    .trainingLocation
                                                                                                    ?.name ??
                                                                                                '',
                                                                                        },
                                                                                        {
                                                                                            value:
                                                                                                item
                                                                                                    .mainLecturer
                                                                                                    ?.userProfile
                                                                                                    ?.fullname ||
                                                                                                '',
                                                                                        },
                                                                                        {
                                                                                            value:
                                                                                                item
                                                                                                    .extraLecturer
                                                                                                    ?.userProfile
                                                                                                    ?.fullname ||
                                                                                                '',
                                                                                        },
                                                                                        {
                                                                                            value: item.room
                                                                                                ? item
                                                                                                      .room
                                                                                                      .name
                                                                                                : '',
                                                                                        },
                                                                                        {
                                                                                            value: item.examType
                                                                                                ? getExamTypeLabel(
                                                                                                      item.examType
                                                                                                  )
                                                                                                : '',
                                                                                        },
                                                                                    ],
                                                                                }
                                                                            }
                                                                        )
                                                                    }
                                                                ),
                                                                sheet: sMa,
                                                            }
                                                        }
                                                    ),
                                                })
                                            } catch (error) {
                                                console.log('error', error)
                                            }
                                        }}
                                        type="primary"
                                        className="bg-blue-500"
                                    >
                                        3. Xuất báo dạy
                                    </Button>
                                )}
                                {!khoaBoMon &&
                                    can(
                                        QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_GIAO_DUC,
                                        'NHAP_EXCEL'
                                    ) && (
                                        <Button
                                            type="primary"
                                            className="bg-yellow-500 text-black"
                                            onClick={() => onOpenModalNhapTKB(semesterId || '')}
                                        >
                                            4. Nhập từ TKB
                                        </Button>
                                    )}
                            </Flex>
                        </Flex>
                        <Divider className="m-0" />
                    </Affix>
                </Col>
                <Col span={24}>
                    <Form
                        form={form}
                        onValuesChange={(changedValue) => {
                            if (changedValue.subjectClass) {
                                const subjectClassId = Object.keys(changedValue.subjectClass)[0]
                                if (
                                    subjectClassId &&
                                    !Object.keys(
                                        changedValue.subjectClass[subjectClassId] || {}
                                    ).includes('submitLecturerAssignmentAt')
                                )
                                    form.setFieldValue('subjectClass', {
                                        ...subjectClassForm,
                                        ...changedValue.subjectClass,
                                        [subjectClassId]: {
                                            ...subjectClassForm?.[subjectClassId],
                                            ...changedValue.subjectClass[subjectClassId],
                                            enterGradeLecturerId:
                                                subjectClassForm?.[subjectClassId]
                                                    ?.enterGradeLecturerId ??
                                                changedValue.subjectClass[subjectClassId]
                                                    ?.lecturerId ??
                                                null,
                                            isEdit: true,
                                        },
                                    })
                            }
                        }}
                    >
                        {!khoaBoMon && (
                            <p className="mt-1">
                                Khoa/Viện/Bộ môn chỉ có thể nhìn thấy lớp môn học có hạn phân công
                                giảng dạy.
                            </p>
                        )}
                        <Flex gap={16} className="px-2">
                            <p className="flex gap-1 items-center">
                                <p className="bg-slate-200 h-4 w-4 rounded" />
                                <span>Yêu cầu PCGD</span>
                            </p>
                            <p className="flex gap-1 items-center">
                                <p className="bg-red-200 h-4 w-4 rounded" />
                                <span>LMH đã huỷ</span>
                            </p>
                            <p className="flex gap-1 items-center">
                                <p className="bg-yellow-200 h-4 w-4 rounded" />
                                <span>Chờ duyệt PCGD</span>
                            </p>
                            <p className="flex gap-1 items-center">
                                <p className="bg-green-200 h-4 w-4 rounded" />
                                <span>Đã duyệt PCGD</span>
                            </p>
                            {!khoaBoMon && (
                                <p className="flex gap-1 items-center">
                                    <Checkbox
                                        indeterminate={
                                            countSubjectClassOfficial > 0 &&
                                            countSubjectClassOfficial < countSubjectClass
                                        }
                                        checked={
                                            countSubjectClassOfficial > 0 &&
                                            countSubjectClassOfficial === countSubjectClass
                                        }
                                        onChange={async (e) => {
                                            try {
                                                await sqlTransaction([
                                                    {
                                                        model: 'SubjectClass',
                                                        operation: 'updateMany',
                                                        data: {
                                                            where: {
                                                                semesterId,
                                                                approveLecturerAssignmentAt: {
                                                                    not: null,
                                                                },
                                                                trainingObjectTypeId,
                                                                lecturerId: {
                                                                    not: null,
                                                                },
                                                                extraLecturerId: {
                                                                    not: null,
                                                                },
                                                                cancelled: false,
                                                                active: true,
                                                                deletedAt: null,
                                                            },
                                                            data: {
                                                                status: e.target.checked
                                                                    ? $Enums.SubjectClassStatus
                                                                          .OFFICIAL
                                                                    : $Enums.SubjectClassStatus
                                                                          .DRAFT,
                                                            },
                                                        },
                                                    },
                                                ])
                                                queryClient.invalidateQueries({
                                                    queryKey: ['zenstack', 'SubjectClass'],
                                                })
                                            } catch (error) {}
                                        }}
                                    />
                                    <span>Đưa LMH vào giảng dạy</span>
                                </p>
                            )}
                        </Flex>
                        <FormItem form={form} name={'subjectClass'} hidden />
                        <TableCollapse
                            rowKey="id"
                            filters={filters}
                            setFilters={(value) => {
                                setFilters(value)
                                setCurrentPage(1)
                            }}
                            defaultExpandAll
                            onRow={(record) => {
                                const recordSubjectClass = record as unknown as SubjectClass
                                return {
                                    className: cn(
                                        !!recordSubjectClass?.submitLecturerAssignmentAt &&
                                            'bg-yellow-200',
                                        (!subjectClassForm?.[record.id]?.lecturerId ||
                                            !subjectClassForm?.[record.id]?.extraLecturerId ||
                                            !subjectClassForm?.[record.id]?.enterGradeLecturerId) &&
                                            'bg-slate-200',
                                        !!recordSubjectClass?.approveLecturerAssignmentAt &&
                                            'bg-green-200',
                                        subjectClassForm?.[record.id]?.isEdit && 'bg-yellow-100',
                                        subjectClassForm?.[record.id]?.cancelled && 'bg-red-200'
                                    ),
                                }
                            }}
                            columns={[
                                {
                                    title: 'Duyệt',
                                    align: 'center',
                                    width: 50,
                                    dataIndex: 'approved',
                                    type: 'select',
                                    options: [
                                        { value: true, label: 'Đã duyệt' },
                                        { value: false, label: 'Chưa duyệt' },
                                    ],
                                    render: (_, record) =>
                                        record?.approveLecturerAssignmentAt ? (
                                            <Checkbox checked />
                                        ) : (
                                            <FormItem
                                                form={form}
                                                name={[
                                                    'subjectClass',
                                                    record.id,
                                                    'approveLecturerAssignmentAt',
                                                ]}
                                                valuePropName="checked"
                                            >
                                                <Checkbox
                                                    disabled={
                                                        subjectClassForm?.[record.id]?.cancelled ||
                                                        khoaBoMon ||
                                                        !record?.submitLecturerAssignmentAt
                                                    }
                                                />
                                            </FormItem>
                                        ),
                                },
                                {
                                    title: 'PCGD',
                                    align: 'center',
                                    width: 50,
                                    type: 'select',
                                    dataIndex: 'pcgd',
                                    options: [
                                        { value: true, label: 'Đã phân công giảng dạy' },
                                        { value: false, label: 'Chưa phân công giảng dạy' },
                                    ],
                                    render: (_, record) =>
                                        !!record?.approveLecturerAssignmentAt ||
                                        !!record?.submitLecturerAssignmentAt ? (
                                            <Checkbox checked />
                                        ) : (
                                            <>
                                                <FormItem
                                                    form={form}
                                                    name={['subjectClass', record.id, 'isEdit']}
                                                    hidden
                                                />
                                                <FormItem
                                                    form={form}
                                                    name={[
                                                        'subjectClass',
                                                        record.id,
                                                        'submitLecturerAssignmentAt',
                                                    ]}
                                                    valuePropName="checked"
                                                >
                                                    <Checkbox
                                                        disabled={
                                                            subjectClassForm?.[record.id]
                                                                ?.cancelled ||
                                                            !khoaBoMon ||
                                                            !subjectClassForm?.[record.id]
                                                                ?.lecturerId ||
                                                            !subjectClassForm?.[record.id]
                                                                ?.extraLecturerId ||
                                                            !subjectClassForm?.[record.id]
                                                                ?.enterGradeLecturerId ||
                                                            (!!record.lecturerAssignmentDeadline &&
                                                                dayjs(
                                                                    record.lecturerAssignmentDeadline
                                                                ).isBefore(dayjs().startOf('day')))
                                                        }
                                                    />
                                                </FormItem>
                                            </>
                                        ),
                                },
                                {
                                    title: 'Hạn PCGD',
                                    dataIndex: 'lecturerAssignmentDeadline',
                                    width: 120,
                                    align: 'center',
                                    render: (_, record) =>
                                        canXemTatCa && !khoaBoMon ? (
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
                                                    disabled={
                                                        subjectClassForm?.[record.id]?.cancelled ||
                                                        !!record?.approveLecturerAssignmentAt
                                                    }
                                                />
                                            </FormItem>
                                        ) : record.lecturerAssignmentDeadline ? (
                                            <p
                                                className={cn(
                                                    dayjs(
                                                        record.lecturerAssignmentDeadline
                                                    ).isBefore(dayjs().startOf('day')) &&
                                                        'text-red-600'
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
                                    width: 100,
                                    align: 'center',
                                    type: 'input',
                                },
                                {
                                    title: 'Tên môn học',
                                    dataIndex: 'name',
                                    align: 'center',
                                    type: 'input',
                                    width: 250,
                                    onCell: (record) => ({
                                        rowSpan: record.rowSpan,
                                    }),
                                    render: (text) => <p className="text-left">{text}</p>,
                                },
                                {
                                    title: 'STC',
                                    dataIndex: 'credit',
                                    width: 40,
                                    align: 'center',
                                    type: 'order',
                                    distinctFilters: ['maxStudent', 'subjectClassStudent'],
                                    render: (_, record) =>
                                        record.subject?.credit ? record.subject?.credit : '',
                                },
                                {
                                    title: 'Kíp',
                                    dataIndex: 'schedule',
                                    align: 'center',
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
                                    title: 'Lớp QL',
                                    align: 'center',
                                    render: (_, record) => (
                                        <p>
                                            {record?.fixedClasses?.map((e) => e.code).join(', ') ||
                                                '-'}
                                        </p>
                                    ),
                                },
                                {
                                    title: 'Số SV',
                                    width: 50,
                                    align: 'center',
                                    type: 'order',
                                    distinctFilters: ['maxStudent', 'credit'],
                                    render: (_, record) => (
                                        <p>
                                            {record?.fixedClasses?.reduce(
                                                (acc, curr) => acc + (curr?._count?.students ?? 0),
                                                0
                                            ) ?? 0}
                                        </p>
                                    ),
                                },
                                {
                                    title: 'Giảng viên 1',
                                    align: 'center',
                                    type: 'input',
                                    width: 150,
                                    dataIndex: 'mainLecturer',
                                    render: (__, record) =>
                                        khoaBoMon &&
                                        !subjectClassForm?.[record.id]?.cancelled &&
                                        !record?.submitLecturerAssignmentAt &&
                                        !record?.approveLecturerAssignmentAt ? (
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
                                                    disabled={
                                                        !!record?.submitLecturerAssignmentAt ||
                                                        (!!record.lecturerAssignmentDeadline &&
                                                            dayjs(
                                                                record.lecturerAssignmentDeadline
                                                            ).isBefore(dayjs().startOf('day')))
                                                    }
                                                    organizationId={
                                                        record?.subject?.managementOrganizationId ??
                                                        ''
                                                    }
                                                />
                                            </FormItem>
                                        ) : (
                                            (record?.mainLecturer?.userProfile?.fullname ?? '-')
                                        ),
                                },
                                {
                                    title: 'Giảng viên 2',
                                    align: 'center',
                                    type: 'input',
                                    width: 150,
                                    dataIndex: 'extraLecturer',
                                    render: (__, record) =>
                                        khoaBoMon &&
                                        !subjectClassForm?.[record.id]?.cancelled &&
                                        !record?.submitLecturerAssignmentAt &&
                                        !record?.approveLecturerAssignmentAt ? (
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
                                                    disabled={
                                                        subjectClassForm?.[record.id]?.cancelled ||
                                                        !!record?.submitLecturerAssignmentAt ||
                                                        (!!record.lecturerAssignmentDeadline &&
                                                            dayjs(
                                                                record.lecturerAssignmentDeadline
                                                            ).isBefore(dayjs().startOf('day')))
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
                                        khoaBoMon ? (
                                            <FormItem
                                                form={form}
                                                name={['subjectClass', record.id, 'examType']}
                                            >
                                                <Select
                                                    options={options}
                                                    disabled={
                                                        subjectClassForm?.[record.id]?.cancelled ||
                                                        (khoaBoMon &&
                                                            (!!record?.submitLecturerAssignmentAt ||
                                                                (!!record.lecturerAssignmentDeadline &&
                                                                    dayjs(
                                                                        record.lecturerAssignmentDeadline
                                                                    ).isBefore(
                                                                        dayjs().startOf('day')
                                                                    ))))
                                                    }
                                                />
                                            </FormItem>
                                        ) : (
                                            !!record.submitLecturerAssignmentAt &&
                                            record.examType &&
                                            getExamTypeLabel(record.examType)
                                        ),
                                },
                                {
                                    title: 'Khu vực',
                                    dataIndex: 'trainingLocationId',
                                    align: 'center',
                                    width: 150,
                                    type: 'input',
                                    render: (_, record) =>
                                        !khoaBoMon ? (
                                            <FormItem
                                                form={form}
                                                name={[
                                                    'subjectClass',
                                                    record.id,
                                                    'trainingLocationId',
                                                ]}
                                            >
                                                <Select
                                                    options={trainingLocationData.map((e) => ({
                                                        label: e.name,
                                                        value: e.id,
                                                    }))}
                                                    allowClear
                                                    showSearch
                                                    disabled={
                                                        subjectClassForm?.[record.id]?.cancelled
                                                    }
                                                    filterOption={(input, option) =>
                                                        (option?.label ?? '')
                                                            .toString()
                                                            .toLowerCase()
                                                            .includes(input.toLowerCase())
                                                    }
                                                    dropdownStyle={{
                                                        width: 400,
                                                        maxHeight: 400,
                                                    }}
                                                />
                                            </FormItem>
                                        ) : record.trainingLocation ? (
                                            record.trainingLocation?.name
                                        ) : (
                                            '-'
                                        ),
                                },
                                {
                                    title: 'Phòng học',
                                    dataIndex: 'roomId',
                                    align: 'center',
                                    width: 200,
                                    render: (_, record) => (
                                        <FormItem
                                            form={form}
                                            name={['subjectClass', record.id, 'roomId']}
                                        >
                                            <TreeSelect
                                                treeData={buildingData
                                                    .filter((e) =>
                                                        subjectClassForm?.[record?.id]
                                                            ?.trainingLocationId ||
                                                        record?.trainingLocationId
                                                            ? e.trainingLocationId ===
                                                              (subjectClassForm?.[record.id]
                                                                  ?.trainingLocationId ||
                                                                  record?.trainingLocationId)
                                                            : true
                                                    )
                                                    .map((e) => ({
                                                        label: e.name,
                                                        value: e.id,
                                                        selectable: false,
                                                        children: e.rooms.map((room) => ({
                                                            label: (
                                                                <p className="text-primary">
                                                                    {room.name}
                                                                </p>
                                                            ),
                                                            value: room.id,
                                                            selectable: true,
                                                        })),
                                                    }))}
                                                filterTreeNode={(input, option) =>
                                                    (option?.title ?? '')
                                                        .toString()
                                                        .toLowerCase()
                                                        .includes(input?.toLowerCase())
                                                }
                                                disabled={
                                                    subjectClassForm?.[record.id]?.cancelled ||
                                                    (khoaBoMon &&
                                                        (!!record?.submitLecturerAssignmentAt ||
                                                            (!!record.lecturerAssignmentDeadline &&
                                                                dayjs(
                                                                    record.lecturerAssignmentDeadline
                                                                ).isBefore(
                                                                    dayjs().startOf('day')
                                                                ))))
                                                }
                                                showSearch
                                                allowClear
                                                treeNodeFilterProp="title"
                                                multiple={false}
                                                showCheckedStrategy="SHOW_CHILD"
                                                dropdownStyle={{
                                                    width: 400,
                                                    maxHeight: 400,
                                                }}
                                            />
                                        </FormItem>
                                    ),
                                },
                                {
                                    title: 'GV nhập điểm',
                                    align: 'center',
                                    width: 150,
                                    render: (__, record) =>
                                        khoaBoMon &&
                                        !subjectClassForm?.[record.id]?.cancelled &&
                                        !record?.submitLecturerAssignmentAt &&
                                        !record?.approveLecturerAssignmentAt ? (
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
                                                    disabled={
                                                        subjectClassForm?.[record.id]?.cancelled ||
                                                        !!record?.submitLecturerAssignmentAt ||
                                                        (!!record.lecturerAssignmentDeadline &&
                                                            dayjs(
                                                                record.lecturerAssignmentDeadline
                                                            ).isBefore(dayjs().startOf('day')))
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
                                    hidden:
                                        khoaBoMon ||
                                        !canSome(
                                            QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_GIAO_DUC,
                                            'SUA',
                                            'XOA'
                                        ),
                                    render: (record, { id }) => {
                                        if (id) {
                                            return (
                                                <Row className="justify-center gap-2">
                                                    {can(
                                                        QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_GIAO_DUC,
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
                                                        QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_GIAO_DUC,
                                                        'XOA'
                                                    ) && (
                                                        <DeleteIcon
                                                            popConfirm={{
                                                                onConfirm: () => handleDelete(id),
                                                            }}
                                                            disabled={
                                                                record?.status !==
                                                                $Enums.SubjectClassStatus.DRAFT
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
                            headerTitleKey={'sTen'}
                            data={dataWithRowSpan}
                            childrenFieldName="children"
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
                            }}
                        />
                    </Form>
                </Col>
            </Row>
            <style>
                {`
                .readonly-checkbox.ant-checkbox-wrapper-disabled {
                    opacity: 1;
                    pointer-events: none; /* không click được */
                    }

                .readonly-checkbox .ant-checkbox-disabled .ant-checkbox-inner {
                background-color: #fff;
                border-color: #d9d9d9;
                }
                `}
            </style>
        </div>
    )
}

PhanCongGiangDay.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
