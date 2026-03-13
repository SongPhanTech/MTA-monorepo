import { OpenAPIHono } from '@hono/zod-openapi'
import { jwtAuth } from '@workspace/auth/hono'
import { enhance, Prisma, PrismaClient } from '@workspace/db'
import { createHonoHandler } from '@workspace/db/hono'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import type { Context } from 'hono'
import { contextStorage } from 'hono/context-storage'
import { cors } from 'hono/cors'
import { showRoutes } from 'hono/dev'
import { HTTPException } from 'hono/http-exception'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import ArchivedScoreApp from './api/archived-score'
import CurriculumApp from './api/curriculum'
import CurriculumSubjectApp from './api/curriculum-subject'
import DiplomaVerificationApp from './api/diploma-verification'
import ExamApp from './api/exam'
import ExamScoreApp from './api/exam-score'
import ExportStudentSemesterResultApp from './api/export-student-result'
import ExportStudentYearResultApp from './api/export-student-year-result'
import FixedClassApp from './api/fixed-class'
import GraduationApp from './api/graduation'
import ImportApp from './api/import'
import InternshipApp from './api/internship'
import LecturerApp from './api/lecturer'
import PlanTraining from './api/plan-training'
import RoomApp from './api/room'
import ScoreCorrectionApp from './api/score-correction'
import Stats from './api/stats'
import StudentApp from './api/student'
import SubjectClassApp from './api/subject-class'
import TrainingFieldApp from './api/training-field'
import TrainingScoreApp from './api/training-score'
import UserProfileApp from './api/user-profile'
import { checkIp } from './middlewares/check-ip'
import { setupOpenApi } from './utils/openapi'

dayjs.extend(utc)
dayjs.extend(timezone)

dayjs.tz.setDefault('Asia/Ho_Chi_Minh')

export const prisma: PrismaClient = new PrismaClient()

const app = new OpenAPIHono({ strict: false })

const originEnv = process.env.ORIGIN || ''
const originList = originEnv.split(',').map((item) => item.trim())

app.use(
    '*',
    cors({
        origin: [
            'http://localhost:3000',
            'https://user.mta.swantech.vn',
            'https://mta.swantech.vn',
            'https://daotao.mta.swantech.vn',
            'https://am.swantech.vn',
            'https://api.am.swantech.vn',
            'https://*.swantech.vn',
            ...originList,
            '*',
        ],
        credentials: true,
    })
)

const config = {
    keycloak: {
        url: process.env.KEYCLOAK_URL || 'http://localhost:8080',
        realm: process.env.KEYCLOAK_REALM || 'swantech',
        clientId: process.env.KEYCLOAK_CLIENT_ID || 'fe-test-local',
    },
}
app.use(contextStorage())
// app.use(tracingMiddleware)
app.use('*', checkIp)

const issuer = `${config.keycloak.url}/realms/${config.keycloak.realm}`
const jwksUri = `${issuer}/protocol/openid-connect/certs`
const audience = config.keycloak.clientId
app.route('/api/training-field', TrainingFieldApp)
app.route('/api/room', RoomApp)
// TODO!: remove `/check`
app.use('/api/*', jwtAuth('lms'))

setupOpenApi(app)

app.route('/api/user-profile', UserProfileApp)
app.route('/api/fixed-class', FixedClassApp)
app.route('/api/subject-class', SubjectClassApp)
app.route('/api/student', StudentApp)
app.route('/api/lecturer', LecturerApp)
app.route('/api/diploma-verification', DiplomaVerificationApp)
app.route('/api/training-score', TrainingScoreApp)
app.route('/api/curriculum', CurriculumApp)
app.route('/api/curriculum-subject', CurriculumSubjectApp)
app.route('/api/graduation', GraduationApp)
app.route('/api/internship', InternshipApp)
app.route('/api/plan-training', PlanTraining)
app.route('/api/stats', Stats)
app.route('/api/import', ImportApp)
app.route('/api/score-correction', ScoreCorrectionApp)
app.route('/api/archived-score', ArchivedScoreApp)
app.route('/api/exam', ExamApp)
app.route('/api/exam-score', ExamScoreApp)
app.route('/api/student-result', ExportStudentSemesterResultApp)
app.route('/api/student-result', ExportStudentYearResultApp)

const nv = await prisma.userProfile.findFirstOrThrow()

app.use(
    '/api/model/*',
    createHonoHandler({
        getPrisma: async (ctx: Context) => {
            return enhance(prisma, { user: nv })
            // return enhance(prisma, { user: ctx.get('user') })
        },
    })
)

app.onError((err, c) => {
    if (err instanceof HTTPException) {
        return c.json({ message: err.message }, err.status)
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        let status: ContentfulStatusCode = 500
        if (err.code === 'P2025') status = 404
        if (err.code === 'P2002') status = 409
        if (err.code === 'P2003') status = 400

        if (status === 500) {
            console.log(err)
            return c.json({ message: 'Internal Server Error' }, status)
        }

        return c.json({ message: err.meta?.cause ?? err.message }, status)
    }

    console.log(err)
    return c.json({ message: err.message }, 500)
})

showRoutes(app, { verbose: true })

export default {
    timeout: 30,
    fetch: app.fetch,
    hostname: '0.0.0.0',
    port: process.env.PORT || 3000,
}

process.on('SIGINT', () => {
    process.exit()
})
