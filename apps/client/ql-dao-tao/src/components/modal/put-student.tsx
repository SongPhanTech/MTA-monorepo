import { queryClient } from '@api/index'
import { generatePresignedUrl } from '@workspace/libs/api/model'

import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import { getMinioUrl } from '@workspace/constant'
import type {
    $Enums,
    CurriculumVersion,
    PriorityObject,
    Student,
    TrainingCourse,
    TrainingObjectType,
    UserProfile,
} from '@workspace/db'
import {
    useCreateStudent,
    useCreateUserProfile,
    useFindManyFixedClass,
    useFindManyTrainingCourse,
    useFindManyTrainingObjectType,
    useFindManyUserProfile,
    useFindUniqueStudent,
    useUpdateStudent,
    useUpdateUserProfile,
} from '@workspace/db/hooks'
import type { UploadFile, UploadProps } from 'antd'
import { Col, Collapse, Form, Tabs, message } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import _ from 'lodash'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import SidebarMenu from './quan-ly-ho-so/sidebar-menu'
import TabQuanLyHoSo from './quan-ly-ho-so/tabs'
import { tabs } from './quan-ly-ho-so/type'
const { TabPane } = Tabs
const { Panel } = Collapse
dayjs.locale('vi')

export type PutUserProfile = UserProfile & {
    trainingObjectTypeId?: string
    fixedClassId?: string
    trainingCourseId?: string
    priorityObjectId?: string
    registrationAreaId?: string
    nationalityId?: string
    religionId?: string
    ethnicityId?: string
    rankId?: string
    academicDegreeTypeId?: string
    academicRankTypeId?: string
    status?: $Enums.StudentStatus
    curriculumVersionId?: string
    educationAndTraining?: string
}

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

type ProfileWithRelations = UserProfile & {
    nationality?: Nationality | null
    religion?: Religion | null
    ethnicity?: Ethnicity | null
    rank?: Rank | null
    level?: Level | null
    academicDegreeType?: AcademicDegreeType | null
    academicRankType?: AcademicRankType | null
    educationAndTraining: (Student & {
        priorityObject?: PriorityObject[]
        fixedClass?: {
            trainingCourse?: TrainingCourse
        } | null
        trainingObjectType?: TrainingObjectType | null
        curriculumVersion?: CurriculumVersion | null
    })[]
}

