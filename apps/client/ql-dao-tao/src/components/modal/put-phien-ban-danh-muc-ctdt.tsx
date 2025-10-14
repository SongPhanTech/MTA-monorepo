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
    useCreateManyTrainingBlockOnCurriculumVersion,
    useCreateManyTrainingBlockSubject,
    useCreateSubjectVersion,
    useCreateTrainingBlock,
    useFindManyDiplomaType,
    useFindManyDM_DonVi,
    useFindManySubjectVersion,
    useFindManyTrainingBlock,
    useFindManyTrainingLanguage,
    useFindManyTrainingLevel,
    useFindManyTrainingObjectType,
    useFindManyTrainingTime,
    useFindUniqueCurriculumVersion,
    useUpdateCurriculumVersion,
} from '@workspace/db/hooks'
import { Button, Col, Form, Input, InputNumber, message, Radio, Row } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import './index.css'
import DocumentPaths from '@components/commons/documentPaths'
import { RichTextEditor } from '@components/commons/rich-text-editor'
import Tabs from '@components/commons/tabar'
import { $Enums } from '@workspace/db/client'
import type { SubjectResult } from '@workspace/libs/parseExcel'
import { parseSheetSubject } from '@workspace/libs/parseExcel'

export type PutCurriculumVersion = CurriculumVersion & {
    documentFiles?: DocumentFile[]
    file?: any
}
dayjs.locale('vi')

type CurriculumVersionInput = {
    curriculumId: string
    versionId: string
}

type ModalPreviewUploadInput = {
    previewData: SubjectResult[]
    errorData: any[]
}

