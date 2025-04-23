import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { Subject, SubjectGroup } from '@workspace/db'
import {
    useCreateSubject,
    useFindManyOrganization,
    useFindManySubjectGroup,
    useFindUniqueSubject,
    useUpdateSubject,
} from '@workspace/db/hooks'
import { Col, Form, Input, message, TreeSelect } from 'antd'
import DatePicker from '@components/commons/date-picker'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import dayjs from 'dayjs'
export type PutSubjectFormType = Subject
import 'dayjs/locale/vi'
import { buildOrgTree } from '@lib/utils'
import Select from '@components/commons/select'
import { SUBJECT_EQUIVALENT_TYPE } from '@constants/constants'

dayjs.locale('vi')
const PutSubjectModal = () => {
    const [form] = Form.useForm<PutSubjectFormType>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutSubjectModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createSubject } = useCreateSubject()
    const { mutateAsync: updateSubject } = useUpdateSubject()
    async function onOk(output?: PutSubjectFormType) {
        if (!output) return
        try {
            showSpinner()
            if (id) {
                await updateSubject({
                    data: {
                        name: output.name,
                        managementOrganizationId:
                            output.managementOrganizationId,
                        subjectEquivalentType: output.subjectEquivalentType,
                        credit: +output.credit,
                        period: +output.period,
                        numberOfTheory: +output.numberOfTheory,
                        numberOfPractice: +output.numberOfPractice,
                        numberOfSelfStudy: +output.numberOfSelfStudy,
                        numberOfProject: +output.numberOfProject,
                        numberOfInternship: +output.numberOfInternship,
                        numberOfOther: +output.numberOfOther,
                        subjectGroupId: output.subjectGroupId,
                    },
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createSubject({
                    data: {
                        name: output.name,
                        managementOrganizationId:
                            output.managementOrganizationId,
                        subjectEquivalentType: output.subjectEquivalentType,
                        credit: +output.credit,
                        period: +output.period,
                        numberOfTheory: +output.numberOfTheory,
                        numberOfPractice: +output.numberOfPractice,
                        numberOfSelfStudy: +output.numberOfSelfStudy,
                        numberOfProject: +output.numberOfProject,
                        numberOfInternship: +output.numberOfInternship,
                        numberOfOther: +output.numberOfOther,
                        subjectGroupId: output.subjectGroupId,
                    },
                })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['Subject'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { data: level } = useFindUniqueSubject({
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
            title={id ? 'Chỉnh sửa môn học' : 'Thêm mới môn học'}
            className="w-[40vw]"
        >
            <Col span={12}>
                <FormItem form={form} name="name" label="Tên môn học" required>
                    <Input placeholder="Nhập tên môn học" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="managementOrganizationId"
                    label="Đơn vị phụ trách"
                    required
                >
                    <TreeSelect
                        placeholder="Chọn đơn vị phụ trách"
                        allowClear
                        showSearch
                        treeDefaultExpandAll
                        treeData={treeData}
                        filterTreeNode={(input, node) =>
                            (node.title as string)
                                .toLowerCase()
                                .includes(input.toLowerCase())
                        }
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="subjectGroupId"
                    label="Nhóm môn học"
                    normalize={(value) => (value === undefined ? null : value)}
                    required
                >
                    <Select
                        allowClear
                        placeholder="Chọn nhóm môn học"
                        options={subjectGroupData.map((item: SubjectGroup) => {
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
                    name="subjectEquivalentType"
                    label="Loại môn học tương đương"
                    normalize={(value) => (value === undefined ? null : value)}
                    required
                >
                    <Select
                        allowClear
                        placeholder="Chọn loại môn học tương đương"
                        options={Object.entries(SUBJECT_EQUIVALENT_TYPE).map(
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
                <FormItem form={form} name="credit" label="Số tín chỉ" required>
                    <Input placeholder="Nhập số tín chỉ" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="period" label="Số tiết" required>
                    <Input placeholder="Nhập số tiết" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="numberOfTheory"
                    label="Số tiết lý thuyết"
                    required
                >
                    <Input placeholder="Nhập số tiết lý thuyết" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="numberOfPractice"
                    label="Số tiết thực hành"
                    required
                >
                    <Input placeholder="Nhập số tiết thực hành" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="numberOfSelfStudy"
                    label="Số tiết tự học"
                    required
                >
                    <Input placeholder="Nhập số tiết tự học" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="numberOfProject"
                    label="Số tiết đồ án"
                    required
                >
                    <Input placeholder="Nhập số tiết đồ án" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="numberOfInternship"
                    label="Số tiết thực tập"
                    required
                >
                    <Input placeholder="Nhập số tiết thực tập" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="numberOfOther"
                    label="Số tiết khác"
                    required
                >
                    <Input placeholder="Nhập số tiết khác" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutSubjectModal
