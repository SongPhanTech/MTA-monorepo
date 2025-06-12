import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import {
    useCreateTrainingBlockOnCurriculumVersion,
    useCreateTrainingBlockSubject,
    useFindManySubject,
    useFindManySubjectVersion,
    useFindUniqueTrainingBlockSubject,
    useUpdateTrainingBlockOnCurriculumVersion,
    useUpdateTrainingBlockSubject,
} from '@workspace/db/hooks'
import { Checkbox, Col, Form, Input, InputNumber, message, Select } from 'antd'
import { useDisclosure } from 'react-hook-disclosure-modal'
import {
    SubjectRequirementType,
    type SubjectVersion,
    type TrainingBlockSubject,
} from '@workspace/db'
import dayjs from 'dayjs'
export type PutTrainingBlockSubject = TrainingBlockSubject
import 'dayjs/locale/vi'
import { useEffect } from 'react'
import { useSubjectRequirementTypeOptions } from '@hooks/subjectRequirementType'
dayjs.locale('vi')

type TrainingBlockOnCurriculumVersionInput = {
    trainingBlockOnCurriculumVersionId: string
    trainingBlockSubjectId: string
}
const PutTrainingBlockSubject = () => {
    const [form] = Form.useForm<PutTrainingBlockSubject>()
    const { options: subjectRequirementTypeOptions } =
        useSubjectRequirementTypeOptions()
    const { isOpen, onClose, input } =
        useDisclosure<TrainingBlockOnCurriculumVersionInput>({
            tag: PutTrainingBlockSubject.name,
            onClose: form.resetFields,
        })

    const { showSpinner, hideSpinner } = useSpinner()

    const { data: initialValue } = useFindUniqueTrainingBlockSubject({
        where: { id: input?.trainingBlockSubjectId },
    })

    const { data: subjectVersionData = [], refetch } =
        useFindManySubjectVersion()

    console.log(initialValue)

    useEffect(() => {
        if (initialValue) {
            form.setFieldsValue({
                ...initialValue,
                useForFinalScore: initialValue.useForFinalScore,
                graduation: initialValue.graduation,
                project: initialValue.project,
                print: initialValue.print,
            })
        } else {
            form.setFieldsValue({
                useForFinalScore: false,
                graduation: false,
                project: false,
                print: false,
            })
        }
    }, [initialValue, form])

    const { mutateAsync: createTrainingBlockSubject } =
        useCreateTrainingBlockSubject()
    const { mutateAsync: updateTrainingBlockSubject } =
        useUpdateTrainingBlockSubject()
    async function onOk(output?: PutTrainingBlockSubject) {
        if (!output) return

        try {
            showSpinner()
            const payload = {
                subjectId: output.subjectId,
                trainingBlockOnCurriculumVersionId:
                    input?.trainingBlockOnCurriculumVersionId,
                semester: output?.semester,
                type: output?.type,
                useForFinalScore: output?.useForFinalScore,
                graduation: output?.graduation,
                project: output?.project,
                print: output?.print,
                active: output.active,
            }

            if (input?.trainingBlockSubjectId) {
                await updateTrainingBlockSubject({
                    data: payload,
                    where: { id: input?.trainingBlockSubjectId },
                })
                message.success('Cập nhật thành công')
            } else {
                await createTrainingBlockSubject({
                    data: payload,
                })
                message.success('Thêm mới thành công')
            }

            queryClient.invalidateQueries({
                queryKey: ['TrainingBlockSubject'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }

        hideSpinner()
    }

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={
                input?.trainingBlockSubjectId
                    ? 'Chỉnh sửa môn học khối kiến thức'
                    : 'Thêm mới môn học khối kiến thức'
            }
            className="min-w-[400px] w-[500px]"
        >
            <Col span={24}>
                <FormItem form={form} name="subjectId" label="Môn học" required>
                    <Select
                        placeholder="Chọn môn học"
                        options={subjectVersionData.map((i: SubjectVersion) => {
                            return {
                                value: i.id,
                                label: i.name,
                            }
                        })}
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="semester" label="Kỳ học dự kiến">
                    <InputNumber
                        placeholder="Chọn kỳ học dự kiến"
                        className="w-full"
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} label="Loại môn học" name="type">
                    <Select
                        placeholder="Chọn loại môn học"
                        options={subjectRequirementTypeOptions}
                        allowClear
                        defaultValue={SubjectRequirementType.None}
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <div className="flex justify-between items-center">
                    <span>Có sử dụng để tính điểm thi cuối kỳ hay không?</span>
                    <FormItem
                        form={form}
                        name="useForFinalScore"
                        valuePropName="checked"
                    >
                        <Checkbox />
                    </FormItem>
                </div>
            </Col>
            <Col span={24}>
                <div className="flex justify-between items-center">
                    <span>Có phải là môn học tốt nghiệp hay không?</span>
                    <FormItem
                        form={form}
                        name="graduation"
                        valuePropName="checked"
                    >
                        <Checkbox />
                    </FormItem>
                </div>
            </Col>
            <Col span={24}>
                <div className="flex justify-between items-center">
                    <span>Có phải là môn học đồ án hay không?</span>
                    <FormItem
                        form={form}
                        name="project"
                        valuePropName="checked"
                    >
                        <Checkbox />
                    </FormItem>
                </div>
            </Col>
            <Col span={24}>
                <div className="flex justify-between items-center">
                    <span>Có in trên bảng điểm hay không?</span>
                    <FormItem form={form} name="print" valuePropName="checked">
                        <Checkbox />
                    </FormItem>
                </div>
            </Col>
            {input?.trainingBlockSubjectId && (
                <Col span={24}>
                    <FormItem form={form} name="active" label="Trạng thái">
                        <Select
                            placeholder="Chọn trạng thái"
                            options={[
                                { label: 'Đang hoạt động', value: true },
                                { label: 'Ngừng đào tạo', value: false },
                            ]}
                            allowClear
                        />
                    </FormItem>
                </Col>
            )}
        </PutFormModal>
    )
}

export default PutTrainingBlockSubject
