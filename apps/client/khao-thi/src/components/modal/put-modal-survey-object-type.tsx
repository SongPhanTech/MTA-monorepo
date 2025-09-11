import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import { SUBJECT_OBJECT } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import { buildOrgTree } from '@lib/utils'
import type {
    FixedClass,
    SubjectClass,
    SurveyObjectType,
    TrainingCourse,
    TrainingField,
    TrainingMajor,
} from '@workspace/db'
import {
    useCreateSurveyObjectType,
    useFindManyDM_DonVi,
    useFindManyFixedClass,
    useFindManySubjectClass,
    useFindManyTrainingCourse,
    useFindManyTrainingField,
    useFindManyTrainingMajor,
    useFindUniqueSurveyObjectType,
    useUpdateSurveyObjectType,
} from '@workspace/db/hooks'
import { Col, Form, Input, message, Row, Tabs, TreeSelect } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutSurveyObjectType = SurveyObjectType & {
    Organizations: string[]
    TrainingFields: string[]
    TrainingMajors: string[]
    TrainingCourses: string[]
    FixedClasses: string[]
    SubjectClasses: string[]
}
const PutSurveyObjectTypeModal = () => {
    const [form] = Form.useForm<PutSurveyObjectType>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: 'PutSurveyObjectTypeModal',
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()
    const [activeKey, setActiveKey] = useState('')
    const { mutateAsync: create } = useCreateSurveyObjectType()
    const { mutateAsync: update } = useUpdateSurveyObjectType()
    const type = Form.useWatch('type', form) || []
    async function onOk(output?: PutSurveyObjectType) {
        if (!output) return
        try {
            showSpinner()
            if (id) {
                await update({
                    data: {
                        code: output.code,
                        name: output.name,
                        type: output.type,
                        organizations: {
                            set:
                                output.Organizations?.length > 0
                                    ? output.Organizations.map((item) => ({ Id: item }))
                                    : [],
                        },
                        trainingFields: {
                            set:
                                output.TrainingFields?.length > 0
                                    ? output.TrainingFields.map((item) => ({ id: item }))
                                    : [],
                        },
                        trainingMajors: {
                            set:
                                output.TrainingMajors?.length > 0
                                    ? output.TrainingMajors.map((item) => ({ id: item }))
                                    : [],
                        },
                        trainingCourses: {
                            set:
                                output.TrainingCourses?.length > 0
                                    ? output.TrainingCourses.map((item) => ({ id: item }))
                                    : [],
                        },
                        fixedClasses: {
                            set:
                                output.FixedClasses?.length > 0
                                    ? output.FixedClasses.map((item) => ({ id: item }))
                                    : [],
                        },
                        subjectClasses: {
                            set:
                                output.SubjectClasses?.length > 0
                                    ? output.SubjectClasses.map((item) => ({ id: item }))
                                    : [],
                        },
                    },
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await create({
                    data: {
                        code: output.code,
                        name: output.name,
                        type: output.type,
                        organizations: {
                            connect:
                                output.Organizations?.length > 0
                                    ? output.Organizations.map((item) => ({ Id: item }))
                                    : [],
                        },
                        trainingFields: {
                            connect:
                                output.TrainingFields?.length > 0
                                    ? output.TrainingFields.map((item) => ({ id: item }))
                                    : [],
                        },
                        trainingMajors: {
                            connect:
                                output.TrainingMajors?.length > 0
                                    ? output.TrainingMajors.map((item) => ({ id: item }))
                                    : [],
                        },
                        trainingCourses: {
                            connect:
                                output.TrainingCourses?.length > 0
                                    ? output.TrainingCourses.map((item) => ({ id: item }))
                                    : [],
                        },
                        fixedClasses: {
                            connect:
                                output.FixedClasses?.length > 0
                                    ? output.FixedClasses.map((item) => ({ id: item }))
                                    : [],
                        },
                        subjectClasses: {
                            connect:
                                output.SubjectClasses?.length > 0
                                    ? output.SubjectClasses.map((item) => ({ id: item }))
                                    : [],
                        },
                    },
                })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['SurveyObjectType'],
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
    const { data: manageOrgData = [] } = useFindManyDM_DonVi()
    const { data: trainingFieldData = [] } = useFindManyTrainingField({
        orderBy: { name: 'asc' },
    })
    const { data: trainingMajorData = [] } = useFindManyTrainingMajor({
        orderBy: { name: 'asc' },
    })

    const { data: trainingCourses = [] } = useFindManyTrainingCourse({
        orderBy: { name: 'asc' },
    })

    const { data: fixedClasses = [] } = useFindManyFixedClass({
        orderBy: { name: 'asc' },
    })

    const { data: subjectClassData = [] } = useFindManySubjectClass({
        orderBy: { name: 'asc' },
    })
    const treeData = useMemo(() => {
        return buildOrgTree(manageOrgData)
    }, [manageOrgData])
    const { data: surveyObjectType } = useFindUniqueSurveyObjectType(
        {
            where: { id },
            include: {
                organizations: true,
                trainingFields: true,
                trainingMajors: true,
                trainingCourses: true,
                fixedClasses: true,
                subjectClasses: true,
            },
        },
        { enabled: !!id }
    )
    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    const items = useMemo(() => {
        const result = []
        if (type.includes('CIVILIAN_STUDENT') || type.includes('MILITARY_STUDENT')) {
            result.push({
                key: 'STUDENT',
                label: 'Sinh viên, học viên',
                children: (
                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <FormItem form={form} name="TrainingFields" label="Ngành">
                                <Select
                                    mode="multiple"
                                    maxTagCount={'responsive'}
                                    placeholder="Chọn ngành"
                                    options={trainingFieldData.map((i: TrainingField) => ({
                                        value: i.id,
                                        label: i.name,
                                    }))}
                                    allowClear
                                />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem form={form} name="TrainingMajors" label="Chuyên ngành">
                                <Select
                                    mode="multiple"
                                    maxTagCount={'responsive'}
                                    placeholder="Chọn ngành"
                                    options={trainingMajorData.map((i: TrainingMajor) => ({
                                        value: i.id,
                                        label: i.name,
                                    }))}
                                    allowClear
                                />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem form={form} name="TrainingCourses" label="Khoá">
                                <Select
                                    mode="multiple"
                                    maxTagCount={'responsive'}
                                    placeholder="Chọn ngành"
                                    options={trainingCourses.map((i: TrainingCourse) => ({
                                        value: i.id,
                                        label: i.name,
                                    }))}
                                    allowClear
                                />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem form={form} name="FixedClasses" label="Lớp niên chế">
                                <Select
                                    mode="multiple"
                                    maxTagCount={'responsive'}
                                    placeholder="Chọn ngành"
                                    options={fixedClasses.map((i: FixedClass) => ({
                                        value: i.id,
                                        label: i.name,
                                    }))}
                                    allowClear
                                />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem form={form} name="SubjectClasses" label="Lớp môn học">
                                <Select
                                    mode="multiple"
                                    maxTagCount={'responsive'}
                                    placeholder="Chọn ngành"
                                    options={subjectClassData.map((i: SubjectClass) => ({
                                        value: i.id,
                                        label: i.name,
                                    }))}
                                    allowClear
                                />
                            </FormItem>
                        </Col>
                    </Row>
                ),
            })
        }
        if (type.includes('LECTURER') || type.includes('STAFF')) {
            result.push({
                key: 'LECTURER',
                label: 'Giảng viên, CBNV',
                children: (
                    <Row gutter={[16, 16]}>
                        <Col span={24}>
                            <FormItem form={form} name="Organizations" label="Đơn vị quản lý">
                                <TreeSelect
                                    placeholder="Chọn đơn vị quản lý"
                                    allowClear
                                    showSearch
                                    multiple
                                    maxTagCount={'responsive'}
                                    treeDefaultExpandAll
                                    treeData={treeData}
                                    filterTreeNode={(input, node) =>
                                        (node?.label as string)
                                            ?.toLowerCase()
                                            ?.includes(input?.toLowerCase())
                                    }
                                />
                            </FormItem>
                        </Col>
                    </Row>
                ),
            })
        }

        return result
    }, [type])

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (surveyObjectType) {
            form.setFieldsValue({
                ...surveyObjectType,
                Organizations: surveyObjectType.organizations.map((item) => item.Id),
                TrainingFields: surveyObjectType.trainingFields.map((item) => item.id),
                TrainingMajors: surveyObjectType.trainingMajors.map((item) => item.id),
                TrainingCourses: surveyObjectType.trainingCourses.map((item) => item.id),
                FixedClasses: surveyObjectType.fixedClasses.map((item) => item.id),
                SubjectClasses: surveyObjectType.subjectClasses.map((item) => item.id),
            })
            if (
                surveyObjectType?.type.includes('MILITARY_STUDENT') ||
                surveyObjectType?.type.includes('CIVILIAN_STUDENT')
            ) {
                setActiveKey('STUDENT')
            } else if (
                surveyObjectType?.type.includes('LECTURER') ||
                surveyObjectType?.type.includes('STAFF')
            ) {
                setActiveKey('LECTURER')
            }
        }
    }, [surveyObjectType])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={id ? 'Chỉnh sửa đối tượng khảo sát' : 'Thêm mới đối tượng khảo sát'}
            className="w-[1000px]"
        >
            <Col span={12}>
                <FormItem form={form} name="code" label="Mã đối tượng khảo sát" required>
                    <Input placeholder="Nhập mã đối tượng khảo sát" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="name" label="Tên đối tượng khảo sát" required>
                    <Input placeholder="Nhập tên đối tượng khảo sát" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="type" label="Đối tượng" required>
                    <Select
                        allowClear
                        mode="multiple"
                        placeholder="Chọn chủ đề khảo sát"
                        options={SUBJECT_OBJECT}
                        onChange={(value) => {
                            if (
                                value.includes('MILITARY_STUDENT') ||
                                value.includes('CIVILIAN_STUDENT')
                            ) {
                                setActiveKey('STUDENT')
                            } else if (value.includes('LECTURER') || value.includes('STAFF')) {
                                setActiveKey('LECTURER')
                            }
                        }}
                    />
                </FormItem>
            </Col>
            {type?.length > 0 && (
                <Col span={24}>
                    <Tabs
                        activeKey={activeKey}
                        onChange={(key) => setActiveKey(key)}
                        items={items}
                    />
                </Col>
            )}
        </PutFormModal>
    )
}

export default PutSurveyObjectTypeModal
