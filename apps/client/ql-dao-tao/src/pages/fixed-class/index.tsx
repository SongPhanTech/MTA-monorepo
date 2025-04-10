import { EyeOutlined } from '@ant-design/icons'
import { fetchUpdateUser } from '@api/open-api/appComponents'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import { PutFixedClassModal, PutUploadDivisionModal, PutUploadFixedClassModal } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { TrainingCourse, Organization } from '@workspace/db'
import {
    useCountFixedClass,
    useFindManyFixedClass,
    useUpdateFixedClass,
    useFindManyOrganization,
    useFindManyTrainingCourse,
    useFindManyTemplateFile
} from '@workspace/db/hooks'
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
    Tooltip,
    message,
    TreeSelect
} from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import type React from 'react'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import Select from '@components/commons/select'
import { buildOrgTree } from '@lib/utils'
import OptionsPage from '@pages/fixed-class/options'

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
            fixedClassStudent: {
                include: {
                    UserProfile: true
                }
            },
            ManagementOrganization: true,
            TrainingCourse: true,
        },
        orderBy: {
            createdAt: 'desc',
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
    const { data: count } = useCountFixedClass({
        where: {
            name: {
                contains: searchText,
            },
            trainingCourseId: filters.trainingCourseId,
            managementOrganizationId: filters.managementOrganizationId,
        },
    })

    const debouncedRefetch = useCallback(_.debounce(() => {
        refetch();
    }, 500), []);
    const { onOpen, onClose } = useDisclosure<string>({
        tag: PutFixedClassModal.name,
    })
    const { onOpen: onOpenFixedClass, onClose: onCloseFixedClass } = useDisclosure<string>({
        tag: PutUploadFixedClassModal.name,
    })
    const { onOpen: onOpenDivision, onClose: onCloseDivision } = useDisclosure<string>({
        tag: PutUploadDivisionModal.name,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }
    const handleModalUploadFixedClass = () => {
        onOpenFixedClass()
    }
    const handleModalDivision = () => {
        onOpenDivision()
    }
    const { mutateAsync: updateFixedClass } = useUpdateFixedClass()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateFixedClass({
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
    const { data: templateFile = [], refetch: refetchTemplateFile } = useFindManyTemplateFile({
        take: 1000,
        skip: 0,
    });
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

    const imtemsDivide = [
        {
            key: 'import',
            label: 'Tải file mẫu xếp lớp',
            onClick: () => handleDownloadTemplate('CLASS_DEVISION'),
        },
        {
            key: 'update',
            label: 'Nhập file xếp lớp',
            onClick: () => handleModalDivision(),
        },
    ]
    const itemsImport = [
        {
            key: 'create',
            label: 'Thêm mới một lớp',
            onClick: () => handleModal(),
        },
        {
            key: 'download',
            label: 'Tải file danh sách lớp mẫu',
            onClick: () => handleDownloadTemplate('IMPORT_FIXCLASS'),
        },
        {
            key: 'import',
            label: 'Nhập file danh sách lớp',
            onClick: () => handleModalUploadFixedClass(),
        },
    ]

    const menuImport = (
        <Menu>
            {itemsImport.map(item => (
                <Menu.Item key={item.key} onClick={item.onClick}>
                    {item.label}
                </Menu.Item>
            ))}
        </Menu>
    );
    const menuDivision = (
        <Menu>
            {imtemsDivide.map(item => (
                <Menu.Item key={item.key} onClick={item.onClick}>
                    {item.label}
                </Menu.Item>
            ))}
        </Menu>
    );
    const treeData = buildOrgTree(manageOrgData);

    return (
        <div>
            <Divider orientation="left" orientationMargin={0}>
                Lớp biên chế
            </Divider>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={6}>
                            <Form.Item label="Tìm kiếm" name="search">
                                <Input
                                    id="search"
                                    onChange={(e) => handleFilterChange('searchText', e.target.value)}
                                    placeholder="Tìm kiếm theo tên,..."
                                />
                            </Form.Item>
                        </Col>
                        <Col span={4}>
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
                        <Col span={8}>
                            <Form.Item
                                name="managementOrganizationId"
                                label="Đơn vị quản lý"
                            >
                                <TreeSelect
                                    placeholder="Chọn đơn vị quản lý"
                                    allowClear
                                    showSearch
                                    treeDefaultExpandAll
                                    onChange={(val) => handleFilterChange('managementOrganizationId', val)}
                                    treeData={treeData}
                                    filterTreeNode={(input, node) =>
                                        (node.title as string).toLowerCase().includes(input.toLowerCase())
                                    }
                                />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            {/* <Flex justify="end">
                                <Button onClick={handleModal} type="primary">
                                    Thêm mới
                                </Button>
                            </Flex> */}
                            <Flex justify="end">
                                <Dropdown overlay={menuImport} trigger={['hover']}>
                                    <Button className="ml-4" type="primary">
                                        Thêm mới
                                    </Button>
                                </Dropdown>
                                <Dropdown overlay={menuDivision} trigger={['hover']}>
                                    <Button className="ml-4" type="primary">
                                        Xếp lớp
                                    </Button>
                                </Dropdown>
                            </Flex>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <Table
                        rowKey="id"
                        id="fixed-class"
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
                            showTotal: (total, range) =>
                                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
                        }}
                        expandable={{
                            expandedRowRender: (record) => <OptionsPage
                                className="sub-table [&_.ant-table-tbody>tr:hover]:bg-blue-50"
                                key={record.id}
                                fixedClass={record} />
                            // rowExpandable: (record) => !!record.description,
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
