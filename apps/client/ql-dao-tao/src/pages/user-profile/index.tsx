import { DownCircleFilled, DownloadOutlined, EyeOutlined, UploadOutlined } from '@ant-design/icons'
import { fetchUpdateUser } from '@api/open-api/appComponents'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import { PutUpdateProfileModal, PutUploadProfileModal, PutUserProfileModal, PutUserProfileUpdateModal } from '@components/modal'
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
    Dropdown,
    Flex,
    Form,
    Input,
    Menu,
    Row,
    Space,
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

dayjs.locale('vi')
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
    const { onOpen: onOpenUpdateFile, onClose: onCloseUpdateFile } = useDisclosure<string>({
        tag: PutUpdateProfileModal.name,
    })
    const { onOpen: onOpenUpdate, onClose: onCloseUpdate } = useDisclosure<string>({
        tag: PutUserProfileUpdateModal.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }
    const handleModalUpload = (type: string) => {
        if (type === "upload") {
            onOpenUpload()
        } else {
            onOpenUpdateFile()
        }
    }
    const { mutateAsync: updateUserProfile } = useUpdateUserProfile()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateUserProfile({
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
    const { data: userTypeData = [], refetch: refetchUserType } = useFindManyUserType({
        take: 1000,
        skip: 0,
    });
    const { data: templateFile = [], refetch: refetchTemplateFile } = useFindManyTemplateFile({
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

    const handleDownloadTemplate = (type: string) => {
        const fileRecord = templateFile?.find(item => item.code === type)
        const fileLink = fileRecord ? fileRecord.path : null
        if (fileLink) {
            const link = document.createElement('a');
            link.href = fileLink;
            link.setAttribute('download', '');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    const itemsDownload = [
        {
            key: 'import',
            label: 'Tải file nhập thông tin học viên',
            onClick: () => handleDownloadTemplate('IMPORT_USERPROFILE'),
        },
        {
            key: 'update',
            label: 'Tải file cập nhật thông tin học viên',
            onClick: () => handleDownloadTemplate('UPDATE_USERPROFILE'),
        },
    ]

    const itemsUpload = [
        {
            key: 'upload',
            label: 'Nhập file nhập thông tin học viên',
            onClick: () => handleModalUpload('upload'),
        },
        {
            key: 'update',
            label: 'Nhập file cập nhật thông tin học viên',
            onClick: () => handleModalUpload('update'),
        },
    ]
    const menuDownload = (
        <Menu>
            {itemsDownload.map(item => (
                <Menu.Item key={item.key} onClick={item.onClick}>
                    {item.label}
                </Menu.Item>
            ))}
        </Menu>
    );

    const menuUpload = (
        <Menu>
            {itemsUpload.map(item => (
                <Menu.Item key={item.key} onClick={item.onClick}>
                    {item.label}
                </Menu.Item>
            ))}
        </Menu>
    );
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

                                {/* Gói Dropdown vào Space để đảm bảo chỉ có một child */}
                                <>
                                    <Dropdown overlay={menuDownload} trigger={['hover']}>
                                        <Button className="ml-4" type="primary" icon={<DownloadOutlined />}>
                                            Tải file mẫu
                                        </Button>
                                    </Dropdown>
                                </>
                                <>
                                    <Dropdown overlay={menuUpload} trigger={['hover']}>
                                        <Button className="ml-4" type="primary" icon={<UploadOutlined />}>
                                            Nhập file
                                        </Button>
                                    </Dropdown>
                                </>
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
                                render: ({ firstName, lastName }: any) => `${lastName}` + ' ' + `${firstName}`
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
