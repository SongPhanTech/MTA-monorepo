import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import type { Prisma } from "@workspace/db"
import {
  postDMNhanViens,
  postDMNhanViensList,
  putDMNhanViens,
} from "@workspace/libs/api/system"
import {
  parseSheetGuestLecturer,
  parseSheetHeQuanSu,
  parseSheetInternship,
  parseSheetLecturer,
  parseSheetStudent,
  zParseSheetError,
} from "@workspace/libs/parseExcel"
import { normalizeCatalogName, splitFullName } from "@workspace/libs/utils"
import { prisma } from ".."
import { UploadExcelModel } from "../dto/upload-excel.dto"
import {
  ErrorMessageResponseSchema,
  ImportFailureResponseSchema,
  ImportJobResponseSchema,
} from "../dto/common-response.dto"
import { fieldDesc } from "../dto/openapi-helpers"
import { standardErrorResponses } from "../dto/openapi-route-helpers"
import { formatLsbError, type ErrorExtra } from "../types/error-extra"
import {
  buildCurriculumMapOrThrow,
  curriculumVersionMapKey,
  buildDegreeRankTypeMapOrThrow,
  buildDegreeTypeMapOrThrow,
  buildDMChuyenNganhMap,
  buildDMNganhMap,
  buildDMTruongMap,
  buildEthnicityMapOrThrow,
  buildGenderMapOrThrow,
  buildLecturerTypeMapOrThrow,
  buildNationalityMapOrThrow,
  buildNewProvinceMapOrThrow,
  buildOrgLookupMapOrThrow,
  buildOrgNameMapOrThrow,
  buildPositionMapOrThrow,
  buildRankMapOrThrow,
  curriculumVersionForTrainingObjectTypeWhere,
} from "../utils"

const app = new OpenAPIHono({ strict: false })

const lsbRequestOptions = () => ({
  headers: {
    "x-clientid": process.env.KEYCLOAK_CLIENT_ID_LMS || "",
    "x-clientsecret": process.env.KEYCLOAK_CLIENT_SECRET_LMS || "",
  },
})

const isLsbDuplicate = (extra?: ErrorExtra, raw?: unknown) => {
  if (extra?.code?.toLowerCase() === "duplicate") return true
  const rawText =
    raw && typeof raw === "object" && "message" in raw && typeof raw.message === "string"
      ? raw.message
      : ""
  const text = [extra?.message, extra?.code, rawText].filter(Boolean).join(" ")
  return /đã tồn tại|duplicate/i.test(text)
}

const lsbRowId = (row: Record<string, unknown>) => {
  if (typeof row.Id === "string" && row.Id) return row.Id
  if (typeof row.id === "string" && row.id) return row.id
  return undefined
}

const lsbRows = (data: unknown): Record<string, unknown>[] => {
  if (!data) return []
  if (Array.isArray(data)) return data.flatMap((item) => lsbRows(item))
  if (typeof data !== "object") return []
  const obj = data as Record<string, unknown>
  const lists = [obj.Data, obj.Items, obj.items].filter(Array.isArray) as unknown[][]
  if (Array.isArray(obj.data)) lists.push(obj.data)
  if (lists.length) return lists.flatMap((list) => list.flatMap((item) => lsbRows(item)))
  if ("data" in obj) {
    const nested = lsbRows(obj.data)
    if (nested.length) return nested
  }
  if (lsbRowId(obj)) return [obj]
  return []
}

const extractLsbId = (data: unknown): string | undefined => {
  if (typeof data === "string" && data) return data
  if (data && typeof data === "object" && "data" in data && typeof data.data === "string" && data.data) {
    return data.data
  }
  return lsbRowId(lsbRows(data)[0] ?? {})
}

const studentLsbEmail = (idCardNumber: string) => `${idCardNumber}@gmail.com`

/** LSB bắt buộc SĐT khi tạo DM_NhanVien, trong khi file mẫu không bắt buộc. */
const studentLsbPhone = (
  phoneNumber: string | undefined,
  idCardNumber: string,
  code: string
) => {
  const phone = phoneNumber?.trim()
  if (phone) return phone
  const digits = `${idCardNumber}${code}`.replace(/\D/g, "")
  return `09${digits.slice(-8).padStart(8, "0")}`
}

const parseImportNumber = (value: string | undefined, integer = false): number | null => {
  const text = value?.trim() ?? ""
  if (!text) return null
  const normalized = text.replace(",", ".")
  const parsed = integer ? Number.parseInt(normalized, 10) : Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

type StudentImportMatch = {
  id: string
  deletedAt: Date | null
  fixedClass: { code: string | null; trainingCourseId: string } | null
}

const pickStudentForImport = (
  rows: StudentImportMatch[],
  classCode: string,
  trainingCourseId: string
) => {
  const sameClass = rows.filter((row) => row.fixedClass?.code === classCode)
  const sameCourse = rows.filter((row) => row.fixedClass?.trainingCourseId === trainingCourseId)
  const chosen =
    sameClass.find((row) => !row.deletedAt) ??
    sameCourse.find((row) => !row.deletedAt) ??
    sameClass[0] ??
    sameCourse[0]
  if (chosen) return { student: chosen, otherCourse: false }

  const otherCourse = rows.some(
    (row) =>
      row.fixedClass && row.fixedClass.trainingCourseId !== trainingCourseId && !row.deletedAt
  )
  if (otherCourse) return { student: undefined, otherCourse: true }

  const unassigned = rows.filter((row) => !row.fixedClass)
  return {
    student: unassigned.find((row) => !row.deletedAt) ?? unassigned[0],
    otherCourse: false,
  }
}

const syncStudentHistory = async (
  tx: Prisma.TransactionClient,
  userProfileId: string,
  student: {
    department?: string
    departmentAddress?: string
    position?: string
    universitySchool?: string
    universityMajor?: string
  },
  positionMap: Map<string, string>,
  dmTruong: Map<string, string>,
  dmNganh: Map<string, string>,
  dmChuyenNganh: Map<string, string>
) => {
  if (student.department) {
    const chucVuId = positionMap.get(normalizeCatalogName(student.position))
    const existingWork = await tx.quaTrinhCongTac.findFirst({
      where: { userProfileId, donVi: student.department, deletedAt: null },
      select: { id: true },
    })
    if (existingWork) {
      await tx.quaTrinhCongTac.update({
        where: { id: existingWork.id },
        data: { diaChi: student.departmentAddress, chucVuId },
      })
    } else {
      await tx.quaTrinhCongTac.create({
        data: {
          userProfileId,
          donVi: student.department,
          diaChi: student.departmentAddress,
          chucVuId,
        },
      })
    }
  }

  if (student.universitySchool && student.universityMajor) {
    const tenTruongId = dmTruong.get(student.universitySchool)
    const nganhHocId = dmNganh.get(student.universityMajor)
    if (!tenTruongId || !nganhHocId) {
      throw new Error(
        `Không tìm thấy trường hoặc ngành đại học: ${student.universitySchool} / ${student.universityMajor}`
      )
    }
    const chuyenNganhId = dmChuyenNganh.get(student.universityMajor)
    const existingStudy = await tx.quaTrinhHocTap.findFirst({
      where: { userProfileId, tenTruongId, nganhHocId, deletedAt: null },
      select: { id: true },
    })
    if (existingStudy) {
      await tx.quaTrinhHocTap.update({
        where: { id: existingStudy.id },
        data: { chuyenNganhId },
      })
    } else {
      await tx.quaTrinhHocTap.create({
        data: { userProfileId, tenTruongId, nganhHocId, chuyenNganhId },
      })
    }
  }
}

const findLsbNhanVienId = async (code: string, idCardNumber: string) => {
  const conditions = [
    { field: "sMa", operator: "=", value: code.trim() },
    { field: "sCCCD", operator: "=", value: idCardNumber.trim() },
  ].filter((item) => item.value)
  if (conditions.length === 0) return undefined

  const res = await postDMNhanViensList(
    {
      Filter: JSON.stringify([{ ors: conditions }]),
      Take: 10,
      Skip: 0,
      IsGetTotal: false,
    },
    lsbRequestOptions()
  )
  if (res.status !== 200) return undefined

  const rows = lsbRows(res.data)
  const matched =
    rows.find((row) => String(row.sCCCD ?? "") === idCardNumber.trim()) ??
    rows.find((row) => String(row.sMa ?? "") === code.trim()) ??
    rows[0]
  return matched ? lsbRowId(matched) : undefined
}

const importLecturer = createRoute({
  operationId: "import-lecturer",
  tags: ["Nhập dữ liệu"],
  path: "/import-lecturer",
  method: "post",
  summary: "Import giảng viên Excel",
  description: `Nhập danh sách giảng viên từ file Excel.

**Bảng dữ liệu nguồn:** Lecturer, UserProfile, ManagementOrganization.

**Tham số:** file, timeout (giây, mặc định 30).`,
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: UploadExcelModel.extend({
            timeout: z.coerce
              .number()
              .default(30)
              .openapi(fieldDesc("Timeout transaction (giây).", 30)),
          }),
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Import successfully",
      content: {
        "application/json": {
          schema: ImportJobResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid file type",
      content: {
        "application/json": {
          schema: ImportFailureResponseSchema,
        },
      },
    },
  },
})

app.openapi(importLecturer, async (c) => {
  const { file, timeout } = c.req.valid("form")
  const start = Date.now()

  const buf = await file.arrayBuffer()
  const data = parseSheetLecturer(buf)

  if (data.errors.length) {
    return c.json({ message: "Lỗi khi đọc file", errors: data.errors }, 400)
  }

  const genderMap = await buildGenderMapOrThrow(
    prisma,
    data.lecturers.map(({ gender }) => gender)
  )

  const lecturerTypeMap = await buildLecturerTypeMapOrThrow(
    prisma,
    data.lecturers.map(({ lecturerType }) => lecturerType)
  )

  const degreeTypeMap = await buildDegreeTypeMapOrThrow(
    prisma,
    data.lecturers.map(({ degreeType }) => degreeType)
  )

  const degreeRankTypeMap = await buildDegreeRankTypeMapOrThrow(
    prisma,
    data.lecturers.map(({ degreeRankType }) => degreeRankType)
  )

  const organizationMap = await buildOrgNameMapOrThrow(
    prisma,
    data.lecturers.map(({ departmentOrganization }) => departmentOrganization)
  )

  const existingProfiles = await prisma.userProfile.findMany({
    where: {
      idCardNumber: {
        in: data.lecturers.map((lecturer) => lecturer.idCardNumber),
      },
    },
    select: { id: true, idCardNumber: true },
  })

  const existingProfileMap = new Map(
    existingProfiles.map(({ idCardNumber, id }) => [idCardNumber, id])
  )

  const existingLecturer = await prisma.lecturer.findMany({
    where: { userProfile: { code: { in: data.lecturers.map((lecturer) => lecturer.code) } } },
    select: {
      id: true,
      userProfileId: true,
      userProfile: {
        select: { idCardNumber: true, code: true },
      },
    },
  })

  const existingLecturerMap = new Map(
    existingLecturer.map(({ id, userProfileId, userProfile }) => [
      userProfile.code,
      { id, userProfileId, idCardNumber: userProfile.idCardNumber },
    ])
  )

  const existingLecturerByCCCD = await prisma.lecturer.findMany({
    where: {
      userProfile: {
        idCardNumber: {
          in: data.lecturers.map((lecturer) => lecturer.idCardNumber),
        },
      },
    },
    select: {
      id: true,
      userProfileId: true,
      userProfile: {
        select: { idCardNumber: true, code: true },
      },
    },
  })

  const existingLecturerByCCCDMap = new Map(
    existingLecturerByCCCD
      .filter(({ userProfile }) => userProfile.idCardNumber)
      .map(({ id, userProfileId, userProfile }) => [
        userProfile.idCardNumber,
        { id, code: userProfile.code, userProfileId },
      ])
  )

  // validate duplicate lecturer.code identify by lecturer.userProfile.idCardNumber
  const duplicateCode: string[] = []
  for (const l of data.lecturers) {
    const existingLecturer = existingLecturerMap.get(l.code)
    if (
      existingLecturer &&
      existingLecturer.idCardNumber &&
      existingLecturer.idCardNumber !== l.idCardNumber
    ) {
      duplicateCode.push(l.code)
    }
  }

  if (duplicateCode.length) {
    return c.json({ message: "Mã định danh đã tồn tại", errors: duplicateCode }, 400)
  }
  const cccdCount = new Map<string, string[]>()
  for (const l of data.lecturers) {
    if (!l.idCardNumber) continue
    const codes = cccdCount.get(l.idCardNumber) ?? []
    codes.push(l.code)
    cccdCount.set(l.idCardNumber, codes)
  }
  const duplicateCCCD = [...cccdCount.entries()]
    .filter(([, codes]) => codes.length > 1)
    .map(([cccd, codes]) => `CCCD ${cccd} bị trùng ở mã định danh: ${codes.join(", ")}`)
  if (duplicateCCCD.length) {
    return c.json({ message: "Số CCCD bị trùng trong file Excel", errors: duplicateCCCD }, 400)
  }

  const importErrors: { code: string; name: string; error: string }[] = []

  try {
    await prisma.$transaction(
      async (tx) => {
        for (const lecturer of data.lecturers) {
          const lecturerData: Prisma.LecturerCreateInput = {
            from: new Date(),
            lecturerType: {
              connect: { id: lecturerTypeMap.get(lecturer.lecturerType) },
            },
            userProfile: {},
            description: lecturer.description,
          }

          const profileData: Prisma.UserProfileUncheckedCreateWithoutEducationAndTrainingInput = {
            ...splitFullName(lecturer.fullname),
            code: lecturer.code,
            bLaGiangVien: true,
            bLaCanBoNhanVien: true,
            dateOfBirth: lecturer.dateOfBirth,
            genderId: genderMap.get(lecturer.gender),
            academicDegreeTypeId: degreeTypeMap.get(lecturer.degreeType ?? ""),
            academicRankTypeId: degreeRankTypeMap.get(lecturer.degreeRankType ?? ""),
            currentAddress: lecturer.currentAddress,
            phoneNumber: lecturer.phoneNumber,
            email: lecturer.email,
            idCardNumber: lecturer.idCardNumber,
            sDM_DonViId: organizationMap.get(lecturer.departmentOrganization) ?? null,
          }

          const existingProfileId = existingProfileMap.get(lecturer.idCardNumber)
          try {
            if (existingProfileId) {
              const existing = existingLecturerMap.get(lecturer.code)
              if (existing) {
                const existingLecturerData = await tx.lecturer.findUnique({
                  where: { id: existing.id },
                  include: { userProfile: true },
                })

                if (existingLecturerData) {
                  const validationErrors: string[] = []

                  const existingProfile = existingLecturerData.userProfile
                  if (
                    existingProfile.firstName &&
                    profileData.firstName !== existingProfile.firstName
                  ) {
                    validationErrors.push(
                      `Không được đổi Tên (hiện tại: "${existingProfile.firstName}")`
                    )
                  }
                  if (
                    existingProfile.lastName &&
                    profileData.lastName !== existingProfile.lastName
                  ) {
                    validationErrors.push(
                      `Không được đổi Họ và đệm (hiện tại: "${existingProfile.lastName}")`
                    )
                  }
                  if (
                    existingProfile.phoneNumber &&
                    profileData.phoneNumber !== existingProfile.phoneNumber
                  ) {
                    validationErrors.push(
                      `Không được đổi Số điện thoại (hiện tại: "${existingProfile.phoneNumber}")`
                    )
                  }
                  if (validationErrors.length > 0) {
                    importErrors.push({
                      code: lecturer.code,
                      name: lecturer.fullname,
                      error: validationErrors.join("; "),
                    })
                    continue
                  }
                }
              }

              const payload = {
                Id: existingProfileId,
                sMa: lecturer.code,
                bLaGiangVien: true,
                bLaCanBoNhanVien: true,
                dNgaySinh: lecturer.dateOfBirth
                  ? new Date(lecturer.dateOfBirth)?.toISOString()
                  : null,
                sCCCD: lecturer.idCardNumber,
                sHoVaDem: profileData.lastName,
                sTen: profileData.firstName,
                sTenDayDu: lecturer.fullname,
                sSDTDiDong: lecturer.phoneNumber ?? "",
                sDM_DonViId: organizationMap.get(lecturer.departmentOrganization),
                sEmail: lecturer.email,
                sDM_GioiTinhId: lecturer.gender ? genderMap.get(lecturer.gender) : null,
              }

              const res = await putDMNhanViens(payload, {
                headers: {
                  "x-clientid": process.env.KEYCLOAK_CLIENT_ID_LMS || "",
                  "x-clientsecret": process.env.KEYCLOAK_CLIENT_SECRET_LMS || "",
                },
              })

              if (existing) {
                if (res.status === 200) {
                  await tx.lecturer.update({
                    where: { id: existing.id },
                    data: {
                      ...lecturerData,
                      userProfile: { update: profileData },
                    },
                  })
                } else {
                  const extra = res.data?.extra as ErrorExtra | undefined
                  const errMsg = formatLsbError(extra, `LSB API error: ${res.status}`)
                  importErrors.push({
                    code: lecturer.code,
                    name: lecturer.fullname,
                    error: errMsg,
                  })
                }
              } else {
                const lecturerByCCCD = existingLecturerByCCCDMap.get(lecturer.idCardNumber)

                if (lecturerByCCCD) {
                  importErrors.push({
                    code: lecturer.code,
                    name: lecturer.fullname,
                    error: `CCCD "${lecturer.idCardNumber}" đã liên kết với giảng viên mã "${lecturerByCCCD.code}". Không thể tạo giảng viên mới hoặc đổi mã định danh với CCCD này.`,
                  })
                  continue
                }

                if (res.status === 200) {
                  if (typeof res.data !== "string" || !res.data) {
                    const errMsg = `LSB trả về dữ liệu không hợp lệ (mã định danh: ${lecturer.code})`
                    importErrors.push({
                      code: lecturer.code,
                      name: lecturer.fullname,
                      error: errMsg,
                    })
                  } else {
                    await tx.lecturer.create({
                      data: {
                        ...lecturerData,
                        userProfile: {
                          connectOrCreate: {
                            where: {
                              idCardNumber: lecturer.idCardNumber,
                            },
                            create: { id: res.data, ...profileData },
                          },
                        },
                      },
                    })
                  }
                } else {
                  const extra = res.data?.extra as ErrorExtra | undefined
                  const errMsg = formatLsbError(extra, `LSB API error: ${res.status}`)
                  importErrors.push({
                    code: lecturer.code,
                    name: lecturer.fullname,
                    error: errMsg,
                  })
                }
              }
            } else {
              // const profileId = crypto.randomUUID()
              const payload = {
                // Id: profileId,
                sMa: lecturer.idCardNumber,
                bLaGiangVien: true,
                bLaCanBoNhanVien: true,
                bLaTaiKhoan: true,
                dNgaySinh: lecturer.dateOfBirth
                  ? new Date(lecturer.dateOfBirth)?.toISOString()
                  : null,
                sCCCD: lecturer.idCardNumber,
                sHoVaDem: profileData.lastName,
                sTen: profileData.firstName,
                sTenDayDu: lecturer.fullname,
                sSDTDiDong: lecturer.phoneNumber ?? "",
                sDM_DonViId: organizationMap.get(lecturer.departmentOrganization),
                sEmail: lecturer.email,
                sDM_GioiTinhId: lecturer.gender ? genderMap.get(lecturer.gender) : null,
              }

              const res = await postDMNhanViens(payload, {
                headers: {
                  "x-clientid": process.env.KEYCLOAK_CLIENT_ID_LMS || "",
                  "x-clientsecret": process.env.KEYCLOAK_CLIENT_SECRET_LMS || "",
                },
              })

              if (res.status === 200) {
                // Validate res.data is a string ID before using it
                if (typeof res.data !== "string" || !res.data) {
                  const errMsg = `LSB trả về dữ liệu không hợp lệ (mã định danh: ${lecturer.code})`
                  importErrors.push({
                    code: lecturer.code,
                    name: lecturer.fullname,
                    error: errMsg,
                  })
                } else {
                  await tx.lecturer.create({
                    data: {
                      ...lecturerData,
                      userProfile: {
                        connectOrCreate: {
                          where: {
                            id: res.data,
                            // idCardNumber: lecturer.idCardNumber,
                          },
                          create: { id: res.data, ...profileData },
                        },
                      },
                    },
                  })
                }
              } else {
                const extra = res.data?.extra as ErrorExtra | undefined
                const errMsg = formatLsbError(extra, `LSB API error: ${res.status}`)
                importErrors.push({
                  code: lecturer.code,
                  name: lecturer.fullname,
                  error: errMsg,
                })
              }
            }
          } catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error)
            importErrors.push({
              code: lecturer.code,
              name: lecturer.fullname,
              error: errMsg,
            })
          }
        }

        // Nếu có lỗi, throw để rollback transaction
        if (importErrors.length > 0) {
          throw new Error(JSON.stringify(importErrors))
        }
      },
      { timeout: timeout * 1000 }
    )
  } catch (error) {
    // Parse errors from transaction
    if (error instanceof Error && error.message.startsWith("[")) {
      try {
        const errors = JSON.parse(error.message) as {
          code: string
          name: string
          error: string
        }[]
        return c.json(
          {
            message: "Có lỗi xảy ra khi import - Không lưu dữ liệu nào",
            failed: errors,
          },
          400
        )
      } catch {
        // If parsing fails, fall through to generic error
      }
    }
    console.error("[IMPORT TRANSACTION ERROR]", error)
    return c.json(
      {
        message: `Có lỗi xảy ra khi import: ${error instanceof Error ? error.message : String(error)}`,
      },
      400
    )
  }

  const successCount = data.lecturers.length
  return c.json(
    {
      message: `Nhập giảng viên thành công: ${successCount}/${data.lecturers.length}`,
      time: Date.now() - start,
    },
    200
  )
})

