import { queryClient } from '@api/index'
import DatePicker from '@components/commons/date-picker'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useSpinner from '@hooks/spinner'
import type { Survey, SurveyObjectType, SurveyTopic } from '@workspace/db'
import {
    useCreateSurvey,
    useFindManySurveyObjectType,
    useFindManySurveyTopic,
    useFindUniqueSurvey,
    useUpdateSurvey,
} from '@workspace/db/hooks'
import { Col, Form, Input, message } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutSurveyType = Survey & { surveyObjectTypes: string[] }
const PutSurveyModal = () => {
    const [form] = Form.useForm<PutSurveyType>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutSurveyModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: create } = useCreateSurvey()
    const { mutateAsync: update } = useUpdateSurvey()

    const { data: surveyTopics = [] } = useFindManySurveyTopic()
    const { data: surveyObjectTypesData = [] } = useFindManySurveyObjectType()

    async function onOk(output?: PutSurveyType) {
        if (!output) return
        try {
            showSpinner()
            if (id) {
                await update({
                    data: {
                        code: output.code,
                        name: output.name,
                        surveyObjectType: {
                            // connect: {
                            //     id: output.surveyObjectTypes[0],
                            // },

                            connect: output.surveyObjectTypes.map((item) => ({ id: item })) || [],
                        },
                        // surveyTopic: {
                        //     connect: {
                        //         id: output.surveyTopicId,
                        //     },
                        // },
                        startDate: output.startDate,
                        endDate: output.endDate,
                        description: output.description,
                    },
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await create({
                    data: {
                        code: output.code,
                        additionalSuggestion: false,
                        name: output.name,
                        surveyObjectType: {
                            // connect: {
                            //     id: output.surveyObjectTypes[0],
                            // },

                            connect: output.surveyObjectTypes.map((item) => ({ id: item })) || [],
                        },
                        surveyTopic: {
                            connect: {
                                id: output.surveyTopicId,
                            },
                        },
                        startDate: output.startDate,
                        endDate: output.endDate,
                        description: output.description,
                    },
                })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['Level'],
            })
            onClose()
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { data: survey } = useFindUniqueSurvey(
        {
            where: { id },
        },
        {
            enabled: !!id,
        }
    )
    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (survey) {
            form.setFieldsValue({
                ...survey,
                startDate: dayjs(survey.startDate),
                endDate: survey.endDate ? dayjs(survey.endDate) : undefined,
            })
        }
    }, [survey])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={id ? 'Chỉnh sửa khảo sát' : 'Thêm mới khảo sát'}
            className="w-[1000px]"
        >
            <Col span={12}>
                <FormItem form={form} name="code" label="Mã khảo sát" required>
                    <Input placeholder="Nhập mã khảo sát" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="name" label="Tên khảo sát" required>
                    <Input placeholder="Nhập tên đối tượng khảo sát" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="surveyTopicId" label="Chủ đề khảo sát" required>
                    <Select
                        placeholder="Chọn chủ đề khảo sát"
                        options={surveyTopics.map((i: SurveyTopic) => {
                            return {
                                value: i.id,
                                label: i.name,
                            }
                        })}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="surveyObjectTypes" label="Đối tượng khảo sát" required>
                    <Select
                        mode="multiple"
                        maxTagCount={'responsive'}
                        placeholder="Chọn đối tượng khảo sát"
                        options={surveyObjectTypesData.map((i: SurveyObjectType) => {
                            return {
                                value: i.id,
                                label: i.name,
                            }
                        })}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="startDate" label="Thời gian bắt đầu" required>
                    <DatePicker format="DD/MM/YYYY" className="w-full" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="endDate" label="Thời gian kết thúc">
                    <DatePicker format="DD/MM/YYYY" className="w-full" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutSurveyModal
