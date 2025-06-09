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
    useFindManyAcademicDegreeType,
    useFindManyAcademicRankType,
    useFindManyEthnicity,
    useFindManyFixedClass,
    useFindManyLevel,
    useFindManyNationality,
    useFindManyOrganization,
    useFindManyPositionCPV,
    useFindManyPriorityObject,
    useFindManyRank,
    useFindManyRegistrationArea,
    useFindManyReligion,
    useFindManyTrainingCourse,
    useFindManyTrainingObjectType,
    useFindUniqueStudent,
    useFindUniqueUserProfile,
    useUpdateStudent,
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

export type PutUserProfile = UserProfile & {
    trainingObjectTypeId: string
    fixedClassId: string
    trainingCourseId: string
    priorityObjectId: string
    registrationAreaId: string
    nationalityId: string
    religionId: string
    ethnicityId: string
    rankId: string
    academicDegreeTypeId: string
    academicRankTypeId: string
}
const PutStudentModal = () => {
    const [form] = Form.useForm<PutUserProfile>()
    const { isOpen, onClose, input } = useDisclosure<any>({
        tag: PutStudentModal.name,
        onClose: form.resetFields,
    })
    const { id } = input
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
        useFindManyFixedClass()

    const { data: trainingObjectTypeData = [] } =
        useFindManyTrainingObjectType()

    const { data: trainingCourseData = [] } = useFindManyTrainingCourse()

    const { data: rankData = [] } = useFindManyRank()
    const { data: levelData = [] } = useFindManyLevel()
    const { data: academicDegreeTypeData = [] } =
        useFindManyAcademicDegreeType()
    const { data: academicRankTypeData = [] } = useFindManyAcademicRankType()

    const { data: studentData } = useFindUniqueStudent({
        where: { id },
        include: {
            userProfile: {
                include: {
                    nationality: true,
                    religion: true,
                    ethnicity: true,
                    rank: true,
                    academicRankType: true,
                    academicDegreeType: true,
                    positionCPV: true,
                },
            },
            trainingObjectType: true,
            fixedClass: {
                include: {
                    trainingCourse: true,
                },
            },
            trainingType: true,
            registrationArea: true,
            trainingLevel: true,
            priorityObject: true,
        },
    })
    const { mutateAsync: updateUserProfile } = useUpdateUserProfile()
    const { mutateAsync: updateStudent } = useUpdateStudent()
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
            if (id && studentData) {
                // Cập nhật UserProfile
                if (studentData.userProfileId) {
                    await updateUserProfile({
                        data: {
                            avatar: fileName ? fileName : undefined,
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
                            nationalityId: output.nationalityId,
                            religionId: output.religionId,
                            ethnicityId: output.ethnicityId,
                            unionDate: output.unionDate,
                            unionPlace: output.unionPlace,
                            CPVJoinDate: output.CPVJoinDate,
                            officialCPVDate: output.officialCPVDate,
                            CPVJoinPlace: output.CPVJoinPlace,
                            tenureDate: output.tenureDate,
                            enlistmentDate: output.enlistmentDate,
                            dischargeDate: output.dischargeDate,
                            familyName: output.familyName,
                            familyPhone: output.familyPhone,
                            rankId: output.rankId,
                            levelId: output.levelId,
                            academicDegreeTypeId: output.academicDegreeTypeId,
                            academicRankTypeId: output.academicRankTypeId,
                        },
                        where: {
                            id: studentData.userProfileId,
                        },
                    })
                }

                // Cập nhật Student
                await updateStudent({
                    data: {
                        code: output.code,
                        trainingObjectTypeId: output.trainingObjectTypeId,
                        fixedClassId: output.fixedClassId,
                        registrationAreaId: output.registrationAreaId,
                        ...(output.priorityObjectId && {
                            priorityObject: {
                                set: [{ id: output.priorityObjectId }],
                            },
                        }),
                    },
                    where: {
                        id,
                    },
                })

                message.success('Cập nhật thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['Student'],
            })
            onClose()
        } catch (error) {
            console.log('Error updating student:', error)
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (studentData) {
            form.setFieldsValue({
                // Student fields với ID
                code: studentData.code,
                trainingObjectTypeId:
                    studentData.trainingObjectTypeId ?? undefined,
                fixedClassId: studentData.fixedClassId ?? undefined,
                registrationAreaId: studentData.registrationAreaId ?? undefined,
                trainingCourseId: studentData.fixedClass?.trainingCourse?.name,
                priorityObjectId: studentData.priorityObject[0]?.id,

                // UserProfile fields với ID
                firstName: studentData.userProfile?.firstName,
                lastName: studentData.userProfile?.lastName,
                dateOfBirth: studentData.userProfile?.dateOfBirth
                    ? dayjs(studentData.userProfile.dateOfBirth)
                    : null,
                placeOfBirth: studentData.userProfile?.placeOfBirth,
                homeTown: studentData.userProfile?.homeTown,
                officerNumber: studentData.userProfile?.officerNumber,
                idCardNumber: studentData.userProfile?.idCardNumber,
                idCardDate: studentData.userProfile?.idCardDate
                    ? dayjs(studentData.userProfile.idCardDate)
                    : null,
                gender: studentData.userProfile?.gender,
                permanentAddress: studentData.userProfile?.permanentAddress,
                temporaryAddress: studentData.userProfile?.temporaryAddress,
                contactAddress: studentData.userProfile?.contactAddress,
                phoneNumber: studentData.userProfile?.phoneNumber,
                email: studentData.userProfile?.email,
                nationalityId:
                    studentData.userProfile?.nationalityId ?? undefined,
                religionId: studentData.userProfile?.religionId ?? undefined,
                ethnicityId: studentData.userProfile?.ethnicityId ?? undefined,
                unionDate: studentData.userProfile?.unionDate
                    ? dayjs(studentData.userProfile.unionDate)
                    : null,
                unionPlace: studentData.userProfile?.unionPlace,
                CPVJoinDate: studentData.userProfile?.CPVJoinDate
                    ? dayjs(studentData.userProfile.CPVJoinDate)
                    : null,
                officialCPVDate: studentData.userProfile?.officialCPVDate
                    ? dayjs(studentData.userProfile.officialCPVDate)
                    : null,
                CPVJoinPlace: studentData.userProfile?.CPVJoinPlace,
                tenureDate: studentData.userProfile?.tenureDate
                    ? dayjs(studentData.userProfile.tenureDate)
                    : null,
                enlistmentDate: studentData.userProfile?.enlistmentDate
                    ? dayjs(studentData.userProfile.enlistmentDate)
                    : null,
                dischargeDate: studentData.userProfile?.dischargeDate
                    ? dayjs(studentData.userProfile.dischargeDate)
                    : null,
                familyName: studentData.userProfile?.familyName,
                familyPhone: studentData.userProfile?.familyPhone,
                rankId: studentData.userProfile?.rankId ?? undefined,
                levelId: studentData.userProfile?.levelId,
                academicDegreeTypeId:
                    studentData.userProfile?.academicDegreeTypeId ?? undefined,
                academicRankTypeId:
                    studentData.userProfile?.academicRankTypeId ?? undefined,
                positionCPVId: studentData.userProfile?.positionCPVId,
            })

            if (studentData.userProfile?.avatar) {
                setAvatar([
                    {
                        uid: '-1',
                        name: 'avatar.png',
                        status: 'done',
                        url: getMinioUrl(studentData.userProfile.avatar),
                    },
                ])
            }
        }
    }, [studentData, form])
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
            title={'Chỉnh sửa sinh viên'}
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
                                                label="Mã sinh viên"
                                                required
                                                className="mb-0"
                                            >
                                                <Input placeholder="Nhập mã sinh viên" />
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
                                                    disabledDate={(date) =>
                                                        date &&
                                                        date >
                                                            dayjs().endOf('day')
                                                    }
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
                                <Col span={12} className="mt-2">
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
                                        <Input placeholder="Nhập số hiệu sĩ quan / quân nhân" />
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
                                            disabledDate={(date) =>
                                                date &&
                                                date > dayjs().endOf('day')
                                            }
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
                                            options={GENDER_LIST.map((i) => {
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
                                        name="trainingObjectTypeId"
                                        label="Đối tượng đào tạo"
                                        className="mb-0"
                                    >
                                        <Select
                                            placeholder="Chọn đối tượng đào tạo"
                                            options={trainingObjectTypeData.map(
                                                (value) => ({
                                                    value: value.id,
                                                    label: value.name,
                                                })
                                            )}
                                        />
                                    </FormItem>
                                </Col>
                                <Col span={12}>
                                    <FormItem
                                        form={form}
                                        name="fixedClassId"
                                        label="Lớp"
                                        className="mb-0"
                                    >
                                        <Select
                                            placeholder="Chọn lớp"
                                            options={fixedClassData.map(
                                                (value) => ({
                                                    value: value.id,
                                                    label: value.name,
                                                })
                                            )}
                                        />
                                    </FormItem>
                                </Col>
                                <Col span={12}>
                                    <FormItem
                                        form={form}
                                        name="trainingCourseId"
                                        label="Khóa"
                                        className="mb-0"
                                    >
                                        <Select
                                            placeholder="Chọn khóa"
                                            options={trainingCourseData.map(
                                                (value) => ({
                                                    value: value.id,
                                                    label: value.name,
                                                })
                                            )}
                                        />
                                    </FormItem>
                                </Col>

                                <Col span={12}>
                                    <FormItem
                                        form={form}
                                        name="permanentAddress"
                                        label="Địa chỉ thường trú"
                                        className="mb-0"
                                    >
                                        <Input placeholder="Nhập địa chỉ thường trú" />
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
                                        label="Địa chỉ liên hệ"
                                        className="mb-0"
                                    >
                                        <Input placeholder="Nhập địa chỉ liên hệ" />
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
                                            disabledDate={(date) =>
                                                date &&
                                                date > dayjs().endOf('day')
                                            }
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
                                            disabledDate={(date) =>
                                                date &&
                                                date > dayjs().endOf('day')
                                            }
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
                                            disabledDate={(date) =>
                                                date &&
                                                date > dayjs().endOf('day')
                                            }
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
                                            disabledDate={(date) =>
                                                date &&
                                                date > dayjs().endOf('day')
                                            }
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
                                            disabledDate={(date) =>
                                                date &&
                                                date > dayjs().endOf('day')
                                            }
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
                                            disabledDate={(date) =>
                                                date &&
                                                date > dayjs().endOf('day')
                                            }
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
                                name="familyName"
                                label="Tên phụ huynh"
                                className="mb-0"
                            >
                                <Input placeholder="Nhập tên phụ huynh" />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="familyPhone"
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
                                name="rankId"
                                label="Cấp bậc hàm"
                                className="mb-0"
                                normalize={(value) =>
                                    value === undefined ? null : value
                                }
                            >
                                <Select
                                    placeholder="Chọn cấp bậc hàm"
                                    options={rankData.map((i) => ({
                                        value: i.id,
                                        label: i.name,
                                    }))}
                                />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="levelId"
                                label="Trình độ học vấn"
                                className="mb-0"
                                normalize={(value) =>
                                    value === undefined ? null : value
                                }
                            >
                                <Select
                                    placeholder="Chọn trình độ học vấn"
                                    options={levelData.map((i) => ({
                                        value: i.id,
                                        label: i.name,
                                    }))}
                                />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="academicDegreeTypeId"
                                label="Học hàm"
                                className="mb-0"
                                normalize={(value) =>
                                    value === undefined ? null : value
                                }
                            >
                                <Select
                                    placeholder="Chọn học hàm"
                                    options={academicDegreeTypeData.map(
                                        (i) => ({
                                            value: i.id,
                                            label: i.name,
                                        })
                                    )}
                                />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="academicRankTypeId"
                                label="Học vị"
                                className="mb-0"
                                normalize={(value) =>
                                    value === undefined ? null : value
                                }
                            >
                                <Select
                                    placeholder="Chọn học vị"
                                    options={academicRankTypeData.map((i) => ({
                                        value: i.id,
                                        label: i.name,
                                    }))}
                                />
                            </FormItem>
                        </Col>
                        {/* <Col span={12}>
                            <FormItem
                                form={form}
                                name="positionName"
                                label="Chức vụ nhân viên"
                                className="mb-0"
                            >
                                <Input placeholder="Nhập chức vụ nhân viên" />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="positionCPVId"
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
                        </Col> */}
                    </Row>
                </TabPane>
            </Tabs>
        </PutFormModal>
    )
}

export default PutStudentModal
