import { queryClient } from '@api/index'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import {
    useCreateGraduationDecision,
    useFindManyStudent,
    useFindUniqueGraduationDecision,
    useUpdateGraduationDecision,
} from '@workspace/db/hooks'
import { Col, Form, message, Select } from 'antd'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import FormItem from '@components/commons/form-item'
import type { GraduationDecision } from '@workspace/db'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'

dayjs.locale('vi')

type PutGraduationDecisionFormValues = GraduationDecision

const PutGraduationDecision = () => {
    const [form] = Form.useForm<PutGraduationDecisionFormValues>()
    const [searchText, setSearchText] = useState('')
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutGraduationDecision.name,
        onClose: form.resetFields,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createGraduationDecision } = useCreateGraduationDecision()
    const { mutateAsync: updateGraduationDecision } = useUpdateGraduationDecision()
    async function onOk(output?: PutGraduationDecisionFormValues) {
        if (!output) return

        try {
            showSpinner()

            queryClient.invalidateQueries({ queryKey: ['GraduationDecision'] })
            onClose()
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }

        hideSpinner()
    }

    const { data: initialValue } = useFindUniqueGraduationDecision(
        {
            where: { id },
        },
        { enabled: !!id }
    )

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (initialValue) {
            form.setFieldsValue({
                ...initialValue,
            })
        }
    }, [initialValue])

    const { data: students, refetch } = useFindManyStudent({
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

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={id ? 'Sửa quyết định tốt nghiệp' : 'Thêm quyết định tốt nghiệp'}
            className="w-[80vw]"
        >
            <Col span={12}>
                <FormItem form={form} name={'studentId'} label={'Sinh viên'} required>
                    <Select
                        placeholder={'Chọn sinh viên'}
                        options={students?.map((item) => ({
                            label: [item.userProfile.fullname, item.userProfile.code]
                                .filter(Boolean)
                                .join(' - '),
                            value: item.id,
                        }))}
                        showSearch
                        filterOption={false}
                        allowClear
                        disabled={!!id}
                    />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutGraduationDecision
