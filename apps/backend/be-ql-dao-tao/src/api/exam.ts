import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { $Enums, createId } from "@workspace/db"
import { prisma } from ".."
import { ErrorMessageResponseSchema, SuccessBooleanResponseSchema } from "../dto/common-response.dto"
import { fieldDesc } from "../dto/openapi-helpers"

const app = new OpenAPIHono({ strict: false })

const createNewExamList = createRoute({
  operationId: "create-exams",
  tags: ["Kỳ thi"],
  path: "",
  method: "post",
  summary: "Lên danh sách thi",
  description: `Tạo kỳ thi / danh sách thi từ các lớp học phần chưa có examId.

**Bảng dữ liệu nguồn:** SubjectClass, Exam, SubjectClassStudent.

**Tham số:** isGroupBySubject, trainingObjectTypeId, semesterId.`,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              isGroupBySubject: z
                .boolean()
                .openapi(fieldDesc("true = gộp nhiều lớp cùng môn vào một kỳ thi.")),
              trainingObjectTypeId: z.string().openapi(fieldDesc("ID hệ đào tạo.")),
              semesterId: z.string().openapi(fieldDesc("ID học kỳ.")),
            })
            .openapi("CreateExamsRequest"),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Lên danh sách thi thành công",
      content: {
        "application/json": {
          schema: SuccessBooleanResponseSchema
            .openapi("CreateExamsResponse"),
        },
      },
    },
    400: {
      description: "Lên danh sách thi thất bại",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema
            .openapi("CreateExamsBadResponse"),
        },
      },
    },
  },
})

app.openapi(createNewExamList, async (c) => {
  const { isGroupBySubject, trainingObjectTypeId, semesterId } = c.req.valid("json")

  const subjectClasses = await prisma.subjectClass.findMany({
    where: {
      trainingObjectTypeId,
      semesterId,
      cancelled: false,
      deletedAt: null,
      // enteredScore: true,
      isLockExamScore: false,
      status: "OFFICIAL",
      active: true,
      type: {
        in: ["NORMAL", "RETAKE", "REEXAM"],
      },
      examId: null,
    },
    select: {
      id: true,
      subjectId: true,
      subjectClassStudent: {
        select: { id: true },
        where: {
          exempted: false,
          withdrew: false,
          examBanned: false,
        },
      },
      roomId: true,
    },
  })

  const mapExamToSubjectClass: Record<string, string> = {}
  const exams = subjectClasses.map(({ id, subjectId, roomId, subjectClassStudent }) => {
    if (!mapExamToSubjectClass[subjectId]) {
      mapExamToSubjectClass[subjectId] = createId()
    }
    const examId = isGroupBySubject ? mapExamToSubjectClass[subjectId] : createId()

    return {
      examId: examId as string,
      subjectClassId: id,
      subjectId: subjectId,
      roomId,
      studentCount: subjectClassStudent.length,
    }
  })

  if (exams.length === 0) {
    return c.json({ success: false, message: "Không có lớp học nào cần lên danh sách thi" }, 400)
  }

  const grouped = Object.groupBy(exams, (exam) => exam.examId)

  const groupedExams = Object.entries(grouped).map(([examId, items]) => ({
    examId,
    subjectId: items?.[0]?.subjectId ?? "",
    classIds: items?.map((i) => i.subjectClassId),
    roomId: items?.[0]?.roomId ?? undefined,
    count: items?.reduce((acc, curr) => acc + curr.studentCount, 0),
  }))

  await prisma.$transaction(async (tx) => {
    for (const { examId, subjectId, roomId, count } of groupedExams) {
      await tx.exam.create({
        data: {
          id: examId,
          subjectVersionId: subjectId,
          semesterId,
          ...(roomId
            ? {
                examRooms: {
                  create: {
                    roomId,
                    capacity: count || 100,
                    examList: {
                      create: {
                        start: 1,
                        end: 1,
                      },
                    },
                  },
                },
              }
            : {}),
        },
      })
    }
    for (const { classIds, examId } of groupedExams) {
      await tx.subjectClass.updateMany({
        where: { id: { in: classIds } },
        data: { examId },
      })
    }
  })

  return c.json({ success: true, message: "Lên danh sách thi thành công" })
})

