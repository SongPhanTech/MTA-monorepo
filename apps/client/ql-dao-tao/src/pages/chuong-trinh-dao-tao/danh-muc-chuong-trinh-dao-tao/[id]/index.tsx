import TableCollapse from '@components/commons/tableCollapse'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import ViewIcon from '@components/icons/view'
import ImportCurriculumVersionModal from '@components/modal/import-ctdt'
import type { FilterProps } from '@constants/type'
import { useCloneCurriculumVersion } from '@hooks/copyCurriculumVersion'
import { useExamTypeOptions } from '@hooks/examType'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { buildOrgTree } from '@lib/utils'
import { emptyObjectIf } from '@workspace/constant'

import type { Prisma, SubjectVersion } from '@workspace/db/client'
import { $Enums, type TrainingBlockSubject } from '@workspace/db/client'
import {
    useDeleteManyTrainingBlockSubject,
    useDeleteTrainingBlockOnCurriculumVersion,
    useDeleteTrainingBlockSubject,
    useFindManyDM_DonVi,
    useFindManyTrainingBlockOnCurriculumVersion,
    useFindUniqueCurriculumVersion,
} from '@workspace/db/hooks'
import { whereOrganization } from '@workspace/libs/constants'
import { getMinioUrl } from '@workspace/libs/utils'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION, ROUTER_PATH } from '@workspace/router'
import { cn } from '@workspace/ui/lib/utils'
import { Button, Col, Divider, Flex, message, Row, Tag, Tooltip } from 'antd'
import { BookPlus, CopyPlus, Download, FileUp } from 'lucide-react'
import { useRouter } from 'next/router'
import type React from 'react'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import CreateIcon from '../../../../components/icons/create'
export default function TrainingProgramSubjects() {
    const { can } = useAbility()
    const router = useRouter()
    const id = router.query.id as string
    const [importModalVisible, setImportModalVisible] = useState(false)
    const [filters, setFilters] = useState<FilterProps>({
        organization: undefined,
        code: '',
        name: '',
        trainingMajors: undefined,
        semester: undefined,
        examType: undefined,
    })

    const { data: initialValue } = useFindUniqueCurriculumVersion(
        {
            where: { id },
            include: {
                curriculum: {
                    include: {
                        managementOrganization: true,
                        trainingMajor: true,
                    },
                },
                trainingBlocks: {
                    include: {
                        subjects: {
                            include: {
                                subject: {
                                    include: {
                                        subjectClass: {
                                            take: 1,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                trainingTime: true,
                documentFiles: true,
            },
        },
        { enabled: !!id }
    )
    const { options, getExamTypeLabel } = useExamTypeOptions()

    const isLocked = initialValue?.isLock ?? false

    const isFiltering = useMemo(() => {
        return Object.values(filters).some((value) => !!value)
    }, [filters])

    const where: Prisma.TrainingBlockOnCurriculumVersionWhereInput = useMemo(
        () =>
            isFiltering
                ? {
                      subjects: {
                          some: {
                              subject: {
                                  ...(filters.name
                                      ? {
                                            name: {
                                                contains: filters.name,
                                                mode: 'insensitive',
                                            },
                                        }
                                      : {}),
                                  ...(filters.code
                                      ? {
                                            code: {
                                                contains: filters.code,
                                                mode: 'insensitive',
                                            },
                                        }
                                      : {}),
                                  ...emptyObjectIf(
                                      {
                                          managementOrganizationId: {
                                              in: filters.organization,
                                          },
                                      },
                                      !!filters.organization
                                  ),
                                  ...emptyObjectIf(
                                      {
                                          examType: {
                                              in: filters.examType,
                                          },
                                      },
                                      !!filters.examType
                                  ),
                              },
                          },
                      },
                  }
                : {},
        [filters, isFiltering]
    )

    const { data = [], refetch } = useFindManyTrainingBlockOnCurriculumVersion({
        where: {
            curriculumVersionId: id,
            curriculumVersion: {
                deletedAt: null,
            },
            ...where,
        },
        include: {
            subjects: {
                where: {
                    subject: {
                        ...(filters.name
                            ? {
                                  name: {
                                      contains: filters.name,
                                      mode: 'insensitive',
                                  },
                              }
                            : {}),
                        ...(filters.code
                            ? {
                                  code: {
                                      contains: filters.code,
                                      mode: 'insensitive',
                                  },
                              }
                            : {}),
                        ...emptyObjectIf(
                            {
                                managementOrganizationId: {
                                    in: filters.organization,
                                },
                            },
                            !!filters.organization
                        ),
                        ...emptyObjectIf(
                            {
                                examType: {
                                    in: filters.examType,
                                },
                            },
                            !!filters.examType
                        ),
                        ...(filters.creditCmp
                            ? {
                                  credit: {
                                      ...(filters.creditCmp.gte
                                          ? {
                                                gte: Number(filters.creditCmp.gte),
                                            }
                                          : {}),
                                      ...(filters.creditCmp.lte
                                          ? {
                                                lte: Number(filters.creditCmp.lte),
                                            }
                                          : {}),
                                  },
                              }
                            : {}),
                        ...(filters.periodCmp
                            ? {
                                  period: {
                                      ...(filters.periodCmp.gte
                                          ? {
                                                gte: Number(filters.periodCmp.gte),
                                            }
                                          : {}),
                                      ...(filters.periodCmp.lte
                                          ? {
                                                lte: Number(filters.periodCmp.lte),
                                            }
                                          : {}),
                                  },
                              }
                            : {}),
                        ...(filters.numberOfTheoryCmp
                            ? {
                                  numberOfTheory: {
                                      ...(filters.numberOfTheoryCmp.gte
                                          ? {
                                                gte: Number(filters.numberOfTheoryCmp.gte),
                                            }
                                          : {}),
                                      ...(filters.numberOfTheoryCmp.lte
                                          ? {
                                                lte: Number(filters.numberOfTheoryCmp.lte),
                                            }
                                          : {}),
                                  },
                              }
                            : {}),
                        ...(filters.numberOfPracticalCmp
                            ? {
                                  numberOfPractical: {
                                      ...(filters.numberOfPracticalCmp.gte
                                          ? {
                                                gte: Number(filters.numberOfPracticalCmp.gte),
                                            }
                                          : {}),
                                      ...(filters.numberOfPracticalCmp.lte
                                          ? {
                                                lte: Number(filters.numberOfPracticalCmp.lte),
                                            }
                                          : {}),
                                  },
                              }
                            : {}),
                        ...(filters.numberOfSelfStudyCmp
                            ? {
                                  numberOfSelfStudy: {
                                      ...(filters.numberOfSelfStudyCmp.gte
                                          ? {
                                                gte: Number(filters.numberOfSelfStudyCmp.gte),
                                            }
                                          : {}),
                                      ...(filters.numberOfSelfStudyCmp.lte
                                          ? {
                                                lte: Number(filters.numberOfSelfStudyCmp.lte),
                                            }
                                          : {}),
                                  },
                              }
                            : {}),
                        ...(filters.numberOfPracticeCmp
                            ? {
                                  numberOfPractice: {
                                      ...(filters.numberOfPracticeCmp.gte
                                          ? {
                                                gte: Number(filters.numberOfPracticeCmp.gte),
                                            }
                                          : {}),
                                      ...(filters.numberOfPracticeCmp.lte
                                          ? {
                                                lte: Number(filters.numberOfPracticeCmp.lte),
                                            }
                                          : {}),
                                  },
                              }
                            : {}),
                        ...(filters.numberOfReviewCmp
                            ? {
                                  numberOfReview: {
                                      ...(filters.numberOfReviewCmp.gte
                                          ? {
                                                gte: Number(filters.numberOfReviewCmp.gte),
                                            }
                                          : {}),
                                      ...(filters.numberOfReviewCmp.lte
                                          ? {
                                                lte: Number(filters.numberOfReviewCmp.lte),
                                            }
                                          : {}),
                                  },
                              }
                            : {}),
                        ...(filters.numberOfExamCmp
                            ? {
                                  numberOfExam: {
                                      ...(filters.numberOfExamCmp.gte
                                          ? {
                                                gte: Number(filters.numberOfExamCmp.gte),
                                            }
                                          : {}),
                                      ...(filters.numberOfExamCmp.lte
                                          ? {
                                                lte: Number(filters.numberOfExamCmp.lte),
                                            }
                                          : {}),
                                  },
                              }
                            : {}),
                    },
                    ...(filters.semesterCmp
                        ? {
                              semester: {
                                  ...(filters.semesterCmp.gte
                                      ? {
                                            gte: Number(filters.semesterCmp.gte),
                                        }
                                      : {}),
                                  ...(filters.semesterCmp.lte
                                      ? {
                                            lte: Number(filters.semesterCmp.lte),
                                        }
                                      : {}),
                              },
                          }
                        : {}),
                },
                include: {
                    planTrainingSubjects: { select: { id: true } },
                    subject: {
                        include: {
                            subject: {
                                include: {
                                    managementOrganization: true,
                                },
                            },
                            subjectClass: {
                                where: { deletedAt: null, active: true },
                                select: { id: true },
                                take: 1,
                            },
                        },
                    },
                },
            },
            trainingBlock: true,
        },
        orderBy: {
            priority: 'asc',
        },
    })

    const { data: manageOrgData = [] } = useFindManyDM_DonVi({
        where: whereOrganization,
        orderBy: [{ iSTT: 'asc' }, { sTen: 'asc' }],
    })

    const { onOpen: onOpenTrainingBlockSubject } = useDisclosure<{
        trainingBlockOnCurriculumVersionId: string
        trainingBlockSubjectId: string
    }>({
        tag: 'PutTrainingBlockSubject',
    })

    const { onOpen: onOpenTrainingBlock } = useDisclosure<{
        curriculumVersionId: string
    }>({
        tag: 'PutTrainingBlockOnCurriculumVersion',
        onClose: () => {
            refetch()
        },
    })

    const { onOpen: onOpenSubjectVersion } = useDisclosure<{
        subjectId: string
        subjectVersionId?: string
        isLocked?: boolean
    }>({
        tag: 'PutVersionSubjectModal',
    })

    const handleModalSubjectVersion = (
        subjectId: string,
        subjectVersionId: string,
        isLocked: boolean
    ) => {
        onOpenSubjectVersion({ subjectId, subjectVersionId, isLocked })
    }

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: deleteTrainingBlockOnCurriculumVersion } =
        useDeleteTrainingBlockOnCurriculumVersion()
    const { mutateAsync: deleteManyTrainingBlockSubject } = useDeleteManyTrainingBlockSubject()
    async function handleDeleteTrainingBlockOnCurriculumVersion(id: string) {
        try {
            showSpinner()
            await deleteManyTrainingBlockSubject({
                where: {
                    trainingBlockOnCurriculumVersionId: id,
                },
            })
            await deleteTrainingBlockOnCurriculumVersion({
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

    const { mutateAsync: deleteTrainingBlockSubject } = useDeleteTrainingBlockSubject()
    async function handleDeleteTrainingBlockSubject(id: string) {
        try {
            showSpinner()
            await deleteTrainingBlockSubject({
                where: { id },
            })
            message.success('Xóa thành công')
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

    const treeData = buildOrgTree(manageOrgData)

    const { handleCloneCurriculumVersion } = useCloneCurriculumVersion()

    return (
        <div>
            <Divider orientation="left" orientationMargin={0} className="m-0 p-0">
                <span className="flex items-center gap-2">
                    CTĐT toàn khoá:{' '}
                    {[
                        initialValue?.code,
                        initialValue?.name,
                        initialValue?.curriculum?.trainingMajor?.name,
                        initialValue?.curriculum?.managementOrganization?.sTen,
                    ]
                        .filter(Boolean)
                        .join(' - ')}
                    {isLocked && (
                        <Tag
                            color="error"
                            style={{
                                fontSize: '14',
                            }}
                        >
                            Đã khoá CTĐT
                        </Tag>
                    )}
                </span>
            </Divider>
            <Row gutter={[0, 0]}>
                <Col span={24}>
                    <Row gutter={[0, 0]} align="top" justify="end">
                        <Col span={12}>
                            <Flex justify="end" gap={4} className="m-0 p-0">
                                {can(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_MUC_CHUONG_TRINH_DAO_TAO,
                                    'NHAP_EXCEL'
                                ) && (
                                    <>
                                        <Button
                                            href={getMinioUrl('mta/template/MAU-NHAP_CTDT.xlsx')}
                                            className="text-primary border-primary mr-2"
                                            disabled={isLocked}
                                        >
                                            <Download />
                                            Mẫu nhập CTĐT
                                        </Button>
                                        <Button
                                            onClick={() => !isLocked && setImportModalVisible(true)}
                                            className="text-primary border-primary mr-2"
                                            disabled={isLocked}
                                        >
                                            <FileUp />
                                            Nhập dữ liệu bằng excel
                                        </Button>

                                        <ImportCurriculumVersionModal
                                            visible={importModalVisible}
                                            onCancel={() => setImportModalVisible(false)}
                                            onSuccess={() => {
                                                refetch()
                                                setImportModalVisible(false)
                                            }}
                                        />
                                    </>
                                )}

                                {can(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_MUC_CHUONG_TRINH_DAO_TAO,
                                    'THEM'
                                ) && (
                                    <Tooltip title="Sao chép phiên bản CTĐT">
                                        <Button
                                            onClick={() =>
                                                initialValue &&
                                                handleCloneCurriculumVersion(initialValue.id)
                                            }
                                            className="text-primary border-primary mr-2"
                                            disabled={!initialValue || isLocked}
                                        >
                                            <CopyPlus />
                                            Sao chép
                                        </Button>
                                    </Tooltip>
                                )}

                                {can(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_MUC_CHUONG_TRINH_DAO_TAO,
                                    'SUA'
                                ) && (
                                    <Tooltip title="Cập nhật khối kiến thức cho CTĐT">
                                        <Button
                                            onClick={() =>
                                                onOpenTrainingBlock({
                                                    curriculumVersionId: initialValue?.id as string,
                                                })
                                            }
                                            type="primary"
                                            disabled={isLocked}
                                        >
                                            <BookPlus />
                                            Sửa KKT
                                        </Button>
                                    </Tooltip>
                                )}
                            </Flex>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <div className="flex gap-2">
                        <p className="flex gap-2 items-center">
                            <p className="w-4 h-4 bg-white border border-black" /> Môn bắt buộc
                        </p>
                        <p className="flex gap-2 items-center">
                            <p className="w-4 h-4 bg-yellow-200" /> Môn tự chọn
                        </p>
                        <p className="flex gap-2 items-center">
                            <p className="w-4 h-4 bg-orange-300" /> Môn điều kiện
                        </p>
                        <p className="flex gap-2 items-center">
                            <p className="w-4 h-4 bg-red-300" /> Môn tốt nghiệp
                        </p>
                    </div>
                    <TableCollapse
                        scrollable
                        maxHeight={'calc(100vh - 305px)'}
                        rowKey="key"
                        headerTitleKey={({ trainingBlock }) =>
                            `${[trainingBlock?.name].filter(Boolean).join(' - ')}`
                        }
                        onRow={(record) => {
                            const isParent = Array.isArray(record?.subjects)
                            if (isParent) {
                                return {}
                            }
                            const subject = record as unknown as TrainingBlockSubject
                            return {
                                className: cn(
                                    subject.type === $Enums.SubjectRequirementType.Mandatory &&
                                        'bg-white',
                                    subject.type === $Enums.SubjectRequirementType.Optional &&
                                        'bg-yellow-100',
                                    !subject.useForFinalScore && 'bg-orange-300',
                                    subject.graduation && 'bg-red-300'
                                ),
                            }
                        }}
                        headerColumn={[
                            {
                                colSpan: 1,
                            },
                            {
                                render: (_, record) => (
                                    <p className="font-bold">{record?.trainingBlock?.name}</p>
                                ),
                                colSpan: 2,
                            },
                            {
                                render: (_, record) => (
                                    <p className="font-bold text-center">
                                        {record.subjects.reduce(
                                            (sum, s) => sum + (s.subject?.period ?? 0),
                                            0
                                        )}
                                    </p>
                                ),
                                colSpan: 1,
                            },
                            {
                                render: (_, record) => (
                                    <p className="text-center font-bold">
                                        {record.subjects.reduce(
                                            (sum, s) => sum + s.subject.credit,
                                            0
                                        )}
                                    </p>
                                ),
                                colSpan: 1,
                            },
                            {
                                render: (_, record) => (
                                    <p className="text-center font-bold">
                                        {record?.electiveCreditsRequired}
                                    </p>
                                ),
                                colSpan: 1,
                            },
                            {
                                colSpan: 1,
                            },
                            {
                                colSpan: 1,
                            },
                            {
                                colSpan: 1,
                            },
                            {
                                render: (_, record) => (
                                    <p className="font-bold">
                                        {record.subjects.reduce(
                                            (sum, s) => sum + (s.subject?.numberOfTheory ?? 0),
                                            0
                                        )}
                                    </p>
                                ),
                                colSpan: 1,
                            },
                            {
                                render: (_, record) => (
                                    <p className="font-bold">
                                        {record.subjects.reduce(
                                            (sum, s) => sum + (s.subject.numberOfPractical ?? 0),
                                            0
                                        )}
                                    </p>
                                ),
                                colSpan: 1,
                            },
                            {
                                render: (_, record) => (
                                    <p className="font-bold">
                                        {record.subjects.reduce(
                                            (sum, s) => sum + (s.subject.numberOfSelfStudy ?? 0),
                                            0
                                        )}
                                    </p>
                                ),
                                colSpan: 1,
                            },
                            {
                                render: (_, record) => (
                                    <p className="font-bold">
                                        {record.subjects.reduce(
                                            (sum, s) => sum + (s.subject.numberOfPractice ?? 0),
                                            0
                                        )}
                                    </p>
                                ),
                                colSpan: 1,
                            },
                            {
                                render: (_, record) => (
                                    <p className="font-bold">
                                        {record.subjects.reduce(
                                            (sum, s) => sum + (s.subject.numberOfReview ?? 0),
                                            0
                                        )}
                                    </p>
                                ),
                                colSpan: 1,
                            },
                            {
                                render: (_, record) => (
                                    <p className="font-bold">
                                        {record.subjects.reduce(
                                            (sum, s) => sum + (s.subject.numberOfExam ?? 0),
                                            0
                                        )}
                                    </p>
                                ),
                                colSpan: 1,
                            },
                            {
                                colSpan: 1,
                            },
                            {
                                colSpan: 1,
                                render: (_, record) => {
                                    const hasPlanTraining = !!record?.subjects.some(
                                        (s) => !!s?.planTrainingSubjects?.length
                                    )
                                    return (
                                        <div className="flex gap-2.5 justify-center items-center">
                                            {can(
                                                QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_MUC_CHUONG_TRINH_DAO_TAO,
                                                'SUA'
                                            ) && (
                                                <EditIcon
                                                    disabled={isLocked}
                                                    onClick={() =>
                                                        onOpenTrainingBlock({
                                                            curriculumVersionId:
                                                                initialValue?.id as string,
                                                        })
                                                    }
                                                />
                                            )}
                                            {can(
                                                QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_MUC_CHUONG_TRINH_DAO_TAO,
                                                'THEM'
                                            ) && (
                                                <CreateIcon
                                                    title={'Thêm môn học'}
                                                    disabled={isLocked}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onOpenTrainingBlockSubject({
                                                            trainingBlockOnCurriculumVersionId:
                                                                record.id,
                                                            trainingBlockSubjectId: '',
                                                        })
                                                    }}
                                                />
                                            )}

                                            {can(
                                                QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_MUC_CHUONG_TRINH_DAO_TAO,
                                                'XOA'
                                            ) && (
                                                <DeleteIcon
                                                    disabled={isLocked || hasPlanTraining}
                                                    popConfirm={{
                                                        onConfirm: () =>
                                                            handleDeleteTrainingBlockOnCurriculumVersion(
                                                                id
                                                            ),
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            )}
                                        </div>
                                    )
                                },
                            },
                        ]}
                        childrenFieldName="subjects"
                        defaultExpandAll
                        filters={filters}
                        setFilters={setFilters}
                        columns={[
                            {
                                title: 'Mã MH',
                                dataIndex: 'code',
                                width: 120,
                                align: 'center',
                                type: 'input',
                                render: (__, record: { subject?: SubjectVersion }) => {
                                    return record?.subject?.code ? record?.subject?.code : ''
                                },
                            },
                            {
                                title: 'Tên môn học',
                                dataIndex: 'name',
                                type: 'input',
                                render: (__, record: { subject?: SubjectVersion }) => {
                                    return record?.subject?.name
                                },
                            },
                            {
                                title: (
                                    <Tooltip title="Số tiết thời khóa biểu">
                                        <span>Số tiết TKB</span>
                                    </Tooltip>
                                ),
                                dataIndex: 'periodCmp',
                                width: 120,
                                align: 'center',
                                type: 'cmp',
                                distinctFilters: [
                                    'credit',
                                    'semester',
                                    'numberOfTheory',
                                    'numberOfPractical',
                                    'numberOfSelfStudy',
                                    'numberOfPractice',
                                    'numberOfReview',
                                    'numberOfExam',
                                    'numberOfOther',
                                ],
                                render: (__, record: { subject?: SubjectVersion }) => {
                                    return record?.subject?.period
                                },
                            },
                            {
                                title: 'Số TC',
                                dataIndex: 'creditCmp',
                                width: 80,
                                type: 'cmp',
                                align: 'center',
                                distinctFilters: [
                                    'semester',
                                    'period',
                                    'numberOfTheory',
                                    'numberOfPractical',
                                    'numberOfSelfStudy',
                                    'numberOfPractice',
                                    'numberOfReview',
                                    'numberOfExam',
                                    'numberOfOther',
                                ],
                                render: (__, record: { subject?: SubjectVersion }) => {
                                    return record?.subject?.credit
                                },
                            },
                            {
                                title: (
                                    <Tooltip title="Số tín chỉ tự chọn">
                                        <span>TCTC</span>
                                    </Tooltip>
                                ),
                                width: 80,
                                align: 'center',
                            },
                            {
                                title: (
                                    <Tooltip title="Đơn vị phụ trách">
                                        <span>ĐVPT</span>
                                    </Tooltip>
                                ),
                                dataIndex: 'organization',
                                width: 100,
                                align: 'center',
                                type: 'tree_select',
                                options: treeData,
                                render: (_, record) => {
                                    return record?.subject?.subject?.managementOrganization?.sMa
                                },
                            },
                            {
                                title: (
                                    <Tooltip title="Học kỳ dự kiến">
                                        <span>HKDK</span>
                                    </Tooltip>
                                ),
                                dataIndex: 'semesterCmp',
                                width: 80,
                                type: 'cmp',
                                align: 'center',
                                render: (__, record) => record?.semester,
                            },
                            {
                                title: (
                                    <Tooltip title="Học kỳ giảng dạy">
                                        <span>HKGD</span>
                                    </Tooltip>
                                ),
                                width: 80,
                                type: 'cmp',
                                align: 'center',
                            },
                            {
                                title: <Tooltip title="Số tiết lý thuyết">LT</Tooltip>,
                                dataIndex: 'numberOfTheoryCmp',
                                width: 80,
                                type: 'cmp',
                                align: 'center',
                                distinctFilters: [
                                    'credit',
                                    'semester',
                                    'period',
                                    'numberOfPractical',
                                    'numberOfSelfStudy',
                                    'numberOfPractice',
                                    'numberOfReview',
                                    'numberOfExam',
                                    'numberOfOther',
                                ],
                                render: (__, record: { subject?: SubjectVersion }) => {
                                    return record?.subject?.numberOfTheory
                                },
                            },
                            {
                                title: <Tooltip title="Số tiết bài tập">BT</Tooltip>,
                                dataIndex: 'numberOfPracticalCmp',
                                type: 'cmp',
                                width: 80,
                                align: 'center',
                                distinctFilters: [
                                    'credit',
                                    'semester',
                                    'period',
                                    'numberOfTheory',
                                    'numberOfSelfStudy',
                                    'numberOfPractice',
                                    'numberOfReview',
                                    'numberOfExam',
                                    'numberOfOther',
                                ],
                                render: (__, record: { subject?: SubjectVersion }) => {
                                    return record?.subject?.numberOfPractical
                                },
                            },
                            {
                                title: <Tooltip title="Số tiết thảo luận">ThL</Tooltip>,
                                dataIndex: 'numberOfSelfStudyCmp',
                                width: 80,
                                align: 'center',
                                type: 'cmp',
                                distinctFilters: [
                                    'credit',
                                    'semester',
                                    'period',
                                    'numberOfTheory',
                                    'numberOfPractical',
                                    'numberOfPractice',
                                    'numberOfReview',
                                    'numberOfExam',
                                    'numberOfOther',
                                ],
                                render: (__, record: { subject?: SubjectVersion }) => {
                                    return record?.subject?.numberOfSelfStudy
                                },
                            },
                            {
                                title: (
                                    <Tooltip title="Số tiết thí nghiệm, thực hành">TN, TH</Tooltip>
                                ),
                                dataIndex: 'numberOfPracticeCmp',
                                width: 90,
                                align: 'center',
                                type: 'cmp',
                                distinctFilters: [
                                    'credit',
                                    'semester',
                                    'period',
                                    'numberOfTheory',
                                    'numberOfPractical',
                                    'numberOfSelfStudy',
                                    'numberOfReview',
                                    'numberOfExam',
                                    'numberOfOther',
                                ],
                                render: (__, record: { subject?: SubjectVersion }) => {
                                    return record?.subject?.numberOfPractice
                                },
                            },
                            {
                                title: <Tooltip title="Số tiết ôn tập">Ôn</Tooltip>,
                                dataIndex: 'numberOfReviewCmp',
                                width: 60,
                                align: 'center',
                                type: 'cmp',
                                distinctFilters: [
                                    'credit',
                                    'semester',
                                    'period',
                                    'numberOfTheory',
                                    'numberOfPractical',
                                    'numberOfSelfStudy',
                                    'numberOfPractice',
                                    'numberOfExam',
                                    'numberOfOther',
                                ],
                                render: (__, record: { subject?: SubjectVersion }) => {
                                    return record?.subject?.numberOfReview
                                },
                            },
                            {
                                title: <Tooltip title="Số tiết kiểm tra, thi">KT, Thi</Tooltip>,
                                dataIndex: 'numberOfExamCmp',
                                width: 90,
                                align: 'center',
                                type: 'cmp',
                                distinctFilters: [
                                    'credit',
                                    'semester',
                                    'period',
                                    'numberOfTheory',
                                    'numberOfPractical',
                                    'numberOfSelfStudy',
                                    'numberOfPractice',
                                    'numberOfReview',
                                    'numberOfOther',
                                ],
                                render: (__, record: { subject?: SubjectVersion }) => {
                                    return record?.subject?.numberOfExam
                                },
                            },
                            {
                                title: 'Thi',
                                dataIndex: 'examType',
                                width: 90,
                                align: 'center',
                                type: 'select',
                                options: options,
                                render: (__, record: { subject?: SubjectVersion }) =>
                                    getExamTypeLabel(record?.subject?.examType),
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                render: (_, record) => {
                                    const hasPlanTraining = !!record?.planTrainingSubjects?.length

                                    if (record.trainingBlockOnCurriculumVersionId) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                {can(
                                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_SACH_MON_HOC,
                                                    'XEM'
                                                ) && (
                                                    <ViewIcon
                                                        disabled={isLocked}
                                                        onClick={() =>
                                                            handleModalSubjectVersion(
                                                                '',
                                                                record.subjectId,
                                                                !can(
                                                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_SACH_MON_HOC,
                                                                    'SUA'
                                                                )
                                                            )
                                                        }
                                                        className="text-sm text-blue-700 cursor-pointer"
                                                    />
                                                )}

                                                <EditIcon
                                                    disabled={isLocked}
                                                    onClick={(_e) => {
                                                        onOpenTrainingBlockSubject({
                                                            trainingBlockOnCurriculumVersionId:
                                                                record?.trainingBlockOnCurriculumVersionId,
                                                            trainingBlockSubjectId: record?.id,
                                                        })
                                                    }}
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />

                                                {can(
                                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_SACH_MON_HOC,
                                                    'XOA'
                                                ) &&
                                                    (hasPlanTraining || isLocked ? (
                                                        <Tooltip
                                                            title={
                                                                isLocked
                                                                    ? undefined
                                                                    : 'Môn học đã được đưa vào kế hoạch giảng dạy, không thể xóa.'
                                                            }
                                                        >
                                                            <span className="opacity-40">
                                                                <DeleteIcon disabled />
                                                            </span>
                                                        </Tooltip>
                                                    ) : (
                                                        <DeleteIcon
                                                            popConfirm={{
                                                                title: 'Xóa môn học khỏi CTĐT',
                                                                description: (
                                                                    <div>
                                                                        <p>
                                                                            <strong>
                                                                                Bạn có chắc chắn
                                                                                muốn xóa môn học này
                                                                                khỏi chương trình
                                                                                đào tạo?
                                                                            </strong>
                                                                        </p>
                                                                        <br />
                                                                        <p>
                                                                            <strong>Lưu ý:</strong>
                                                                        </p>
                                                                        <ul
                                                                            style={{
                                                                                paddingInline:
                                                                                    '10px',
                                                                                marginTop: '8px',
                                                                            }}
                                                                        >
                                                                            <li>
                                                                                Môn học chỉ bị xóa
                                                                                khỏi CTĐT này, không
                                                                                ảnh hưởng đến CTĐT
                                                                                khác
                                                                            </li>
                                                                            <li>
                                                                                Nếu môn học đã được
                                                                                đưa vào kế hoạch đào
                                                                                tạo hoặc đã có lớp
                                                                                học, việc xóa có thể
                                                                                gây ảnh hưởng
                                                                            </li>
                                                                            <li>
                                                                                Nếu sinh viên đã
                                                                                đăng ký và có điểm,
                                                                                cần xem xét kỹ trước
                                                                                khi xóa
                                                                            </li>
                                                                        </ul>
                                                                    </div>
                                                                ),
                                                                okText: 'Xác nhận xóa',
                                                                cancelText: 'Hủy',
                                                                okType: 'danger',
                                                                onConfirm: () =>
                                                                    handleDeleteTrainingBlockSubject(
                                                                        record.id
                                                                    ),
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    ))}
                                            </Row>
                                        )
                                    }
                                    return ''
                                },
                            },
                        ]}
                        data={data}
                        // headerRight={({ id }) => (
                        //     <div className="flex gap-2.5 w-[80px] justify-center items-center">
                        //         <CreateIcon
                        //             title={'Thêm môn học'}
                        //             onClick={(e) => {
                        //                 e.stopPropagation()
                        //                 onOpenTrainingBlockSubject({
                        //                     curriculumVersionId: id,
                        //                     trainingBlockOnCurriculumVersionId: id,
                        //                     trainingBlockSubjectId: '',
                        //                 })
                        //             }}
                        //         />

                        //         <DeleteIcon
                        //             popConfirm={{
                        //                 onConfirm: () =>
                        //                     handleDeleteTrainingBlockOnCurriculumVersion(id),
                        //             }}
                        //             onClick={(e) => e.stopPropagation()}
                        //         />
                        //     </div>
                        // )}
                        pagination={false}
                    />
                </Col>
            </Row>
        </div>
    )
}

TrainingProgramSubjects.getLayout = function getLayout(page: React.ReactElement) {
    return (
        <DefaultLayout
            breadcrumbList={[
                { title: 'Chương trình đào tạo' },
                {
                    title: 'Quản lý CTĐT',
                    href: ROUTER_PATH.QL_DAO_TAO.CHUONG_TRINH_DAO_TAO_DANH_MUC_CHUONG_TRINH_DAO_TAO,
                },
                { title: 'Chi tiết CTĐT toàn khoá' },
            ]}
        >
            {page}
        </DefaultLayout>
    )
}
