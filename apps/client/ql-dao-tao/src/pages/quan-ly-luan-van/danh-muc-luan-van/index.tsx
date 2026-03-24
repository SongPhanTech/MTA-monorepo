import Select from '@components/commons/select'
import Table from '@components/commons/table'
import ApproveIcon from '@components/icons/approve'
import DeleteIcon from '@components/icons/delete'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import { useThesisProjectStatusOptions } from '@hooks/thesisProjectStatus'
import DefaultLayout from '@layouts/default-layout'
import { buildOrgTree } from '@lib/utils'
import {
    CouncilProposalStatus,
    CouncilRole,
    ThesisProjectStatus,
    ThesisType,
} from '@workspace/db/client'
import {
    useCountStudent,
    useCreateStudentThesisRegistration,
    useCreateThesisProject,
    useFindManyDefenseSession,
    useFindManyDM_DonVi,
    useFindManyExpertProfile,
    useFindManyFixedClass,
    useFindManyRoom,
    useFindManyStudent,
    useFindManyThesisSession,
    useFindManyTrainingCourse,
    useUpdateThesisProject,
} from '@workspace/db/hooks'
import { exportFromTemplate, type TableRow } from '@workspace/libs/template-excel'
import { getMinioUrl } from '@workspace/libs/utils'
import { dayjs, useTrainingObjectTypeStore } from '@workspace/ui'
import { Button, Col, DatePicker, Flex, Form, Input, message, Popconfirm, Row, Tag } from 'antd'
import { SquarePen } from 'lucide-react'
import { useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import TreeSelect from '@/components/commons/tree-select'

// import { getMinioUrl } from '@workspace/libs/utils'

// interface thống kê các chuyên gia hướng dẫn
interface ExpertStat {
    expertId: string
    name: string
    sDonvi: string
    stk: string
    tennganhang: string
    GVHD1Student: number
    GVHD2Student: number
    totalPayment: number
}

// interface props cho component PostgraduateProject
export interface PostgraduateProjectProps {
    role?: 'P7' | 'P2'
    isManage?: boolean
}
const { TextArea } = Input

// component PostgraduateProject
export default function PostgraduateProject({
    role = 'P7',
    isManage = false,
}: PostgraduateProjectProps) {
    // dùng cho textarea của antd
    // dùng cho spinner
    const { showSpinner, hideSpinner } = useSpinner()

    // state cho session đang chọn
    const [thesisSessionSelected, setThesisSessionSelected] = useState<any>(null)
    // state cho row keys đang chỉnh sửa
    const [editingRowKeys, setEditingRowKeys] = useState<string[]>([])
    // state cho values đang chỉnh sửa
    const [editingValues, setEditingValues] = useState<Record<string, Record<string, any>>>({})
    // state cho current page
    const [currentPage, setCurrentPage] = useState(1)

    // state cho training course đang chọn
    const [trainingCourseSelected, setTrainingCourseSelected] = useState<string | null>(null)
    // state cho fixed classes đang chọn
    const [fixedClassesSelected, setFixedClassesSelected] = useState<string[]>([])
    // state cho organization đang chọn
    const [organizationSelected, setOrganizationSelected] = useState<string | null>(null)
    // state cho query fixed classes
    const [queryFixedClasses, setQueryFixedClasses] = useState<string[]>([])
    // state cho need all students để lấy tất cả sinh viên trong lớp học
    const [needAllStudents, setNeedAllStudents] = useState<boolean>(false)
    // state cho has clicked fetch để check xem đã click vào button xem kết quả hay chưa
    const [hasClickedFetch, setHasClickedFetch] = useState<boolean>(false)
    // state cho selected row keys để chọn hàng đang chỉnh sửa
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    // hàm xử lý chọn hàng đang chỉnh sửa
    const rowSelection = {
        selectedRowKeys,
        onChange: (newSelectedRowKeys: React.Key[]) => {
            setSelectedRowKeys(newSelectedRowKeys)
        },
    }
    // state cho số lượng trang để phân trang
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    // hàm xử lý batch save
    const handleBatchSave = async () => {
        if (editingRowKeys.length === 0) {
            message.info('Không có hàng nào đang ở chế độ chỉnh sửa để lưu.')
            return
        }
        if (selectedRowKeys.length === 0) {
            message.info('Vui lòng chọn ít nhất một sinh viên để lưu.')
            return
        }

        showSpinner()
        try {
            const updatePromises = selectedRowKeys.map(async (studentId) => {
                const rowData = editingValues[studentId.toString()]

                const studentRecord = students?.find((s) => s.id === studentId)
                const thesisProjectId = studentRecord?.thesisRegistrations?.[0]?.thesisProject?.id

                if (!thesisProjectId || !rowData) return

                const description = `Ngôn ngữ: ${rowData.language} - Luận án/Đề án: ${rowData.type}`
                let status = rowData.status
                if (status === ThesisProjectStatus.PROPOSED && isManage) {
                    status = ThesisProjectStatus.APPROVED_BY_DEPT
                }
                const basePayload = {
                    title: rowData.title,
                    description: description,
                    status: status,
                }
                const supervisorPayload =
                    rowData.supervisor === '' || rowData.supervisor === null
                        ? { supervisor: { disconnect: true } }
                        : {
                              supervisor: {
                                  connect: {
                                      id: rowData.supervisor,
                                  },
                              },
                          }
                const coSupervisorPayload =
                    rowData.coSupervisor === '' || rowData.coSupervisor === null
                        ? { coSupervisor: { disconnect: true } }
                        : {
                              coSupervisor: {
                                  connect: {
                                      id: rowData.coSupervisor,
                                  },
                              },
                          }
                const organizationPayload =
                    rowData.organization === '' || rowData.organization === null
                        ? { organization: { disconnect: true } }
                        : {
                              organization: {
                                  connect: {
                                      Id: rowData.organization,
                                  },
                              },
                          }
                const payload = {
                    ...basePayload,
                    ...supervisorPayload,
                    ...coSupervisorPayload,
                    ...organizationPayload,
                }

                await updateThesisProject({
                    data: payload,
                    where: {
                        id: thesisProjectId,
                    },
                })
                console.log('rowdata', rowData)
            })

            await Promise.all(updatePromises.filter((p) => p !== undefined))

            message.success(`Lưu thành công ${selectedRowKeys.length} hàng đã chỉnh sửa.`)
        } catch (error) {
            message.error('Đã xảy ra lỗi khi lưu hàng loạt, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
            await refetch()
            if (refetchCount) await refetchCount()
        }
        // Reset trạng thái chỉnh sửa
        setSelectedRowKeys([])
        setEditingRowKeys([])
        setEditingValues({})
    }
    // hàm xử lý bật chế edit cho bảng
    const handleActivateEdit = () => {
        if (!students || students.length === 0) {
            message.info('Không có dữ liệu sinh viên để chỉnh sửa.')
            return
        }

        const newEditingRowKeys = students.map((s) => s.id)
        const initialEditingValues: Record<string, Record<string, any>> = {}

        students.forEach((record) => {
            const thesisProject = record?.thesisRegistrations?.[0]?.thesisProject
            if (thesisProject) {
                // Logic để phân tích language và type từ chuỗi description
                const description = thesisProject.description || ''
                const parts = description.split('-')
                const languagePart = parts[0]
                const typePart = parts.length > 1 ? parts[1] : ''

                // Trích xuất giá trị sau ':' và loại bỏ khoảng trắng
                const language = languagePart.split(':')[1]?.trim() || ''
                const type = typePart.split(':')[1]?.trim() || ''

                initialEditingValues[record.id] = {
                    title: thesisProject.title || '',
                    supervisor: thesisProject.supervisor?.id || '',
                    coSupervisor: thesisProject.coSupervisor?.id || '',
                    language: language,
                    type: type,
                    status: thesisProject.status || '',
                    defenseDate: thesisProject.defenseDate || '',
                    defenseSession: thesisProject.defenseSession?.id || '',
                    room: thesisProject.room?.id || '',
                    chairman:
                        thesisProject.council?.members.find(
                            (member) => member.role === CouncilRole.CHAIRMAN
                        )?.expert?.id || '',
                    secretary:
                        thesisProject.council?.members.find(
                            (member) => member.role === CouncilRole.SECRETARY
                        )?.expert?.id || '',
                    reviewer1:
                        thesisProject.council?.members.find(
                            (member) => member.role === CouncilRole.REVIEWER_1
                        )?.expert?.id || '',
                    reviewer2:
                        thesisProject.council?.members.find(
                            (member) => member.role === CouncilRole.REVIEWER_2
                        )?.expert?.id || '',
                    member:
                        thesisProject.council?.members.find(
                            (member) => member.role === CouncilRole.MEMBER
                        )?.expert?.id || '',
                    organization: thesisProject.organization?.Id ?? '',
                }
            }
        })

        setEditingRowKeys(newEditingRowKeys)
        setEditingValues(initialEditingValues)
    }

    // hàm xử lý chọn training object type lấy ra từ store
    const { id: trainingObjectId } = useTrainingObjectTypeStore()
    // hàm xử lý mở modal cau hinh luan van
    const { onOpen: openModalCauHinhLuanVan } = useDisclosure<{
        thesisProjectId: string
        thesisSessionId: string
    }>({
        tag: 'ModalCauHinhLuanVan',
    })
    // hàm xử lý lấy ra danh sách đơn vị
    const { data: sDm_Donvi = [] } = useFindManyDM_DonVi({
        orderBy: [{ iSTT: 'asc' }, { sTen: 'asc' }],
    })
    // hàm xử lý lấy ra danh sách phòng bảo vệ
    const { data: roomData } = useFindManyRoom()
    // hàm xử lý lấy ra danh sách ca bảo vệ
    const { data: defenseSessionData } = useFindManyDefenseSession()

    // hàm xử lý build tree cho danh sách đơn vị
    const treeOrgData = buildOrgTree(sDm_Donvi ?? [], '0')
    // hàm xử lý lấy ra label và color cho trạng thái đồ án
    const { getThesisProjectStatusLabel, getThesisProjectStatusColor } =
        useThesisProjectStatusOptions()
    // hàm xử lý lấy ra danh sách khóa học
    const { data: trainingCourses } = useFindManyTrainingCourse(
        {
            where: {
                id: thesisSessionSelected?.trainingCourseId,
            },
            orderBy: {
                semesterStart: {
                    startDate: 'desc',
                },
            },
        },
        {
            enabled: !!thesisSessionSelected?.trainingCourseId,
        }
    )
    // hàm xử lý lấy ra danh sách lớp học
    const { data: fixedClasses } = useFindManyFixedClass({
        where: {
            trainingCourseId: trainingCourseSelected ?? '',
        },
    })
    const { data: expertProfileData } = useFindManyExpertProfile({
        include: {
            lecturer: {
                include: {
                    userProfile: true,
                },
            },
        },
    })
    // hàm xử lý lấy ra danh sách sinh viên để hiển thị trong bảng
    const { data: students = [], refetch } = useFindManyStudent(
        {
            where: {
                thesisRegistrations: {
                    some: {
                        thesisProject: {
                            thesisSessionId: thesisSessionSelected?.id ?? '',
                            thesisType: ThesisType.THESIS,
                            organizationId: organizationSelected ?? undefined,
                        },
                    },
                },
                fixedClassId: {
                    in:
                        queryFixedClasses.length > 0
                            ? queryFixedClasses
                            : fixedClasses?.map((fixedClass) => fixedClass.id),
                },
            },
            include: {
                userProfile: true,
                fixedClass: {
                    include: {
                        trainingCourse: {
                            include: { trainingObjectType: true },
                        },
                    },
                },
                thesisRegistrations: {
                    where: {
                        thesisProject: {
                            thesisSessionId: thesisSessionSelected?.id ?? '',
                            thesisType: ThesisType.THESIS,
                        },
                    },
                    include: {
                        thesisProject: {
                            include: {
                                council: {
                                    include: { members: { include: { expert: true } } },
                                },
                                thesisSession: true,
                                defenseSession: true,
                                defenseRecord: true,
                                room: true,
                                organization: true,
                                supervisor: true,
                                coSupervisor: true,
                            },
                        },
                    },
                },
            },
            skip: (currentPage - 1) * numberOfPages,
            take: numberOfPages,
        },
        {
            enabled: hasClickedFetch,
        }
    )
    // hàm xử lý lấy ra danh sách sinh viên để dùng cho các hàm xuất excel
    const { data: allStudentsInClasses = [] } = useFindManyStudent(
        {
            where: {
                fixedClassId: {
                    in:
                        queryFixedClasses.length > 0
                            ? queryFixedClasses
                            : fixedClasses?.map((fixedClass) => fixedClass.id),
                },
            },
            include: {
                userProfile: true,
                fixedClass: {
                    include: {
                        trainingCourse: {
                            include: { trainingObjectType: true },
                        },
                        curriculumVersion: {
                            include: {
                                curriculum: {
                                    include: {
                                        trainingMajor: {
                                            include: { trainingField: true },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                thesisRegistrations: {
                    include: {
                        thesisProject: {
                            include: {
                                defenseSession: true,
                                thesisSession: true,
                                organization: true,
                                supervisor: true,
                                coSupervisor: true,
                                room: true,
                                defenseRecord: true,
                                supervisorPayment: true,
                                coSupervisorPayment: true,
                                council: {
                                    include: { members: { include: { expert: true } } },
                                },
                            },
                        },
                    },
                },
            },
        },
        { enabled: needAllStudents }
    )
    // hàm xử lý lấy ra số lượng sinh viên để hiển thị trong bảng
    const { data: countStudent, refetch: refetchCount } = useCountStudent(
        {
            where: {
                thesisRegistrations: {
                    some: {
                        thesisProject: {
                            thesisSessionId: thesisSessionSelected?.id ?? '',
                            thesisType: ThesisType.THESIS,
                            organizationId: organizationSelected ?? undefined,
                        },
                    },
                },
                fixedClassId: {
                    in:
                        queryFixedClasses.length > 0
                            ? queryFixedClasses
                            : fixedClasses?.map((fixedClass) => fixedClass.id),
                },
            },
        },
        {
            enabled: hasClickedFetch,
        }
    )
    // hàm xử lý lấy ra danh sách session
    const { data: thesisSessionData } = useFindManyThesisSession({
        orderBy: { startDate: 'desc' },

        where: {
            trainingObjectTypeId: trainingObjectId,
        },
        include: {
            trainingObjectType: true,
            trainingCourse: true,
        },
    })
    // hàm xử lý tạo đồ án
    const { mutateAsync: createThesisProject } = useCreateThesisProject()
    // hàm xử lý tạo sinh viên đồ án
    const { mutateAsync: createStudentThesisRegistration } = useCreateStudentThesisRegistration()
    // hàm xử lý cập nhật đồ án
    const { mutateAsync: updateThesisProject } = useUpdateThesisProject()
    // hàm xử lý xử lý thay đổi giá trị trong bảng
    const handleEditChange = (rowId: string, field: string, value: any) => {
        setEditingValues((prev) => ({
            ...prev,
            [rowId]: {
                ...prev[rowId],
                [field]: value,
            },
        }))
    }
    // hàm xử lý click vào button mặc định
    const defaultButtonClick = () => {
        message.info('Tính năng đang trong quá trình phát triển')
    }

    // hàm xử lý xuất file sao QĐ HDLV
    const saoQDHDLV = async () => {
        if (!students?.length && !allStudentsInClasses?.length) {
            message.error('Không có dữ liệu để sao QĐ HDLV')
            return
        }
        showSpinner()
        const presentDay = dayjs().format('DD/MM/YYYY')
        const ngayQD = presentDay.split('/')[0]
        const thangQD = presentDay.split('/')[1]
        const namQD = presentDay.split('/')[2]
        try {
            const allSheetOptions = allStudentsInClasses?.map((student) => {
                const supervisor =
                    student?.thesisRegistrations?.[0]?.thesisProject?.supervisor?.name
                if (!supervisor) {
                    return null
                }
                const coSupervisor =
                    student?.thesisRegistrations?.[0]?.thesisProject?.coSupervisor?.name
                const data = {
                    ngayQD: ngayQD,
                    thangQD: thangQD,
                    namQD: namQD,
                    type:
                        student?.thesisRegistrations?.[0]?.thesisProject?.description
                            ?.split('-')[1]
                            .trim()
                            .split(':')[1] || '',
                    khoa: student?.fixedClass?.trainingCourse?.name || '',
                    chuyennganh:
                        student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name ||
                        '',
                    nganh:
                        student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
                            ?.trainingField?.name || '',
                    detai: student?.thesisRegistrations?.[0]?.thesisProject?.title || '',
                    hoten: student?.userProfile?.fullname,
                    canbohuongdan1: supervisor ? `1. ${supervisor}` : '',
                    canbohuongdan2: coSupervisor ? `2. ${coSupervisor}` : '',
                    khoaquanli:
                        student?.thesisRegistrations?.[0]?.thesisProject?.organization?.sTen || '',
                    ngay: ngayQD,
                    thang: thangQD,
                    nam: namQD,
                }
                const gapRow: TableRow = {
                    cells: [{ value: null, colSpan: 18, border: false }],
                }
                return {
                    sheet: `${student.userProfile?.code} `,
                    data: data,
                    tableStartCell: { row: 40, col: 1 },
                    rows: [gapRow],
                }
            })
            await exportFromTemplate({
                templateUrl: getMinioUrl('mta/template/BanSaoQDHuongDanLuanVan.xlsx'),
                sheets: allSheetOptions?.filter((item) => item !== null) ?? [],
                fileName: 'BanSaoQDHuongDanLuanVan',
                mergeSheetsToOne: true,
                sheetName: 'BanSaoQDHuongDanLuanVan',
            })
            message.success('Xuất file thành công')
        } catch (error) {
            message.error('Vui lòng kiểm tra lại dữ liệu đầu vào')
        } finally {
            hideSpinner()
        }
    }
    // hàm xử lý xuất file giấy mời HDLV
    const giaymoihdlv = async () => {
        if (!students?.length && !allStudentsInClasses?.length) {
            message.error('Không có dữ liệu để tạo giấy mời HDLV')
            return
        }
        showSpinner()
        const presentDay = dayjs().format('DD/MM/YYYY')
        const ngay = presentDay.split('/')[0]
        const thang = presentDay.split('/')[1]
        const nam = presentDay.split('/')[2]
        try {
            const allSheetOptions = allStudentsInClasses?.map((student) => {
                const supervisor =
                    student?.thesisRegistrations?.[0]?.thesisProject?.supervisor?.name
                const data = {
                    ngay: ngay,
                    thang: thang,
                    nam: nam,
                    tenhocvien: student?.userProfile?.fullname,
                    tenhuongdan: supervisor ? ` ${supervisor}` : '',
                    khoa: student?.fixedClass?.trainingCourse?.name || '',
                    chuyennganh:
                        student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name ||
                        '',
                    tendetai: student?.thesisRegistrations?.[0]?.thesisProject?.title || '',
                    type:
                        student?.thesisRegistrations?.[0]?.thesisProject?.description
                            ?.split('-')[1]
                            .trim()
                            .split(':')[1]
                            .trim()
                            .toLowerCase() || '',
                }
                const gapRow: TableRow = {
                    cells: [{ value: null, colSpan: 18, border: false }],
                }
                return {
                    sheet: `${student.userProfile?.fullname} - ${student.userProfile?.code}`,
                    data: data,
                    tableStartCell: { row: 25, col: 1 },
                    rows: [gapRow],
                }
            })
            await exportFromTemplate({
                templateUrl: getMinioUrl('mta/template/GiayMoiHDLV.xlsx'),
                sheets: allSheetOptions ?? [],
                fileName: 'GiayMoiHDLV',
                mergeSheetsToOne: true,
                sheetName: 'GiayMoiHDLV',
            })
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }
    // hàm xử lý xuất file hồ sơ bảo vệ LV
    const hosobvlv = async () => {
        if (!students?.length && !allStudentsInClasses?.length) {
            message.error('Không có dữ liệu để tạo hồ sơ bảo vệ LV')
            return
        }
        showSpinner()
        try {
            const allSheetOptions = allStudentsInClasses?.map((student) => {
                const thanhvienhoidong =
                    student?.thesisRegistrations?.[0]?.thesisProject?.council?.members
                const phanbien1 = thanhvienhoidong?.find(
                    (member) => member.role === CouncilRole.REVIEWER_1
                )
                const phanbien2 = thanhvienhoidong?.find(
                    (member) => member.role === CouncilRole.REVIEWER_2
                )
                const chutich = thanhvienhoidong?.find(
                    (member) => member.role === CouncilRole.CHAIRMAN
                )
                const thuky = thanhvienhoidong?.find(
                    (member) => member.role === CouncilRole.SECRETARY
                )
                const uyvien = thanhvienhoidong?.find(
                    (member) => member.role === CouncilRole.MEMBER
                )
                const data = {
                    tenhocvien: student.userProfile?.fullname || '',
                    type:
                        student.thesisRegistrations?.[0]?.thesisProject?.description
                            ?.split('-')[1]
                            .trim()
                            .split(':')[1]
                            .trim()
                            .toLowerCase() || '',
                    khoa: student?.fixedClass?.trainingCourse?.name || '',
                    chuyennganh:
                        student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name ||
                        '',
                    nganh:
                        student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
                            ?.trainingField?.name || '',
                    detai: student?.thesisRegistrations?.[0]?.thesisProject?.title || '',
                    ngaybaove: student?.thesisRegistrations?.[0]?.thesisProject?.defenseDate
                        ? dayjs(
                              student?.thesisRegistrations?.[0]?.thesisProject?.defenseDate
                          ).format('DD/MM/YYYY')
                        : '',
                    phanbien1: phanbien1?.expert?.name || '',
                    phanbien2: phanbien2?.expert?.name || '',
                    chutich: chutich?.expert?.name || '',
                    thuky: thuky?.expert?.name || '',
                    uyvien: uyvien?.expert?.name || '',
                }
                const gapRow: TableRow = {
                    cells: [{ value: null, colSpan: 18, border: false }],
                }
                return {
                    sheet: `${student.userProfile?.code}`,
                    data: data,
                    tableStartCell: { row: 104, col: 1 },
                    rows: [gapRow],
                }
            })
            await exportFromTemplate({
                templateUrl: getMinioUrl('mta/template/HoSoBVLVTN.xlsx'),
                sheets: allSheetOptions ?? [],
                fileName: 'Hosobvlv',
                mergeSheetsToOne: true,
                sheetName: 'Hosobvlv',
            })
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }
    // hàm xử lý xuất file danh sách bảo vệ LV
    const danhsachbaove = async () => {
        if (!students?.length && !allStudentsInClasses?.length) {
            message.error('Không có dữ liệu để tạo danh sách bảo vệ LV')
            return
        }
        showSpinner()
        try {
            const row: TableRow[] =
                allStudentsInClasses?.map((student, index) => {
                    return {
                        cells: [
                            { value: index + 1, border: true, align: 'center' },
                            {
                                value:
                                    student?.fixedClass?.curriculumVersion?.curriculum
                                        ?.trainingMajor?.name || '',
                                border: true,
                                align: 'center',
                            },
                            {
                                value:
                                    student?.fixedClass?.trainingCourse?.trainingObjectType?.name ||
                                    '',
                                border: true,
                                align: 'center',
                            },
                            {
                                value: student.userProfile?.lastName || '',
                                border: true,
                                align: 'center',
                            },
                            {
                                value: student.userProfile?.firstName || '',
                                border: true,
                                align: 'center',
                            },
                            { value: '', border: true, align: 'center' },
                            {
                                value: student?.thesisRegistrations?.[0]?.thesisProject?.defenseDate
                                    ? dayjs(
                                          student?.thesisRegistrations?.[0]?.thesisProject
                                              ?.defenseDate
                                      ).format('DD/MM/YYYY')
                                    : '',
                                border: true,
                                align: 'center',
                            },
                            {
                                value: student?.thesisRegistrations?.[0]?.thesisProject
                                    ?.defenseSession?.startTime
                                    ? dayjs(
                                          student?.thesisRegistrations?.[0]?.thesisProject
                                              ?.defenseSession?.startTime
                                      ).format('HH:mm')
                                    : '',
                                border: true,
                                align: 'center',
                            },
                            {
                                value:
                                    student?.thesisRegistrations?.[0]?.thesisProject?.room?.name ||
                                    '',
                                border: true,
                                align: 'center',
                            },
                            { value: '', border: true },
                            { value: '', border: true },
                            { value: '', border: true },
                        ],
                    }
                }) ?? []
            const gapRow: TableRow = {
                cells: [{ value: null, border: false }],
            }
            const totalRow: TableRow = {
                cells: [
                    {
                        value: `(Tổng số: ${allStudentsInClasses?.length} học viên)`,
                        align: 'center',
                        colSpan: 13,
                        border: false,
                        bold: true,
                    },
                ],
            }
            await exportFromTemplate({
                templateUrl: getMinioUrl('mta/template/DanhSachBaoVe.xlsx'),
                sheets: [
                    {
                        sheet: 'DanhSachBaoVe',
                        rows: [...row, gapRow, totalRow],
                        tableStartCell: { row: 7, col: 1 },
                        data: {
                            dotxet: thesisSessionSelected?.name || '',
                        },
                    },
                ],
                fileName: 'DanhSachBaoVe',
            })
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }
    // hàm xử lý xuất file thống kê cán bộ hướng dẫn LV
    const thongkecbhdlv = async () => {
        if (!students?.length && !allStudentsInClasses?.length) {
            message.error('Không có dữ liệu để tạo thống kê cán bộ hướng dẫn LV')
            return
        }
        showSpinner()
        const dataMapping = getExpertSupervisionStats()
        const ngayhientai = dayjs().format('DD/MM/YYYY')
        const ngay = ngayhientai.split('/')[0]
        const thang = ngayhientai.split('/')[1]
        const nam = ngayhientai.split('/')[2]
        const tendot = thesisSessionSelected?.name || ''

        const tenkhoa = ''
        const rows: TableRow[] = dataMapping?.map((item, index) => {
            return {
                cells: [
                    { value: index + 1, border: true, align: 'center' },
                    { value: item.name, border: true, align: 'center' },
                    { value: item.sDonvi, border: true, align: 'center' },
                    {
                        value: item.GVHD1Student + item.GVHD2Student || 0,
                        border: true,
                        align: 'center',
                    },
                    { value: 0, border: true, align: 'center' },
                    { value: item.GVHD1Student, border: true, align: 'center' },
                    { value: item.GVHD2Student, border: true, align: 'center' },
                    { value: item.totalPayment, border: true, align: 'center' },
                    { value: item.stk, border: true, align: 'center' },
                    { value: item.tennganhang, border: true, align: 'center' },
                ],
            }
        })
        const totalRow: TableRow = {
            cells: [
                { value: '', border: true, align: 'center' },
                {
                    value: 'Tổng cộng',
                    border: true,
                    align: 'right',
                    colSpan: 2,
                    bold: true,
                },
                {
                    value: dataMapping?.reduce(
                        (acc, item) => acc + item.GVHD1Student + item.GVHD2Student,
                        0
                    ),
                    border: true,
                    align: 'center',
                    bold: true,
                },
                { value: 0, border: true, align: 'center', bold: true },
                {
                    value: dataMapping?.reduce((acc, item) => acc + item.GVHD1Student, 0),
                    border: true,
                    align: 'center',
                    bold: true,
                },
                {
                    value: dataMapping?.reduce((acc, item) => acc + item.GVHD2Student, 0),
                    border: true,
                    align: 'center',
                    bold: true,
                },
                {
                    value: dataMapping?.reduce((acc, item) => acc + item.totalPayment, 0),
                    border: true,
                    align: 'center',
                    bold: true,
                },
                { value: '', border: true, align: 'center', bold: true },
                { value: '', border: true, align: 'center', bold: true },
            ],
        }
        try {
            await exportFromTemplate({
                templateUrl: getMinioUrl('mta/template/ThongKeCanBoHuongDan.xlsx'),
                sheets: [
                    {
                        sheet: 'ThongKeCanBoHuongDan',
                        data: {
                            tendot: tendot,
                            tenkhoa: tenkhoa,
                            ngay: ngay,
                            thang: thang,
                            nam: nam,
                        },
                        rows: [...rows, totalRow],
                        tableStartCell: { row: 10, col: 1 },
                    },
                ],
                fileName: 'ThongKeCanBoHuongDan',
            })
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }
    // hàm xử lý xuất file phụ lục ds luận văn
    const phulucdsluanvan = async () => {
        showSpinner()
        if (!allStudentsInClasses?.length) {
            message.error('Không có dữ liệu để xuất phụ lục danh sách luận văn')
            hideSpinner()
            return
        }
        const organizationMap = new Map<string, any>()
        let dotxet = ''
        allStudentsInClasses.forEach((student) => {
            dotxet =
                dotxet ||
                student?.thesisRegistrations?.[0]?.thesisProject?.thesisSession?.name ||
                ''
            const thesisProject = student?.thesisRegistrations?.[0]?.thesisProject
            if (!thesisProject) return
            const organizationId = thesisProject.organization?.Id || ''
            const organizationName = thesisProject.organization?.sTen || 'Chưa có đơn vị'
            const organizationCode = thesisProject.organization?.sCode || ''
            if (!organizationMap.has(organizationId)) {
                organizationMap.set(organizationId, {
                    organizationId: organizationId === '' ? null : organizationId,
                    sTen: organizationName || '',
                    sCode: organizationCode || '',
                    thesisProject: [],
                })
            }
            const orgData = organizationMap.get(organizationId)
            orgData.thesisProject.push({
                hovatenhocvien: student.userProfile?.fullname || '',
                ngaysinh: student.userProfile?.dateOfBirth
                    ? dayjs(student.userProfile.dateOfBirth).format('DD/MM/YYYY')
                    : '',
                doituongdaotao: student?.fixedClass?.trainingCourse?.trainingObjectType?.name || '',
                khoa: student.fixedClass?.trainingCourse?.name || '',
                tendetai: thesisProject.title || '',
                gvhd1: thesisProject.supervisor?.name || '',
                gvhd2: thesisProject.coSupervisor?.name || '',
                isThesis:
                    thesisProject.description?.split('-')[1].trim().split(':')[1] ||
                    ''.toLowerCase(),
                language:
                    thesisProject.description?.split('-')[0].trim().split(':')[1] ||
                    ''.toLowerCase(),
            })
        })
        // Convert Map to Array
        const result = Array.from(organizationMap.values())
        if (result.length === 0) {
            message.error('Không có dữ liệu để xuất phụ lục danh sách luận văn')
            hideSpinner()
            return
        }
        let count = 1
        const dataRows: TableRow[] = result.flatMap((item: any) => {
            const orgRow: TableRow = {
                cells: [
                    {
                        value: `${item.sCode} - ${item.sTen}`,
                        border: true,
                        align: 'center',
                        colSpan: 6,
                        bold: true,
                    },
                ],
            }
            const thesisRows: TableRow[] = item.thesisProject.map((thesis: any) => {
                return {
                    cells: [
                        { value: count++, border: true, align: 'center' },
                        {
                            value: `${thesis.hovatenhocvien}\n${thesis.ngaysinh}\n${thesis.doituongdaotao}-${thesis.khoa}`,
                            border: true,
                            align: 'left',
                        },
                        { value: `${thesis.tendetai}`, border: true, align: 'left' },
                        {
                            value: `${thesis.gvhd1 ? `1. ${thesis.gvhd1}` : ''}\n${
                                thesis.gvhd2 ? `2. ${thesis.gvhd2}` : ''
                            }`,
                            border: true,
                            align: 'left',
                        },
                        { value: `${thesis.isThesis}`, border: true, align: 'center' },
                        { value: `${thesis.language}`, border: true, align: 'center' },
                    ],
                }
            })
            return [orgRow, ...thesisRows]
        })
        const gapRow: TableRow = {
            cells: [{ value: null, border: false }],
        }
        const totalRow: TableRow = {
            cells: [
                {
                    value: `(Tổng số: ${count - 1} học viên)`,
                    align: 'center',
                    colSpan: 6,
                    border: false,
                },
            ],
        }
        try {
            await exportFromTemplate({
                templateUrl: getMinioUrl('mta/template/phulucluanvanthacsi.xlsx'),
                sheets: [
                    {
                        sheet: 'phulucluanvanthacsi',
                        rows: [...dataRows, gapRow, totalRow],
                        tableStartCell: { row: 7, col: 1 },
                        data: {
                            dotxet: dotxet || '',
                        },
                    },
                ],
                fileName: 'PhuLucDsLuanVan',
            })
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const getExpertSupervisionStats = (): ExpertStat[] => {
        if (!allStudentsInClasses || allStudentsInClasses.length === 0) {
            return []
        }

        const expertStatsMap = new Map<string, ExpertStat>()

        const updateStats = (expert: any, amount: any, role: 'GVHD1' | 'GVHD2') => {
            if (!expert) return

            const expertId = expert.id
            const paymentAmount = Number(amount?.toString()) || 0

            let stats = expertStatsMap.get(expertId)
            if (!stats) {
                stats = {
                    expertId: expertId,
                    name: expert.name ?? '',
                    sDonvi: expert.organization ?? '',
                    stk: expert.bankAccountNumber ?? '',
                    tennganhang: expert.bankName ?? '',
                    GVHD1Student: 0,
                    GVHD2Student: 0,
                    totalPayment: 0,
                }
                expertStatsMap.set(expertId, stats)
            }

            stats.totalPayment += paymentAmount

            if (role === 'GVHD1') {
                stats.GVHD1Student += 1
            } else {
                stats.GVHD2Student += 1
            }
        }
        for (const student of allStudentsInClasses) {
            for (const registration of student.thesisRegistrations) {
                const project = registration.thesisProject
                if (!project) continue

                if (project.supervisor) {
                    updateStats(project.supervisor, project.supervisorPayment?.amount, 'GVHD1')
                }

                if (project.coSupervisor) {
                    updateStats(project.coSupervisor, project.coSupervisorPayment?.amount, 'GVHD2')
                }
            }
        }

        return Array.from(expertStatsMap.values())
    }
    // hàm xử lý tạo dữ liệu mẫu
    const taodulieumau = async () => {
        showSpinner()
        setNeedAllStudents(true)
        const createPromises = allStudentsInClasses?.map(async (student) => {
            const hasThesisRegistration = student.thesisRegistrations?.some(
                (registration) => registration.thesisProject?.thesisType === ThesisType.THESIS
            )
            if (hasThesisRegistration) {
                return null
            }
            const payload = {
                title: '',
                summary: '',
                titleEN: '',
                maxStudents: 1,
                language: 'Tiếng Việt',
                type: 'Luận văn',
                // description: "Ngôn ngữ: Tiếng Việt - Luận án/Đề án: Luận văn",
                thesisSession: {
                    connect: {
                        id: thesisSessionSelected?.id ?? '',
                    },
                },
                thesisType: ThesisType.THESIS,
                librarySubmission: {
                    create: {
                        isHardcopy: false,
                        isSoftcopy: false,
                        librarianNote: '',
                    },
                },
                council: {
                    create: {
                        proposedDate: new Date(),
                        status: CouncilProposalStatus.PENDING,
                    },
                },
                defenseRecord: {
                    create: {
                        isProfileComplete: false,
                    },
                },
            }
            const response = await createThesisProject({
                data: {
                    ...payload,
                },
            })
            const payloadRegistration = {
                thesisProjectId: response?.id ?? '',
                studentId: student.id,
            }
            const responseRegistration = await createStudentThesisRegistration({
                data: payloadRegistration,
            })
            return { response, responseRegistration }
        })
        try {
            const validPromises = (createPromises || []).filter((p) => p !== null)
            await Promise.all(validPromises)
            const skippedCount = (createPromises?.length || 0) - validPromises.length
            if (skippedCount > 0) {
                message.success(
                    `Tạo dữ liệu mẫu thành công. Đã bỏ qua ${skippedCount} sinh viên đã có luận văn.`
                )
            } else {
                message.success('Tạo dữ liệu mẫu thành công')
            }
        } catch (error) {
            message.error('Đã xảy ra lỗi trong lúc tạo dữ liệu mẫu')
        } finally {
            hideSpinner()
        }
    }
    // hàm xử lý lấy ra danh sách button
    const buttonList = [
        {
            id: 1,
            label: 'Phụ lục ds luận văn',
            onClick: async () => await phulucdsluanvan(),
        },
        {
            id: 2,
            label: 'Sao QĐ HDLV',
            onClick: async () => await saoQDHDLV(),
        },
        {
            id: 3,
            label: 'Giấy mời HDLV',
            onClick: async () => await giaymoihdlv(),
        },
        {
            id: 5,
            label: 'Giấy mời chấm LV PB',
            onClick: () => defaultButtonClick(),
            disabled: true,
        },
        {
            id: 6,
            label: 'Phụ lục QĐHĐ',
            onClick: () => defaultButtonClick(),
            disabled: true,
        },
        {
            id: 6.1,
            label: 'Bản sao HDDGLV',
            onClick: () => defaultButtonClick(),
            disabled: true,
        },
        {
            id: 7,
            label: 'Đề xuất hội đồng',
            onClick: () => defaultButtonClick(),
            disabled: true,
        },
        {
            id: 8,
            label: 'Hồ sơ BV LV',
            onClick: async () => await hosobvlv(),
        },
        {
            id: 9,
            label: 'Danh sách bảo vệ',
            onClick: async () => await danhsachbaove(),
        },
        {
            id: 10,
            label: 'Danh sách bảo vệ(Dán PBV)',
            onClick: () => defaultButtonClick(),
            disabled: true,
        },

        {
            id: 12,
            label: 'Danh sách chuyên gia',
            onClick: () => defaultButtonClick(),
            disabled: true,
        },

        {
            id: 13,
            label: 'Thanh toán hướng dẫn',
            onClick: () => defaultButtonClick(),
            disabled: true,
        },
        {
            id: 13.1,
            label: 'Thanh toán hướng dẫn - Ngoài HV',
            onClick: () => defaultButtonClick(),
            disabled: true,
        },
        {
            id: 14,
            label: 'Thống kê CBHD LV',
            onClick: async () => await thongkecbhdlv(),
        },
        {
            id: 15,
            label: 'Thống kê cán bộ tham gia HĐ',
            onClick: () => defaultButtonClick(),
            disabled: true,
        },
        {
            id: 16,
            label: 'Thống kê KQ BV LV',
            onClick: () => defaultButtonClick(),
            disabled: true,
        },
        {
            id: 19,
            label: 'Danh sách nộp luận văn thư viện',
            onClick: () => defaultButtonClick(),
            disabled: true,
        },
        {
            id: 11,
            label: 'Thanh toán hội đồng bảo vệ',
            onClick: () => defaultButtonClick(),
            disabled: true,
        },
    ]
    // hàm xử lý render component
    return (
        <div>
            <Row gutter={[16, 0]}>
                <Col span={24}>
                    <Row gutter={[16, 16]} align="top" justify="space-between">
                        <Col span={36}>
                            <Flex gap={12}>
                                <Form.Item name="searchDotXet" label="Đợt xét" required>
                                    <Select
                                        className="w-36"
                                        options={thesisSessionData?.map((item) => ({
                                            label: item.name,
                                            value: item.id,
                                        }))}
                                        onChange={(value) => {
                                            setThesisSessionSelected(
                                                thesisSessionData?.find((x) => x.id === value) ||
                                                    null
                                            )
                                            setTrainingCourseSelected(null)
                                            setFixedClassesSelected([])
                                        }}
                                        placeholder="Chọn đợt xét"
                                    />
                                </Form.Item>
                                <Form.Item name="searchKhoaHoc" label="Khóa học" required>
                                    <Select
                                        className="w-36"
                                        options={
                                            trainingCourses?.map((item) => ({
                                                label: item.name,
                                                value: item.id,
                                            })) || []
                                        }
                                        onChange={(value) => {
                                            setTrainingCourseSelected(value as string | null)
                                        }}
                                        placeholder="Chọn khóa học"
                                        disabled={!thesisSessionSelected}
                                    />
                                </Form.Item>
                                <Form.Item name="searchText" label="Lớp học">
                                    <Select
                                        mode="multiple"
                                        className=" w-64"
                                        maxTagCount="responsive"
                                        maxTagPlaceholder={(omittedValues) =>
                                            `+${omittedValues.length}`
                                        }
                                        options={fixedClasses?.map((x) => {
                                            return {
                                                label: x.name,
                                                value: x.id,
                                            }
                                        })}
                                        onChange={(value) => {
                                            setFixedClassesSelected(value as string[])
                                        }}
                                        placeholder="Chọn lớp học"
                                    />
                                </Form.Item>
                                <Form.Item name="searchKhoaQuanLy" label="Khoa quản lí">
                                    <TreeSelect
                                        className="w-80"
                                        placeholder="Chọn khoa quản lý"
                                        onChange={(value) => {
                                            setOrganizationSelected(value as string | null)
                                        }}
                                        allowClear
                                        showSearch
                                        treeDefaultExpandAll
                                        treeData={treeOrgData}
                                    />
                                </Form.Item>
                                <Form.Item className="flex justify-end gap-3">
                                    <Button
                                        type="primary"
                                        onClick={() => {
                                            setEditingRowKeys([])
                                            setNeedAllStudents(true)
                                            setQueryFixedClasses(fixedClassesSelected)

                                            if (!hasClickedFetch) {
                                                setHasClickedFetch(true)
                                            }
                                        }}
                                    >
                                        Xem kết quả
                                    </Button>
                                    {role === 'P7' ? (
                                        <Popconfirm
                                            placement="rightTop"
                                            title="Xác nhận tạo dữ liệu mẫu"
                                            description="Tạo dữ liệu mẫu sẽ ghi đè lại dữ liệu (nếu có). Bạn có chắc chắn muốn tạo dữ liệu mẫu không?"
                                            onConfirm={async () => {
                                                setEditingRowKeys([])
                                                setQueryFixedClasses(fixedClassesSelected)
                                                if (!hasClickedFetch) {
                                                    setHasClickedFetch(true)
                                                }
                                                await taodulieumau()
                                            }}
                                        >
                                            <Button type="primary" className="ml-2">
                                                Tạo dữ liệu mẫu
                                            </Button>
                                        </Popconfirm>
                                    ) : null}
                                    {editingRowKeys.length > 0 && (isManage || role === 'P7') ? (
                                        <>
                                            <Button
                                                type="default"
                                                className="ml-2"
                                                onClick={() => {
                                                    setEditingRowKeys([])
                                                    setEditingValues({})
                                                    message.info(
                                                        'Đã hủy tất cả các thay đổi chưa lưu.'
                                                    )
                                                }}
                                            >
                                                Hủy thay đổi
                                            </Button>
                                            <Button
                                                type="primary"
                                                className="ml-2"
                                                onClick={handleBatchSave} // Gọi hàm lưu hàng loạt
                                            >
                                                Lưu thay đổi
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            type="default"
                                            className="ml-2"
                                            onClick={handleActivateEdit}
                                            disabled={!students?.length}
                                        >
                                            Chỉnh sửa
                                        </Button>
                                    )}
                                </Form.Item>
                            </Flex>
                        </Col>
                    </Row>
                    <Row gutter={[16, 16]}>
                        <Col>
                            <Flex gap={4} wrap="wrap">
                                {buttonList.map((item) => (
                                    <Button
                                        key={item.id}
                                        type="primary"
                                        onClick={async () => await item.onClick()}
                                        disabled={item.disabled}
                                    >
                                        {item.id}. {item.label}
                                    </Button>
                                ))}
                            </Flex>
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <Table
                        bordered
                        scroll={{ x: 'max-content' }}
                        className={'mt-2'}
                        rowKey="id"
                        columns={[
                            {
                                title: 'Khoa quản lí',
                                dataIndex: 'organization',
                                width: 240,
                                render: (_, record) => {
                                    const status =
                                        record?.thesisRegistrations?.[0]?.thesisProject?.status ||
                                        ''
                                    if (
                                        editingRowKeys.includes(record?.id) &&
                                        (isManage || role === 'P7') &&
                                        status === ThesisProjectStatus.PROPOSED
                                    ) {
                                        return (
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <TreeSelect
                                                    className="w-full"
                                                    treeData={treeOrgData}
                                                    placeholder="Chọn đơn vị quản lý"
                                                    allowClear
                                                    showSearch
                                                    treeDefaultExpandAll
                                                    defaultValue={
                                                        record?.thesisRegistrations?.[0]
                                                            ?.thesisProject?.organization?.Id || ''
                                                    }
                                                    onChange={(value) =>
                                                        handleEditChange(
                                                            record?.id,
                                                            'organization',
                                                            value
                                                        )
                                                    }
                                                />
                                            </div>
                                        )
                                    }
                                    return (
                                        `${
                                            record?.thesisRegistrations?.[0]?.thesisProject
                                                ?.organization?.sMa
                                        } - ${record?.thesisRegistrations?.[0]?.thesisProject?.organization?.sTen}` ||
                                        ''
                                    )
                                },
                            },
                            {
                                title: 'Mã sinh viên',
                                width: 100,
                                fixed: 'left',
                                render: (_, record) => {
                                    return record?.code
                                },
                            },
                            {
                                title: 'Họ tên',
                                width: 180,
                                fixed: 'left',
                                dataIndex: 'name',
                                render: (_, record) => {
                                    return record?.userProfile?.fullname
                                },
                            },
                            {
                                title: 'Ngày sinh',
                                width: 100,
                                dataIndex: 'name',
                                align: 'center',
                                render: (_, record) => {
                                    return record?.userProfile?.dateOfBirth
                                        ? dayjs(record?.userProfile?.dateOfBirth).format(
                                              'DD/MM/YYYY'
                                          )
                                        : ''
                                },
                            },
                            {
                                title: 'Đề tài',
                                width: 200,
                                dataIndex: 'title',
                                render: (_, record) => {
                                    const status =
                                        record?.thesisRegistrations?.[0]?.thesisProject?.status ||
                                        ''
                                    if (
                                        editingRowKeys.includes(record?.id) &&
                                        ((isManage && status === ThesisProjectStatus.PROPOSED) ||
                                            role === 'P7')
                                    ) {
                                        const currentValue =
                                            editingValues[record?.id]?.title !== undefined
                                                ? editingValues[record?.id]?.title
                                                : record?.thesisRegistrations?.[0]?.thesisProject
                                                      ?.title || ''

                                        return (
                                            <div
                                                onClick={(e) => e.stopPropagation()} // <-- Thêm dòng này
                                            >
                                                <TextArea
                                                    rows={2}
                                                    value={currentValue}
                                                    onChange={(e) => {
                                                        handleEditChange(
                                                            record?.id,
                                                            'title',
                                                            e.target.value
                                                        )
                                                    }}
                                                />
                                            </div>
                                        )
                                    }
                                    return (
                                        <p className="line-clamp-2">
                                            {record?.thesisRegistrations?.[0]?.thesisProject
                                                ?.title || ''}
                                        </p>
                                    )
                                },
                            },
                            {
                                title: 'GVHD 1',
                                width: 150,
                                dataIndex: 'supervisor',
                                render: (_, record) => {
                                    const status =
                                        record?.thesisRegistrations?.[0]?.thesisProject?.status ||
                                        ''
                                    if (
                                        editingRowKeys.includes(record?.id) &&
                                        (isManage || role === 'P7') &&
                                        status === ThesisProjectStatus.PROPOSED
                                    ) {
                                        const currentValue =
                                            editingValues[record?.id]?.supervisor !== undefined
                                                ? editingValues[record?.id]?.supervisor
                                                : record?.thesisRegistrations?.[0]?.thesisProject
                                                      ?.supervisor?.name || ''

                                        return (
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <Select
                                                    className="w-full"
                                                    options={expertProfileData?.map((item) => ({
                                                        label: item.name,
                                                        value: item.id,
                                                    }))}
                                                    value={currentValue || ''}
                                                    onChange={(value) =>
                                                        handleEditChange(
                                                            record?.id,
                                                            'supervisor',
                                                            value
                                                        )
                                                    }
                                                />
                                            </div>
                                        )
                                    }
                                    return (
                                        record?.thesisRegistrations?.[0]?.thesisProject?.supervisor
                                            ?.name || ''
                                    )
                                },
                            },
                            {
                                title: 'GVHD 2',
                                width: 150,
                                dataIndex: 'coSupervisor',
                                render: (_, record) => {
                                    const status =
                                        record?.thesisRegistrations?.[0]?.thesisProject?.status ||
                                        ''
                                    if (
                                        editingRowKeys.includes(record?.id) &&
                                        (isManage || role === 'P7') &&
                                        status === ThesisProjectStatus.PROPOSED
                                    ) {
                                        const currentValue =
                                            editingValues[record?.id]?.coSupervisor !== undefined
                                                ? editingValues[record?.id]?.coSupervisor
                                                : record?.thesisRegistrations?.[0]?.thesisProject
                                                      ?.coSupervisor?.name || ''

                                        return (
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <Select
                                                    className="w-full"
                                                    options={expertProfileData?.map((item) => ({
                                                        label: item.name,
                                                        value: item.id,
                                                    }))}
                                                    value={currentValue || ''}
                                                    onChange={(value) =>
                                                        handleEditChange(
                                                            record?.id,
                                                            'coSupervisor',
                                                            value
                                                        )
                                                    }
                                                />
                                            </div>
                                        )
                                    }
                                    return (
                                        record?.thesisRegistrations?.[0]?.thesisProject
                                            ?.coSupervisor?.name || ''
                                    )
                                },
                            },
                            {
                                title: 'Chủ tịch ',
                                width: 150,
                                dataIndex: 'councilChairman',
                                render: (_, record) => {
                                    const status =
                                        record?.thesisRegistrations?.[0]?.thesisProject?.status ||
                                        ''
                                    if (editingRowKeys.includes(record?.id)) {
                                        const currentValue =
                                            editingValues[record?.id]?.councilChairman !== undefined
                                                ? editingValues[record?.id]?.councilChairman
                                                : record?.thesisRegistrations?.[0]?.thesisProject?.council?.members?.find(
                                                      (member: any) =>
                                                          member.role === CouncilRole.CHAIRMAN
                                                  )?.expert?.name || ''
                                        return (
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <Select
                                                    className="w-full"
                                                    options={expertProfileData?.map((item) => ({
                                                        label: item.name,
                                                        value: item.id,
                                                    }))}
                                                    value={currentValue || ''}
                                                    onChange={(value) =>
                                                        handleEditChange(
                                                            record?.id,
                                                            'councilChairman',
                                                            value
                                                        )
                                                    }
                                                />
                                            </div>
                                        )
                                    }
                                    return (
                                        record?.thesisRegistrations?.[0]?.thesisProject?.council?.members?.find(
                                            (member: any) => member.role === CouncilRole.CHAIRMAN
                                        )?.expert?.name || ''
                                    )
                                },
                            },
                            {
                                title: 'Thư ký',
                                width: 150,
                                dataIndex: 'councilSecretary',
                                render: (_, record) => {
                                    const status =
                                        record?.thesisRegistrations?.[0]?.thesisProject?.status ||
                                        ''
                                    if (editingRowKeys.includes(record?.id)) {
                                        const currentValue =
                                            editingValues[record?.id]?.councilSecretary !==
                                            undefined
                                                ? editingValues[record?.id]?.councilSecretary
                                                : record?.thesisRegistrations?.[0]?.thesisProject?.council?.members?.find(
                                                      (member: any) =>
                                                          member.role === CouncilRole.SECRETARY
                                                  )?.expert?.name || ''
                                        return (
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <Select
                                                    className="w-full"
                                                    options={expertProfileData?.map((item) => ({
                                                        label: item.name,
                                                        value: item.id,
                                                    }))}
                                                    value={currentValue || ''}
                                                    onChange={(value) =>
                                                        handleEditChange(
                                                            record?.id,
                                                            'councilSecretary',
                                                            value
                                                        )
                                                    }
                                                />
                                            </div>
                                        )
                                    }
                                    return (
                                        record?.thesisRegistrations?.[0]?.thesisProject?.council?.members?.find(
                                            (member: any) => member.role === CouncilRole.SECRETARY
                                        )?.expert?.name || ''
                                    )
                                },
                            },
                            {
                                title: 'Phản biện 1',
                                width: 150,
                                dataIndex: 'reviewer1',
                                render: (_, record) => {
                                    const status =
                                        record?.thesisRegistrations?.[0]?.thesisProject?.status ||
                                        ''
                                    if (editingRowKeys.includes(record?.id)) {
                                        const currentValue =
                                            editingValues[record?.id]?.reviewer1 !== undefined
                                                ? editingValues[record?.id]?.reviewer1
                                                : record?.thesisRegistrations?.[0]?.thesisProject?.council?.members?.find(
                                                      (member: any) =>
                                                          member.role === CouncilRole.REVIEWER_1
                                                  )?.expert?.name || ''
                                        return (
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <Select
                                                    className="w-full"
                                                    options={expertProfileData?.map((item) => ({
                                                        label: item.name,
                                                        value: item.id,
                                                    }))}
                                                    value={currentValue || ''}
                                                    onChange={(value) =>
                                                        handleEditChange(
                                                            record?.id,
                                                            'reviewer1',
                                                            value
                                                        )
                                                    }
                                                />
                                            </div>
                                        )
                                    }
                                    return (
                                        record?.thesisRegistrations?.[0]?.thesisProject?.council?.members?.find(
                                            (member: any) => member.role === CouncilRole.REVIEWER_1
                                        )?.expert?.name || ''
                                    )
                                },
                            },
                            {
                                title: 'Phản biện 2',
                                width: 150,
                                dataIndex: 'reviewer2',
                                render: (_, record) => {
                                    const status =
                                        record?.thesisRegistrations?.[0]?.thesisProject?.status ||
                                        ''
                                    if (editingRowKeys.includes(record?.id)) {
                                        const currentValue =
                                            editingValues[record?.id]?.reviewer2 !== undefined
                                                ? editingValues[record?.id]?.reviewer2
                                                : record?.thesisRegistrations?.[0]?.thesisProject?.council?.members?.find(
                                                      (member: any) =>
                                                          member.role === CouncilRole.REVIEWER_2
                                                  )?.expert?.name || ''
                                        return (
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <Select
                                                    className="w-full"
                                                    options={expertProfileData?.map((item) => ({
                                                        label: item.name,
                                                        value: item.id,
                                                    }))}
                                                    value={currentValue || ''}
                                                    onChange={(value) =>
                                                        handleEditChange(
                                                            record?.id,
                                                            'reviewer2',
                                                            value
                                                        )
                                                    }
                                                />
                                            </div>
                                        )
                                    }
                                    return (
                                        record?.thesisRegistrations?.[0]?.thesisProject?.council?.members?.find(
                                            (member: any) => member.role === CouncilRole.REVIEWER_2
                                        )?.expert?.name || ''
                                    )
                                },
                            },
                            {
                                title: 'Ủy viên',
                                width: 150,
                                dataIndex: 'councilMember',
                                render: (_, record) => {
                                    const status =
                                        record?.thesisRegistrations?.[0]?.thesisProject?.status ||
                                        ''
                                    if (editingRowKeys.includes(record?.id)) {
                                        const currentValue =
                                            editingValues[record?.id]?.councilMember !== undefined
                                                ? editingValues[record?.id]?.councilMember
                                                : record?.thesisRegistrations?.[0]?.thesisProject?.council?.members?.find(
                                                      (member: any) =>
                                                          member.role === CouncilRole.MEMBER
                                                  )?.expert?.name || ''
                                        return (
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <Select
                                                    className="w-full"
                                                    options={expertProfileData?.map((item) => ({
                                                        label: item.name,
                                                        value: item.id,
                                                    }))}
                                                    value={currentValue || ''}
                                                    onChange={(value) =>
                                                        handleEditChange(
                                                            record?.id,
                                                            'councilMember',
                                                            value
                                                        )
                                                    }
                                                />
                                            </div>
                                        )
                                    }
                                    return (
                                        record?.thesisRegistrations?.[0]?.thesisProject?.council?.members?.find(
                                            (member: any) => member.role === CouncilRole.MEMBER
                                        )?.expert?.name || ''
                                    )
                                },
                            },
                            {
                                title: 'Phòng bảo vệ',
                                width: 150,
                                dataIndex: 'room',
                                render: (text: string, record: any) => {
                                    const status =
                                        record?.thesisRegistrations?.[0]?.thesisProject?.status ||
                                        ''
                                    if (editingRowKeys.includes(record?.id)) {
                                        const currentValue =
                                            editingValues[record?.id]?.room !== undefined
                                                ? editingValues[record?.id]?.room
                                                : record?.thesisRegistrations?.[0]?.thesisProject
                                                      ?.room?.name || ''
                                        return (
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <Select
                                                    className="w-full"
                                                    value={currentValue || ''}
                                                    options={roomData?.map((item) => ({
                                                        label: item.name,
                                                        value: item.id,
                                                    }))}
                                                />
                                            </div>
                                        )
                                    }

                                    return (
                                        record?.thesisRegistrations?.[0]?.thesisProject?.room
                                            ?.name || ''
                                    )
                                },
                            },
                            {
                                title: 'Ngày bảo vệ',
                                width: 150,
                                dataIndex: 'defenseDate',
                                render: (_, record) => {
                                    const status =
                                        record?.thesisRegistrations?.[0]?.thesisProject?.status ||
                                        ''
                                    if (editingRowKeys.includes(record?.id)) {
                                        const currentValue =
                                            editingValues[record?.id]?.defenseDate !== undefined
                                                ? editingValues[record?.id]?.defenseDate
                                                : record?.thesisRegistrations?.[0]?.thesisProject
                                                      ?.defenseDate || ''
                                        const dayjsValue = currentValue ? dayjs(currentValue) : null
                                        return (
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <DatePicker
                                                    className="w-full"
                                                    placeholder="Chọn ngày bảo vệ"
                                                    value={dayjsValue || undefined}
                                                    onChange={(value) =>
                                                        handleEditChange(
                                                            record?.id,
                                                            'defenseDate',
                                                            value
                                                        )
                                                    }
                                                />
                                            </div>
                                        )
                                    }
                                    return record?.thesisRegistrations?.[0]?.thesisProject
                                        ?.defenseDate
                                        ? dayjs(
                                              record?.thesisRegistrations?.[0]?.thesisProject
                                                  ?.defenseDate
                                          ).format('DD/MM/YYYY')
                                        : ''
                                },
                            },

                            {
                                title: 'Ca bảo vệ',
                                width: 90,
                                dataIndex: 'defenseSession',
                                render: (_, record) => {
                                    if (editingRowKeys.includes(record?.id)) {
                                        const currentValue =
                                            editingValues[record?.id]?.defenseSession !== undefined
                                                ? editingValues[record?.id]?.defenseSession
                                                : record?.thesisRegistrations?.[0]?.thesisProject
                                                      ?.defenseSession?.startTime || ''
                                        const dayjsValue = currentValue

                                        return (
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <Select
                                                    className="w-full"
                                                    value={dayjsValue || undefined}
                                                    placeholder="Chọn ca bảo vệ"
                                                    options={defenseSessionData?.map((item) => ({
                                                        label: item.startTime
                                                            ? dayjs(item.startTime).format('HH:mm')
                                                            : '',
                                                        value: item.id,
                                                    }))}
                                                />
                                            </div>
                                        )
                                    }
                                    return record?.thesisRegistrations?.[0]?.thesisProject
                                        ?.defenseSession?.startTime
                                        ? dayjs(
                                              record?.thesisRegistrations?.[0]?.thesisProject
                                                  ?.defenseSession?.startTime
                                          ).format('HH:mm')
                                        : ''
                                },
                            },
                            {
                                title: 'Điểm',
                                width: 150,
                                align: 'center',
                                dataIndex: 'score',
                                render: (_, record) => {
                                    return (
                                        record?.thesisRegistrations?.[0]?.thesisProject?.defenseRecord?.finalScore?.toString() ||
                                        ''
                                    )
                                },
                            },
                            {
                                title: 'Nhận xét',
                                width: 150,
                                dataIndex: 'comments',
                                render: (_, record) => {
                                    return (
                                        record?.thesisRegistrations?.[0]?.thesisProject
                                            ?.defenseRecord?.comments || ''
                                    )
                                },
                            },
                            {
                                title: 'Ngôn ngữ',
                                width: 100,
                                dataIndex: 'language',
                                render: (_, record) => {
                                    if (editingRowKeys.includes(record?.id) && isManage) {
                                        const currentValue =
                                            editingValues[record?.id]?.language !== undefined
                                                ? editingValues[record?.id]?.language
                                                : record?.thesisRegistrations?.[0]?.thesisProject
                                                      ?.language?.language || ''
                                        return (
                                            <div
                                                onClick={(e) => e.stopPropagation()} // <-- Thêm dòng này
                                            >
                                                <Input
                                                    value={currentValue || ''}
                                                    onChange={(e) =>
                                                        handleEditChange(
                                                            record?.id,
                                                            'language',
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </div>
                                        )
                                    }
                                    return (
                                        record?.thesisRegistrations?.[0]?.thesisProject?.language ||
                                        ''
                                    )
                                },
                            },
                            {
                                title: 'Luận văn/Đề án',
                                width: 130,
                                dataIndex: 'type',
                                render: (_, record) => {
                                    if (editingRowKeys.includes(record?.id) && isManage) {
                                        const currentValue =
                                            editingValues[record?.id]?.type !== undefined
                                                ? editingValues[record?.id]?.type
                                                : record?.thesisRegistrations?.[0]?.thesisProject
                                                      ?.type || ''
                                        return (
                                            <div
                                                onClick={(e) => e.stopPropagation()} // <-- Thêm dòng này
                                            >
                                                <Select
                                                    className="w-full"
                                                    options={['Luận văn', 'Đề án'].map((item) => ({
                                                        label: item,
                                                        value: item,
                                                    }))}
                                                    value={currentValue || ''}
                                                    onChange={(value) =>
                                                        handleEditChange(record?.id, 'type', value)
                                                    }
                                                />
                                            </div>
                                        )
                                    }
                                    return (
                                        record?.thesisRegistrations?.[0]?.thesisProject?.type || ''
                                    )
                                },
                            },
                            {
                                title: 'Trạng thái',
                                width: 100,
                                fixed: 'right',
                                dataIndex: 'status',
                                render: (_, record) => {
                                    if (editingRowKeys.includes(record?.id)) {
                                        const currentValue =
                                            editingValues[record?.id]?.status !== undefined
                                                ? editingValues[record?.id]?.status
                                                : record?.thesisRegistrations?.[0]?.thesisProject
                                                      ?.status || ''
                                        return (
                                            <div
                                                onClick={(e) => e.stopPropagation()} // <-- Thêm dòng này
                                            >
                                                <Select
                                                    className="w-full"
                                                    disabled={role !== 'P7'}
                                                    options={useThesisProjectStatusOptions()
                                                        .ignoreProjectStatus([
                                                            ThesisProjectStatus.ASSIGNED,
                                                        ])
                                                        .map((item) => ({
                                                            label: item.label,
                                                            value: item.value,
                                                        }))}
                                                    value={currentValue || ''}
                                                    onChange={(value) =>
                                                        handleEditChange(
                                                            record?.id,
                                                            'status',
                                                            value
                                                        )
                                                    }
                                                />
                                            </div>
                                        )
                                    }
                                    const label = getThesisProjectStatusLabel(
                                        record?.thesisRegistrations?.[0]?.thesisProject?.status
                                    )
                                    const color = getThesisProjectStatusColor(
                                        record?.thesisRegistrations?.[0]?.thesisProject?.status
                                    )
                                    return <Tag color={color}>{label}</Tag>
                                },
                            },
                            {
                                title: 'Thao tác',
                                width: 100,
                                fixed: 'right',
                                align: 'center',
                                render: (_, record) => {
                                    if (record?.id) {
                                        const status =
                                            record?.thesisRegistrations?.[0]?.thesisProject
                                                ?.status || ''
                                        return (
                                            <Row className="justify-center gap-2">
                                                <div
                                                    className="flex items-center gap-2"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {!isManage &&
                                                    status ===
                                                        ThesisProjectStatus.APPROVED_BY_DEPT ? (
                                                        <ApproveIcon
                                                            title="Phê duyệt"
                                                            className="text-lg font-bold text-green-700"
                                                            size={24}
                                                            onClick={async () => {
                                                                let status =
                                                                    record?.thesisRegistrations?.[0]
                                                                        ?.thesisProject?.status ||
                                                                    ''
                                                                switch (status) {
                                                                    case ThesisProjectStatus.APPROVED_BY_DEPT:
                                                                        status =
                                                                            ThesisProjectStatus.IN_PROGRESS
                                                                        break
                                                                }
                                                                const payload = {
                                                                    status: status,
                                                                }
                                                                await updateThesisProject({
                                                                    data: payload,
                                                                    where: {
                                                                        id: record
                                                                            ?.thesisRegistrations?.[0]
                                                                            ?.thesisProject?.id,
                                                                    },
                                                                })
                                                            }}
                                                        />
                                                    ) : null}
                                                    {status === ThesisProjectStatus.IN_PROGRESS ? (
                                                        <ApproveIcon
                                                            title="Đủ điều kiện bảo vệ"
                                                            className="text-lg font-bold text-green-700"
                                                            size={24}
                                                            onClick={async () => {
                                                                const payload = {
                                                                    status: ThesisProjectStatus.DEFENSE_ELIGIBLE,
                                                                }
                                                                await updateThesisProject({
                                                                    data: payload,
                                                                    where: {
                                                                        id: record
                                                                            ?.thesisRegistrations?.[0]
                                                                            ?.thesisProject?.id,
                                                                    },
                                                                })
                                                            }}
                                                        />
                                                    ) : null}
                                                    <SquarePen
                                                        size={24}
                                                        className="cursor-pointer"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            openModalCauHinhLuanVan({
                                                                thesisProjectId:
                                                                    record?.thesisRegistrations?.[0]
                                                                        ?.thesisProject?.id,
                                                                thesisSessionId:
                                                                    thesisSessionSelected?.id || '',
                                                            })
                                                        }}
                                                    />
                                                    <DeleteIcon
                                                        title="Xóa"
                                                        size={24}
                                                        className="text-lg font-bold text-red-700"
                                                        onClick={async () => {
                                                            const payload = {
                                                                deletedAt: new Date(),
                                                            }
                                                            try {
                                                                showSpinner()
                                                                await updateThesisProject({
                                                                    data: payload,
                                                                    where: {
                                                                        id:
                                                                            record
                                                                                ?.thesisRegistrations?.[0]
                                                                                ?.thesisProject
                                                                                ?.id || '',
                                                                    },
                                                                })
                                                                message.success('Xóa thành công')
                                                            } catch (error) {
                                                                message.error(
                                                                    'Đã xảy ra lỗi, vui lòng kiểm tra lại'
                                                                )
                                                            } finally {
                                                                hideSpinner()
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </Row>
                                        )
                                    }
                                    return ''
                                },
                            },
                        ]}
                        data={students || []}
                        rowSelection={rowSelection}
                        pagination={{
                            current: currentPage,
                            pageSize: numberOfPages,
                            total: countStudent || 0,
                            onChange: async (page, pageSize) => {
                                setEditingRowKeys([])
                                setEditingValues({})
                                if (numberOfPages === pageSize) {
                                    setCurrentPage(page)
                                } else {
                                    setCurrentPage(1)
                                    setNumberOfPages(pageSize)
                                }
                            },
                        }}
                    />
                </Col>
            </Row>
        </div>
    )
}
PostgraduateProject.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
