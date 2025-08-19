import { queryClient } from '@api/index'
import DatePicker from '@components/commons/date-picker'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import { createId, type EvaluationPeriod } from '@workspace/db'
import {
    useCreateEvaluationPeriod,
    useCreateManyEvaluationCriterion,
    useCreateManyEvaluationStandard,
    useFindManyStandardCatalog,
    useFindUniqueEvaluationPeriod,
    useUpdateEvaluationPeriod,
} from '@workspace/db/hooks'
import { Col, Form, Input, message } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import TreeCatalog from '@components/commons/tree-catalog'
export type PutEvaluationPeriod = EvaluationPeriod
dayjs.locale('vi')

const PutEvaluationPeriod = () => {
    const [form] = Form.useForm<PutEvaluationPeriod>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutEvaluationPeriod.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createEvaluationPeriod } = useCreateEvaluationPeriod()
    const { mutateAsync: updateEvaluationPeriod } = useUpdateEvaluationPeriod()
    const { mutateAsync: createManyEvaluationStandard } = useCreateManyEvaluationStandard()
    const { mutateAsync: createManyEvaluationCriterion } = useCreateManyEvaluationCriterion()
    async function onOk(output?: PutEvaluationPeriod) {
        if (!output) return
        try {
            showSpinner()
            const data = {
                name: output.name,
                startDate: output.startDate,
                endDate: output.endDate,
                description: output.description,
            }
            if (id) {
                await updateEvaluationPeriod({
                    data,
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                const standards = filtered.map((s, idx) => {
                    const standardId = createId()
                    const criteria = s.criteria.map((c, index) => {
                        const criteriaId = createId()
                        const requirements = c.requirementCriterionCatalog.map((r) => {
                            return { id: createId(), name: r.name }
                        })
                        return {
                            id: criteriaId,
                            standardId,
                            order: index + 1,
                            name: c.name,
                            scoreScaleId: c.scoreScaleId || '',
                            requirementCriterionCatalog: requirements,
                        }
                    })

                    return {
                        id: standardId,
                        name: s.name,
                        order: idx + 1,
                        opening: '',
                        conclusion: '',
                        criteria,
                    }
                })

                const periodId = createId()
                await createEvaluationPeriod({
                    data: { id: periodId, ...data },
                })
                await createManyEvaluationStandard({
                    data: standards.map(({ criteria, ...standard }) => {
                        return {
                            periodId,
                            ...standard,
                        }
                    }),
                })
                await createManyEvaluationCriterion({
                    data: standards.flatMap((standard) =>
                        standard.criteria.map((criterion) => ({
                            standardId: standard.id,
                            name: criterion.name,
                            order: criterion.order,
                            scoreScaleId: criterion.scoreScaleId || '',
                        }))
                    ),
                })

                message.success('Thêm mới thành công')
            }
            queryClient.invalidateQueries({
                queryKey: ['EvaluationPeriod'],
            })
            onClose()
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { data: initialData } = useFindUniqueEvaluationPeriod(
        { where: { id } },
        { enabled: !!id }
    )

    const [checked, setChecked] = useState<{
        standards: string[]
        criteria: string[]
        requirements: string[]
    }>({
        standards: [],
        criteria: [],
        requirements: [],
    })

    const { data: dataCatalog } = useFindManyStandardCatalog(
        {
            select: {
                id: true,
                name: true,
                order: true,
                criteria: {
                    select: {
                        id: true,
                        name: true,
                        order: true,
                        scoreScaleId: true,
                        requirementCriterionCatalog: {
                            select: { id: true, name: true, order: true },
                            orderBy: { order: 'asc' },
                        },
                    },
                    orderBy: { order: 'asc' },
                },
            },
            orderBy: { order: 'asc' },
        },
        { enabled: !id }
    )

    const filtered = useMemo(
        () =>
            dataCatalog
                ?.filter((s) => checked.standards.includes(s.id))
                .map((s) => {
                    const criteria = s.criteria
                        .filter((c) => checked.criteria.includes(c.id))
                        .map((r) => {
                            const requirementCriterionCatalog =
                                r.requirementCriterionCatalog.filter((c) =>
                                    checked.requirements.includes(c.id)
                                )
                            return { ...r, requirementCriterionCatalog }
                        })
                    return { ...s, criteria }
                }) || [],
        [dataCatalog, checked]
    )

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (initialData) {
            form.setFieldsValue({
                ...initialData,
                startDate: dayjs(initialData.startDate),
                endDate: initialData.endDate ? dayjs(initialData.endDate) : undefined,
            })
        } else {
            form.setFieldsValue({
                startDate: dayjs(),
            })
        }
    }, [initialData])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={id ? 'Chỉnh sửa đợt đánh giá CTĐT' : 'Thêm mới đợt đánh giá CTĐT'}
            className="w-[35vw]"
        >
            <Col span={24}>
                <FormItem form={form} name="name" label="Tên đợt đánh giá" required>
                    <Input placeholder="Nhập tên đợt đánh giá" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="startDate" label="Ngày bắt đầu" required>
                    <DatePicker
                        format={{
                            format: 'DD/MM/YYYY',
                            type: 'mask',
                        }}
                        className="w-full"
                        defaultValue={dayjs()}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="endDate" label="Ngày kết thúc">
                    <DatePicker
                        format={{
                            format: 'DD/MM/YYYY',
                            type: 'mask',
                        }}
                        className="w-full"
                    />
                </FormItem>
            </Col>
            {!id && (
                <Col span={24}>
                    <Form.Item label="Tiêu chuẩn đánh giá của đợt" required>
                        <TreeCatalog data={dataCatalog} onCheckSplit={setChecked} />
                    </Form.Item>
                </Col>
            )}
            <Col span={24}>
                <FormItem form={form} name="description" label="Mô tả">
                    <Input.TextArea placeholder="Nhập mô tả" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutEvaluationPeriod
