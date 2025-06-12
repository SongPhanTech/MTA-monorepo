// lib/axios-instance.ts
import { env } from '@/env'
import axios from 'axios'

const axiosInstance = axios.create({
    baseURL: `${env.NEXT_PUBLIC_TRO_LY_AO_URL}:8011`,
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
    },
    timeout: 5000,
})

export default axiosInstance
