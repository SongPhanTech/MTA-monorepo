import { queryClient } from '@api/index'
import DatePicker from '@components/commons/date-picker'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useSpinner from '@hooks/spinner'
import type { SchoolYear, Semester } from '@workspace/db/client'
import {
    useCreateSemester,
    useFindManySchoolYear,
    useFindUniqueSemester,
    useUpdateSemester,
} from '@workspace/db/hooks'
import { Col, Form, Input, message, Radio } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import { useSemesterTypeOptions } from '@hooks/semesterType'
import { useWatch } from 'antd/es/form/Form'
export type PutSemester = Semester

dayjs.locale('vi')

type SemesterModalInput = {
    schoolYearId: string
    semesterId: string
}
const PutSemesterModal = () => {
    const [form] = Form.useForm<PutSemester>()
    const { isOpen, onClose, input } = useDisclosure<SemesterModalInput>({
        tag: 'PutSemesterModal',
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()
    const { options } = useSemesterTypeOptions()

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
                name: output.name.trim(),
                description: output.description,
                startDate: output.startDate,
                endDate: output.endDate,
                schoolYearId,
                semesterType: output.semesterType,
                active: output.active,
            }
            if (input?.semesterId) {
                await updateSemester({
                    data,
                    where: {
                        id: input?.semesterId,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createSemester({
                    data,
                })
                message.success('Thêm mới thành công')
            }
            queryClient.invalidateQueries({
                queryKey: ['Semester'],
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
    const schoolYearIdForm = useWatch('schoolYearId', form)

    const { data: initialData } = useFindUniqueSemester(
        {
            where: { id: input?.semesterId },
        },
        { enabled: !!input?.semesterId }
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
                active: true,
                schoolYearId: input?.schoolYearId,
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
            title={input?.semesterId ? 'Chỉnh sửa học kỳ' : 'Thêm mới học kỳ'}
            className="w-[1000px]"
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
            <Col span={12}>
                <FormItem form={form} name="schoolYearId" label="Năm học" required>
                    <Select
                        placeholder="Chọn năm học"
                        disabled={!!input?.schoolYearId}
                        options={data.map((i: SchoolYear) => {
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
                    name="semesterType"
                    label="Loại học kỳ"
                    rules={[
                        {
                            validator: (_, value) => {
                                if (value === undefined) {
                                    return Promise.reject('Vui lòng chọn loại học kỳ')
                                }
                                // allow null explicitly
                                return Promise.resolve()
                            },
                        },
                    ]}
                >
                    <Select placeholder="Chọn loại học kỳ" options={options} />
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
                        placeholder="Chọn ngày bắt đầu"
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
                        placeholder="Chọn ngày kết thúc"
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="description" label="Mô tả">
                    <Input.TextArea placeholder="Nhập mô tả" />
                </FormItem>
            </Col>
            {input?.semesterId && (
                <Col span={12}>
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

export default PutSemesterModal
