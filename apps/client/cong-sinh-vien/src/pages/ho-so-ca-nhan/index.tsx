import { Descriptions, Input, Select, Table, Tabs, Tag } from "antd"
import dayjs from "dayjs"
import "dayjs/locale/vi"
import { useMemo, useState } from "react"
import { FIXED_CLASS_STUDENT_STATUS } from "@constants/constants"
import { useAcademicRankingBaseTypeOptions } from "@hooks/academicRankingBaseType"
import { useStudentTrainingTypeOptions } from "@hooks/studentTrainingType"
import DefaultLayout from "@layouts/default-layout"
import { useSession } from "@workspace/auth/react"
import { useFindUniqueStudent, useFindUniqueUserProfile } from "@workspace/db/hooks"

import type {
  AcademicRankingConvert,
  SchoolYear,
  Semester,
  StudentSemesterResult,
  StudentTrainingType,
  StudentYearResult,
} from "@workspace/db"

dayjs.locale("vi")

type StudentSemesterResultWithRelations = StudentSemesterResult & {
  semester?: Semester | null
  rank?: AcademicRankingConvert | null
}

type StudentYearResultWithRelations = StudentYearResult & {
  schoolYear?: SchoolYear | null
  rank?: AcademicRankingConvert | null
}

const TRAINING_TYPE_COLOR_MAP: Record<StudentTrainingType, string> = {
  EXCELLENT: "green",
  GOOD: "blue",
  FAIR: "cyan",
  MEDIUM: "geekblue",
  AVERAGE: "orange",
  POOR: "red",
  VERY_POOR: "volcano",
}

const TRAINING_TYPE_LABEL_MAP: Record<StudentTrainingType, string> = {
  EXCELLENT: "Xuất sắc",
  GOOD: "Tốt",
  FAIR: "Khá",
  MEDIUM: "TB Khá",
  AVERAGE: "Trung bình",
  POOR: "Yếu",
  VERY_POOR: "Kém",
}

function resolveTrainingType(
  trainingType: StudentTrainingType | null | undefined,
  conductScore: number | null | undefined,
): StudentTrainingType | null {
  if (trainingType) return trainingType
  if (conductScore == null) return null
  const score = Number(conductScore)
  if (score >= 90) return "EXCELLENT"
  if (score >= 80) return "GOOD"
  if (score >= 65) return "FAIR"
  if (score >= 50) return "MEDIUM"
  if (score >= 35) return "POOR"
  return "VERY_POOR"
}

const getRowSTT = <T,>(dataSource: T[] | undefined, record: T, fallbackIndex: number): number => {
  if (dataSource && Array.isArray(dataSource)) {
    const idx = dataSource.indexOf(record)
    if (idx !== -1) return idx + 1
  }
  return fallbackIndex + 1
}

