import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import {
    SubjectRequirementType,
    type SubjectVersion,
    type TrainingBlockSubject,
} from '@workspace/db'
import {
    useCreateManyTrainingBlockSubject,
    useFindManyDM_DonVi,
    useFindManySubjectVersion,
    useFindUniqueTrainingBlockSubject,
    useUpdateTrainingBlockSubject,
} from '@workspace/db/hooks'
import { Checkbox, Col, Form, InputNumber, message, Radio, Select, TreeSelect } from 'antd'
import dayjs from 'dayjs'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import { useSubjectRequirementTypeOptions } from '@hooks/subjectRequirementType'
import { buildOrgTree } from '@lib/utils'
import _ from 'lodash'
import { useCallback, useEffect, useState } from 'react'
export type PutTrainingBlockSubject = TrainingBlockSubject
dayjs.locale('vi')

type TrainingBlockOnCurriculumVersionInput = {
    trainingBlockOnCurriculumVersionId: string
    trainingBlockSubjectId: string
}

interface FilterProps {
    managementOrganizationId: string | undefined
}
const PutTrainingBlockSubject = () => {
    const [form] = Form.useForm<PutTrainingBlockSubject>()
    const { options: subjectRequirementTypeOptions } = useSubjectRequirementTypeOptions()
    const { isOpen, onClose, input } = useDisclosure<TrainingBlockOnCurriculumVersionInput>({
        tag: 'PutTrainingBlockSubject',
        onClose: form.resetFields,
    })

    const [filters, setFilters] = useState<FilterProps>({
        managementOrganizationId: '',
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { data: initialValue } = useFindUniqueTrainingBlockSubject(
        {
            where: { id: input?.trainingBlockSubjectId },
        },
        { enabled: !!input?.trainingBlockSubjectId }
    )

    const { data: subjectVersionData = [], refetch } = useFindManySubjectVersion({
        where: {
            ...(filters.managementOrganizationId && filters.managementOrganizationId !== ''
                ? {
                      managementOrganizationId: filters.managementOrganizationId,
                  }
                : {}),
        },
    })

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
                active: true,
            })
        }
    }, [initialValue, form])

    const { mutateAsync: createManyTrainingBlockSubject } = useCreateManyTrainingBlockSubject()
    const { mutateAsync: updateTrainingBlockSubject } = useUpdateTrainingBlockSubject()
    async function onOk(output?: PutTrainingBlockSubject) {
        if (!input || !output) return

        try {
            showSpinner()
            const payload = {
                subjectId: output.subjectId,
                trainingBlockOnCurriculumVersionId: input.trainingBlockOnCurriculumVersionId,
                semester: output?.semester,
                type: output?.type,
                useForFinalScore: output?.useForFinalScore,
                graduation: output?.graduation,
                project: output?.project,
                print: output?.print,
                active: output?.active,
            }

            if (input?.trainingBlockSubjectId) {
                await updateTrainingBlockSubject({
                    data: payload,
                    where: { id: input?.trainingBlockSubjectId },
                })
                message.success('Cập nhật thành công')
            } else {
                const ids = Array.isArray(payload.subjectId)
                    ? payload.subjectId
                    : [payload.subjectId]

                await createManyTrainingBlockSubject({
                    data: ids.map((subjectId) => ({
                        ...payload,
                        subjectId,
                    })),
                })

                message.success('Thêm mới thành công')
            }

            queryClient.invalidateQueries({
                queryKey: ['TrainingBlockSubject'],
            })
            onClose()
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const debouncedRefetch = useCallback(
        _.debounce(() => {
            refetch()
        }, 500),
        []
    )

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value }
            debouncedRefetch()
            return newFilters
        })
    }

    const { data: manageOrgData = [] } = useFindManyDM_DonVi()

    const treeData = buildOrgTree(manageOrgData)

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
            {!input?.trainingBlockSubjectId && (
                <Col span={24}>
                    <Form.Item name="managementOrganizationId" label="Đơn vị quản lý">
                        <TreeSelect
                            placeholder="Chọn đơn vị quản lý"
                            allowClear
                            showSearch
                            treeDefaultExpandAll
                            onChange={(val) => handleFilterChange('managementOrganizationId', val)}
                            treeData={treeData}
                            filterTreeNode={(input, node) =>
                                (node?.label as string)
                                    ?.toLowerCase()
                                    ?.includes(input?.toLowerCase())
                            }
                        />
                    </Form.Item>
                </Col>
            )}
            <Col span={24}>
                <FormItem form={form} name="subjectId" label="Môn học" required>
                    <Select
                        mode={input?.trainingBlockSubjectId ? undefined : 'multiple'}
                        allowClear
                        showSearch
                        placeholder="Chọn phiên bản môn học"
                        options={subjectVersionData.map((item: SubjectVersion) => {
                            return {
                                ...item,
                                label: [item?.code, item?.name, item?.period]
                                    .filter(Boolean)
                                    .join(' - '),
                                value: item.id,
                            }
                        })}
                        disabled={!!input?.trainingBlockSubjectId}
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="semester" label="Kỳ học dự kiến">
                    <InputNumber
                        min={0}
                        type="number"
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
                <div className="flex justify-between items-center mb-6">
                    <span>Có sử dụng để tính điểm thi cuối kỳ hay không?</span>
                    <FormItem
                        form={form}
                        name="useForFinalScore"
                        valuePropName="checked"
                        className="mb-0"
                    >
                        <Checkbox />
                    </FormItem>
                </div>
            </Col>
            <Col span={24}>
                <div className="flex justify-between items-center mb-6">
                    <span>Có phải là môn học tốt nghiệp hay không?</span>
                    <FormItem
                        form={form}
                        name="graduation"
                        valuePropName="checked"
                        className="mb-0"
                    >
                        <Checkbox />
                    </FormItem>
                </div>
            </Col>
            <Col span={24}>
                <div className="flex justify-between items-center mb-6">
                    <span>Có phải là môn học đồ án hay không?</span>
                    <FormItem form={form} name="project" valuePropName="checked" className="mb-0">
                        <Checkbox />
                    </FormItem>
                </div>
            </Col>
            <Col span={24}>
                <div className="flex justify-between items-center mb-6">
                    <span>Có in trên bảng điểm hay không?</span>
                    <FormItem form={form} name="print" valuePropName="checked" className="mb-0">
                        <Checkbox />
                    </FormItem>
                </div>
            </Col>
            {input?.trainingBlockSubjectId && (
                <Col span={24}>
                    <FormItem form={form} name={'active'} label="Trạng thái" required>
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

export default PutTrainingBlockSubject
