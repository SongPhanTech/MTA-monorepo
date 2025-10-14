import TableCollapse from '@components/commons/tableCollapse'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import ImportCurriculumVersionModal from '@components/modal/import-ctdt'
import type { FilterProps } from '@constants/type'
import { useCloneCurriculumVersion } from '@hooks/copyCurriculumVersion'
import { useExamTypeOptions } from '@hooks/examType'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { buildOrgTree } from '@lib/utils'
import { emptyObjectIf } from '@workspace/constant'
import type {
    CurriculumVersion,
    DocumentFile,
    Prisma,
    SubjectVersion,
    TrainingBlockOnCurriculumVersion,
} from '@workspace/db'
import {
    useDeleteManyTrainingBlockSubject,
    useDeleteTrainingBlockOnCurriculumVersion,
    useFindManyDM_DonVi,
    useFindManyTrainingBlockOnCurriculumVersion,
    useFindUniqueCurriculumVersion,
    useUpdateTrainingBlockSubject,
} from '@workspace/db/hooks'
import { useAbility } from '@workspace/permissions/hooks'
import { QL_DAO_TAO_PERMISSION, ROUTER_PATH } from '@workspace/router'
import { Button, Checkbox, Col, Divider, Flex, message, Row, Tag, Tooltip } from 'antd'
import { BookPlus, CopyPlus, FileDown, FileUp } from 'lucide-react'
import { useRouter } from 'next/router'
import type React from 'react'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { env } from '@/env'
import CreateIcon from '../../../../components/icons/create'
export default function TrainingProgramSubjects() {
    const { can, canSome } = useAbility()
    const router = useRouter()
    const id = router.query.id as string
    const [importModalVisible, setImportModalVisible] = useState(false)
    const [filters, setFilters] = useState<FilterProps>({
        organization: undefined,
        code: '',
        name: '',
        trainingMajors: undefined,
        credit: undefined,
        semester: undefined,
        period: undefined,
        numberOfTheory: undefined,
        numberOfPractical: undefined,
        numberOfSelfStudy: undefined,
        numberOfPractice: undefined,
        numberOfReview: undefined,
        numberOfExam: undefined,
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
                                subject: true,
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
                    },
                },
                include: {
                    subject: {
                        include: {
                            managementOrganization: {
                                include: {
                                    trainingMajors: true,
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
                                subject: {
                                    period: filters.period,
                                },
                            },
                        ],
                        !!filters.period
                    ),
                    ...emptyObjectIf(
                        [
                            {
                                subject: {
                                    numberOfTheory: filters.numberOfTheory,
                                },
                            },
                        ],
                        !!filters.numberOfTheory
                    ),
                    ...emptyObjectIf(
                        [
                            {
                                subject: {
                                    numberOfSelfStudy: filters.numberOfSelfStudy,
                                },
                            },
                        ],
                        !!filters.numberOfSelfStudy
                    ),
                    ...emptyObjectIf(
                        [
                            {
                                subject: {
                                    numberOfPractical: filters.numberOfPractical,
                                },
                            },
                        ],
                        !!filters.numberOfPractical
                    ),
                    ...emptyObjectIf(
                        [
                            {
                                subject: {
                                    numberOfPractice: filters.numberOfPractice,
                                },
                            },
                        ],
                        !!filters.numberOfPractice
                    ),
                    ...emptyObjectIf(
                        [
                            {
                                subject: {
                                    numberOfReview: filters.numberOfReview,
                                },
                            },
                        ],
                        !!filters.numberOfReview
                    ),
                    ...emptyObjectIf(
                        [
                            {
                                subject: {
                                    numberOfExam: filters.numberOfExam,
                                },
                            },
                        ],
                        !!filters.numberOfExam
                    ),
                    {
                        semester: filters.semester ? filters.semester : 'asc',
                    },
                ],
            },
            trainingBlock: true,
        },
        orderBy: {
            priority: 'asc',
        },
    })

    const { data: manageOrgData = [] } = useFindManyDM_DonVi({ orderBy: { sTen: 'asc' } })
    // const { data: trainingMajorData = [] } = useFindManyTrainingMajor({
    //     orderBy: { name: 'asc' },
    // })

    const { onOpen: onOpenTrainingBlockSubject, onClose } = useDisclosure<{
        trainingBlockOnCurriculumVersionId: string
        trainingBlockSubjectId: string
    }>({
        tag: 'PutTrainingBlockSubject',
    })

    const { onOpen: onOpenTrainingBlock, onClose: onCloseTrainingBlock } = useDisclosure<{
        curriculumVersionId: string
    }>({
        tag: 'PutTrainingBlockOnCurriculumVersion',
        onClose: () => {
            refetch()
        },
    })

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

    const { mutateAsync: updateTrainingBlockSubject } = useUpdateTrainingBlockSubject()
    async function handleDeleteTrainingBlockSubject(id: string) {
        try {
            showSpinner()
            await updateTrainingBlockSubject({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
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
            <Divider orientation="left" orientationMargin={0}>
                CTĐT toàn khoá:{' '}
                {[
                    initialValue?.code,
                    initialValue?.name,
                    initialValue?.curriculum?.trainingMajor?.name,
                    initialValue?.curriculum?.managementOrganization?.sTen,
                ]
                    .filter(Boolean)
                    .join(' - ')}
            </Divider>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="end">
                        <Col span={12}>
                            <Flex justify="end" gap={4}>
                                {can(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_MUC_CHUONG_TRINH_DAO_TAO,
                                    'NHAP_EXCEL'
                                ) && (
                                    <>
                                        <Button
                                            href={`${env.NEXT_PUBLIC_BASE_PATH}/templates/Mẫu nhập CTĐT.xlsx`}
                                            className="text-primary border-primary mr-2"
                                        >
                                            <FileDown />
                                            Tải file mẫu excel
                                        </Button>
                                        <Button
                                            onClick={() => setImportModalVisible(true)}
                                            className="text-primary border-primary mr-2"
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
                                                handleCloneCurriculumVersion(
                                                    initialValue as CurriculumVersion & {
                                                        trainingBlocks: TrainingBlockOnCurriculumVersion[]
                                                        documentFiles: DocumentFile[]
                                                    }
                                                )
                                            }
                                            className="text-primary border-primary mr-2"
                                            disabled={!initialValue}
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
                                        >
                                            <BookPlus />
                                            Cập nhật
                                        </Button>
                                    </Tooltip>
                                )}
                            </Flex>
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <TableCollapse
                        rowKey="key"
                        headerTitleKey={({ trainingBlock }) =>
                            `Khối kiến thức: ${[trainingBlock?.name].filter(Boolean).join(' - ')}`
                        }
                        childrenFieldName="subjects"
                        defaultExpandAll
                        filters={filters}
                        setFilters={setFilters}
                        columns={[
                            {
                                title: 'Mã môn học',
                                dataIndex: 'code',
                                width: 145,
                                align: 'center',
                                fixed: 'left',
                                type: 'input',
                                render: (__, record: { subject?: SubjectVersion }) => {
                                    return record?.subject?.code ? record?.subject?.code : ''
                                },
                            },
                            {
                                title: 'Mã TKB',
                                // TODO: thêm vào database
                                dataIndex: 'codeTkb',
                                width: 145,
                                align: 'center',
                                fixed: 'left',
                                // render:(__,record)=>{
                                //     return record?.subject?.name
                                // }
                            },
                            {
                                title: 'Tên môn học',
                                dataIndex: 'name',
                                width: 200,
                                align: 'center',
                                fixed: 'left',
                                type: 'input',
                                render: (__, record: { subject?: SubjectVersion }) => {
                                    return record?.subject?.name
                                },
                            },
                            {
                                title: 'Đơn vị quản lý',
                                dataIndex: 'organization',
                                width: 200,
                                align: 'center',
                                type: 'tree_select',
                                options: treeData,
                                render: (_, record) => {
                                    return record?.subject?.managementOrganization?.sTen
                                },
                            },
                            {
                                title: 'Số TC',
                                dataIndex: 'credit',
                                width: 80,
                                type: 'order',
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
                                title: 'Học kỳ dự kiến',
                                dataIndex: 'semester',
                                width: 140,
                                type: 'order',
                                align: 'center',
                                distinctFilters: [
                                    'credit',
                                    'period',
                                    'numberOfTheory',
                                    'numberOfPractical',
                                    'numberOfSelfStudy',
                                    'numberOfPractice',
                                    'numberOfReview',
                                    'numberOfExam',
                                    'numberOfOther',
                                ],
                            },
                            {
                                title: 'Số tiết TKB',
                                dataIndex: 'period',
                                width: 120,
                                align: 'center',
                                type: 'order',
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
                                title: 'LT',
                                dataIndex: 'numberOfTheory',
                                width: 80,
                                type: 'order',
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
                                title: 'BT',
                                dataIndex: 'numberOfPractical',
                                type: 'order',
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
                                title: 'ThL',
                                dataIndex: 'numberOfSelfStudy',
                                width: 80,
                                align: 'center',
                                type: 'order',
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
                                title: 'TN, TH',
                                dataIndex: 'numberOfPractice',
                                width: 90,
                                align: 'center',
                                type: 'order',
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
                                title: 'Ôn',
                                dataIndex: 'numberOfReview',
                                width: 80,
                                align: 'center',
                                type: 'order',
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
                                title: 'KT, Thi',
                                dataIndex: 'numberOfExam',
                                width: 100,
                                align: 'center',
                                type: 'order',
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
                                width: 150,
                                align: 'center',
                                type: 'select',
                                options: options,
                                render: (__, record: { subject?: SubjectVersion }) =>
                                    getExamTypeLabel(record?.subject?.examType),
                            },
                            {
                                title: 'Tính điểm TBC',
                                align: 'center',
                                fixed: 'right',
                                dataIndex: 'useForFinalScore',
                                width: 120,
                                render: (value: boolean) => {
                                    return <Checkbox checked={!!value} />
                                },
                            },
                            {
                                title: 'Trạng thái',
                                align: 'center',
                                width: 150,
                                render: (record) => {
                                    return !record?.active ? (
                                        <Tag color="error">Ngừng đào tạo</Tag>
                                    ) : (
                                        <Tag color="success">Đang hoạt động</Tag>
                                    )
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                hidden: !canSome(
                                    QL_DAO_TAO_PERMISSION.QL_DAO_TAO_CHUONG_TRINH_DAO_TAO_DANH_MUC_CHUONG_TRINH_DAO_TAO,
                                    'SUA'
                                ),
                                render: (__, record: any) => {
                                    if (record.trainingBlockOnCurriculumVersionId) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                <EditIcon
                                                    onClick={(_e) => {
                                                        onOpenTrainingBlockSubject({
                                                            trainingBlockOnCurriculumVersionId:
                                                                record?.trainingBlockOnCurriculumVersionId,
                                                            trainingBlockSubjectId: record?.id,
                                                        })
                                                    }}
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: () =>
                                                            handleDeleteTrainingBlockSubject(
                                                                record.id
                                                            ),
                                                    }}
                                                />
                                            </Row>
                                        )
                                    }
                                    return ''
                                },
                            },
                        ]}
                        data={data}
                        headerRight={({ id }) => (
                            <div className="flex gap-2.5 w-[80px] justify-center items-center">
                                <CreateIcon
                                    title={'Thêm môn học'}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onOpenTrainingBlockSubject({
                                            trainingBlockOnCurriculumVersionId: id,
                                            trainingBlockSubjectId: '',
                                        })
                                    }}
                                />

                                <DeleteIcon
                                    popConfirm={{
                                        onConfirm: () =>
                                            handleDeleteTrainingBlockOnCurriculumVersion(id),
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        )}
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
                    title: 'Danh mục CTĐT khung',
                    href: ROUTER_PATH.QL_DAO_TAO.CHUONG_TRINH_DAO_TAO_DANH_MUC_CHUONG_TRINH_DAO_TAO,
                },
                { title: 'Chi tiết CTĐT toàn khoá' },
            ]}
        >
            {page}
        </DefaultLayout>
    )
}
