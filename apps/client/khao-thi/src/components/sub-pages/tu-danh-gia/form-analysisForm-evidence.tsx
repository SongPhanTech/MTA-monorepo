import { RichTextEditor } from '@components/commons/rich-text-editor'
import { Form } from 'antd'

type SubmitForm = {
    currentSituation: string
    strengths: string
    weakness: string
    actionPlan: string
}
export default function FormEvaluationCriterion({ item }: any) {
    return (
        <Form layout="horizontal" className="mt-4">
            <Form.Item label="1. Mô tả hiện trạng" name={['criteria', item.id, 'currentSituation']}>
                <RichTextEditor id={item?.id} />
            </Form.Item>
            <Form.Item label="2. Điểm mạnh" name={'strengths'}>
                <RichTextEditor id={item?.id} />
            </Form.Item>
            <Form.Item label="3. Điểm tồn tại" name={'weakness'}>
                <RichTextEditor id={item?.id} />
            </Form.Item>
            <Form.Item label="4. Kế hoạch hành động" name={'actionPlan'}>
                <RichTextEditor id={item?.id} />
            </Form.Item>
        </Form>
    )
}
