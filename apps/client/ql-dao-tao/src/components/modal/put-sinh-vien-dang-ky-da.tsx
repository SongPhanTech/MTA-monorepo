import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { StudentThesisRegistration } from '@workspace/db'
import {
    useCreateManyStudentThesisRegistration,
    useFindManyLecturer,
    useFindManyStudent,
    useFindUniqueStudentThesisRegistration,
    useUpdateStudentThesisRegistration,
} from '@workspace/db/hooks'
import { Col, Form, Input, message, Select } from 'antd'
import dayjs from 'dayjs'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import DatePicker from '@components/commons/date-picker'
import Tabs from '@components/commons/tabar'
import { useStudentThesisRegistrationStatusOptions } from '@hooks/studentThesisRegistrationStatus'
import { debounce } from 'lodash'
import { useCallback, useEffect, useState } from 'react'

export type PutStudentThesisRegistration = StudentThesisRegistration & {
    studentIds?: string[]
}
dayjs.locale('vi')

const PutStudentThesisRegistration = () => {
    const { statusOptions } = useStudentThesisRegistrationStatusOptions()
    const [form] = Form.useForm<PutStudentThesisRegistration>()
    const { isOpen, onClose, input } = useDisclosure<{
        studentThesisId: string
        thesisProjectId: string
    }>({
        tag: PutStudentThesisRegistration.name,
        onClose: form.resetFields,
    })
    const [searchText, setSearchText] = useState('')
    const [searchReviewer, setSearchReviewer] = useState('')

    const [selectedStudents, setSelectedStudents] = useState<string[]>([])

    const { showSpinner, hideSpinner } = useSpinner()

    const { data: studentThesisRegistration } = useFindUniqueStudentThesisRegistration(
        { where: { id: input?.studentThesisId } },
        { enabled: !!input?.studentThesisId }
    )

    const { data: students, refetch } = useFindManyStudent({
        where: {
            ...(searchText && searchText !== ''
                ? {
                      OR: [
                          { code: { contains: searchText, mode: 'insensitive' } },
                          {
                              userProfile: {
                                  OR: [
                                      { fullname: { contains: searchText, mode: 'insensitive' } },
                                      { code: { contains: searchText, mode: 'insensitive' } },
                                  ],
                              },
                          },
                      ],
                  }
                : {}),
        },
        include: {
            userProfile: true,
        },
        take: 500,
    })

    const { data: reviewer = [] } = useFindManyLecturer({
        where: {
            ...(searchReviewer
                ? {
                      userProfile: { fullname: { contains: searchReviewer, mode: 'insensitive' } },
                  }
                : {}),
        },
        include: {
            userProfile: true,
        },
    })

    const debouncedRefetch = useCallback(
        debounce(() => {
            refetch()
        }, 500),
        []
    )

    const handleSearch = (value: string) => {
        setSearchText(value)
        debouncedRefetch()
    }

    const handleSearchReviewer = (value: string) => {
        setSearchReviewer(value)
        debouncedRefetch()
    }

    const handleStudentChange = (value: string | string[]) => {
        if (Array.isArray(value)) {
            setSelectedStudents(value)
        } else {
            form.setFieldValue('studentId', value)
        }
    }

    useEffect(() => {
        if (studentThesisRegistration) {
            form.setFieldsValue({
                ...studentThesisRegistration,
                reviewedAt: studentThesisRegistration.reviewedAt
                    ? dayjs(studentThesisRegistration.reviewedAt)
                    : undefined,
                registeredAt: studentThesisRegistration.registeredAt
                    ? dayjs(studentThesisRegistration.registeredAt)
                    : undefined,
                studentId: studentThesisRegistration.studentId,
            })
        }
    }, [studentThesisRegistration, form])

    const { mutateAsync: createManyStudentThesisRegistration } =
        useCreateManyStudentThesisRegistration()
    const { mutateAsync: updateStudentThesisRegistration } = useUpdateStudentThesisRegistration()
    async function onOk(output?: PutStudentThesisRegistration) {
        if (!output) return

        try {
            showSpinner()
            if (input?.studentThesisId) {
                const payload = {
                    thesisProjectId: input?.thesisProjectId || '',
                    studentId: output.studentId,
                    status: output.status,
                    registeredAt: output.registeredAt,
                    motivation: output.motivation,
                    experience: output.experience,
                    proposedIdeas: output.proposedIdeas,
                    reviewedAt: output.reviewedAt,
                    reviewedById: output.reviewedById,
                    reviewNote: output.reviewNote,
                }

                await updateStudentThesisRegistration({
                    data: payload,
                    where: { id: input.studentThesisId },
                })
                message.success('Cập nhật thành công')
            } else {
                if (selectedStudents.length === 0) {
                    message.error('Vui lòng chọn sinh viên')
                    return
                }

                const payload = selectedStudents.map((studentId) => ({
                    status: output.status,
                    thesisProjectId: input?.thesisProjectId || '',
                    studentId,
                    registeredAt: output.registeredAt,
                    motivation: output.motivation,
                    experience: output.experience,
                    proposedIdeas: output.proposedIdeas,
                    reviewedAt: output.reviewedAt,
                    reviewedById: output.reviewedById,
                    reviewNote: output.reviewNote,
                }))

                await createManyStudentThesisRegistration({
                    data: payload,
                })
                message.success(`Đã thêm ${selectedStudents.length} sinh viên`)
            }

            queryClient.invalidateQueries({
                queryKey: ['studentStudentThesisRegistrations'],
            })
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
            title={input?.studentThesisId ? 'Chỉnh sửa sinh viên' : 'Thêm mới sinh viên'}
            className="w-[50vw]"
        >
            <Col span={12}>
                <FormItem
                    form={form}
                    name={input?.studentThesisId ? 'studentId' : 'studentIds'}
                    label={input?.studentThesisId ? 'Sinh viên' : 'Danh sách sinh viên'}
                    required
                >
                    <Select
                        mode={input?.studentThesisId ? undefined : 'multiple'}
                        placeholder={
                            input?.studentThesisId ? 'Chọn sinh viên' : 'Chọn nhiều sinh viên'
                        }
                        options={students?.map((item) => ({
                            label: [item.userProfile.fullname, item.userProfile.code]
                                .filter(Boolean)
                                .join(' - '),
                            value: item.id,
                        }))}
                        showSearch
                        onSearch={handleSearch}
                        filterOption={false}
                        allowClear
                        onChange={handleStudentChange}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="registeredAt" label="Thời gian đăng ký">
                    <DatePicker
                        format={{
                            format: 'DD/MM/YYYY',
                            type: 'mask',
                        }}
                        className="w-full"
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="reviewedById" label="Người phê duyệt" required>
                    <Select
                        placeholder="Người phê duyệt"
                        options={reviewer.map((item) => ({
                            label: `${item?.userProfile.fullname} - ${item.code}`,
                            value: item.id,
                        }))}
                        showSearch
                        onSearch={handleSearchReviewer}
                        filterOption={false}
                        allowClear
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="reviewedAt" label="Thời gian phê duyệt">
                    <DatePicker
                        format={{
                            format: 'DD/MM/YYYY',
                            type: 'mask',
                        }}
                        className="w-full"
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="status" label="Trạng thái">
                    <Select
                        placeholder="Chọn trạng thái"
                        options={statusOptions?.map((item) => ({
                            label: item.label,
                            value: item.value,
                        }))}
                        allowClear
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="reviewNote" label="Ghi chú">
                    <Input.TextArea rows={3} placeholder="Ghi chú của người phê duyệt" />
                </FormItem>
            </Col>
            <Col span={24}>
                <Tabs
                    items={[
                        {
                            key: '1',
                            label: 'Lý do muốn tham gia',
                            children: (
                                <FormItem form={form} name="motivation">
                                    <Input.TextArea rows={6} placeholder="Lý do muốn tham gia" />
                                </FormItem>
                            ),
                        },
                        {
                            key: '2',
                            label: 'Kinh nghiệm liên quan',
                            children: (
                                <FormItem form={form} name="experience">
                                    <Input.TextArea rows={6} placeholder="Kinh nghiệm liên quan" />
                                </FormItem>
                            ),
                        },
                        {
                            key: '3',
                            label: 'Ý tưởng đóng góp',
                            children: (
                                <FormItem form={form} name="proposedIdeas">
                                    <Input.TextArea rows={6} placeholder="Ý tưởng đóng góp" />
                                </FormItem>
                            ),
                        },
                    ]}
                />
            </Col>
        </PutFormModal>
    )
}

export default PutStudentThesisRegistration
