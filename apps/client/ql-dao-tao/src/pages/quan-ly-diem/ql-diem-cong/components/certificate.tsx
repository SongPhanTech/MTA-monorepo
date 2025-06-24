import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutCertificateScoreModal } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import {
    useCountArchivedCertificate,
    useFindManyArchivedCertificate,
    useUpdateArchivedCertificate,
} from '@workspace/db/hooks'
import { Button, Col, Flex, Form, Input, Row, message } from 'antd'
import _ from 'lodash'
import type React from 'react'
import { useCallback, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

// const { Option } = Select;
interface FilterProps {
    searchText: string | ''
}

export default function ArchivedCertificate() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    const [filters, setFilters] = useState<FilterProps>({
        searchText: '',
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { onOpen, onClose } = useDisclosure<string>({
        tag: PutCertificateScoreModal.name,
    })

    const handleModal = () => {
        onOpen()
    }

    // const { convertScore } = useScoreConverter(
    //     data?.[0]?.trainingCoursesStart?.[0]?.scoreConverts
    // )

    const { mutateAsync: updateArchivedCertificate } =
        useUpdateArchivedCertificate()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateArchivedCertificate({
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

    const { data: dataTable = [], refetch } = useFindManyArchivedCertificate({
        where: {
            OR: [
                { name: { contains: filters.searchText, mode: 'insensitive' } },
                { code: { contains: filters.searchText, mode: 'insensitive' } },
            ],
        },
        include: {},
        orderBy: {
            createdAt: 'desc',
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )

    const { data: count } = useCountArchivedCertificate({
        where: {
            OR: [
                { name: { contains: filters.searchText, mode: 'insensitive' } },
                { code: { contains: filters.searchText, mode: 'insensitive' } },
            ],
        },
    })

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={24} className="mt-3">
                            <Flex justify="space-between">
                                <Col span={6}>
                                    <Form.Item
                                        className="mb-0"
                                        name="searchText"
                                    >
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
                                <Button onClick={handleModal} type="primary">
                                    Thêm mới
                                </Button>
                            </Flex>
                        </Col>

                        {/* <Col span={6}>
                            <Flex justify="end" gap={4}>
                                <Button type="primary" className="h-[40px]">
                                    Thêm mới
                                </Button>
                                <Button type="primary" className="h-[40px]">
                                    <EditIcon stroke="white" />
                                    Nhập từ file danh sách
                                </Button>
                            </Flex>
                        </Col> */}
                    </Row>
                </Col>

                <Col span={24}>
                    <Table
                        rowKey="id"
                        id="training-category"
                        columns={[
                            {
                                title: 'STT',
                                width: 20,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index) =>
                                    index +
                                    1 +
                                    (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Tên chứng chỉ',
                                dataIndex: 'name',
                                align: 'center',
                                width: 200,
                            },
                            {
                                title: 'Điểm tương đương hệ 10',
                                dataIndex: 'finalScore',
                                width: 150,
                                align: 'center',
                            },
                            // {
                            //     title: 'Điểm tương đương hệ 4',
                            //     dataIndex: 'bonusScore',
                            //     width: 150,
                            //     align: 'center',
                            //     render: (value: number) =>
                            //       Number(value)?   useScoreConverter([]).convertScore(value).base4 :''

                            // },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                render: (_, { id }) => {
                                    if (id) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                <EditIcon
                                                    onClick={onOpen.bind(
                                                        null,
                                                        id
                                                    )}
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: () =>
                                                            handleDelete(id),
                                                    }}
                                                />
                                            </Row>
                                        )
                                    }
                                    return ''
                                },
                            },
                        ]}
                        data={dataTable}
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
