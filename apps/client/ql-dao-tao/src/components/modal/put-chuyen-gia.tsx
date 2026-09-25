import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import { CouncilRole, ThesisType } from "@workspace/db/client"
import {
  useCreateExpert,
  useCreateExpertProfileVersion,
  useFindFirstExpert,
  useFindManyCouncilMember,
  useFindManyDM_HocHam,
  useFindManyDM_HocVi,
  useFindManyLecturer,
  useFindManyThesisProject,
  useFindUniqueExpert,
  useFindUniqueLecturer,
  useUpdateExpert,
  useUpdateExpertProfileVersion,
} from "@workspace/db/hooks"
import { sqlTransaction } from "@workspace/libs/api/model"
import { CheckOutlined, EditOutlined } from "@ant-design/icons"
import {
  Button,
  Checkbox,
  Col,
  Form,
  Input,
  Modal,
  message,
  Radio,
  Row,
  Select,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from "antd"
import dayjs from "dayjs"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"
import { useEffect, useMemo, useState } from "react"

const COUNCIL_ROLE_LABEL: Record<CouncilRole, string> = {
  [CouncilRole.CHAIRMAN]: "Chủ tịch",
  [CouncilRole.SECRETARY]: "Thư ký",
  [CouncilRole.REVIEWER_1]: "Phản biện 1",
  [CouncilRole.REVIEWER_2]: "Phản biện 2",
  [CouncilRole.MEMBER]: "Ủy viên",
}

export interface PutExpertProps {
  id?: string
  /** true = danh mục luận văn; false = danh mục đồ án */
  thesisExpert?: boolean
}

/** @deprecated dùng PutExpertProps */
export type PutExpertProfileProps = PutExpertProps

type ExpertFormValues = {
  lecturerId?: string | null
  name?: string | null
  position?: string | null
  academicRankTypeId?: string | null
  academicDegreeTypeId?: string | null
  specialization?: string | null
  workplace?: string | null
  phone?: string | null
  email?: string | null
  bankAccountNumber?: string | null
  bankName?: string | null
  eligiblePresident?: boolean
  eligibleSecretary?: boolean
  active?: boolean
}

dayjs.locale("vi")

type ExistingExpert = {
  id: string
  currentVersionId?: string | null
  currentVersion?: {
    id?: string | null
    thesisExpert?: boolean | null
    projectExpert?: boolean | null
  } | null
}

function resolveActive(output: ExpertFormValues) {
  return output.active !== false
}

function isUniqueConstraintError(error: any) {
  const code = error?.code || error?.info?.code || error?.info?.prisma
  if (code === "P2002") return true
  const msg = String(error?.info?.message || error?.message || "")
  return /unique constraint/i.test(msg)
}

async function restoreDeletedExpertByLecturer(lecturerId: string): Promise<ExistingExpert | null> {
  const res = await sqlTransaction([
    {
      model: "Expert",
      operation: "findFirst",
      data: {
        where: { lecturerId },
        include: { currentVersion: true },
      },
    },
  ])
  if (res.status !== 200) return null
  const found = (Array.isArray(res.data) ? res.data[0] : null) as ExistingExpert | null
  if (!found?.id) return null

  const restored = await sqlTransaction([
    {
      model: "Expert",
      operation: "update",
      data: {
        where: { id: found.id },
        data: { deletedAt: null, active: true },
      },
    },
  ])
  if (restored.status !== 200) return null
  return found
}

const formatRange = (from?: Date | string | null, to?: Date | string | null) => {
  const start = from ? dayjs(from).format("DD/MM/YYYY HH:mm") : "—"
  const end = to ? dayjs(to).format("DD/MM/YYYY HH:mm") : "hiện tại"
  return `${start} → ${end}`
}

const PutExpert = () => {
  const [form] = Form.useForm<ExpertFormValues>()
  const { isOpen, onClose, input } = useDisclosure<PutExpertProps>({
    tag: "PutExpert",
    onClose: () => {
      form.resetFields()
      setActiveTab("profile")
      setEditingVersionId(null)
      setApplyingVersionId(null)
      setSelectedLecturerId(undefined)
      setSearch("")
    },
  })
  const { showSpinner, hideSpinner } = useSpinner()
  const [isInternal, setIsInternal] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedLecturerId, setSelectedLecturerId] = useState<string | undefined>()
  const [applyingVersionId, setApplyingVersionId] = useState<string | null>(null)
  /** Version đang mở trên form để sửa đè (in-place). */
  const [editingVersionId, setEditingVersionId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"profile" | "council" | "supervisor">("profile")

  const isThesisDomain = input?.thesisExpert !== false
  const isEdit = !!input?.id
  const councilHistoryEnabled = isOpen && isEdit && activeTab === "council" && !!input?.id
  const supervisorHistoryEnabled =
    isOpen && isEdit && activeTab === "supervisor" && !!input?.id

  const { data: expert, refetch: refetchExpert } = useFindUniqueExpert(
    {
      where: { id: input?.id ?? "" },
      include: {
        currentVersion: {
          include: {
            academicRankType: true,
            academicDegreeType: true,
          },
        },
        versions: {
          where: { deletedAt: null },
          orderBy: [{ validFrom: "desc" }, { createdAt: "desc" }],
          include: {
            academicRankType: true,
            academicDegreeType: true,
          },
        },
        lecturer: { include: { userProfile: true } },
      },
    },
    { enabled: !!input?.id }
  )

  const { data: lecturer = [] } = useFindManyLecturer({
    where: search
      ? {
          OR: [
            { userProfile: { code: { contains: search, mode: "insensitive" } } },
            { userProfile: { fullname: { contains: search, mode: "insensitive" } } },
            { userProfile: { donVi: { sTen: { contains: search, mode: "insensitive" } } } },
          ],
        }
      : {},
    include: { userProfile: { include: { donVi: true } } },
    take: 200,
  })

  const { data: selectedLecturer } = useFindUniqueLecturer(
    {
      where: { id: selectedLecturerId ?? "" },
      include: { userProfile: true },
    },
    { enabled: !!selectedLecturerId }
  )

  const { data: academicRankType } = useFindManyDM_HocHam()
  const { data: academicDegreeType } = useFindManyDM_HocVi()

  const { data: councilMemberships = [], isFetching: loadingCouncilHistory } =
    useFindManyCouncilMember(
      {
        where: {
          deletedAt: null,
          expertId: input?.id || "__none__",
        },
        include: {
          council: {
            include: {
              thesis: {
                where: {
                  deletedAt: null,
                  thesisType: isThesisDomain ? ThesisType.THESIS : ThesisType.PROJECT,
                },
                include: {
                  thesisSession: { select: { id: true, name: true } },
                  organization: { select: { Id: true, sTen: true } },
                  room: { select: { name: true } },
                  registrations: {
                    where: { deletedAt: null },
                    take: 1,
                    select: {
                      student: {
                        select: {
                          userProfile: { select: { code: true, fullname: true } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      { enabled: councilHistoryEnabled }
    )

  const { data: supervisedProjects = [], isFetching: loadingSupervisorHistory } =
    useFindManyThesisProject(
      {
        where: {
          deletedAt: null,
          thesisType: isThesisDomain ? ThesisType.THESIS : ThesisType.PROJECT,
          OR: [
            { supervisor: { expertId: input?.id || "__none__" } },
            { coSupervisor: { expertId: input?.id || "__none__" } },
          ],
        },
        include: {
          thesisSession: { select: { id: true, name: true } },
          organization: { select: { Id: true, sTen: true } },
          supervisor: { select: { expertId: true } },
          coSupervisor: { select: { expertId: true } },
          registrations: {
            where: { deletedAt: null },
            take: 1,
            select: {
              student: {
                select: {
                  userProfile: { select: { code: true, fullname: true, dateOfBirth: true } },
                  fixedClass: { select: { name: true } },
                },
              },
            },
          },
        },
        orderBy: [{ defenseDate: "desc" }, { updatedAt: "desc" }],
      },
      { enabled: supervisorHistoryEnabled }
    )

  const { mutateAsync: createExpert } = useCreateExpert()
  const { mutateAsync: updateExpert } = useUpdateExpert()
  const { mutateAsync: createVersion } = useCreateExpertProfileVersion()
  const { mutateAsync: updateVersion } = useUpdateExpertProfileVersion()
  const { refetch: findExpertByLecturer } = useFindFirstExpert(
    {
      where: { lecturerId: selectedLecturerId || "__none__", deletedAt: null },
      include: { currentVersion: true },
    },
    { enabled: false }
  )

  const fillFormFromVersion = (
    v:
      | {
          name?: string | null
          position?: string | null
          academicRankTypeId?: string | null
          academicDegreeTypeId?: string | null
          specialization?: string | null
          workplace?: string | null
          phone?: string | null
          email?: string | null
          bankAccountNumber?: string | null
          bankName?: string | null
          eligiblePresident?: boolean | null
          eligibleSecretary?: boolean | null
          inAcademy?: boolean | null
        }
      | null
      | undefined,
    lecturerId?: string | null
  ) => {
    if (!v) return
    form.setFieldsValue({
      lecturerId: lecturerId ?? undefined,
      name: v.name,
      position: v.position,
      academicRankTypeId: v.academicRankTypeId,
      academicDegreeTypeId: v.academicDegreeTypeId,
      specialization: v.specialization,
      workplace: v.workplace,
      phone: v.phone,
      email: v.email,
      bankAccountNumber: v.bankAccountNumber,
      bankName: v.bankName,
      eligiblePresident: !!v.eligiblePresident,
      eligibleSecretary: !!v.eligibleSecretary,
    })
    setIsInternal(v.inAcademy ?? !!lecturerId)
    if (lecturerId) setSelectedLecturerId(lecturerId)
    else setSelectedLecturerId(undefined)
  }

  useEffect(() => {
    if (!expert) {
      setEditingVersionId(null)
      return
    }
    const versionId = expert.currentVersionId ?? expert.currentVersion?.id ?? null
    setEditingVersionId(versionId)
    fillFormFromVersion(expert.currentVersion, expert.lecturerId)
    form.setFieldValue("active", expert.active !== false)
  }, [expert, form])

  useEffect(() => {
    if (!expert) {
      form.setFieldsValue({
        eligiblePresident: isInternal,
        eligibleSecretary: isInternal,
        active: true,
      })
    }
  }, [isInternal, form, expert])

  const domainFlags = useMemo(
    () =>
      isThesisDomain
        ? { thesisExpert: true as const, projectExpert: false as const }
        : { thesisExpert: false as const, projectExpert: true as const },
    [isThesisDomain]
  )

  const versions = expert?.versions ?? []

  const buildVersionFields = (
    output: ExpertFormValues,
    prev?: {
      thesisExpert?: boolean | null
      projectExpert?: boolean | null
    } | null
  ) => {
    const fromLecturer = isInternal && selectedLecturer
    return {
      name: fromLecturer
        ? selectedLecturer.userProfile?.fullname || null
        : output.name?.trim() || null,
      phone: fromLecturer
        ? selectedLecturer.userProfile?.phoneNumber || null
        : output.phone || null,
      email: fromLecturer ? selectedLecturer.userProfile?.email || null : output.email || null,
      academicRankTypeId: fromLecturer ? null : output.academicRankTypeId || null,
      academicDegreeTypeId: fromLecturer ? null : output.academicDegreeTypeId || null,
      position: fromLecturer ? null : output.position || null,
      specialization: fromLecturer ? null : output.specialization || null,
      workplace: fromLecturer ? null : output.workplace || null,
      bankAccountNumber: output.bankAccountNumber || null,
      bankName: output.bankName || null,
      eligiblePresident: !!output.eligiblePresident,
      eligibleSecretary: !!output.eligibleSecretary,
      inAcademy: isInternal,
      thesisExpert: !!(prev?.thesisExpert || domainFlags.thesisExpert),
      projectExpert: !!(prev?.projectExpert || domainFlags.projectExpert),
    }
  }

  const buildVersionPayload = (
    output: ExpertFormValues,
    prev?: {
      thesisExpert?: boolean | null
      projectExpert?: boolean | null
    } | null
  ) => ({
    ...buildVersionFields(output, prev),
    validFrom: new Date(),
    validTo: null,
  })

  const attachCurrentVersion = async (expertId: string, versionId: string) => {
    await updateExpert({
      where: { id: expertId },
      data: { currentVersionId: versionId },
    })
  }

  const attachToExistingExpert = async (found: ExistingExpert, output: ExpertFormValues) => {
    await reviseExpertVersion(
      found.id,
      found.currentVersionId ?? found.currentVersion?.id,
      output,
      found.currentVersion
    )
  }

  const createExpertWithVersion = async (output: ExpertFormValues) => {
    const created = await createExpert({
      data: {
        lecturerId: isInternal && selectedLecturer ? selectedLecturer.id : null,
        deletedAt: null,
        active: resolveActive(output),
      },
    })
    if (!created?.id) throw new Error("Không tạo được Expert")

    const version = await createVersion({
      data: {
        expertId: created.id,
        ...buildVersionPayload(output),
      },
    })
    if (!version?.id) throw new Error("Không tạo được phiên bản hồ sơ")

    await attachCurrentVersion(created.id, version.id)
  }

  /** Đóng version hiện tại + tạo version mới + cập nhật current. */
  const reviseExpertVersion = async (
    expertId: string,
    currentVersionId: string | null | undefined,
    output: ExpertFormValues,
    prevFlags?: { thesisExpert?: boolean | null; projectExpert?: boolean | null } | null
  ) => {
    if (currentVersionId) {
      await updateVersion({
        where: { id: currentVersionId },
        data: { validTo: new Date() },
      })
    }

    const version = await createVersion({
      data: {
        expertId,
        ...buildVersionPayload(output, prevFlags),
      },
    })
    if (!version?.id) throw new Error("Không tạo được phiên bản hồ sơ")

    await updateExpert({
      where: { id: expertId },
      data: {
        currentVersionId: version.id,
        lecturerId: isInternal && selectedLecturer ? selectedLecturer.id : null,
        deletedAt: null,
        active: resolveActive(output),
      },
    })
  }

  /**
   * Áp dụng một version cũ làm hồ sơ hiện tại (dùng cho select gán mới).
   * Không đụng FK đợt/HĐ đã gán — chúng vẫn trỏ version cũ.
   */
  const applyVersion = async (versionId: string) => {
    if (!expert?.id) return
    if (expert.currentVersionId === versionId) {
      message.info("Hồ sơ này đang được áp dụng.")
      return
    }

    const target = versions.find((v) => v.id === versionId)
    if (!target) {
      message.error("Không tìm thấy phiên bản hồ sơ.")
      return
    }

    try {
      setApplyingVersionId(versionId)
      showSpinner()

      if (expert.currentVersionId) {
        await updateVersion({
          where: { id: expert.currentVersionId },
          data: { validTo: new Date() },
        })
      }

      await updateVersion({
        where: { id: versionId },
        data: { validTo: null },
      })

      await updateExpert({
        where: { id: expert.id },
        data: {
          currentVersionId: versionId,
          lecturerId: target.inAcademy ? expert.lecturerId : null,
        },
      })

      await refetchExpert()
      fillFormFromVersion(target, target.inAcademy ? expert.lecturerId : null)
      setEditingVersionId(versionId)
      message.success(
        "Đã áp dụng hồ sơ này. Các select gán mới sẽ dùng phiên bản này; đợt/HĐ đã gán trước đó vẫn giữ hồ sơ cũ."
      )
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error.info.message)
        return
      }
      message.error(error?.message || "Không áp dụng được hồ sơ.")
    } finally {
      setApplyingVersionId(null)
      hideSpinner()
    }
  }

  const validateFormValues = (output: ExpertFormValues) => {
    if (isInternal && !selectedLecturerId && !selectedLecturer) {
      message.warning("Vui lòng chọn giảng viên trong học viện.")
      return false
    }
    if (!isInternal && !output.name?.trim()) {
      message.warning("Vui lòng nhập họ và tên chuyên gia ngoài học viện.")
      return false
    }
    return true
  }

  /** Chỉ tạo Expert lần đầu — không tạo version khi sửa. */
  async function onOk(output?: ExpertFormValues) {
    if (!output) return
    if (input?.id) return
    if (!validateFormValues(output)) return

    try {
      showSpinner()

      if (isInternal && selectedLecturer) {
        const existing = await findExpertByLecturer()
        const found = existing.data as ExistingExpert | undefined
        if (found?.id) {
          const alreadyInDomain = isThesisDomain
            ? found.currentVersion?.thesisExpert
            : found.currentVersion?.projectExpert
          if (alreadyInDomain) {
            message.warning(
              "Giảng viên này đã có hồ sơ chuyên gia. Hãy mở hồ sơ đó và dùng «Thêm phiên bản hồ sơ»."
            )
            return
          }
          await attachToExistingExpert(found, output)
        } else {
          try {
            await createExpertWithVersion(output)
          } catch (error: any) {
            if (!isUniqueConstraintError(error)) throw error
            const restored = await restoreDeletedExpertByLecturer(selectedLecturer.id)
            if (!restored?.id) throw error
            await attachToExistingExpert(restored, output)
          }
        }
      } else {
        await createExpertWithVersion(output)
      }
      message.success("Thêm mới chuyên gia thành công")
      onClose()
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error.info.message)
        return
      }
      message.error(error?.message || "Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  const loadVersionForEdit = (versionId: string) => {
    const target = versions.find((v) => v.id === versionId)
    if (!target) return
    setEditingVersionId(versionId)
    fillFormFromVersion(
      target,
      target.inAcademy ? expert?.lecturerId : null
    )
    message.info("Đã nạp phiên bản vào form. Chỉnh rồi bấm «Cập nhật phiên bản» để sửa đè.")
  }

  /** Sửa đè phiên bản đang chọn trên form. */
  const handleUpdateVersion = async () => {
    if (!input?.id || !expert?.id || !editingVersionId) {
      message.warning("Chưa chọn phiên bản để sửa. Bấm «Sửa» trên bảng lịch sử.")
      return
    }

    try {
      const output = await form.validateFields()
      if (!validateFormValues(output)) return

      const editing = versions.find((v) => v.id === editingVersionId)
      Modal.confirm({
        title: "Sửa đè phiên bản này?",
        content:
          "Thay đổi sẽ ghi đè phiên bản đang chọn. Nếu phiên bản đã được gán vào đợt/hội đồng, mẫu in và thanh toán của các đợt đó cũng sẽ đổi theo.",
        okText: "Cập nhật",
        cancelText: "Hủy",
        onOk: async () => {
          try {
            showSpinner()
            await updateVersion({
              where: { id: editingVersionId },
              data: buildVersionFields(output, editing ?? expert.currentVersion),
            })
            await updateExpert({
              where: { id: expert.id },
              data: {
                ...(editingVersionId === expert.currentVersionId
                  ? {
                      lecturerId: isInternal && selectedLecturer ? selectedLecturer.id : null,
                    }
                  : {}),
                active: resolveActive(output),
              },
            })
            await refetchExpert()
            message.success("Đã cập nhật phiên bản hồ sơ.")
          } catch (error: any) {
            if (error?.info?.message) {
              message.error(error.info.message)
              return
            }
            message.error(error?.message || "Không cập nhật được phiên bản.")
          } finally {
            hideSpinner()
          }
        },
      })
    } catch (error: any) {
      if (error?.errorFields) return
    }
  }

  /** Tạo phiên bản mới từ form và áp dụng làm current. */
  const handleAddVersion = async () => {
    if (!input?.id || !expert?.id) return

    try {
      const output = await form.validateFields()
      if (!validateFormValues(output)) return

      showSpinner()
      await reviseExpertVersion(
        expert.id,
        expert.currentVersionId,
        output,
        expert.currentVersion
      )
      await refetchExpert()
      message.success(
        "Đã lưu phiên bản mới và áp dụng cho các gán mới. Đợt/HĐ đã gán trước đó vẫn giữ hồ sơ cũ."
      )
    } catch (error: any) {
      if (error?.errorFields) return
      if (error?.info?.message) {
        message.error(error.info.message)
        return
      }
      message.error(error?.message || "Không thêm được phiên bản hồ sơ.")
    } finally {
      hideSpinner()
    }
  }

  const editingVersionLabel = useMemo(() => {
    if (!editingVersionId) return null
    const v = versions.find((x) => x.id === editingVersionId)
    if (!v) return editingVersionId
    return formatRange(v.validFrom, v.validTo)
  }, [editingVersionId, versions])

  const councilHistoryRows = useMemo(() => {
    const rows: Array<{
      key: string
      role: string
      studentName: string
      studentCode: string
      title: string
      sessionName: string
      organization: string
      defenseDate: string
      room: string
    }> = []

    for (const membership of councilMemberships) {
      const projects = membership.council?.thesis ?? []
      const roleLabel = COUNCIL_ROLE_LABEL[membership.role as CouncilRole] || membership.role
      if (!projects.length) {
        rows.push({
          key: membership.id,
          role: roleLabel,
          studentName: "—",
          studentCode: "—",
          title: "—",
          sessionName: "—",
          organization: "—",
          defenseDate: "—",
          room: "—",
        })
        continue
      }
      for (const project of projects) {
        const student = project.registrations?.[0]?.student
        rows.push({
          key: `${membership.id}-${project.id}`,
          role: roleLabel,
          studentName: student?.userProfile?.fullname || "—",
          studentCode: student?.userProfile?.code || "—",
          title: project.title || "—",
          sessionName: project.thesisSession?.name || "—",
          organization: project.organization?.sTen || "—",
          defenseDate: project.defenseDate
            ? dayjs(project.defenseDate).format("DD/MM/YYYY")
            : "—",
          room: project.room?.name || "—",
        })
      }
    }
    return rows
  }, [councilMemberships])

  const supervisorHistoryRows = useMemo(() => {
    const expertId = input?.id
    if (!expertId) return []
    return supervisedProjects.map((project) => {
      const student = project.registrations?.[0]?.student
      const isGvhd1 = project.supervisor?.expertId === expertId
      const isGvhd2 = project.coSupervisor?.expertId === expertId
      const role =
        isGvhd1 && isGvhd2 ? "GVHD1, GVHD2" : isGvhd1 ? "GVHD1" : isGvhd2 ? "GVHD2" : "—"
      return {
        key: project.id,
        role,
        studentName: student?.userProfile?.fullname || "—",
        studentCode: student?.userProfile?.code || "—",
        className: student?.fixedClass?.name || "—",
        title: project.title || "—",
        sessionName: project.thesisSession?.name || "—",
        organization: project.organization?.sTen || "—",
        defenseDate: project.defenseDate ? dayjs(project.defenseDate).format("DD/MM/YYYY") : "—",
      }
    })
  }, [input?.id, supervisedProjects])

  const domainLabel = isThesisDomain ? "luận văn" : "đồ án"

  const profileContent = (
    <>
      {isEdit ? (
        <Col span={24}>
          <Typography.Title level={5} className="!mb-1 !mt-0">
            {editingVersionLabel ? (
              <Tag color="processing">Đang sửa: {editingVersionLabel}</Tag>
            ) : null}
            {editingVersionId && editingVersionId === expert?.currentVersionId ? (
              <Tag color="green">Đang áp dụng</Tag>
            ) : null}
          </Typography.Title>
        </Col>
      ) : null}

      <Col span={24} className="mb-4">
        <Radio.Group
          onChange={(e) => {
            const nextInternal = e.target.value === "internal"
            setIsInternal(nextInternal)
            if (!nextInternal) {
              setSelectedLecturerId(undefined)
              form.setFieldValue("lecturerId", undefined)
            }
            if (!input?.id) {
              form.resetFields()
              setSelectedLecturerId(undefined)
            }
          }}
          value={isInternal ? "internal" : "external"}
        >
          <Radio value="internal">Chuyên gia trong học viện</Radio>
          <Radio value="external">Chuyên gia ngoài học viện</Radio>
        </Radio.Group>
      </Col>

      {isInternal && (
        <Col span={24}>
          <FormItem form={form} name="lecturerId" label="Chuyên gia hướng dẫn" required>
            <Select
              placeholder="Chọn giảng viên"
              showSearch
              filterOption={false}
              searchValue={search}
              onSearch={setSearch}
              options={lecturer.map((item) => ({
                label: [item.userProfile?.code, item?.userProfile?.fullname, item?.userProfile?.donVi?.sTen]
                  .filter(Boolean)
                  .join(" - "),
                value: item.id,
              }))}
              allowClear
              onChange={(value) => setSelectedLecturerId(value)}
            />
          </FormItem>
        </Col>
      )}

      {!isInternal && (
        <>
          <Col span={12}>
            <FormItem form={form} name="name" label="Họ và tên" required>
              <Input placeholder="Nhập họ và tên" />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem form={form} name="position" label="Chức vụ">
              <Input placeholder="Nhập chức vụ" />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem form={form} name="academicRankTypeId" label="Học hàm">
              <Select
                options={
                  academicRankType?.map((item) => ({
                    label: `${item.sMa} - ${item.sTen}`,
                    value: item.Id,
                  })) ?? []
                }
                placeholder="Chọn học hàm"
                allowClear
                showSearch
                optionFilterProp="label"
              />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem form={form} name="academicDegreeTypeId" label="Học vị">
              <Select
                options={
                  academicDegreeType?.map((item) => ({
                    label: `${item.sMa} - ${item.sTen}`,
                    value: item.Id,
                  })) ?? []
                }
                placeholder="Chọn học vị"
                allowClear
                showSearch
                optionFilterProp="label"
              />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem form={form} name="specialization" label="Chuyên ngành">
              <Input placeholder="Nhập chuyên ngành" />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem form={form} name="workplace" label="Đơn vị công tác">
              <Input placeholder="Nhập đơn vị công tác" />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem form={form} name="phone" label="Số điện thoại">
              <Input placeholder="Nhập số điện thoại" />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem form={form} name="email" label="Email">
              <Input placeholder="Nhập email" />
            </FormItem>
          </Col>
        </>
      )}

      <Col span={12}>
        <FormItem form={form} name="bankAccountNumber" label="Số tài khoản">
          <Input placeholder="Nhập số tài khoản" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="bankName" label="Ngân hàng">
          <Input placeholder="Nhập tên ngân hàng" />
        </FormItem>
      </Col>

      <Col span={24} className="flex flex-row">
        <Col span={12}>
          <FormItem form={form} name="eligiblePresident" valuePropName="checked">
            <Checkbox>Có thể là Chủ tịch hội đồng</Checkbox>
          </FormItem>
        </Col>
        <Col span={12}>
          <FormItem form={form} name="eligibleSecretary" valuePropName="checked">
            <Checkbox>Có thể là Thư ký hội đồng</Checkbox>
          </FormItem>
        </Col>
      </Col>

      <Col span={24}>
        <FormItem form={form} name="active" label="Trạng thái">
          <Radio.Group buttonStyle="solid">
            <Radio value={true}>Đang hoạt động</Radio>
            <Radio value={false}>Ngừng hoạt động</Radio>
          </Radio.Group>
        </FormItem>
      </Col>

      {isEdit ? (
        <Col span={24} className="mt-2">
          <Typography.Title level={5} className="!mb-2">
            Lịch sử phiên bản hồ sơ
          </Typography.Title>
          <Table
            rowKey="id"
            size="small"
            pagination={false}
            scroll={{ x: 1400, y: 320 }}
            dataSource={versions}
            columns={[
              {
                title: "STT",
                width: 56,
                align: "center",
                render: (_: unknown, __: unknown, index: number) => index + 1,
              },
              {
                title: "Hiệu lực",
                width: 200,
                render: (_: unknown, record: (typeof versions)[number]) =>
                  formatRange(record.validFrom, record.validTo),
              },
              {
                title: "Họ tên",
                width: 160,
                dataIndex: "name",
                render: (name: string | null) => name || "—",
              },
              {
                title: "Học hàm / Học vị",
                width: 140,
                render: (_: unknown, record: (typeof versions)[number]) =>
                  [record.academicRankType?.sMa, record.academicDegreeType?.sMa]
                    .filter(Boolean)
                    .join(".") || "—",
              },
              {
                title: "Trong HV",
                width: 90,
                align: "center",
                render: (_: unknown, record: (typeof versions)[number]) =>
                  record.inAcademy ? <Tag color="blue">Trong</Tag> : <Tag>Ngoài</Tag>,
              },
              {
                title: "Đơn vị",
                width: 140,
                dataIndex: "workplace",
                render: (v: string | null) => v || "—",
              },
              {
                title: "CT / TK",
                width: 100,
                align: "center",
                render: (_: unknown, record: (typeof versions)[number]) =>
                  [
                    record.eligiblePresident ? "CT" : null,
                    record.eligibleSecretary ? "TK" : null,
                  ]
                    .filter(Boolean)
                    .join(", ") || "—",
              },
              {
                title: "Trạng thái",
                width: 120,
                align: "center",
                render: (_: unknown, record: (typeof versions)[number]) =>
                  record.id === expert?.currentVersionId ? (
                    <Tag color="green">Đang áp dụng</Tag>
                  ) : (
                    <Tag>Lưu trữ</Tag>
                  ),
              },
              {
                title: "Thao tác",
                width: 100,
                fixed: "right",
                align: "center",
                render: (_: unknown, record: (typeof versions)[number]) => {
                  const isCurrent = record.id === expert?.currentVersionId
                  const isEditing = record.id === editingVersionId
                  return (
                    <div className="flex gap-1 justify-center">
                      <Tooltip title={isEditing ? "Đang sửa" : "Sửa"}>
                        <Button
                          size="small"
                          type={isEditing ? "default" : "dashed"}
                          icon={<EditOutlined />}
                          disabled={isEditing}
                          onClick={() => loadVersionForEdit(record.id)}
                        />
                      </Tooltip>
                      <Tooltip title={isCurrent ? "Đang áp dụng" : "Áp dụng"}>
                        <Button
                          type={isCurrent ? "default" : "primary"}
                          size="small"
                          icon={<CheckOutlined />}
                          disabled={isCurrent}
                          loading={applyingVersionId === record.id}
                          onClick={() => applyVersion(record.id)}
                        />
                      </Tooltip>
                    </div>
                  )
                },
              },
            ]}
          />
        </Col>
      ) : null}
    </>
  )

  const councilHistoryContent = (
    <Col span={24}>
      <Typography.Paragraph type="secondary" className="!mb-2">
        Thống kê các hội đồng bảo vệ {domainLabel} chuyên gia đã tham gia (theo vai trò đã gán).
      </Typography.Paragraph>
      <Table
        rowKey="key"
        size="small"
        loading={loadingCouncilHistory}
        pagination={false}
        scroll={{ x: 1100, y: 420 }}
        dataSource={councilHistoryRows}
        locale={{ emptyText: "Chưa có dữ liệu hội đồng" }}
        columns={[
          {
            title: "STT",
            width: 56,
            align: "center",
            render: (_: unknown, __: unknown, index: number) => index + 1,
          },
          { title: "Vai trò", dataIndex: "role", width: 120 },
          { title: "Học viên", dataIndex: "studentName", width: 160 },
          { title: "Mã HV", dataIndex: "studentCode", width: 110 },
          { title: "Đề tài", dataIndex: "title", width: 240 },
          { title: "Đợt xét", dataIndex: "sessionName", width: 160 },
          { title: "Khoa/đơn vị", dataIndex: "organization", width: 140 },
          { title: "Ngày bảo vệ", dataIndex: "defenseDate", width: 110 },
          { title: "Phòng", dataIndex: "room", width: 100 },
        ]}
      />
    </Col>
  )

  const supervisorHistoryContent = (
    <Col span={24}>
      <Typography.Paragraph type="secondary" className="!mb-2">
        Thống kê các đề tài {domainLabel} chuyên gia hướng dẫn với vai trò GVHD1 / GVHD2.
      </Typography.Paragraph>
      <Table
        rowKey="key"
        size="small"
        loading={loadingSupervisorHistory}
        pagination={false}
        scroll={{ x: 1100, y: 420 }}
        dataSource={supervisorHistoryRows}
        locale={{ emptyText: "Chưa có dữ liệu hướng dẫn" }}
        columns={[
          {
            title: "STT",
            width: 56,
            align: "center",
            render: (_: unknown, __: unknown, index: number) => index + 1,
          },
          {
            title: "Vai trò",
            dataIndex: "role",
            width: 110,
            render: (role: string) => <Tag color="blue">{role}</Tag>,
          },
          { title: "Học viên", dataIndex: "studentName", width: 160 },
          { title: "Mã HV", dataIndex: "studentCode", width: 110 },
          { title: "Lớp", dataIndex: "className", width: 120 },
          { title: "Đề tài", dataIndex: "title", width: 240 },
          { title: "Đợt xét", dataIndex: "sessionName", width: 160 },
          { title: "Khoa/đơn vị", dataIndex: "organization", width: 140 },
          { title: "Ngày bảo vệ", dataIndex: "defenseDate", width: 110 },
        ]}
      />
    </Col>
  )

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={isEdit ? "Thông tin hồ sơ của chuyên gia" : "Thêm mới chuyên gia"}
      className="w-[90vw]"
      okText={isEdit ? undefined : "Lưu"}
      footer={
        isEdit
          ? [
              <Button key="close" onClick={onClose}>
                Đóng
              </Button>,
              ...(activeTab === "profile"
                ? [
                    <Button key="update-version" onClick={handleUpdateVersion}>
                      Cập nhật phiên bản
                    </Button>,
                    <Button key="add-version" type="primary" onClick={handleAddVersion}>
                      Lưu phiên bản mới
                    </Button>,
                  ]
                : []),
            ]
          : undefined
      }
    >
      {isEdit ? (
        <Col span={24}>
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as "profile" | "council" | "supervisor")}
            items={[
              {
                key: "profile",
                label: "Thông tin hồ sơ",
                children: (
                  <div className="pt-2">
                    <Row gutter={[8, 8]}>{profileContent}</Row>
                  </div>
                ),
              },
              {
                key: "council",
                label: "Lịch sử tham gia hội đồng",
                children: (
                  <div className="pt-2">
                    <Row gutter={[8, 8]}>{councilHistoryContent}</Row>
                  </div>
                ),
              },
              {
                key: "supervisor",
                label: "Lịch sử tham gia hướng dẫn",
                children: (
                  <div className="pt-2">
                    <Row gutter={[8, 8]}>{supervisorHistoryContent}</Row>
                  </div>
                ),
              },
            ]}
          />
        </Col>
      ) : (
        profileContent
      )}
    </PutFormModal>
  )
}

export default PutExpert
/** @deprecated dùng default PutExpert */
export { PutExpert as PutExpertProfile }
