import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { ThesisProject } from '@workspace/db'
import {
    useCreateThesisProject,
    useFindManyDM_DonVi,
    useFindManyExpertProfile,
    useFindUniqueThesisProject,
    useUpdateThesisProject,
} from '@workspace/db/hooks'
import { Col, Form, Input, InputNumber, message, Select } from 'antd'
import dayjs from 'dayjs'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import DatePicker from '@components/commons/date-picker'
import Tabs from '@components/commons/tabar'
import { useThesisProjectStatusOptions } from '@hooks/thesisProjectStatus'
import { useEffect } from 'react'

export type PutThesisProject = ThesisProject
dayjs.locale('vi')

const PutThesisProject = () => {
    const { thesisProjectStatusOptions } = useThesisProjectStatusOptions()
    const [form] = Form.useForm<PutThesisProject>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutThesisProject.name,
        onClose: form.resetFields,
    })

    const { showSpinner, hideSpinner } = useSpinner()
    const { data: organization = [] } = useFindManyDM_DonVi()
    const { data: expert = [] } = useFindManyExpertProfile({
        include: {
            lecturer: {
                include: {
                    userProfile: true,
                },
            },
        },
    })
    const { data: thesisProject } = useFindUniqueThesisProject(
        { where: { id: id } },
        { enabled: !!id }
    )

    useEffect(() => {
        if (thesisProject) {
            form.setFieldsValue({
                ...thesisProject,
                registrationStart: thesisProject.registrationStart
                    ? dayjs(thesisProject.registrationStart)
                    : undefined,
                registrationEnd: thesisProject.registrationEnd
                    ? dayjs(thesisProject.registrationEnd)
                    : undefined,
                projectStart: thesisProject.projectStart
                    ? dayjs(thesisProject.projectStart)
                    : undefined,
                projectEnd: thesisProject.projectEnd ? dayjs(thesisProject.projectEnd) : undefined,
            })
        }
    }, [thesisProject, form])

    const { mutateAsync: createThesisProject } = useCreateThesisProject()
    const { mutateAsync: updateThesisProject } = useUpdateThesisProject()
    async function onOk(output?: PutThesisProject) {
        if (!output) return
        const payload = {
            title: output.title,
            titleEN: output.titleEN,
            status: output.status,
            summary: output.summary,
            objectives: output.objectives,
            scope: output.scope,
            methodology: output.methodology,
            expectedResults: output.expectedResults,
            requirements: output.requirements,
            technologies: output.technologies,
            supervisorId: output.supervisorId,
            organizationId: output.organizationId,
            maxStudents: output.maxStudents,
            currentStudents: output.currentStudents,
            registrationStart: output.registrationStart,
            registrationEnd: output.registrationEnd,
            projectStart: output.projectStart,
            projectEnd: output.projectEnd,
        }

        try {
            showSpinner()
            if (id) {
                await updateThesisProject({
                    where: { id: id },
                    data: payload,
                })
                message.success('Cập nhật thành công')
            } else {
                await createThesisProject({
                    data: payload,
                })
                message.success('Thêm mới thành công')
            }

            onClose()
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={id ? 'Chỉnh sửa đồ án' : 'Thêm mới đồ án'}
            className="w-[60vw]"
        >
            <Col span={8}>
                <FormItem form={form} name="title" label="Tên đồ án" required>
                    <Input placeholder="Nhập tên đồ án" />
                </FormItem>
            </Col>
            <Col span={8}>
                <FormItem form={form} name="titleEN" label="Tên đồ án(Tiếng Anh)">
                    <Input placeholder="Nhập tên đồ án(Tiếng Anh)" />
                </FormItem>
            </Col>
            <Col span={8}>
                <FormItem form={form} name="summary" label="Tóm tắt đồ án" required>
                    <Input placeholder="Tóm tắt đồ án" />
                </FormItem>
            </Col>
            <Col span={8}>
                <FormItem form={form} name="supervisorId" label="Chuyên gia hướng dẫn" required>
                    <Select
                        placeholder="Chọn chuyên gia hướng dẫn"
                        options={expert.map((item) => ({
                            label: `${item.lecturer.userProfile.fullname} - ${item.code}`,
                            value: item.id,
                        }))}
                        allowClear
                    />
                </FormItem>
            </Col>
            <Col span={8}>
                <FormItem form={form} name="organizationId" label="Đơn vị quản lý" required>
                    <Select
                        placeholder="Chọn đơn vị quản lý"
                        options={organization.map((item) => ({
                            label: item.sTen,
                            value: item.Id,
                        }))}
                        allowClear
                    />
                </FormItem>
            </Col>
            <Col span={8}>
                <FormItem form={form} name="currentStudents" label="Số học viên hiện tại" required>
                    <InputNumber placeholder="Nhập số lượng học viên" className="w-full" min={0} />
                </FormItem>
            </Col>
            <Col span={8}>
                <FormItem form={form} name="maxStudents" label="Số lượng học viên tối đa" required>
                    <InputNumber placeholder="Nhập số lượng học viên" className="w-full" min={0} />
                </FormItem>
            </Col>
            <Col span={8}>
                <FormItem
                    form={form}
                    name="registrationStart"
                    label="Thời gian mở đăng ký"
                    required
                >
                    <DatePicker
                        format={{
                            format: 'DD/MM/YYYY',
                            type: 'mask',
                        }}
                        className="w-full"
                    />
                </FormItem>
            </Col>
            <Col span={8}>
                <FormItem
                    form={form}
                    name="registrationEnd"
                    label="Thời gian đóng đăng ký"
                    required
                >
                    <DatePicker
                        format={{
                            format: 'DD/MM/YYYY',
                            type: 'mask',
                        }}
                        className="w-full"
                    />
                </FormItem>
            </Col>
            <Col span={8}>
                <FormItem form={form} name="projectStart" label="Thời gian bắt đầu thực hiện">
                    <DatePicker
                        format={{
                            format: 'DD/MM/YYYY',
                            type: 'mask',
                        }}
                        className="w-full"
                    />
                </FormItem>
            </Col>
            <Col span={8}>
                <FormItem form={form} name="projectEnd" label="Thời gian kết thúc dự kiến">
                    <DatePicker
                        format={{
                            format: 'DD/MM/YYYY',
                            type: 'mask',
                        }}
                        className="w-full"
                    />
                </FormItem>
            </Col>
            <Col span={8}>
                <FormItem form={form} name="status" label="Trạng thái">
                    <Select
                        placeholder="Chọn trạng thái"
                        options={thesisProjectStatusOptions?.map((item) => ({
                            label: item.label,
                            value: item.value,
                        }))}
                        allowClear
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <Tabs
                    items={[
                        {
                            key: '1',
                            label: 'Mục tiêu',
                            children: (
                                <FormItem form={form} name="objectives">
                                    <Input.TextArea rows={6} placeholder="Mục tiêu" />
                                </FormItem>
                            ),
                        },
                        {
                            key: '2',
                            label: 'Phạm vi thực hiện',
                            children: (
                                <FormItem form={form} name="scope">
                                    <Input.TextArea rows={6} placeholder="Phạm vi thực hiện" />
                                </FormItem>
                            ),
                        },
                        {
                            key: '3',
                            label: 'Phương pháp thực hiện',
                            children: (
                                <FormItem form={form} name="methodology">
                                    <Input.TextArea rows={6} placeholder="Phương pháp thực hiện" />
                                </FormItem>
                            ),
                        },
                        {
                            key: '4',
                            label: 'Kết quả mong đợi',
                            children: (
                                <FormItem form={form} name="expectedResults">
                                    <Input.TextArea rows={6} placeholder="Kết quả mong đợi" />
                                </FormItem>
                            ),
                        },
                        {
                            key: '5',
                            label: 'Yêu cầu với học viên',
                            children: (
                                <FormItem form={form} name="requirements">
                                    <Input.TextArea rows={6} placeholder="Yêu cầu với học viên" />
                                </FormItem>
                            ),
                        },
                        {
                            key: '6',
                            label: 'Công nghệ sử dụng',
                            children: (
                                <FormItem form={form} name="technologies">
                                    <Input.TextArea rows={6} placeholder="Công nghệ sử dụng" />
                                </FormItem>
                            ),
                        },
                    ]}
                />
            </Col>
        </PutFormModal>
    )
}

export default PutThesisProject
