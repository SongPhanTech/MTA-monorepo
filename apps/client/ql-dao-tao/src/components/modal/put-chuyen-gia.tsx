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
import { Alert, Checkbox, Col, Form, Input, message, Radio, Select } from "antd"
import dayjs from "dayjs"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"
import { useEffect, useMemo, useState } from "react"

export interface PutExpertProfileProps {
  id?: string
  /** true = danh mục luận văn; false = danh mục đồ án */
  thesisExpert?: boolean
}

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

const PutExpertProfile = () => {
  const [form] = Form.useForm<ExpertFormValues>()
  const { isOpen, onClose, input } = useDisclosure<PutExpertProfileProps>({
    tag: "PutExpertProfile",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()
  const [isInternal, setIsInternal] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedLecturerId, setSelectedLecturerId] = useState<string | undefined>()

  const isThesisDomain = input?.thesisExpert !== false

  const { data: expert } = useFindUniqueExpert(
    {
      where: { id: input?.id ?? "" },
      include: {
        currentVersion: true,
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

  useEffect(() => {
    if (!expert) return
    const v = expert.currentVersion
    form.setFieldsValue({
      lecturerId: expert.lecturerId,
      name: v?.name,
      position: v?.position,
      academicRankTypeId: v?.academicRankTypeId,
      academicDegreeTypeId: v?.academicDegreeTypeId,
      specialization: v?.specialization,
      workplace: v?.workplace,
      phone: v?.phone,
      email: v?.email,
      bankAccountNumber: v?.bankAccountNumber,
      bankName: v?.bankName,
      eligiblePresident: v?.eligiblePresident,
      eligibleSecretary: v?.eligibleSecretary,
    })
    setIsInternal(!!expert.lecturerId)
    if (expert.lecturerId) setSelectedLecturerId(expert.lecturerId)
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

  const buildVersionPayload = (
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
      validFrom: new Date(),
      validTo: null,
    }
  }

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

  async function onOk(output?: ExpertFormValues) {
    if (!output) return

    try {
      showSpinner()

      if (input?.id) {
        await reviseExpertVersion(
          input.id,
          expert?.currentVersionId,
          output,
          expert?.currentVersion
        )
        message.success("Đã lưu phiên bản hồ sơ mới")
      } else if (isInternal && selectedLecturer) {
        const existing = await findExpertByLecturer()
        const found = existing.data
        if (found?.id) {
          await reviseExpertVersion(found.id, found.currentVersionId, output, found.currentVersion)
          message.success("Đã cập nhật hồ sơ chuyên gia (phiên bản mới)")
        } else {
          await createExpertWithVersion(output)
          message.success("Thêm mới chuyên gia thành công")
        }
      } else {
        await createExpertWithVersion(output)
        message.success("Thêm mới chuyên gia thành công")
      }

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

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={input?.id ? "Chỉnh sửa chuyên gia" : "Thêm mới chuyên gia"}
      className="w-[50vw]"
    >
      {input?.id ? (
        <Col span={24} className="mb-4">
          <Alert
            type="info"
            showIcon
            message="Thay đổi hồ sơ sẽ tạo phiên bản mới"
            description="Các đợt / hội đồng / hướng dẫn đã gán trước đó vẫn giữ hồ sơ cũ khi in mẫu và thanh toán."
          />
        </Col>
      ) : null}

      <Col span={24} className="mb-4">
        <Radio.Group
          onChange={(e) => {
            setIsInternal(e.target.value === "internal")
            if (!input?.id) {
              form.resetFields()
              setSelectedLecturerId(undefined)
            }
          }}
          disabled={!!input?.id}
          value={isInternal ? "internal" : "external"}
        >
          <Radio value="internal">Chuyên gia trong trường</Radio>
          <Radio value="external">Chuyên gia ngoài trường</Radio>
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
    </PutFormModal>
  )
}

export default PutExpertProfile
