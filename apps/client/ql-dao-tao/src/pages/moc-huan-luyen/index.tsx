import Select from '@components/commons/select'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutMilestoneModal } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { SchoolYear } from '@workspace/db'
import {
    useCountMilestone,
    useFindManyMilestone,
    useFindManySchoolYear,
    useUpdateMilestone,
} from '@workspace/db/hooks'
import { Button, Col, Divider, Flex, Form, Input, message, Row } from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import type React from 'react'
import { useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function MilestonePage() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [searchText, setSearchText] = useState<string>('')
    const [filters, setFilters] = useState({
        schoolYearId: undefined,
    })
    const { data = [], refetch } = useFindManyMilestone({
        where: {
            name: {
                contains: searchText,
            },
            schoolYearId: filters.schoolYearId,
        },
        include: {
            schoolYear: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountMilestone({
        where: {
            name: {
                contains: searchText,
            },
            schoolYearId: filters.schoolYearId,
        },
    })

    const debouncedSearchText = _.debounce(setSearchText, 500)
    const { onOpen, onClose } = useDisclosure<string>({
        tag: PutMilestoneModal.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }
    const { mutateAsync: updateMilestone } = useUpdateMilestone()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateMilestone({
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
    const { data: dataSchoolYear = [], refetch: refetchSchoolYear } = useFindManySchoolYear()
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

    return (
        <div>
            <Divider orientation="left" orientationMargin={0}>
                Mốc huấn luyện
            </Divider>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        {/* Tìm kiếm */}
                        <Col span={6}>
                            <Form.Item label="Tìm kiếm" name="search">
                                <Input
                                    id="search"
                                    onChange={(e) => debouncedSearchText(e.target.value)}
                                    placeholder="Tìm kiếm"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            {/* <Form.Item label="Năm học" name="schoolYearId" value={filters.schoolYearId}> */}
                            <Flex justify="space-between" align="center">
                                <label htmlFor="schoolYearId">Năm học:</label>
                                <Select
                                    id="schoolYearId"
                                    className="w-[70%]"
                                    placeholder="Chọn năm học"
                                    allowClear
                                    options={dataSchoolYear.map((i: SchoolYear) => {
                                        return {
                                            value: i.id,
                                            label: i.name,
                                        }
                                    })}
                                    value={filters.schoolYearId}
                                    onChange={(value: number | null) => {
                                        setFilters((prev: any) => ({
                                            ...prev,
                                            schoolYearId: value ?? undefined,
                                        }))
                                    }}
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
                                title: 'Nội dung',
                                align: 'center',
                                dataIndex: 'name',
                            },
                            {
                                title: 'Số tiết',
                                align: 'center',
                                dataIndex: 'period',
                            },
                            {
                                title: 'Năm học',
                                align: 'center',
                                dataIndex: 'schoolYear',
                                render: (value) => (value?.name ? value?.name : ''),
                            },
                            {
                                title: 'Ngày bắt đầu',
                                align: 'center',
                                render: ({ startDate }) => dayjs(startDate).format('DD/MM/YYYY'),
                            },
                            {
                                title: 'Ngày kết thúc',
                                align: 'center',
                                render: ({ endDate }) =>
                                    endDate ? dayjs(endDate).format('DD/MM/YYYY') : '',
                            },
                            {
                                title: 'Mô tả',
                                align: 'center',
                                dataIndex: 'description',
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

MilestonePage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
