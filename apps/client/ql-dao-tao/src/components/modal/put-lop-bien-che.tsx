import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { FixedClass, TrainingCourse, Organization } from '@workspace/db'
import {
    useCreateFixedClass,
    useFindUniqueFixedClass,
    useFindManyFixedClass,
    useUpdateFixedClass,
    useFindManyOrganization,
    useFindManyTrainingCourse,
} from '@workspace/db/hooks'
import { Col, Form, Input, message, TreeSelect } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import Select from '@components/commons/select'
import DatePicker from '@components/commons/date-picker'
import dayjs from 'dayjs'
export type PutFixedClass = FixedClass
import 'dayjs/locale/vi'
import { buildOrgTree } from '@lib/utils'
dayjs.locale('vi')
const PutFixedClassModal = () => {
    const [form] = Form.useForm<PutFixedClass>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutFixedClassModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { data: manageOrgData = [], refetch: refetchManageOrg } =
        useFindManyOrganization({
            take: 1000,
            skip: 0,
        })

    const { data: trainingCourseData = [], refetch: refetchTrainingCourse } =
        useFindManyTrainingCourse({
            take: 1000,
            skip: 0,
        })

    const { data: organizations = [], refetch: refetchFixedClasss } =
        useFindManyFixedClass({
            take: 1000,
            skip: 0,
        })

    const { mutateAsync: createFixedClass } = useCreateFixedClass()
    const { mutateAsync: updateFixedClass } = useUpdateFixedClass()
    async function onOk(output?: PutFixedClass) {
        if (!output) return
        try {
            showSpinner()
            if (id) {
                await updateFixedClass({
                    data: {
                        code: output.code,
                        name: output.name,
                        description: output.description,
                        trainingCourseId: output.trainingCourseId,
                        managementOrganizationId:
                            output.managementOrganizationId,
                    },
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createFixedClass({
                    data: {
                        code: output.code,
                        name: output.name,
                        description: output.description,
                        trainingCourseId: output.trainingCourseId,
                        managementOrganizationId:
                            output.managementOrganizationId,
                    },
                })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['FixedClass'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { data: level } = useFindUniqueFixedClass({
        where: { id },
    })
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (level) {
            form.setFieldsValue(level)
        }
    }, [level])
    const treeData = buildOrgTree(manageOrgData)

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={id ? 'Chỉnh sửa lớp biên chế' : 'Thêm mới lớp biên chế'}
            className="w-[30vw]"
        >
            <Col span={24}>
                <FormItem
                    form={form}
                    name="code"
                    label="Mã lớp biên chế"
                    required
                >
                    <Input placeholder="Nhập mã lớp biên chế" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem
                    form={form}
                    name="name"
                    label="Tên lớp biên chế"
                    required
                >
                    <Input placeholder="Nhập tên lớp biên chế" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem
                    form={form}
                    name="trainingCourseId"
                    label="Khóa"
                    required
                >
                    <Select
                        placeholder="Chọn khóa"
                        options={trainingCourseData.map((i: TrainingCourse) => {
                            return {
                                value: i.id,
                                label: i.name,
                            }
                        })}
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem
                    form={form}
                    name="managementOrganizationId"
                    label="Đơn vị quản lý"
                    required
                >
                    <TreeSelect
                        placeholder="Chọn đơn vị quản lý"
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
            <Col span={24}>
                <FormItem form={form} name="description" label="Mô tả">
                    <Input.TextArea placeholder="Nhập mô tả" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutFixedClassModal
