import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import useSpinner from "@hooks/spinner"
import type { TrainingObjectType } from "@workspace/db/client"
import {
  useCreateTrainingObjectType,
  useFindManyTrainingForm,
  useFindManyTrainingLevel,
  useFindUniqueTrainingObjectType,
  useUpdateTrainingObjectType,
} from "@workspace/db/hooks"
import { Col, Form, Input, message, Radio } from "antd"
import dayjs from "dayjs"
import { useEffect, useMemo } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"
import { TRAINING_OBJECT_TYPE } from "@constants/constants"
import type { GetDMVaiTroDTO } from "@workspace/libs/api/schemas"
import { useGetDMVaiTros } from "@workspace/libs/api/system"

dayjs.locale("vi")
const PutTrainingObjectTypeModal = () => {
  const [form] = Form.useForm<TrainingObjectType>()
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "PutTrainingObjectTypeModal",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createTrainingObjectType } = useCreateTrainingObjectType()
  const { mutateAsync: updateTrainingObjectType } = useUpdateTrainingObjectType()
  const { data: trainingLevels } = useFindManyTrainingLevel(
    { select: { id: true, name: true } },
    { enabled: isOpen }
  )
  const { data: trainingForms } = useFindManyTrainingForm(
    { select: { id: true, name: true } },
    { enabled: isOpen }
  )
  const { data: role } = useGetDMVaiTros()

  const roles = useMemo(() => {
    if (role?.status !== 200) return []
    return role?.data as unknown as GetDMVaiTroDTO[]
  }, [role])

  //TODO: lưu thêm bậc đào tạo và hình thức đào tạo
  async function onOk({ ...rest }: TrainingObjectType) {
    try {
      showSpinner()
      if (id) {
        await updateTrainingObjectType({
          data: {
            ...rest,
            trainingLevelId: rest.trainingLevelId || null,
            trainingFormId: rest.trainingFormId || null,
            vaiTro: rest.vaiTro || [],
          },
          where: { id },
        })
        message.success("Cập nhật thành công")
      } else {
        await createTrainingObjectType({
          data: {
            ...rest,
            vaiTro: rest.vaiTro || [],
          },
        })
        message.success("Thêm mới thành công")
      }
      queryClient.invalidateQueries({
        queryKey: ["TrainingObjectType"],
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

  const { data: trainingObjectType } = useFindUniqueTrainingObjectType(
    {
      where: { id },
    },
    { enabled: !!id }
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (trainingObjectType) {
      form.setFieldsValue({
        ...trainingObjectType,
      })
    } else {
      form.setFieldsValue({
        active: true,
      })
    }
  }, [trainingObjectType])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={id ? "Chỉnh sửa đối tượng đào tạo" : "Thêm mới đối tượng đào tạo"}
      className="w-[900px]"
    >
      <Col span={12}>
        <FormItem form={form} name="type" label="Hệ đào tạo" required>
          <Select
            placeholder="Chọn hệ đào tạo"
            options={Object.keys(TRAINING_OBJECT_TYPE).map((key) => {
              return {
                label: TRAINING_OBJECT_TYPE[key as keyof typeof TRAINING_OBJECT_TYPE],
                value: key,
              }
            })}
          />
        </FormItem>
      </Col>

      <Col span={12}>
        <FormItem form={form} name="name" label="Tên đối tượng đào tạo" required>
          <Input placeholder="Nhập tên đối tượng đào tạo" />
        </FormItem>
      </Col>
      <Col span={8}>
        <FormItem form={form} name="trainingFormId" label="Hình thức đào tạo" required>
          <Select
            placeholder="Chọn hình thức đào tạo"
            options={trainingForms?.map((item) => ({
              label: item.name,
              value: item.id,
            }))}
          />
        </FormItem>
      </Col>
      <Col span={8}>
        <FormItem form={form} name="trainingLevelId" label="Bậc đào tạo">
          <Select
            allowClear
            placeholder="Chọn bậc đào tạo"
            options={trainingLevels?.map((item) => ({
              label: item.name,
              value: item.id,
            }))}
          />
        </FormItem>
      </Col>
      <Col span={8}>
        <FormItem form={form} name="vaiTro" label="Quyền xem đối tượng đào tạo">
          <Select
            placeholder="Chọn vai trò"
            mode="multiple"
            options={roles?.map((item) => ({
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
      {id && (
        <Col span={12}>
          <FormItem form={form} name={"active"} label="Trạng thái">
            <Radio.Group buttonStyle="solid">
              <Radio value={true}>Đang hoạt động</Radio>
              <Radio value={false}>Ngừng hoạt động</Radio>
            </Radio.Group>
          </FormItem>
        </Col>
      )}
    </PutFormModal>
  )
}

export default PutTrainingObjectTypeModal
