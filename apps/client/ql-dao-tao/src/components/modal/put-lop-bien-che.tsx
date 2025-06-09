import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type {
    FixedClass,
    TrainingCourse,
    TrainingObjectType,
    TrainingMajor,
    CurriculumVersion,
    Lecturer,
} from '@workspace/db'
import {
    useCreateFixedClass,
    useFindUniqueFixedClass,
    useUpdateFixedClass,
    useFindManyOrganization,
    useFindManyTrainingCourse,
    useFindManyTrainingObjectType,
    useFindManyTrainingMajor,
    useFindManyCurriculumVersion,
    useFindManyLecturer,
    useFindUniqueCurriculumVersion,
    useFindManyStaff
} from '@workspace/db/hooks'
import { Col, Form, Input, InputNumber, message, TreeSelect, Radio } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import Select from '@components/commons/select'
import DatePicker from '@components/commons/date-picker'
import dayjs from 'dayjs'
export type PutFixedClass = FixedClass & {
    trainingObjectTypeId: string | null,
    trainingMajorId:string | null,
}
import 'dayjs/locale/vi'
import { buildOrgTree } from '@lib/utils'
import { includes } from 'lodash'
dayjs.locale('vi')
const PutFixedClassModal = () => {
    const [form] = Form.useForm<PutFixedClass>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutFixedClassModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()


    const { data: manageOrgData = [], refetch: refetchManageOrg } =
        useFindManyOrganization()
    const TrainingCourseForm =Form.useWatch('trainingCourseId',form)
    const { data: trainingObjectTypeData = [], refetch: refetchObjectType } =
        useFindManyTrainingObjectType({
            where:{
                trainingCourse:TrainingCourseForm ? {
                    some :{
                        id:TrainingCourseForm||''
                    }
                }:{
                }
            }
        })

    const managementOrganizationForm =Form.useWatch('managementOrganizationId',form)

    const { data: trainingMajorData = [], refetch: refetchManyTrainingField } =
                useFindManyTrainingMajor({
                    where:managementOrganizationForm?{
                        organizationId:managementOrganizationForm
                    }:{}
                })

    const trainingObjectTypeForm =Form.useWatch('trainingObjectTypeId',form)
    const { data: trainingCourseData = [], refetch: refetchTrainingCourse } =
        useFindManyTrainingCourse({
            where:trainingObjectTypeForm ?{
                trainingObjectTypeId: trainingObjectTypeForm ||''
            }:{}
        })
 const trainingMajorForm =Form.useWatch('trainingMajorId',form)
    const { data: curriculumVersionData = [], refetch: refetchCurriculumVersion } =
        useFindManyCurriculumVersion({
            where:{
               trainingObjectTypeId: trainingObjectTypeForm || undefined,
            },
            include:{
                curriculum:{
                        include:{
                            trainingMajor:true,
                            managementOrganization:true,
                        }
                    },
                    fixedClasses:{
                        include:{
                            trainingCourse:true
                        }
                    },
                    trainingObjectType:true
            }
        })
    const { data: lecturerData = [], refetch: refetchLecturer } =
        useFindManyLecturer({
            include:{
                userProfile:true
            }
        })

            const { data: staffData = [], refetch: refetchStaff} =
                useFindManyStaff({
                    include:{
                        userProfile:true
                    }
                })

    const { mutateAsync: createFixedClass } = useCreateFixedClass()
    const { mutateAsync: updateFixedClass } = useUpdateFixedClass()
    async function onOk(output?: PutFixedClass) {
        if (!output) return
        try {
            showSpinner()
            const payload = {
                code: output.code,
                name: output.name,
                description: output.description,
                trainingCourseId: output.trainingCourseId,
                managementOrganizationId: output.managementOrganizationId,
                curriculumVersionId: output.curriculumVersionId,
                staffManagementId: output.staffManagementId,
                lecturerManagementId: output.lecturerManagementId,
                startYear: output.startYear,
                graduated: output.graduated,
                active: output.active,
                summary: output.summary,
            }
            if (id) {
                await updateFixedClass({
                    data: {
                        ...payload,
                    },
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createFixedClass({
                    data: {
                        ...payload,
                    },
                })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['FixedClass'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }
    const handleChangeField = async (field:string,val: string) => {
        try {
            form.setFieldsValue({
                [field]:null
            })
        } catch (err) {
            message.error('Lỗi khi tải đối tượng đào tạo')
        }
    }

    const handleChangeFieldOrganization = async (field:any,val: string) => {
        try {
            let newValue={}
            field.forEach((i:string)=>newValue={...newValue,[i]:null})
            form.setFieldsValue({
                ...newValue
            })
        } catch (err) {
            message.error('Lỗi khi tải đối tượng đào tạo')
        }
    }

      const handleChangeFieldcurriculumVersion = async (val: string) => {
        try {
            let result= curriculumVersionData.find(i=>i?.id==val);
             form.setFieldsValue({
                managementOrganizationId: result?.curriculum?.managementOrganization?.id,
                trainingMajorId: result?.curriculum?.trainingMajor?.id,
                trainingObjectTypeId: result?.trainingObjectType?.id,
            })
            console.log(result)
           
        } catch (err) {
            message.error('Lỗi khi tải đối tượng đào tạo')
        }
    }

    const { data: level } = useFindUniqueFixedClass({
        where: { id },
    })
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (level) {
            form.setFieldsValue({...level,})
        }else {
            form.setFieldsValue({
                graduated:false,
                active:true
            })
        }
    }, [level])
    const treeData = buildOrgTree(manageOrgData)

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={id ? 'Chỉnh sửa lớp biên chế' : 'Thêm mới lớp biên chế'}
            className="w-[45vw]"
        >
            <Col span={12}>
                <FormItem
                    form={form}
                    name="trainingObjectTypeId"
                    label="Đối tượng đào tạo"
                >
                    <Select
                        placeholder="Chọn đối tượng đào tạo"
                        options={trainingObjectTypeData.map(
                            (i: TrainingObjectType) => {
                                return {
                                    value: i.id,
                                    label: i.name,
                                }
                            }
                        )}
                    onChange={(val) => handleChangeField('trainingCourseId',val)}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="trainingCourseId"
                    label="Khóa"
                >
                    <Select
                        placeholder="Chọn khóa"
                        options={trainingCourseData.map((i: TrainingCourse) => {
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
                    name="managementOrganizationId"
                    label="Khoa phụ trách"
                    className="mb-2"
                >
                    <TreeSelect
                        allowClear
                        showSearch
                        placeholder="Chọn đơn vị phụ trách"
                        treeDefaultExpandAll
                        treeData={treeData}
                        filterTreeNode={(input, node) =>
                            (node.title as string)
                                .toLowerCase()
                                .includes(input.toLowerCase())
                        }
                        onChange={(val) => handleChangeFieldOrganization(['trainingMajorId','curriculumVersionId'],val)}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="trainingMajorId"
                    label="Chuyên ngành"
                    required
                >
                    <Select
                        placeholder="Chọn chuyên ngành"
                        options={trainingMajorData.map((i: TrainingMajor) => {
                            return {
                                value: i.id,
                                label: i.name,
                            }
                        })}
                        onChange={(val) => handleChangeField('curriculumVersionId',val)}
                        
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="curriculumVersionId"
                    label="Chương trình đào tạo"
                    required
                >
                    <Select
                        placeholder="Chọn chương trình đào tạo"
                        options={curriculumVersionData.map((i: CurriculumVersion) => {
                            return {
                                value: i.id,
                                label: i.name,
                            }
                        })}
                        onChange={(val,record)=>handleChangeFieldcurriculumVersion(val)}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="lecturerManagementId"
                    label="GVCN"
                >
                    <Select
                        placeholder="Chọn giáo viên chủ nhiệm"
                        options={lecturerData.map((i) => {
                            return {
                                value: i?.id,
                                label: `${i?.userProfile?.lastName} ${i?.userProfile?.firstName}`,
                            }
                        })}
                        // onChange={(val) =>handleMajorChange(val)}
                        
                    />
                </FormItem>
            </Col>
                 <Col span={12}>
                <FormItem
                    form={form}
                    name="staffManagementId"
                    label="CBQL"
                >
                    <Select
                        placeholder="Chọn giáo viên chủ nhiệm"
                        options={staffData.map((i) => {
                            return {
                                value: i?.id,
                                label: `${i?.userProfile?.lastName} ${i?.userProfile?.firstName}`,
                            }
                        })}
                        // onChange={(val) =>handleMajorChange(val)}
                        
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="code"
                    label="Mã lớp biên chế"
                    required
                >
                    <Input placeholder="Nhập mã lớp biên chế" />
                </FormItem>
            </Col>
       
            <Col span={12}>
                <FormItem
                    form={form}
                    name="name"
                    label="Tên lớp biên chế"
                    required
                >
                    <Input placeholder="Nhập tên lớp biên chế" />
                </FormItem>
            </Col>

            <Col span={12}>
                <FormItem
                    form={form}
                    name="summary"
                    label="Tên viết tắt"
                >
                    <Input placeholder="Nhập tên viết tắt" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="startYear"
                    label="Năm bắt đầu"
                    required
                >
                    <Input placeholder="Nhập năm bắt đầu" />
                </FormItem>
            </Col>

            <Col span={24}>
                <FormItem form={form} name="description" label="Mô tả">
                    <Input.TextArea placeholder="Nhập mô tả" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name={'active'}
                    label="Trạng thái"
                    required
                >
                    <Radio.Group buttonStyle="solid">
                        <Radio value={true}>
                            Đang hoạt động
                        </Radio>
                        <Radio value={false}>
                            Ngừng hoạt động
                        </Radio>
                    </Radio.Group>
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name={'graduated'}
                    label="Tình trạng tốt nghiệp"
                    required
                >
                    <Radio.Group buttonStyle="solid">
                        <Radio value={true}>
                            Đã tốt nghiệp
                        </Radio>
                        <Radio value={false}>
                            Chưa tốt nghiệp
                        </Radio>
                    </Radio.Group>
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutFixedClassModal
