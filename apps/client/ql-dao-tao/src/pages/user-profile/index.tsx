import { EyeOutlined } from '@ant-design/icons'
import { fetchUpdateUser } from '@api/open-api/appComponents'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import { PutUserProfileModal } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useCountUserProfile,
    useFindManyUserProfile,
    useFindManyTrainingForm,
    useUpdateUserProfile,
    useFindManyTrainingType,
    useFindManyTrainingObjectType,
    useFindManyTrainingLevel
} from '@workspace/db/hooks'
import type { UserProfile, SchoolYear, TrainingForm, TrainingLevel, TrainingType, TrainingObjectType } from '@workspace/db'

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
import { TRAINING_COURSE_STATUS } from '@constants/constants'
import Select from '@components/commons/select'

export default function UserProfilePage() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [filters, setFilters] = useState({
        searchText: '',
        trainingFormId: undefined,
        trainingTypeId: undefined,
        trainingLevelId: undefined,
        trainingObjectTypeId: undefined
    });

    const { data = [], refetch } = useFindManyUserProfile({
        where: {
            firstName: {
                contains: filters.searchText,
            },
            // trainingFormId: filters.trainingFormId,
            // trainingTypeId: filters.trainingTypeId,
            // trainingLevelId: filters.trainingLevelId,
            // trainingObjectTypeId: filters.trainingObjectTypeId
        },
        // include: {
        //     TrainingForm: true,
        //     TrainingLevel: true,
        //     TrainingType: true,
        //     TrainingObjectType: true
        // },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    });


    const { data: count } = useCountUserProfile()

    const debouncedRefetch = useCallback(_.debounce(() => {
        refetch();
    }, 500), []);
    const { onOpen, onClose } = useDisclosure<string>({
        tag: PutUserProfileModal.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }
    const { mutateAsync: updateAcademicDegreeType } = useUpdateUserProfile()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateAcademicDegreeType({
                where: {
                    id,
                },
                data: {
                    // deletedAt: new Date()
                },
            })
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }
    const { data: trainingFormData = [], refetch: refetchForm } = useFindManyTrainingForm({
        take: 1000,
        skip: 0,
    });

    const { data: trainingTypeData = [], refetch: refetchType } = useFindManyTrainingType({
        take: 1000,
        skip: 0,
    });
    const { data: trainingLevelData = [], refetch: refetchLevel } = useFindManyTrainingLevel({
        take: 1000,
        skip: 0,
    });
    const { data: trainingObjectTypeData = [], refetch: refetchObjectType } = useFindManyTrainingObjectType({
        take: 1000,
        skip: 0,
    });
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
                Khóa
            </Divider>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    {/* Row nút thêm */}
                    <Row gutter={[16, 16]}>
                        <Col span={24}>
                            <Flex justify="end">
                                <Button onClick={handleModal} type="primary">
                                    Thêm mới
                                </Button>
                            </Flex>
                        </Col>
                    </Row>

                    {/* Row ô tìm kiếm */}
                    <Row gutter={[16, 16]}>
                        <Col span={6}>
                            <Form.Item label="Tìm kiếm" name="searchText">
                                <Input
                                    id="search"
                                    onChange={(e) => handleFilterChange('searchText', e.target.value)}
                                    placeholder="Tìm kiếm theo tên,..."
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* Row các select box */}
                    <Row gutter={[16, 16]}>
                        <Col span={6}>
                            <Form.Item label="Hình thức đào tạo" name="trainingForm">
                                <Select
                                    placeholder="Chọn hình thức đào tạo"
                                    options={trainingFormData.map((i: TrainingForm) => ({
                                        value: i.id,
                                        label: i.name,
                                    }))}
                                    onChange={(val) => handleFilterChange('trainingFormId', val)}
                                    allowClear
                                />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item label="Đối tượng đào tạo" name="trainingObjectType">
                                <Select
                                    placeholder="Chọn đối tượng đào tạo"
                                    options={trainingObjectTypeData.map((i: TrainingObjectType) => ({
                                        value: i.id,
                                        label: i.name,
                                    }))}
                                    onChange={(val) => handleFilterChange('trainingObjectTypeId', val)}
                                    allowClear
                                />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item label="Loại hình đào tạo" name="trainingType">
                                <Select
                                    placeholder="Chọn loại hình đào tạo"
                                    options={trainingTypeData.map((i: TrainingType) => ({
                                        value: i.id,
                                        label: i.name,
                                    }))}
                                    onChange={(val) => handleFilterChange('trainingTypeId', val)}
                                    allowClear
                                />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item label="Trình độ đào tạo" name="trainingLevel">
                                <Select
                                    placeholder="Chọn trình độ đào tạo"
                                    options={trainingLevelData.map((i: TrainingForm) => ({
                                        value: i.id,
                                        label: i.name,
                                    }))}
                                    onChange={(val) => handleFilterChange('trainingLevelId', val)}
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
                                title: 'Mã khóa',
                                dataIndex: 'code',
                            },
                            {
                                title: 'Tên khóa',
                                dataIndex: 'name',
                            },
                            {
                                title: 'Loại hình đào tạo',
                                dataIndex: 'TrainingType',
                                render: (value) => value?.name ? value?.name : ""
                            },
                            {
                                title: 'Đối tượng đào tạo',
                                dataIndex: 'TrainingObjectType',
                                render: (value) => value?.name ? value?.name : ""
                            },
                            {
                                title: 'Hình thức đào tạo',
                                dataIndex: 'TrainingForm',
                                render: (value) => value?.name ? value?.name : ""
                            },
                            {
                                title: 'Trình độ đào tạo',
                                dataIndex: 'TrainingLevel',
                                render: (value) => value?.name ? value?.name : ""
                            },
                            {
                                title: 'Ngày bắt đầu',
                                // dataIndex: 'startDate',
                                render: ({ startDate }) =>
                                    dayjs(startDate).format('DD/MM/YYYY'),
                            },
                            {
                                title: 'Ngày kết thúc',
                                // dataIndex: 'endDate',
                                render: ({ endDate }) =>
                                    dayjs(endDate).format('DD/MM/YYYY'),
                            },
                            {
                                title: 'Trạng thái',
                                // dataIndex: 'status',
                                render: ({ status }) => TRAINING_COURSE_STATUS[status as keyof typeof TRAINING_COURSE_STATUS],
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

UserProfilePage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
