import { EyeOutlined } from '@ant-design/icons'
import { fetchUpdateUser } from '@api/open-api/appComponents'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import { PutSchoolYearModal } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import {
    useCountSchoolYear,
    useFindManySchoolYear,
    useUpdateSchoolYear,
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
    message,
} from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import type React from 'react'
import { useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import EditIcon from '@components/icons/edit'

export default function SchoolYearPage({
    selectedSchoolYear,
    setSelectedSchoolYear,
}: any) {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [searchText, setSearchText] = useState<string>('')

    const { data = [], refetch } = useFindManySchoolYear({
        where: {
            name: {
                contains: searchText,
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountSchoolYear({
        where: {
            name: {
                contains: searchText,
            },
        },
    })

    const debouncedSearchText = _.debounce(setSearchText, 500)
    const { onOpen, onClose } = useDisclosure<string>({
        tag: PutSchoolYearModal.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }
    const { mutateAsync: updateSchoolYear } = useUpdateSchoolYear()
    async function handleDelete(id: string) {
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

    async function handleLockAcc(id: string, accountLocked: boolean) {
        if (!id) return
        try {
            showSpinner()
            await fetchUpdateUser({
                pathParams: {
                    id: id,
                },
                body: {
                    accountLocked: !accountLocked,
                },
            })
            message.success('Cập nhật thành công')
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
        refetch()
        onClose()
    }
    return (
        <div>
            <Divider orientation="left" orientationMargin={0}>
                Năm học
            </Divider>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top">
                        {/* Tìm kiếm */}
                        <Col span={12}>
                            <Form.Item label="Tìm kiếm" name="search">
                                <Input
                                    id="search"
                                    onChange={(e) =>
                                        debouncedSearchText(e.target.value)
                                    }
                                    placeholder="Tìm kiếm"
                                />
                            </Form.Item>
                        </Col>

                        {/* Thêm mới */}
                        <Col span={12}>
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
                            // {
                            //     title: 'Mã năm học',
                            //     dataIndex: 'code',
                            // },
                            {
                                title: 'Tên năm học',
                                dataIndex: 'name',
                                align: 'center',
                            },
                            {
                                title: 'Ngày bắt đầu',
                                align: 'center',
                                // dataIndex: 'startDate',
                                render: ({ startDate }) =>
                                    dayjs(startDate).format('DD/MM/YYYY'),
                            },
                            {
                                title: 'Ngày kết thúc',
                                align: 'center',
                                // dataIndex: 'endDate',
                                render: ({ endDate }) =>
                                    endDate
                                        ? dayjs(endDate).format('DD/MM/YYYY')
                                        : '',
                            },
                            {
                                title: 'Mô tả',
                                dataIndex: 'description',
                                align: 'center',
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
                                                onClick={(e: any) => {
                                                    e.stopPropagation()
                                                    onOpen(id)
                                                }}
                                                className="text-sm text-blue-700 cursor-pointer"
                                            />
                                        </Tooltip> */}
                                        <EditIcon
                                            onClick={(e: any) => {
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
                                            onClick={(e: any) => {
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
                            showTotal: (total, range) =>
                                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
                        }}
                        onRowClick={(record) => {
                            setSelectedSchoolYear(record)
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}

SchoolYearPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
