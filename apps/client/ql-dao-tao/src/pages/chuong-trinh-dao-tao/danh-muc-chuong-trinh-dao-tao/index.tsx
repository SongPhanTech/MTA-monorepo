import { PlusOutlined } from '@ant-design/icons'
import DeleteIcon from '@components/icons/delete'
import { PutTrainingProgramCatalog } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useFindManyTrainingObjectType,
    useFindManyTrainingCourse,
    useFindManyCurriculum,
    useUpdateCurriculum,
    useCountCurriculum,
} from '@workspace/db/hooks'
import { $Enums, type TrainingObjectType } from '@workspace/db'
import { Search } from 'lucide-react'
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
import type React from 'react'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import Select from '@components/commons/select'
import EditIcon from '@components/icons/edit'
import TableCollapse from '@components/commons/tableCollapse'
import dayjs from 'dayjs'
interface FilterProps {
    searchText: string | null
    trainingObjectTypeId: string | undefined
}
export default function TrainingProgramCatalog() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        trainingObjectTypeId: undefined,
    })

    const { data = [], refetch } = useFindManyCurriculum({
        where: {
            // name: {
            //     contains: filters.name,
            // },
            // ...(filters.curriculumId
            //     ? { curriculumId: filters.curriculumId }
            //     : {}),
            // ...(filters.startDate && filters.endDate
            //     ? {
            //           startDate: {
            //               gte: new Date(filters.startDate),
            //               lte: new Date(filters.endDate),
            //           },
            //       }
            //     : {}),
        },
        include: {
            curriculumVersion: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountCurriculum({
        where: {
            ...(filters.searchText && filters.searchText !== ''
                ? { name: { contains: filters.searchText } }
                : {}),
            ...(filters.searchText && filters.searchText !== ''
                ? { code: { contains: filters.searchText } }
                : {}),
            ...(filters.trainingObjectTypeId
                ? { trainingObjectTypeId: filters.trainingObjectTypeId }
                : {}),
        },
    })

    // const { mutateAsync:createSubject } =useCreateSubject()

    // const {
    //     data: subjects = [],
    // } = useFindManySubject(
    //     {
    //         where: {

    //         }
    //     }
    // )

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )
    const { onOpen, onClose } = useDisclosure<string>({
        tag: PutTrainingProgramCatalog.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }
    const { mutateAsync: updateCurriculum } = useUpdateCurriculum()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateCurriculum({
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

    const { data: trainingCourseData = [] } = useFindManyTrainingCourse()

    const { data: curriculumData = [] } = useFindManyCurriculum()

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
                                            placeholder="Nhập chương trình đào tạo"
                                            style={{
                                                height: 40,
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
                                <Col span={6}>
                                    <Form.Item
                                        className="mb-0"
                                        name="trainingCourseId"
                                        labelCol={{ span: 24 }}
                                        wrapperCol={{ span: 24 }}
                                        labelAlign="left"
                                    >
                                        <Select
                                            placeholder="Khoá đào tạo"
                                            options={trainingCourseData.map(
                                                (i: TrainingObjectType) => ({
                                                    value: i.id,
                                                    label: i.name,
                                                })
                                            )}
                                            style={{
                                                height: 40,
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
                                <Col span={12}>
                                    <Form.Item
                                        className="mb-0"
                                        name="trainingObjectId"
                                        labelCol={{ span: 24 }}
                                        wrapperCol={{ span: 24 }}
                                        labelAlign="left"
                                    >
                                        <Select
                                            placeholder="Chương trình đào tạo"
                                            options={curriculumData.map(
                                                (i: TrainingObjectType) => ({
                                                    value: i.id,
                                                    label: i.name,
                                                })
                                            )}
                                            style={{
                                                height: 40,
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
                    <TableCollapse
                        rowKey="key"
                        id="version-category"
                        headerTitleKey="name"
                        childrenFieldName="curriculumVersion"
                        currentPage={currentPage}
                        columns={[
                            {
                                title: 'Phiên bản',
                                dataIndex: 'name',
                                align: 'center',
                                width: 180,
                            },
                            {
                                title: 'Chuyên ngành',
                                dataIndex: 'major',
                                align: 'center',
                                width: 200,
                            },
                            {
                                title: 'Mã CTĐT',
                                dataIndex: 'code',
                                align: 'center',
                                width: 200,
                            },
                            {
                                title: 'Tên chương trình',
                                dataIndex: 'name',
                                align: 'center',
                                width: 120,
                            },
                            {
                                title: 'Tên viết tắt',
                                dataIndex: 'shortName',
                                align: 'center',
                                width: 100,
                            },
                            {
                                title: 'Tên tiếng anh',
                                dataIndex: 'englishName',
                                align: 'center',
                                width: 120,
                            },
                            {
                                title: 'Tổng tín chỉ',
                                dataIndex: 'englishName',
                                align: 'center',
                                width: 120,
                            },
                            {
                                title: 'Mô tả',
                                dataIndex: 'description',
                                align: 'center',
                                width: 200,
                            },
                            {
                                title: 'Năm khởi tạo',
                                dataIndex: 'createdAt',
                                align: 'center',
                                width: 140,
                                render: (value) => dayjs(value).year(),
                            },
                            {
                                title: 'Năm áp dụng',
                                dataIndex: 'startDate',
                                align: 'center',
                                width: 140,
                                render: (value) => dayjs(value).year(),
                            },
                            {
                                title: 'Thời gian đào tạo',
                                dataIndex: 'numberOfSemesters',
                                align: 'center',
                                width: 140,
                                render: (value) => `${value} năm`,
                            },
                            {
                                title: 'HK bắt đầu',
                                dataIndex: 'numberOfSemesters123',
                                align: 'center',
                                width: 170,
                            },
                            {
                                title: 'HK Kết thúc',
                                dataIndex: 'numberOfSemesters123',
                                align: 'center',
                                width: 140,
                            },
                            {
                                title: 'Là CTĐT Khung',
                                dataIndex: 'active',
                                align: 'center',
                                width: 120,
                                render: (value: boolean) => (
                                    <Checkbox checked={!!value} disabled />
                                ),
                            },
                            {
                                title: 'Khóa sửa',
                                dataIndex: 'active',
                                align: 'center',
                                width: 120,
                                render: (value: boolean) => (
                                    <Checkbox checked={!!value} disabled />
                                ),
                            },
                            {
                                title: 'Trạng thái',
                                align: 'center',
                                width: 140,
                                fixed: 'right',
                                render: (value, record) => {
                                     return record?.status === $Enums.CurriculumStatus.INACTIVATED ? (
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
                                fixed: 'right',
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
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}

TrainingProgramCatalog.getLayout = function getLayout(
    page: React.ReactElement
) {
    return <DefaultLayout>{page}</DefaultLayout>
}
