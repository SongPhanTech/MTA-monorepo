import type { Editor } from '@tiptap/react'
import { generatePresignedUrl } from '@workspace/libs/api/model'
import { message } from 'antd'
import { useRef } from 'react'
import { BsTypeUnderline } from 'react-icons/bs'
import { IoListOutline } from 'react-icons/io5'
import {
    RiAlignJustify,
    RiAlignLeft,
    RiAlignRight,
    RiImage2Line,
    RiItalic,
    RiListOrdered2,
    RiMarkPenFill,
    RiStrikethrough,
} from 'react-icons/ri'
import { env } from '@/env'

const Button = ({
    onClick,
    isActive,
    disabled,
    children,
}: {
    onClick: () => void
    isActive: boolean
    disabled?: boolean
    children: React.ReactNode
}) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`p-2 ${isActive ? 'bg-primary text-white rounded-md' : ''}`}
    >
        {children}
    </button>
)

export default function TextEditorMenuBar({ editor }: { editor: Editor | null }) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    if (!editor) return null

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        try {
            const extension = file.name.split('.').pop() || 'png'
            const resPresignedUrl = await generatePresignedUrl({
                path: 'question-images',
                extension,
            })

            await fetch(resPresignedUrl.data.url, {
                method: 'PUT',
                body: file,
            })

            const imageUrl = `${env.NEXT_PUBLIC_MINIO_ENDPOINT}/${resPresignedUrl.data.fileName}`

            editor
                .chain()
                .focus()
                .setImage({
                    src: imageUrl,
                    alt: file.name,
                    title: file.name,
                })
                .run()
        } catch (error) {
            console.error('Image upload failed:', error)
            message.error('Image upload failed. Please try again.')
        } finally {
            if (event.target) {
                event.target.value = ''
            }
        }
    }

    const groupedButtons = [
        [
            {
                icon: <RiBold className="size-5" />,
                onClick: () => editor.chain().focus().toggleBold().run(),
                isActive: editor.isActive('bold'),
            },
            {
                icon: <BsTypeUnderline className="size-5" />,
                onClick: () => editor.chain().focus().toggleUnderline().run(),
                isActive: editor.isActive('underline'),
            },
            {
                icon: <RiItalic className="size-5" />,
                onClick: () => editor.chain().focus().toggleItalic().run(),
                isActive: editor.isActive('italic'),
                disabled: !editor.can().chain().focus().toggleItalic().run(),
            },
            {
                icon: <RiStrikethrough className="size-5" />,
                onClick: () => editor.chain().focus().toggleStrike().run(),
                isActive: editor.isActive('strike'),
                disabled: !editor.can().chain().focus().toggleStrike().run(),
            },
        ],
        [
            {
                icon: <RiMarkPenFill className="size-5" />,
                onClick: () => editor.chain().focus().toggleHighlight().run(),
                isActive: editor.isActive('highlight'),
                disabled: !editor.can().chain().focus().toggleHighlight().run(),
            },
            {
                icon: <RiCodeSSlashLine className="size-5" />,
                onClick: () => editor.chain().focus().toggleCode().run(),
                isActive: editor.isActive('code'),
                disabled: !editor.can().chain().focus().toggleCode().run(),
            },
        ],
        [
            {
                icon: <RiAlignLeft className="size-5" />,
                onClick: () => editor.chain().focus().setTextAlign('left').run(),
                isActive: editor.isActive({ textAlign: 'left' }),
                disabled: !editor.can().chain().focus().unsetTextAlign().run(),
            },
            {
                icon: <RiAlignJustify className="size-5" />,
                onClick: () => editor.chain().focus().setTextAlign('center').run(),
                isActive: editor.isActive({ textAlign: 'center' }),
                disabled: !editor.can().chain().focus().unsetTextAlign().run(),
            },
            {
                icon: <RiAlignRight className="size-5" />,
                onClick: () => editor.chain().focus().setTextAlign('right').run(),
                isActive: editor.isActive({ textAlign: 'right' }),
                disabled: !editor.can().chain().focus().unsetTextAlign().run(),
            },
        ],
        [
            {
                icon: <IoListOutline className="size-5" />,
                onClick: () => editor.chain().focus().toggleBulletList().run(),
                isActive: editor.isActive('bulletList'),
                disabled:
                    !editor.isActive('bulletList') &&
                    !editor.can().chain().focus().toggleBulletList().run(),
            },

            {
                icon: <RiListOrdered2 className="size-5" />,
                onClick: () => editor.chain().focus().toggleOrderedList().run(),
                isActive: editor.isActive('orderedList'),
                disabled:
                    !editor.isActive('orderedList') &&
                    !editor.can().chain().focus().toggleOrderedList().run(),
            },
            {
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
        ],
        // [
        //     { icon: <AiOutlineUndo className="size-5" />, onClick: () => editor.chain().focus().undo().run(), isActive: false, disabled: !editor.can().chain().focus().undo().run() },
        //     { icon: <AiOutlineRedo className="size-5" />, onClick: () => editor.chain().focus().redo().run(), isActive: false, disabled: !editor.can().chain().focus().redo().run() },
        // ],
    ]

    return (
        <div className="flex space-x-2 bg-[#FAFAFA] rounded-t-md flex-wrap">
            {groupedButtons.map((group, index) => (
                <div
                    key={`group-${group.map((btn) => btn.icon?.type?.name).join('-')}`}
                    className="flex items-center space-x-2"
                >
                    {group.map(({ icon, onClick, isActive, disabled }, btnIndex) => {
                        const uniqueKey = `${icon?.type?.name || 'button'}-${btnIndex}`
                        return (
                            <Button
                                key={uniqueKey}
                                onClick={onClick}
                                isActive={isActive}
                                disabled={disabled}
                            >
                                {icon}
                            </Button>
                        )
                    })}
                    {index < groupedButtons.length - 1 && (
                        <div className="w-px bg-gray-300 h-6 mx-2" />
                    )}{' '}
                </div>
            ))}
        </div>
    )
}
