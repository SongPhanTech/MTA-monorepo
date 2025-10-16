import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useSpinner from '@hooks/spinner'
import { type DocumentFile, type SubjectVersion, SubjectVersionType } from '@workspace/db/client'
import {
    useCreateSubjectVersion,
    useCreateSubjectVersionHistory,
    useFindManySubject,
    useFindManyTrainingObjectType,
    useFindUniqueSubject,
    useFindUniqueSubjectVersion,
    useUpdateSubjectVersion,
} from '@workspace/db/hooks'
import { Col, Form, Input, InputNumber, message, Radio, Row, Switch } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useRef, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import DocumentPaths from '@components/commons/documentPaths'
import Tabs from '@components/commons/tabar'
import { useExamTypeOptions } from '@hooks/examType'
import TreeSelect from '@/components/commons/tree-select'
import { useTrainingObjectTypeStore } from '@workspace/ui'
declare global {
    interface Window {
        contextData: {
            userId: string
        }
    }
}
export type PutSubjectVersion = SubjectVersion & {
    documentFiles?: DocumentFile[]
}
dayjs.locale('vi')

type PutSubjectVersionFormValues = PutSubjectVersion & {
    prerequisiteSubjectIds?: string[]
    coRequisiteSubjectIds?: string[]
}

export enum HistorySubjectVersionType {
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
}

const subjectVersionTypeOptions = [
    { label: 'Môn thường', value: SubjectVersionType.Normal },
    { label: 'Thực tập', value: SubjectVersionType.Internship },
    { label: 'Chuyên đề nghiên cứu', value: SubjectVersionType.Research },
    { label: 'Đồ án tốt nghiệp', value: SubjectVersionType.Project },
]

