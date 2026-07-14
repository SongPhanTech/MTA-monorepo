import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { TrainingLocation } from "@workspace/db/client"
import {
  useCreateTrainingLocation,
  useFindManyDM_Tinh,
  useFindManyDM_Tinh_New,
  useFindUniqueTrainingLocation,
  useUpdateTrainingLocation,
} from "@workspace/db/hooks"
import { Col, Form, Input, message, Radio, Select } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
export type PutTrainingLocation = TrainingLocation
const PutTrainingLocationModal = () => {
  const [form] = Form.useForm<PutTrainingLocation>()
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "PutTrainingLocationModal",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createTrainingLocation } = useCreateTrainingLocation()
  const { mutateAsync: updateTrainingLocation } = useUpdateTrainingLocation()
  const { data: dM_Tinh } = useFindManyDM_Tinh(
    {
      select: {
        Id: true,
        sTen: true,
      },
    },
    { enabled: isOpen }
  )
  const { data: dM_Tinh_New } = useFindManyDM_Tinh_New(
    {
      select: {
        Id: true,
        sTen: true,
      },
    },
    { enabled: isOpen }
  )
  async function onOk(value: PutTrainingLocation) {
    try {
      showSpinner()
      if (id) {
        await updateTrainingLocation({
          data: {
            ...value,
            buildings: {
              updateMany: {
                where: {
                  trainingLocationId: value?.id,
                },
                data: (value.active === false ? { active: false } : { active: true }),
              },
            },
          },
          where: { id },
        })
        message.success("Cập nhật thành công")
      } else {
        await createTrainingLocation({
          data: {
            ...value,
          },
        })
        message.success("Thêm mới thành công")
      }
      // refetch() lại danh sách level
      queryClient.invalidateQueries({
        queryKey: ["TrainingLocation"],
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

  const { data } = useFindUniqueTrainingLocation(
    {
      where: { id },
      include: {},
    },
    { enabled: !!id }
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        ...data,
      })
    } else {
      form.setFieldsValue({
        active: true,
      })
    }
  }, [data])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={id ? "Chỉnh sửa khu vực đào tạo" : "Thêm mới khu vực đào tạo"}
      className="w-[45vw]"
    >
      <Col span={12}>
        <FormItem form={form} name="code" label="Mã khu vực đào tạo" required>
          <Input placeholder="Nhập mã khu vực đào tạo" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="name" label="Tên khu vực đào tạo" required>
          <Input placeholder="Nhập tên khu vực đào tạo" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="dM_TinhId" label="Tên tỉnh/thành phố cũ" required>
          <Select
            placeholder="Chọn tỉnh/thành phố cũ"
            options={dM_Tinh?.map((item) => ({
              label: item.sTen,
              value: item.Id,
            }))}
          />
        </FormItem>
      </Col>

      <Col span={12}>
        <FormItem form={form} name="dM_Tinh_NewId" label="Tên tỉnh/thành phố mới" required>
          <Select
            placeholder="Chọn tỉnh/thành phố mới"
            options={dM_Tinh_New?.map((item) => ({
              label: item.sTen,
              value: item.Id,
            }))}
          />
        </FormItem>
      </Col>

      <Col span={24}>
        <FormItem form={form} name="description" label="Mô tả">
          <Input.TextArea placeholder="Nhập mô tả" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name={"active"} label="Trạng thái" required>
          <Radio.Group buttonStyle="solid">
            <Radio value={true}>Đang hoạt động</Radio>
            <Radio value={false}>Ngừng hoạt động</Radio>
          </Radio.Group>
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutTrainingLocationModal
