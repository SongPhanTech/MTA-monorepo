import { PlusOutlined } from '@ant-design/icons'
import DeleteIcon from '@components/icons/delete'
import {
    PutTrainingBlockOnCurriculumVersion,
    PutTrainingBlockSubject,
} from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useFindUniqueCurriculumVersion,
    useFindManyTrainingBlockOnCurriculumVersion,
    useCountTrainingBlockOnCurriculumVersion,
    useUpdateTrainingBlockOnCurriculumVersion,
    useUpdateTrainingBlockSubject,
    useFindManyOrganization,
} from '@workspace/db/hooks'
import type { ExamType } from '@workspace/db'
import { BookPlus, Search } from 'lucide-react'
import {
    Button,
    Col,
    Divider,
    Flex,
    Form,
    Input,
    Row,
    Tag,
    Tooltip,
    TreeSelect,
    message,
} from 'antd'
import _ from 'lodash'
import type React from 'react'
import { useCallback, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import EditIcon from '@components/icons/edit'
import { useRouter } from 'next/router'
import TableCollapse from '@components/commons/tableCollapse'
import { useExamTypeOptions } from '@hooks/examType'
import { buildOrgTree } from '@lib/utils'
import { FilterMonHocCTDT } from '@components/filter'
interface FilterProps {
    searchText: string | null
    managementOrganizationId: string | undefined
    trainingObjectId: string | undefined
    trainingCourseId: string | undefined
}

export default function TrainingProgramSubjects() {
    const router = useRouter()
    const { id } = router.query
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        managementOrganizationId: '',
        trainingObjectId: '',
        trainingCourseId: '',
    })

    const { data: initialValue } = useFindUniqueCurriculumVersion({
        where: { id: Array.isArray(id) ? id[0] : id },
    })

    const { getExamTypeLabel } = useExamTypeOptions()

    const { data = [], refetch } = useFindManyTrainingBlockOnCurriculumVersion({
        where: {
            curriculumVersionId: id as string,
            ...(filters.searchText && filters.searchText !== ''
                ? {
                      OR: [
                          {
                              trainingBlock: {
                                  name: {
                                      contains: filters.searchText,
                                      mode: 'insensitive',
                                  },
                              },
                          },
                          {
                              subjects: {
                                  some: {
                                      subject: {
                                          OR: [
                                              {
                                                  name: {
                                                      contains:
                                                          filters.searchText,
                                                      mode: 'insensitive',
                                                  },
                                              },
                                              {
                                                  code: {
                                                      contains:
                                                          filters.searchText,
                                                      mode: 'insensitive',
                                                  },
                                              },
                                          ],
                                      },
                                  },
                              },
                          },
                      ],
                  }
                : {}),
            ...(filters.managementOrganizationId &&
            filters.managementOrganizationId !== ''
                ? {
                      subjects: {
                          some: {
                              subject: {
                                  managementOrganizationId:
                                      filters.managementOrganizationId,
                              },
                          },
                      },
                  }
                : {}),
            ...(filters.trainingObjectId && filters.trainingObjectId !== ''
                ? {
                      curriculumVersion: {
                          trainingObjectTypeId: filters.trainingObjectId,
                      },
                  }
                : {}),
            ...(filters.trainingCourseId && filters.trainingCourseId !== ''
                ? {
                      curriculumVersion: {
                          fixedClasses: {
                              some: {
                                  trainingCourseId: {
                                      contains: filters.trainingCourseId,
                                      mode: 'insensitive',
                                  },
                              },
                          },
                      },
                  }
                : {}),
        },
        include: {
            subjects: {
                include: {
                    subject: {
                        include: {
                            managementOrganization: true,
                        },
                    },
                },
            },
            trainingBlock: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountTrainingBlockOnCurriculumVersion({
        where: {
            curriculumVersionId: id as string,
            ...(filters.searchText && filters.searchText !== ''
                ? {
                      OR: [
                          {
                              trainingBlock: {
                                  name: {
                                      contains: filters.searchText,
                                      mode: 'insensitive',
                                  },
                              },
                          },
                          {
                              subjects: {
                                  some: {
                                      subject: {
                                          OR: [
                                              {
                                                  name: {
                                                      contains:
                                                          filters.searchText,
                                                      mode: 'insensitive',
                                                  },
                                              },
                                              {
                                                  code: {
                                                      contains:
                                                          filters.searchText,
                                                      mode: 'insensitive',
                                                  },
                                              },
                                          ],
                                      },
                                  },
                              },
                          },
                      ],
                  }
                : {}),
            ...(filters.managementOrganizationId &&
            filters.managementOrganizationId !== ''
                ? {
                      subjects: {
                          some: {
                              subject: {
                                  managementOrganizationId:
                                      filters.managementOrganizationId,
                              },
                          },
                      },
                  }
                : {}),
            ...(filters.trainingObjectId && filters.trainingObjectId !== ''
                ? {
                      curriculumVersion: {
                          trainingObjectTypeId: filters.trainingObjectId,
                      },
                  }
                : {}),
            ...(filters.trainingCourseId && filters.trainingCourseId !== ''
                ? {
                      curriculumVersion: {
                          fixedClasses: {
                              some: {
                                  trainingCourseId: {
                                      contains: filters.trainingCourseId,
                                      mode: 'insensitive',
                                  },
                              },
                          },
                      },
                  }
                : {}),
        },
    })

    const { data: manageOrgData = [] } = useFindManyOrganization()

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )
    const { onOpen: onOpenTrainingBlockSubject, onClose } = useDisclosure<{
        trainingBlockOnCurriculumVersionId: string
        trainingBlockSubjectId: string
    }>({
        tag: PutTrainingBlockSubject.name,
    })

    const { onOpen: onOpenTrainingBlock, onClose: onCloseTrainingBlock } =
        useDisclosure<{
            curriculumVersionId: string
            trainingBlockOnCurriculumVersionId: string
        }>({
            tag: PutTrainingBlockOnCurriculumVersion.name,
        })

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: updateTrainingBlockOnCurriculumVersion } =
        useUpdateTrainingBlockOnCurriculumVersion()
    async function handleDeleteTrainingBlockOnCurriculumVersion(id: string) {
        try {
            showSpinner()
            await updateTrainingBlockOnCurriculumVersion({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { mutateAsync: updateTrainingBlockSubject } =
        useUpdateTrainingBlockSubject()
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
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }

    const processedData = useMemo(() => {
        return data?.map((item) => ({
            ...item,
            name: `KKT: ${item?.trainingBlock?.name}`,
        }))
    }, [data])

    const treeData = buildOrgTree(manageOrgData)

    return (
        <div>
            <Divider>
                Phiên bản chương trình đào tạo: {initialValue?.code} -{' '}
                {initialValue?.name}
            </Divider>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={12}>
                            <Flex>
                                <Col span={12}>
                                    <Form.Item name="searchText">
                                        <Input
                                            id="search"
                                            onChange={(e) =>
                                                handleFilterChange(
                                                    'searchText',
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Nhập tên ngành..."
                                            style={{
                                                height: 40,
                                                marginRight: 8,
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
                                <Col span={12}>
                                    <Form.Item name="managementOrganizationId">
                                        <TreeSelect
                                            placeholder="Chọn đơn vị quản lý"
                                            allowClear
                                            showSearch
                                            treeDefaultExpandAll
                                            onChange={(val) =>
                                                handleFilterChange(
                                                    'managementOrganizationId',
                                                    val
                                                )
                                            }
                                            treeData={treeData}
                                            filterTreeNode={(input, node) =>
                                                (node.title as string)
                                                    .toLowerCase()
                                                    .includes(
                                                        input.toLowerCase()
                                                    )
                                            }
                                            style={{
                                                height: 40,
                                            }}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={6}>
                                    <Flex
                                        justify="space-between"
                                        align="center"
                                    >
                                        <FilterMonHocCTDT
                                            filters={filters}
                                            setFilters={setFilters}
                                            debouncedRefetch={debouncedRefetch}
                                        />
                                    </Flex>
                                </Col>
                            </Flex>
                        </Col>
                        <Col span={6}>
                            <Flex justify="end">
                                <Button
                                    onClick={() =>
                                        onOpenTrainingBlock({
                                            curriculumVersionId:
                                                initialValue?.id as string,
                                            trainingBlockOnCurriculumVersionId:
                                                '',
                                        })
                                    }
                                    type="primary"
                                    className="h-[40px]"
                                >
                                    <PlusOutlined />
                                    Thêm khối kiến thức
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <TableCollapse
                        rowKey="key"
                        headerTitleKey="name"
                        childrenFieldName="subjects"
                        currentPage={currentPage}
                        columns={[
                            {
                                title: 'Mã môn học',
                                dataIndex: ['subject', 'code'],
                                width: 145,
                                align: 'center',
                            },
                            {
                                title: 'Mã TKB',
                                dataIndex: ['subject', 'code'],
                                width: 145,
                                align: 'center',
                            },
                            {
                                title: 'Tên môn học',
                                dataIndex: ['subject', 'name'],
                                width: 200,
                                align: 'center',
                            },
                            {
                                title: 'ĐV QL',
                                dataIndex: [
                                    'subject',
                                    'managementOrganization',
                                    'name',
                                ],
                                width: 200,
                                align: 'center',
                            },
                            {
                                title: 'Số tín chỉ',
                                dataIndex: ['subject', 'credit'],
                                width: 120,
                                align: 'center',
                            },
                            {
                                title: 'Học kỳ dự kiến',
                                dataIndex: 'semester',
                                width: 120,
                                align: 'center',
                            },
                            // {
                            //     title: 'Học kỳ giảng dạy',
                            //     dataIndex: 'shortName',
                            //     width: 140,
                            //     align: 'center',
                            // },
                            // {
                            //     title: 'BB/TC',
                            //     dataIndex: 'shortName',
                            //     width: 100,
                            //     align: 'center',
                            // },
                            // {
                            //     title: 'ĐK',
                            //     dataIndex: 'shortName',
                            //     width: 100,
                            //     align: 'center',
                            // },
                            {
                                title: 'Số tiết TKB',
                                dataIndex: ['subject', 'period'],
                                width: 100,
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
                                width: 80,
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
                                width: 80,
                                align: 'center',
                            },
                            {
                                title: 'Thi',
                                dataIndex: ['subject', 'examType'],
                                width: 150,
                                align: 'center',
                                render: (record: ExamType) =>
                                    getExamTypeLabel(record),
                            },
                            {
                                title: 'Trạng thái',
                                align: 'center',
                                width: 150,
                                render: (record) => {
                                    return !record?.active ? (
                                        <Tag color="error">Ngừng đào tạo</Tag>
                                    ) : (
                                        <Tag color="success">
                                            Đang hoạt động
                                        </Tag>
                                    )
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                render: (
                                    _,
                                    { id, trainingBlockOnCurriculumVersionId }
                                ) => {
                                    if (id) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                <EditIcon
                                                    onClick={(e) => {
                                                        onOpenTrainingBlockSubject(
                                                            {
                                                                trainingBlockOnCurriculumVersionId:
                                                                    trainingBlockOnCurriculumVersionId,
                                                                trainingBlockSubjectId:
                                                                    id,
                                                            }
                                                        )
                                                    }}
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: () =>
                                                            handleDeleteTrainingBlockSubject(
                                                                id
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
                        data={processedData}
                        headerRight={({ id }) => (
                            <div className="flex gap-2.5 w-[75px] items-center">
                                <Tooltip
                                    title={'Thêm môn học'}
                                    placement="left"
                                >
                                    <BookPlus
                                        size={16}
                                        strokeWidth={1.5}
                                        className="cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onOpenTrainingBlockSubject({
                                                trainingBlockOnCurriculumVersionId:
                                                    id,
                                                trainingBlockSubjectId: '',
                                            })
                                        }}
                                    />
                                </Tooltip>
                                <EditIcon
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onOpenTrainingBlock({
                                            curriculumVersionId:
                                                initialValue?.id as string,
                                            trainingBlockOnCurriculumVersionId:
                                                id,
                                        })
                                    }}
                                    className="text-sm text-blue-700 cursor-pointer"
                                />
                                <DeleteIcon
                                    popConfirm={{
                                        onConfirm: () =>
                                            handleDeleteTrainingBlockOnCurriculumVersion(
                                                id
                                            ),
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        )}
                        pagination={{
                            current: currentPage,
                            pageSize: numberOfPages,
                            total: count,
                            onChange: setCurrentPage,
                            onShowSizeChange: setNumberOfPages,
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}

TrainingProgramSubjects.getLayout = function getLayout(
    page: React.ReactElement
) {
    return (
        <DefaultLayout headerChildren="Môn học chương trình đào tạo">
            {page}
        </DefaultLayout>
    )
}
