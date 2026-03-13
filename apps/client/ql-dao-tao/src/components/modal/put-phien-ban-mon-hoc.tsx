import { queryClient } from '@api/index'
import DocumentPaths from '@components/commons/documentPaths'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import { RichTextEditor } from '@components/commons/rich-text-editor'
import Select from '@components/commons/select'
import Tabs from '@components/commons/tabar'
import { useExamTypeOptions } from '@hooks/examType'
import useSpinner from '@hooks/spinner'
import { type DocumentFile, type SubjectVersion, SubjectVersionType } from '@workspace/db/client'
import {
    useCreateSubjectVersion,
    useCreateSubjectVersionHistory,
    useFindManySubject,
    useFindUniqueSubject,
    useFindUniqueSubjectVersion,
    useUpdateSubjectVersion,
} from '@workspace/db/hooks'
import { useFindManyTrainingObjectTypePermission, useTrainingObjectTypeStore } from '@workspace/ui'
import { Col, Form, Input, InputNumber, message, Radio, Row, Switch, Tooltip } from 'antd'
import dayjs from 'dayjs'
import TreeSelect from '@/components/commons/tree-select'
import 'dayjs/locale/vi'
import { subjectVersionTypeOptions } from '@workspace/libs/constants'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { BadgeHelpIcon } from 'lucide-react'

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
                studentSubjectScore: { take: 1 },
                subject: true,
            },
        },
        { enabled: !!subjectVersionId, refetchOnWindowFocus: false }
    )

    const subjectId = input?.subjectId || subjectVersion?.subjectId || ''

    const isScored = useMemo(
        () => !!subjectVersion?.studentSubjectScore.length,
        [subjectVersion?.studentSubjectScore.length]
    )

    const { showSpinner, hideSpinner } = useSpinner()

    const { options } = useExamTypeOptions()

    const { data: subject } = useFindUniqueSubject(
        { where: { id: subjectId } },
        { enabled: !!subjectId, refetchOnWindowFocus: false }
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
    }, { refetchOnWindowFocus: false })

    const { data: trainingObjectType = [] } = useFindManyTrainingObjectTypePermission(
        {
            select: { id: true, name: true },
        },
        { refetchOnWindowFocus: false }
    )

    const treeData =
        subjectData
            .filter((subject) => subject.subjectVersion.length > 0)
            .map((subject) => ({
                title: subject.name,
                value: subject.id,
                selectable: false,
                children:
                    subject.subjectVersion.map((version: SubjectVersion) => ({
                        title: [version.code, version.name].join(' - '),
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
                onePoint: output.onePoint,
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
                    structure: 'Cấu trúc học phần',
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
                if (changes.length > 0 && window?.contextData?.userId) {
                    const historyContent = changes.join('<br />')
                    const historyData = {
                        content: historyContent,
                        action: HistorySubjectVersionType.UPDATE,
                        updatedBy: {
                            connect: {
                                id: window?.contextData?.userId,
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
                            id: window?.contextData?.userId,
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
                    ? `Sửa phiên bản môn học - ${subject?.name ?? ''}`
                    : `Thêm phiên bản môn học - ${subject?.name ?? ''}`
            }
            className="w-[80vw]"
            okButtonProps={{ disabled: input?.isLocked }}
            cancelButtonProps={{ disabled: input?.isLocked }}
        >
            <Row gutter={[16, 16]} ref={modalContentRef}>
                <Col span={4}>
                    <FormItem form={form} name="code" label="Mã môn học" required>
                        <Input placeholder="Mã môn học" readOnly={input?.isLocked} />
                    </FormItem>
                </Col>
                <Col span={4}>
                    <FormItem form={form} name="codeTkb" label="Mã TKB">
                        <Input placeholder="Mã TKB" readOnly={input?.isLocked} />
                    </FormItem>
                </Col>
                <Col span={8}>
                    <FormItem form={form} name="name" label="Tên môn học" required>
                        <Input placeholder="Tên môn học" readOnly={input?.isLocked} />
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
                            {...(input?.isLocked
                                ? {
                                      showSearch: false,
                                      allowClear: false,
                                      showArrow: false,
                                      open: false,
                                  }
                                : {})}
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
                            {...(input?.isLocked
                                ? {
                                      showSearch: false,
                                      allowClear: false,
                                      showArrow: false,
                                      open: false,
                                  }
                                : {})}
                            allowClear
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
                            {...(input?.isLocked
                                ? {
                                      showSearch: false,
                                      allowClear: false,
                                      showArrow: false,
                                      open: false,
                                  }
                                : {})}
                        />
                    </FormItem>
                </Col>
                <Col span={8}>
                    <FormItem
                        form={form}
                        name="onePoint"
                        label={
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className="">Một đầu điểm</span>
                                <Tooltip
                                    placement="topLeft"
                                    title={
                                        <div>
                                            <div>
                                                <strong>1 đầu điểm:</strong> Chỉ nhập điểm thi (điểm
                                                học phần bằng điểm thi)
                                            </div>
                                            <div>
                                                <strong>3 đầu điểm:</strong> Có điểm thường xuyên,
                                                định kỳ, thi (điểm học phần nhân theo hệ số)
                                            </div>
                                        </div>
                                    }
                                >
                                    <BadgeHelpIcon size={16} style={{ margin: '0 0 -1px' }} />
                                </Tooltip>
                            </div>
                        }
                    >
                        <Switch checkedChildren="1 đầu điểm" unCheckedChildren="3 đầu điểm" />
                    </FormItem>
                </Col>
                <Col span={8}>
                    <FormItem form={form} name="credit" label="Số tín chỉ" required>
                        <InputNumber
                            min={0}
                            disabled={isScored}
                            type="number"
                            placeholder="Số tín chỉ"
                            className="w-full"
                            readOnly={input?.isLocked}
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
                            readOnly={input?.isLocked}
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
                            readOnly={input?.isLocked}
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
                            readOnly={input?.isLocked}
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
                            readOnly={input?.isLocked}
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
                            readOnly={input?.isLocked}
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
                            readOnly={input?.isLocked}
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
                            placeholder="Chọn môn học tiên quyết"
                            style={{ width: '100%' }}
                            {...(input?.isLocked
                                ? {
                                      showSearch: false,
                                      allowClear: false,
                                      showArrow: false,
                                      open: false,
                                  }
                                : {})}
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
                            placeholder="Chọn môn học song hành"
                            style={{ width: '100%' }}
                            {...(input?.isLocked
                                ? {
                                      showSearch: false,
                                      allowClear: false,
                                      showArrow: false,
                                      open: false,
                                  }
                                : {})}
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
                            readOnly={input?.isLocked}
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
                                        <RichTextEditor editable={!input?.isLocked} />
                                    </FormItem>
                                ),
                            },
                            {
                                key: '2',
                                label: 'Chuẩn đầu ra',
                                children: (
                                    <FormItem form={form} name="learningOutcome">
                                        <RichTextEditor editable={!input?.isLocked} />
                                    </FormItem>
                                ),
                            },
                            {
                                key: '3',
                                label: 'Cấu trúc học phần',
                                children: (
                                    <FormItem form={form} name="structure">
                                        <RichTextEditor editable={!input?.isLocked} />
                                    </FormItem>
                                ),
                            },
                            {
                                key: '4',
                                label: 'Kế hoạch và phương pháp dạy học',
                                children: (
                                    <FormItem form={form} name="guild">
                                        <RichTextEditor editable={!input?.isLocked} />
                                    </FormItem>
                                ),
                            },
                            {
                                key: '5',
                                label: 'Đánh giá kết quả học tập',
                                children: (
                                    <FormItem form={form} name="academicResults">
                                        <RichTextEditor editable={!input?.isLocked} />
                                    </FormItem>
                                ),
                            },
                            {
                                key: '6',
                                label: 'Cơ sở vật chất, học liệu',
                                children: (
                                    <FormItem form={form} name="materials">
                                        <RichTextEditor editable={!input?.isLocked} />
                                    </FormItem>
                                ),
                            },
                            {
                                key: '7',
                                label: 'Quy định của học phần',
                                children: (
                                    <FormItem form={form} name="rules">
                                        <RichTextEditor editable={!input?.isLocked} />
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
