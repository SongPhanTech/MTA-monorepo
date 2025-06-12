import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type {
    TrainingCourse,
    SchoolYear,
    TrainingObjectType,
    Semester,
} from '@workspace/db'
import {
    useCreateTrainingCourse,
    useFindUniqueTrainingCourse,
    useFindManySchoolYear,
    useUpdateTrainingCourse,
    useFindManyTrainingObjectType,
    useFindManySemester,
} from '@workspace/db/hooks'
import { Col, Form, Input, InputNumber, message, Radio, Switch } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import Select from '@components/commons/select'
import DatePicker from '@components/commons/date-picker'
import dayjs from 'dayjs'
export type PutTrainingCourse = TrainingCourse & {
    schoolYearId: string | undefined
}
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

    const { data: trainingObjectTypeData = [], refetch: refetchObjectType } =
        useFindManyTrainingObjectType()

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
                        admissionQuota: output.admissionQuota,
                        trainingObjectType: {
                            connect: {
                                id: output.trainingObjectTypeId,
                            },
                        },
                        semesterStart: {
                            connect: {
                                id: output.semesterStartId,
                            },
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
                        admissionQuota: output.admissionQuota,
                        trainingObjectType: {
                            connect: {
                                id: output.trainingObjectTypeId,
                            },
                        },
                        semesterStart: {
                            connect: {
                                id: output.semesterStartId,
                            },
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

            <Col span={24}>
                <FormItem form={form} name="name" label="Tên khoá học" required>
                    <Input placeholder="Nhập tên khoá học" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="schoolYearId"
                    label="Năm học bắt đầu"
                    required
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
