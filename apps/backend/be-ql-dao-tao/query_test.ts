import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function test() {
  try {
    const fixedClassId = undefined
    const trainingCourseId = "test"
    const res =
      await prisma.$queryRaw`SELECT ${fixedClassId}::TEXT IS NULL as is_null, ${trainingCourseId}::TEXT as course_id`
    console.log(res)
  } catch (e: any) {
    console.error(e.message)
  }
  process.exit(0)
}

test()
