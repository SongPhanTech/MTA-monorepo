import DatePicker from '@components/commons/date-picker'
import FormItem from '@components/commons/form-item'
import Select from '@components/commons/select'
import type { SurveyObjectType, SurveyTopic } from '@workspace/db'
import {
    useFindManyLecturer,
    useFindManySchoolYear,
    useFindManySurveyObjectType,
    useFindManySurveyTopic,
} from '@workspace/db/hooks'
import { Col, Form, Input, Radio, Row, TreeSelect } from 'antd'
import { useMemo } from 'react'
export interface TreeNodeType {
    value: string
    title: React.ReactNode
    children?: TreeNodeType[]
    selectable?: boolean
}
export default function InfoSurveyExam({ id, type }: { id: string; type: string }) {
    const form = Form.useFormInstance<any>()
    const { data: surveyTopics = [] } = useFindManySurveyTopic()
    const { data: surveyObjectTypesData = [] } = useFindManySurveyObjectType()

    const { data: schoolYears, isLoading: schoolYearLoading } = useFindManySchoolYear({
        orderBy: { startDate: 'desc' },
        include: {
            semesters: {
                orderBy: { startDate: 'desc' },
            },
        },
    })

    const semesterId = Form.useWatch('semesterId', form)

    const { data: lecturerData = [] } = useFindManyLecturer(
        {
            where: {
                mainSubjectClasses: {
                    some: {
                        semester: {
                            id: semesterId,
                        },
                    },
                },
            },
            orderBy: {
                userProfile: {
                    firstName: 'asc',
                },
            },
            include: {
                userProfile: true,
                mainSubjectClasses: {
                    include: {
                        semester: true,
                    },
                },
            },
        },
        {
            enabled: !!semesterId,
        }
    )
    // Tạo treeData từ schoolYears và semesters
    const treeData: TreeNodeType[] = useMemo(() => {
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

    const filterTreeNode = (input: string, treeNode: any) => {
        return treeNode?.title?.toLowerCase()?.includes(input?.toLowerCase())
    }
    return (
        <Row gutter={16}>
            {/* <Col span={12}>
                <FormItem form={form} name="code" label="Mã khảo sát" required>
                    <Input placeholder="Nhập mã khảo sát" />
                </FormItem>
            </Col> */}
            <Col span={12}>
                <FormItem form={form} name="name" label="Tên khảo sát" required>
                    <Input placeholder="Nhập tên đối tượng làm khảo sát" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="surveyTopicId" label="Chủ đề khảo sát" required>
                    <Select
                        placeholder="Chọn chủ đề khảo sát"
                        options={surveyTopics.map((i: SurveyTopic) => {
                            return {
                                value: i.id,
                                label: i.name,
                            }
                        })}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="surveyObjectTypes"
                    label="Đối tượng làm khảo sát"
                    required
                >
                    <Select
                        mode="multiple"
                        maxTagCount={'responsive'}
                        placeholder="Chọn đối tượng làm khảo sát"
                        options={surveyObjectTypesData.map((i: SurveyObjectType) => {
                            return {
                                value: i.id,
                                label: i.name,
                            }
                        })}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="startDate" label="Thời gian bắt đầu" required>
                    <DatePicker format="DD/MM/YYYY" className="w-full" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="endDate" label="Thời gian kết thúc">
                    <DatePicker format="DD/MM/YYYY" className="w-full" />
                </FormItem>
            </Col>

            <Col span={12}>
                <FormItem form={form} name="semesterId" label="Kỳ học" required>
                    <TreeSelect
                        showSearch
                        dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                        placeholder={'Chọn kỳ học'}
                        allowClear
                        treeDefaultExpandAll
                        treeData={treeData}
                        filterTreeNode={filterTreeNode}
                        treeNodeFilterProp="title"
                        loading={schoolYearLoading}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                {type === 'multiple' ? (
                    <FormItem form={form} name="lecturerIds" label="Giảng viên" required>
                        <Select
                            mode="multiple"
                            maxTagCount={'responsive'}
                            placeholder="Chọn giảng viên"
                            options={lecturerData?.map((i) => {
                                return {
                                    label: `${i.userProfile?.lastName ?? ''} ${i.userProfile?.firstName ?? ''}`.trim(),
                                    value: i.id,
                                    key: i.id,
                                }
                            })}
                        />
                    </FormItem>
                ) : (
                    <FormItem form={form} name="lecturerId" label="Giảng viên">
                        <Select
                            placeholder="Chọn giảng viên"
                            options={lecturerData?.map((i) => {
                                return {
                                    label: `${i.userProfile?.lastName ?? ''} ${i.userProfile?.firstName ?? ''}`.trim(),
                                    value: i.id,
                                    key: i.id,
                                }
                            })}
                        />
                    </FormItem>
                )}
            </Col>
            <Col span={12}>
                <FormItem form={form} name={'isPublic'} label="Có công khai không?" required>
                    <Radio.Group buttonStyle="solid">
                        <Radio value={true}>Có</Radio>
                        <Radio value={false}>Không</Radio>
                    </Radio.Group>
                </FormItem>
            </Col>
            {/* <Col span={12}>
                <FormItem form={form} name={'anonymous'} label="Có ẩn danh không?" required>
                    <Radio.Group buttonStyle="solid">
                        <Radio value={true}>Có</Radio>
                        <Radio value={false}>Không</Radio>
                    </Radio.Group>
                </FormItem>
            </Col> */}
        </Row>
    )
}
