import { cn } from '@lib/utils'
import Highlight from '@tiptap/extension-highlight'
import Mention from '@tiptap/extension-mention'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { EditorContent, type EditorContentProps, mergeAttributes, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'
import './index.css'
import { type MentionType, suggestion } from './mention'
import TextEditorMenuBar from './TextEditorMenuBar'

// import Mention from '@tiptap/extension-mention'
// import Link from '@tiptap/extension-link'
// import Table from '@tiptap/extension-table'
// import TableCell from '@tiptap/extension-table-cell'
// import TableRow from '@tiptap/extension-table-row'
// import TableHeader from '@tiptap/extension-table-header'
// import TextStyle from '@tiptap/extension-text-style'
// import ExportDocx from '@tiptap/extension-export-docx'
// import Color from '@tiptap/extension-color'
// import FontFamily from '@tiptap/font-family'

type TextEditorProps = {
    value?: string
    onChange?: (content: string) => void
    className?: string
    mentions?: Array<MentionType>
    editorProps?: Omit<EditorContentProps, 'ref' | 'editor'>
}

export function RichTextEditor({
    value,
    onChange,
    className,
    mentions = [],
    editorProps,
}: TextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Highlight,
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
            Mention.configure({
                renderHTML({ node, options }) {
                    return [
                        'span',
                        mergeAttributes({
                            class: `bg-purple-100 text-purple-600 rounded-md px-1 py-[0.1rem] break-words after:content-['\\200B']`,
                            title: node.attrs.label,
                            'data-id': node.attrs.id,
                            'data-toggle': 'popover',
                            'data-trigger': 'hover',
                        }),
                        `${options.suggestion.char}${node.attrs.label ?? node.attrs.id}`,
                    ]
                },
                suggestion: suggestion(mentions),
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
        content: value || '', // Khởi tạo với giá trị từ form
        onUpdate: ({ editor }) => {
            onChange?.(editor.getHTML()) // Cập nhật form khi có thay đổi
        },
        editorProps: {
            attributes: {
                class: cn(
                    'min-h-[150px] cursor-text rounded-b-md border p-2 ring-offset-background focus-within:outline-none focus-within:ring-1 focus-within:ring-primary focus-within:ring-offset-0.2 ',
                    className
                ),
            },
        },
    })

    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value || '', false)
        }
    }, [value, editor])

    return (
        <div>
            <TextEditorMenuBar editor={editor} />
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
