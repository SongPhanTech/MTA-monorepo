import UserProfilePageDs from '@pages/ql-sinh-vien'
import type { FixedClass } from '@workspace/db'
import {
    useCountFixedClassStudent,
    useFindManyFixedClassStudent,
} from '@workspace/db/hooks'
import { Button, Col, Divider, Flex, Row, Spin, Tooltip, message } from 'antd'
import { useEffect, useState } from 'react'
import { DEFAULT_PAGINATE_SIZE, GENDER_MEAN } from '@constants/constants'
import { EyeOutlined } from '@ant-design/icons'
import { DeleteIcon } from 'lucide-react'
import Table from '@components/commons/table'

import dayjs from 'dayjs'
import { ThongTinBaoCaoModal } from '@components/modal'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { exportHocVienLop } from '@api/userProfile'

dayjs.locale('vi')

type Props = {
    fixedClass: FixedClass
}
export default function OptionsPage({ fixedClass }: any) {
    const fixedClassId = fixedClass.id
    const code = fixedClass.trainingCourse.trainingObjectType.code
    const [ready, setReady] = useState(false)

    const { data: count } = useCountFixedClassStudent({
        where: {
            fixedClassId,
        },
    })
    const {
        data = [],
        refetch,
        isLoading,
    } = useFindManyFixedClassStudent({
        where: {
            fixedClassId,
        },
        include: {
            fixedClass: true,
            userProfile: true,
        },
    })

    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const { onOpen, onClose } = useDisclosure<string>({
        tag: ThongTinBaoCaoModal.name,
    })
    if (isLoading) {
        return (
            <div style={{ width: '100%' }}>
                <Flex justify="center" align="center" style={{ height: 100 }}>
                    <Spin />
                </Flex>
            </div>
        )
    }

    const handleModal = () => {
        onOpen()
    }

    const handleExportFile = async () => {
        try {
            const blob = await exportHocVienLop(fixedClassId)
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'danh-sach-hoc-vien.docx' // tên file
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(url)
        } catch (error) {
            message.error('Xuất file thất bại.')
        }
    }

    return (
        <div style={{ width: '100%', overflowX: 'hidden' }}>
            <Divider orientation="left" orientationMargin={0}>
                {code === 'DS' ? 'Danh sách sinh viên' : 'Danh sách học viên'}
            </Divider>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={24}>
                            <Flex>
                                {/* <Col span={8} className="pl-0">
                                    <FilterSinhVien
                                        handleFilterChange={handleFilterChange}
                                        filters={filters}
                                        setFilters={setFilters}
                                    />
                                </Col> */}
                                <Col span={24}>
                                    <Flex justify="end" className="gap-2">
                                        <Button
                                            onClick={handleModal}
                                            type="primary"
                                        >
                                            Thông tin báo cáo
                                        </Button>
                                        <Button
                                            onClick={handleExportFile}
                                            type="primary"
                                        >
                                            Xuất file
                                        </Button>
                                        {/* <Dropdown
                                            overlay={menuDownload}
                                            trigger={['hover']}
                                        >
                                            <Button
                                                className="ml-4"
                                                type="primary"
                                                icon={<DownloadOutlined />}
                                            >
                                                Tải file mẫu
                                            </Button>
                                        </Dropdown> */}
                                        {/* <Dropdown
                                            overlay={menuUpload}
                                            trigger={['hover']}
                                        >
                                            <Button
                                                className="ml-4"
                                                type="primary"
                                                icon={<UploadOutlined />}
                                            >
                                                Nhập file
                                            </Button>
                                        </Dropdown> */}
                                    </Flex>
                                </Col>
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
                                title: 'Mã sinh viên',
                                dataIndex: 'code',
                                align: 'center',
                            },
                            {
                                title: 'Họ và tên',
                                render: ({
                                    firstName,
                                    lastName,
                                }: { firstName: string; lastName: string }) =>
                                    `${lastName} ${firstName}`,
                            },
                            // {
                            //     title: 'Đối tượng',
                            //     dataIndex: 'UserType',
                            //     render: (value) => value?.name ? value?.name : ""
                            // },
                            {
                                title: 'Ngày sinh',
                                // dataIndex: 'startDate',
                                render: ({ dateOfBirth }) =>
                                    dayjs(dateOfBirth).format('DD/MM/YYYY'),
                            },
                            {
                                title: 'Giới tính',
                                // dataIndex: 'gender',
                                render: ({ gender }) =>
                                    GENDER_MEAN[
                                        gender as keyof typeof GENDER_MEAN
                                    ],
                            },
                            {
                                title: 'Số CCCD',
                                dataIndex: 'idCardNumber',
                            },
                            {
                                title: 'Số điện thoại',
                                dataIndex: 'phoneNumber',
                            },
                            // {
                            //     title: 'Thao tác',
                            //     width: 100,
                            //     align: 'center',
                            //     render: (_, { id }) => (
                            //         <Row className="justify-center gap-2">
                            //             <Tooltip
                            //                 title="Xem chi tiết"
                            //                 placement="leftTop"
                            //             >
                            //                 <EyeOutlined
                            //                     onClick={onOpenUpdate.bind(
                            //                         null,
                            //                         { id: id, code: 'SV' }
                            //                     )}
                            //                     className="text-sm text-blue-700 cursor-pointer"
                            //                 />
                            //             </Tooltip>
                            //             <DeleteIcon
                            //                 popConfirm={{
                            //                     onConfirm: () =>
                            //                         handleDelete(id),
                            //                 }}
                            //             />
                            //         </Row>
                            //     ),
                            // },
                        ]}
                        data={data?.map((item) => item.userProfile) ?? []}
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
