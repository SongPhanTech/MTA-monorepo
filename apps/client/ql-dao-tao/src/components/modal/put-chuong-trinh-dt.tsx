import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type {
    Curriculum,
    SchoolYear,
    TrainingForm,
    TrainingLevel,
    TrainingType,
    TrainingObjectType,
    TrainingTime,
    TrainingMajor,
} from '@workspace/db'
import {
    useCreateCurriculum,
    useFindUniqueCurriculum,
    useFindManySchoolYear,
    useFindManyCurriculum,
    useUpdateCurriculum,
    useFindManyTrainingForm,
    useFindManyTrainingType,
    useFindManyTrainingObjectType,
    useFindManyTrainingLevel,
    useFindManyOrganization,
    useFindManyTrainingTime,
    useFindManyTrainingMajor,
} from '@workspace/db/hooks'
import { Col, Form, Input, message, TreeSelect } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import Select from '@components/commons/select'
import DatePicker from '@components/commons/date-picker'
import dayjs from 'dayjs'
export type PutCurriculum = Curriculum
import { buildOrgTree } from '@lib/utils'

import 'dayjs/locale/vi'
dayjs.locale('vi')
const PutCurriculumModal = () => {
    const [form] = Form.useForm<PutCurriculum>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutCurriculumModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { data: trainingFormData = [], refetch: refetchForm } =
        useFindManyTrainingForm()

    const { data: trainingLevelData = [], refetch: refetchLevel } =
        useFindManyTrainingLevel()
    const { data: trainingObjectTypeData = [], refetch: refetchObjectType } =
        useFindManyTrainingObjectType()
    const { data: trainingTimeData = [], refetch: refetchTrainingTime } =
        useFindManyTrainingTime()
    const { data: trainingMajorData = [], refetch: refetchTrainingMajor } =
        useFindManyTrainingMajor()
    const { data: manageOrgData = [], refetch: refetchManageOrg } =
        useFindManyOrganization()

    const { mutateAsync: createCurriculum } = useCreateCurriculum()
    const { mutateAsync: updateCurriculum } = useUpdateCurriculum()
    async function onOk(output?: PutCurriculum) {
        if (!output) return
        try {
            showSpinner()
            if (id) {
                await updateCurriculum({
                    data: {
                        name: output.name,
                        startDate: output.startDate,
                        endDate: output.endDate,
                        managementOrganizationId:
                            output.managementOrganizationId,
                        trainingObjectTypeId: output.trainingObjectTypeId,
                        trainingTimeId: output.trainingTimeId,
                        trainingLevelId: output.trainingLevelId,
                        trainingMajorId: output.trainingMajorId,
                        infomation: output.infomation,
                        documentPath: output.documentPath,
                        renderPath: output.renderPath,
                    },
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createCurriculum({
                    data: {
                        name: output.name,
                        startDate: output.startDate,
                        endDate: output.endDate,
                        managementOrganizationId:
                            output.managementOrganizationId,
                        trainingObjectTypeId: output.trainingObjectTypeId,
                        trainingTimeId: output.trainingTimeId,
                        trainingLevelId: output.trainingLevelId,
                        trainingMajorId: output.trainingMajorId,
                        infomation: output.infomation,
                        documentPath: output.documentPath,
                        renderPath: output.renderPath,
                    },
                })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['Curriculum'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { data: level } = useFindUniqueCurriculum({
        where: { id },
    })
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (level) {
            form.setFieldsValue({
                ...level,
                startDate: dayjs(level.startDate),
                endDate: level.endDate ? dayjs(level.endDate) : undefined,
            })
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
            title={
                id
                    ? 'Chỉnh sửa chương trình đào tạo'
                    : 'Thêm mới chương trình đào tạo'
            }
            className="w-[45vw]"
        >
            <Col span={12}>
                <FormItem
                    form={form}
                    name="name"
                    label="Tên chương trình đào tạo"
                    required
                >
                    <Input placeholder="Nhập tên chương trình đào tạo" />
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
                    name="trainingObjectTypeId"
                    label="Đối tượng đào tạo"
                    required
                >
                    <Select
                        placeholder="Chọn đối tượng đào tạo"
                        options={trainingObjectTypeData.map(
                            (i: TrainingObjectType) => {
                                return {
                                    value: i.id,
                                    label: i.name,
                                }
                            }
                        )}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="trainingLevelId"
                    label="Bậc đào tạo"
                    required
                >
                    <Select
                        placeholder="Chọn bậc đào tạo"
                        options={trainingLevelData.map((i: TrainingLevel) => {
                            return {
                                value: i.id,
                                label: i.name,
                            }
                        })}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="trainingTimeId"
                    label="Thời gian đào tạo"
                    required
                >
                    <Select
                        placeholder="Chọn thời gian đào tạo"
                        options={trainingTimeData.map((i: TrainingTime) => {
                            return {
                                value: i.id,
                                label: i.name,
                            }
                        })}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="trainingMajorId"
                    label="Chuyên ngành đào tạo"
                    required
                >
                    <Select
                        placeholder="Chọn chuyên ngành đào tạo"
                        options={trainingMajorData.map((i: TrainingMajor) => {
                            return {
                                value: i.id,
                                label: i.name,
                            }
                        })}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="startDate"
                    label="Ngày bắt đầu"
                    required
                >
                    <DatePicker format="DD/MM/YYYY" className="w-full" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="endDate" label="Ngày kết thúc">
                    <DatePicker format="DD/MM/YYYY" className="w-full" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem
                    form={form}
                    name="infomation"
                    label="Thông tin"
                    required
                >
                    <Input.TextArea placeholder="Nhập thông tin" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="documentPath"
                    label="Đường dẫn tài liệu"
                >
                    <Input placeholder="Nhập đường dẫn tài liệu" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="renderPath"
                    label="Đường dẫn tài liệu kết xuất"
                >
                    <Input placeholder="Nhập đường dẫn tài liệu kết xuất" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutCurriculumModal
