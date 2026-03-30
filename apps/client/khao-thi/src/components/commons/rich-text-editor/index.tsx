// @ts-nocheck
import { cn } from "@lib/utils"
import Highlight from "@tiptap/extension-highlight"
import Mention from "@tiptap/extension-mention"
import TextAlign from "@tiptap/extension-text-align"
import Underline from "@tiptap/extension-underline"
import {
  type Editor,
  EditorContent,
  type EditorContentProps,
  mergeAttributes,
  useEditor,
} from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { useEffect, useRef } from "react"
import "./index.css"
import Image from "@tiptap/extension-image"
import { Mathematics } from "@tiptap/extension-mathematics"
import { generatePresignedUrl } from "@workspace/libs/api/model"
import { getRuntimeEnv } from "@workspace/libs/utils"
import { message } from "antd"
import { type MentionType, suggestion } from "./mention"
import TextEditorMenuBar from "./TextEditorMenuBar"
import "katex/dist/katex.min.css"
import Color from "@tiptap/extension-color"
import { Table } from "@tiptap/extension-table"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"
import TableRow from "@tiptap/extension-table-row"
import { CustomTextStyle } from "./CustomTextStyle"
import { CustomParagraph } from "./CustomParagraph"

type TextEditorProps = {
  value?: string
  onChange?: (content: string) => void
  className?: string
  mentions?: Array<MentionType>
  editorProps?: Omit<EditorContentProps, "ref" | "editor">
  id?: string
  editable?: boolean
  stickyToolbar?: boolean
  defaultTable?: boolean
}

