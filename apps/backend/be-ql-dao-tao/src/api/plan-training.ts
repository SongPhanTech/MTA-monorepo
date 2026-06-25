import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { $Enums, type SubjectClass } from "@workspace/db"
import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"
import { read, utils, type WorkSheet } from "xlsx"
import { prisma } from ".."
import { UploadExcelModel } from "../dto/upload-excel.dto"
import { fieldDesc } from "../dto/openapi-helpers"
import { standardErrorResponses } from "../dto/openapi-route-helpers"
import {
  ErrorMessageResponseSchema,
  PlanTrainingImportResultSchema,
} from "../dto/common-response.dto"
import { ExamType } from "@workspace/db/client"

dayjs.extend(customParseFormat)
const app = new OpenAPIHono({ strict: false })

const importPhanCongGiangDay = createRoute({
  operationId: "importPhanCongGiangDay",
  path: "/import-phan-cong-giang-day",
  method: "post",
  summary: "Import phân công giảng dạy",
  description: `Nhập Excel phân công giảng dạy / TKB lớp học phần.

**Bảng dữ liệu nguồn:** SubjectClass, ClassSchedule, Lecturer, Room, FixedClass.

**Tham số:** file, semesterId, trainingObjectTypeId, fileType, importType, type.`,
  tags: ["Phân công giảng dạy"],
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: UploadExcelModel.extend({
            semesterId: z.string().openapi(fieldDesc("ID học kỳ.")),
            trainingObjectTypeId: z.string().openapi(fieldDesc("ID hệ đào tạo.")),
            fileType: z
              .enum(["THONG_KE_GIAO_VIEN_GIANG_DAY", "TKB_THEO_LOP_HOC_PHAN"])
              .default("THONG_KE_GIAO_VIEN_GIANG_DAY")
              .openapi(fieldDesc("Loại file mẫu import.")),
            importType: z
              .enum(["TAO_MOI", "CAP_NHAT", "XEM_TRUOC"])
              .default("CAP_NHAT")
              .openapi(fieldDesc("TAO_MOI | CAP_NHAT | XEM_TRUOC.")),
            type: z
              .nativeEnum($Enums.SubjectClassType)
              .optional()
              .openapi(fieldDesc("Loại lớp học phần.")),
          }).openapi("importPhanCongGiangDay"),
        },
      },
    },
  },
  responses: {
    ...standardErrorResponses(),
    200: {
      content: {
        "application/json": {
          schema: PlanTrainingImportResultSchema,
        },
      },
      description: "Tải danh sách thành công",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorMessageResponseSchema,
        },
      },
      description: "Invalid file upload",
    },
  },
})

