import TableCollapse from '@components/commons/tableCollapse'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutTrainingBlockOnCurriculumVersion, PutTrainingBlockSubject } from '@components/modal'
import type { FilterProps } from '@components/modal/quan-ly-ho-so/type'
import { useCloneCurriculumVersion } from '@hooks/copyCurriculumVersion'
import { useExamTypeOptions } from '@hooks/examType'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { buildOrgTree } from '@lib/utils'
import { emptyObjectIf } from '@workspace/constant'
import type {
    CurriculumVersion,
    DocumentFile,
    ExamType,
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
import { ROUTER_PATH } from '@workspace/router'
import { Button, Col, Divider, Flex, message, Row, Tag, Tooltip } from 'antd'
import _ from 'lodash'
import { BookPlus, CopyPlus } from 'lucide-react'
import { useRouter } from 'next/router'
import type React from 'react'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import CreateIcon from '../../../../components/icons/create'

export default function TrainingProgramSubjects() {
    const router = useRouter()
    const id = router.query.id as string
    const [filters, setFilters] = useState<FilterProps>({
        organization: undefined,
        code: '',
        name: '',
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

    const { data = [], refetch } = useFindManyTrainingBlockOnCurriculumVersion({
        where: {
            curriculumVersionId: id,
            curriculumVersion: {
                deletedAt: null,
            },
            subjects: {
                some: {
                    subject: {
                        OR: [
                            {
                                name: {
                                    contains: filters.name,
                                    mode: 'insensitive',
                                },
                            },
                            {
                                code: {
                                    contains: filters.code,
                                    mode: 'insensitive',
                                },
                            },
                        ],
                        ...emptyObjectIf(
                            {
                                managementOrganizationId: {
                                    in: filters.organization,
                                },
                            },
                            !!filters.organization
                        ),
                    },
                },
            },
        },
        include: {
            subjects: {
                where: {
                    subject: {
                        OR: [
                            {
                                name: {
                                    contains: filters.name,
                                    mode: 'insensitive',
                                },
                            },
                            {
                                code: {
                                    contains: filters.code,
                                    mode: 'insensitive',
                                },
                            },
                        ],
                        ...emptyObjectIf(
                            {
                                managementOrganizationId: {
                                    in: filters.organization,
                                },
                            },
                            !!filters.organization
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
                orderBy: {
                    semester: 'asc',
                },
            },
            trainingBlock: true,
        },
        orderBy: {
            priority: 'asc',
        },
    })

    const { data: manageOrgData = [] } = useFindManyDM_DonVi({ orderBy: { sTen: 'asc' } })

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )
    const { onOpen: onOpenTrainingBlockSubject, onClose } = useDisclosure<{
        trainingBlockOnCurriculumVersionId: string
        trainingBlockSubjectId: string
        managementOrganization: string
    }>({
        tag: PutTrainingBlockSubject.name,
    })

    const { onOpen: onOpenTrainingBlock, onClose: onCloseTrainingBlock } = useDisclosure<{
        curriculumVersionId: string
    }>({
        tag: PutTrainingBlockOnCurriculumVersion.name,
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
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
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
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }
    const treeData = buildOrgTree(manageOrgData)

    const { handleCloneCurriculumVersion } = useCloneCurriculumVersion({})

    return (
        <div>
            <Divider orientation="left" orientationMargin={0}>
                Phiên bản CTĐT:{' '}
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
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={12}>
                            {/* <Flex>
                                <Col span={8}>
                                    <Form.Item name="searchText">
                                        <Input
                                            id="search"
                                            onChange={(e) =>
                                                handleFilterChange('searchText', e.target.value)
                                            }
                                            className="py-0"
                                            placeholder="Tìm kiếm"
                                            style={{
                                                marginRight: 8,
                                                height: '32px',
                                            }}
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
          
                            </Flex> */}
                        </Col>
                        <Col span={6}>
                            <Flex justify="end" gap={4}>
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
                                multiple: ['organization'],
                                render: (__, record) => {
                                    return record?.subject?.code
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
                                multiple: ['organization'],
                                render: (__, record) => {
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
                                multiple: ['name', 'code'],
                                render: (__, record) => {
                                    return record?.subject?.managementOrganization?.sTen
                                },
                            },
                            {
                                title: 'Chuyên ngành',
                                width: 160,
                                align: 'center',
                                render: (record) =>
                                    record?.subject?.managementOrganization?.trainingMajors?.[0]
                                        ?.name,
                            },
                            {
                                title: 'Số TC',
                                dataIndex: ['subject', 'credit'],
                                width: 80,
                                align: 'center',
                            },
                            {
                                title: 'Học kỳ dự kiến',
                                dataIndex: 'semester',
                                width: 140,
                                align: 'center',
                            },
                            {
                                title: 'Số tiết TKB',
                                dataIndex: ['subject', 'period'],
                                width: 120,
                                align: 'center',
                            },
                            {
                                title: 'LT',
                                dataIndex: ['subject', 'numberOfTheory'],
                                width: 80,
                                align: 'center',
                            },
                            {
                                title: 'BT',
                                dataIndex: ['subject', 'numberOfPractical'],
                                width: 80,
                                align: 'center',
                            },
                            {
                                title: 'ThL',
                                dataIndex: ['subject', 'numberOfSelfStudy'],
                                width: 80,
                                align: 'center',
                            },
                            {
                                title: 'TN, TH',
                                dataIndex: ['subject', 'numberOfPractice'],
                                width: 90,
                                align: 'center',
                            },
                            {
                                title: 'Ôn',
                                dataIndex: ['subject', 'numberOfReview'],
                                width: 80,
                                align: 'center',
                            },
                            {
                                title: 'KT, Thi',
                                dataIndex: ['subject', 'numberOfExam'],
                                width: 100,
                                align: 'center',
                            },
                            {
                                title: 'Thi',
                                dataIndex: ['subject', 'examType'],
                                width: 150,
                                align: 'center',
                                render: (record: ExamType) => getExamTypeLabel(record),
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
                                render: (_, { id, trainingBlockOnCurriculumVersionId }) => {
                                    if (id) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                <EditIcon
                                                    onClick={(e) => {
                                                        onOpenTrainingBlockSubject({
                                                            trainingBlockOnCurriculumVersionId:
                                                                trainingBlockOnCurriculumVersionId,
                                                            trainingBlockSubjectId: id,
                                                            managementOrganization:
                                                                initialValue?.curriculum
                                                                    ?.managementOrganizationId ??
                                                                '',
                                                        })
                                                    }}
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: () =>
                                                            handleDeleteTrainingBlockSubject(id),
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
                                            managementOrganization:
                                                initialValue?.curriculum
                                                    ?.managementOrganizationId ?? '',
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
                    title: 'Danh mục CTĐT',
                    href: ROUTER_PATH.QL_DAO_TAO.CHUONG_TRINH_DAO_TAO_DANH_MUC_CHUONG_TRINH_DAO_TAO,
                },
                { title: 'Chi tiết phiên bản CTĐT' },
            ]}
        >
            {page}
        </DefaultLayout>
    )
}
