import { Modal, Table, message } from 'antd'
import { useEffect, useState } from 'react'
import { fetchThongTinBaoCao } from '@api/userProfile'
import { useDisclosure } from 'react-hook-disclosure-modal'
import useSpinner from '@hooks/spinner'

const ThongTinBaoCaoModal = () => {
    const [labels, setLabels] = useState<any[]>([])
    const { isOpen, onClose } = useDisclosure<string>({
        tag: ThongTinBaoCaoModal.name,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    useEffect(() => {
        if (!isOpen) return

        showSpinner()
        fetchThongTinBaoCao()
            .then(async (data) => {
                const flatData = flattenSchema(data)
                setLabels(flatData)
            })
            .catch(() => {
                message.error('Lỗi khi tải thông tin báo cáo')
            })
            .finally(() => hideSpinner())
    }, [isOpen])

    const flattenSchema = (schema: any[], parentPath = ''): any[] => {
        return schema.flatMap((item, index) => {
            const fullPath = parentPath
                ? `${item.path}`
                : item.path
            const row = {
                key: fullPath,
                path: fullPath,
                description: item.description,
                type: item.type,
            }

            if (item.type === 'array' && item.items) {
                return [row, ...flattenSchema(item.items, fullPath)]
            }

            return row
        })
    }

    const columns = [
        {
            title: 'STT',
            dataIndex: 'index',
            key: 'index',
            align: 'center',
            render: (_: any, __: any, index: number) => index + 1,
            width: 20,
        },
        {
            title: 'Ký hiệu',
            dataIndex: 'path',
            align: 'center',
            key: 'path',
        },
        {
            title: 'Ý nghĩa',
            dataIndex: 'description',
            key: 'description',
            align: 'center',
        },
        {
            title: 'Kiểu dữ liệu',
            dataIndex: 'type',
            key: 'type',
            // width: 120,
            align: 'center',
        },
    ]

    return (
        <Modal
            open={isOpen}
            onOk={onClose}
            onCancel={onClose}
            maskClosable={true}
            title="Thông tin báo cáo"
            width="45vw"
            footer={null}
        >
            <Table
                columns={columns}
                dataSource={labels}
                pagination={false}
                rowKey="key"
                size="small"
                bordered
            />
        </Modal>
    )
}

export default ThongTinBaoCaoModal