const createNewReExamList = createRoute({
  operationId: "create-new-re-exam-list",
  tags: ["Kỳ thi"],
  path: "/reexam-list",
  method: "post",
  summary: "Lên danh sách thi lại",
  description: `Tạo danh sách thi lại cho lớp RETAKE/REEXAM.

**Bảng dữ liệu nguồn:** SubjectClass, Exam, StudentSubjectScore.

**Tham số:** trainingObjectTypeId, semesterId.`,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              trainingObjectTypeId: z.string().openapi(fieldDesc("ID hệ đào tạo.")),
              semesterId: z.string().openapi(fieldDesc("ID học kỳ.")),
            })
            .openapi("CreateReExamsRequest"),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Lên danh sách thi lại thành công",
      content: {
        "application/json": {
          schema: SuccessBooleanResponseSchema
            .openapi("CreateExamsResponse"),
        },
      },
    },
    400: {
      description: "Lên danh sách thi lại thất bại",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema
            .openapi("CreateExamsBadResponse"),
        },
      },
    },
  },
})

app.openapi(createNewReExamList, async (c) => {
  const { trainingObjectTypeId, semesterId } = c.req.valid("json")

  const subjects = await prisma.subjectVersion.findMany({
    where: {
      subjectClass: {
        some: {
          trainingObjectTypeId,
          semesterId,
          cancelled: false,
          deletedAt: null,
          // enteredScore: true,
          enteredExamScore: true,
          type: $Enums.SubjectClassType.REEXAM,
        },
      },
    },
    select: {
      subjectClass: {
        select: {
          id: true,
          subjectId: true,
          subjectClassStudent: {
            select: { id: true },
            where: {
              examPostponed: true,
              suspended: true,
            },
          },
        },
        where: {
          // TODO: cần kiểu tra theo yêu cầu
          examId: null,
        },
      },
    },
  })

  const exams = subjects.flatMap(({ subjectClass }) => {
    const id = createId()
    return subjectClass.map((cls) => ({
      examId: id,
      classId: cls.id,
      studentSubjectScoreIds: cls.subjectClassStudent.map((scs) => scs.id),
      subjectId: cls.subjectId,
    }))
  })

  if (exams.length === 0) {
    return c.json(
      { success: false, message: "Không có lớp học nào cần lên danh sách thi lại" },
      400
    )
  }

  const grouped = Object.groupBy(exams, (exam) => exam.examId)

  const groupedExams = Object.entries(grouped).map(([examId, items]) => ({
    examId,
    classIds: items?.map((i) => i.classId),
    studentSubjectScoreIds: items?.flatMap((i) => i.studentSubjectScoreIds),
    subjectId: items?.[0]?.subjectId ?? "",
  }))

  await prisma.$transaction(async (tx) => {
    await tx.exam.createMany({
      data: groupedExams.map(({ examId, subjectId }) => ({
        id: examId,
        subjectVersionId: subjectId,
        semesterId,
      })),
    })

    await tx.$executeRawUnsafe(`
            UPDATE "ql-dao-tao"."SubjectClass" AS c
            SET "examId" = data."examId"
            FROM (
                VALUES
                ${exams.map(({ examId, classId }) => `('${classId}', '${examId}')`).join(",\n")}
            ) AS data("classId", "examId")
            WHERE c."id" = data."classId";
            `)

    await tx.$executeRawUnsafe(`
            UPDATE "ql-dao-tao"."StudentSubjectScore" AS sss
            SET "examId" = data."examId"
            FROM (
                VALUES
                ${exams
                  .flatMap(({ examId, studentSubjectScoreIds }) =>
                    studentSubjectScoreIds.map((id) => `('${id}', '${examId}')`)
                  )
                  .join(",\n")}
            ) AS data("id", "examId")
            WHERE sss."id" = data."id";
            `)
  })

  return c.json({ success: true, message: "Lên danh sách thi lại thành công" })
})

const mergeExam = createRoute({
  operationId: "merge-exam",
  tags: ["Kỳ thi"],
  path: "/merge",
  method: "post",
  summary: "Ghép kỳ thi",
  description: `Gộp nhiều kỳ thi thành một.

**Bảng dữ liệu nguồn:** Exam, SubjectClass.

**Tham số:** examIds — tối thiểu 2 ID kỳ thi.`,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              examIds: z
                .array(z.string())
                .min(2)
                .openapi(fieldDesc("Danh sách ID kỳ thi cần ghép.")),
            })
            .openapi("MergeExamRequest"),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Ghép kỳ thi thành công",
      content: {
        "application/json": {
          schema: SuccessBooleanResponseSchema
            .openapi("MergeExamResponse"),
        },
      },
    },
    400: {
      description: "Ghép kỳ thi thất bại",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema
            .openapi("MergeExamBadResponse"),
        },
      },
    },
  },
})

