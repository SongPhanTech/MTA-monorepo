import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { StudentGraduationApplication } from '@workspace/db'
import {
    useCreateStudentGraduationApplication,
    useFindManyStudent,
    useFindUniqueStudentGraduationApplication,
    useUpdateStudentGraduationApplication,
} from '@workspace/db/hooks'
import { Col, Form, message, Select } from 'antd'
import dayjs from 'dayjs'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import DatePicker from '@components/commons/date-picker'
import { useApplicationStatusOptions } from '@hooks/applicationStatus'
import { debounce } from 'lodash'
import { useCallback, useEffect, useState } from 'react'

export type PutGraduationApplication = StudentGraduationApplication
dayjs.locale('vi')

const PutGraduationApplication = () => {
    const { applicationStatusOptions } = useApplicationStatusOptions()
    const [form] = Form.useForm<PutGraduationApplication>()
    const { isOpen, onClose, input } = useDisclosure<{ id: string; graduationSessionId: string }>({
        tag: PutGraduationApplication.name,
        onClose: form.resetFields,
    })
    const [searchText, setSearchText] = useState('')

    const { showSpinner, hideSpinner } = useSpinner()

    const { data: graduationApplication } = useFindUniqueStudentGraduationApplication(
        { where: { id: input?.id } },
        { enabled: !!input?.id }
    )

    const { data: student, refetch } = useFindManyStudent({
        where: {
            ...(searchText && searchText !== ''
                ? {
                      OR: [
                          { code: { contains: searchText, mode: 'insensitive' } },
                          {
                              userProfile: {
                                  fullname: { contains: searchText, mode: 'insensitive' },
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

    useEffect(() => {
        if (graduationApplication) {
            form.setFieldsValue({
                ...graduationApplication,
                applicationDate: graduationApplication.applicationDate
                    ? dayjs(graduationApplication.applicationDate)
                    : undefined,
            })
        }
    }, [graduationApplication, form])

    const { mutateAsync: createGraduationApplication } = useCreateStudentGraduationApplication()
    const { mutateAsync: updateGraduationApplication } = useUpdateStudentGraduationApplication()
    async function onOk(output?: PutGraduationApplication) {
        if (!output) return

        try {
            showSpinner()
            const payload = {
                status: output.status,
                sessionId: input?.graduationSessionId || '',
                studentId: output.studentId,
                applicationDate: output.applicationDate,
            }

            if (input?.id) {
                await updateGraduationApplication({
                    data: payload,
                    where: { id: input.id },
                })
                message.success('Cập nhật thành công')
            } else {
                await createGraduationApplication({
                    data: payload,
                })
                message.success('Thêm mới thành công')
            }

            queryClient.invalidateQueries({
                queryKey: [''],
            })
            onClose()
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }

        hideSpinner()
    }

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={input?.id ? 'Chỉnh sửa đơn xét tốt nghiệp' : 'Thêm mới đơn xét tốt nghiệp'}
            className="w-[50vw]"
        >
            <Col span={12}>
                <FormItem form={form} name="studentId" label="Sinh viên" required>
                    <Select
                        placeholder="Chọn sinh viên"
                        options={student?.map((item) => ({
                            label: [item.userProfile.fullname, item.code]
                                .filter(Boolean)
                                .join(' - '),
                            value: item.id,
                        }))}
                        showSearch
                        onSearch={handleSearch}
                        filterOption={false}
                        allowClear
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="applicationDate" label="Ngày gửi đơn">
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
                        options={applicationStatusOptions?.map((item) => ({
                            label: item.label,
                            value: item.value,
                        }))}
                        allowClear
                    />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutGraduationApplication
