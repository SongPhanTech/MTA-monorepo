import Table from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { Button, Flex, Input, Popover, Select } from 'antd'
import { useState } from 'react'

interface RoomSelectorProps {
    value?: Array<{ roomId: string; quantity: number; name: string }>
    onChange?: (value: Array<{ roomId: string; quantity: number; name: string }>) => void
    rooms: Array<{ id: string; name: string; capacity: number }>
}

interface RoomTableData {
    id: string
    name: string
    capacity: number
    quantity: number
    isSelected: boolean
}

const RoomSelector = ({ value = [], onChange, rooms }: RoomSelectorProps) => {
    const [visible, setVisible] = useState(false)
    const [tempValue, setTempValue] =
        useState<Array<{ roomId: string; quantity: number; name: string }>>(value)

    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)

    const handleQuantityChange = (roomId: string, quantity: number) => {
        setTempValue((prev) => {
            const existing = prev.find((v) => v.roomId === roomId)
            if (existing) {
                return prev.map((v) =>
                    v.roomId === roomId ? { roomId, quantity, name: existing.name } : v
                )
            }
            const room = rooms.find((r) => r.id === roomId)
            return [...prev, { roomId, quantity, name: room?.name || '' }]
        })
    }

    const handleConfirm = () => {
        onChange?.(tempValue)
        setVisible(false)
    }

    const handleCancel = () => {
        setTempValue(value)
        setVisible(false)
    }

    const tableData: RoomTableData[] = rooms.map((room) => {
        const selectedValue = tempValue.find((v) => v.roomId === room.id)
        return {
            id: room.id,
            name: room.name,
            capacity: room.capacity,
            quantity: selectedValue?.quantity || room.capacity,
            isSelected: !!selectedValue,
        }
    })

    const rowSelection = {
        selectedRowKeys: tempValue.map((v) => v.roomId),
        onChange: (selectedRowKeys: React.Key[]) => {
            const newTempValue = selectedRowKeys.map((roomId) => {
                const existing = tempValue.find((v) => v.roomId === roomId)
                const room = rooms.find((r) => r.id === roomId)
                return {
                    roomId: roomId as string,
                    quantity: existing?.quantity || room?.capacity || 0,
                    name: existing?.name || room?.name || '',
                }
            })
            setTempValue(newTempValue)
        },
    }

    const content = (
        <div className="w-[600px]">
            <Table
                rowKey="id"
                columns={[
                    {
                        title: 'STT',
                        width: 60,
                        align: 'center',
                        render: (_, __, index) => index + 1,
                    },
                    {
                        title: 'Tên phòng',
                        dataIndex: 'name',
                        width: 200,
                    },
                    {
                        title: 'Sức chứa',
                        dataIndex: 'capacity',
                        width: 100,
                        align: 'center',
                    },
                    {
                        title: 'Số lượng',
                        dataIndex: 'quantity',
                        width: 150,
                        render: (_, record) => (
                            <Input
                                type="number"
                                value={record.quantity}
                                disabled={!record.isSelected}
                                min={1}
                                max={record.capacity}
                                onChange={(e) =>
                                    handleQuantityChange(
                                        record.id,
                                        Number.parseInt(e.target.value) || 0
                                    )
                                }
                            />
                        ),
                    },
                ]}
                dataSource={tableData}
                rowSelection={rowSelection}
                pagination={{
                    current: currentPage,
                    pageSize: numberOfPages,
                    total: tableData.length,
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
            <Flex justify="flex-end" gap={8} className="mt-3">
                <Button onClick={handleCancel}>Hủy</Button>
                <Button type="primary" onClick={handleConfirm}>
                    Xác nhận
                </Button>
            </Flex>
        </div>
    )

    return (
        <Popover
            content={content}
            trigger="click"
            open={visible}
            onOpenChange={setVisible}
            placement="bottomLeft"
        >
            <Select
                mode="multiple"
                value={value.map((v) => `${v.name}-${v.quantity}`)}
                placeholder="Chọn phòng thi"
                maxTagCount="responsive"
                open={false}
            />
        </Popover>
    )
}

export default RoomSelector