const importGuestLecturer = createRoute({
  operationId: "import-guest-lecturer",
  tags: ["Nhập dữ liệu"],
  path: "/import-guest-lecturer",
  method: "post",
  summary: "Import giảng viên mời giảng (ngoài học viện) Excel",
  description: `Nhập danh sách giảng viên mời giảng (ngoài học viện) từ file Excel.

**Khác import GV thường:** không yêu cầu Khoa/Bộ môn (organizationId = null), bắt buộc thông tin ngân hàng, loại giảng viên phải là loại ngoài (isExternal = true).

**Bảng dữ liệu nguồn:** Lecturer, UserProfile.

**Tham số:** file, timeout (giây, mặc định 30).`,
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: UploadExcelModel.extend({
            timeout: z.coerce
              .number()
              .default(30)
              .openapi(fieldDesc("Timeout transaction (giây).", 30)),
          }),
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Import successfully",
      content: {
        "application/json": {
          schema: ImportJobResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid file type",
      content: {
        "application/json": {
          schema: ImportFailureResponseSchema,
        },
      },
    },
  },
})

app.openapi(importGuestLecturer, async (c) => {
  const { file, timeout } = c.req.valid("form")
  const start = Date.now()

  const buf = await file.arrayBuffer()

  const externalLecturerTypes = await prisma.lecturerType.findMany({
    where: { isExternal: true },
    select: { name: true },
  })
  const externalTypeNames = new Set(externalLecturerTypes.map(({ name }) => name))

  const data = parseSheetGuestLecturer(buf, undefined, externalTypeNames)

  if (data.errors.length) {
    return c.json({ message: "Lỗi khi đọc file", errors: data.errors }, 400)
  }

  const genderMap = await buildGenderMapOrThrow(
    prisma,
    data.lecturers.map(({ gender }) => gender)
  )

  const lecturerTypeMap = await buildLecturerTypeMapOrThrow(
    prisma,
    data.lecturers.map(({ lecturerType }) => lecturerType)
  )

  const nonExternal = Array.from(
    new Set(data.lecturers.map(({ lecturerType }) => lecturerType))
  ).filter((name) => !externalTypeNames.has(name))
  if (nonExternal.length) {
    return c.json(
      {
        message: "Loại giảng viên không phải loại mời giảng (ngoài học viện)",
        errors: nonExternal,
      },
      400
    )
  }

  const degreeTypeMap = await buildDegreeTypeMapOrThrow(
    prisma,
    data.lecturers.map(({ degreeType }) => degreeType)
  )

  const degreeRankTypeMap = await buildDegreeRankTypeMapOrThrow(
    prisma,
    data.lecturers.map(({ degreeRankType }) => degreeRankType)
  )

  const existingProfiles = await prisma.userProfile.findMany({
    where: {
      idCardNumber: { in: data.lecturers.map((lecturer) => lecturer.idCardNumber) },
    },
    select: { id: true, idCardNumber: true },
  })
  const existingProfileMap = new Map(
    existingProfiles.map(({ idCardNumber, id }) => [idCardNumber, id])
  )

  const existingLecturer = await prisma.lecturer.findMany({
    where: { userProfile: { code: { in: data.lecturers.map((lecturer) => lecturer.code) } } },
    select: {
      id: true,
      userProfileId: true,
      userProfile: { select: { idCardNumber: true, code: true } },
    },
  })
  const existingLecturerMap = new Map(
    existingLecturer.map(({ id, userProfileId, userProfile }) => [
      userProfile.code,
      { id, userProfileId, idCardNumber: userProfile.idCardNumber },
    ])
  )

  const existingLecturerByCCCD = await prisma.lecturer.findMany({
    where: {
      userProfile: {
        idCardNumber: { in: data.lecturers.map((lecturer) => lecturer.idCardNumber) },
      },
    },
    select: {
      id: true,
      userProfileId: true,
      userProfile: { select: { idCardNumber: true, code: true } },
    },
  })
  const existingLecturerByCCCDMap = new Map(
    existingLecturerByCCCD
      .filter(({ userProfile }) => userProfile.idCardNumber)
      .map(({ id, userProfileId, userProfile }) => [
        userProfile.idCardNumber,
        { id, code: userProfile.code, userProfileId },
      ])
  )

  const duplicateCode: string[] = []
  for (const l of data.lecturers) {
    const existing = existingLecturerMap.get(l.code)
    if (existing && existing.idCardNumber && existing.idCardNumber !== l.idCardNumber) {
      duplicateCode.push(l.code)
    }
  }
  if (duplicateCode.length) {
    return c.json({ message: "Mã định danh đã tồn tại", errors: duplicateCode }, 400)
  }

  const cccdCount = new Map<string, string[]>()
  for (const l of data.lecturers) {
    if (!l.idCardNumber) continue
    const codes = cccdCount.get(l.idCardNumber) ?? []
    codes.push(l.code)
    cccdCount.set(l.idCardNumber, codes)
  }
  const duplicateCCCD = [...cccdCount.entries()]
    .filter(([, codes]) => codes.length > 1)
    .map(([cccd, codes]) => `CCCD ${cccd} bị trùng ở mã định danh: ${codes.join(", ")}`)
  if (duplicateCCCD.length) {
    return c.json({ message: "Số CCCD bị trùng trong file Excel", errors: duplicateCCCD }, 400)
  }

  const importErrors: { code: string; name: string; error: string }[] = []

  try {
    await prisma.$transaction(
      async (tx) => {
        for (const lecturer of data.lecturers) {
          const lecturerData: Prisma.LecturerCreateInput = {
            from: new Date(),
            lecturerType: {
              connect: { id: lecturerTypeMap.get(lecturer.lecturerType) },
            },
            userProfile: {},
            description: lecturer.description,
          }

          const profileData: Prisma.UserProfileUncheckedCreateWithoutEducationAndTrainingInput = {
            ...splitFullName(lecturer.fullname),
            code: lecturer.code,
            bLaGiangVien: true,
            bLaCanBoNhanVien: true,
            dateOfBirth: lecturer.dateOfBirth,
            genderId: genderMap.get(lecturer.gender),
            academicDegreeTypeId: degreeTypeMap.get(lecturer.degreeType ?? ""),
            academicRankTypeId: degreeRankTypeMap.get(lecturer.degreeRankType ?? ""),
            currentAddress: lecturer.currentAddress,
            phoneNumber: lecturer.phoneNumber,
            email: lecturer.email,
            idCardNumber: lecturer.idCardNumber,
            bankName: lecturer.bankName,
            bankAccountNumber: lecturer.bankAccountNumber,
          }

          const existingProfileId = existingProfileMap.get(lecturer.idCardNumber)
          try {
            if (existingProfileId) {
              const existing = existingLecturerMap.get(lecturer.code)
              if (existing) {
                const existingLecturerData = await tx.lecturer.findUnique({
                  where: { id: existing.id },
                  include: { userProfile: true },
                })

                if (existingLecturerData) {
                  const validationErrors: string[] = []
                  const existingProfile = existingLecturerData.userProfile
                  if (
                    existingProfile.firstName &&
                    profileData.firstName !== existingProfile.firstName
                  ) {
                    validationErrors.push(
                      `Không được đổi Tên (hiện tại: "${existingProfile.firstName}")`
                    )
                  }
                  if (
                    existingProfile.lastName &&
                    profileData.lastName !== existingProfile.lastName
                  ) {
                    validationErrors.push(
                      `Không được đổi Họ và đệm (hiện tại: "${existingProfile.lastName}")`
                    )
                  }
                  if (
                    existingProfile.phoneNumber &&
                    profileData.phoneNumber !== existingProfile.phoneNumber
                  ) {
                    validationErrors.push(
                      `Không được đổi Số điện thoại (hiện tại: "${existingProfile.phoneNumber}")`
                    )
                  }
                  if (validationErrors.length > 0) {
                    importErrors.push({
                      code: lecturer.code,
                      name: lecturer.fullname,
                      error: validationErrors.join("; "),
                    })
                    continue
                  }
                }
              }
              const payload = {
                Id: existingProfileId,
                sMa: lecturer.code,
                bLaGiangVien: true,
                bLaCanBoNhanVien: true,
                dNgaySinh: lecturer.dateOfBirth
                  ? new Date(lecturer.dateOfBirth)?.toISOString()
                  : null,
                sCCCD: lecturer.idCardNumber,
                sHoVaDem: profileData.lastName,
                sTen: profileData.firstName,
                sTenDayDu: lecturer.fullname,
                sSDTDiDong: lecturer.phoneNumber ?? "",
                sEmail: lecturer.email,
                sDM_GioiTinhId: lecturer.gender ? genderMap.get(lecturer.gender) : null,
              }

              const res = await putDMNhanViens(payload, {
                headers: {
                  "x-clientid": process.env.KEYCLOAK_CLIENT_ID_LMS || "",
                  "x-clientsecret": process.env.KEYCLOAK_CLIENT_SECRET_LMS || "",
                },
              })

              if (existing) {
                if (res.status === 200) {
                  await tx.lecturer.update({
                    where: { id: existing.id },
                    data: {
                      ...lecturerData,
                      userProfile: { update: profileData },
                    },
                  })
                } else {
                  const extra = res.data?.extra as ErrorExtra | undefined
                  const errMsg = formatLsbError(extra, `LSB API error: ${res.status}`)
                  importErrors.push({ code: lecturer.code, name: lecturer.fullname, error: errMsg })
                }
              } else {
                const lecturerByCCCD = existingLecturerByCCCDMap.get(lecturer.idCardNumber)
                if (lecturerByCCCD) {
                  importErrors.push({
                    code: lecturer.code,
                    name: lecturer.fullname,
                    error: `CCCD "${lecturer.idCardNumber}" đã liên kết với giảng viên mã "${lecturerByCCCD.code}". Không thể tạo giảng viên mới hoặc đổi mã định danh với CCCD này.`,
                  })
                  continue
                }

                if (res.status === 200) {
                  if (typeof res.data !== "string" || !res.data) {
                    importErrors.push({
                      code: lecturer.code,
                      name: lecturer.fullname,
                      error: `LSB trả về dữ liệu không hợp lệ (mã định danh: ${lecturer.code})`,
                    })
                  } else {
                    await tx.lecturer.create({
                      data: {
                        ...lecturerData,
                        userProfile: {
                          connectOrCreate: {
                            where: { idCardNumber: lecturer.idCardNumber },
                            create: { id: res.data, ...profileData },
                          },
                        },
                      },
                    })
                  }
                } else {
                  const extra = res.data?.extra as ErrorExtra | undefined
                  const errMsg = formatLsbError(extra, `LSB API error: ${res.status}`)
                  importErrors.push({ code: lecturer.code, name: lecturer.fullname, error: errMsg })
                }
              }
            } else {
              const payload = {
                sMa: lecturer.idCardNumber,
                bLaGiangVien: true,
                bLaCanBoNhanVien: true,
                bLaTaiKhoan: true,
                dNgaySinh: lecturer.dateOfBirth
                  ? new Date(lecturer.dateOfBirth)?.toISOString()
                  : null,
                sCCCD: lecturer.idCardNumber,
                sHoVaDem: profileData.lastName,
                sTen: profileData.firstName,
                sTenDayDu: lecturer.fullname,
                sSDTDiDong: lecturer.phoneNumber ?? "",
                sEmail: lecturer.email,
                sDM_GioiTinhId: lecturer.gender ? genderMap.get(lecturer.gender) : null,
              }

              const res = await postDMNhanViens(payload, {
                headers: {
                  "x-clientid": process.env.KEYCLOAK_CLIENT_ID_LMS || "",
                  "x-clientsecret": process.env.KEYCLOAK_CLIENT_SECRET_LMS || "",
                },
              })

              if (res.status === 200) {
                if (typeof res.data !== "string" || !res.data) {
                  importErrors.push({
                    code: lecturer.code,
                    name: lecturer.fullname,
                    error: `LSB trả về dữ liệu không hợp lệ (mã định danh: ${lecturer.code})`,
                  })
                } else {
                  await tx.lecturer.create({
                    data: {
                      ...lecturerData,
                      userProfile: {
                        connectOrCreate: {
                          where: { id: res.data },
                          create: { id: res.data, ...profileData },
                        },
                      },
                    },
                  })
                }
              } else {
                const extra = res.data?.extra as ErrorExtra | undefined
                const errMsg = formatLsbError(extra, `LSB API error: ${res.status}`)
                importErrors.push({ code: lecturer.code, name: lecturer.fullname, error: errMsg })
              }
            }
          } catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error)
            importErrors.push({ code: lecturer.code, name: lecturer.fullname, error: errMsg })
          }
        }

        if (importErrors.length > 0) {
          throw new Error(JSON.stringify(importErrors))
        }
      },
      { timeout: timeout * 1000 }
    )
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("[")) {
      try {
        const errors = JSON.parse(error.message) as { code: string; name: string; error: string }[]
        return c.json(
          { message: "Có lỗi xảy ra khi import - Không lưu dữ liệu nào", failed: errors },
          400
        )
      } catch {}
    }
    console.error("[IMPORT GUEST LECTURER ERROR]", error)
    return c.json(
      {
        message: `Có lỗi xảy ra khi import: ${error instanceof Error ? error.message : String(error)}`,
      },
      400
    )
  }

  const successCount = data.lecturers.length
  return c.json(
    {
      message: `Nhập giảng viên mời giảng thành công: ${successCount}/${data.lecturers.length}`,
      time: Date.now() - start,
    },
    200
  )
})

