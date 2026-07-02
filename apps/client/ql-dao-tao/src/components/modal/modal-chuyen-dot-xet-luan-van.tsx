import useSpinner from "@hooks/spinner"
import { ThesisType } from "@workspace/db/client"
import {
  useFindManyStudentThesisRegistration,
  useFindManyThesisSession,
  useFindUniqueThesisProject,
  useUpdateThesisProject,
} from "@workspace/db/hooks"
import { Select } from "@workspace/ui"
import { Alert, Button, Form, Modal, Typography, message } from "antd"
import { useEffect, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export type ModalChuyenDotXetLuanVanInput = {
  thesisProjectId: string
  thesisSessionId: string
  onSuccess?: () => void | Promise<void>
}

const ModalChuyenDotXetLuanVan = () => {
  const { isOpen, onClose, input } = useDisclosure<ModalChuyenDotXetLuanVanInput>({
    tag: "ModalChuyenDotXetLuanVan",
  })

  const [targetSessionId, setTargetSessionId] = useState<string>()
  const { showSpinner, hideSpinner } = useSpinner()
  const { mutateAsync: updateThesisProject } = useUpdateThesisProject()

  const thesisProjectId = input?.thesisProjectId
  const currentSessionId = input?.thesisSessionId

  const { data: thesisProject } = useFindUniqueThesisProject(
    {
      where: { id: thesisProjectId },
      include: {
        thesisSession: {
          include: { trainingCourses: true },
        },
        supervisor: true,
        coSupervisor: true,
        registrations: {
          where: { deletedAt: null },
          include: {
            student: {
              include: { userProfile: true },
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

  const currentTrainingCourseNames = useMemo(
    () => thesisProject?.thesisSession?.trainingCourses?.map((course) => course.name).join(", "),
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
        label: session.name,
        value: session.id,
      })),
    [eligibleSessions]
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
          select: { title: true },
        },
      },
    },
    {
      enabled: isOpen && !!targetSessionId && registeredStudentIds.length > 0 && !!thesisProjectId,
    }
  )

  const hasConflict = conflictingRegistrations.length > 0

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

  const studentNames =
    thesisProject?.registrations
      ?.map(
        (registration) =>
          registration.student?.userProfile?.fullname || registration.student?.code || ""
      )
      .filter(Boolean)
      .join(", ") || "—"

  const supervisorName =
    thesisProject?.supervisor?.name ||
    thesisProject?.supervisorName ||
    thesisProject?.coSupervisor?.name ||
    thesisProject?.coSupervisorName ||
    "—"

  return (
    <Modal
      title="Chuyển đợt xét"
      open={isOpen}
      onCancel={onClose}
      destroyOnClose
      maskClosable={false}
      width={560}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          disabled={!targetSessionId || hasConflict}
          onClick={() => void handleTransfer()}
        >
          Chuyển
        </Button>,
      ]}
    >
      <div className="mb-4 space-y-1 text-sm text-gray-600">
        <div>
          <Typography.Text strong>Đợt xét hiện tại: </Typography.Text>
          {thesisProject?.thesisSession?.name ?? "—"}
        </div>
        <div>
          <Typography.Text strong>Khóa huấn luyện: </Typography.Text>
          {currentTrainingCourseNames || "—"}
        </div>
        <div>
          <Typography.Text strong>Học viên: </Typography.Text>
          {studentNames}
        </div>
        <div>
          <Typography.Text strong>Đề tài: </Typography.Text>
          {thesisProject?.title || "—"}
        </div>
        <div>
          <Typography.Text strong>GVHD: </Typography.Text>
          {supervisorName}
        </div>
      </div>

      {currentTrainingCourseIds.length === 0 ? (
        <Alert
          type="warning"
          showIcon
          className="mb-4"
          message="Đợt xét hiện tại chưa gắn khóa huấn luyện nên không thể chuyển đợt xét."
        />
      ) : null}

      <Form.Item label="Đợt xét đích" required className="mb-2">
        <Select
          placeholder="Chọn đợt xét đích"
          value={targetSessionId}
          options={targetSessionOptions}
          disabled={currentTrainingCourseIds.length === 0}
          onChange={(value) => setTargetSessionId(value as string)}
          notFoundContent="Không có đợt xét phù hợp"
        />
      </Form.Item>

      {targetSessionId && targetSessionOptions.length === 0 ? (
        <Alert
          type="info"
          showIcon
          className="mb-4"
          message="Không có đợt xét nào khác chứa cùng khóa huấn luyện."
        />
      ) : null}

      {hasConflict ? (
        <Alert
          type="error"
          showIcon
          message="Học viên đã có luận văn/đề án trong đợt xét đích"
          description={
            <ul className="mb-0 mt-2 list-disc pl-4">
              {conflictingRegistrations.map((registration) => (
                <li key={registration.id}>
                  {registration.student?.userProfile?.fullname || registration.student?.code}:{" "}
                  {registration.thesisProject?.title || "Chưa có tên đề tài"}
                </li>
              ))}
            </ul>
          }
        />
      ) : null}

      {targetSessionId && !hasConflict ? (
        <Alert
          type="info"
          showIcon
          className="mt-4"
          message="Toàn bộ thông tin luận văn/đề án (đề tài, GVHD, hội đồng, ...) sẽ được chuyển sang đợt xét mới."
        />
      ) : null}
    </Modal>
  )
}

export default ModalChuyenDotXetLuanVan
