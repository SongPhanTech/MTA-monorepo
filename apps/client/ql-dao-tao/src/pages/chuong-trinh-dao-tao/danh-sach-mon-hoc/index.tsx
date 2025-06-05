import { PlusOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import { PutSubjectListModal } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useCountTrainingField,
    useFindManyTrainingField,
    useUpdateTrainingCourse,
    useFindManyTrainingObjectType,
    useFindManySubject
} from '@workspace/db/hooks'
import type {
    TrainingObjectType,
} from '@workspace/db'
import { X, Search } from 'lucide-react'
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
import dayjs from 'dayjs'
import _ from 'lodash'
import type React from 'react'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import Select from '@components/commons/select'
import EditIcon from '@components/icons/edit'
// const { Option } = Select;
interface FilterProps {
    searchText: string | null
    trainingObjectTypeId: string | undefined
}

const fakeData = [
    {
        id: 1,
        maMon: 'MH001',
        maTKB: 'TKB001',
        tenMonHoc: 'Toán cao cấp A1',
        trainingObjectTypeId: 'Đại trà',
        dvql: 'Khoa Toán',
        stc: 3,
        sttkb: 45,
        stlt: 30,
        '5': 0, // Không rõ nghĩa, nên giả định là 0
        stth: 15,
        dq: 1,
        khongTD: 0,
        svMax: 60,
        hshp: 1.2,
        hshp2: 1.0,
        thi: 'Tự luận',
        dbn: 0,
        sdd: 3,
        status: 'ACTIVE', // hoặc 'IN_ACTIVE'
    },
    {
        id: 2,
        maMon: 'MH002',
        maTKB: 'TKB002',
        tenMonHoc: 'Vật lý đại cương',
        trainingObjectTypeId: 'CLC',
        dvql: 'Khoa Vật Lý',
        stc: 4,
        sttkb: 60,
        stlt: 40,
        '5': 1,
        stth: 20,
        dq: 1,
        khongTD: 1,
        svMax: 50,
        hshp: 1.5,
        hshp2: 1.3,
        thi: 'Trắc nghiệm',
        dbn: 1,
        sdd: 3,
        status: 'IN_ACTIVE',
    },
    {
        id: 3,
        maMon: 'MH003',
        maTKB: 'TKB003',
        tenMonHoc: 'Lập trình cơ bản',
        trainingObjectTypeId: 'Đại trà',
        dvql: 'Khoa CNTT',
        stc: 3,
        sttkb: 45,
        stlt: 25,
        '5': 0,
        stth: 20,
        dq: 1,
        khongTD: 0,
        svMax: 70,
        hshp: 1.1,
        hshp2: 1.0,
        thi: 'Tự luận',
        dbn: 1,
        sdd: 3,
        status: 'ACTIVE',
    },
]