const PutStudentModal = () => {
    const [form] = Form.useForm<PutUserProfile>()

    const [activeKey, setActiveKey] = useState<string>('1')

    const { isOpen, onClose, input } = useDisclosure<StudentModalProps>({
        tag: PutStudentModal.name,
        onClose: form.resetFields,
    })
    const { id, preSelectedValues } = input ?? {}
    const { showSpinner, hideSpinner } = useSpinner()

    const [searchIdCard, setSearchIdCard] = useState<string>('')
    const [foundProfile, setFoundProfile] =
        useState<ProfileWithRelations | null>(null)
    const [idCardOptions, setIdCardOptions] = useState<
        { value: string; label: string }[]
    >([])

    const { data: fixedClassData = [], refetch: refetchFix } =
        useFindManyFixedClass({
            include: {
                trainingCourse: true,
                curriculumVersion: true,
            },
        })

    const { data: trainingObjectTypeData = [] } =
        useFindManyTrainingObjectType()

    const { data: trainingCourseData = [] } = useFindManyTrainingCourse()

    const { data: idCardNumberData = [] } = useFindManyUserProfile({
        select: {
            idCardNumber: true,
            userType: true,
            lastName: true,
            firstName: true,
        },
        where: {
            userType: {
                in: ['CIVILIAN_STUDENT', 'MILITARY_STUDENT', 'CIVIL_STUDENT'],
            },
        },
    })

    //  Helper function để xác định userType dựa vào trainingObjectType
    const getUserTypeFromTrainingObjectType = useCallback(
        (trainingObjectTypeId: string) => {
            const trainingObjectType = trainingObjectTypeData.find(
                (type) => type.id === trainingObjectTypeId
            )

            if (!trainingObjectType) return 'CIVILIAN_STUDENT' // Default

            //  Kiểm tra dựa vào tên hoặc code của đối tượng đào tạo
            const typeName = trainingObjectType.name?.toLowerCase() || ''
            const typeCode = trainingObjectType.code?.toLowerCase() || ''

            // Kiểm tra xem có phải quân sự không
            if (
                typeName.includes('quân sự') ||
                typeName.includes('military') ||
                typeName.includes('học viên') ||
                typeCode.includes('military') ||
                typeCode.includes('qs') ||
                typeCode.includes('hv')
            ) {
                return 'MILITARY_STUDENT' // Học viên quân sự
            }

            return 'CIVILIAN_STUDENT' // Sinh viên dân sự
        },
        [trainingObjectTypeData]
    )

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
            curriculumVersion: true,
            trainingType: true,
            registrationArea: true,
            trainingLevel: true,
            priorityObject: true,
        },
    })

    const { data: existingProfiles } = useFindManyUserProfile({
        where: {
            idCardNumber: searchIdCard || undefined,
        },
        include: {
            nationality: true,
            religion: true,
            ethnicity: true,
            rank: true,
            level: true,
            academicDegreeType: true,
            academicRankType: true,
            educationAndTraining: {
                include: {
                    priorityObject: true,
                    fixedClass: {
                        include: {
                            trainingCourse: true,
                        },
                    },
                    trainingObjectType: true,
                    registrationArea: true,
                    curriculumVersion: true,
                },
            },
        },
    })

    const { mutateAsync: createUserProfile } = useCreateUserProfile()
    const { mutateAsync: updateUserProfile } = useUpdateUserProfile()
    const { mutateAsync: createStudent } = useCreateStudent()
    const { mutateAsync: updateStudent } = useUpdateStudent()

    const buildUserProfileUpdateData = useCallback(
        (output: PutUserProfile, fileName?: string) => {
            const userType = output.trainingObjectTypeId
                ? getUserTypeFromTrainingObjectType(output.trainingObjectTypeId)
                : 'CIVILIAN_STUDENT'

            return {
                avatar: fileName || undefined,
                userType: userType as $Enums.UserType,
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
            }
        },
        [getUserTypeFromTrainingObjectType]
    )

    const buildStudentUpdateData = useCallback((output: PutUserProfile) => {
        return {
            code: output.code,
            trainingObjectTypeId: output.trainingObjectTypeId,
            fixedClassId: output.fixedClassId,
            registrationAreaId: output.registrationAreaId,
            curriculumVersionId: output.curriculumVersionId,
            status: output.status,
            ...(output.priorityObjectId && {
                priorityObject: {
                    set: [{ id: output.priorityObjectId }],
                },
            }),
        }
    }, [])

    const buildStudentCreateData = useCallback(
        (output: PutUserProfile, userProfileId: string) => {
            return {
                code: output.code,
                userProfileId: userProfileId,
                trainingObjectTypeId: output.trainingObjectTypeId,
                fixedClassId: output.fixedClassId,
                registrationAreaId: output.registrationAreaId,
                curriculumVersionId: output.curriculumVersionId,
                status: output.status || 'ENROLLED',
                ...(output.priorityObjectId && {
                    priorityObject: {
                        connect: [{ id: output.priorityObjectId }],
                    },
                }),
            }
        },
        []
    )

    async function onOk(output?: PutUserProfile) {
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

            const userProfileUpdateData = buildUserProfileUpdateData(
                output,
                fileName ?? undefined
            )
            const studentUpdateData = buildStudentUpdateData(output)

            if (id && studentData) {
                // UPDATE MODE
                const promises = []

                // Cập nhật UserProfile nếu có
                if (studentData.userProfileId) {
                    promises.push(
                        updateUserProfile({
                            data: userProfileUpdateData,
                            where: { id: studentData.userProfileId },
                        })
                    )
                }

                // Cập nhật Student
                promises.push(
                    updateStudent({
                        data: studentUpdateData,
                        where: { id },
                    })
                )

                await Promise.all(promises)
                message.success('Cập nhật sinh viên thành công')
            } else {
                // CREATE MODE
                if (foundProfile?.id) {
                    // Có profile existing
                    if (foundProfile.educationAndTraining.length > 0) {
                        // Profile đã có student -> Update existing student
                        const promises = [
                            updateStudent({
                                data: studentUpdateData,
                                where: {
                                    id: foundProfile.educationAndTraining[0].id,
                                },
                            }),
                            updateUserProfile({
                                data: userProfileUpdateData,
                                where: { id: foundProfile.id },
                            }),
                        ]

                        await Promise.all(promises)
                        message.success('Cập nhật sinh viên thành công')
                    } else {
                        // Profile chưa có student -> Tạo student mới cho profile existing
                        const studentCreateData = buildStudentCreateData(
                            output,
                            foundProfile.id
                        )

                        const promises = [
                            createStudent({ data: studentCreateData }),
                            updateUserProfile({
                                data: userProfileUpdateData,
                                where: { id: foundProfile.id },
                            }),
                        ]

                        await Promise.all(promises)
                        message.success('Thêm sinh viên thành công')
                    }
                } else {
                    // Tạo mới hoàn toàn
                    const userProfile = await createUserProfile({
                        data: userProfileUpdateData,
                    })

                    if (userProfile) {
                        const studentCreateData = buildStudentCreateData(
                            output,
                            userProfile.id
                        )
                        await createStudent({ data: studentCreateData })
                    }

                    message.success('Thêm sinh viên thành công')
                }
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

    // Thêm useMemo và watch fields
    const selectedTrainingCourseId = Form.useWatch('trainingCourseId', form)
    const selectedCurriculumVersionId = Form.useWatch(
        'curriculumVersionId',
        form
    )

    const filteredFixedClasses = useMemo(() => {
        if (!selectedTrainingCourseId && !selectedCurriculumVersionId) {
            return fixedClassData
        }

        return fixedClassData.filter((cls) => {
            const matchesCourse =
                !selectedTrainingCourseId ||
                cls.trainingCourseId === selectedTrainingCourseId
            const matchesCurriculum =
                !selectedCurriculumVersionId ||
                cls.curriculumVersionId === selectedCurriculumVersionId
            return matchesCourse && matchesCurriculum
        })
    }, [fixedClassData, selectedTrainingCourseId, selectedCurriculumVersionId])

    // Lọc khóa học dựa trên chương trình đào tạo đã chọn
    const filteredTrainingCourses = useMemo(() => {
        if (!selectedCurriculumVersionId) {
            return trainingCourseData
        }

        // Lấy danh sách khóa học có chứa chương trình đào tạo đã chọn
        const coursesWithCurriculum = fixedClassData
            .filter(
                (cls) => cls.curriculumVersionId === selectedCurriculumVersionId
            )
            .map((cls) => cls.trainingCourseId)
            .filter(
                (courseId, index, array) => array.indexOf(courseId) === index
            ) // Remove duplicates

        return trainingCourseData.filter((course) =>
            coursesWithCurriculum.includes(course.id)
        )
    }, [trainingCourseData, fixedClassData, selectedCurriculumVersionId])

    // Cập nhật handleFixedClassChange hoàn chỉnh
    const handleFixedClassChange = (classId: string) => {
        const selectedClass = fixedClassData.find((cls) => cls.id === classId)

        if (selectedClass?.trainingCourseId) {
            const newCourse = selectedClass.trainingCourseId

            // Tự động set khóa học tương ứng với lớp
            form.setFieldValue('trainingCourseId', newCourse)
        }

        // SỬA: Tự động set phiên bản chương trình đào tạo
        if (selectedClass?.curriculumVersionId) {
            const newCurriculum = selectedClass.curriculumVersionId

            form.setFieldValue('curriculumVersionId', newCurriculum)
        }
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
                priorityObjectId: studentData.priorityObject[0]?.id,
                status: studentData.status,
                curriculumVersionId:
                    studentData.curriculumVersionId ?? undefined,

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
        if (idCardNumberData.length > 0) {
            const options = idCardNumberData
                .filter((profile) => profile.idCardNumber) // Lọc những record có CCCD
                .map((profile) => {
                    // Tạo full name từ lastName + firstName
                    const fullName =
                        `${profile.lastName || ''} ${profile.firstName || ''}`.trim()

                    // Tạo label: "Họ tên - Số CCCD"
                    const label = fullName
                        ? `${fullName} - ${profile.idCardNumber}`
                        : profile.idCardNumber // Fallback nếu không có tên

                    return {
                        value: profile.idCardNumber,
                        label: label,
                        searchText:
                            `${fullName} ${profile.idCardNumber}`.toLowerCase(),
                    }
                })
            setIdCardOptions(options)
        }
    }, [idCardNumberData])

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

    const fillProfileData = useCallback(
        (profile: ProfileWithRelations) => {
            // Set thông tin UserProfile
            form.setFieldsValue({
                firstName: profile.firstName,
                lastName: profile.lastName,
                dateOfBirth: profile.dateOfBirth
                    ? dayjs(profile.dateOfBirth)
                    : null,
                placeOfBirth: profile.placeOfBirth,
                homeTown: profile.homeTown,
                idCardNumber: profile.idCardNumber,
                idCardDate: profile.idCardDate
                    ? dayjs(profile.idCardDate)
                    : null,
                officerNumber: profile.officerNumber,
                gender: profile.gender,
                permanentAddress: profile.permanentAddress,
                temporaryAddress: profile.temporaryAddress,
                contactAddress: profile.contactAddress,
                phoneNumber: profile.phoneNumber,
                email: profile.email,
                familyPhone: profile.familyPhone,
                familyName: profile.familyName,
                unionDate: profile.unionDate ? dayjs(profile.unionDate) : null,
                unionPlace: profile.unionPlace,
                CPVJoinDate: profile.CPVJoinDate
                    ? dayjs(profile.CPVJoinDate)
                    : null,
                officialCPVDate: profile.officialCPVDate
                    ? dayjs(profile.officialCPVDate)
                    : null,
                CPVJoinPlace: profile.CPVJoinPlace,
                tenureDate: profile.tenureDate
                    ? dayjs(profile.tenureDate)
                    : null,
                enlistmentDate: profile.enlistmentDate
                    ? dayjs(profile.enlistmentDate)
                    : null,
                dischargeDate: profile.dischargeDate
                    ? dayjs(profile.dischargeDate)
                    : null,
                nationalityId: profile.nationality?.id,
                religionId: profile.religion?.id,
                ethnicityId: profile.ethnicity?.id,
                rankId: profile.rank?.id,
                levelId: profile.level?.id,
                academicDegreeTypeId: profile.academicDegreeType?.id,
                academicRankTypeId: profile.academicRankType?.id,
            })

            // Set thông tin Student nếu có
            if (profile.educationAndTraining.length > 0) {
                const student = profile.educationAndTraining[0]
                form.setFieldsValue({
                    code: student.code || '',
                    trainingObjectTypeId:
                        student.trainingObjectTypeId ?? undefined,
                    fixedClassId: student.fixedClassId ?? undefined,
                    registrationAreaId: student.registrationAreaId ?? undefined,
                    curriculumVersionId:
                        student.curriculumVersionId ?? undefined,
                    status: student.status,
                    priorityObjectId: student.priorityObject?.[0]?.id,
                    trainingCourseId:
                        student.fixedClass?.trainingCourse?.id ??
                        fixedClassData.find(
                            (cls) => cls.id === student.fixedClassId
                        )?.trainingCourseId ??
                        undefined,
                })
            }

            // Set avatar
            if (profile.avatar) {
                setAvatar([
                    {
                        uid: '-1',
                        name: 'avatar.png',
                        status: 'done',
                        url: getMinioUrl(profile.avatar),
                    },
                ])
            }

            setFoundProfile(profile)
        },
        [form, fixedClassData]
    )

    useEffect(() => {
        if (existingProfiles && !id && searchIdCard) {
            const profile = existingProfiles[0]

            if (profile) {
                fillProfileData(profile as ProfileWithRelations)
            } else {
                setFoundProfile(null)
            }
        }
    }, [existingProfiles, id, fillProfileData, searchIdCard])

    const debouncedSearch = useMemo(
        () =>
            _.debounce((value: string) => {
                if (value && !id) {
                    setSearchIdCard(value)
                } else {
                    setSearchIdCard('')
                }
            }, 500),
        [id]
    )

    // SỬA: Cleanup debounce khi component unmount
    useEffect(() => {
        return () => {
            debouncedSearch.cancel()
        }
    }, [debouncedSearch])

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
                    ? 'Chỉnh sửa sinh viên/ học viên'
                    : 'Thêm sinh viên/ học viên'
            }
            className="w-[90vw]"
            layout="vertical"
            // labelCol={{ span: 8 }} // label chiếm 6 cột (trên 24)
            // wrapperCol={{ span: 16 }} // input chiếm 18 cột
        >
            <Col span={24}>
                <SidebarMenu
                    tabs={tabs}
                    activeKey={activeKey}
                    setActiveKey={setActiveKey}
                />
            </Col>

            <Col span={24}>
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
