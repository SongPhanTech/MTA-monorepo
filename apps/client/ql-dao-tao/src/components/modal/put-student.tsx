import { queryClient } from '@api/index'
import { fetchGeneratePresignedUrl } from '@api/model/modelComponents'
import DatePicker from '@components/commons/date-picker'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import { GENDER_LIST, STUDENT_STATUS_OPTIONS } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import { getMinioUrl } from '@workspace/constant'
import type {
    $Enums,
    AcademicDegreeType,
    AcademicRankType,
    CurriculumVersion,
    Ethnicity,
    Level,
    Nationality,
    PriorityObject,
    Rank,
    RegistrationArea,
    Religion,
    Student,
    TrainingCourse,
    TrainingObjectType,
    UserProfile,
} from '@workspace/db'
import {
    useCreateStudent,
    useCreateUserProfile,
    useFindManyAcademicDegreeType,
    useFindManyAcademicRankType,
    useFindManyCurriculumVersion,
    useFindManyEthnicity,
    useFindManyFixedClass,
    useFindManyLevel,
    useFindManyNationality,
    useFindManyPriorityObject,
    useFindManyRank,
    useFindManyRegistrationArea,
    useFindManyReligion,
    useFindManyStudent,
    useFindManyTrainingCourse,
    useFindManyTrainingObjectType,
    useFindManyUserProfile,
    useFindUniqueStudent,
    useFindUniqueUserProfile,
    useUpdateStudent,
    useUpdateUserProfile,
} from '@workspace/db/hooks'
import type { UploadFile, UploadProps } from 'antd'
import {
    AutoComplete,
    Col,
    Collapse,
    Form,
    Input,
    Row,
    Tabs,
    Upload,
    message,
} from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import _ from 'lodash'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
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
        useFindManyFixedClass({
            include: {
                trainingCourse: true,
                curriculumVersion: true,
            },
        })

    const { data: trainingObjectTypeData = [] } =
        useFindManyTrainingObjectType()

    const { data: trainingCourseData = [] } = useFindManyTrainingCourse()

    const { data: rankData = [] } = useFindManyRank()

    const { data: levelData = [] } = useFindManyLevel()

    const { data: academicDegreeTypeData = [] } =
        useFindManyAcademicDegreeType()

    const { data: academicRankTypeData = [] } = useFindManyAcademicRankType()

    const { data: curriculumVersionData = [] } = useFindManyCurriculumVersion()

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
                                            transform: 'scale(1.35)',
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
                                                name="idCardNumber"
                                                label="Số CCCD"
                                                className="mb-0"
                                                required
                                            >
                                                <AutoComplete
                                                    placeholder="Nhập hoặc chọn số CCCD"
                                                    allowClear
                                                    options={idCardOptions}
                                                    filterOption={(
                                                        inputValue,
                                                        option
                                                    ) =>
                                                        option?.value
                                                            .toUpperCase()
                                                            .indexOf(
                                                                inputValue.toUpperCase()
                                                            ) !== -1 ||
                                                        option?.label
                                                            .toUpperCase()
                                                            .indexOf(
                                                                inputValue.toUpperCase()
                                                            ) !== -1
                                                    }
                                                    onSelect={(value) => {
                                                        form.setFieldsValue({
                                                            idCardNumber: value,
                                                        })
                                                        debouncedSearch(value)
                                                    }}
                                                    onChange={(value) => {
                                                        form.setFieldsValue({
                                                            idCardNumber: value,
                                                        })
                                                        debouncedSearch(value)
                                                    }}
                                                />
                                            </FormItem>
                                        </Col>
                                        <Col span={12}>
                                            <FormItem
                                                form={form}
                                                name="code"
                                                label="Mã sinh viên / học viên"
                                                rules={[
                                                    {
                                                        required: true,
                                                        message:
                                                            'Vui lòng nhập mã sinh viên / học viên!',
                                                    },
                                                ]}
                                                className="mb-0"
                                            >
                                                <Input placeholder="Nhập mã sinh viên / học viên" />
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
                                    </Row>
                                </Col>

                                <Col span={12}>
                                    <FormItem
                                        form={form}
                                        name="trainingObjectTypeId"
                                        label="Đối tượng đào tạo"
                                        className="mb-0"
                                        required
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
                                        required
                                    >
                                        <Select
                                            placeholder="Chọn lớp"
                                            optionFilterProp="label"
                                            onChange={handleFixedClassChange}
                                            options={filteredFixedClasses.map(
                                                (value) => ({
                                                    value: value.id,
                                                    label: `${value.code}-${value.name}`,
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
                                            options={filteredTrainingCourses.map(
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
                                        name="curriculumVersionId"
                                        label="Chương trình đào tạo"
                                        className="mb-0"
                                    >
                                        <Select
                                            placeholder={
                                                'Chọn chương trình đào tạo'
                                            }
                                            showSearch
                                            optionFilterProp="label"
                                            options={curriculumVersionData.map(
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
                                        name="status"
                                        label="Trạng thái"
                                        className="mb-0"
                                    >
                                        <Select
                                            placeholder="Chọn trạng thái"
                                            options={STUDENT_STATUS_OPTIONS.map(
                                                (v) => {
                                                    return {
                                                        value: v.value,
                                                        label: v.label,
                                                    }
                                                }
                                            )}
                                        />
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
                                                date > dayjs().endOf('day')
                                            }
                                        />
                                    </FormItem>
                                </Col>

                                <Col span={12}>
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
                                        <Input placeholder="Nhập số hiệu sĩ quan / quân nhân" />
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
