import Table from '@components/commons/table'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import { Input, Popover, Select } from 'antd'
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
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const [searchText, setSearchText] = useState('')

    const handleQuantityChange = (roomId: string, quantity: number) => {
        const newValue = value.map((v) =>
            v.roomId === roomId ? { roomId, quantity, name: v.name } : v
        )
        onChange?.(newValue)
    }

    const handleDeselect = (tagValue: string) => {
        const roomName = tagValue.split('-').slice(0, -1).join('-')
        const newValue = value.filter((v) => v.name !== roomName)
        onChange?.(newValue)
    }

    const tableData: RoomTableData[] = rooms.map((room) => {
        const selectedValue = value.find((v) => v.roomId === room.id)
        return {
            id: room.id,
            name: room.name,
            capacity: room.capacity,
            quantity: selectedValue?.quantity || room.capacity,
            isSelected: !!selectedValue,
        }
    })

    // Lọc dữ liệu theo search text
    const filteredData = tableData.filter((room) =>
        room.name.toLowerCase().includes(searchText.toLowerCase())
    )

    const rowSelection = {
        selectedRowKeys: value.map((v) => v.roomId),
        onChange: (selectedRowKeys: React.Key[]) => {
            const newValue = selectedRowKeys.map((roomId) => {
                const existing = value.find((v) => v.roomId === roomId)
                const room = rooms.find((r) => r.id === roomId)
                return {
                    roomId: roomId as string,
                    quantity: existing?.quantity || room?.capacity || 0,
                    name: existing?.name || room?.name || '',
                }
            })
            onChange?.(newValue)
        },
    }

    const content = (
        <div className="w-[600px]">
            <div className="mb-3">
                <Input
                    className="w-80"
                    placeholder="Tìm kiếm phòng..."
                    value={searchText}
                    onChange={(e) => {
                        setSearchText(e.target.value)
                        setCurrentPage(1)
                    }}
                    allowClear
                    onClear={() => setSearchText('')}
                />
            </div>
            <Table
                rowKey="id"
                onRow={(record) => ({
                    onClick: (e) => {
                        e.stopPropagation()
                    },
                })}
                columns={[
                    {
                        title: 'STT',
                        width: 60,
                        align: 'center',
                        render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
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
                                        Number.parseInt(e.target.value, 10) || 0
                                    )
                                }
                            />
                        ),
                    },
                ]}
                dataSource={filteredData}
                rowSelection={rowSelection}
                pagination={{
                    current: currentPage,
                    pageSize: numberOfPages,
                    total: filteredData.length,
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
                onDeselect={handleDeselect}
            />
        </Popover>
    )
}

export default RoomSelector
