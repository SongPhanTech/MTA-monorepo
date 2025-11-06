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
import { Col, Form, Input, message, Row, Tabs } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import TreeSelect from '@/components/commons/tree-select'
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
    const selectedTrainingFields = Form.useWatch('TrainingFields', form) || []
    const selectedTrainingMajors = Form.useWatch('TrainingMajors', form) || []
    const selectedTrainingCourses = Form.useWatch('TrainingCourses', form) || []
    const selectedFixedClasses = Form.useWatch('FixedClasses', form) || []

    async function onOk(output?: PutSurveyObjectType) {
        if (!output) return
        try {
            showSpinner()
            if (id) {
                await update({
                    data: {
                        code: output.code,
                        name: output.name.trim(),
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
                        name: output.name.trim(),
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

    const { data: surveyObjectType } = useFindUniqueSurveyObjectType(
        {
            where: { id: id },
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

    const { data: manageOrgData = [] } = useFindManyDM_DonVi()

    const { data: trainingFieldData = [] } = useFindManyTrainingField({
        orderBy: { name: 'asc' },
    })

    const { data: trainingMajorData = [] } = useFindManyTrainingMajor({
        orderBy: { name: 'asc' },
        where:
            selectedTrainingFields.length > 0
                ? {
                      trainingFieldId: { in: selectedTrainingFields },
                  }
                : {},
    })

    const { data: trainingCourses = [] } = useFindManyTrainingCourse({
        orderBy: { name: 'asc' },
    })

    const { data: fixedClasses = [] } = useFindManyFixedClass({
        orderBy: { name: 'asc' },
        where:
            selectedTrainingCourses.length > 0
                ? {
                      trainingCourseId: { in: selectedTrainingCourses },
                  }
                : {},
    })

    const { data: subjectClassData = [] } = useFindManySubjectClass({
        orderBy: { name: 'asc' },
        where: {
            ...(selectedFixedClasses.length > 0
                ? {
                      fixedClasses: {
                          some: {
                              id: { in: selectedFixedClasses },
                          },
                      },
                  }
                : {}),
            cancelled: false,
            active: true,
            status: 'OFFICIAL',
        },
    })

    const treeData = useMemo(() => {
        return buildOrgTree(manageOrgData)
    }, [manageOrgData])

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    const items = useMemo(() => {
        const result = []
        if (type.includes('MILITARY_STUDENT') || type.includes('CIVILIAN_STUDENT')) {
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
                                    placeholder={'Chọn chuyên ngành'}
                                    options={trainingMajorData.map((i: TrainingMajor) => ({
                                        value: i.id,
                                        label: i.name,
                                    }))}
                                    allowClear
                                />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem form={form} name="TrainingCourses" label="Khóa">
                                <Select
                                    mode="multiple"
                                    maxTagCount={'responsive'}
                                    placeholder={'Chọn khóa'}
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
                                    placeholder={'Chọn lớp niên chế'}
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
                                    placeholder="Chọn lớp môn học"
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
                                />
                            </FormItem>
                        </Col>
                    </Row>
                ),
            })
        }

        return result
    }, [
        type,
        trainingFieldData,
        trainingMajorData,
        trainingCourses,
        fixedClasses,
        subjectClassData,
        selectedTrainingFields,
        selectedTrainingMajors,
        selectedTrainingCourses,
        treeData,
        form,
    ])

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
            title={id ? 'Chỉnh sửa đối tượng làm khảo sát' : 'Thêm mới đối tượng làm khảo sát'}
            className="w-[1000px]"
        >
            <Col span={12}>
                <FormItem form={form} name="code" label="Mã đối tượng làm khảo sát" required>
                    <Input placeholder="Nhập mã đối tượng làm khảo sát" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="name" label="Tên đối tượng làm khảo sát" required>
                    <Input placeholder="Nhập tên đối tượng làm khảo sát" />
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
