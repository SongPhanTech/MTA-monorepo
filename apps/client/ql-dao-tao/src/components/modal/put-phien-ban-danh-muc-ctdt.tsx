import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import { TrainingLanguage } from '@workspace/db'
import type {
    TrainingObjectType,
    CurriculumVersion,
    TrainingForm,
    TrainingTime,
    DiplomaType,
} from '@workspace/db'
import {
    useFindManyTrainingLevel,
    useFindUniqueCurriculumVersion,
    useFindManyTrainingObjectType,
    useFindManyDiplomaType,
    useCreateCurriculumVersion,
    useUpdateCurriculumVersion,
    useFindManyTrainingTime,
} from '@workspace/db/hooks'
import { Col, Form, Input, InputNumber, message, Switch } from 'antd'
import { useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import Select from '@components/commons/select'
import dayjs from 'dayjs'
export type PutCurriculumVersion = CurriculumVersion
import 'dayjs/locale/vi'
import type React from 'react'
import './index.css'
import { useTrainingLanguageOptions } from '@hooks/trainingLanguage'
import DocumentPaths from '@components/commons/documentPaths'
import Tabs from '@components/commons/tabar'
dayjs.locale('vi')

type CurriculumVersionInput = {
    curriculumId: string
    versionId: string
}

const PutCurriculumVersion = () => {
    const [document, setDocument] = useState<string[]>([])
    const [form] = Form.useForm<PutCurriculumVersion>()
    const { options: trainingLanguageOptions } = useTrainingLanguageOptions()

    const { isOpen, onClose, input } = useDisclosure<CurriculumVersionInput>({
        tag: PutCurriculumVersion.name,
        onClose: form.resetFields,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { data: trainingLevelData = [] } = useFindManyTrainingLevel()

    const { data: trainingTimeData = [] } = useFindManyTrainingTime()

    const { data: trainingObjectTypeData = [] } =
        useFindManyTrainingObjectType()

    const { data: diplomaTypeData = [] } = useFindManyDiplomaType()

    const { mutateAsync: createCurriculumVersion } =
        useCreateCurriculumVersion()
    const { mutateAsync: updateCurriculumVersion } =
        useUpdateCurriculumVersion()
    async function onOk(output?: PutCurriculumVersion) {
        if (!output) return
        try {
            showSpinner()
            const data = {
                curriculumId: input?.curriculumId,
                code: output.code,
                name: output.name,
                shortName: output?.shortName,
                englishName: output.englishName,
                trainingLanguage: output.trainingLanguage,
                yearCreation: output.yearCreation,
                yearApplication: output.yearApplication,
                trainingObjectTypeId: output.trainingObjectTypeId,
                trainingLevelId: output.trainingLevelId,
                trainingTimeId: output.trainingTimeId,
                coef_1: output.coef_1,
                coef_2: output.coef_2,
                coef_3: output.coef_3,
                diplomaTypeId: output.diplomaTypeId,
                scoreToTakeExam: output.scoreToTakeExam,
                scoreToPass: output.scoreToPass,
                description: output.description,
                documentPaths: output.documentPaths,
                active: output.active,
                electiveCredits: output.electiveCredits,
                requiredCredits: output.requiredCredits,
            }
            if (input?.versionId) {
                await updateCurriculumVersion({
                    data: data,
                    where: {
                        id: input?.versionId,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                if (!input?.curriculumId) {
                    message.error(
                        'Thiếu curriculumId, không thể tạo phiên bản chương trình đào tạo'
                    )
                    return
                }
                await createCurriculumVersion({
                    data: data,
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

    const { data: initialValue } = useFindUniqueCurriculumVersion({
        where: { id: input?.versionId },
    })
    const [active, setActive] = useState(true)

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (initialValue) {
            form.setFieldsValue({
                ...initialValue,
            })
            setDocument(initialValue?.documentPaths)
            setActive(initialValue?.active)
        }
    }, [initialValue])

    const handleChange = (checked: boolean) => {
        setActive(checked)
        form.setFieldsValue({ active: checked })
    }

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={
                input?.versionId
                    ? 'Sửa phiên bản chương trình đào tạo'
                    : 'Thêm phiên bản chương trình đào tạo'
            }
            className="w-[60vw]"
        >
            <Col span={12}>
                <FormItem form={form} name="code" label="Mã phiên bản">
                    <Input placeholder="Nhập mã phiên bản CTĐT" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="name"
                    label="Tên phiên bản (tiếng việt)"
                    required
                >
                    <Input placeholder="Nhập tên phiên bản (tiếng việt)" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="englishName"
                    label="Tên phiên bản (tiếng anh)"
                >
                    <Input placeholder="Nhập tên phiên bản (tiếng anh)" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="shortName" label="Tên viết tắt">
                    <Input placeholder="Nhập tên viết tắt" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    label="Ngôn ngữ đào tạo"
                    name="trainingLanguage"
                >
                    <Select
                        placeholder="Chọn ngôn ngữ đào tạo"
                        options={trainingLanguageOptions}
                        allowClear
                        defaultValue={TrainingLanguage.Vietnamese}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="yearCreation" label="Năm tạo">
                    <InputNumber
                        placeholder="Nhập năm tạo"
                        className="w-full"
                        step={1}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="yearApplication"
                    label="Năm áp dụng"
                >
                    <InputNumber
                        placeholder="Nhập năm áp dụng"
                        className="w-full"
                        step={1}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    label="Đối tượng đào tạo"
                    name="trainingObjectTypeId"
                    required
                >
                    <Select
                        placeholder="Chọn đối tượng đào tạo"
                        options={trainingObjectTypeData.map(
                            (i: TrainingObjectType) => ({
                                value: i.id,
                                label: i.name,
                            })
                        )}
                        allowClear
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    label="Trình độ đào tạo"
                    name="trainingLevelId"
                    required
                >
                    <Select
                        placeholder="Chọn trình độ đào tạo"
                        options={trainingLevelData.map((i: TrainingForm) => ({
                            value: i.id,
                            label: i.name,
                        }))}
                        allowClear
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    label="Thời gian đào tạo"
                    name="trainingTimeId"
                    required
                >
                    <Select
                        placeholder="Chọn thời gian đào tạo"
                        options={trainingTimeData.map((i: TrainingTime) => ({
                            value: i.id,
                            label: i.name,
                        }))}
                        allowClear
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="coef_1"
                    label="Hệ số điểm chuyên cần"
                >
                    <InputNumber
                        placeholder="Nhập hệ số điểm chuyên cần"
                        className="w-full"
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="coef_2"
                    label="Hệ số điểm thường xuyên"
                >
                    <InputNumber
                        placeholder="Nhập hệ số điểm thường xuyên"
                        className="w-full"
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="coef_3" label="Hệ số điểm điểm thi">
                    <InputNumber
                        placeholder="Nhập hệ số điểm điểm thi"
                        className="w-full"
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="diplomaTypeId"
                    label="Loại văn bằng"
                >
                    <Select
                        placeholder="Chọn loại văn bằng"
                        options={diplomaTypeData.map((i: DiplomaType) => ({
                            value: i.id,
                            label: i.name,
                        }))}
                        allowClear
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="scoreToTakeExam"
                    label="Điểm tối thiểu được thi"
                >
                    <InputNumber
                        placeholder="Nhập điểm tối thiểu được thi"
                        className="w-full"
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="scoreToPass"
                    label="Điểm tối thiểu để qua"
                >
                    <InputNumber
                        placeholder="Nhập điểm tối thiểu để qua"
                        className="w-full"
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="requiredCredits"
                    label="Số tín chỉ bắt buộc"
                >
                    <InputNumber
                        placeholder="Nhập số tín chỉ bắt buộc"
                        className="w-full"
                        step={1}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="electiveCredits"
                    label="Số tín chỉ tự chọn"
                >
                    <InputNumber
                        placeholder="Nhập số tín chỉ tự chọn"
                        className="w-full"
                        step={1}
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem
                    form={form}
                    name="documentPaths"
                    label="Tài liệu đính kèm"
                >
                    <DocumentPaths form={form} data={document} />
                </FormItem>
            </Col>
            <Tabs
                items={[
                    {
                        key: '1',
                        label: 'Vị trí công việc',
                        children: (
                            <FormItem
                                form={form}
                                name="description"
                                label="Mô tả"
                            >
                                <Input.TextArea placeholder="Nhập mô tả" />
                            </FormItem>
                        ),
                    },
                    {
                        key: '2',
                        label: 'Mục tiêu',
                        children: 'Content of Tab Pane 2',
                    },
                    {
                        key: '3',
                        label: 'Chuẩn đầu ra',
                        children: 'Content of Tab Pane 3',
                    },
                    {
                        key: '4',
                        label: 'Chuẩn đầu vào',
                        children: 'Content of Tab Pane 3',
                    },
                    {
                        key: '5',
                        label: 'Thời gian đào tạo',
                        children: 'Content of Tab Pane 3',
                    },
                    {
                        key: '6',
                        label: 'Cấu trúc chương trình đào tạo',
                        children: 'Content of Tab Pane 3',
                    },
                    {
                        key: '7',
                        label: 'Ma trận chuẩn đầu ra',
                        children: 'Content of Tab Pane 3',
                    },
                    {
                        key: '8',
                        label: 'Mô tả tóm tắt nội dung các học phần',
                        children: 'Content of Tab Pane 3',
                    },
                    {
                        key: '9',
                        label: 'Sơ đồ liên hệ',
                        children: 'Content of Tab Pane 3',
                    },
                    {
                        key: '10',
                        label: 'Hướng dẫn thực hiện',
                        children: 'Content of Tab Pane 3',
                    },
                ]}
            />
            {input?.versionId && (
                <Col span={12} className="flex items-center">
                    <FormItem
                        form={form}
                        name="active"
                        label=""
                        valuePropName="checked"
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                            }}
                        >
                            <Switch checked={active} onChange={handleChange} />
                            <span>
                                {active ? 'Đang đào tạo' : 'Ngừng đào tạo'}
                            </span>
                        </div>
                    </FormItem>
                </Col>
            )}
        </PutFormModal>
    )
}

export default PutCurriculumVersion
