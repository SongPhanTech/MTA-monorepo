import { TextStyle } from "@tiptap/extension-text-style"

// Kế thừa TextStyle để thêm id
export const CustomTextStyle = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(), // giữ lại attr gốc (như color)
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("id"),
        renderHTML: (attributes) => {
          if (!attributes.id) return {}
          return { id: attributes.id }
        },
      },
    }
  },
})
