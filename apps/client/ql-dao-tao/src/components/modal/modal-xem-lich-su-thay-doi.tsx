import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useSpinner from '@hooks/spinner'
import { type DocumentFile, type SubjectVersion, SubjectVersionType } from '@workspace/db'
import {
    useCreateSubjectVersion,
    useFindManySubject,
    useFindManyTrainingObjectType,
    useFindUniqueSubject,
    useFindUniqueSubjectVersion,
    useUpdateSubjectVersion,
} from '@workspace/db/hooks'
import { Col, Form, Input, InputNumber, Radio, Switch } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useRef, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import DocumentPaths from '@components/commons/documentPaths'
import Tabs from '@components/commons/tabar'
import { useExamTypeOptions } from '@hooks/examType'
import TreeSelect from '@/components/commons/tree-select'
import { useTrainingObjectTypeStore } from '@workspace/ui'

export type PutSubjectVersion = SubjectVersion & {
    documentFiles?: DocumentFile[]
}
dayjs.locale('vi')

type PutSubjectVersionFormValues = PutSubjectVersion & {
    prerequisiteSubjectIds?: string[]
    coRequisiteSubjectIds?: string[]
}

const subjectVersionTypeOptions = [
    { label: 'Môn thường', value: SubjectVersionType.Normal },
    { label: 'Thực tập', value: SubjectVersionType.Internship },
    { label: 'Chuyên đề nghiên cứu', value: SubjectVersionType.Research },
    { label: 'Đồ án tốt nghiệp', value: SubjectVersionType.Project },
]

const ModalViewHistoryChange = () => {
    const [document, setDocument] = useState<DocumentFile[]>([])
    const modalContentRef = useRef<HTMLDivElement>(null)
    const [form] = Form.useForm<PutSubjectVersionFormValues>()
    const { isOpen, onClose, input } = useDisclosure<{
        subjectId: string
        subjectVersionId?: string
        isLocked?: boolean
    }>({
        tag: 'ModalViewHistoryChange',
        onClose: form.resetFields,
    })

    const subjectId = input?.subjectId
    const subjectVersionId = input?.subjectVersionId
    const { id: selectedTrainingObjectTypeId } = useTrainingObjectTypeStore()
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
            <div ref={modalContentRef}>
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
            </div>
        </PutFormModal>
    )
}

export default ModalViewHistoryChange
