import type { MentionNodeAttrs } from "@tiptap/extension-mention"
import { ReactRenderer } from "@tiptap/react"
import type { SuggestionKeyDownProps, SuggestionOptions, SuggestionProps } from "@tiptap/suggestion"
import { forwardRef, useEffect, useImperativeHandle, useState } from "react"
import type { GetReferenceClientRect, Instance, Props } from "tippy.js"
import tippy from "tippy.js"

export type MentionListHandle = {
  onKeyDown?: (props: SuggestionKeyDownProps) => boolean
}

export type MentionType = {
  id: string
  label: string
}

export type MentionListProps = SuggestionProps<MentionType, MentionNodeAttrs>
export type MentionListOptions = SuggestionOptions<MentionType, MentionNodeAttrs>

export const MentionList = forwardRef<MentionListHandle, MentionListProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectItem = (index: number) => {
    const item = props.items[index]

    if (item) {
      props.command(item)
    }
  }

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length)
  }

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length)
  }

  const enterHandler = () => {
    selectItem(selectedIndex)
  }

  useEffect(() => setSelectedIndex(0), [])

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowUp") {
        upHandler()
        return true
      }

      if (event.key === "ArrowDown") {
        downHandler()
        return true
      }

      if (event.key === "Enter") {
        enterHandler()
        return true
      }
      return false
    },
  }))

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-md flex flex-col gap-1 overflow-auto p-2 relative">
      {props.items.length ? (
        props.items.map((item, index) => (
          <button
            type="button"
            key={item.id}
            onClick={() => selectItem(index)}
            className={`flex items-center w-full gap-1 text-left px-2 py-1 rounded-md transition-colors
                ${index === selectedIndex ? "bg-gray-200 hover:bg-gray-300" : "hover:bg-gray-100"}`}
          >
            {item.label}
          </button>
        ))
      ) : (
        <div className="px-2 py-1 text-gray-500">Không có kết quả</div>
      )}
    </div>
  )
})

export const suggestion = (mentions: Array<MentionType>): Omit<MentionListOptions, "editor"> => {
  return {
    items: ({ query }) => {
      return mentions
        .filter((item) => (item.label || "").toLowerCase().includes(query.toLowerCase()))
        .slice(0, 6)
    },
    render: () => {
      let component: ReactRenderer<MentionListHandle>
      let popup: Array<Instance<Props>>

      return {
        onStart: (props) => {
          component = new ReactRenderer(MentionList, {
            props,
            editor: props.editor,
          })
          if (!props.clientRect) {
            return
          }
          popup = tippy("body", {
            getReferenceClientRect: props.clientRect as GetReferenceClientRect,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: "manual",
            placement: "bottom-start",
          })
        },

        onUpdate(props) {
          component.updateProps(props)

          if (!props.clientRect) {
            return
          }
          if (popup && popup.length > 0 && popup[0]) {
            popup[0].setProps({
              getReferenceClientRect: props.clientRect as GetReferenceClientRect,
            })
          }
        },

        onKeyDown(props) {
          if (props.event.key === "Escape") {
            if (popup && popup.length > 0 && popup[0]) {
              popup[0].hide()
            }
            return true
          }
          if (component.ref?.onKeyDown) {
            return component.ref.onKeyDown(props)
          }
          return false
        },

        onExit() {
          if (popup && popup.length > 0 && popup[0]) {
            popup[0].destroy()
          }
          component.destroy()
        },
      }
    },
    allowSpaces: true,
    char: "@",
  }
}
