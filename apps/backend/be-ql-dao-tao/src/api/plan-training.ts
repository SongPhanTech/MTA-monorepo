import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { $Enums, type SubjectClass } from '@workspace/db'
import { read, utils } from 'xlsx'
import { prisma } from '..'
import { UploadExcelModel } from '../dto/upload-excel.dto'
import { exportPCGDdata } from '../services/lecturer'
import { fillExcelTemplate, getBufferFromUrl } from '../services/template.service'
import { getCurrentDateForReport } from '../utils'

const app = new OpenAPIHono({ strict: false })

const exportPhanCongGiangDay = createRoute({
    operationId: 'exportPhanCongGiangDay',
    path: '/export-phan-cong-giang-day',
    description: 'Xuất file excel danh sách phân công giảng dạy',
    tags: ['PlanTraining'],
    summary: 'Export danh sách phân công giảng dạy',
    method: 'get',
    request: {
        query: z.object({
            organizationId: z.string().openapi('organizationId', {
                description: 'ID của đơn vị',
            }),
            semesterId: z.string().openapi('semesterId', {
                description: 'ID của học kỳ',
            }),
        }),
    },
    responses: {
        200: {
            description: 'Export danh sách phân công giảng dạy.',
            content: {
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
                    schema: z.any().openapi({ type: 'string', format: 'binary' }),
                },
            },
        },

        400: {
            description: 'Invalid file upload',
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string(),
                    }),
                },
            },
        },
        404: {
            description: 'Not found',
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string(),
                    }),
                },
            },
        },
    },
})
app.openapi(exportPhanCongGiangDay, async (c) => {
    const { organizationId, semesterId } = c.req.valid('query')

    const { date, month, year } = getCurrentDateForReport()

    const templateFile = await getBufferFromUrl('LECTURE_PCGD')

    const phanCongData = await exportPCGDdata(organizationId, semesterId)
    console.log(`data length ${phanCongData.cellData.length}`)
    console.log(`merge ${phanCongData.mergeData}`)
    const filledTemplate = await fillExcelTemplate(templateFile, phanCongData)

    const fileName = `PhanCongGiangDay_${date}_${month}_${year}.xlsx`

    c.header('Content-Disposition', `attachment; filename="${fileName}"`)
    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    return c.body(filledTemplate)
})

const importPhanCongGiangDay = createRoute({
    operationId: 'importPhanCongGiangDay',
    path: '/import-phan-cong-giang-day',
    method: 'post',
    description: 'Nhập file excel danh sách phân công giảng dạy',
    tags: ['PlanTraining'],
    summary: 'Import danh sách phân công giảng dạy',
    request: {
        body: {
            content: {
                'multipart/form-data': {
                    schema: UploadExcelModel.extend({
                        semesterId: z.string(), // loại thông tin
                        trainingObjectTypeId: z.string(), // loại thông tin
                    }).openapi('importPhanCongGiangDay'),
                },
            },
        },
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.object({ message: z.string(), time: z.number() }),
                },
            },
            description: 'Tải danh sách thành công',
        },
        400: {
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string(),
                    }),
                },
            },
            description: 'Invalid file upload',
        },
    },
})

