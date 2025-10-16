import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type {
    DocumentFile,
    StudentScoreConvert,
    SubjectScoreConvert,
    SubjectVersion,
} from '@workspace/db'
import {
    useCreateStudentScoreConvert,
    useFindUniqueStudent,
    useFindUniqueStudentScoreConvert,
    useUpdateStudentScoreConvert,
    useFindManyStudent,
} from '@workspace/db/hooks'
import { Col, Form, Input, message, InputNumber, Button, Select, Row } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import DocumentPaths from '@components/commons/documentPaths'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'

export type PutStudentScoreConvert = StudentScoreConvert & {
    subjectScoreConvert: Partial<SubjectScoreConvert>[]
    documentFiles?: DocumentFile[]
}
dayjs.locale('vi')
const PutStudentScoreConvertModal = () => {
    const [form] = Form.useForm<PutStudentScoreConvert>()
    const [document, setDocument] = useState<DocumentFile[]>([])
    const [studentKeyword, setStudentKeyword] = useState<string>('')
    const originalStatusRef = useRef<Record<string, 'PENDING' | 'APPROVED' | 'REJECTED'>>({})
    const { showSpinner, hideSpinner } = useSpinner()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: 'PutStudentScoreConvertModal',
        onClose: () => {
            form.resetFields()
            setDocument([])
            setStudentKeyword('')
        },
    })
    const isEdit = !!id
    const selectedSubjects = Form.useWatch('subjectScoreConvert', form) || []
    const selectedSubjectIds = useMemo(
        () => new Set(selectedSubjects.map((s: any) => s?.subjectVersionId).filter(Boolean)),
        [selectedSubjects]
    )
    const { data: studentList = [], isFetching: loadingStudents } = useFindManyStudent({
        where: {
            active: true,
            // tìm theo họ tên / fullname / mã
            userProfile: {
                is: {
                    OR: [
                        { firstName: { contains: studentKeyword, mode: 'insensitive' } },
                        { lastName: { contains: studentKeyword, mode: 'insensitive' } },
                        { fullname: { contains: studentKeyword, mode: 'insensitive' } },
                    ],
                },
            },
            OR: [{ code: { contains: studentKeyword, mode: 'insensitive' } }],
        },
        include: { userProfile: true },
        take: 20,
    })
    const selectedStudentId = Form.useWatch('studentId', form)
    const { data: selectedStudent } = useFindUniqueStudent(
        {
            where: { id: selectedStudentId || '' },
            include: {
                curriculumVersion: {
                    include: {
                        trainingBlocks: {
                            include: {
                                subjects: {
                                    include: {
                                        subject: true,
                                    },
                                },
                            },
                        },
                    },
                },
                fixedClass: {
                    include: {
                        curriculumVersion: {
                            include: {
                                trainingBlocks: {
                                    include: {
                                        subjects: {
                                            include: {
                                                subject: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        { enabled: !!selectedStudentId }
    )

    const allSubjectOptions = useMemo(() => {
        const cv =
            selectedStudent?.curriculumVersion ?? selectedStudent?.fixedClass?.curriculumVersion
        if (!cv) return []

        const list: { value: string; label: string }[] = []
        cv.trainingBlocks?.forEach((tb: any) => {
            tb.subjects?.forEach((s: any) => {
                const sv = s.subject as SubjectVersion | undefined
                if (sv?.id) {
                    const label = `${sv.code ?? ''} ${sv.name ?? ''}`.trim()
                    list.push({ value: sv.id, label })
                }
            })
        })
        const map = new Map<string, { value: string; label: string }>()
        list.forEach((it) => {
            map.set(it.value, it)
        })
        return Array.from(map.values())
    }, [selectedStudent])

    const { mutateAsync: createStudentScoreConvert } = useCreateStudentScoreConvert()
    const { mutateAsync: updateStudentScoreConvert } = useUpdateStudentScoreConvert()

    async function onOk(output?: PutStudentScoreConvert) {
        if (!output) return

        const rows = (output.subjectScoreConvert || []) as Array<{
            id?: string
            subjectVersionId?: string
            score?: number | string
            status?: 'PENDING' | 'APPROVED' | 'REJECTED'
        }>

        const toCreate = rows
            .filter((r) => !r.id && r.subjectVersionId && r.score !== undefined && r.score !== null)
            .map((r) => ({
                subjectVersionId: r.subjectVersionId ?? '',
                score: Number(r.score),
            }))

        const toUpdate = rows
            // Chỉ cập nhật những dòng đã có id VÀ trạng thái GỐC của nó không phải là 'APPROVED'
            .filter((r) => !!r.id && originalStatusRef.current[r.id] !== 'APPROVED')
            .map((r) => ({
                where: { id: r.id },
                data: {
                    subjectVersionId: r.subjectVersionId ?? '',
                    score: Number(r.score),
                    status: r.status,
                },
            }))

        const getDocumentPayload = () => {
            const validFiles = (output.documentFiles || []).filter((f) => !!f.path)
            if (validFiles.length > 0) {
                return {
                    deleteMany: {},
                    createMany: {
                        data: validFiles.map((file) => ({
                            name: file.name,
                            path: file.path,
                            mimeType: file.mimeType,
                            size: file.size,
                        })),
                    },
                }
            }
            return {
                deleteMany: {},
            }
        }

        try {
            showSpinner()
            console.log('Dữ liệu file lưu: ', output.documentFiles)
            if (id) {
                await updateStudentScoreConvert({
                    where: { id },
                    data: {
                        studentId: output.studentId,
                        description: output.description,
                        // TODO: xử lý file
                        documentFiles: getDocumentPayload(),
                        subjectScoreConvert: {
                            ...(toCreate.length
                                ? { createMany: { data: toCreate, skipDuplicates: true } }
                                : {}),
                            ...(toUpdate.length ? { update: toUpdate } : {}),
                        },
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createStudentScoreConvert({
                    data: {
                        studentId: output.studentId,
                        description: output.description,
                        documentFiles: {
                            create:
                                (output.documentFiles || []).map((file) => ({
                                    name: file.name,
                                    path: file.path,
                                    mimeType: file.mimeType,
                                    size: file.size,
                                })) || [],
                        },
                        subjectScoreConvert: {
                            createMany: {
                                data: toCreate,
                            },
                        },
                    },
                })
                message.success('Thêm mới thành công')
            }
            queryClient.invalidateQueries({
                queryKey: ['StudentScoreConvert'],
            })
            onClose()
        } catch (error: any) {
            message.error(error?.info?.message || 'Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const { data: initialValue } = useFindUniqueStudentScoreConvert(
        {
            where: { id },
            include: {
                student: {
                    include: {
                        curriculumVersion: true,
                        fixedClass: { include: { curriculumVersion: true } },
                        userProfile: true,
                    },
                },
                subjectScoreConvert: {
                    include: { subjectVersion: { include: { subject: true } } },
                },
                documentFiles: true,
            },
        },
        { enabled: !!id }
    )

    useEffect(() => {
        if (!isOpen) return
        if (initialValue) {
            form.setFieldsValue({
                ...initialValue,
                subjectScoreConvert: (initialValue.subjectScoreConvert || []).map((i: any) => ({
                    id: i.id,
                    subjectVersionId: i.subjectVersionId,
                    score: i.score,
                    status: i.status,
                })),
            })
            originalStatusRef.current = Object.fromEntries(
                (initialValue?.subjectScoreConvert || []).map((i: any) => [i.id, i.status])
            )
            setDocument((initialValue.documentFiles || []) as DocumentFile[])
        } else {
            form.setFieldsValue({})
            setDocument([])
        }
    }, [initialValue, isOpen, form])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={id ? 'Chỉnh sửa phiếu chuyển trường' : 'Thêm mới phiếu chuyển trường'}
            className="w-[50vw]"
        >
            <Col span={24}>
                <FormItem form={form} name="studentId" label="Sinh viên" required>
                    <Select
                        showSearch
                        placeholder="Chọn sinh viên"
                        allowClear
                        loading={loadingStudents}
                        filterOption={false}
                        onSearch={(v) => setStudentKeyword(v)}
                        disabled={isEdit}
                        options={studentList.map((s: any) => {
                            const fullName =
                                s?.userProfile?.fullName ??
                                [s?.userProfile?.lastName, s?.userProfile?.firstName]
                                    .filter(Boolean)
                                    .join(' ')
                            const extra = s?.code ? ` - ${s.code}` : ''
                            return { value: s.id, label: `${fullName}${extra}` }
                        })}
                    />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="subjectScoreConvert" label="Môn cần quy đổi điểm">
                    <Form.List name="subjectScoreConvert">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name }) => (
                                    <Form.Item noStyle shouldUpdate key={key}>
                                        {({ getFieldValue }) => {
                                            const row =
                                                getFieldValue(['subjectScoreConvert', name]) || {}
                                            const rowId: string | undefined = row?.id
                                            const isApproved =
                                                !!id &&
                                                !!rowId &&
                                                originalStatusRef.current[rowId] === 'APPROVED'
                                            const optionsForThisRow = allSubjectOptions.filter(
                                                (opt) =>
                                                    opt.value === row.subjectVersionId ||
                                                    !selectedSubjectIds.has(opt.value)
                                            )
                                            return (
                                                <Row
                                                    gutter={12}
                                                    align="middle"
                                                    style={{ marginBottom: 8 }}
                                                >
                                                    <Col flex="auto">
                                                        <FormItem
                                                            form={form}
                                                            name={[name, 'subjectVersionId']}
                                                            label="Môn học (CTĐT)"
                                                            required
                                                        >
                                                            <Select
                                                                showSearch
                                                                placeholder={
                                                                    selectedStudentId
                                                                        ? 'Chọn môn theo CTĐT'
                                                                        : 'Chọn sinh viên để tải CTĐT'
                                                                }
                                                                optionFilterProp="label"
                                                                options={optionsForThisRow}
                                                                disabled={
                                                                    !selectedStudentId ||
                                                                    !allSubjectOptions.length ||
                                                                    isApproved
                                                                }
                                                            />
                                                        </FormItem>
                                                    </Col>

                                                    <Col>
                                                        <FormItem
                                                            form={form}
                                                            name={[name, 'score']}
                                                            label="Điểm"
                                                            required
                                                        >
                                                            <InputNumber
                                                                min={0}
                                                                max={10}
                                                                step={0.1}
                                                                className="w-[120px]"
                                                                disabled={isApproved}
                                                            />
                                                        </FormItem>
                                                    </Col>

                                                    {/* Trạng thái: chỉ hiện khi EDIT; CREATE thì giấu và set mặc định PENDING */}
                                                    {isEdit ? (
                                                        <Col>
                                                            <FormItem
                                                                form={form}
                                                                name={[name, 'status']}
                                                                label="Trạng thái"
                                                                required
                                                            >
                                                                <Select
                                                                    style={{ width: 160 }}
                                                                    disabled={isApproved}
                                                                    options={[
                                                                        {
                                                                            label: 'Chờ duyệt',
                                                                            value: 'PENDING',
                                                                        },
                                                                        {
                                                                            label: 'Đã duyệt',
                                                                            value: 'APPROVED',
                                                                        },
                                                                        {
                                                                            label: 'Không được duyệt',
                                                                            value: 'REJECTED',
                                                                        },
                                                                    ]}
                                                                />
                                                            </FormItem>
                                                        </Col>
                                                    ) : (
                                                        <FormItem
                                                            form={form}
                                                            name={[name, 'status']}
                                                            initialValue="PENDING"
                                                            hidden
                                                        />
                                                    )}

                                                    <Col>
                                                        <Button
                                                            danger
                                                            type="text"
                                                            icon={<MinusCircleOutlined />}
                                                            onClick={() => remove(name)}
                                                            disabled={isApproved} // không xóa khi đã APPROVED
                                                        />
                                                    </Col>
                                                </Row>
                                            )
                                        }}
                                    </Form.Item>
                                ))}

                                <Button
                                    type="dashed"
                                    icon={<PlusOutlined />}
                                    onClick={() => add()}
                                    disabled={!selectedStudentId}
                                >
                                    Thêm môn
                                </Button>
                            </>
                        )}
                    </Form.List>
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="documentFiles" label="Tài liệu minh chứng">
                    <div style={{ maxHeight: 220, overflowY: 'auto', overflowX: 'hidden' }}>
                        <DocumentPaths
                            form={form}
                            data={document}
                            relationId={id ?? ''}
                            relationType="studentScoreConvertId"
                        />
                    </div>
                </FormItem>
            </Col>

            {/* Mô tả */}
            <Col span={24}>
                <FormItem form={form} name="description" label="Mô tả">
                    <Input.TextArea placeholder="Nhập mô tả" />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutStudentScoreConvertModal
