import { useExamTypeOptions } from "@hooks/examType"
import { useHistorySubjectVersionActionOptions } from "@hooks/historySubjectVersionAction"
import { useSubjectClassStatusOptions } from "@hooks/subjectClassStatus"
import { useSubjectClassTypeOptions } from "@hooks/subjectClassType"
import { useSubjectRequirementTypeOptions } from "@hooks/subjectRequirementType"
import { useSubjectVersionTypeOptions } from "@hooks/subjectVersionType"
import { useFindUniqueSubject, useFindUniqueSubjectVersion } from "@workspace/db/hooks"
import { Descriptions, Modal, Table, Tabs, Tag } from "antd"
import dayjs from "dayjs"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"

dayjs.locale("vi")

export default function ModalChiTietMonHoc() {
  const { isOpen, onClose, input } = useDisclosure<{
    subjectVersionId?: string
  }>({
    tag: "ModalChiTietMonHoc",
  })

  const { subjectVersionId } = input || {}
  const { getExamTypeLabel } = useExamTypeOptions()
  const { getSubjectClassTypeLabel } = useSubjectClassTypeOptions()
  const { getSubjectVersionTypeLabel } = useSubjectVersionTypeOptions()
  const { getSubjectClassStatusLabel, getSubjectClassStatusColor } = useSubjectClassStatusOptions()
  const { getSubjectRequirementTypeLabel } = useSubjectRequirementTypeOptions()
  const { getHistoryActionLabel, getHistoryActionColor } = useHistorySubjectVersionActionOptions()

  const { data: subjectVersionData } = useFindUniqueSubjectVersion(
    {
      where: { id: subjectVersionId },
      include: { subject: true, subjectClass: { select: { id: true } } },
    },
    { enabled: !!subjectVersionId && isOpen }
  )

  const subjectId = subjectVersionData?.subject?.id
  const { data: subjectData } = useFindUniqueSubject(
    {
      where: { id: subjectId },
      include: {
        managementOrganization: true,
        subjectVersion: {
          orderBy: { createdAt: "desc" },
          include: {
            trainingObjectType: true,
            subjectVersionCategory: true,
            managementOrganization: true,
            examFramework: true,
            // Môn tiên quyết
            prerequisiteSubject: {
              include: {
                subject: true,
              },
            },
            // Môn học trước
            coRequisiteSubject: {
              include: {
                subject: true,
              },
            },
            // Nhóm tương đương
            equivalencyGroups: {
              include: {
                subject: true,
                equivalencyGroup: {
                  include: {
                    subjects: {
                      include: {
                        subject: true,
                      },
                    },
                  },
                },
              },
            },
            // Khối kiến thức
            knowledgeBlocks: true,
            // Khối đào tạo
            trainingBlocks: {
              include: {
                trainingBlockOnCurriculumVersion: {
                  include: {
                    trainingBlock: true,
                    curriculumVersion: {
                      include: {
                        curriculum: true,
                      },
                    },
                  },
                },
              },
            },
            // Lớp môn học
            subjectClass: {
              include: {
                semester: true,
                trainingObjectType: true,
                room: true,
                trainingLocation: true,
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
                exam: true,
              },
            },
            // Đề thi
            exams: {
              include: {
                examBank: true,
              },
            },
            // Tài liệu
            documentFiles: true,
            // Ngân hàng câu hỏi
            questionBanks: true,
            // Lịch sử thay đổi
            subjectVersionHistory: {
              orderBy: { createdAt: "desc" },
              include: {
                updatedBy: true,
              },
            },
          },
        },
        certificateOnSubject: {
          include: {
            certificate: true,
          },
        },
        awardOnSubject: true,
      },
    },
    {
      enabled: !!subjectId && isOpen,
    }
  )

  if (!subjectId) {
    return null
  }

  const subject = subjectData
  const currentVersion = subjectVersionId
    ? subject?.subjectVersion.find((v: any) => v.id === subjectVersionId)
    : subject?.subjectVersion?.[0]

  const items = [
    {
      key: "1",
      label: "Thông tin cơ bản",
      children: (
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Mã môn học">{subject?.code}</Descriptions.Item>
          <Descriptions.Item label="Tên môn học">{subject?.name}</Descriptions.Item>
          <Descriptions.Item label="Tên tiếng Anh" span={2}>
            {subject?.englishName}
          </Descriptions.Item>
          <Descriptions.Item label="Đơn vị quản lý" span={2}>
            {subject?.managementOrganization?.sTen}
          </Descriptions.Item>
          <Descriptions.Item label="Mô tả" span={2}>
            {subject?.description}
          </Descriptions.Item>
          <Descriptions.Item label="Thông tin bổ sung" span={2}>
            {subject?.information}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            {subject?.active ? (
              <Tag color="success">Đang hoạt động</Tag>
            ) : (
              <Tag color="error">Không hoạt động</Tag>
            )}
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: "2",
      label: `Phiên bản hiện tại ${currentVersion ? `(${currentVersion.code || currentVersion.name})` : ""}`,
      children: currentVersion ? (
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Mã phiên bản">{currentVersion.code}</Descriptions.Item>
          <Descriptions.Item label="Tên phiên bản">{currentVersion.name}</Descriptions.Item>
          <Descriptions.Item label="Mã TKB">{currentVersion.codeTkb}</Descriptions.Item>
          <Descriptions.Item label="Loại phiên bản">
            {getSubjectVersionTypeLabel(currentVersion.type)}
          </Descriptions.Item>
          <Descriptions.Item label="Số tín chỉ">{currentVersion.credit}</Descriptions.Item>
          <Descriptions.Item label="Số tiết">{currentVersion.period}</Descriptions.Item>
          <Descriptions.Item label="Số tuần">{currentVersion.week}</Descriptions.Item>
          <Descriptions.Item label="Số tiết TKB">{currentVersion.schedulePeriod}</Descriptions.Item>
          <Descriptions.Item label="Hình thức thi">
            {getExamTypeLabel(currentVersion.examType)}
          </Descriptions.Item>
          <Descriptions.Item label="1 đầu điểm">
            {currentVersion.onePoint ? "Có" : "Không"}
          </Descriptions.Item>
          <Descriptions.Item label="Số tiết LT">{currentVersion.numberOfTheory}</Descriptions.Item>
          <Descriptions.Item label="Số tiết BT">
            {currentVersion.numberOfPractical}
          </Descriptions.Item>
          <Descriptions.Item label="Số tiết ThL">
            {currentVersion.numberOfSelfStudy}
          </Descriptions.Item>
          <Descriptions.Item label="Số tiết TN, TH">
            {currentVersion.numberOfPractice}
          </Descriptions.Item>
          <Descriptions.Item label="Số tiết Ôn">{currentVersion.numberOfReview}</Descriptions.Item>
          <Descriptions.Item label="Số tiết KT, Thi">
            {currentVersion.numberOfExam}
          </Descriptions.Item>
          <Descriptions.Item label="Số tiết khác">{currentVersion.numberOfOther}</Descriptions.Item>
          <Descriptions.Item label="Đối tượng đào tạo">
            {currentVersion.trainingObjectType?.name}
          </Descriptions.Item>
          <Descriptions.Item label="Nhóm phiên bản">
            {currentVersion.subjectVersionCategory?.name}
          </Descriptions.Item>
          <Descriptions.Item label="Đơn vị quản lý">
            {currentVersion.managementOrganization?.sTen}
          </Descriptions.Item>
          <Descriptions.Item label="Mục tiêu" span={2}>
            <div dangerouslySetInnerHTML={{ __html: currentVersion.objectives || "" }} />
          </Descriptions.Item>
          <Descriptions.Item label="Chuẩn đầu ra" span={2}>
            <div
              dangerouslySetInnerHTML={{
                __html: currentVersion.learningOutcome || "",
              }}
            />
          </Descriptions.Item>
          <Descriptions.Item label="Nội dung" span={2}>
            <div dangerouslySetInnerHTML={{ __html: currentVersion.structure || "" }} />
          </Descriptions.Item>
          <Descriptions.Item label="Hướng dẫn" span={2}>
            <div dangerouslySetInnerHTML={{ __html: currentVersion.guild || "" }} />
          </Descriptions.Item>
          <Descriptions.Item label="Kết quả học tập" span={2}>
            <div
              dangerouslySetInnerHTML={{
                __html: currentVersion.academicResults || "",
              }}
            />
          </Descriptions.Item>
          <Descriptions.Item label="Tài liệu" span={2}>
            <div dangerouslySetInnerHTML={{ __html: currentVersion.materials || "" }} />
          </Descriptions.Item>
          <Descriptions.Item label="Quy định" span={2}>
            <div dangerouslySetInnerHTML={{ __html: currentVersion.rules || "" }} />
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            {currentVersion.active ? (
              <Tag color="success">Đang hoạt động</Tag>
            ) : (
              <Tag color="error">Không hoạt động</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái khoá">
            {currentVersion.isLocked ? (
              <Tag color="error">Đã khoá</Tag>
            ) : (
              <Tag color="success">Đang mở</Tag>
            )}
          </Descriptions.Item>
        </Descriptions>
      ) : (
        <div>Chưa có phiên bản nào</div>
      ),
    },
    {
      key: "3",
      label: `Tất cả phiên bản (${subject?.subjectVersion.length || 0})`,
      children: (
        <Table
          size="small"
          dataSource={subject?.subjectVersion}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total}`,
          }}
          scroll={{ x: "max-content" }}
          columns={[
            {
              title: "STT",
              width: 60,
              align: "center",
              render: (_, __, index) => index + 1,
            },
            {
              title: "Mã",
              dataIndex: "code",
              width: 120,
            },
            {
              title: "Tên",
              dataIndex: "name",
              width: 200,
            },
            {
              title: "Mã TKB",
              dataIndex: "codeTkb",
              width: 100,
            },
            {
              title: "Tín chỉ",
              dataIndex: "credit",
              width: 80,
              align: "center",
            },
            {
              title: "Số tiết",
              dataIndex: "period",
              width: 80,
              align: "center",
            },
            {
              title: "Hình thức thi",
              dataIndex: "examType",
              width: 120,
              render: (value) => getExamTypeLabel(value),
            },
            {
              title: "Đối tượng ĐT",
              width: 150,
              render: (_: any, record: any) => record.trainingObjectType?.name,
            },
            {
              title: "Trạng thái",
              dataIndex: "active",
              width: 120,
              align: "center",
              render: (value) =>
                value ? (
                  <Tag color="success">Hoạt động</Tag>
                ) : (
                  <Tag color="error">Không hoạt động</Tag>
                ),
            },
            {
              title: "Khoá",
              dataIndex: "isLocked",
              width: 100,
              align: "center",
              render: (value) =>
                value ? <Tag color="error">Đã khoá</Tag> : <Tag color="success">Đang mở</Tag>,
            },
            {
              title: "Loại",
              dataIndex: "type",
              width: 120,
              render: (value) => getSubjectVersionTypeLabel(value),
            },
            {
              title: "Số tuần",
              dataIndex: "week",
              width: 80,
              align: "center" as const,
            },
            {
              title: "Tiết TKB",
              dataIndex: "schedulePeriod",
              width: 80,
              align: "center" as const,
            },
            {
              title: "Tiết LT",
              dataIndex: "numberOfTheory",
              width: 80,
              align: "center" as const,
            },
            {
              title: "Tiết BT",
              dataIndex: "numberOfPractical",
              width: 80,
              align: "center" as const,
            },
            {
              title: "Tiết ThL",
              dataIndex: "numberOfSelfStudy",
              width: 80,
              align: "center" as const,
            },
            {
              title: "Tiết TN,TH",
              dataIndex: "numberOfPractice",
              width: 80,
              align: "center" as const,
            },
            {
              title: "Tiết Ôn",
              dataIndex: "numberOfReview",
              width: 80,
              align: "center" as const,
            },
            {
              title: "Tiết KT,Thi",
              dataIndex: "numberOfExam",
              width: 80,
              align: "center" as const,
            },
            {
              title: "Nhóm PB",
              width: 150,
              render: (_: any, record: any) => record.subjectVersionCategory?.name,
            },
            {
              title: "Đơn vị QL",
              width: 200,
              render: (_: any, record: any) => record.managementOrganization?.sTen,
            },
          ]}
        />
      ),
    },
    {
      key: "4",
      label: `Lớp môn học (${currentVersion?.subjectClass.length || 0})`,
      children: (
        <Table
          size="small"
          dataSource={currentVersion?.subjectClass}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total}`,
          }}
          scroll={{ x: "max-content" }}
          columns={[
            {
              title: "STT",
              width: 60,
              align: "center",
              render: (_, __, index) => index + 1,
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
              title: "Loại lớp",
              dataIndex: "type",
              width: 120,
              render: (value) => getSubjectClassTypeLabel(value),
            },
            {
              title: "Số SV tối đa",
              dataIndex: "maxStudent",
              width: 100,
              align: "center",
            },
            {
              title: "Học kỳ",
              width: 150,
              render: (_: any, record: any) => record.semester?.name,
            },
            {
              title: "Giảng viên",
              width: 200,
              render: (_: any, record: any) => record.mainLecturer?.userProfile?.fullName,
            },
            {
              title: "Ngày bắt đầu",
              dataIndex: "startDate",
              width: 120,
              render: (value) => (value ? dayjs(value).format("DD/MM/YYYY") : ""),
            },
            {
              title: "Ngày kết thúc",
              dataIndex: "endDate",
              width: 120,
              render: (value) => (value ? dayjs(value).format("DD/MM/YYYY") : ""),
            },
            {
              title: "Trạng thái",
              dataIndex: "active",
              width: 120,
              align: "center",
              render: (value) =>
                value ? (
                  <Tag color="success">Hoạt động</Tag>
                ) : (
                  <Tag color="error">Không hoạt động</Tag>
                ),
            },
            {
              title: "Trạng thái lớp",
              dataIndex: "status",
              width: 120,
              align: "center" as const,
              render: (value) => (
                <Tag color={getSubjectClassStatusColor(value)}>
                  {getSubjectClassStatusLabel(value)}
                </Tag>
              ),
            },
            {
              title: "Đối tượng ĐT",
              width: 150,
              render: (_: any, record: any) => record.trainingObjectType?.name,
            },
            {
              title: "Đã hủy",
              dataIndex: "cancelled",
              width: 100,
              align: "center" as const,
              render: (value: boolean) => (value ? "Có" : "Không"),
            },
            {
              title: "Phòng học",
              width: 150,
              render: (_: any, record: any) => record.room?.name,
            },
            {
              title: "Địa điểm ĐT",
              width: 150,
              render: (_: any, record: any) => record.trainingLocation?.name,
            },
            {
              title: "GV phụ",
              width: 200,
              render: (_: any, record: any) => record.extraLecturer?.userProfile?.fullName,
            },
            {
              title: "GV nhập điểm",
              width: 200,
              render: (_: any, record: any) => record.enterGradeLecturer?.userProfile?.fullName,
            },
            {
              title: "Hạn phân công GV",
              dataIndex: "lecturerAssignmentDeadline",
              width: 140,
              render: (value) => (value ? dayjs(value).format("DD/MM/YYYY HH:mm") : ""),
            },
            {
              title: "Ngày thi",
              dataIndex: "examDate",
              width: 120,
              render: (value) => (value ? dayjs(value).format("DD/MM/YYYY") : ""),
            },
            {
              title: "Hình thức thi",
              dataIndex: "examType",
              width: 120,
              render: (value) => getExamTypeLabel(value),
            },
            {
              title: "Mã đề thi",
              width: 120,
              render: (_: any, record: any) => record.exam?.code,
            },
            {
              title: "Bắt đầu nhập TX/ĐK",
              dataIndex: "scoreDeadLineStart",
              width: 140,
              render: (value) => (value ? dayjs(value).format("DD/MM/YYYY HH:mm") : ""),
            },
            {
              title: "Hạn nhập TX/ĐK",
              dataIndex: "scoreDeadline",
              width: 140,
              render: (value) => (value ? dayjs(value).format("DD/MM/YYYY HH:mm") : ""),
            },
            {
              title: "Hạn nhập điểm thi",
              dataIndex: "examScoreDeadline",
              width: 140,
              render: (value) => (value ? dayjs(value).format("DD/MM/YYYY HH:mm") : ""),
            },
            {
              title: "Khoá TX/ĐK",
              dataIndex: "isLockScore",
              width: 100,
              align: "center" as const,
              render: (value: boolean) => (value ? "Có" : "Không"),
            },
            {
              title: "Khoá điểm thi",
              dataIndex: "isLockExamScore",
              width: 100,
              align: "center" as const,
              render: (value: boolean) => (value ? "Có" : "Không"),
            },
            {
              title: "Đã nhập TX/ĐK",
              dataIndex: "enteredScore",
              width: 120,
              align: "center" as const,
              render: (value: boolean) => (value ? "Có" : "Không"),
            },
            {
              title: "Đã nhập thi",
              dataIndex: "enteredExamScore",
              width: 120,
              align: "center" as const,
              render: (value: boolean) => (value ? "Có" : "Không"),
            },
            {
              title: "Đã nộp điểm",
              dataIndex: "scoreSubmitted",
              width: 120,
              align: "center" as const,
              render: (value: boolean) => (value ? "Có" : "Không"),
            },
            {
              title: "Đã kiểm tra",
              dataIndex: "scoreChecked",
              width: 120,
              align: "center" as const,
              render: (value: boolean) => (value ? "Có" : "Không"),
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
      key: "5",
      label: `Khối đào tạo (${currentVersion?.trainingBlocks.length || 0})`,
      children: (
        <Table
          size="small"
          dataSource={currentVersion?.trainingBlocks}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total}`,
          }}
          scroll={{ x: "max-content" }}
          columns={[
            {
              title: "STT",
              width: 60,
              align: "center",
              render: (_, __, index) => index + 1,
            },
            {
              title: "Chương trình đào tạo",
              width: 250,
              render: (_: any, record: any) =>
                record.trainingBlockOnCurriculumVersion?.curriculumVersion?.curriculum?.name,
            },
            {
              title: "Khối đào tạo",
              width: 200,
              render: (_: any, record: any) =>
                record.trainingBlockOnCurriculumVersion?.trainingBlock?.name,
            },
            {
              title: "Học kỳ",
              dataIndex: "semester",
              width: 100,
              align: "center",
            },
            {
              title: "Bắt buộc",
              dataIndex: "isRequired",
              width: 100,
              align: "center",
              render: (value) => (value ? "Có" : "Không"),
            },
            {
              title: "Thứ tự",
              dataIndex: "order",
              width: 80,
              align: "center",
            },
            {
              title: "Loại",
              dataIndex: "type",
              width: 120,
              render: (value) => getSubjectRequirementTypeLabel(value),
            },
            {
              title: "Tính điểm cuối",
              dataIndex: "useForFinalScore",
              width: 120,
              align: "center" as const,
              render: (value: boolean) => (value ? "Có" : "Không"),
            },
            {
              title: "Môn tốt nghiệp",
              dataIndex: "graduation",
              width: 120,
              align: "center" as const,
              render: (value: boolean) => (value ? "Có" : "Không"),
            },
            {
              title: "Trạng thái",
              dataIndex: "active",
              width: 120,
              align: "center" as const,
              render: (value: boolean) =>
                value ? (
                  <Tag color="success">Hoạt động</Tag>
                ) : (
                  <Tag color="error">Không hoạt động</Tag>
                ),
            },
          ]}
        />
      ),
    },
    {
      key: "6",
      label: `Môn tiên quyết (${currentVersion?.prerequisiteSubject.length || 0})`,
      children: (
        <Table
          size="small"
          dataSource={currentVersion?.prerequisiteSubject}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total}`,
          }}
          columns={[
            {
              title: "STT",
              width: 60,
              align: "center",
              render: (_, __, index) => index + 1,
            },
            {
              title: "Mã môn",
              dataIndex: "code",
              width: 120,
            },
            {
              title: "Tên môn",
              dataIndex: "name",
              width: 250,
            },
            {
              title: "Tín chỉ",
              dataIndex: "credit",
              width: 80,
              align: "center",
            },
            {
              title: "Trạng thái",
              dataIndex: "active",
              width: 120,
              align: "center",
              render: (value) =>
                value ? (
                  <Tag color="success">Hoạt động</Tag>
                ) : (
                  <Tag color="error">Không hoạt động</Tag>
                ),
            },
          ]}
        />
      ),
    },
    {
      key: "7",
      label: `Môn học trước (${currentVersion?.coRequisiteSubject.length || 0})`,
      children: (
        <Table
          size="small"
          dataSource={currentVersion?.coRequisiteSubject}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total}`,
          }}
          columns={[
            {
              title: "STT",
              width: 60,
              align: "center",
              render: (_, __, index) => index + 1,
            },
            {
              title: "Mã môn",
              dataIndex: "code",
              width: 120,
            },
            {
              title: "Tên môn",
              dataIndex: "name",
              width: 250,
            },
            {
              title: "Tín chỉ",
              dataIndex: "credit",
              width: 80,
              align: "center",
            },
            {
              title: "Trạng thái",
              dataIndex: "active",
              width: 120,
              align: "center",
              render: (value: boolean) =>
                value ? (
                  <Tag color="success">Hoạt động</Tag>
                ) : (
                  <Tag color="error">Không hoạt động</Tag>
                ),
            },
          ]}
        />
      ),
    },
    {
      key: "8",
      label: `Nhóm tương đương (${currentVersion?.equivalencyGroups.length || 0})`,
      children: (
        <Table
          size="small"
          dataSource={currentVersion?.equivalencyGroups}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total}`,
          }}
          scroll={{ x: "max-content" }}
          columns={[
            {
              title: "STT",
              width: 60,
              align: "center",
              render: (_, __, index) => index + 1,
            },
            {
              title: "Môn tương đương",
              width: 300,
              render: (_, record) => {
                const equivalentNames =
                  record.equivalencyGroup?.subjects
                    ?.filter((item: any) => item.subjectId !== record.subjectId)
                    .map((item: any) => item.subject?.name)
                    .filter(Boolean)
                    .join(", ") || "-"

                return equivalentNames
              },
            },
            {
              title: "Mô tả",
              width: 250,
              render: (_, record) => record.equivalencyGroup?.description || "-",
            },
            {
              title: "Số môn trong nhóm",
              width: 120,
              align: "center" as const,
              render: (_: any, record: any) => record.equivalencyGroup?.subjects?.length || 0,
            },
          ]}
        />
      ),
    },
    {
      key: "9",
      label: `Khối kiến thức (${currentVersion?.knowledgeBlocks.length || 0})`,
      children: (
        <Table
          size="small"
          dataSource={currentVersion?.knowledgeBlocks}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total}`,
          }}
          scroll={{ x: "max-content" }}
          columns={[
            {
              title: "STT",
              width: 60,
              align: "center" as const,
              render: (_: any, __: any, index: number) => index + 1,
            },
            {
              title: "Tên khối",
              dataIndex: "name",
              width: 250,
            },
            {
              title: "Mô tả",
              dataIndex: "description",
              width: 300,
            },
          ]}
        />
      ),
    },
    {
      key: "10",
      label: `Đề thi (${currentVersion?.exams.length || 0})`,
      children: (
        <Table
          size="small"
          dataSource={currentVersion?.exams}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total}`,
          }}
          scroll={{ x: "max-content" }}
          columns={[
            {
              title: "STT",
              width: 60,
              align: "center",
              render: (_, __, index) => index + 1,
            },
            {
              title: "Mã đề",
              dataIndex: "code",
              width: 120,
            },
            {
              title: "Tên đề",
              dataIndex: "name",
              width: 250,
            },
            {
              title: "Ngân hàng câu hỏi",
              width: 150,
              render: (_: any, record: any) => record.examBank?.name,
            },
            {
              title: "Thời gian (phút)",
              dataIndex: "duration",
              width: 120,
              align: "center",
            },
            {
              title: "Số ca",
              dataIndex: "session",
              width: 80,
              align: "center" as const,
            },
            {
              title: "Trạng thái",
              dataIndex: "active",
              width: 120,
              align: "center",
              render: (value) =>
                value ? (
                  <Tag color="success">Hoạt động</Tag>
                ) : (
                  <Tag color="error">Không hoạt động</Tag>
                ),
            },
            {
              title: "Khoá DS thi",
              dataIndex: "lockExamSessions",
              width: 100,
              align: "center" as const,
              render: (value: boolean) => (value ? "Có" : "Không"),
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
      key: "11",
      label: `Tài liệu (${currentVersion?.documentFiles.length || 0})`,
      children: (
        <Table
          size="small"
          dataSource={currentVersion?.documentFiles}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total}`,
          }}
          scroll={{ x: "max-content" }}
          columns={[
            {
              title: "STT",
              width: 60,
              align: "center",
              render: (_, __, index) => index + 1,
            },
            {
              title: "Tên file",
              dataIndex: "name",
              width: 300,
            },
            {
              title: "Loại file",
              dataIndex: "mimeType",
              width: 120,
            },
            {
              title: "Kích thước",
              width: 120,
              render: (_: any, record: any) => {
                const size = Number(record.size)
                if (!size) return ""
                if (size < 1024) return `${size} B`
                if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
                return `${(size / (1024 * 1024)).toFixed(2)} MB`
              },
            },
          ]}
        />
      ),
    },
    {
      key: "12",
      label: `Ngân hàng câu hỏi (${currentVersion?.examFramework?.length || 0})`,
      children: (
        <Table
          size="small"
          dataSource={currentVersion?.examFramework}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total}`,
          }}
          scroll={{ x: "max-content" }}
          columns={[
            {
              title: "STT",
              width: 60,
              align: "center",
              render: (_, __, index) => index + 1,
            },
            {
              title: "Mã ngân hàng",
              dataIndex: "code",
              width: 150,
            },
            {
              title: "Tên ngân hàng",
              dataIndex: "name",
              width: 300,
            },
            {
              title: "Mô tả",
              dataIndex: "description",
              width: 350,
            },
            {
              title: "Trạng thái",
              dataIndex: "active",
              width: 120,
              align: "center",
              render: (value) =>
                value ? (
                  <Tag color="success">Hoạt động</Tag>
                ) : (
                  <Tag color="error">Không hoạt động</Tag>
                ),
            },
          ]}
        />
      ),
    },
    {
      key: "13",
      label: `Lịch sử thay đổi (${currentVersion?.subjectVersionHistory.length || 0})`,
      children: (
        <Table
          size="small"
          dataSource={currentVersion?.subjectVersionHistory}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total}`,
          }}
          scroll={{ x: "max-content" }}
          columns={[
            {
              title: "STT",
              width: 60,
              align: "center",
              render: (_, __, index) => index + 1,
            },
            {
              title: "Thao tác",
              dataIndex: "action",
              width: 120,
              render: (value) => (
                <Tag color={getHistoryActionColor(value)}>{getHistoryActionLabel(value)}</Tag>
              ),
            },
            {
              title: "Nội dung",
              dataIndex: "content",
              width: 400,
            },
            {
              title: "Người thực hiện",
              width: 200,
              render: (_: any, record: any) => record.updatedBy?.fullName,
            },
            {
              title: "Thời gian",
              dataIndex: "updatedAt",
              width: 150,
              render: (value) => (value ? dayjs(value).format("DD/MM/YYYY HH:mm") : ""),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <Modal
      title={`Chi tiết môn học: ${subject?.name || ""}`}
      open={isOpen}
      onCancel={onClose}
      width="w-[100vw]"
      footer={null}
      style={{ top: 10 }}
    >
      <Tabs defaultActiveKey="1" items={items} />
    </Modal>
  )
}
