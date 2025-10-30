import FormItem from '@components/commons/form-item'
import Table from '@components/commons/table'
import type { PutSurveyType } from '@components/modal/put-modal-survey'
import { useFindManyLecturer } from '@workspace/db/hooks'
import { Form, Input, type TreeProps } from 'antd'
import { useState } from 'react'

interface MyTreeNode {
    title: string
    key: string
    value?: string // nếu bạn muốn gán giá trị riêng
    children?: MyTreeNode[]
}

function SelectLecturer({
    surveyTopicId,
    semesterId,
}: {
    surveyTopicId?: string
    semesterId?: string
}) {
    const form = Form.useFormInstance<PutSurveyType>()
    const [initValue, setInitValue] = useState<string[]>([])

    const { data: lecturerData = [] } = useFindManyLecturer(
        {
            where: {
                mainSubjectClasses: {
                    some: {
                        semester: {
                            id: semesterId,
                        },
                    },
                },
            },
            orderBy: {
                userProfile: {
                    firstName: 'asc',
                },
            },
            include: {
                userProfile: true,
                mainSubjectClasses: {
                    include: {
                        semester: true,
                    },
                },
            },
        },
        {
            enabled: !!semesterId,
        }
    )

    const onCheck: TreeProps['onCheck'] = (checkedKeys, info) => {
        // info.checkedNodes: (DataNode & { children?: DataNode[] })[]
        const onlyLeafValues = (info.checkedNodes as MyTreeNode[])
            .filter((node) => !node.children?.length) // chỉ lấy node không có children
            .map((node) => node.value ?? node.key) // lấy value nếu có, không thì lấy key

        form.setFieldValue('surveyQuestionIds', onlyLeafValues)
        setInitValue(onlyLeafValues)
    }
    const listForm = Form.useWatch('surveyChoice', form) ?? []

    return (
        <div className="w-full px-3 mt-3">
            <div className="mb-4 text-[14px] font-[500]">Lựa chọn của câu hỏi khảo sát</div>
            <div>
                <FormItem form={form} name="surveyChoice">
                    <Table
                        rowKey={'id'}
                        columns={[
                            {
                                title: 'Giá trị',
                                dataIndex: 'answer',
                                width: 100,
                                render: (__, record, index) => (
                                    <Form.Item
                                        className="w-full mb-0"
                                        name={['surveyChoice', index, 'answer']}
                                        label=""
                                        rules={[
                                            {
                                                required: true,
                                                message: 'Vui lòng nhập giá trị',
                                            },
                                        ]}
                                    >
                                        <Input className="w-full" placeholder="Nhập giá trị" />
                                    </Form.Item>
                                ),
                            },
                        ]}
                        bordered
                        data={listForm}
                        pagination={false}
                    />
                </FormItem>
            </div>
        </div>
    )
}

export default SelectLecturer
