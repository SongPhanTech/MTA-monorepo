import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import type { UserProfile, SchoolYear, TrainingForm, TrainingLevel, TrainingType, TrainingObjectType, PriorityObject, RegistrationArea, Nationality, Religion, Ethnicity } from '@workspace/db'
import {
    useCreateUserProfile,
    useFindUniqueUserProfile,
    useFindManySchoolYear,
    useFindManyUserProfile,
    useUpdateUserProfile,
    useFindManyTrainingForm,
    useFindManyTrainingType,
    useFindManyTrainingObjectType,
    useFindManyTrainingLevel,
    useFindManyUserType,
    useFindManyPriorityObject,
    useFindManyRegistrationArea,
    useFindManyNationality,
    useFindManyReligion,
    useFindManyEthnicity
} from '@workspace/db/hooks'
import { Col, Form, Input, message, Tabs, Collapse, Row } from 'antd'
import { useEffect } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import Select from '@components/commons/select'
import DatePicker from '@components/commons/date-picker'
import dayjs from 'dayjs'
import { GENDER_LIST } from '@constants/constants'
const { TabPane } = Tabs;
const { Panel } = Collapse;

export type PutUserProfile = UserProfile
const PutUserProfileUpdateModal = () => {
    const [form] = Form.useForm<PutUserProfile>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutUserProfileUpdateModal.name,
        onClose: form.resetFields,
    })
    const { showSpinner, hideSpinner } = useSpinner()

    const { data: userTypeData = [], refetch: refetchUserType } = useFindManyUserType({
        take: 1000,
        skip: 0,
    });

    const { data: priorityObjectData = [], refetch: refetchPriorityObject } = useFindManyPriorityObject({
        take: 1000,
        skip: 0,
    });
    const { data: registrationAreaData = [], refetch: refetchRe } = useFindManyRegistrationArea({
        take: 1000,
        skip: 0,
    });
    const { data: nationalityData = [], refetch: refetchNa } = useFindManyNationality({
        take: 1000,
        skip: 0,
    });

    const { data: religionData = [], refetch: refetchReli } = useFindManyReligion({
        take: 1000,
        skip: 0,
    })

    const { data: ethnicityData = [], refetch: refetchEth } = useFindManyEthnicity({
        take: 1000,
        skip: 0,
    })

    const { data: fixedClassData = [], refetch: refetchFix } = useFindManyReligion({
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
                dateOfBirth: level.dateOfBirth ? dayjs(level.dateOfBirth) : null,
                idCardDate: level.idCardDate ? dayjs(level.idCardDate) : null,
                unionDate: level.unionDate ? dayjs(level.unionDate) : null,
                CPVJoinDate: level.CPVJoinDate ? dayjs(level.CPVJoinDate) : null,
                officialCPVDate: level.officialCPVDate ? dayjs(level.officialCPVDate) : null,
                tenureDate: level.tenureDate ? dayjs(level.tenureDate) : null,
                enlistmentDate: level.enlistmentDate ? dayjs(level.enlistmentDate) : null,
                dischargeDate: level.dischargeDate ? dayjs(level.dischargeDate) : null,
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
            className="w-[70vw]"
            layout='horizontal'
            labelCol={{ span: 8 }}      // label chiếm 6 cột (trên 24)
            wrapperCol={{ span: 16 }}   // input chiếm 18 cột
        >
            <Tabs className='w-full' defaultActiveKey="1">
                <TabPane tab="Thông tin cá nhân" key="1" id='info-block'>
                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="userTypeId"
                                label="Đối tượng"
                                className='mb-0'
                                required
                            >
                                <Select placeholder='Chọn đối tượng' options={userTypeData.map((i: TrainingLevel) => {
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
                                name="code"
                                label="Mã học viên"
                                required
                                className='mb-0'
                            >
                                <Input placeholder='Nhập mã học viên' />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="lastName"
                                label="Họ và tên đệm"
                                required
                                className='mb-0'
                            >
                                <Input placeholder='Nhập họ và tên đệm' />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="firstName"
                                label="Tên"
                                required
                                className='mb-0'
                            >
                                <Input placeholder='Nhập tên' />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="dateOfBirth"
                                label="Ngày sinh"
                                className='mb-0'
                            >
                                <DatePicker format="DD/MM/YYYY" className="w-full" />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="placeOfBirth"
                                label="Nơi sinh"
                                className='mb-0'
                            >
                                <Input placeholder='Nhập nơi sinh' />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="homeTown"
                                label="Quê quán"
                                className='mb-0'
                            >
                                <Input placeholder='Nhập quê quán' />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="officerNumber"
                                label="Số hiệu sĩ quan"
                                className='mb-0'
                            >
                                <Input placeholder='Nhập số hiệu sĩ quan' />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="idCardNumber"
                                label="Số CCCD"
                                className='mb-0'
                            >
                                <Input placeholder='Nhập số CCCD' />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="idCardDate"
                                label="Ngày cấp CCCD"
                                className='mb-0'
                            >
                                <DatePicker format="DD/MM/YYYY" className="w-full" />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="gender"
                                label="Giới tính"
                                className='mb-0'
                            >
                                <Select allowClear placeholder='Chọn giới tính' options={GENDER_LIST.map((i: any) => {
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
                                name="permanentAddress"
                                label="HK thường trú"
                                className='mb-0'
                            >
                                <Input placeholder='Nhập hk thường trú' />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="temporaryAddress"
                                label="Địa chỉ tạm trú"
                                className='mb-0'
                            >
                                <Input placeholder='Nhập địa chỉ tạm trú' />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="contactAddress"
                                label="Địa chỉ liên lạc"
                                className='mb-0'
                            >
                                <Input placeholder='Nhập địa chỉ liên lạc' />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="phoneNumber"
                                label="Số điện thoại"
                                className='mb-0'
                            >
                                <Input placeholder='Nhập số điện thoại' />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="email"
                                label="Thư điện tử"
                                className='mb-0'
                            >
                                <Input placeholder='Nhập thư điện tử' />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="priorityObjectId"
                                label="Đối tượng ưu tiên"
                                className='mb-0'
                                normalize={(value) => (value === undefined ? null : value)}
                            >
                                <Select allowClear placeholder='Chọn đối tượng ưu tiên' options={priorityObjectData.map((i: PriorityObject) => {
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
                                name="registrationAreaId"
                                label="Khu vực đăng ký"
                                className='mb-0'
                                normalize={(value) => (value === undefined ? null : value)}
                            >
                                <Select allowClear placeholder='Chọn khu vực đăng ký' options={registrationAreaData.map((i: RegistrationArea) => {
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
                                name="nationalityId"
                                label="Quốc tịch"
                                className='mb-0'
                                normalize={(value) => (value === undefined ? null : value)}
                            >
                                <Select allowClear placeholder='Chọn quốc tịch' options={nationalityData.map((i: Nationality) => {
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
                                name="religionId"
                                label="Tôn giáo"
                                className='mb-0'
                                normalize={(value) => (value === undefined ? null : value)}
                            >
                                <Select allowClear placeholder='Chọn tôn giáo' options={religionData.map((i: Religion) => {
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
                                name="ethnicityId"
                                label="Dân tộc"
                                className='mb-0'
                                normalize={(value) => (value === undefined ? null : value)}
                            >
                                <Select allowClear placeholder='Chọn dân tộc' options={ethnicityData.map((i: Ethnicity) => {
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
                                name="parentName"
                                label="Tên phụ huynh"
                                className='mb-0'
                            >
                                <Input placeholder='Nhập tên phụ huynh' />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="parentPhoneNumber"
                                label="Số điện thoại phụ huynh"
                                className='mb-0'
                            >
                                <Input placeholder='Nhập số điện thoại phụ huynh' />
                            </FormItem>
                        </Col>
                    </Row>
                </TabPane>
                <TabPane tab="Thông tin đoàn thể" key="2">
                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="unionDate"
                                label="Ngày vào đoàn"
                                className='mb-0'
                            >
                                <DatePicker format="DD/MM/YYYY" className="w-full" />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="unionPlace"
                                label="Nơi vào đoàn"
                                className='mb-0'
                            >
                                <Input placeholder='Nhập nơi vào đoàn' />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="CPVJoinDate"
                                label="Ngày vào Đảng"
                                className='mb-0'
                            >
                                <DatePicker format="DD/MM/YYYY" className="w-full" />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="officialCPVDate"
                                label="Ngày chính thức"
                                className='mb-0'
                            >
                                <DatePicker format="DD/MM/YYYY" className="w-full" />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="CPVJoinPlace"
                                label="Nơi vào Đảng"
                                className='mb-0'
                            >
                                <Input placeholder='Nhập nơi vào Đảng' />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="tenureDate"
                                label="Ngày vào biên chế"
                                className='mb-0'
                            >
                                <DatePicker format="DD/MM/YYYY" className="w-full" />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="enlistmentDate"
                                label="Ngày nhập ngũ"
                                className='mb-0'
                            >
                                <DatePicker format="DD/MM/YYYY" className="w-full" />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="dischargeDate"
                                label="Ngày xuất ngũ"
                                className='mb-0'
                            >
                                <DatePicker format="DD/MM/YYYY" className="w-full" />
                            </FormItem>
                        </Col>
                    </Row>
                </TabPane>
                <TabPane tab="Thông tin thay đổi" key="3">
                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="rankName"
                                label="Cấp bậc hàm"
                                className='mb-0'
                            >
                                <Input placeholder='Nhập cấp bậc hàm' />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="educationLevel"
                                label="Trình độ học vấn"
                                className='mb-0'
                            >
                                <Input placeholder='Nhập trình độ học vấn' />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="academicDegreeTypeName"
                                label="Học hàm"
                                className='mb-0'
                            >
                                <Input placeholder='Nhập học hàm' />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="academicRankTypeName"
                                label="Học vị"
                                className='mb-0'
                            >
                                <Input placeholder='Nhập học vị' />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="positionName"
                                label="Chức vụ chính quyền"
                                className='mb-0'
                            >
                                <Input placeholder='Nhập chức vụ chính quyền' />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="positionCPVName"
                                label="Chức vụ Đảng"
                                className='mb-0'
                            >
                                <Input placeholder='Nhập chức vụ Đảng' />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="organizationName"
                                label="Đơn vị"
                                className='mb-0'
                            >
                                <Input placeholder='Nhập đơn vị' />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="organizationCPVName"
                                label="Nơi sinh hoạt Đảng"
                                className='mb-0'
                            >
                                <Input placeholder='Nhập nơi sinh hoạt Đảng' />
                            </FormItem>
                        </Col>
                    </Row>
                </TabPane>
            </Tabs>
        </PutFormModal>
    )
}

export default PutUserProfileUpdateModal
