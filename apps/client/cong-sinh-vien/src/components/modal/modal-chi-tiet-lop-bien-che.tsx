import { useSession } from "@workspace/auth/react"
import { useExamTypeOptions } from "@hooks/examType"
import { useSubjectClassStatusOptions } from "@hooks/subjectClassStatus"
import { useSubjectClassTypeOptions } from "@hooks/subjectClassType"
import { useFindUniqueFixedClass } from "@workspace/db/hooks"
import { Descriptions, Modal, Table, Tabs, Tag } from "antd"
import dayjs from "dayjs"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"

dayjs.locale("vi")

export default function ModalChiTietLopBienChe() {
  const { data: session } = useSession()
  const currentUserId = session?.sDM_NhanVienId || ""
  const { isOpen, onClose, input } = useDisclosure<{
    fixedClassId: string
  }>({
    tag: "ModalChiTietLopBienChe",
  })

  const { onOpen: onOpenDetailStudent } = useDisclosure<string>({
    tag: "ModalChiTietSinhVien",
  })

  const { fixedClassId } = input || {}
  const { getSubjectClassTypeLabel } = useSubjectClassTypeOptions()
  const { getSubjectClassStatusLabel, getSubjectClassStatusColor } = useSubjectClassStatusOptions()
  const { getExamTypeLabel } = useExamTypeOptions()

  const { data: fixedClassData, isLoading } = useFindUniqueFixedClass(
    {
      where: { id: fixedClassId },
      include: {
        managementOrganization: true,
        trainingCourse: {
          include: {
            trainingObjectType: true,
          },
        },
        curriculumVersion: {
          include: {
            curriculum: {
              include: {
                trainingMajor: true,
              },
            },
            trainingLevel: true,
            trainingType: true,
            trainingTime: true,
            diplomaType: true,
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
        lecturerManagement: {
          include: {
            userProfile: true,
          },
        },
        staffManagement: {
          include: {
            userProfile: true,
          },
        },
        students: {
          include: {
            userProfile: true,
            fixedClass: true,
            trainingLocation: true,
            curriculumVersion: true,
            curriculumVersionParallel: true,
          },
          where: {
            deletedAt: null,
          },
          orderBy: {
            userProfile: {
              code: "asc",
            },
          },
        },
        subjectClasses: {
          include: {
            semester: true,
            subject: true,
            mainLecturer: {
              include: {
                userProfile: true,
              },
            },
            extraLecturer: {
              include: {
                userProfile: true,
              },
            },
            enterGradeLecturer: {
              include: {
                userProfile: true,
              },
            },
            room: true,
            trainingLocation: true,
            exam: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        notifications: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    },
    {
      enabled: !!fixedClassId,
    }
  )

  const tabItems = [
    {
      key: "1",
      label: "Thông tin chung",
      children: (
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="Mã lớp" span={1}>
            {fixedClassData?.code || ""}
          </Descriptions.Item>
          <Descriptions.Item label="Tên lớp" span={1}>
            {fixedClassData?.name || ""}
          </Descriptions.Item>
          <Descriptions.Item label="Đơn vị quản lý" span={1}>
            {fixedClassData?.managementOrganization?.sTen || ""}
          </Descriptions.Item>
          <Descriptions.Item label="Khoá đào tạo" span={1}>
            {fixedClassData?.trainingCourse?.name || ""}
          </Descriptions.Item>
          <Descriptions.Item label="Đối tượng đào tạo" span={1}>
            {fixedClassData?.trainingCourse?.trainingObjectType?.name || ""}
          </Descriptions.Item>
          <Descriptions.Item label="Năm bắt đầu" span={1}>
            {fixedClassData?.startYear || ""}
          </Descriptions.Item>
          <Descriptions.Item label="Đã tốt nghiệp" span={1}>
            {fixedClassData?.graduated ? (
              <Tag color="success">Đã tốt nghiệp</Tag>
            ) : (
              <Tag color="default">Chưa tốt nghiệp</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái" span={1}>
            {fixedClassData?.active ? (
              <Tag color="success">Đang hoạt động</Tag>
            ) : (
              <Tag color="error">Không hoạt động</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Tóm tắt" span={2}>
            {fixedClassData?.summary || ""}
          </Descriptions.Item>
          <Descriptions.Item label="Mô tả" span={2}>
            {fixedClassData?.description || ""}
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: "2",
      label: "Chương trình đào tạo",
      children: (
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="Tên chương trình" span={2}>
            {fixedClassData?.curriculumVersion?.name || ""}
          </Descriptions.Item>
          <Descriptions.Item label="Tên viết tắt" span={1}>
            {fixedClassData?.curriculumVersion?.shortName || ""}
          </Descriptions.Item>
          <Descriptions.Item label="Tên tiếng Anh" span={1}>
            {fixedClassData?.curriculumVersion?.englishName || ""}
          </Descriptions.Item>
          <Descriptions.Item label="Chuyên ngành" span={1}>
            {fixedClassData?.curriculumVersion?.curriculum?.trainingMajor?.name || ""}
          </Descriptions.Item>
          <Descriptions.Item label="Bậc đào tạo" span={1}>
            {fixedClassData?.curriculumVersion?.trainingLevel?.name || ""}
          </Descriptions.Item>
          <Descriptions.Item label="Loại hình đào tạo" span={1}>
            {fixedClassData?.curriculumVersion?.trainingType?.name || ""}
          </Descriptions.Item>
          <Descriptions.Item label="Thời gian đào tạo" span={1}>
            {fixedClassData?.curriculumVersion?.trainingTime?.name || ""}
          </Descriptions.Item>
          <Descriptions.Item label="Loại bằng" span={1}>
            {fixedClassData?.curriculumVersion?.diplomaType?.name || ""}
          </Descriptions.Item>
          <Descriptions.Item label="Số học kỳ" span={1}>
            {fixedClassData?.curriculumVersion?.numberOfSemesters || ""}
          </Descriptions.Item>
          <Descriptions.Item label="Số tín chỉ bắt buộc" span={1}>
            {fixedClassData?.curriculumVersion?.requiredCredits || ""}
          </Descriptions.Item>
          <Descriptions.Item label="Số tín chỉ tự chọn" span={1}>
            {fixedClassData?.curriculumVersion?.electiveCredits || ""}
          </Descriptions.Item>
          <Descriptions.Item label="Năm áp dụng" span={1}>
            {fixedClassData?.curriculumVersion?.yearApplication || ""}
          </Descriptions.Item>
          <Descriptions.Item label="Năm tạo" span={1}>
            {fixedClassData?.curriculumVersion?.yearCreation || ""}
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: "3",
      label: "Quản lý",
      children: (
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="Giáo viên chủ nhiệm" span={1}>
            {fixedClassData?.lecturerManagement?.userProfile?.fullname || ""}
          </Descriptions.Item>
          <Descriptions.Item label="Mã định danh" span={1}>
            {fixedClassData?.lecturerManagement?.userProfile?.code || ""}
          </Descriptions.Item>
          <Descriptions.Item label="Cán bộ quản lý" span={1}>
            {fixedClassData?.staffManagement?.userProfile?.fullname || ""}
          </Descriptions.Item>
          <Descriptions.Item label="Mã CB" span={1}>
            {fixedClassData?.staffManagement?.userProfile?.code || ""}
          </Descriptions.Item>
          <Descriptions.Item label="Lớp trưởng" span={1}>
            {fixedClassData?.classMonitor?.userProfile?.fullname || ""}
          </Descriptions.Item>
          <Descriptions.Item label="Mã định danh" span={1}>
            {fixedClassData?.classMonitor?.userProfile?.code || ""}
          </Descriptions.Item>
          <Descriptions.Item label="Bí thư" span={1}>
            {fixedClassData?.unionLeader?.userProfile?.fullname || ""}
          </Descriptions.Item>
          <Descriptions.Item label="Mã định danh" span={1}>
            {fixedClassData?.unionLeader?.userProfile?.code || ""}
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: "4",
      label: `Danh sách sinh viên (${fixedClassData?.students?.length || 0})`,
      children: (
        <Table
          rowKey="id"
          dataSource={fixedClassData?.students || []}
          scroll={{ x: 2400, y: 400 }}
          pagination={false}
          onRow={(record) => {
            const isSelf =
              (record.userProfileId && record.userProfileId === currentUserId) ||
              (record.id && record.id === currentUserId)
            if (!isSelf) return {}
            return {
              onClick: (e) => {
                e.preventDefault()
                onOpenDetailStudent(record.id)
              },
              className: "cursor-pointer hover:text-primary",
            }
          }}
          columns={[
            {
              title: "STT",
              width: 50,
              align: "center",
              fixed: "left",
              render: (_, __, index) => index + 1,
            },
            {
              title: "Mã sinh viên",
              dataIndex: ["userProfile", "code"],
              width: 120,
              align: "center",
              fixed: "left",
            },
            {
              title: "Họ và tên",
              width: 200,
              align: "center",
              render: (_, record) =>
                record?.userProfile
                  ? `${record.userProfile.lastName} ${record.userProfile.firstName}`
                  : "",
            },
            {
              title: "Ngày sinh",
              dataIndex: ["userProfile", "dateOfBirth"],
              width: 120,
              align: "center",
              render: (value) => (value ? dayjs(value).format("DD/MM/YYYY") : ""),
            },
            {
              title: "Giới tính",
              dataIndex: ["userProfile", "gender"],
              width: 80,
              align: "center",
              render: (value) => (value === "MALE" ? "Nam" : value === "FEMALE" ? "Nữ" : ""),
            },
            {
              title: "Trạng thái",
              dataIndex: "status",
              width: 120,
              align: "center",
              render: (value) => {
                const statusMap: Record<string, { label: string; color: string }> = {
                  ENROLLED: { label: "Đang học", color: "success" },
                  SUSPENDED: { label: "Đình chỉ", color: "warning" },
                  EXPELLED: { label: "Buộc thôi học", color: "error" },
                  GRADUATED: { label: "Đã tốt nghiệp", color: "blue" },
                  RESERVE: { label: "Bảo lưu", color: "default" },
                  TRANSFERRED: { label: "Chuyển trường", color: "purple" },
                  DROPPED_OUT: { label: "Thôi học", color: "error" },
                }
                const status = statusMap[value] || {
                  label: value,
                  color: "default",
                }
                return <Tag color={status.color}>{status.label}</Tag>
              },
            },
            {
              title: "Số báo danh",
              dataIndex: "registerNumber",
              width: 120,
              align: "center",
            },
            {
              title: "Email",
              dataIndex: ["userProfile", "email"],
              width: 200,
              align: "center",
            },
            {
              title: "Số điện thoại",
              dataIndex: ["userProfile", "phoneNumber"],
              width: 120,
              align: "center",
            },
            {
              title: "Khu vực đào tạo",
              dataIndex: ["trainingLocation", "name"],
              width: 150,
              align: "center",
            },
            {
              title: "Ngày vào lớp",
              dataIndex: "from",
              width: 120,
              align: "center",
              render: (value) => (value ? dayjs(value).format("DD/MM/YYYY") : ""),
            },
            {
              title: "Ngày rời lớp",
              dataIndex: "to",
              width: 120,
              align: "center",
              render: (value) => (value ? dayjs(value).format("DD/MM/YYYY") : ""),
            },
            {
              title: "Cảnh báo học tập",
              dataIndex: "academicWarningLevel",
              width: 100,
              align: "center",
              render: (value) => (value > 0 ? <Tag color="warning">Lần {value}</Tag> : ""),
            },
            {
              title: "Cảnh cáo học đường",
              dataIndex: "disciplinaryWarningLevel",
              width: 100,
              align: "center",
              render: (value) => (value > 0 ? <Tag color="error">Lần {value}</Tag> : ""),
            },
            {
              title: "Ngoại ngữ",
              dataIndex: "foreignLangPass",
              width: 80,
              align: "center",
              render: (value) => (value ? <Tag color="success">Đạt</Tag> : <Tag>Chưa</Tag>),
            },
            {
              title: "Tin học",
              dataIndex: "ITCertificationPass",
              width: 80,
              align: "center",
              render: (value) => (value ? <Tag color="success">Đạt</Tag> : <Tag>Chưa</Tag>),
            },
            {
              title: "Ghi chú",
              dataIndex: "note",
              width: 200,
              align: "center",
            },
          ]}
        />
      ),
    },
    {
      key: "5",
      label: `Lớp môn học (${fixedClassData?.subjectClasses?.length || 0})`,
      children: (
        <Table
          rowKey="id"
          dataSource={fixedClassData?.subjectClasses || []}
          scroll={{ x: 3000, y: 400 }}
          pagination={false}
          columns={[
            {
              title: "STT",
              width: 50,
              align: "center",
              fixed: "left",
              render: (_, __, index) => index + 1,
            },
            {
              title: "Mã lớp",
              dataIndex: "code",
              width: 120,
              align: "center",
              fixed: "left",
            },
            {
              title: "Tên lớp",
              dataIndex: "name",
              width: 200,
              align: "center",
            },
            {
              title: "Môn học",
              width: 250,
              align: "center",
              render: (_, record) => record?.subject?.name || "",
            },
            {
              title: "Học kỳ",
              dataIndex: ["semester", "name"],
              width: 150,
              align: "center",
            },
            {
              title: "Loại lớp",
              dataIndex: "type",
              width: 120,
              align: "center",
              render: (value) => getSubjectClassTypeLabel(value),
            },
            {
              title: "Trạng thái",
              dataIndex: "status",
              width: 120,
              align: "center",
              render: (value) => (
                <Tag color={getSubjectClassStatusColor(value)}>
                  {getSubjectClassStatusLabel(value)}
                </Tag>
              ),
            },
            {
              title: "Giảng viên chính",
              width: 180,
              align: "center",
              render: (_, record) => record?.mainLecturer?.userProfile?.fullname || "",
            },
            {
              title: "Giảng viên phụ",
              width: 180,
              align: "center",
              render: (_, record) => record?.extraLecturer?.userProfile?.fullname || "",
            },
            {
              title: "GV nhập điểm",
              width: 180,
              align: "center",
              render: (_, record) => record?.enterGradeLecturer?.userProfile?.fullname || "",
            },
            {
              title: "Phòng học",
              dataIndex: ["room", "name"],
              width: 120,
              align: "center",
            },
            {
              title: "Khu vực",
              dataIndex: ["trainingLocation", "name"],
              width: 150,
              align: "center",
            },
            {
              title: "SL tối đa",
              dataIndex: "maxStudent",
              width: 100,
              align: "center",
            },
            {
              title: "Ngày bắt đầu",
              dataIndex: "startDate",
              width: 120,
              align: "center",
              render: (value) => (value ? dayjs(value).format("DD/MM/YYYY") : ""),
            },
            {
              title: "Ngày kết thúc",
              dataIndex: "endDate",
              width: 120,
              align: "center",
              render: (value) => (value ? dayjs(value).format("DD/MM/YYYY") : ""),
            },
            {
              title: "Hình thức thi",
              dataIndex: "examType",
              width: 120,
              align: "center",
              render: (value) => (value ? getExamTypeLabel(value) : ""),
            },
            {
              title: "Ngày thi",
              dataIndex: "examDate",
              width: 120,
              align: "center",
              render: (value) => (value ? dayjs(value).format("DD/MM/YYYY") : ""),
            },
            {
              title: "Đề thi",
              dataIndex: ["exam", "code"],
              width: 120,
              align: "center",
            },
            {
              title: "Hạn nhập điểm TX/ĐK",
              dataIndex: "scoreDeadline",
              width: 150,
              align: "center",
              render: (value) => (value ? dayjs(value).format("DD/MM/YYYY HH:mm") : ""),
            },
            {
              title: "Hạn nhập điểm thi",
              dataIndex: "examScoreDeadline",
              width: 150,
              align: "center",
              render: (value) => (value ? dayjs(value).format("DD/MM/YYYY HH:mm") : ""),
            },
            {
              title: "Khoá điểm TX/ĐK",
              dataIndex: "isLockScore",
              width: 100,
              align: "center",
              render: (value) => (value ? <Tag color="error">Đã khoá</Tag> : <Tag>Chưa khoá</Tag>),
            },
            {
              title: "Khoá điểm thi",
              dataIndex: "isLockExamScore",
              width: 100,
              align: "center",
              render: (value) => (value ? <Tag color="error">Đã khoá</Tag> : <Tag>Chưa khoá</Tag>),
            },
            {
              title: "Đã nhập điểm TX/ĐK",
              dataIndex: "enteredScore",
              width: 120,
              align: "center",
              render: (value) =>
                value ? <Tag color="success">Đã nhập</Tag> : <Tag>Chưa nhập</Tag>,
            },
            {
              title: "Đã nhập điểm thi",
              dataIndex: "enteredExamScore",
              width: 120,
              align: "center",
              render: (value) =>
                value ? <Tag color="success">Đã nhập</Tag> : <Tag>Chưa nhập</Tag>,
            },
            {
              title: "Đã hủy",
              dataIndex: "cancelled",
              width: 80,
              align: "center",
              render: (value) => (value ? <Tag color="error">Đã hủy</Tag> : ""),
            },
            {
              title: "Mô tả",
              dataIndex: "description",
              width: 200,
              align: "center",
            },
          ]}
        />
      ),
    },
    {
      key: "6",
      label: `Thông báo (${fixedClassData?.notifications?.length || 0})`,
      children: (
        <Table
          rowKey="id"
          dataSource={fixedClassData?.notifications || []}
          scroll={{ x: 1000, y: 400 }}
          pagination={false}
          columns={[
            {
              title: "STT",
              width: 50,
              align: "center",
              fixed: "left",
              render: (_, __, index) => index + 1,
            },
            {
              title: "Tiêu đề",
              dataIndex: "title",
              width: 300,
              align: "center",
            },
            {
              title: "Nội dung",
              dataIndex: "content",
              width: 400,
              align: "center",
              render: (value) => (
                <div
                  style={{
                    maxHeight: "100px",
                    overflow: "auto",
                    textAlign: "left",
                  }}
                >
                  {value || ""}
                </div>
              ),
            },
            {
              title: "Ngày tạo",
              dataIndex: "createdAt",
              width: 150,
              align: "center",
              render: (value) => (value ? dayjs(value).format("DD/MM/YYYY HH:mm") : ""),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <Modal
      title={
        <div className="text-lg font-semibold">
          Chi tiết lớp quản lý: {fixedClassData?.name || ""}
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      width="95%"
      footer={null}
      style={{ top: 20 }}
      loading={isLoading}
    >
      <Tabs items={tabItems} />
    </Modal>
  )
}
