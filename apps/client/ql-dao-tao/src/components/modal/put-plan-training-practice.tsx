import { queryClient } from "@api/index"
import DatePicker from "@components/commons/date-picker"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import useSpinner from "@hooks/spinner"
import {
  useCreatePlanTrainingPractice,
  useFindManySemester,
  useFindManyTrainingCourse,
  useFindUniquePlanTrainingPractice,
  useUpdatePlanTrainingPractice,
} from "@workspace/db/hooks"
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import { Col, Form, Input, Switch, message } from "antd"
import dayjs from "dayjs"
import "dayjs/locale/vi"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export type PutPlanTrainingPracticeForm = {
  name?: string
  semesterId?: string
  trainingCourseId?: string
  startDate?: dayjs.Dayjs
  endDate?: dayjs.Dayjs
  isDayOff?: boolean
  description?: string
}

dayjs.locale("vi")

const { TextArea } = Input

const PutPlanTrainingPracticeModal = () => {
  const [form] = Form.useForm<PutPlanTrainingPracticeForm>()
  const startDate = Form.useWatch("startDate", form)
  const endDate = Form.useWatch("endDate", form)
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const { id: semesterStoreId } = useSemesterStore()
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "PutPlanTrainingPracticeModal",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createPlanTrainingPractice } = useCreatePlanTrainingPractice()
  const { mutateAsync: updatePlanTrainingPractice } = useUpdatePlanTrainingPractice()

  const { data: planTrainingPracticeData } = useFindUniquePlanTrainingPractice(
    {
      where: { id: id as string },
      include: {
        semester: true,
        trainingCourse: true,
      },
    },
    { enabled: isOpen && !!id }
  )

  const { data: trainingCourses = [] } = useFindManyTrainingCourse(
    {
      where: { trainingObjectTypeId, deletedAt: null, active: true },
      orderBy: {
        semesterStart: {
          startDate: "desc",
        },
      },
    },
    { enabled: !!trainingObjectTypeId }
  )

  const { data: semesters = [] } = useFindManySemester({
    where: {
      deletedAt: null,
    },
    orderBy: {
      startDate: "desc",
    },
  })

  async function onOk(values: PutPlanTrainingPracticeForm) {
    try {
      if (!trainingObjectTypeId) {
        message.warning("Vui lòng chọn đối tượng đào tạo")
        return
      }

      showSpinner()

      if (id) {
        await updatePlanTrainingPractice({
          where: { id },
          data: {
            name: values.name?.trim() || "",
            semester: {
              connect: {
                id: values.semesterId as string,
              },
            },
            ...(values.trainingCourseId
              ? {
                  trainingCourse: {
                    connect: {
                      id: values.trainingCourseId,
                    },
                  },
                }
              : {
                  trainingCourse: {
                    disconnect: true,
                  },
                }),
            startDate: values.startDate?.toDate() as Date,
            endDate: values.endDate ? values.endDate.toDate() : null,
            isDayOff: !!values.isDayOff,
            description: values.description?.trim() || null,
          },
        })
        message.success("Cập nhật kế hoạch huấn luyện thành công")
      } else {
        await createPlanTrainingPractice({
          data: {
            name: values.name?.trim() || "",
            semester: {
              connect: {
                id: values.semesterId as string,
              },
            },
            ...(values.trainingCourseId
              ? {
                  trainingCourse: {
                    connect: {
                      id: values.trainingCourseId,
                    },
                  },
                }
              : {}),
            trainingObjectType: {
              connect: {
                id: trainingObjectTypeId,
              },
            },
            startDate: values.startDate?.toDate() as Date,
            endDate: values.endDate ? values.endDate.toDate() : null,
            isDayOff: !!values.isDayOff,
            description: values.description?.trim() || null,
          },
        })

        message.success("Thêm mới kế hoạch huấn luyện thành công")
      }

      queryClient.invalidateQueries({
        queryKey: ["PlanTrainingPractice"],
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

  useEffect(() => {
    if (!isOpen) return

    if (!id) {
      form.setFieldsValue({
        trainingCourseId: undefined,
        semesterId: semesterStoreId || undefined,
        name: "",
        startDate: undefined,
        endDate: undefined,
        isDayOff: false,
        description: "",
      })
      return
    }

    if (!planTrainingPracticeData) return

    form.setFieldsValue({
      trainingCourseId: planTrainingPracticeData.trainingCourseId || undefined,
      semesterId: planTrainingPracticeData.semesterId || undefined,
      name: planTrainingPracticeData.name || "",
      startDate: planTrainingPracticeData.startDate
        ? dayjs(planTrainingPracticeData.startDate)
        : undefined,
      endDate: planTrainingPracticeData.endDate
        ? dayjs(planTrainingPracticeData.endDate)
        : undefined,
      isDayOff: !!planTrainingPracticeData.isDayOff,
      description: planTrainingPracticeData.description || "",
    })
  }, [form, id, isOpen, planTrainingPracticeData, semesterStoreId])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable
      title={id ? "Chỉnh sửa kế hoạch huấn luyện" : "Thêm mới kế hoạch huấn luyện"}
      className="w-[60vw]"
    >
      <Col span={12} className="mb-4">
        <FormItem form={form} name="trainingCourseId" label="Khoá">
          <Select
            showSearch
            style={{ width: "100%" }}
            placeholder="Chọn khoá"
            options={trainingCourses.map((item) => ({
              label: `${item?.code || ""} - ${item.name}`,
              value: item.id,
            }))}
          />
        </FormItem>
      </Col>

      <Col span={12} className="mb-4">
        <FormItem
          form={form}
          name="semesterId"
          label="Học kỳ"
          rules={[{ required: true, message: "Vui lòng chọn học kỳ" }]}
          required
        >
          <Select
            showSearch
            style={{ width: "100%" }}
            placeholder="Chọn học kỳ"
            options={semesters.map((item) => ({
              label: item.name,
              value: item.id,
            }))}
          />
        </FormItem>
      </Col>

      <Col span={24} className="mb-3">
        <FormItem
          form={form}
          name="name"
          label="Tên kế hoạch"
          rules={[{ required: true, message: "Vui lòng nhập tên kế hoạch" }]}
          required
        >
          <Input placeholder="Nhập tên kế hoạch" />
        </FormItem>
      </Col>

      <Col span={12} className="mb-3">
        <FormItem
          form={form}
          name="startDate"
          label="Ngày bắt đầu"
          rules={[
            { required: true, message: "Vui lòng chọn ngày bắt đầu" },
            {
              validator: (_, value) => {
                if (!value || !endDate) {
                  return Promise.resolve()
                }
                if (dayjs(value).isBefore(dayjs(endDate), "day")) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error("Ngày bắt đầu phải trước ngày kết thúc"))
              },
            },
          ]}
          required
        >
          <DatePicker
            className="w-full"
            placeholder="Chọn ngày bắt đầu"
            disabledDate={(current) =>
              !!endDate && !!current && !current.isBefore(dayjs(endDate), "day")
            }
          />
        </FormItem>
      </Col>

      <Col span={12} className="mb-3">
        <FormItem
          form={form}
          name="endDate"
          label="Ngày kết thúc"
          rules={[
            {
              validator: (_, value) => {
                if (!value || !startDate) {
                  return Promise.resolve()
                }
                if (dayjs(value).isAfter(dayjs(startDate), "day")) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error("Ngày kết thúc phải sau ngày bắt đầu"))
              },
            },
          ]}
        >
          <DatePicker
            className="w-full"
            placeholder="Chọn ngày kết thúc"
            disabledDate={(current) =>
              !!startDate && !!current && !current.isAfter(dayjs(startDate), "day")
            }
          />
        </FormItem>
      </Col>

      <Col span={24} className="mb-3">
        <div className="mb-2 flex items-center justify-between">
          <span>Mô tả</span>
          <div className="space-x-2">
            <span>Ngày nghỉ</span>
            <Form.Item name="isDayOff" valuePropName="checked" noStyle>
              <Switch size="default" />
            </Form.Item>
          </div>
        </div>
        <FormItem form={form} name="description" label="">
          <TextArea rows={3} placeholder="Nhập mô tả" />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutPlanTrainingPracticeModal
