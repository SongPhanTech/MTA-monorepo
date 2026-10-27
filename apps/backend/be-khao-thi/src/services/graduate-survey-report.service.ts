import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { PrismaClient } from "@workspace/db"
import {
  buildSurveyObjectTypeProfileOrClauses,
  resolveMajorOrgFromSurveyObjectTypes,
  SURVEY_OBJECT_TYPE_REPORT_INCLUDE,
} from "../lib/survey-audience"

function padZero(num: number): string {
  return num < 10 ? `0${num}` : `${num}`
}

export const DEFAULT_GRADUATE_MAJORS = [
  { name: "Phòng hóa", taken: 0, total: 0, organization: "Khoa Hóa - Lý Kỹ thuật" },
  { name: "Xây dựng sân bay", taken: 0, total: 0, organization: "Viện Kỹ thuật công trình đặc biệt" },
  { name: "Công nghệ CTM", taken: 0, total: 0, organization: "Khoa Cơ khí" },
  { name: "An ninh HTTT", taken: 0, total: 0, organization: "Viện Công nghệ thông tin và truyền thông" },
  { name: "Gia công áp lực", taken: 0, total: 0, organization: "Khoa Cơ khí" },
  { name: "Công nghệ thông tin", taken: 0, total: 0, organization: "Viện Công nghệ thông tin và truyền thông" },
  { name: "Thuốc phóng thuốc nổ", taken: 0, total: 0, organization: "Khoa Vũ khí" },
  { name: "Phân tích dữ liệu", taken: 0, total: 0, organization: "Viện Công nghệ thông tin và truyền thông" },
  { name: "Vũ khí", taken: 0, total: 0, organization: "Khoa Vũ khí" },
  { name: "Kỹ thuật phần mềm", taken: 0, total: 0, organization: "Viện Công nghệ thông tin và truyền thông" },
  { name: "Khí tài quang - QĐT", taken: 0, total: 0, organization: "Khoa Vũ khí" },
  { name: "Hệ thống thông tin", taken: 0, total: 0, organization: "Viện Công nghệ thông tin và truyền thông" },
  { name: "Đạn", taken: 0, total: 0, organization: "Khoa Vũ khí" },
  { name: "Mạng MT&TTDL", taken: 0, total: 0, organization: "Viện Công nghệ thông tin và truyền thông" },
  { name: "Ra đa", taken: 0, total: 0, organization: "Khoa Vô tuyến điện tử" },
  { name: "Bảo đảm ATTT", taken: 0, total: 0, organization: "Viện Công nghệ thông tin và truyền thông" },
  { name: "Thông tin", taken: 0, total: 0, organization: "Khoa Vô tuyến điện tử" },
  { name: "Ô tô quân sự", taken: 0, total: 0, organization: "Viện Cơ khí động lực" },
  { name: "Ra đa So na", taken: 0, total: 0, organization: "Khoa Vô tuyến điện tử" },
  { name: "Tăng - Thiết giáp", taken: 0, total: 0, organization: "Viện Cơ khí động lực" },
  { name: "Tác chiến điện tử", taken: 0, total: 0, organization: "Khoa Vô tuyến điện tử" },
  { name: "Xe máy công binh", taken: 0, total: 0, organization: "Viện Kỹ thuật công trình đặc biệt" },
  { name: "Địa hình quân sự", taken: 0, total: 0, organization: "Khoa Hóa - Lý Kỹ thuật" },
  { name: "Tên lửa phòng không", taken: 0, total: 0, organization: "Viện Tên lửa và Kỹ thuật điều khiển" },
  { name: "Công trình quốc phòng", taken: 0, total: 0, organization: "Viện Kỹ thuật công trình đặc biệt" },
  { name: "Thiết bị điện tàu", taken: 0, total: 0, organization: "Viện Tên lửa và Kỹ thuật điều khiển" },
  { name: "Cầu đường", taken: 0, total: 0, organization: "Viện Kỹ thuật công trình đặc biệt" },
  { name: "Điện tử y sinh", taken: 0, total: 0, organization: "Khoa Vô tuyến điện tử" },
]

