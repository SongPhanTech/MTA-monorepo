import { PlusOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { PutVersionSubjectModal } from '@components/modal'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { Button, Col, Flex, message, Row, Tag } from 'antd'
import type React from 'react'
import { useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

type Props = {
    record: any
}
export default function VersionProgramSubject({ record }: Props) {
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)

    const { onOpen, onClose } = useDisclosure<string>({
        tag: PutVersionSubjectModal.name,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const handleModal = () => {
        onOpen()
    }
    // const { mutateAsync: updatePrerequisiteSubject } =
    //     useUpdatePrerequisiteSubject()
    async function handleDelete(id: string) {
        try {
            showSpinner()
            // await updatePrerequisiteSubject({
            //     where: {
            //         id,
            //     },
            //     data: {
            //         deletedAt: new Date(),
            //     },
            // })
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Flex justify="end">
                        <Button onClick={handleModal} type="primary">
                            <PlusOutlined />
                            Thêm
                        </Button>
                    </Flex>
                </Col>
                <Col span={24}>
                    <Table
                        rowKey="id"
                        className="odd:bg-[#f5f5f5]"
                        data={record.pb}
                        columns={[
                            {
                                title: 'STT',
                                width: 60,
                                align: 'center',
                                fixed: 'left',
                                render: (_, record, index) =>
                                    index + (currentPage - 1) * DEFAULT_PAGINATE_SIZE + 1,
                            },
                            {
                                title: 'Mã',
                                dataIndex: 'mapb',
                                width: 100,
                                align: 'center',
                            },
                            {
                                title: 'Tên phiên bản',
                                dataIndex: 'tenPB',
                                width: 150,
                                align: 'center',
                            },
                            {
                                title: 'Số tín chỉ',
                                dataIndex: 'stc',
                                width: 150,
                                align: 'center',
                            },
                            {
                                title: 'HKDK',
                                dataIndex: 'hkdk',
                                width: 80,
                                align: 'center',
                            },
                            {
                                title: 'Mã TKB',
                                dataIndex: 'maTKB',
                                width: 150,
                                align: 'center',
                            },
                            {
                                title: 'HKDK',
                                dataIndex: 'hkdk',
                                width: 80,
                                align: 'center',
                            },
                            {
                                title: 'HKGD',
                                dataIndex: 'hkgd',
                                width: 80,
                                align: 'center',
                            },
                            {
                                title: 'BB/TC',
                                dataIndex: 'bbtc',
                                width: 80,
                                align: 'center',
                                render: (record) => (record ? <div>BB</div> : <div>TC</div>),
                            },
                            {
                                title: 'STTKB',
                                dataIndex: 'sttkb',
                                width: 80,
                                align: 'center',
                            },
                            {
                                title: 'STLT',
                                dataIndex: 'stlt',
                                width: 80,
                                align: 'center',
                            },
                            {
                                title: 'STTH',
                                dataIndex: 'stth',
                                width: 80,
                                align: 'center',
                            },
                            {
                                title: 'Hình thức thi',
                                dataIndex: 'thi',
                                width: 150,
                                align: 'center',
                            },
                            {
                                title: 'SĐĐ',
                                dataIndex: 'sdd',
                                width: 80,
                                align: 'center',
                            },
                            {
                                title: 'Danh sách môn',
                                dataIndex: 'danhSachMon',
                                width: 150,
                                align: 'center',
                            },
                            {
                                title: 'Đề cương',
                                dataIndex: 'deCuong',
                                width: 150,
                                align: 'center',
                            },
                            {
                                title: 'Trạng thái',
                                align: 'center',
                                width: 130,
                                render: (record) => {
                                    return record?.status === 'IN_ACTIVE' ? (
                                        <Tag color="error">Ngừng đào tạo</Tag>
                                    ) : (
                                        <Tag color="success">Đang hoạt động</Tag>
                                    )
                                },
                            },
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
                                                    onClick={onOpen.bind(null, id)}
                                                    className="text-sm text-blue-700 cursor-pointer"
                                                />
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: () => handleDelete(id),
                                                    }}
                                                />
                                            </Row>
                                        )
                                    }
                                    return ''
                                },
                            },
                        ]}
                        pagination={{
                            current: currentPage,
                            pageSize: numberOfPages,
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

VersionProgramSubject.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
