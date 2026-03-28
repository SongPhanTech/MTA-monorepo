import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { UserProfileScalarSchema } from "@workspace/db/zod/models"
import { splitFullName } from "@workspace/libs/utils"
import { HTTPException } from "hono/http-exception"
import { read, utils } from "xlsx"
import { prisma } from ".."
import { UploadExcelModel } from "../dto/upload-excel.dto"
import { parseDate } from "../utils"
import { ListOf } from "../zod/base"

const uploadExcelCreateUserProfile = createRoute({
  operationId: "uploadExcelCreateUserProfile",
  path: "/upload-excel-create-user-profile",
  method: "post",
  description:
    "Thêm mới danh sách học viên/sinh viên \n\n [type] là mã của loại đối tượng cần tạo, lấy trong bảng UserType",
  tags: ["UserProfile"],
  summary: "Upload Excel Create UserProfile",
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: UploadExcelModel.extend({
            type: z.string(), // loại thông tin
          }).openapi("uploadExcelCreateUserProfile"),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: ListOf(UserProfileScalarSchema) },
      },
      description: "Tải danh sách thành công",
    },
    400: {
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
      description: "Invalid file upload",
    },
  },
})

const uploadExcelUpdateUserProfile = createRoute({
  operationId: "uploadExcelUpdateUserProfile",
  path: "/upload-excel-update-user-profile",
  method: "post",
  description: "Cập nhật thông tin học viên/sinh viên",
  tags: ["UserProfile"],
  summary: "Upload Excel Update UserProfile",
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: UploadExcelModel.openapi("uploadExcelUpdateUserProfile"),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: ListOf(UserProfileScalarSchema) },
      },
      description: "Tải danh sách thành công",
    },
    400: {
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
      description: "Invalid file upload",
    },
  },
})

const app = new OpenAPIHono({ strict: false })

app.openapi(uploadExcelCreateUserProfile, async (c) => {
  const { file, type } = c.req.valid("form")

  if (file.size > 50 * 1024 * 1024) {
    return c.json({ message: "File vượt quá 50MB" }, 400)
  }

  // Đọc file Excel
  const arrayBuffer = await file.arrayBuffer()
  const workbook = read(arrayBuffer, { type: "array" })

  // Lấy sheet đầu tiên
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    return c.json({ message: "Không tìm thấy sheet" }, 400)
  }
  const sheet = workbook.Sheets[sheetName]
  if (!sheet) {
    return c.json({ message: "Không tìm thấy sheet" }, 400)
  }

  // Chuyển đổi dữ liệu từ sheet thành JSON
  const rowData = utils.sheet_to_json<string[]>(sheet, {
    header: 1,
  })

  // Duyệt dòng 11 theo mẫu
  const userProfile = await prisma.userProfile.createManyAndReturn({
    data: rowData.slice(11).map((row) => ({
      firstName: splitFullName(row[2] || "").firstName || "",
      lastName: splitFullName(row[2] || "").lastName || "",
      code: row[1] || "", // Mã
      gender: row[3] === "Nam" ? Gender.Male : Gender.Female,
      dateOfBirth: parseDate(row[4] || ""),
      homeTown: row[5] || "", // Quê quán
      idCardNumber: row[6] || "", // CCCD
      phoneNumber: row[7] || "", // Số điện thoại
    })),
  })

  return c.json(
    {
      data: userProfile,
      count: userProfile.length,
    },
    200
  )
})

