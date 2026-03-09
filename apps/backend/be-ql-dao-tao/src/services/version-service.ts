import axios from 'axios'
import { env } from './env'

export const getVersionApps = async (clientId: string, secretKey: string) => {
    const res = await axios.get(`${env.MTA_API_URL}/VersionApps`, {
        headers: {
            'x-clientid': clientId,
            'x-clientsecret': secretKey,
        },
    })

    return res.data
}
