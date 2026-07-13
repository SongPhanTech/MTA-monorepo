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
import { useEffect } from "react"
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

// import Mention from '@tiptap/extension-mention'
// import Link from '@tiptap/extension-link'
// import TextStyle from '@tiptap/extension-text-style'
// import ExportDocx from '@tiptap/extension-export-docx'
// import FontFamily from '@tiptap/font-family'

type TextEditorProps = {
  value?: string
  onChange?: (content: string) => void
  className?: string
  mentions?: Array<MentionType>
  editorProps?: Omit<EditorContentProps, "ref" | "editor">
  id?: string
  editable?: boolean | undefined
}

export function RichTextEditor({
  value,
  onChange,
  className,
  mentions = [],
  editorProps,
  id,
}: TextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph", "textStyle", "image"],
      }),
      Highlight,
      CustomTextStyle,
      Color.configure({ types: ["textStyle"] }),
      // ExportDocx.configure({
      //     onCompleteExport: (result: ArrayBuffer) => {
      //         setIsLoading(false)
      //         const blob = new Blob([result], {
      //             type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      //         })
      //         const url = URL.createObjectURL(blob)
      //         const a = document.createElement('a')

      //         a.href = url
      //         a.download = 'export.docx'
      //         a.click()
      //         URL.revokeObjectURL(url)
      //     },
      // }),
      // Highlight.configure({ multicolor: true }),
      Image.configure({
        inline: true,
        allowBase64: false,
        HTMLAttributes: {
          class: "mx-auto my-2",
        },
        resize: {
          enabled: true,
          minWidth: 10,
          minHeight: 10,
          alwaysPreserveAspectRatio: true,
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
        // shouldRender: (state, pos, node) => {
        //     const $pos = state.doc.resolve(pos)
        //     return node.type.name === 'text' && $pos.parent.type.name !== 'codeBlock'
        // },
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
      // TextStyle.configure({ mergeNestedSpanStyles: true }),
      //   ImportDocx.configure({
      //     appId: 'your-app-id',
      //     token: 'your-jwt',
      //     // This is our demo endpoint, and it won't work outside this environment, in production you should remove this field
      //     endpoint: 'https://api-demo.tiptap.dev/v2/convert',
      //     // This is our demo endpoint, and it won't work outside this environment, in production you should use your own image upload endpoint
      //     imageUploadCallbackUrl: 'https://api-demo.tiptap.dev/v2/convert/upload',
      //   }),
      // Table,
      // TableRow,
      // TableCell,
      // TableHeader,
      // TextAlign.configure({ types: ['heading', 'paragraph'] }),
      // Link,
      // Color,
      // FontFamily,
      // Underline,
    ],
    content: value || "", // Khởi tạo với giá trị từ form
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML()) // Cập nhật form khi có thay đổi
    },
    editorProps: {
      attributes: {
        class: cn(
          "min-h-[150px] cursor-text rounded-b-md border p-2 ring-offset-background focus-within:outline-none focus-within:ring-1 focus-within:ring-primary focus-within:ring-offset-0.2 ",
          className
        ),
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
    immediatelyRender: false,
  })

  async function uploadImageFile(file: File, editor: Editor | null) {
    if (!editor || editor.isDestroyed) {
      message.error("Editor is not available or destroyed")
      return
    }
    const placeholderId = `image-${Date.now()}`
    const placeholder = document.createElement("div")
    placeholder.textContent = "Uploading image..."
    placeholder.id = placeholderId
    editor.view.dom.parentNode?.appendChild(placeholder)

    try {
      // Generate presigned URL
      const extension = file.name.split(".").pop() || "png"
      const resPresignedUrl = await generatePresignedUrl({
        path: "question-images",
        extension,
      })

      if (resPresignedUrl.status !== 200) {
        throw new Error(
          "message" in resPresignedUrl.data
            ? resPresignedUrl.data.message
            : "Không thể tạo presigned URL"
        )
      }

      const { url, fileName } = resPresignedUrl.data

      await fetch(url, {
        method: "PUT",
        body: file,
      })

      const imageUrl = `${getRuntimeEnv("NEXT_PUBLIC_MINIO_ENDPOINT")}/${fileName}`

      editor
        .chain()
        .focus()
        .setImage({
          src: imageUrl,
          alt: file.name,
          title: file.name,
        })
        .run()
    } finally {
      // Remove placeholder
      document.getElementById(placeholderId)?.remove()
    }
  }
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "")
    }
  }, [value, editor])

  return (
    <div>
      <TextEditorMenuBar editor={editor} id={id} />
      <EditorContent editor={editor} {...editorProps} />
    </div>
  )
}
// function handleExportDocx(){
//     editor
//     ?.chain()
//     .exportDocx()
//     .run()

// }
// function handleExportDocxBuffer() {
// Call your editor's exportDocx method
//     Editor
//     //   .chain()
//       // Method call with some overrides
//       .exportDocx({
//         // Override the onCompleteExport callback to handle the override exported type
//         onCompleteExport: (result: Buffer) => {
//           // Handle the exported file in a buffer format
//         },
//         // Override the export type
//         exportType: 'Buffer',
//       })
//       .run()
//   }

//   // Call those functions at any point in your application
// //   handleExportDocx()
//   handleExportDocxBuffer()
