import type { FilterProps } from "@constants/type"
import { searchVietnamese } from "@lib/utils"
import { Checkbox, type CheckboxChangeEvent, Input } from "antd"
import { Search } from "lucide-react"
import { useState } from "react"

export default function FilterSelect({
  item,
  onCheckAllChange,
  onCheckChange,
  indeterminate,
  filtersTable,
  checkAll,
}: any) {
  const [input, setInput] = useState("")
  const [optionsSearch, setOptionsSearch] = useState(item?.options || [])
  const handleSearch = async (value: string) => {
    if (!value.trim()) {
      setOptionsSearch(item?.options || [])
      return
    }

    try {
      const response = searchVietnamese(item?.options || [], value.trim())
      setOptionsSearch(response)
    } catch (_error: unknown) {
      setOptionsSearch(item?.options || [])
    }
  }
  return (
    <div className="p-4 w-full min-w-[200px] max-w-[300px]">
      {item.options.length > 0 && (
        <div className="max-h-[500px] overflow-y-auto">
          <div className="mb-2">Tìm kiếm</div>
          <Input
            placeholder="Nhập từ khoá cần tìm kiếm"
            prefix={
              <Search
                size={15}
                style={{
                  color: "rgba(0, 0, 0, 0.25)",
                }}
              />
            }
            allowClear
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              handleSearch(e.target.value)
            }}
            style={{ height: 36, width: "100%", marginBottom: 16 }}
          />
          {!input && optionsSearch.length > 0 && (
            <Checkbox
              onChange={(e: CheckboxChangeEvent) => onCheckAllChange(item, e)}
              indeterminate={indeterminate(item)}
              checked={checkAll(item)}
              className="mb-3"
            >
              Chọn tất cả
            </Checkbox>
          )}

          <Checkbox.Group
            className="mb-3"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
            value={filtersTable[item.dataIndex as keyof FilterProps] as string[]}
            onChange={(e: string[]) => onCheckChange(item, e)}
            options={optionsSearch}
          />
        </div>
      )}
    </div>
  )
}
