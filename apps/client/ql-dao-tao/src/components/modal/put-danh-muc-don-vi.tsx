import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import TreeSelect from "@components/commons/tree-select"
import useSpinner from "@hooks/spinner"
import { buildOrgTree, type OrgTreeItem } from "@lib/utils"
import type { DM_DonVi } from "@workspace/db/client"
import {
  useCreateDM_DonVi,
  useFindManyDM_DonVi,
  useFindUniqueDM_DonVi,
  useUpdateDM_DonVi,
} from "@workspace/db/hooks"
import { Col, Form, Input, InputNumber, message, Radio, Row } from "antd"
import { useEffect, useMemo } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export type PutDMDonViInput = {
  Id?: string
  sParentId?: string | null
}

export const NHOM_DON_VI_OPTIONS = [
  { value: 0, label: "Cơ quan chức năng" },
  { value: 1, label: "Khoa/Viện/Trung tâm" },
  { value: 2, label: "Hệ, tiểu đoàn" },
]

export const CAP_DON_VI_OPTIONS = [
  { value: 0, label: "Học viện / Nhà trường (Cấp 1)" },
  { value: 1, label: "Khối (Cấp 2)" },
  { value: 2, label: "Phòng / Ban / Khoa / Viện (Cấp 3)" },
  { value: 3, label: "Bộ môn / Phòng TN / Đại đội (Cấp 4)" },
  { value: 4, label: "Tổ / Nhóm / Lớp (Cấp 5)" },
]

export const LOAI_DON_VI_OPTIONS = [
  { value: 0, label: "Phòng" },
  { value: 1, label: "Ban" },
  { value: 2, label: "Trung tâm" },
  { value: 3, label: "Văn phòng" },
  { value: 4, label: "Tổ công tác" },
  { value: 5, label: "Khoa" },
  { value: 6, label: "Viện" },
  { value: 7, label: "Bộ môn" },
  { value: 8, label: "Phòng thí nghiệm" },
  { value: 9, label: "Xưởng thực hành" },
  { value: 10, label: "Hệ" },
  { value: 11, label: "Tiểu đoàn" },
  { value: 12, label: "Đại đội" },
  { value: 13, label: "Trung đội" },
  { value: 14, label: "Lớp/Chi đoàn" },
]

type FormValues = {
  sMa?: string
  sTen?: string
  sTenVietTat?: string
  sCode?: string
  sTKBUCode?: string
  sParentId?: string | null
  iNhomDonVi?: number | null
  iCapDonVi?: number | null
  iLoaiDonVi?: number | null
  sDiaChi?: string
  sChucNangNhiemVu?: string
  sGhiChu?: string
  iSTT?: number | null
  bActive?: boolean
}

const excludeNodeAndDescendants = (nodes: OrgTreeItem[], excludeId: string): OrgTreeItem[] => {
  return nodes
    .filter((node) => node.value !== excludeId)
    .map((node) => ({
      ...node,
      children: node.children ? excludeNodeAndDescendants(node.children, excludeId) : undefined,
    }))
}