const importFileGiaoVienCoGioGiay = async (
  sheet: WorkSheet,
  semesterId: string,
  trainingObjectTypeId: string,
  danhSachLopMonHoc: Array<SubjectClass>,
  importType: "TAO_MOI" | "CAP_NHAT" | "XEM_TRUOC",
  type: $Enums.SubjectClassType,
  error: {
    message: string
  }[] = []
) => {
  const rowData = utils.sheet_to_json<string[]>(sheet, {
    header: 1,
  })
  const indexOffHeader = rowData.findIndex((row, index) => {
    if (row[0] === "STT") {
      return true // dừng lại khi tìm thấy
    }
    return false // tiếp tục tìm kiếm
  })
  if (indexOffHeader === -1) {
    return { message: "Không tìm thấy header trong file" }
  }
  // Xóa các dòng trống ở đầu file (nếu có)
  rowData.splice(0, indexOffHeader + 1)
  console.log("Số lượng bản ghi:", rowData.length)

  const danhSachTenGV = new Set<string>()
  const danhSachMaTKBMonHoc = new Set<string>()
  const danhSachMaLopNienChe = new Set<string>()
  const danhSachMaPhongHoc = new Set<string>()
  const maMonMaLop = new Map<string, Array<string>>() // key: {maMon}, value: [maLop]

  for (const row of rowData) {
    // Xử lý từng dòng dữ liệu ở đây
    const idx = row[0]
    const maGV = row[1]
    const tenGV = row[2]
    const maMon = row[3]
    const tenMon = row[4]
    const maLopNienChe = row[5]
    const tenLopNienChe = row[6]
    const maPhongHoc = row[8]
    const tenPhong = row[9]
    const hocChung = row[14]
    if (tenGV && maGV) {
      tenGV
        .split(",")
        .map((e) => e.replace(/\([^)]*\)/g, "").trim())
        .forEach((e) => danhSachTenGV.add(e))
    }
    if (maMon && tenMon) {
      danhSachMaTKBMonHoc.add(String(maMon).trim())
    }
    if (maLopNienChe && tenLopNienChe) {
      danhSachMaLopNienChe.add(maLopNienChe.trim())
    }
    if (maMon && maLopNienChe) {
      if (!maMonMaLop.has(String(maMon))) {
        maMonMaLop.set(String(maMon), [String(maLopNienChe)])
      } else {
        maMonMaLop.get(String(maMon))?.push(String(maLopNienChe))
      }
    }
    if (hocChung) {
      hocChung
        .split(",")
        .map((e) => e.replace(/\([^)]*\)/g, "").trim())
        .forEach((e) => danhSachMaLopNienChe.add(e))
    }
    if (maPhongHoc && tenPhong) {
      danhSachMaPhongHoc.add(maPhongHoc.trim())
    }
  }

  const danhSachGV = await prisma.lecturer.findMany({
    where: {
      userProfile: {
        fullname: {
          in: Array.from(danhSachTenGV),
        },
      },
    },
    select: {
      id: true,
      code: true,
      userProfile: {
        select: {
          fullname: true,
        },
      },
    },
  })

  const danhSachMonHoc = await prisma.subjectVersion.findMany({
    where: {
      codeTkb: {
        in: Array.from(danhSachMaTKBMonHoc),
      },
    },
    select: {
      id: true,
      codeTkb: true,
      code: true,
      examType: true,
    },
  })
  const danhSachLopNienChe = await prisma.fixedClass.findMany({
    where: {
      code: {
        in: Array.from(danhSachMaLopNienChe),
      },
    },
    select: {
      id: true,
      code: true,
    },
  })
  const danhSachPhongHoc = await prisma.room.findMany({
    where: {
      code: {
        in: Array.from(danhSachMaPhongHoc),
      },
    },
    select: {
      id: true,
      code: true,
      building: true,
    },
  })

  await prisma.$transaction(
    async (tx) => {
      await tx.subjectClass.updateMany({
        where: {
          semesterId,
          trainingObjectTypeId,
          type,
        },
        data: {
          cancelled: true,
          lecturerAssignmentDeadline: null,
        },
      })
      await tx.classSchedule.deleteMany({
        where: {
          subjectClass: {
            semesterId,
            trainingObjectTypeId,
            type,
          },
        },
      })
      await tx.subjectClassTime.deleteMany({
        where: {
          subjectClass: {
            semesterId,
            trainingObjectTypeId,
            type,
          },
        },
      })

      for (const row of rowData) {
        // Xử lý từng dòng dữ liệu ở đây
        const [
          idx,
          maGV,
          tenGV,
          maMon,
          tenMon,
          maLopNienChe,
          ,
          quanSo,
          maPhongHoc,
          ,
          hinhThucHoc,
          ngayHoc,
          caHoc,
          tietHoc,
          hocChung,
        ] = row
        console.log("Xử lý dòng", {
          idx,
          maGV,
          tenGV,
          maMon,
          tenMon,
          maLopNienChe,
          quanSo,
          maPhongHoc,
          hinhThucHoc,
          ngayHoc,
          caHoc,
          tietHoc,
          hocChung,
        })
        const subjectClass = {
          gvChinh: null as string | null,
          gvPhu: null as string | null,
          monHoc: null as string | null,
          lopNienChe: [] as string[],
          phongHoc: null as string | null,
          ngayBatDau: ngayHoc ? dayjs(ngayHoc, "DD/MM/YYYY").toDate() : null,
          ngayKetThuc: null as Date | null,
          khuVuc: null as string | null | undefined,
          examType: ExamType.Oral as ExamType,
          ngayThi:
            hinhThucHoc === "Thi" ? (ngayHoc ? dayjs(ngayHoc, "DD/MM/YYYY").toDate() : null) : null,
          caHoc:
            caHoc === "Sáng"
              ? $Enums.SubjectClassSchedule.MORNING
              : caHoc === "Chiều"
                ? $Enums.SubjectClassSchedule.AFTERNOON
                : $Enums.SubjectClassSchedule.EVENING,
          quanSo: quanSo ? Number(quanSo) : 0,
          type,
        }
        const dsTietHoc = String(tietHoc)
          .trim()
          .match(/\b(\d+)\s*(?:->|-|→)\s*(\d+)\b/)
        const tuTietHoc = dsTietHoc
          ? Number(dsTietHoc[1]) + (caHoc === "Sáng" ? 0 : caHoc === "Chiều" ? 6 : 12)
          : null
        const denTietHoc = dsTietHoc
          ? Number(dsTietHoc[2]) + (caHoc === "Sáng" ? 0 : caHoc === "Chiều" ? 6 : 12)
          : null
        const scheduleInfo = {
          ngayHoc: ngayHoc ? dayjs(ngayHoc, "DD/MM/YYYY").toDate() : null,
          tietHoc: tietHoc ? ([tuTietHoc, denTietHoc].filter((e) => e !== null) as number[]) : [],
          hinhThucHoc:
            hinhThucHoc === "Thí nghiệm"
              ? $Enums.PeriodType.LAB
              : hinhThucHoc === "Thực hành"
                ? $Enums.PeriodType.PRACTICE
                : hinhThucHoc === "Thi"
                  ? $Enums.PeriodType.EXAM
                  : $Enums.PeriodType.THEORY,
        }

        if (maGV && tenGV) {
          const [, tenGvPhu] = tenGV.split(",").map((e) => e.replace(/\([^)]*\)/g, "").trim())
          const gvChinh = danhSachGV.find(
            (gv) => gv.code?.toLowerCase() === String(maGV).trim().toLowerCase()
          )
          if (gvChinh) {
            subjectClass.gvChinh = gvChinh.id
          } else {
            error.push({
              message: `Không tìm thấy giảng viên chính với mã: ${maGV}`,
            })
          }
          if (tenGvPhu) {
            const gvPhu = danhSachGV.find(
              (gv) =>
                gv.userProfile.fullname?.toLowerCase() === String(tenGvPhu).trim().toLowerCase()
            )
            if (gvPhu) {
              subjectClass.gvPhu = gvPhu.id
            } else {
              error.push({
                message: `Không tìm thấy giảng viên phụ với tên: ${tenGvPhu}`,
              })
            }
          }
        }
        if (maMon) {
          const monHoc = danhSachMonHoc.find(
            (mh) => mh.codeTkb?.toLowerCase() === String(maMon).trim().toLowerCase()
          )
          if (monHoc) {
            subjectClass.monHoc = monHoc.id
            subjectClass.examType = monHoc.examType
          } else {
            error.push({
              message: `Không tìm thấy môn học với mã: ${maMon}`,
            })
          }
        }
        if (maLopNienChe) {
          const lopNienChe = danhSachLopNienChe.find(
            (lop) => lop.code?.toLowerCase() === String(maLopNienChe).trim().toLowerCase()
          )
          if (lopNienChe) {
            subjectClass.lopNienChe.push(lopNienChe.id)
          } else {
            error.push({
              message: `Không tìm thấy lớp niên chế với mã: ${maLopNienChe}`,
            })
          }
        }
        if (hocChung) {
          hocChung
            .split(",")
            .map((e) => e.replace(/\([^)]*\)/g, "").trim())
            .forEach((e) => {
              const lopNienChe = danhSachLopNienChe.find(
                (lop) => lop.code?.toLowerCase() === e.toLowerCase()
              )
              if (lopNienChe) {
                subjectClass.lopNienChe.push(lopNienChe.id)
              } else {
                error.push({
                  message: `Không tìm thấy lớp niên chế với mã: ${e}`,
                })
              }
            })
        }
        if (maPhongHoc) {
          const phongHoc = danhSachPhongHoc.find(
            (ph) => ph.code?.toLowerCase() === String(maPhongHoc).trim().toLowerCase()
          )
          if (phongHoc) {
            subjectClass.phongHoc = phongHoc.id
            subjectClass.khuVuc = phongHoc?.building?.trainingLocationId
          } else {
            error.push({
              message: `Không tìm thấy phòng học với mã: ${maPhongHoc}`,
            })
          }
        }
        subjectClass.ngayKetThuc = scheduleInfo.ngayHoc
        const maLopMonHoc = `${danhSachMonHoc.find((e) => e.codeTkb?.toLowerCase() === String(maMon).trim().toLowerCase())?.code} ${((maMonMaLop.get(String(maMon))?.indexOf(String(maLopNienChe)) ?? 0) + 1).toString()}`

        const existSubjectClass = await tx.subjectClass.findFirst({
          where: {
            semesterId,
            code: maLopMonHoc,
            trainingObjectTypeId,
            type,
          },
        })
        if (existSubjectClass) {
          const res = await tx.subjectClass.update({
            where: {
              id: existSubjectClass.id,
            },
            data: {
              trainingLocationId: subjectClass?.khuVuc ?? existSubjectClass?.trainingLocationId,
              maxStudent: subjectClass.quanSo,
              lecturerId: subjectClass.gvChinh ?? existSubjectClass.lecturerId,
              extraLecturerId: subjectClass.gvPhu ?? existSubjectClass.extraLecturerId,
              enterGradeLecturerId: subjectClass.gvChinh ?? existSubjectClass.enterGradeLecturerId,
              startDate: subjectClass.ngayBatDau ?? existSubjectClass.startDate,
              endDate: subjectClass.ngayKetThuc ?? existSubjectClass.endDate,
              examDate: subjectClass.ngayThi ?? existSubjectClass.examDate,
              roomId: subjectClass?.phongHoc ?? existSubjectClass.roomId,
              fixedClasses: {
                set: subjectClass.lopNienChe.map((e) => ({
                  id: e,
                })),
              },
              status: "OFFICIAL",
              cancelled: false,
              approveLecturerAssignmentAt: new Date(),
              classSchedules:
                scheduleInfo.ngayHoc && scheduleInfo.tietHoc
                  ? {
                      create: {
                        roomId: subjectClass?.phongHoc ?? existSubjectClass.roomId,
                        classDate: scheduleInfo.ngayHoc,
                        startPeriod: scheduleInfo.tietHoc[0] ? Number(scheduleInfo.tietHoc[0]) : 1,
                        endPeriod: scheduleInfo.tietHoc[1] ? Number(scheduleInfo.tietHoc[1]) : 1,
                        periodType: scheduleInfo.hinhThucHoc,
                        lecturerId: subjectClass.gvChinh ?? "",
                        extraLecturerId: subjectClass.gvPhu ?? "",
                      },
                    }
                  : {},
              subjectClassTimes: {
                create: {
                  dayOfWeek:
                    dayjs(subjectClass.ngayKetThuc ?? new Date()).day() === 0
                      ? 8
                      : dayjs(subjectClass.ngayKetThuc ?? new Date()).day() + 1,
                  startPeriod: scheduleInfo.tietHoc[0] ? Number(scheduleInfo.tietHoc[0]) : 1,
                  endPeriod: scheduleInfo.tietHoc[1] ? Number(scheduleInfo.tietHoc[1]) : 1,
                },
              },
            },
            include: {
              fixedClasses: {
                select: {
                  code: true,
                  _count: {
                    select: {
                      students: {
                        where: {
                          status: $Enums.StudentStatus.ENROLLED,
                          active: true,
                          deletedAt: null,
                        },
                      },
                    },
                  },
                },
              },
              mainLecturer: {
                select: {
                  userProfile: {
                    select: {
                      fullname: true,
                    },
                  },
                },
              },
              extraLecturer: {
                select: {
                  userProfile: {
                    select: {
                      fullname: true,
                    },
                  },
                },
              },
              enterGradeLecturer: {
                select: {
                  userProfile: {
                    select: {
                      fullname: true,
                    },
                  },
                },
              },
              trainingLocation: {
                select: {
                  name: true,
                },
              },
              room: {
                select: {
                  name: true,
                },
              },
              subjectClassTimes: true,
              subject: {
                select: {
                  managementOrganization: {
                    select: {
                      sMa: true,
                    },
                  },
                  onePoint: true,
                },
              },
            },
          })
          danhSachLopMonHoc.push(res)
        } else if (
          subjectClass.gvChinh &&
          subjectClass.monHoc &&
          subjectClass.lopNienChe.length > 0 &&
          subjectClass.phongHoc
        ) {
          const res = await tx.subjectClass.create({
            data: {
              code: maLopMonHoc ?? "",
              name: tenMon ? tenMon.trim() : "",
              schedule: subjectClass.caHoc,
              maxStudent: subjectClass.quanSo,
              startDate: subjectClass.ngayBatDau ?? null,
              endDate: subjectClass.ngayKetThuc ?? null,
              examDate: subjectClass.ngayThi ?? null,
              semesterId,
              lecturerId: subjectClass.gvChinh,
              extraLecturerId: subjectClass.gvPhu,
              enterGradeLecturerId: subjectClass.gvChinh,
              subjectId: subjectClass.monHoc,
              examType: subjectClass.examType,
              roomId: subjectClass.phongHoc,
              approveLecturerAssignmentAt: new Date(),
              type,
              fixedClasses: {
                connect: subjectClass.lopNienChe.map((e) => ({
                  id: e,
                })),
              },
              status: "OFFICIAL",
              classSchedules:
                scheduleInfo.ngayHoc && scheduleInfo.tietHoc
                  ? {
                      create: {
                        roomId: subjectClass.phongHoc,
                        classDate: scheduleInfo.ngayHoc,
                        startPeriod: scheduleInfo.tietHoc[0] ? Number(scheduleInfo.tietHoc[0]) : 1,
                        endPeriod: scheduleInfo.tietHoc[1] ? Number(scheduleInfo.tietHoc[1]) : 1,
                        periodType: scheduleInfo.hinhThucHoc,
                        lecturerId: subjectClass.gvChinh,
                        extraLecturerId: subjectClass.gvPhu,
                      },
                    }
                  : {},
              trainingObjectTypeId,
              subjectClassTimes: {
                create: {
                  dayOfWeek:
                    dayjs(subjectClass.ngayBatDau ?? new Date()).day() === 0
                      ? 8
                      : dayjs(subjectClass.ngayBatDau ?? new Date()).day() + 1,
                  startPeriod: scheduleInfo.tietHoc[0] ? Number(scheduleInfo.tietHoc[0]) : 1,
                  endPeriod: scheduleInfo.tietHoc[1] ? Number(scheduleInfo.tietHoc[1]) : 1,
                },
              },
            },
            include: {
              fixedClasses: {
                select: {
                  code: true,
                  _count: {
                    select: {
                      students: {
                        where: {
                          status: $Enums.StudentStatus.ENROLLED,
                          active: true,
                          deletedAt: null,
                        },
                      },
                    },
                  },
                },
              },
              mainLecturer: {
                select: {
                  userProfile: {
                    select: {
                      fullname: true,
                    },
                  },
                },
              },
              extraLecturer: {
                select: {
                  userProfile: {
                    select: {
                      fullname: true,
                    },
                  },
                },
              },
              enterGradeLecturer: {
                select: {
                  userProfile: {
                    select: {
                      fullname: true,
                    },
                  },
                },
              },
              trainingLocation: {
                select: {
                  name: true,
                },
              },
              room: {
                select: {
                  name: true,
                },
              },
              subjectClassTimes: true,
              subject: {
                select: {
                  managementOrganization: {
                    select: {
                      sMa: true,
                    },
                  },
                  onePoint: true,
                },
              },
            },
          })
          danhSachLopMonHoc.push(res)
        }
      }
      if (importType === "XEM_TRUOC") {
        throw new Error("Rollback transaction for preview")
      }
    },
    {
      maxWait: 200000,
      timeout: 1500000,
    }
  )
}

