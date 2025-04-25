import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type {
    CurriculumVersionSubject,
    Subject,
    SubjectGroup,
    TrainingBlock,
} from '@workspace/db'
import {
    useCreateCurriculumVersionSubject,
    useCreateSubject,
    useFindManyOrganization,
    useFindManySubject,
    useFindManySubjectGroup,
    useFindManyTrainingBlock,
    useFindUniqueCurriculumVersionSubject,
    useFindUniqueSubject,
    useUpdateCurriculumVersionSubject,
    useUpdateSubject,
} from '@workspace/db/hooks'
import { Col, Form, Input, message, TreeSelect } from 'antd'
import DatePicker from '@components/commons/date-picker'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import dayjs from 'dayjs'
export type PutCurriculumVersionSubject = CurriculumVersionSubject
import 'dayjs/locale/vi'
import { buildOrgTree } from '@lib/utils'
import Select from '@components/commons/select'
import {
    LOAI_MON_HOC_CTDT,
    SUBJECT_EQUIVALENT_TYPE,
} from '@constants/constants'

dayjs.locale('vi')
const PutMonHocChuongTrinhModal = () => {
    const [form] = Form.useForm<PutCurriculumVersionSubject>()
    const { isOpen, onClose, input } = useDisclosure<{
        curriculumVersionId?: string | null | undefined
        id?: string | null
    }>({
        tag: PutMonHocChuongTrinhModal.name,
        onClose: form.resetFields,
    })
    let curriculumVersionId: string | null | undefined
    let id: string | null | undefined

    if (input) {
        curriculumVersionId = input.curriculumVersionId
        id = input.id
    }
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createCurriculumVersionSubject } =
        useCreateCurriculumVersionSubject()
    const { mutateAsync: updateCurrriculumVersionSubject } =
        useUpdateCurriculumVersionSubject()
    const { data: subjectData, refetch: refetchSubject } = useFindManySubject()
    const { data: trainingBlockData, refetch: refetchTrainingBlockData } =
        useFindManyTrainingBlock()
    async function onOk(output?: PutCurriculumVersionSubject) {
        if (!output) return
        try {
            showSpinner()
            if (id) {
                await updateCurrriculumVersionSubject({
                    data: {
                        curriculumVersionId: curriculumVersionId || undefined,
                        subjectId: output.subjectId,
                        trainingBlockId: output.trainingBlockId,
                        type: output.type,
                        information: output.information,
                        documentPath: output.documentPath,
                        renderPath: output.renderPath,
                    },
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createCurriculumVersionSubject({
                    data: {
                        // biome-ignore lint/style/noNonNullAssertion: <explanation>
                        curriculumVersionId: curriculumVersionId!,
                        subjectId: output.subjectId,
                        trainingBlockId: output.trainingBlockId,
                        type: output.type,
                        information: output.information,
                        documentPath: output.documentPath,
                        renderPath: output.renderPath,
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

    const { data: level } = useFindUniqueCurriculumVersionSubject({
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
                    ? 'Chỉnh sửa môn học chương trình'
                    : 'Thêm mới môn học chương trình'
            }
            className="w-[40vw]"
        >
            <Col span={12}>
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
            <Col span={12}>
                <FormItem
                    form={form}
                    name="type"
                    label="Loại môn học"
                    normalize={(value) => (value === undefined ? null : value)}
                    required
                >
                    <Select
                        allowClear
                        placeholder="Chọn loại môn học"
                        options={Object.entries(LOAI_MON_HOC_CTDT).map(
                            ([key, value_]) => {
                                return {
                                    label: value_,
                                    value: key,
                                }
                            }
                        )}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="trainingBlockId"
                    label="Khối kiến thức"
                    normalize={(value) => (value === undefined ? null : value)}
                    // required
                >
                    <Select
                        allowClear
                        placeholder="Chọn khối kiến thức"
                        options={trainingBlockData?.map(
                            (item: TrainingBlock) => {
                                return {
                                    value: item.id,
                                    label: item.name,
                                }
                            }
                        )}
                    />
                </FormItem>
            </Col>

            <Col span={12}>
                <FormItem
                    form={form}
                    name="information"
                    label="Thông tin"
                    // required
                >
                    <Input placeholder="Nhập thông tin" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="documentPath"
                    label="Đường dẫn tài liệu"
                    // required
                >
                    <Input placeholder="Nhập đường dẫn tài liệu" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="renderPath"
                    label="Đường dẫn tài liệu kết xuất"
                    // required
                >
                    <Input placeholder="Nhập đường dẫn tài liệu kết xuất" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutMonHocChuongTrinhModal
