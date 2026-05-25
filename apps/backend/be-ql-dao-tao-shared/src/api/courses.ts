import { createRoute, OpenAPIHono } from "@hono/zod-openapi"
import { prisma } from ".."
import { ErrorCode, FailedResponseSchema } from "../dto/base"
import {
  type ClassDetails,
  CoursesDetailRequest,
  CoursesDetailResponse,
  EXAM_TYPE,
  OpenCourseResponse,
  OpenCoursesRequest,
  TYPE_PROGRAM,
  TYPE_REGISTRABLE,
} from "../dto/course.dto"

const app: OpenAPIHono = new OpenAPIHono({ strict: false })

const getOpenCourses = createRoute({
  operationId: "get-open-courses",
  path: "/registration/open-courses",
  tags: ["Lớp học phần"],
  summary: "2.1. Học phần mở đăng ký tín chỉ",
  description: `Danh sách lớp học phần sinh viên có thể đăng ký trong đợt đang mở.

**Bảng dữ liệu nguồn:** Student, FixedClass, ClassRegisterSession, SubjectVersion, SubjectClass, SubjectClassTime, CurriculumVersion, ClassRegisterLogs.

**Tham số chính:** students_code (bắt buộc), session_code, program_code, type_program, key_word, type.`,
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: OpenCoursesRequest,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Thành công",
      content: {
        "application/json": {
          schema: OpenCourseResponse,
        },
      },
    },
    400: {
      description: "Bad request",
      content: {
        "application/json": {
          schema: FailedResponseSchema,
        },
      },
    },
    404: {
      description: "Not found",
      content: {
        "application/json": {
          schema: FailedResponseSchema,
        },
      },
    },
  },
})

