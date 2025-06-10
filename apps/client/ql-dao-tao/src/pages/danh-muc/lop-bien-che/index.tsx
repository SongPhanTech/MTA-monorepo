import { CheckOutlined, EyeOutlined } from '@ant-design/icons'
import { fetchUpdateUser } from '@api/open-api/appComponents'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import {
    PutFixedClassModal,
    PutUploadDivisionModal,
    PutUploadFixedClassModal,
} from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type {
    TrainingCourse,
    Organization,
    FixedClass,
    TrainingObjectType,
    CurriculumVersion,
} from '@workspace/db'
import {
    useCountFixedClass,
    useFindManyFixedClass,
    useUpdateFixedClass,
    useFindManyOrganization,
    useFindManyTrainingCourse,
    useFindManyTemplateFile,
    useFindManyTrainingObjectType,
    useFindManyCurriculumVersion,
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
    TreeSelect,
} from 'antd'
import dayjs from 'dayjs'
import _, { filter } from 'lodash'
import type React from 'react'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import Select from '@components/commons/select'
import { buildOrgTree } from '@lib/utils'
// import OptionsPage from '@components/sub-pages/options'
import EditIcon from '@components/icons/edit'
import check from '@assets/images/checked.svg'
export default function FixedClassPage({ trainingCourse }: any) {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [searchText, setSearchText] = useState<string>('')
    const [filters, setFilters] = useState({
        searchText: '',
        trainingCourseId: trainingCourse ? trainingCourse.id : undefined,
        trainingObjectTypeId: undefined,
        curriculumVersionId: undefined,
    })
    const { data = [], refetch } = useFindManyFixedClass({
        where: {
            OR: [
                { name: { contains: filters.searchText, mode: 'insensitive' } },
                { code: { contains: filters.searchText, mode: 'insensitive' } },
            ],
            trainingCourseId: filters.trainingCourseId,
            trainingCourse: {
                trainingObjectTypeId: filters.trainingObjectTypeId,
            },
            curriculumVersionId: filters.curriculumVersionId,
        },
        include: {
            students: {
                include: {
                    userProfile: true,
                },
            },
            lecturerManagement: {
                include: {
                    userProfile: true,
                },
            },
            managementOrganization: true,
            trainingCourse: {
                include: {
                    trainingObjectType: true,
                },
            },
            curriculumVersion: {
                include: {
                    curriculum: {
                        include: {
                            trainingMajor: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })
    const { data: manageOrgData = [], refetch: refetchManageOrg } =
        useFindManyOrganization()
    const { data: trainingObjectTypeData = [], refetch: refetchObjectType } =
        useFindManyTrainingObjectType()

    const { data: trainingCourseData = [], refetch: refetchTrainingCourse } =
        useFindManyTrainingCourse()
    const {
        data: curriculumVersionData = [],
        refetch: refetchCurriculumVersion,
    } = useFindManyCurriculumVersion()

    const { data: count } = useCountFixedClass({
        where: {
            OR: [
                { name: { contains: filters.searchText, mode: 'insensitive' } },
                { code: { contains: filters.searchText, mode: 'insensitive' } },
            ],
            trainingCourseId: filters.trainingCourseId,
            trainingCourse: {
                trainingObjectTypeId: filters.trainingObjectTypeId,
            },
            curriculumVersionId: filters.curriculumVersionId,
        },
    })

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )
    const { onOpen, onClose } = useDisclosure<string>({
        tag: PutFixedClassModal.name,
    })
    const { onOpen: onOpenFixedClass, onClose: onCloseFixedClass } =
        useDisclosure<string>({
            tag: PutUploadFixedClassModal.name,
        })
    const { onOpen: onOpenDivision, onClose: onCloseDivision } =
        useDisclosure<string>({
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
                    deletedAt: new Date(),
                },
            })
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }
    const handleFilterChange = (key: any, value: any) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }
    // const { data: templateFile = [], refetch: refetchTemplateFile } =
    //     useFindManyTemplateFile()
    // const handleDownloadTemplate = (type: string) => {
    //     const fileRecord = templateFile?.find((item) => item.code === type)
    //     const fileLink = fileRecord ? fileRecord.path : null
    //     if (fileLink) {
    //         const link = document.createElement('a')
    //         link.href = fileLink
    //         link.setAttribute('download', '')
    //         document.body.appendChild(link)
    //         link.click()
    //         document.body.removeChild(link)
    //     }
    // }

    // const imtemsDivide = [
    //     {
    //         key: 'import',
    //         label: 'Tải file mẫu xếp lớp',
    //         onClick: () => handleDownloadTemplate('CLASS_DEVISION'),
    //     },
    //     {
    //         key: 'update',
    //         label: 'Nhập file xếp lớp',
    //         onClick: () => handleModalDivision(),
    //     },
    // ]
    // const itemsImport = [
    //     {
    //         key: 'create',
    //         label: 'Thêm mới một lớp',
    //         onClick: () => handleModal(),
    //     },
    //     {
    //         key: 'download',
    //         label: 'Tải file danh sách lớp mẫu',
    //         onClick: () => handleDownloadTemplate('IMPORT_FIXCLASS'),
    //     },
    //     {
    //         key: 'import',
    //         label: 'Nhập file danh sách lớp',
    //         onClick: () => handleModalUploadFixedClass(),
    //     },
    // ]

    // const menuImport = (
    //     <Menu>
    //         {itemsImport.map((item) => (
    //             <Menu.Item key={item.key} onClick={item.onClick}>
    //                 {item.label}
    //             </Menu.Item>
    //         ))}
    //     </Menu>
    // )
    // const menuDivision = (
    //     <Menu>
    //         {imtemsDivide.map((item) => (
    //             <Menu.Item key={item.key} onClick={item.onClick}>
    //                 {item.label}
    //             </Menu.Item>
    //         ))}
    //     </Menu>
    // )
    const treeData = buildOrgTree(manageOrgData)
    const renderExpandedRow = useCallback((record: FixedClass) => {
        return <></>
        // return <OptionsPage key={record.id} fixedClass={record} />
    }, [])

    return (
        <div>
            {/* <Divider orientation="left" orientationMargin={0}>
                Lớp biên chế
            </Divider> */}
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={6}>
                            <Form.Item label="" name="search">
                                <Input
                                    id="search"
                                    onChange={(e) =>
                                        handleFilterChange(
                                            'searchText',
                                            e.target.value
                                        )
                                    }
                                    placeholder="Tìm kiếm"
                                    allowClear
                                />
                            </Form.Item>
                        </Col>
                        <Col span={4}>
                            <Form.Item
                                className="mb-0"
                                name="trainingObjectTypeId"
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
                                    onChange={(val) =>
                                        handleFilterChange(
                                            'trainingObjectTypeId',
                                            val
                                        )
                                    }
                                    allowClear
                                />
                            </Form.Item>
                        </Col>
                        <Col span={4}>
                            <Form.Item name="trainingCourseId" label="">
                                <Select
                                    placeholder="Chọn khóa"
                                    options={trainingCourseData.map(
                                        (i: TrainingCourse) => {
                                            return {
                                                value: i.id,
                                                label: i.name,
                                            }
                                        }
                                    )}
                                    onChange={(val) =>
                                        handleFilterChange(
                                            'trainingCourseId',
                                            val
                                        )
                                    }
                                    allowClear
                                />
                            </Form.Item>
                        </Col>

                        <Col span={6}>
                            <Form.Item name="curriculumVersionId" label="">
                                <Select
                                    placeholder="Chọn chương trình đào tạo"
                                    options={curriculumVersionData.map(
                                        (i: CurriculumVersion) => {
                                            return {
                                                value: i.id,
                                                label: i.name,
                                            }
                                        }
                                    )}
                                    onChange={(val) =>
                                        handleFilterChange(
                                            'curriculumVersionId',
                                            val
                                        )
                                    }
                                    allowClear
                                />
                            </Form.Item>
                        </Col>
                        <Col span={4}>
                            <Flex justify="end">
                                <Button onClick={handleModal} type="primary">
                                    Thêm mới
                                </Button>
                            </Flex>
                            {/* <Flex justify="end">
                                <Dropdown
                                    overlay={menuImport}
                                    trigger={['hover']}
                                >
                                    <Button className="ml-4" type="primary">
                                        Thêm mới
                                    </Button>
                                </Dropdown>
                                <Dropdown
                                    overlay={menuDivision}
                                    trigger={['hover']}
                                >
                                    <Button className="ml-4" type="primary">
                                        Xếp lớp
                                    </Button>
                                </Dropdown>
                            </Flex> */}
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
                                width: 50,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index) =>
                                    index +
                                    1 +
                                    (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Mã lớp biên chế',
                                align: 'center',
                                width: 150,
                                dataIndex: 'code',
                            },
                            {
                                title: 'Tên lớp biên chế',
                                align: 'center',
                                width: 200,
                                dataIndex: 'name',
                            },
                            {
                                title: 'Tên viết tắt',
                                dataIndex: 'summary',
                                width: 150,
                                align: 'center',
                            },
                            {
                                title: 'ĐTĐT',
                                align: 'left',
                                width: 100,
                                render: (record) =>
                                    record?.trainingCourse?.trainingObjectType
                                        ?.name || '',
                            },
                            {
                                title: 'Khóa',
                                dataIndex: 'trainingCourse',
                                align: 'center',
                                width: 150,
                                render: (value) =>
                                    value?.name ? value?.name : '',
                            },
                            {
                                title: 'Đơn vị quản lý',
                                dataIndex: 'managementOrganization',
                                align: 'center',
                                width: 150,
                                render: (value) =>
                                    value?.name ? value?.name : '',
                            },
                            {
                                title: 'Chuyên ngành',
                                align: 'center',
                                width: 150,
                                render: (record) =>
                                    record?.curriculumVersion?.curriculum
                                        ?.trainingMajor?.name || '',
                            },
                            {
                                title: 'Chương trình đào tạo',
                                dataIndex: 'curriculumVersion',
                                align: 'center',
                                width: 150,
                                render: (value) =>
                                    value?.name ? value?.name : '',
                            },
                            {
                                title: 'Đã tốt nghiệp',
                                align: 'center',
                                width: 150,
                                dataIndex: 'graduated',
                                render: (value) =>
                                    !value ? (
                                        <CheckOutlined className="text-[#028850]" />
                                    ) : (
                                        ''
                                    ),
                            },
                          
                            {
                                title: 'GVCN',
                                dataIndex: 'lecturerManagement',
                                align: 'center',
                                width: 150,
                                render: (value) =>
                                    value?.userProfile?.lastName ||
                                    value?.userProfile?.firstName
                                        ? `${value?.userProfile?.lastName} ${value?.userProfile?.firstName}`
                                        : '',
                            },
                            {
                                title: 'Năm bắt đầu',
                                dataIndex: 'startYear',
                                width: 150,
                                align: 'center',
                            },
                            {
                                title: 'Mô tả',
                                dataIndex: 'description',
                                width: 100,
                                align: 'center',
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                fixed: 'right',
                                align: 'center',
                                render: (_, { id }) => (
                                    <Row className="justify-center gap-2">
                                        {/* <Tooltip
                                            title="Xem chi tiết"
                                            placement="leftTop"
                                        >
                                            <EyeOutlined
                                                onClick={onOpen.bind(null, id)}
                                                className="text-sm text-blue-700 cursor-pointer"
                                            />
                                        </Tooltip> */}
                                        <EditIcon
                                            onClick={onOpen.bind(null, id)}
                                            className="text-sm text-blue-700 cursor-pointer"
                                        />
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
                    />
                </Col>
            </Row>
        </div>
    )
}

FixedClassPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
