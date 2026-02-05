import { PlusOutlined } from '@ant-design/icons'
import DocumentPaths from '@components/commons/documentPaths'
import FormItem from '@components/commons/form-item'
import Select from '@components/commons/select'
import Table from '@components/commons/table'
import useSpinner from '@hooks/spinner'
import {
    $Enums,
    DocumentFile,
    ScoreLinkSheet,
    ScoreLinkStudent,
    ScoreLinkSubjectVersion,
} from '@workspace/db'
import {
    useCreateScoreLinkSheet,
    useFindManyFixedClass,
    useFindManySchoolYear,
    useFindManyStudent,
    useFindManySubjectVersion,
    useFindManyTrainingObjectType,
    useFindUniqueScoreLinkSheet,
    useUpdateScoreLinkSheet,
} from '@workspace/db/hooks'
import { PutFormModal, TreeNodeType, useTrainingObjectTypeStore } from '@workspace/ui'
import {
    Button,
    Col,
    Form,
    Input,
    InputNumber,
    message,
    Row,
    Tabs,
    Tooltip,
    TreeSelect as TreeSelectAnt,
} from 'antd'
import { Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

const ScoreLinkStatus = $Enums.ScoreLinkStatus
type ScoreLinkStatus = $Enums.ScoreLinkStatus
const statusOptions = [
    { label: 'Chờ duyệt', value: ScoreLinkStatus.PENDING },
    { label: 'Đã duyệt', value: ScoreLinkStatus.APPROVED },
    { label: 'Không được duyệt', value: ScoreLinkStatus.REJECTED },
]
type ScoreLinkSubjectVersionCustom = ScoreLinkSubjectVersion & {
    scoreLinkStudents: ScoreLinkStudent[]
}
export type PutScoreLinkSheet = ScoreLinkSheet & {
    scoreLinkSubjectVersions: ScoreLinkSubjectVersionCustom[]
    documents?: DocumentFile[]
}

const messages = {
    success: {
        edit: 'Cập nhật phiếu thành công',
        create: 'Tạo phiếu thành công',
    },
    error: {
        edit: 'Cập nhật phiếu thất bại',
        create: 'Tạo phiếu thất bại',
    },
}

const PutScoreLinkSheetModal = () => {
    const [form] = Form.useForm()
    const { showSpinner, hideSpinner } = useSpinner()
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>()
    const { isOpen, onClose, input } = useDisclosure<{ id: string; mode: 'view' | 'edit' }>({
        tag: 'PutScoreLinkSheetModal',
        onClose: () => {
            form.resetFields()
            setSelectedSubjectId(undefined)
        },
    })
    const mode = input?.mode
    const isView = mode === 'view'
    const isEdit = mode === 'edit'
    const isCreate = !mode
    const { data: scoreLinkSheetDetail, isFetching: loadingDetail } = useFindUniqueScoreLinkSheet(
        {
            where: { id: input?.id },
            include: {
                scoreLinkSubjectVersions: {
                    include: {
                        scoreLinkStudents: true,
                        subjectVersion: true,
                    },
                },
                documents: true,
            },
        },
        {
            enabled: isOpen && !!input?.id,
        }
    )

    const { mutateAsync: createScoreLinkSheet } = useCreateScoreLinkSheet({
        onSuccess: () => {
            message.success(messages.success.create)
        },
        onError: () => {
            message.error(messages.error.create)
        },
        onSettled: () => {
            onClose()
            hideSpinner()
        },
    })
    const { mutateAsync: updateScoreLinkSheet } = useUpdateScoreLinkSheet({
        onSuccess: () => {
            message.success(messages.success.edit)
        },
        onError: () => {
            message.error(messages.error.edit)
        },
        onSettled: () => {
            onClose()
            hideSpinner()
        },
    })
    const { data: fixedClasses = [] } = useFindManyFixedClass()
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const { data: trainingObjectTypeList = [] } = useFindManyTrainingObjectType(
        {
            orderBy: {
                name: 'asc',
            },
        },
        { enabled: isOpen }
    )
    const { data: schoolYears } = useFindManySchoolYear({
        orderBy: { startDate: 'desc' },
        include: {
            semesters: {
                orderBy: { createdAt: 'desc' },
            },
        },
    })
    const fixedClassId = Form.useWatch('fixedClassId', form)
    const { data: subjectVersions = [], isFetching: isFetchingSubjectVersions } =
        useFindManySubjectVersion(
            {
                where: {
                    deletedAt: null,
                    ...(trainingObjectTypeId ? { trainingObjectTypeId } : {}),
                },
                orderBy: { createdAt: 'desc' },
            },
            {
                enabled: !!trainingObjectTypeId,
            }
        )

    const { data: studentList = [], isFetching: loadingStudents } = useFindManyStudent(
        {
            where: {
                active: true,
                OR: [{ fixedClass: { id: fixedClassId } }],
            },
            include: { userProfile: true },
            take: 20,
        },
        { enabled: !!fixedClassId }
    )
    const filterTreeNode = (input: string, treeNode: any) => {
        return treeNode?.title?.toLowerCase()?.includes(input?.toLowerCase())
    }
    const treeDataSemester: TreeNodeType[] = useMemo(() => {
        return (
            schoolYears?.map((schoolYear) => ({
                value: `schoolYear-${schoolYear.id}`,
                title: schoolYear.name,
                selectable: false,
                children:
                    schoolYear.semesters.map((semester) => ({
                        value: semester.id,
                        title: `${semester.name}`,
                    })) || [],
            })) || []
        )
    }, [schoolYears])
    const onFinish = async (values: PutScoreLinkSheet) => {
        if (mode === 'view') return
        showSpinner()
        if (mode === 'edit' && input?.id) {
            await updateScoreLinkSheet({
                where: { id: input.id },
                data: {
                    trainingObjectTypeId: values.trainingObjectTypeId,
                    decision: values.decision,
                    fixedClassId: values.fixedClassId,
                    semesterId: values.semesterId,
                    description: values.description,
                    updatedAt: new Date(),
                    scoreLinkSubjectVersions: {
                        deleteMany: {
                            scoreLinkSheetId: input.id,
                        },
                        create: values.scoreLinkSubjectVersions.map((sv) => ({
                            subjectVersionId: sv.subjectVersionId,
                            scoreLinkStudents: {
                                create: sv.scoreLinkStudents.map((ss) => ({
                                    studentId: ss.studentId,
                                    score: ss.score,
                                })),
                            },
                        })),
                    },

                    documents: {
                        set: [],
                        create: (values.documents ?? []).map((file) => ({
                            name: file.name,
                            path: file.path,
                            mimeType: file.mimeType,
                            size: file.size,
                        })),
                    },
                },
            })
            return
        }

        await createScoreLinkSheet({
            data: {
                trainingObjectTypeId: values.trainingObjectTypeId,
                decision: values.decision,
                fixedClassId: values.fixedClassId,
                semesterId: values.semesterId,
                description: values.description,
                scoreLinkSubjectVersions: {
                    create: values.scoreLinkSubjectVersions.map((sv) => ({
                        subjectVersionId: sv.subjectVersionId,
                        scoreLinkStudents: {
                            create: sv.scoreLinkStudents.map((ss) => ({
                                studentId: ss.studentId,
                                score: ss.score,
                            })),
                        },
                    })),
                },

                documents: {
                    create: (values.documents ?? []).map((file) => ({
                        name: file.name,
                        path: file.path,
                        mimeType: file.mimeType,
                        size: file.size,
                    })),
                },
            },
        })
    }

    useEffect(() => {
        if (isOpen && trainingObjectTypeId) {
            form.setFieldValue('trainingObjectTypeId', trainingObjectTypeId)
        }
    }, [isOpen, trainingObjectTypeId, form])

    useEffect(() => {
        if (!isOpen || !scoreLinkSheetDetail) return

        form.setFieldsValue({
            trainingObjectTypeId: scoreLinkSheetDetail.trainingObjectTypeId,
            decision: scoreLinkSheetDetail.decision,
            fixedClassId: scoreLinkSheetDetail.fixedClassId,
            semesterId: scoreLinkSheetDetail.semesterId,
            description: scoreLinkSheetDetail.description,
            status: scoreLinkSheetDetail.status,

            scoreLinkSubjectVersions: scoreLinkSheetDetail.scoreLinkSubjectVersions.map((sv) => ({
                subjectVersionId: sv.subjectVersionId,
                scoreLinkStudents: sv.scoreLinkStudents.map((ss) => ({
                    studentId: ss.studentId,
                    score: ss.score,
                })),
            })),

            documents: scoreLinkSheetDetail.documents?.map((d) => ({
                name: d.name,
                path: d.path,
                mimeType: d.mimeType,
                size: d.size,
            })),
        })
    }, [isOpen, scoreLinkSheetDetail, form])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            title={
                isView
                    ? 'Xem phiếu điểm liên kết'
                    : isEdit
                      ? 'Cập nhật phiếu điểm liên kết'
                      : 'Thêm phiếu điểm liên kết'
            }
            className="w-[60vw] justify-between"
            okButtonProps={{
                className: isView ? 'hidden' : '',
            }}
            cancelText={isView ? 'Đóng' : 'Hủy'}
            okText={isView ? undefined : isEdit ? 'Cập nhật' : 'Thêm mới'}
            onCancel={onClose}
            onFinish={onFinish}
        >
            <Row gutter={[8, 16]} className="w-full" justify="space-between">
                <Col span={12}>
                    <FormItem
                        name="trainingObjectTypeId"
                        form={form}
                        label="Đối tượng đào tạo"
                        required
                    >
                        <Select
                            defaultValue={trainingObjectTypeId}
                            options={trainingObjectTypeList?.map(({ id, name }) => ({
                                value: id,
                                label: name,
                            }))}
                            disabled={!!trainingObjectTypeId || isView}
                            placeholder="Chọn đối tượng đào tạo"
                        />
                    </FormItem>
                </Col>

                <Col span={12}>
                    <FormItem name="decision" form={form} label="Số quyết định" required>
                        <Input disabled={isView} placeholder="Nhập số quyết định" />
                    </FormItem>
                </Col>
            </Row>

            <Row gutter={[8, 16]} className="w-full">
                <Col span={isCreate ? 12 : 8}>
                    <FormItem name="fixedClassId" form={form} label="Lớp quản lí" required>
                        <Select
                            options={fixedClasses?.map((e) => ({
                                label: e.name,
                                value: e.id,
                            }))}
                            disabled={isView}
                            onChange={() => form.setFieldValue('scoreLinkSubjectVersions', [])}
                            placeholder="Chọn lớp quản lí"
                        />
                    </FormItem>
                </Col>

                <Col span={isCreate ? 12 : 8}>
                    <FormItem form={form} name="semesterId" label="Kỳ học">
                        <TreeSelectAnt
                            disabled={isView}
                            showSearch
                            dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                            placeholder={'Chọn kỳ học'}
                            allowClear
                            treeDefaultExpandAll
                            treeData={treeDataSemester}
                            filterTreeNode={filterTreeNode}
                            treeNodeFilterProp="title"
                        />
                    </FormItem>
                </Col>
                <Col span={8} hidden={mode !== 'edit' && mode !== 'view'}>
                    <FormItem form={form} name="status" label="Trạng thái">
                        <Select
                            disabled={isView}
                            defaultValue={ScoreLinkStatus.PENDING}
                            style={{
                                width: '100%',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                            placeholder="Đổi trạng thái nhanh"
                            options={statusOptions}
                        />
                    </FormItem>
                </Col>
            </Row>

            <Col span={24}>
                <Form.List name="scoreLinkSubjectVersions">
                    {(fields, { add, remove }) => (
                        <>
                            <Row gutter={[16, 16]}>
                                <Col span={12}>
                                    <Row gutter={8}>
                                        <Row gutter={8}>
                                            <Col span={12}>
                                                <Select
                                                    loading={isFetchingSubjectVersions}
                                                    options={subjectVersions.map((sv) => ({
                                                        label: `${sv.name}${sv.code ? ` - (${sv.code})` : ''}`,
                                                        value: sv.id,
                                                    }))}
                                                    value={selectedSubjectId}
                                                    onChange={(value) =>
                                                        setSelectedSubjectId(value)
                                                    }
                                                    placeholder="Chọn môn"
                                                    className="max-w-48 w-full"
                                                    disabled={!trainingObjectTypeId}
                                                />
                                            </Col>
                                            <Col span={12}>
                                                <Button
                                                    type="dashed"
                                                    disabled={
                                                        !trainingObjectTypeId ||
                                                        !fixedClassId ||
                                                        !selectedSubjectId
                                                    }
                                                    icon={<PlusOutlined />}
                                                    className="mb-2"
                                                    onClick={() => {
                                                        const students =
                                                            studentList?.map((s) => ({
                                                                studentId: s?.id,
                                                                score: 0,
                                                            })) ?? []
                                                        add({
                                                            subjectVersionId: selectedSubjectId,
                                                            scoreLinkStudents: students,
                                                        })
                                                        setSelectedSubjectId(undefined)
                                                    }}
                                                >
                                                    Thêm môn học
                                                </Button>
                                            </Col>
                                        </Row>
                                    </Row>
                                </Col>
                            </Row>

                            <Tabs
                                tabPosition="left"
                                className="pt-2.5"
                                items={fields.map((f) => {
                                    const getValue = form.getFieldValue
                                    const subjectId = form.getFieldValue([
                                        'scoreLinkSubjectVersions',
                                        f.name,
                                        'subjectVersionId',
                                    ])

                                    const subject = subjectVersions.find((s) => s.id === subjectId)

                                    return {
                                        key: String(f.key),
                                        label: (
                                            <Tooltip
                                                trigger="hover"
                                                title={`${subject?.name}${subject?.code ? ` - (${subject?.code})` : ''}`}
                                            >
                                                <div className="w-24 overflow-hidden text-ellipsis whitespace-nowrap">{`${subject?.name}${subject?.code ? ` - (${subject?.code})` : ''}`}</div>
                                            </Tooltip>
                                        ),
                                        children: (
                                            <>
                                                <Table
                                                    pagination={false}
                                                    dataSource={getValue([
                                                        'scoreLinkSubjectVersions',
                                                        f.name,
                                                        'scoreLinkStudents',
                                                    ])}
                                                    columns={[
                                                        {
                                                            title: 'Sinh viên',
                                                            render: (_, __, i) => {
                                                                const studentId = getValue([
                                                                    'scoreLinkSubjectVersions',
                                                                    f.name,
                                                                    'scoreLinkStudents',
                                                                    i,
                                                                    'studentId',
                                                                ])

                                                                const student = studentList.find(
                                                                    (s) => s.id === studentId
                                                                )

                                                                return (
                                                                    student?.userProfile
                                                                        ?.fullname || '—'
                                                                )
                                                            },
                                                        },
                                                        {
                                                            title: 'Điểm',
                                                            width: 120,
                                                            render: (_, __, i) => (
                                                                <FormItem
                                                                    form={form}
                                                                    name={[
                                                                        f.name,
                                                                        'scoreLinkStudents',
                                                                        i,
                                                                        'score',
                                                                    ]}
                                                                    rules={[{ required: true }]}
                                                                    noStyle
                                                                >
                                                                    <InputNumber
                                                                        disabled={isView}
                                                                        min={0}
                                                                        max={10}
                                                                        className="w-full"
                                                                    />
                                                                </FormItem>
                                                            ),
                                                        },
                                                    ]}
                                                />

                                                <div className="text-right mt-2">
                                                    <Button
                                                        danger
                                                        type="text"
                                                        icon={<Trash2 size={16} />}
                                                        onClick={() => remove(f.name)}
                                                    >
                                                        Xóa môn
                                                    </Button>
                                                </div>
                                            </>
                                        ),
                                    }
                                })}
                            />
                        </>
                    )}
                </Form.List>
            </Col>

            <Col span={24}>
                <FormItem name="documents" label="Tài liệu minh chứng" form={form}>
                    <DocumentPaths
                        form={form}
                        data={[]}
                        relationId=""
                        relationType="scoreLinkSheetId"
                    />
                </FormItem>
            </Col>

            <Col span={24}>
                <FormItem name="description" label="Mô tả" form={form}>
                    <Input.TextArea disabled={isView} rows={3} />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutScoreLinkSheetModal
