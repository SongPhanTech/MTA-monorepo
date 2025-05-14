// lib/axios-instance.ts
import axios from 'axios'

const axiosInstance = axios.create({
    baseURL: 'http://117.4.240.104:8011',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
    },
    timeout: 5000,
})

export default axiosInstance