const PutVersionSubjectModal = () => {
    const [document, setDocument] = useState<DocumentFile[]>([])
    const modalContentRef = useRef<HTMLDivElement>(null)
    const [form] = Form.useForm<PutSubjectVersionFormValues>()
    const { isOpen, onClose, input } = useDisclosure<{
        subjectId: string
        subjectVersionId?: string
        isLocked?: boolean
    }>({
        tag: 'PutVersionSubjectModal',
        onClose: form.resetFields,
    })

    const subjectId = input?.subjectId
    const subjectVersionId = input?.subjectVersionId
    const { id: selectedTrainingObjectTypeId } = useTrainingObjectTypeStore()
    const { mutateAsync: createSubjectVersionHistory } = useCreateSubjectVersionHistory()
    const { data: subjectVersion } = useFindUniqueSubjectVersion(
        {
            where: { id: subjectVersionId },
            include: {
                prerequisiteSubject: true,
                coRequisiteSubject: true,
                documentFiles: true,
            },
        },
        { enabled: !!subjectVersionId }
    )

    const { showSpinner, hideSpinner } = useSpinner()

    const { options } = useExamTypeOptions()

    const { data: subject } = useFindUniqueSubject(
        { where: { id: subjectId } },
        { enabled: !!subjectId }
    )

    const { data: subjectData = [] } = useFindManySubject({
        include: {
            subjectVersion: {
                where: {
                    id: {
                        not: subjectVersionId,
                    },
                },
            },
        },
    })

    const { data: trainingObjectType = [] } = useFindManyTrainingObjectType({
        select: { id: true, name: true },
    })

    const treeData =
        subjectData
            .filter((subject) => subject.subjectVersion.length > 0)
            .map((subject) => ({
                title: subject.name,
                value: subject.id,
                selectable: false,
                children:
                    subject.subjectVersion.map((version: SubjectVersion) => ({
                        title: version.name,
                        value: version.id,
                    })) || [],
            })) || []

    const { mutateAsync: createSubjectVersion } = useCreateSubjectVersion()
    const { mutateAsync: updateSubjectVersion } = useUpdateSubjectVersion()
    async function onOk(output?: PutSubjectVersion) {
        if (!output) return

        try {
            showSpinner()
            const values = (await form.validateFields()) as PutSubjectVersionFormValues

            const baseData = {
                isLocked: input?.isLocked ?? false,
                codeTkb: output.codeTkb,
                code: output.code,
                name: output.name.trim(),
                description: output.description,
                active: output.active,
                examType: output.examType,
                numberOfPractical: output.numberOfPractical,
                numberOfExam: output.numberOfExam,
                numberOfTheory: output.numberOfTheory,
                numberOfPractice: output.numberOfPractice,
                numberOfSelfStudy: output.numberOfSelfStudy,
                numberOfReview: output.numberOfReview,
                credit: output.credit,
                period: output.period,
                managementOrganizationId: subject ? subject.managementOrganizationId : '',
                subjectId: subjectId ? subjectId : '',
                objectives: output.objectives,
                learningOutcome: output.learningOutcome,
                structure: output.structure,
                guild: output.guild,
                trainingObjectTypeId: output.trainingObjectTypeId,
                academicResults: output.academicResults,
                materials: output.materials,
                schedulePeriod: output.schedulePeriod,
                rules: output.rules,
                type: output.type,
                prerequisiteSubject: subjectVersionId
                    ? {
                          set:
                              values.prerequisiteSubjectIds?.map((id) => ({
                                  id,
                              })) || [],
                      }
                    : {
                          connect: values.prerequisiteSubjectIds?.map((id) => ({
                              id,
                          })),
                      },
                coRequisiteSubject: subjectVersionId
                    ? {
                          set:
                              values.coRequisiteSubjectIds?.map((id) => ({
                                  id,
                              })) || [],
                      }
                    : {
                          connect: values.coRequisiteSubjectIds?.map((id) => ({
                              id,
                          })),
                      },
            }

            if (subjectVersionId && subjectVersion) {
                const changes: string[] = []
                const originalValues = {
                    ...subjectVersion,
                    prerequisiteSubjectIds: subjectVersion.prerequisiteSubject.map(
                        (item) => item.id
                    ),
                    coRequisiteSubjectIds: subjectVersion.coRequisiteSubject.map((item) => item.id),
                }
                const fields = form.getFieldsValue(true)
                const subjectVersionNameMap = new Map<string, string>()
                treeData.forEach((subject) => {
                    subject.children?.forEach((version) => {
                        subjectVersionNameMap.set(version.value, version.title)
                    })
                })
                const tabFieldLabels: { [key: string]: string } = {
                    objectives: 'Mục tiêu',
                    learningOutcome: 'Chuẩn đầu ra',
                    structure: 'Cấu trúc chương trình đào tạo',
                    guild: 'Kế hoạch và phương pháp dạy học',
                    academicResults: 'Đánh giá kết quả học tập',
                    materials: 'Cơ sở vật chất, học liệu',
                    rules: 'Quy định của học phần',
                }
                for (const key in fields) {
                    let labelText = ''

                    const fieldElement = modalContentRef.current?.querySelector(`[id$="${key}"]`)
                    const labelElement = fieldElement
                        ?.closest('.ant-form-item-row')
                        ?.querySelector('.ant-form-item-label label')

                    if (labelElement) {
                        labelText = labelElement.textContent || key
                    } else {
                        labelText = tabFieldLabels[key]
                    }

                    if (!labelText) {
                        continue
                    }

                    const oldValue = originalValues[key as keyof typeof originalValues]
                    const newValue = values[key as keyof typeof values]
                    const normalizedOldValue =
                        oldValue === null || oldValue === undefined ? '' : oldValue
                    const normalizedNewValue =
                        newValue === null || newValue === undefined ? '' : newValue
                    if (JSON.stringify(normalizedOldValue) !== JSON.stringify(normalizedNewValue)) {
                        let oldDisplay =
                            normalizedOldValue === '' ||
                            normalizedOldValue === null ||
                            normalizedOldValue === undefined
                                ? 'trống'
                                : oldValue
                        let newDisplay =
                            normalizedNewValue === '' ||
                            normalizedNewValue === null ||
                            normalizedNewValue === undefined
                                ? 'trống'
                                : newValue

                        if (key === 'trainingObjectTypeId') {
                            const oldTrainingObject = trainingObjectType.find(
                                (t) => t.id === oldValue
                            )
                            const newTrainingObject = trainingObjectType.find(
                                (t) => t.id === newValue
                            )
                            oldDisplay = oldTrainingObject?.name || 'trống'
                            newDisplay = newTrainingObject?.name || 'trống'
                        } else if (
                            key === 'prerequisiteSubjectIds' ||
                            key === 'coRequisiteSubjectIds'
                        ) {
                            const oldNames = (oldValue as string[])
                                ?.map((id) => subjectVersionNameMap.get(id) || id)
                                .join(', ')
                            const newNames = (newValue as string[])
                                ?.map((id) => subjectVersionNameMap.get(id) || id)
                                .join(', ')
                            oldDisplay = oldNames || 'trống'
                            newDisplay = newNames || 'trống'
                        } else if (key === 'active') {
                            oldDisplay = oldValue ? 'Đang hoạt động' : 'Ngừng hoạt động'
                            newDisplay = newValue ? 'Đang hoạt động' : 'Ngừng hoạt động'
                        } else if (key === 'examType') {
                            const oldOption = options?.find((opt) => opt.value === oldValue)
                            const newOption = options?.find((opt) => opt.value === newValue)
                            oldDisplay = oldOption?.label || 'trống'
                            newDisplay = newOption?.label || 'trống'
                        } else if (key === 'type') {
                            const oldOption = subjectVersionTypeOptions.find(
                                (opt) => opt.value === oldValue
                            )
                            const newOption = subjectVersionTypeOptions.find(
                                (opt) => opt.value === newValue
                            )
                            oldDisplay = oldOption?.label || 'trống'
                            newDisplay = newOption?.label || 'trống'
                        }

                        const oldDisplayHtml = `<strong>${oldDisplay || 'trống'}</strong>`
                        const newDisplayHtml = `<strong>${newDisplay || 'trống'}</strong>`

                        changes.push(
                            `Đã thay đổi <strong>${labelText}</strong> từ ${oldDisplayHtml} thành ${newDisplayHtml}`
                        )
                    }
                }

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
                                    subjectVersionId: { connect: { id: subjectVersionId } },
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
                await updateSubjectVersion({
                    data: updateData,
                    where: { id: subjectVersionId },
                })
                if (changes.length > 0) {
                    const historyContent = changes.join('<br />')
                    const historyData = {
                        content: historyContent,
                        action: HistorySubjectVersionType.UPDATE,
                        updatedBy: {
                            connect: {
                                id:
                                    window?.contextData?.userId ??
                                    'cd18a522-0cbf-4895-b651-a49a9ab012ed',
                            },
                        },
                        subjectVersion: {
                            connect: {
                                id: subjectVersionId,
                            },
                        },
                    }

                    await createSubjectVersionHistory({ data: historyData })
                }
                message.success('Cập nhật thành công')
            } else {
                const data = await createSubjectVersion({
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
                const historyData = {
                    content: 'Thêm mới bản ghi',
                    action: HistorySubjectVersionType.CREATE,
                    active: true,
                    updatedBy: {
                        connect: {
                            id:
                                window?.contextData?.userId ??
                                'cd18a522-0cbf-4895-b651-a49a9ab012ed',
                        },
                    },
                    subjectVersion: {
                        connect: {
                            id: data?.id ?? '',
                        },
                    },
                }
                await createSubjectVersionHistory({ data: historyData })
                message.success('Thêm mới thành công')
            }

            queryClient.invalidateQueries({ queryKey: ['SubjectVersion'] })
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

    useEffect(() => {
        if (subjectVersion) {
            form.setFieldsValue({
                ...subjectVersion,
                coRequisiteSubjectIds: subjectVersion.coRequisiteSubject.map(
                    (item: { id: string }) => item.id
                ),
                prerequisiteSubjectIds: subjectVersion.prerequisiteSubject.map(
                    (item: { id: string }) => item.id
                ),
            })
            setDocument(subjectVersion?.documentFiles)
        } else {
            form.setFieldsValue({
                active: true,
                type: SubjectVersionType.Normal,
                documentFiles: [],
                trainingObjectTypeId: selectedTrainingObjectTypeId,
            })
            setDocument([])
        }
    }, [subjectVersion, form, selectedTrainingObjectTypeId])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={
                subjectVersionId
                    ? `Sửa phiên bản môn học - ${subject?.name}`
                    : `Thêm phiên bản môn học - ${subject?.name}`
            }
            className="w-[80vw]"
            okButtonProps={{ disabled: input?.isLocked }}
            cancelButtonProps={{ disabled: input?.isLocked }}
        >
            <Row gutter={[16, 16]} ref={modalContentRef}>
                <Col span={4}>
                    <FormItem form={form} name="code" label="Mã môn học" required>
                        <Input placeholder="Mã môn học" disabled={input?.isLocked} />
                    </FormItem>
                </Col>
                <Col span={4}>
                    <FormItem form={form} name="codeTkb" label="Mã TKB" required>
                        <Input placeholder="Mã TKB" disabled={input?.isLocked} />
                    </FormItem>
                </Col>
                <Col span={8}>
                    <FormItem form={form} name="name" label="Tên môn học" required>
                        <Input placeholder="Tên môn học" disabled={input?.isLocked} />
                    </FormItem>
                </Col>
                <Col span={8}>
                    <FormItem form={form} name="examType" label="Hình thức thi" required>
                        <Select
                            placeholder="Chọn hình thức thi"
                            options={options?.map((item) => ({
                                label: item.label,
                                value: item.value,
                            }))}
                            allowClear
                            disabled={input?.isLocked}
                        />
                    </FormItem>
                </Col>
                {/* <Col span={12}>
                <FormItem
                    form={form}
                    name="managementOrganizationId"
                    label="Đơn vị quản lý"
                    required
                >
                    <Select
                        placeholder="Chọn đơn vị quản lý"
                        options={organization?.map((item) => ({
                            label: item.name,
                            value: item.id,
                        }))}
                        allowClear
                    />
                </FormItem>
            </Col> */}
                <Col span={8}>
                    <FormItem
                        form={form}
                        name="trainingObjectTypeId"
                        label="Đối tượng đào tạo"
                        required
                    >
                        <Select
                            placeholder="Chọn đối tượng đào tạo"
                            options={trainingObjectType?.map((item) => ({
                                label: item.name,
                                value: item.id,
                            }))}
                            allowClear
                            disabled={input?.isLocked}
                        />
                    </FormItem>
                </Col>
                <Col span={8}>
                    <FormItem form={form} name="type" label="Loại môn học">
                        <Select
                            placeholder="Chọn loại môn học"
                            options={subjectVersionTypeOptions?.map((item) => ({
                                label: item.label,
                                value: item.value,
                            }))}
                            allowClear
                            disabled={input?.isLocked}
                        />
                    </FormItem>
                </Col>
                <Col span={8}>
                    <FormItem form={form} name="onePoint" label=" ">
                        <Switch checkedChildren="1 đầu điểm" unCheckedChildren="3 đầu điểm" />
                    </FormItem>
                </Col>
                <Col span={8}>
                    <FormItem form={form} name="credit" label="Số tín chỉ" required>
                        <InputNumber
                            min={0}
                            type="number"
                            placeholder="Số tín chỉ"
                            className="w-full"
                            disabled={input?.isLocked}
                        />
                    </FormItem>
                </Col>
                <Col span={8}>
                    <FormItem form={form} name="period" label="Số tiết" required>
                        <InputNumber
                            min={0}
                            type="number"
                            placeholder="Số tiết"
                            className="w-full"
                            disabled={input?.isLocked}
                        />
                    </FormItem>
                </Col>
                <Col span={8}>
                    <FormItem form={form} name="schedulePeriod" label="Số tiết TKB" required>
                        <InputNumber
                            min={0}
                            type="number"
                            placeholder="Số tiết TKB"
                            className="w-full"
                            disabled={input?.isLocked}
                        />
                    </FormItem>
                </Col>
                <Col span={8}>
                    <FormItem form={form} name="numberOfTheory" label="Số tiết lý thuyết">
                        <InputNumber
                            min={0}
                            type="number"
                            placeholder="Số tiết lý thuyết"
                            className="w-full"
                            disabled={input?.isLocked}
                        />
                    </FormItem>
                </Col>
                <Col span={8}>
                    <FormItem form={form} name="numberOfPractical" label="Số tiết bài tập">
                        <InputNumber
                            min={0}
                            type="number"
                            placeholder="Số tiết bài tập"
                            className="w-full"
                            disabled={input?.isLocked}
                        />
                    </FormItem>
                </Col>
                <Col span={8}>
                    <FormItem form={form} name="numberOfSelfStudy" label="Số tiết thảo luận/tự học">
                        <InputNumber
                            min={0}
                            type="number"
                            placeholder="Số tiết thảo luận/tự học"
                            className="w-full"
                            disabled={input?.isLocked}
                        />
                    </FormItem>
                </Col>
                <Col span={8}>
                    <FormItem
                        form={form}
                        name="numberOfPractice"
                        label="Số tiết thí nghiệm/thực hành"
                    >
                        <InputNumber
                            min={0}
                            type="number"
                            placeholder="Số tiết thí nghiệm/thực hành"
                            className="w-full"
                            disabled={input?.isLocked}
                        />
                    </FormItem>
                </Col>
                <Col span={8}>
                    <FormItem form={form} name="numberOfReview" label="Số tiết ôn tập">
                        <InputNumber
                            min={0}
                            type="number"
                            placeholder="Số tiết ôn tập"
                            className="w-full"
                            disabled={input?.isLocked}
                        />
                    </FormItem>
                </Col>
                <Col span={8}>
                    <FormItem form={form} name="numberOfExam" label="Số tiết KT/thi">
                        <InputNumber
                            min={0}
                            type="number"
                            placeholder="Số tiết KT/thi"
                            className="w-full"
                            disabled={input?.isLocked}
                        />
                    </FormItem>
                </Col>
                <Col span={8}>
                    <Form.Item name="prerequisiteSubjectIds" label="Môn học tiên quyết">
                        <TreeSelect
                            treeData={treeData}
                            // treeCheckable={true}
                            multiple={true}
                            treeDefaultExpandAll
                            showSearch
                            placeholder="Chọn môn học tiên quyết"
                            style={{ width: '100%' }}
                            allowClear
                            disabled={input?.isLocked}
                        />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item name="coRequisiteSubjectIds" label="Môn học song hành">
                        <TreeSelect
                            treeData={treeData}
                            // treeCheckable={true}
                            multiple={true}
                            treeDefaultExpandAll
                            showSearch
                            placeholder="Chọn môn học song hành"
                            style={{ width: '100%' }}
                            allowClear
                            disabled={input?.isLocked}
                        />
                    </Form.Item>
                </Col>

                <Col span={8}>
                    <FormItem form={form} name={'active'} label="Trạng thái" required>
                        <Radio.Group buttonStyle="solid" disabled={input?.isLocked}>
                            <Radio value={true}>Đang hoạt động</Radio>
                            <Radio value={false}>Ngừng hoạt động</Radio>
                        </Radio.Group>
                    </FormItem>
                </Col>
                <Col span={24}>
                    <FormItem form={form} name="description" label="Mô tả">
                        <Input.TextArea
                            rows={3}
                            placeholder="Nhập mô tả"
                            disabled={input?.isLocked}
                        />
                    </FormItem>
                </Col>
                <Col span={24}>
                    <FormItem form={form} name="documentFiles" label="Tài liệu đính kèm">
                        <DocumentPaths
                            form={form}
                            data={document}
                            relationId={subjectVersionId ?? ''}
                            relationType="subjectVersionId"
                            // disabled={input?.isLocked}
                        />
                    </FormItem>
                </Col>
                <Col span={24}>
                    <Tabs
                        items={[
                            {
                                key: '1',
                                label: 'Mục tiêu',
                                children: (
                                    <FormItem form={form} name="objectives">
                                        <Input.TextArea
                                            rows={6}
                                            placeholder="Nhập mục tiêu"
                                            disabled={input?.isLocked}
                                        />
                                    </FormItem>
                                ),
                            },
                            {
                                key: '2',
                                label: 'Chuẩn đầu ra',
                                children: (
                                    <FormItem form={form} name="learningOutcome">
                                        <Input.TextArea
                                            rows={6}
                                            placeholder="Nhập chuẩn đầu ra"
                                            disabled={input?.isLocked}
                                        />
                                    </FormItem>
                                ),
                            },
                            {
                                key: '3',
                                label: 'Cấu trúc chương trình đào',
                                children: (
                                    <FormItem form={form} name="structure">
                                        <Input.TextArea
                                            rows={6}
                                            placeholder="Nhập cấu trúc chương trình đào tạo"
                                            disabled={input?.isLocked}
                                        />
                                    </FormItem>
                                ),
                            },
                            {
                                key: '4',
                                label: 'Kế hoạch và phương pháp dạy học',
                                children: (
                                    <FormItem form={form} name="guild">
                                        <Input.TextArea
                                            rows={6}
                                            placeholder="Nhập kế hoạch và phương pháp dạy học"
                                            disabled={input?.isLocked}
                                        />
                                    </FormItem>
                                ),
                            },
                            {
                                key: '5',
                                label: 'Đánh giá kết quả học tập',
                                children: (
                                    <FormItem form={form} name="academicResults">
                                        <Input.TextArea
                                            rows={6}
                                            placeholder="Nhập đánh giá kết quả học tập"
                                            disabled={input?.isLocked}
                                        />
                                    </FormItem>
                                ),
                            },
                            {
                                key: '6',
                                label: 'Cơ sở vật chất, học liệu',
                                children: (
                                    <FormItem form={form} name="materials">
                                        <Input.TextArea
                                            rows={6}
                                            placeholder="Nhập cơ sở vật chất, học liệu"
                                            disabled={input?.isLocked}
                                        />
                                    </FormItem>
                                ),
                            },
                            {
                                key: '7',
                                label: 'Quy định của học phần',
                                children: (
                                    <FormItem form={form} name="rules">
                                        <Input.TextArea
                                            rows={6}
                                            placeholder="Nhập quy định của học phần"
                                            disabled={input?.isLocked}
                                        />
                                    </FormItem>
                                ),
                            },
                        ]}
                    />
                </Col>
            </Row>
        </PutFormModal>
    )
}

export default PutVersionSubjectModal
