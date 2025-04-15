import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import {
    BucketItemDtoSchema,
    ListObjectDtoSchema,
    PresignedUrlDtoSchema,
    UrlDtoSchema,
} from '../dto/minio'
import { MinIOService } from '../services/minio'

const app = new OpenAPIHono({ strict: false })

const minioService = new MinIOService()
await minioService.onModuleInit()

app.openapi(
    createRoute({
        operationId: 'generatePresignedUrl',
        path: '/generate-presigned-url',
        method: 'post',
        request: {
            body: {
                content: {
                    'application/json': { schema: PresignedUrlDtoSchema },
                },
            },
        },
        responses: {
            200: {
                content: { 'application/json': { schema: UrlDtoSchema } },
                description: 'Generate presigned URL',
            },
        },
    }),
    async (c) => {
        const presignedUrlDto = c.req.valid('json')
        const url = await minioService.generatePresignedUrl(presignedUrlDto)
        return c.json(url)
    }
)

app.openapi(
    createRoute({
        operationId: 'listObjects',
        path: '/',
        method: 'get',
        request: {
            query: ListObjectDtoSchema,
        },
        responses: {
            200: {
                content: {
                    'application/json': {
                        schema: z.array(BucketItemDtoSchema),
                    },
                },
                description: 'List objects',
            },
        },
    }),
    async (c) => {
        const listObjectDto = c.req.valid('query')
        const items = await minioService.findAll(listObjectDto)
        return c.json(items, 200)
    }
)

app.openapi(
    createRoute({
        operationId: 'presignedGetObject',
        path: '/presigned-url',
        method: 'get',
        request: {
            query: z
                .object({ objectName: z.string() })
                .openapi('PresignedGetObjectDto'),
        },
        responses: {
            200: {
                content: { 'application/json': { schema: UrlDtoSchema } },
                description: 'Generate presigned URL',
            },
        },
    }),
    async (c) => {
        const { objectName } = c.req.valid('query')
        const url = await minioService.presignedGetObject(objectName)
        return c.json(url, 200)
    }
)

export default app
