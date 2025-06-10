import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type {
    TrainingCourse,
    SchoolYear,
    TrainingForm,
    TrainingLevel,
    TrainingType,
    TrainingObjectType,
} from '@workspace/db'
import {
    useCreateTrainingCourse,
    useFindUniqueTrainingCourse,
    useFindManySchoolYear,
    useFindManyTrainingCourse,
    useUpdateTrainingCourse,
    useFindManyTrainingForm,
    useFindManyTrainingType,
    useFindManyTrainingObjectType,
    useFindManyTrainingLevel,
} from '@workspace/db/hooks'
import { Col, Form, Input, InputNumber, message, Switch } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import Select from '@components/commons/select'
import DatePicker from '@components/commons/date-picker'
import dayjs from 'dayjs'
export type PutTrainingCourse = TrainingCourse
import 'dayjs/locale/vi'
dayjs.locale('vi')
const PutTrainingCourseModal = () => {
    const [form] = Form.useForm<PutTrainingCourse>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutTrainingCourseModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { data: trainingFormData = [], refetch: refetchForm } =
        useFindManyTrainingForm()

    const { data: trainingTypeData = [], refetch: refetchType } =
        useFindManyTrainingType()
    const { data: trainingLevelData = [], refetch: refetchLevel } =
        useFindManyTrainingLevel()
    const { data: trainingObjectTypeData = [], refetch: refetchObjectType } =
        useFindManyTrainingObjectType()

    const { data: organizations = [], refetch: refetchTrainingCourses } =
        useFindManyTrainingCourse()

    const { mutateAsync: createTrainingCourse } = useCreateTrainingCourse()
    const { mutateAsync: updateTrainingCourse } = useUpdateTrainingCourse()
    async function onOk(output?: PutTrainingCourse) {
        if (!output) return
        try {
            showSpinner()
            if (id) {
                await updateTrainingCourse({
                    data: {
                         code: output.code,
                        name: output.name,
                        description: output.description,
                        startYear: output.startYear,
                        endYear: output.endYear,
                        academicYear: output.academicYear,
                        maxTrainingTime: output.maxTrainingTime,
                        admissionQuota:output.admissionQuota,
                        trainingObjectType: {
                            connect:{
                                id:output.trainingObjectTypeId
                            }
                        },
                    },
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createTrainingCourse({
                    data: {
                        code: output.code,
                        name: output.name,
                        description: output.description,
                        startYear: output.startYear,
                        endYear: output.endYear,
                        academicYear: output.academicYear,
                        maxTrainingTime: output.maxTrainingTime,
                        admissionQuota:output.admissionQuota,
                        trainingObjectType: {
                            connect:{
                                id:output.trainingObjectTypeId
                            }
                        },
                    },
                })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['TrainingCourse'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { data: level } = useFindUniqueTrainingCourse({
        where: { id },
    })
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (level) {
            form.setFieldsValue({
                ...level,
            })
        }
    }, [level])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={id ? 'Chỉnh sửa khóa' : 'Thêm mới khóa'}
            className="w-[35vw]"
        >
             <Col span={12}>
                          <FormItem
                              form={form}
                              name="trainingObjectTypeId"
                              label="Đối tượng đào tạo"
                              required
                          >
                              <Select
                                  mode="multiple"
                                  placeholder="Chọn đối tượng đào tạo"
                                  options={trainingObjectTypeData.map(
                                      (i: TrainingObjectType) => {
                                          return {
                                              value: i.id,
                                              label: i.name,
                                          }
                                      }
                                  )}
                              />
                          </FormItem>
                      </Col>
                      <Col span={12}>
                          <FormItem form={form} name="code" label="Mã khoá học" required>
                              <Input placeholder="Nhập mã khoá học" />
                          </FormItem>
                      </Col>
          
                      <Col span={12}>
                          <FormItem form={form} name="name" label="Tên khoá học" required>
                              <Input placeholder="Nhập tên khoá học" />
                          </FormItem>
                      </Col>
                      <Col span={12}>
                          <FormItem
                              form={form}
                              name="startYear"
                              label="Năm bắt đầu"
                              required
                          >
                            <InputNumber style={{ width: '100%' }} min={0} step={1} placeholder="Nhập năm bắt đầu" />
                          </FormItem>
                      </Col>
                      <Col span={12}>
                          <FormItem
                              form={form}
                              name="endYear"
                              label="Năm kết thúc"
                              required
                          >
                            <InputNumber style={{ width: '100%' }} min={0} step={1} placeholder="Nhập năm kết thúc" />
                          </FormItem>
                      </Col>
                      <Col span={12}>
                          <FormItem
                              form={form}
                              name="academicYear"
                              label="Niên khoá"
                              required
                          >
                              <Input placeholder="Nhập niên khoá" />
                          </FormItem>
                      </Col>
                      <Col span={12}>
                          <FormItem
                              form={form}
                              name="maxTrainingTime"
                              label="Thời gian đào tạo Max"
                              required
                          >
                              <InputNumber style={{ width: '100%' }} min={0} step={1} />
                          </FormItem>
                      </Col>
                      <Col span={12}>
                          <FormItem
                              form={form}
                              name="admissionQuota"
                              label="Chỉ tiêu tuyển sinh"
                              required
                          >
                              <InputNumber style={{ width: '100%' }} min={0} step={1} />
                          </FormItem>
                      </Col>
                      <Col span={24}>
                          <FormItem form={form} name="active" label="">
                              <div className="flex items-center space-x-2">
                                  <span className="text-[#000000e0]">Đang đào tạo</span>
                                  <Switch />
                              </div>
                          </FormItem>
                      </Col>
        </PutFormModal>
    )
}

export default PutTrainingCourseModal
