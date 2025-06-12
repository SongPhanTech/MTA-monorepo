import { queryClient } from '@api/index'
import { fetchGeneratePresignedUrl } from '@api/model/modelComponents'
import DatePicker from '@components/commons/date-picker'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import { GENDER_LIST } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import {
    type UserProfile,
    type Nationality,
    type Religion,
    type Ethnicity,
    $Enums,
    type Rank,
    type Level,
    type AcademicDegreeType,
    type AcademicRankType,
    type Lecturer,
    type Prisma,
    type Organization,
    type LecturerType,
} from '@workspace/db'
import {
    useFindManyUserProfile,
    useUpdateUserProfile,
    useFindManyReligion,
    useFindManyEthnicity,
    useFindManyOrganization,
    useFindManyNationality,
    useFindManyRank,
    useFindManyLevel,
    useFindManyAcademicDegreeType,
    useFindManyAcademicRankType,
    useFindUniqueLecturer,
    useUpdateLecturer,
    useCreateLecturer,
    useFindManyLecturerType,
    useFindManyLecturer,
    useCreateUserProfile,
} from '@workspace/db/hooks'
import type { GetProp, UploadFile, UploadProps } from 'antd'
import {
    AutoComplete,
    Col,
    Collapse,
    Form,
    Input,
    Row,
    Tabs,
    TreeSelect,
    Upload,
    message,
} from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
// import { PutOrganizationUserProps } from './put-organization-user'
import { buildOrgTree } from '@lib/utils'
import { getMinioUrl } from '@workspace/constant'
import _ from 'lodash'

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0]

const { TabPane } = Tabs
const { Panel } = Collapse
dayjs.locale('vi')
// export type PutUserProfile = UserProfile;
export type PutUserProfile = UserProfile & {
    file: FileType
    organizationId?: string
    lecturerTypeId?: string
}
export interface PutUserProfileLectureProps {
    id: string | null
}

type ProfileWithRelations = UserProfile & {
    nationality?: Nationality | null
    religion?: Religion | null
    ethnicity?: Ethnicity | null
    rank?: Rank | null
    level?: Level | null
    academicDegreeType?: AcademicDegreeType | null
    academicRankType?: AcademicRankType | null
    lecturer?:
        | (Lecturer & {
              organization?: Organization | null
              lecturerType?: LecturerType | null
          })
        | null
}

const PutUserProfileLectureModal = () => {
    const [form] = Form.useForm<PutUserProfile>()
    const { isOpen, onClose, input } =
        useDisclosure<PutUserProfileLectureProps>({
            tag: PutUserProfileLectureModal.name,
            onClose: form.resetFields,
        })

    // const {
    //     onOpen: onOpenModalOganizationUser,
    //     onClose: onCloseModalOganizationUser,
    // } = useDisclosure<PutOrganizationUserProps>({
    //     tag: PutOrganizationUser.name,
    // })

    const { id } = input ?? { id: null }
    const { showSpinner, hideSpinner } = useSpinner()

    const [searchIdCard, setSearchIdCard] = useState<string>('')
    const [foundProfile, setFoundProfile] =
        useState<ProfileWithRelations | null>(null)
    const [idCardOptions, setIdCardOptions] = useState<
        { value: string; label: string }[]
    >([])

    const { data: nationalityData = [], refetch: refetchNa } =
        useFindManyNationality()

    const { data: religionData = [], refetch: refetchReli } =
        useFindManyReligion()

    const { data: ethnicityData = [], refetch: refetchEth } =
        useFindManyEthnicity()

    const { data: rankData = [] } = useFindManyRank()
    const { data: levelData = [] } = useFindManyLevel()
    const { data: academicDegreeTypeData = [] } =
        useFindManyAcademicDegreeType()
    const { data: academicRankTypeData = [] } = useFindManyAcademicRankType()
    const { data: lecturerTypeData = [] } = useFindManyLecturerType()

    const { data: lecturerData } = useFindUniqueLecturer({
        where: {
            id: id ?? undefined,
        },
        include: {
            userProfile: {
                include: {
                    academicDegreeType: true,
                    academicRankType: true,
                    rank: true,
                    nationality: true,
                    religion: true,
                    ethnicity: true,
                    level: true,
                },
            },
            organization: true,
            lecturerType: true,
        },
    })

    const { data: idCardNumberData = [] } = useFindManyUserProfile({
        select: {
            idCardNumber: true,
            userType: true,
            lastName: true,
            firstName: true,
        },
        where: {
            userType: {
                in: ['LECTURER'],
            },
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
            lecturer: {
                include: {
                    organization: true,
                    lecturerType: true,
                },
            },
        },
    })

    useEffect(() => {
        if (idCardNumberData.length > 0) {
            const options = idCardNumberData
                .filter((profile) => profile.idCardNumber) // Lọc những record có CCCD
                .map((profile) => ({
                    value: profile.idCardNumber,
                    label: profile.idCardNumber,
                }))
            setIdCardOptions(options)
        }
    }, [idCardNumberData])

    const debouncedSearch = useMemo(
        () =>
            _.debounce((value: string) => {
                if (value && !id) {
                    setSearchIdCard(value)
                } else {
                    setSearchIdCard('')
                    setFoundProfile(null)
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

    // const {
    //     data: organizationUserData = [],
    //     refetch: refetchOrganizationUser,
    // } = useFindManyOrganizationUser({
    //     where: {
    //         userProfileId: id || undefined,
    //     },
    // })
    const { data: manageOrgData = [], refetch: refetchManageOrg } =
        useFindManyOrganization()

    const treeData = buildOrgTree(manageOrgData)

    // SỬA: Thêm fillProfileData function
    const fillProfileData = useCallback(
        (
            profile: UserProfile & {
                nationality?: Nationality | null
                religion?: Religion | null
                ethnicity?: Ethnicity | null
                rank?: Rank | null
                level?: Level | null
                academicDegreeType?: AcademicDegreeType | null
                academicRankType?: AcademicRankType | null
                lecturer?: Lecturer | null
            }
        ) => {
            form.setFieldsValue({
                // Thông tin cơ bản từ UserProfile
                firstName: profile.firstName,
                lastName: profile.lastName,
                code: profile.code || '',
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

                // Thông tin Đoàn/Đảng
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

                // Relations
                nationalityId: profile.nationality?.id,
                religionId: profile.religion?.id,
                ethnicityId: profile.ethnicity?.id,
                rankId: profile.rank?.id,
                levelId: profile.level?.id,
                academicDegreeTypeId: profile.academicDegreeType?.id,
                academicRankTypeId: profile.academicRankType?.id,

                // Dates for history
                rankDate: profile.rankDate ? dayjs(profile.rankDate) : null,
                academicRankDate: profile.academicRankDate
                    ? dayjs(profile.academicRankDate)
                    : null,
                academicDegreeDate: profile.academicDegreeDate
                    ? dayjs(profile.academicDegreeDate)
                    : null,

                // ✅ Thông tin lecturer nếu có
                ...(profile.lecturer && {
                    organizationId: profile.lecturer.organizationId,
                    lecturerTypeId: profile.lecturer.lecturerTypeId,
                }),
            })

            // Set avatar nếu có
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
        [form]
    )

    // SỬA: Thêm useEffect để auto-fill
    useEffect(() => {
        if (existingProfiles && !id && searchIdCard) {
            const profile = existingProfiles[0]

            if (profile) {
                fillProfileData(profile)
            } else {
                setFoundProfile(null)
            }
        }
    }, [existingProfiles, id, fillProfileData, searchIdCard])

    const { mutateAsync: updateLecturer } = useUpdateLecturer()
    const { mutateAsync: createLecturer } = useCreateLecturer()
    const { mutateAsync: updateUserProfile } = useUpdateUserProfile()
    const { mutateAsync: createUserProfile } = useCreateUserProfile()

    const buildUserProfileUpdateData = useCallback(
        (
            output: PutUserProfile,
            fileName?: string
        ): Prisma.UserProfileUpdateInput => {
            return {
                code: output.code,
                avatar: fileName,
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
                familyPhone: output.familyPhone,
                familyName: output.familyName,
                unionDate: output.unionDate,
                unionPlace: output.unionPlace,
                CPVJoinDate: output.CPVJoinDate,
                officialCPVDate: output.officialCPVDate,
                CPVJoinPlace: output.CPVJoinPlace,
                tenureDate: output.tenureDate,
                enlistmentDate: output.enlistmentDate,
                dischargeDate: output.dischargeDate,
                rankDate: output.rankDate,
                academicRankDate: output.academicRankDate,
                academicDegreeDate: output.academicDegreeDate,
                userType: $Enums.UserType.LECTURER,
                // Relations - chỉ set khi có giá trị
                ...(output.nationalityId && {
                    nationality: { connect: { id: output.nationalityId } },
                }),
                ...(output.religionId && {
                    religion: { connect: { id: output.religionId } },
                }),
                ...(output.ethnicityId && {
                    ethnicity: { connect: { id: output.ethnicityId } },
                }),
                ...(output.rankId && {
                    rank: { connect: { id: output.rankId } },
                }),
                ...(output.levelId && {
                    level: { connect: { id: output.levelId } },
                }),
                ...(output.academicDegreeTypeId && {
                    academicDegreeType: {
                        connect: { id: output.academicDegreeTypeId },
                    },
                }),
                ...(output.academicRankTypeId && {
                    academicRankType: {
                        connect: { id: output.academicRankTypeId },
                    },
                }),
            }
        },
        []
    )

    const buildLecturerUpdateData = useCallback(
        (output: PutUserProfile): Prisma.LecturerUpdateInput => {
            return {
                code: output.code,
                ...(output.organizationId && {
                    organization: { connect: { id: output.organizationId } },
                }),
                ...(output.lecturerTypeId && {
                    lecturerType: { connect: { id: output.lecturerTypeId } },
                }),
            }
        },
        []
    )

    const buildLecturerCreateData = useCallback(
        (
            output: PutUserProfile,
            userProfileId: string
        ): Prisma.LecturerCreateInput => {
            return {
                code: output.code,
                userProfile: { connect: { id: userProfileId } },
                organization: { connect: { id: output.organizationId } },
                lecturerType: { connect: { id: output.lecturerTypeId } },
            }
        },
        []
    )

    const buildUserProfileCreateData = useCallback(
        (
            output: PutUserProfile,
            fileName?: string
        ): Prisma.UserProfileCreateInput => {
            return {
                code: output.code ?? undefined,
                avatar: fileName ?? undefined,
                firstName: output.firstName,
                lastName: output.lastName,
                dateOfBirth: output.dateOfBirth,
                placeOfBirth: output.placeOfBirth ?? undefined,
                homeTown: output.homeTown ?? undefined,
                idCardNumber: output.idCardNumber ?? undefined,
                idCardDate: output.idCardDate,
                officerNumber: output.officerNumber ?? undefined,
                gender: output.gender,
                permanentAddress: output.permanentAddress ?? undefined,
                temporaryAddress: output.temporaryAddress ?? undefined,
                contactAddress: output.contactAddress ?? undefined,
                phoneNumber: output.phoneNumber ?? undefined,
                email: output.email ?? undefined,
                familyPhone: output.familyPhone ?? undefined,
                familyName: output.familyName ?? undefined,
                unionDate: output.unionDate,
                unionPlace: output.unionPlace ?? undefined,
                CPVJoinDate: output.CPVJoinDate,
                officialCPVDate: output.officialCPVDate,
                CPVJoinPlace: output.CPVJoinPlace ?? undefined,
                tenureDate: output.tenureDate,
                enlistmentDate: output.enlistmentDate,
                dischargeDate: output.dischargeDate,
                rankDate: output.rankDate,
                academicRankDate: output.academicRankDate,
                academicDegreeDate: output.academicDegreeDate,
                userType: $Enums.UserType.LECTURER,
                // Relations - chỉ connect khi có giá trị
                ...(output.nationalityId && {
                    nationality: { connect: { id: output.nationalityId } },
                }),
                ...(output.religionId && {
                    religion: { connect: { id: output.religionId } },
                }),
                ...(output.ethnicityId && {
                    ethnicity: { connect: { id: output.ethnicityId } },
                }),
                ...(output.rankId && {
                    rank: { connect: { id: output.rankId } },
                }),
                ...(output.levelId && {
                    level: { connect: { id: output.levelId } },
                }),
                ...(output.academicDegreeTypeId && {
                    academicDegreeType: {
                        connect: { id: output.academicDegreeTypeId },
                    },
                }),
                ...(output.academicRankTypeId && {
                    academicRankType: {
                        connect: { id: output.academicRankTypeId },
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
            fileName = resPresignedUrl.fileName
        }
        try {
            showSpinner()

            // Sử dụng các hàm build đã có sẵn
            const userProfileData = buildUserProfileUpdateData(
                output,
                fileName ?? undefined
            )
            const lecturerUpdateData = buildLecturerUpdateData(output)

            if (id && lecturerData) {
                // UPDATE MODE - Cập nhật lecturer và userProfile
                const promises = []

                // Cập nhật UserProfile nếu có
                if (lecturerData.userProfile?.id) {
                    promises.push(
                        updateUserProfile({
                            data: userProfileData,
                            where: { id: lecturerData.userProfile.id },
                        })
                    )
                }

                // Cập nhật Lecturer
                promises.push(
                    updateLecturer({
                        data: lecturerUpdateData,
                        where: { id },
                    })
                )

                await Promise.all(promises)
                message.success('Cập nhật giảng viên thành công')
            } else {
                // CREATE MODE
                if (foundProfile?.id) {
                    // Profile đã tồn tại
                    if (foundProfile.lecturer?.id) {
                        // Profile đã có lecturer -> Update cả 2
                        const promises = [
                            updateLecturer({
                                data: lecturerUpdateData,
                                where: { id: foundProfile.lecturer.id },
                            }),
                            updateUserProfile({
                                data: userProfileData,
                                where: { id: foundProfile.id },
                            }),
                        ]

                        await Promise.all(promises)
                        message.success('Cập nhật giảng viên thành công')
                    } else {
                        // Profile chưa có lecturer -> Tạo lecturer mới và update profile
                        const lecturerCreateData = buildLecturerCreateData(
                            output,
                            foundProfile.id
                        )

                        const promises = [
                            createLecturer({ data: lecturerCreateData }),
                            updateUserProfile({
                                data: userProfileData,
                                where: { id: foundProfile.id },
                            }),
                        ]

                        await Promise.all(promises)
                        message.success('Thêm giảng viên thành công')
                    }
                } else {
                    // Tạo mới hoàn toàn - sử dụng CreateInput thay vì UpdateInput
                    const userProfileCreateData = buildUserProfileCreateData(
                        output,
                        fileName ?? undefined
                    )

                    const userProfile = await createUserProfile({
                        data: userProfileCreateData,
                    })

                    if (
                        userProfile &&
                        output.organizationId &&
                        output.lecturerTypeId
                    ) {
                        const lecturerCreateData = buildLecturerCreateData(
                            output,
                            userProfile.id
                        )
                        await createLecturer({ data: lecturerCreateData })
                    }

                    message.success('Thêm mới giảng viên thành công')
                }
            }

            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['Lecturer'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    // const difference = (
    //     object: Record<PropertyKey, unknown>,
    //     base: Record<PropertyKey, unknown>
    // ) => _.pickBy(object, (v, k) => !_.isEqual(base[k], v))

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    // SỬA: Cập nhật useEffect để fill đầy đủ các trường
    useEffect(() => {
        if (lecturerData?.userProfile && id) {
            const userProfile = lecturerData.userProfile
            const lecturer = lecturerData

            const formData = {
                // Thông tin từ Lecturer
                code: lecturer.code || userProfile.code,
                organizationId: lecturer.organizationId,
                lecturerTypeId: lecturer.lecturerTypeId,

                // Thông tin cơ bản từ UserProfile
                firstName: userProfile.firstName,
                lastName: userProfile.lastName,
                dateOfBirth: userProfile.dateOfBirth
                    ? dayjs(userProfile.dateOfBirth)
                    : null,
                placeOfBirth: userProfile.placeOfBirth,
                avatar: userProfile.avatar,
                homeTown: userProfile.homeTown,
                idCardNumber: userProfile.idCardNumber,
                idCardDate: userProfile.idCardDate
                    ? dayjs(userProfile.idCardDate)
                    : null,
                officerNumber: userProfile.officerNumber,
                gender: userProfile.gender,
                permanentAddress: userProfile.permanentAddress,
                temporaryAddress: userProfile.temporaryAddress,
                contactAddress: userProfile.contactAddress,
                phoneNumber: userProfile.phoneNumber,
                email: userProfile.email,
                familyPhone: userProfile.familyPhone,
                familyName: userProfile.familyName,

                // Thông tin Đoàn/Đảng/Nhập ngũ
                unionDate: userProfile.unionDate
                    ? dayjs(userProfile.unionDate)
                    : null,
                unionPlace: userProfile.unionPlace,
                CPVJoinDate: userProfile.CPVJoinDate
                    ? dayjs(userProfile.CPVJoinDate)
                    : null,
                officialCPVDate: userProfile.officialCPVDate
                    ? dayjs(userProfile.officialCPVDate)
                    : null,
                CPVJoinPlace: userProfile.CPVJoinPlace,
                tenureDate: userProfile.tenureDate
                    ? dayjs(userProfile.tenureDate)
                    : null,
                enlistmentDate: userProfile.enlistmentDate
                    ? dayjs(userProfile.enlistmentDate)
                    : null,
                dischargeDate: userProfile.dischargeDate
                    ? dayjs(userProfile.dischargeDate)
                    : null,

                // Relations IDs
                nationalityId: userProfile.nationality?.id,
                religionId: userProfile.religion?.id,
                ethnicityId: userProfile.ethnicity?.id,
                rankId: userProfile.rank?.id,
                levelId: userProfile.level?.id,
                academicDegreeTypeId: userProfile.academicDegreeType?.id,
                academicRankTypeId: userProfile.academicRankType?.id,

                // Lịch sử - Dates
                rankDate: userProfile.rankDate
                    ? dayjs(userProfile.rankDate)
                    : null,
                academicRankDate: userProfile.academicRankDate
                    ? dayjs(userProfile.academicRankDate)
                    : null,
                academicDegreeDate: userProfile.academicDegreeDate
                    ? dayjs(userProfile.academicDegreeDate)
                    : null,
            }

            form.setFieldsValue(formData)

            if (userProfile.avatar) {
                setAvatar([
                    {
                        uid: '-1',
                        name: 'avatar.png',
                        status: 'done',
                        url: getMinioUrl(userProfile.avatar),
                    },
                ])
            }
        }
    }, [lecturerData, form, id])

    //upload file
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
            title={id ? 'Chỉnh sửa giảng viên' : 'Thêm mới giảng viên'}
            className="w-[80vw]"
            layout="vertical"
            // labelCol={{ span: 8 }} // label chiếm 6 cột (trên 24)
            // wrapperCol={{ span: 16 }} // input chiếm 18 cột
        >
            <Tabs className="w-full" defaultActiveKey="1">
                <TabPane tab="Thông tin cá nhân" key="1" id="info-block">
                    <Collapse defaultActiveKey={['1']} accordion>
                        <Panel header="Thông tin cá nhân" key="1">
                            <Row gutter={[10, 20]}>
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
                                                label="Mã giảng viên"
                                                rules={[
                                                    {
                                                        required: true,
                                                        message:
                                                            'Vui lòng nhập mã giảng viên!',
                                                    },
                                                ]}
                                                className="mb-0"
                                            >
                                                <Input placeholder="Nhập mã giảng viên" />
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

                                <Col span={24}>
                                    <Row gutter={[10, 10]}>
                                        <Col span={8}>
                                            <FormItem
                                                form={form}
                                                name="organizationId"
                                                label="Đơn vị"
                                                required={!id} // Required khi create
                                                className="mb-0"
                                            >
                                                <TreeSelect
                                                    placeholder="Chọn đơn vị"
                                                    treeData={treeData}
                                                    allowClear
                                                />
                                            </FormItem>
                                        </Col>
                                        <Col span={8}>
                                            <FormItem
                                                form={form}
                                                name="lecturerTypeId"
                                                label="Loại giảng viên"
                                                required={!id} // Required khi create
                                                className="mb-0"
                                            >
                                                <Select
                                                    placeholder="Chọn loại giảng viên"
                                                    options={lecturerTypeData.map(
                                                        (i) => ({
                                                            value: i.id,
                                                            label: i.name,
                                                        })
                                                    )}
                                                />
                                            </FormItem>
                                        </Col>
                                        <Col span={8}>
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
                                                        date >
                                                            dayjs().endOf('day')
                                                    }
                                                />
                                            </FormItem>
                                        </Col>
                                        <Col span={8}>
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
                                        <Col span={8}>
                                            <FormItem
                                                form={form}
                                                name="homeTown"
                                                label="Quê quán"
                                                className="mb-0"
                                            >
                                                <Input placeholder="Nhập quê quán" />
                                            </FormItem>
                                        </Col>
                                        <Col span={8}>
                                            <FormItem
                                                form={form}
                                                name="placeOfBirth"
                                                label="Nơi sinh"
                                                className="mb-0"
                                            >
                                                <Input placeholder="Nhập nơi sinh" />
                                            </FormItem>
                                        </Col>
                                        <Col span={8}>
                                            <FormItem
                                                form={form}
                                                name="officerNumber"
                                                label="Số hiệu sĩ quan"
                                                className="mb-0"
                                            >
                                                <Input placeholder="Nhập số hiệu sĩ quan" />
                                            </FormItem>
                                        </Col>

                                        <Col span={8}>
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
                                                        (i) => {
                                                            return {
                                                                value: i.id,
                                                                label: i.name,
                                                            }
                                                        }
                                                    )}
                                                />
                                            </FormItem>
                                        </Col>
                                        <Col span={8}>
                                            <FormItem
                                                form={form}
                                                name="permanentAddress"
                                                label="Địa chỉ thường trú"
                                                className="mb-0"
                                            >
                                                <Input placeholder="Nhập địa chỉ thường trú" />
                                            </FormItem>
                                        </Col>
                                        <Col span={8}>
                                            <FormItem
                                                form={form}
                                                name="temporaryAddress"
                                                label="Địa chỉ tạm trú"
                                                className="mb-0"
                                            >
                                                <Input placeholder="Nhập địa chỉ tạm trú" />
                                            </FormItem>
                                        </Col>
                                        <Col span={8}>
                                            <FormItem
                                                form={form}
                                                name="contactAddress"
                                                label="Địa chỉ liên lạc"
                                                className="mb-0"
                                            >
                                                <Input placeholder="Nhập địa chỉ liên lạc" />
                                            </FormItem>
                                        </Col>
                                        <Col span={8}>
                                            <FormItem
                                                form={form}
                                                name="phoneNumber"
                                                label="Số điện thoại"
                                                className="mb-0"
                                            >
                                                <Input placeholder="Nhập số điện thoại" />
                                            </FormItem>
                                        </Col>
                                        <Col span={8}>
                                            <FormItem
                                                form={form}
                                                name="email"
                                                label="Thư điện tử"
                                                className="mb-0"
                                            >
                                                <Input placeholder="Nhập thư điện tử" />
                                            </FormItem>
                                        </Col>

                                        <Col span={8}>
                                            <FormItem
                                                form={form}
                                                name="nationalityId"
                                                label="Quốc tịch"
                                                className="mb-0"
                                                normalize={(value) =>
                                                    value === undefined
                                                        ? null
                                                        : value
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
                                        <Col span={8}>
                                            <FormItem
                                                form={form}
                                                name="religionId"
                                                label="Tôn giáo"
                                                className="mb-0"
                                                normalize={(value) =>
                                                    value === undefined
                                                        ? null
                                                        : value
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
                                        <Col span={8}>
                                            <FormItem
                                                form={form}
                                                name="ethnicityId"
                                                label="Dân tộc"
                                                className="mb-0"
                                                normalize={(value) =>
                                                    value === undefined
                                                        ? null
                                                        : value
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
                                name="rankDate"
                                label="Năm cấp bậc hàm"
                                className="mb-0"
                            >
                                <DatePicker
                                    format="DD/MM/YYYY"
                                    className="w-full"
                                    disabledDate={(date) =>
                                        date && date > dayjs().endOf('day')
                                    }
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
                                name="academicRankDate"
                                label="Năm học hàm"
                                className="mb-0"
                            >
                                <DatePicker
                                    format="DD/MM/YYYY"
                                    className="w-full"
                                    disabledDate={(date) =>
                                        date && date > dayjs().endOf('day')
                                    }
                                />
                            </FormItem>
                        </Col>
                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="academicRankTypeId"
                                label="Học vị"
                                className="mb-0"
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

                        <Col span={12}>
                            <FormItem
                                form={form}
                                name="academicDegreeDate"
                                label="Năm học vị"
                                className="mb-0"
                            >
                                <DatePicker
                                    format="DD/MM/YYYY"
                                    className="w-full"
                                    disabledDate={(date) =>
                                        date && date > dayjs().endOf('day')
                                    }
                                />
                            </FormItem>
                        </Col>
                        {/* <Col span={12}>
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
                                name="positionName"
                                label="Năm chức vụ"
                                className="mb-0"
                            >
                                <Input placeholder="Nhập năm chức vụ" />
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
                        </Col> */}
                    </Row>
                </TabPane>
            </Tabs>
        </PutFormModal>
    )
}

export default PutUserProfileLectureModal
