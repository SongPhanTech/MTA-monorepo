import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useSpinner from '@hooks/spinner'
import type {
    Prisma,
    SchoolYear,
    TrainingCourse,
    TrainingObjectType,
} from '@workspace/db'
import {
    useCreateTrainingCourse,
    useFindManySchoolYear,
    useFindManySemester,
    useFindManyTrainingObjectType,
    useFindUniqueTrainingCourse,
    useUpdateTrainingCourse,
} from '@workspace/db/hooks'
import { Col, Form, Input, InputNumber, Radio, message } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
export type PutTrainingCourse = TrainingCourse & {
    schoolYearId: string | undefined
}
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

    const { data: trainingObjectTypeData = [], refetch: refetchObjectType } =
        useFindManyTrainingObjectType()

    const { mutateAsync: createTrainingCourse } = useCreateTrainingCourse()
    const { mutateAsync: updateTrainingCourse } = useUpdateTrainingCourse()
    async function onOk(output?: PutTrainingCourse) {
        if (!output) return
        const { trainingObjectTypeId, semesterStartId, schoolYearId, ...rest } =
            output
        try {
            showSpinner()
            const data: Prisma.TrainingCourseCreateInput = {
                trainingObjectType: {
                    connect: { id: trainingObjectTypeId },
                },
                semesterStart: {
                    connect: { id: semesterStartId },
                },
                ...rest,
            }
            if (id) {
                await updateTrainingCourse({ data, where: { id } })
                message.success('Cập nhật thành công')
            } else {
                await createTrainingCourse({ data })
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
    const schoolYearIdForm = Form.useWatch('schoolYearId', form)

    const { data: dataSchoolYear = [], refetch: refetchSchoolYear } =
        useFindManySchoolYear()
    const { data: semesterData = [], refetch: refetchSemesters } =
        useFindManySemester({
            where: schoolYearIdForm
                ? {
                      schoolYearId: schoolYearIdForm,
                  }
                : undefined,
            include: {
                schoolYear: true,
            },
        })
    const { data: level } = useFindUniqueTrainingCourse(
        {
            where: { id },
            include: {
                semesterStart: true,
            },
        },
        {
            enabled: !!id,
        }
    )

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (level) {
            form.setFieldsValue({
                ...level,
                schoolYearId: level.semesterStart.schoolYearId,
            })
        } else {
            form.setFieldsValue({
                active: true,
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
                    name="schoolYearId"
                    label="Năm học bắt đầu"
                    // required
                >
                    <Select
                        placeholder="Chọn năm học bắt đầu"
                        options={dataSchoolYear.map((i: SchoolYear) => {
                            return {
                                value: i.id,
                                label: i.name,
                            }
                        })}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="semesterStartId"
                    label="Kỳ học bắt đầu"
                    required
                >
                    <Select
                        placeholder="Chọn kỳ học bắt đầu"
                        options={semesterData.map((i) => {
                            return {
                                value: i.id,
                                label: `${i.name} năm ${i.schoolYear.name}`,
                            }
                        })}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="coef_1"
                    label="Hệ số điểm chuyên cần"
                >
                    <InputNumber
                        placeholder="Nhập hệ số điểm chuyên cần"
                        className="w-full"
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="coef_2"
                    label="Hệ số điểm thường xuyên"
                >
                    <InputNumber
                        placeholder="Nhập hệ số điểm thường xuyên"
                        className="w-full"
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="coef_3" label="Hệ số điểm điểm thi">
                    <InputNumber
                        placeholder="Nhập hệ số điểm điểm thi"
                        className="w-full"
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="scoreToTakeExam"
                    label="Điểm tối thiểu được thi"
                    required
                >
                    <InputNumber
                        placeholder="Nhập điểm tối thiểu được thi"
                        className="w-full"
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="scoreToPass"
                    label="Điểm tối thiểu để qua"
                    required
                >
                    <InputNumber
                        placeholder="Nhập điểm tối thiểu để qua"
                        className="w-full"
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="academicYear" label="Niên khoá">
                    <Input placeholder="Nhập niên khoá" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="maxTrainingTime"
                    label="Thời gian đào tạo Max"
                >
                    <InputNumber style={{ width: '100%' }} min={0} step={1} />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="admissionQuota"
                    label="Chỉ tiêu tuyển sinh"
                >
                    <InputNumber style={{ width: '100%' }} min={0} step={1} />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name={'active'}
                    label="Trạng thái"
                    required
                >
                    <Radio.Group buttonStyle="solid">
                        <Radio value={true}>Đang hoạt động</Radio>
                        <Radio value={false}>Ngừng hoạt động</Radio>
                    </Radio.Group>
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutTrainingCourseModal
