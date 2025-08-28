import { RichTextEditor } from '@components/commons/rich-text-editor'
import { Form } from 'antd'
import { PutRequirementCriterion } from '.'

export default function FormEvaluationCriterion({ item }: any) {
    const form = Form.useFormInstance<PutRequirementCriterion>()
    return (
        <Form form={form} layout="horizontal" className="mt-4">
            <Form.Item label="1. Mô tả hiện trạng" name={['criteria', item.id, 'currentSituation']}>
                <RichTextEditor id={item?.id} />
            </Form.Item>
            <Form.Item label="2. Điểm mạnh" name={['criteria', item.id, 'strengths']}>
                <RichTextEditor id={item?.id} />
            </Form.Item>
            <Form.Item label="3. Điểm tồn tại" name={['criteria', item.id, 'weakness']}>
                <RichTextEditor id={item?.id} />
            </Form.Item>
            <Form.Item label="4. Kế hoạch hành động" name={['criteria', item.id, 'actionPlan']}>
                <RichTextEditor id={item?.id} />
            </Form.Item>
        </Form>
    )
}
