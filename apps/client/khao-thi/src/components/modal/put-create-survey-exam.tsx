import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { Survey, SurveyQuestion } from '@workspace/db'
import {
    useCreateSurvey,
    useFindManySurveyQuestionGroup,
    useFindUniqueSurvey,
    useUpdateSurvey,
} from '@workspace/db/hooks'
import { Empty, Form, message, Tree, type TreeProps } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutSurveyType = Survey & {
    surveyQuestion: string[]
}

interface MyTreeNode {
    title: string
    key: string
    value?: string // nếu bạn muốn gán giá trị riêng
    children?: MyTreeNode[]
}
const PutSurveyExamModal = () => {
    const [form] = Form.useForm<PutSurveyType>()

    const { isOpen, onClose, input } = useDisclosure<{ id: string; surveyTopicId: string }>({
        tag: PutSurveyExamModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: create } = useCreateSurvey()
    const { mutateAsync: update } = useUpdateSurvey()

    async function onOk(output?: PutSurveyType) {
        if (!output) return
        try {
            showSpinner()
            if (input?.id) {
                await update({
                    data: {
                        surveyQuestion: {
                            set: output.surveyQuestion.map((i) => ({ id: i })),
                        },
                    },
                    where: {
                        id: input?.id,
                    },
                })
                message.success('Cập nhật thành công')
            }
            // onClose()
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { data: surveyQuestionGroup = [] } = useFindManySurveyQuestionGroup(
        {
            where: { surveyTopicId: input?.surveyTopicId },
            include: {
                surveyTopic: true,
                surveyQuestion: true,
            },
            orderBy: { name: 'asc' },
        },
        {
            enabled: !!input?.surveyTopicId,
        }
    )

    const treeData = surveyQuestionGroup.map((item) => ({
        title: item.name,
        key: item.id,
        children: item.surveyQuestion.map((i: SurveyQuestion) => ({
            title: i.name,
            key: i.id,
        })),
        disabled: item.surveyQuestion.length === 0,
    }))

    const onCheck: TreeProps['onCheck'] = (checkedKeys, info) => {
        // info.checkedNodes: (DataNode & { children?: DataNode[] })[]
        const onlyLeafValues = (info.checkedNodes as MyTreeNode[])
            .filter((node) => !node.children?.length) // chỉ lấy node không có children
            .map((node) => node.value ?? node.key) // lấy value nếu có, không thì lấy key

        form.setFieldValue('surveyQuestion', onlyLeafValues)
    }

    const { data: survey } = useFindUniqueSurvey(
        {
            where: { id: input?.id },
            include: {
                surveyQuestion: true,
            },
        },
        {
            enabled: !!input?.id,
        }
    )

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (survey) {
            form.setFieldsValue({
                ...survey,
                surveyQuestion: survey?.surveyQuestion.map((i) => i.id),
            })
        }
    }, [survey])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={input?.id ? 'Chỉnh sửa đề khảo sát' : 'Thêm mới đề khảo sát'}
            className="w-[1000px]"
        >
            <div className="w-full px-8 mt-3">
                <div className="mb-4 text-base font-[500]">Danh sách câu hỏi khảo sát</div>
                {surveyQuestionGroup ? (
                    <FormItem
                        form={form}
                        name="surveyQuestion"
                        className="max-h-[800px] overflow-y-auto"
                    >
                        <Tree
                            treeData={treeData}
                            checkable={true}
                            defaultExpandAll={true}
                            multiple={true}
                            blockNode
                            onCheck={onCheck}
                        />
                    </FormItem>
                ) : (
                    <Empty />
                )}
            </div>
        </PutFormModal>
    )
}

export default PutSurveyExamModal
