import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useSpinner from '@hooks/spinner'
import type { SubjectVersion } from '@workspace/db'
import {
    useCreateSubjectVersion,
    useFindManyOrganization,
    useFindManySubject,
    useFindUniqueSubjectVersion,
    useUpdateSubjectVersion,
} from '@workspace/db/hooks'
import { Col, Form, Input, InputNumber, TreeSelect, message } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutSubjectVersion = SubjectVersion
import 'dayjs/locale/vi'
import { useExamTypeOptions } from '@hooks/examType'
dayjs.locale('vi')

const treeData = [
    {
        title: 'Nhóm Cơ sở',
        value: 'nhom-co-so',
        children: [
            { title: 'Toán cao cấp', value: 'toan-cao-cap' },
            { title: 'Vật lý đại cương', value: 'vat-ly-dai-cuong' },
        ],
    },
    {
        title: 'Nhóm Chuyên ngành',
        value: 'nhom-chuyen-nganh',
        children: [
            { title: 'Lập trình Web', value: 'lap-trinh-web' },
            { title: 'Cơ sở dữ liệu', value: 'csdl' },
        ],
    },
]

const PutVersionSubjectModal = () => {
    const [form] = Form.useForm<PutSubjectVersion>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutVersionSubjectModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { data: organization = [] } = useFindManyOrganization()
    const { data: subject = [] } = useFindManySubject()
    const { options } = useExamTypeOptions()

    const { mutateAsync: createSubjectVersion } = useCreateSubjectVersion()
    const { mutateAsync: updateSubjectVersion } = useUpdateSubjectVersion()
    async function onOk(output?: PutSubjectVersion) {
        if (!output) return

        try {
            showSpinner()

            const payload = {
                code: output.code,
                name: output.name,
                description: output.description,
                active: output.active,
                examType: output.examType,
                subjectEquivalentType: output.subjectEquivalentType,
                credit: output.credit,
                period: output.period,
                numberOfOther: output.numberOfOther,
                numberOfInternship: output.numberOfInternship,
                numberOfPractice: output.numberOfPractice,
                numberOfProject: output.numberOfProject,
                numberOfSelfStudy: output.numberOfSelfStudy,
                numberOfTheory: output.numberOfTheory,
                managementOrganizationId: output.managementOrganizationId,
                subjectId: output.subjectId,
            }

            if (id) {
                await updateSubjectVersion({
                    data: payload,
                    where: { id },
                })
                message.success('Cập nhật thành công')
            } else {
                await createSubjectVersion({
                    data: payload,
                })
                message.success('Thêm mới thành công')
            }

            queryClient.invalidateQueries({ queryKey: ['SubjectVersion'] })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }

        hideSpinner()
    }

    const { data: subjectVersion } = useFindUniqueSubjectVersion({
        where: { id },
    })

    useEffect(() => {
        if (subjectVersion) {
            form.setFieldsValue({
                ...subjectVersion,
            })
        }
    }, [subjectVersion, form])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={id ? 'Sửa phiên bản môn học' : 'Thêm phiên bản môn học'}
            className="w-[60vw]"
        >
            <Col span={12}>
                <FormItem form={form} name="name" label="Tên phiên bản">
                    <Input placeholder="Tên phiên bản" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="code" label="Mã phiên bản">
                    <Input placeholder="Mã phiên bản" />
                </FormItem>
            </Col>
            {id && (
                <Col span={12}>
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
            <Col span={12}>
                <FormItem form={form} name="credit" label="Số tín chỉ">
                    <InputNumber placeholder="Số tín chỉ" className="w-full" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="period" label="Giai đoạn">
                    <InputNumber placeholder="Giai đoạn" className="w-full" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="numberOfInternship"
                    label="Number Of Internship"
                >
                    <InputNumber
                        placeholder="Number Of Internship"
                        className="w-full"
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="numberOfOther"
                    label="Number Of Other"
                >
                    <InputNumber
                        placeholder="Number Of Other"
                        className="w-full"
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="numberOfPractice"
                    label="Number Of Practice"
                >
                    <InputNumber
                        placeholder="Number Of Practice"
                        className="w-full"
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="numberOfProject"
                    label="Number Of Project"
                >
                    <InputNumber
                        placeholder="Number Of Project"
                        className="w-full"
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="numberOfSelfStudy"
                    label="Number Of Self Study"
                >
                    <InputNumber
                        placeholder="Number Of Self Study"
                        className="w-full"
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="numberOfTheory"
                    label="Number Of Theory"
                >
                    <InputNumber
                        placeholder="Number Of Theory"
                        className="w-full"
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="examType" label="Hình thức thi">
                    <Select
                        placeholder="Chọn hình thức thi"
                        options={options?.map((item) => ({
                            label: item.label,
                            value: item.value,
                        }))}
                        allowClear
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="managementOrganizationId"
                    label="Đơn vị quản lý"
                >
                    <Select
                        placeholder="Chọn đơn vị quản lý"
                        options={organization?.map((item) => ({
                            label: item.name,
                            value: item.id,
                        }))}
                        allowClear
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="subjectId" label="Môn học">
                    <Select
                        placeholder="Chọn môn học"
                        options={subject?.map((item) => ({
                            label: item.name,
                            value: item.id,
                        }))}
                        allowClear
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <Form.Item
                    name="prerequisiteSubjects"
                    label="Môn học tiên quyết"
                >
                    <TreeSelect
                        treeData={treeData}
                        treeCheckable={true}
                        placeholder="Chọn môn học tiên quyết"
                        style={{ width: '100%' }}
                        allowClear
                    />
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item name="name" label="Môn học song hành">
                    <TreeSelect
                        treeData={treeData}
                        treeCheckable={true}
                        placeholder="Chọn môn học song hành"
                        style={{ width: '100%' }}
                        allowClear
                    />
                </Form.Item>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="description" label="Mô tả">
                    <Input.TextArea placeholder="Nhập mô tả" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutVersionSubjectModal
