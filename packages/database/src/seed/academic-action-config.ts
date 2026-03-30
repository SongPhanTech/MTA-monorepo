import {
  AcademicActionType,
  CriteriaField,
  CriteriaOperator,
  type Prisma,
  PrismaClient,
  type TrainingCourse,
} from "../../generated/prisma-client"

const prisma = new PrismaClient()

type ActionDefinition = {
  name: string
  actionType: AcademicActionType
  ruleSets: Omit<Prisma.AcademicActionConditionUncheckedCreateInput, "ruleSetId">[][]
}

// =================================================================
// == ĐỊNH NGHĨA QUY TẮC XỬ LÝ HỌC TẬP - HỆ DÂN SỰ (Điều 34) ==
// =================================================================
const civilianActionDefs: ActionDefinition[] = [
  // --- Buộc thôi học ---
  {
    name: "Buộc thôi học - Hệ Dân sự",
    actionType: AcademicActionType.EXPULSION,
    ruleSets: [
      // RuleSet 1: Mức CBHT bằng 4
      [
        {
          field: CriteriaField.ACADEMIC_WARNING_LEVEL,
          operator: CriteriaOperator.EQ,
          value: 4,
        },
      ],
      // RuleSet 2: Mức CCHĐ bằng 4
      [
        {
          field: CriteriaField.DISCIPLINARY_WARNING_LEVEL,
          operator: CriteriaOperator.EQ,
          value: 4,
        },
      ],
      // RuleSet 3: CBHT mức 3 VÀ có CCHĐ
      [
        {
          field: CriteriaField.ACADEMIC_WARNING_LEVEL,
          operator: CriteriaOperator.EQ,
          value: 3,
        },
        {
          field: CriteriaField.DISCIPLINARY_WARNING_LEVEL,
          operator: CriteriaOperator.GTE,
          value: 1,
        },
      ],
      // RuleSet 4: CCHĐ mức 3 VÀ có CBHT
      [
        {
          field: CriteriaField.DISCIPLINARY_WARNING_LEVEL,
          operator: CriteriaOperator.EQ,
          value: 3,
        },
        {
          field: CriteriaField.ACADEMIC_WARNING_LEVEL,
          operator: CriteriaOperator.GTE,
          value: 1,
        },
      ],
      // RuleSet 5: Hết thời gian đào tạo
      [
        {
          field: CriteriaField.IS_STUDY_DURATION_EXCEEDED,
          operator: CriteriaOperator.EQ,
          value: 1,
        },
      ], // 1 = true
    ],
  },
  // --- Đình chỉ học tập (ví dụ) ---
  {
    name: "Đình chỉ học tập 1 năm (Thi hộ lần 1) - Hệ Dân sự",
    actionType: AcademicActionType.SUSPENSION,
    ruleSets: [
      // RuleSet này cần logic nghiệp vụ riêng để xác định "thi hộ lần 1",
      // thường được kích hoạt bởi mức CCHĐ đặc biệt.
      // Giả sử CCHĐ tăng 2 mức cho lỗi này.
    ],
  },
]

