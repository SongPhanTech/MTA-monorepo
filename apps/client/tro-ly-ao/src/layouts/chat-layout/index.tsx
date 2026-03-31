import ChatHeader from "@components/layouts/header/chat-header"
import SiderChatLayout from "@components/layouts/sider/chat-sider"
import ChatIframeLayout from "@layouts/chat-iframe-layout"
import { cn } from "@lib/utils"
import ability from "@workspace/permissions/ability"
import { usePermissions } from "@workspace/permissions/hooks"
import {
  useDeleteConversation,
  useDeleteManyCitationMessage,
  useDeleteManyMessage,
  useFindManyConversation,
} from "@workspace/db/hooks"
import { Layout, message, Spin } from "antd"
import { useRouter } from "next/router"
import { type ReactNode, useEffect, useState } from "react"
import { useSSOSession } from "@/hooks/useSSOSession"
import { useUserSession } from "@/hooks/useUserSession"
import type { ConversationDataFromAPI } from "@/navigations/sider-tro-ly-ao"
import { generateMenusTroLyAo } from "@/navigations/sider-tro-ly-ao"

const { Content } = Layout

const ChatLayout = ({
  children,
  className,
  showSiderChat = true,
}: {
  children: ReactNode
  className?: string
  showSiderChat?: boolean
}) => {
  const router = useRouter()
  const { sessionId } = useUserSession()
  const { isAuthenticated: isSSOAuthenticated, signIn, session: ssoSession } = useSSOSession()
  const permissions = usePermissions()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isInIframe, setIsInIframe] = useState(false)
  const [isResizing, setIsResizing] = useState(false)

  // Load permissions vào ability để ChatHeader có thể check quyền
  useEffect(() => {
    if (!permissions.length) return
    ability.update(
      permissions.map((permission) => ({
        action: String(permission.permission),
        subject: permission.name,
      }))
    )
  }, [permissions])
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const isMobile = window.innerWidth < 768
      const storedCollapsed = localStorage.getItem("chat-sider-collapsed") === "true"
      return isMobile ? true : storedCollapsed
    }
    return false
  })

  // Check if running in iframe
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsInIframe(window.self !== window.top)
    }
  }, [])

  const handleCollapsed = (value?: boolean) => {
    if (typeof window !== "undefined") {
      const newValue = value ?? !collapsed
      setCollapsed(newValue)
      if (window.innerWidth >= 768) {
        localStorage.setItem("chat-sider-collapsed", newValue.toString())
      }
    }
  }
  const { mutateAsync: deleteConversation } = useDeleteConversation()
  const { mutateAsync: deleteManyMessages } = useDeleteManyMessage()
  const { mutateAsync: deleteManyCitations } = useDeleteManyCitationMessage()

  const handleDelete = async (id: string) => {
    if (!id) return
    const realId = id.split("-")[1]
    setIsDeleting(true)
    try {
      // Delete citations first (they reference messages)
      await deleteManyCitations({
        where: {
          message: {
            conversationId: realId,
          },
        },
      })
      // Then delete messages
      await deleteManyMessages({ where: { conversationId: realId } })
      // Finally delete conversation
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
      // Disable transitions during resize
      setIsResizing(true)
      clearTimeout(resizeTimer)

      const isMobile = window.innerWidth < 768
      if (isMobile) {
        setCollapsed((prev) => {
          // Only update if not already collapsed to avoid unnecessary animation
          return prev ? prev : true
        })
      } else {
        // On desktop, restore from localStorage or default to open
        const storedCollapsed = localStorage.getItem("chat-sider-collapsed") === "true"
        setCollapsed((prev) => {
          // Only update if different from current state
          return prev !== storedCollapsed ? storedCollapsed : prev
        })
      }

      // Re-enable transitions after resize is done
      resizeTimer = setTimeout(() => {
        setIsResizing(false)
      }, 100)
    }

    // Set initial state
    handleResize()

    // Add resize listener
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      clearTimeout(resizeTimer)
    }
  }, [])

  // Build where clause based on authentication status
  const conversationWhereClause =
    isSSOAuthenticated && ssoSession?.userId
      ? { userId: ssoSession.userId } // Logged in SSO user - filter by userId
      : { sessionId: sessionId || "" } // Guest user - filter by sessionId

  const { data: conversation } = useFindManyConversation({
    where: conversationWhereClause,
    include: {
      message: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })
  const conversationMenuList: ConversationDataFromAPI = (conversation || []).map((item) => ({
    id: item.id,
    label: item.message?.[0]?.content || "Đang tải...",
  }))

  // Iframe handlers
  const handleIframeClose = () => {
    console.log("handleIframeClose called in ChatLayout")
    if (typeof window !== "undefined" && window.parent) {
      console.log("Sending TOGGLE_CHAT_WIDGET message to parent")
      window.parent.postMessage({ type: "TOGGLE_CHAT_WIDGET" }, "*")
    } else {
      console.log("window.parent not available")
    }
  }

  const handleIframeExpand = () => {
    if (typeof window !== "undefined" && window.parent) {
      window.parent.postMessage({ type: "EXPAND_CHAT" }, "*")
    }
  }

  // If in iframe, use ChatIframeLayout
  if (isInIframe) {
    return (
      <ChatIframeLayout
        className={className}
        showSiderChat={showSiderChat}
        onClose={handleIframeClose}
        onExpand={handleIframeExpand}
      >
        {isDeleting && (
          <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <Spin size="large" tip="Đang xoá..." />
          </div>
        )}
        {children}
      </ChatIframeLayout>
    )
  }

  return (
    <Layout className="h-screen p-[10px]">
      <Layout className="overflow-hidden flex flex-col">
        <ChatHeader
          collapsed={collapsed}
          onCollapse={handleCollapsed}
          showCollapseButton={showSiderChat}
          isSSOAuthenticated={isSSOAuthenticated}
          onSignIn={signIn}
        />
        <Layout className="flex-1 relative">
          {/* Backdrop overlay for mobile when sider is open */}
          {showSiderChat && !collapsed && (
            <div
              className="md:hidden absolute inset-0 bg-black/50 z-40 transition-opacity duration-300"
              onClick={() => handleCollapsed(true)}
            />
          )}

          {/* Sider - responsive behavior */}
          {showSiderChat && (
            <div
              className={`
                                h-full
                                ${
                                  !collapsed
                                    ? "md:w-[290px] md:opacity-100 md:relative"
                                    : "md:w-0 md:opacity-0"
                                }
                                ${isResizing ? "" : "md:transition-all md:duration-300 md:ease-in-out"}
                                md:overflow-hidden
                                max-md:absolute max-md:left-0 max-md:top-0 max-md:bottom-0 max-md:z-50 max-md:w-[290px]
                                ${!collapsed ? "max-md:translate-x-0" : "max-md:-translate-x-full"}
                                ${isResizing ? "" : "max-md:transition-transform max-md:duration-300 max-md:ease-in-out"}
                            `}
            >
              <SiderChatLayout
                items={generateMenusTroLyAo(conversationMenuList)}
                theme={"light"}
                onDelete={handleDelete}
              />
            </div>
          )}
          <Content
            className={cn(
              "flex-1 p-[10px] bg-white rounded-xl relative overflow-hidden",
              className
            )}
          >
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

export default ChatLayout
