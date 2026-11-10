import {
  $Enums,
  AcademicRankingBaseType,
  ConfigKey,
  PrismaClient,
} from "../generated/prisma-client"
import { seedAcademicActionConfig } from "./seed/academic-action-config"
import {
  academicRankingGraduationCivilian,
  academicRankingGraduationMilitary,
  academicRankingStudying,
} from "./seed/academic-ranking-convert"
import { seedAcademicWarningRule } from "./seed/academic-warning-rule"
import { seedSystemCriteriaDefinitions, systemCriteriaId } from "./seed/criteria-definition"
import { seedScholarshipCriteria } from "./seed/scholarship"
import { seedSchoolYear } from "./seed/schoolYear"
import { scoreConversions } from "./seed/score-convert"
import { trainingData } from "./seed/trainingData"

const prisma = new PrismaClient()

async function main() {
  const configs: Record<
    Exclude<ConfigKey, "USER_SESSION_TIMEOUT" | "ACADEMIC_ACTION_RULES">,
    string
  > = {
    [ConfigKey.MANAGEMENT_DEPARTMENT]: "Bộ Quốc Phòng",
    [ConfigKey.ACADEMY_NAME]: "Học viện Kỹ thuật Quân sự",
    [ConfigKey.ACADEMY_CODE]: "HVKTQS",
    [ConfigKey.DIRECTOR]: "Trung tướng GS.TS Lê Minh Thái",
    [ConfigKey.TRAINING_DEPARTMENT]: "Phòng Đào tạo",
    [ConfigKey.HEAD_OF_TRAINING_DEPARTMENT]: "Trưởng phòng Đào tạo",
    [ConfigKey.EXAMINATION_DEPARTMENT]: "Phòng Khảo thí",
    [ConfigKey.HEAD_OF_EXAMINATION_DEPARTMENT]: "Trưởng phòng Khảo thí",
    [ConfigKey.PROVINCE]: "Hà Nội",
    [ConfigKey.DISTRICT]: "Bắc Từ Liêm",
    [ConfigKey.WARD]: "Cổ Nhuế",
  }

  for (const [key, value] of Object.entries(configs) as [ConfigKey, string][]) {
    await prisma.config.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    })
  }

  const cronScheduleKey = ConfigKey.LECTURER_DEADLINE_CRON_SCHEDULE
  const cronScheduleTonTai = await prisma.config.findUnique({ where: { key: cronScheduleKey } })
  if (!cronScheduleTonTai) {
    await prisma.config.create({
      data: {
        key: cronScheduleKey,
        value: JSON.stringify({
          enabled: true,
          hours: [0, 12],
          timezone: "Asia/Ho_Chi_Minh",
        }),
      },
    })
  }

  await prisma.defaultCouncilRolePayAmount.createMany({
    skipDuplicates: true,
    data: [
      {
        role: $Enums.CouncilRole.CHAIRMAN,
        amount: 200000,
      },
      {
        role: $Enums.CouncilRole.SECRETARY,
        amount: 150000,
      },
      {
        role: $Enums.CouncilRole.REVIEWER_1,
        amount: 150000,
      },
      {
        role: $Enums.CouncilRole.REVIEWER_2,
        amount: 150000,
      },
      {
        role: $Enums.CouncilRole.MEMBER,
        amount: 100000,
      },
    ],
  })

  await prisma.lecturerType.createMany({
    skipDuplicates: true,
    data: [{ name: "Cơ hữu" }, { name: "Thuê ngoài" }],
  })

  // // Seed TrainingObjectType
  // await prisma.trainingObjectType.createMany({
  //   skipDuplicates: true,
  //   data: [
  //     {
  //       id: "550e8402-e29b-41d4-a716-446655440000",
  //       name: "Đại học quân sự",
  //       code: "QS",
  //       type: $Enums.TrainingObjectTypes.MILITARY,
  //       createdAt: new Date("2025-04-03T12:58:40.507Z"),
  //       updatedAt: new Date("2025-04-03T12:58:40.507Z"),
  //     },
  //     {
  //       id: "550e8402-e29b-41d4-a716-446655440001",
  //       name: "Đại học dân sự",
  //       code: "DS",
  //       type: $Enums.TrainingObjectTypes.CIVILIAN,
  //       createdAt: new Date("2025-04-03T12:58:41.507Z"),
  //       updatedAt: new Date("2025-04-03T12:58:41.507Z"),
  //     },
  //   ],
  // })

  // // Seed TrainingType
  // await prisma.trainingType.createMany({
  //   skipDuplicates: true,
  //   data: [
  //     {
  //       id: "550e8403-e29b-41d4-a716-446655440000",
  //       name: "Chính quy",
  //       code: "CQ",
  //       createdAt: new Date("2025-04-03T12:58:40.507Z"),
  //       updatedAt: new Date("2025-04-03T12:58:40.507Z"),
  //     },
  //     {
  //       id: "550e8403-e29b-41d4-a716-446655440001",
  //       name: "Không chính quy",
  //       code: "KCQ",
  //       createdAt: new Date("2025-04-03T12:58:41.507Z"),
  //       updatedAt: new Date("2025-04-03T12:58:41.507Z"),
  //     },
  //     {
  //       id: "550e8403-e29b-41d4-a716-446655440002",
  //       name: "Từ xa",
  //       code: "TX",
  //       createdAt: new Date("2025-04-03T12:58:42.507Z"),
  //       updatedAt: new Date("2025-04-03T12:58:42.507Z"),
  //     },
  //     {
  //       id: "550e8403-e29b-41d4-a716-446655440003",
  //       name: "Tại chức",
  //       code: "TC",
  //       createdAt: new Date("2025-04-03T12:58:43.507Z"),
  //       updatedAt: new Date("2025-04-03T12:58:43.507Z"),
  //     },
  //   ],
  // })

  // // Seed TrainingLevel
  // await prisma.trainingLevel.createMany({
  //   skipDuplicates: true,
  //   data: [
  //     {
  //       id: "550e8404-e29b-41d4-a716-446655440000",
  //       name: "Đại học",
  //       code: "ĐH",
  //       createdAt: new Date("2025-04-03T12:58:40.507Z"),
  //       updatedAt: new Date("2025-04-03T12:58:40.507Z"),
  //     },
  //     {
  //       id: "550e8404-e29b-41d4-a716-446655440001",
  //       name: "Thạc sĩ",
  //       code: "ThS",
  //       createdAt: new Date("2025-04-03T12:58:41.507Z"),
  //       updatedAt: new Date("2025-04-03T12:58:41.507Z"),
  //     },
  //     {
  //       id: "550e8404-e29b-41d4-a716-446655440002",
  //       name: "Tiến sĩ",
  //       code: "TS",
  //       createdAt: new Date("2025-04-03T12:58:42.507Z"),
  //       updatedAt: new Date("2025-04-03T12:58:42.507Z"),
  //     },
  //   ],
  // })

  // await prisma.trainingTime.createMany({
  //   data: [
  //     {
  //       id: "4years",
  //       name: "4 năm",
  //     },
  //     {
  //       id: "5years",
  //       name: "5 năm",
  //     },
  //   ],
  //   skipDuplicates: true,
  // })

  // // Seed TrainingForm
  // await prisma.trainingForm.createMany({
  //   skipDuplicates: true,
  //   data: [
  //     {
  //       id: "550e8405-e29b-41d4-a716-446655440000",
  //       name: "Trực tiếp",
  //       code: "TT",
  //       createdAt: new Date("2025-04-03T12:58:40.507Z"),
  //       updatedAt: new Date("2025-04-03T12:58:40.507Z"),
  //     },
  //     {
  //       id: "550e8405-e29b-41d4-a716-446655440001",
  //       name: "Trực tuyến",
  //       code: "TTY",
  //       createdAt: new Date("2025-04-03T12:58:41.507Z"),
  //       updatedAt: new Date("2025-04-03T12:58:41.507Z"),
  //     },
  //     {
  //       id: "550e8405-e29b-41d4-a716-446655440002",
  //       name: "Kết hợp",
  //       code: "KH",
  //       createdAt: new Date("2025-04-03T12:58:42.507Z"),
  //       updatedAt: new Date("2025-04-03T12:58:42.507Z"),
  //     },
  //   ],
  // })

  // await seedSchoolYear()
  // const semester = await prisma.semester.findFirstOrThrow({
  //   orderBy: { startDate: "asc" },
  // })

  // await prisma.trainingCourse.create({
  //   data: {
  //     code: "K59",
  //     name: "Khoá 59",
  //     description: "Khoá 59 Quân sự",
  //     createdAt: new Date(),
  //     updatedAt: new Date(),
  //     semesterStartId: semester.id,
  //     trainingObjectTypeId: "550e8402-e29b-41d4-a716-446655440000", // Quân sự
  //     coef_1: 0.1,
  //     coef_2: 0.3,
  //     coef_3: 0.6,
  //     scoreToPass: 4,
  //     scoreToTakeExam: 4,
  //     baseScore: "Base10",
  //   },
  // })

  const trainingCourses = await prisma.trainingCourse.findMany({
    where: {
      scoreConverts: { none: {} },
      academicRankingConvert: { none: {} },
    },
    select: {
      id: true,
      baseScore: true,
    },
  })

  await Promise.all(
    trainingCourses.map((trainingCourse) =>
      prisma.scoreConvert.createMany({
        data: scoreConversions.map((scoreConversion) => ({
          ...scoreConversion,
          trainingCourseId: trainingCourse.id,
        })),
      })
    )
  )

  await Promise.all(
    trainingCourses
      .filter(({ baseScore }) => baseScore === AcademicRankingBaseType.Base10)
      .map((trainingCourse) =>
        prisma.academicRankingConvert.createMany({
          skipDuplicates: true,
          data: [...academicRankingGraduationMilitary, ...academicRankingStudying].map(
            (conversion) => ({
              trainingCourseId: trainingCourse.id,
              ...conversion,
            })
          ),
        })
      )
  )

  await Promise.all(
    trainingCourses
      .filter(({ baseScore }) => baseScore === AcademicRankingBaseType.Base4)
      .map((trainingCourse) =>
        prisma.academicRankingConvert.createMany({
          skipDuplicates: true,
          data: [...academicRankingGraduationCivilian, ...academicRankingStudying].map(
            (conversion) => ({
              trainingCourseId: trainingCourse.id,
              ...conversion,
            })
          ),
        })
      )
  )

  const ranks = await prisma.academicRankingConvert.findMany({
    where: { rankOrder: { in: [1, 2] } },
    select: { id: true },
  })

  await seedSystemCriteriaDefinitions(prisma)

  for (const rank of ranks) {
    await prisma.graduationRankDowngradeRule.create({
      data: {
        initialRankId: rank.id,
        conditions: {
          create: {
            criteriaId: systemCriteriaId("CONDUCT_SCORE"),
            operator: "LT",
            value: 8,
          },
        },
      },
    })
  }

  // Seed TemplateFile
  // await prisma.templateFile.createMany({
  //   skipDuplicates: true,
  //   data: [
  //     {
  //       id: "550e8408-e29b-41d4-a716-446655440000",
  //       name: "File nhập thông tin học viên mới",
  //       code: "IMPORT_USERPROFILE",
  //       path: "https://minio.swantech.vn/mta/template/fileNhapMauThongTinHocVien.xlsx",
  //       fileType: "UPLOAD",
  //       extensions: "xlsx",
  //       numberField: 0,
  //     },
  //     {
  //       id: "550e8408-e29b-41d4-a716-446655440001",
  //       name: "File cập nhập thông tin người dùng",
  //       code: "UPDATE_USERPROFILE",
  //       path: "https://minio.swantech.vn/mta/template/fileCapNhatThongTin.xlsx",
  //       fileType: "UPLOAD",
  //       extensions: "xlsx",
  //       numberField: 0,
  //     },
  //     {
  //       id: "550e8408-e29b-41d4-a716-446655440002",
  //       name: "File tạo lớp biên chế",
  //       code: "IMPORT_FIXCLASS",
  //       path: "https://minio.swantech.vn/mta/template/fileDanhSachLopBienChe.xlsx",
  //       fileType: "UPLOAD",
  //       extensions: "xlsx",
  //       numberField: 0,
  //     },
  //     {
  //       id: "550e8408-e29b-41d4-a716-446655440003",
  //       name: "File xếp lớp",
  //       code: "CLASS_DEVISION",
  //       createdAt: new Date("2025-04-03T12:58:43.507Z"),
  //       updatedAt: new Date("2025-04-03T12:58:40.507Z"),
  //       path: "https://minio.swantech.vn/mta/template/fileXepLopHocVien.xlsx",
  //       fileType: "UPLOAD",
  //       extensions: "xlsx",
  //       numberField: 0,
  //     },
  //     {
  //       id: "550e8408-e29b-41d4-a716-446655440004",
  //       name: "File danh sách học viên lớp",
  //       code: "LIST_STUDENT_FIXCLASS",
  //       path: "https://minio.swantech.vn/mta/template/DanhSachHocVienLop.docx",
  //       fileType: "DOWNLOAD",
  //       extensions: "docx",
  //       numberField: 0,
  //     },
  //     {
  //       id: "550e8408-e29b-41d4-a716-446655440005",
  //       name: "Báo cáo khảo sát",
  //       code: "SURVEY_RP",
  //       path: "https://minio.swantech.vn/mta/template/BaoCaoKhaoSat.docx",
  //       fileType: "DOWNLOAD",
  //       extensions: "docx",
  //       numberField: 0,
  //     },
  //     {
  //       id: "550e8408-e29b-41d4-a716-446655440006",
  //       name: "Báo cáo khảo sát đơn vị",
  //       code: "SURVEY_RP_DONVI",
  //       path: "https://minio.swantech.vn/mta/template/BaoCaoKhaoSat_DonVi.docx",
  //       fileType: "DOWNLOAD",
  //       extensions: "docx",
  //       numberField: 0,
  //     },
  //     {
  //       name: "Danh sách báo dạy",
  //       code: "LECTURE_PCGD",
  //       path: "https://minio.swantech.vn/mta/template/DanhSachBaoDay.xlsx",
  //       fileType: "DOWNLOAD",
  //       extensions: "docx",
  //       numberField: 0,
  //     },
  //     {
  //       name: "Thống kê nợ môn",
  //       code: "THONG_KE_NO",
  //       path: "https://minio.swantech.vn/mta/template/thong_ke_no.xlsx",
  //       fileType: "DOWNLOAD",
  //       extensions: "xlsx",
  //       numberField: 0,
  //     },
  //     {
  //       name: "Thống kê quân số học viên theo khoá",
  //       code: "THONG_KE_QUAN_SO_HOC_VIEN_THEO_KHOA",
  //       path: "https://minio.swantech.vn/mta/template/quan_so_hoc_vien_theo_khoa.xlsx",
  //       fileType: "DOWNLOAD",
  //       extensions: "xlsx",
  //       numberField: 0,
  //     },
  //     {
  //       name: "Thống kê khảo sát đơn",
  //       code: "THONG_KE_KHAO_SAT_DON",
  //       path: "https://minio.swantech.vn/mta/template/thong_ke_khao_sat_don.xlsx",
  //       fileType: "DOWNLOAD",
  //       extensions: "xlsx",
  //       numberField: 0,
  //     },
  //     {
  //       name: "Thống kê khảo sát cụm",
  //       code: "THONG_KE_KHAO_SAT_CUM",
  //       path: "https://minio.swantech.vn/mta/template/thong_ke_khao_sat_cum.xlsx",
  //       fileType: "DOWNLOAD",
  //       extensions: "xlsx",
  //       numberField: 0,
  //     },
  //     {
  //       name: "Danh sách giảng viên",
  //       code: "DANH_SACH_GV",
  //       path: "https://minio.swantech.vn/mta/template/danh_sach_GV.xlsx",
  //       fileType: "DOWNLOAD",
  //       extensions: "xlsx",
  //       numberField: 0,
  //     },
  //     {
  //       name: "Danh sách giảng viên",
  //       code: "DANH_SACH_TOT_NGHIEP",
  //       path: "https://minio.swantech.vn/mta/template/DANH_SACH_TOT_NGHIEP.xlsx",
  //       fileType: "DOWNLOAD",
  //       extensions: "xlsx",
  //       numberField: 0,
  //     },
  //     {
  //       name: "Kết quả xác minh văn bằng",
  //       code: "XAC_MINH_VAN_BANG",
  //       path: "https://minio.swantech.vn/mta/template/XAC_MINH_VAN_BANG.xlsx",
  //       fileType: "DOWNLOAD",
  //       extensions: "xlsx",
  //       numberField: 0,
  //     },
  //     {
  //       name: "slide tốt nghiệp",
  //       code: "SLIDE_TN",
  //       path: "https://minio.swantech.vn/mta/template/slide_TN.pptx",
  //       fileType: "DOWNLOAD",
  //       extensions: "xlsx",
  //       numberField: 0,
  //     },
  //     {
  //       name: "Danh sách sinh viên",
  //       code: "DANH_SACH_SV",
  //       path: "https://minio.swantech.vn/mta/template/DANH_SACH_SV.xlsx",
  //       fileType: "DOWNLOAD",
  //       extensions: "xlsx",
  //       numberField: 0,
  //     },
  //     {
  //       name: "Thống kê điểm thưởng",
  //       code: "THONG_KE_DIEM_THUONG",
  //       path: "https://minio.swantech.vn/mta/template/THONG_KE_DIEM_THUONG.xlsx",
  //       fileType: "DOWNLOAD",
  //       extensions: "xlsx",
  //       numberField: 0,
  //     },
  //   ],
  // })

  // // Seed PriorityObject
  // await prisma.priorityObject.createMany({
  //   skipDuplicates: true,
  //   data: [
  //     {
  //       id: "550e8409-e29b-41d4-a716-446655440000",
  //       name: "Đối tượng 1",
  //       code: "DOITUONG1",
  //       createdAt: new Date("2025-04-03T12:58:44.507Z"),
  //       updatedAt: new Date("2025-04-03T12:58:40.507Z"),
  //     },
  //     {
  //       id: "550e8409-e29b-41d4-a716-446655440001",
  //       name: "Đối tượng 2",
  //       code: "DOITUONG2",
  //       createdAt: new Date("2025-04-03T12:58:45.507Z"),
  //       updatedAt: new Date("2025-04-03T12:58:40.507Z"),
  //     },
  //     {
  //       id: "550e8409-e29b-41d4-a716-446655440002",
  //       name: "Đối tượng 3",
  //       code: "DOITUONG3",
  //       createdAt: new Date("2025-04-03T12:58:46.507Z"),
  //       updatedAt: new Date("2025-04-03T12:58:40.507Z"),
  //     },
  //   ],
  // })

  // Seed TrainingLocation
  // await prisma.trainingLocation.createMany({
  //   skipDuplicates: true,
  //   data: [
  //     {
  //       id: "550e840f-e29b-41d4-a716-446655440000",
  //       name: "Khu A",
  //       code: "A",
  //       createdAt: new Date("2025-04-03T12:59:07.507Z"),
  //       updatedAt: new Date("2025-04-03T12:58:40.507Z"),
  //     },
  //     {
  //       id: "550e840f-e29b-41d4-a716-446655440001",
  //       name: "Xuân Phương",
  //       code: "XP",
  //       createdAt: new Date("2025-04-03T12:59:08.507Z"),
  //       updatedAt: new Date("2025-04-03T12:58:40.507Z"),
  //     },
  //     {
  //       id: "550e840f-e29b-41d4-a716-446655440002",
  //       name: "Vĩnh Phúc",
  //       code: "VP",
  //       createdAt: new Date("2025-04-03T12:59:09.507Z"),
  //       updatedAt: new Date("2025-04-03T12:58:40.507Z"),
  //     },
  //   ],
  // })

  await prisma.diplomaType.createMany({
    skipDuplicates: true,
    data: [
      {
        name: "BẰNG KỸ SƯ",
        englishName: "THE DEGREE OF ENGINEER",
        code: "BS",
        type: $Enums.DiplomaTypeEnum.ENGINEER,
      },
      {
        name: "BẰNG CỬ NHÂN",
        englishName: "THE DEGREE OF BACHELOR",
        code: "BC",
        type: $Enums.DiplomaTypeEnum.BACHELOR,
      },
      {
        name: "BẰNG THẠC SĨ",
        englishName: "THE DEGREE OF MASTER",
        code: "BThS",
        type: $Enums.DiplomaTypeEnum.MASTER,
      },
      {
        name: "BẰNG TIẾN SĨ",
        englishName: "THE DEGREE OF DOCTORATE",
        code: "BTS",
        type: $Enums.DiplomaTypeEnum.DOCTORATE,
      },
    ],
  })

  // const firstOrg = await prisma.dM_DonVi.findFirstOrThrow()
  // await prisma.trainingField.createMany({
  //   data: trainingData.map(({ id, trainingField }) => ({
  //     id,
  //     name: trainingField,
  //     englishName: trainingField,
  //     organizationId: firstOrg?.Id,
  //     publishDate: new Date(),
  //   })),
  //   skipDuplicates: true,
  // })

  // await prisma.trainingMajor.createMany({
  //   data: trainingData.flatMap(({ id: trainingFieldId, trainingMajors }) =>
  //     trainingMajors.map(({ id, trainingMajor }) => ({
  //       id,
  //       name: trainingMajor,
  //       organizationId: firstOrg.Id,
  //       summary: "",
  //       trainingFieldId,
  //     }))
  //   ),
  //   skipDuplicates: true,
  // })

  // await prisma.curriculum.createMany({
  //   data: trainingData.flatMap(({ id: trainingFieldId, trainingMajors }) =>
  //     trainingMajors.map(({ id, trainingMajor }) => ({
  //       id,
  //       name: trainingMajor,
  //       managementOrganizationId: firstOrg.Id,
  //       trainingMajorId: id,
  //       trainingObjectTypeId: "550e8402-e29b-41d4-a716-446655440000",
  //     }))
  //   ),
  //   skipDuplicates: true,
  // })

  // await prisma.curriculumVersion.createMany({
  //     data: trainingData.flatMap(({ id: trainingFieldId, trainingMajors }) =>
  //         trainingMajors.flatMap(({ id: trainingMajorId, curriculums }) =>
  //             curriculums.map((curriculum) => ({
  //                 curriculumId: trainingMajorId,
  //                 name: curriculum,
  //                 trainingLevelId: '550e8404-e29b-41d4-a716-446655440000',
  //                 trainingObjectTypeId: '550e8402-e29b-41d4-a716-446655440000',
  //                 trainingTimeId: '4years',
  //                 trainingTypeId: '550e8403-e29b-41d4-a716-446655440000',
  //                 diplomaTypeId: '550e8406-e29b-41d4-a716-446655440000',
  //             }))
  //         )
  //     ),
  //     skipDuplicates: true,
  // })

  // const _curriculum = await prisma.curriculum.create({
  //   data: {
  //     name: "Công nghệ thông tin seed",
  //     code: "CNTT-2023",
  //     information: "Công nghệ thông tin là ngành học về máy tính và công nghệ thông tin.",
  //     description:
  //       "Chương trình đào tạo Công nghệ thông tin cung cấp kiến thức và kỹ năng về lập trình, quản trị hệ thống, và phát triển phần mềm.",
  //     managementOrganization: { connect: { Id: firstOrg.Id } },
  //     trainingObjectType: { connect: { id: "550e8402-e29b-41d4-a716-446655440000" } },
  //     trainingMajor: {
  //       create: {
  //         name: "Công nghệ thông tin seed",
  //         code: "CNTT",
  //         englishName: "Information Technology",
  //         description:
  //           "Chuyên ngành Công nghệ thông tin tập trung vào phát triển phần mềm và quản trị hệ thống.",
  //         summary:
  //           "Chuyên ngành Công nghệ thông tin cung cấp kiến thức về lập trình, cơ sở dữ liệu, và mạng máy tính.",
  //         organization: { connect: { Id: firstOrg.Id } },
  //         trainingField: {
  //           create: {
  //             name: "Công nghệ thông tin seed",
  //             englishName: "Information Technology",
  //             publishDate: new Date(),
  //             organization: {
  //               connect: { Id: firstOrg.Id },
  //             },
  //           },
  //         },
  //       },
  //     },

  //     curriculumVersion: {
  //       create: {
  //         name: "Công nghệ thông tin 2023 seed",
  //         code: "CNTT-DS-2023",
  //         numberOfSemesters: 10,
  //         trainingType: {
  //           connect: {
  //             id: "550e8403-e29b-41d4-a716-446655440000",
  //           },
  //         },
  //         trainingObjectType: {
  //           connectOrCreate: {
  //             where: { name: "Đại học quân sự" },
  //             create: {
  //               name: "Đại học quân sự",
  //               type: $Enums.TrainingObjectTypes.MILITARY,
  //             },
  //           },
  //         },
  //         trainingLevel: {
  //           connectOrCreate: {
  //             where: { name: "Đại học" },
  //             create: { name: "Đại học" },
  //           },
  //         },
  //         trainingTime: {
  //           connectOrCreate: {
  //             where: { id: "4years" },
  //             create: { name: "4 năm" },
  //           },
  //         },
  //         diplomaType: {
  //           connect: { code: "BS" },
  //         },
  //       },
  //     },
  //   },
  // })

  seedScholarshipCriteria()
  seedAcademicActionConfig()
  seedAcademicWarningRule()
}

main()
  .catch((e) => {
    console.error(e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
