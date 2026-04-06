import { ScoreInputCellProps } from "@constants/nhap-diem.type"
import { Form, InputNumber } from "antd"
import { History } from "lucide-react"
import { memo } from "react"

const ScoreInputCell = memo(
  function ScoreInputCell({
    recordId,
    field,
    fieldType,
    isActive,
    displayValue,
    readOnly,
    step,
    formFieldName,
    inputId,
    validateRule,
    onActivate,
    onBlur,
    onKeyDown,
    onScoreDetailClick,
  }: ScoreInputCellProps) {
    return (
      <div className="flex items-center">
        {isActive && !readOnly ? (
          <Form.Item className="w-full m-0" name={formFieldName} rules={[validateRule]}>
            <InputNumber
              autoFocus
              variant="outlined"
              id={inputId}
              style={{ width: "100%" }}
              step={step}
              controls={false}
              onKeyDown={(e) => onKeyDown(e, recordId, fieldType)}
              onBlur={onBlur}
            />
          </Form.Item>
        ) : (
          <div
            tabIndex={readOnly ? -1 : 0}
            id={inputId}
            className={`w-full min-h-[22px] px-1 text-center ${!readOnly ? "cursor-pointer hover:bg-blue-50 rounded" : ""}`}
            onClick={readOnly ? undefined : () => onActivate(recordId, field)}
            onFocus={readOnly ? undefined : () => onActivate(recordId, field)}
          >
            {displayValue}
          </div>
        )}
        <span
          onClick={(e) => {
            e.stopPropagation()
            onScoreDetailClick(recordId)
          }}
          className="ml-1 cursor-pointer hover:scale-110"
        >
          <History size={14} />
        </span>
      </div>
    )
  },
  (prev, next) =>
    prev.isActive === next.isActive &&
    prev.displayValue === next.displayValue &&
    prev.readOnly === next.readOnly &&
    prev.recordId === next.recordId &&
    prev.onActivate === next.onActivate &&
    prev.onBlur === next.onBlur &&
    prev.onKeyDown === next.onKeyDown &&
    prev.onScoreDetailClick === next.onScoreDetailClick
)

export default ScoreInputCell
