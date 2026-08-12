import { MessageOutlined } from "@ant-design/icons"
import { useEffect, useState } from "react"

import "./chatbot.css"
export const WidgetChatbot = ({ src = "https://mta.swantech.vn/chatbot/tro-ly-ao" }) => {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "TOGGLE_CHAT_WIDGET") {
        setOpen(false)
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  return (
    <div>
      <div className={`fixed-chatbox ${open ? "show" : "hide"}`}>
        <iframe src={src} className="fixed-chatbox-iframe" title="Chatbot" />
      </div>
      {/** biome-ignore lint/a11y/useButtonType: Toggle button doesn't need explicit type */}
      <button className="chatbox-toggle-btn" onClick={() => setOpen((prev) => !prev)}>
        <MessageOutlined />
      </button>
    </div>
  )
}