const importStudent = createRoute({
  operationId: "import-student",
  tags: ["Học viên / Sinh viên"],
  path: "/import-student",
  method: "post",
  summary: "Import học viên Excel",
  description: `Nhập danh sách học viên / sinh viên từ Excel.

**Bảng dữ liệu nguồn:** Student, UserProfile, FixedClass, TrainingCourse.

**Tham số:** file và các trường mở rộng trong schema multipart.`,
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: UploadExcelModel.extend({
            createCurriculumVersion: z
              .preprocess((val) => val === "true" || val === true, z.boolean())
              .optional()
              .default(false),
            timeout: z.coerce.number().default(30),
          }).openapi("ImportStudentRequest"),
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Import Student successfully",
      content: {
        "application/json": {
          schema: ImportJobResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid file type",
      content: {
        "application/json": {
          schema: ImportFailureResponseSchema,
        },
      },
    },
  },
})

app.openapi(importStudent, async (c) => {
  const { file, createCurriculumVersion, timeout } = c.req.valid("form")

  const buf = await file.arrayBuffer()
  const data = parseSheetStudent(buf)

  if (data.errors.length) {
    return c.json({ message: "Lỗi khi đọc file", errors: data.errors }, 400)
  }

  const trainingObjectType = await prisma.trainingObjectType.findFirst({
    where: { name: data.trainingObjectType as string, active: true },
  })

  if (!trainingObjectType) {
    return c.json({ message: `Đối tượng đào tạo không tồn tại: ${data.trainingObjectType}` }, 400)
  }

  const trainingCourse = await prisma.trainingCourse.findFirst({
    where: {
      deletedAt: null,
      active: true,
      OR: [
        {
          trainingObjectTypeId: trainingObjectType.id,
          name: data.trainingCourse as string,
        },
        {
          trainingObjectTypeId: trainingObjectType.id,
          code: data.trainingCourse as string,
        },
      ],
    },
  })

  if (!trainingCourse) {
    return c.json({ message: `Khoá đào tạo không tồn tại: ${data.trainingCourse}` }, 400)
  }

  const genderMap = await buildGenderMapOrThrow(
    prisma,
    data.students.map((student) => student.gender)
  )

  const ethnicityMap = await buildEthnicityMapOrThrow(
    prisma,
    data.students.map((student) => student.ethnicity)
  )

  const nationalityMap = await buildNationalityMapOrThrow(
    prisma,
    data.students.map((student) => student.nationality)
  )

  const provinceMap = await buildNewProvinceMapOrThrow(
    prisma,
    data.students.map((student) => student.newProvinceOfBirth)
  )

  const rankMap = await buildRankMapOrThrow(
    prisma,
    data.students.map((student) => student.rank)
  )

  const positionMap = await buildPositionMapOrThrow(
    prisma,
    data.students.map((student) => student.position)
  )

  const organizationMap = await buildOrgLookupMapOrThrow(
    prisma,
    data.students.map((student) => student.managementOrganization)
  )

  const classConsistencyMap = new Map<
    string,
    { className: string; curriculum: string; trainingMajor: string; managementOrganization: string }
  >()
  const inconsistentClassCodes = new Set<string>()

  for (const student of data.students) {
    if (!student.fixedClassCode) continue

    const managementOrganization = student.managementOrganization?.trim() || ""
    const trainingMajor = student.trainingMajor?.trim() || ""
    const existing = classConsistencyMap.get(student.fixedClassCode)
    if (existing) {
      if (
        existing.className !== student.fixedClass ||
        existing.curriculum !== student.curriculum ||
        existing.trainingMajor !== trainingMajor ||
        existing.managementOrganization !== managementOrganization
      ) {
        inconsistentClassCodes.add(student.fixedClassCode)
      }
    } else {
      classConsistencyMap.set(student.fixedClassCode, {
        className: student.fixedClass,
        curriculum: student.curriculum,
        trainingMajor,
        managementOrganization,
      })
    }
  }

  if (inconsistentClassCodes.size > 0) {
    return c.json(
      {
        message: `Thông tin lớp không nhất quán (tên lớp, chuyên ngành, CTĐT hoặc đơn vị quản lý khác nhau cho cùng mã lớp): ${Array.from(
          inconsistentClassCodes
        ).join(", ")}`,
      },
      400
    )
  }

  const curriculumClassMap = new Map<string, Set<string>>()
  for (const student of data.students) {
    const curriculumKey = curriculumVersionMapKey(student.curriculum, student.trainingMajor)
    if (!curriculumClassMap.has(curriculumKey)) {
      curriculumClassMap.set(curriculumKey, new Set())
    }
    if (student.fixedClassCode) curriculumClassMap.get(curriculumKey)?.add(student.fixedClassCode)
  }

  const invalidCurriculums: string[] = []
  for (const [curriculumKey, classes] of curriculumClassMap) {
    if (classes.size > 1) {
      const [curriculum, trainingMajor] = curriculumKey.split("\n")
      const label = trainingMajor ? `${curriculum} - ${trainingMajor}` : curriculum
      invalidCurriculums.push(`${label} (các mã lớp ${Array.from(classes).join(", ")})`)
    }
  }

  if (invalidCurriculums.length > 0) {
    return c.json(
      {
        message: `Một phiên bản chương trình đào tạo không thể thuộc nhiều lớp: ${invalidCurriculums.join("; ")}`,
      },
      400
    )
  }

  const uniqueCurriculumMajorCombos = Array.from(
    new Map(
      data.students.map((s) => [
        `${s.curriculum}-${s.trainingMajor}`,
        { curriculum: s.curriculum, trainingMajor: s.trainingMajor },
      ])
    ).values()
  )

  const conflicts = await prisma.fixedClass.findMany({
    where: {
      OR: uniqueCurriculumMajorCombos.map((s) => ({
        curriculumVersion: {
          AND: [
            curriculumVersionForTrainingObjectTypeWhere(trainingObjectType.id),
            {
              OR: [
                { name: { equals: s.curriculum, mode: "insensitive" as const } },
                { code: { equals: s.curriculum, mode: "insensitive" as const } },
                { id: s.curriculum },
              ],
            },
            ...(s.trainingMajor
              ? [
                  {
                    curriculum: {
                      trainingMajor: {
                        OR: [
                          {
                            name: {
                              equals: s.trainingMajor,
                              mode: "insensitive" as const,
                            },
                          },
                          { id: s.trainingMajor },
                        ],
                      },
                    },
                  },
                ]
              : []),
          ],
        },
      })),
    },
    select: {
      id: true,
      code: true,
      name: true,
      trainingCourseId: true,
      curriculumVersion: {
        select: {
          id: true,
          name: true,
          code: true,
          curriculum: { select: { trainingMajor: { select: { id: true, name: true } } } },
        },
      },
    },
  })

  const dbConflictErrors: string[] = []
  for (const conflict of conflicts) {
    const conflictCurriculumName = conflict.curriculumVersion?.name
    const conflictMajorName = conflict.curriculumVersion?.curriculum?.trainingMajor?.name

    const matchingInput = data.students.find((s) => {
      const excelCurriculum = s.curriculum?.trim().toLowerCase()
      const excelMajor = s.trainingMajor?.trim().toLowerCase()
      const curriculumMatched =
        excelCurriculum === conflictCurriculumName?.trim().toLowerCase() ||
        excelCurriculum === conflict.curriculumVersion?.id?.toLowerCase() ||
        excelCurriculum === conflict.curriculumVersion?.code?.trim().toLowerCase()
      const majorMatched =
        !s.trainingMajor ||
        excelMajor === conflictMajorName?.trim().toLowerCase() ||
        excelMajor === conflict.curriculumVersion?.curriculum?.trainingMajor?.id?.toLowerCase()
      return curriculumMatched && majorMatched
    })

    if (matchingInput) {
      const isSameClass =
        (matchingInput.fixedClassCode && conflict.code
          ? matchingInput.fixedClassCode === conflict.code
          : matchingInput.fixedClass === conflict.name) &&
        conflict.trainingCourseId === trainingCourse.id

      if (!isSameClass) {
        dbConflictErrors.push(
          `CTĐT ${matchingInput.curriculum} đã được sử dụng cho lớp ${conflict.name} (Khoá ${conflict.trainingCourseId === trainingCourse.id ? "hiện tại" : "khác"})`
        )
      }
    }
  }

  if (dbConflictErrors.length > 0) {
    return c.json({ message: `Xung đột dữ liệu: ${dbConflictErrors.join("; ")}` }, 400)
  }

  await buildCurriculumMapOrThrow(
    prisma,
    data.students,
    trainingObjectType.id,
    trainingCourse.id,
    createCurriculumVersion,
    { write: false }
  )

  const classCodes = Array.from(
    new Set(data.students.map((student) => student.fixedClassCode).filter(Boolean))
  )
  const existingClasses = await prisma.fixedClass.findMany({
    where: { code: { in: classCodes } },
    select: { code: true, trainingCourseId: true, managementOrganizationId: true },
  })
  const existingClassByCode = new Map(
    existingClasses.flatMap((row) => (row.code ? [[row.code, row] as const] : []))
  )
  const foreignClassCodes = existingClasses
    .filter(
      (row): row is (typeof existingClasses)[number] & { code: string } =>
        Boolean(row.code) && row.trainingCourseId !== trainingCourse.id
    )
    .map((row) => row.code)
  if (foreignClassCodes.length) {
    return c.json({ message: `Mã lớp đã thuộc khoá khác: ${foreignClassCodes.join(", ")}` }, 400)
  }

  const existingStudentRows = await prisma.student.findMany({
    where: { userProfile: { code: { in: data.students.map((student) => student.profileCode) } } },
    select: {
      id: true,
      deletedAt: true,
      fixedClass: { select: { code: true, trainingCourseId: true } },
      userProfile: { select: { code: true, idCardNumber: true } },
    },
  })
  const studentsByCode = new Map<string, typeof existingStudentRows>()
  for (const row of existingStudentRows) {
    const code = row.userProfile.code
    if (!code) continue
    const list = studentsByCode.get(code) ?? []
    list.push(row)
    studentsByCode.set(code, list)
  }

  const studentCodes = data.students.map((student) => student.profileCode)
  const studentCCCDs = data.students.map((student) => student.idCardNumber).filter(Boolean)
  const existingProfiles = await prisma.userProfile.findMany({
    where: {
      OR: [{ idCardNumber: { in: studentCCCDs } }, { code: { in: studentCodes } }],
    },
    select: {
      id: true,
      code: true,
      idCardNumber: true,
      email: true,
      phoneNumber: true,
      bLaGiangVien: true,
    },
  })
  const profileByCode = new Map<string, (typeof existingProfiles)[number]>()
  const profileByCccd = new Map<string, (typeof existingProfiles)[number]>()
  for (const profile of existingProfiles) {
    if (profile.code) profileByCode.set(profile.code, profile)
    if (profile.idCardNumber) profileByCccd.set(profile.idCardNumber, profile)
  }

  const identityErrors: { code: string; name: string; error: string }[] = []
  const matchedStudentId = new Map<string, string | undefined>()
  for (const student of data.students) {
    const byCode = profileByCode.get(student.profileCode)
    const byCccd = student.idCardNumber ? profileByCccd.get(student.idCardNumber) : undefined
    if (byCode && byCode.idCardNumber !== student.idCardNumber) {
      identityErrors.push({
        code: student.profileCode,
        name: student.fullname,
        error: `Mã đã gắn với CCCD ${byCode.idCardNumber}`,
      })
    }
    if (byCccd?.code && byCccd.code !== student.profileCode) {
      identityErrors.push({
        code: student.profileCode,
        name: student.fullname,
        error: `CCCD đã gắn với mã ${byCccd.code}`,
      })
    }
    if (byCode && byCccd && byCode.id !== byCccd.id) {
      identityErrors.push({
        code: student.profileCode,
        name: student.fullname,
        error: "Mã và CCCD thuộc hai hồ sơ khác nhau",
      })
    }

    const picked = pickStudentForImport(
      studentsByCode.get(student.profileCode) ?? [],
      student.fixedClassCode,
      trainingCourse.id
    )
    if (picked.otherCourse) {
      identityErrors.push({
        code: student.profileCode,
        name: student.fullname,
        error: "Mã sinh viên đã thuộc khoá khác",
      })
    } else {
      matchedStudentId.set(student.profileCode, picked.student?.id)
    }
  }
  if (identityErrors.length) {
    return c.json(
      { message: "Dữ liệu sinh viên xung đột với hồ sơ hiện có", failed: identityErrors },
      400
    )
  }

  const start = Date.now()
  const importErrors: { code: string; name: string; error: string }[] = []

  const uniqueClasses = Array.from(
    new Map(data.students.map((s) => [s.fixedClassCode, s])).values()
  )

  type PreparedStudent = {
    student: (typeof data.students)[number]
    lsbProfileId: string
    profileData: Prisma.UserProfileUncheckedCreateWithoutEducationAndTrainingInput
    existingStudentId?: string
    entryScore: number | null
    competencyScore: number | null
    basic: number | null
    facility: number | null
    careerYear: number | null
    universityGraduationYear: number | null
  }
  const prepared: PreparedStudent[] = []

  for (const student of data.students) {
    const entryScore = parseImportNumber(student.entryScore)
    const competencyScore = parseImportNumber(student.competencyScore)
    const basic = parseImportNumber(student.basic)
    const facility = parseImportNumber(student.facility)
    const careerYear = parseImportNumber(student.careerYear, true)
    const universityGraduationYear = parseImportNumber(student.universityGraduationYear, true)
    if (
      [entryScore, competencyScore, basic, facility, careerYear, universityGraduationYear].some(
        (value) => Number.isNaN(value)
      )
    ) {
      importErrors.push({
        code: student.profileCode,
        name: student.fullname,
        error: "Điểm hoặc năm không hợp lệ",
      })
      continue
    }

    const profileHit =
      (student.idCardNumber ? profileByCccd.get(student.idCardNumber) : undefined) ||
      profileByCode.get(student.profileCode)
    const generatedEmail = studentLsbEmail(student.idCardNumber)
    const filePhone = student.phoneNumber?.trim() || null
    const email = profileHit?.email || generatedEmail
    const phoneNumber = filePhone || profileHit?.phoneNumber || null
    const classRow = existingClassByCode.get(student.fixedClassCode)
    const fileOrgId = organizationMap.get(student.managementOrganization?.trim() || "") || null
    const donViId = fileOrgId || classRow?.managementOrganizationId || null
    const profileData: Prisma.UserProfileUncheckedCreateWithoutEducationAndTrainingInput = {
      ...splitFullName(student.fullname),
      code: student.profileCode,
      fullname: student.fullname,
      email,
      bLaGiangVien: profileHit?.bLaGiangVien ?? false,
      bLaHocVien: true,
      dateOfBirth: student.dateOfBirth,
      idCardNumber: student.idCardNumber,
      genderId: student.gender ? (genderMap.get(student.gender) ?? null) : null,
      ethnicityId: ethnicityMap.get(student.ethnicity ?? "") || null,
      nationalityId: nationalityMap.get(student.nationality ?? "") || null,
      newProvinceOfBirthId: provinceMap.get(student.newProvinceOfBirth ?? "") || null,
      phoneNumber,
      officerNumber: student.officerNumber,
      rankId: rankMap.get(student.rank ?? "") || null,
      positionCPVId: positionMap.get(normalizeCatalogName(student.position)) || null,
      sDM_DonViId: donViId,
    }

    try {
      const lsbPayload = {
        sMa: student.profileCode,
        bLaHocVien: true,
        bLaTaiKhoan: true,
        dNgaySinh: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString() : null,
        sCCCD: student.idCardNumber,
        sHoVaDem: profileData.lastName,
        sTen: profileData.firstName,
        sTenDayDu: student.fullname,
        sSDTDiDong:
          phoneNumber || studentLsbPhone(undefined, student.idCardNumber, student.profileCode),
        sEmail: email,
        sDM_GioiTinhId: student.gender ? (genderMap.get(student.gender) ?? null) : null,
        sDM_DonViId: donViId,
      }

      let lsbProfileId =
        profileHit?.id ?? (await findLsbNhanVienId(student.profileCode, student.idCardNumber))
      let lsbRes = lsbProfileId
        ? await putDMNhanViens({ Id: lsbProfileId, ...lsbPayload }, lsbRequestOptions())
        : await postDMNhanViens(lsbPayload, lsbRequestOptions())

      if (lsbRes.status !== 200) {
        const extra = (lsbRes.data as { extra?: ErrorExtra } | undefined)?.extra
        if (isLsbDuplicate(extra, lsbRes.data)) {
          const foundId = await findLsbNhanVienId(student.profileCode, student.idCardNumber)
          if (foundId && foundId !== lsbProfileId) {
            lsbRes = await putDMNhanViens({ Id: foundId, ...lsbPayload }, lsbRequestOptions())
            if (lsbRes.status === 200) lsbProfileId = foundId
          }
        }
      } else if (!lsbProfileId) {
        lsbProfileId = extractLsbId(lsbRes.data)
      }

      if (lsbRes.status !== 200 || !lsbProfileId) {
        const extra = (lsbRes.data as { extra?: ErrorExtra } | undefined)?.extra
        importErrors.push({
          code: student.profileCode,
          name: student.fullname,
          error: formatLsbError(extra, `LSB API error: ${lsbRes.status}`),
        })
        continue
      }

      prepared.push({
        student,
        lsbProfileId,
        profileData,
        existingStudentId: matchedStudentId.get(student.profileCode),
        entryScore,
        competencyScore,
        basic,
        facility,
        careerYear,
        universityGraduationYear,
      })
    } catch (error) {
      importErrors.push({
        code: student.profileCode,
        name: student.fullname,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  if (importErrors.length) {
    return c.json({ message: "Có lỗi xảy ra khi import sinh viên", failed: importErrors }, 400)
  }

  try {
    await prisma.$transaction(
      async (tx) => {
        const curriculumVersionMap = await buildCurriculumMapOrThrow(
          tx,
          data.students,
          trainingObjectType.id,
          trainingCourse.id,
          createCurriculumVersion,
          { joinTransaction: true }
        )
        const dmTruong = await buildDMTruongMap(
          tx,
          data.students.map((student) => student.universitySchool)
        )
        const dmNganh = await buildDMNganhMap(
          tx,
          data.students.map((student) => student.universityMajor)
        )
        const dmChuyenNganh = await buildDMChuyenNganhMap(
          tx,
          data.students.map((student) => student.universityMajor)
        )

        for (const s of uniqueClasses) {
          const cvId = curriculumVersionMap.get(
            curriculumVersionMapKey(s.curriculum, s.trainingMajor)
          )
          if (!cvId) {
            throw new Error(`Không tìm thấy chương trình đào tạo: ${s.curriculum}`)
          }

          const currentClass = await tx.fixedClass.findUnique({
            where: { code: s.fixedClassCode },
            select: { trainingCourseId: true },
          })
          if (currentClass && currentClass.trainingCourseId !== trainingCourse.id) {
            throw new Error(`Mã lớp ${s.fixedClassCode} đã thuộc khoá khác`)
          }

          const nameClash = await tx.fixedClass.findFirst({
            where: {
              trainingCourseId: trainingCourse.id,
              name: s.fixedClass,
              curriculumVersionId: cvId,
              NOT: { code: s.fixedClassCode },
            },
            select: { code: true },
          })
          if (nameClash?.code) {
            throw new Error(
              `Tên lớp "${s.fixedClass}" đã dùng cho mã lớp ${nameClash.code} với cùng chương trình đào tạo`
            )
          }

          const managementOrganizationId = organizationMap.get(
            s.managementOrganization?.trim() || ""
          )
          await tx.fixedClass.upsert({
            where: { code: s.fixedClassCode },
            update: {
              name: s.fixedClass,
              curriculumVersionId: cvId,
              ...(managementOrganizationId ? { managementOrganizationId } : {}),
            },
            create: {
              name: s.fixedClass,
              code: s.fixedClassCode,
              trainingCourseId: trainingCourse.id,
              curriculumVersionId: cvId,
              startYear: new Date().getFullYear(),
              ...(managementOrganizationId ? { managementOrganizationId } : {}),
            },
          })
        }

        const fixedClasses = await tx.fixedClass.findMany({
          where: { code: { in: classCodes } },
          select: { id: true, code: true },
        })
        const fixedClassIdByCode = new Map(
          fixedClasses.flatMap((row) => (row.code ? [[row.code, row.id] as const] : []))
        )

        for (const item of prepared) {
          const { student } = item
          const cvId = curriculumVersionMap.get(
            curriculumVersionMapKey(student.curriculum, student.trainingMajor)
          )
          const fixedClassId = fixedClassIdByCode.get(student.fixedClassCode)
          if (!cvId || !fixedClassId) {
            throw new Error(
              `Không xác định được lớp hoặc chương trình đào tạo cho ${student.profileCode}`
            )
          }

          const studentData: Omit<Prisma.StudentCreateInput, "userProfile"> = {
            registerNumber: student.registerNumber || null,
            doctoralCode: student.doctoralCode || null,
            admissionCombination: student.admissionCombination || null,
            entryScore: item.entryScore,
            competencyScore: item.competencyScore,
            fixedClass: { connect: { id: fixedClassId } },
            curriculumVersion: { connect: { id: cvId } },
            department: student.department,
            departmentAddress: student.departmentAddress,
            careerYear: item.careerYear,
            universitySchool: student.universitySchool,
            universityTrainingType: student.universityTrainingType,
            universityGraduationYear: item.universityGraduationYear,
            universityMajor: student.universityMajor,
            universityRank: student.universityRank,
            basic: item.basic,
            facility: item.facility,
            foreignLanguage: student.foreignLanguage,
            priorityReason: student.priorityReason,
            description: student.description,
          }

          await tx.userProfile.upsert({
            where: { id: item.lsbProfileId },
            update: { ...item.profileData, deletedAt: null, active: true },
            create: { id: item.lsbProfileId, ...item.profileData },
          })

          if (item.existingStudentId) {
            await tx.student.update({
              where: { id: item.existingStudentId },
              data: {
                ...studentData,
                userProfile: { connect: { id: item.lsbProfileId } },
                deletedAt: null,
                active: true,
              },
            })
          } else {
            await tx.student.create({
              data: {
                ...studentData,
                userProfile: { connect: { id: item.lsbProfileId } },
              },
            })
          }

          await syncStudentHistory(
            tx,
            item.lsbProfileId,
            student,
            positionMap,
            dmTruong,
            dmNganh,
            dmChuyenNganh
          )
        }
      },
      { timeout: timeout * 1000 }
    )
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("[")) {
      try {
        const errors = JSON.parse(error.message)
        return c.json({ message: "Có lỗi xảy ra khi import sinh viên", failed: errors }, 400)
      } catch {}
    }
    return c.json(
      {
        message: `Lỗi import sinh viên: ${error instanceof Error ? error.message : String(error)}`,
      },
      400
    )
  }

  return c.json(
    {
      message: `Nhập học viên thành công: ${data.students.length}`,
      time: Date.now() - start,
    },
    200
  )
})

const importHeQuanSu = createRoute({
  operationId: "import-he-quan-su",
  tags: ["Học viên / Sinh viên"],
  path: "/import-he-quan-su",
  method: "post",
  summary: "Import hệ quân sự",
  description: `Import dữ liệu hệ quân sự từ Excel.

**Bảng dữ liệu nguồn:** Student, UserProfile, TrainingObjectType.

**Tham số:** file và trường trong schema multipart.`,
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: UploadExcelModel.extend({
            timeout: z.coerce.number().default(30),
          }).openapi("importHeQuanSuRequest"),
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Import He quan su successfully",
      content: {
        "application/json": {
          schema: ImportJobResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid file type",
      content: {
        "application/json": {
          schema: ImportFailureResponseSchema,
        },
      },
    },
  },
})

app.openapi(importHeQuanSu, async (c) => {
  const { file, timeout } = c.req.valid("form")

  const buf = await file.arrayBuffer()
  const data = parseSheetHeQuanSu(buf)

  if (data.errors.length) {
    return c.json({ message: "Lỗi khi đọc file", errors: data.errors }, 400)
  }

  const trainingObjectType = await prisma.trainingObjectType.findFirst({
    where: { name: data.trainingObjectType as string, active: true },
  })

  if (!trainingObjectType) {
    return c.json(
      {
        message: `Đối tượng đào tạo không tồn tại: ${data.trainingObjectType}`,
      },
      400
    )
  }

  const trainingCourse = await prisma.trainingCourse.findFirst({
    where: { name: data.trainingCourse as string, active: true },
  })

  if (!trainingCourse) {
    return c.json({ message: `Khoá đào tạo không tồn tại: ${data.trainingCourse}` }, 400)
  }

  const genderMap = await buildGenderMapOrThrow(
    prisma,
    data.students.map((student) => student.gender)
  )

  const ethnicityMap = await buildEthnicityMapOrThrow(
    prisma,
    data.students.map((student) => student.ethnicity)
  )

  const nationalityMap = await buildNationalityMapOrThrow(
    prisma,
    data.students.map((student) => student.nationality)
  )

  const provinceMap = await buildNewProvinceMapOrThrow(
    prisma,
    data.students.map((student) => student.provinceHometown)
  )

  const curriculumVersionMap = await buildCurriculumMapOrThrow(
    prisma,
    data.students,
    trainingObjectType.id,
    trainingCourse.id
  )

  const existingStudent = await prisma.student.findMany({
    where: { userProfile: { code: { in: data.students.map((student) => student.profileCode) } } },
    select: { id: true, userProfile: { select: { code: true } } },
  })

  const existingStudentMap = new Map(existingStudent.map((s) => [s.userProfile.code, s.id]))

  const start = Date.now()
  await prisma.$transaction(
    async (tx) => {
      await tx.fixedClass.createMany({
        skipDuplicates: true,
        data: data.students.map(({ fixedClass, curriculum }) => ({
          name: fixedClass,
          trainingCourseId: trainingCourse.id,
          curriculumVersionId: curriculumVersionMap.get(curriculum),
          startYear: new Date().getFullYear(),
        })),
      })

      const fixedClass = await tx.fixedClass.findMany({
        where: {
          OR: data.students.map(({ fixedClass, curriculum }) => ({
            name: fixedClass,
            trainingCourseId: trainingCourse.id,
            curriculumVersionId: curriculumVersionMap.get(curriculum),
          })),
        },
        select: { id: true, name: true },
      })

      const fixedClassMap = new Map(fixedClass.map(({ name, id }) => [name, id]))

      for (const student of data.students) {
        const studentData: Prisma.StudentCreateInput = {
          entryScore: Number.parseFloat(student.admissionScore ?? "") || null,
          fixedClass: { connect: { id: fixedClassMap.get(student.fixedClass) } },
          curriculumVersion: {
            connect: { id: curriculumVersionMap.get(student.curriculum) },
          },
          userProfile: {},
        }
        const profileData: Prisma.UserProfileUncheckedCreateWithoutEducationAndTrainingInput = {
          ...splitFullName(student.fullname),
          code: student.profileCode,
          bLaGiangVien: false,
          bLaHocVien: true,
          dateOfBirth: student.dateOfBirth,
          // TODO: need to use idCardNumber
          idCardNumber: student.profileCode,
          genderId: student.gender ? genderMap.get("Nữ") : null,
          ethnicityId: ethnicityMap.get(student.ethnicity ?? "") || null,
          nationalityId: nationalityMap.get(student.nationality ?? "") || null,
          newProvinceHometownId: provinceMap.get(student.provinceHometown ?? "") || null,
        }

        const existingId = existingStudentMap.get(student.profileCode)
        if (existingId) {
          await tx.student.update({
            where: { id: existingId },
            data: {
              ...studentData,
              userProfile: { update: profileData },
            },
          })
        } else {
          await tx.student.create({
            data: {
              ...studentData,
              userProfile: {
                connectOrCreate: {
                  where: { idCardNumber: student.profileCode }, // TODO: need to use idCardNumber
                  create: profileData,
                },
              },
            },
          })
        }
      }
    },
    { timeout: timeout * 1000 }
  )

  return c.json(
    {
      message: `Nhập học viên thành công: ${data.students.length}`,
      time: Date.now() - start,
    },
    200
  )
})

const importInternship = createRoute({
  operationId: "import-internship",
  tags: ["Nhập dữ liệu"],
  path: "/import-internship",
  method: "post",
  summary: "Import thực tập Excel",
  description: `Nhập hồ sơ thực tập học viên từ Excel.

**Bảng dữ liệu nguồn:** StudentInternship, StudentSubjectScore.

**Tham số:** file và trường trong schema multipart.`,
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: UploadExcelModel.extend({
            timeout: z.coerce.number().default(30),
          }),
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      description: "Import internships successfully",
      content: {
        "application/json": {
          schema: ImportJobResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid file type",
      content: {
        "application/json": {
          schema: ImportFailureResponseSchema,
        },
      },
    },
  },
})

app.openapi(importInternship, async (c) => {
  const { file, timeout } = c.req.valid("form")
  const start = Date.now()

  const buf = await file.arrayBuffer()
  const data = parseSheetInternship(buf)

  if (data.errors.length) {
    return c.json({ message: "Lỗi khi đọc file", errors: data.errors }, 400)
  }

  const studentCodes = [...new Set(data.internships.map((i) => i.code))]
  const subjectClassCodes = [...new Set(data.internships.map((i) => i.subjectClassCode))]

  const students = await prisma.student.findMany({
    where: { userProfile: { code: { in: studentCodes } } },
    select: { id: true, userProfile: { select: { code: true } } },
  })
  const studentMap = new Map(students.map((s) => [s.userProfile.code, s.id]))

  const subjectClasses = await prisma.subjectClass.findMany({
    where: { code: { in: subjectClassCodes } },
    select: { id: true, code: true, subjectId: true },
  })
  const subjectClassMap = new Map(
    subjectClasses.map((sc) => [sc.code, { id: sc.id, subjectVersionId: sc.subjectId }])
  )

  const missingStudents = studentCodes.filter((code) => !studentMap.has(code))
  const missingSubjectClasses = subjectClassCodes.filter((code) => !subjectClassMap.has(code))

  if (missingStudents.length > 0) {
    return c.json({ message: `Không tìm thấy sinh viên: ${missingStudents.join(", ")}` }, 400)
  }

  if (missingSubjectClasses.length > 0) {
    return c.json(
      {
        message: `Không tìm thấy lớp học phần: ${missingSubjectClasses.join(", ")}`,
      },
      400
    )
  }

  let successCount = 0
  let errorCount = 0
  const errors: string[] = []

  for (const internship of data.internships) {
    try {
      const studentId = studentMap.get(internship.code)
      const subjectClassInfo = subjectClassMap.get(internship.subjectClassCode)

      if (!studentId || !subjectClassInfo) {
        errors.push(`Dòng ${internship.stt}: Không tìm thấy sinh viên hoặc lớp học phần`)
        errorCount++
        continue
      }

      let studentSubjectScore = await prisma.studentSubjectScore.findFirst({
        where: {
          studentId,
          subjectClassId: subjectClassInfo.id,
        },
      })

      if (!studentSubjectScore) {
        studentSubjectScore = await prisma.studentSubjectScore.create({
          data: {
            studentId,
            subjectClassId: subjectClassInfo.id,
            subjectVersionId: subjectClassInfo.subjectVersionId,
          },
        })
      }

      await prisma.studentInternship.upsert({
        where: {
          studentSubjectScoreId: studentSubjectScore.id,
        },
        create: {
          studentSubjectScoreId: studentSubjectScore.id,
          institution: internship.institution || undefined,
          unit: internship.unit || undefined,
          address: internship.address ?? undefined,
          internshipContent: internship.internshipContent ?? undefined,
          startDate: internship.startDate ?? undefined,
          endDate: internship.endDate ?? undefined,
          reportDate: internship.reportDate ?? undefined,
        },
        update: {
          institution: internship.institution || undefined,
          unit: internship.unit || undefined,
          address: internship.address ?? undefined,
          internshipContent: internship.internshipContent ?? undefined,
          startDate: internship.startDate ?? undefined,
          endDate: internship.endDate ?? undefined,
          reportDate: internship.reportDate ?? undefined,
        },
      })

      successCount++
    } catch (error) {
      console.error(error)
      errors.push(`Dòng ${internship.stt}: ${error}`)
      errorCount++
    }
  }

  if (errorCount > 0) {
    return c.json(
      {
        message: `Import hoàn tất với ${successCount} thành công và ${errorCount} lỗi`,
        errors,
      },
      400
    )
  }

  return c.json(
    {
      message: `Nhập dữ liệu thực tập sinh thành công: ${successCount}`,
      time: Date.now() - start,
    },
    200
  )
})

export default app
