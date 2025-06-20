import { PlusOutlined } from '@ant-design/icons'
import Select from '@components/commons/select'
import TableCollapse from '@components/commons/tableCollapse'
import CreateIcon from '@components/icons/create'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutSchoolYearModal, PutSemesterModal } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { SchoolYear } from '@workspace/db'
import {
    useCountSchoolYear,
    useFindManySchoolYear,
    useUpdateSchoolYear,
    useUpdateSemester,
} from '@workspace/db/hooks'
import { Button, Col, Flex, Form, Input, Row, Tag, message } from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import { Search } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

interface FilterProps {
    schoolYearId: string | undefined
}

function YearAndSemester() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [searchText, setSearchText] = useState<string>('')
    const [filters, setFilters] = useState<FilterProps>({
        schoolYearId: undefined,
    })

    const { data = [], refetch } = useFindManySchoolYear({
        where: {
            id: filters.schoolYearId,
            ...(searchText && {
                semesters: {
                    some: {
                        name: {
                            contains: searchText,
                        },
                    },
                },
            }),
        },
        orderBy: {
            createdAt: 'desc',
        },
        include: {
            semesters: true,
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: dataFilterSchoolYear = [] } = useFindManySchoolYear({
        take: 1000,
        skip: 0,
    })

    const { data: count } = useCountSchoolYear({
        where: {
            name: {
                contains: searchText,
            },
        },
    })

    const debouncedSearchText = _.debounce(setSearchText, 500)

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )
    const { onOpen: onOpenSchoolYear, onClose: onCloseSchoolYear } =
        useDisclosure<string>({
            tag: PutSchoolYearModal.name,
        })

    const { onOpen: onOpenSemester, onClose: onCloseSemester } = useDisclosure<{
        schoolYearId: string
        semesterId: string
    }>({
        tag: PutSemesterModal.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpenSchoolYear()
    }

    const handleModalSemester = () => {
        onOpenSemester()
    }
    const { mutateAsync: updateSchoolYear } = useUpdateSchoolYear()
    async function handleDeleteSchoolYear(id: string) {
        try {
            showSpinner()
            await updateSchoolYear({
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

    const { mutateAsync: updateSemester } = useUpdateSemester()
    async function handleDeleteSemester(id: string) {
        try {
            showSpinner()
            await updateSemester({
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

    return (
        <Row gutter={[16, 0]}>
            <Col span={24}>
                <Row gutter={[16, 16]} align="top">
                    {/* Tìm kiếm */}
                    <Col span={12}>
                        <Flex>
                            <Col span={12}>
                                <Form.Item name="search">
                                    <Input
                                        id="search"
                                        onChange={(e) =>
                                            debouncedSearchText(e.target.value)
                                        }
                                        placeholder="Nhập tên kỳ học..."
                                        style={{
                                            height: 40,
                                        }}
                                        prefix={
                                            <Search
                                                size={15}
                                                style={{
                                                    color: 'rgba(0, 0, 0, 0.25)',
                                                }}
                                            />
                                        }
                                        allowClear
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="schoolYearId">
                                    <Select
                                        placeholder="Chọn năm học"
                                        options={dataFilterSchoolYear.map(
                                            (i: SchoolYear) => {
                                                return {
                                                    value: i.id,
                                                    label: i.name,
                                                }
                                            }
                                        )}
                                        style={{
                                            height: 40,
                                        }}
                                        onChange={(val) =>
                                            handleFilterChange(
                                                'schoolYearId',
                                                val
                                            )
                                        }
                                        allowClear
                                    />
                                </Form.Item>
                            </Col>
                        </Flex>
                    </Col>

                    {/* Thêm mới */}
                    <Col span={12}>
                        <Flex justify="end" gap={10}>
                            <Button
                                onClick={handleModal}
                                className="border-primary text-primary h-[40px]"
                            >
                                <PlusOutlined />
                                Thêm mới năm học
                            </Button>
                            <Button
                                onClick={handleModalSemester}
                                type="primary"
                                className="h-[40px]"
                            >
                                <PlusOutlined />
                                Thêm mới kỳ học
                            </Button>
                        </Flex>
                    </Col>
                </Row>
            </Col>
            <Col span={24}>
                <TableCollapse
                    rowKey={'key'}
                    headerTitleKey={'name'}
                    childrenFieldName="semesters"
                    currentPage={currentPage}
                    columns={[
                        {
                            title: 'Mã kỳ',
                            dataIndex: 'code',
                            align: 'center',
                            width: 140,
                        },
                        {
                            title: 'Tên học kỳ',
                            dataIndex: 'name',
                            align: 'center',
                            width: 340,
                        },
                        {
                            title: 'Thời gian bắt đầu',
                            align: 'center',
                            // dataIndex: 'startDate',
                            width: 150,
                            render: ({ startDate }) =>
                                dayjs(startDate).format('DD/MM/YYYY'),
                        },
                        {
                            title: 'Thời gian kết thúc',
                            align: 'center',
                            // dataIndex: 'endDate',
                            width: 170,
                            render: ({ endDate }) =>
                                endDate
                                    ? dayjs(endDate).format('DD/MM/YYYY')
                                    : '',
                        },
                        {
                            title: 'Mô tả',
                            dataIndex: 'description',
                            align: 'center',
                            width: 500,
                            render: (value) => (
                                <span className="line-clamp-1">{value}</span>
                            ),
                        },
                        {
                            title: 'Trạng thái',
                            align: 'center',
                            width: 140,
                            fixed: 'right',
                            render: (value, record) => {
                                return !record?.active ? (
                                    <Tag color="default">Ngừng đào tạo</Tag>
                                ) : (
                                    <Tag color="success">Đang đào tạo</Tag>
                                )
                            },
                        },
                        {
                            title: 'Thao tác',
                            width: 100,
                            align: 'center',
                            fixed: 'right',
                            render: (_, { id, schoolYearId }) => (
                                <Row className="justify-center gap-2">
                                    {/* <Tooltip
                                                    title="Xem chi tiết"
                                                    placement="leftTop"
                                                >
                                                    <EyeOutlined
                                                        onClick={(e: any) => {
                                                            e.stopPropagation()
                                                            onOpen(id)
                                                        }}
                                                        className="text-sm text-blue-700 cursor-pointer"
                                                    />
                                                </Tooltip> */}
                                    <EditIcon
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onOpenSemester({
                                                schoolYearId: schoolYearId,
                                                semesterId: id,
                                            })
                                        }}
                                        className="text-sm text-blue-700 cursor-pointer"
                                    />
                                    <DeleteIcon
                                        popConfirm={{
                                            onConfirm: () =>
                                                handleDeleteSemester(id),
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation()
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
                    headerRight={({ id }) => (
                        <div className="flex gap-2.5 w-[80px] items-center">
                            <CreateIcon
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onOpenSemester({
                                        schoolYearId: id,
                                        semesterId: '',
                                    })
                                }}
                                title="Thêm năm học"
                            />
                            <EditIcon
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onOpenSchoolYear(id)
                                }}
                                className="text-sm text-blue-700 cursor-pointer"
                            />
                            <DeleteIcon
                                popConfirm={{
                                    onConfirm: () => handleDeleteSchoolYear(id),
                                }}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    )}
                />
            </Col>
        </Row>
    )
}

export default YearAndSemester

YearAndSemester.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