// =================================================================
// == ĐỊNH NGHĨA QUY TẮC XỬ LÝ HỌC TẬP - HỆ QUÂN SỰ (Điều 29) ==
// =================================================================
const militaryActionDefs = [
  // --- Lưu ban ---
  {
    name: "Lưu ban - Hệ Quân sự",
    actionType: AcademicActionType.REPEAT_YEAR,
    ruleSets: [
      [{ field: CriteriaField.YEARLY_GPA, operator: CriteriaOperator.LTE, value: 5.5 }],
      [
        {
          field: CriteriaField.YEAR_FAILED_CREDITS,
          operator: CriteriaOperator.GTE,
          value: 6,
        },
      ],
      [
        {
          field: CriteriaField.CUMULATIVE_DEBT_CREDITS,
          operator: CriteriaOperator.GTE,
          value: 10,
        },
      ],
      [
        {
          field: CriteriaField.IS_DEBT_SUBJECT_CONSECUTIVE,
          operator: CriteriaOperator.EQ,
          value: 1,
        },
      ],
    ],
  },
  // --- Buộc thôi học ---
  {
    name: "Buộc thôi học - Hệ Quân sự",
    actionType: AcademicActionType.EXPULSION,
    ruleSets: [
      // Các quy tắc giống hệ Dân sự
      [
        {
          field: CriteriaField.ACADEMIC_WARNING_LEVEL,
          operator: CriteriaOperator.EQ,
          value: 4,
        },
      ],
      [
        {
          field: CriteriaField.DISCIPLINARY_WARNING_LEVEL,
          operator: CriteriaOperator.EQ,
          value: 4,
        },
      ],
      [
        {
          field: CriteriaField.ACADEMIC_WARNING_LEVEL,
          operator: CriteriaOperator.EQ,
          value: 3,
        },
        {
          field: CriteriaField.DISCIPLINARY_WARNING_LEVEL,
          operator: CriteriaOperator.GTE,
          value: 1,
        },
      ],
      [
        {
          field: CriteriaField.DISCIPLINARY_WARNING_LEVEL,
          operator: CriteriaOperator.EQ,
          value: 3,
        },
        {
          field: CriteriaField.ACADEMIC_WARNING_LEVEL,
          operator: CriteriaOperator.GTE,
          value: 1,
        },
      ],
      [
        {
          field: CriteriaField.IS_STUDY_DURATION_EXCEEDED,
          operator: CriteriaOperator.EQ,
          value: 1,
        },
      ],
      // Các quy tắc riêng của hệ Quân sự
      [{ field: CriteriaField.SEMESTER_GPA, operator: CriteriaOperator.EQ, value: 0 }],
      [{ field: CriteriaField.YEARLY_GPA, operator: CriteriaOperator.LTE, value: 4.0 }],
      [{ field: CriteriaField.REPEAT_YEAR_COUNT, operator: CriteriaOperator.GTE, value: 2 }],
      // TBTL dưới ngưỡng theo năm
      [
        {
          field: CriteriaField.CUMULATIVE_GPA,
          operator: CriteriaOperator.LTE,
          value: 4.6,
          yearCondition: 1,
        },
      ],
      [
        {
          field: CriteriaField.CUMULATIVE_GPA,
          operator: CriteriaOperator.LTE,
          value: 5.0,
          yearCondition: 2,
        },
      ],
      [
        {
          field: CriteriaField.CUMULATIVE_GPA,
          operator: CriteriaOperator.LTE,
          value: 5.2,
          yearCondition: 3,
        },
      ],
      [
        {
          field: CriteriaField.CUMULATIVE_GPA,
          operator: CriteriaOperator.LTE,
          value: 5.4,
          yearCondition: 4,
        },
      ],
    ],
  },
]

// Hàm main để chạy seeder
export async function seedAcademicActionConfig() {
  console.log("Bắt đầu seed cấu hình Xử lý học tập...")
  try {
    const civilianCourses = await prisma.trainingCourse.findMany({
      where: { trainingObjectType: { type: "CIVILIAN" }, academicActionConfig: { none: {} } },
    })
    const militaryCourses = await prisma.trainingCourse.findMany({
      where: { trainingObjectType: { type: "MILITARY" }, academicActionConfig: { none: {} } },
    })

    // Hàm chung để xử lý seed
    const seedActionsForCourse = async (
      course: TrainingCourse,
      definitions: ActionDefinition[]
    ) => {
      for (const def of definitions) {
        // 1. Upsert cấu hình hành động chính
        const config = await prisma.academicActionConfig.upsert({
          where: {
            trainingCourseId_name: {
              name: def.name,
              trainingCourseId: course.id,
            },
          },
          update: { actionType: def.actionType },
          create: {
            name: def.name,
            actionType: def.actionType,
            trainingCourseId: course.id,
          },
        })

        // 2. Xóa các RuleSet và Condition cũ để làm sạch
        const oldRuleSets = await prisma.academicActionRuleSet.findMany({
          where: { configId: config.id },
        })
        if (oldRuleSets.length > 0) {
          await prisma.academicActionCondition.deleteMany({
            where: { ruleSetId: { in: oldRuleSets.map((rs) => rs.id) } },
          })
          await prisma.academicActionRuleSet.deleteMany({
            where: { configId: config.id },
          })
        }

        // 3. Tạo lại các RuleSet và Condition mới
        for (const ruleSetConditions of def.ruleSets) {
          if (ruleSetConditions.length > 0) {
            const newRuleSet = await prisma.academicActionRuleSet.create({
              data: { configId: config.id },
            })
            await prisma.academicActionCondition.createMany({
              data: ruleSetConditions.map((cond) => ({
                ...cond,
                ruleSetId: newRuleSet.id,
              })),
            })
          }
        }
      }
      console.log(`Đã seed ${definitions.length} cấu hình hành động cho khoá ${course.name}.`)
    }

    // Chạy seed cho các khoá
    for (const course of civilianCourses) {
      await seedActionsForCourse(course, civilianActionDefs)
    }
    for (const course of militaryCourses) {
      await seedActionsForCourse(course, militaryActionDefs)
    }

    console.log("Seed cấu hình Xử lý học tập hoàn tất.")
  } catch (error) {
    console.error("Lỗi khi seed cấu hình Xử lý học tập:", error)
  } finally {
    await prisma.$disconnect()
  }
}

// main()
