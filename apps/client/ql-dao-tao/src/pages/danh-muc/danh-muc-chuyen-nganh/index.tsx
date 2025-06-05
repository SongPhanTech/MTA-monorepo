import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import { PutTrainingMajorModal } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE} from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useCountTrainingMajor,
    useFindManyTrainingMajor,
    useUpdateTrainingCourse,
    useFindManyTrainingObjectType
} from '@workspace/db/hooks'
import type {
    TrainingType,
    TrainingObjectType,
    TrainingMajor,
    TrainingField,
} from '@workspace/db'
import { X, Search } from 'lucide-react'
import {
    Button,
    Col,
    Divider,
    Flex,
    Form,
    Input,
    Row,
    Space,
    Tag,
    Tooltip,
    message,
} from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import Select from '@components/commons/select'
import EditIcon from '@components/icons/edit'
// const { Option } = Select;
interface FilterProps {
    searchText: string | undefined
    trainingObjectTypeId: string | undefined
}

export default function TrainingCoursePage() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        trainingObjectTypeId:undefined
    })

    const { data = [], refetch } = useFindManyTrainingMajor({
        where: {
            OR:[
                { name: { contains: filters.searchText }},
                { codeTrainingMajor: { contains: filters.searchText } },
            ],
            trainingObjectTypes:{
                some:{
                    trainingObjectTypeId: filters.trainingObjectTypeId
                },
            }
        },
        include: {
         organization:true,
         trainingField:true
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountTrainingMajor({
        where: {
             OR:[
                { name: { contains: filters.searchText }},
                { codeTrainingMajor: { contains: filters.searchText } },
            ],
            trainingObjectTypes:{
                some:{
                    trainingObjectTypeId: filters.trainingObjectTypeId
                },
            }
        },
    })

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )
    const { onOpen, onClose } = useDisclosure<string>({
        tag: PutTrainingMajorModal.name,
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

    const { data: trainingObjectTypeData = [], refetch: refetchObjectType } =
        useFindManyTrainingObjectType()
        

    return (
        <div>
            <Divider orientation="left" orientationMargin={0}>
                Danh mục chuyên ngành
            </Divider>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={12}>
                             <Flex>
                                <Form.Item name="searchText">
                                    <Input
                                        id="search"
                                        onChange={(e) =>
                                            handleFilterChange('searchText', e.target.value)
                                        }
                                        placeholder="Tìm kiếm"
                                        style={{
                                            width: 300,
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
                                        width: 300,
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
                                </Flex>
                        </Col>
                        <Col span={6}>
                            <Flex justify="end">
                                <Button onClick={handleModal} type="primary">
                                    Thêm mới
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <Table
                        rowKey="id"
                        id="training-category"
                        columns={[
                             {
                                title: 'ĐTĐT',
                                dataIndex: 'trainingObjectType',
                                align: 'left',
                                width: 100,
                                render: (value: TrainingObjectType) =>
                                    value?.name ? value?.name : '',
                            },
                                {
                                title: 'Khoa phụ trách',
                                dataIndex: 'trainingObjectTypes',
                                align: 'left',
                                width: 150,
                                render: (value: TrainingType) =>
                                    value?.name ? value?.name : '',
                            },
                            {
                                title: 'Ngành',
                                dataIndex: 'trainingField',
                                align: 'left',
                                width: 100,
                                render:(value: TrainingField) =>
                                    value?.name ? value?.name : '',
                            },
                            {
                                title: 'Mã chuyên ngành',
                                dataIndex: 'codeTrainingMajor',
                                align: 'left',
                                width: 150,
                            },
                               {
                                title: 'Viết tắt',
                                align: 'left',
                                dataIndex: 'sumary',
                                width: 100,
                            },
                            {
                                title: 'Tên chuyên ngành',
                                dataIndex: 'name',
                                align: 'left',
                            },
                            {
                                title: 'Tên tiếng anh',
                                align: 'left',
                                dataIndex: 'englishName',
                                width: 150,
                            },
                            {
                                title: 'Mô tả',
                                width: 100,
                                align: 'center',
                                dataIndex: 'description',
                            },
                            {
                                title: 'Số TC chuyên ngành',
                                width: 150,
                                align: 'center',
                                dataIndex: 'numberCreditsMajor',
                            },
                            {
                                title: 'Số TC bắt buộc',
                                width: 150,
                                align: 'center',
                                dataIndex: 'numberCreditsRequired',
                            },
                            {
                                title: 'Số TC lựa chọn',
                                width: 150,
                                align: 'center',
                                dataIndex: 'numberCreditsElective',
                            },
                            {
                                title: 'Trạng thái',
                                align: 'center',
                                width: 130,
                                  render: (value, record) => {
                                    return record?.status=='IN_ACTIVE' ? (
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
                                render: (_, { id }) => {
                                    if (id) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                {/* <Tooltip
                                                    title="Xem chi tiết"
                                                    placement="leftTop"
                                                >
                                                    <EyeOutlined
                                                        onClick={onOpen.bind(
                                                            null,
                                                            id
                                                        )}
                                                        className="text-sm text-blue-700 cursor-pointer"
                                                    />
                                                </Tooltip> */}
                                                <EditIcon
                                                    onClick={onOpen.bind(
                                                        null,
                                                        id
                                                    )}
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: () =>
                                                            handleDelete(id),
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
                        pagination={{
                            current: currentPage,
                            pageSize: numberOfPages,
                            total: count,
                            onChange: setCurrentPage,
                            onShowSizeChange: setNumberOfPages,
                            showTotal: (total, range) =>
                                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}

TrainingCoursePage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
