import { Form, InputNumber } from "antd"
import { useRef } from "react"
import { useHotkey } from "@tanstack/react-hotkeys"

export type ScoreInputHandle = { focus: () => void } | null

export type ScoreInputRefs = React.MutableRefObject<Array<ScoreInputHandle>>

interface ScoreInputCellProps {
  rowId: string
  rowIndex: number
  inputRefs: ScoreInputRefs
  min?: number
  max?: number
}

export default function ScoreInputCell({
  rowId,
  rowIndex,
  inputRefs,
  min = 1,
  max = 10,
}: ScoreInputCellProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)

  const focusSibling = (offset: number, event: KeyboardEvent) => {
    event.preventDefault()
    const next = inputRefs.current[rowIndex + offset]
    next?.focus()
  }

  useHotkey("ArrowDown", (e) => focusSibling(1, e), {
    target: wrapperRef,
    ignoreInputs: false,
  })
  useHotkey("ArrowUp", (e) => focusSibling(-1, e), {
    target: wrapperRef,
    ignoreInputs: false,
  })

  return (
    <div ref={wrapperRef}>
      <Form.Item
        className="w-full mb-0"
        name={["list", rowId, "score"]}
        label=""
        rules={[
          {
            validator: (_, value) =>
              value >= min && value <= max
                ? Promise.resolve()
                : Promise.reject(`Chỉ được nhập số từ ${min} đến ${max}`),
          },
        ]}
      >
        <InputNumber
          ref={(node) => {
            inputRefs.current[rowIndex] = node as ScoreInputHandle
          }}
          style={{ width: "100%" }}
          min={1}
          controls={false}
          onKeyDown={(e) => {
            if (e.key === "." || e.key === ",") {
              e.preventDefault()
            }
          }}
        />
      </Form.Item>
    </div>
  )
}
