import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type {
    CurriculumVersion,
    TrainingForm,
    TrainingTime,
} from '@workspace/db'
import {
    useCreateTrainingCourse,
    useUpdateTrainingCourse,
    useFindManyTrainingType,
    useFindManyTrainingLevel,
    useFindUniqueCurriculumVersion,
} from '@workspace/db/hooks'
import { Col, Form, Input, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import Select from '@components/commons/select'
import dayjs from 'dayjs'
export type PutCurriculumVersion = CurriculumVersion
import 'dayjs/locale/vi'
import type React from 'react'
import './index.css'
dayjs.locale('vi')

type CurriculumVersionInput = {
    curriculumId: string
    versionId: string
}

const PutCurriculumVersion = () => {
    const [form] = Form.useForm<PutCurriculumVersion>()

    const { isOpen, onClose, input } = useDisclosure<CurriculumVersionInput>({
        tag: PutCurriculumVersion.name,
        onClose: form.resetFields,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { data: trainingLevelData = [], refetch: refetchLevel } =
        useFindManyTrainingLevel()

    const { data: trainingTimeData = [], refetch: refetchTime } =
        useFindManyTrainingType()

    const { mutateAsync: createTrainingCourse } = useCreateTrainingCourse()
    const { mutateAsync: updateTrainingCourse } = useUpdateTrainingCourse()
    async function onOk(output?: PutCurriculumVersion) {
        if (!output) return
        try {
            showSpinner()
            if (input?.versionId) {
                await updateTrainingCourse({
                    data: {
                        code: output.code,
                        name: output.name,
                        description: output.description,
                        trainingObjectTypeId: output.trainingObjectTypeId,
                    },
                    where: {
                        id: input?.versionId,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createTrainingCourse({
                    data: {
                        code: output.code,
                        name: output.name,
                        description: output.description,
                        trainingObjectTypeId: output.trainingObjectTypeId,
                    },
                })
                message.success('Thêm mới thành công')
            }
            queryClient.invalidateQueries({
                queryKey: ['TrainingCourse'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { data: initialValue } = useFindUniqueCurriculumVersion({
        where: { id: input?.versionId },
    })
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (initialValue) {
            form.setFieldsValue({
                ...initialValue,
            })
        }
    }, [initialValue])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={
                input?.versionId
                    ? 'Sửa phiên bản chương trình đào tạo'
                    : 'Thêm phiên bản chương trình đào tạo'
            }
            className="w-[60vw]"
        >
            <Col span={24}>
                <FormItem
                    form={form}
                    name="name"
                    label="Tên chương trình (tiếng việt)"
                    required
                >
                    <Input placeholder="Nhập tên chương trình (tiếng việt)" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="shortName" label="Tên viết tắt">
                    <Input placeholder="Nhập tên viết tắt" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem
                    form={form}
                    name="englishName"
                    label="Tên chương trình (tiếng anh)"
                >
                    <Input placeholder="Nhập tên chương trình (tiếng anh)" />
                </FormItem>
            </Col>
            <Col span={12}>
                <Form.Item
                    className="mb-0"
                    label="Trình độ đào tạo"
                    name="trainingLevelId"
                    labelCol={{ span: 24 }}
                    wrapperCol={{ span: 24 }}
                    labelAlign="left"
                >
                    <Select
                        placeholder="Chọn trình độ đào tạo"
                        options={trainingLevelData.map((i: TrainingForm) => ({
                            value: i.id,
                            label: i.name,
                        }))}
                        allowClear
                    />
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item
                    className="mb-0"
                    label="Thời gian đào tạo"
                    name="trainingFormId"
                    labelCol={{ span: 24 }}
                    wrapperCol={{ span: 24 }}
                    labelAlign="left"
                >
                    <Select
                        placeholder="Chọn thời gian đào tạo"
                        options={trainingTimeData.map((i: TrainingTime) => ({
                            value: i.id,
                            label: i.name,
                        }))}
                        allowClear
                    />
                </Form.Item>
            </Col>
        </PutFormModal>
    )
}

export default PutCurriculumVersion
