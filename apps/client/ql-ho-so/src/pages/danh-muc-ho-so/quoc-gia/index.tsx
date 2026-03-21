import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import QuocGiaModal from '@components/modal/danh-muc-chung/put-quoc-gia'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import type { DM_QuocGia } from '@workspace/db'
import {
    useCountDM_QuocGia,
    useFindManyDM_QuocGia,
    useUpdateDM_QuocGia,
} from '@workspace/db/hooks'
import { Button, Col, Flex, message, Row } from 'antd'
import { useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

export default function NationalType() {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)

    const { showSpinner, hideSpinner } = useSpinner()

    const { onOpen } = useDisclosure<Partial<DM_QuocGia>>({
        tag: 'PutDanhMucQuocGiaModal',
    })

    const { data = [], refetch } = useFindManyDM_QuocGia({
        skip: (currentPage - 1) * numberOfPages,
        take: numberOfPages,
        where: { bDeleted: false }, 
    })

    const { data: count } = useCountDM_QuocGia({
        where: { bDeleted: false }, 
    })

    const { mutateAsync: updateDM_QuocGia } = useUpdateDM_QuocGia()

    const handleDeleteQuocGia = async (Id: string) => {
        try {
            showSpinner()

            await updateDM_QuocGia({
                where: { Id }, 
                data: {
                    bDeleted: true, 
                },
            })

            message.success('Xóa thành công')
            refetch()
        } catch (error) {
            console.error(error)
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    return (
        <div>
            <QuocGiaModal />
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={24}>
                            <Flex justify="end">
                                <Button onClick={() => onOpen()} type="primary">
                                    Thêm mới
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <Table
                        rowKey="Id" 
                        columns={[
                            {
                                title: 'STT',
                                width: 30,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index) =>
                                    index +
                                    (currentPage - 1) * numberOfPages + 1,
                            },
                            {
                                title: 'Quốc tịch',
                                width: 150,
                                align: 'center',
                                render: (_, record) => record.sTen || '',
                            },
                            {
                                title: 'Ghi chú',
                                width: 150,
                                align: 'center',
                                render: (_, record) => record.sGhiChu || '',
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                render: (_, record) => (
                                    <Row className="justify-center gap-2">
                                        <EditIcon
                                            className="text-sm text-blue-700 cursor-pointer"
                                            onClick={() => onOpen(record)}
                                        />

                                        <DeleteIcon
                                            popConfirm={{
                                                title: 'Bạn có chắc muốn xóa?',
                                                onConfirm: () =>
                                                    handleDeleteQuocGia(
                                                        record.Id
                                                    ),
                                            }}
                                            onClick={(e) =>
                                                e.stopPropagation()
                                            }
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
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}

NationalType.getLayout = function getLayout(page: React.ReactElement) {
    return (
        <DefaultLayout
            breadcrumbList={[
                { title: 'Danh mục hồ sơ', href: '/danh-muc-ho-so' },
                { title: 'Quốc tịch' },
            ]}
        >
            {page}
        </DefaultLayout>
    )
}