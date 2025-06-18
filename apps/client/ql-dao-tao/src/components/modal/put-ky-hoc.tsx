import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import { type Semester, type SchoolYear, SemesterType } from '@workspace/db'
import {
    useCreateSemester,
    useFindUniqueSemester,
    useFindManySchoolYear,
    useUpdateSemester,
    useCountSemester,
} from '@workspace/db/hooks'
import { Col, Form, Input, InputNumber, message, Switch } from 'antd'
import { useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import Select from '@components/commons/select'
import DatePicker from '@components/commons/date-picker'
import dayjs from 'dayjs'
export type PutSemester = Semester
import 'dayjs/locale/vi'
import { useWatch } from 'antd/es/form/Form'
dayjs.locale('vi')

type SemesterModalInput = {
    schoolYearId: string
    semesterId: string
}
const PutSemesterModal = () => {
    const [form] = Form.useForm<PutSemester>()
    const [active, setActive] = useState(true)
    const { isOpen, onClose, input } = useDisclosure<SemesterModalInput>({
        tag: PutSemesterModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { data = [], refetch } = useFindManySchoolYear({
        take: 1000,
        skip: 0,
    })

    const { mutateAsync: createSemester } = useCreateSemester()
    const { mutateAsync: updateSemester } = useUpdateSemester()
    async function onOk(output?: PutSemester) {
        if (!output) return
        try {
            showSpinner()
            const schoolYearId = input?.schoolYearId ?? output.schoolYearId
            const data = {
                code: output.code,
                name: output.name,
                description: output.description,
                startDate: output.startDate,
                endDate: output.endDate,
                schoolYearId,
                order: output.order,
                semesterType: output.semesterType,
                active: output.active,
            }
            if (input?.semesterId) {
                await updateSemester({
                    data: data,
                    where: {
                        id: input?.semesterId,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createSemester({
                    data: data,
                })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['Semester'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }
    const schoolYearIdForm = useWatch('schoolYearId', form)
    const { data: semesterCount = 0 } = useCountSemester({
        where: schoolYearIdForm
            ? {
                  schoolYearId: schoolYearIdForm,
              }
            : {},
    })

    const { data: initialData } = useFindUniqueSemester({
        where: { id: input?.semesterId },
    })
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (initialData) {
            form.setFieldsValue({
                ...initialData,
                startDate: dayjs(initialData.startDate),
                endDate: initialData.endDate
                    ? dayjs(initialData.endDate)
                    : undefined,
            })
            setActive(initialData?.active)
        }
    }, [initialData])

    const handleChange = (checked: boolean) => {
        setActive(checked)
        form.setFieldsValue({ active: checked })
    }

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={input?.semesterId ? 'Chỉnh sửa học kỳ' : 'Thêm mới học kỳ'}
            className="w-[60vw]"
        >
            <Col span={12}>
                <FormItem form={form} name="code" label="Mã học kỳ" required>
                    <Input placeholder="Nhập mã học kỳ" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="name" label="Tên học kỳ" required>
                    <Input placeholder="Nhập tên học kỳ" />
                </FormItem>
            </Col>
            {!input?.schoolYearId && (
                <Col span={12}>
                    <FormItem
                        form={form}
                        name="schoolYearId"
                        label="Năm học"
                        required
                    >
                        <Select
                            placeholder="Chọn năm học"
                            options={data.map((i: SchoolYear) => {
                                return {
                                    value: i.id,
                                    label: i.name,
                                }
                            })}
                            onChange={(value) => {
                                form.setFieldsValue({
                                    order: semesterCount + 1,
                                })
                            }}
                        />
                    </FormItem>
                </Col>
            )}
            <Col span={12}>
                <FormItem form={form} name="semesterType" label="Loai học kỳ">
                    <Select
                        placeholder="Chọn loại học kỳ"
                        options={[
                            {
                                value: SemesterType.FIRST,
                                label: 'HK1',
                            },
                            {
                                value: SemesterType.SECOND,
                                label: 'HK2',
                            },
                            {
                                value: null,
                                label: 'HK khác',
                            },
                        ]}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="order" label="Thứ tự" required>
                    <InputNumber
                        style={{ width: '100%' }}
                        placeholder="Nhập thứ tự năm học"
                        step={1}
                        min={1}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="startDate"
                    label="Ngày bắt đầu"
                    required
                >
                    <DatePicker format="DD/MM/YYYY" className="w-full" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="endDate" label="Ngày kết thúc">
                    <DatePicker format="DD/MM/YYYY" className="w-full" />
                </FormItem>
            </Col>
            <Col span={input?.semesterId || !input?.schoolYearId ? 12 : 24}>
                <FormItem form={form} name="description" label="Mô tả">
                    <Input.TextArea placeholder="Nhập mô tả" />
                </FormItem>
            </Col>
            {input?.semesterId && (
                <Col span={12} className="flex items-center">
                    <FormItem
                        form={form}
                        name="active"
                        label=""
                        valuePropName="checked"
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                            }}
                        >
                            <Switch checked={active} onChange={handleChange} />
                            <span>
                                {active ? 'Đang đào tạo' : 'Ngừng đào tạo'}
                            </span>
                        </div>
                    </FormItem>
                </Col>
            )}
        </PutFormModal>
    )
}

export default PutSemesterModal
