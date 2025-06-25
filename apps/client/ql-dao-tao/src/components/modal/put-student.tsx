import { queryClient } from '@api/index'
import { generatePresignedUrl } from '@workspace/libs/api/model'

import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import { getMinioUrl } from '@workspace/constant'
import {
    useCreateStudent,
    useCreateUserProfile,
    useFindManyFixedClass,
    useFindUniqueStudent,
    useUpdateStudent,
    useUpdateUserProfile,
} from '@workspace/db/hooks'
import type { UploadFile } from 'antd'
import { Col, Form, message } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import SidebarMenu from './quan-ly-ho-so/sidebar-menu'
import TabQuanLyHoSo from './quan-ly-ho-so/tabs'
import {
    type PutStudentProfile,
    type UserProfileType,
    tabs,
} from './quan-ly-ho-so/type'

dayjs.locale('vi')

export type StudentModalProps = {
    preSelectedValues?: {
        trainingObjectTypeId?: string
        trainingCourseId?: string
        fixedClassId?: string
        curriculumVersionId?: string
    }
    id?: string | null
}

type PreFillFormFields = {
    trainingObjectTypeId?: string
    fixedClassId?: string
    trainingCourseId?: string
    curriculumVersionId?: string
}

const PutStudentModal = () => {
    const [form] = Form.useForm<PutStudentProfile>()

    const [activeKey, setActiveKey] = useState<string>('1')
    const [fileList, setFileList] = useState<UploadFile[]>([])
    const [avatar, setAvatar] = useState<UploadFile[]>([])

    const { isOpen, onClose, input } = useDisclosure<StudentModalProps>({
        tag: PutStudentModal.name,
        onClose: form.resetFields,
    })
    const { id, preSelectedValues } = input ?? {}
    const { showSpinner, hideSpinner } = useSpinner()

    const { data: fixedClassData = [], refetch: refetchFix } =
        useFindManyFixedClass({
            include: {
                trainingCourse: true,
                curriculumVersion: true,
            },
        })

    // const { data: trainingObjectTypeData = [] } =
    //     useFindManyTrainingObjectType()

    //  Helper function để xác định userType dựa vào trainingObjectType
    // const getUserTypeFromTrainingObjectType = useCallback(
    //     (trainingObjectTypeId: string) => {
    //         const trainingObjectType = trainingObjectTypeData.find(
    //             (type) => type.id === trainingObjectTypeId
    //         )

    //         if (!trainingObjectType) return 'CIVILIAN_STUDENT' // Default

    //         //  Kiểm tra dựa vào tên hoặc code của đối tượng đào tạo
    //         const typeName = trainingObjectType.name?.toLowerCase() || ''
    //         const typeCode = trainingObjectType.code?.toLowerCase() || ''

    //         // Kiểm tra xem có phải quân sự không
    //         if (
    //             typeName.includes('quân sự') ||
    //             typeName.includes('military') ||
    //             typeName.includes('học viên') ||
    //             typeCode.includes('military') ||
    //             typeCode.includes('qs') ||
    //             typeCode.includes('hv')
    //         ) {
    //             return 'MILITARY_STUDENT' // Học viên quân sự
    //         }

    //         return 'CIVILIAN_STUDENT' // Sinh viên dân sự
    //     },
    //     [trainingObjectTypeData]
    // )

    const { data: studentData } = useFindUniqueStudent({
        where: { id: id || '' },
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

    const { mutateAsync: createUserProfile } = useCreateUserProfile()
    const { mutateAsync: updateUserProfile } = useUpdateUserProfile()
    const { mutateAsync: createStudent } = useCreateStudent()
    const { mutateAsync: updateStudent } = useUpdateStudent()

    const buildUserProfileUpdateData = (
        output: UserProfileType,
        fileName?: string
    ) => ({
        avatar: fileName || undefined,
        userType: output.userType,
        firstName: output.firstName,
        healthInsuranceNumber: output.healthInsuranceNumber,
        bankAccountNumber: output.bankAccountNumber,
        bankName: output.bankName,
        lastName: output.lastName,
        currentAddress: output.currentAddress,
        provinceCurrentAddressId: output.provinceCurrentAddressId,
        districtcurrentAddressId: output.districtcurrentAddressId,
        communecurrentAddressId: output.communecurrentAddressId,
        provinceOfBirthId: output.provinceOfBirthId,
        districtOfBirthId: output.districtOfBirthId,
        communeOfBirthId: output.communeOfBirthId,
        provincePermanentAddressId: output.provincePermanentAddressId,
        districtPermanentAddressId: output.districtPermanentAddressId,
        communePermanentAddressId: output.communePermanentAddressId,
        provinceHometownId: output.provinceHometownId,
        districtHometownId: output.districtHometownId,
        communeHometownId: output.communeHometownId,
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
    })

    const buildStudentUpdateData = (output: PutStudentProfile) => ({
        code: output.code,
        trainingObjectTypeId: output.trainingObjectTypeId,
        fixedClassId: output.fixedClassId,
        registrationAreaId: output.registrationAreaId,
        status: output.status,
        userProfileId: output.userProfileId,
    })

    const buildStudentCreateData = (
        output: PutStudentProfile,
        userProfileId: string
    ) => ({
        ...buildStudentUpdateData(output),
        userProfileId,
    })

    async function onOk(output?: PutStudentProfile) {
        if (!output) return
        let fileName = output.avatar
        if (fileList.length > 0) {
            const resPresignedUrl = await generatePresignedUrl({
                path: 'avatar',
                extension: fileList[0].name.split('.').pop() ?? '',
            })
            const res = await fetch(resPresignedUrl.data.url, {
                method: 'PUT',
                body: fileList[0].originFileObj,
            })
            console.log('đây nè', resPresignedUrl.data.fileName)
            fileName = resPresignedUrl.data.fileName
        }
        try {
            showSpinner()

            const userProfileData = buildUserProfileUpdateData(
                output,
                fileName ?? undefined
            )
            const studentDataUpdate = buildStudentUpdateData(output)

            if (id) {
                // UPDATE MODE
                const promises = []

                // Cập nhật UserProfile nếu có
                if (studentData?.userProfile?.id) {
                    promises.push(
                        updateUserProfile({
                            data: userProfileData,
                            where: { id: studentData?.userProfile?.id },
                        })
                    )
                }

                // Cập nhật Student
                promises.push(
                    updateStudent({
                        data: studentDataUpdate,
                        where: { id: id },
                    })
                )

                await Promise.all(promises)

                message.success('Cập nhật sinh viên thành công')
            } else {
                // CREATE MODE
                const userProfile = await createUserProfile({
                    data: userProfileData,
                })

                if (!userProfile?.id) {
                    throw new Error(
                        'Tạo userProfile thất bại: Không có ID trả về'
                    )
                }

                const studentCreateData = buildStudentCreateData(
                    output,
                    userProfile.id
                )
                await createStudent({ data: studentCreateData })

                message.success('Thêm sinh viên thành công')
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

    useEffect(() => {
        if (studentData) {
            form.setFieldsValue({
                // Student fields với ID
                code: studentData.code,
                trainingObjectTypeId:
                    studentData.trainingObjectTypeId ?? undefined,
                fixedClassId: studentData.fixedClassId ?? undefined,
                registrationAreaId: studentData.registrationAreaId ?? undefined,
                trainingCourseId:
                    studentData.fixedClass?.trainingCourse?.id ?? undefined,
                status: studentData.status,
                curriculumVersionId:
                    studentData.curriculumVersionId ?? undefined,
                healthInsuranceNumber:
                    studentData.userProfile?.healthInsuranceNumber,
                bankAccountNumber: studentData.userProfile?.bankAccountNumber,
                bankName: studentData.userProfile?.bankName,

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

    useEffect(() => {
        if (isOpen && preSelectedValues) {
            const fieldsToSet: PreFillFormFields = {}

            if (preSelectedValues.trainingObjectTypeId) {
                fieldsToSet.trainingObjectTypeId =
                    preSelectedValues.trainingObjectTypeId
            }

            if (preSelectedValues.curriculumVersionId) {
                fieldsToSet.curriculumVersionId =
                    preSelectedValues.curriculumVersionId
            }

            if (preSelectedValues.fixedClassId) {
                fieldsToSet.fixedClassId = preSelectedValues.fixedClassId

                const selectedClass = fixedClassData.find(
                    (cls) => cls.id === preSelectedValues.fixedClassId
                )
                if (selectedClass?.trainingCourseId) {
                    fieldsToSet.trainingCourseId =
                        selectedClass.trainingCourseId
                }
                if (
                    selectedClass?.curriculumVersionId &&
                    !preSelectedValues.curriculumVersionId
                ) {
                    fieldsToSet.curriculumVersionId =
                        selectedClass.curriculumVersionId
                }
            } else if (preSelectedValues.trainingCourseId) {
                fieldsToSet.trainingCourseId =
                    preSelectedValues.trainingCourseId
            }

            if (Object.keys(fieldsToSet).length > 0) {
                form.setFieldsValue(fieldsToSet)
            }
        }
    }, [isOpen, preSelectedValues, form, fixedClassData])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={
                id
                    ? 'Chỉnh sửa sinh viên/ học viên'
                    : 'Thêm sinh viên/ học viên'
            }
            className="w-[90vw]"
            layout="vertical"
            // labelCol={{ span: 8 }} // label chiếm 6 cột (trên 24)
            // wrapperCol={{ span: 16 }} // input chiếm 18 cột
        >
            <Col xs={24} md={5}>
                <SidebarMenu
                    tabs={tabs}
                    activeKey={activeKey}
                    setActiveKey={setActiveKey}
                />
            </Col>

            <Col xs={24} md={19}>
                <TabQuanLyHoSo
                    activeKey={activeKey}
                    setActiveKey={setActiveKey}
                    avatar={avatar}
                    setAvatar={setAvatar}
                    type="STUDENT"
                    fileList={fileList}
                    setFileList={setFileList}
                />
            </Col>
        </PutFormModal>
    )
}

export default PutStudentModal
