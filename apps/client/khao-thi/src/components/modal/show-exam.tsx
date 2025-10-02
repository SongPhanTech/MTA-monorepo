import { CopyOutlined } from '@ant-design/icons'
import { Modal, Table, Tooltip } from 'antd'
import { useDisclosure } from 'react-hook-disclosure-modal'

const ThongTinKhaoSatModal = () => {
    const { isOpen, onClose, input } = useDisclosure<{ dataTable: any[]; id: string }>({
        tag: 'ThongTinKhaoSatModal',
    })

    const handleCopy = async (id: string) => {
        try {
            const link = `https://mta.swantech.vn/ems/lam-khao-sat/${input?.id}?surveyObjectTypeId=${id}`
            await navigator.clipboard.writeText(link)
        } catch (err) {
            console.error('Failed to copy: ', err)
        }
    }

    return (
        <Modal
            open={isOpen}
            onOk={onClose}
            onCancel={onClose}
            maskClosable={true}
            title="Thông tin bài khảo sát"
            width="600px"
            footer={null}
        >
            <Table
                columns={[
                    {
                        title: 'STT',
                        dataIndex: 'index',
                        key: 'index',
                        align: 'center',
                        render: (_: any, __: any, index: number) => index + 1,
                        width: 50,
                    },
                    {
                        title: 'Đối tượng khảo sát',
                        dataIndex: 'name',
                        align: 'center',
                        key: 'name',
                    },
                    {
                        title: 'Lấy link',
                        dataIndex: 'description',
                        key: 'description',
                        align: 'center',
                        render: (__, { id }) => {
                            return (
                                <Tooltip title={'Copy'} placement="top">
                                    <CopyOutlined onClick={() => handleCopy(id)} />
                                </Tooltip>
                            )
                        },
                    },
                ]}
                dataSource={input?.dataTable}
                pagination={false}
                rowKey="key"
                size="small"
                bordered
            />
        </Modal>
    )
}

export default ThongTinKhaoSatModal
