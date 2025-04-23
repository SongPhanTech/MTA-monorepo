import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { Curriculum, CurriculumVersion } from '@workspace/db'
import {
    useCreateCurriculumVersion,
    useFindUniqueCurriculumVersion,
    useFindManySchoolYear,
    useFindManyCurriculumVersion,
    useUpdateCurriculumVersion,
    useFindManyCurriculum,
} from '@workspace/db/hooks'
import { Col, Form, Input, message, TreeSelect } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import Select from '@components/commons/select'
import DatePicker from '@components/commons/date-picker'
import dayjs from 'dayjs'
export type PutCurriculumVersion = CurriculumVersion
import { buildOrgTree } from '@lib/utils'

import 'dayjs/locale/vi'
dayjs.locale('vi')
const PutCurriculumVersionModal = () => {
    const [form] = Form.useForm<PutCurriculumVersion>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutCurriculumVersionModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { data: curriculumData = [], refetch: refetchCurriculum } =
        useFindManyCurriculum()
    const { mutateAsync: createCurriculumVersion } =
        useCreateCurriculumVersion()
    const { mutateAsync: updateCurriculumVersion } =
        useUpdateCurriculumVersion()
    async function onOk(output?: PutCurriculumVersion) {
        if (!output) return
        try {
            showSpinner()
            if (id) {
                await updateCurriculumVersion({
                    data: {
                        name: output.name,
                        startDate: output.startDate,
                        endDate: output.endDate,
                        curriculumId: output.curriculumId,
                        infomation: output.infomation,
                        documentPath: output.documentPath,
                        renderPath: output.renderPath,
                    },
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createCurriculumVersion({
                    data: {
                        name: output.name,
                        startDate: output.startDate,
                        endDate: output.endDate,
                        curriculumId: output.curriculumId,
                        infomation: output.infomation,
                        documentPath: output.documentPath,
                        renderPath: output.renderPath,
                    },
                })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['CurriculumVersion'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { data: level } = useFindUniqueCurriculumVersion({
        where: { id },
    })
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (level) {
            form.setFieldsValue({
                ...level,
                startDate: dayjs(level.startDate),
                endDate: level.endDate ? dayjs(level.endDate) : undefined,
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
                    ? 'Chỉnh sửa phiên bản chương trình đào tạo'
                    : 'Thêm mới phiên bản chương trình đào tạo'
            }
            className="w-[45vw]"
        >
            <Col span={12}>
                <FormItem
                    form={form}
                    name="name"
                    label="Tên phiên bản"
                    required
                >
                    <Input placeholder="Nhập tên phiên bản" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="curriculumId"
                    label="Chương trình đào tạo"
                    required
                >
                    <Select
                        placeholder="Chọn chương trình đào tạo"
                        options={curriculumData.map((i: Curriculum) => {
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
            <Col span={24}>
                <FormItem
                    form={form}
                    name="infomation"
                    label="Thông tin"
                    required
                >
                    <Input.TextArea placeholder="Nhập thông tin" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="documentPath"
                    label="Đường dẫn tài liệu"
                >
                    <Input placeholder="Nhập đường dẫn tài liệu" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="renderPath"
                    label="Đường dẫn tài liệu kết xuất"
                >
                    <Input placeholder="Nhập đường dẫn tài liệu kết xuất" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutCurriculumVersionModal
