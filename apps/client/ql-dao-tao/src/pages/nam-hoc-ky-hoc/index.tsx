import { EyeOutlined, FilterFilled } from '@ant-design/icons'
import Select from '@components/commons/select'
import TableCollapse from '@components/commons/tableCollapse'
import CreateIcon from '@components/icons/create'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutSchoolYearModal, PutSemesterModal } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { useSemesterTypeOptions } from '@hooks/semesterType'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { SchoolYear, SemesterType } from '@workspace/db'
import {
    useCountSchoolYear,
    useFindManySchoolYear,
    useUpdateSchoolYear,
    useUpdateSemester,
} from '@workspace/db/hooks'
import { ROUTER_PATH } from '@workspace/router'
import { Button, Col, Flex, Form, Input, message, Radio, Row, Tag, Tooltip } from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import { BookPlus, Search } from 'lucide-react'
import { useRouter } from 'next/router'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

interface FilterProps {
    schoolYearId: string | undefined
    semesterType: SemesterType | undefined
}

function YearAndSemester() {
    const router = useRouter()
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [searchText, setSearchText] = useState<string>('')
    const [filters, setFilters] = useState<FilterProps>({
        schoolYearId: undefined,
        semesterType: undefined,
    })

    const { options, getSemesterTypeLabel } = useSemesterTypeOptions()

    const { data = [], refetch } = useFindManySchoolYear({
        where: {
            ...(filters.schoolYearId && filters.schoolYearId !== ''
                ? {
                      id: {
                          contains: filters.schoolYearId,
                          mode: 'insensitive',
                      },
                  }
                : {}),
            ...(searchText && {
                semesters: {
                    some: {
                        OR: [
                            {
                                name: {
                                    contains: searchText,
                                    mode: 'insensitive',
                                },
                            },
                            {
                                code: {
                                    contains: searchText,
                                    mode: 'insensitive',
                                },
                            },
                        ],
                    },
                },
            }),
            ...(filters.semesterType !== undefined && {
                semesters: {
                    some: {
                        semesterType: filters.semesterType,
                    },
                },
            }),
        },
        orderBy: {
            createdAt: 'desc',
        },
        include: {
            semesters: {
                where: {
                    ...(searchText !== ''
                        ? {
                              OR: [
                                  {
                                      name: {
                                          contains: searchText,
                                          mode: 'insensitive',
                                      },
                                  },
                                  {
                                      code: {
                                          contains: searchText,
                                          mode: 'insensitive',
                                      },
                                  },
                              ],
                          }
                        : {}),
                    ...(filters.semesterType !== undefined && {
                        semesterType: filters.semesterType,
                    }),
                },
            },
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
            id: filters.schoolYearId,
            ...(searchText && {
                OR: [
                    {
                        semesters: {
                            some: {
                                name: {
                                    contains: searchText,
                                    mode: 'insensitive',
                                },
                            },
                        },
                    },
                    {
                        name: {
                            contains: searchText,
                            mode: 'insensitive',
                        },
                    },
                ],
            }),
        },
    })

    const debouncedSearchText = _.debounce(setSearchText, 500)

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )
    const { onOpen: onOpenSchoolYear, onClose: onCloseSchoolYear } = useDisclosure<string>({
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
        } catch (_error) {
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
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const handleFilterChange = (key: string, value: any) => {
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
                                        onChange={(e) => debouncedSearchText(e.target.value)}
                                        placeholder="Tìm kiếm kỳ học..."
                                        className="py-0"
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
                                        options={dataFilterSchoolYear.map((i: SchoolYear) => {
                                            return {
                                                value: i.id,
                                                label: i.name,
                                            }
                                        })}
                                        onChange={(val) => handleFilterChange('schoolYearId', val)}
                                        allowClear
                                    />
                                </Form.Item>
                            </Col>
                        </Flex>
                    </Col>

                    {/* Thêm mới */}
                    <Col span={12}>
                        <Flex justify="end" gap={10}>
                            <Button onClick={handleModal} className="border-primary text-primary">
                                <BookPlus />
                                Thêm mới năm học
                            </Button>
                            <Button onClick={handleModalSemester} type="primary">
                                <BookPlus />
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
                            fixed: 'left',
                        },
                        {
                            title: 'Tên học kỳ',
                            dataIndex: 'name',
                            align: 'center',
                            width: 250,
                            fixed: 'left',
                        },
                        {
                            title: 'Loại học kỳ',
                            dataIndex: 'semesterType',
                            align: 'center',
                            width: 120,
                            filterDropdown: ({ confirm }) => (
                                <div style={{ padding: 8 }}>
                                    <Radio.Group
                                        options={options}
                                        value={filters.semesterType}
                                        onChange={(e) => {
                                            handleFilterChange('semesterType', e.target.value)
                                            confirm()
                                        }}
                                        className="flex flex-col"
                                    />
                                    <div className="flex mt-2 justify-end w-full">
                                        <Button
                                            size="small"
                                            onClick={() => {
                                                handleFilterChange('semesterType', undefined)
                                                confirm()
                                            }}
                                        >
                                            Bỏ lọc
                                        </Button>
                                    </div>
                                </div>
                            ),
                            filterIcon: () => (
                                <FilterFilled
                                    style={{ color: filters.semesterType ? '#005f37' : undefined }}
                                />
                            ),
                            render: (value) => getSemesterTypeLabel(value),
                        },
                        {
                            title: 'Thời gian bắt đầu',
                            align: 'center',
                            // dataIndex: 'startDate',
                            width: 140,
                            sorter: (a, b) => dayjs(a.startDate).unix() - dayjs(b.startDate).unix(),
                            render: ({ startDate }) => dayjs(startDate).format('DD/MM/YYYY'),
                        },
                        {
                            title: 'Thời gian kết thúc',
                            align: 'center',
                            // dataIndex: 'endDate',
                            width: 140,
                            sorter: (a, b) => dayjs(a.endDate).unix() - dayjs(b.endDate).unix(),
                            render: ({ endDate }) =>
                                endDate ? dayjs(endDate).format('DD/MM/YYYY') : '',
                        },
                        {
                            title: 'Mô tả',
                            dataIndex: 'description',
                            align: 'center',
                            width: 300,
                            render: (value) => <span className="line-clamp-1">{value}</span>,
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
                                    <Tooltip
                                        title="Cảnh cáo học tập, Xét học bổng"
                                        placement="top"
                                    >
                                        <EyeOutlined
                                            onClick={(e: any) => {
                                                e.stopPropagation()
                                                router.push(
                                                    `${ROUTER_PATH.QL_DAO_TAO.NAM_HOC_KY_HOC}/${id}`
                                                )
                                            }}
                                            className="text-sm cursor-pointer"
                                        />
                                    </Tooltip>
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
                                            onConfirm: () => handleDeleteSemester(id),
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
                    defaultExpandAll
                    headerRight={({ id }) => (
                        <div className="flex gap-2.5 w-[88px] items-center">
                            <CreateIcon
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onOpenSemester({
                                        schoolYearId: id,
                                        semesterId: '',
                                    })
                                }}
                                title="Thêm học kỳ"
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