app.openapi(importPhanCongGiangDay, async (c) => {
    const { file, semesterId, trainingObjectTypeId } = c.req.valid('form')

    const maxFileSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxFileSize) {
        return c.json({ message: 'File vượt quá 50MB' }, 400)
    }

    // Đọc file Excel
    const arrayBuffer = await file.arrayBuffer()
    const workbook = read(arrayBuffer, { type: 'array' })

    const ListSheetNames = workbook.SheetNames
    console.log('Danh sách sheet:', ListSheetNames)
    const startTime = Date.now()
    const danhSachLopMonHoc = [] as SubjectClass[]

    for (const sheetName of ListSheetNames) {
        console.log(`- ${sheetName}`)
        const sheet = workbook.Sheets[sheetName]
        if (!sheet) {
            return c.json({ message: 'Không tìm thấy sheet' }, 400)
        }

        // Chuyển đổi dữ liệu từ sheet thành JSON
        const rowData = utils.sheet_to_json<string[]>(sheet, {
            header: 1,
        })
        const indexOffHeader = rowData.findIndex((row, index) => {
            if (row[0] === 'STT') {
                return true // dừng lại khi tìm thấy
            }
            return false // tiếp tục tìm kiếm
        })
        if (indexOffHeader === -1) {
            continue
        }
        // Xóa các dòng trống ở đầu file (nếu có)
        rowData.splice(0, indexOffHeader + 1)

        const danhSachTenGV = new Set<string>()
        const danhSachMaTKBMonHoc = new Set<string>()
        const danhSachMaLopNienChe = new Set<string>()
        const danhSachMaPhongHoc = new Set<string>()

        for (const row of rowData) {
            // Xử lý từng dòng dữ liệu ở đây
            const [
                ,
                maGV,
                tenGV,
                maMon,
                tenMon,
                maLopNienChe,
                tenLopNienChe,
                ,
                maPhongHoc,
                tenPhong,
                ,
                ,
                ,
                ,
                hocChung,
            ] = row
            if (tenGV && maGV) {
                tenGV
                    .split(',')
                    .map((e) => e.replace(/\([^)]*\)/g, '').trim())
                    // biome-ignore lint/suspicious/useIterableCallbackReturn: <dung cho set>
                    .forEach((e) => danhSachTenGV.add(e))
            }
            if (maMon && tenMon) {
                danhSachMaTKBMonHoc.add(maMon.trim())
            }
            if (maLopNienChe && tenLopNienChe) {
                danhSachMaLopNienChe.add(maLopNienChe.trim())
            }
            if (hocChung) {
                hocChung
                    .split(',')
                    .map((e) => e.replace(/\([^)]*\)/g, '').trim())
                    // biome-ignore lint/suspicious/useIterableCallbackReturn: <dung cho set>
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
            },
        })
        await prisma.$transaction(
            async (tx) => {
                for (const row of rowData) {
                    // Xử lý từng dòng dữ liệu ở đây
                    const [
                        ,
                        ,
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
                    const subjectClass = {
                        gvChinh: null as string | null,
                        gvPhu: null as string | null,
                        monHoc: null as string | null,
                        maLopMonHoc: null as string | null,
                        lopNienChe: [] as string[],
                        phongHoc: null as string | null,
                        ngayBatDau: ngayHoc ? new Date(ngayHoc) : null,
                        ngayKetThuc: null as Date | null,
                        ngayThi: null as Date | null,
                        caHoc:
                            caHoc === 'Sáng'
                                ? $Enums.SubjectClassSchedule.MORNING
                                : caHoc === 'Chiều'
                                  ? $Enums.SubjectClassSchedule.AFTERNOON
                                  : $Enums.SubjectClassSchedule.EVENING,
                        quanSo: quanSo ? Number(quanSo) : 0,
                    }

                    const tienHoc = String(tietHoc)
                        .trim()
                        .match(/\b(\d+)\s*(?:->|-|→)\s*(\d+)\b/)
                    const tuTietHoc = tienHoc ? Number(tienHoc[1]) : null
                    const denTietHoc = tienHoc ? Number(tienHoc[2]) : null
                    const scheduleInfo = {
                        ngayHoc: ngayHoc ? new Date(ngayHoc) : null,
                        tietHoc: tietHoc
                            ? ([tuTietHoc, denTietHoc].filter((e) => e !== null) as number[])
                            : [],
                        hinhThucHoc:
                            hinhThucHoc === 'Thí nghiệm'
                                ? $Enums.PeriodType.LAB
                                : hinhThucHoc === 'Thực hành'
                                  ? $Enums.PeriodType.PRACTICE
                                  : hinhThucHoc === 'Thi'
                                    ? $Enums.PeriodType.EXAM
                                    : $Enums.PeriodType.THEORY,
                    }

                    if (tenGV) {
                        const [tenGvChinh, tenGvPhu] = tenGV
                            .split(',')
                            .map((e) => e.replace(/\([^)]*\)/g, '').trim())
                        if (tenGvChinh) {
                            const gvChinh = danhSachGV.find(
                                (gv) =>
                                    gv.userProfile.fullname?.toLowerCase() ===
                                    tenGvChinh.toLowerCase()
                            )
                            if (gvChinh) {
                                subjectClass.gvChinh = gvChinh.id
                            } else {
                                console.log(
                                    `Không tìm thấy giảng viên chính với tên: ${tenGvChinh}`
                                )
                            }
                        }
                        if (tenGvPhu) {
                            const gvPhu = danhSachGV.find(
                                (gv) =>
                                    gv.userProfile.fullname?.toLowerCase() ===
                                    tenGvPhu.toLowerCase()
                            )
                            if (gvPhu) {
                                subjectClass.gvPhu = gvPhu.id
                            } else {
                                console.log(`Không tìm thấy giảng viên phụ với tên: ${tenGvPhu}`)
                            }
                        }
                    }
                    if (maMon) {
                        const monHoc = danhSachMonHoc.find(
                            (mh) => mh.codeTkb?.toLowerCase() === String(maMon).toLowerCase()
                        )
                        if (monHoc) {
                            subjectClass.monHoc = monHoc.id
                            subjectClass.maLopMonHoc = `${monHoc.code}-${Math.random().toString(10).substr(2, 2)}`
                        } else {
                            console.log(`Không tìm thấy môn học với mã: ${maMon}`)
                        }
                    }
                    if (maLopNienChe) {
                        const lopNienChe = danhSachLopNienChe.find(
                            (lop) => lop.code?.toLowerCase() === String(maLopNienChe).toLowerCase()
                        )
                        if (lopNienChe) {
                            subjectClass.lopNienChe.push(lopNienChe.id)
                        } else {
                            console.log(`Không tìm thấy lớp niên chế với mã: ${maLopNienChe}`)
                        }
                    }
                    if (hocChung) {
                        hocChung
                            .split(',')
                            .map((e) => e.replace(/\([^)]*\)/g, '').trim())
                            .forEach((e) => {
                                const lopNienChe = danhSachLopNienChe.find(
                                    (lop) => lop.code?.toLowerCase() === e.toLowerCase()
                                )
                                if (lopNienChe) {
                                    subjectClass.lopNienChe.push(lopNienChe.id)
                                } else {
                                    console.log(`Không tìm thấy lớp niên chế với mã: ${e}`)
                                }
                            })
                    }
                    if (maPhongHoc) {
                        const phongHoc = danhSachPhongHoc.find(
                            (ph) => ph.code?.toLowerCase() === String(maPhongHoc).toLowerCase()
                        )
                        if (phongHoc) {
                            subjectClass.phongHoc = phongHoc.id
                        } else {
                            console.log(`Không tìm thấy phòng học với mã: ${maPhongHoc}`)
                        }
                    }
                    subjectClass.ngayKetThuc = scheduleInfo.ngayHoc
                    const existSubjectClass = await tx.subjectClass.findFirst({
                        where: {
                            semesterId,
                            schedule: subjectClass.caHoc,
                            maxStudent: subjectClass.quanSo,
                            lecturerId: subjectClass.gvChinh ?? '',
                            extraLecturerId: subjectClass.gvPhu ?? '',
                            subjectId: subjectClass.monHoc ?? '',
                            roomId: subjectClass.phongHoc ?? '',
                        },
                    })
                    if (existSubjectClass) {
                        const res = await tx.subjectClass.update({
                            where: {
                                id: existSubjectClass.id,
                            },
                            data: {
                                endDate: subjectClass.ngayKetThuc ?? existSubjectClass.endDate,
                                fixedClasses: {
                                    set: subjectClass.lopNienChe.map((e) => ({
                                        id: e,
                                    })),
                                },
                                classSchedules:
                                    scheduleInfo.ngayHoc && scheduleInfo.tietHoc
                                        ? {
                                              create: {
                                                  roomId: existSubjectClass.roomId,
                                                  classDate: scheduleInfo.ngayHoc,
                                                  startPeriod: Number(scheduleInfo.tietHoc[0]) ?? 1,
                                                  endPeriod:
                                                      Number(
                                                          scheduleInfo.tietHoc.length > 1
                                                              ? scheduleInfo.tietHoc[1]
                                                              : scheduleInfo.tietHoc[0]
                                                      ) ?? 1,
                                                  periodType: scheduleInfo.hinhThucHoc,
                                              },
                                          }
                                        : {},
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
                                code: subjectClass.maLopMonHoc ?? '',
                                name: tenMon ? tenMon.trim() : '',
                                schedule: subjectClass.caHoc,
                                maxStudent: subjectClass.quanSo,
                                startDate: subjectClass.ngayBatDau ?? new Date(),
                                examDate: subjectClass.ngayThi ?? new Date(),
                                semesterId,
                                lecturerId: subjectClass.gvChinh,
                                extraLecturerId: subjectClass.gvPhu,
                                subjectId: subjectClass.monHoc,
                                roomId: subjectClass.phongHoc,
                                fixedClasses: {
                                    connect: subjectClass.lopNienChe.map((e) => ({
                                        id: e,
                                    })),
                                },
                                classSchedules:
                                    scheduleInfo.ngayHoc && scheduleInfo.tietHoc
                                        ? {
                                              create: {
                                                  roomId: subjectClass.phongHoc,
                                                  classDate: scheduleInfo.ngayHoc,
                                                  startPeriod: Number(scheduleInfo.tietHoc[0]) ?? 1,
                                                  endPeriod:
                                                      Number(
                                                          scheduleInfo.tietHoc.length > 1
                                                              ? scheduleInfo.tietHoc[1]
                                                              : scheduleInfo.tietHoc[0]
                                                      ) ?? 1,
                                                  periodType: scheduleInfo.hinhThucHoc,
                                              },
                                          }
                                        : {},
                                trainingObjectTypeId,
                            },
                        })
                        danhSachLopMonHoc.push(res)
                    }
                }
            },
            {
                maxWait: 200000,
                timeout: 1500000,
            }
        )
    }

    const endTime = Date.now()

    return c.json(
        { message: 'Tải danh sách thành công', time: endTime - startTime, data: danhSachLopMonHoc },
        200
    )
})

export default app
