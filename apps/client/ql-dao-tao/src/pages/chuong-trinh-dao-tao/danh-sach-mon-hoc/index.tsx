import { PlusOutlined } from '@ant-design/icons'
import Select from '@components/commons/select'
import TableCollapse from '@components/commons/tableCollapse'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutSubjectListModal, PutVersionSubjectModal } from '@components/modal'
import { useExamTypeOptions } from '@hooks/examType'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { DM_DonVi, ExamType } from '@workspace/db'
import {
    useFindManyDM_DonVi,
    useFindManySubject,
    useUpdateSubject,
    useUpdateSubjectVersion,
} from '@workspace/db/hooks'
import {
    Button,
    Col,
    Flex,
    Form,
    Input,
    Row,
    Tag,
    Tooltip,
    message,
} from 'antd'
import _ from 'lodash'
import { BookPlus, Search } from 'lucide-react'
import type React from 'react'
import { useCallback, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

interface FilterProps {
    searchText: string | null
    managementOrganizationId: string | null
    examType: ExamType[] | null
    active: boolean | null
}

export default function SubjectList() {
    const [currentPage, setCurrentPage] = useState(1)
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        managementOrganizationId: '',
        examType: null,
        active: null,
    })
    const { getExamTypeLabel, options: examTypeFilters } = useExamTypeOptions()

    const { data: organization = [] } = useFindManyDM_DonVi()

    const { data: SubjectData, refetch } = useFindManySubject({
        where: {
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
                              subjectVersion: {
                                  some: {
                                      name: {
                                          contains: filters.searchText,
                                          mode: 'insensitive',
                                      },
                                  },
                              },
                          },
                      ],
                  }
                : {}),
            ...(filters.managementOrganizationId
                ? { managementOrganizationId: filters.managementOrganizationId }
                : {}),
            ...(filters.examType
                ? {
                      subjectVersion: {
                          some: {
                              examType: {
                                  in: filters.examType,
                              },
                          },
                      },
                  }
                : {}),
            ...(typeof filters.active === 'boolean'
                ? {
                      subjectVersion: {
                          some: {
                              active: filters.active,
                          },
                      },
                  }
                : {}),
        },
        include: {
            subjectVersion: {
                orderBy: {
                    createdAt: 'desc',
                },
            },
            managementOrganization: true,
        },
        orderBy: {
            name: 'asc',
        },
        take: 10,
        skip: (currentPage - 1) * 10,
    })

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )
    const { onOpen } = useDisclosure<string>({
        tag: PutSubjectListModal.name,
    })

    const { onOpen: onOpenSubjectVersion } = useDisclosure<{
        subjectId: string
        subjectVersionId?: string
    }>({
        tag: PutVersionSubjectModal.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }

    const handleModalSubjectVersion = (
        subjectId: string,
        subjectVersionId: string
    ) => {
        onOpenSubjectVersion({ subjectId, subjectVersionId })
    }

    const { mutateAsync: updateSubjectVersion } = useUpdateSubjectVersion()
    const { mutateAsync: updateSubject } = useUpdateSubject()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateSubjectVersion({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })
            message.success('Xóa thành công')
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    async function handleDeleteSubject(id: string) {
        try {
            showSpinner()
            await updateSubject({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })
            message.success('Xóa thành công')
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const handleFilterChange = (
        key: string,
        value: string | ExamType[] | boolean
    ) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }

    const processedData = useMemo(() => {
        return SubjectData?.map((item) => ({
            ...item,
            name: `${item?.name}${
                item?.managementOrganization?.sTen
                    ? ` - ${item?.managementOrganization?.sTen}`
                    : ''
            }`,
        }))
    }, [SubjectData])

    return (
        <div>
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
                                            placeholder="Nhập tên môn..."
                                            className="py-0"
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
                                    <Form.Item
                                        className="mb-0"
                                        name="managementOrganizationId"
                                        labelCol={{ span: 24 }}
                                        wrapperCol={{ span: 24 }}
                                        labelAlign="left"
                                    >
                                        <Select
                                            placeholder="Chọn đơn vị quản lý"
                                            options={organization.map(
                                                (i: DM_DonVi) => ({
                                                    value: i.Id,
                                                    label: i.sTen,
                                                })
                                            )}
                                            onChange={(val) =>
                                                handleFilterChange(
                                                    'managementOrganizationId',
                                                    val
                                                )
                                            }
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                            </Flex>
                        </Col>
                        <Col span={6}>
                            <Flex justify="end" gap={8}>
                                <Button onClick={handleModal} type="primary">
                                    <PlusOutlined />
                                    Thêm
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <TableCollapse
                        rowKey="key"
                        headerTitleKey="name"
                        childrenFieldName="subjectVersion"
                        currentPage={currentPage}
                        defaultExpandAll
                        onChange={(pagination, filters) => {
                            if (filters.examType) {
                                handleFilterChange(
                                    'examType',
                                    filters.examType as ExamType[]
                                )
                            } else {
                                handleFilterChange('examType', '')
                            }

                            const activeFilter = Array.isArray(filters.active)
                                ? filters.active[0]
                                : undefined
                            handleFilterChange(
                                'active',
                                activeFilter as boolean | ''
                            )
                        }}
                        columns={[
                            {
                                title: 'Mã môn học',
                                dataIndex: 'code',
                                width: 120,
                                align: 'center',
                            },
                            {
                                title: 'Tên phiên bản',
                                dataIndex: 'name',
                                // sorter: (a, b) => a.name - b.name,
                                width: 200,
                            },
                            {
                                title: 'Mã TKB',
                                dataIndex: '',
                                width: 120,
                                align: 'center',
                            },
                            {
                                title: 'Số tín chỉ',
                                dataIndex: 'credit',
                                width: 150,
                                sorter: (a, b) => a.credit - b.credit,
                                align: 'center',
                            },
                            {
                                title: 'Số tiết',
                                dataIndex: 'period',
                                width: 150,
                                sorter: (a, b) => a.period - b.period,
                                align: 'center',
                            },
                            {
                                title: 'LT',
                                dataIndex: 'numberOfTheory',
                                width: 120,
                                sorter: (a, b) =>
                                    a.numberOfTheory - b.numberOfTheory,
                                align: 'center',
                            },
                            {
                                title: 'BT',
                                dataIndex: 'numberOfPractical',
                                width: 120,
                                sorter: (a, b) =>
                                    a.numberOfPractical - b.numberOfPractical,
                                align: 'center',
                            },
                            {
                                title: 'ThL',
                                dataIndex: 'numberOfSelfStudy',
                                width: 120,
                                sorter: (a, b) =>
                                    a.numberOfSelfStudy - b.numberOfSelfStudy,
                                align: 'center',
                            },
                            {
                                title: 'TN, TH',
                                dataIndex: 'numberOfPractice',
                                width: 120,
                                sorter: (a, b) =>
                                    a.numberOfPractice - b.numberOfPractice,
                                align: 'center',
                            },
                            {
                                title: 'Ôn',
                                dataIndex: 'numberOfReview',
                                width: 120,
                                sorter: (a, b) =>
                                    a.numberOfReview - b.numberOfReview,
                                align: 'center',
                            },
                            {
                                title: 'KT, Thi',
                                dataIndex: 'numberOfExam',
                                width: 120,
                                sorter: (a, b) =>
                                    a.numberOfExam - b.numberOfExam,
                                align: 'center',
                            },
                            {
                                title: 'Hình thức thi',
                                dataIndex: 'examType',
                                width: 150,
                                align: 'center',
                                filters: examTypeFilters.map((opt) => ({
                                    text: opt.label,
                                    value: opt.value,
                                })),
                                filterSearch: true,
                                render: (value: ExamType) =>
                                    getExamTypeLabel(value),
                            },
                            {
                                title: 'Trạng thái',
                                dataIndex: 'active',
                                align: 'center',
                                fixed: 'right',
                                width: 150,
                                filters: [
                                    { text: 'Đang hoạt động', value: true },
                                    { text: 'Không hoạt động', value: false },
                                ],
                                filterMultiple: false,
                                onFilter: () => true,
                                render: (record) => {
                                    return !record ? (
                                        <Tag color="error">Không hoạt động</Tag>
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
                                render: (_, record) => {
                                    const { id: subjectVersionId, subjectId } =
                                        record
                                    return subjectVersionId ? (
                                        <Row className="justify-center gap-2">
                                            <EditIcon
                                                onClick={() =>
                                                    onOpenSubjectVersion({
                                                        subjectId,
                                                        subjectVersionId,
                                                    })
                                                }
                                                className="text-sm text-blue-700 cursor-pointer"
                                            />
                                            <DeleteIcon
                                                popConfirm={{
                                                    onConfirm: () =>
                                                        handleDelete(
                                                            subjectVersionId
                                                        ),
                                                }}
                                            />
                                        </Row>
                                    ) : null
                                },
                            },
                        ]}
                        headerRight={({ id: subjectId }) => (
                            <Flex gap={8} align="center">
                                <Tooltip
                                    title="Thêm mới phiên bản môn học"
                                    placement="bottomLeft"
                                >
                                    <BookPlus
                                        onClick={() =>
                                            handleModalSubjectVersion(
                                                subjectId,
                                                ''
                                            )
                                        }
                                        className="cursor-pointer"
                                    />
                                </Tooltip>
                                <EditIcon
                                    onClick={onOpen.bind(null, subjectId)}
                                    className="text-sm text-blue-700 cursor-pointer"
                                />
                                <DeleteIcon
                                    popConfirm={{
                                        onConfirm: () =>
                                            handleDeleteSubject(subjectId),
                                    }}
                                />
                            </Flex>
                        )}
                        data={processedData}
                    />
                </Col>
            </Row>
        </div>
    )
}

SubjectList.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