app.openapi(mergeExam, async (c) => {
  const { examIds } = c.req.valid("json")

  const exams = await prisma.exam.findMany({
    where: { id: { in: examIds } },
    include: {
      subjectClass: {
        where: {
          cancelled: false,
          deletedAt: null,
          status: "OFFICIAL",
        },
        select: {
          id: true,
          examId: true,
          subjectId: true,
          semesterId: true,
        },
      },
      examRooms: true,
    },
  })

  const classes = exams.flatMap((exam) => exam.subjectClass)

  if (classes.length === 0) {
    return c.json({ success: false, message: "Không có lớp học cần ghép" }, 400)
  }

  const subjectVersionIds = [...new Set(classes.map((cls) => cls.subjectId))]
  if (subjectVersionIds.length > 1) {
    return c.json(
      {
        success: false,
        message: "Chỉ có thể ghép các kỳ thi cùng môn học",
      },
      400
    )
  }

  const subjectVersionId = subjectVersionIds[0] as string
  const semesterId = classes[0]?.semesterId as string

  const newExamId = createId()

  const classIds = classes.map((cls) => cls.id)

  await prisma.$transaction(async (tx) => {
    await tx.exam.create({
      data: { id: newExamId, subjectVersionId, semesterId },
    })
    await tx.subjectClass.updateMany({
      where: { id: { in: classIds } },
      data: { examId: newExamId },
    })

    await tx.examPaper.deleteMany({
      where: { examList: { examRoom: { examId: { in: examIds } } } },
    })

    await tx.examList.deleteMany({
      where: { examRoom: { examId: { in: examIds } } },
    })

    await tx.examRoom.deleteMany({
      where: { examId: { in: examIds } },
    })

    await tx.exam.deleteMany({
      where: { id: { in: examIds } },
    })
  })

  return c.json({ success: true, message: "Ghép kỳ thi thành công" })
})

const unmergeExam = createRoute({
  operationId: "unmerge-exam",
  tags: ["Kỳ thi"],
  path: "/unmerge",
  method: "post",
  summary: "Tách kỳ thi",
  description: `Tách kỳ thi đã ghép thành các kỳ thi riêng.

**Bảng dữ liệu nguồn:** Exam, SubjectClass.

**Tham số:** examId — ID kỳ thi đã ghép.`,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              examId: z.string().openapi(fieldDesc("ID kỳ thi cần tách.")),
            })
            .openapi("UnmergeExamRequest"),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Tách kỳ thi thành công",
      content: {
        "application/json": {
          schema: SuccessBooleanResponseSchema
            .openapi("UnmergeExamResponse"),
        },
      },
    },
    400: {
      description: "Tách kỳ thi thất bại",
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema
            .openapi("UnmergeExamBadResponse"),
        },
      },
    },
  },
})

app.openapi(unmergeExam, async (c) => {
  const { examId } = c.req.valid("json")

  const classes = await prisma.subjectClass.findMany({
    where: {
      examId,
      cancelled: false,
      deletedAt: null,
      status: "OFFICIAL",
    },
    select: {
      id: true,
      subjectId: true,
      semesterId: true,
    },
  })

  if (classes.length === 0) {
    return c.json({ success: false, message: "Không có lớp học nào cần tách" }, 400)
  }

  if (classes.length === 1) {
    return c.json({ success: false, message: "Kỳ thi chỉ có 1 lớp, không cần tách" }, 400)
  }

  const subjectVersionId = classes?.[0]?.subjectId as string
  const semesterId = classes?.[0]?.semesterId as string

  const newExams = classes.map((cls) => ({
    examId: createId(),
    classId: cls.id,
  }))

  await prisma.$transaction(async (tx) => {
    await tx.subjectClass.updateMany({
      where: { id: { in: classes.map((c) => c.id) } },
      data: { examId: null },
    })

    await tx.examPaper.deleteMany({
      where: { examList: { examRoom: { examId } } },
    })

    await tx.examList.deleteMany({
      where: { examRoom: { examId } },
    })

    await tx.examRoom.deleteMany({
      where: { examId },
    })

    for (const { examId, classId } of newExams) {
      await tx.exam.create({
        data: {
          id: examId,
          subjectVersionId,
          semesterId,
          subjectClass: {
            connect: { id: classId },
          },
        },
      })
    }
    await tx.exam.delete({
      where: { id: examId },
    })
  })

  return c.json({
    success: true,
    message: "Đã tách kỳ thi thành công",
  })
})

export default app