const importFileTKBTheoLopHocPhan = async (
  sheet: WorkSheet,
  semesterId: string,
  trainingObjectTypeId: string,
  danhSachLopMonHoc: Array<SubjectClass>,
  importType: "TAO_MOI" | "CAP_NHAT" | "XEM_TRUOC",
  type: $Enums.SubjectClassType,
  error: {
    message: string
  }[] = []
) => {
  const rowData = utils.sheet_to_json<string[]>(sheet, {
    header: 1,
  })

  const indexOffHeader = rowData.findIndex((row, index) => {
    if (row[0] === "TT") {
      return true // dừng lại khi tìm thấy
    }
    return false // tiếp tục tìm kiếm
  })

  if (indexOffHeader === -1) {
    return { message: "Không tìm thấy header trong file" }
  }
  // Xóa các dòng trống ở đầu file (nếu có)
  rowData.splice(0, indexOffHeader + 1)

  const ghiChu = rowData.find((row) => {
    return row[0] && typeof row[0] === "string" && row[0].toLowerCase()?.includes("ghi chú:")
  })
  const regex = /bắt đầu từ ngày\s*(\d{2}\/\d{1,2}\/\d{4})\s*đến ngày\s*(\d{2}\/\d{1,2}\/\d{4})/
  let ngayBatDau: Date | null = null
  let ngayKetThuc: Date | null = null
  if (ghiChu?.[0]) {
    const match = ghiChu[0].toLowerCase().match(regex)

    if (match) {
      ngayBatDau = dayjs(match[1], "DD/M/YYYY").isValid()
        ? dayjs(match[1], "DD/M/YYYY").toDate()
        : dayjs(match[1], "DD/MM/YYYY").toDate()
      ngayKetThuc = dayjs(match[2], "DD/M/YYYY").isValid()
        ? dayjs(match[2], "DD/M/YYYY").toDate()
        : dayjs(match[2], "DD/MM/YYYY").toDate()
    }
  }
  const indexOfFooter = rowData.findIndex((row) => {
    return row[0] && typeof row[0] === "string" && row[0].toLowerCase()?.includes("ghi chú:")
  })
  rowData.splice(indexOfFooter, rowData.length)
  const danhSachTenGV = new Set<string>()
  const danhSachMaGV = new Set<string>()
  const danhSachMaMonHoc = new Set<string>()
  const danhSachMaPhongHoc = new Set<string>()
  for (const row of rowData) {
    // Xử lý từng dòng dữ liệu ở đây
    const [, maMon, , , , tenGV, , , maPhongHoc] = row
    if (tenGV) {
      tenGV.split(";").forEach((e) => {
        const ma = e.match(/\(([^)]*)\)/)?.[1]?.trim()
        if (ma) danhSachMaGV.add(ma)
        danhSachTenGV.add(e.replace(/\([^)]*\)/g, "").trim())
      })
    }
    if (maMon) {
      danhSachMaMonHoc.add(String(maMon).trim())
    }
    if (maPhongHoc) {
      danhSachMaPhongHoc.add(maPhongHoc.trim())
    }
  }
  const danhSachGV = await prisma.lecturer.findMany({
    where: {
      OR: [
        { userProfile: { fullname: { in: Array.from(danhSachTenGV) } } },
        { code: { in: Array.from(danhSachMaGV) } },
      ],
    },
    select: {
      id: true,
      code: true,
      userProfile: {
        select: {
          fullname: true,
        },
      },
    },
  })

  const danhSachMonHoc = await prisma.subjectVersion.findMany({
    where: {
      codeTkb: {
        in: Array.from(danhSachMaMonHoc),
      },
    },
    select: {
      id: true,
      codeTkb: true,
      code: true,
      examType: true,
    },
  })

  const danhSachPhongHoc = await prisma.room.findMany({
    where: {
      code: {
        in: Array.from(danhSachMaPhongHoc),
      },
    },
    select: {
      id: true,
      code: true,
    },
  })

  await prisma.$transaction(
    async (tx) => {
      if (importType === "TAO_MOI") {
        await tx.subjectClass.deleteMany({
          where: {
            semesterId,
            trainingObjectTypeId,
            type,
          },
        })
      }
      await tx.classSchedule.deleteMany({
        where: {
          subjectClass: {
            semesterId,
            trainingObjectTypeId,
            type,
          },
        },
      })
      await tx.subjectClassTime.deleteMany({
        where: {
          subjectClass: {
            semesterId,
            trainingObjectTypeId,
            type,
          },
        },
      })

      for (const row of rowData) {
        // Xử lý từng dòng dữ liệu ở đây
        const [
          ,
          maMon,
          tenMon,
          ,
          maLopMonHoc,
          tenGV,
          thuTrongTuan,
          tietHoc,
          maPhongHoc,
          sinhVienToiDa,
        ] = row
        const subjectClass = {
          gvChinh: null as string | null,
          gvPhu: null as string | null,
          monHoc: null as string | null,
          phongHoc: null as string | null,
          quanSo: sinhVienToiDa ? Number(sinhVienToiDa) : 0,
          examType: ExamType.Oral as ExamType,
        }
        const dsTietHoc = String(tietHoc)
          .trim()
          .match(/\b(\d+)\s*(?:->|-|→)\s*(\d+)\b/)
        const tuTietHoc = dsTietHoc ? Number(dsTietHoc[1]) : null
        const denTietHoc = dsTietHoc ? Number(dsTietHoc[2]) : null
        const scheduleInfo = {
          tietHoc: tietHoc ? ([tuTietHoc, denTietHoc].filter((e) => e !== null) as number[]) : [],
        }

        if (tenGV) {
          const [rawGvChinh, rawGvPhu] = tenGV.split(";")
          const timGiangVien = (raw?: string) => {
            if (!raw) return undefined
            const ma = raw.match(/\(([^)]*)\)/)?.[1]?.trim()
            const ten = raw.replace(/\([^)]*\)/g, "").trim()
            if (ma) {
              const gvTheoMa = danhSachGV.find((gv) => gv.code?.toLowerCase() === ma.toLowerCase())
              if (gvTheoMa) return gvTheoMa
            }
            return danhSachGV.find(
              (gv) => gv.userProfile.fullname?.toLowerCase() === ten.toLowerCase()
            )
          }
          const tenGVChinh = rawGvChinh?.replace(/\([^)]*\)/g, "").trim()
          const tenGvPhu = rawGvPhu?.replace(/\([^)]*\)/g, "").trim()
          const gvChinh = timGiangVien(rawGvChinh)
          if (gvChinh) {
            subjectClass.gvChinh = gvChinh.id
          } else {
            error.push({
              message: `Không tìm thấy giảng viên chính với tên: ${tenGVChinh}`,
            })
          }
          if (tenGvPhu) {
            const gvPhu = timGiangVien(rawGvPhu)
            if (gvPhu) {
              subjectClass.gvPhu = gvPhu.id
            } else {
              error.push({
                message: `Không tìm thấy giảng viên phụ với tên: ${tenGvPhu}`,
              })
            }
          }
        }
        if (maMon) {
          const monHoc = danhSachMonHoc.find(
            (mh) => mh.codeTkb?.toLowerCase() === String(maMon).trim().toLowerCase()
          )
          if (monHoc) {
            subjectClass.monHoc = monHoc.id
            subjectClass.examType = monHoc.examType
          } else {
            error.push({
              message: `Không tìm thấy môn học với mã: ${maMon}`,
            })
          }
        }
        if (maPhongHoc) {
          const phongHoc = danhSachPhongHoc.find(
            (ph) => ph.code?.toLowerCase() === String(maPhongHoc).trim().toLowerCase()
          )
          if (phongHoc) {
            subjectClass.phongHoc = phongHoc.id
          } else {
            error.push({
              message: `Không tìm thấy phòng học với mã: ${maPhongHoc}`,
            })
          }
        }
        const existSubjectClass = await tx.subjectClass.findFirst({
          where: {
            semesterId,
            code: String(maLopMonHoc).trim(),
            trainingObjectTypeId,
            type,
          },
        })

        let scheduleOfSubjectClass: $Enums.SubjectClassSchedule =
          $Enums.SubjectClassSchedule.MORNING
        if (scheduleInfo.tietHoc[0]) {
          if (scheduleInfo.tietHoc[0] >= 1 && scheduleInfo.tietHoc[0] <= 5) {
            scheduleOfSubjectClass = $Enums.SubjectClassSchedule.MORNING
          }
          if (scheduleInfo.tietHoc[0] >= 6 && scheduleInfo.tietHoc[0] <= 11) {
            scheduleOfSubjectClass = $Enums.SubjectClassSchedule.AFTERNOON
          }
          if (scheduleInfo.tietHoc[0] >= 12) {
            scheduleOfSubjectClass = $Enums.SubjectClassSchedule.EVENING
          }
        }

        if (existSubjectClass) {
          const res = await tx.subjectClass.update({
            where: {
              id: existSubjectClass.id,
            },
            data: {
              maxStudent: subjectClass.quanSo,
              lecturerId: subjectClass.gvChinh ?? existSubjectClass.lecturerId,
              extraLecturerId: subjectClass.gvPhu ?? existSubjectClass.extraLecturerId,
              enterGradeLecturerId: subjectClass.gvChinh ?? existSubjectClass.enterGradeLecturerId,
              schedule: scheduleOfSubjectClass,
              startDate: ngayBatDau ?? existSubjectClass.startDate,
              endDate: ngayKetThuc ?? existSubjectClass.endDate,
              roomId: subjectClass?.phongHoc ?? existSubjectClass.roomId,
              status: "OFFICIAL",
              cancelled: false,
              approveLecturerAssignmentAt: new Date(),
              subjectClassTimes:
                thuTrongTuan && String(thuTrongTuan).trim()
                  ? {
                      create: {
                        dayOfWeek: Number(thuTrongTuan),
                        startPeriod: scheduleInfo.tietHoc[0] ? Number(scheduleInfo.tietHoc[0]) : 1,
                        endPeriod: scheduleInfo.tietHoc[1] ? Number(scheduleInfo.tietHoc[1]) : 1,
                      },
                    }
                  : {},
              type,
            },
            include: {
              fixedClasses: {
                select: {
                  code: true,
                  _count: {
                    select: {
                      students: {
                        where: {
                          status: $Enums.StudentStatus.ENROLLED,
                          active: true,
                          deletedAt: null,
                        },
                      },
                    },
                  },
                },
              },
              mainLecturer: {
                select: {
                  userProfile: {
                    select: {
                      fullname: true,
                    },
                  },
                },
              },
              extraLecturer: {
                select: {
                  userProfile: {
                    select: {
                      fullname: true,
                    },
                  },
                },
              },
              enterGradeLecturer: {
                select: {
                  userProfile: {
                    select: {
                      fullname: true,
                    },
                  },
                },
              },
              trainingLocation: {
                select: {
                  name: true,
                },
              },
              room: {
                select: {
                  name: true,
                },
              },
              subjectClassTimes: true,
              subject: {
                select: {
                  managementOrganization: {
                    select: {
                      sMa: true,
                    },
                  },
                  onePoint: true,
                },
              },
            },
          })
          danhSachLopMonHoc.push(res)
        } else if (subjectClass.gvChinh && subjectClass.monHoc) {
          const res = await tx.subjectClass.create({
            data: {
              code: maLopMonHoc ?? "",
              name: tenMon ? tenMon.trim() : "",
              schedule: scheduleOfSubjectClass,
              maxStudent: subjectClass.quanSo,
              startDate: ngayBatDau ?? new Date(),
              endDate: ngayKetThuc,
              semesterId,
              lecturerId: subjectClass.gvChinh,
              extraLecturerId: subjectClass.gvPhu,
              enterGradeLecturerId: subjectClass.gvChinh,
              subjectId: subjectClass.monHoc,
              examType: subjectClass.examType,
              roomId: subjectClass.phongHoc,
              trainingObjectTypeId,
              status: "OFFICIAL",
              approveLecturerAssignmentAt: new Date(),
              subjectClassTimes:
                thuTrongTuan && String(thuTrongTuan).trim()
                  ? {
                      create: {
                        dayOfWeek: Number(thuTrongTuan),
                        startPeriod: scheduleInfo.tietHoc[0] ? Number(scheduleInfo.tietHoc[0]) : 1,
                        endPeriod: scheduleInfo.tietHoc[1] ? Number(scheduleInfo.tietHoc[1]) : 1,
                      },
                    }
                  : {},
              type,
            },
            include: {
              fixedClasses: {
                select: {
                  code: true,
                  _count: {
                    select: {
                      students: {
                        where: {
                          status: $Enums.StudentStatus.ENROLLED,
                          active: true,
                          deletedAt: null,
                        },
                      },
                    },
                  },
                },
              },
              mainLecturer: {
                select: {
                  userProfile: {
                    select: {
                      fullname: true,
                    },
                  },
                },
              },
              extraLecturer: {
                select: {
                  userProfile: {
                    select: {
                      fullname: true,
                    },
                  },
                },
              },
              enterGradeLecturer: {
                select: {
                  userProfile: {
                    select: {
                      fullname: true,
                    },
                  },
                },
              },
              trainingLocation: {
                select: {
                  name: true,
                },
              },
              room: {
                select: {
                  name: true,
                },
              },
              subjectClassTimes: true,
              subject: {
                select: {
                  managementOrganization: {
                    select: {
                      sMa: true,
                    },
                  },
                  onePoint: true,
                },
              },
            },
          })
          danhSachLopMonHoc.push(res)
        }
      }
      if (importType === "XEM_TRUOC") {
        throw new Error("Rollback transaction for preview")
      }
    },
    {
      maxWait: 200000,
      timeout: 1500000,
    }
  )
}