export const DEFAULT_ACADEMY_DEPARTMENTS = [
  {
    name: "Khoa Cơ khí",
    romanIndex: "I",
    majors: [
      {
        name: "Công nghệ CTM",
        arabicIndex: 1,
        categories: [
          {
            title: "a. Các ý kiến để nâng cao chất lượng đào tạo, cải thiện môi trường học tập tại Học viện.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
          {
            title: "b. Các ý kiến góp ý khác.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
        ],
      },
      {
        name: "Gia công áp lực",
        arabicIndex: 2,
        categories: [
          {
            title: "a. Các ý kiến để nâng cao chất lượng đào tạo, cải thiện môi trường học tập tại Học viện.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
          {
            title: "b. Các ý kiến góp ý khác.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
        ],
      },
    ],
  },
  {
    name: "Khoa Vũ khí",
    romanIndex: "II",
    majors: [
      {
        name: "Thuốc phóng thuốc nổ",
        arabicIndex: 1,
        categories: [
          {
            title: "a. Các ý kiến để nâng cao chất lượng đào tạo, cải thiện môi trường học tập tại Học viện.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
          {
            title: "b. Các ý kiến góp ý khác.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
        ],
      },
      {
        name: "Vũ khí",
        arabicIndex: 2,
        categories: [
          {
            title: "a. Các ý kiến để nâng cao chất lượng đào tạo, cải thiện môi trường học tập tại Học viện.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
          {
            title: "b. Các ý kiến góp ý khác.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
        ],
      },
      {
        name: "Khí tài quang - QĐT",
        arabicIndex: 3,
        categories: [
          {
            title: "a. Các ý kiến để nâng cao chất lượng đào tạo, cải thiện môi trường học tập tại Học viện.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
          {
            title: "b. Các ý kiến góp ý khác.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
        ],
      },
      {
        name: "Đạn",
        arabicIndex: 4,
        categories: [
          {
            title: "a. Các ý kiến để nâng cao chất lượng đào tạo, cải thiện môi trường học tập tại Học viện.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
          {
            title: "b. Các ý kiến góp ý khác.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
        ],
      },
    ],
  },
  {
    name: "Khoa Vô tuyến điện tử",
    romanIndex: "III",
    majors: [
      {
        name: "Ra đa",
        arabicIndex: 1,
        categories: [
          {
            title: "a. Các ý kiến để nâng cao chất lượng đào tạo, cải thiện môi trường học tập tại Học viện.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
          {
            title: "b. Các ý kiến góp ý khác.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
        ],
      },
      {
        name: "Thông tin",
        arabicIndex: 2,
        categories: [
          {
            title: "a. Các ý kiến để nâng cao chất lượng đào tạo, cải thiện môi trường học tập tại Học viện.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
          {
            title: "b. Các ý kiến góp ý khác.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
        ],
      },
      {
        name: "Ra đa So na",
        arabicIndex: 3,
        categories: [
          {
            title: "a. Các ý kiến để nâng cao chất lượng đào tạo, cải thiện môi trường học tập tại Học viện.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
          {
            title: "b. Các ý kiến góp ý khác.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
        ],
      },
      {
        name: "Tác chiến điện tử",
        arabicIndex: 4,
        categories: [
          {
            title: "a. Các ý kiến để nâng cao chất lượng đào tạo, cải thiện môi trường học tập tại Học viện.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
          {
            title: "b. Các ý kiến góp ý khác.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
        ],
      },
      {
        name: "Điện tử y sinh",
        arabicIndex: 5,
        categories: [
          {
            title: "a. Các ý kiến để nâng cao chất lượng đào tạo, cải thiện môi trường học tập tại Học viện.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
          {
            title: "b. Các ý kiến góp ý khác.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
        ],
      },
    ],
  },
  {
    name: "Viện Kỹ thuật công trình đặc biệt",
    romanIndex: "IV",
    majors: [
      {
        name: "Xây dựng sân bay",
        arabicIndex: 1,
        categories: [
          {
            title: "a. Các ý kiến để nâng cao chất lượng đào tạo, cải thiện môi trường học tập tại Học viện.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
          {
            title: "b. Các ý kiến góp ý khác.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
        ],
      },
      {
        name: "Xe máy công binh",
        arabicIndex: 2,
        categories: [
          {
            title: "a. Các ý kiến để nâng cao chất lượng đào tạo, cải thiện môi trường học tập tại Học viện.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
          {
            title: "b. Các ý kiến góp ý khác.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
        ],
      },
      {
        name: "Công trình quốc phòng",
        arabicIndex: 3,
        categories: [
          {
            title: "a. Các ý kiến để nâng cao chất lượng đào tạo, cải thiện môi trường học tập tại Học viện.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
          {
            title: "b. Các ý kiến góp ý khác.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
        ],
      },
      {
        name: "Cầu đường",
        arabicIndex: 4,
        categories: [
          {
            title: "a. Các ý kiến để nâng cao chất lượng đào tạo, cải thiện môi trường học tập tại Học viện.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
          {
            title: "b. Các ý kiến góp ý khác.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
        ],
      },
    ],
  },
  {
    name: "Viện Công nghệ thông tin và truyền thông",
    romanIndex: "V",
    majors: [
      {
        name: "An ninh HTTT",
        arabicIndex: 1,
        categories: [
          {
            title: "a. Các ý kiến để nâng cao chất lượng đào tạo, cải thiện môi trường học tập tại Học viện.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
          {
            title: "b. Các ý kiến góp ý khác.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
        ],
      },
      {
        name: "Công nghệ thông tin",
        arabicIndex: 2,
        categories: [
          {
            title: "a. Các ý kiến để nâng cao chất lượng đào tạo, cải thiện môi trường học tập tại Học viện.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
          {
            title: "b. Các ý kiến góp ý khác.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
        ],
      },
      {
        name: "Phân tích dữ liệu",
        arabicIndex: 3,
        categories: [
          {
            title: "a. Các ý kiến để nâng cao chất lượng đào tạo, cải thiện môi trường học tập tại Học viện.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
          {
            title: "b. Các ý kiến góp ý khác.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
        ],
      },
      {
        name: "Kỹ thuật phần mềm",
        arabicIndex: 4,
        categories: [
          {
            title: "a. Các ý kiến để nâng cao chất lượng đào tạo, cải thiện môi trường học tập tại Học viện.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
          {
            title: "b. Các ý kiến góp ý khác.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
        ],
      },
      {
        name: "Hệ thống thông tin",
        arabicIndex: 5,
        categories: [
          {
            title: "a. Các ý kiến để nâng cao chất lượng đào tạo, cải thiện môi trường học tập tại Học viện.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
          {
            title: "b. Các ý kiến góp ý khác.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
        ],
      },
      {
        name: "Mạng MT&TTDL",
        arabicIndex: 6,
        categories: [
          {
            title: "a. Các ý kiến để nâng cao chất lượng đào tạo, cải thiện môi trường học tập tại Học viện.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
          {
            title: "b. Các ý kiến góp ý khác.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
        ],
      },
      {
        name: "Bảo đảm ATTT",
        arabicIndex: 7,
        categories: [
          {
            title: "a. Các ý kiến để nâng cao chất lượng đào tạo, cải thiện môi trường học tập tại Học viện.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
          {
            title: "b. Các ý kiến góp ý khác.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
        ],
      },
    ],
  },
  {
    name: "Viện Cơ khí động lực",
    romanIndex: "VI",
    majors: [
      {
        name: "Ô tô quân sự",
        arabicIndex: 1,
        categories: [
          {
            title: "a. Các ý kiến để nâng cao chất lượng đào tạo, cải thiện môi trường học tập tại Học viện.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
          {
            title: "b. Các ý kiến góp ý khác.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
        ],
      },
      {
        name: "Tăng - Thiết giáp",
        arabicIndex: 2,
        categories: [
          {
            title: "a. Các ý kiến để nâng cao chất lượng đào tạo, cải thiện môi trường học tập tại Học viện.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
          {
            title: "b. Các ý kiến góp ý khác.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
        ],
      },
    ],
  },
  {
    name: "Viện Tên lửa và Kỹ thuật điều khiển",
    romanIndex: "VII",
    majors: [
      {
        name: "Tên lửa phòng không",
        arabicIndex: 1,
        categories: [
          {
            title: "a. Các ý kiến để nâng cao chất lượng đào tạo, cải thiện môi trường học tập tại Học viện.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
          {
            title: "b. Các ý kiến góp ý khác.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
        ],
      },
      {
        name: "Thiết bị điện tàu",
        arabicIndex: 2,
        categories: [
          {
            title: "a. Các ý kiến để nâng cao chất lượng đào tạo, cải thiện môi trường học tập tại Học viện.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
          {
            title: "b. Các ý kiến góp ý khác.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
        ],
      },
    ],
  },
  {
    name: "Khoa Hóa - Lý Kỹ thuật",
    romanIndex: "VIII",
    majors: [
      {
        name: "Phòng hóa",
        arabicIndex: 1,
        categories: [
          {
            title: "a. Các ý kiến để nâng cao chất lượng đào tạo, cải thiện môi trường học tập tại Học viện.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
          {
            title: "b. Các ý kiến góp ý khác.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
        ],
      },
      {
        name: "Địa hình quân sự",
        arabicIndex: 2,
        categories: [
          {
            title: "a. Các ý kiến để nâng cao chất lượng đào tạo, cải thiện môi trường học tập tại Học viện.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
          {
            title: "b. Các ý kiến góp ý khác.",
            items: [{ text: "Không có ý kiến", countText: "" }],
          },
        ],
      },
    ],
  },
]

export const GRADUATE_SURVEY_REPORT_TEMPLATE_MINIO_PATH =
  "/mta/template/BaoCaoLayYkienHocVienTotNghiep_Mau.docx"

export async function loadGraduateSurveyReportTemplate(): Promise<Buffer> {
  // Fetch trực tiếp MinIO (không dùng cache) để nhận template mới sau khi upload
  try {
    const { fetchMinio } = await import("@workspace/libs/utils")
    const res = await fetchMinio(GRADUATE_SURVEY_REPORT_TEMPLATE_MINIO_PATH)
    if (res.ok) {
      return Buffer.from(await res.arrayBuffer())
    }
  } catch {
    // fallback below
  }

  const here = path.dirname(fileURLToPath(import.meta.url))
  const candidates = [
    path.join(process.cwd(), "templates/BaoCaoLayYkienHocVienTotNghiep_Mau.docx"),
    path.join(
      process.cwd(),
      "apps/backend/be-khao-thi/templates/BaoCaoLayYkienHocVienTotNghiep_Mau.docx"
    ),
    path.join(here, "../../templates/BaoCaoLayYkienHocVienTotNghiep_Mau.docx"),
  ]

  for (const candidate of candidates) {
    try {
      return await fs.readFile(candidate)
    } catch {
      // try next
    }
  }

  throw new Error(
    "Không tìm thấy template BaoCaoLayYkienHocVienTotNghiep_Mau.docx trên MinIO hoặc local"
  )
}

export async function getGraduateSurveyReportDataService(
  prisma: PrismaClient,
  surveyId: string
) {
  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
    include: {
      surveyTopic: true,
      surveyObjectType: {
        include: SURVEY_OBJECT_TYPE_REPORT_INCLUDE,
      },
      surveyQuestion: {
        include: {
          surveyQuestionGroup: true,
          specificChoice: {
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      surveyChoice: {
        orderBy: { answer: "asc" },
      },
    },
  })

  if (!survey) {
    throw new Error("Không tìm thấy khảo sát")
  }

  // 1. Phân tích Khóa đào tạo và ngày khảo sát
  let courseName = ""
  const m1 = survey.name.match(/kh[oó]a\s*([0-9A-Za-z]+)/i)
  const m2 = survey.name.match(/K([0-9]+)/i)
  if (m1) {
    courseName = `Khóa ${m1[1]}`
  } else if (m2) {
    courseName = `Khóa ${m2[1]}`
  }

  let surveyDateStr = ""
  if (survey.startDate) {
    const sDate = new Date(survey.startDate)
    const surveyDay = padZero(sDate.getDate())
    const surveyMonth = padZero(sDate.getMonth() + 1)
    const surveyYear = sDate.getFullYear()
    surveyDateStr = `${surveyDay}/${surveyMonth}/${surveyYear}`
  } else {
    surveyDateStr = "ngày ... tháng ... năm ..."
  }

  const now = new Date()
  let reportLocationDate = `Hà Nội, ngày ${padZero(now.getDate())} tháng ${padZero(now.getMonth() + 1)} năm ${now.getFullYear()}`

  // 2. Lấy danh sách đối tượng & phân bổ chuyên ngành (Phần A)
  const configOrgByMajor = resolveMajorOrgFromSurveyObjectTypes(survey.surveyObjectType)
  const singleConfigOrg = configOrgByMajor.size === 1 ? [...configOrgByMajor.values()][0] : ""

  let allProfiles: any[] = []
  for (const surveyObjectType of survey.surveyObjectType) {
    const orClauses = buildSurveyObjectTypeProfileOrClauses(surveyObjectType, {})
    if (!orClauses.length) continue

    const objectTypeProfiles = await prisma.userProfile.findMany({
      select: {
        id: true,
        educationAndTraining: {
          select: {
            fixedClass: {
              select: {
                name: true,
                curriculumVersion: {
                  select: {
                    name: true,
                    curriculum: {
                      select: {
                        trainingMajor: {
                          select: {
                            name: true,
                            trainingField: { select: { name: true } },
                            organization: { select: { sTen: true } },
                          },
                        },
                        trainingField: { select: { name: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      where: { deletedAt: null, active: true, OR: orClauses },
    })
    allProfiles = [...allProfiles, ...objectTypeProfiles]
  }

  const uniqueProfilesMap = new Map<string, any>()
  for (const p of allProfiles) {
    uniqueProfilesMap.set(p.id, p)
  }
  const uniqueProfiles = Array.from(uniqueProfilesMap.values())

  if (!courseName) {
    for (const p of uniqueProfiles) {
      const fcName = p.educationAndTraining?.[0]?.fixedClass?.name || ""
      const m = fcName.match(/K([0-9]+)/i) || fcName.match(/kh[oó]a\s*([0-9]+)/i)
      if (m) {
        courseName = `Khóa ${m[1]}`
        break
      }
    }
  }

  // Khảo sát mới tạo (DB chưa có dữ liệu đối tượng / phiếu nào)
  const isNewOrEmptySurvey = uniqueProfiles.length === 0
  if (!courseName) {
    courseName = isNewOrEmptySurvey ? "Khóa ......" : "Khóa đào tạo"
  }

  if (isNewOrEmptySurvey) {
    reportLocationDate = "Hà Nội, ngày ... tháng ... năm ..."
  }

  const profileIdToMajor = new Map<string, { majorName: string; orgName: string }>()
  uniqueProfiles.forEach((p) => {
    let majorName = "Khác"
    let orgName = ""
    const studentInfo = p.educationAndTraining?.[0]
    const curriculum = studentInfo?.fixedClass?.curriculumVersion?.curriculum
    if (curriculum) {
      majorName =
        curriculum.trainingMajor?.trainingField?.name ||
        curriculum.trainingMajor?.name ||
        curriculum.trainingField?.name ||
        "Khác"
    }
    orgName =
      curriculum?.trainingMajor?.organization?.sTen ||
      configOrgByMajor.get(majorName) ||
      singleConfigOrg ||
      ""
    profileIdToMajor.set(p.id, { majorName, orgName })
  })

  const profileIds = uniqueProfiles.map((p) => p.id)
  const takenSessions =
    profileIds.length > 0
      ? await prisma.surveySession.findMany({
          where: {
            surveyId: survey.id,
            profileId: { in: profileIds },
          },
          select: { id: true, profileId: true },
        })
      : []

  const takenProfileIds = new Set(takenSessions.map((s) => s.profileId).filter(Boolean))
  const sessionToProfileId = new Map(takenSessions.map((s) => [s.id, s.profileId]))

  const majorStatsMap = new Map<
    string,
    { name: string; total: number; taken: number; organization: string }
  >()
  uniqueProfiles.forEach((p) => {
    const { majorName, orgName } = profileIdToMajor.get(p.id)!
    if (!majorStatsMap.has(majorName)) {
      majorStatsMap.set(majorName, { name: majorName, total: 0, taken: 0, organization: orgName })
    }
    const stat = majorStatsMap.get(majorName)!
    stat.total += 1
    if (takenProfileIds.has(p.id)) {
      stat.taken += 1
    }
  })

  let majors = Array.from(majorStatsMap.values()).sort((a, b) => {
    if (a.name === "Khác") return 1
    if (b.name === "Khác") return -1
    return a.name.localeCompare(b.name)
  })

  if (isNewOrEmptySurvey) {
    // Với khảo sát mới tạo (DB chưa có đối tượng): dùng bộ dữ liệu mẫu chuẩn của Học viện với số liệu để trống (0)
    majors = DEFAULT_GRADUATE_MAJORS.map((m) => ({ ...m, taken: 0, total: 0 }))
  }

  const totalMajors = majors.length
  const totalStudents = majors.reduce((sum, m) => sum + m.total, 0)
  const totalTaken = majors.reduce((sum, m) => sum + m.taken, 0)

  // 3. Phân tích Phần B: Nhận xét đánh giá của học viên theo từng lĩnh vực
  const singleChoiceQuestions = survey.surveyQuestion.filter((q) => q.type === "SINGLE_CHOICE")
  const singleChoiceIds = singleChoiceQuestions.map((q) => q.id)

  const responses =
    singleChoiceIds.length > 0
      ? await prisma.surveyResponse.findMany({
          where: {
            surveySession: { surveyId: survey.id },
            surveyQuestionId: { in: singleChoiceIds },
          },
          select: {
            surveySessionId: true,
            surveyQuestionId: true,
            surveyChoiceId: true,
            surveyChoice: { select: { answer: true, description: true } },
          },
        })
      : []

  function isAgreeChoice(answer?: string | null, description?: string | null): boolean {
    const ans = answer?.trim() || ""
    const desc = (description || "").toLowerCase()
    const num = Number.parseInt(ans, 10)
    if (!Number.isNaN(num)) {
      return num >= 4
    }
    return (
      (desc.includes("đồng ý") && !desc.includes("không đồng ý")) ||
      (desc.includes("hài lòng") && !desc.includes("không hài lòng"))
    )
  }

  function isMaxChoice(answer?: string | null, description?: string | null): boolean {
    const ans = answer?.trim() || ""
    const desc = (description || "").toLowerCase()
    const num = Number.parseInt(ans, 10)
    if (!Number.isNaN(num)) {
      return num === 5
    }
    return desc.includes("rất đồng ý") || desc.includes("rất hài lòng")
  }

  // Định nghĩa 5 lĩnh vực tiêu chuẩn theo biểu mẫu Học viện
  const standardFieldsConfig = [
    {
      key: "field-1",
      order: 1,
      title: "I. Nội dung chương trình đào tạo",
      keywords: ["nội dung", "chương trình", "ctđt", "mục tiêu", "chuẩn đầu ra", "học phần", "lộ trình"],
      generalTemplate: (ratio: string) =>
        `Học viên của ${ratio} chuyên ngành đồng ý về nội dung chương trình và đều cho rằng: mục tiêu và chuẩn đầu ra của chương trình đào tạo được công bố cho người học, giúp người học xác định được lộ trình học tập và các yêu cầu cần đạt được sau khi hoàn thành khóa học; chương trình đào tạo có tỉ lệ giữa kiến thức lý thuyết và kỹ năng thực hành phù hợp, nội dung cập nhật với đặc thù của mỗi học phần.`,
    },
    {
      key: "field-2",
      order: 2,
      title: "II. Hoạt động giảng dạy của giảng viên",
      keywords: ["giảng viên", "giảng dạy", "thầy cô", "lên lớp", "tiết học", "sư phạm", "nhiệt tình", "đánh giá kết quả học tập", "công bằng", "kịp thời"],
      generalTemplate: (ratio: string) =>
        `Học viên của ${ratio} chuyên ngành đồng ý về hoạt động giảng dạy của giảng viên và đều cho rằng: vào tiết học đầu tiên của mỗi học phần, giảng viên nêu rõ vị trí, vai trò, mục tiêu, chuẩn đầu ra của học phần trong chương trình đào tạo; hình thức kiểm tra, đánh giá học phần; giảng viên bảo đảm giờ lên lớp, nhiệt tình, sẵn sàng giải đáp các thắc mắc của người học; việc đánh giá kết quả học tập của người học bảo đảm khách quan, công bằng và công khai; kết quả được công bố kịp thời.`,
    },
    {
      key: "field-3",
      order: 3,
      title: "III. Công tác tổ chức, quản lý đào tạo",
      keywords: ["tổ chức", "quản lý", "khối lượng", "kế hoạch", "học kỳ", "ngoại khóa", "cán bộ", "cơ quan", "đơn vị", "thời khóa biểu"],
      generalTemplate: (ratio: string) =>
        `Học viên của ${ratio} chuyên ngành đồng ý về công tác tổ chức, quản lý đào tạo và đều cho rằng: phân bổ khối lượng học tập, tính logic của các học phần trong mỗi học kỳ và toàn khóa học được bảo đảm; có sự hài hòa về thời gian học tập chính khóa và tham gia các hoạt động ngoại khóa do Học viện tổ chức; cán bộ, nhân viên các cơ quan, đơn vị có trách nhiệm khi giải quyết nhu cầu của người học.`,
    },
    {
      key: "field-4",
      order: 4,
      title: "IV. Hoạt động hỗ trợ và phục vụ người học",
      keywords: ["hỗ trợ", "phục vụ", "cơ sở vật chất", "csvc", "phòng học", "phòng thí nghiệm", "thư viện", "công nghệ thông tin", "sinh hoạt", "ăn, ở", "sức khỏe", "tinh thần", "văn hóa", "thể thao"],
      generalTemplate: (ratio: string) =>
        `Học viên của ${ratio} chuyên ngành đồng ý về hoạt động hỗ trợ và phục vụ người học và đều cho rằng: cơ sở vật chất, phòng thí nghiệm, giáo trình tài liệu, hệ thống công nghệ thông tin đáp ứng tốt nhu cầu học tập và nghiên cứu khoa học của người học; điều kiện sinh hoạt, ăn, ở, bảo đảm sức khỏe của người học được đáp ứng; nhu cầu về đời sống tinh thần (văn hóa, văn nghệ, thể dục thể thao) của người học được đáp ứng.`,
    },
    {
      key: "field-5",
      order: 5,
      title: "V. Cảm nhận về kết quả đạt được",
      keywords: ["cảm nhận", "kết quả", "tổng thể", "khuyên", "chọn", "giới thiệu", "phát triển", "bản thân", "nguyện vọng"],
      generalTemplate: (ratio: string) =>
        `Đa số học viên của ${ratio} chuyên ngành hài lòng về tổng thể quá trình học tập và trải nghiệm đối với sự phát triển về kiến thức, năng lực và phẩm chất của bản thân và đều khuyên nên chọn đối với cá nhân có mong muốn lựa chọn học tập tại Học viện.`,
    },
  ]

  // Phân loại câu hỏi trắc nghiệm vào 5 lĩnh vực
  const fieldQuestionsMap = new Map<string, typeof singleChoiceQuestions>()
  standardFieldsConfig.forEach((f) => fieldQuestionsMap.set(f.key, []))

  singleChoiceQuestions.forEach((q) => {
    const text = [
      q.surveyQuestionGroup?.name || "",
      q.name || "",
      q.description || "",
    ]
      .join(" ")
      .toLowerCase()

    let bestFieldKey = ""
    let maxScore = 0

    standardFieldsConfig.forEach((f) => {
      let score = 0
      f.keywords.forEach((kw) => {
        if (text.includes(kw.toLowerCase())) {
          if ((q.surveyQuestionGroup?.name || "").toLowerCase().includes(kw.toLowerCase())) {
            score += 3
          } else {
            score += 1
          }
        }
      })
      if (score > maxScore) {
        maxScore = score
        bestFieldKey = f.key
      }
    })

    if (bestFieldKey && maxScore > 0) {
      fieldQuestionsMap.get(bestFieldKey)!.push(q)
    }
  })

  // Đảm bảo mỗi lĩnh vực đều có câu hỏi để thống kê nếu có câu hỏi trắc nghiệm
  standardFieldsConfig.forEach((f) => {
    if (fieldQuestionsMap.get(f.key)!.length === 0 && singleChoiceQuestions.length > 0) {
      fieldQuestionsMap.set(f.key, [...singleChoiceQuestions])
    }
  })

  // Tính toán số liệu từng lĩnh vực
  const fields = standardFieldsConfig.map((cfg) => {
    if (isNewOrEmptySurvey) {
      // Đối với đợt khảo sát mới tạo (DB chưa có dữ liệu): sử dụng biểu mẫu Học viện với các nội dung chưa có để trống
      const generalText = cfg.generalTemplate(".../...")
      let standoutText = ""
      if (cfg.key === "field-5") {
        standoutText = `Trong đó, .../... chuyên ngành có 100% học viên đánh giá rất hài lòng về tổng thể quá trình học tập và trải nghiệm đối với sự phát triển về kiến thức, năng lực và phẩm chất của bản thân: ............................................................................\n\n.../... chuyên ngành có 100% học viên khuyên nên chọn đối với cá nhân có mong muốn lựa chọn học tập tại Học viện: ............................................................................`
      } else {
        standoutText = `Trong đó, .../... chuyên ngành có 100% học viên đánh giá rất đồng ý: ............................................................................`
      }

      return {
        id: cfg.key,
        key: cfg.key,
        order: cfg.order,
        title: cfg.title,
        generalText,
        standoutText,
        standoutMajors: [],
        agreeRatio: ".../...",
      }
    }

    const fQuestions = fieldQuestionsMap.get(cfg.key) || []
    const fQIds = new Set(fQuestions.map((q) => q.id))
    const fResponses = responses.filter((r) => fQIds.has(r.surveyQuestionId))

    const majorStats = majors.map((m) => {
      const mResponses = fResponses.filter((r) => {
        const pId = sessionToProfileId.get(r.surveySessionId)
        if (!pId) return false
        const mInfo = profileIdToMajor.get(pId)
        return mInfo?.majorName === m.name
      })

      const totalAns = mResponses.length
      const agreeAns = mResponses.filter((r) =>
        isAgreeChoice(r.surveyChoice?.answer, r.surveyChoice?.description)
      ).length
      const maxAns = mResponses.filter((r) =>
        isMaxChoice(r.surveyChoice?.answer, r.surveyChoice?.description)
      ).length

      const isAgree = totalAns > 0 ? agreeAns / totalAns >= 0.5 : false
      const isMax = totalAns > 0 && maxAns === totalAns

      return {
        name: m.name,
        totalAns,
        agreeAns,
        maxAns,
        isAgree,
        isMax,
      }
    })

    const agreeCount = majorStats.filter((s) => s.isAgree).length
    const agreeRatio = `${padZero(agreeCount)}/${padZero(totalMajors)}`
    const calculatedStandouts = majorStats.filter((s) => s.isMax).map((s) => s.name)

    const generalText = cfg.generalTemplate(agreeRatio)
    const standoutMajors = calculatedStandouts
    let standoutText = ""

    if (cfg.key === "field-5") {
      const recommendQ =
        fQuestions.find(
          (q) =>
            q.name.toLowerCase().includes("khuyên") ||
            q.name.toLowerCase().includes("chọn") ||
            (q.description || "").toLowerCase().includes("khuyên")
        ) || (fQuestions.length > 1 ? fQuestions[fQuestions.length - 1] : null)

      const standoutV1Majors = calculatedStandouts
      let standoutV2Majors: string[] = []

      if (recommendQ) {
        const recQResponses = fResponses.filter((r) => r.surveyQuestionId === recommendQ.id)
        standoutV2Majors = majors
          .filter((m) => {
            const mQResponses = recQResponses.filter((r) => {
              const pId = sessionToProfileId.get(r.surveySessionId)
              if (!pId) return false
              const mInfo = profileIdToMajor.get(pId)
              return mInfo?.majorName === m.name
            })
            return (
              mQResponses.length > 0 &&
              mQResponses.every((r) =>
                isMaxChoice(r.surveyChoice?.answer, r.surveyChoice?.description)
              )
            )
          })
          .map((m) => m.name)
      } else {
        standoutV2Majors = calculatedStandouts
      }

      const countV1 = standoutV1Majors.length
      const countV2 = standoutV2Majors.length

      const part1 =
        countV1 > 0
          ? `Trong đó, ${padZero(countV1)}/${padZero(totalMajors)} chuyên ngành có 100% học viên đánh giá rất hài lòng về tổng thể quá trình học tập và trải nghiệm đối với sự phát triển về kiến thức, năng lực và phẩm chất của bản thân: ${standoutV1Majors.join(", ")}.`
          : `Trong đó, 00/${padZero(totalMajors)} chuyên ngành có 100% học viên đánh giá rất hài lòng về tổng thể quá trình học tập và trải nghiệm đối với sự phát triển về kiến thức, năng lực và phẩm chất của bản thân.`

      const part2 =
        countV2 > 0
          ? `${padZero(countV2)}/${padZero(totalMajors)} chuyên ngành có 100% học viên khuyên nên chọn đối với cá nhân có mong muốn lựa chọn học tập tại Học viện: ${standoutV2Majors.join(", ")}.`
          : `00/${padZero(totalMajors)} chuyên ngành có 100% học viên khuyên nên chọn đối với cá nhân có mong muốn lựa chọn học tập tại Học viện.`

      standoutText = `${part1}\n\n${part2}`
    } else {
      const count = standoutMajors.length
      if (count > 0) {
        standoutText = `Trong đó, ${padZero(count)}/${padZero(totalMajors)} chuyên ngành có 100% học viên đánh giá rất đồng ý: ${standoutMajors.join(", ")}.`
      } else {
        standoutText = `Trong đó, 00/${padZero(totalMajors)} chuyên ngành có 100% học viên đánh giá rất đồng ý.`
      }
    }

    return {
      id: cfg.key,
      key: cfg.key,
      order: cfg.order,
      title: cfg.title,
      generalText,
      standoutText,
      standoutMajors,
      agreeRatio,
    }
  })

  // 4. Phân tích Phần C: Tổng hợp chung
  let satisfiedCount = 0
  let satisfactionPercent = 0
  let sectionCText = ""

  if (isNewOrEmptySurvey || totalStudents === 0) {
    // Khảo sát mới tạo (DB chưa có dữ liệu): để trống nội dung số liệu chưa có
    satisfiedCount = 0
    satisfactionPercent = 0
    sectionCText = `...% (.../... học viên) hài lòng về chất lượng đào tạo của Học viện. Đạt yêu cầu về tỷ lệ người học tốt nghiệp hài lòng tổng thể (Yêu cầu ≥ 70%) theo Thông tư số 01/2024/TT-BGDĐT ngày 05/02/2024 của Bộ Giáo dục và Đào tạo về Chuẩn cơ sở giáo dục đại học.`
  } else {
    // Khảo sát thực tế: số học sinh hài lòng / tổng số học sinh của các chuyên ngành tham gia
    if (responses.length > 0) {
      const studentSatisfiedSet = new Set<string>()
      responses.forEach((r) => {
        const pId = sessionToProfileId.get(r.surveySessionId)
        if (!pId) return
        const ansNum = Number.parseInt(r.surveyChoice?.answer || "0", 10)
        const desc = (r.surveyChoice?.description || "").toLowerCase()
        if (
          ansNum >= 4 ||
          (desc.includes("hài lòng") && !desc.includes("không hài lòng")) ||
          (desc.includes("đồng ý") && !desc.includes("không đồng ý"))
        ) {
          studentSatisfiedSet.add(pId)
        }
      })
      satisfiedCount = studentSatisfiedSet.size
    } else if (totalTaken > 0) {
      satisfiedCount = totalTaken
    }
    satisfiedCount = Math.min(satisfiedCount, totalStudents)
    satisfactionPercent =
      totalStudents > 0 ? Number(((satisfiedCount / totalStudents) * 100).toFixed(1)) : 0

    const satisfactionPercentStr = satisfactionPercent.toString().replace(".", ",")
    const standardStatus = satisfactionPercent >= 70 ? "Đạt" : "Chưa đạt"

    sectionCText = `${satisfactionPercentStr}% (${satisfiedCount}/${totalStudents} học viên) hài lòng về chất lượng đào tạo của Học viện. ${standardStatus} yêu cầu về tỷ lệ người học tốt nghiệp hài lòng tổng thể (Yêu cầu ≥ 70%) theo Thông tư số 01/2024/TT-BGDĐT ngày 05/02/2024 của Bộ Giáo dục và Đào tạo về Chuẩn cơ sở giáo dục đại học.`
  }

  // 5. Phân tích Phần D: Các ý kiến góp ý của học viên
  const TITLE_CAT_A =
    "a. Các ý kiến để nâng cao chất lượng đào tạo, cải thiện môi trường học tập tại Học viện."
  const TITLE_CAT_B = "b. Các ý kiến góp ý khác."

  function isOtherFeedbackQuestion(q?: {
    name?: string | null
    description?: string | null
    surveyQuestionGroup?: { name?: string | null } | null
  }): boolean {
    if (!q) return false
    const text = [
      q.surveyQuestionGroup?.name || "",
      q.name || "",
      q.description || "",
    ]
      .join(" ")
      .toLowerCase()
    return (
      text.includes("khác") ||
      text.includes("ngoài ra") ||
      text.includes("góp ý khác") ||
      text.includes("ý kiến khác") ||
      text.includes("đời sống") ||
      text.includes("sinh hoạt") ||
      text.includes("bếp ăn") ||
      text.includes("ăn, ở")
    )
  }

  function normalizeMajorCategories(
    categories?: Array<{ title: string; items: Array<{ text: string; countText: string }> }>
  ) {
    const list = categories || []
    const catA = list.find(
      (c) =>
        c.title.toLowerCase().includes("a.") ||
        c.title.toLowerCase().includes("chất lượng đào tạo") ||
        c.title.toLowerCase().includes("nâng cao chất lượng")
    )
    const catB = list.find(
      (c) =>
        c.title.toLowerCase().includes("b.") ||
        c.title.toLowerCase().includes("góp ý khác") ||
        c.title.toLowerCase().includes("ý kiến khác")
    )

    const finalCatA = {
      title: TITLE_CAT_A,
      items:
        catA && catA.items && catA.items.length > 0
          ? catA.items
          : [{ text: "Không có ý kiến", countText: "" }],
    }

    const finalCatB = {
      title: TITLE_CAT_B,
      items:
        catB && catB.items && catB.items.length > 0
          ? catB.items
          : [{ text: "Không có ý kiến", countText: "" }],
    }

    return [finalCatA, finalCatB]
  }

  const essayQuestions = survey.surveyQuestion.filter((q) => q.type === "ESSAY")
  const essayIds = essayQuestions.map((q) => q.id)

  const essayResponses =
    essayIds.length > 0
      ? await prisma.surveyResponse.findMany({
          where: {
            surveySession: { surveyId: survey.id },
            surveyQuestionId: { in: essayIds },
            answerText: { not: null },
          },
          select: {
            surveySessionId: true,
            surveyQuestionId: true,
            answerText: true,
          },
        })
      : []

  let departmentsFeedback: typeof DEFAULT_ACADEMY_DEPARTMENTS = []

  if (isNewOrEmptySurvey) {
    // Đợt khảo sát mới tạo: Sử dụng bộ khung 8 Khoa/Viện mẫu chuẩn của Học viện, các ý kiến để "Không có ý kiến"
    departmentsFeedback = DEFAULT_ACADEMY_DEPARTMENTS
  } else if (essayResponses.length > 0) {
    const deptMap = new Map<
      string,
      Map<
        string,
        {
          catA: Map<string, { answerText: string; count: number }>
          catB: Map<string, { answerText: string; count: number }>
        }
      >
    >()

    essayResponses.forEach((r) => {
      const text = (r.answerText || "").trim()
      if (!text) return

      const pId = sessionToProfileId.get(r.surveySessionId)
      const majorInfo = pId ? profileIdToMajor.get(pId) : null
      const deptName = majorInfo?.orgName || "Cơ quan/Đơn vị đào tạo"
      const majorName = majorInfo?.majorName || "Chuyên ngành chung"

      const q = essayQuestions.find((eq) => eq.id === r.surveyQuestionId)
      const isOther = isOtherFeedbackQuestion(q)

      if (!deptMap.has(deptName)) deptMap.set(deptName, new Map())
      const mMap = deptMap.get(deptName)!
      if (!mMap.has(majorName)) {
        mMap.set(majorName, { catA: new Map(), catB: new Map() })
      }
      const feedbackGroups = mMap.get(majorName)!
      const targetMap = isOther ? feedbackGroups.catB : feedbackGroups.catA

      if (!targetMap.has(text)) {
        targetMap.set(text, { answerText: text, count: 0 })
      }
      targetMap.get(text)!.count += 1
    })

    const romanNumerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"]
    let deptIdx = 0
    const dynamicDepts: typeof DEFAULT_ACADEMY_DEPARTMENTS = []

    for (const [deptName, mEntries] of deptMap.entries()) {
      let majIdx = 1
      const majorsList: any[] = []

      for (const [majorName, groups] of mEntries.entries()) {
        const majorStat = majors.find((m) => m.name === majorName)
        const totalInMajor = majorStat?.total || 10

        const itemsA: any[] = []
        for (const item of groups.catA.values()) {
          itemsA.push({
            text: item.answerText,
            countText: `${padZero(item.count)}/${padZero(totalInMajor)}`,
          })
        }

        const itemsB: any[] = []
        for (const item of groups.catB.values()) {
          itemsB.push({
            text: item.answerText,
            countText: `${padZero(item.count)}/${padZero(totalInMajor)}`,
          })
        }

        majorsList.push({
          name: majorName,
          arabicIndex: majIdx++,
          categories: normalizeMajorCategories([
            { title: TITLE_CAT_A, items: itemsA },
            { title: TITLE_CAT_B, items: itemsB },
          ]),
        })
      }

      dynamicDepts.push({
        name: deptName,
        romanIndex: romanNumerals[deptIdx] || `${deptIdx + 1}`,
        majors: majorsList,
      })
      deptIdx++
    }

    if (dynamicDepts.length > 0) {
      departmentsFeedback = dynamicDepts
    }
  } else {
    // Không có ý kiến tự luận nhưng có chuyên ngành thực tế
    const deptMap = new Map<string, typeof majors>()
    majors.forEach((m) => {
      const org = m.organization || "Cơ quan/Đơn vị đào tạo"
      if (!deptMap.has(org)) deptMap.set(org, [])
      deptMap.get(org)!.push(m)
    })

    const romanNumerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"]
    let deptIdx = 0
    const dynamicDepts: typeof DEFAULT_ACADEMY_DEPARTMENTS = []

    for (const [deptName, mList] of deptMap.entries()) {
      let majIdx = 1
      const majorsList: any[] = []

      for (const m of mList) {
        majorsList.push({
          name: m.name,
          arabicIndex: majIdx++,
          categories: normalizeMajorCategories([]),
        })
      }

      dynamicDepts.push({
        name: deptName,
        romanIndex: romanNumerals[deptIdx] || `${deptIdx + 1}`,
        majors: majorsList,
      })
      deptIdx++
    }

    departmentsFeedback = dynamicDepts
  }

  const sectionDIntroText =
    isNewOrEmptySurvey || essayResponses.length === 0
      ? "Trong đợt khảo sát này, không có ý kiến góp ý tự luận từ học viên các chuyên ngành đào tạo.\n\nCụ thể như sau:"
      : `Học viên có ý kiến về giáo trình tài liệu (loại bỏ giáo trình tài liệu cũ, tăng giáo trình tài liệu mới, phù hợp chuyên ngành học); tăng thời gian thực hành, thí nghiệm; nắm bắt kịp thời tâm tư nguyện vọng của học viên trong quá trình học tập và khi phân ngành học; quan tâm hơn nữa đến hiệu quả hoạt động tự học của học viên; cải thiện cơ sở vật chất phục vụ ăn ở, sinh hoạt, chất lượng bữa ăn, sân chơi thể dục thể thao; học ngoại ngữ (cải thiện quy chế học và thi); các hoạt động văn hóa, văn nghệ ảnh hưởng đến việc học và ôn thi kết thúc học phần... \n\nCụ thể như sau:`

  const recommendationText = `Kính đề nghị Thủ trưởng Học viện chỉ đạo các cơ quan, đơn vị liên quan căn cứ vào ý kiến phản hồi của học viên để nghiên cứu tham mưu điều chỉnh các nội dung phản hồi, bảo đảm nâng cao chất lượng đào tạo của Học viện và báo cáo Thủ trưởng Học viện theo quy định./.`

  const sectionAIntroDate = survey.startDate ? `Ngày ${surveyDateStr}` : "Ngày ... tháng ... năm ..."
  const sectionAStudentText = totalStudents > 0 ? `${totalStudents} học viên` : "... học viên"
  const sectionAIntroText = `${sectionAIntroDate}, Ban Khảo thí và ĐBCLGD-ĐT tổ chức lấy ý kiến phản hồi từ học viên ${courseName.toLowerCase()} tốt nghiệp về chất lượng đào tạo của Học viện, gồm ${totalMajors} chuyên ngành với ${sectionAStudentText}, cụ thể như sau:`

  return {
    surveyInfo: {
      id: survey.id,
      name: survey.name,
      courseName,
      surveyDate: surveyDateStr,
      reportLocationDate,
      organizationHeader: "HỌC VIỆN KỸ THUẬT QUÂN SỰ",
      departmentHeader: "BAN KHẢO THÍ & ĐBCLGD-ĐT",
      reportTitle: `BÁO CÁO KẾT QUẢ LẤY Ý KIẾN PHẢN HỒI\nTỪ HỌC VIÊN ${courseName.toUpperCase()} TỐT NGHIỆP`,
    },
    sectionA: {
      title: `A. Các chuyên ngành đào tạo và số phiếu lấy ý kiến học viên ${courseName.toLowerCase()}`,
      introText: sectionAIntroText,
      totalMajors,
      totalStudents,
      totalTaken,
      majors,
    },
    sectionB: {
      title: "B. Nhận xét đánh giá của học viên các chuyên ngành",
      fields,
    },
    sectionC: {
      title: "C. Tổng hợp chung",
      satisfactionPercent,
      satisfiedCount,
      totalCount: totalStudents,
      text: sectionCText,
    },
    sectionD: {
      title: "D. Các ý kiến góp ý của học viên",
      introText: sectionDIntroText,
      departments: departmentsFeedback,
    },
    recommendation: {
      title: "Kiến nghị",
      text: recommendationText,
      signTitle: "TRƯỞNG BAN",
    },
  }
}
