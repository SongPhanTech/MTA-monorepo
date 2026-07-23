import { Descriptions, Table, Tabs, Tag } from "antd"
import dayjs from "dayjs"
import "dayjs/locale/vi"
import { FIXED_CLASS_STUDENT_STATUS } from "@constants/constants"
import { useAcademicRankingBaseTypeOptions } from "@hooks/academicRankingBaseType"
import { useStudentTrainingTypeOptions } from "@hooks/studentTrainingType"
import DefaultLayout from "@layouts/default-layout"
import { useSession } from "@workspace/auth/react"
import { useFindUniqueStudent, useFindUniqueUserProfile } from "@workspace/db/hooks"

dayjs.locale("vi")

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
        <Table
          dataSource={studentData?.subjectClassStudent || []}
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
              render: (_, __, index) => index + 1,
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
      ),
    },
    {
      key: "ket-qua-hoc-ky",
      label: `3. Kết quả học kỳ (${studentData?.studentSemesterResult?.length || 0})`,
      children: (
        <Table
          dataSource={studentData?.studentSemesterResult || []}
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
              render: (_, __, index) => index + 1,
            },
            {
              title: "Mã",
              dataIndex: "code",
              width: 100,
            },
            {
              title: "Học kỳ",
              dataIndex: ["semester", "name"],
              width: 150,
            },
            {
              title: "Năm học thứ",
              dataIndex: "studyYear",
              width: 100,
              align: "center",
            },
            {
              title: "HK thứ",
              dataIndex: "semesterIndexInCourse",
              width: 80,
              align: "center",
            },
            {
              title: "HK cuối",
              dataIndex: "isLastSemester",
              width: 80,
              align: "center",
              render: (isLast) => (
                <Tag color={isLast ? "green" : "default"}>{isLast ? "Có" : "Không"}</Tag>
              ),
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
              title: "Điểm RL",
              dataIndex: "conductScore",
              width: 90,
              align: "center",
              render: (score) => (score ? Number(score).toFixed(1) : ""),
            },
            {
              title: "Xếp loại RL",
              dataIndex: "studentTrainingType",
              width: 120,
              align: "center",
              render: (type) => {
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
                  MEDIUM: "TB Khá",
                  AVERAGE: "Trung bình",
                  POOR: "Yếu",
                  VERY_POOR: "Kém",
                }
                return type ? (
                  <Tag color={colorMap[type] || "default"}>{labelMap[type] || type}</Tag>
                ) : (
                  ""
                )
              },
            },
            {
              title: "Xếp loại HT",
              dataIndex: ["rank", "name"],
              width: 120,
            },
            {
              title: "TC đăng ký",
              dataIndex: "registeredCredits",
              width: 100,
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
              width: 100,
              align: "center",
            },
            {
              title: "TC học lại",
              dataIndex: "retakingCredits",
              width: 100,
              align: "center",
            },
            {
              title: "TC theo CTDT",
              dataIndex: "totalCreditsByCurriculum",
              width: 110,
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
      ),
    },
    {
      key: "ket-qua-nam-hoc",
      label: `4. Kết quả năm học (${studentData?.studentYearResult?.length || 0})`,
      children: (
        <Table
          dataSource={studentData?.studentYearResult || []}
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
              render: (_, __, index) => index + 1,
            },
            {
              title: "Mã",
              dataIndex: "code",
              width: 100,
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
              title: "Điểm RL",
              dataIndex: "conductScore",
              width: 90,
              align: "center",
            },
            {
              title: "Xếp loại RL",
              dataIndex: "studentTrainingType",
              width: 120,
              align: "center",
              render: (type) => (
                <Tag color={getStudentTrainingTypeColor(type)}>
                  {getStudentTrainingTypeLabel(type)}
                </Tag>
              ),
            },
            {
              title: "Xếp loại HT",
              dataIndex: ["rank", "name"],
              width: 120,
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
      ),
    },
    {
      key: "hoc-bong",
      label: `5. Học bổng (${studentData?.scholarshipAwards?.length || 0})`,
      children: (
        <Table
          dataSource={studentData?.scholarshipAwards || []}
          rowKey="id"
          size="small"
          bordered
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: "STT",
              width: 50,
              align: "center",
              render: (_, __, index) => index + 1,
            },
            {
              title: "Mã",
              dataIndex: "code",
              width: 120,
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
      ),
    },
    {
      key: "chung-chi",
      label: `6. Chứng chỉ (${studentData?.archivedCertificate?.length || 0})`,
      children: (
        <Table
          dataSource={studentData?.archivedCertificate || []}
          rowKey="id"
          size="small"
          bordered
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: "STT",
              width: 50,
              align: "center",
              render: (_, __, index) => index + 1,
            },
            {
              title: "Mã",
              dataIndex: "code",
              width: 120,
            },
            {
              title: "Tên chứng chỉ",
              dataIndex: ["certificate", "name"],
              width: 200,
            },
            {
              title: "Điểm cuối kỳ",
              dataIndex: "finalScore",
              width: 100,
              align: "center",
              render: (val) => val?.toFixed(2),
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
      ),
    },
    {
      key: "giai-thuong",
      label: `7. Giải thưởng (${studentData?.archivedAward?.length || 0})`,
      children: (
        <Table
          dataSource={studentData?.archivedAward || []}
          rowKey="id"
          size="small"
          bordered
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: "STT",
              width: 50,
              align: "center",
              render: (_, __, index) => index + 1,
            },
            {
              title: "Mã",
              dataIndex: "code",
              width: 120,
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
      ),
    },
    {
      key: "canh-cao-hoc-tap",
      label: `8. Cảnh báo học tập (${studentData?.academicWarning?.length || 0})`,
      children: (
        <Table
          dataSource={studentData?.academicWarning || []}
          rowKey="id"
          size="small"
          bordered
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: "STT",
              width: 50,
              align: "center",
              render: (_, __, index) => index + 1,
            },
            {
              title: "Mã",
              dataIndex: "code",
              width: 120,
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
      ),
    },
    {
      key: "canh-cao-hoc-duong",
      label: `9. Cảnh cáo học đường (${studentData?.disciplinaryWarning?.length || 0})`,
      children: (
        <Table
          dataSource={studentData?.disciplinaryWarning || []}
          rowKey="id"
          bordered
          size="small"
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: "STT",
              width: 50,
              align: "center",
              render: (_, __, index) => index + 1,
            },
            {
              title: "Mã",
              dataIndex: "code",
              width: 120,
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
      ),
    },
  ]

  return <Tabs items={tabItems} defaultActiveKey="thong-tin-co-ban" />
}

HoSoCaNhan.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout breadcrumbList={[{ title: "Hồ sơ cá nhân" }]}>{page}</DefaultLayout>
}

export default HoSoCaNhan
