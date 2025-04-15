import ChatLayout from '@layouts/chat-layout'
import React from 'react'

export default function Page() {
    return (
        <div>Tro li ao</div>
    )
}
Page.getLayout = function getLayout(page: React.ReactElement) {
    return <ChatLayout>{page}</ChatLayout>
}
