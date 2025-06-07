import { PlusOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import { PutTrainingProgramCatalog } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useCountTrainingField,
    useFindManyTrainingField,
    useUpdateTrainingCourse,
    useFindManyTrainingObjectType,
    useFindManyTrainingCourse,
    useFindManyCurriculum,
} from '@workspace/db/hooks'
import type { TrainingObjectType } from '@workspace/db'
import { Search } from 'lucide-react'
import { Button, Col, Flex, Form, Input, Row, Tag, message } from 'antd'
import _ from 'lodash'
import type React from 'react'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import Select from '@components/commons/select'
import EditIcon from '@components/icons/edit'
import MajorInforList from '@components/sub-pages/chuyen-nganh'
interface FilterProps {
    searchText: string | null
    trainingObjectTypeId: string | undefined
}

const fakeData = [
    {
        id: '1',
        major: '748020101_Công nghệ thông tin',
        name: 'Công nghệ thông tin CPC 60',
        status: 'ACTIVE',
        infor: [
            {
                id: '1',
                version: '1.0',
                code: 'CNTTCPC60',
                abbreviation: 'CNTT CPC 60',
                englistName: 'Information Technology CPC 60',
                totalCredits: 140,
                description: 'Medical training program',
                startYear: 2022,
                effectiveYear: 2022,
                duration: '6 năm',
                totalCreditsRequired: 130,
                startSemester: 'Học kỳ 1 năm học 2023 -2024 ',
                endSemester: 'Học kỳ 2 năm học 2023 -2024 ',
                isStandardProgram: true,
                isLocked: true,
            },
            {
                id: '2',
                version: '2.0',
                code: 'CNTT60',
                abbreviation: 'CNTT CPC 60',
                englistName: 'Information Technology CPC 60',
                totalCredits: 140,
                description: 'Medical training program',
                startYear: 2022,
                effectiveYear: 2022,
                duration: '6 năm',
                totalCreditsRequired: 130,
                startSemester: 'Học kỳ 1 năm học 2023 -2024 ',
                endSemester: 'Học kỳ 2 năm học 2023 -2024 ',
                isStandardProgram: true,
                isLocked: true,
            },
        ],
    },
    {
        id: '2',
        major: '748020101_Công nghệ thông tin',
        name: 'Công nghệ thông tin Lào 60',
        status: 'IN_ACTIVE',
    },
    {
        id: '3',
        major: '748020101_Công nghệ thông tin',
        name: 'Công nghệ thông tin_K60',
        status: 'IN_ACTIVE',
    },
]

export default function TrainingProgramCatalog() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
        trainingObjectTypeId: undefined,
    })

    const { data = [], refetch } = useFindManyTrainingField({
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
        include: {
            organization: true,
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

    const { data: trainingCourseData = [] } = useFindManyTrainingCourse()

    const { data: curriculumData = [], refetch: refetchCurriculum } =
        useFindManyCurriculum()

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
                    <Table
                        rowKey="id"
                        id="version-category"
                        columns={[
                            {
                                title: 'STT',
                                width: 60,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index) =>
                                    index +
                                    1 +
                                    (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Chuyên ngành',
                                dataIndex: 'major',
                                align: 'center',
                            },
                            {
                                title: 'Tên chương trình',
                                dataIndex: 'name',
                                align: 'center',
                            },
                            {
                                title: 'Trạng thái',
                                align: 'center',
                                width: 140,
                                fixed: 'right',
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
                        expandable={{
                            expandedRowRender: (record) => (
                                <div style={{ maxWidth: '100%' }}>
                                    <MajorInforList infor={record.infor} />
                                </div>
                            ),
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
