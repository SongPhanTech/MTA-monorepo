import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { Semester, SchoolYear } from '@workspace/db'
import {
    useCreateSemester,
    useFindUniqueSemester,
    useFindManySchoolYear,
    useFindManySemester,
    useUpdateSemester
} from '@workspace/db/hooks'
import { Col, Form, Input, message } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import Select from '@components/commons/select'
import DatePicker from '@components/commons/date-picker'
import dayjs from 'dayjs'
export type PutSemester = Semester
const PutSemesterModal = () => {
    const [form] = Form.useForm<PutSemester>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutSemesterModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { data = [], refetch } = useFindManySchoolYear({
        take: 1000,
        skip: 0,
    })
    const { data: organizations = [], refetch: refetchSemesters } = useFindManySemester({
        take: 1000,
        skip: 0,
    })

    const { mutateAsync: createSemester } = useCreateSemester()
    const { mutateAsync: updateSemester } = useUpdateSemester()
    async function onOk(output?: PutSemester) {
        if (!output) return
        try {
            showSpinner()
            if (id) {
                await updateSemester({
                    data: {
                        code: output.code,
                        name: output.name,
                        description: output.description,
                        startDate: output.startDate,
                        endDate: output.endDate,
                        schoolYearId: output.schoolYearId
                    },
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createSemester({
                    data: {
                        code: output.code,
                        name: output.name,
                        description: output.description,
                        startDate: output.startDate,
                        endDate: output.endDate,
                        schoolYearId: output.schoolYearId
                    },
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

    const { data: level } = useFindUniqueSemester({
        where: { id },
    })
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (level) {
            form.setFieldsValue({
                ...level,
                startDate: dayjs(level.startDate),
                endDate: dayjs(level.endDate)
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
            title={
                id
                    ? 'Chỉnh sửa học kỳ'
                    : 'Thêm mới học kỳ'
            }
            className="w-[30vw]"
        >
            <Col span={24}>
                <FormItem
                    form={form}
                    name="code"
                    label="Mã học kỳ"
                    required
                >
                    <Input placeholder='Nhập mã học kỳ' />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem
                    form={form}
                    name="name"
                    label="Tên học kỳ"
                    required
                >
                    <Input placeholder="Nhập tên học kỳ" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem
                    form={form}
                    name="schoolYearId"
                    label="Năm học"
                    required
                >
                    <Select placeholder='Chọn năm học' options={data.map((i: SchoolYear) => {
                        return {
                            value: i.id,
                            label: i.name
                        }
                    })} />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="startDate" label="Ngày bắt đầu" required>
                    <DatePicker format="DD/MM/YYYY" className="w-full" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="endDate" label="Ngày kết thúc">
                    <DatePicker format="DD/MM/YYYY" className="w-full" />
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

export default PutSemesterModal
