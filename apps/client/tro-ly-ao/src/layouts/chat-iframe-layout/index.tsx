import ChatIframeHeader from "@components/layouts/header/chat-iframe-header"
import SiderChatLayout from "@components/layouts/sider/chat-sider"
import { cn } from "@lib/utils"
import {
  useDeleteConversation,
  useDeleteManyMessage,
  useFindManyConversation,
} from "@workspace/db/hooks"
import { Layout, message, Spin } from "antd"
import { useRouter } from "next/router"
import { type ReactNode, useEffect, useState } from "react"
import { useUserSession } from "@/hooks/useUserSession"
import type { ConversationDataFromAPI } from "@/navigations/sider-tro-ly-ao"
import { generateMenusTroLyAo } from "@/navigations/sider-tro-ly-ao"

const { Content } = Layout

interface ChatIframeLayoutProps {
  children: ReactNode
  className?: string
  showSiderChat?: boolean
  onClose?: () => void
  onExpand?: () => void
}

const ChatIframeLayout = ({
  children,
  className,
  showSiderChat = true,
  onClose,
  onExpand,
}: ChatIframeLayoutProps) => {
  const router = useRouter()
  const { sessionId } = useUserSession()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const storedCollapsed = localStorage.getItem("chat-iframe-sider-collapsed") === "true"
      return storedCollapsed
    }
    return false
  })

  const handleCollapsed = (value?: boolean) => {
    if (typeof window !== "undefined") {
      const newValue = value ?? !collapsed
      setCollapsed(newValue)
      localStorage.setItem("chat-iframe-sider-collapsed", newValue.toString())
    }
  }

  const { mutateAsync: deleteConversation } = useDeleteConversation()
  const { mutateAsync: deleteManyMessages } = useDeleteManyMessage()

  const handleDelete = async (id: string) => {
    if (!id) return
    const realId = id.split("-")[1]
    setIsDeleting(true)
    try {
      await deleteManyMessages({ where: { conversationId: realId } })
      await deleteConversation({ where: { id: realId } })
      message.success("Đã xóa cuộc trò chuyện")
      router.push("/tro-ly-ao")
    } catch (error) {
      console.error(error)
      message.error("Đã xảy ra lỗi, vui lòng thử lại sau")
    } finally {
      setIsDeleting(false)
    }
  }

  // Initialize responsive collapse on mount and handle resize
  useEffect(() => {
    if (typeof window === "undefined") return

    let resizeTimer: NodeJS.Timeout

    const handleResize = () => {
      setIsResizing(true)
      clearTimeout(resizeTimer)

      const storedCollapsed = localStorage.getItem("chat-iframe-sider-collapsed") === "true"
      setCollapsed((prev) => {
        return prev !== storedCollapsed ? storedCollapsed : prev
      })

      resizeTimer = setTimeout(() => {
        setIsResizing(false)
      }, 100)
    }

    handleResize()
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      clearTimeout(resizeTimer)
    }
  }, [])

  const { data: conversation } = useFindManyConversation({
    where: {
      sessionId: sessionId || "",
    },
    include: {
      message: true,
    },
  })

  const conversationMenuList: ConversationDataFromAPI = (conversation || []).map((item) => ({
    id: item.id,
    label: item.message?.[0]?.content || "Đang tải...",
  }))

  return (
    <Layout className="h-screen">
      <Layout className="overflow-hidden flex flex-col">
        <ChatIframeHeader
          collapsed={collapsed}
          onCollapse={handleCollapsed}
          showCollapseButton={showSiderChat}
          onClose={onClose}
          onExpand={onExpand}
        />
        <Layout className="flex-1 relative">
          {/* Backdrop overlay when sider is open */}
          {showSiderChat && !collapsed && (
            <div
              className="absolute inset-0 bg-black/50 z-40 transition-opacity duration-300"
              onClick={() => handleCollapsed(true)}
            />
          )}

          {/* Sider - responsive behavior */}
          {showSiderChat && (
            <div
              className={`
                                h-full absolute left-0 top-0 bottom-0 z-50 w-[290px]
                                ${!collapsed ? "translate-x-0" : "-translate-x-full"}
                                ${isResizing ? "" : "transition-transform duration-300 ease-in-out"}
                            `}
            >
              <SiderChatLayout
                items={generateMenusTroLyAo(conversationMenuList)}
                theme={"light"}
                onDelete={handleDelete}
              />
            </div>
          )}
          <Content className={cn("flex-1 bg-white relative overflow-hidden", className)}>
            {isDeleting && (
              <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                <Spin size="large" tip="Đang xoá..." />
              </div>
            )}
            {children}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  )
}

export default ChatIframeLayout