const PutCurriculumVersion = () => {
    const [document, setDocument] = useState<DocumentFile[]>([])
    const [form] = Form.useForm<PutCurriculumVersion>()

    // Import Excel states
    const [importFileName, setImportFileName] = useState<string>('')
    const [filteredSubjects, setFilteredSubjects] = useState<SubjectResult[]>([])

    const { isOpen, onClose, input } = useDisclosure<CurriculumVersionInput>({
        tag: 'PutCurriculumVersion',
        onClose: form.resetFields,
    })

    const { onOpen: openPreviewModal, input: previewInput } =
        useDisclosure<ModalPreviewUploadInput>({
            tag: 'ModalPreviewUpload',
        })

    useEffect(() => {
        if (previewInput?.previewData) {
            setFilteredSubjects(previewInput.previewData)
        }
    }, [previewInput?.previewData])

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
    const { mutateAsync: createTrainingBlock } = useCreateTrainingBlock()
    const { mutateAsync: createManyTrainingBlockOnCurriculumVersion } =
        useCreateManyTrainingBlockOnCurriculumVersion()
    const { mutateAsync: createSubjectVersion } = useCreateSubjectVersion()
    const { mutateAsync: createManyTrainingBlockSubject } = useCreateManyTrainingBlockSubject()

    const { data: existingTrainingBlocks = [] } = useFindManyTrainingBlock({
        select: { id: true, name: true },
    })

    const { data: existingOrganizations = [] } = useFindManyDM_DonVi({
        select: { Id: true, sMa: true },
    })

    const { data: existingSubjectVersions = [] } = useFindManySubjectVersion({
        select: { id: true, code: true, name: true },
    })

    // Helper function để map loại thi từ tiếng Việt sang ExamType enum
    const mapExamType = (vietnameseType?: string): string => {
        if (!vietnameseType) return 'Other'

        const mapping: Record<string, string> = {
            'Thi viết': $Enums.ExamType.OfflineWritten,
            'Thi vấn đáp': $Enums.ExamType.Oral,
            'Thi thực hành': $Enums.ExamType.Practice,
            'Thi đồ án': $Enums.ExamType.Project,
            'Loại khác': $Enums.ExamType.Other,
        }

        return mapping[vietnameseType] || $Enums.ExamType.Other
    }

    // Helper function để map loại môn học từ tiếng Việt sang SubjectVersionType enum
    const mapSubjectVersionType = (vietnameseType?: string): string => {
        if (!vietnameseType) return 'Normal'

        const mapping: Record<string, string> = {
            'Môn thường': $Enums.SubjectVersionType.Normal,
            'Thực tập': $Enums.SubjectVersionType.Internship,
            'Chuyên đề nghiên cứu': $Enums.SubjectVersionType.Research,
            'Luận văn/Đồ án': $Enums.SubjectVersionType.Project,
            'Luận văn': $Enums.SubjectVersionType.Project,
            'Đồ án': $Enums.SubjectVersionType.Project,
        }

        return mapping[vietnameseType] || $Enums.SubjectVersionType.Normal
    }

    // Helper function tương tự buildOrgCodeMapOrThrow
    const buildOrgCodeMap = (orgCodes: (string | undefined)[]) => {
        const uniqCodes = Array.from(
            new Set(orgCodes.filter((code): code is string => Boolean(code)))
        )
        const orgCodeToId = new Map<string, string>()

        for (const orgCode of uniqCodes) {
            const existing = existingOrganizations.find(
                (org) => org.sMa?.toLowerCase() === orgCode.toLowerCase()
            )

            if (existing?.Id) {
                orgCodeToId.set(orgCode, existing.Id)
            }
        }

        return orgCodeToId
    }

    // Helper function tương tự buildTrainingBlockMapOrThrow
    const buildTrainingBlockMap = async (blockNames: string[]) => {
        const uniqNames = Array.from(new Set(blockNames.filter((name) => Boolean(name))))
        const blockNameToId = new Map<string, string>()

        // Tạo các block chưa tồn tại
        for (const blockName of uniqNames) {
            const existing = existingTrainingBlocks.find(
                (b) => b.name?.toLowerCase() === blockName.toLowerCase()
            )

            if (existing) {
                blockNameToId.set(blockName, existing.id)
            } else {
                // Tạo mới TrainingBlock
                const newBlock = await createTrainingBlock({
                    data: { name: blockName, priority: 0 },
                })
                if (newBlock?.id) {
                    blockNameToId.set(blockName, newBlock.id)
                }
            }
        }

        return blockNameToId
    }

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
                    message.error('Thiếu curriculumId, không thể tạo CTĐT toàn khoá')
                    return
                }

                const newCurriculumVersion = await createCurriculumVersion({
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

                if (
                    filteredSubjects.length > 0 &&
                    newCurriculumVersion?.id &&
                    output.trainingObjectTypeId
                ) {
                    // TODO: call api here
                }

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

    const handleFileSelect = () => {
        const fileInput = window.document.createElement('input')
        fileInput.type = 'file'
        fileInput.accept = '.xlsx,.xls'
        fileInput.onchange = (e: Event) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (!file) return

            setImportFileName(file.name)

            const reader = new FileReader()
            reader.onload = (e) => {
                const { subjects, errors } = parseSheetSubject(e.target?.result as ArrayBuffer)

                openPreviewModal({
                    previewData: subjects,
                    errorData: errors,
                })
            }
            reader.readAsArrayBuffer(file)
        }
        fileInput.click()
    }

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={input?.versionId ? 'Sửa CTĐT toàn khoá' : 'Thêm CTĐT toàn khoá'}
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
                                            label="Mã CTĐT toàn khoá"
                                            required
                                        >
                                            <Input placeholder="Nhập mã CTĐT toàn khoá" />
                                        </FormItem>
                                    </Col>
                                    <Col span={12}>
                                        <FormItem
                                            form={form}
                                            name="name"
                                            label="Tên CTĐT toàn khoá (tiếng việt)"
                                            required
                                        >
                                            <Input placeholder="Nhập tên CTĐT toàn khoá (tiếng việt)" />
                                        </FormItem>
                                    </Col>
                                    <Col span={12}>
                                        <FormItem
                                            form={form}
                                            name="englishName"
                                            label="Tên CTĐT toàn khoá (tiếng anh)"
                                        >
                                            <Input placeholder="Nhập tên CTĐT toàn khoá (tiếng anh)" />
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
                                            label="Loại văn bằng"
                                            required
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

                                    <Col span={12}>
                                        <FormItem
                                            label="Nhập dữ liệu môn học từ file Excel"
                                            form={form}
                                            name="file"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Button type="primary" onClick={handleFileSelect}>
                                                    Chọn file Excel
                                                </Button>
                                                {importFileName && (
                                                    <span className="text-sm text-gray-600">
                                                        {importFileName}
                                                    </span>
                                                )}
                                            </div>
                                        </FormItem>
                                    </Col>

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
                        label: 'Thời gian toàn khoá',
                        children: (
                            <FormItem form={form} name="time" label="Thời gian toàn khoá">
                                <RichTextEditor />
                                {/* <Input.TextArea placeholder="Nhập thời gian toàn khoá" /> */}
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