const HoSoCaNhan = () => {
  const { data: me } = useSession()
  const id = me?.sDM_NhanVienId || ""
  const { getStudentTrainingTypeLabel, getStudentTrainingTypeColor } =
    useStudentTrainingTypeOptions()
  const { getAcademicRankingBaseTypeLabel } = useAcademicRankingBaseTypeOptions()

  const { data: userProfileData } = useFindUniqueUserProfile({
    where: { id },
    select: {
      educationAndTraining: {
        select: {
          id: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  })
  const studentId = userProfileData?.educationAndTraining?.[0]?.id || ""

  const { data: studentData } = useFindUniqueStudent(
    {
      where: { id: studentId },
      include: {
        userProfile: {
          include: {
            gender: true,
          },
        },
        fixedClass: {
          include: {
            trainingCourse: {
              include: {
                trainingObjectType: true,
              },
            },
            curriculumVersion: {
              include: {
                curriculum: {
                  include: {
                    trainingMajor: {
                      include: {
                        trainingField: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        curriculumVersion: true,
        curriculumVersionParallel: true,
        trainingLocation: true,
        subjectClassStudent: {
          where: {
            subjectClassId: { not: null },
          },
          include: {
            subjectClass: {
              include: {
                subject: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        studentSemesterResult: {
          include: {
            semester: true,
            rank: true,
          },
          orderBy: {
            semesterIndexInCourse: "asc",
          },
        },
        studentYearResult: {
          include: {
            schoolYear: true,
            rank: true,
          },
          orderBy: {
            studyYear: "asc",
          },
        },
        scholarshipAwards: {
          include: {
            scholarship: true,
            semester: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        archivedCertificate: {
          include: {
            certificate: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        archivedAward: {
          include: {
            award: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        academicWarning: {
          include: {
            semester: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        disciplinaryWarning: {
          include: {
            semester: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        semesterTrainingScore: {
          include: {
            semester: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        studentTrainingScore: {
          include: {
            trainingScoreSession: {
              include: {
                semester: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        graduationDecision: true,
      },
    },
    { enabled: !!studentId }
  )

  const getStatusTag = (status: string) => {
    const statusConfig =
      FIXED_CLASS_STUDENT_STATUS[status as keyof typeof FIXED_CLASS_STUDENT_STATUS]
    if (!statusConfig) return <Tag>{status}</Tag>

    return <Tag color={statusConfig.color}>{statusConfig.label}</Tag>
  }

  const combinedTrainingScores = useMemo(() => {
    const list1 = (studentData?.semesterTrainingScore || []).map((item) => ({
      id: item.id,
      semesterName: item.semester?.name || "",
      sessionName: "Điểm rèn luyện học kỳ",
      score: item.score,
      studentTrainingType: (item as any).studentTrainingType,
      status: item.status,
      createdAt: item.createdAt,
    }))

    const list2 = (studentData?.studentTrainingScore || []).map((item) => ({
      id: item.id,
      semesterName: item.trainingScoreSession?.semester?.name || "",
      sessionName: item.trainingScoreSession?.name || "Đợt đánh giá",
      score: item.score,
      studentTrainingType: item.studentTrainingType,
      status: item.status,
      createdAt: item.createdAt,
    }))

    return [...list1, ...list2]
  }, [studentData])

  // ── Search states per tab ──────────────────────────────────────────────────
  const [searchDiemMonHoc, setSearchDiemMonHoc] = useState("")
  const [searchKetQuaHocKy, setSearchKetQuaHocKy] = useState("")
  const [filterXepLoaiRLHocKy, setFilterXepLoaiRLHocKy] = useState<string>("ALL")
  const [filterXepLoaiHTHocKy, setFilterXepLoaiHTHocKy] = useState<string>("ALL")
  const [searchKetQuaNamHoc, setSearchKetQuaNamHoc] = useState("")
  const [filterXepLoaiRLNamHoc, setFilterXepLoaiRLNamHoc] = useState<string>("ALL")
  const [filterXepLoaiHTNamHoc, setFilterXepLoaiHTNamHoc] = useState<string>("ALL")
  const [searchHocBong, setSearchHocBong] = useState("")
  const [searchChungChi, setSearchChungChi] = useState("")
  const [searchGiaiThuong, setSearchGiaiThuong] = useState("")
  const [searchCanhBaoHocTap, setSearchCanhBaoHocTap] = useState("")
  const [searchCanhCaoHocDuong, setSearchCanhCaoHocDuong] = useState("")
  const [searchDiemRenLuyen, setSearchDiemRenLuyen] = useState("")
  const [filterStatusDiemRenLuyen, setFilterStatusDiemRenLuyen] = useState<string>("ALL")

  // ── Filtered data per tab ──────────────────────────────────────────────────
  const filteredDiemMonHoc = useMemo(() => {
    const q = searchDiemMonHoc.toLowerCase().trim()
    if (!q) return studentData?.subjectClassStudent || []
    return (studentData?.subjectClassStudent || []).filter((r) => {
      const subj = r.subjectClass?.subject
      return [
        subj?.code,
        subj?.name,
      ].some((v) => String(v ?? "").toLowerCase().includes(q))
    })
  }, [studentData, searchDiemMonHoc])

  const filteredKetQuaHocKy = useMemo(() => {
    const q = searchKetQuaHocKy.toLowerCase().trim()
    let list = (studentData?.studentSemesterResult || []) as StudentSemesterResultWithRelations[]
    
    if (filterXepLoaiRLHocKy !== "ALL") {
      list = list.filter((r) => resolveTrainingType(r.studentTrainingType, r.conductScore) === filterXepLoaiRLHocKy)
    }
    if (filterXepLoaiHTHocKy !== "ALL") {
      list = list.filter((r) => r.rank?.classification === filterXepLoaiHTHocKy)
    }
    if (!q) return list
    return list.filter((r) => [
      r.code,
      r.semester?.code,
      r.semester?.name,
      r.rank?.classification,
      TRAINING_TYPE_LABEL_MAP[resolveTrainingType(r.studentTrainingType, r.conductScore) ?? ("" as StudentTrainingType)] ?? "",
    ].some((v) => String(v ?? "").toLowerCase().includes(q)))
  }, [studentData, searchKetQuaHocKy, filterXepLoaiRLHocKy, filterXepLoaiHTHocKy])

  const filteredKetQuaNamHoc = useMemo(() => {
    const q = searchKetQuaNamHoc.toLowerCase().trim()
    let list = (studentData?.studentYearResult || []) as StudentYearResultWithRelations[]

    if (filterXepLoaiRLNamHoc !== "ALL") {
      list = list.filter((r) => resolveTrainingType(r.studentTrainingType, r.conductScore) === filterXepLoaiRLNamHoc)
    }
    if (filterXepLoaiHTNamHoc !== "ALL") {
      list = list.filter((r) => r.rank?.classification === filterXepLoaiHTNamHoc)
    }
    if (!q) return list
    return list.filter((r) => [
      r.code,
      r.schoolYear?.code,
      r.schoolYear?.name,
      r.rank?.classification,
      TRAINING_TYPE_LABEL_MAP[resolveTrainingType(r.studentTrainingType, r.conductScore) ?? ("" as StudentTrainingType)] ?? "",
    ].some((v) => String(v ?? "").toLowerCase().includes(q)))
  }, [studentData, searchKetQuaNamHoc, filterXepLoaiRLNamHoc, filterXepLoaiHTNamHoc])

  const filteredHocBong = useMemo(() => {
    const q = searchHocBong.toLowerCase().trim()
    if (!q) return studentData?.scholarshipAwards || []
    return (studentData?.scholarshipAwards || []).filter((r) => [
      r.scholarship?.name,
      r.semester?.name,
    ].some((v) => String(v ?? "").toLowerCase().includes(q)))
  }, [studentData, searchHocBong])

  const filteredChungChi = useMemo(() => {
    const q = searchChungChi.toLowerCase().trim()
    if (!q) return studentData?.archivedCertificate || []
    return (studentData?.archivedCertificate || []).filter((r) => [
      r.certificate?.name,
      r.certificate?.code,
      r.issuedBy,
    ].some((v) => String(v ?? "").toLowerCase().includes(q)))
  }, [studentData, searchChungChi])

  const filteredGiaiThuong = useMemo(() => {
    const q = searchGiaiThuong.toLowerCase().trim()
    if (!q) return studentData?.archivedAward || []
    return (studentData?.archivedAward || []).filter((r) => [
      r.award?.name,
    ].some((v) => String(v ?? "").toLowerCase().includes(q)))
  }, [studentData, searchGiaiThuong])

  const filteredCanhBaoHocTap = useMemo(() => {
    const q = searchCanhBaoHocTap.toLowerCase().trim()
    if (!q) return studentData?.academicWarning || []
    return (studentData?.academicWarning || []).filter((r) => [
      r.semester?.name,
      r.description,
    ].some((v) => String(v ?? "").toLowerCase().includes(q)))
  }, [studentData, searchCanhBaoHocTap])

  const filteredCanhCaoHocDuong = useMemo(() => {
    const q = searchCanhCaoHocDuong.toLowerCase().trim()
    if (!q) return studentData?.disciplinaryWarning || []
    return (studentData?.disciplinaryWarning || []).filter((r) => [
      r.semester?.name,
      r.description,
    ].some((v) => String(v ?? "").toLowerCase().includes(q)))
  }, [studentData, searchCanhCaoHocDuong])

  const filteredDiemRenLuyen = useMemo(() => {
    const q = searchDiemRenLuyen.toLowerCase().trim()
    let list = combinedTrainingScores
    if (filterStatusDiemRenLuyen !== "ALL") {
      list = list.filter((r) => r.status === filterStatusDiemRenLuyen)
    }
    if (!q) return list
    return list.filter((r) => [
      r.semesterName,
      r.sessionName,
      r.status,
    ].some((v) => String(v ?? "").toLowerCase().includes(q)))
  }, [combinedTrainingScores, searchDiemRenLuyen, filterStatusDiemRenLuyen])

  const tabItems = [
    {
      key: "thong-tin-co-ban",
      label: "1. Thông tin cơ bản",
      children: (
        <div className="space-y-4">
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Mã sinh viên">{studentData?.code}</Descriptions.Item>
            <Descriptions.Item label="Họ và tên">
              {studentData?.userProfile?.fullname}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày sinh">
              {studentData?.userProfile?.dateOfBirth
                ? dayjs(studentData.userProfile.dateOfBirth).format("DD/MM/YYYY")
                : ""}
            </Descriptions.Item>
            <Descriptions.Item label="Giới tính">
              {studentData?.userProfile?.gender?.sTen || ""}
            </Descriptions.Item>
            <Descriptions.Item label="Email">{studentData?.userProfile?.email}</Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">
              {studentData?.userProfile?.phoneNumber}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {getStatusTag(studentData?.status || "")}
            </Descriptions.Item>
            <Descriptions.Item label="Điểm đánh giá năng lực">
              {studentData?.competencyScore}
            </Descriptions.Item>
            <Descriptions.Item label="Đối tượng đào tạo">
              {studentData?.fixedClass?.trainingCourse?.trainingObjectType?.name}
            </Descriptions.Item>
            <Descriptions.Item label="Lớp quản lý">
              {studentData?.fixedClass?.code} - {studentData?.fixedClass?.name}
            </Descriptions.Item>
            <Descriptions.Item label="Khoá học">
              {studentData?.fixedClass?.trainingCourse?.name}
            </Descriptions.Item>
            <Descriptions.Item label="Ngành đào tạo">
              {
                studentData?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.trainingField
                  ?.name
              }
            </Descriptions.Item>
            <Descriptions.Item label="Chuyên ngành">
              {studentData?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name}
            </Descriptions.Item>
            <Descriptions.Item label="CTĐT">
              {studentData?.curriculumVersion?.name}
            </Descriptions.Item>
            <Descriptions.Item label="CTĐT song song">
              {studentData?.curriculumVersionParallel?.name}
            </Descriptions.Item>
            <Descriptions.Item label="Địa điểm đào tạo">
              {studentData?.trainingLocation?.name}
            </Descriptions.Item>
            <Descriptions.Item label="Hệ đào tạo">
              {studentData?.universityTrainingType}
            </Descriptions.Item>
            <Descriptions.Item label="Năm tốt nghiệp">
              {studentData?.universityGraduationYear}
            </Descriptions.Item>
            <Descriptions.Item label="Ngành/Chuyên ngành">
              {studentData?.universityMajor}
            </Descriptions.Item>
            <Descriptions.Item label="Loại/Bậc tốt nghiệp">
              {studentData?.universityRank}
            </Descriptions.Item>
            <Descriptions.Item label="Ngoại ngữ">{studentData?.foreignLanguage}</Descriptions.Item>
          </Descriptions>

          <div>
            <h4 className="font-semibold mb-2">Điều kiện tốt nghiệp:</h4>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Ngoại ngữ">
                <Tag color={studentData?.foreignLangPass ? "green" : "red"}>
                  {studentData?.foreignLangPass ? "Đạt" : "Chưa đạt"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Chứng chỉ CNTT">
                <Tag color={studentData?.ITCertificationPass ? "green" : "red"}>
                  {studentData?.ITCertificationPass ? "Đạt" : "Chưa đạt"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Rèn luyện sức khỏe">
                <Tag color={studentData?.strengthTrainingPass ? "green" : "red"}>
                  {studentData?.strengthTrainingPass ? "Đạt" : "Chưa đạt"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Giáo dục quốc phòng">
                <Tag color={studentData?.militaryTrainingPass ? "green" : "red"}>
                  {studentData?.militaryTrainingPass ? "Đạt" : "Chưa đạt"}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Tình trạng học tập:</h4>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Mức cảnh báo học tập">
                <Tag color={studentData?.academicWarningLevel ? "orange" : "green"}>
                  {studentData?.academicWarningLevel || 0}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Mức cảnh cáo học đường">
                <Tag color={studentData?.disciplinaryWarningLevel ? "orange" : "green"}>
                  {studentData?.disciplinaryWarningLevel || 0}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </div>

          {studentData?.note && (
            <div>
              <h4 className="font-semibold mb-2">Ghi chú:</h4>
              <div className="border p-3 rounded bg-gray-50">{studentData.note}</div>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "diem-mon-hoc",
      label: `2. Điểm môn học (${studentData?.subjectClassStudent?.length || 0})`,
      children: (
        <div className="space-y-3">
          <Input.Search
            placeholder="Tìm theo mã môn, tên môn học..."
            allowClear
            value={searchDiemMonHoc}
            onChange={(e) => setSearchDiemMonHoc(e.target.value)}
            style={{ maxWidth: 360 }}
          />
            <Table
              dataSource={filteredDiemMonHoc}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 10 }}
              bordered
              scroll={{ x: 1200 }}
          columns={[
            {
              title: "STT",
              width: 50,
              align: "center",
              render: (_, record, index) => getRowSTT(studentData?.subjectClassStudent, record, index),
            },
            {
              title: "Mã môn",
              dataIndex: ["subjectClass", "subject", "code"],
              width: 100,
            },
            {
              title: "Tên môn học",
              dataIndex: ["subjectClass", "subject", "name"],
              width: 250,
            },
            {
              title: "Tín chỉ",
              dataIndex: ["subjectClass", "subject", "credit"],
              width: 80,
              align: "center",
            },
            {
              title: "Điểm TX",
              dataIndex: "attendanceScore",
              width: 90,
              align: "center",
              render: (score) => (score ? Number(score).toFixedSmart(2) : ""),
            },
            {
              title: "Điểm ĐK",
              dataIndex: "midtermScore",
              width: 90,
              align: "center",
              render: (score) => (score ? Number(score).toFixedSmart(2) : ""),
            },
            {
              title: "Điểm thi",
              dataIndex: "examScore",
              width: 90,
              align: "center",
              render: (score) => (score ? Number(score).toFixedSmart(2) : ""),
            },
            {
              title: "Điểm hệ 10",
              dataIndex: "finalScore",
              width: 90,
              align: "center",
              render: (score) => (
                <span className={score && Number(score) >= 5 ? "text-green-600" : "text-red-600"}>
                  {score ? Number(score).toFixedSmart(2) : ""}
                </span>
              ),
            },
          ]}
          />
          </div>
      ),
    },
    {
      key: "ket-qua-hoc-ky",
      label: `3. Kết quả học kỳ (${studentData?.studentSemesterResult?.length || 0})`,
      children: (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Input.Search
              placeholder="Tìm theo mã, học kỳ, xếp loại..."
              allowClear
              value={searchKetQuaHocKy}
              onChange={(e) => setSearchKetQuaHocKy(e.target.value)}
              style={{ width: 300 }}
            />
            <Select
              value={filterXepLoaiRLHocKy}
              onChange={setFilterXepLoaiRLHocKy}
              style={{ width: 160 }}
              options={[
                { value: "ALL", label: "Tất cả xếp loại RL" },
                { value: "EXCELLENT", label: "Xuất sắc" },
                { value: "GOOD", label: "Tốt" },
                { value: "FAIR", label: "Khá" },
                { value: "MEDIUM", label: "TB Khá" },
                { value: "AVERAGE", label: "Trung bình" },
                { value: "POOR", label: "Yếu" },
                { value: "VERY_POOR", label: "Kém" },
              ]}
            />
            <Select
              value={filterXepLoaiHTHocKy}
              onChange={setFilterXepLoaiHTHocKy}
              style={{ width: 160 }}
              options={[
                { value: "ALL", label: "Tất cả xếp loại HT" },
                { value: "Xuất sắc", label: "Xuất sắc" },
                { value: "Giỏi", label: "Giỏi" },
                { value: "Khá", label: "Khá" },
                { value: "Trung bình", label: "Trung bình" },
                { value: "Yếu", label: "Yếu" },
                { value: "Kém", label: "Kém" },
              ]}
            />
          </div>
            <Table
              dataSource={filteredKetQuaHocKy}
              rowKey="id"
              size="small"
              bordered
              pagination={{ pageSize: 10 }}
              scroll={{ x: 2400 }}
          columns={[
            {
              title: "STT",
              width: 50,
              align: "center",
              render: (_, record, index) => getRowSTT(studentData?.studentSemesterResult, record, index),
            },

            {
              title: "Học kỳ",
              dataIndex: ["semester", "name"],
              width: 120,
            },
            {
              title: "GPA (4)",
              dataIndex: "gpaBase4",
              width: 90,
              align: "center",
              render: (val) => (val ? Number(val).toFixed(2) : ""),
            },
            {
              title: "CPA (4)",
              dataIndex: "cumulativeGpaBase4",
              width: 90,
              align: "center",
              render: (val) => (val ? Number(val).toFixed(2) : ""),
            },
            {
              title: "GPA (10)",
              dataIndex: "gpaBase10",
              width: 90,
              align: "center",
              render: (val) => (val ? Number(val).toFixed(2) : ""),
            },
            {
              title: "CPA (10)",
              dataIndex: "cumulativeGpaBase10",
              width: 90,
              align: "center",
              render: (val) => (val ? Number(val).toFixed(2) : ""),
            },
            {
              title: "Xếp loại HT",
              dataIndex: ["rank", "classification"],
              width: 120,
            },
            {
              title: "TC đăng ký",
              dataIndex: "registeredCredits",
              width: 90,
              align: "center",
            },
            {
              title: "TC đạt",
              dataIndex: "passedCredits",
              width: 90,
              align: "center",
            },
            {
              title: "TC nợ",
              dataIndex: "failedCredits",
              width: 90,
              align: "center",
            },
            {
              title: "TC tích lũy",
              dataIndex: "accumulatedCredits",
              width: 90,
              align: "center",
            },
            {
              title: "TC học lại",
              dataIndex: "retakingCredits",
              width: 90,
              align: "center",
            },
            {
              title: "TC theo CTDT",
              dataIndex: "totalCreditsByCurriculum",
              width: 100,
              align: "center",
            },
            {
              title: "Tổng TC nợ",
              dataIndex: "totalFailedCredits",
              width: 100,
              align: "center",
            },
            {
              title: "Điểm thấp nhất",
              dataIndex: "lowestFinalScore",
              width: 100,
              align: "center",
              render: (score) => (score ? Number(score).toFixed(1) : ""),
            },
            {
              title: "Lớp trưởng",
              dataIndex: "isClassMonitor",
              width: 80,
              align: "center",
              render: (isMonitor) => (
                <Tag color={isMonitor ? "gold" : "default"}>{isMonitor ? "Có" : "Không"}</Tag>
              ),
            },
            {
              title: "Chức vụ Đoàn",
              dataIndex: "isUnionLeader",
              width: 90,
              align: "center",
              render: (isLeader) => (
                <Tag color={isLeader ? "purple" : "default"}>{isLeader ? "Có" : "Không"}</Tag>
              ),
            },
            {
              title: "Học cải thiện",
              dataIndex: "isImproving",
              width: 90,
              align: "center",
              render: (isImproving) => (
                <Tag color={isImproving ? "blue" : "default"}>{isImproving ? "Có" : "Không"}</Tag>
              ),
            },
            {
              title: "Tạm ngưng có lý do",
              dataIndex: "postponeWithReason",
              width: 120,
              align: "center",
              render: (postpone) => (
                <Tag color={postpone ? "orange" : "default"}>{postpone ? "Có" : "Không"}</Tag>
              ),
            },
            {
              title: "Cảnh cáo HT",
              dataIndex: "academicWarningLevel",
              width: 100,
              align: "center",
              render: (level) => <Tag color={level > 0 ? "orange" : "green"}>{level}</Tag>,
            },
            {
              title: "Cảnh cáo HĐ",
              dataIndex: "disciplinaryWarningLevel",
              width: 100,
              align: "center",
              render: (level) => <Tag color={level > 0 ? "orange" : "green"}>{level}</Tag>,
            },
          ]}
          />
        </div>
      ),
    },
    {
      key: "ket-qua-nam-hoc",
      label: `4. Kết quả năm học (${studentData?.studentYearResult?.length || 0})`,
      children: (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Input.Search
              placeholder="Tìm theo mã, năm học, xếp loại..."
              allowClear
              value={searchKetQuaNamHoc}
              onChange={(e) => setSearchKetQuaNamHoc(e.target.value)}
              style={{ width: 300 }}
            />
            <Select
              value={filterXepLoaiRLNamHoc}
              onChange={setFilterXepLoaiRLNamHoc}
              style={{ width: 160 }}
              options={[
                { value: "ALL", label: "Tất cả xếp loại RL" },
                { value: "EXCELLENT", label: "Xuất sắc" },
                { value: "GOOD", label: "Tốt" },
                { value: "FAIR", label: "Khá" },
                { value: "MEDIUM", label: "TB Khá" },
                { value: "AVERAGE", label: "Trung bình" },
                { value: "POOR", label: "Yếu" },
                { value: "VERY_POOR", label: "Kém" },
              ]}
            />
            <Select
              value={filterXepLoaiHTNamHoc}
              onChange={setFilterXepLoaiHTNamHoc}
              style={{ width: 160 }}
              options={[
                { value: "ALL", label: "Tất cả xếp loại HT" },
                { value: "Xuất sắc", label: "Xuất sắc" },
                { value: "Giỏi", label: "Giỏi" },
                { value: "Khá", label: "Khá" },
                { value: "Trung bình", label: "Trung bình" },
                { value: "Yếu", label: "Yếu" },
                { value: "Kém", label: "Kém" },
              ]}
            />
          </div>
            <Table
              dataSource={filteredKetQuaNamHoc}
              rowKey="id"
              size="small"
              bordered
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1400 }}
          columns={[
            {
              title: "STT",
              width: 50,
              align: "center",
              render: (_: unknown, record: StudentYearResultWithRelations, index: number) =>
                getRowSTT(studentData?.studentYearResult, record, index),
            },
            {
              title: "Năm học",
              dataIndex: ["schoolYear", "name"],
              width: 150,
            },
            {
              title: "Năm học thứ",
              dataIndex: "studyYear",
              width: 100,
              align: "center",
            },
            {
              title: "GPA (4)",
              dataIndex: "gpaBase4",
              width: 90,
              align: "center",
              render: (val) => val?.toString(),
            },
            {
              title: "CPA (4)",
              dataIndex: "cumulativeGpaBase4",
              width: 90,
              align: "center",
              render: (val) => val?.toString(),
            },
            {
              title: "GPA (10)",
              dataIndex: "gpaBase10",
              width: 90,
              align: "center",
              render: (val) => val?.toString(),
            },
            {
              title: "CPA (10)",
              dataIndex: "cumulativeGpaBase10",
              width: 90,
              align: "center",
              render: (val) => val?.toString(),
            },
            {
              title: "Xếp loại RL",
              width: 120,
              align: "center",
              render: (_: unknown, record: StudentYearResultWithRelations) => {
                const type = resolveTrainingType(record.studentTrainingType, record.conductScore)
                return type ? (
                  <Tag color={TRAINING_TYPE_COLOR_MAP[type]}>
                    {TRAINING_TYPE_LABEL_MAP[type]}
                  </Tag>
                ) : (
                  "-"
                )
              },
            },
            {
              title: "Xếp loại HT",
              width: 120,
              render: (_: unknown, record: StudentYearResultWithRelations) =>
                record.rank?.classification || "-",
            },
            {
              title: "Tổng TC",
              dataIndex: "totalCredits",
              width: 90,
              align: "center",
            },
            {
              title: "TC nợ",
              dataIndex: "failedCredits",
              width: 90,
              align: "center",
            },
            {
              title: "Năm cuối",
              dataIndex: "isLastStudyYear",
              width: 80,
              align: "center",
              render: (val) => <Tag color={val ? "green" : "default"}>{val ? "Có" : "Không"}</Tag>,
            },
            {
              title: "Thang điểm",
              dataIndex: "baseScore",
              width: 90,
              align: "center",
              render: (val) => getAcademicRankingBaseTypeLabel(val),
            },
            {
              title: "Lớp trưởng",
              dataIndex: "isClassMonitor",
              width: 90,
              align: "center",
              render: (val) => <Tag color={val ? "blue" : "default"}>{val ? "Có" : "Không"}</Tag>,
            },
            {
              title: "Cán bộ Đoàn",
              dataIndex: "isUnionLeader",
              width: 100,
              align: "center",
              render: (val) => <Tag color={val ? "purple" : "default"}>{val ? "Có" : "Không"}</Tag>,
            },
            {
              title: "Cảnh cáo HT",
              dataIndex: "academicWarningLevel",
              width: 100,
              align: "center",
              render: (level) => <Tag color={level > 0 ? "red" : "green"}>{level}</Tag>,
            },
            {
              title: "Cảnh cáo KL",
              dataIndex: "disciplinaryWarningLevel",
              width: 100,
              align: "center",
              render: (level) => <Tag color={level > 0 ? "orange" : "green"}>{level}</Tag>,
            },
            {
              title: "Đình chỉ",
              dataIndex: "suspended",
              width: 80,
              align: "center",
              render: (val) => <Tag color={val ? "red" : "default"}>{val ? "Có" : "Không"}</Tag>,
            },
            {
              title: "Khai trừ",
              dataIndex: "expelled",
              width: 80,
              align: "center",
              render: (val) => <Tag color={val ? "red" : "default"}>{val ? "Có" : "Không"}</Tag>,
            },
          ]}
          />
        </div>
      ),
    },
    {
      key: "hoc-bong",
      label: `5. Học bổng (${studentData?.scholarshipAwards?.length || 0})`,
      children: (
        <div className="space-y-3">
          <Input.Search
            placeholder="Tìm theo tên học bổng, học kỳ..."
            allowClear
            value={searchHocBong}
            onChange={(e) => setSearchHocBong(e.target.value)}
            style={{ maxWidth: 360 }}
          />
            <Table
              dataSource={filteredHocBong}
              rowKey="id"
              size="small"
              bordered
              pagination={{ pageSize: 10 }}
          columns={[
            {
              title: "STT",
              width: 50,
              align: "center",
              render: (_, record, index) => getRowSTT(studentData?.scholarshipAwards, record, index),
            },
            {
              title: "Tên học bổng",
              dataIndex: ["scholarship", "name"],
              width: 250,
            },
            {
              title: "Học kỳ",
              dataIndex: ["semester", "name"],
              width: 150,
            },
            {
              title: "Số tiền",
              dataIndex: "amount",
              width: 150,
              align: "right",
              render: (amount) =>
                amount
                  ? new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(amount)
                  : "",
            },
            {
              title: "GPA tại thời điểm",
              dataIndex: "gpaAtAward",
              width: 130,
              align: "center",
              render: (val) => val?.toFixed(2),
            },
            {
              title: "Thứ hạng ưu tiên",
              dataIndex: "priorityRank",
              width: 130,
              align: "center",
            },
            {
              title: "Ngày tạo",
              dataIndex: "createdAt",
              width: 120,
              render: (date) => (date ? dayjs(date).format("DD/MM/YYYY") : ""),
            },
          ]}
          />
        </div>
      ),
    },
    {
      key: "chung-chi",
      label: `6. Chứng chỉ (${studentData?.archivedCertificate?.length || 0})`,
      children: (
        <div className="space-y-3">
          <Input.Search
            placeholder="Tìm theo tên chứng chỉ, nơi cấp..."
            allowClear
            value={searchChungChi}
            onChange={(e) => setSearchChungChi(e.target.value)}
            style={{ maxWidth: 360 }}
          />
            <Table
              dataSource={filteredChungChi}
              rowKey="id"
              size="small"
              bordered
              pagination={{ pageSize: 10 }}
          columns={[
            {
              title: "STT",
              width: 50,
              align: "center",
              render: (_, record, index) => getRowSTT(studentData?.archivedCertificate, record, index),
            },
            {
              title: "Tên chứng chỉ",
              dataIndex: ["certificate", "name"],
              width: 200,
            },
            {
              title: "Điểm quy đổi",
              dataIndex: "finalScore",
              width: 100,
              align: "center",
              render: (val) => val?.toFixed(2),
            },
            {
              title: "Nghe",
              dataIndex: "listeningScore",
              width: 80,
              align: "center",
              render: (val?: number | null) => (val != null ? val : "-"),
            },
            {
              title: "Nói",
              dataIndex: "speakingScore",
              width: 80,
              align: "center",
              render: (val?: number | null) => (val != null ? val : "-"),
            },
            {
              title: "Đọc",
              dataIndex: "readingScore",
              width: 80,
              align: "center",
              render: (val?: number | null) => (val != null ? val : "-"),
            },
            {
              title: "Viết",
              dataIndex: "writingScore",
              width: 80,
              align: "center",
              render: (val?: number | null) => (val != null ? val : "-"),
            },
            {
              title: "Điểm chứng chỉ",
              dataIndex: "score",
              width: 100,
              align: "center",
              render: (val) => val?.toFixed(2),
            },
            {
              title: "Nơi cấp",
              dataIndex: "issuedBy",
              width: 150,
            },
            {
              title: "Ngày cấp",
              dataIndex: "issuedDate",
              width: 100,
              align: "center",
              render: (date) => (date ? dayjs(date).format("DD/MM/YYYY") : ""),
            },
            {
              title: "Ngày hết hạn",
              dataIndex: "expiredDate",
              width: 100,
              align: "center",
              render: (date) => (date ? dayjs(date).format("DD/MM/YYYY") : ""),
            },
            {
              title: "Trạng thái",
              dataIndex: "status",
              width: 100,
              align: "center",
              render: (status: string) => {
                const colors: Record<string, string> = {
                  PENDING: "blue",
                  CANCEL: "red",
                  APPROVED: "green",
                  REJECTED: "volcano",
                }
                const labels: Record<string, string> = {
                  PENDING: "Chờ duyệt",
                  CANCEL: "Hủy bỏ",
                  APPROVED: "Đã duyệt",
                  REJECTED: "Từ chối",
                }
                return <Tag color={colors[status] || "default"}>{labels[status] || status}</Tag>
              },
            },
            {
              title: "Mô tả",
              dataIndex: "description",
              width: 200,
            },
          ]}
          />
        </div>
      ),
    },
    {
      key: "giai-thuong",
      label: `7. Giải thưởng (${studentData?.archivedAward?.length || 0})`,
      children: (
        <div className="space-y-3">
          <Input.Search
            placeholder="Tìm theo tên giải thưởng..."
            allowClear
            value={searchGiaiThuong}
            onChange={(e) => setSearchGiaiThuong(e.target.value)}
            style={{ maxWidth: 360 }}
          />
            <Table
              dataSource={filteredGiaiThuong}
              rowKey="id"
              size="small"
              bordered
              pagination={{ pageSize: 10 }}
          columns={[
            {
              title: "STT",
              width: 50,
              align: "center",
              render: (_, record, index) => getRowSTT(studentData?.archivedAward, record, index),
            },
            {
              title: "Tên giải thưởng",
              dataIndex: ["award", "name"],
              width: 200,
            },
            {
              title: "Điểm thưởng",
              dataIndex: "bonusScore",
              width: 100,
              align: "center",
              render: (val) => val?.toFixed(2),
            },
            {
              title: "Ngày nhận",
              dataIndex: "date",
              width: 120,
              align: "center",
              render: (date) => (date ? dayjs(date).format("DD/MM/YYYY") : ""),
            },
            {
              title: "Trạng thái",
              dataIndex: "status",
              width: 100,
              align: "center",
              render: (status: string) => {
                const colors: Record<string, string> = {
                  PENDING: "blue",
                  CANCEL: "red",
                  APPROVED: "green",
                  REJECTED: "volcano",
                }
                const labels: Record<string, string> = {
                  PENDING: "Chờ duyệt",
                  CANCEL: "Hủy bỏ",
                  APPROVED: "Đã duyệt",
                  REJECTED: "Từ chối",
                }
                return <Tag color={colors[status] || "default"}>{labels[status] || status}</Tag>
              },
            },
            {
              title: "Mô tả",
              dataIndex: "description",
              width: 200,
            },
          ]}
          />
        </div>
      ),
    },
    {
      key: "canh-cao-hoc-tap",
      label: `8. Cảnh báo học tập (${studentData?.academicWarning?.length || 0})`,
      children: (
        <div className="space-y-3">
          <Input.Search
            placeholder="Tìm theo học kỳ, mô tả..."
            allowClear
            value={searchCanhBaoHocTap}
            onChange={(e) => setSearchCanhBaoHocTap(e.target.value)}
            style={{ maxWidth: 360 }}
          />
            <Table
              dataSource={filteredCanhBaoHocTap}
              rowKey="id"
              size="small"
              bordered
              pagination={{ pageSize: 10 }}
          columns={[
            {
              title: "STT",
              width: 50,
              align: "center",
              render: (_, record, index) => getRowSTT(studentData?.academicWarning, record, index),
            },
            {
              title: "Học kỳ",
              dataIndex: ["semester", "name"],
              width: 150,
            },
            {
              title: "Mức cảnh cáo",
              dataIndex: "level",
              width: 100,
              align: "center",
              render: (level) => <Tag color="orange">{level}</Tag>,
            },
            {
              title: "Tăng từ",
              dataIndex: "increasedFrom",
              width: 80,
              align: "center",
            },
            {
              title: "Giảm từ",
              dataIndex: "decreasedFrom",
              width: 80,
              align: "center",
            },
            {
              title: "Mô tả",
              dataIndex: "description",
              width: 250,
            },
            {
              title: "Ngày tạo",
              dataIndex: "createdAt",
              width: 120,
              align: "center",
              render: (date) => (date ? dayjs(date).format("DD/MM/YYYY") : ""),
            },
          ]}
          />
        </div>
      ),
    },
    {
      key: "canh-cao-hoc-duong",
      label: `9. Cảnh cáo học đường (${studentData?.disciplinaryWarning?.length || 0})`,
      children: (
        <div className="space-y-3">
          <Input.Search
            placeholder="Tìm theo học kỳ, mô tả..."
            allowClear
            value={searchCanhCaoHocDuong}
            onChange={(e) => setSearchCanhCaoHocDuong(e.target.value)}
            style={{ maxWidth: 360 }}
          />
            <Table
              dataSource={filteredCanhCaoHocDuong}
              rowKey="id"
              bordered
              size="small"
              pagination={{ pageSize: 10 }}
          columns={[
            {
              title: "STT",
              width: 50,
              align: "center",
              render: (_, record, index) => getRowSTT(studentData?.disciplinaryWarning, record, index),
            },
            {
              title: "Học kỳ",
              dataIndex: ["semester", "name"],
              width: 150,
            },
            {
              title: "Mức cảnh cáo",
              dataIndex: "level",
              width: 100,
              align: "center",
              render: (level) => <Tag color="red">{level}</Tag>,
            },
            {
              title: "Tăng từ",
              dataIndex: "increasedFrom",
              width: 80,
              align: "center",
            },
            {
              title: "Mô tả",
              dataIndex: "description",
              width: 250,
            },
            {
              title: "Ngày tạo",
              dataIndex: "createdAt",
              width: 120,
              align: "center",
              render: (date) => (date ? dayjs(date).format("DD/MM/YYYY") : ""),
            },
          ]}
          />
        </div>
      ),
    },
    {
      key: "diem-ren-luyen",
      label: `10. Điểm rèn luyện (${combinedTrainingScores.length})`,
      children: (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Input.Search
              placeholder="Tìm theo học kỳ, đợt đánh giá..."
              allowClear
              value={searchDiemRenLuyen}
              onChange={(e) => setSearchDiemRenLuyen(e.target.value)}
              style={{ width: 300 }}
            />
            <Select
              value={filterStatusDiemRenLuyen}
              onChange={setFilterStatusDiemRenLuyen}
              style={{ width: 160 }}
              options={[
                { value: "ALL", label: "Tất cả trạng thái" },
                { value: "APPROVED", label: "Đã duyệt" },
                { value: "PENDING", label: "Chờ duyệt" },
              ]}
            />
          </div>
            <Table
              dataSource={filteredDiemRenLuyen}
              rowKey="id"
              bordered
              size="small"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 800 }}
          columns={[
            {
              title: "STT",
              width: 50,
              align: "center",
              render: (_, record, index) => getRowSTT(combinedTrainingScores, record, index),
            },
            {
              title: "Học kỳ",
              dataIndex: "semesterName",
              width: 150,
            },
            {
              title: "Đợt đánh giá",
              dataIndex: "sessionName",
              width: 180,
            },
            {
              title: "Điểm rèn luyện",
              dataIndex: "score",
              width: 120,
              align: "center",
              render: (score) => (score != null ? Number(score).toFixed(1) : ""),
            },
            {
              title: "Xếp loại",
              dataIndex: "studentTrainingType",
              width: 150,
              align: "center",
              render: (type, record) => {
                let resolvedType = type
                if (!resolvedType && record.score != null) {
                  const score = Number(record.score)
                  if (score >= 9) resolvedType = "EXCELLENT"
                  else if (score >= 8) resolvedType = "GOOD"
                  else if (score >= 6.5) resolvedType = "FAIR"
                  else if (score >= 5) resolvedType = "MEDIUM"
                  else if (score >= 3.5) resolvedType = "POOR"
                  else resolvedType = "VERY_POOR"
                }

                const colorMap: Record<string, string> = {
                  EXCELLENT: "green",
                  GOOD: "blue",
                  FAIR: "cyan",
                  MEDIUM: "geekblue",
                  AVERAGE: "orange",
                  POOR: "red",
                  VERY_POOR: "volcano",
                }
                const labelMap: Record<string, string> = {
                  EXCELLENT: "Xuất sắc",
                  GOOD: "Tốt",
                  FAIR: "Khá",
                  MEDIUM: "Trung bình khá",
                  AVERAGE: "Trung bình",
                  POOR: "Yếu",
                  VERY_POOR: "Kém",
                }
                return resolvedType ? (
                  <Tag color={colorMap[resolvedType] || "default"}>
                    {labelMap[resolvedType] || resolvedType}
                  </Tag>
                ) : (
                  "-"
                )
              },
            },
            {
              title: "Trạng thái",
              dataIndex: "status",
              width: 120,
              align: "center",
              render: (status) => (
                <Tag color={status === "APPROVED" ? "green" : "orange"}>
                  {status === "APPROVED" ? "Đã duyệt" : "Chờ duyệt"}
                </Tag>
              ),
            },
            {
              title: "Ngày tạo",
              dataIndex: "createdAt",
              width: 150,
              render: (date) => (date ? dayjs(date).format("DD/MM/YYYY") : ""),
            },
          ]}
          />
        </div>
      ),
    },
  ]

  return <Tabs items={tabItems} defaultActiveKey="thong-tin-co-ban" />
}

HoSoCaNhan.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout breadcrumbList={[{ title: "Hồ sơ cá nhân" }]}>{page}</DefaultLayout>
}

export default HoSoCaNhan
