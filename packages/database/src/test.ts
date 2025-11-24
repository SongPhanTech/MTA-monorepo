import { PrismaClient } from '../generated/prisma-client'
import dayjs from 'dayjs'

import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

dayjs.tz.setDefault('Asia/Ho_Chi_Minh')

const date = dayjs('2025-01-01T17:00:00Z')

console.log(date.format('DD/MM/YYYY'))
