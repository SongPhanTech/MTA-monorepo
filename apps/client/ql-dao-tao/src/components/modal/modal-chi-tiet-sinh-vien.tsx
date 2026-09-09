import { Descriptions, Modal, Table, Tabs, Tag } from "antd"
import dayjs from "dayjs"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"
import { FIXED_CLASS_STUDENT_STATUS, SCORE_CONVERT_STATUS } from "@constants/constants"
import { useAcademicRankingBaseTypeOptions } from "@hooks/academicRankingBaseType"
import { useStudentTrainingTypeOptions } from "@hooks/studentTrainingType"
import { useFindUniqueStudent } from "@workspace/db/hooks"
import { formatPlaceOfBirth } from "@workspace/libs/utils"

dayjs.locale("vi")

const ModalChiTietSinhVien = () => {
  const { isOpen, onClose, input } = useDisclosure<{
    id: string
  }>({
    tag: "ModalChiTietSinhVien",
  })
  const id = input?.id
  const { getStudentTrainingTypeLabel, getStudentTrainingTypeColor } =
    useStudentTrainingTypeOptions()
  const { getAcademicRankingBaseTypeLabel } = useAcademicRankingBaseTypeOptions()
  const { data: studentData, isLoading } = useFindUniqueStudent(
    {
      where: { id },
      include: {
        userProfile: {
          include: {
            rank: true,
            gender: true,
            provinceOfBirth: true,
            newProvinceOfBirth: true,
            position: true,
            positionCPV: true,
            chucVuChinhQuyen: true,
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
        curriculumVersion: {
          include: {
            trainingLevel: true,
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
        curriculumVersionParallel: true,
        trainingLocation: true,
        priorityObject: true,
        subjectClassStudent: {
          where: {
            // OR: [
            //     {
            //         subjectClassId: {
            //             not: null,
            //         },
            //     },
            //     {
            //         manualFinalScore: {
            //             not: null,
            //         },
            //     },
            // ],
            // {
            subjectClassId: {
              not: null,
            },
            // },
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
        studentAcademicDecision: {
          orderBy: {
            createdAt: "desc",
          },
        },
        graduationApplications: {
          orderBy: {
            createdAt: "desc",
          },
        },
        graduationDecision: true,
        researchRegistrations: {
          orderBy: {
            createdAt: "desc",
          },
        },
        thesisRegistrations: {
          where: { deletedAt: null },
          include: {
            thesisProject: {
              include: {
                primarySupervisor: {
                  include: {
                    userProfile: {
                      include: {
                        academicRankType: true,
                        academicDegreeType: true,
                      },
                    },
                  },
                },
                secondarySupervisor: {
                  include: {
                    userProfile: {
                      include: {
                        academicRankType: true,
                        academicDegreeType: true,
                      },
                    },
                  },
                },
                supervisor: {
                  include: {
                    academicRankType: true,
                    academicDegreeType: true,
                    lecturer: {
                      include: {
                        userProfile: {
                          include: {
                            academicRankType: true,
                            academicDegreeType: true,
                          },
                        },
                      },
                    },
                  },
                },
                coSupervisor: {
                  include: {
                    academicRankType: true,
                    academicDegreeType: true,
                    lecturer: {
                      include: {
                        userProfile: {
                          include: {
                            academicRankType: true,
                            academicDegreeType: true,
                          },
                        },
                      },
                    },
                  },
                },
                thirdSupervisor: {
                  include: {
                    academicRankType: true,
                    academicDegreeType: true,
                    lecturer: {
                      include: {
                        userProfile: {
                          include: {
                            academicRankType: true,
                            academicDegreeType: true,
                          },
                        },
                      },
                    },
                  },
                },
                thesisSession: true,
                defenseSession: true,
                room: true,
                council: {
                  include: {
                    members: {
                      include: {
                        expert: {
                          include: {
                            academicRankType: true,
                            academicDegreeType: true,
                            lecturer: {
                              include: {
                                userProfile: {
                                  include: {
                                    academicRankType: true,
                                    academicDegreeType: true,
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            council: {
              include: {
                members: {
                  include: {
                    expert: {
                      include: {
                        academicRankType: true,
                        academicDegreeType: true,
                        lecturer: {
                          include: {
                            userProfile: {
                              include: {
                                academicRankType: true,
                                academicDegreeType: true,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        diplomaVerificationApplication: {
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
        studentScoreConvert: {
          orderBy: {
            createdAt: "desc",
          },
        },
        classRegisterLogs: {
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
        notes: {
          orderBy: {
            createdAt: "desc",
          },
        },
        noteFolders: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    },
    { enabled: !!id }
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
      label: "Thông tin cơ bản",
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
            <Descriptions.Item label="Nơi sinh">
              {formatPlaceOfBirth(studentData?.userProfile)}
            </Descriptions.Item>
            <Descriptions.Item label="Giới tính">
              {studentData?.userProfile?.gender?.sTen || ""}
            </Descriptions.Item>
            <Descriptions.Item label="Email">{studentData?.userProfile?.email}</Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">
              {studentData?.userProfile?.phoneNumber}
            </Descriptions.Item>
            <Descriptions.Item label="Cấp bậc">
              {studentData?.userProfile?.rank?.sTen}
            </Descriptions.Item>
            <Descriptions.Item label="Chức vụ">
              {studentData?.userProfile?.position?.sTen ||
                studentData?.userProfile?.positionCPV?.sTen ||
                studentData?.userProfile?.chucVuChinhQuyen?.sTen ||
                ""}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {getStatusTag(studentData?.status || "")}
            </Descriptions.Item>
            <Descriptions.Item label="Số báo danh">{studentData?.registerNumber}</Descriptions.Item>
            <Descriptions.Item label="Mã hồ sơ tiến sĩ">
              {studentData?.doctoralCode}
            </Descriptions.Item>
            <Descriptions.Item label="Tổ hợp xét tuyển">
              {studentData?.admissionCombination}
            </Descriptions.Item>
            <Descriptions.Item label="Điểm xét tuyển">{studentData?.entryScore}</Descriptions.Item>
            <Descriptions.Item label="Điểm đánh giá năng lực">
              {studentData?.competencyScore}
            </Descriptions.Item>
            <Descriptions.Item label="Đối tượng đào tạo">
              {studentData?.fixedClass?.trainingCourse?.trainingObjectType?.name}
            </Descriptions.Item>
            <Descriptions.Item label="Điểm cơ bản/Môn 1">{studentData?.basic}</Descriptions.Item>
            <Descriptions.Item label="Điểm cơ sở/Môn 2">{studentData?.facility}</Descriptions.Item>
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
            <Descriptions.Item label="Cơ quan, đơn vị">{studentData?.department}</Descriptions.Item>
            <Descriptions.Item label="Địa chỉ cơ quan">
              {studentData?.departmentAddress}
            </Descriptions.Item>
            <Descriptions.Item label="Năm bắt đầu vào nghề">
              {studentData?.careerYear}
            </Descriptions.Item>
            <Descriptions.Item label="Trường đại học">
              {studentData?.universitySchool}
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
            <Descriptions.Item label="Lý do ưu tiên">
              {studentData?.priorityReason}
            </Descriptions.Item>
            <Descriptions.Item label="Từ ngày">
              {studentData?.from ? dayjs(studentData.from).format("DD/MM/YYYY") : ""}
            </Descriptions.Item>
            <Descriptions.Item label="Đến ngày">
              {studentData?.to ? dayjs(studentData.to).format("DD/MM/YYYY") : ""}
            </Descriptions.Item>
            <Descriptions.Item label="Lãnh đạo đoàn">
              {studentData?.unionLeader || ""}
            </Descriptions.Item>
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
              <Descriptions.Item label="Đình chỉ học">
                <Tag color={studentData?.suspended ? "red" : "green"}>
                  {studentData?.suspended ? "Có" : "Không"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Đuổi học">
                <Tag color={studentData?.expelled ? "red" : "green"}>
                  {studentData?.expelled ? "Có" : "Không"}
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
      label: `Điểm môn học (${studentData?.subjectClassStudent?.length || 0})`,
      children: (
        <Table
          dataSource={studentData?.subjectClassStudent || []}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10 }}
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
      label: `Kết quả học kỳ (${studentData?.studentSemesterResult?.length || 0})`,
      children: (
        <Table
          dataSource={studentData?.studentSemesterResult || []}
          rowKey="id"
          size="small"
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
              title: "GPA(4)",
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
              title: "GPA(10)",
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
      label: `Kết quả năm học (${studentData?.studentYearResult?.length || 0})`,
      children: (
        <Table
          dataSource={studentData?.studentYearResult || []}
          rowKey="id"
          size="small"
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
              title: "GPA(4)",
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
              title: "GPA(10)",
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
      label: `Học bổng (${studentData?.scholarshipAwards?.length || 0})`,
      children: (
        <Table
          dataSource={studentData?.scholarshipAwards || []}
          rowKey="id"
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
      label: `Chứng chỉ (${studentData?.archivedCertificate?.length || 0})`,
      children: (
        <Table
          dataSource={studentData?.archivedCertificate || []}
          rowKey="id"
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
      label: `Giải thưởng (${studentData?.archivedAward?.length || 0})`,
      children: (
        <Table
          dataSource={studentData?.archivedAward || []}
          rowKey="id"
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
      label: `Cảnh báo học tập (${studentData?.academicWarning?.length || 0})`,
      children: (
        <Table
          dataSource={studentData?.academicWarning || []}
          rowKey="id"
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
      label: `Cảnh cáo học đường (${studentData?.disciplinaryWarning?.length || 0})`,
      children: (
        <Table
          dataSource={studentData?.disciplinaryWarning || []}
          rowKey="id"
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
    {
      key: "quyet-dinh-hoc-vu",
      label: `Quyết định học vụ (${studentData?.studentAcademicDecision?.length || 0})`,
      children: (
        <Table
          dataSource={studentData?.studentAcademicDecision || []}
          rowKey="id"
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
              width: 150,
            },
            {
              title: "Mô tả",
              dataIndex: "description",
              width: 300,
            },
            {
              title: "Trạng thái",
              dataIndex: "active",
              width: 100,
              render: (active) => (
                <Tag color={active ? "green" : "red"}>
                  {active ? "Kích hoạt" : "Không kích hoạt"}
                </Tag>
              ),
            },
            {
              title: "Ngày tạo",
              dataIndex: "createdAt",
              width: 150,
              render: (date) => (date ? dayjs(date).format("DD/MM/YYYY HH:mm") : ""),
            },
          ]}
        />
      ),
    },
    {
      key: "don-xet-tot-nghiep",
      label: `Đơn xét tốt nghiệp (${studentData?.graduationApplications?.length || 0})`,
      children: (
        <Table
          dataSource={studentData?.graduationApplications || []}
          rowKey="id"
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
              width: 150,
            },
            {
              title: "Mô tả",
              dataIndex: "description",
              width: 300,
            },
            {
              title: "Trạng thái",
              dataIndex: "active",
              width: 100,
              render: (active) => (
                <Tag color={active ? "green" : "red"}>
                  {active ? "Kích hoạt" : "Không kích hoạt"}
                </Tag>
              ),
            },
            {
              title: "Ngày tạo",
              dataIndex: "createdAt",
              width: 150,
              render: (date) => (date ? dayjs(date).format("DD/MM/YYYY HH:mm") : ""),
            },
          ]}
        />
      ),
    },
    {
      key: "quyet-dinh-tot-nghiep",
      label: "Quyết định tốt nghiệp",
      children: studentData?.graduationDecision ? (
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Mã">{studentData.graduationDecision.code}</Descriptions.Item>
          <Descriptions.Item label="Mô tả">
            {studentData.graduationDecision.description}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={studentData.graduationDecision.active ? "green" : "red"}>
              {studentData.graduationDecision.active ? "Kích hoạt" : "Không kích hoạt"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">
            {studentData.graduationDecision.createdAt
              ? dayjs(studentData.graduationDecision.createdAt).format("DD/MM/YYYY HH:mm")
              : ""}
          </Descriptions.Item>
        </Descriptions>
      ) : (
        <div className="text-center text-gray-500 py-8">Chưa có quyết định tốt nghiệp</div>
      ),
    },
    {
      key: "dang-ky-nghien-cuu",
      label: `Đăng ký nghiên cứu (${studentData?.researchRegistrations?.length || 0})`,
      children: (
        <Table
          dataSource={studentData?.researchRegistrations || []}
          rowKey="id"
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
              width: 150,
            },
            {
              title: "Mô tả",
              dataIndex: "description",
              width: 300,
            },
            {
              title: "Trạng thái",
              dataIndex: "active",
              width: 100,
              render: (active) => (
                <Tag color={active ? "green" : "red"}>
                  {active ? "Kích hoạt" : "Không kích hoạt"}
                </Tag>
              ),
            },
            {
              title: "Ngày tạo",
              dataIndex: "createdAt",
              width: 150,
              render: (date) => (date ? dayjs(date).format("DD/MM/YYYY HH:mm") : ""),
            },
          ]}
        />
      ),
    },
    {
      key: "dang-ky-luan-van",
      label: `Đăng ký luận văn (${studentData?.thesisRegistrations?.length || 0})`,
      children: (
        <Table
          dataSource={studentData?.thesisRegistrations || []}
          rowKey="id"
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
              width: 150,
            },
            {
              title: "Mô tả",
              dataIndex: "description",
              width: 300,
            },
            {
              title: "Trạng thái",
              dataIndex: "active",
              width: 100,
              render: (active) => (
                <Tag color={active ? "green" : "red"}>
                  {active ? "Kích hoạt" : "Không kích hoạt"}
                </Tag>
              ),
            },
            {
              title: "Ngày tạo",
              dataIndex: "createdAt",
              width: 150,
              render: (date) => (date ? dayjs(date).format("DD/MM/YYYY HH:mm") : ""),
            },
          ]}
        />
      ),
    },
    {
      key: "tra-cuu-van-bang",
      label: `Tra cứu văn bằng (${studentData?.diplomaVerificationApplication?.length || 0})`,
      children: (
        <Table
          dataSource={studentData?.diplomaVerificationApplication || []}
          rowKey="id"
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
              width: 150,
            },
            {
              title: "Mô tả",
              dataIndex: "description",
              width: 300,
            },
            {
              title: "Trạng thái",
              dataIndex: "active",
              width: 100,
              render: (active) => (
                <Tag color={active ? "green" : "red"}>
                  {active ? "Kích hoạt" : "Không kích hoạt"}
                </Tag>
              ),
            },
            {
              title: "Ngày tạo",
              dataIndex: "createdAt",
              width: 150,
              render: (date) => (date ? dayjs(date).format("DD/MM/YYYY HH:mm") : ""),
            },
          ]}
        />
      ),
    },
    {
      key: "diem-ren-luyen",
      label: `Điểm rèn luyện (${studentData?.studentTrainingScore?.length || 0})`,
      children: (
        <Table
          dataSource={studentData?.studentTrainingScore || []}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
          columns={[
            {
              title: "STT",
              width: 50,
              align: "center",
              render: (_, __, index) => index + 1,
            },
            {
              title: "Học kỳ",
              dataIndex: ["trainingScoreSession", "semester", "name"],
              width: 150,
            },
            {
              title: "Đợt đánh giá",
              dataIndex: ["trainingScoreSession", "name"],
              width: 180,
            },
            // {
            //     title: 'Điểm rèn luyện',
            //     dataIndex: 'score',
            //     width: 120,
            //     align: 'center',
            //     render: (score) => (score ? Number(score).toFixed(1) : ''),
            // },
            {
              title: "Xếp loại",
              dataIndex: "studentTrainingType",
              width: 150,
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
                  MEDIUM: "Trung bình khá",
                  AVERAGE: "Trung bình",
                  POOR: "Yếu",
                  VERY_POOR: "Kém",
                }
                return <Tag color={colorMap[type] || "default"}>{labelMap[type] || type}</Tag>
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
      ),
    },
    {
      key: "chuyen-doi-diem",
      label: `Chuyển đổi điểm (${studentData?.studentScoreConvert?.length || 0})`,
      children: (
        <Table
          dataSource={studentData?.studentScoreConvert || []}
          rowKey="id"
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
              width: 150,
            },
            {
              title: "Mô tả",
              dataIndex: "description",
              width: 300,
            },
            {
              title: "Trạng thái",
              dataIndex: "status",
              width: 120,
              align: "center",
              render: (status) => {
                const colorMap: Record<string, string> = {
                  PENDING: "orange",
                  APPROVED: "green",
                  REJECTED: "red",
                  PARTIAL: "blue",
                }
                return (
                  <Tag color={colorMap[status] || "default"}>
                    {SCORE_CONVERT_STATUS[status as keyof typeof SCORE_CONVERT_STATUS] || status}
                  </Tag>
                )
              },
            },
            {
              title: "Ngày tạo",
              dataIndex: "createdAt",
              width: 150,
              render: (date) => (date ? dayjs(date).format("DD/MM/YYYY HH:mm") : ""),
            },
          ]}
        />
      ),
    },
    {
      key: "lich-su-dang-ky-lop",
      label: `Lịch sử đăng ký lớp (${studentData?.classRegisterLogs?.length || 0})`,
      children: (
        <Table
          dataSource={studentData?.classRegisterLogs || []}
          rowKey="id"
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
              title: "Lớp học phần",
              dataIndex: ["subjectClass", "name"],
              width: 200,
            },
            {
              title: "Môn học",
              dataIndex: ["subjectClass", "subject", "name"],
              width: 250,
            },
            {
              title: "Mã",
              dataIndex: "code",
              width: 150,
            },
            {
              title: "Ngày thực hiện",
              dataIndex: "createdAt",
              width: 150,
              render: (date) => (date ? dayjs(date).format("DD/MM/YYYY HH:mm") : ""),
            },
          ]}
        />
      ),
    },
    {
      key: "ghi-chu",
      label: `Ghi chú (${studentData?.notes?.length || 0})`,
      children: (
        <Table
          dataSource={studentData?.notes || []}
          rowKey="id"
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
              title: "Tiêu đề",
              dataIndex: "title",
              width: 200,
            },
            {
              title: "Nội dung",
              dataIndex: "content",
              width: 400,
            },
            {
              title: "Ngày tạo",
              dataIndex: "createdAt",
              width: 150,
              render: (date) => (date ? dayjs(date).format("DD/MM/YYYY HH:mm") : ""),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <Modal
      title={`Chi tiết sinh viên: ${studentData?.code || ""} - ${studentData?.userProfile?.fullname || ""}`}
      open={isOpen}
      onCancel={onClose}
      width="95vw"
      style={{ top: 20 }}
      footer={null}
      loading={isLoading}
    >
      <Tabs items={tabItems} defaultActiveKey="thong-tin-co-ban" />
    </Modal>
  )
}

export default ModalChiTietSinhVien
