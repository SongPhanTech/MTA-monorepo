import TreeSelectDepartment from '@components/commons/department-select/TreeSelectDepartment'
import FormItem from '@components/commons/form-item'
import TableCollapse from '@components/commons/tableCollapse'
import DeleteIcon from '@components/icons/delete'
import ViewIcon from '@components/icons/view'
import { DEFAULT_PAGINATE_SIZE, SUBJECT_CLASS_SCHEDULE_TYPE } from '@constants/constants'
import type { FilterProps } from '@constants/type'
import { useExamTypeOptions } from '@hooks/examType'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { buildOrgFlat, formatDate } from '@lib/utils'
import { emptyObjectIf } from '@workspace/constant'
import { $Enums, type Prisma, type SubjectClass } from '@workspace/db/client'
import { useCountDM_DonVi, useDeleteSubjectClass, useFindManyDM_DonVi } from '@workspace/db/hooks'
import { whereOrganization } from '@workspace/libs/constants'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION } from '@workspace/router'
import { dayjs, useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
import { Affix, Col, Divider, Flex, Form, message, Row } from 'antd'
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
            isEdit?: boolean
            cancelled: boolean
        }
    >
}

export default function ThoiKhoaBieu({
    type,
    khoaBoMon = false,
}: {
    type?: $Enums.SubjectClassType
    khoaBoMon?: boolean
}) {
    const { can } = useAbility()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        code: '',
        name: '',
        lecturerId: undefined,
        maxStudent: undefined,
        subjectClassStudent: undefined,
        mainLecturer: undefined,
        extraLecturer: undefined,
        enterGradeLecturer: undefined,
        examType: undefined,
        room: undefined,
        pcgd: undefined,
        approved: undefined,
    })

    const [form] = Form.useForm<TeachingAssignmentForm>()

    const subjectClassForm = Form.useWatch('subjectClass', form) || {}

    const { id: semesterId } = useSemesterStore()
    const { options, getExamTypeLabel } = useExamTypeOptions()
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const canXemTatCa = can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_GIAO_DUC, 'XEM_TAT_CA')
    const orgId = window.contextData?.organizationId
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
                ...(filters.extraLecturer
                    ? {
                          extraLecturer: {
                              userProfile: filters.extraLecturer
                                  ? {
                                        fullname: {
                                            contains: filters.extraLecturer,
                                            mode: 'insensitive' as const,
                                        },
                                    }
                                  : {},
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
                },
                deletedAt: null,
                active: true,
                status: 'OFFICIAL',
                cancelled: false,
                trainingObjectTypeId,
                ...(khoaBoMon
                    ? {
                          lecturerAssignmentDeadline: {
                              not: null,
                          },
                      }
                    : {}),
                type: type,
            }) satisfies Prisma.SubjectClassWhereInput,
        [filters, semesterId, trainingObjectTypeId, khoaBoMon, type]
    )

    const { data: dmDonViIds = [] } = useFindManyDM_DonVi(
        {
            select: { Id: true },
            where: whereOrganization,
            orderBy: [{ iSTT: 'asc' }, { sTen: 'asc' }],
        },
        {
            refetchOnWindowFocus: false,
        }
    )

    const orgIds = [
        ...buildOrgFlat(
            dmDonViIds.map((e) => ({
                Id: e.Id,
                sTen: null,
                sParentId: null,
                sMa: null,
            })),
            orgId || '0'
        ).map((org) => org.value),
        orgId,
    ].filter(Boolean)

    const { data: dmDonViData = [], refetch } = useFindManyDM_DonVi(
        {
            include: {
                subjects: {
                    include: {
                        subjectVersion: {
                            include: {
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
                                                id: true,
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
                },
            },
            take: numberOfPages,
            skip: (currentPage - 1) * numberOfPages,
            where: {
                bActive: true,
                subjects: {
                    some: {
                        subjectVersion: {
                            some: {
                                subjectClass: {
                                    some: {
                                        ...where,
                                    },
                                },
                            },
                        },
                    },
                },
                Id: !khoaBoMon
                    ? undefined
                    : {
                          in: orgIds,
                      },
                ...whereOrganization,
                // sParentId: !khoaBoMon ? undefined : orgId,
            },
            orderBy: [{ iSTT: 'asc' }, { sTen: 'asc' }],
        },
        {
            enabled: !!semesterId && !!trainingObjectTypeId,
            refetchOnWindowFocus: false,
        }
    )

    const { data: count } = useCountDM_DonVi({
        where: {
            bActive: true,
            subjects: {
                some: {
                    subjectVersion: {
                        some: {
                            subjectClass: {
                                some: {
                                    ...where,
                                },
                            },
                        },
                    },
                },
            },
            Id: !khoaBoMon
                ? undefined
                : {
                      in: orgIds,
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
    const { onOpen: onOpenDetailSubject } = useDisclosure<{
        subjectVersionId?: string
    }>({
        tag: 'ModalChiTietMonHoc',
    })

    const { onOpen: onOpenDetailFixedClass } = useDisclosure<{
        fixedClassId: string
    }>({
        tag: 'ModalChiTietLopBienChe',
    })

    const { onOpen: onOpenDetailLecture } = useDisclosure<string>({
        tag: 'ModalChiTietGiangVien',
    })

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

    const { onOpen: onOpenEditSubjectClass } = useDisclosure<{
        id: string
        mode: 'edit' | 'view'
    }>({
        tag: 'PutOneSubjectClassModal',
    })

    const dataWithRowSpan = useMemo(() => {
        if (dmDonViData) {
            const countSubjectClassBySubjectId: Record<string, number> = {}
            dmDonViData.forEach((dmDonVi) => {
                dmDonVi.subjects.forEach((subject) => {
                    subject.subjectVersion.forEach((sv) => {
                        sv.subjectClass.forEach((subjectClass) => {
                            countSubjectClassBySubjectId[subjectClass.subjectId] =
                                (countSubjectClassBySubjectId[subjectClass.subjectId] || 0) + 1
                        })
                    })
                })
            })

            const mapWithCount = dmDonViData.map((dmDonVi) => ({
                ...dmDonVi,
                id: dmDonVi.Id,
                children: dmDonVi.subjects.flatMap((subject) =>
                    subject.subjectVersion.flatMap((sv) =>
                        sv.subjectClass.map((subjectClass) => {
                            const cloneCount = countSubjectClassBySubjectId[subjectClass.subjectId]
                            countSubjectClassBySubjectId[subjectClass.subjectId] = 0
                            return {
                                ...subjectClass,
                                rowSpan: cloneCount,
                            }
                        })
                    )
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
                        <Flex gap={4} justify="end">
                            <TreeSelectDepartment
                                className="w-[300px]"
                                rootId={!khoaBoMon ? '0' : orgId}
                                onChange={(val) => handleFilterChange('organization', val)}
                            />
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
                        <FormItem form={form} name={'subjectClass'} hidden />
                        <TableCollapse
                            rowKey="id"
                            scrollable
                            maxHeight={'calc(100vh - 410px)'}
                            filters={filters}
                            setFilters={(value) => {
                                setFilters(value)
                                setCurrentPage(1)
                            }}
                            defaultExpandAll
                            columns={[
                                {
                                    title: 'Mã LMH',
                                    width: 130,
                                    align: 'center',
                                    type: 'input',
                                    render: (_, record) => record?.code || '',
                                },
                                {
                                    title: 'Tên môn',
                                    align: 'center',
                                    type: 'input',
                                    onCell: (record) => ({
                                        rowSpan: record.rowSpan,
                                    }),
                                    render: (_, record) => (
                                        <p
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onOpenDetailSubject({
                                                    subjectVersionId: record.subjectId,
                                                })
                                            }}
                                            className="text-left hover:text-primary cursor-pointer"
                                        >
                                            {record?.subject?.name} ({record.subject?.credit})
                                        </p>
                                    ),
                                },
                                {
                                    title: 'Kíp',
                                    align: 'center',
                                    type: 'select',
                                    width: 60,
                                    options: Object.entries(SUBJECT_CLASS_SCHEDULE_TYPE).map(
                                        ([key, value_]) => {
                                            return {
                                                label: value_,
                                                value: key,
                                            }
                                        }
                                    ),
                                    render: (_, record) =>
                                        SUBJECT_CLASS_SCHEDULE_TYPE[
                                            record.schedule as keyof typeof SUBJECT_CLASS_SCHEDULE_TYPE
                                        ],
                                },
                                {
                                    title: 'Lớp QL',
                                    align: 'center',
                                    width: 100,
                                    render: (_, record) => (
                                        <p>
                                            {record?.fixedClasses?.map((e) => (
                                                <span
                                                    onClick={(ev) => {
                                                        ev.stopPropagation()
                                                        onOpenDetailFixedClass({
                                                            fixedClassId: e.id,
                                                        })
                                                    }}
                                                    className="hover:text-primary cursor-pointer"
                                                >
                                                    {e.code}
                                                </span>
                                            ))}
                                        </p>
                                    ),
                                },
                                {
                                    title: 'Số SV',
                                    width: 80,
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
                                    render: (__, record) => (
                                        <span
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onOpenDetailLecture(record?.mainLecturer?.id || '')
                                            }}
                                            className="hover:text-primary cursor-pointer"
                                        >
                                            {record?.mainLecturer?.userProfile?.fullname ?? '-'}
                                        </span>
                                    ),
                                },
                                {
                                    title: 'Giảng viên 2',
                                    align: 'center',
                                    type: 'input',
                                    render: (__, record) => (
                                        <span
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onOpenDetailLecture(record?.extraLecturer?.id || '')
                                            }}
                                            className="hover:text-primary cursor-pointer"
                                        >
                                            {record?.extraLecturer?.userProfile?.fullname ?? '-'}
                                        </span>
                                    ),
                                },
                                {
                                    title: 'Hình thức thi',
                                    align: 'center',
                                    width: 150,
                                    type: 'select',
                                    options: options,
                                    render: (__, record) => {
                                        const examType = getExamTypeLabel(record?.examType)
                                        return <div>{examType}</div>
                                    },
                                },
                                {
                                    title: 'Khu vực',
                                    align: 'center',
                                    width: 150,
                                    type: 'input',
                                    render: (_, record) =>
                                        record.trainingLocation
                                            ? record.trainingLocation?.name
                                            : '-',
                                },
                                {
                                    title: 'Phòng học',
                                    align: 'center',
                                    width: 200,
                                    render: (_, record) => <div>{record?.room?.name || ''}</div>,
                                },
                                {
                                    title: 'Ngày thi',
                                    align: 'center',
                                    width: 100,
                                    render: (_, record) =>
                                        record.examDate ? formatDate(record.examDate) : '',
                                },
                                // {
                                //     title: 'Hạn nhập điểm TX/ĐK',
                                //     width: 200,
                                //     align: 'center',
                                //     render: (value) => (value ? formatDate(value) : ''),
                                // },
                                // {
                                //     title: 'Hạn nhập điểm thi',
                                //     width: 170,
                                //     align: 'center',
                                //     render: (value) => (value ? formatDate(value) : ''),
                                // },
                                {
                                    title: 'Thời khoá biểu',
                                    width: 150,
                                    align: 'center',
                                    render: (_, record) => {
                                        return record.subjectClassTimes
                                            ?.uniqueByKey?.('dayOfWeek')
                                            ?.map?.((tkb) => {
                                                return (
                                                    <p>
                                                        {tkb.dayOfWeek === 8
                                                            ? 'CN'
                                                            : `T${tkb.dayOfWeek}`}{' '}
                                                        - {tkb.startPeriod} - {tkb.endPeriod}
                                                    </p>
                                                )
                                            })
                                    },
                                },
                                // {
                                //     title: 'Số SV tối đa',
                                //     width: 150,
                                //     align: 'center',
                                //     type: 'order',
                                //     distinctFilters: ['credit', 'subjectClassStudent'],
                                // },
                                // {
                                //     title: <Tooltip title="Đơn vị phụ trách">ĐVPT</Tooltip>,
                                //     width: 80,
                                //     align: 'center',
                                //     type: 'tree_select',
                                //     options: treeData,
                                //     render: (_, record) =>
                                //         record.subject?.managementOrganization?.sMa || '',
                                // },
                                // {
                                //     title: 'Điểm bằng nhau',
                                //     width: 150,
                                //     align: 'center',
                                //     render: (value) => (
                                //         <Checkbox checked={value.subjectEquivalentType} disabled />
                                //     ),
                                // },
                                ...(canXemTatCa && !khoaBoMon
                                    ? [
                                          {
                                              title: 'Thao tác',
                                              width: 120,
                                              align: 'center' as const,
                                              render: (_: any, record: SubjectClass) => {
                                                  const id = record?.id
                                                  if (id) {
                                                      return (
                                                          <Row className="justify-center gap-2">
                                                              {can(
                                                                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_GIAO_DUC,
                                                                  'XEM_CHI_TIET'
                                                              ) && (
                                                                  <ViewIcon
                                                                      onClick={onOpenEditSubjectClass.bind(
                                                                          null,
                                                                          {
                                                                              id,
                                                                              mode: 'view',
                                                                          }
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
                                                                          onConfirm: () =>
                                                                              handleDelete(id),
                                                                      }}
                                                                      disabled={
                                                                          record?.status !==
                                                                          $Enums.SubjectClassStatus
                                                                              .DRAFT
                                                                      }
                                                                  />
                                                              )}
                                                          </Row>
                                                      )
                                                  }
                                                  return ''
                                              },
                                          },
                                      ]
                                    : []),
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

ThoiKhoaBieu.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
