import { EyeOutlined } from '@ant-design/icons'
import { fetchUpdateUser } from '@api/open-api/appComponents'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import { PutCurriculumVersionModal } from '@components/modal'
import { CTDT_STATUS, DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type {
    Curriculum,
    CurriculumStatus,
    CurriculumVersion,
    SchoolYear,
} from '@workspace/db'
import {
    useCountCurriculumVersion,
    useFindManyCurriculum,
    useFindManyCurriculumVersion,
    useFindManySchoolYear,
    useUpdateCurriculumVersion,
} from '@workspace/db/hooks'
import {
    Button,
    Col,
    Divider,
    Flex,
    Form,
    Input,
    Row,
    Tag,
    Tooltip,
    message,
} from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import Select from '@components/commons/select'

interface FilterProps {
    name: string | undefined
    startDate: string | undefined
    endDate: string | undefined
    curriculumId: string | undefined
}
export default function CurriculumVersionPage({ curriculumInfo }: any) {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [searchText, setSearchText] = useState<string>('')
    const [filters, setFilters] = useState<FilterProps>({
        name: '',
        startDate: undefined,
        endDate: undefined,
        curriculumId: curriculumInfo ? curriculumInfo.id : undefined,
    })
    const { data = [], refetch } = useFindManyCurriculumVersion({
        where: {
            name: {
                contains: filters.name,
            },
            ...(filters.curriculumId
                ? { curriculumId: filters.curriculumId }
                : {}),
            ...(filters.startDate && filters.endDate
                ? {
                      startDate: {
                          gte: new Date(filters.startDate),
                          lte: new Date(filters.endDate),
                      },
                  }
                : {}),
        },
        include: {
            Curriculum: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountCurriculumVersion({
        where: {
            name: {
                contains: searchText,
            },
            ...(filters.curriculumId
                ? { curriculumId: filters.curriculumId }
                : {}),
            ...(filters.startDate && filters.endDate
                ? {
                      startDate: {
                          gte: new Date(filters.startDate),
                          lte: new Date(filters.endDate),
                      },
                  }
                : {}),
        },
    })

    const debouncedSearchText = _.debounce(setSearchText, 500)
    const { onOpen, onClose } = useDisclosure<string>({
        tag: PutCurriculumVersionModal.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }
    const { mutateAsync: updateCurriculumVersion } =
        useUpdateCurriculumVersion()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateCurriculumVersion({
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
    const { data: dataSchoolYear = [], refetch: refetchSchoolYear } =
        useFindManySchoolYear()
    const { data: dataCurriculum = [], refetch: refetchCurriculum } =
        useFindManyCurriculum()
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
                setFilters((prev: FilterProps) => ({
                    ...prev,
                    schoolYearId: currentSchoolYear.id,
                }))
            }
        }
    }, [dataSchoolYear])

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )
    const handleFilterChange = (
        key: string,
        value: string | { startDate?: string; endDate?: string } | undefined
    ) => {
        if (key !== 'time') {
            setFilters((prev) => {
                const newFilters = { ...prev, [key]: value }
                debouncedRefetch()
                return newFilters
            })
        } else {
            if (typeof value === 'object' && value !== null) {
                setFilters((prev) => {
                    const newFilters = {
                        ...prev,
                        startDate: value.startDate ?? undefined,
                        endDate: value.endDate ?? undefined,
                    }
                    debouncedRefetch()
                    return newFilters
                })
            }
        }
    }

    async function handleStatusChange(id: string, newStatus: CurriculumStatus) {
        try {
            showSpinner()
            await updateCurriculumVersion({
                where: {
                    id,
                },
                data: {
                    status: newStatus,
                },
            })
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }
    const options = Object.entries(CTDT_STATUS).map(
        ([value, { label, color }]) => ({
            value,
            label: <Tag color={color}>{label}</Tag>, // hiển thị trong dropdown
        })
    )
    return (
        <div>
            <Divider orientation="left" orientationMargin={0}>
                Phiên bản chương trình đào tạo
            </Divider>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        {/* Tìm kiếm */}
                        <Col span={6}>
                            <Form.Item label="Tìm kiếm" name="search">
                                <Input
                                    id="search"
                                    allowClear
                                    onPressEnter={(e) => {
                                        const value =
                                            e.currentTarget.value?.trim()
                                        handleFilterChange('name', value)
                                    }}
                                    onChange={(e) => {
                                        if (
                                            !e.target.value ||
                                            e.target.value === ''
                                        ) {
                                            handleFilterChange(
                                                'name',
                                                undefined
                                            )
                                        }
                                    }}
                                    placeholder="Tìm kiếm theo tên,..."
                                />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Flex justify="space-between" align="center">
                                {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
                                <label>Năm học:</label>
                                <Select
                                    className="w-[70%]"
                                    placeholder="Chọn năm học"
                                    allowClear
                                    options={dataSchoolYear.map(
                                        (i: SchoolYear) => {
                                            return {
                                                value: i.id,
                                                label: i.name,
                                                startDate: i.startDate,
                                                endDate: i.endDate,
                                            }
                                        }
                                    )}
                                    // value={filters.schoolYearId}
                                    onChange={(
                                        value: number | null,
                                        option: any
                                    ) => {
                                        handleFilterChange(
                                            'time',
                                            option ?? undefined
                                        )
                                    }}
                                />
                            </Flex>

                            {/* </Form.Item> */}
                        </Col>
                        {!curriculumInfo && (
                            <Col span={6}>
                                <Flex justify="space-between" align="center">
                                    {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
                                    <label>CTĐT:</label>
                                    <Select
                                        className="w-[70%]"
                                        placeholder="Chọn chương trình đào tạo"
                                        allowClear
                                        options={dataCurriculum.map(
                                            (i: Curriculum) => {
                                                return {
                                                    value: i.id,
                                                    label: i.name,
                                                }
                                            }
                                        )}
                                        // value={filters.schoolYearId}
                                        onChange={(
                                            value: string | undefined,
                                            option: any
                                        ) => {
                                            handleFilterChange(
                                                'curriculumId',
                                                value
                                            )
                                        }}
                                    />
                                </Flex>

                                {/* </Form.Item> */}
                            </Col>
                        )}
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
                {curriculumInfo && count === 0 ? (
                    <Col span={24}>
                        <Flex justify="center">Không có dữ liệu</Flex>
                    </Col>
                ) : (
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
                                        (currentPage - 1) *
                                            DEFAULT_PAGINATE_SIZE,
                                },
                                {
                                    title: 'Nội dung',
                                    dataIndex: 'name',
                                },
                                {
                                    title: 'CTĐT',
                                    dataIndex: 'Curriculum',
                                    width: 120,
                                    render: (value: Curriculum) =>
                                        value?.name ? value?.name : '',
                                },
                                {
                                    title: 'Ngày bắt đầu',
                                    // dataIndex: 'startDate',
                                    render: ({ startDate }) =>
                                        dayjs(startDate).format('DD/MM/YYYY'),
                                },
                                {
                                    title: 'Ngày kết thúc',
                                    // dataIndex: 'endDate',
                                    render: ({ endDate }) =>
                                        endDate
                                            ? dayjs(endDate).format(
                                                  'DD/MM/YYYY'
                                              )
                                            : '',
                                },
                                {
                                    title: 'Tài liệu',
                                    render: ({ documentPath }) =>
                                        documentPath ? (
                                            <a
                                                href={documentPath}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    color: 'blue',
                                                    textDecoration: 'underline',
                                                }}
                                            >
                                                Xem thêm
                                            </a>
                                        ) : (
                                            ''
                                        ),
                                },
                                {
                                    title: 'Tài liệu kết xuất',
                                    render: ({ renderPath }) =>
                                        renderPath ? (
                                            <a
                                                href={renderPath}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    color: 'blue',
                                                    textDecoration: 'underline',
                                                }}
                                            >
                                                Xem thêm
                                            </a>
                                        ) : (
                                            ''
                                        ),
                                },
                                {
                                    title: 'Thông tin',
                                    dataIndex: 'infomation',
                                    // width: 100,
                                },
                                {
                                    title: 'Trạng thái',
                                    width: 130,
                                    render: (record: CurriculumVersion) => {
                                        return (
                                            <Select
                                                className="w-[155px]"
                                                value={record.status}
                                                onChange={(newStatus) =>
                                                    handleStatusChange(
                                                        record.id,
                                                        newStatus as CurriculumStatus
                                                    )
                                                }
                                                options={options}
                                                optionLabelProp="label"
                                                // style={{ width: 180 }}
                                                bordered={false}
                                                showSearch={false}
                                            />
                                        )
                                    },
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
                                                    onClick={onOpen.bind(
                                                        null,
                                                        id
                                                    )}
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
                )}
            </Row>
        </div>
    )
}

CurriculumVersionPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
