import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { prisma } from '..'
import { FailedResponseSchema } from '../dto/base'
import {
    RegistrationSessionRequest,
    RegistrationSessionResponse,
    SESSION_STATUS,
    type SessionInfo,
} from '../dto/registration-session.dto'

const app: OpenAPIHono = new OpenAPIHono({ strict: false })

const getListSessionRegistration = createRoute({
    operationId: 'getListSessionRegistration',
    path: '/get-list-session-registration',
    tags: ['Registration Session'],
    summary: '2.8. Lấy đợt đăng ký học',
    description: '2.8. Lấy đợt đăng ký học',
    method: 'post',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: RegistrationSessionRequest,
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Thành công',
            content: {
                'application/json': {
                    schema: RegistrationSessionResponse,
                },
            },
        },
        400: {
            description: 'Bad request',
            content: {
                'application/json': {
                    schema: FailedResponseSchema,
                },
            },
        },
        404: {
            description: 'Not found',
            content: {
                'application/json': {
                    schema: FailedResponseSchema,
                },
            },
        },
    },
})

app.openapi(getListSessionRegistration, async (c) => {
    const { key_word, session_status } = c.req.valid('json')

    const now = new Date()
    const session_start = await prisma.classRegisterSession.findMany({
        where: {
            ...(key_word
                ? {
                      name: {
                          contains: key_word,
                          mode: 'insensitive',
                      },
                  }
                : {}),
            deletedAt: null,
            active: true,

            ...(session_status === SESSION_STATUS.OPENING
                ? {
                      startDate: { lte: now },
                      endDate: { gte: now },
                  }
                : {}),

            ...(session_status === SESSION_STATUS.CLOSED
                ? {
                      OR: [
                          {
                              startDate: { gte: now },
                          },
                          {
                              endDate: { lte: now },
                          },
                      ],
                  }
                : {}),
        },
    })

    const data: SessionInfo[] = session_start.map((session) => {
        const session_status = session.startDate <= now && now <= session.endDate ? '1' : '2'
        return {
            session_code: session.code,
            session_name: session.name,
            session_start: session.startDate,
            session_end: session.endDate,
            session_status,
        }
    })

    return c.json(
        {
            result_code: '000' as const,
            result_desc: 'success' as const,
            data,
        },
        200
    )
})

export default app
