// lib/axios-instance.ts
import { env } from '@/env'
import axios from 'axios'

const axiosInstanceChatbot = axios.create({
    baseURL: `${env.NEXT_PUBLIC_CHAT_BOT_URL}`,
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
    },
    timeout: 5000,
})

export { axiosInstanceChatbot }
