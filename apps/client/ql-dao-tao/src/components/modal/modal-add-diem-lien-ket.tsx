import { PlusOutlined } from '@ant-design/icons'
import DocumentPaths from '@components/commons/documentPaths'
import FormItem from '@components/commons/form-item'
import Select from '@components/commons/select'
import Table from '@components/commons/table'
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
} from '@workspace/db/hooks'
import { PutFormModal, TreeNodeType } from '@workspace/ui'
import { Button, Col, Form, Input, InputNumber, Row, TreeSelect as TreeSelectAnt } from 'antd'
import { Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

const ScoreLinkStatus = $Enums.ScoreLinkStatus
type ScoreLinkStatus = $Enums.ScoreLinkStatus
const statusOptions = [
    { label: 'Chờ duyệt', value: ScoreLinkStatus.PENDING },
    { label: 'Đã duyệt', value: ScoreLinkStatus.APPROVED },
    { label: 'Không được duyệt', value: ScoreLinkStatus.REJECTED },
]

export type PutScoreLinkSheet = ScoreLinkSheet & {
    scoreLinkSubjectsVersion: Partial<
        ScoreLinkSubjectVersion & { scoreLinkStudents: Partial<ScoreLinkStudent> }
    >[]
    documentFiles?: DocumentFile[]
}

const PutScoreLinkSheetModal = () => {
    const [form] = Form.useForm<PutScoreLinkSheet>()
    const { isOpen, onClose } = useDisclosure({
        tag: 'PutScoreLinkSheetModal',
    })
    const { mutateAsync: createScoreLinkSheet } = useCreateScoreLinkSheet()
    const [studentKeyword, setStudentKeyword] = useState<string>('')
    const { data: fixedClasses = [] } = useFindManyFixedClass()
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
    const trainingObjectTypeId = Form.useWatch('trainingObjectTypeId', form)
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
                OR: [
                    {
                        userProfile: studentKeyword
                            ? { fullname: { contains: studentKeyword, mode: 'insensitive' } }
                            : {},
                    },
                    { code: { contains: studentKeyword, mode: 'insensitive' } },
                    { fixedClass: { id: fixedClassId } },
                ],
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

    const handelCreateScoreLinkSheet = async (values: PutScoreLinkSheet) => {}

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            title="Phiếu điểm liên kết"
            className="w-[60vw] justify-between"
            onCancel={onClose}
            onFinish={(values) => {
                console.log('SUBMIT SCORE LINK SHEET', values)
            }}
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
                            options={trainingObjectTypeList?.map(({ id, name }) => ({
                                value: id,
                                label: name,
                            }))}
                            placeholder="Chọn đối tượng đào tạo"
                        />
                    </FormItem>
                </Col>

                <Col span={12}>
                    <FormItem name="decision" form={form} label="Số quyết định" required>
                        <Input placeholder="Nhập số quyết định" />
                    </FormItem>
                </Col>
            </Row>

            <Row gutter={[8, 16]} className="w-full">
                <Col span={12}>
                    <FormItem name="fixedClassId" form={form} label="Lớp quản lí" required>
                        <Select
                            options={fixedClasses?.map((e) => ({
                                label: e.name,
                                value: e.id,
                            }))}
                            placeholder="Chọn lớp quản lí"
                        />
                    </FormItem>
                </Col>

                <Col span={12}>
                    <FormItem form={form} name="semesterId" label="Kỳ học">
                        <TreeSelectAnt
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
            </Row>

            <Col span={24}>
                <Form.List name="scoreLinkSubjectVersions">
                    {(fields, { add, remove }) => (
                        <>
                            <Row gutter={[16, 16]}>
                                <Col span={12}>
                                    <Button
                                        type="dashed"
                                        disabled={!trainingObjectTypeId || !fixedClassId}
                                        icon={<PlusOutlined />}
                                        onClick={() => add()}
                                        className="mb-2"
                                    >
                                        Thêm môn học
                                    </Button>
                                </Col>
                                <Col span={12} className="flex justify-end">
                                    <Select
                                        style={{
                                            width: '150px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                        placeholder="Đổi trạng thái nhanh"
                                        options={statusOptions}
                                    />
                                </Col>
                            </Row>

                            <Table
                                size="small"
                                pagination={false}
                                dataSource={fields}
                                rowKey="key"
                                columns={[
                                    {
                                        title: 'Môn CTĐT',
                                        align: 'center',
                                        width: 200,
                                        render: (_, f) => (
                                            <FormItem
                                                form={form}
                                                name={[f.name, 'subjectVersionId']}
                                                rules={[{ required: true }]}
                                                noStyle
                                            >
                                                <Select
                                                    loading={isFetchingSubjectVersions}
                                                    options={subjectVersions.map((sv) => ({
                                                        label: `${sv.name}${sv.code ? ` - (${sv.code})` : ''}`,
                                                        value: sv.id,
                                                    }))}
                                                    placeholder="Chọn môn"
                                                    className="max-w-48 w-full"
                                                    disabled={!trainingObjectTypeId}
                                                />
                                            </FormItem>
                                        ),
                                    },
                                    {
                                        title: <div className="text-center">Sinh viên</div>,
                                        align: 'left',
                                        width: 400,
                                        render: (_, f) => (
                                            <Form.List name={[f.name, 'scoreLinkStudents']}>
                                                {(
                                                    studentFields,
                                                    { add: addStudent, remove: removeStudent }
                                                ) => (
                                                    <>
                                                        <Button
                                                            type="dashed"
                                                            size="small"
                                                            onClick={() => addStudent()}
                                                            className="mb-2 mt-2"
                                                        >
                                                            Thêm sinh viên
                                                        </Button>

                                                        {studentFields.map((sf) => (
                                                            <Row
                                                                key={sf.key}
                                                                gutter={8}
                                                                className="w-full"
                                                            >
                                                                <Col span={14}>
                                                                    <FormItem
                                                                        form={form}
                                                                        name={[
                                                                            sf.name,
                                                                            'studentId',
                                                                        ]}
                                                                        rules={[{ required: true }]}
                                                                        noStyle
                                                                    >
                                                                        <Select
                                                                            showSearch
                                                                            placeholder="Chọn sinh viên"
                                                                            className="w-full"
                                                                            loading={
                                                                                loadingStudents
                                                                            }
                                                                            filterOption={false}
                                                                            disabled={!fixedClassId}
                                                                            onSearch={
                                                                                setStudentKeyword
                                                                            }
                                                                            options={studentList.map(
                                                                                (s: any) => {
                                                                                    const fullName =
                                                                                        s
                                                                                            ?.userProfile
                                                                                            ?.fullName ??
                                                                                        [
                                                                                            s
                                                                                                ?.userProfile
                                                                                                ?.lastName,
                                                                                            s
                                                                                                ?.userProfile
                                                                                                ?.firstName,
                                                                                        ]
                                                                                            .filter(
                                                                                                Boolean
                                                                                            )
                                                                                            .join(
                                                                                                ' '
                                                                                            )
                                                                                    const extra =
                                                                                        s?.code
                                                                                            ? ` - ${s.code}`
                                                                                            : ''
                                                                                    return {
                                                                                        value: s.id,
                                                                                        label: `${fullName}${extra}`,
                                                                                    }
                                                                                }
                                                                            )}
                                                                        />
                                                                    </FormItem>
                                                                </Col>
                                                                <Col span={8}>
                                                                    <FormItem
                                                                        form={form}
                                                                        name={[sf.name, 'score']}
                                                                        rules={[{ required: true }]}
                                                                        noStyle
                                                                    >
                                                                        <InputNumber
                                                                            placeholder="Điểm"
                                                                            className="w-full"
                                                                            min={0}
                                                                            max={10}
                                                                        />
                                                                    </FormItem>
                                                                </Col>
                                                                <Col span={2}>
                                                                    <Button
                                                                        danger
                                                                        type="text"
                                                                        icon={<Trash2 size={16} />}
                                                                        onClick={() =>
                                                                            removeStudent(sf.name)
                                                                        }
                                                                    />
                                                                </Col>
                                                            </Row>
                                                        ))}
                                                    </>
                                                )}
                                            </Form.List>
                                        ),
                                    },
                                    {
                                        title: 'Trạng thái',
                                        width: 100,
                                        align: 'center',
                                        render: (_, record) => (
                                            <FormItem
                                                form={form}
                                                name={[record.name, 'status']}
                                                required
                                                noStyle
                                                className="w-full"
                                            >
                                                <Select
                                                    style={{
                                                        width: '150px',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                    }}
                                                    defaultValue={statusOptions[0]}
                                                    placeholder="Chọn trạng thái"
                                                    options={statusOptions}
                                                />
                                            </FormItem>
                                        ),
                                    },
                                    {
                                        title: '',
                                        width: 60,
                                        align: 'center',
                                        render: (_, f) => (
                                            <Button
                                                danger
                                                type="text"
                                                icon={<Trash2 size={16} />}
                                                onClick={() => remove(f.name)}
                                            />
                                        ),
                                    },
                                ]}
                            />
                        </>
                    )}
                </Form.List>
            </Col>

            <Col span={24}>
                <FormItem name="documentFiles" label="Tài liệu minh chứng" form={form}>
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
                    <Input.TextArea rows={3} />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutScoreLinkSheetModal
