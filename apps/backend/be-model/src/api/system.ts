import { OpenAPIHono } from '@hono/zod-openapi'
import { proxy } from 'hono/proxy'

const app = new OpenAPIHono({ strict: false })

app.all('/:appcode/:path', async (c) => {
    const appCode = c.req.param('appcode')
    const clientId = (() => {
        switch (appCode) {
            case 'lms':
                return process.env.OIDC_CLIENT_ID_LMS || ''
            case 'ems':
                return process.env.OIDC_CLIENT_ID_LMS || ''
            case 'hrm':
                return process.env.OIDC_CLIENT_ID_HRM || ''
            case 'portal':
                return process.env.OIDC_CLIENT_ID_PORTAL || ''
            case 'chatbot':
                return process.env.OIDC_CLIENT_ID_CHATBOT || ''
            default:
                return process.env.OIDC_CLIENT_ID || ''
        }
    })()
    const clientSecret = (() => {
        switch (appCode) {
            case 'lms':
                return process.env.OIDC_CLIENT_SECRET_LMS || ''
            case 'ems':
                return process.env.OIDC_CLIENT_SECRET_LMS || ''
            case 'hrm':
                return process.env.OIDC_CLIENT_SECRET_HRM || ''
            case 'portal':
                return process.env.OIDC_CLIENT_SECRET_PORTAL || ''
            case 'chatbot':
                return process.env.OIDC_CLIENT_SECRET_CHATBOT || ''
            default:
                return process.env.OIDC_CLIENT_SECRET || ''
        }
    })()
    const res = await proxy(
        new URL(`${c.req.param('path')}`, 'https://mta.swantech.vn/api/system/public/'),
        {
            headers: {
                ...c.req.header(), // optional, specify only when forwarding all the request data (including credentials) is necessary.
                'x-clientid': clientId,
                'x-clientsecret': clientSecret,
            },
        }
    )
    return res
})

export default app
