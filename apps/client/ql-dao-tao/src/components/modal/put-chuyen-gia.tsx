import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import {
  useCreateExpert,
  useCreateExpertProfileVersion,
  useFindFirstExpert,
  useFindManyDM_HocHam,
  useFindManyDM_HocVi,
  useFindManyLecturer,
  useFindUniqueExpert,
  useFindUniqueLecturer,
  useUpdateExpert,
  useUpdateExpertProfileVersion,
} from "@workspace/db/hooks"
import { CheckOutlined, EditOutlined } from "@ant-design/icons"
import {
  Alert,
  Button,
  Checkbox,
  Col,
  Form,
  Input,
  Modal,
  message,
  Radio,
  Select,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd"
import dayjs from "dayjs"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"
import { useEffect, useMemo, useState } from "react"

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
}

dayjs.locale("vi")

const formatRange = (from?: Date | string | null, to?: Date | string | null) => {
  const start = from ? dayjs(from).format("DD/MM/YYYY HH:mm") : "—"
  const end = to ? dayjs(to).format("DD/MM/YYYY HH:mm") : "hiện tại"
  return `${start} → ${end}`
}

const PutExpert = () => {
  const [form] = Form.useForm<ExpertFormValues>()
  const { isOpen, onClose, input } = useDisclosure<PutExpertProps>({
    tag: "PutExpert",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()
  const [isInternal, setIsInternal] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedLecturerId, setSelectedLecturerId] = useState<string | undefined>()
  const [applyingVersionId, setApplyingVersionId] = useState<string | null>(null)
  /** Version đang mở trên form để sửa đè (in-place). */
  const [editingVersionId, setEditingVersionId] = useState<string | null>(null)

  const isThesisDomain = input?.thesisExpert !== false

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
            { code: { contains: search, mode: "insensitive" } },
            { userProfile: { fullname: { contains: search, mode: "insensitive" } } },
            { organization: { sTen: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {},
    include: { userProfile: true, organization: true },
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
  }, [expert, form])

  useEffect(() => {
    if (!expert) {
      form.setFieldsValue({
        eligiblePresident: isInternal,
        eligibleSecretary: isInternal,
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

  const createExpertWithVersion = async (output: ExpertFormValues) => {
    const created = await createExpert({
      data: {
        lecturerId: isInternal && selectedLecturer ? selectedLecturer.id : null,
        deletedAt: null,
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
        const found = existing.data
        if (found?.id) {
          message.warning(
            "Giảng viên này đã có hồ sơ chuyên gia. Hãy mở hồ sơ đó và dùng «Thêm phiên bản hồ sơ»."
          )
          return
        }
        await createExpertWithVersion(output)
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
            if (editingVersionId === expert.currentVersionId) {
              await updateExpert({
                where: { id: expert.id },
                data: {
                  lecturerId: isInternal && selectedLecturer ? selectedLecturer.id : null,
                },
              })
            }
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

  const isEdit = !!input?.id

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={isEdit ? "Thông tin hồ sơ của chuyên gia" : "Thêm mới chuyên gia"}
      className="w-[70vw]"
      okText={isEdit ? undefined : "Lưu"}
      footer={
        isEdit
          ? [
              <Button key="close" onClick={onClose}>
                Đóng
              </Button>,
              <Button key="update-version" onClick={handleUpdateVersion}>
                Cập nhật phiên bản
              </Button>,
              <Button key="add-version" type="primary" onClick={handleAddVersion}>
                Lưu phiên bản mới
              </Button>,
            ]
          : undefined
      }
    >
      {/* {isEdit ? (
        <Col span={24} className="mb-4">
          <Alert
            type="info"
            showIcon
            message="Cách sửa hồ sơ"
            description={
              <div>
                <div>
                  • <strong>Cập nhật phiên bản</strong>: sửa đè phiên bản đang mở trên form (có
                  thể làm đổi mẫu in/thanh toán của đợt đã gán version đó).
                </div>
                <div>
                  • <strong>Lưu phiên bản mới</strong>: tạo version mới và áp dụng cho gán mới —
                  đợt cũ giữ version cũ.
                </div>
                <div>
                  • Trên bảng lịch sử: <strong>Sửa</strong> = nạp vào form;{" "}
                  <strong>Áp dụng</strong> = đặt làm hồ sơ hiện tại cho select.
                </div>
              </div>
            }
          />
        </Col>
      ) : null} */}

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
                label: [item.code, item?.userProfile?.fullname, item?.organization?.sTen]
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

      {isEdit ? (
        <Col span={24} className="mt-2">
          <Typography.Title level={5} className="!mb-2">
            Lịch sử phiên bản hồ sơ
          </Typography.Title>
          {/* <Typography.Paragraph type="secondary" className="!mb-3">
            Điền form <strong>Soạn phiên bản mới</strong> rồi bấm <strong>Lưu phiên bản mới</strong>
            . Hoặc chọn <strong>Áp dụng hồ sơ này</strong> trên một dòng lịch sử để dùng lại
            version cũ (không tạo bản mới). Mẫu / đợt đã gán không đổi.
          </Typography.Paragraph> */}
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
                  record.inAcademy ? (
                    <Tag color="blue">Trong</Tag>
                  ) : (
                    <Tag>Ngoài</Tag>
                  ),
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
    </PutFormModal>
  )
}

export default PutExpert
/** @deprecated dùng default PutExpert */
export { PutExpert as PutExpertProfile }
