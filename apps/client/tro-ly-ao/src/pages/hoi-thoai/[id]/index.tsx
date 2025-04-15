import ChatLayout from '@layouts/chat-layout'
import { useRouter } from 'next/router'
import type React from 'react'

export default function Page() {
    const router = useRouter()
    const { id } = router.query
    return (
        <div>Cuộc hội thoại {id}</div>
    )
}
Page.getLayout = function getLayout(page: React.ReactElement) {
    return <ChatLayout>{page}</ChatLayout>
}
