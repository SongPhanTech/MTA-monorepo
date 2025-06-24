import { queryClient } from '@api/index'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import {
    $Enums,
    type Lecturer,
    type Prisma,
    type UserProfile,
} from '@workspace/db'
import {
    useCreateLecturer,
    useCreateUserProfile,
    useFindManyDM_DonVi,
    useFindManyLecturerType,
    useFindManyUserProfile,
    useFindUniqueLecturer,
    useUpdateLecturer,
    useUpdateUserProfile,
} from '@workspace/db/hooks'
import { generatePresignedUrl } from '@workspace/libs/api/model'
import type { GetProp, UploadFile, UploadProps } from 'antd'
import { Col, Collapse, Form, Tabs, message } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
// import { PutOrganizationUserProps } from './put-organization-user'
import { buildOrgTree } from '@lib/utils'
import { getMinioUrl } from '@workspace/constant'
import _ from 'lodash'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import SidebarMenu from './quan-ly-ho-so/sidebar-menu'
import TabQuanLyHoSo from './quan-ly-ho-so/tabs'
import { tabs } from './quan-ly-ho-so/type'

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

const PutUserProfileLectureModal = () => {
    const [form] = Form.useForm<PutUserProfile>()

    const [activeKey, setActiveKey] = useState<string>('1')

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
    // } = useFindManyDM_DonViUser({
    //     where: {
    //         userProfileId: id || undefined,
    //     },
    // })
    const { data: manageOrgData = [], refetch: refetchManageOrg } =
        useFindManyDM_DonVi()

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
                    nationality: { connect: { Id: output.nationalityId } },
                }),
                ...(output.religionId && {
                    religion: { connect: { Id: output.religionId } },
                }),
                ...(output.ethnicityId && {
                    ethnicity: { connect: { Id: output.ethnicityId } },
                }),
                ...(output.rankId && {
                    rank: { connect: { Id: output.rankId } },
                }),
                ...(output.levelId && {
                    level: { connect: { Id: output.levelId } },
                }),
                ...(output.academicDegreeTypeId && {
                    academicDegreeType: {
                        connect: { Id: output.academicDegreeTypeId },
                    },
                }),
                ...(output.academicRankTypeId && {
                    academicRankType: {
                        connect: { Id: output.academicRankTypeId },
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
            fileName = resPresignedUrl.data.fileName
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
                nationalityId: userProfile.nationality?.Id,
                religionId: userProfile.religion?.Id,
                ethnicityId: userProfile.ethnicity?.Id,
                rankId: userProfile.rank?.Id,
                levelId: userProfile.level?.Id,
                academicDegreeTypeId: userProfile.academicDegreeType?.Id,
                academicRankTypeId: userProfile.academicRankType?.Id,

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
                    type="LECTURER"
                    fileList={fileList}
                    setFileList={setFileList}
                />
            </Col>
        </PutFormModal>
    )
}

export default PutUserProfileLectureModal
