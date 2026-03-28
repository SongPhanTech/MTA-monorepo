import { createId } from "@paralleldrive/cuid2"
import { CriteriaField, CriteriaOperator, PrismaClient } from "../../generated/prisma-client"

const prisma = new PrismaClient()

export async function seedScholarshipCriteria() {
  console.log("Bắt đầu seed tiêu chí học bổng...")

  // --- Lấy ID của các khoá học Dân sự và Quân sự (giả sử đã có) ---
  const civilianCourse = await prisma.trainingCourse.findMany({
    where: { trainingObjectType: { type: "CIVILIAN" }, scholarships: { none: {} } },
  })

  const militaryCourse = await prisma.trainingCourse.findMany({
    where: { trainingObjectType: { type: "MILITARY" }, scholarships: { none: {} } },
  })

  // =================================================================
  // == TIÊU CHÍ HỌC BỔNG KHUYẾN KHÍCH HỌC TẬP - HỆ DÂN SỰ ==
  // =================================================================
  const civilianScholarships = [
    {
      name: "Học bổng KKHT loại Xuất sắc - Dân sự",
      rankOrder: 1,
      criteria: [
        // Tiêu chí riêng
        { field: CriteriaField.SEMESTER_GPA, operator: CriteriaOperator.GTE, value: 3.6 },
        { field: CriteriaField.CONDUCT_SCORE, operator: CriteriaOperator.GTE, value: 4 }, // Rèn luyện Xuất sắc
        // Tiêu chí chung
        {
          field: CriteriaField.COURSE_GRADE_LOWEST,
          operator: CriteriaOperator.GTE,
          value: 1.0,
        }, // Điểm D (hệ 4) trở lên
        {
          field: CriteriaField.SEMESTER_REGISTERED_CREDITS,
          operator: CriteriaOperator.GTE,
          value: 15,
        },
        {
          field: CriteriaField.DISCIPLINARY_WARNING_LEVEL,
          operator: CriteriaOperator.LTE,
          value: 0,
        }, // Không bị kỷ luật từ khiển trách
        {
          field: CriteriaField.HAS_PASSED_FOREIGN_LANGUAGE,
          operator: CriteriaOperator.EQ,
          value: 1,
        }, // 1 = true
      ],
    },
    {
      name: "Học bổng KKHT loại Giỏi - Dân sự",
      rankOrder: 2,
      criteria: [
        { field: CriteriaField.SEMESTER_GPA, operator: CriteriaOperator.GTE, value: 3.2 },
        { field: CriteriaField.CONDUCT_SCORE, operator: CriteriaOperator.GTE, value: 3 }, // Rèn luyện Tốt trở lên
        {
          field: CriteriaField.COURSE_GRADE_LOWEST,
          operator: CriteriaOperator.GTE,
          value: 1.0,
        },
        {
          field: CriteriaField.SEMESTER_REGISTERED_CREDITS,
          operator: CriteriaOperator.GTE,
          value: 15,
        },
        {
          field: CriteriaField.DISCIPLINARY_WARNING_LEVEL,
          operator: CriteriaOperator.LTE,
          value: 0,
        },
        {
          field: CriteriaField.HAS_PASSED_FOREIGN_LANGUAGE,
          operator: CriteriaOperator.EQ,
          value: 1,
        },
      ],
    },
    {
      name: "Học bổng KKHT loại Khá - Dân sự",
      rankOrder: 3,
      criteria: [
        { field: CriteriaField.SEMESTER_GPA, operator: CriteriaOperator.GTE, value: 2.5 },
        { field: CriteriaField.CONDUCT_SCORE, operator: CriteriaOperator.GTE, value: 2 }, // Rèn luyện Khá trở lên
        {
          field: CriteriaField.COURSE_GRADE_LOWEST,
          operator: CriteriaOperator.GTE,
          value: 1.0,
        },
        {
          field: CriteriaField.SEMESTER_REGISTERED_CREDITS,
          operator: CriteriaOperator.GTE,
          value: 15,
        },
        {
          field: CriteriaField.DISCIPLINARY_WARNING_LEVEL,
          operator: CriteriaOperator.LTE,
          value: 0,
        },
        {
          field: CriteriaField.HAS_PASSED_FOREIGN_LANGUAGE,
          operator: CriteriaOperator.EQ,
          value: 1,
        },
      ],
    },
  ]

  // =================================================================
  // == TIÊU CHÍ HỌC BỔNG - HỆ QUÂN SỰ ==
  // =================================================================
  const militaryScholarships = [
    {
      name: "Học bổng Lê Quý Đôn - Quân sự",
      rankOrder: 1,
      criteria: [
        { field: CriteriaField.SEMESTER_GPA, operator: CriteriaOperator.GTE, value: 9.0 },
        {
          field: CriteriaField.COURSE_GRADE_LOWEST,
          operator: CriteriaOperator.GTE,
          value: 7.0,
        },
        { field: CriteriaField.CONDUCT_SCORE, operator: CriteriaOperator.GTE, value: 3 }, // Rèn luyện Tốt
        {
          field: CriteriaField.SEMESTER_REGISTERED_CREDITS,
          operator: CriteriaOperator.GTE,
          value: 10,
        },
        {
          field: CriteriaField.HAS_PASSED_FOREIGN_LANGUAGE,
          operator: CriteriaOperator.EQ,
          value: 1,
        },
      ],
    },
    {
      name: "Học bổng loại A - Quân sự",
      rankOrder: 2,
      criteria: [
        { field: CriteriaField.SEMESTER_GPA, operator: CriteriaOperator.GTE, value: 8.5 },
        { field: CriteriaField.SEMESTER_GPA, operator: CriteriaOperator.LTE, value: 9 }, // <= 8.99
        {
          field: CriteriaField.COURSE_GRADE_LOWEST,
          operator: CriteriaOperator.GTE,
          value: 7.0,
        },
        { field: CriteriaField.CONDUCT_SCORE, operator: CriteriaOperator.GTE, value: 3 },
        {
          field: CriteriaField.SEMESTER_REGISTERED_CREDITS,
          operator: CriteriaOperator.GTE,
          value: 10,
        },
        {
          field: CriteriaField.HAS_PASSED_FOREIGN_LANGUAGE,
          operator: CriteriaOperator.EQ,
          value: 1,
        },
      ],
    },
    {
      name: "Học bổng loại B - Quân sự",
      rankOrder: 3,
      criteria: [
        { field: CriteriaField.SEMESTER_GPA, operator: CriteriaOperator.GTE, value: 8.0 },
        { field: CriteriaField.SEMESTER_GPA, operator: CriteriaOperator.LTE, value: 8.5 }, // <= 8.49
        {
          field: CriteriaField.COURSE_GRADE_LOWEST,
          operator: CriteriaOperator.GTE,
          value: 7.0,
        },
        { field: CriteriaField.CONDUCT_SCORE, operator: CriteriaOperator.GTE, value: 3 },
        {
          field: CriteriaField.SEMESTER_REGISTERED_CREDITS,
          operator: CriteriaOperator.GTE,
          value: 10,
        },
        {
          field: CriteriaField.HAS_PASSED_FOREIGN_LANGUAGE,
          operator: CriteriaOperator.EQ,
          value: 1,
        },
      ],
    },
  ]

  for (const course of civilianCourse) {
    const scholarships = civilianScholarships.map((item) => ({
      id: createId(),
      ...item,
    }))

    await prisma.scholarship.createMany({
      skipDuplicates: true,
      data: scholarships.map(({ id, name, rankOrder }) => ({
        id,
        name,
        rankOrder,
        trainingCourseId: course.id,
        baseAmount: 1000,
      })),
    })

    await prisma.scholarshipCriteria.createMany({
      skipDuplicates: true,
      data: scholarships.flatMap((scholarship) =>
        scholarship.criteria.map((criterion) => ({
          ...criterion,
          scholarshipId: scholarship.id,
        }))
      ),
    })
  }

  for (const course of militaryCourse) {
    const scholarships = militaryScholarships.map((item) => ({
      id: createId(),
      ...item,
    }))

    await prisma.scholarship.createMany({
      skipDuplicates: true,
      data: scholarships.map(({ id, name, rankOrder }) => ({
        id,
        name,
        rankOrder,
        trainingCourseId: course.id,
        baseAmount: 1000,
      })),
    })

    await prisma.scholarshipCriteria.createMany({
      skipDuplicates: true,
      data: scholarships.flatMap((scholarship) =>
        scholarship.criteria.map((criterion) => ({
          ...criterion,
          scholarshipId: scholarship.id,
        }))
      ),
    })
  }

  console.log("Seed tiêu chí học bổng hoàn tất.")
}
