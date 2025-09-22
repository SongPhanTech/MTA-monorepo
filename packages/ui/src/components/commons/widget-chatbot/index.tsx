import { MessageOutlined } from '@ant-design/icons'
import { useState } from 'react'
import './chatbot.css'
export const WidgetChatbot = ({ src = 'http://localhost:3000/tro-ly-ao' }) => {
    const [open, setOpen] = useState(false)

    return (
        <div>
            <div className={`fixed-chatbox ${open ? 'show' : 'hide'}`}>
                <iframe src={src} className="fixed-chatbox-iframe" title="Chatbot" />
            </div>
            {/** biome-ignore lint/a11y/useButtonType: <explanation> */}
            <button
                className="chatbox-toggle-btn"
                onClick={() => setOpen((prev) => !prev)}
                // aria-label={open ? 'Đóng chatbox' : 'Mở chatbox'}
            >
                <MessageOutlined />
            </button>
        </div>
    )
}
