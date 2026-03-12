import { CloseCircleOutlined } from '@ant-design/icons'
import { queryClient } from '@api/index'
import DocumentPaths from '@components/commons/documentPaths'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import { RichTextEditor } from '@components/commons/rich-text-editor'
import Select from '@components/commons/select'
import Tabs from '@components/commons/tabar'
import useSpinner from '@hooks/spinner'
import {
    $Enums,
    type CurriculumVersion,
    type DiplomaType,
    type DocumentFile,
    type Prisma,
    type TrainingForm,
    type TrainingObjectType,
    type TrainingTime,
} from '@workspace/db/client'
import {
    useCreateCurriculumVersion,
    useDeleteCurriculumVersion,
    useFindManyDiplomaType,
    useFindManyTrainingLanguage,
    useFindManyTrainingLevel,
    useFindManyTrainingTime,
    useFindManyTrainingType,
    useFindUniqueCurriculumVersion,
    useFindUniqueTrainingObjectType,
    useUpdateCurriculumVersion,
} from '@workspace/db/hooks'
import { importPhienBanCTDTSubject } from '@workspace/libs/api/training'
import type { SubjectResult } from '@workspace/libs/parseExcel'
import { parseSheetSubject } from '@workspace/libs/parseExcel'
import { useFindManyTrainingObjectTypePermission, useTrainingObjectTypeStore } from '@workspace/ui'
import { Button, Col, Form, Input, InputNumber, message, Modal, Radio, Row } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { sqlTransaction } from '@workspace/libs/api/model'
import { getMinioUrl } from '@workspace/libs/utils'
import { Download } from 'lucide-react'

export type PutCurriculumVersion = CurriculumVersion & {
    documentFiles?: DocumentFile[]
    file?: any
}
dayjs.locale('vi')

type CurriculumVersionInput = {
    curriculumId: string
    versionId: string
}

export type ModalPreviewUploadInput = {
    previewData: SubjectResult[]
    errorData: any[]
    onConfirm?: (subjects: SubjectResult[]) => void
}

