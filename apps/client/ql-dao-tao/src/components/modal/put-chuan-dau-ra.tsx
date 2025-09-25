import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import { useUpdateStudent } from '@workspace/db/hooks'
import { Form, message, Switch } from 'antd'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
export type StudentOutputStandards = {
    foreignLangPass: boolean
    computerSkillPass: boolean
}

const PutChuanDauRaModal = () => {
    const [form] = Form.useForm<StudentOutputStandards>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: 'PutChuanDauRaModal',
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: updateStudent } = useUpdateStudent()

    async function onOk(data?: StudentOutputStandards) {
        if (!data) return
        try {
            showSpinner()

            await updateStudent({
                data,
                where: { id },
            })
            message.success('Cập nhật thành công')

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
            title={'Cập nhật chuẩn đầu ra'}
            layout="horizontal"
            rowWrap={false}
        >
            <FormItem
                form={form}
                name="foreignLangPass"
                label="Đạt chuẩn ngoại ngữ"
                valuePropName="checked"
            >
                <Switch
                    className="ml-auto"
                    checkedChildren={<CheckOutlined />}
                    unCheckedChildren={<CloseOutlined />}
                />
            </FormItem>

            <FormItem
                form={form}
                name="computerSkillPass"
                label="Đạt chuẩn tin học"
                valuePropName="checked"
            >
                <Switch
                    className="ml-auto"
                    checkedChildren={<CheckOutlined />}
                    unCheckedChildren={<CloseOutlined />}
                />
            </FormItem>
        </PutFormModal>
    )
}

export default PutChuanDauRaModal
