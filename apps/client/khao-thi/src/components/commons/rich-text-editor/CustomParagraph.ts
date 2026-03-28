import { mergeAttributes, Node } from "@tiptap/react"

export const CustomParagraph = Node.create({
  name: "paragraph",
  priority: 1000,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  group: "block",
  content: "inline*",

  parseHTML() {
    return [{ tag: "p" }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["p", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addAttributes() {
    return {
      textIndent: {
        default: null,
        parseHTML: (element) => element.style.textIndent || null,
        renderHTML: (attributes) => {
          if (!attributes.textIndent) return {}
          return { style: `text-indent: ${attributes.textIndent}` }
        },
      },
      marginLeft: {
        default: null,
        parseHTML: (element) => element.style.marginLeft || null,
        renderHTML: (attributes) => {
          if (!attributes.marginLeft) return {}
          return { style: `margin-left: ${attributes.marginLeft}` }
        },
      },
    }
  },
})
