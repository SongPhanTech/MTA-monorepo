import { TextStyle } from "@tiptap/extension-text-style"
import { Plugin, PluginKey } from "@tiptap/pm/state"

// Kế thừa TextStyle để thêm id
export const CustomTextStyle = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(), // giữ lại attr gốc (như color)
      id: {
        default: null,
        parseHTML: (element) =>
          element.getAttribute("data-evidence-id") || element.getAttribute("id"),
        renderHTML: (attributes) => {
          if (!attributes.id) return {}
          return {
            "data-evidence-id": attributes.id,
            "data-type": "evidence",
            style: "cursor: pointer;",
          }
        },
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("evidenceMarkNonInclusive"),
        appendTransaction(_transactions, _oldState, newState) {
          const { storedMarks } = newState
          if (!storedMarks) return null
          const hasEvidenceMark = storedMarks.some(
            (m) => m.type.name === "textStyle" && m.attrs.id
          )
          if (!hasEvidenceMark) return null
          const tr = newState.tr
          tr.setStoredMarks(
            storedMarks.filter((m) => !(m.type.name === "textStyle" && m.attrs.id))
          )
          return tr
        },
      }),
    ]
  },
})