app.openapi(importPhanCongGiangDay, async (c) => {
  const {
    file,
    semesterId,
    trainingObjectTypeId,
    fileType,
    importType,
    type = $Enums.SubjectClassType.NORMAL,
  } = c.req.valid("form")
  const errorImport: {
    message: string
  }[] = []
  const maxFileSize = 50 * 1024 * 1024 // 50MB
  if (file.size > maxFileSize) {
    return c.json({ message: "File vượt quá 50MB" }, 400)
  }

  // Đọc file Excel
  const arrayBuffer = await file.arrayBuffer()
  const workbook = read(arrayBuffer, { type: "array" })

  const ListSheetNames = workbook.SheetNames
  const startTime = Date.now()
  const danhSachLopMonHoc = [] as SubjectClass[]

  for (const sheetName of ListSheetNames) {
    console.log(`- ${sheetName}`)
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) {
      return c.json({ message: "Không tìm thấy sheet" }, 400)
    }
    if (fileType === "THONG_KE_GIAO_VIEN_GIANG_DAY") {
      if (importType === "XEM_TRUOC") {
        try {
          await importFileGiaoVienCoGioGiay(
            sheet,
            semesterId,
            trainingObjectTypeId,
            danhSachLopMonHoc,
            importType,
            type,
            errorImport
          )
        } catch (error) {
          console.log("Error during preview import:", error)
        }
        console.log(
          "danhSachLopMonHoc",
          danhSachLopMonHoc.uniqueByKey("code").map((e) => e.code)
        )
      } else {
        await importFileGiaoVienCoGioGiay(
          sheet,
          semesterId,
          trainingObjectTypeId,
          danhSachLopMonHoc,
          importType,
          type,
          errorImport
        )
      }
    } else if (fileType === "TKB_THEO_LOP_HOC_PHAN") {
      if (importType === "XEM_TRUOC") {
        try {
          await importFileTKBTheoLopHocPhan(
            sheet,
            semesterId,
            trainingObjectTypeId,
            danhSachLopMonHoc,
            importType,
            type,
            errorImport
          )
        } catch (error) {
          console.log("Error during preview import:", error)
        }
        console.log(
          "danhSachLopMonHoc",
          danhSachLopMonHoc.uniqueByKey("code").map((e) => e.code)
        )
      } else {
        await importFileTKBTheoLopHocPhan(
          sheet,
          semesterId,
          trainingObjectTypeId,
          danhSachLopMonHoc,
          importType,
          type,
          errorImport
        )
      }
    } else {
      return c.json({ message: "Loại file không hợp lệ" }, 400)
    }
    // Chuyển đổi dữ liệu từ sheet thành JSON
  }

  const endTime = Date.now()

  return c.json(
    {
      message: "Tải danh sách thành công",
      time: endTime - startTime,
      data: (() => {
        const examDateByCode = new Map<string, Date>()
        for (const item of danhSachLopMonHoc) {
          if (item.examDate && !examDateByCode.has(item.code)) {
            examDateByCode.set(item.code, item.examDate)
          }
        }
        return danhSachLopMonHoc.uniqueByKey("code").map((item) => ({
          ...item,
          examDate: item.examDate ?? examDateByCode.get(item.code) ?? null,
        }))
      })(),
      error: errorImport,
    },
    200
  )
})

export default app
