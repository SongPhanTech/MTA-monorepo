import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { UserProfile, SchoolYear, TrainingForm, TrainingLevel, TrainingType, TrainingObjectType } from '@workspace/db'
import {
    useCreateUserProfile,
    useFindUniqueUserProfile,
    useFindManySchoolYear,
    useFindManyUserProfile,
    useUpdateUserProfile,
    useFindManyTrainingForm,
    useFindManyTrainingType,
    useFindManyTrainingObjectType,
    useFindManyTrainingLevel
} from '@workspace/db/hooks'
import { Col, Form, Input, message, Tabs, Collapse } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import Select from '@components/commons/select'
import DatePicker from '@components/commons/date-picker'
import dayjs from 'dayjs'
const { TabPane } = Tabs;
const { Panel } = Collapse;

export type PutUserProfile = UserProfile
const PutUserProfileModal = () => {
    const [form] = Form.useForm<PutUserProfile>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutUserProfileModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { data: trainingFormData = [], refetch: refetchForm } = useFindManyTrainingForm({
        take: 1000,
        skip: 0,
    });

    const { data: trainingTypeData = [], refetch: refetchType } = useFindManyTrainingType({
        take: 1000,
        skip: 0,
    });
    const { data: trainingLevelData = [], refetch: refetchLevel } = useFindManyTrainingLevel({
        take: 1000,
        skip: 0,
    });
    const { data: trainingObjectTypeData = [], refetch: refetchObjectType } = useFindManyTrainingObjectType({
        take: 1000,
        skip: 0,
    });

    const { data: organizations = [], refetch: refetchUserProfiles } = useFindManyUserProfile({
        take: 1000,
        skip: 0,
    })

    const { mutateAsync: createUserProfile } = useCreateUserProfile()
    const { mutateAsync: updateUserProfile } = useUpdateUserProfile()
    async function onOk(output?: PutUserProfile) {
        if (!output) return
        try {
            showSpinner()
            if (id) {
                await updateUserProfile({
                    data: {
                        id: output.id,
                        code: output.code,
                        firstName: output.firstName,
                        lastName: output.lastName,
                        dateOfBirth: output.dateOfBirth,
                        placeOfBirth: output.placeOfBirth,
                        homeTown: output.homeTown,
                        idCardNumber: output.idCardNumber,
                        idCardDate: output.idCardDate,
                        officerNumber: output.officerNumber,
                        gender: output.gender,
                        permanentAddress: output.permanentAddress,
                        temporaryAddress: output.temporaryAddress,
                        contactAddress: output.contactAddress,
                        phoneNumber: output.phoneNumber,
                        email: output.email,
                        parentPhoneNumber: output.parentPhoneNumber,
                        parentName: output.parentName,
                        unionDate: output.unionDate,
                        unionPlace: output.unionPlace,
                        CPVJoinDate: output.CPVJoinDate,
                        officialCPVDate: output.officialCPVDate,
                        CPVJoinPlace: output.CPVJoinPlace,
                        tenureDate: output.tenureDate,
                        enlistmentDate: output.enlistmentDate,
                        dischargeDate: output.dischargeDate,
                        rankName: output.rankName,
                        educationLevel: output.educationLevel,
                        academicDegreeTypeName: output.academicDegreeTypeName,
                        academicRankTypeName: output.academicRankTypeName,
                        positionName: output.positionName,
                        positionCPVName: output.positionCPVName,
                        organizationName: output.organizationName,
                        organizationCPVName: output.organizationCPVName,
                        userTypeId: output.userTypeId,
                        userId: output.userId,
                        priorityObjectId: output.priorityObjectId,
                        registrationAreaId: output.registrationAreaId,
                        nationalityId: output.nationalityId,
                        religionId: output.religionId,
                        ethnicityId: output.ethnicityId
                    },
                    where: {
                        id,
                    },
                })
                message.success('Cập nhật thành công')
            } else {
                await createUserProfile({
                    data: {
                        id: output.id,
                        code: output.code,
                        firstName: output.firstName,
                        lastName: output.lastName,
                        dateOfBirth: output.dateOfBirth,
                        placeOfBirth: output.placeOfBirth,
                        homeTown: output.homeTown,
                        idCardNumber: output.idCardNumber,
                        idCardDate: output.idCardDate,
                        officerNumber: output.officerNumber,
                        gender: output.gender,
                        permanentAddress: output.permanentAddress,
                        temporaryAddress: output.temporaryAddress,
                        contactAddress: output.contactAddress,
                        phoneNumber: output.phoneNumber,
                        email: output.email,
                        parentPhoneNumber: output.parentPhoneNumber,
                        parentName: output.parentName,
                        unionDate: output.unionDate,
                        unionPlace: output.unionPlace,
                        CPVJoinDate: output.CPVJoinDate,
                        officialCPVDate: output.officialCPVDate,
                        CPVJoinPlace: output.CPVJoinPlace,
                        tenureDate: output.tenureDate,
                        enlistmentDate: output.enlistmentDate,
                        dischargeDate: output.dischargeDate,
                        rankName: output.rankName,
                        educationLevel: output.educationLevel,
                        academicDegreeTypeName: output.academicDegreeTypeName,
                        academicRankTypeName: output.academicRankTypeName,
                        positionName: output.positionName,
                        positionCPVName: output.positionCPVName,
                        organizationName: output.organizationName,
                        organizationCPVName: output.organizationCPVName,
                        userTypeId: output.userTypeId,
                        userId: output.userId,
                        priorityObjectId: output.priorityObjectId,
                        registrationAreaId: output.registrationAreaId,
                        nationalityId: output.nationalityId,
                        religionId: output.religionId,
                        ethnicityId: output.ethnicityId
                    },
                })
                message.success('Thêm mới thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['UserProfile'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const { data: level } = useFindUniqueUserProfile({
        where: { id },
    })
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (level) {
            form.setFieldsValue({
                ...level,
                // startDate: dayjs(level.startDate),
                // endDate: dayjs(level.endDate)
            })
        }
    }, [level])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={
                id
                    ? 'Chỉnh sửa học viên'
                    : 'Thêm mới học viên'
            }
            className="w-[60vw]"
            layout='horizontal'
        >
            <Tabs className='w-full' defaultActiveKey="1">
                <TabPane tab="Thông tin cá nhân" key="1">
                    <Collapse className='w-full' defaultActiveKey={['1']}>
                        <Panel header="Thông tin cá nhân" key="1">
                            <Col span={12}>
                                <FormItem
                                    form={form}
                                    name="lastName"
                                    label="Họ"
                                    required

                                >
                                    <Input placeholder='Nhập họ' />
                                </FormItem>
                            </Col>
                            <Col span={12}>
                                <FormItem
                                    form={form}
                                    name="firstName"
                                    label="Tên và tên đệm"
                                    required

                                >
                                    <Input placeholder='Nhập họ' />
                                </FormItem>
                            </Col>
                        </Panel>
                        <Panel header="Phần 2" key="2">
                            Nội dung phần 2
                        </Panel>
                        <Panel header="Phần 3" key="3">
                            Nội dung phần 3
                        </Panel>
                    </Collapse>
                </TabPane>
                <TabPane tab="Phần 2" key="2">
                    Nội dung phần 2
                </TabPane>
                <TabPane tab="Phần 3" key="3">
                    Nội dung phần 3
                </TabPane>
            </Tabs>
            {/* <Col span={12}>
                <FormItem
                    form={form}
                    name="code"
                    label="Mã học viên"
                    required
                >
                    <Input placeholder='Nhập mã học viên' />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="name"
                    label="Tên học viên"
                    required
                >
                    <Input placeholder="Nhập tên học viên" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="trainingObjectTypeId"
                    label="Đối tượng đào tạo"
                    required
                >
                    <Select placeholder='Chọn đối tượng đào tạo' options={trainingObjectTypeData.map((i: TrainingObjectType) => {
                        return {
                            value: i.id,
                            label: i.name
                        }
                    })} />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="trainingTypeId"
                    label="Loại hình đào tạo"
                    required
                >
                    <Select placeholder='Chọn loại hình đào tạo' options={trainingTypeData.map((i: TrainingType) => {
                        return {
                            value: i.id,
                            label: i.name
                        }
                    })} />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="trainingFormId"
                    label="Hình thức đào tạo"
                    required
                >
                    <Select placeholder='Chọn hình thức đào tạo' options={trainingFormData.map((i: TrainingForm) => {
                        return {
                            value: i.id,
                            label: i.name
                        }
                    })} />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="trainingLevelId"
                    label="Trình độ đào tạo"
                    required
                >
                    <Select placeholder='Chọn trình độ đào tạo' options={trainingLevelData.map((i: TrainingLevel) => {
                        return {
                            value: i.id,
                            label: i.name
                        }
                    })} />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="startDate" label="Ngày bắt đầu" required>
                    <DatePicker format="DD/MM/YYYY" className="w-full" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="endDate" label="Ngày kết thúc" required>
                    <DatePicker format="DD/MM/YYYY" className="w-full" />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="description" label="Mô tả">
                    <Input.TextArea placeholder="Nhập mô tả" />
                </FormItem>
            </Col> */}
        </PutFormModal>
    )
}

export default PutUserProfileModal
