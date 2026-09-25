import useSpinner from "@hooks/spinner"
import { useThesisProjectStatusOptions } from "@hooks/thesisProjectStatus"
import { ThesisType } from "@workspace/db/client"
import {
  useFindManyStudentThesisRegistration,
  useFindManyThesisSession,
  useFindUniqueThesisProject,
  useUpdateThesisProject,
} from "@workspace/db/hooks"
import { Select } from "@workspace/ui"
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Modal,
  Skeleton,
  Table,
  Tag,
  Typography,
  message,
} from "antd"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"
import { ArrowRightLeft, BookOpen, Calendar, Users } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { versionToPersonLike } from "@/utils/expert-select"

export type ModalChuyenDotXetLuanVanInput = {
  thesisProjectId: string
  thesisSessionId: string
  onSuccess?: () => void | Promise<void>
}

type StudentRow = {
  key: string
  code: string
  fullname: string
  fixedClass: string
  trainingCourse: string
}

function getExpertDisplayName(
  expert?: {
    name?: string | null
    lecturer?: { userProfile?: { fullname?: string | null } | null } | null
    expert?: {
      lecturer?: { userProfile?: { fullname?: string | null } | null } | null
    } | null
  } | null,
  fallbackName?: string | null
) {
  const person = versionToPersonLike(expert)
  return person?.lecturer?.userProfile?.fullname || person?.name || fallbackName || "—"
}

function formatDateRange(start?: Date | string | null, end?: Date | string | null) {
  if (!start && !end) return "—"
  const startText = start ? dayjs(start).format("DD/MM/YYYY") : "—"
  const endText = end ? dayjs(end).format("DD/MM/YYYY") : "—"
  return `${startText} → ${endText}`
}

const ModalChuyenDotXetLuanVan = () => {
  const { isOpen, onClose, input } = useDisclosure<ModalChuyenDotXetLuanVanInput>({
    tag: "ModalChuyenDotXetLuanVan",
  })

  const [targetSessionId, setTargetSessionId] = useState<string>()
  const { showSpinner, hideSpinner } = useSpinner()
  const { mutateAsync: updateThesisProject } = useUpdateThesisProject()
  const { getThesisProjectStatusLabel, getThesisProjectStatusColor } =
    useThesisProjectStatusOptions()

  const thesisProjectId = input?.thesisProjectId
  const currentSessionId = input?.thesisSessionId

  const { data: thesisProject, isLoading } = useFindUniqueThesisProject(
    {
      where: { id: thesisProjectId },
      include: {
        thesisSession: {
          include: { trainingCourses: true },
        },
        organization: true,
        room: true,
        defenseSession: true,
        council: {
          include: {
            members: true,
          },
        },
        supervisor: {
          include: {
            academicRankType: true,
            academicDegreeType: true,
            expert: {
              include: {
                lecturer: {
                  include: {
                    userProfile: {
                      include: { donVi: true, academicRankType: true, academicDegreeType: true },
                    },
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
            expert: {
              include: {
                lecturer: {
                  include: {
                    userProfile: {
                      include: { donVi: true, academicRankType: true, academicDegreeType: true },
                    },
                  },
                },
              },
            },
          },
        },
        primarySupervisor: {
          include: {
            userProfile: true,
          },
        },
        secondarySupervisor: {
          include: {
            userProfile: true,
          },
        },
        registrations: {
          where: { deletedAt: null },
          include: {
            student: {
              include: {
                userProfile: true,
                fixedClass: {
                  include: { trainingCourse: true },
                },
              },
            },
          },
        },
      },
    },
    { enabled: !!thesisProjectId && isOpen }
  )

  const currentTrainingCourseIds = useMemo(
    () => thesisProject?.thesisSession?.trainingCourses?.map((course) => course.id) ?? [],
    [thesisProject?.thesisSession?.trainingCourses]
  )

  const registeredStudentIds = useMemo(
    () => thesisProject?.registrations?.map((registration) => registration.studentId) ?? [],
    [thesisProject?.registrations]
  )

  const { data: eligibleSessions = [] } = useFindManyThesisSession(
    {
      where: {
        id: currentSessionId ? { not: currentSessionId } : undefined,
        trainingObjectTypeId: thesisProject?.thesisSession?.trainingObjectTypeId,
        trainingCourses:
          currentTrainingCourseIds.length > 0
            ? { some: { id: { in: currentTrainingCourseIds } } }
            : undefined,
      },
      include: { trainingCourses: true },
      orderBy: { startDate: "desc" },
    },
    {
      enabled:
        isOpen &&
        !!thesisProject?.thesisSession?.trainingObjectTypeId &&
        currentTrainingCourseIds.length > 0,
    }
  )

  const targetSessionOptions = useMemo(
    () =>
      eligibleSessions.map((session) => ({
        label: `${session.name} (${dayjs(session.startDate).format("DD/MM/YYYY")} – ${dayjs(session.endDate).format("DD/MM/YYYY")})`,
        value: session.id,
      })),
    [eligibleSessions]
  )

  const selectedTargetSession = useMemo(
    () => eligibleSessions.find((session) => session.id === targetSessionId),
    [eligibleSessions, targetSessionId]
  )

  const { data: conflictingRegistrations = [] } = useFindManyStudentThesisRegistration(
    {
      where: {
        deletedAt: null,
        studentId: { in: registeredStudentIds },
        thesisProjectId: thesisProjectId ? { not: thesisProjectId } : undefined,
        thesisProject: {
          deletedAt: null,
          thesisSessionId: targetSessionId,
          thesisType: ThesisType.THESIS,
        },
      },
      include: {
        student: {
          include: { userProfile: true },
        },
        thesisProject: {
          select: { title: true, status: true },
        },
      },
    },
    {
      enabled: isOpen && !!targetSessionId && registeredStudentIds.length > 0 && !!thesisProjectId,
    }
  )

  const hasConflict = conflictingRegistrations.length > 0

  const studentRows = useMemo<StudentRow[]>(
    () =>
      thesisProject?.registrations?.map((registration) => ({
        key: registration.id,
        code: registration.student?.userProfile?.code || "—",
        fullname: registration.student?.userProfile?.fullname || "—",
        fixedClass: registration.student?.fixedClass?.name || "—",
        trainingCourse: registration.student?.fixedClass?.trainingCourse?.name || "—",
      })) ?? [],
    [thesisProject?.registrations]
  )

  const studentColumns: ColumnsType<StudentRow> = [
    { title: "Mã HV", dataIndex: "code", width: 110 },
    { title: "Họ và tên", dataIndex: "fullname", ellipsis: true },
    { title: "Lớp", dataIndex: "fixedClass", width: 240, ellipsis: true },
    { title: "Khóa", dataIndex: "trainingCourse", width: 120, ellipsis: true },
  ]

  const supervisorMain = getExpertDisplayName(
    thesisProject?.supervisor,
    thesisProject?.supervisorName
  )
  const supervisorCo = getExpertDisplayName(
    thesisProject?.coSupervisor,
    thesisProject?.coSupervisorName
  )

  useEffect(() => {
    if (!isOpen) {
      setTargetSessionId(undefined)
    }
  }, [isOpen])

  const handleTransfer = async () => {
    if (!thesisProjectId) {
      message.error("Không xác định được luận văn/đề án.")
      return
    }
    if (!targetSessionId) {
      message.warning("Vui lòng chọn đợt xét đích.")
      return
    }
    if (hasConflict) {
      message.error("Học viên đã có luận văn/đề án trong đợt xét đích. Không thể chuyển.")
      return
    }

    try {
      showSpinner()
      await updateThesisProject({
        where: { id: thesisProjectId },
        data: {
          thesisSession: { connect: { id: targetSessionId } },
        },
      })
      await input?.onSuccess?.()
      message.success("Chuyển đợt xét thành công.")
      onClose()
    } catch (error: unknown) {
      const err = error as { info?: { message?: string }; message?: string }
      message.error(err?.info?.message || err?.message || "Đã xảy ra lỗi khi chuyển đợt xét.")
    } finally {
      hideSpinner()
    }
  }

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="text-blue-600" size={20} />
          <span>Chuyển đợt xét luận văn/đề án</span>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      destroyOnClose
      maskClosable={false}
      width={820}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          disabled={!targetSessionId || hasConflict || currentTrainingCourseIds.length === 0}
          onClick={() => void handleTransfer()}
        >
          Xác nhận chuyển
        </Button>,
      ]}
    >
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-3">
            <Card
              size="small"
              className="border-blue-200 bg-blue-50/50"
              title={
                <span className="text-sm font-medium text-blue-800">
                  <Calendar size={14} className="mr-1 inline" />
                  Đợt xét nguồn
                </span>
              }
            >
              <Typography.Text strong className="block text-base">
                {thesisProject?.thesisSession?.name ?? "—"}
              </Typography.Text>
              <Typography.Text type="secondary" className="mt-1 block text-xs">
                {formatDateRange(
                  thesisProject?.thesisSession?.startDate,
                  thesisProject?.thesisSession?.endDate
                )}
              </Typography.Text>
              <div className="mt-2 flex flex-wrap gap-1">
                {thesisProject?.thesisSession?.trainingCourses?.map((course) => (
                  <Tag key={course.id} color="blue">
                    {course.name}
                  </Tag>
                ))}
              </div>
            </Card>

            <div className="flex items-center justify-center px-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <ArrowRightLeft size={18} />
              </div>
            </div>

            <Card
              size="small"
              className={
                selectedTargetSession
                  ? "border-green-200 bg-green-50/50"
                  : "border-dashed border-gray-300 bg-gray-50"
              }
              title={
                <span
                  className={`text-sm font-medium ${selectedTargetSession ? "text-green-800" : "text-gray-500"}`}
                >
                  <Calendar size={14} className="mr-1 inline" />
                  Đợt xét đích
                </span>
              }
            >
              {currentTrainingCourseIds.length === 0 ? (
                <Alert
                  type="warning"
                  showIcon
                  className="mb-0"
                  message="Đợt xét hiện tại chưa gắn khóa huấn luyện."
                />
              ) : (
                <div className="space-y-2">
                  <Select
                    className="w-full"
                    placeholder="Chọn đợt xét đích"
                    value={targetSessionId}
                    options={targetSessionOptions}
                    onChange={(value) => setTargetSessionId(value as string)}
                    notFoundContent="Không có đợt xét phù hợp"
                  />
                  {selectedTargetSession ? (
                    <>
                      <Typography.Text strong className="block text-base">
                        {selectedTargetSession.name}
                      </Typography.Text>
                      <Typography.Text type="secondary" className="block text-xs">
                        {formatDateRange(
                          selectedTargetSession.startDate,
                          selectedTargetSession.endDate
                        )}
                      </Typography.Text>
                      <div className="flex flex-wrap gap-1">
                        {selectedTargetSession.trainingCourses?.map((course) => (
                          <Tag key={course.id} color="green">
                            {course.name}
                          </Tag>
                        ))}
                      </div>
                    </>
                  ) : (
                    <Typography.Text type="secondary" className="block text-xs">
                      Chỉ hiển thị đợt xét có chứa khóa huấn luyện trùng với đợt nguồn.
                    </Typography.Text>
                  )}
                  {targetSessionOptions.length === 0 ? (
                    <Alert
                      type="info"
                      showIcon
                      className="mb-0"
                      message="Không có đợt xét nào khác phù hợp."
                    />
                  ) : null}
                </div>
              )}
            </Card>
          </div>

          <Card
            size="small"
            title={
              <span className="text-sm font-medium">
                <BookOpen size={14} className="mr-1 inline" />
                Thông tin luận văn/đề án
              </span>
            }
          >
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Tên đề tài" span={2}>
                {thesisProject?.title || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Tên đề tài (EN)" span={2}>
                {thesisProject?.titleEN || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Loại">{thesisProject?.type || "—"}</Descriptions.Item>
              <Descriptions.Item label="Ngôn ngữ">
                {thesisProject?.language || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {thesisProject?.status ? (
                  <Tag color={getThesisProjectStatusColor(thesisProject.status)}>
                    {getThesisProjectStatusLabel(thesisProject.status)}
                  </Tag>
                ) : (
                  "—"
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Đơn vị quản lý">
                {thesisProject?.organization?.sTen || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Chuyên gia HD chính">{supervisorMain}</Descriptions.Item>
              <Descriptions.Item label="Chuyên gia HD phụ">{supervisorCo}</Descriptions.Item>
              <Descriptions.Item label="Phòng bảo vệ">
                {thesisProject?.room?.name || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày bảo vệ">
                {thesisProject?.defenseDate
                  ? dayjs(thesisProject.defenseDate).format("DD/MM/YYYY")
                  : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Ca bảo vệ">
                {thesisProject?.defenseSession?.startTime
                  ? dayjs(thesisProject.defenseSession.startTime).format("HH:mm")
                  : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Hội đồng">
                {thesisProject?.council
                  ? `${thesisProject.council.members?.length ?? 0} thành viên`
                  : "Chưa có"}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card
            size="small"
            title={
              <span className="text-sm font-medium">
                <Users size={14} className="mr-1 inline" />
                Học viên đăng ký ({studentRows.length})
              </span>
            }
          >
            <Table<StudentRow>
              rowKey="key"
              size="small"
              bordered
              pagination={false}
              dataSource={studentRows}
              columns={studentColumns}
              locale={{ emptyText: "Không có học viên" }}
            />
          </Card>

          {hasConflict ? (
            <Alert
              type="error"
              showIcon
              message="Học viên đã có luận văn/đề án trong đợt xét đích"
              description={
                <ul className="mb-0 mt-2 list-disc pl-4">
                  {conflictingRegistrations.map((registration) => (
                    <li key={registration.id}>
                      <Typography.Text strong>
                        {registration.student?.userProfile?.fullname || registration.student?.userProfile?.code}
                      </Typography.Text>
                      {": "}
                      {registration.thesisProject?.title || "Chưa có tên đề tài"}
                      {registration.thesisProject?.status ? (
                        <Tag className="ml-2" color="red">
                          {getThesisProjectStatusLabel(registration.thesisProject.status)}
                        </Tag>
                      ) : null}
                    </li>
                  ))}
                </ul>
              }
            />
          ) : null}

          {/* {targetSessionId && !hasConflict ? (
            <Alert
              type="info"
              showIcon
              message="Toàn bộ thông tin luận văn/đề án sẽ được chuyển sang đợt xét mới"
              description="Bao gồm: đề tài, GVHD, hội đồng, phòng/ca bảo vệ, biên bản, nộp thư viện và các thông tin liên quan."
            />
          ) : null} */}
        </div>
      )}
    </Modal>
  )
}

export default ModalChuyenDotXetLuanVan
