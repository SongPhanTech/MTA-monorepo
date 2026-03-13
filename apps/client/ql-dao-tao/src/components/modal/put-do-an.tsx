import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { ThesisProject } from '@workspace/db/client'
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
import { buildOrgTree } from '@lib/utils'
import { whereOrganization } from '@workspace/libs/constants'
import { debounce } from 'lodash'
import { useCallback, useEffect, useState } from 'react'
import TreeSelect from '@/components/commons/tree-select'
export type PutThesisProject = ThesisProject
dayjs.locale('vi')

const PutThesisProject = () => {
    const { thesisProjectStatusOptions } = useThesisProjectStatusOptions()
    const [searchExpert, setSearchExpert] = useState('')
    const [searchOrganization, setSearchOrganization] = useState('')
    const [supervisorId, setSupervisorId] = useState<string | undefined>()
    const [coSupervisorId, setCoSupervisorId] = useState<string | undefined>()
    const [form] = Form.useForm<PutThesisProject>()
    const { isOpen, onClose, input } = useDisclosure<{
        subjectClassId: string
        thesisProjectId: string
    }>({
        tag: 'PutThesisProject',
        onClose: form.resetFields,
    })

    const { showSpinner, hideSpinner } = useSpinner()
    const { data: organization = [], refetch: refetchOrganization } = useFindManyDM_DonVi({
        where: {
            ...(searchOrganization
                ? {
                      sTen: { contains: searchOrganization, mode: 'insensitive' },
                  }
                : {}),
            ...whereOrganization,
        },
         orderBy: { iSTT: 'desc' }
    })

    const treeData = buildOrgTree(organization)

    const { data: expert = [], refetch } = useFindManyExpertProfile({
        where: {
            ...(searchExpert
                ? {
                      OR: [
                          {
                              lecturer: {
                                  userProfile: {
                                      fullname: { contains: searchExpert, mode: 'insensitive' },
                                  },
                              },
                          },
                          {
                              name: { contains: searchExpert, mode: 'insensitive' },
                          },
                      ],
                  }
                : {}),
        },
        include: {
            lecturer: {
                include: {
                    userProfile: true,
                },
            },
        },
    })
    const { data: thesisProject } = useFindUniqueThesisProject(
        { where: { id: input?.thesisProjectId } },
        { enabled: !!input?.thesisProjectId }
    )

    const debouncedRefetch = useCallback(
        debounce(() => {
            refetch()
            refetchOrganization()
        }, 500),
        []
    )

    const handleSearchExpert = (value: string) => {
        setSearchExpert(value)
        debouncedRefetch()
    }

    const handleSupervisorChange = (value: string | undefined) => {
        setSupervisorId(value)
        if (value && value === coSupervisorId) {
            form.setFieldValue('coSupervisorId', undefined)
            setCoSupervisorId(undefined)
        }
    }

    const handleCoSupervisorChange = (value: string | undefined) => {
        setCoSupervisorId(value)
        if (value && value === supervisorId) {
            form.setFieldValue('supervisorId', undefined)
            setSupervisorId(undefined)
        }
    }

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
            setSupervisorId(thesisProject.supervisorId || undefined)
            setCoSupervisorId(thesisProject.coSupervisorId || undefined)
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
            coSupervisorId: output.coSupervisorId,
            organizationId: output.organizationId,
            maxStudents: output.maxStudents,
            registrationStart: output.registrationStart,
            registrationEnd: output.registrationEnd,
            projectStart: output.projectStart,
            projectEnd: output.projectEnd,
            subjectClassId: input?.subjectClassId || '',
            firstCheckProgress: output.firstCheckProgress,
            secondCheckProgress: output.secondCheckProgress,
            isEligibleForDefense: output.isEligibleForDefense,
        }

        try {
            showSpinner()
            if (input?.thesisProjectId) {
                await updateThesisProject({
                    where: { id: input.thesisProjectId },
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

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={input?.thesisProjectId ? 'Chỉnh sửa đồ án' : 'Thêm mới đồ án'}
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
                            label: `${item.code ? `${item.code} -` : ''} ${item.lecturer?.userProfile.fullname || item.name}`,
                            value: item.id,
                        }))}
                        showSearch
                        onSearch={handleSearchExpert}
                        filterOption={false}
                        onChange={handleSupervisorChange}
                        allowClear
                    />
                </FormItem>
            </Col>
            <Col span={8}>
                <FormItem form={form} name="coSupervisorId" label="Chuyên gia hướng dẫn phụ">
                    <Select
                        placeholder="Chọn chuyên gia hướng dẫn phụ"
                        options={expert.map((item) => ({
                            label: `${item.code ? `${item.code} -` : ''} ${item.lecturer?.userProfile.fullname || item.name}`,
                            value: item.id,
                        }))}
                        showSearch
                        onSearch={handleSearchExpert}
                        filterOption={false}
                        onChange={handleCoSupervisorChange}
                        allowClear
                    />
                </FormItem>
            </Col>
            <Col span={8}>
                <FormItem form={form} name="organizationId" label="Đơn vị quản lý" required>
                    <TreeSelect
                        placeholder="Chọn đơn vị quản lý"
                        allowClear
                        showSearch
                        treeDefaultExpandAll
                        treeData={treeData}
                    />
                </FormItem>
            </Col>
            <Col span={8}>
                <FormItem form={form} name="maxStudents" label="Số lượng học viên tối đa" required>
                    <InputNumber
                        type="number"
                        placeholder="Nhập số lượng học viên"
                        className="w-full"
                        min={0}
                    />
                </FormItem>
            </Col>
            <Col span={8}>
                <FormItem form={form} name="registrationStart" label="Thời gian mở đăng ký">
                    <DatePicker
                        format={{
                            format: 'DD/MM/YYYY',
                            type: 'mask',
                        }}
                        className="w-full"
                        placeholder="Chọn thời gian mở đăng ký"
                    />
                </FormItem>
            </Col>
            <Col span={8}>
                <FormItem
                    form={form}
                    name="registrationEnd"
                    label="Thời gian đóng đăng ký"
                    dependencies={['registrationStart']}
                    rules={[
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                const start = getFieldValue('registrationStart')
                                if (!value || !start) {
                                    return Promise.resolve()
                                }
                                if (value.isBefore(start, 'day')) {
                                    return Promise.reject(
                                        new Error('Ngày đóng không được trước ngày mở')
                                    )
                                }
                                return Promise.resolve()
                            },
                        }),
                    ]}
                >
                    <DatePicker
                        format={{
                            format: 'DD/MM/YYYY',
                            type: 'mask',
                        }}
                        className="w-full"
                        // disabledDate={(current) => {
                        //     const startTime = form.getFieldValue('registrationStart')
                        //     if (!startTime) return false
                        //     return current && current < dayjs(startTime).startOf('day')
                        // }}
                        placeholder="Chọn thời gian đóng đăng ký"
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
                        placeholder="Chọn thời gian bắt đầu"
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
                        disabledDate={(current) => {
                            const startTime = form.getFieldValue('projectStart')
                            if (!startTime) return false
                            return current && current < dayjs(startTime).startOf('day')
                        }}
                        placeholder="Chọn thời gian kết thúc"
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
            <Col span={8}>
                <FormItem form={form} name="firstCheckProgress" label="Tiến độ kiểm tra lần 1(%)">
                    <InputNumber min={0} max={100} placeholder="Nhập tiến độ" className="w-full" />
                </FormItem>
            </Col>
            <Col span={8}>
                <FormItem form={form} name="secondCheckProgress" label="Tiến độ kiểm tra lần 2(%)">
                    <InputNumber min={0} max={100} placeholder="Nhập tiến độ" className="w-full" />
                </FormItem>
            </Col>
            <Col span={8}>
                <FormItem
                    form={form}
                    name="isEligibleForDefense"
                    label="Đủ điều kiện bảo vệ"
                    layout="horizontal"
                >
                    <Select
                        placeholder="Chọn trạng thái"
                        options={[
                            { label: 'Đủ điều kiện', value: true },
                            { label: 'Không đủ điều kiện', value: false },
                        ]}
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
