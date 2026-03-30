import { Button, message } from "antd"
import { Clipboard } from "lucide-react"

export function ClipboardButton({ text }: { text: string }) {
  const handleCopy = async () => {
    try {
      if (!text) return
      await navigator.clipboard.writeText(text)
      message.success("Copied to clipboard")
    } catch {
      message.error("Failed to copy")
    }
  }

  return (
    <Button onClick={handleCopy} type="text">
      <Clipboard />
    </Button>
  )
}
