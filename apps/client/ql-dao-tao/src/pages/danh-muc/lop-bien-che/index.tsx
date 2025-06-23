import { CheckOutlined } from '@ant-design/icons'
import Select from '@components/commons/select'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import {
    ModalGPASemester,
    PutFixedClassModal,
    PutUploadDivisionModal,
    PutUploadFixedClassModal,
} from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type {
    CurriculumVersion,
    TrainingCourse,
    TrainingObjectType,
} from '@workspace/db'
import {
    useCountFixedClass,
    useFindManyCurriculumVersion,
    useFindManyFixedClass,
    useFindManyTrainingCourse,
    useFindManyTrainingObjectType,
    useUpdateFixedClass,
} from '@workspace/db/hooks'
import { ROUTER_PATH } from '@workspace/router'
import { Button, Col, Flex, Form, Input, Row, Tag, message } from 'antd'
import _ from 'lodash'
import { useRouter } from 'next/router'
import type React from 'react'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export default function FixedClassPage({
    trainingCourse,
}: { trainingCourse?: TrainingCourse }) {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [searchText, setSearchText] = useState<string>('')
    const [filters, setFilters] = useState({
        searchText: '',
        trainingCourseId: trainingCourse ? trainingCourse.id : undefined,
        trainingObjectTypeId: undefined,
        curriculumVersionId: undefined,
    })

    const router = useRouter()
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
                    trainingLevel: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })
    const { data: trainingObjectTypeData = [] } =
        useFindManyTrainingObjectType()

    const { data: trainingCourseData = [] } = useFindManyTrainingCourse()
    const { data: curriculumVersionData = [] } = useFindManyCurriculumVersion()

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
    const { onOpen } = useDisclosure<string>({
        tag: PutFixedClassModal.name,
    })
    const { onOpen: onOpenGPASemester } = useDisclosure<string>({
        tag: ModalGPASemester.name,
    })
    const { onOpen: onOpenFixedClass } = useDisclosure<string>({
        tag: PutUploadFixedClassModal.name,
    })
    const { onOpen: onOpenDivision } = useDisclosure<string>({
        tag: PutUploadDivisionModal.name,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }

    const handleOpenGPASemester = () => {
        onOpenGPASemester()
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
    const handleFilterChange = (key: string, value: string) => {
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
    // const treeData = buildOrgTree(manageOrgData)
    // const renderExpandedRow = useCallback((record: FixedClass) => {
    //     return <></>
    //     // return <OptionsPage key={record.id} fixedClass={record} />
    // }, [])

    return (
        <div>
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
                            <Flex justify="end" gap={4}>
                                <Button
                                    onClick={handleOpenGPASemester}
                                    type="primary"
                                >
                                    GPA kỳ học
                                </Button>
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
                        onRowClick={(record) => {
                            router.push(
                                ROUTER_PATH.QL_DAO_TAO.DANH_MUC_LOP_BIEN_CHE_ID.replace(
                                    '[id]',
                                    record.id
                                )
                            )
                        }}
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
                                fixed: 'left',
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
                                title: 'Đối tượng đào tạo',
                                align: 'center',
                                width: 180,
                                render: (record) =>
                                    record?.trainingCourse?.trainingObjectType
                                        ?.name || '',
                            },
                            {
                                title: 'Khóa',
                                dataIndex: 'trainingCourse',
                                align: 'center',
                                width: 100,
                                render: (value) =>
                                    value?.name ? value?.name : '',
                            },
                            {
                                title: 'Đơn vị quản lý',
                                dataIndex: 'managementOrganization',
                                align: 'left',
                                width: 200,
                                render: (value) =>
                                    value?.name ? value?.name : '',
                            },
                            {
                                title: 'Chuyên ngành',
                                align: 'center',
                                width: 150,
                                dataIndex: 'curriculumVersion',
                                render: (_, record) =>
                                    record.curriculumVersion?.curriculum
                                        .trainingMajor?.name || '',
                            },
                            {
                                title: 'Trình độ đào tạo',
                                align: 'center',
                                width: 150,
                                dataIndex: 'curriculumVersion',
                                render: (value) =>
                                    value?.trainingLevel?.name || '',
                            },
                            {
                                title: 'Chương trình đào tạo',
                                dataIndex: 'curriculumVersion',
                                align: 'center',
                                width: 250,
                                render: (value) =>
                                    value?.name ? value?.name : '',
                            },

                            {
                                title: 'Đã tốt nghiệp',
                                align: 'center',
                                width: 150,
                                dataIndex: 'graduated',
                                render: (value) =>
                                    value ? (
                                        <CheckOutlined className="text-[#028850]" />
                                    ) : (
                                        ''
                                    ),
                            },
                            {
                                title: 'Giáo viên chủ nhiệm',
                                dataIndex: 'lecturerManagement',
                                align: 'center',
                                width: 200,
                                render: (value) =>
                                    value?.userProfile?.fullname
                                        ? value?.userProfile?.fullname
                                        : '',
                            },
                            {
                                title: 'Cán bộ quản lý',
                                dataIndex: 'staffManagement',
                                align: 'center',
                                width: 200,
                                render: (value) =>
                                    value?.userProfile?.fullname
                                        ? value?.userProfile?.fullname
                                        : '',
                            },
                            {
                                title: 'Năm bắt đầu',
                                dataIndex: 'startYear',
                                width: 150,
                                align: 'center',
                            },
                            {
                                title: 'Trạng thái',
                                align: 'center',
                                fixed: 'right',
                                width: 130,
                                render: (value, record) => {
                                    return !record?.active ? (
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
                                render: (_, { id }) => (
                                    <Row className="justify-center gap-2">
                                        <EditIcon
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onOpen(id)
                                            }}
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
