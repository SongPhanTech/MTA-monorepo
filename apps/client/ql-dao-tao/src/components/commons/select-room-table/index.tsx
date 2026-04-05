import Table from "@components/commons/table"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import { Input, Popover, Select } from "antd"
import { useMemo, useState } from "react"

interface RoomSelectorProps {
  value?: Array<{ roomId: string; quantity: number }>
  onChange?: (value: Array<{ roomId: string; quantity?: number }>) => void
  rooms: Array<{ id: string; capacity: number; name: string }>
  disabled?: boolean
  totalStudents?: number
}

interface RoomTableData {
  id: string
  name: string
  capacity: number
  quantity?: number
  isSelected: boolean
}

const RoomSelector = ({
  value = [],
  onChange,
  rooms,
  disabled,
  totalStudents = 0,
}: RoomSelectorProps) => {
  const [visible, setVisible] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [searchText, setSearchText] = useState("")

  const handleQuantityChange = (roomId: string, quantity?: number) => {
    const newValue = value.map((v) => (v.roomId === roomId ? { roomId, quantity } : v))
    onChange?.(newValue)
  }
  const getQuantityForNewRoom = (roomCapacity: number, currentValue: typeof value) => {
    const usedQuantity = currentValue.reduce((sum, v) => sum + (v.quantity ?? 0), 0)
    const remaining = Math.max(0, totalStudents - usedQuantity)
    return Math.min(remaining, roomCapacity)
  }
  const handleDeselect = (roomId: string) => {
    const newValue = value.filter((v) => v.roomId !== roomId)
    onChange?.(newValue)
  }

  const tableData: RoomTableData[] = useMemo(
    () =>
      rooms.map((room) => {
        const selectedValue = value.find((v) => v.roomId === room.id)
        return {
          id: room.id,
          capacity: room.capacity,
          quantity: selectedValue?.quantity,
          isSelected: !!selectedValue,
          name: room.name,
        }
      }),
    [rooms, value]
  )

  // Lọc dữ liệu theo search text
  const filteredData = tableData.filter((room) =>
    room.name.toLowerCase().includes(searchText.toLowerCase())
  )

  const rowSelection = {
    selectedRowKeys: value.map((v) => v.roomId),
    onChange: (selectedRowKeys: React.Key[]) => {
      const newValue = selectedRowKeys.map((roomId) => {
        const existing = value.find((v) => v.roomId === roomId)
        if (existing) return existing

        const room = rooms.find((r) => r.id === roomId)
        const currentSelected = selectedRowKeys
          .filter((id) => id !== roomId)
          .map((id) => value.find((v) => v.roomId === id))
          .filter(Boolean) as typeof value

        return {
          roomId: roomId as string,
          quantity: getQuantityForNewRoom(room?.capacity ?? 0, currentSelected),
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
          variant="underlined"
          onChange={(e) => {
            setSearchText(e.target.value)
            setCurrentPage(1)
          }}
          allowClear
          onClear={() => setSearchText("")}
        />
      </div>
      <Table
        rowKey="id"
        onRow={(record) => ({
          onClick: (e) => {
            e.stopPropagation()
            onChange?.(
              tableData.some((room) => room.id === record.id && room.isSelected)
                ? value.filter((v) => v.roomId !== record.id)
                : [
                    ...value,
                    {
                      roomId: record.id,
                      quantity: getQuantityForNewRoom(record.capacity, value),
                    },
                  ]
            )
          },
        })}
        columns={[
          {
            title: "STT",
            width: 60,
            align: "center",
            render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
          },
          {
            title: "Tên phòng",
            dataIndex: "name",
            width: 200,
          },
          {
            title: "Sức chứa",
            dataIndex: "capacity",
            width: 100,
            align: "center",
          },
          {
            title: "Số lượng",
            dataIndex: "quantity",
            width: 150,
            render: (_, record) => (
              <Input
                type="number"
                className={record.quantity > record.capacity ? "text-red-500" : ""}
                value={record.quantity}
                disabled={!record.isSelected}
                min={0}
                onClick={(e) => {
                  e.stopPropagation()
                }}
                onChange={(e) => {
                  handleQuantityChange(
                    record.id,
                    e.target.value ? Number.parseInt(e.target.value, 10) : undefined
                  )
                }}
              />
            ),
          },
        ]}
        data={filteredData}
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
          showTotal: (total, range) => `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
        }}
      />
    </div>
  )

  return (
    <Popover
      content={content}
      trigger="click"
      open={visible && !disabled}
      onOpenChange={setVisible}
      placement="bottomLeft"
    >
      <Select
        disabled={disabled}
        mode="multiple"
        variant="underlined"
        className="w-full"
        value={value.map((v) => v.roomId)}
        options={rooms.map((room) => ({
          label: `${room.name}-${room.capacity}`,
          value: room.id,
        }))}
        onClick={(e) => {
          e.stopPropagation()
          setVisible(true)
        }}
        placeholder="Chọn phòng thi"
        maxTagCount="responsive"
        open={false}
        onDeselect={handleDeselect}
      />
    </Popover>
  )
}

export default RoomSelector
