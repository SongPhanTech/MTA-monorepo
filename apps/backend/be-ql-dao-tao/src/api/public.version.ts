// import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
// import { z } from 'zod'
// import { getVersionApps } from '../services/version.service'
// import { APP_SECRET_MAP } from '../config/mta.config'

// const app = new OpenAPIHono()

// const getVersionRoute = createRoute({
//     operationId: 'getVersion',
//     tags: ['Version'],
//     path: '/:appCode',
//     method: 'get',

//     request: {
//         params: z.object({
//             appCode: z.string(),
//         }),
//     },

//     responses: {
//         200: {
//             description: 'Get version success',
//             content: {
//                 'application/json': {
//                     schema: z.any(),
//                 },
//             },
//         },

//         400: {
//             description: 'Invalid app code',
//             content: {
//                 'application/json': {
//                     schema: z.object({
//                         message: z.string(),
//                     }),
//                 },
//             },
//         },
//     },
// })

// app.openapi(getVersionRoute, async (c) => {
//     const { appCode } = c.req.valid('param')
//     const secret = APP_SECRET_MAP[appCode]
//     if (!secret || !secret.clientId || !secret.secretKey) {
//         return c.json({ message: 'Invalid appCode or missing secret' }, 400)
//     }

//     const data = await getVersionApps(secret.clientId, secret.secretKey)

//     return c.json(data)
// })

// export default app
