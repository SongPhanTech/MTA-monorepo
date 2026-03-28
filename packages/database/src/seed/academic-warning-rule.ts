import {
  CriteriaField,
  CriteriaOperator,
  PrismaClient,
  type TrainingCourse,
} from "../../generated/prisma-client"

const prisma = new PrismaClient()

// Định nghĩa các quy tắc cảnh báo cho hệ Dân sự
const civilianWarningRules = [
  // --- Tăng 1 mức cảnh báo (severity: 1) ---
  {
    field: CriteriaField.FAILED_CREDITS_PERCENT,
    operator: CriteriaOperator.GTE,
    threshold: 50, // Tỷ lệ tín chỉ không đạt > 50%
    severity: 1,
  },
  {
    field: CriteriaField.CUMULATIVE_DEBT_CREDITS,
    operator: CriteriaOperator.GTE,
    threshold: 24, // Nợ đọng > 24 tín chỉ
    severity: 1,
  },
  {
    field: CriteriaField.SEMESTER_GPA,
    operator: CriteriaOperator.LTE,
    threshold: 0.8, // ĐTB học kỳ < 0.8
    severity: 1,
    yearCondition: 1, // Áp dụng cho năm thứ nhất
    semesterCondition: 1, // Áp dụng cho học kỳ đầu tiên
  },
  {
    field: CriteriaField.SEMESTER_GPA,
    operator: CriteriaOperator.LTE,
    threshold: 1.0, // ĐTB học kỳ < 1.0 (cho các kỳ sau)
    severity: 1,
  },
  {
    field: CriteriaField.CUMULATIVE_GPA,
    operator: CriteriaOperator.LTE,
    threshold: 1.2, // ĐTB tích lũy < 1.2
    severity: 1,
    yearCondition: 1,
  },
  {
    field: CriteriaField.CUMULATIVE_GPA,
    operator: CriteriaOperator.LTE,
    threshold: 1.4,
    severity: 1,
    yearCondition: 2,
  },
  {
    field: CriteriaField.CUMULATIVE_GPA,
    operator: CriteriaOperator.LTE,
    threshold: 1.6,
    severity: 1,
    yearCondition: 3,
  },
  {
    field: CriteriaField.CUMULATIVE_GPA,
    operator: CriteriaOperator.LTE,
    threshold: 1.8,
    severity: 1,
    yearCondition: 4,
  },
  // --- Tăng 2 mức cảnh báo (severity: 2) ---
  {
    field: CriteriaField.SEMESTER_GPA,
    operator: CriteriaOperator.EQ,
    threshold: 0, // ĐTB học kỳ = 0
    severity: 2,
  },
  {
    field: CriteriaField.HAS_REGISTERED_FOR_SEMESTER,
    operator: CriteriaOperator.EQ,
    threshold: 0, // Không đăng ký học tập (false)
    severity: 2,
  },
]

// Định nghĩa các quy tắc cảnh báo cho hệ Quân sự
const militaryWarningRules = [
  // --- Tăng 1 mức cảnh báo (severity: 1) ---
  {
    field: CriteriaField.SEMESTER_GPA,
    operator: CriteriaOperator.LTE,
    threshold: 4.0, // ĐTB học kỳ < 4.0
    severity: 1,
  },
  {
    field: CriteriaField.YEAR_FAILED_CREDITS,
    operator: CriteriaOperator.GTE,
    threshold: 6, // Nợ trong năm > 6 tín chỉ
    severity: 1,
  },
  {
    field: CriteriaField.CUMULATIVE_DEBT_CREDITS,
    operator: CriteriaOperator.GTE,
    threshold: 10, // Nợ tích lũy > 10 tín chỉ
    severity: 1,
  },
  {
    field: CriteriaField.CUMULATIVE_GPA,
    operator: CriteriaOperator.LTE,
    threshold: 4.6,
    severity: 1,
    yearCondition: 1,
  },
  {
    field: CriteriaField.CUMULATIVE_GPA,
    operator: CriteriaOperator.LTE,
    threshold: 5.0,
    severity: 1,
    yearCondition: 2,
  },
  {
    field: CriteriaField.CUMULATIVE_GPA,
    operator: CriteriaOperator.LTE,
    threshold: 5.2,
    severity: 1,
    yearCondition: 3,
  },
  {
    field: CriteriaField.CUMULATIVE_GPA,
    operator: CriteriaOperator.LTE,
    threshold: 5.4,
    severity: 1,
    yearCondition: 4,
  },
]

// Hàm chung để xử lý seed
async function seedRulesForCourses(courses: TrainingCourse[], rules: any[]) {
  if (courses.length === 0) return

  // Xóa tất cả các quy tắc cũ thuộc các khoá học này
  await prisma.academicWarningRule.deleteMany({
    where: {
      trainingCourseId: {
        in: courses.map((course) => course.id),
      },
    },
  })

  // Chuẩn bị dữ liệu mới
  const dataToCreate = courses.flatMap((course) =>
    rules.map((rule) => ({
      ...rule,
      trainingCourseId: course.id,
    }))
  )

  // Tạo mới hàng loạt
  await prisma.academicWarningRule.createMany({
    data: dataToCreate,
  })

  console.log(
    `Đã seed ${dataToCreate.length} quy tắc Cảnh báo học tập cho ${courses.length} khoá học.`
  )
}

// Hàm main để chạy seeder
export async function seedAcademicWarningRule() {
  console.log("Bắt đầu seed quy tắc Cảnh báo học tập...")
  try {
    // Lấy tất cả các khoá học dân sự và quân sự
    const civilianCourses = await prisma.trainingCourse.findMany({
      where: { trainingObjectType: { type: "CIVILIAN" }, academicWarningRule: { none: {} } },
    })
    const militaryCourses = await prisma.trainingCourse.findMany({
      where: { trainingObjectType: { type: "MILITARY" }, academicWarningRule: { none: {} } },
    })

    // Chạy seed
    await seedRulesForCourses(civilianCourses, civilianWarningRules)
    await seedRulesForCourses(militaryCourses, militaryWarningRules)

    console.log("Seed quy tắc Cảnh báo học tập hoàn tất.")
  } catch (error) {
    console.error("Lỗi khi seed quy tắc Cảnh báo học tập:", error)
  } finally {
    await prisma.$disconnect()
  }
}

// Chạy hàm main
// seedAcademicWarningRule()
