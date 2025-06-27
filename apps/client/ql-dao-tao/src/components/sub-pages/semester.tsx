import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutSemesterModal } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { useCountSemester, useFindManySemester, useUpdateSemester } from '@workspace/db/hooks'
import { Button, Col, Divider, Flex, Form, Input, message, Row } from 'antd'
import dayjs from 'dayjs'
import _ from 'lodash'
import type React from 'react'
import { useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function SemesterPage({ selectedSchoolYear }: any) {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [searchText, setSearchText] = useState<string>('')

    const { data = [], refetch } = useFindManySemester({
        where: {
            name: {
                contains: searchText,
            },
            ...(selectedSchoolYear?.id && {
                schoolYearId: selectedSchoolYear.id,
            }),
        },
        orderBy: {
            createdAt: 'desc',
        },
        include: {
            schoolYear: true,
        },
        take: numberOfPages,
        skip: (currentPage - 1) * numberOfPages,
    })

    const { data: count } = useCountSemester({
        where: {
            name: {
                contains: searchText,
            },
            ...(selectedSchoolYear?.id && {
                schoolYearId: selectedSchoolYear.id,
            }),
        },
    })

    const debouncedSearchText = _.debounce(setSearchText, 500)
    const { onOpen, onClose } = useDisclosure<string>({
        tag: PutSemesterModal.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }
    const { mutateAsync: updateSemester } = useUpdateSemester()
    async function handleDelete(id: string) {
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

    return (
        <div>
            <Divider orientation="left" orientationMargin={0}>
                {`${selectedSchoolYear ? `Học kỳ (${selectedSchoolYear.name})` : 'Học kỳ'}`}
            </Divider>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top">
                        {/* Tìm kiếm */}
                        <Col span={12}>
                            <Form.Item label="Tìm kiếm" name="search">
                                <Input
                                    id="search"
                                    onChange={(e) => debouncedSearchText(e.target.value)}
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
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            // {
                            //     title: 'Mã học kỳ',
                            //     dataIndex: 'code',
                            // },
                            {
                                title: 'Tên học kỳ',
                                align: 'center',
                                dataIndex: 'name',
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

SemesterPage.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
