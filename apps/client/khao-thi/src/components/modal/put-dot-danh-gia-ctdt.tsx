import { queryClient } from '@api/index'
import DatePicker from '@components/commons/date-picker'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import { useSession } from '@workspace/auth/react'
import { createId, type EvaluationPeriod } from '@workspace/db'
import {
    useFindManySchoolYear,
    useFindUniqueEvaluationPeriod,
    useUpdateEvaluationPeriod,
} from '@workspace/db/hooks'
import { sqlTransaction } from '@workspace/libs/api/model'
import { Col, Form, Input, message, TreeSelect } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { useEffect, useMemo } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutEvaluationPeriod = EvaluationPeriod & {
    councilIds: string[]
}
dayjs.locale('vi')
interface TreeNodeType {
    value: string
    title: React.ReactNode
    children?: TreeNodeType[]
    selectable?: boolean
}

const PutEvaluationPeriod = () => {
    const [form] = Form.useForm<PutEvaluationPeriod>()
    const { data: me } = useSession()
    const idProfile = me?.sDM_NhanVienId || '97edb89d-9803-45b9-ac83-e81125dd59c4'
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: 'PutEvaluationPeriod',
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { data: initialData } = useFindUniqueEvaluationPeriod(
        { where: { id }, include: { council: true } },
        { enabled: !!id }
    )

    const { data: schoolYears, isLoading: schoolYearLoading } = useFindManySchoolYear({
        orderBy: { startDate: 'desc' },
        include: {
            semesters: {
                orderBy: { createdAt: 'desc' },
            },
        },
    })

    const treeData: TreeNodeType[] = useMemo(() => {
        return (
            schoolYears?.map((schoolYear) => ({
                value: `schoolYear-${schoolYear.id}`,
                title: schoolYear.name,
                selectable: false,
                children:
                    schoolYear.semesters.map((semester) => ({
                        value: semester.id,
                        title: `${semester.name}`,
                    })) || [],
            })) || []
        )
    }, [schoolYears])

    const filterTreeNode = (input: string, treeNode: any) => {
        return treeNode?.title?.toLowerCase()?.includes(input?.toLowerCase())
    }

    const { mutateAsync: updateEvaluationPeriod } = useUpdateEvaluationPeriod()
    async function onOk(output?: PutEvaluationPeriod) {
        if (!output) return
        try {
            showSpinner()
            const data = {
                name: output.name.trim(),
                startDate: output.startDate,
                endDate: output.endDate,
                description: output.description,
                semesterId: output.semesterId,
                createdBy: idProfile,
            }
            if (id) {
                await updateEvaluationPeriod({
                    data: {
                        ...data,
                    },
                    where: { id },
                })
                message.success('Cập nhật thành công')
            } else {
                const periodId = createId()
                const res = await sqlTransaction([
                    {
                        model: 'EvaluationPeriod',
                        operation: 'create',
                        data: {
                            data: { id: periodId, ...data },
                        },
                    },
                    {
                        model: 'EvaluationCouncil',
                        operation: 'create',
                        data: {
                            data: {
                                name: output.name,
                                periodId,
                                createdBy: idProfile,
                            },
                        },
                    },
                ])
                if (res.status !== 200) {
                    message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
                    return
                }
                message.success('Thêm mới thành công')
            }
            queryClient.invalidateQueries({
                queryKey: ['EvaluationPeriod'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

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
            className="w-[60vw]"
        >
            <Col span={16}>
                <FormItem form={form} name="name" label="Tên đợt đánh giá" required>
                    <Input placeholder="Nhập tên đợt đánh giá" />
                </FormItem>
            </Col>
            <Col span={8}>
                <FormItem form={form} name="semesterId" label="Kỳ học" required>
                    <TreeSelect
                        showSearch
                        dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                        placeholder={'Chọn kỳ học'}
                        allowClear
                        treeDefaultExpandAll
                        treeData={treeData}
                        filterTreeNode={filterTreeNode}
                        treeNodeFilterProp="title"
                        loading={schoolYearLoading}
                    />
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
                        disabledDate={(current) => {
                            const startTime = form.getFieldValue('startDate')
                            if (!startTime) return false
                            return current && current < dayjs(startTime).startOf('day')
                        }}
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="description" label="Mô tả">
                    <Input.TextArea placeholder="Nhập mô tả" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutEvaluationPeriod
