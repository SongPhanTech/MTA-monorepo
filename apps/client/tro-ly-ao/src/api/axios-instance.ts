// lib/axios-instance.ts

import { getRuntimeEnv } from "@workspace/libs/utils"
import axios from "axios"

const axiosInstanceChatbot = axios.create({
  baseURL: getRuntimeEnv("NEXT_PUBLIC_CHAT_BOT_URL"),
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
  timeout: 60000,
})

export { axiosInstanceChatbot }
