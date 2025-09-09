import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useSpinner from '@hooks/spinner'
import { buildOrgTree } from '@lib/utils'
import type { Subject, SubjectVersion } from '@workspace/db'
import {
    useCreateSubjectVersion,
    useFindManyDM_DonVi,
    useFindManySubject,
    useFindUniqueSubjectVersion,
    useUpdateSubjectVersion,
} from '@workspace/db/hooks'
import { Col, Form, Input, message, TreeSelect } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutSubjectFormType = SubjectVersion

dayjs.locale('vi')
const PutSubjectModal = () => {
    const [form] = Form.useForm<PutSubjectFormType>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: 'PutSubjectModal',
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: createSubjectVersion } = useCreateSubjectVersion()
    const { mutateAsync: updateSubjectVersion } = useUpdateSubjectVersion()
    async function onOk(output?: PutSubjectFormType) {
        if (!output) return
        try {
            showSpinner()
            if (id) {
                await updateSubjectVersion({
                    data: {
                        name: output.name,
                        managementOrganizationId: output.managementOrganizationId,
                        credit: +output.credit,
                        period: +output.period,
                        // numberOfTheory: +output.numberOfTheory,
                        // numberOfPractice: +output.numberOfPractice,
                        // numberOfSelfStudy: +output.numberOfSelfStudy,
                        // numberOfProject: +output.numberOfProject,
                        // numberOfInternship: +output.numberOfInternship,
                        // numberOfOther: +output.numberOfOther,
                    },
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                // await createSubjectVersion({
                //     data: {
                //         name: output.name,
                //         managementOrganizationId:
                //             output.managementOrganizationId,
                //         credit: +output.credit,
                //         period: +output.period,
                //         numberOfTheory: +output.numberOfTheory,
                //         numberOfPractice: +output.numberOfPractice,
                //         numberOfSelfStudy: +output.numberOfSelfStudy,
                //         numberOfProject: +output.numberOfProject,
                //         numberOfInternship: +output.numberOfInternship,
                //         numberOfOther: +output.numberOfOther,
                //     },
                // })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['Subject'],
            })
            onClose()
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { data: level } = useFindUniqueSubjectVersion({
        where: { id },
    })
    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (level) {
            form.setFieldsValue(level)
        }
    }, [level])
    const { data: manageOrgData = [], refetch: refetchManageOrg } = useFindManyDM_DonVi()
    const treeData = buildOrgTree(manageOrgData)
    const { data: subjectGroupData = [], refetch: refetchSGroup } = useFindManySubject()

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={id ? 'Chỉnh sửa môn học' : 'Thêm mới môn học'}
            className="w-[45vw]"
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
                        placeholder="Chọn đơn vị quản lý"
                        allowClear
                        showSearch
                        treeDefaultExpandAll
                        treeData={treeData}
                        filterTreeNode={(input, node) =>
                            (node?.label as string)?.toLowerCase()?.includes(input?.toLowerCase())
                        }
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="subjectId"
                    label="Nhóm môn học"
                    normalize={(value) => (value === undefined ? null : value)}
                    required
                >
                    <Select
                        allowClear
                        placeholder="Chọn nhóm môn học"
                        options={subjectGroupData.map((item: Subject) => {
                            return {
                                value: item.id,
                                label: item.name,
                            }
                        })}
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
                <FormItem form={form} name="numberOfTheory" label="Số tiết lý thuyết" required>
                    <Input placeholder="Nhập số tiết lý thuyết" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="numberOfPractice" label="Số tiết thực hành" required>
                    <Input placeholder="Nhập số tiết thực hành" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="numberOfSelfStudy" label="Số tiết tự học" required>
                    <Input placeholder="Nhập số tiết tự học" />
                </FormItem>
            </Col>
            {/* <Col span={12}>
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
            </Col> */}
            <Col span={12}>
                <FormItem form={form} name="numberOfOther" label="Số tiết khác" required>
                    <Input placeholder="Nhập số tiết khác" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutSubjectModal
