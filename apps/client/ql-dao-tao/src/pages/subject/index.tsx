import { EyeOutlined } from '@ant-design/icons'
import { fetchUpdateUser } from '@api/open-api/appComponents'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import { PutSubjectModal } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE, SUBJECT_EQUIVALENT_TYPE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { SchoolYear } from '@workspace/db'
import {
    useCountSubject,
    useFindManySubject,
    useFindManySchoolYear,
    useUpdateSubject,
    useFindManyOrganization,
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
    TreeSelect,
    message,
} from 'antd'
import dayjs from 'dayjs'
import _, { filter } from 'lodash'
import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import Select from '@components/commons/select'
import { buildOrgTree } from '@lib/utils'

export default function SubjectPage() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [searchText, setSearchText] = useState<string>('')
    const [filters, setFilters] = useState({
        managementOrganizationId: undefined,
        name: ''
    });
    const { data = [], refetch } = useFindManySubject({
        where: {
            name: {
                contains: filters.name,
            },
            managementOrganizationId: filters.managementOrganizationId,
        },
        include: {
            ManagementOrganization: true,
            SubjectGroup: true
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountSubject({
        where: {
            name: {
                contains: filters.name,
            },
            managementOrganizationId: filters.managementOrganizationId,
        },
    })

    const debouncedSearchText = _.debounce(setSearchText, 500)
    const { onOpen, onClose } = useDisclosure<string>({
        tag: PutSubjectModal.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }
    const { mutateAsync: updateSubject } = useUpdateSubject()
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
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }
    const { data: dataSchoolYear = [], refetch: refetchSchoolYear } = useFindManySchoolYear({
        take: 1000,
        skip: 0,
    })
    useEffect(() => {
        if (dataSchoolYear && dataSchoolYear.length > 0) {
            const today = new Date();
            const currentSchoolYear = dataSchoolYear.find((year) => {
                const start = new Date(year.startDate);
                const end = year.endDate ? new Date(year.endDate) : undefined;
                if (end) {
                    return today >= start && today <= end;
                }
                return today >= start;
            });
            if (currentSchoolYear) {
                setFilters((prev: any) => ({
                    ...prev,
                    schoolYearId: currentSchoolYear.id,
                }));
            }
        }
    }, [dataSchoolYear]);
    const { data: manageOrgData = [], refetch: refetchManageOrg } =
        useFindManyOrganization({
            take: 1000,
            skip: 0,
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
            const newFilters = { ...prev, [key]: value };
            debouncedRefetch();
            return newFilters;
        });

    };
    return (
        <div>
            <Divider orientation="left" orientationMargin={0}>
                Môn học
            </Divider>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        {/* Tìm kiếm */}
                        <Col span={6}>
                            <Form.Item label="Tìm kiếm" name="search">
                                <Input
                                    allowClear
                                    onPressEnter={(e) => {
                                        const value = e.currentTarget.value?.trim();
                                        handleFilterChange('name', value);
                                    }}
                                    onChange={(e) => {
                                        if (!e.target.value || e.target.value === "") {
                                            handleFilterChange('name', undefined);
                                        }
                                    }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            {/* <Form.Item label="Năm học" name="schoolYearId" value={filters.schoolYearId}> */}
                            <Flex justify='space-between' align='center'>
                                <label>Đơn vị phụ trách</label>
                                <TreeSelect
                                    className='w-[200px]'
                                    allowClear
                                    showSearch
                                    treeDefaultExpandAll
                                    treeData={treeData}
                                    filterTreeNode={(input, node) =>
                                        (node.title as string)
                                            .toLowerCase()
                                            .includes(input.toLowerCase())
                                    }
                                    onChange={(val) => handleFilterChange('managementOrganizationId', val)}
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
                                    index +
                                    1 +
                                    (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Tên môn học',
                                dataIndex: 'name',
                            },
                            {
                                title: 'Nhóm môn học',
                                dataIndex: 'SubjectGroup',
                                render: (value) =>
                                    value?.name ? value?.name : '',
                            },
                            {
                                title: 'Đơn vị phụ trách',
                                dataIndex: 'ManagementOrganization',
                                render: (value) =>
                                    value?.name ? value?.name : '',
                            },
                            {
                                title: 'Loại môn học tương đương',
                                dataIndex: 'subjectEquivalentType',
                                render: (value: any) => SUBJECT_EQUIVALENT_TYPE[value as keyof typeof SUBJECT_EQUIVALENT_TYPE],
                            },
                            {
                                title: 'Số tín chỉ',
                                align: "center",
                                dataIndex: 'credit',
                            },
                            {
                                title: 'Số tiết',
                                align: "center",
                                dataIndex: 'period',
                            },
                            {
                                title: 'Số tiết LT',
                                align: "center",
                                dataIndex: 'numberOfTheory',
                            },
                            {
                                title: 'Số tiết TH',
                                align: "center",
                                dataIndex: 'numberOfPractice',
                            },
                            {
                                title: 'Số tiết tự học',
                                align: "center",
                                dataIndex: 'numberOfSelfStudy',
                            },
                            {
                                title: 'Số tiết thực tập',
                                align: "center",
                                dataIndex: 'numberOfInternship',
                            },
                            {
                                title: 'Số tiết đồ án',
                                align: "center",
                                dataIndex: 'numberOfProject',
                            },
                            {
                                title: 'Số tiết khác',
                                align: "center",
                                dataIndex: 'numberOfOther',
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
                    />
                </Col>
            </Row>
        </div>
    )
}

SubjectPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
