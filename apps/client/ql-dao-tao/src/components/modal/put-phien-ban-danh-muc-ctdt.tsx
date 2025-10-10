import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useSpinner from '@hooks/spinner'
import type {
    CurriculumVersion,
    DiplomaType,
    DocumentFile,
    TrainingForm,
    TrainingObjectType,
    TrainingTime,
} from '@workspace/db'
import {
    useCreateCurriculumVersion,
    useFindManyDiplomaType,
    useFindManyTrainingLanguage,
    useFindManyTrainingLevel,
    useFindManyTrainingObjectType,
    useFindManyTrainingTime,
    useFindUniqueCurriculumVersion,
    useUpdateCurriculumVersion,
} from '@workspace/db/hooks'
import { Col, Form, Input, InputNumber, message, Radio, Row } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import './index.css'
import DocumentPaths from '@components/commons/documentPaths'
import { RichTextEditor } from '@components/commons/rich-text-editor'
import Tabs from '@components/commons/tabar'
export type PutCurriculumVersion = CurriculumVersion & {
    documentFiles?: DocumentFile[]
}
dayjs.locale('vi')

type CurriculumVersionInput = {
    curriculumId: string
    versionId: string
}

const PutCurriculumVersion = () => {
    const [document, setDocument] = useState<DocumentFile[]>([])
    const [form] = Form.useForm<PutCurriculumVersion>()

    const { isOpen, onClose, input } = useDisclosure<CurriculumVersionInput>({
        tag: 'PutCurriculumVersion',
        onClose: form.resetFields,
    })

    const { showSpinner, hideSpinner } = useSpinner()

    const { data: trainingLevelData = [] } = useFindManyTrainingLevel()

    const { data: trainingTimeData = [] } = useFindManyTrainingTime()

    const { data: trainingObjectTypeData = [] } = useFindManyTrainingObjectType()

    const { data: diplomaTypeData = [] } = useFindManyDiplomaType()

    const { data: trainingLanguageData = [] } = useFindManyTrainingLanguage({
        where: { active: true },
        orderBy: { name: 'asc' },
    })

    const { mutateAsync: createCurriculumVersion } = useCreateCurriculumVersion()
    const { mutateAsync: updateCurriculumVersion } = useUpdateCurriculumVersion()
    async function onOk(output?: PutCurriculumVersion) {
        if (!output) return
        try {
            showSpinner()
            const baseData = {
                curriculumId: input?.curriculumId || '',
                code: output.code,
                name: output.name.trim(),
                shortName: output?.shortName,
                englishName: output.englishName,
                trainingLanguageId: output.trainingLanguageId,
                yearCreation: output.yearCreation,
                yearApplication: output.yearApplication,
                trainingObjectTypeId: output.trainingObjectTypeId,
                trainingLevelId: output.trainingLevelId,
                trainingTimeId: output.trainingTimeId,
                numberOfSemesters: output.numberOfSemesters,
                // coef_1: output.coef_1,
                // coef_2: output.coef_2,
                // coef_3: output.coef_3,
                diplomaTypeId: output.diplomaTypeId,
                // scoreToTakeExam: output.scoreToTakeExam,
                // scoreToPass: output.scoreToPass,
                description: output.description,
                active: output.active,
                electiveCredits: output.electiveCredits,
                requiredCredits: output.requiredCredits,
                jobPosition: output.jobPosition,
                objectives: output.objectives,
                learningOutcome: output.learningOutcome,
                inputStandard: output.inputStandard,
                time: output.time,
                structure: output.structure,
                matrixLearningOutcome: output.matrixLearningOutcome,
                summary: output.summary,
                learningDiagram: output.learningDiagram,
                guide: output.guide,
            }
            if (input?.versionId) {
                const updateData = {
                    ...baseData,
                    documentFiles: {
                        upsert: (output.documentFiles || [])
                            .filter((file) => !!file.id)
                            .map((file) => ({
                                where: { id: file.id },
                                create: {
                                    name: file.name,
                                    path: file.path,
                                    mimeType: file.mimeType,
                                    size: file.size,
                                    curriculumVersion: { connect: { id: input?.versionId } },
                                },
                                update: {
                                    name: file.name,
                                    path: file.path,
                                    mimeType: file.mimeType,
                                    size: file.size,
                                },
                            })),
                        create: (output.documentFiles || [])
                            .filter((file) => !file.id)
                            .map((file) => ({
                                name: file.name,
                                path: file.path,
                                mimeType: file.mimeType,
                                size: file.size,
                            })),
                        disconnect: document
                            .filter(
                                (existing) =>
                                    !output.documentFiles?.some((f) => f.id === existing.id)
                            )
                            .map((file) => ({ id: file.id })),
                    },
                }
                await updateCurriculumVersion({
                    data: updateData,
                    where: {
                        id: input?.versionId,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                if (!input?.curriculumId) {
                    message.error('Thiếu curriculumId, không thể tạo CTĐT toàn khóa')
                    return
                }
                await createCurriculumVersion({
                    data: {
                        ...baseData,
                        documentFiles: {
                            create: (output.documentFiles || []).map((file) => ({
                                name: file.name,
                                path: file.path,
                                mimeType: file.mimeType,
                                size: file.size,
                            })),
                        },
                    },
                })
                message.success('Thêm mới thành công')
            }
            queryClient.invalidateQueries({
                queryKey: ['TrainingCourse'],
            })
            onClose()
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { data: initialValue } = useFindUniqueCurriculumVersion(
        {
            where: { id: input?.versionId },
            include: {
                documentFiles: true,
            },
        },
        { enabled: !!input?.versionId }
    )

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (initialValue) {
            form.setFieldsValue({
                ...initialValue,
            })
            setDocument(initialValue?.documentFiles)
        } else {
            form.setFieldsValue({
                active: true,
                documentFiles: [],
            })
            setDocument([])
        }
    }, [initialValue])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={input?.versionId ? 'Sửa CTĐT toàn khóa' : 'Thêm CTĐT toàn khóa'}
            className="w-[60vw]"
            style={{ top: 20 }}
        >
            <Tabs
                className="w-full"
                items={[
                    {
                        key: '1',
                        label: 'Thông tin chung',
                        children: (
                            <div>
                                <Row gutter={[16, 16]} className="w-full">
                                    <Col span={12}>
                                        <FormItem
                                            form={form}
                                            name="code"
                                            label="Mã CTĐT toàn khóa"
                                            required
                                        >
                                            <Input placeholder="Nhập mã CTĐT toàn khóa" />
                                        </FormItem>
                                    </Col>
                                    <Col span={12}>
                                        <FormItem
                                            form={form}
                                            name="name"
                                            label="Tên CTĐT toàn khóa (tiếng việt)"
                                            required
                                        >
                                            <Input placeholder="Nhập tên CTĐT toàn khóa (tiếng việt)" />
                                        </FormItem>
                                    </Col>
                                    <Col span={12}>
                                        <FormItem
                                            form={form}
                                            name="englishName"
                                            label="Tên CTĐT toàn khóa (tiếng anh)"
                                        >
                                            <Input placeholder="Nhập tên CTĐT toàn khóa (tiếng anh)" />
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
                                            name="trainingLanguageId"
                                        >
                                            <Select
                                                placeholder="Chọn ngôn ngữ đào tạo"
                                                options={trainingLanguageData.map((item) => ({
                                                    label: item.name,
                                                    value: item.id,
                                                }))}
                                                allowClear
                                            />
                                        </FormItem>
                                    </Col>
                                    <Col span={12}>
                                        <FormItem form={form} name="yearCreation" label="Năm tạo">
                                            <InputNumber
                                                min={0}
                                                type="number"
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
                                                min={0}
                                                type="number"
                                                placeholder="Nhập năm áp dụng"
                                                className="w-full"
                                                step={1}
                                            />
                                        </FormItem>
                                    </Col>
                                    <Col span={12}>
                                        <FormItem
                                            form={form}
                                            name="numberOfSemesters"
                                            label="Số kỳ học"
                                        >
                                            <InputNumber
                                                min={0}
                                                type="number"
                                                placeholder="Nhập Số kỳ học"
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
                                            label="Bậc đào tạo"
                                            name="trainingLevelId"
                                            required
                                        >
                                            <Select
                                                placeholder="Chọn bậc đào tạo"
                                                options={trainingLevelData.map(
                                                    (i: TrainingForm) => ({
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
                                            label="Thời gian đào tạo"
                                            name="trainingTimeId"
                                            required
                                        >
                                            <Select
                                                placeholder="Chọn thời gian đào tạo"
                                                options={trainingTimeData.map(
                                                    (i: TrainingTime) => ({
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
                                            name="diplomaTypeId"
                                            label="Bậc đào tạo"
                                            required
                                        >
                                            <Select
                                                placeholder="Chọn bậc đào tạo"
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
                                            name="requiredCredits"
                                            label="Số tín chỉ bắt buộc"
                                        >
                                            <InputNumber
                                                min={0}
                                                type="number"
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
                                                min={0}
                                                type="number"
                                                placeholder="Nhập số tín chỉ tự chọn"
                                                className="w-full"
                                                step={1}
                                            />
                                        </FormItem>
                                    </Col>
                                    <Col span={12}>
                                        <FormItem form={form} name="description" label="Mô tả">
                                            <Input.TextArea placeholder="Nhập mô tả" />
                                        </FormItem>
                                    </Col>
                                    {input?.versionId && (
                                        <Col span={12}>
                                            <FormItem
                                                form={form}
                                                name={'active'}
                                                label="Trạng thái"
                                                required
                                            >
                                                <Radio.Group buttonStyle="solid">
                                                    <Radio value={true}>Đang hoạt động</Radio>
                                                    <Radio value={false}>Ngừng hoạt động</Radio>
                                                </Radio.Group>
                                            </FormItem>
                                        </Col>
                                    )}
                                    <Col span={24}>
                                        <FormItem
                                            form={form}
                                            name="documentFiles"
                                            label="Tài liệu đính kèm"
                                        >
                                            <DocumentPaths
                                                form={form}
                                                data={document}
                                                relationId={input?.versionId ?? ''}
                                                relationType="curriculumVersionId"
                                            />
                                        </FormItem>
                                    </Col>
                                </Row>
                            </div>
                        ),
                    },
                    {
                        key: '2',
                        label: 'Vị trí công việc',
                        children: (
                            <FormItem form={form} name="jobPosition" label="Vị trí công việc">
                                <RichTextEditor />
                                {/* <Input.TextArea placeholder="Nhập vị trí công việc" /> */}
                            </FormItem>
                        ),
                    },
                    {
                        key: '3',
                        label: 'Mục tiêu',
                        children: (
                            <FormItem form={form} name="objectives" label="Mục tiêu">
                                <RichTextEditor />
                                {/* <Input.TextArea placeholder="Nhập mục tiêu" /> */}
                            </FormItem>
                        ),
                    },
                    {
                        key: '4',
                        label: 'Chuẩn đầu ra',
                        children: (
                            <FormItem form={form} name="learningOutcome" label="Chuẩn đầu ra">
                                <RichTextEditor />
                                {/* <Input.TextArea placeholder="Nhập chuẩn đầu ra" /> */}
                            </FormItem>
                        ),
                    },
                    {
                        key: '5',
                        label: 'Chuẩn đầu vào',
                        children: (
                            <FormItem form={form} name="inputStandard" label="Chuẩn đầu vào">
                                <RichTextEditor />
                                {/* <Input.TextArea placeholder="Nhập chuẩn đầu vào" /> */}
                            </FormItem>
                        ),
                    },
                    {
                        key: '6',
                        label: 'Thời gian toàn khóa',
                        children: (
                            <FormItem form={form} name="time" label="Thời gian toàn khóa">
                                <RichTextEditor />
                                {/* <Input.TextArea placeholder="Nhập thời gian toàn khóa" /> */}
                            </FormItem>
                        ),
                    },
                    {
                        key: '7',
                        label: 'Cấu trúc chương trình đào tạo',
                        children: (
                            <FormItem
                                form={form}
                                name="structure"
                                label="Cấu trúc chương trình đào tạo"
                            >
                                <RichTextEditor />
                                {/* <Input.TextArea placeholder="Nhập cấu trúc chương trình đào tạo" /> */}
                            </FormItem>
                        ),
                    },
                    {
                        key: '8',
                        label: 'Ma trận chuẩn đầu ra',
                        children: (
                            <FormItem
                                form={form}
                                name="matrixLearningOutcome"
                                label="Ma trận chuẩn đầu ra"
                            >
                                <RichTextEditor />
                                {/* <Input.TextArea placeholder="Nhập ma trận chuẩn đầu ra" /> */}
                            </FormItem>
                        ),
                    },
                    {
                        key: '9',
                        label: 'Mô tả tóm tắt nội dung các học phần',
                        children: (
                            <FormItem
                                form={form}
                                name="summary"
                                label="Mô tả tóm tắt nội dung các học phần"
                            >
                                <RichTextEditor />
                                {/* <Input.TextArea placeholder="Nhập mô tả tóm tắt nội dung các học phần" /> */}
                            </FormItem>
                        ),
                    },
                    {
                        key: '10',
                        label: 'Sơ đồ liên hệ',
                        children: (
                            <FormItem form={form} name="learningDiagram" label="Sơ đồ liên hệ">
                                <RichTextEditor />
                                {/* <Input.TextArea placeholder="Nhập sơ đồ liên hệ" /> */}
                            </FormItem>
                        ),
                    },
                    {
                        key: '11',
                        label: 'Hướng dẫn thực hiện',
                        children: (
                            <FormItem form={form} name="guide" label="Hướng dẫn thực hiện">
                                <RichTextEditor />
                                {/* <Input.TextArea placeholder="Nhập hướng dẫn thực hiện" /> */}
                            </FormItem>
                        ),
                    },
                ]}
            />
        </PutFormModal>
    )
}

export default PutCurriculumVersion
