import { PlusOutlined } from '@ant-design/icons'
import Select from '@components/commons/select'
import TableCollapse from '@components/commons/tableCollapse'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutSubjectListModal, PutVersionSubjectModal } from '@components/modal'
import { useExamTypeOptions } from '@hooks/examType'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { Curriculum, ExamType } from '@workspace/db'
import {
    useFindManyCurriculum,
    useFindManySubject,
    useUpdateSubjectVersion,
} from '@workspace/db/hooks'
import {
    Button,
    Checkbox,
    Col,
    Flex,
    Form,
    Input,
    Row,
    Tag,
    message,
} from 'antd'
import _ from 'lodash'
import { Search } from 'lucide-react'
import type React from 'react'
import { useCallback, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

interface FilterProps {
    searchText: string | null
    trainingObjectTypeId: string | undefined
}

export default function SubjectList() {
    const [currentPage, setCurrentPage] = useState(1)
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        trainingObjectTypeId: undefined,
    })
    const { getExamTypeLabel } = useExamTypeOptions()

    const { data: curriculum = [] } = useFindManyCurriculum()

    const { data: SubjectData, refetch } = useFindManySubject({
        where: {
            ...(filters.searchText && filters.searchText !== ''
                ? { name: { contains: filters.searchText } }
                : {}),
            ...(filters.searchText && filters.searchText !== ''
                ? { code: { contains: filters.searchText } }
                : {}),
        },
        include: {
            subjectVersion: true,
            managementOrganization: true,
        },
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

    const { onOpen: onOpenSubjectVersion } = useDisclosure<string>({
        tag: PutVersionSubjectModal.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }

    const handleModalSubjectVersion = () => {
        onOpenSubjectVersion()
    }

    const { mutateAsync: updateSubjectVersion } = useUpdateSubjectVersion()
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
        return SubjectData?.map((item) => ({
            ...item,
            name: `${item?.name}${
                item?.managementOrganization?.name
                    ? ` - ${item?.managementOrganization?.name}`
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
                                    <Form.Item
                                        className="mb-0"
                                        name="trainingObjectId"
                                        labelCol={{ span: 24 }}
                                        wrapperCol={{ span: 24 }}
                                        labelAlign="left"
                                    >
                                        <Select
                                            placeholder="Chọn đối tượng đào tạo"
                                            options={curriculum.map(
                                                (i: Curriculum) => ({
                                                    value: i.id,
                                                    label: i.name,
                                                })
                                            )}
                                            style={{
                                                height: 40,
                                                marginRight: 8,
                                            }}
                                            // onChange={(val) =>
                                            //     handleFilterChange(
                                            //         'trainingObjectTypeId',
                                            //         val
                                            //     )
                                            // }
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                            </Flex>
                        </Col>
                        <Col span={6}>
                            <Flex justify="end" gap={8}>
                                <Button
                                    onClick={handleModalSubjectVersion}
                                    type="primary"
                                >
                                    <PlusOutlined />
                                    Thêm phiên bản môn học
                                </Button>
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
                        columns={[
                            {
                                title: 'Mã',
                                dataIndex: 'code',
                                width: 100,
                                align: 'center',
                            },
                            {
                                title: 'Mã TKB',
                                dataIndex: 'maTKB',
                                width: 100,
                                align: 'center',
                            },
                            {
                                title: 'ĐTDT',
                                dataIndex: 'dtdt',
                                width: 150,
                                align: 'center',
                            },
                            {
                                title: 'Số tín chỉ',
                                dataIndex: 'credit',
                                width: 150,
                                align: 'center',
                            },
                            {
                                title: 'Số tiết thời khóa biểu',
                                dataIndex: 'stc',
                                width: 150,
                                align: 'center',
                            },
                            {
                                title: 'Số tiết lý thuyết',
                                dataIndex: 'numberOfTheory',
                                width: 150,
                                align: 'center',
                            },
                            {
                                title: 'Số tiết thực hành',
                                dataIndex: 'numberOfPractice',
                                width: 150,
                                align: 'center',
                            },
                            {
                                title: 'SV Max',
                                dataIndex: 'svMax',
                                width: 150,
                                align: 'center',
                            },
                            {
                                title: 'Hình thức thi',
                                dataIndex: 'examType',
                                width: 150,
                                align: 'center',
                                render: (value: ExamType) =>
                                    getExamTypeLabel(value),
                            },
                            {
                                title: 'Điểm bằng nhau',
                                dataIndex: 'thi',
                                width: 150,
                                align: 'center',
                                render: (value: boolean) => (
                                    <Checkbox checked={!!value} disabled />
                                ),
                            },
                            {
                                title: 'Số điểm đạt',
                                dataIndex: 'sdd',
                                width: 150,
                                align: 'center',
                            },
                            {
                                title: 'Hệ số điểm chuyên cần',
                                dataIndex: 'coef_1',
                                width: 150,
                                align: 'center',
                            },
                            {
                                title: 'Hệ số điểm thường xuyên',
                                dataIndex: 'coef_2',
                                width: 150,
                                align: 'center',
                            },
                            {
                                title: 'Hệ số điểm thi',
                                dataIndex: 'coef_3',
                                width: 150,
                                align: 'center',
                            },
                            {
                                title: 'Trạng thái',
                                align: 'center',
                                fixed: 'right',
                                width: 150,
                                render: (record) => {
                                    return !record?.active ? (
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
                                render: (_, { id }) =>
                                    id ? (
                                        <Row className="justify-center gap-2">
                                            <EditIcon
                                                onClick={() =>
                                                    onOpenSubjectVersion(id)
                                                }
                                                className="text-sm text-blue-700 cursor-pointer"
                                            />
                                            <DeleteIcon
                                                popConfirm={{
                                                    onConfirm: () =>
                                                        handleDelete(id),
                                                }}
                                            />
                                        </Row>
                                    ) : null,
                            },
                        ]}
                        headerRight={({ id }) => (
                            <Flex>
                                <Button
                                    onClick={() => handleModalSubjectVersion()}
                                    type="primary"
                                >
                                    <PlusOutlined />
                                    Thêm phiên bản môn học
                                </Button>
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