const PutCurriculumVersion = () => {
    const [document, setDocument] = useState<DocumentFile[]>([])
    const [form] = Form.useForm<PutCurriculumVersion>()
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const [importFileName, setImportFileName] = useState<string>('')
    const [filteredSubjects, setFilteredSubjects] = useState<SubjectResult[]>([])
    const [importFile, setImportFile] = useState<File | null>(null)

    const { data: trainingObjectTypeSelected } = useFindUniqueTrainingObjectType(
        {
            where: { id: trainingObjectTypeId },
        },
        {
            enabled: !!trainingObjectTypeId,
            refetchOnWindowFocus: false,
        }
    )

    const { isOpen, onClose, input } = useDisclosure<CurriculumVersionInput>({
        tag: 'PutCurriculumVersion',
        onClose: form.resetFields,
    })

    const { onOpen: openPreviewModal } = useDisclosure<ModalPreviewUploadInput>({
        tag: 'ModalPreviewUpload',
    })

    useEffect(() => {
        if (!input?.versionId && trainingObjectTypeSelected) {
            form.setFieldsValue({
                trainingLevelId: trainingObjectTypeSelected.trainingLevelId,
            })
        }
    }, [trainingObjectTypeSelected, input?.versionId])

    const { showSpinner, hideSpinner } = useSpinner()

    const { data: trainingLevelData = [] } = useFindManyTrainingLevel()
    const { data: trainingTimeData = [] } = useFindManyTrainingTime()
    const { data: trainingObjectTypeData = [] } = useFindManyTrainingObjectTypePermission()
    const { data: diplomaTypeData = [] } = useFindManyDiplomaType()
    const { data: trainingTypeData = [] } = useFindManyTrainingType()
    const { data: trainingLanguageData = [] } = useFindManyTrainingLanguage({
        where: { active: true },
        orderBy: { name: 'asc' },
    })

    const { mutateAsync: createCurriculumVersion } = useCreateCurriculumVersion()
    const { mutateAsync: updateCurriculumVersion } = useUpdateCurriculumVersion()
    const { mutateAsync: deleteCurriculumVersion } = useDeleteCurriculumVersion()

    const handleFileSelect = () => {
        const fileInput = window.document.createElement('input')
        fileInput.type = 'file'
        fileInput.accept = '.xlsx,.xls'
        fileInput.onchange = async (e: Event) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (!file) return
            setImportFileName(file.name)
            setImportFile(file)
            const { subjects, errors } = parseSheetSubject(
                (await file.arrayBuffer()) as ArrayBuffer
            )
            openPreviewModal({
                previewData: subjects,
                errorData: errors,
                onConfirm: setFilteredSubjects,
            })
        }
        fileInput.click()
    }

    const updateDynamicFields = async (versionId: string) => {
        try {
            const resVersion = await sqlTransaction([
                {
                    model: 'CurriculumVersion',
                    operation: 'findUnique',
                    data: {
                        where: { id: versionId, active: true, deletedAt: null },
                        include: {
                            trainingBlocks: {
                                include: {
                                    subjects: {
                                        include: {
                                            subject: true,
                                        },
                                        where: {
                                            active: true,
                                            deletedAt: null,
                                            subject: {
                                                active: true,
                                                deletedAt: null,
                                            },
                                        },
                                    },
                                },
                                where: {
                                    active: true,
                                    deletedAt: null,
                                },
                            },
                        },
                    },
                },
            ])
            if (resVersion.status !== 200) return
            const versionData = resVersion.data[0] as Prisma.CurriculumVersionGetPayload<{
                include: {
                    trainingBlocks: {
                        include: {
                            subjects: {
                                include: {
                                    subject: true
                                }
                            }
                        }
                    }
                }
            }>
            const totalMandatoryCredits = versionData.trainingBlocks.reduce((total, block) => {
                const blockCredit =
                    block?.subjects?.reduce(
                        (sum, { subject, type }) =>
                            sum +
                            (type === $Enums.SubjectRequirementType.Mandatory
                                ? subject?.credit || 0
                                : 0),
                        0
                    ) || 0
                return total + blockCredit
            }, 0)
            const totalOptionalCredits = versionData.trainingBlocks.reduce((total, block) => {
                return total + block.electiveCreditsRequired
            }, 0)

            const allSemester = versionData.trainingBlocks.flatMap((block) => {
                return block.subjects?.map((e) => e?.semester ?? 0)?.filter?.(Boolean) || []
            })
            await updateCurriculumVersion({
                where: { id: versionId },
                data: {
                    numberOfSemesters: allSemester?.length > 0 ? Math.max(...allSemester) : 0,
                    requiredCredits: totalMandatoryCredits,
                    electiveCredits: totalOptionalCredits,
                },
            })
        } catch (error) {}
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
                trainingLevelId:
                    output.trainingLevelId || trainingObjectTypeSelected?.trainingLevelId,
                trainingTypeId: output.trainingTypeId,
                trainingTimeId: output.trainingTimeId,
                diplomaTypeId: output.diplomaTypeId,
                description: output.description,
                active: output.active,
                numberOfSemesters: output.numberOfSemesters,
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

                if (
                    filteredSubjects.length > 0 &&
                    input?.versionId &&
                    output.trainingObjectTypeId &&
                    importFile
                ) {
                    const res = await importPhienBanCTDTSubject({
                        curriculumVersionId: input.versionId,
                        trainingObjectTypeId: output.trainingObjectTypeId,
                        file: importFile,
                        createNewSubjects: false,
                    })
                    if (res.status !== 200) {
                        throw new Error(res.data?.message || 'Lỗi khi nhập dữ liệu từ file')
                    }
                }
                await updateDynamicFields(input.versionId)
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
                    output.trainingObjectTypeId &&
                    importFile
                ) {
                    // TODO: call api here
                    const res = await importPhienBanCTDTSubject({
                        curriculumVersionId: newCurriculumVersion.id,
                        trainingObjectTypeId: output.trainingObjectTypeId,
                        file: importFile,
                        createNewSubjects: true,
                    })
                    if (res.status !== 200) {
                        await deleteCurriculumVersion({
                            where: { id: newCurriculumVersion.id },
                        })
                        throw new Error(res.data?.message || 'Lỗi khi nhập dữ liệu từ file')
                    }
                }
                if (newCurriculumVersion) await updateDynamicFields(newCurriculumVersion.id)
                message.success('Thêm mới thành công')
            }
            queryClient.invalidateQueries({
                queryKey: ['TrainingCourse'],
            })
            onClose()
        } catch (error: any) {
            if (error?.info?.message || error?.message) {
                Modal.error({
                    title: 'Lỗi',
                    content: error?.info?.message || error?.message,
                    width: 500,
                    okText: 'Đóng',
                    okButtonProps: {
                        className: 'bg-red-500 hover:bg-red-600',
                    },
                })
                return
            }
            Modal.error({
                title: 'Lỗi',
                content: 'Đã xảy ra lỗi, vui lòng kiểm tra lại',
                width: 500,
                okText: 'Đóng',
                okButtonProps: {
                    className: 'bg-red-500 hover:bg-red-600',
                },
            })
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
        {
            enabled: !!input?.versionId,
            refetchOnWindowFocus: false,
        }
    )

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (initialValue && trainingObjectTypeSelected) {
            form.setFieldsValue({
                ...initialValue,
                trainingLevelId: trainingObjectTypeSelected.trainingLevelId,
            })
            setDocument(initialValue?.documentFiles)
        }
    }, [initialValue, trainingObjectTypeSelected])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            // maskClosable={true}
            title={input?.versionId ? 'Sửa CTĐT toàn khoá' : 'Thêm CTĐT toàn khoá'}
            className="w-[60vw]"
            style={{ top: 20 }}
            formProps={{
                initialValues: {
                    trainingObjectTypeId,
                },
            }}
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
                                                disabled
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
                                                disabled
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
                                        >
                                            <Select
                                                placeholder="Chọn bậc đào tạo"
                                                options={trainingLevelData.map(
                                                    (i: TrainingForm) => ({
                                                        value: i.id,
                                                        label: i.name,
                                                    })
                                                )}
                                                disabled
                                                allowClear
                                            />
                                        </FormItem>
                                    </Col>
                                    <Col span={12}>
                                        <FormItem
                                            form={form}
                                            label="Loại hình đào tạo"
                                            name="trainingTypeId"
                                        >
                                            <Select
                                                placeholder="Chọn loại hình đào tạo"
                                                options={trainingTypeData.map(
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
                                            name="requiredCredits"
                                            label="Số tín chỉ bắt buộc"
                                        >
                                            <InputNumber
                                                min={0}
                                                disabled
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
                                                disabled
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
                                                name="active"
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
                                                <Button
                                                    href={getMinioUrl(
                                                        'mta/template/MAU-NHAP_CTDT.xlsx'
                                                    )}
                                                    type="dashed"
                                                >
                                                    <Download />
                                                    Mẫu nhập CTĐT
                                                </Button>
                                                <Button type="primary" onClick={handleFileSelect}>
                                                    Chọn file Excel
                                                </Button>
                                                {importFileName && (
                                                    <span
                                                        className="text-sm text-primary cursor-pointer flex items-center gap-1"
                                                        onClick={async () => {
                                                            if (!importFile) return
                                                            const { subjects, errors } =
                                                                parseSheetSubject(
                                                                    (await importFile.arrayBuffer()) as ArrayBuffer
                                                                )
                                                            openPreviewModal({
                                                                previewData: subjects,
                                                                errorData: errors,
                                                                onConfirm: setFilteredSubjects,
                                                            })
                                                        }}
                                                    >
                                                        {importFileName}
                                                        <CloseCircleOutlined
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setImportFileName('')
                                                                setImportFile(null)
                                                                setFilteredSubjects([])
                                                            }}
                                                            className="text-red-500"
                                                        />
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
