import { UnorderedListOutlined } from "@ant-design/icons"
import { Button, Dropdown, Menu } from "antd"
import { useState } from "react"

function HeaderContent() {
  const [activeId, setActiveId] = useState<string | null>(null)

  const listAI = [
    { id: "1", label: "AI Chat" },
    { id: "2", label: "AI Text Generator" },
    { id: "3", label: "AI Text to Speech" },
    { id: "4", label: "AI Image Generator" },
    { id: "5", label: "AI Voice Cloner" },
  ]

  const visibleList = listAI.slice(0, 3)
  const moreList = listAI.slice(3)

  const handleClick = (id: string) => {
    setActiveId(id)
  }

  const menu = (
    <Menu>
      {moreList.map((item) => (
        <Menu.Item key={item.id} onClick={() => handleClick(item.id)}>
          {item.label}
        </Menu.Item>
      ))}
    </Menu>
  )

  return (
    <div className="h-[60px] p-[8px] mb-2 bg-white flex items-center justify-start border-primary">
      <div className="flex items-center gap-2">
        {visibleList.map((item) => {
          const isActive = item.id === activeId
          return (
            <Button
              key={item.id}
              size="large"
              type={isActive ? "primary" : "default"}
              onClick={() => handleClick(item.id)}
            >
              {item.label}
            </Button>
          )
        })}
        {moreList.length > 0 && (
          <Dropdown overlay={menu} trigger={["click"]}>
            <Button icon={<UnorderedListOutlined />} size="large" />
          </Dropdown>
        )}
      </div>
    </div>
  )
}

export default HeaderContent
