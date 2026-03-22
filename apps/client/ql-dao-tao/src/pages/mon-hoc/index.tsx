import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import { buildOrgTree } from '@lib/utils'
import {
    useCountSubjectVersion,
    useFindManyDM_DonVi,
    useFindManySchoolYear,
    useFindManySubjectVersion,
    useUpdateSubjectVersion,
} from '@workspace/db/hooks'
import { whereOrganization } from '@workspace/libs/constants'
import { Button, Col, Divider, Flex, Form, Input, message, Row } from 'antd'
import _ from 'lodash'
import { useCallback, useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import TreeSelect from '@/components/commons/tree-select'
export default function SubjectVersionPage({ subjectInfo }: any) {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [_searchText, setSearchText] = useState<string>('')
    const [filters, setFilters] = useState({
        managementOrganizationId: undefined,
        name: '',
        subjectGroupId: subjectInfo ? subjectInfo.id : undefined,
    })
    const { data = [], refetch } = useFindManySubjectVersion({
        where: {
            name: {
                contains: filters.name,
            },
            managementOrganizationId: filters.managementOrganizationId,
        },
        include: {
            managementOrganization: true,
            subject: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountSubjectVersion({
        where: {
            name: {
                contains: filters.name,
            },
            managementOrganizationId: filters.managementOrganizationId,
            deletedAt: null,
        },
    })

    const _debouncedSearchText = _.debounce(setSearchText, 500)
    const { onOpen, onClose } = useDisclosure<string>({
        tag: 'PutSubjectModal',
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }
    const { mutateAsync: updateSubject } = useUpdateSubjectVersion()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateSubject({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }
    const { data: dataSchoolYear = [], refetch: refetchSchoolYear } = useFindManySchoolYear({
        orderBy: { startDate: 'desc' },
    })
    useEffect(() => {
        if (dataSchoolYear && dataSchoolYear.length > 0) {
            const today = new Date()
            const currentSchoolYear = dataSchoolYear.find((year) => {
                const start = new Date(year.startDate)
                const end = year.endDate ? new Date(year.endDate) : undefined
                if (end) {
                    return today >= start && today <= end
                }
                return today >= start
            })
            if (currentSchoolYear) {
                setFilters((prev: any) => ({
                    ...prev,
                    schoolYearId: currentSchoolYear.id,
                }))
            }
        }
    }, [dataSchoolYear])
    const { data: manageOrgData = [] } = useFindManyDM_DonVi({
        where: whereOrganization,
        orderBy: [{ iSTT: 'asc' }, { sTen: 'asc' }],
    })
    const treeData = buildOrgTree(manageOrgData)
    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )
    const handleFilterChange = (key: any, value: any) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }
    return (
        <div style={{ width: '100%' }}>
            <Divider orientation="left" orientationMargin={0}>
                Phiên bản môn học
            </Divider>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        {/* Tìm kiếm */}
                        <Col span={6}>
                            <Form.Item label="Tìm kiếm" name="search">
                                <Input
                                    allowClear
                                    onPressEnter={(e) => {
                                        const value = e.currentTarget.value?.trim()
                                        handleFilterChange('name', value)
                                    }}
                                    onChange={(e) => {
                                        if (!e.target.value || e.target.value === '') {
                                            handleFilterChange('name', undefined)
                                        }
                                    }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            {/* <Form.Item label="Năm học" name="schoolYearId" value={filters.schoolYearId}> */}
                            <Flex justify="space-between" align="center">
                                <p>Đơn vị phụ trách</p>
                                <TreeSelect
                                    className="w-[200px]"
                                    allowClear
                                    showSearch
                                    placeholder="Chọn đơn vị quản lý"
                                    treeDefaultExpandAll
                                    treeData={treeData}
                                    onChange={(val) =>
                                        handleFilterChange('managementOrganizationId', val)
                                    }
                                />
                            </Flex>

                            {/* </Form.Item> */}
                        </Col>
                        {/* Thêm mới */}
                        <Col span={6}>
                            <Flex justify="end">
                                <Button onClick={handleModal} type="primary">
                                    Thêm mới
                                </Button>
                            </Flex>
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
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Tên môn',
                                dataIndex: 'name',
                                align: 'center',
                            },
                            {
                                title: 'Đơn vị phụ trách',
                                dataIndex: 'managementOrganization',
                                align: 'center',
                                render: (value) => (value?.sMa ? value?.sMa : ''),
                            },
                            {
                                title: 'Tín chỉ',
                                align: 'center',
                                dataIndex: 'credit',
                            },
                            {
                                title: 'Số tiết',
                                align: 'center',
                                dataIndex: 'period',
                            },
                            {
                                title: 'Số tiết',
                                align: 'center',
                                dataIndex: 'numberOfTheory',
                            },
                            {
                                title: 'Số tiết TH',
                                align: 'center',
                                dataIndex: 'numberOfPractice',
                            },
                            {
                                title: 'Số tiết tự học',
                                align: 'center',
                                dataIndex: 'numberOfSelfStudy',
                            },
                            {
                                title: 'Số tiết thực tập',
                                align: 'center',
                                dataIndex: 'numberOfInternship',
                            },
                            {
                                title: 'Số tiết đồ án',
                                align: 'center',
                                dataIndex: 'numberOfProject',
                            },
                            {
                                title: 'Số tiết khác',
                                align: 'center',
                                dataIndex: 'numberOfOther',
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
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
                                                onConfirm: () => handleDelete(id),
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

// SubjectPage.getLayout = function getLayout(page: React.ReactElement) {
//     return <DefaultLayout>{page}</DefaultLayout>
// }
