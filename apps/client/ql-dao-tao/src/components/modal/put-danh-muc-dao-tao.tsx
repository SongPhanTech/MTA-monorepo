import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type {
    Curriculum,
    TrainingCourse,
    TrainingForm,
    TrainingTime,
} from '@workspace/db'
import {
    useCreateTrainingCourse,
    useFindUniqueTrainingCourse,
    useUpdateTrainingCourse,
    useFindManyTrainingType,
    useFindManyTrainingLevel,
    useFindUniqueCurriculum,
    useFindUniqueCurriculumVersion,
} from '@workspace/db/hooks'
import { Col, Collapse, Form, Input, message, Row, theme } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import Select from '@components/commons/select'
import dayjs from 'dayjs'
export type PutTrainingCourse = Curriculum
import 'dayjs/locale/vi'
import type { CSSProperties } from 'react'
import type React from 'react'
import type { CollapseProps } from 'antd'
import './index.css'
dayjs.locale('vi')

const PutTrainingProgramCatalog = () => {
    const [form] = Form.useForm<PutTrainingCourse>()
    const { token } = theme.useToken()

    const panelStyle: React.CSSProperties = {
        marginBottom: 16,
        background: token.colorFillAlter,
        borderRadius: token.borderRadiusLG,
    }
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutTrainingProgramCatalog.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { data: trainingLevelData = [], refetch: refetchLevel } =
        useFindManyTrainingLevel()

    const { data: trainingTimeData = [], refetch: refetchTime } =
        useFindManyTrainingType()

    const { mutateAsync: createTrainingCourse } = useCreateTrainingCourse()
    const { mutateAsync: updateTrainingCourse } = useUpdateTrainingCourse()
    async function onOk(output?: PutTrainingCourse) {
        if (!output) return
        try {
            showSpinner()
            if (id) {
                await updateTrainingCourse({
                    data: {
                        code: output.code,
                        name: output.name,
                        description: output.description,
                        startDate: output.startDate,
                        endDate: output.endDate,
                        trainingObjectTypeId: output.trainingObjectTypeId,
                        // trainingTypeId: output.trainingTypeId,
                        // trainingFormId: output.trainingFormId,
                        trainingLevelId: output.trainingLevelId,
                    },
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createTrainingCourse({
                    data: {
                        code: output.code,
                        name: output.name,
                        description: output.description,
                        startDate: output.startDate,
                        endDate: output.endDate,
                        trainingObjectTypeId: output.trainingObjectTypeId,
                        // trainingTypeId: output.trainingTypeId,
                        // trainingFormId: output.trainingFormId,
                        trainingLevelId: output.trainingLevelId,
                    },
                })
                message.success('Thêm mới thành công')
            }
            queryClient.invalidateQueries({
                queryKey: ['TrainingCourse'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { data: level } = useFindUniqueCurriculumVersion({
        where: { id },
    })
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (level) {
            form.setFieldsValue({
                ...level,
                // startDate: dayjs(level.startDate),
                // endDate: level.endDate ? dayjs(level.endDate) : undefined,
            })
        }
    }, [level])

    const Panel1 = (
        <>
            <Row gutter={[16, 16]}>
                <Col span={12}>
                    <FormItem
                        form={form}
                        name="trainingObjectTypeId"
                        label="Tên CTĐT"
                    >
                        <Input placeholder="Nhập tên CTĐT" />
                    </FormItem>
                </Col>
                <Col span={12}>
                    <FormItem
                        form={form}
                        name="trainingObjectTypeId"
                        label="Trình độ đào tạo"
                    >
                        <Select
                            placeholder="Chọn trình độ đào tạo"
                            options={trainingLevelData?.map(
                                (i: TrainingForm) => ({
                                    value: i.id,
                                    label: i.name,
                                })
                            )}
                            // onChange={(val) =>
                            //     handleFilterChange(
                            //         'trainingLevelId',
                            //         val
                            //     )
                            // }
                            allowClear
                        />
                    </FormItem>
                </Col>
            </Row>
            <Row gutter={[16, 16]}>
                <Col span={12}>
                    <FormItem
                        form={form}
                        name="trainingFormId"
                        label="Thời gian đào tạo"
                    >
                        <Select
                            placeholder="Chọn thời gian đào tạo"
                            options={trainingTimeData?.map(
                                (i: TrainingTime) => ({
                                    value: i.id,
                                    label: i.name,
                                })
                            )}
                            // onChange={(val) =>
                            //     handleFilterChange(
                            //         'trainingFormId',
                            //         val
                            //     )
                            // }
                            allowClear
                        />
                    </FormItem>
                </Col>
                <Col span={12}>
                    <FormItem
                        form={form}
                        name="trainingLanguage"
                        label="Ngôn ngữ đào tạo"
                    >
                        <Input placeholder="Nhập ngôn ngữ đào tạo" />
                    </FormItem>
                </Col>
            </Row>
            <Row gutter={[16, 16]}>
                <Col span={12}>
                    <FormItem
                        form={form}
                        name="trainingObjectTypeId"
                        label="Ngành đào tạo"
                    >
                        <Input placeholder="Nhập ngành đào tạo" />
                    </FormItem>
                </Col>
                <Col span={12}>
                    <FormItem
                        form={form}
                        name="trainingObjectTypeId"
                        label="Chuyên ngành"
                    >
                        <Input placeholder="Nhập chuyên ngành" />
                    </FormItem>
                </Col>
            </Row>
            <Row gutter={[16, 16]}>
                <Col span={12}>
                    <FormItem
                        form={form}
                        name="trainingObjectTypeId"
                        label="Số tín chỉ"
                    >
                        <Input placeholder="Nhập số tín chỉ" />
                    </FormItem>
                </Col>
                <Col span={12}>
                    <FormItem
                        form={form}
                        name="trainingObjectTypeId"
                        label="Cơ sở cấp bằng"
                    >
                        <Input placeholder="Nhập cơ sở cấp bằng" />
                    </FormItem>
                </Col>
            </Row>
        </>
    )

    const Panel2 = (
        <>
            <FormItem form={form} name="description">
                <Input.TextArea placeholder="Nhập mục tiêu đào tạo" />
            </FormItem>
        </>
    )

    const Panel3 = (
        <>
            <FormItem form={form} name="description">
                <Input.TextArea placeholder="Nhập chuẩn đầu ra về kiến thức (KT)" />
            </FormItem>
            <FormItem form={form} name="description">
                <Input.TextArea placeholder="Nhập chuẩn đầu ra về kỹ năng (KN)" />
            </FormItem>
            <FormItem form={form} name="description">
                <Input.TextArea placeholder="Nhập chuẩn đầu ra về thái độ (MC)" />
            </FormItem>
            <FormItem form={form} name="description">
                <Input.TextArea placeholder="Nhập chuẩn đầu ra về năng lực (PC)" />
            </FormItem>
        </>
    )

    const getItems: (panelStyle: CSSProperties) => CollapseProps['items'] = (
        panelStyle
    ) => [
        {
            key: '1',
            label: 'Thông tin chung',
            children: <>{Panel1}</>,
            style: panelStyle,
        },
        {
            key: '2',
            label: 'Mục tiêu đào tạo',
            children: <>{Panel2}</>,
            style: panelStyle,
        },
        {
            key: '3',
            label: 'Chuẩn đầu ra',
            children: <>{Panel3}</>,
            style: panelStyle,
        },
    ]

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={
                id
                    ? 'Sửa danh mục chương trình đào tạo'
                    : 'Thêm danh mục chương trình đào tạo'
            }
            className="w-[60vw]"
        >
            <Collapse
                bordered={false}
                defaultActiveKey={['1']}
                style={{ background: token.colorBgContainer }}
                items={getItems(panelStyle)}
                className="w-full"
            />
            <style>
                {`
                .ant-collapse-header-text {
                    color: #374151;
                    font-size: 16px;
                    font-weight: 600;
                }
            `}
            </style>
        </PutFormModal>
    )
}

export default PutTrainingProgramCatalog
