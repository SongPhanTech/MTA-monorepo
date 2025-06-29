import { PlusOutlined } from '@ant-design/icons'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import EditIcon from '@components/icons/edit'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { Button, Collapse, Flex, Row } from 'antd'
import { useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import PutHocHamHocViModal from '../modals/put-hoc-ham-hoc-vi'

const { Panel } = Collapse

const data = [
    {
        id: '1',
        hocVi: 'Tiến sĩ',
        linhVuc: 'Công nghệ thông tin',
        truong: 'Đại học Bách Khoa',
        quocGia: 'Việt Nam',
        namNhan: 2015,
    },
]

export default function HocHamHocViTab() {
    const [openCollapse, setOpenCollapse] = useState<string | null>(null)
    const [currentPage, _setCurrentPage] = useState(1)
    const [_numberOfPages, _setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)

    const { onOpen } = useDisclosure({
        tag: PutHocHamHocViModal.name,
    })

    const handleCollapseChange = (collapseId: string) => (key: string | string[]) => {
        if (key && key.length > 0) {
            // Nếu collapse này được mở, đóng các collapse khác
            setOpenCollapse(collapseId)
        } else {
            // Nếu collapse này bị đóng
            setOpenCollapse(null)
        }
    }

    const handleModal = () => {
        onOpen()
    }

    return (
        <div className="space-y-6">
            <Collapse
                ghost
                className="bg-gray-50  shadow-sm"
                accordion={true}
                activeKey={openCollapse === 'hoc-vi' ? ['1'] : []}
                onChange={handleCollapseChange('hoc-vi')}
            >
                {/* Học vị */}
                <Panel
                    header={<span className="text-base font-semibold">Học vị</span>}
                    key="1"
                    className="border-none"
                >
                    <Flex justify="end">
                        <Button
                            onClick={handleModal}
                            icon={<PlusOutlined />}
                            className="border-green-700 text-green-700 hover:bg-green-50"
                        >
                            Thêm mới
                        </Button>
                    </Flex>
                    <Table
                        columns={[
                            {
                                title: 'STT',
                                width: 60,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Học vị',
                                dataIndex: 'hocVi',
                                align: 'center',
                                width: 120,
                            },
                            {
                                title: 'Lĩnh vực',
                                dataIndex: 'linhVuc',
                                align: 'center',
                                width: 200,
                            },
                            {
                                title: 'Trường',
                                dataIndex: 'truong',
                                align: 'center',
                                width: 200,
                            },
                            {
                                title: 'Quốc gia',
                                dataIndex: 'quocGia',
                                align: 'center',
                                width: 120,
                            },
                            {
                                title: 'Năm nhận',
                                dataIndex: 'namNhan',
                                align: 'center',
                                width: 120,
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                render: (_, { id }) => (
                                    <Row className="justify-center gap-2">
                                        <EditIcon className="text-sm text-blue-700 cursor-pointer" />
                                        <DeleteIcon />
                                    </Row>
                                ),
                            },
                        ]}
                        dataSource={data}
                    />
                </Panel>
            </Collapse>

            <Collapse
                ghost
                className="bg-gray-50 shadow-sm"
                accordion={true}
                activeKey={openCollapse === 'hoc-ham' ? ['1'] : []}
                onChange={handleCollapseChange('hoc-ham')}
            >
                {/* Học hàm */}
                <Panel
                    header={<span className="text-base font-semibold">Học hàm</span>}
                    key="1"
                    className="border-none mt"
                >
                    <Flex justify="end">
                        <Button
                            onClick={handleModal}
                            icon={<PlusOutlined />}
                            className="border-green-700 text-green-700 hover:bg-green-50"
                        >
                            Thêm mới
                        </Button>
                    </Flex>
                    <Table
                        columns={[
                            {
                                title: 'STT',
                                width: 60,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index) =>
                                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                            },
                            {
                                title: 'Học vị',
                                dataIndex: 'hocVi',
                                align: 'center',
                                width: 120,
                            },
                            {
                                title: 'Lĩnh vực',
                                dataIndex: 'linhVuc',
                                align: 'center',
                                width: 160,
                            },
                            {
                                title: 'Trường',
                                dataIndex: 'truong',
                                align: 'center',
                                width: 140,
                            },
                            {
                                title: 'Quốc gia',
                                dataIndex: 'quocGia',
                                align: 'center',
                                width: 120,
                            },
                            {
                                title: 'Năm nhận',
                                dataIndex: 'namNhan',
                                align: 'center',
                                width: 120,
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                render: (_, { id }) => (
                                    <Row className="justify-center gap-2">
                                        <EditIcon className="text-sm text-blue-700 cursor-pointer" />
                                        <DeleteIcon />
                                    </Row>
                                ),
                            },
                        ]}
                        dataSource={data}
                        pagination={false}
                    />
                </Panel>
            </Collapse>
        </div>
    )
}