export default function SubjectList() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        trainingObjectTypeId: undefined
    })

    const { data = [], refetch } = useFindManyTrainingField({
        where: {
            ...(filters.searchText && filters.searchText !== ''
                ? { name: { contains: filters.searchText } }
                : {}),
            ...(filters.searchText && filters.searchText !== ''
                ? { codeTrainingField: { contains: filters.searchText } }
                : {}),
            ...(filters.trainingObjectTypeId
                ? { trainingObjectTypeId: filters.trainingObjectTypeId }
                : {}),

        },
        include: {
            organization: true
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountTrainingField({
        where: {
            ...(filters.searchText && filters.searchText !== ''
                ? { name: { contains: filters.searchText } }
                : {}),
            ...(filters.searchText && filters.searchText !== ''
                ? { codeTrainingField: { contains: filters.searchText } }
                : {}),
            ...(filters.trainingObjectTypeId
                ? { trainingObjectTypeId: filters.trainingObjectTypeId }
                : {}),
        },
    })

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )
    const { onOpen, onClose } = useDisclosure<string>({
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

    const { data: trainingObjectTypeData = [], refetch: refetchObjectType } =
        useFindManyTrainingObjectType()


    return (
        <div>
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
                                    <PlusOutlined />
                                    Thêm
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
                                title: 'Mã',
                                dataIndex: 'maMon',
                                width: 130,
                                align: 'center',
                                render: (value: any) =>
                                    value ? value : '',
                            },
                            {
                                title: 'Mã TKB',
                                dataIndex: 'maTKB',
                                width: 200,
                                align: 'center',
                                render: (value: any) =>
                                    value ? value : '',
                            },
                            {
                                title: 'Tên môn học',
                                dataIndex: 'tenMonHoc',
                                width: 200,
                                align: 'center',
                                render: (value: any) =>
                                    value ? value : '',
                            },
                            {
                                title: 'ĐTĐT',
                                dataIndex: 'trainingObjectTypeId',
                                width: 200,
                                align: 'center',
                                render: (value: any) =>
                                    value ? value : '',
                            },
                            {
                                title: 'ĐV QL',
                                dataIndex: 'dvql',
                                width: 140,
                                align: 'center',
                                render: (value: any) =>
                                    value ? value : '',
                            },
                            {
                                title: 'STC',
                                dataIndex: 'stc',
                                width: 80,
                                align: 'center',
                                render: (value: any) =>
                                    value ? value : '',
                            },
                            {
                                title: 'STTKB',
                                dataIndex: 'sttkb',
                                width: 80,
                                align: 'center',
                                render: (value: any) =>
                                    value ? value : '',
                            },
                            {
                                title: 'STLT',
                                dataIndex: 'stlt',
                                width: 80,
                                align: 'center',
                                render: (value: any) =>
                                    value ? value : '',
                            },
                            {
                                title: '5',
                                dataIndex: '5',
                                width: 80,
                                align: 'center',
                                render: (value: any) =>
                                    value ? value : '',
                            },
                            {
                                title: 'STTH',
                                dataIndex: 'stth',
                                width: 80,
                                align: 'center',
                                render: (value: any) =>
                                    value ? value : '',
                            },
                            {
                                title: 'ĐQ',
                                dataIndex: 'dq',
                                width: 80,
                                align: 'center',
                                render: (value: any) =>
                                    value ? value : '',
                            },
                            {
                                title: 'Không TĐ',
                                dataIndex: 'khongTD',
                                width: 80,
                                align: 'center',
                                render: (value: boolean) => <Checkbox checked={!!value} disabled />,
                            },
                            {
                                title: 'SV Max',
                                dataIndex: 'svMax',
                                width: 80,
                                align: 'center',
                                render: (value: any) =>
                                    value ? value : '',
                            },
                            {
                                title: 'HSHP',
                                dataIndex: 'hshp',
                                width: 80,
                                align: 'center',
                                render: (value: any) =>
                                    value ? value : '',
                            },
                            {
                                title: 'HSHP2',
                                dataIndex: 'hshp2',
                                width: 80,
                                align: 'center',
                                render: (value: any) =>
                                    value ? value : '',
                            },
                            {
                                title: 'Thi',
                                dataIndex: 'thi',
                                width: 80,
                                align: 'center',
                                render: (value: any) =>
                                    value ? value : '',
                            },
                            {
                                title: 'ĐBN',
                                dataIndex: 'dbn',
                                width: 80,
                                align: 'center',
                                render: (value: boolean) => <Checkbox checked={!!value} disabled />,
                            },
                            {
                                title: 'SĐĐ',
                                dataIndex: 'sdd',
                                width: 80,
                                align: 'center',
                                render: (value: any) =>
                                    value ? value : '',
                            },
                            {
                                title: 'Trạng thái',
                                align: 'center',
                                width: 140,
                                render: (value, record) => {
                                    return record?.status == 'IN_ACTIVE' ? (
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
                                width: 110,
                                align: 'center',
                                render: (_, { id }) => {
                                    if (id) {
                                        return (
                                            <Row className="items-center justify-center gap-2">
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
                                                    className="text-base text-blue-700 cursor-pointer"
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
                        data={fakeData}
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

SubjectList.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