app.openapi(getOpenCourses, async (c) => {
  const { students_code, key_word, program_code, session_code, type_program, type } =
    c.req.valid("json")
  const student = await prisma.student.findUnique({
    where: {
      code: students_code,
    },
    include: {
      fixedClass: {
        include: {
          trainingCourse: true,
        },
      },
    },
  })

  if (!student) {
    return c.json(
      { result_code: ErrorCode.STUDENT_NOT_FOUND, result_desc: "sinh viên không tồn tại" },
      404
    )
  }

  if (!student?.fixedClass) {
    return c.json(
      { result_code: ErrorCode.STUDENT_NO_CLASS, result_desc: "sinh viên không có lớp" },
      404
    )
  }

  const now = new Date()
  const registerSession = await prisma.classRegisterSession.findMany({
    where: {
      ...(session_code ? { code: session_code } : {}),
      startDate: { lte: now },
      endDate: { gte: now },
      trainingCourses: {
        some: { id: student.fixedClass.trainingCourseId },
      },
    },
  })

  if (!registerSession.length) {
    return c.json(
      {
        result_code: ErrorCode.SESSION_NOT_FOUND,
        result_desc: "không có đợt đăng ký",
      },
      404
    )
  }

  const curriculumVersionId = student.curriculumVersionId || student.fixedClass.curriculumVersionId

  const curriculumVersion = program_code
    ? await prisma.curriculumVersion.findFirst({
        where: { code: program_code },
        include: {
          trainingBlocks: { include: { subjects: { include: { subject: true } } } },
        },
      })
    : curriculumVersionId
      ? await prisma.curriculumVersion.findFirst({
          where: { id: curriculumVersionId },
          include: {
            trainingBlocks: { include: { subjects: { include: { subject: true } } } },
          },
        })
      : null

  if ((program_code || type_program === TYPE_PROGRAM.IN_CURRICULUM) && !curriculumVersion) {
    return c.json(
      {
        result_code: ErrorCode.CURRICULUM_NOT_FOUND,
        result_desc: "chương trình đào tạo không tồn tại",
      },
      404
    )
  }

  const curriculumSubjects = curriculumVersion?.trainingBlocks.flatMap((block) => block.subjects)

  const sessions = await Promise.all(
    registerSession.map(async (s) => {
      const subjectVersions = await prisma.subjectVersion.findMany({
        where: {
          ...(key_word ? { name: { contains: key_word, mode: "insensitive" } } : {}),
          ...(type_program === TYPE_PROGRAM.IN_CURRICULUM
            ? { id: { in: curriculumSubjects?.map((item) => item.subjectId) } }
            : {}),
          subjectClass: {
            some: { semesterId: s.semesterId },
          },
          active: true,
          deletedAt: null,
        },

        include: {
          prerequisiteSubject: {
            select: {
              code: true,
              name: true,
            },
          },
          subjectClass: {
            where: {
              active: true,
              deletedAt: null,
              cancelled: false,
              semesterId: { in: registerSession.map((item) => item.semesterId) },
            },
            include: {
              subjectClassTimes: {
                select: {
                  dayOfWeek: true,
                  startPeriod: true,
                  endPeriod: true,
                },
              },
              mainLecturer: {
                select: {
                  userProfile: {
                    select: {
                      fullname: true,
                      level: { select: { sMa: true, sTen: true } },
                      academicRankType: { select: { sMa: true, sTen: true } },
                      academicDegreeType: {
                        select: { sMa: true, sTen: true },
                      },
                    },
                  },
                },
              },
              extraLecturer: {
                select: {
                  userProfile: {
                    select: {
                      fullname: true,
                      level: { select: { sMa: true, sTen: true } },
                      academicRankType: { select: { sMa: true, sTen: true } },
                      academicDegreeType: {
                        select: { sMa: true, sTen: true },
                      },
                    },
                  },
                },
              },
              room: {
                select: {
                  name: true,
                  building: {
                    select: {
                      name: true,
                      trainingLocation: {
                        select: {
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
              _count: {
                select: {
                  classRegisterLogs: true,
                  subjectClassStudent: true,
                },
              },
            },
          },
        },
      })

      return {
        ...s,
        subjectVersions,
      }
    })
  )

  const data: ClassDetails[] = sessions.flatMap((s) => {
    return s.subjectVersions.flatMap((version) => {
      return version.subjectClass
        .filter((subjectClass) => {
          if (type === TYPE_REGISTRABLE.REGISTRABLE) {
            return subjectClass._count.classRegisterLogs < subjectClass.maxStudent
          }
          if (type === TYPE_REGISTRABLE.UN_REGISTRABLE) {
            return subjectClass._count.classRegisterLogs >= subjectClass.maxStudent
          }
          return true
        })
        .map((subjectClass) => {
          const subjectIndex = curriculumSubjects?.findIndex(
            (item) => item.subjectId === version.id
          )

          const mainLecturer =
            subjectClass.mainLecturer &&
            [subjectClass.mainLecturer?.userProfile.fullname].filter(Boolean).join(" ")

          const extraLecturer =
            subjectClass.extraLecturer &&
            [subjectClass.extraLecturer?.userProfile.fullname].filter(Boolean).join(" ")

          const class_time = subjectClass.subjectClassTimes
            .map(
              (t) =>
                `${t.dayOfWeek === 8 ? "CN" : `T${t.dayOfWeek}`}(${t.startPeriod}-${t.endPeriod})`
            )
            .filter((value, index, self) => self.indexOf(value) === index)
            .join(", ")
          return {
            session_code: s.code,
            program_code: program_code ?? curriculumVersion?.code,
            type_program:
              subjectIndex && subjectIndex >= 0
                ? TYPE_PROGRAM.IN_CURRICULUM
                : TYPE_PROGRAM.NOT_IN_CURRICULUM,
            courses_code: version.code,
            courses_name: version.name,
            class_id: subjectClass.id,
            class_students_reg: subjectClass.maxStudent,
            class_students_count: subjectClass._count.classRegisterLogs,
            class_teachers: [mainLecturer, extraLecturer].filter(Boolean).join(", "),
            class_credit_hour: version.credit,
            class_tuition: version.credit * s.tuitionPerCredit,
            class_time,
            class_exam_date: subjectClass.examDate,
          }
        })
    })
  })

  return c.json(
    {
      result_code: "000",
      result_desc: "success" as const,
      data,
    },
    200
  )
})

const getCoursesDetail = createRoute({
  operationId: "get-courses-detail",
  path: "/registration/courses_detail",
  tags: ["Lớp học phần"],
  summary: "2.2. Chi tiết học phần",
  description: `Chi tiết một lớp học phần: phòng, giảng viên, lịch học, danh sách SV đã đăng ký.

**Bảng dữ liệu nguồn:** SubjectClass, Subject, Semester, Room, Building, SubjectClassTime, ClassRegisterLogs.

**Tham số:** class_id — ID lớp học phần.`,
  method: "post",
  request: {
    body: {
      content: { "application/json": { schema: CoursesDetailRequest } },
    },
  },
  responses: {
    200: {
      description: "Thành công",
      content: {
        "application/json": {
          schema: CoursesDetailResponse,
        },
      },
    },
    400: {
      description: "Bad request",
      content: {
        "application/json": {
          schema: FailedResponseSchema,
        },
      },
    },
    404: {
      description: "Not found",
      content: {
        "application/json": {
          schema: FailedResponseSchema,
        },
      },
    },
  },
})

app.openapi(getCoursesDetail, async (c) => {
  const { class_id } = c.req.valid("json")

  const subjectClass = await prisma.subjectClass.findUnique({
    where: { id: class_id, deletedAt: null, cancelled: false },
    include: {
      subject: true,
      semester: true,
      room: {
        include: {
          building: true,
        },
      },
      mainLecturer: {
        select: {
          userProfile: {
            select: {
              fullname: true,
              level: { select: { sMa: true, sTen: true } },
              academicRankType: { select: { sMa: true, sTen: true } },
              academicDegreeType: {
                select: { sMa: true, sTen: true },
              },
            },
          },
        },
      },
      extraLecturer: {
        select: {
          userProfile: {
            select: {
              fullname: true,
              level: { select: { sMa: true, sTen: true } },
              academicRankType: { select: { sMa: true, sTen: true } },
              academicDegreeType: {
                select: { sMa: true, sTen: true },
              },
            },
          },
        },
      },
      classRegisterLogs: {
        select: {
          studentId: true,
        },
      },
      subjectClassTimes: true,
      classSchedules: true,
      subjectClassStudent: {
        include: {
          student: {
            include: {
              userProfile: true,
            },
          },
        },
      },
    },
  })

  if (!subjectClass) {
    return c.json(
      {
        result_code: ErrorCode.CLASS_NOT_FOUND,
        result_desc: "Lớp học không tồn tại",
      },
      404
    )
  }

  const class_classroom = [subjectClass.room?.building?.name, subjectClass.room?.name]
    .filter(Boolean)
    .join(" - ")

  const mainLecturer =
    subjectClass.mainLecturer &&
    [
      subjectClass.mainLecturer?.userProfile.academicRankType?.sMa,
      subjectClass.mainLecturer?.userProfile.academicDegreeType?.sMa,
      subjectClass.mainLecturer?.userProfile.fullname,
    ]
      .filter(Boolean)
      .join(" ")

  const extraLecturer =
    subjectClass.extraLecturer &&
    [
      subjectClass.extraLecturer?.userProfile.academicRankType?.sMa,
      subjectClass.extraLecturer?.userProfile.academicDegreeType?.sMa,
      subjectClass.extraLecturer?.userProfile.fullname,
    ]
      .filter(Boolean)
      .join(" ")

  const study_schedules = subjectClass.subjectClassTimes.map((t) => ({
    study_date: t.dayOfWeek.toString(),
    study_period_start: t.startPeriod,
    study_period_end: t.endPeriod,
  }))

  const students_list = subjectClass.classRegisterLogs.map((s) => s.studentId)

  const response = {
    class_terms: subjectClass.semester.name,
    courses_code: subjectClass.subject.code,
    courses_name: subjectClass.subject.name,
    class_id: subjectClass.id,
    class_classroom,
    exam_type: subjectClass.examType && EXAM_TYPE[subjectClass.examType],
    teacher_1: mainLecturer,
    teacher_2: extraLecturer,
    study_schedules,
    students_list,
  }

  return c.json(
    {
      result_code: "000",
      result_desc: "success" as const,
      ...response,
    },
    200
  )
})

export default app
