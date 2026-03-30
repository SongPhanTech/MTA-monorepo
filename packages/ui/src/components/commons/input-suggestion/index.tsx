/**
 * InputSuggestion - Gợi ý thông minh
 *
 * @description
 * Component này cung cấp tính năng gợi ý tự động với 2 chế độ:
 * - Personal: Gợi ý riêng cho từng user (dựa trên userId)
 * - Global: Gợi ý chung cho tất cả user
 *
 * @features
 * - Tự động lưu gợi ý khi user nhập và blur/enter
 * - Hỗ trợ xóa gợi ý bằng nút X
 * - Tab để auto-complete gợi ý đầu tiên
 * - Tự động lấy userId từ session hiện tại
 *
 * @example
 * // Chế độ cá nhân (mặc định)
 * <InputSuggestion
 *   suggestionKey="task_name"
 *   suggestionMode="personal"
 *   placeholder="Nhập tên công việc..."
 * />
 *
 * @example
 * // Chế độ global
 * <InputSuggestion
 *   suggestionKey="project_categories"
 *   suggestionMode="global"
 *   placeholder="Chọn danh mục dự án..."
 * />
 *
 * @param suggestionKey - Khóa định danh cho nhóm gợi ý (VD: "task_name", "location", "category")
 * @param suggestionMode - Chế độ gợi ý: "personal" (riêng tư) hoặc "global" (chung)
 * @param value - Giá trị hiện tại của input
 * @param onChange - Callback khi giá trị thay đổi
 */
import { CloseOutlined } from "@ant-design/icons"
import {
  useCreateSuggestion,
  useDeleteSuggestion,
  useFindManySuggestion,
} from "@workspace/db/hooks"
import type { AutoCompleteProps } from "antd"
import { AutoComplete, Button } from "antd"
import { forwardRef, useMemo, useState } from "react"

export type SuggestionMode = "personal" | "global"

export interface InputSuggestionProps extends Omit<AutoCompleteProps, "options"> {
  suggestionKey: string
  suggestionMode?: SuggestionMode
  value?: string
  onChange?: (value: string) => void
}

const InputSuggestion = forwardRef<any, InputSuggestionProps>(
  ({ suggestionKey, suggestionMode = "personal", value, onChange, onSelect, ...props }, ref) => {
    const [searchValue, setSearchValue] = useState("")

    const userId = window.contextData?.userId

    const finalSuggestionKey =
      suggestionMode === "personal" && userId ? `${userId}_${suggestionKey}` : suggestionKey

    const { data: suggestions = [], refetch } = useFindManySuggestion({
      where: {
        key: finalSuggestionKey,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    const createSuggestion = useCreateSuggestion({
      onSuccess: () => {
        refetch()
      },
    })

    const deleteSuggestion = useDeleteSuggestion({
      onSuccess: () => {
        refetch()
      },
    })

    const options = useMemo(() => {
      return suggestions.map((suggestion: any) => ({
        value: suggestion.value || "",
        label: (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>{suggestion.value}</span>
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                if (suggestion.id) {
                  deleteSuggestion.mutate({
                    where: { id: suggestion.id },
                  })
                }
              }}
            />
          </div>
        ),
        key: suggestion.id,
      }))
    }, [suggestions, deleteSuggestion])

    const saveSuggestionIfNeeded = (valueToSave: string) => {
      if (valueToSave?.trim()) {
        const existingSuggestion = suggestions.find((s: any) => s.value === valueToSave.trim())
        if (!existingSuggestion) {
          createSuggestion.mutate({
            data: {
              key: finalSuggestionKey,
              value: valueToSave.trim(),
            },
          })
        }
      }
    }

    const handleSearch = (val: string) => {
      setSearchValue(val)
      onChange?.(val)
    }

    const handleSelect = (selectedValue: string, option: any) => {
      onChange?.(selectedValue)
      onSelect?.(selectedValue, option)
      if (!suggestions.find((s: any) => s.value === selectedValue)) {
        saveSuggestionIfNeeded(selectedValue)
      }
    }

    const handleBlur = (e: React.FocusEvent) => {
      const currentValue = value || searchValue
      saveSuggestionIfNeeded(currentValue)
      if (props.onBlur) {
        props.onBlur(e as any)
      }
    }

    const getFilteredOptions = (inputValue: string) => {
      if (!inputValue) return options
      return options.filter((option) =>
        option.value?.toString().toLowerCase().includes(inputValue.toLowerCase())
      )
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        const currentValue = value || searchValue
        saveSuggestionIfNeeded(currentValue)
      } else if (e.key === "Tab") {
        const currentInput = value || searchValue
        const filteredOptions = getFilteredOptions(currentInput || "")

        if (
          filteredOptions.length > 0 &&
          currentInput &&
          currentInput !== filteredOptions[0]?.value
        ) {
          e.preventDefault()
          const firstOption = filteredOptions[0]
          if (firstOption?.value) {
            onChange?.(firstOption.value.toString())
          }
        }
      }
    }

    return (
      <AutoComplete
        {...props}
        ref={ref}
        value={value}
        options={options}
        onSearch={handleSearch}
        onSelect={handleSelect}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={props.placeholder || "Nhập để tìm gợi ý"}
        filterOption={(inputValue, option) => {
          if (!option?.value) return false
          return option.value.toString().toLowerCase().includes(inputValue.toLowerCase())
        }}
        notFoundContent="Không có gợi ý nào"
      />
    )
  }
)

InputSuggestion.displayName = "InputSuggestion"

export { InputSuggestion }
