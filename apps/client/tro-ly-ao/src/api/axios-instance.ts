// lib/axios-instance.ts

import axios from 'axios'
import { env } from '@/env'

const axiosInstanceChatbot = axios.create({
    baseURL: `${env.NEXT_PUBLIC_CHAT_BOT_URL}`,
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
    },
    timeout: 60000,
})

export { axiosInstanceChatbot }