const PutDMDonViModal = () => {
  const [form] = Form.useForm<FormValues>()
  const { isOpen, onClose, input } = useDisclosure<PutDMDonViInput>({
    tag: "PutDMDonViModal",
    onClose: form.resetFields,
  })

  const id = input?.Id
  const { showSpinner, hideSpinner } = useSpinner()

  const { data: organizations = [] } = useFindManyDM_DonVi({
    orderBy: [{ iSTT: "asc" }, { sTen: "asc" }],
  })

  const parentTreeData = useMemo(() => {
    const tree = buildOrgTree(organizations)
    if (!id) return tree
    return excludeNodeAndDescendants(tree, id)
  }, [organizations, id])

  const { mutateAsync: create } = useCreateDM_DonVi()
  const { mutateAsync: update } = useUpdateDM_DonVi()

  async function onOk(values: FormValues) {
    try {
      showSpinner()
      const payload: Partial<DM_DonVi> = {
        sMa: values.sMa?.trim() || null,
        sTen: values.sTen?.trim() || null,
        sTenVietTat: values.sTenVietTat?.trim() || null,
        sCode: values.sCode?.trim() || null,
        sTKBUCode: values.sTKBUCode?.trim() || null,
        sParentId: values.sParentId || null,
        iNhomDonVi: values.iNhomDonVi ?? null,
        iCapDonVi: values.iCapDonVi ?? null,
        iLoaiDonVi: values.iLoaiDonVi ?? null,
        sDiaChi: values.sDiaChi?.trim() || null,
        sChucNangNhiemVu: values.sChucNangNhiemVu?.trim() || null,
        sGhiChu: values.sGhiChu?.trim() || null,
        iSTT: values.iSTT ?? 0,
        bActive: values.bActive ?? true,
      }

      if (id) {
        await update({
          where: { Id: id },
          data: payload,
        })
        message.success("Cập nhật thành công")
      } else {
        await create({
          data: {
            ...payload,
            dNgayTao: new Date(),
          },
        })
        message.success("Thêm mới thành công")
      }

      queryClient.invalidateQueries({
        queryKey: ["zenstack", "DM_DonVi"],
      })
      onClose()
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error?.info?.message)
        return
      }
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  const { data } = useFindUniqueDM_DonVi(
    {
      where: { Id: id },
    },
    { enabled: !!id }
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (!isOpen) return

    if (data && id) {
      form.setFieldsValue({
        sMa: data.sMa ?? undefined,
        sTen: data.sTen ?? undefined,
        sTenVietTat: data.sTenVietTat ?? undefined,
        sCode: data.sCode ?? undefined,
        sTKBUCode: data.sTKBUCode ?? undefined,
        sParentId: data.sParentId && data.sParentId !== "0" ? data.sParentId : undefined,
        iNhomDonVi: data.iNhomDonVi ?? undefined,
        iCapDonVi: data.iCapDonVi ?? undefined,
        iLoaiDonVi: data.iLoaiDonVi ?? undefined,
        sDiaChi: data.sDiaChi ?? undefined,
        sChucNangNhiemVu: data.sChucNangNhiemVu ?? undefined,
        sGhiChu: data.sGhiChu ?? undefined,
        iSTT: data.iSTT ?? 0,
        bActive: data.bActive ?? true,
      })
      return
    }

    form.setFieldsValue({
      bActive: true,
      iSTT: 0,
      sParentId: input?.sParentId || undefined,
    })
  }, [data, id, isOpen, input?.sParentId])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={id ? "Chỉnh sửa đơn vị" : "Thêm mới đơn vị"}
      className="w-[50vw]"
      layout="vertical"
      rowWrap={false}
    >
      <Row gutter={16}>
        <Col span={12}>
          <FormItem form={form} name="sMa" label="Mã đơn vị" required>
            <Input placeholder="Nhập mã đơn vị" />
          </FormItem>
        </Col>
        <Col span={12}>
          <FormItem form={form} name="sTen" label="Tên đơn vị" required>
            <Input placeholder="Nhập tên đơn vị" />
          </FormItem>
        </Col>
        <Col span={12}>
          <FormItem form={form} name="sTenVietTat" label="Tên viết tắt">
            <Input placeholder="Nhập tên viết tắt" />
          </FormItem>
        </Col>
        <Col span={12}>
          <FormItem form={form} name="sParentId" label="Đơn vị cha">
            <TreeSelect
              allowClear
              showSearch
              placeholder="Chọn đơn vị cha"
              treeDefaultExpandAll
              treeData={parentTreeData}
              fieldNames={{ label: "label", value: "value", children: "children" }}
            />
          </FormItem>
        </Col>
        <Col span={12}>
          <FormItem form={form} name="sCode" label="Mã code">
            <Input placeholder="Nhập mã code" />
          </FormItem>
        </Col>
        <Col span={12}>
          <FormItem form={form} name="sTKBUCode" label="Mã TKBU">
            <Input placeholder="Nhập mã TKBU" />
          </FormItem>
        </Col>
        <Col span={12}>
          <FormItem form={form} name="iNhomDonVi" label="Nhóm đơn vị">
            <Select allowClear placeholder="Chọn nhóm đơn vị" options={NHOM_DON_VI_OPTIONS} />
          </FormItem>
        </Col>
        <Col span={12}>
          <FormItem form={form} name="iCapDonVi" label="Cấp đơn vị">
            <Select allowClear placeholder="Chọn cấp đơn vị" options={CAP_DON_VI_OPTIONS} />
          </FormItem>
        </Col>
        <Col span={12}>
          <FormItem form={form} name="iLoaiDonVi" label="Loại đơn vị">
            <Select allowClear placeholder="Chọn loại đơn vị" options={LOAI_DON_VI_OPTIONS} />
          </FormItem>
        </Col>
        <Col span={12}>
          <FormItem form={form} name="iSTT" label="Số thứ tự">
            <InputNumber className="w-full" min={0} placeholder="Nhập STT" />
          </FormItem>
        </Col>
        <Col span={24}>
          <FormItem form={form} name="sDiaChi" label="Địa chỉ">
            <Input placeholder="Nhập địa chỉ" />
          </FormItem>
        </Col>
        <Col span={24}>
          <FormItem form={form} name="sChucNangNhiemVu" label="Chức năng nhiệm vụ">
            <Input.TextArea rows={2} placeholder="Nhập chức năng nhiệm vụ" />
          </FormItem>
        </Col>
        <Col span={24}>
          <FormItem form={form} name="sGhiChu" label="Ghi chú">
            <Input.TextArea rows={2} placeholder="Nhập ghi chú" />
          </FormItem>
        </Col>
        <Col span={24}>
          <FormItem form={form} name="bActive" label="Trạng thái" required>
            <Radio.Group buttonStyle="solid">
              <Radio value={true}>Đang hoạt động</Radio>
              <Radio value={false}>Ngừng hoạt động</Radio>
            </Radio.Group>
          </FormItem>
        </Col>
      </Row>
    </PutFormModal>
  )
}

export default PutDMDonViModal
