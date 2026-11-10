import { describe, expect, test } from "bun:test"
import type { UserProfileAudienceData } from "./survey-audience"
import { buildSurveyAudienceWhereForProfile } from "./survey-audience"

function createProfile(subjectClassIds: string[] = []): UserProfileAudienceData {
  return {
    id: "profile-1",
    educationAndTraining: [
      {
        fixedClassId: null,
        fixedClass: null,
        subjectClassStudent: subjectClassIds.map((subjectClassId) => ({ subjectClassId })),
      },
    ],
    lecturer: null,
    staffs: null,
    sDM_DonViId: null,
  } as unknown as UserProfileAudienceData
}

describe("buildSurveyAudienceWhereForProfile", () => {
  test("chỉ mở khảo sát lớp học phần không cấu hình đối tượng cho lớp đã ghi danh", () => {
    const { audienceMatch } = buildSurveyAudienceWhereForProfile(createProfile(["class-a"]))
    const serialized = JSON.stringify(audienceMatch)

    expect(serialized).toContain('"subjectClassId":{"in":["class-a"]}')
    expect(serialized).not.toContain('"subjectClassId":{"not":null}')
  })

  test("không thêm nhánh lớp học phần khi sinh viên chưa ghi danh lớp nào", () => {
    const { audienceMatch } = buildSurveyAudienceWhereForProfile(createProfile([]))
    const serialized = JSON.stringify(audienceMatch)

    expect(serialized).not.toContain('"subjectClassId":{"in":')
  })

  test("giữ điều kiện ghi danh khi khảo sát đặt targetEnrollStudentOnly", () => {
    const { enrollmentFilter } = buildSurveyAudienceWhereForProfile(createProfile(["class-a"]))

    expect(enrollmentFilter).toEqual({
      OR: [
        { subjectClassId: null },
        { targetEnrollStudentOnly: false },
        {
          subjectClass: {
            subjectClassStudent: {
              some: {
                deletedAt: null,
                student: {
                  deletedAt: null,
                  userProfile: { id: "profile-1" },
                },
              },
            },
          },
        },
      ],
    })
  })

  test("áp dụng cùng tiêu chí sinh viên cho object type trực tiếp và từ cluster", () => {
    const { audienceMatch } = buildSurveyAudienceWhereForProfile(createProfile(["class-a"]))
    const serialized = JSON.stringify(audienceMatch)

    expect(serialized).toContain('"surveyObjectType":{"some":{"AND":')
    expect(serialized).toContain('"clusterSurvey":{"surveyObjectType":{"some":{"AND":')
    expect(serialized).toContain('"subjectClasses":{"some":{"id":{"in":["class-a"]}}}')
  })

  test("profile không có quá trình đào tạo không tạo tiêu chí sinh viên", () => {
    const profile = createProfile([])
    profile.educationAndTraining = []

    const { audienceMatch } = buildSurveyAudienceWhereForProfile(profile)
    const serialized = JSON.stringify(audienceMatch)

    expect(serialized).not.toContain('"type":{"hasSome":["MILITARY_STUDENT"')
  })
})
