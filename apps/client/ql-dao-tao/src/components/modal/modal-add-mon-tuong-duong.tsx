import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { EquivalencySide, SubjectInGroup } from '@workspace/db'
import {
    useCreateSubjectInGroup,
    useFindManySubject,
    useFindUniqueSubjectVersion,
} from '@workspace/db/hooks'
import { Col, Form, message, TreeSelect } from 'antd'
import dayjs from 'dayjs'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import type { DataNode } from 'antd/es/tree'
export type PutMonHocTuongDuongFormType = SubjectInGroup
dayjs.locale('vi')
const PutMonHocTuongDuong = () => {
    const [form] = Form.useForm<PutMonHocTuongDuongFormType>()
    const { isOpen, onClose, input } = useDisclosure<{
        subjectVersionId: string
        equivalencyGroupId: string
        side: EquivalencySide
    }>({
        tag: PutMonHocTuongDuong.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()
    const { mutateAsync: createSubjectInGroup } = useCreateSubjectInGroup()
    async function onOk(output?: PutMonHocTuongDuongFormType) {
        if (!output) return
        try {
            showSpinner()
            if (!input?.equivalencyGroupId) {
                message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
                hideSpinner()
                return
            }
            const data = {
                side: input?.side as EquivalencySide,
                equivalencyGroupId: input?.equivalencyGroupId,
                subjectId: output?.subjectId,
            }
            await createSubjectInGroup({
                data: data,
            })
            message.success('Thêm mới thành công')
            queryClient.invalidateQueries({
                queryKey: ['SubjectInGroup'],
            })
            onClose()
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { data: subjectVersionData = [] } = useFindManySubject({
        include: { subjectVersion: true },
    })

    const { data } = useFindUniqueSubjectVersion(
        {
            where: {
                id: input?.subjectVersionId,
            },
            include: {
                equivalencyGroups: {
                    include: {
                        equivalencyGroup: {
                            include: {
                                subjects: {
                                    include: { subject: { select: { name: true, id: true } } },
                                },
                            },
                        },
                    },
                },
            },
        },
        {
            enabled: !!input?.subjectVersionId,
        }
    )

    const existedSubjectVersionIds =
        data?.equivalencyGroups?.flatMap((g) =>
            g.equivalencyGroup?.subjects?.map((s) => s.subject.id)
        ) ?? []

    const treeData: DataNode[] = subjectVersionData
        .map((subject) => {
            const children: DataNode[] = subject.subjectVersion
                .filter((sv) => !existedSubjectVersionIds.includes(sv.id))
                .map((sv) => ({
                    key: sv.id,
                    value: sv.id,
                    title: [subject.code, subject.name].filter(Boolean).join(' - '),
                }))

            if (children.length === 0) return null

            return {
                key: subject.id,
                value: subject.id,
                title: [subject.code, subject.name].filter(Boolean).join(' - '),
                selectable: false,
                children,
            } as DataNode
        })
        .filter((item): item is DataNode => item !== null)

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={'Thêm môn học'}
            className="w-[30vw]"
        >
            <Col span={24}>
                <FormItem form={form} name="subjectId" label="Môn học" required>
                    <TreeSelect
                        placeholder="Chọn môn học"
                        treeData={treeData}
                        allowClear
                        treeDefaultExpandAll
                        style={{ width: '100%' }}
                        showSearch
                    />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutMonHocTuongDuong
