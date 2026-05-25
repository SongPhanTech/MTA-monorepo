import { createRoute, OpenAPIHono } from "@hono/zod-openapi"
import { prisma } from ".."
import { FailedResponseSchema } from "../dto/base"
import {
  type SpecializedInfo,
  SpecializedRequest,
  SpecializedResponse,
} from "../dto/specialized.dto"

const app: OpenAPIHono = new OpenAPIHono({ strict: false })

const getSpecialized = createRoute({
  operationId: "getSpecialized",
  path: "/get-specialized",
  tags: ["Ngành đào tạo"],
  summary: "2.13 2.14. Lấy thông tin phân ngành, chuyên ngành đào tạo",
  description: `Danh sách ngành/chuyên ngành và phiên bản chương trình đào tạo.

**Bảng dữ liệu nguồn:** CurriculumVersion, Curriculum, TrainingMajor, FixedClass, TrainingCourse.

**Tham số:** key_word (tên ngành), specialized_code (mã ngành).`,
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: SpecializedRequest,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Thành công",
      content: {
        "application/json": {
          schema: SpecializedResponse,
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

app.openapi(getSpecialized, async (c) => {
  const { key_word, specialized_code } = c.req.valid("json")

  const curriculumVersions = await prisma.curriculumVersion.findMany({
    where: {
      ...(key_word
        ? {
            curriculum: {
              trainingMajor: {
                name: {
                  contains: key_word,
                  mode: "insensitive",
                },
              },
            },
          }
        : {}),
      ...(specialized_code
        ? {
            curriculum: {
              trainingMajor: {
                code: specialized_code,
              },
            },
          }
        : {}),
      deletedAt: null,
      active: true,
    },
    include: {
      curriculum: {
        include: {
          trainingMajor: true,
        },
      },
      fixedClass: {
        select: {
          trainingCourse: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      curriculum: {
        trainingMajor: {
          name: "asc",
        },
      },
    },
  })

  const data: SpecializedInfo[] = curriculumVersions.map((item) => {
    const scholastic = new Set(item.fixedClass ? [item.fixedClass.trainingCourse.name] : [])

    return {
      specialized_code: item.curriculum.trainingMajor.code,
      specialized_name: item.curriculum.trainingMajor.name,
      scholastic: Array.from(scholastic).join(", "),
      specialized_info: item.curriculum.trainingMajor.description,
      program_name: item.name,
      program_code: item.code,
    }
  })

  return c.json(
    {
      result_code: "000" as const,
      result_desc: "success" as const,
      data,
    },
    200
  )
})

export default app
