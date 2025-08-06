import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import {
    PutFixedClassModal,
    PutUploadDivisionModal,
    PutUploadFixedClassModal,
} from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { buildOrgTree } from '@lib/utils'
import {
    useCountFixedClass,
    useFindManyDM_DonVi,
    useFindManyFixedClass,
    useFindManyTemplateFile,
    useFindManyTrainingCourse,
    useUpdateFixedClass,
} from '@workspace/db/hooks'
import { Checkbox, Col, Form, Input, message, Row, Tag, TreeSelect } from 'antd'
import _ from 'lodash'
import type React from 'react'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function MajorInforList({ infor }: any) {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [searchText, _setSearchText] = useState<string>('')
    const [filters, setFilters] = useState({
        searchText: '',
        managementOrganizationId: undefined,
    })
    const { data = [], refetch } = useFindManyFixedClass({
        where: {
            name: {
                contains: searchText,
            },
            // trainingCourseId: filters.trainingCourseId,
            managementOrganizationId: filters.managementOrganizationId,
        },
        include: {
            students: {
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
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })
    const { data: manageOrgData = [], refetch: refetchManageOrg } = useFindManyDM_DonVi()

    const { data: trainingCourseData = [], refetch: refetchTrainingCourse } =
        useFindManyTrainingCourse({
            orderBy: {
                name: 'desc',
            },
        })
    const { data: count } = useCountFixedClass({
        where: {
            name: {
                contains: searchText,
            },
            // trainingCourseId: filters.trainingCourseId,
            managementOrganizationId: filters.managementOrganizationId,
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
    const { onOpen: onOpenFixedClass, onClose: onCloseFixedClass } = useDisclosure<string>({
        tag: PutUploadFixedClassModal.name,
    })
    const { onOpen: onOpenDivision, onClose: onCloseDivision } = useDisclosure<string>({
        tag: PutUploadDivisionModal.name,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const _handleModal = () => {
        onOpen()
    }
    const _handleModalUploadFixedClass = () => {
        onOpenFixedClass()
    }
    const _handleModalDivision = () => {
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
        } catch (_error) {
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
    const { data: templateFile = [], refetch: refetchTemplateFile } = useFindManyTemplateFile()

    const treeData = buildOrgTree(manageOrgData)

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={12}>
                            <Form.Item label="Tìm kiếm" name="search">
                                <Input
                                    id="search"
                                    onChange={(e) =>
                                        handleFilterChange('searchText', e.target.value)
                                    }
                                    placeholder="Tìm kiếm"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="managementOrganizationId" label="Đơn vị quản lý">
                                <TreeSelect
                                    placeholder="Chọn đơn vị quản lý"
                                    allowClear
                                    showSearch
                                    treeDefaultExpandAll
                                    onChange={(val) =>
                                        handleFilterChange('managementOrganizationId', val)
                                    }
                                    treeData={treeData}
                                    filterTreeNode={(input, node) =>
                                        (node?.label as string)
                                            ?.toLowerCase()
                                            ?.includes(input?.toLowerCase())
                                    }
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <Table
                        rowKey="id"
                        id="training-category"
                        columns={[
                            {
                                title: 'STT',
                                width: 60,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Phiên bản',
                                dataIndex: 'version',
                                align: 'center',
                                width: 100,
                            },
                            {
                                title: 'Mã CT',
                                dataIndex: 'code',
                                align: 'center',
                                width: 200,
                            },
                            {
                                title: 'Tên viết tắt',
                                dataIndex: 'abbreviation',
                                align: 'center',
                                width: 100,
                            },
                            {
                                title: 'Tên tiếng anh',
                                dataIndex: 'englistName',
                                align: 'center',
                                width: 120,
                            },
                            {
                                title: 'Tổng tín chỉ',
                                dataIndex: 'totalCredits',
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
                                dataIndex: 'startYear',
                                align: 'center',
                                width: 140,
                            },
                            {
                                title: 'Năm áp dụng',
                                dataIndex: 'effectiveYear',
                                align: 'center',
                                width: 140,
                            },
                            {
                                title: 'Thời gian đào tạo',
                                dataIndex: 'duration',
                                align: 'center',
                                width: 140,
                            },
                            {
                                title: 'Tổng số tín chỉ phải đạt',
                                dataIndex: 'totalCreditsRequired',
                                align: 'center',
                                width: 170,
                            },
                            {
                                title: 'HK bắt đầu',
                                dataIndex: 'startSemester',
                                align: 'center',
                                width: 140,
                            },
                            {
                                title: 'HK kết thúc',
                                dataIndex: 'endSemester',
                                align: 'center',
                                width: 140,
                            },
                            {
                                title: 'Là CTĐT Khung',
                                dataIndex: 'isStandardProgram',
                                align: 'center',
                                width: 120,
                                render: (value: boolean) => <Checkbox checked={!!value} disabled />,
                            },
                            {
                                title: 'Khoá sửa',
                                dataIndex: 'isLocked',
                                align: 'center',
                                width: 120,
                                render: (value: boolean) => <Checkbox checked={!!value} disabled />,
                            },
                            {
                                title: 'Trạng thái',
                                align: 'center',
                                width: 140,
                                fixed: 'right',
                                render: (value, record) => {
                                    return record?.status === 'IN_ACTIVE' ? (
                                        <Tag color="error">Không hoạt động</Tag>
                                    ) : (
                                        <Tag color="success">Đang hoạt động</Tag>
                                    )
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 110,
                                align: 'center',
                                fixed: 'right',
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
                                                    onClick={onOpen.bind(null, id)}
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: () => handleDelete(id),
                                                    }}
                                                />
                                            </Row>
                                        )
                                    }
                                    return ''
                                },
                            },
                        ]}
                        data={infor}
                        pagination={{
                            current: currentPage,
                            pageSize: numberOfPages,
                            total: count,
                            onChange: (page, pageSize) => {
                                if (numberOfPages === pageSize) {
                                    setCurrentPage(page)
                                } else {
                                    setCurrentPage(1)
                                    setNumberOfPages(pageSize)
                                }
                            },
                            showTotal: (total, range) =>
                                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}

MajorInforList.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
