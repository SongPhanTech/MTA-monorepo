import { EyeOutlined } from '@ant-design/icons'
import { fetchUpdateUser } from '@api/open-api/appComponents'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import { PutUploadProfileModal, PutUserProfileModal, PutUserProfileUpdateModal } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE, GENDER_MEAN } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useCountUserProfile,
    useFindManyUserProfile,
    useFindManyTrainingForm,
    useUpdateUserProfile,
    useFindManyTrainingType,
    useFindManyTrainingObjectType,
    useFindManyTrainingLevel,
    useFindManyUserType,
    useFindManyTemplateFile
} from '@workspace/db/hooks'
import type { UserProfile, SchoolYear, TrainingForm, TrainingLevel, TrainingType, TrainingObjectType, UserType } from '@workspace/db'

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
        userTypeId: undefined,
    });

    const { data = [], refetch } = useFindManyUserProfile({
        where: {
            firstName: {
                contains: filters.searchText,
            },
            userTypeId: filters.userTypeId,
        },
        include: {
            UserType: true,
        },
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

    const { onOpen: onOpenUpload, onClose: onCloseUpload } = useDisclosure<string>({
        tag: PutUploadProfileModal.name,
    })
    const { onOpen: onOpenUpdate, onClose: onCloseUpdate } = useDisclosure<string>({
        tag: PutUserProfileUpdateModal.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }
    const handleModalUpload = () => {
        onOpenUpload()
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
    const { data: userTypeData = [], refetch: refetchUserType } = useFindManyUserType({
        take: 1000,
        skip: 0,
    });
    const { data: templateFile = [], refetch: refetchTemplateFile } = useFindManyTemplateFile({
        where: {
            code: {
                equals: 'IMPORT_USERPROFILE',
            },
        },
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

    const handleDownloadTemplate = () => {
        const fileLink = templateFile?.length > 0 ? templateFile[0].path : null
        if (fileLink) {
            const link = document.createElement('a');
            link.href = fileLink;
            link.setAttribute('download', '');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
    return (
        <div>
            <Divider orientation="left" orientationMargin={0}>
                Học viên
            </Divider>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    {/* Row nút thêm */}
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={24}>
                            <Flex justify="end">
                                <Button onClick={handleModal} type="primary">
                                    Thêm mới
                                </Button>
                                <Button className='ml-4' onClick={handleDownloadTemplate} type="primary">
                                    Tải file mẫu
                                </Button>
                                <Button className='ml-4' onClick={handleModalUpload} type="primary">
                                    Nhập file
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

                        <Col span={8}>
                            <Form.Item label="Đối tượng" name="trainingForm">
                                <Select
                                    placeholder="Chọn đối tượng"
                                    options={userTypeData.map((i: UserType) => ({
                                        value: i.id,
                                        label: i.name,
                                    }))}
                                    onChange={(val) => handleFilterChange('userTypeId', val)}
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
                                title: 'Mã học viên',
                                dataIndex: 'code',
                                align: "center"
                            },
                            {
                                title: 'Họ và tên',
                                // dataIndex: 'name',
                                render: ({ firstName, lastName }: any) => `${firstName}` + ' ' + `${lastName}`
                            },
                            {
                                title: 'Đối tượng',
                                dataIndex: 'UserType',
                                render: (value) => value?.name ? value?.name : ""
                            },
                            {
                                title: 'Ngày sinh',
                                // dataIndex: 'startDate',
                                render: ({ dateOfBirth }) =>
                                    dayjs(dateOfBirth).format('DD/MM/YYYY'),
                            },
                            {
                                title: 'Giới tính',
                                // dataIndex: 'gender',
                                render: ({ gender }) => GENDER_MEAN[gender as keyof typeof GENDER_MEAN],
                            },
                            {
                                title: 'Số CCCD',
                                dataIndex: 'idCardNumber',
                            },
                            {
                                title: 'Số điện thoại',
                                dataIndex: 'phoneNumber',
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
                                                onClick={onOpenUpdate.bind(null, id)}
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
