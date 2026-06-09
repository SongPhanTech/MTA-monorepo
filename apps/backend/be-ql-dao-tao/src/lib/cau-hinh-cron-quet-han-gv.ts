import {
  DEFAULT_LECTURER_DEADLINE_CRON_SCHEDULE,
  type LecturerDeadlineCronSchedule,
  parseLecturerDeadlineCronSchedule,
} from "@workspace/constant"
import { ConfigKey, type PrismaClient } from "@workspace/db"

export async function layCauHinhCronQuetHanGv(
  prisma: PrismaClient
): Promise<LecturerDeadlineCronSchedule> {
  const row = await prisma.config.findUnique({
    where: { key: ConfigKey.LECTURER_DEADLINE_CRON_SCHEDULE },
  })

  if (!row?.value) {
    return { ...DEFAULT_LECTURER_DEADLINE_CRON_SCHEDULE }
  }

  return parseLecturerDeadlineCronSchedule(row.value)
}
