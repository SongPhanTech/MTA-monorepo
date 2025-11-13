import Select from '@components/commons/select'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import SettingsIcon from '@components/icons/settings'
import { DEFAULT_PAGINATE_SIZE } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import TreeSelect from '@/components/commons/tree-select'
import {
    useCountStudent,
    useCreateStudentThesisRegistration,
    useCreateThesisProject,
    useFindManyDM_DonVi,
    useFindManyExpertProfile,
    useFindManyFixedClass,
    useFindManyStudent,
    useFindManyThesisSession,
    useFindManyTrainingCourse,
    useUpdateThesisProject,
} from '@workspace/db/hooks'

import { dayjs, useTrainingObjectTypeStore } from '@workspace/ui'
import { Button, Col, Flex, Form, Input, message, Popconfirm, Row, Tag } from 'antd'
import { CircleX, Save } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { useThesisProjectStatusOptions } from '@hooks/thesisProjectStatus'
import { exportFromTemplate, TableRow } from '@workspace/libs/template-excel'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { CouncilRole, ThesisType } from '@workspace/db/client'
import { buildOrgTree } from '@lib/utils'
// import { getMinioUrl } from '@workspace/constant'
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
export default function PostgraduateProject() {
    const { getThesisProjectStatusLabel, getThesisProjectStatusColor } =
        useThesisProjectStatusOptions()
    const [editingRowKeys, setEditingRowKeys] = useState<string[]>([])
    const [editingValues, setEditingValues] = useState<Record<string, Record<string, any>>>({})
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
    const handleBatchSave = async () => {
        if (editingRowKeys.length === 0) {
            message.info('Không có hàng nào đang ở chế độ chỉnh sửa để lưu.')
            return
        }

        showSpinner()
        try {
            const updatePromises = editingRowKeys.map(async (studentId) => {
                const rowData = editingValues[studentId]

                const studentRecord = students?.find((s) => s.id === studentId)
                const thesisProjectId = studentRecord?.thesisRegistrations?.[0]?.thesisProject?.id

                if (!thesisProjectId || !rowData) return

                const description = `Ngôn ngữ: ${rowData.language} - Luận án/Đề án: ${rowData.type}`

                const basePayload = {
                    title: rowData.title,
                    description: description,
                    status: rowData.status,
                    supervisor: {
                        connect: {
                            id: rowData.supervisor === '' ? null : rowData.supervisor,
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

                const payload = {
                    ...basePayload,
                    ...coSupervisorPayload,
                }

                await updateThesisProject({
                    data: payload,
                    where: {
                        id: thesisProjectId,
                    },
                })
            })

            await Promise.all(updatePromises.filter((p) => p !== undefined)) // Chờ tất cả promise hoàn thành

            message.success(`Lưu thành công ${editingRowKeys.length} hàng đã chỉnh sửa.`)
        } catch (error) {
            message.error('Đã xảy ra lỗi khi lưu hàng loạt, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
            await refetch()
            if (refetchCount) await refetchCount()
        }
        // Reset trạng thái chỉnh sửa
        setEditingRowKeys([])
        setEditingValues({})
    }
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
                }
            }
        })

        setEditingRowKeys(newEditingRowKeys)
        setEditingValues(initialEditingValues)
    }
    const { TextArea } = Input
    const { id: trainingObjectId } = useTrainingObjectTypeStore()
    const [trainingCourseSelected, setTrainingCourseSelected] = useState<string[]>([])
    const [fixedClassesSelected, setFixedClassesSelected] = useState<string[]>([])
    const [queryFixedClasses, setQueryFixedClasses] = useState<string[]>([])
    const [needAllStudents, setNeedAllStudents] = useState<boolean>(false)
    const [hasClickedFetch, setHasClickedFetch] = useState<boolean>(false)
    const { onOpen: openModalCauHinhLuanVan } = useDisclosure<{
        thesisProjectId: string
        thesisSessionId: string
    }>({
        tag: 'ModalCauHinhLuanVan',
    })
    const { data: sDm_Donvi = [] } = useFindManyDM_DonVi()
    const treeData = buildOrgTree(sDm_Donvi ?? [], '0')
    const [thesisSessionSelected, setThesisSessionSelected] = useState<any>(null)

    const { data: trainingCourses } = useFindManyTrainingCourse(
        {
            where: {
                id: thesisSessionSelected?.trainingCourseId,
            },
        },
        {
            enabled: !!thesisSessionSelected?.trainingCourseId,
        }
    )

    const { data: fixedClasses } = useFindManyFixedClass({
        where: {
            trainingCourseId: {
                in: trainingCourseSelected,
            },
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
    const handleEditChange = (rowId: string, field: string, value: any) => {
        setEditingValues((prev) => ({
            ...prev,
            [rowId]: {
                ...prev[rowId],
                [field]: value,
            },
        }))
    }
    const defaultButtonClick = () => {
        message.info('Tính năng đang trong quá trình phát triển')
    }
    const saoQDHDLV = async () => {
        showSpinner()
        const presentDay = dayjs().format('DD/MM/YYYY')
        const ngayQD = presentDay.split('/')[0]
        const thangQD = presentDay.split('/')[1]
        const namQD = presentDay.split('/')[2]
        if (!students?.length && !allStudents?.length) {
            message.error('Không có dữ liệu để sao QĐ HDLV')
            return
        }
        try {
            const allSheetOptions = allStudents?.map((student) => {
                const supervisor =
                    student?.thesisRegistrations?.[0]?.thesisProject?.supervisor?.name
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
                    sheet: `${student.userProfile?.fullname} - ${student.userProfile?.code}`,
                    data: data,
                    tableStartCell: { row: 40, col: 1 },
                    rows: [gapRow],
                }
            })
            await exportFromTemplate({
                templateUrl: '/lms/templates/chuong-trinh-dao-tao/BanSaoQDHuongDanLuanVan.xlsx',
                sheets: allSheetOptions ?? [],
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
    const giaymoihdlv = async () => {
        showSpinner()
        const presentDay = dayjs().format('DD/MM/YYYY')
        const ngay = presentDay.split('/')[0]
        const thang = presentDay.split('/')[1]
        const nam = presentDay.split('/')[2]
        if (!students?.length && !allStudents?.length) {
            message.error('Không có dữ liệu để tạo giấy mời HDLV')
            return
        }
        try {
            const allSheetOptions = allStudents?.map((student) => {
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
                templateUrl: '/lms/templates/chuong-trinh-dao-tao/GiayMoiHDLV.xlsx',
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
    const hosobvlv = async () => {
        showSpinner()
        try {
            const allSheetOptions = allStudents?.map((student) => {
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
                templateUrl: '/lms/templates/chuong-trinh-dao-tao/HoSoBVLVTN.xlsx',
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
    const danhsachbaove = async () => {
        showSpinner()
        try {
            const row: TableRow[] =
                allStudents?.map((student, index) => {
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
                                value: student?.trainingObjectType?.name || '',
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
                        value: `(Tổng số: ${allStudents?.length} học viên)`,
                        align: 'center',
                        colSpan: 13,
                        border: false,
                        bold: true,
                    },
                ],
            }
            await exportFromTemplate({
                templateUrl: '/lms/templates/chuong-trinh-dao-tao/DanhSachBaoVe.xlsx',
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
    const thongkecbhdlv = async () => {
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
                { value: 'Tổng cộng', border: true, align: 'right', colSpan: 2, bold: true },
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
                templateUrl: '/lms/templates/chuong-trinh-dao-tao/ThongKeCanBoHuongDan.xlsx',
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
    const getExpertSupervisionStats = (): ExpertStat[] => {
        if (!allStudents || allStudents.length === 0) {
            return []
        }

        const expertStatsMap = new Map<string, ExpertStat>()

        for (const student of allStudents) {
            for (const registration of student.thesisRegistrations) {
                const project = registration.thesisProject

                if (
                    !project
                    // !project ||
                    // !project.supervisorPayments ||
                    // project.thesisType !== ThesisType.THESIS
                )
                    continue

                const countedExperts: { [expertId: string]: boolean } = {}

                for (const payment of project.supervisorPayments) {
                    if (!payment.expert) continue

                    const expertId = payment.expert.id
                    const paymentAmount = Number.parseFloat(payment.amount.toString()) || 0

                    let newStats = expertStatsMap.get(expertId)
                    if (!newStats) {
                        newStats = {
                            expertId: expertId,
                            name: payment.expert.name ?? '',
                            sDonvi: payment.expert.organization ?? '',
                            stk: payment.expert.bankAccountNumber ?? '',
                            tennganhang: payment.expert.bankName ?? '',
                            GVHD1Student: 0,
                            GVHD2Student: 0,
                            totalPayment: 0,
                        }
                        expertStatsMap.set(expertId, newStats)
                    }

                    newStats.totalPayment += paymentAmount

                    if (!countedExperts[expertId]) {
                        if (payment.description === '1' && expertId === project.supervisorId) {
                            newStats.GVHD1Student += 1
                        } else if (
                            payment.description === '2' &&
                            expertId === project.coSupervisorId
                        ) {
                            newStats.GVHD2Student += 1
                        }

                        countedExperts[expertId] = true
                    }
                }
            }
        }

        return Array.from(expertStatsMap.values())
    }
    const buttonList = [
        {
            id: 1,
            label: 'Phụ lục ds luận văn',
            onClick: () => defaultButtonClick(),
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
        },
        {
            id: 6,
            label: 'Phụ lục QĐHĐ',
            onClick: () => defaultButtonClick(),
        },
        {
            id: 6.1,
            label: 'Bản sao HDDGLV',
            onClick: () => defaultButtonClick(),
        },
        {
            id: 7,
            label: 'Đề xuất hội đồng',
            onClick: () => defaultButtonClick(),
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
        },

        {
            id: 12,
            label: 'Danh sách chuyên gia',
            onClick: () => defaultButtonClick(),
        },

        {
            id: 13,
            label: 'Thanh toán hướng dẫn',
            onClick: () => defaultButtonClick(),
        },
        {
            id: 13.1,
            label: 'Thanh toán hướng dẫn - Ngoài HV',
            onClick: () => defaultButtonClick(),
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
        },
        {
            id: 16,
            label: 'Thống kê KQ BV LV',
            onClick: () => defaultButtonClick(),
        },
        {
            id: 19,
            label: 'Danh sách nộp luận văn thư viện',
            onClick: () => defaultButtonClick(),
        },
        {
            id: 11,
            label: 'Thanh toán hội đồng bảo vệ',
            onClick: () => defaultButtonClick(),
        },
    ]
    const { mutateAsync: createThesisProject } = useCreateThesisProject()
    const { mutateAsync: createStudentThesisRegistration } = useCreateStudentThesisRegistration()
    const { mutateAsync: updateThesisProject } = useUpdateThesisProject()
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

    const { showSpinner, hideSpinner } = useSpinner()

    const { data: students, refetch } = useFindManyStudent(
        {
            where: {
                thesisRegistrations: {
                    some: {
                        thesisProject: {
                            thesisSessionId: thesisSessionSelected?.id ?? '',
                            // thesisType: ThesisType.THESIS,
                        },
                    },
                },
                fixedClassId: {
                    in: queryFixedClasses,
                },
            },
            include: {
                userProfile: true,
                fixedClass: {
                    include: {
                        trainingCourse: true,
                    },
                },
                trainingObjectType: true,
                thesisRegistrations: {
                    where: {
                        thesisProject: {
                            thesisSessionId: thesisSessionSelected?.id ?? '',
                            // thesisType: ThesisType.THESIS,
                        },
                    },
                    include: {
                        thesisProject: {
                            include: {
                                thesisSession: true,
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
    const { data: allStudents } = useFindManyStudent(
        {
            where: {
                thesisRegistrations: {
                    some: {
                        thesisProject: {
                            thesisSessionId: thesisSessionSelected?.id ?? '',
                        },
                    },
                },
                fixedClassId: {
                    in: queryFixedClasses,
                },
            },
            include: {
                userProfile: true,
                fixedClass: {
                    include: {
                        trainingCourse: true,
                        curriculumVersion: {
                            include: {
                                curriculum: {
                                    include: {
                                        trainingMajor: {
                                            include: { trainingField: true },
                                        },
                                        trainingObjectType: true,
                                    },
                                },
                            },
                        },
                    },
                },

                trainingObjectType: true,
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
                                supervisorPayments: {
                                    include: {
                                        expert: true,
                                    },
                                    orderBy: {
                                        description: 'asc',
                                    },
                                },
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
    const { data: countStudent, refetch: refetchCount } = useCountStudent(
        {
            where: {
                fixedClassId: {
                    in: queryFixedClasses,
                },
            },
        },
        {
            enabled: hasClickedFetch,
        }
    )
    const taodulieumau = async () => {
        showSpinner()
        setNeedAllStudents(true)
        const createPromises = allStudents?.map(async (student) => {
            const payload = {
                title: '',
                summary: '',
                titleEN: '',
                supervisor: {
                    connect: {
                        id: expertProfileData?.[0]?.id ?? '', // Kết nối bằng ID
                    },
                },

                organization: {
                    connect: {
                        Id: sDm_Donvi?.[0]?.Id ?? '',
                    },
                },
                maxStudents: 1,
                description: 'Ngôn ngữ: Tiếng Việt - Luận án/Đề án: Luận văn',
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
            await Promise.all(createPromises || [])
            message.success('Tạo dữ liệu mẫu thành công')
        } catch (error) {
            message.error('Đã xảy ra lỗi trong lúc tạo dữ liệu mẫu')
        } finally {
            hideSpinner()
        }
    }

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
                                            setTrainingCourseSelected([])
                                            setFixedClassesSelected([])
                                        }}
                                        placeholder="Chọn đợt xét"
                                    />
                                </Form.Item>
                                <Form.Item name="searchKhoaHoc" label="Khóa học" required>
                                    <Select
                                        className="w-36"
                                        mode="multiple"
                                        options={
                                            trainingCourses?.map((item) => ({
                                                label: item.name,
                                                value: item.id,
                                            })) || []
                                        }
                                        onChange={(value) => {
                                            setTrainingCourseSelected(value as string[])
                                        }}
                                        placeholder="Chọn khóa học"
                                        disabled={!thesisSessionSelected}
                                    />
                                </Form.Item>
                                <Form.Item name="searchText" label="Lớp học" required>
                                    <Select
                                        mode="multiple"
                                        className="w-36"
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
                                        placeholder="Chọn đơn vị quản lý"
                                        allowClear
                                        showSearch
                                        treeDefaultExpandAll
                                        treeData={treeData}
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
                                    {editingRowKeys.length > 0 ? (
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
                        className="w-full custom-scrollbar mt-2 "
                        rowKey="id"
                        columns={[
                            {
                                title: 'Đối tượng đào tạo',
                                width: 120,
                                render: (_, record) => {
                                    return record?.trainingObjectType?.name
                                },
                            },
                            {
                                title: 'Đợt xét',
                                width: 100,
                                render: (_, record) => {
                                    return (
                                        record?.thesisRegistrations?.[0]?.thesisProject
                                            ?.thesisSession?.name || ''
                                    )
                                },
                            },
                            {
                                title: 'Mã sinh viên',
                                width: 100,
                                render: (_, record) => {
                                    return record?.code
                                },
                            },
                            {
                                title: 'Họ tên',
                                width: 180,
                                dataIndex: 'name',
                                render: (_, record) => {
                                    return record?.userProfile?.fullname
                                },
                            },
                            {
                                title: 'Ngày sinh',
                                width: 130,
                                dataIndex: 'name',
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
                                render: (text: string, record: any) => {
                                    if (editingRowKeys.includes(record?.id)) {
                                        const currentValue =
                                            editingValues[record?.id]?.title !== undefined
                                                ? editingValues[record?.id]?.title
                                                : record?.thesisRegistrations?.[0]?.thesisProject
                                                      ?.title || ''

                                        return (
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
                                        )
                                    }
                                    return (
                                        record?.thesisRegistrations?.[0]?.thesisProject?.title || ''
                                    )
                                },
                            },
                            {
                                title: 'GVHD 1',
                                width: 150,
                                dataIndex: 'supervisor',
                                render: (text: string, record: any) => {
                                    if (editingRowKeys.includes(record?.id)) {
                                        const currentValue =
                                            editingValues[record?.id]?.supervisor !== undefined
                                                ? editingValues[record?.id]?.supervisor
                                                : record?.thesisRegistrations?.[0]?.thesisProject
                                                      ?.supervisor?.name || ''

                                        return (
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
                                render: (text: string, record: any) => {
                                    if (editingRowKeys.includes(record?.id)) {
                                        const currentValue =
                                            editingValues[record?.id]?.coSupervisor !== undefined
                                                ? editingValues[record?.id]?.coSupervisor
                                                : record?.thesisRegistrations?.[0]?.thesisProject
                                                      ?.coSupervisor?.name || ''

                                        return (
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
                                        )
                                    }
                                    return (
                                        record?.thesisRegistrations?.[0]?.thesisProject
                                            ?.coSupervisor?.name || ''
                                    )
                                },
                            },
                            {
                                title: 'Ngôn ngữ',
                                width: 100,
                                dataIndex: 'language',
                                render: (text: string, record: any) => {
                                    if (editingRowKeys.includes(record?.id)) {
                                        const currentValue =
                                            editingValues[record?.id]?.language !== undefined
                                                ? editingValues[record?.id]?.language
                                                : record?.thesisRegistrations?.[0]?.thesisProject?.description
                                                      ?.split('-')[0]
                                                      .trim()
                                                      .split(':')[1] || ''
                                        return (
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
                                        )
                                    }
                                    const data =
                                        record?.thesisRegistrations?.[0]?.thesisProject?.description
                                    return data ? data.split('-')[0].trim().split(':')[1] : ''
                                },
                            },
                            {
                                title: 'Luận văn/Đề án',
                                width: 130,
                                dataIndex: 'type',
                                render: (text: string, record: any) => {
                                    if (editingRowKeys.includes(record?.id)) {
                                        const currentValue =
                                            editingValues[record?.id]?.type !== undefined
                                                ? editingValues[record?.id]?.type
                                                : record?.thesisRegistrations?.[0]?.thesisProject?.description
                                                      ?.split('-')[1]
                                                      .trim()
                                                      .split(':')[1] || ''
                                        return (
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
                                        )
                                    }
                                    const data =
                                        record?.thesisRegistrations?.[0]?.thesisProject?.description
                                    return data ? data.split('-')[1].trim().split(':')[1] : ''
                                },
                            },
                            {
                                title: 'Trạng thái',
                                width: 100,
                                dataIndex: 'status',
                                render: (text: string, record: any) => {
                                    if (editingRowKeys.includes(record?.id)) {
                                        const currentValue =
                                            editingValues[record?.id]?.status !== undefined
                                                ? editingValues[record?.id]?.status
                                                : record?.thesisRegistrations?.[0]?.thesisProject
                                                      ?.status || ''
                                        return (
                                            <Select
                                                className="w-full"
                                                options={useThesisProjectStatusOptions().thesisProjectStatusOptions.map(
                                                    (item) => ({
                                                        label: item.label,
                                                        value: item.value,
                                                    })
                                                )}
                                                value={currentValue || ''}
                                                onChange={(value) =>
                                                    handleEditChange(record?.id, 'status', value)
                                                }
                                            />
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
                                width: 60,
                                align: 'center',
                                render: (_, record: any) => {
                                    if (record?.id) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                <DeleteIcon
                                                    className="text-sm text-red-700 cursor-pointer"
                                                    onClick={async () => {
                                                        const payload = {
                                                            deletedAt: new Date(),
                                                        }
                                                        try {
                                                            showSpinner()
                                                            await updateThesisProject({
                                                                data: payload,
                                                                where: {
                                                                    id: record?.id,
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

                                                <SettingsIcon
                                                    title="Cấu hình bảo vệ luận văn/Đề án"
                                                    className="text-sm text-yellow-700 cursor-pointer"
                                                    onClick={() => {
                                                        openModalCauHinhLuanVan({
                                                            thesisProjectId:
                                                                record?.thesisRegistrations?.[0]
                                                                    ?.thesisProject?.id,
                                                            thesisSessionId:
                                                                thesisSessionSelected?.id || '',
                                                        })
                                                    }}
                                                />
                                            </Row>
                                        )
                                    }
                                    return ''
                                },
                            },
                        ]}
                        // data={
                        //     students?.filter(
                        //         (item) =>
                        //             item?.thesisRegistrations?.[0]?.thesisProject?.thesisType ===
                        //             ThesisType.THESIS
                        //     ) || []
                        // }
                        data={students || []}
                        pagination={{
                            current: currentPage,
                            pageSize: numberOfPages,
                            total: countStudent || 0,
                            onChange: async (page, pageSize) => {
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
