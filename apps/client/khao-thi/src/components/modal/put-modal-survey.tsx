import { queryClient } from '@api/index'
import DatePicker from '@components/commons/date-picker'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useSpinner from '@hooks/spinner'
import type { Survey, SurveyObjectType, SurveyTopic } from '@workspace/db'
import {
    useCreateSurvey,
    useFindManyLecturer,
    useFindManySchoolYear,
    useFindManySurveyObjectType,
    useFindManySurveyTopic,
    useFindUniqueSurvey,
    useUpdateSurvey,
} from '@workspace/db/hooks'
import { Col, Form, Input, message, Radio,TreeSelect as TreeSelectAnt } from 'antd'
import { useEffect, useMemo } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutSurveyType = Survey & { surveyObjectTypes: string[] ,semesterId?:string,lectureId?:string,lectureIds?:string[]}   

export interface TreeNodeType {
    value: string
    title: React.ReactNode
    children?: TreeNodeType[]
    selectable?: boolean
}
// Define props for our custom component
interface CustomTreeSelectProps {
    placeholder?: string
    style?: React.CSSProperties
    dropdownStyle?: React.CSSProperties
}

const PutSurveyModal = () => {
    const [form] = Form.useForm<PutSurveyType>()
    const {
        isOpen,
        onClose,
        input,
    } = useDisclosure<{id:string,type:string}>({
        tag: 'PutSurveyModal',
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: create } = useCreateSurvey()
    const { mutateAsync: update } = useUpdateSurvey()

    const { data: surveyTopics = [] } = useFindManySurveyTopic()
    const { data: surveyObjectTypesData = [] } = useFindManySurveyObjectType()

    async function onOk(output?: PutSurveyType) {
        if (!output) return
        try {
            showSpinner()
            if(input?.type==='multiple'){

            }else {
            if (input?.id) {
                await update({
                    data: {
                        code: output.code,
                        name: output.name.trim(),
                        surveyObjectType: {
                            set: output.surveyObjectTypes.map((item) => ({ id: item })) || [],
                        },
                        startDate: output.startDate,
                        endDate: output.endDate,
                        description: output.description,
                        additionalSuggestion: output.additionalSuggestion,
                        isPublic: output.isPublic,
                        anonymous: output.anonymous,
                    },
                    where: {
                        id:input?.id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await create({
                    data: {
                        code: output.code,
                        name: output.name.trim(),
                        surveyObjectType: {
                            connect: output.surveyObjectTypes.map((item) => ({ id: item })) || [],
                        },
                        surveyTopic: {
                            connect: {
                                id: output.surveyTopicId,
                            },
                        },
                        startDate: output.startDate,
                        endDate: output.endDate,
                        description: output.description,
                        isPublic: output.isPublic,
                        anonymous: output.anonymous,
                        additionalSuggestion: output.additionalSuggestion,
                    },
                })
                message.success('Thêm mới thành công')
            }
            }
        
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['Level'],
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

    const { data: schoolYears, isLoading: schoolYearLoading } = useFindManySchoolYear({
        orderBy: { startDate: 'desc' },
        include: {
            semesters: {
                orderBy: { createdAt: 'desc' },
            },
        },
    })

    const semesterId = Form.useWatch('semesterId', form)

   const { data: lecturerData=[] } = useFindManyLecturer({
        where:{
            mainSubjectClasses: {
                some: {
                    semester: {
                        id:semesterId
                    }
                }
            }
        },
        orderBy: { userProfile:{
            firstName: 'asc'
        } },
        include: {
            userProfile:true,
            mainSubjectClasses: {
                include:{
                    semester: true
                }
            }
        },

    },{
        enabled:!!semesterId
    })
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
                        title: `${semester.name} - ${schoolYear?.name}`,
                    })) || [],
            })) || []
        )
    }, [schoolYears])

    const { data: survey } = useFindUniqueSurvey(
        {
            where: { id:input?.id },
            include: {
                surveyObjectType: true,
            },
        },
        {
            enabled: !!input?.id,
        }
    )

        const filterTreeNode = (input: string, treeNode: any) => {
        return treeNode?.title?.toLowerCase()?.includes(input?.toLowerCase())
    }
    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (survey) {
            // form.setFieldsValue({
            //     ...survey,
            //     startDate: dayjs(survey.startDate),
            //     endDate: survey.endDate ? dayjs(survey.endDate) : undefined,
            //     surveyObjectTypes: survey.surveyObjectType.map((item) => item.id),

            // })
        } else {
            form.setFieldsValue({ isPublic: false, anonymous: true, additionalSuggestion: false })
        }
    }, [survey])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={input?.id ? 'Chỉnh sửa khảo sát' : 'Thêm mới khảo sát'}
            className="w-[1000px]"
        >
            <Col span={12}>
                <FormItem form={form} name="code" label="Mã khảo sát" required>
                    <Input placeholder="Nhập mã khảo sát" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="name" label="Tên khảo sát" required>
                    <Input placeholder="Nhập tên đối tượng khảo sát" />
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
                <FormItem form={form} name="surveyObjectTypes" label="Đối tượng khảo sát" required>
                    <Select
                        mode="multiple"
                        maxTagCount={'responsive'}
                        placeholder="Chọn đối tượng khảo sát"
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
                           <TreeSelectAnt
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
            {
                input?.type==='multiple'?(
                      <FormItem form={form} name="lectureIds" label="Giảng viên">
                           <Select
                        mode="multiple"
                        maxTagCount={'responsive'}
                        placeholder="Chọn minh chứng"
                        options={lecturerData?.map((i) => {
                            return {
                                label: `${i.userProfile?.lastName ?? ''} ${i.userProfile?.firstName ?? ''}`.trim() ,
                                value: i.id,
                                key: i.id,
                            }
                        })}
                     
                    />
                </FormItem>
                ):(
                      <FormItem form={form} name="lectureId" label="Giảng viên">
                         <Select
                        placeholder="Chọn minh chứng"
                        options={lecturerData?.map((i) => {
                            return {
                                label: `${i.userProfile?.lastName ?? ''} ${i.userProfile?.firstName ?? ''}`.trim() ,
                                value: i.id,
                                key: i.id,
                            }
                        })}
                     
                    />
                </FormItem>
                )
            }
              
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name={'additionalSuggestion'}
                    label="Có góp ý bổ sung không?"
                    required
                >
                    <Radio.Group buttonStyle="solid">
                        <Radio value={true}>Có</Radio>
                        <Radio value={false}>Không</Radio>
                    </Radio.Group>
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name={'isPublic'} label="Có công khai không?" required>
                    <Radio.Group buttonStyle="solid">
                        <Radio value={true}>Có</Radio>
                        <Radio value={false}>Không</Radio>
                    </Radio.Group>
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name={'anonymous'} label="Có ẩn danh không?" required>
                    <Radio.Group buttonStyle="solid">
                        <Radio value={true}>Có</Radio>
                        <Radio value={false}>Không</Radio>
                    </Radio.Group>
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutSurveyModal
