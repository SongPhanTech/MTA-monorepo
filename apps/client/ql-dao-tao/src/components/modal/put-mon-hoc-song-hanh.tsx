import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type {
    CurriculumVersionSubject,
    PrerequisiteSubject,
    Subject,
    SubjectGroup,
    TrainingBlock,
} from '@workspace/db'
import {
    useCreateCurriculumVersionSubject,
    useCreatePrerequisiteSubject,
    useCreateSubject,
    useFindManyOrganization,
    useFindManySubject,
    useFindManySubjectGroup,
    useFindManyTrainingBlock,
    useFindUniqueCurriculumVersionSubject,
    useFindUniquePrerequisiteSubject,
    useFindUniqueSubject,
    useUpdateCurriculumVersionSubject,
    useUpdatePrerequisiteSubject,
    useUpdateSubject,
} from '@workspace/db/hooks'
import { Col, Form, Input, message, TreeSelect } from 'antd'
import DatePicker from '@components/commons/date-picker'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import dayjs from 'dayjs'
export type PutPrerequisiteSubject = PrerequisiteSubject
import 'dayjs/locale/vi'
import { buildOrgTree } from '@lib/utils'
import Select from '@components/commons/select'
import {
    LOAI_MON_HOC_CTDT,
    SUBJECT_EQUIVALENT_TYPE,
} from '@constants/constants'

dayjs.locale('vi')
const PutMonHocSongHanhModal = () => {
    const [form] = Form.useForm<PutPrerequisiteSubject>()
    const { isOpen, onClose, input } = useDisclosure<{
        curriculumVersionSubjectId?: string | null | undefined
        id?: string | null
    }>({
        tag: PutMonHocSongHanhModal.name,
        onClose: form.resetFields,
    })
    let curriculumVersionSubjectId: string | null | undefined
    let id: string | null | undefined

    if (input) {
        curriculumVersionSubjectId = input.curriculumVersionSubjectId
        id = input.id
    }
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createPrerequisiteSubject } =
        useCreatePrerequisiteSubject()
    const { mutateAsync: updatePrerequisiteSubject } =
        useUpdatePrerequisiteSubject()
    const { data: subjectData, refetch: refetchSubject } = useFindManySubject()
    useFindManyTrainingBlock()
    async function onOk(output?: PutPrerequisiteSubject) {
        if (!output) return
        try {
            showSpinner()
            if (id) {
                await updatePrerequisiteSubject({
                    data: {
                        curriculumVersionSubjectId:
                            curriculumVersionSubjectId || undefined,
                        subjectId: output.subjectId,
                    },
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createPrerequisiteSubject({
                    data: {
                        // biome-ignore lint/style/noNonNullAssertion: <explanation>
                        curriculumVersionSubjectId: curriculumVersionSubjectId!,
                        subjectId: output.subjectId,
                    },
                })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['CurriculumnVersionSubject'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { data: level } = useFindUniquePrerequisiteSubject({
        where: { id },
    })
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (level) {
            form.setFieldsValue(level)
        }
    }, [level])
    const { data: manageOrgData = [], refetch: refetchManageOrg } =
        useFindManyOrganization()
    const treeData = buildOrgTree(manageOrgData)
    const { data: subjectGroupData = [], refetch: refetchSGroup } =
        useFindManySubjectGroup()
    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={
                id
                    ? 'Chỉnh sửa môn học song hành'
                    : 'Thêm mới môn học song hành'
            }
            className="w-[35vw]"
        >
            <Col span={24}>
                <FormItem
                    form={form}
                    name="subjectId"
                    label="Môn học"
                    normalize={(value) => (value === undefined ? null : value)}
                    required
                >
                    <Select
                        allowClear
                        placeholder="Chọn môn học"
                        options={subjectData?.map((item: Subject) => {
                            return {
                                value: item.id,
                                label: item.name,
                            }
                        })}
                    />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutMonHocSongHanhModal
