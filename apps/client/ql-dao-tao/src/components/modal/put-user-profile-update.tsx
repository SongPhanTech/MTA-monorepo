import { queryClient } from '@api/index'
import { fetchGeneratePresignedUrl } from '@api/model/modelComponents'
import DatePicker from '@components/commons/date-picker'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import { GENDER_LIST } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import { getMinioUrl } from '@workspace/constant'
import type {
    Ethnicity,
    Nationality,
    PriorityObject,
    RegistrationArea,
    Religion,
    UserProfile,
} from '@workspace/db'
import {
    useCreateUserProfile,
    useFindManyEthnicity,
    useFindManyNationality,
    useFindManyPriorityObject,
    useFindManyRegistrationArea,
    useFindManyReligion,
    useFindUniqueUserProfile,
    useUpdateUserProfile,
} from '@workspace/db/hooks'
import type { UploadFile, UploadProps } from 'antd'
import { Col, Collapse, Form, Input, Row, Tabs, Upload, message } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
const { TabPane } = Tabs
const { Panel } = Collapse
dayjs.locale('vi')

export type PutUserProfile = UserProfile
const PutUserProfileUpdateModal = () => {
    const [form] = Form.useForm<PutUserProfile>()
    const { isOpen, onClose, input } = useDisclosure<any>({
        tag: PutUserProfileUpdateModal.name,
        onClose: form.resetFields,
    })
    const { id, code } = input
    const { showSpinner, hideSpinner } = useSpinner()

    const { data: priorityObjectData = [], refetch: refetchPriorityObject } =
        useFindManyPriorityObject()
    const { data: registrationAreaData = [], refetch: refetchRe } =
        useFindManyRegistrationArea()
    const { data: nationalityData = [], refetch: refetchNa } =
        useFindManyNationality()

    const { data: religionData = [], refetch: refetchReli } =
        useFindManyReligion()

    const { data: ethnicityData = [], refetch: refetchEth } =
        useFindManyEthnicity()

    const { data: fixedClassData = [], refetch: refetchFix } =
        useFindManyReligion()

    const { mutateAsync: createUserProfile } = useCreateUserProfile()
    const { mutateAsync: updateUserProfile } = useUpdateUserProfile()
    async function onOk(output?: PutUserProfile) {
        if (!output) return
        let fileName
        if (fileList.length > 0) {
            const resPresignedUrl = await fetchGeneratePresignedUrl({
                body: {
                    path: 'avatar',
                    extension: fileList[0].name.split('.').pop() ?? '',
                },
            })
            const res = await fetch(resPresignedUrl.url, {
                method: 'PUT',
                body: fileList[0].originFileObj,
            })
            console.log('đây nè', resPresignedUrl.fileName)
            fileName = resPresignedUrl.fileName
        }
        try {
            showSpinner()
            if (id) {
                await updateUserProfile({
                    data: {
                        avatar: fileName ? fileName : undefined,
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
                        userTypeId:
                            userTypeData?.find(
                                (type: any) => type.code === code
                            )?.id ?? undefined,
                        userId: output.userId,
                        priorityObjectId: output.priorityObjectId,
                        registrationAreaId: output.registrationAreaId,
                        nationalityId: output.nationalityId,
                        religionId: output.religionId,
                        ethnicityId: output.ethnicityId,
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
                        userTypeId: userTypeData?.find(
                            (type: any) => type.code === code
                        )!.id,
                        userId: output.userId,
                        priorityObjectId: output.priorityObjectId,
                        registrationAreaId: output.registrationAreaId,
                        nationalityId: output.nationalityId,
                        religionId: output.religionId,
                        ethnicityId: output.ethnicityId,
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
                dateOfBirth: level.dateOfBirth
                    ? dayjs(level.dateOfBirth)
                    : null,
                idCardDate: level.idCardDate ? dayjs(level.idCardDate) : null,
                unionDate: level.unionDate ? dayjs(level.unionDate) : null,
                CPVJoinDate: level.CPVJoinDate
                    ? dayjs(level.CPVJoinDate)
                    : null,
                officialCPVDate: level.officialCPVDate
                    ? dayjs(level.officialCPVDate)
                    : null,
                tenureDate: level.tenureDate ? dayjs(level.tenureDate) : null,
                enlistmentDate: level.enlistmentDate
                    ? dayjs(level.enlistmentDate)
                    : null,
                dischargeDate: level.dischargeDate
                    ? dayjs(level.dischargeDate)
                    : null,
            })
            if (level.avatar) {
                console.log(getMinioUrl(level.avatar))
                setAvatar([
                    {
                        uid: '-1',
                        name: 'avatar.png',
                        status: 'done',
                        url: getMinioUrl(level.avatar),
                    },
                ])
            }
        }
    }, [level])
    const [fileList, setFileList] = useState<UploadFile[]>([])
    const [avatar, setAvatar] = useState<UploadFile[]>([])

    const beforeUpload = (file: File) => {
        const fileURL = URL.createObjectURL(file)

        const newFile: UploadFile = {
            uid: Date.now().toString(),
            name: file.name,
            status: 'done',
            url: fileURL,
            originFileObj: file as any,
        }
        setFileList([newFile])
        return false
    }

    const onChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
        setFileList(newFileList.slice(-1))
    }

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={
                id
                    ? code === 'SV'
                        ? 'Chỉnh sửa sinh viên'
                        : 'Chỉnh sửa học viên'
                    : code === 'SV'
                      ? 'Thêm mới sinh viên'
                      : 'Thêm mới học viên'
            }
            className="w-[80vw]"
            layout="vertical"
            // labelCol={{ span: 8 }} // label chiếm 6 cột (trên 24)
            // wrapperCol={{ span: 16 }} // input chiếm 18 cột
        >
            <Tabs className="w-full" defaultActiveKey="1">
                <TabPane tab="Thông tin cá nhân" key="1" id="info-block">
                    <Collapse defaultActiveKey={['1']} accordion>
                        <Panel header="Thông tin cá nhân" key="1">
                            <Row gutter={[16, 16]}>
                                <Col span={4}>
                                    <div
                                        style={{
                                            transform: 'scale(1.5)',
                                            transformOrigin: 'top left',
                                            fontSize: '0.65rem',
                                        }}
                                    >
                                        <Form.Item
                                            name={'file'}
                                            className="mb-0"
                                        >
                                            <Upload
                                                listType="picture-card"
                                                // fileList={fileList}
                                                fileList={
                                                    avatar.length > 0
                                                        ? avatar
                                                        : fileList
                                                }
                                                onChange={onChange}
                                                beforeUpload={beforeUpload}
                                                onRemove={() => {
                                                    setFileList([])
                                                    setAvatar([])
                                                    return true
                                                }}
                                            >
                                                {avatar.length > 0 ||
                                                fileList.length > 0
                                                    ? ''
                                                    : fileList.length < 1 && (
                                                          <p
                                                              style={{
                                                                  fontSize:
                                                                      '0.65rem',
                                                              }}
                                                          >
                                                              + Tải ảnh lên
                                                          </p>
                                                      )}
                                            </Upload>
                                        </Form.Item>
                                    </div>
                                </Col>
                                <Col span={20}>
                                    <Row gutter={[10, 10]}>
                                        <Col span={12}>
                                            <FormItem
                                                form={form}
                                                name="code"
                                                label="Mã"
                                                required
                                                className="mb-0"
                                            >
                                                <Input placeholder="Nhập mã" />
                                            </FormItem>
                                        </Col>
                                        <Col span={12}>
                                            <FormItem
                                                form={form}
                                                name="lastName"
                                                label="Họ và tên đệm"
                                                required
                                                className="mb-0"
                                            >
                                                <Input placeholder="Nhập họ và tên đệm" />
                                            </FormItem>
                                        </Col>
                                        <Col span={12}>
                                            <FormItem
                                                form={form}
                                                name="firstName"
                                                label="Tên"
                                                required
                                                className="mb-0"
                                            >
                                                <Input placeholder="Nhập tên" />
                                            </FormItem>
                                        </Col>
                                        <Col span={12}>
                                            <FormItem
                                                form={form}
                                                name="dateOfBirth"
                                                label="Ngày sinh"
                                                className="mb-0"
                                            >
                                                <DatePicker
                                                    format="DD/MM/YYYY"
                                                    className="w-full"
                                                />
                                            </FormItem>
                                        </Col>
                                    </Row>
                                </Col>

                                <Col span={12} className="mt-2">
                                    <FormItem
                                        form={form}
                                        name="placeOfBirth"
                                        label="Nơi sinh"
                                        className="mb-0"
                                    >
                                        <Input placeholder="Nhập nơi sinh" />
                                    </FormItem>
                                </Col>
                                <Col span={12}>
                                    <FormItem
                                        form={form}
                                        name="homeTown"
                                        label="Quê quán"
                                        className="mb-0"
                                    >
                                        <Input placeholder="Nhập quê quán" />
                                    </FormItem>
                                </Col>
                                <Col span={12}>
                                    <FormItem
                                        form={form}
                                        name="officerNumber"
                                        label="Số hiệu sĩ quan"
                                        className="mb-0"
                                    >
                                        <Input placeholder="Nhập số hiệu sĩ quan" />
                                    </FormItem>
                                </Col>
                                <Col span={12}>
                                    <FormItem
                                        form={form}
                                        name="idCardNumber"
                                        label="Số CCCD"
                                        className="mb-0"
                                    >
                                        <Input placeholder="Nhập số CCCD" />
                                    </FormItem>
                                </Col>

                                <Col span={12}>
                                    <FormItem
                                        form={form}
                                        name="idCardDate"
                                        label="Ngày cấp CCCD"
                                        className="mb-0"
                                    >
                                        <DatePicker
                                            format="DD/MM/YYYY"
                                            className="w-full"
                                        />
                                    </FormItem>
                                </Col>
                                <Col span={12}>
                                    <FormItem
                                        form={form}
                                        name="gender"
                                        label="Giới tính"
                                        className="mb-0"
                                    >
                                        <Select
                                            allowClear
                                            placeholder="Chọn giới tính"
                                            options={GENDER_LIST.map(
                                                (i: any) => {
                                                    return {
                                                        value: i.id,
                                                        label: i.name,
                                                    }
                                                }
                                            )}
                                        />
                                    </FormItem>
                                </Col>
                                <Col span={12}>
                                    <FormItem
                                        form={form}
                                        name="permanentAddress"
                                        label="Đối tượng đào tạo"
                                        className="mb-0"
                                    >
                                        <Input placeholder="Nhập đối tượng đào tạo" />
                                    </FormItem>
                                </Col>
                                <Col span={12}>
                                    <FormItem
                                        form={form}
                                        name="permanentAddress"
                                        label="Lớp"
                                        className="mb-0"
                                    >
                                        <Input placeholder="Nhập lớp" />
                                    </FormItem>
                                </Col>
                                <Col span={12}>
                                    <FormItem
                                        form={form}
                                        name="permanentAddress"
                                        label="Khóa"
                                        className="mb-0"
                                    >
                                        <Input placeholder="Nhập khóa" />
                                    </FormItem>
                                </Col>
                                <Col span={12}>
                                    <FormItem
                                        form={form}
                                        name="permanentAddress"
                                        label="Ngành"
                                        className="mb-0"
                                    >
                                        <Input placeholder="Nhập ngành" />
                                    </FormItem>
                                </Col>
                                <Col span={12}>
                                    <FormItem
                                        form={form}
                                        name="permanentAddress"
                                        label="Chuyên ngành"
                                        className="mb-0"
                                    >
                                        <Input placeholder="Nhập chuyên ngành" />
                                    </FormItem>
                                </Col>
                                <Col span={12}>
                                    <FormItem
                                        form={form}
                                        name="permanentAddress"
                                        label="Chương trinhg đào tạo"
                                        className="mb-0"
                                    >
                                        <Input placeholder="Nhập chuyên ngành đào tạo" />
                                    </FormItem>
                                </Col>
                                <Col span={12}>
                                    <FormItem
                                        form={form}
                                        name="permanentAddress"
                                        label="HK thường trú"
                                        className="mb-0"
                                    >
                                        <Input placeholder="Nhập hk thường trú" />
                                    </FormItem>
                                </Col>
                                <Col span={12}>
                                    <FormItem
                                        form={form}
                                        name="temporaryAddress"
                                        label="Địa chỉ tạm trú"
                                        className="mb-0"
                                    >
                                        <Input placeholder="Nhập địa chỉ tạm trú" />
                                    </FormItem>
                                </Col>
                                <Col span={12}>
                                    <FormItem
                                        form={form}
                                        name="contactAddress"
                                        label="Địa chỉ liên lạc"
                                        className="mb-0"
                                    >
                                        <Input placeholder="Nhập địa chỉ liên lạc" />
                                    </FormItem>
                                </Col>
                                <Col span={12}>
                                    <FormItem
                                        form={form}
                                        name="phoneNumber"
                                        label="Số điện thoại"
                                        className="mb-0"
                                    >
                                        <Input placeholder="Nhập số điện thoại" />
                                    </FormItem>
                                </Col>
                                <Col span={12}>
                                    <FormItem
                                        form={form}
                                        name="email"
                                        label="Thư điện tử"
                                        className="mb-0"
                                    >
                                        <Input placeholder="Nhập thư điện tử" />
                                    </FormItem>
                                </Col>
                                <Col span={12}>
                                    <FormItem
                                        form={form}
                                        name="priorityObjectId"
                                        label="Đối tượng ưu tiên"
                                        className="mb-0"
                                        normalize={(value) =>
                                            value === undefined ? null : value
                                        }
                                    >
                                        <Select
                                            allowClear
                                            placeholder="Chọn đối tượng ưu tiên"
                                            options={priorityObjectData.map(
                                                (i: PriorityObject) => {
                                                    return {
                                                        value: i.id,
                                                        label: i.name,
                                                    }
                                                }
                                            )}
                                        />
                                    </FormItem>
                                </Col>
                                <Col span={12}>
                                    <FormItem
                                        form={form}
                                        name="registrationAreaId"
                                        label="Khu vực đăng ký"
                                        className="mb-0"
                                        normalize={(value) =>
                                            value === undefined ? null : value
                                        }
                                    >
                                        <Select
                                            allowClear
                                            placeholder="Chọn khu vực đăng ký"
                                            options={registrationAreaData.map(
                                                (i: RegistrationArea) => {
                                                    return {
                                                        value: i.id,
                                                        label: i.name,
                                                    }
                                                }
                                            )}
                                        />
                                    </FormItem>
                                </Col>
                                <Col span={12}>
                                    <FormItem
                                        form={form}
                                        name="nationalityId"
                                        label="Quốc tịch"
                                        className="mb-0"
                                        normalize={(value) =>
                                            value === undefined ? null : value
                                        }
                                    >
                                        <Select
                                            allowClear
                                            placeholder="Chọn quốc tịch"
                                            options={nationalityData.map(
                                                (i: Nationality) => {
                                                    return {
                                                        value: i.id,
                                                        label: i.name,
                                                    }
                                                }
                                            )}
                                        />
                                    </FormItem>
                                </Col>
                                <Col span={12}>
                                    <FormItem
                                        form={form}
                                        name="religionId"
                                        label="Tôn giáo"
                                        className="mb-0"
                                        normalize={(value) =>
                                            value === undefined ? null : value
                                        }
                                    >
                                        <Select
                                            allowClear
                                            placeholder="Chọn tôn giáo"
                                            options={religionData.map(
                                                (i: Religion) => {
                                                    return {
                                                        value: i.id,
                                                        label: i.name,
                                                    }
                                                }
                                            )}
                                        />
                                    </FormItem>
                                </Col>
                                <Col span={12}>
                                    <FormItem
                                        form={form}
                                        name="ethnicityId"
                                        label="Dân tộc"
                                        className="mb-0"
                                        normalize={(value) =>
                                            value === undefined ? null : value
                                        }
                                    >
                                        <Select
                                            allowClear
                                            placeholder="Chọn dân tộc"
                                            options={ethnicityData.map(
                                                (i: Ethnicity) => {
                                                    return {
                                                        value: i.id,
                                                        label: i.name,
                                                    }
                                                }
                                            )}
                                        />
                                    </FormItem>
                                </Col>
                            </Row>
                        </Panel>
                        <Panel header="Thông tin Đoàn/Đảng/Nhập ngũ" key="2">
                            <Row gutter={[16, 16]}>
                                <Col span={12}>
                                    <FormItem
                                        form={form}
                                        name="unionDate"
                                        label="Ngày vào đoàn"
                                        className="mb-0"
                                    >
                                        <DatePicker
                                            format="DD/MM/YYYY"
                                            className="w-full"
                                        />
                                    </FormItem>
                                </Col>
                                <Col span={12}>
                                    <FormItem
                                        form={form}
                                        name="unionPlace"
                                        label="Nơi vào đoàn"
                                        className="mb-0"
                                    >
                                        <Input placeholder="Nhập nơi vào đoàn" />
                                    </FormItem>
                                </Col>
                                <Col span={12}>
                                    <FormItem
                                        form={form}
                                        name="CPVJoinDate"
                                        label="Ngày vào Đảng"
                                        className="mb-0"
                                    >
                                        <DatePicker
                                            format="DD/MM/YYYY"
                                            className="w-full"
                                        />
                                    </FormItem>
                                </Col>
                                <Col span={12}>
                                    <FormItem
                                        form={form}
                                        name="officialCPVDate"
                                        label="Ngày chính thức"
                                        className="mb-0"
                                    >
                                        <DatePicker
                                            format="DD/MM/YYYY"
                                            className="w-full"
                                        />
                                    </FormItem>
                                </Col>
                                <Col span={12}>
                                    <FormItem
                                        form={form}
                                        name="CPVJoinPlace"
                                        label="Nơi vào Đảng"
                                        className="mb-0"
                                    >
                                        <Input placeholder="Nhập nơi vào Đảng" />
                                    </FormItem>
                                </Col>
                                <Col span={12}>
                                    <FormItem
                                        form={form}
                                        name="tenureDate"
                                        label="Ngày vào biên chế"
                                        className="mb-0"
                                    >
                                        <DatePicker
                                            format="DD/MM/YYYY"
                                            className="w-full"
                                        />
                                    </FormItem>
                                </Col>
                                <Col span={12}>
                                    <FormItem
                                        form={form}
                                        name="enlistmentDate"
                                        label="Ngày nhập ngũ"
                                        className="mb-0"
                                    >
                                        <DatePicker
                                            format="DD/MM/YYYY"
                                            className="w-full"
                                        />
                                    </FormItem>
                                </Col>
                                <Col span={12}>
                                    <FormItem
                                        form={form}
                                        name="dischargeDate"
                                        label="Ngày xuất ngũ"
                                        className="mb-0"
                                    >
                                        <DatePicker
                                            format="DD/MM/YYYY"
                                            className="w-full"
                                        />
                                    </FormItem>
                                </Col>
                            </Row>
                        </Panel>
                    </Collapse>
                </TabPane>
                <TabPane tab="Thông tin gia đình" key="2">
                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="parentName"
                                label="Tên phụ huynh"
                                className="mb-0"
                            >
                                <Input placeholder="Nhập tên phụ huynh" />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="parentPhoneNumber"
                                label="Số điện thoại phụ huynh"
                                className="mb-0"
                            >
                                <Input placeholder="Nhập số điện thoại phụ huynh" />
                            </FormItem>
                        </Col>
                    </Row>
                </TabPane>
                <TabPane tab="Lịch sử" key="3">
                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="rankName"
                                label="Cấp bậc hàm"
                                className="mb-0"
                            >
                                <Input placeholder="Nhập cấp bậc hàm" />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="educationLevel"
                                label="Trình độ học vấn"
                                className="mb-0"
                            >
                                <Input placeholder="Nhập trình độ học vấn" />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="academicDegreeTypeName"
                                label="Học hàm"
                                className="mb-0"
                            >
                                <Input placeholder="Nhập học hàm" />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="academicRankTypeName"
                                label="Học vị"
                                className="mb-0"
                            >
                                <Input placeholder="Nhập học vị" />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="positionName"
                                label="Chức vụ chính quyền"
                                className="mb-0"
                            >
                                <Input placeholder="Nhập chức vụ chính quyền" />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="positionCPVName"
                                label="Chức vụ Đảng"
                                className="mb-0"
                            >
                                <Input placeholder="Nhập chức vụ Đảng" />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="organizationName"
                                label="Đơn vị"
                                className="mb-0"
                            >
                                <Input placeholder="Nhập đơn vị" />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="organizationCPVName"
                                label="Nơi sinh hoạt Đảng"
                                className="mb-0"
                            >
                                <Input placeholder="Nhập nơi sinh hoạt Đảng" />
                            </FormItem>
                        </Col>
                    </Row>
                </TabPane>
            </Tabs>
        </PutFormModal>
    )
}

export default PutUserProfileUpdateModal
