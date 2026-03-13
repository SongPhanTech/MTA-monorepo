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
    useFindManySchoolYear,
    useFindManySubjectClass,
    useFindManySurveyObjectType,
    useFindManyTrainingCourse,
    useFindManyTrainingField,
    useFindManyTrainingMajor,
    useFindUniqueSurveyObjectType,
    useUpdateSurveyObjectType,
} from '@workspace/db/hooks'
import { useTrainingObjectTypeStore } from '@workspace/ui'
import { Col, Form, Input, message, Row, Tabs, TreeSelect as TreeSelectAnt } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import TreeSelect from '@/components/commons/tree-select'
import type { TreeNodeType } from './put-modal-survey'
export type PutSurveyObjectType = SurveyObjectType & {
    Organizations: string[]
    TrainingFields: string[]
    TrainingMajors: string[]
    TrainingCourses: string[]
    FixedClasses: string[]
    SubjectClasses: string[]
    semesterId: string[]
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
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const { showSpinner, hideSpinner } = useSpinner()
    const [activeKey, setActiveKey] = useState('')
    const { mutateAsync: create } = useCreateSurveyObjectType()
    const { mutateAsync: update } = useUpdateSurveyObjectType()
    const type = Form.useWatch('type', form) || []
    const selectedTrainingFields = Form.useWatch('TrainingFields', form) || []
    const selectedTrainingMajors = Form.useWatch('TrainingMajors', form) || []
    const selectedTrainingCourses = Form.useWatch('TrainingCourses', form) || []
    const selectedFixedClasses = Form.useWatch('FixedClasses', form) || []
    const isStudentType = type.includes('MILITARY_STUDENT') || type.includes('CIVILIAN_STUDENT')

    async function onOk(output?: PutSurveyObjectType) {
        if (!output) return
        try {
            await form.validateFields()
        } catch {
            if (isStudentType) {
                setActiveKey('STUDENT')
            }
            return
        }

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
                        trainingObjectTypeId: trainingObjectTypeId,
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
                        trainingObjectTypeId: trainingObjectTypeId,
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

    const { data: surveyObjectTypes = [] } = useFindManySurveyObjectType({
        where: {
            deletedAt: null,
        },
    })

    const validateCodeDuplicate = async (_: any, value?: string) => {
        if (!value?.trim()) return Promise.resolve()

        const codeTrimmed = value.trim()

        const isDuplicate = surveyObjectTypes.some(
            (item) => item.code === codeTrimmed && item.id !== id && item.deletedAt === null
        )

        if (isDuplicate) {
            return Promise.reject('Mã đối tượng làm khảo sát đã tồn tại')
        }

        return Promise.resolve()
    }

    const { data: manageOrgData = [] } = useFindManyDM_DonVi({
         orderBy: { iSTT: 'desc' }
    })

    const { data: trainingFieldData = [] } = useFindManyTrainingField({
        where: {
            trainingObjectTypes: {
                some: {
                    trainingObjectTypeId: trainingObjectTypeId,
                },
            },
        },
        orderBy: { name: 'asc' },
    })

    const { data: trainingMajorData = [] } = useFindManyTrainingMajor({
        orderBy: { name: 'asc' },
        where: {
            trainingObjectTypes: {
                some: {
                    trainingObjectTypeId: trainingObjectTypeId,
                },
            },
            ...(selectedTrainingFields.length > 0
                ? {
                      trainingFieldId: { in: selectedTrainingFields },
                  }
                : {}),
        },
    })

    const { data: trainingCourses = [] } = useFindManyTrainingCourse({
        orderBy: {
            semesterStart: {
                startDate: 'desc',
            },
        },
        where: { trainingObjectTypeId },
    })

    const { data: fixedClasses = [] } = useFindManyFixedClass({
        orderBy: { name: 'asc' },
        where:
            selectedTrainingCourses.length > 0
                ? {
                      trainingCourseId: { in: selectedTrainingCourses },
                  }
                : {
                      trainingCourse: { trainingObjectTypeId },
                  },
    })
    const { data: schoolYears } = useFindManySchoolYear({
        orderBy: { startDate: 'desc' },
        include: {
            semesters: {
                orderBy: { createdAt: 'desc' },
            },
        },
    })
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

    const treeData = useMemo(() => {
        return buildOrgTree(manageOrgData)
    }, [manageOrgData])

    const TrainingFields = Form.useWatch('TrainingFields', form)
    const TrainingMajors = Form.useWatch('TrainingMajors', form)
    const TrainingCourses = Form.useWatch('TrainingCourses', form)
    const FixedClasses = Form.useWatch('FixedClasses', form)
    const semesterId = Form.useWatch('semesterId', form)
    const SubjectClasses = Form.useWatch('SubjectClasses', form)

    const { data: subjectClassData = [] } = useFindManySubjectClass({
        orderBy: { name: 'asc' },
        where: {
            trainingObjectTypeId,
            ...(selectedFixedClasses.length > 0
                ? {
                      fixedClasses: {
                          some: {
                              id: { in: selectedFixedClasses },
                          },
                      },
                  }
                : {}),
            ...(semesterId?.length > 0
                ? {
                      semester: {
                          id: {
                              in: semesterId,
                          },
                      },
                  }
                : {}),
            cancelled: false,
            active: true,
            status: 'OFFICIAL',
        },
        include: {
            fixedClasses: true,
            semester: true,
        },
    })
    const filterTreeNode = (input: string, treeNode: any) => {
        return treeNode?.title?.toLowerCase()?.includes(input?.toLowerCase())
    }

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    const items = useMemo(() => {
        const result = []
        if (type.includes('MILITARY_STUDENT') || type.includes('CIVILIAN_STUDENT')) {
            result.push({
                key: 'STUDENT',
                label: 'Sinh viên, học viên',
                children: (
                    <Row gutter={[16, 0]}>
                        <Col span={12}>
                            <FormItem form={form} name="TrainingFields" label="Ngành">
                                <Select
                                    disabled={SubjectClasses?.length > 0}
                                    mode="multiple"
                                    maxTagCount={'responsive'}
                                    placeholder="Chọn ngành"
                                    options={trainingFieldData.map((i: TrainingField) => ({
                                        value: i.id,
                                        label: `${i?.code || ''} - ${i.name}`,
                                    }))}
                                    allowClear
                                />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem form={form} name="TrainingMajors" label="Chuyên ngành">
                                <Select
                                    disabled={SubjectClasses?.length > 0}
                                    mode="multiple"
                                    maxTagCount={'responsive'}
                                    placeholder={'Chọn chuyên ngành'}
                                    options={trainingMajorData.map((i: TrainingMajor) => ({
                                        value: i.id,
                                        label: `${i?.code || ''} - ${i?.name || ''}`,
                                    }))}
                                    allowClear
                                />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem form={form} name="TrainingCourses" label="Khóa">
                                <Select
                                    disabled={SubjectClasses?.length > 0}
                                    mode="multiple"
                                    maxTagCount={'responsive'}
                                    placeholder={'Chọn khóa'}
                                    options={trainingCourses.map((i: TrainingCourse) => ({
                                        value: i.id,
                                        label: `${i.code || ''} - ${i.name || ''}`,
                                    }))}
                                    allowClear
                                />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem form={form} name="FixedClasses" label="Lớp niên chế">
                                <Select
                                    disabled={SubjectClasses?.length > 0}
                                    mode="multiple"
                                    maxTagCount={'responsive'}
                                    placeholder={'Chọn lớp niên chế'}
                                    options={fixedClasses.map((i: FixedClass) => ({
                                        value: i.id,
                                        label: `${i?.code || ''} - ${i?.name || ''}`,
                                    }))}
                                    allowClear
                                />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem form={form} name="semesterId" label="Kỳ học">
                                <TreeSelectAnt
                                    multiple
                                    disabled={
                                        TrainingFields?.length > 0 ||
                                        TrainingMajors?.length > 0 ||
                                        TrainingCourses?.length > 0 ||
                                        FixedClasses?.length > 0
                                    }
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
                        <Col span={12}>
                            <FormItem form={form} name="SubjectClasses" label="Lớp môn học">
                                <Select
                                    disabled={
                                        TrainingFields?.length > 0 ||
                                        TrainingMajors?.length > 0 ||
                                        TrainingCourses?.length > 0 ||
                                        FixedClasses?.length > 0
                                    }
                                    mode="multiple"
                                    maxTagCount={'responsive'}
                                    placeholder="Chọn lớp môn học"
                                    options={subjectClassData.map((i: SubjectClass) => ({
                                        value: i.id,
                                        label: `${i.code} - ${i.name}`,
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
                    <Row gutter={[16, 0]}>
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
                <FormItem
                    form={form}
                    name="code"
                    label="Mã đối tượng làm khảo sát"
                    rules={[
                        {
                            required: true,
                            message: 'Vui lòng nhập mã đối tượng làm khảo sát',
                        },
                        { validator: validateCodeDuplicate },
                    ]}
                >
                    <Input
                        placeholder="Nhập mã đối tượng làm khảo sát"
                        onBlur={() => form.validateFields(['code'])}
                    />
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
