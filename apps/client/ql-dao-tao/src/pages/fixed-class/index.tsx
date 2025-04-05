import { EyeOutlined } from '@ant-design/icons'
import { fetchUpdateUser } from '@api/open-api/appComponents'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import { PutFixedClassModal } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { TrainingCourse, Organization } from '@workspace/db'
import {
    useCountFixedClass,
    useFindManyFixedClass,
    useUpdateFixedClass,
    useFindManyOrganization,
    useFindManyTrainingCourse
} from '@workspace/db/hooks'
import {
    Button,
    Col,
    Divider,
    Flex,
    Form,
    Input,
    Row,
    Tooltip,
    message,
} from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import type React from 'react'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import Select from '@components/commons/select'

export default function FixedClassPage() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [searchText, setSearchText] = useState<string>('')
    const [filters, setFilters] = useState({
        searchText: '',
        trainingCourseId: undefined,
        managementOrganizationId: undefined,
    });
    const { data = [], refetch } = useFindManyFixedClass({
        where: {
            name: {
                contains: searchText,
            },
            trainingCourseId: filters.trainingCourseId,
            managementOrganizationId: filters.managementOrganizationId,
        },
        include: {
            ManagementOrganization: true,
            TrainingCourse: true
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })
    const { data: manageOrgData = [], refetch: refetchManageOrg } = useFindManyOrganization({
        take: 1000,
        skip: 0,
    });

    const { data: trainingCourseData = [], refetch: refetchTrainingCourse } = useFindManyTrainingCourse({
        take: 1000,
        skip: 0,
    });
    const { data: count } = useCountFixedClass()

    const debouncedRefetch = useCallback(_.debounce(() => {
        refetch();
    }, 500), []); const { onOpen, onClose } = useDisclosure<string>({
        tag: PutFixedClassModal.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }
    const { mutateAsync: updateAcademicDegreeType } = useUpdateFixedClass()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateAcademicDegreeType({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date()
                },
            })
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }
    const handleFilterChange = (key: any, value: any) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value };
            debouncedRefetch();
            return newFilters;
        });
    };
    return (
        <div>
            <Divider orientation="left" orientationMargin={0}>
                Lớp biên chế
            </Divider>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Row gutter={[16, 16]}>
                        {/* row button */}
                        <Col span={24}>
                            <Flex justify="end">
                                <Button onClick={handleModal} type="primary">
                                    Thêm mới
                                </Button>
                            </Flex>
                        </Col>
                        {/* row filter */}
                        <Col span={6}>
                            <Form.Item label="Tìm kiếm" name="search">
                                <Input
                                    id="search"
                                    onChange={(e) => handleFilterChange('searchText', e.target.value)}
                                    placeholder="Tìm kiếm theo tên,..."
                                />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item
                                name="trainingCourseId"
                                label="Khóa"
                            >
                                <Select
                                    placeholder='Chọn khóa' options={trainingCourseData.map((i: TrainingCourse) => {
                                        return {
                                            value: i.id,
                                            label: i.name
                                        }
                                    })}
                                    onChange={(val) => handleFilterChange('trainingCourseId', val)}
                                    allowClear
                                />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item
                                name="managementOrganizationId"
                                label="Đơn vị quản lý"
                            >
                                <Select
                                    placeholder='Chọn đơn vị quản lý' options={manageOrgData.map((i: Organization) => {
                                        return {
                                            value: i.id,
                                            label: i.name
                                        }
                                    })}
                                    onChange={(val) => handleFilterChange('managementOrganizationId', val)}
                                    allowClear
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <Table
                        columns={[
                            {
                                title: 'STT',
                                width: 20,
                                align: 'center',
                                render: (_, __, index) =>
                                    index +
                                    1 +
                                    (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Mã lớp biên chế',
                                dataIndex: 'code',
                            },
                            {
                                title: 'Tên lớp biên chế',
                                dataIndex: 'name',
                            },
                            {
                                title: 'Khóa',
                                dataIndex: 'TrainingCourse',
                                render: (value) => value?.name ? value?.name : ""
                            },
                            {
                                title: 'Đơn vị quản lý',
                                dataIndex: 'ManagementOrganization',
                                render: (value) => value?.name ? value?.name : ""
                            },
                            {
                                title: 'Mô tả',
                                dataIndex: 'description',
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                render: (_, { id }) => (
                                    <Row className="justify-center gap-2">
                                        <Tooltip
                                            title="Xem chi tiết"
                                            placement="leftTop"
                                        >
                                            <EyeOutlined
                                                onClick={onOpen.bind(null, id)}
                                                className="text-sm text-blue-700 cursor-pointer"
                                            />
                                        </Tooltip>
                                        <DeleteIcon
                                            popConfirm={{
                                                onConfirm: () =>
                                                    handleDelete(id),
                                            }}
                                        />
                                    </Row>
                                ),
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

FixedClassPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