export function RichTextEditor({
  value,
  onChange,
  className,
  mentions = [],
  editorProps,
  id,
  editable = true,
  stickyToolbar = false,
  defaultTable = false,
}: TextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    editable,
    extensions: [
      StarterKit.configure({ paragraph: false }),
      CustomParagraph,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph", "textStyle", "image"],
      }),
      Highlight,
      CustomTextStyle,
      Color.configure({ types: ["textStyle"] }),
      Image.configure({
        inline: true,
        allowBase64: false,
        HTMLAttributes: {
          class: "mx-auto my-2",
        },
      }),
      Mention.configure({
        renderHTML({ node, options }) {
          return [
            "span",
            mergeAttributes({
              class: `bg-purple-100 text-purple-600 rounded-md px-1 py-[0.1rem] break-words after:content-['\\200B']`,
              title: node.attrs.label,
              "data-id": node.attrs.id,
              "data-toggle": "popover",
              "data-trigger": "hover",
            }),
            `${options.suggestion.char}${node.attrs.label ?? node.attrs.id}`,
          ]
        },
        suggestion: suggestion(mentions),
      }),
      Mathematics.configure({
        shouldRender: (state, pos, node) => {
          const $pos = state.doc.resolve(pos)
          return node.type.name === "text" && $pos.parent.type.name !== "codeBlock"
        },
        katexOptions: {
          output: "html",
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "table-auto border-collapse w-full my-4",
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: "table-row",
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: "bg-gray-100 font-semibold text-left p-2 border",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "p-2 border",
        },
      }),
    ],
    content: value || "", // Khởi tạo với giá trị từ form
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML()) // Cập nhật form khi có thay đổi
    },
    editorProps: {
      attributes: {
        class: cn(
          "min-h-[150px] cursor-text rounded-b-md p-2 ring-offset-background focus-within:outline-none focus-within:ring-1 focus-within:ring-primary",
          className
        ),
        spellcheck: false,
      },
      transformPastedHTML: (html: string) => {
        const isWordContent =
          html.includes("mso-") ||
          html.includes("Microsoft Word") ||
          html.includes("urn:schemas-microsoft-com")
        if (!isWordContent) return html

        const parser = new DOMParser()
        const doc = parser.parseFromString(html, "text/html")

        // --- Step 1: Extract indent rules from Word's <style> block ---
        // Word stores paragraph default styles in a CSS class (e.g. .MsoNormal),
        // NOT as inline styles. We need to read those rules too.
        type IndentRule = { marginLeft?: string; textIndent?: string }
        const cssClassRules = new Map<string, IndentRule>()

        const styleEl = doc.querySelector("style")
        if (styleEl) {
          const cssText = styleEl.textContent || ""
          // Match rules like: .ClassName { ... margin-left: X; text-indent: Y; ... }
          const ruleRegex = /\.([A-Za-z0-9_-]+)[^{]*\{([^}]*)\}/g
          let match = ruleRegex.exec(cssText)
          while (match !== null) {
            const className = match[1]
            const declarations = match[2]
            const mlMatch = declarations.match(/margin-left\s*:\s*([^;]+)/i)
            const tiMatch = declarations.match(/text-indent\s*:\s*([^;]+)/i)
            if (mlMatch || tiMatch) {
              cssClassRules.set(className, {
                marginLeft: mlMatch?.[1]?.trim(),
                textIndent: tiMatch?.[1]?.trim(),
              })
            }
            match = ruleRegex.exec(cssText)
          }
        }

        const isZeroValue = (v: string | undefined) =>
          !v || v === "0" || v === "0in" || v === "0cm" || v === "0pt" || v === "0px" || v === "0em"

        // --- Step 2: Process each paragraph ---
        doc.querySelectorAll("p").forEach((el) => {
          if (!(el instanceof HTMLElement)) return

          // Read inline styles first (highest priority)
          let marginLeft = el.style.marginLeft
          let textIndent = el.style.textIndent
          const textAlign = el.style.textAlign

          // Fall back to CSS class rules if no inline indent found
          if (isZeroValue(marginLeft) || isZeroValue(textIndent)) {
            for (const cls of el.classList) {
              const rules = cssClassRules.get(cls)
              if (!rules) continue
              if (isZeroValue(marginLeft) && !isZeroValue(rules.marginLeft)) {
                marginLeft = rules.marginLeft ?? ""
              }
              if (isZeroValue(textIndent) && !isZeroValue(rules.textIndent)) {
                textIndent = rules.textIndent ?? ""
              }
            }
          }

          // Strip mso-* noise, rebuild clean style
          const currentStyle = el.getAttribute("style") || ""
          const cleanStyle = currentStyle
            .split(";")
            .map((s) => s.trim())
            .filter((s) => {
              if (!s) return false
              const prop = s.split(":")[0]?.trim().toLowerCase()
              return (
                !!prop &&
                !prop.startsWith("mso-") &&
                !prop.startsWith("panose-") &&
                prop !== "font-family"
              )
            })
            .join("; ")

          el.setAttribute("style", cleanStyle)

          // Re-apply resolved indentation explicitly
          if (!isZeroValue(marginLeft)) el.style.marginLeft = marginLeft
          if (!isZeroValue(textIndent)) el.style.textIndent = textIndent
          if (textAlign) el.style.textAlign = textAlign
        })

        return doc.body.innerHTML
      },
      handlePaste: (view, event, slice) => {
        const items = event.clipboardData?.items
        if (!items) return false

        const clipboardText = event.clipboardData?.getData("text/plain")
        if (clipboardText) {
          const inlineMathRegex = /^\$(.+)\$$/
          const blockMathRegex = /^\$\$(.+)\$\$$/

          const inlineMathMatch = clipboardText.match(inlineMathRegex)
          const blockMathMatch = clipboardText.match(blockMathRegex)

          if (inlineMathMatch || blockMathMatch) {
            const isBlockMath = !!blockMathMatch
            const mathContent = isBlockMath ? blockMathMatch?.[1] : inlineMathMatch?.[1]

            try {
              editor
                ?.chain()
                .focus()
                .insertContent({
                  type: "text",
                  text: isBlockMath ? `$$${mathContent}$$` : `$${mathContent}$`,
                  marks: [
                    {
                      type: "math",
                      attrs: {
                        latex: mathContent,
                      },
                    },
                  ],
                })
                .run()
              return true
            } catch (error) {
              console.error("Failed to paste math content:", error)
            }
          }

          if (/\\[a-zA-Z]+\{.*\}|_[a-zA-Z0-9]|\^[a-zA-Z0-9]/.test(clipboardText)) {
            const shouldFormatAsMath = confirm(
              "This looks like math content. Format as math formula?"
            )
            if (shouldFormatAsMath) {
              const isBlock = confirm("Use block format ($$...$$)?")
              editor
                ?.chain()
                .focus()
                .insertContent({
                  type: "text",
                  text: isBlock ? `$$${clipboardText}$$` : `$${clipboardText}$`,
                  marks: [
                    {
                      type: "math",
                      attrs: {
                        latex: clipboardText,
                      },
                    },
                  ],
                })
                .run()
              return true
            }
          }
        }

        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          if (item.type.indexOf("image") === 0) {
            const file = item.getAsFile()
            if (!file) return false

            // Start async upload process
            uploadImageFile(file, editor).catch((error) => {
              console.error("Image upload failed:", error)
              editor?.chain().focus().insertContent("<p>Image upload failed</p>").run()
            })

            // Return true to prevent default paste behavior
            return true
          }
        }
        return false
      },
      handleDrop: (view, event, slice) => {
        const files = event.dataTransfer?.files
        if (!files || files.length === 0) return false

        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          if (file.type.indexOf("image") === 0) {
            event.preventDefault()

            // Start async upload process
            uploadImageFile(file, editor).catch((error) => {
              message.error("Image upload failed:", error)
              editor?.chain().focus().insertContent("<p>Image upload failed</p>").run()
            })

            return true
          }
        }
        return false
      },
    },
  })

  async function uploadImageFile(file: File, editor: Editor | null) {
    if (!editor || editor.isDestroyed) {
      message.error("Editor is not available or destroyed")
      return
    }

    try {
      message.loading({ content: "Đang tải ảnh...", duration: 0 })

      // Generate presigned URL
      const extension = file.name.split(".").pop() || "png"
      const resPresignedUrl = await generatePresignedUrl({
        path: "question-images",
        extension,
      })

      // Upload to MinIO
      await fetch(resPresignedUrl.data.url, {
        method: "PUT",
        body: file,
      })

      const imageUrl = `${getRuntimeEnv("NEXT_PUBLIC_MINIO_ENDPOINT")}/${resPresignedUrl.data.fileName}`

      editor
        .chain()
        .focus()
        .setImage({
          src: imageUrl,
          alt: file.name,
          title: file.name,
        })
        .run()

      message.destroy()
    } catch (error) {
      message.destroy()
      throw error
    }
  }
  const defaultTableInserted = useRef(false)

  useEffect(() => {
    if (editor && defaultTable && !value && !defaultTableInserted.current) {
      defaultTableInserted.current = true

      const makeCell = (text: string, isHeader = false, colwidth?: number) => ({
        type: isHeader ? "tableHeader" : "tableCell",
        attrs: { colspan: 1, rowspan: 1, colwidth: colwidth ? [colwidth] : null },
        content: [{ type: "paragraph", content: text ? [{ type: "text", text }] : [] }],
      })

      const headers: { text: string; width: number }[] = [
        { text: "TT", width: 50 },
        { text: "Mục tiêu", width: 150 },
        { text: "Nội dung", width: 200 },
        { text: "Đơn vị, người thực hiện", width: 180 },
        { text: "Thời gian thực hiện hoặc hoàn thành", width: 180 },
        { text: "Ghi chú", width: 120 },
      ]

      editor.commands.setContent({
        type: "doc",
        content: [
          {
            type: "table",
            content: [
              {
                type: "tableRow",
                content: headers.map(({ text, width }) => makeCell(text, true, width)),
              },
              {
                type: "tableRow",
                content: headers.map((_, i) =>
                  makeCell(
                    i === 0 ? "1" : i === 1 ? "Khắc phục điểm tồn tại" : "",
                    false,
                    headers[i].width
                  )
                ),
              },
              {
                type: "tableRow",
                content: headers.map((_, i) =>
                  makeCell(
                    i === 0 ? "2" : i === 1 ? "Phát huy điểm mạnh" : "",
                    false,
                    headers[i].width
                  )
                ),
              },
            ],
          },
        ],
      })
    }
  }, [editor, defaultTable, value])

  useEffect(() => {
    if (!editor) return
    if (!value && defaultTable) return
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "", false)
    }
  }, [value, editor, defaultTable])

  useEffect(() => {
    if (!editor) return
    if (editor.isEditable !== editable) {
      editor.setEditable(editable)
    }
  }, [editor, editable])

  return (
    <div className="border rounded-md">
      <div className={stickyToolbar ? "sticky top-0 z-10 bg-white border-b rounded-t-md" : ""}>
        <TextEditorMenuBar editor={editor} id={id} editable={editable} />
      </div>
      <EditorContent editor={editor} {...editorProps} />
    </div>
  )
}
