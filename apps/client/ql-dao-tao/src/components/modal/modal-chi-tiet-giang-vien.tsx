import useSpinner from "@hooks/spinner"
import { useStudentThesisRegistrationStatusOptions } from "@hooks/studentThesisRegistrationStatus"
import { useScheduleOptions } from "@hooks/subjectClassSchedule"
import { useSubjectClassTypeOptions } from "@hooks/subjectClassType"
import { useThesisProjectStatusOptions } from "@hooks/thesisProjectStatus"
import { useFindUniqueLecturer } from "@workspace/db/hooks"
import { Card, Col, Modal, Row, Table, Tabs, Tag, Typography } from "antd"
import dayjs from "dayjs"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"

const { Text, Title } = Typography

dayjs.locale("vi")

const ModalChiTietGiangVien = () => {
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "ModalChiTietGiangVien",
  })

  const { getThesisProjectStatusLabel, getThesisProjectStatusColor } =
    useThesisProjectStatusOptions()
  const { getStudentThesisRegistrationStatusLabel, getStudentThesisRegistrationStatusColor } =
    useStudentThesisRegistrationStatusOptions()
  const { getScheduleLabel } = useScheduleOptions()

  const { getSubjectClassTypeLabel } = useSubjectClassTypeOptions()

  const { data: lecturerData, isLoading } = useFindUniqueLecturer(
    {
      where: { id },
      include: {
        userProfile: {
          include: {
            rank: true,
            gender: true,
            academicRankType: true,
            academicDegreeType: true,
          },
        },
        organization: true,
        lecturerType: true,
        mainSubjectClasses: {
          include: {
            subject: true,
            semester: true,
          },
        },
        extraSubjectClasses: {
          include: {
            subject: true,
            semester: true,
          },
        },
        enterGradeClasses: {
          include: {
            subject: true,
            semester: true,
          },
        },
        manageFixedClass: {
          include: {
            trainingCourse: true,
            curriculumVersion: {
              include: {
                curriculum: {
                  include: {
                    trainingMajor: true,
                  },
                },
              },
            },
            classMonitor: {
              include: {
                userProfile: true,
              },
            },
            unionLeader: {
              include: {
                userProfile: true,
              },
            },
            managementOrganization: true,
          },
        },
        classSchedules: {
          include: {
            subjectClass: {
              include: {
                subject: true,
              },
            },
            room: true,
          },
        },
        extraClassSchedules: {
          include: {
            subjectClass: {
              include: {
                subject: true,
              },
            },
            room: true,
          },
        },
        researchProjects: {
          include: {
            registrations: {
              include: {
                student: {
                  include: {
                    userProfile: true,
                  },
                },
              },
            },
          },
        },
        reviewedRegistrations: {
          include: {
            student: {
              include: {
                userProfile: true,
              },
            },
            researchProject: true,
          },
        },
        reviewedThesisRegistrations: {
          include: {
            student: {
              include: {
                userProfile: true,
              },
            },
            thesisProject: true,
          },
        },
        expertProfile: true,
        evaluationCouncilMember: {
          include: {
            evaluationCouncil: true,
          },
        },
        survey: {
          include: {
            surveyTopic: true,
            subjectClass: {
              include: {
                subject: true,
              },
            },
            clusterSurvey: true,
          },
        },
        clusterSurvey: {
          include: {
            surveyTopic: true,
          },
        },
        examRoomsMain: {
          include: {
            examRoom: {
              include: {
                exam: {
                  include: {
                    subjectVersion: true,
                  },
                },
                room: true,
              },
            },
          },
        },
        examRoomsExtra: {
          include: {
            examRoom: {
              include: {
                exam: {
                  include: {
                    subjectVersion: true,
                  },
                },
                room: true,
              },
            },
          },
        },
      },
    },
    {
      enabled: !!id,
    }
  )

  useSpinner()

  if (!lecturerData) return null // Type cast để tránh lỗi TypeScript
  const lecturer = lecturerData

  const tabItems = [
    {
      key: "thong-tin-co-ban",
      label: "Thông tin cơ bản",
      children: (
        <Card className="border-primary" size="small">
          <Row gutter={[16, 24]}>
            {/* Hàng 1: Mã giảng viên, ID, Loại, Từ ngày */}
            <Col span={6}>
              <Text type="secondary">Mã giảng viên</Text>
              <div>
                <Text strong>{lecturer.code || "-"}</Text>
              </div>
            </Col>
            <Col span={6}>
              <Text type="secondary">ID giảng viên</Text>
              <div>
                <Text strong>{lecturer.lectureID || "-"}</Text>
              </div>
            </Col>
            <Col span={6}>
              <Text type="secondary">Loại giảng viên</Text>
              <div>
                <Text strong>{lecturer.lecturerType?.name || "-"}</Text>
              </div>
            </Col>
            <Col span={6}>
              <Text type="secondary">Từ ngày</Text>
              <div>
                <Text>{lecturer.from ? dayjs(lecturer.from).format("DD/MM/YYYY") : "-"}</Text>
              </div>
            </Col>

            {/* Hàng 2: Họ và tên, Ngày sinh, Giới tính, CCCD/CMND */}
            <Col span={6}>
              <Text type="secondary">Họ và tên</Text>
              <div>
                <Text strong>
                  {lecturer.userProfile?.lastName} {lecturer.userProfile?.firstName}
                </Text>
              </div>
            </Col>
            <Col span={6}>
              <Text type="secondary">Ngày sinh</Text>
              <div>
                <Text>
                  {lecturer.userProfile?.dateOfBirth
                    ? dayjs(lecturer.userProfile.dateOfBirth).format("DD/MM/YYYY")
                    : "-"}
                </Text>
              </div>
            </Col>
            <Col span={6}>
              <Text type="secondary">Giới tính</Text>
              <div>
                <Text>{lecturer.userProfile?.gender?.sTen || "-"}</Text>
              </div>
            </Col>
            <Col span={6}>
              <Text type="secondary">CCCD/CMND</Text>
              <div>
                <Text>{lecturer.userProfile?.idCardNumber || "-"}</Text>
              </div>
            </Col>

            {/* Hàng 3: Số quân nhân, Ngày vào ngành, Đơn vị, Số điện thoại */}
            <Col span={6}>
              <Text type="secondary">Số quân nhân</Text>
              <div>
                <Text>{lecturer.userProfile?.officerNumber || "-"}</Text>
              </div>
            </Col>
            <Col span={6}>
              <Text type="secondary">Ngày vào ngành</Text>
              <div>
                <Text>
                  {lecturer.serviceDate ? dayjs(lecturer.serviceDate).format("DD/MM/YYYY") : "-"}
                </Text>
              </div>
            </Col>
            <Col span={6}>
              <Text type="secondary">Đơn vị</Text>
              <div>
                <Text>{lecturer.organization?.sTen || "-"}</Text>
              </div>
            </Col>
            <Col span={6}>
              <Text type="secondary">Số điện thoại</Text>
              <div>
                <Text>{lecturer.userProfile?.phoneNumber || "-"}</Text>
              </div>
            </Col>

            {/* Hàng 4: Email, Học hàm, Học vị, Quân hàm */}
            <Col span={6}>
              <Text type="secondary">Email</Text>
              <div>
                <Text>{lecturer.userProfile?.email || "-"}</Text>
              </div>
            </Col>
            <Col span={6}>
              <Text type="secondary">Học hàm</Text>
              <div>
                <Text strong>{lecturer.userProfile?.academicRankType?.sTen || "-"}</Text>
              </div>
            </Col>
            <Col span={6}>
              <Text type="secondary">Học vị</Text>
              <div>
                <Text strong>{lecturer.userProfile?.academicDegreeType?.sTen || "-"}</Text>
              </div>
            </Col>
            <Col span={6}>
              <Text type="secondary">Quân hàm</Text>
              <div>
                <Text strong>{lecturer.userProfile?.rank?.sTen || "-"}</Text>
              </div>
            </Col>

            {/* Hàng 5: Mô tả */}
            {lecturer.description && (
              <Col span={24}>
                <Text type="secondary">Mô tả</Text>
                <div>
                  <Text>{lecturer.description}</Text>
                </div>
              </Col>
            )}
          </Row>
        </Card>
      ),
    },
    {
      key: "lop-giang-day-chinh",
      label: `Lớp giảng dạy chính (${lecturer?.mainSubjectClasses?.length || 0})`,
      children: (
        <Table
          dataSource={lecturer?.mainSubjectClasses || []}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 1200 }}
          columns={[
            {
              title: "STT",
              width: 50,
              align: "center",
              render: (_: any, __: any, index: number) => index + 1,
            },
            {
              title: "Mã lớp",
              dataIndex: "code",
              width: 120,
            },
            {
              title: "Tên lớp",
              dataIndex: "name",
              width: 200,
            },
            {
              title: "Môn học",
              dataIndex: ["subject", "name"],
              width: 250,
            },
            {
              title: "Học kỳ",
              dataIndex: ["semester", "name"],
              width: 150,
            },
            {
              title: "Sĩ số tối đa",
              dataIndex: "maxStudent",
              width: 100,
              align: "center",
            },
            {
              title: "Ngày bắt đầu",
              dataIndex: "startDate",
              width: 120,
              align: "center",
              render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : ""),
            },
            {
              title: "Ngày kết thúc",
              dataIndex: "endDate",
              width: 120,
              align: "center",
              render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : ""),
            },
            {
              title: "Loại lớp",
              dataIndex: "type",
              width: 100,
              align: "center",
              render: (type: any) => getSubjectClassTypeLabel(type),
            },
            {
              title: "Trạng thái",
              dataIndex: "status",
              width: 100,
              align: "center",
              render: (status: "DRAFT" | "OFFICIAL") => {
                const colors = {
                  DRAFT: "default",
                  OFFICIAL: "green",
                }
                const labels = {
                  DRAFT: "Nháp",
                  OFFICIAL: "Chính thức",
                }
                return <Tag color={colors[status] || "default"}>{labels[status] || status}</Tag>
              },
            },
          ]}
        />
      ),
    },
    {
      key: "lop-tro-giang",
      label: `Lớp trợ giảng (${lecturer?.extraSubjectClasses?.length || 0})`,
      children: (
        <Table
          dataSource={lecturer?.extraSubjectClasses || []}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 1200 }}
          columns={[
            {
              title: "STT",
              width: 50,
              align: "center",
              render: (_: any, __: any, index: number) => index + 1,
            },
            {
              title: "Mã lớp",
              dataIndex: "code",
              width: 120,
            },
            {
              title: "Tên lớp",
              dataIndex: "name",
              width: 200,
            },
            {
              title: "Môn học",
              dataIndex: ["subject", "name"],
              width: 250,
            },
            {
              title: "Học kỳ",
              dataIndex: ["semester", "name"],
              width: 150,
            },
            {
              title: "Sĩ số tối đa",
              dataIndex: "maxStudent",
              width: 100,
              align: "center",
            },
            {
              title: "Ngày bắt đầu",
              dataIndex: "startDate",
              width: 120,
              align: "center",
              render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : ""),
            },
            {
              title: "Ngày kết thúc",
              dataIndex: "endDate",
              width: 120,
              align: "center",
              render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : ""),
            },
            {
              title: "Loại lớp",
              dataIndex: "type",
              width: 100,
              align: "center",
              render: (type: any) => getSubjectClassTypeLabel(type),
            },
            {
              title: "Trạng thái",
              dataIndex: "status",
              width: 100,
              align: "center",
              render: (status: "DRAFT" | "OFFICIAL") => {
                const colors = {
                  DRAFT: "default",
                  OFFICIAL: "green",
                }
                const labels = {
                  DRAFT: "Nháp",
                  OFFICIAL: "Chính thức",
                }
                return <Tag color={colors[status] || "default"}>{labels[status] || status}</Tag>
              },
            },
          ]}
        />
      ),
    },
    {
      key: "lop-nhap-diem",
      label: `Lớp nhập điểm (${lecturer?.enterGradeClasses?.length || 0})`,
      children: (
        <Table
          dataSource={lecturer?.enterGradeClasses || []}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 1200 }}
          columns={[
            {
              title: "STT",
              width: 50,
              align: "center",
              render: (_: any, __: any, index: number) => index + 1,
            },
            {
              title: "Mã lớp",
              dataIndex: "code",
              width: 120,
            },
            {
              title: "Tên lớp",
              dataIndex: "name",
              width: 200,
            },
            {
              title: "Môn học",
              dataIndex: ["subject", "name"],
              width: 250,
            },
            {
              title: "Học kỳ",
              dataIndex: ["semester", "name"],
              width: 150,
            },
            {
              title: "Sĩ số tối đa",
              dataIndex: "maxStudent",
              width: 100,
              align: "center",
            },
            {
              title: "Ngày bắt đầu",
              dataIndex: "startDate",
              width: 120,
              align: "center",
              render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : ""),
            },
            {
              title: "Ngày kết thúc",
              dataIndex: "endDate",
              width: 120,
              align: "center",
              render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : ""),
            },
            {
              title: "Loại lớp",
              dataIndex: "type",
              width: 100,
              align: "center",
              render: (type: any) => getSubjectClassTypeLabel(type),
            },
          ]}
        />
      ),
    },
    {
      key: "lop-quan-ly",
      label: `Lớp quản lý (${lecturer?.manageFixedClass?.length || 0})`,
      children: (
        <Table
          dataSource={lecturer?.manageFixedClass || []}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 1200 }}
          columns={[
            {
              title: "STT",
              width: 50,
              align: "center",
              render: (_: any, __: any, index: number) => index + 1,
            },
            {
              title: "Mã lớp",
              dataIndex: "code",
              width: 120,
            },
            {
              title: "Tên lớp",
              dataIndex: "name",
              width: 200,
            },
            {
              title: "Khoá đào tạo",
              dataIndex: ["trainingCourse", "name"],
              width: 150,
            },
            {
              title: "Ngành đào tạo",
              dataIndex: ["curriculumVersion", "curriculum", "trainingMajor", "name"],
              width: 250,
            },
            {
              title: "Lớp trưởng",
              width: 150,
              render: (_: any, record: any) =>
                record.classMonitor?.userProfile
                  ? `${record.classMonitor.userProfile.lastName} ${record.classMonitor.userProfile.firstName}`
                  : "",
            },
            {
              title: "Bí thư",
              width: 150,
              render: (_: any, record: any) =>
                record.unionLeader?.userProfile
                  ? `${record.unionLeader.userProfile.lastName} ${record.unionLeader.userProfile.firstName}`
                  : "",
            },
            {
              title: "Tổ chức quản lý",
              dataIndex: ["managementOrganization", "sTen"],
              width: 200,
            },
            {
              title: "Năm bắt đầu",
              dataIndex: "startYear",
              width: 100,
              align: "center",
            },
            {
              title: "Đã tốt nghiệp",
              dataIndex: "graduated",
              width: 120,
              align: "center",
              render: (graduated: boolean) => (
                <Tag color={graduated ? "green" : "default"}>
                  {graduated ? "Đã tốt nghiệp" : "Chưa tốt nghiệp"}
                </Tag>
              ),
            },
            {
              title: "Sĩ số",
              dataIndex: "capacity",
              width: 80,
              align: "center",
            },
            {
              title: "Tóm tắt",
              dataIndex: "summary",
              width: 250,
            },
          ]}
        />
      ),
    },
    {
      key: "lich-giang-day-chinh",
      label: `Lịch giảng dạy chính (${lecturer?.classSchedules?.length || 0})`,
      children: (
        <Table
          dataSource={lecturer?.classSchedules || []}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 1400 }}
          columns={[
            {
              title: "STT",
              width: 50,
              align: "center",
              render: (_: any, __: any, index: number) => index + 1,
            },
            {
              title: "Lớp học phần",
              dataIndex: ["subjectClass", "name"],
              width: 200,
            },
            {
              title: "Môn học",
              dataIndex: ["subjectClass", "subject", "subjectVersion", "name"],
              width: 250,
            },
            {
              title: "Phòng",
              dataIndex: ["room", "name"],
              width: 100,
            },
            {
              title: "Địa điểm",
              dataIndex: "location",
              width: 150,
            },
            {
              title: "Ngày học",
              dataIndex: "classDate",
              width: 120,
              align: "center",
              render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : ""),
            },
            {
              title: "Tiết bắt đầu",
              dataIndex: "startPeriod",
              width: 90,
              align: "center",
            },
            {
              title: "Tiết kết thúc",
              dataIndex: "endPeriod",
              width: 90,
              align: "center",
            },
            {
              title: "Giờ bắt đầu",
              dataIndex: "startTime",
              width: 100,
              align: "center",
              render: (time: string) => (time ? dayjs(time).format("HH:mm") : ""),
            },
            {
              title: "Giờ kết thúc",
              dataIndex: "endTime",
              width: 100,
              align: "center",
              render: (time: string) => (time ? dayjs(time).format("HH:mm") : ""),
            },
            {
              title: "Loại tiết",
              dataIndex: "periodType",
              width: 100,
              align: "center",
              render: (periodType: any) => getScheduleLabel(periodType),
            },
            {
              title: "Ghi chú",
              dataIndex: "notes",
              width: 200,
            },
          ]}
        />
      ),
    },
    {
      key: "lich-tro-giang",
      label: `Lịch trợ giảng (${lecturer?.extraClassSchedules?.length || 0})`,
      children: (
        <Table
          dataSource={lecturer?.extraClassSchedules || []}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 1400 }}
          columns={[
            {
              title: "STT",
              width: 50,
              align: "center",
              render: (_: any, __: any, index: number) => index + 1,
            },
            {
              title: "Lớp học phần",
              dataIndex: ["subjectClass", "name"],
              width: 200,
            },
            {
              title: "Môn học",
              dataIndex: ["subjectClass", "subject", "subjectVersion", "name"],
              width: 250,
            },
            {
              title: "Phòng",
              dataIndex: ["room", "name"],
              width: 100,
            },
            {
              title: "Địa điểm",
              dataIndex: "location",
              width: 150,
            },
            {
              title: "Ngày học",
              dataIndex: "classDate",
              width: 120,
              align: "center",
              render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : ""),
            },
            {
              title: "Tiết bắt đầu",
              dataIndex: "startPeriod",
              width: 90,
              align: "center",
            },
            {
              title: "Tiết kết thúc",
              dataIndex: "endPeriod",
              width: 90,
              align: "center",
            },
            {
              title: "Giờ bắt đầu",
              dataIndex: "startTime",
              width: 100,
              align: "center",
              render: (time: string) => (time ? dayjs(time).format("HH:mm") : ""),
            },
            {
              title: "Giờ kết thúc",
              dataIndex: "endTime",
              width: 100,
              align: "center",
              render: (time: string) => (time ? dayjs(time).format("HH:mm") : ""),
            },
            {
              title: "Loại tiết",
              dataIndex: "periodType",
              width: 100,
              align: "center",
              render: (periodType: any) => getScheduleLabel(periodType),
            },
            {
              title: "Ghi chú",
              dataIndex: "notes",
              width: 200,
            },
          ]}
        />
      ),
    },
    {
      key: "de-tai-huong-dan",
      label: `Đề tài hướng dẫn (${lecturer?.researchProjects?.length || 0})`,
      children: (
        <Table
          dataSource={lecturer?.researchProjects || []}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 1200 }}
          columns={[
            {
              title: "STT",
              width: 50,
              align: "center",
              render: (_: any, __: any, index: number) => index + 1,
            },

            {
              title: "Tên đề tài",
              dataIndex: "title",
              width: 300,
            },
            {
              title: "Đơn vị quản lý",
              dataIndex: "organization",
              width: 250,
            },
            {
              title: "Sĩ số tối đa",
              dataIndex: "maxStudents",
              width: 100,
              align: "center",
            },
            {
              title: "Sĩ số sinh viên hiện tại",
              dataIndex: "currentStudents",
              width: 100,
              align: "center",
            },
            {
              title: "Trạng thái",
              dataIndex: "status",
              width: 120,
              align: "center",
              render: (status: any) => (
                <Tag color={getThesisProjectStatusColor(status)}>
                  {getThesisProjectStatusLabel(status)}
                </Tag>
              ),
            },
          ]}
        />
      ),
    },
    {
      key: "dang-ky-nghien-cuu-duyet",
      label: `ĐK nghiên cứu đã duyệt (${lecturer?.reviewedRegistrations?.length || 0})`,
      children: (
        <Table
          dataSource={lecturer?.reviewedRegistrations || []}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 1200 }}
          columns={[
            {
              title: "STT",
              width: 50,
              align: "center",
              render: (_: any, __: any, index: number) => index + 1,
            },
            {
              title: "Sinh viên",
              width: 200,
              render: (_: any, record: any) =>
                record.student?.userProfile
                  ? `${record.student.userProfile.lastName} ${record.student.userProfile.firstName}`
                  : "",
            },
            {
              title: "Đề tài",
              dataIndex: ["researchProject", "title"],
              width: 300,
            },
            {
              title: "Trạng thái",
              dataIndex: "status",
              width: 120,
              align: "center",
              render: (status: any) => (
                <Tag color={getStudentThesisRegistrationStatusColor(status)}>
                  {getStudentThesisRegistrationStatusLabel(status)}
                </Tag>
              ),
            },
            {
              title: "Ngày đăng ký",
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
      key: "dang-ky-luan-van-duyet",
      label: `ĐK luận văn đã duyệt (${lecturer?.reviewedThesisRegistrations?.length || 0})`,
      children: (
        <Table
          dataSource={lecturer?.reviewedThesisRegistrations || []}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 1200 }}
          columns={[
            {
              title: "STT",
              width: 50,
              align: "center",
              render: (_: any, __: any, index: number) => index + 1,
            },
            {
              title: "Sinh viên",
              width: 200,
              render: (_: any, record: any) =>
                record.student?.userProfile
                  ? `${record.student.userProfile.lastName} ${record.student.userProfile.firstName}`
                  : "",
            },
            {
              title: "Đề tài",
              dataIndex: ["thesisProject", "title"],
              width: 300,
            },
            {
              title: "Trạng thái",
              dataIndex: "status",
              width: 120,
              align: "center",
              render: (status: any) => (
                <Tag color={getStudentThesisRegistrationStatusColor(status)}>
                  {getStudentThesisRegistrationStatusLabel(status)}
                </Tag>
              ),
            },
            {
              title: "Ngày đăng ký",
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
      key: "ho-so-chuyen-gia",
      label: `Hồ sơ chuyên gia (${lecturer?.expertProfile?.length || 0})`,
      children: (
        <Table
          dataSource={lecturer?.expertProfile || []}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 2000 }}
          columns={[
            {
              title: "STT",
              width: 50,
              align: "center",
              render: (_: any, __: any, index: number) => index + 1,
            },
            {
              title: "Mã",
              dataIndex: "code",
              width: 100,
            },
            {
              title: "Họ tên",
              dataIndex: "name",
              width: 180,
            },
            {
              title: "Học hàm",
              dataIndex: "academicRank",
              width: 120,
            },
            {
              title: "Học vị",
              dataIndex: "academicDegree",
              width: 120,
            },
            {
              title: "Đơn vị",
              dataIndex: "organization",
              width: 200,
            },
            {
              title: "Chức vụ",
              dataIndex: "position",
              width: 150,
            },
            {
              title: "Chuyên môn",
              dataIndex: "specialization",
              width: 180,
            },
            {
              title: "Nơi làm việc",
              dataIndex: "workplace",
              width: 200,
            },
            {
              title: "Điện thoại",
              dataIndex: "phone",
              width: 120,
            },
            {
              title: "Email",
              dataIndex: "email",
              width: 200,
            },
            {
              title: "Số TK ngân hàng",
              dataIndex: "bankAccountNumber",
              width: 150,
            },
            {
              title: "Tên ngân hàng",
              dataIndex: "bankName",
              width: 150,
            },
            {
              title: "Mô tả",
              dataIndex: "description",
              width: 250,
            },
          ]}
        />
      ),
    },
    {
      key: "thanh-vien-hoi-dong",
      label: `Thành viên hội đồng (${lecturer?.evaluationCouncilMember?.length || 0})`,
      children: (
        <Table
          dataSource={lecturer?.evaluationCouncilMember || []}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 1000 }}
          columns={[
            {
              title: "STT",
              width: 50,
              align: "center",
              render: (_: any, __: any, index: number) => index + 1,
            },
            {
              title: "Hội đồng",
              dataIndex: ["evaluationCouncil", "name"],
              width: 250,
            },
            {
              title: "Vai trò",
              dataIndex: "role",
              width: 150,
            },
            {
              title: "Mô tả",
              dataIndex: "description",
              width: 250,
            },
          ]}
        />
      ),
    },
    {
      key: "khao-sat",
      label: `Khảo sát (${lecturer?.survey?.length || 0})`,
      children: (
        <Table
          dataSource={lecturer?.survey || []}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          columns={[
            {
              title: "STT",
              width: 50,
              align: "center",
              render: (_: any, __: any, index: number) => index + 1,
            },
            {
              title: "Mã",
              dataIndex: "code",
              width: 120,
            },
            {
              title: "Chủ đề khảo sát",
              dataIndex: ["surveyTopic", "name"],
              width: 250,
            },
            {
              title: "Ngày bắt đầu",
              dataIndex: "startDate",
              width: 120,
              align: "center",
              render: (date) => (date ? dayjs(date).format("DD/MM/YYYY") : ""),
            },
            {
              title: "Ngày kết thúc",
              dataIndex: "endDate",
              width: 120,
              align: "center",
              render: (date) => (date ? dayjs(date).format("DD/MM/YYYY") : ""),
            },
          ]}
        />
      ),
    },
    {
      key: "khao-sat-cum",
      label: `Khảo sát cụm (${lecturer?.clusterSurvey?.length || 0})`,
      children: (
        <Table
          dataSource={lecturer?.clusterSurvey || []}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          columns={[
            {
              title: "STT",
              width: 50,
              align: "center",
              render: (_: any, __: any, index: number) => index + 1,
            },
            {
              title: "Mã",
              dataIndex: "code",
              width: 120,
            },
            {
              title: "Chủ đề khảo sát",
              dataIndex: ["surveyTopic", "name"],
              width: 250,
            },
            {
              title: "Ngày bắt đầu",
              dataIndex: "startDate",
              width: 120,
              align: "center",
              render: (date) => (date ? dayjs(date).format("DD/MM/YYYY") : ""),
            },
            {
              title: "Ngày kết thúc",
              dataIndex: "endDate",
              width: 120,
              align: "center",
              render: (date) => (date ? dayjs(date).format("DD/MM/YYYY") : ""),
            },
          ]}
        />
      ),
    },
    {
      key: "phong-thi-giam-sat-chinh",
      label: `Phòng thi giám sát chính (${lecturer?.examRoomsMain?.length || 0})`,
      children: (
        <Table
          dataSource={lecturer?.examRoomsMain || []}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          columns={[
            {
              title: "Mã phòng",
              dataIndex: ["examRoom", "room", "code"],
              width: 120,
            },
            {
              title: "Phòng thi",
              dataIndex: ["examRoom", "room", "name"],
              width: 150,
            },
            {
              title: "Môn học",
              dataIndex: ["examRoom", "exam", "subjectVersion", "name"],
              width: 250,
            },
            {
              title: "Ca thi",
              dataIndex: ["examRoom", "exam", "session"],
              width: 100,
              align: "center",
            },
            {
              title: "Thời gian thi (phút)",
              dataIndex: ["examRoom", "exam", "duration"],
              width: 150,
              align: "center",
            },
            {
              title: "Sức chứa",
              dataIndex: ["examRoom", "capacity"],
              width: 100,
              align: "center",
            },
          ]}
        />
      ),
    },
  ]

  return (
    <Modal
      title={`Chi tiết giảng viên: ${lecturer.userProfile?.lastName || ""} ${lecturer.userProfile?.firstName || ""} (${lecturer.code || ""})`}
      open={isOpen}
      onCancel={onClose}
      width="90%"
      footer={null}
      style={{ top: 20 }}
    >
      <Tabs items={tabItems} />
    </Modal>
  )
}

export default ModalChiTietGiangVien