app.openapi(uploadExcelUpdateUserProfile, async (c) => {
  const { file } = c.req.valid("form")

  if (file.size > 50 * 1024 * 1024) {
    return c.json({ message: "File vượt quá 50MB" }, 400)
  }

  // Đọc file Excel
  const arrayBuffer = await file.arrayBuffer()
  const workbook = read(arrayBuffer, { type: "array" })
  // Lấy sheet đầu tiên
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    return c.json({ message: "Không tìm thấy sheet" }, 400)
  }
  const sheet = workbook.Sheets[sheetName]

  if (!sheet) {
    return c.json({ message: "Không tìm thấy sheet" }, 400)
  }

  // Chuyển đổi dữ liệu từ sheet thành JSON
  const rowData = utils.sheet_to_json<string[]>(sheet, { header: 1 })

  const data = await prisma.$transaction(async (prisma) => {
    return await Promise.all(
      rowData.slice(11).map(async (row, index) => {
        const existingUserProfile = row[2]
          ? await prisma.userProfile.findFirst({
              where: { code: row[2] }, // Tìm kiếm UserType của Sinh viên
            })
          : null

        if (!existingUserProfile) {
          throw new HTTPException(404, {
            message: `Không tìm thấy mã ${row[2]}`,
          })
        }
        const { firstName, lastName } = splitFullName(row[1] || "")
        const priorityObject = await prisma.priorityObject.findFirst({
          where: { name: row[9] }, // đối tượng ưu tiên
        })
        const registrationArea = await prisma.registrationArea.findFirst({
          where: { name: row[10] }, // khu vực đăng ký
        })
        const nationality = await prisma.nationality.findFirst({
          where: { name: row[11] }, // quốc tịch
        })
        const religion = await prisma.religion.findFirst({
          where: { name: row[12] }, // tôn giáo
        })
        const ethnicity = await prisma.ethnicity.findFirst({
          where: { name: row[13] }, // dân tộc
        })
        return await prisma.userProfile.update({
          where: { id: existingUserProfile.id },
          data: {
            firstName: firstName || "", // Tên
            lastName: lastName || "", // Họ
            dateOfBirth: parseDate(row[3]), // Ngày sinh
            placeOfBirth: row[4] || "", // Nơi sinh
            homeTown: row[5] || "", // Quê quán
            idCardNumber: String(row[6] || ""), // CCCD
            idCardDate: parseDate(row[7]), // Ngày cấp CCCD
            officerNumber: String(row[8] || ""), // Số hiệu sĩ quan
            priorityObjectId: priorityObject?.id || null, // Đối tượng ưu tiên
            registrationAreaId: registrationArea?.id || null, // Khu vực đăng ký
            nationalityId: nationality?.id || null, // Quốc tịch
            religionId: religion?.id || null, // Tôn giáo
            ethnicityId: ethnicity?.id || null, // Dân tộc
            permanentAddress: row[14] || "", // Địa chỉ thường trú
            temporaryAddress: row[15] || "", // Địa chỉ tạm trú
            // Địa chỉ liên lạc
            phoneNumber: String(row[17] || ""), // Số điện thoại
            email: row[18] || "", // Email
            parentPhoneNumber: String(row[19] || ""), // Số điện thoại phụ huynh
            parentName: String(row[20] || ""), // Tên phụ huynh
            unionDate: parseDate(row[21]), // Ngày kết nạp Đoàn
            unionPlace: row[22] || "", // Nơi kết nạp Đoàn
            CPVJoinDate: parseDate(row[23]), // Ngày kết nạp Đảng
            officialCPVDate: parseDate(row[24]), // Ngày chính thức Đảng
            CPVJoinPlace: row[25] || "", // Nơi kết nạp Đảng
            tenureDate: parseDate(row[26]), // Ngày vào niên chế
            enlistmentDate: parseDate(row[27]), // Ngày nhập ngũ
            dischargeDate: parseDate(row[28]), // Ngày xuất ngũ
            rankName: row[29] || "", // Quân hàm
            educationLevel: row[30] || "", // Trình độ học vấn
            academicDegreeTypeName: row[31] || "", // Trình độ học vấn
            academicRankTypeName: row[32] || "", // Trình độ học vấn
            positionName: row[33] || "", // Chức vụ
            positionCPVName: row[34] || "", // Chức vụ Đảng
            organizationName: row[35] || "", // đơn vị
            organizationCPVName: row[36] || "", // Đơn vị Đảng
          }, // Cập nhật mã
        })
      })
    )
  })
  return c.json({ data, count: data.length }, 200)
})

export default app
