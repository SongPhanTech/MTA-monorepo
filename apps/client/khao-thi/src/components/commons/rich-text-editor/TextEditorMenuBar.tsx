import type { Editor } from "@tiptap/react"
import { useEditorState } from "@tiptap/react"
import { generatePresignedUrl } from "@workspace/libs/api/model"
import { getRuntimeEnv } from "@workspace/libs/utils"
import {
  Button as AntdButton,
  Checkbox,
  Col,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  message,
  Row,
  Select,
  Tooltip,
  Typography,
} from "antd"
import katex from "katex"
import { useCallback, useRef, useState } from "react"
import { BsTypeUnderline } from "react-icons/bs"
import { IoListOutline } from "react-icons/io5"
import {
  RiAlignJustify,
  RiAlignLeft,
  RiAlignRight,
  RiAtLine,
  RiBold,
  RiFunctions,
  RiImage2Line,
  RiItalic,
  RiListOrdered2,
  RiMoneyDollarBoxLine,
  RiMoneyDollarCircleLine,
  RiStrikethrough,
  RiLinksLine,
} from "react-icons/ri"

const FONT_FAMILIES = ["Arial", "Times New Roman", "Tahoma", "Verdana", "Courier New", "Helvetica"]

const FONT_SIZES = [
  "8px",
  "9px",
  "10px",
  "11px",
  "12px",
  "13px",
  "14px",
  "16px",
  "18px",
  "20px",
  "22px",
  "24px",
  "26px",
  "28px",
  "36px",
  "48px",
  "72px",
]
// import "katex/dist/katex.min.css"
import {
  Columns,
  Merge,
  Plus,
  Redo,
  Rows,
  Split,
  Table,
  TableProperties,
  Trash2,
  Undo,
} from "lucide-react"
import { useDisclosure } from "react-hook-disclosure-modal"

const { Title } = Typography

type MenuButton = {
  id: string
  icon: React.ReactNode
  onClick: () => void
  isActive: boolean
  disabled?: boolean
  description?: string
}

const Button = ({
  onClick,
  isActive,
  disabled,
  children,
  description,
}: {
  onClick: () => void
  isActive: boolean
  disabled?: boolean
  children: React.ReactNode
  description?: string
}) => (
  <Tooltip title={description}>
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`p-2 ${isActive ? "bg-primary text-white rounded-md" : ""}`}
    >
      {children}
    </button>
  </Tooltip>
)

