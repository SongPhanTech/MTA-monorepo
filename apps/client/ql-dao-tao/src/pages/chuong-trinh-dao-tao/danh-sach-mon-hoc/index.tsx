import { PlusOutlined } from '@ant-design/icons'
import Select from '@components/commons/select'
import TableCollapse from '@components/commons/tableCollapse'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutSubjectListModal } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { TrainingObjectType } from '@workspace/db'
import {
    useFindManySubject,
    useFindManyTrainingObjectType,
    useUpdateTrainingCourse,
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
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

interface FilterProps {
    searchText: string | null
    trainingObjectTypeId: string | undefined
}

interface DataItem {
    id?: string | number
    key: string
    type: 'parent' | 'child'
    code: string
    scheduleCode: string
    institution: string
    subject?: string
    parentKey?: string
}

export default function SubjectList() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        trainingObjectTypeId: undefined,
    })

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
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
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

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }
    const { mutateAsync: updateTrainingCourse } = useUpdateTrainingCourse()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateTrainingCourse({
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

    const { data: trainingObjectTypeData = [] } =
        useFindManyTrainingObjectType()

    console.log(SubjectData);

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
                                            options={trainingObjectTypeData.map(
                                                (i: TrainingObjectType) => ({
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
                                <Button onClick={handleModal} type="primary">
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
                        headerTitleKey={"name"}
                        childrenFieldName='subjectVersion'
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
                                render: (record) => (
                                    <Tag
                                        color={
                                            record.status === 'IN_ACTIVE'
                                                ? 'error'
                                                : 'success'
                                        }
                                    >
                                        {record.status === 'IN_ACTIVE'
                                            ? 'Ngừng đào tạo'
                                            : 'Đang hoạt động'}
                                    </Tag>
                                ),
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
                                                onClick={() => onOpen(id)}
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
                        data={SubjectData}
                    />
                </Col>
            </Row>
        </div>
    )
}

SubjectList.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