export default function TextEditorMenuBar({
  editor,
  id,
  editable = true,
}: {
  editor: Editor | null
  id?: string
  editable?: boolean
}) {
  const editorState = useEditorState({
    editor,
    selector: (ctx) => ({
      currentFontFamily: ctx.editor?.getAttributes("textStyle")?.fontFamily || null,
      currentFontSize: ctx.editor?.getAttributes("textStyle")?.fontSize || null,
    }),
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mathModalVisible, setMathModalVisible] = useState(false)
  const [mathInput, setMathInput] = useState("")
  const [isBlockMath, setIsBlockMath] = useState(false)
  const [tableModalVisible, setTableModalVisible] = useState(false)
  const [tableForm] = Form.useForm()
  const { onOpen: onOpenPinEvidenceToPeriod } = useDisclosure<{
    id: string
    changeValue: (value: { value: string; label: string }) => void
  }>({
    tag: "PinEvidenceToPeriod",
  })

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const extension = file.name.split(".").pop() || "png"
      const resPresignedUrl = await generatePresignedUrl({
        path: "question-images",
        extension,
      })

      await fetch(resPresignedUrl.data.url, {
        method: "PUT",
        body: file,
      })

      const imageUrl = `${getRuntimeEnv("NEXT_PUBLIC_MINIO_ENDPOINT")}/${resPresignedUrl.data.fileName}`

      editor
        ?.chain()
        .focus()
        .setImage({
          src: imageUrl,
          alt: file.name,
          title: file.name,
        })
        .run()
    } catch (error) {
      message.error("Tải ảnh lên không thành công. Vui lòng thử lại.")
    } finally {
      if (event.target) {
        event.target.value = ""
      }
    }
  }

  const handleAddEvidence = async () => {
    if (!editor) return
    if (id) {
      onOpenPinEvidenceToPeriod({
        id,
        changeValue: (value) => {
          insertPinFormula(value)
        },
      })
    }
  }

  const insertPinFormula = (value: { value: string; label: string }) => {
    if (!editor) return
    console.log(value)
    if (value) {
      try {
        editor
          .chain()
          .focus()
          .insertContent({
            type: "text",
            text: `[${value.label}]`,
            marks: [
              {
                type: "textStyle",
                attrs: {
                  id: value.value,
                  color: "#c89f08",
                },
              },
            ],
          })
          .command(({ tr, dispatch }) => {
            if (dispatch) tr.setStoredMarks([])
            return true
          })
          .run()
      } catch (error) {
        message.error("Lỗi ghim dữ liệu")
      }
    }
  }

  const insertMathFormula = () => {
    if (!editor) return
    if (mathInput.trim()) {
      try {
        editor
          .chain()
          .focus()
          .insertContent({
            type: "text",
            text: isBlockMath ? `$$${mathInput}$$` : `$${mathInput}$`,
            marks: [
              {
                type: "math",
                attrs: {
                  latex: mathInput,
                },
              },
            ],
          })
          .run()
        setMathInput("")
        setMathModalVisible(false)
      } catch (error) {
        message.error("Không chèn được công thức toán học")
      }
    }
  }

  const deleteMath = useCallback(() => {
    if (!editor) return

    editor
      .chain()
      .focus()
      .command(({ tr, state }) => {
        const { $from, $to } = state.selection
        const range = $from.blockRange($to)

        if (range) {
          tr.delete(range.start, range.end)
          return true
        }
        return false
      })
      .run()
  }, [editor])

  const toggleMathFormula = useCallback(() => {
    if (!editor) return

    if (editor.isActive("math")) {
      deleteMath()
      return
    }

    const hasSelection = !editor.state.selection.empty
    if (hasSelection) {
      const isBlock = window.confirm("Bạn muốn chèn công thức dạng khối?")
      const selectedText = editor.state.doc.textBetween(
        editor.state.selection.from,
        editor.state.selection.to
      )

      editor
        .chain()
        .focus()
        .insertContent({
          type: "text",
          text: isBlock ? `$$${selectedText}$$` : `$${selectedText}$`,
          marks: [
            {
              type: "math",
              attrs: {},
            },
          ],
        })
        .run()
      return
    }

    setIsBlockMath(false)
    setMathInput("")
    setMathModalVisible(true)
  }, [editor, deleteMath])

  const wrapSelectionWith = useCallback(
    (prefix: string, suffix: string) => {
      if (!editor) return

      const { from, to, empty } = editor.state.selection
      const selectedText = editor.state.doc.textBetween(from, to, "")

      if (empty) {
        editor
          .chain()
          .focus()
          .insertContent(prefix + suffix)
          .setTextSelection(from + prefix.length)
          .run()
      } else {
        editor
          .chain()
          .focus()
          .insertContent({
            type: "text",
            text: prefix + selectedText + suffix,
            marks: [
              {
                type: "math",
                attrs: {
                  latex: selectedText,
                },
              },
            ],
          })
          .run()
      }
    },
    [editor]
  )

  const insertTable = () => {
    if (!editor) return

    tableForm
      .validateFields()
      .then((values) => {
        const { rows, cols, withHeaderRow } = values

        editor
          .chain()
          .focus()
          .insertTable({
            rows: Number.parseInt(rows, 10),
            cols: Number.parseInt(cols, 10),
            withHeaderRow: withHeaderRow,
          })
          .run()

        setTableModalVisible(false)
        tableForm.resetFields()
      })
      .catch((error) => {
        console.error("Validation failed:", error)
      })
  }

  const groupedButtons: MenuButton[][] = editor
    ? [
        [
          {
            id: "RiBold",
            icon: <RiBold className="size-5" />,
            onClick: () => editor.chain().focus().toggleBold().run(),
            isActive: editor.isActive("bold"),
          },
          {
            id: "BsTypeUnderline",
            icon: <BsTypeUnderline className="size-5" />,
            onClick: () => editor.chain().focus().toggleUnderline().run(),
            isActive: editor.isActive("underline"),
          },
          {
            id: "RiItalic",
            icon: <RiItalic className="size-5" />,
            onClick: () => editor.chain().focus().toggleItalic().run(),
            isActive: editor.isActive("italic"),
            // disabled: !editor.can().chain().focus().toggleItalic().run(),
            disabled: !editor.can().chain().focus().toggleItalic(),
          },
          {
            id: "RiStrikethrough",
            icon: <RiStrikethrough className="size-5" />,
            onClick: () => editor.chain().focus().toggleStrike().run(),
            isActive: editor.isActive("strike"),
            disabled: !editor.can().chain().focus().toggleStrike(),
          },
        ],
        //   [
        //       {
        //           id: 'RiMarkPenFill',
        //           icon: <RiMarkPenFill className="size-5" />,
        //           onClick: () => editor.chain().focus().toggleHighlight().run(),
        //           isActive: editor.isActive('highlight'),
        //           disabled: !editor.can().chain().focus().toggleHighlight().run(),
        //       },
        //       {
        //           id: 'RiCodeSSlashLine',
        //           icon: <RiCodeSSlashLine className="size-5" />,
        //           onClick: () => editor.chain().focus().toggleCode().run(),
        //           isActive: editor.isActive('code'),
        //           disabled: !editor.can().chain().focus().toggleCode().run(),
        //       },
        //   ],
        [
          {
            id: "RiAlignLeft",
            icon: <RiAlignLeft className="size-5" />,
            onClick: () => editor.chain().focus().setTextAlign("left").run(),
            isActive: editor.isActive({ textAlign: "left" }),
            disabled: !editor.can().chain().focus().setTextAlign("left"),
          },
          {
            id: "RiAlignJustify",
            icon: <RiAlignJustify className="size-5" />,
            onClick: () => editor.chain().focus().setTextAlign("center").run(),
            isActive: editor.isActive({ textAlign: "center" }),
            disabled: !editor.can().chain().focus().unsetTextAlign(),
          },
          {
            id: "RiAlignRight",
            icon: <RiAlignRight className="size-5" />,
            onClick: () => editor.chain().focus().setTextAlign("right").run(),
            isActive: editor.isActive({ textAlign: "right" }),
            disabled: !editor.can().chain().focus().unsetTextAlign(),
          },
        ],
        [
          {
            id: "IoListOutline",
            icon: <IoListOutline className="size-5" />,
            onClick: () => editor.chain().focus().toggleBulletList().run(),
            isActive: editor.isActive("bulletList"),
            disabled:
              !editor.isActive("bulletList") && !editor.can().chain().focus().toggleBulletList(),
          },
          {
            id: "RiListOrdered2",
            icon: <RiListOrdered2 className="size-5" />,
            onClick: () => editor.chain().focus().toggleOrderedList().run(),
            isActive: editor.isActive("orderedList"),
            disabled:
              !editor.isActive("orderedList") && !editor.can().chain().focus().toggleOrderedList(),
          },
          {
            id: "RiImage2Line",
            icon: (
              <>
                <RiImage2Line className="size-5" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  ref={fileInputRef}
                />
              </>
            ),
            onClick: () => fileInputRef.current?.click(),
            isActive: false,
            disabled: false,
          },
          {
            id: "link",
            icon: <RiLinksLine className="size-5" />,
            onClick: () => {
              const previousUrl = editor.getAttributes("link").href
              const url = window.prompt("Nhập đường dẫn liên kết:", previousUrl)
              if (url === null) return
              if (url === "") {
                editor.chain().focus().extendMarkRange("link").unsetLink().run()
                return
              }
              editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
            },
            isActive: editor.isActive("link"),
            disabled: false,
            description: "Chèn liên kết",
          },
        ],
        [
          {
            id: "RiFunctions",
            icon: <RiFunctions className="size-5" />,
            onClick: toggleMathFormula,
            isActive: editor.isActive("math"),
            disabled: false,
          },
          {
            id: "RiMoneyDollarCircleLine",
            icon: <RiMoneyDollarCircleLine className="size-5" />,
            onClick: () => wrapSelectionWith("$", "$"),
            isActive: false,
            disabled: false,
            description: "Math latex span",
          },
          {
            id: "RiMoneyDollarBoxLine",
            icon: <RiMoneyDollarBoxLine className="size-5" />,
            onClick: () => wrapSelectionWith("$$", "$$"),
            isActive: false,
            disabled: false,
            description: "Math latex div",
          },
          {
            id: "RiAtLine",
            icon: <RiAtLine className="size-5" />,
            onClick: () => handleAddEvidence(),
            isActive: false,
            disabled: false,
            description: "Thêm minh chứng",
          },
        ],
        [
          {
            id: "insertTable",
            icon: <Table className="size-5" />,
            onClick: () => setTableModalVisible(true),
            isActive: editor.isActive("table"),
            disabled: false,
            description: "Chèn bảng",
          },
          {
            id: "addColumnBefore",
            icon: <Columns className="size-5" />,
            onClick: () => editor.chain().focus().addColumnBefore().run(),
            isActive: false,
            disabled: !editor.can().chain().focus().addColumnBefore(),
            description: "Thêm cột trước",
          },
          {
            id: "addColumnAfter",
            icon: <Plus className="size-5" />,
            onClick: () => editor.chain().focus().addColumnAfter().run(),
            isActive: false,
            disabled: !editor.can().chain().focus().addColumnAfter(),
            description: "Thêm cột sau",
          },
          {
            id: "deleteColumn",
            icon: <Trash2 className="size-5" />,
            onClick: () => editor.chain().focus().deleteColumn().run(),
            isActive: false,
            disabled: !editor.can().chain().focus().deleteColumn(),
            description: "Xóa cột",
          },
          {
            id: "addRowBefore",
            icon: <Rows className="size-5" />,
            onClick: () => editor.chain().focus().addRowBefore().run(),
            isActive: false,
            disabled: !editor.can().chain().focus().addRowBefore(),
            description: "Thêm hàng trước",
          },
          {
            id: "addRowAfter",
            icon: <Plus className="size-5" />,
            onClick: () => editor.chain().focus().addRowAfter().run(),
            isActive: false,
            disabled: !editor.can().chain().focus().addRowAfter(),
            description: "Thêm hàng sau",
          },
          {
            id: "deleteRow",
            icon: <Trash2 className="size-5" />,
            onClick: () => editor.chain().focus().deleteRow().run(),
            isActive: false,
            disabled: !editor.can().chain().focus().deleteRow(),
            description: "Xóa hàng",
          },
        ],
        [
          {
            id: "mergeCells",
            icon: <Merge className="size-5" />,
            onClick: () => editor.chain().focus().mergeCells().run(),
            isActive: false,
            disabled: !editor.can().chain().focus().mergeCells(),
            description: "Gộp ô",
          },
          {
            id: "splitCell",
            icon: <Split className="size-5" />,
            onClick: () => editor.chain().focus().splitCell().run(),
            isActive: false,
            disabled: !editor.can().chain().focus().splitCell(),
            description: "Tách ô",
          },
          {
            id: "deleteTable",
            icon: <TableProperties className="size-5" />,
            onClick: () => editor.chain().focus().deleteTable().run(),
            isActive: false,
            disabled: !editor.can().chain().focus().deleteTable(),
            description: "Xóa bảng",
          },
          {
            id: "undo",
            icon: <Undo className="size-5" />,
            onClick: () => editor.chain().focus().undo().run(),
            isActive: false,
            description: "Hoàn tác",
          },
          {
            id: "redo",
            icon: <Redo className="size-5" />,
            onClick: () => editor.chain().focus().redo().run(),
            isActive: false,
            description: "Làm lại",
          },
        ],
      ]
    : []

  if (!editor) return null
  // Ẩn toolbar nếu không editable
  if (!editable) return null

  return (
    <>
      <div className="flex items-center space-x-2 bg-[#FAFAFA] rounded-t-md flex-wrap p-1">
        <div className="flex items-center space-x-2 px-1">
          <Select
            size="small"
            style={{ width: 130 }}
            placeholder="Font"
            options={FONT_FAMILIES.map((font) => ({ label: font, value: font }))}
            value={editorState?.currentFontFamily}
            onChange={(val) => {
              if (val) editor.chain().focus().setFontFamily(val).run()
              else editor.chain().focus().unsetFontFamily().run()
            }}
            allowClear
          />
          <Select
            size="small"
            style={{ width: 70 }}
            placeholder="Size"
            options={FONT_SIZES.map((size) => ({ label: size.replace("px", ""), value: size }))}
            value={editorState?.currentFontSize}
            onChange={(val) => {
              if (val) editor.chain().focus().setFontSize(val).run()
              else editor.chain().focus().unsetFontSize().run()
            }}
            allowClear
          />
          <div className="w-px bg-gray-300 h-6 mx-2" />
        </div>
        {groupedButtons.map((group, index) => (
          <div
            key={`group-${group.map((btn) => btn.id).join("-")}`}
            className="flex items-center space-x-2"
          >
            {group.map(({ icon, onClick, isActive, disabled, description }, btnIndex) => {
              const uniqueKey = `${icon || "button"}-${btnIndex}`
              return (
                <Button
                  key={uniqueKey}
                  onClick={onClick}
                  isActive={isActive}
                  disabled={disabled}
                  description={description}
                >
                  {icon}
                </Button>
              )
            })}
            {index < groupedButtons.length - 1 && <div className="w-px bg-gray-300 h-6 mx-2" />}
          </div>
        ))}
      </div>
      <Modal
        title="Chèn bảng"
        open={tableModalVisible}
        onOk={insertTable}
        onCancel={() => {
          setTableModalVisible(false)
          tableForm.resetFields()
        }}
        footer={[
          <AntdButton
            key="back"
            onClick={() => {
              setTableModalVisible(false)
              tableForm.resetFields()
            }}
          >
            Hủy
          </AntdButton>,
          <AntdButton key="submit" type="primary" onClick={insertTable}>
            Chèn
          </AntdButton>,
        ]}
      >
        <Form
          form={tableForm}
          layout="vertical"
          initialValues={{ rows: 3, cols: 3, withHeaderRow: true }}
        >
          <Form.Item
            label="Số hàng"
            name="rows"
            rules={[{ required: true, message: "Vui lòng nhập số hàng" }]}
          >
            <InputNumber min={1} className="w-full" />
          </Form.Item>
          <Form.Item
            label="Số cột"
            name="cols"
            rules={[{ required: true, message: "Vui lòng nhập số cột" }]}
          >
            <InputNumber min={1} className="w-full" />
          </Form.Item>
          <Form.Item name="withHeaderRow" valuePropName="checked">
            <Checkbox>Hàng tiêu đề</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title={`Nhập công thức toán học ${isBlockMath ? "(khối)" : "(nội dòng)"}`}
        open={mathModalVisible}
        onOk={insertMathFormula}
        onCancel={() => setMathModalVisible(false)}
        footer={[
          <AntdButton key="back" onClick={() => setMathModalVisible(false)}>
            Hủy
          </AntdButton>,
          <AntdButton key="block-toggle" onClick={() => setIsBlockMath(!isBlockMath)}>
            {isBlockMath ? "Chuyển sang nội dòng" : "Chuyển sang khối"}
          </AntdButton>,
          <AntdButton
            key="submit"
            type="primary"
            onClick={insertMathFormula}
            disabled={!mathInput.trim()}
          >
            Chèn
          </AntdButton>,
        ]}
        width={800}
      >
        <Input
          placeholder={`Nhập công thức LaTeX (ví dụ: ${
            isBlockMath ? "\\sum_{i=1}^n i^2 = \\frac{n(n+1)(2n+1)}{6}" : "E = mc^2"
          })`}
          value={mathInput}
          onChange={(e) => setMathInput(e.target.value)}
          onPressEnter={insertMathFormula}
        />
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <div className="text-sm font-medium mb-2">Xem trước:</div>
          <div
            className={`katex-preview ${isBlockMath ? "text-center" : ""}`}
            dangerouslySetInnerHTML={{
              __html: mathInput
                ? (() => {
                    try {
                      return katex.renderToString(mathInput, {
                        throwOnError: false,
                        displayMode: isBlockMath,
                      })
                    } catch {
                      return '<span class="text-red-500">Công thức không hợp lệ</span>'
                    }
                  })()
                : '<span class="text-gray-400">Nhập công thức để xem trước</span>',
            }}
          />
        </div>
        <Row gutter={16} className="mt-4">
          <Col span={12}>
            <Title level={5} className="mb-2">
              Ví dụ công thức nội dòng:
            </Title>
            <List
              size="small"
              dataSource={["E = mc^2", "a^2 + b^2 = c^2", "\\frac{a}{b}", "\\sqrt{x}", "\\sin(x)"]}
              renderItem={(item) => (
                <List.Item style={{ padding: 0, border: "none" }}>
                  <code>{item}</code>
                </List.Item>
              )}
            />
          </Col>
          <Col span={12}>
            <Title level={5} className="mb-2">
              Ví dụ công thức khối:
            </Title>
            <List
              size="small"
              dataSource={[
                "\\int_a^b x^2 dx",
                "\\sum_{i=0}^n i^2",
                "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}",
                "f(x) = \\begin{cases} x & \\text{if } x \\geq 0 \\\\ -x & \\text{if } x < 0 \\end{cases}",
              ]}
              renderItem={(item) => (
                <List.Item style={{ padding: 0, border: "none" }}>
                  <code>{item}</code>
                </List.Item>
              )}
            />
          </Col>
        </Row>
      </Modal>
    </>
  )
}
