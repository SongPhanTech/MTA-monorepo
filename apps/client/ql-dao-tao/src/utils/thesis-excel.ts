import { CouncilRole, TrainingObjectTypes } from '@workspace/db/client'
import { excelTemplate } from '@workspace/libs/api/model'
import type { ExcelTemplateBody } from '@workspace/libs/api/schemas'
import { exportFromTemplate, type TableRow } from '@workspace/libs/template-excel'
import { getMinioUrl } from '@workspace/libs/utils'
import { dayjs } from '@workspace/ui'

interface ExportOptions {
    allStudentsInClasses: any[]
    showSpinner: () => void
    hideSpinner: () => void
    message: any // Antd message instance
}
interface GmcLvPbData {
    data: {
        dotXet: string
        ngay: string
        thang: string
        nam: string
        tenThanhVien: string
        data: GmcLvPbTable[]
    }
}
interface GmcLvPbTable {
    stt: number
    ngaybaove: string
    giobaove: string
    phongbaove: string
    tenhocvien: string
    chuyennganh: string
    tenchucdanh: string
}
interface TthdbvData {
    data: {
        ngay: string
        thang: string
        nam: string
        khoa: string
        dotXet: number
        chuyenNganh: string
        khoaQuanLi: string
        data: TthdbvTable[]
        tongTienBangSo: number
        tongTienBangChu: string
    }
}
interface TthdbvTable {
    stt: number
    thongTinBaoVe: string
    thongTinHoiDong: string
    thongTinThanhToan: string
    thongTinStk: string
    thongTinNganHang: string
}

interface DsnlvtvData {
    data: {
        khoa: string
        dotxet: string
        data: DsnlvtvTable[]
        tongSo: string
    }
}
interface DsnlvtvTable {
    stt: number
    thongTinBaoVe: string
    thongTinHuongDan: string
    thongTinDeTai: string
    thongTinLuuTru: string
}
interface ThongKeCbThamGiaHdData {
    data: {
        khoa: string
        chuyenNganh: string
        dotXet: string
        tong: number
        tongChuTich: number
        tongThuky: number
        tongUyVien: number
        tongPhanBien1: number
        tongPhanBien2: number
        data: ThongKeCbThamGiaHdTable[]
    }
}
interface ThongKeCbThamGiaHdTable {
    stt: number
    tenThanhVien: string
    donViQuanLi: string
    tongSo: number
    chuTich: number
    thuKi: number
    uyVien: number
    phanBien1: number
    phanBien2: number
}
interface ThanhToanHuongDanTrongHvData {
    data: {
        ngay: string
        thang: string
        nam: string
        khoa: string
        dotXet: string
        khoaQuanLy: string
        soHocVien: string
        data: ThanhToanHuongDanTrongHvTable[]
    }
}
interface ThanhToanHuongDanTrongHvTable {
    stt: number
    quyetDinh: string
    thongTinHuongDan: string
    thongTinBaoVe: string
    thongTinKhoa: number
    thongTinThanhToan: number
    thongTinStk: string
    thongTinBank: string
}

export const exportPhuLucDsLuanVan = async ({
    allStudentsInClasses,
    showSpinner,
    hideSpinner,
    message,
}: ExportOptions) => {
    showSpinner()
    if (!allStudentsInClasses?.length) {
        message.error('Không có dữ liệu để xuất phụ lục danh sách luận văn')
        hideSpinner()
        return
    }

    try {
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
        await exportFromTemplate({
            templateUrl: getMinioUrl('mta/template/phulucluanvanthacsi.xlsx'),
            sheets: [
                {
                    sheet: 'phulucluanvanthacsi',
                    rows: [...dataRows, gapRow, totalRow],
                    tableStartCell: { row: 7, col: 1 },
                    data: { dotxet: dotxet || '' },
                },
            ],
            fileName: 'PhuLucDsLuanVan',
        })
        message.success('Xuất file thành công')
    } catch (error) {
        message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
    } finally {
        hideSpinner()
    }
}
export const getExpertSupervisionStats = (allStudentsInClasses: any[]) => {
    if (!allStudentsInClasses || allStudentsInClasses.length === 0) {
        return []
    }

    const expertStatsMap = new Map<string, any>()

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
export const exportThongKeCbHdlv = async ({
    allStudentsInClasses,
    showSpinner,
    hideSpinner,
    message,
}: ExportOptions) => {
    if (!allStudentsInClasses?.length) {
        message.error('Không có dữ liệu để tạo thống kê cán bộ hướng dẫn LV')
        return
    }
    showSpinner()
    const dataMapping = getExpertSupervisionStats(allStudentsInClasses)
    const ngayhientai = dayjs().format('DD/MM/YYYY')
    const ngay = ngayhientai.split('/')[0]
    const thang = ngayhientai.split('/')[1]
    const nam = ngayhientai.split('/')[2]
    const tendot =
        allStudentsInClasses?.length > 0
            ? allStudentsInClasses[0]?.thesisRegistrations?.[0]?.thesisProject?.thesisSession?.name
            : ''

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
                        tendot: tendot || '',
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
export const exportDanhSachBaoVe = async ({
    allStudentsInClasses,
    showSpinner,
    hideSpinner,
    message,
}: ExportOptions) => {
    if (!allStudentsInClasses?.length) {
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
                                student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
                                    ?.name || '',
                            border: true,
                            align: 'center',
                        },
                        {
                            value:
                                student?.fixedClass?.trainingCourse?.trainingObjectType?.name || '',
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
                                      student?.thesisRegistrations?.[0]?.thesisProject?.defenseDate
                                  ).format('DD/MM/YYYY')
                                : '',
                            border: true,
                            align: 'center',
                        },
                        {
                            value: student?.thesisRegistrations?.[0]?.thesisProject?.defenseSession
                                ?.startTime
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
                                student?.thesisRegistrations?.[0]?.thesisProject?.room?.name || '',
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
        const dotxet =
            allStudentsInClasses?.length > 0
                ? allStudentsInClasses[0]?.thesisRegistrations?.[0]?.thesisProject?.thesisSession
                      ?.name
                : ''
        await exportFromTemplate({
            templateUrl: getMinioUrl('mta/template/DanhSachBaoVe.xlsx'),
            sheets: [
                {
                    sheet: 'DanhSachBaoVe',
                    rows: [...row, gapRow, totalRow],
                    tableStartCell: { row: 7, col: 1 },
                    data: {
                        dotxet: dotxet || '',
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
export const exportHosobvlv = async ({
    allStudentsInClasses,
    showSpinner,
    hideSpinner,
    message,
}: ExportOptions) => {
    if (!allStudentsInClasses?.length) {
        message.error('Không có dữ liệu để tạo danh sách bảo vệ LV dán PBV')
        return
    }
    showSpinner()
    try {
        const allSheetOptions = allStudentsInClasses?.map((student) => {
            const thanhvienhoidong =
                student?.thesisRegistrations?.[0]?.thesisProject?.council?.members
            const phanbien1 = thanhvienhoidong?.find(
                (member: any) => member.role === CouncilRole.REVIEWER_1
            )
            const phanbien2 = thanhvienhoidong?.find(
                (member: any) => member.role === CouncilRole.REVIEWER_2
            )
            const chutich = thanhvienhoidong?.find(
                (member: any) => member.role === CouncilRole.CHAIRMAN
            )
            const thuky = thanhvienhoidong?.find(
                (member: any) => member.role === CouncilRole.SECRETARY
            )
            const uyvien = thanhvienhoidong?.find(
                (member: any) => member.role === CouncilRole.MEMBER
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
                    student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || '',
                nganh:
                    student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.trainingField
                        ?.name || '',
                detai: student?.thesisRegistrations?.[0]?.thesisProject?.title || '',
                ngaybaove: student?.thesisRegistrations?.[0]?.thesisProject?.defenseDate
                    ? dayjs(student?.thesisRegistrations?.[0]?.thesisProject?.defenseDate).format(
                          'DD/MM/YYYY'
                      )
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
export const exportGiayMoiHdlv = async ({
    allStudentsInClasses,
    showSpinner,
    hideSpinner,
    message,
}: ExportOptions) => {
    if (!allStudentsInClasses?.length) {
        message.error('Không có dữ liệu đế tạo giấy mời HDLV')
        return
    }
    showSpinner()
    const presentDay = dayjs().format('DD/MM/YYYY')
    const ngay = presentDay.split('/')[0]
    const thang = presentDay.split('/')[1]
    const nam = presentDay.split('/')[2]
    try {
        const allSheetOptions = allStudentsInClasses?.map((student) => {
            const supervisor = student?.thesisRegistrations?.[0]?.thesisProject?.supervisor?.name
            const data = {
                ngay: ngay,
                thang: thang,
                nam: nam,
                tenhocvien: student?.userProfile?.fullname,
                tenhuongdan: supervisor ? ` ${supervisor}` : '',
                khoa: student?.fixedClass?.trainingCourse?.name || '',
                chuyennganh:
                    student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || '',
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
export const exportSaoQDHDLV = async ({
    allStudentsInClasses,
    showSpinner,
    hideSpinner,
    message,
}: ExportOptions) => {
    if (!allStudentsInClasses?.length) {
        message.error('Không có dữ liệu đế tạo sao QĐ HDLV')
        return
    }
    showSpinner()
    const presentDay = dayjs().format('DD/MM/YYYY')
    const ngayQD = presentDay.split('/')[0]
    const thangQD = presentDay.split('/')[1]
    const namQD = presentDay.split('/')[2]
    try {
        const allSheetOptions = allStudentsInClasses?.map((student) => {
            const supervisor = student?.thesisRegistrations?.[0]?.thesisProject?.supervisor?.name
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
                    student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || '',
                nganh:
                    student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.trainingField
                        ?.name || '',
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
        message.error('Vui lòng kiểm tra lại dữ liệu')
    } finally {
        hideSpinner()
    }
}
export const exportKiemTraTienDo = async ({
    allStudentsInClasses,
    showSpinner,
    hideSpinner,
    message,
}: ExportOptions) => {
    if (!allStudentsInClasses?.length) {
        message.error('Không có dữ liệu để tạo kiểm tra tiến độ')
        return
    }
    showSpinner()
    try {
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
        const result = Array.from(organizationMap.values())
        if (result.length === 0) {
            message.error('Không có dữ liệu để xuất phụ lục danh sách luận văn')
            hideSpinner()
            return
        }
        let count = 1
        const dataRows: TableRow[] = result.flatMap((item: any, index: number) => {
            const orgRow: TableRow = {
                cells: [
                    {
                        value: `${index + 1}.  - ${item.sTen}`,
                        border: true,
                        align: 'center',
                        colSpan: 5,
                        bold: true,
                    },
                ],
            }
            const thesisRows: TableRow[] = item.thesisProject.map((thesis: any, index: number) => {
                count++
                return {
                    cells: [
                        { value: index + 1, border: true, align: 'center' },
                        {
                            value: `${thesis.hovatenhocvien}\n${thesis.ngaysinh}\n${thesis.doituongdaotao}-${thesis.khoa}`,
                            border: true,
                            align: 'left',
                        },
                        { value: `${thesis.tendetai}`, border: true, align: 'left' },
                        {
                            value: '',
                            border: true,
                            align: 'left',
                        },
                        { value: '', border: true, align: 'center' },
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
                    colSpan: 5,
                    border: false,
                },
            ],
        }
        const signRow: TableRow = {
            cells: [
                { value: '', border: false, align: 'center' },
                { value: '', border: false, align: 'center' },
                { value: '', border: false, align: 'center' },
                {
                    value: 'Chủ nhiệm khoa/viện trường'.toUpperCase(),
                    colSpan: 2,
                    border: false,
                    bold: true,
                    align: 'center',
                },
            ],
        }
        const signRow2: TableRow = {
            cells: [
                { value: '', border: false, align: 'center' },
                { value: '', border: false, align: 'center' },
                { value: '', border: false, align: 'center' },
                { value: '(Ký và ghi rõ họ tên)', colSpan: 2, border: false, align: 'center' },
            ],
        }
        await exportFromTemplate({
            templateUrl: getMinioUrl('mta/template/KiemTraTienDoLuanVan.xlsx'),
            sheets: [
                {
                    sheet: 'Detai',
                    rows: [...dataRows, gapRow, totalRow, gapRow, signRow, signRow2],
                    tableStartCell: { row: 8, col: 1 },
                    data: { dotxet: dotxet.toUpperCase() || '' },
                },
            ],
            fileName: 'KiemTraTienDoLuanVan',
        })
        message.success('Xuất file thành công')
    } catch (error) {
        message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
    } finally {
        hideSpinner()
    }
}
export const exportGiayMoiChamLvPb = async ({
    allStudentsInClasses,
    showSpinner,
    hideSpinner,
    message,
}: ExportOptions) => {
    if (!allStudentsInClasses?.length) {
        message.error('Không có dữ liệu để tạo giấy mời chấm LV PB')
        return
    }
    try {
        showSpinner?.()
        const dataConvert = convertToGmcLvPbData(allStudentsInClasses)
        if (dataConvert.length === 0) {
            message.error('Không có dữ liệu để tạo giấy mời chấm LV PB')
            return
        }
        const payload: ExcelTemplateBody = {
            head: { data: null },
            tail: { data: null },
            fileName: 'GiayMoiChamLuanVan',
            path: 'GiayMoiChamLuanVan.xlsx',
            payload: dataConvert,
            showGridLines: true,
        }
        const response = await excelTemplate(payload)

        if (response.status !== 200) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
            return
        }
        const blob = response.data
        downloadFile(blob, 'GiayMoiChamLuanVan.xlsx')
        message.success('Xuất file thành công')
    } catch (error) {
        message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
    } finally {
        hideSpinner?.()
    }
}
const downloadFile = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}
const convertToGmcLvPbData = (allStudentsInClasses: any[]): GmcLvPbData[] => {
    if (!allStudentsInClasses?.length) return []

    const expertMap = new Map<string, GmcLvPbData>()

    const now = dayjs()
    const ngay = now.format('DD')
    const thang = now.format('MM')
    const nam = now.format('YYYY')

    allStudentsInClasses.forEach((student) => {
        const project = student?.thesisRegistrations?.[0]?.thesisProject
        if (!project) return

        const dotXet = project.thesisSession?.trainingCourse?.name || ''
        const ngaybaove = project.defenseDate ? dayjs(project.defenseDate).format('DD/MM/YYYY') : ''
        const giobaove = project.defenseSession?.startTime
            ? dayjs(project.defenseSession.startTime).format('HH:mm')
            : ''
        const phongbaove = project.room?.name || ''
        const tenhocvien = student.userProfile?.fullname || ''
        const chuyennganh =
            student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || ''

        const members = project.council?.members || []
        members.forEach((member: any) => {
            const expert = member.expert
            if (!expert?.id) return

            if (!expertMap.has(expert.id)) {
                expertMap.set(expert.id, {
                    data: {
                        dotXet,
                        ngay,
                        thang,
                        nam,
                        tenThanhVien: expert.name || '',
                        data: [],
                    },
                })
            }

            const expertEntry = expertMap.get(expert.id) as GmcLvPbData

            let tenchucdanh = ''
            switch (member.role) {
                case CouncilRole.CHAIRMAN:
                    tenchucdanh = 'Chủ tịch'
                    break
                case CouncilRole.SECRETARY:
                    tenchucdanh = 'Thư ký'
                    break
                case CouncilRole.REVIEWER_1:
                    tenchucdanh = 'Ủy viên, PB1'
                    break
                case CouncilRole.REVIEWER_2:
                    tenchucdanh = 'Ủy viên, PB2'
                    break
                case CouncilRole.MEMBER:
                    tenchucdanh = 'Ủy viên'
                    break
                default:
                    tenchucdanh = member.role
            }

            expertEntry.data.data.push({
                stt: expertEntry.data.data.length + 1,
                ngaybaove,
                giobaove,
                phongbaove,
                tenhocvien,
                chuyennganh,
                tenchucdanh,
            })
        })
    })

    return Array.from(expertMap.values())
}

export const exportThanhToanHoiDongBaoVe = async ({
    allStudentsInClasses,
    showSpinner,
    hideSpinner,
    message,
}: ExportOptions) => {
    if (!allStudentsInClasses?.length) {
        message.error('Không có dữ liệu để tạo thanh toán hội đồng bảo vệ')
        return
    }
    try {
        showSpinner?.()
        const dataConvert = convertToTthdbvData(allStudentsInClasses)
        if (dataConvert.length === 0) {
            message.error('Chưa có dữ liệu để tạo thanh toán hội đồng bảo vệ')
            return
        }
        const payload: ExcelTemplateBody = {
            head: { data: null },
            tail: { data: null },
            fileName: 'ThanhToanHoiDongBaoVe',
            path: 'ThanhToanHoiDongBV.xlsx',
            payload: dataConvert,
            showGridLines: true,
        }
        const response = await excelTemplate(payload)
        if (response.status !== 200) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
            return
        }
        const blob = response.data
        downloadFile(blob, 'ThanhToanHoiDongBaoVe.xlsx')
        message.success('Xuất file thành công')
    } catch (error) {
        message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        return
    } finally {
        hideSpinner?.()
    }
}
const tenDoiTuong = {
    [TrainingObjectTypes.MILITARY]: { fullname: 'Quân sự', shortname: 'QS' },
    [TrainingObjectTypes.CIVILIAN]: { fullname: 'Dân sự', shortname: 'DS' },
    [TrainingObjectTypes.INTERNATIONAL_MILITARY]: {
        fullname: 'Quân sự quốc tế',
        shortname: 'QSQT',
    },
}
export const convertToTthdbvData = (allStudentsInClasses: any[]): TthdbvData[] => {
    if (!allStudentsInClasses?.length) return []

    const now = dayjs()

    const majorMap = new Map<string, any[]>()
    let khoaquanli = ''

    allStudentsInClasses.forEach((student) => {
        const project = student?.thesisRegistrations?.[0]?.thesisProject
        const council = project?.council?.members
        if (!project || !council?.length) return

        const majorName =
            student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || ''
        if (!khoaquanli) {
            khoaquanli =
                student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.organization
                    ?.sTen || ''
        }

        const dob = student.userProfile?.dateOfBirth
            ? dayjs(student.userProfile.dateOfBirth).format('DD/MM/YYYY')
            : ''
        const doiTuong = student?.fixedClass?.trainingCourse?.trainingObjectType?.type
        const loaiDoiTuong = tenDoiTuong[doiTuong as keyof typeof tenDoiTuong]?.fullname || ''
        const khoaHoc = student?.fixedClass?.trainingCourse?.name || ''
        const chuyenNganhCode =
            student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || ''
        const ngayBV = project.defenseDate ? dayjs(project.defenseDate).format('DD/MM/YYYY') : ''

        const thongTinBaoVe = `${student.userProfile?.fullname || ''}\nNgày sinh: ${dob}\nĐối tượng: ${loaiDoiTuong}, ${khoaHoc}\nChuyên ngành: ${chuyenNganhCode}\nNgày BV: ${ngayBV}`

        const members = project.council?.members || []
        const sortedMembers = [...members].sort((a, b) => {
            const roleOrder = {
                [CouncilRole.CHAIRMAN]: 1,
                [CouncilRole.SECRETARY]: 2,
                [CouncilRole.REVIEWER_1]: 3,
                [CouncilRole.REVIEWER_2]: 4,
                [CouncilRole.MEMBER]: 5,
            }
            return (
                (roleOrder[a.role as keyof typeof roleOrder] || 99) -
                (roleOrder[b.role as keyof typeof roleOrder] || 99)
            )
        })

        const hdLines: string[] = []
        const ttLines: string[] = []
        const stkLines: string[] = []
        const nhLines: string[] = []
        let studentTotal = 0

        sortedMembers.forEach((m: any) => {
            const expert = m.expert
            let rolePrefix = 'UV'
            let roleSuffix = ''

            if (m.role === CouncilRole.CHAIRMAN) rolePrefix = 'CT'
            else if (m.role === CouncilRole.SECRETARY) rolePrefix = 'TK'
            else if (m.role === CouncilRole.REVIEWER_1) roleSuffix = ', PB1'
            else if (m.role === CouncilRole.REVIEWER_2) roleSuffix = ', PB2'

            const org = expert?.organization ? `, ${expert.organization}` : ''
            const name = expert?.lecturerId ? expert?.lecturer?.userProfile?.fullname : expert?.name
            hdLines.push(`${rolePrefix}: ${name || ''}${org}${roleSuffix}`)

            const rawAmount = Number(m.payment?.amount || 0)
            studentTotal += rawAmount
            ttLines.push(rawAmount.toLocaleString('vi-VN').replace(/\./g, ' '))
            const bankNumber = expert?.lecturerId
                ? expert?.lecturer?.userProfile?.bankAccountNumber
                : expert?.bankAccountNumber
            stkLines.push(bankNumber || '')
            const bankName = expert?.lecturerId
                ? expert?.lecturer?.userProfile?.bankName
                : expert?.bankName
            nhLines.push(bankName || '')
        })

        const tableRow = {
            thongTinBaoVe,
            thongTinHoiDong: hdLines.join('\n'),
            thongTinThanhToan: ttLines.join('\n'),
            thongTinStk: stkLines.join('\n'),
            thongTinNganHang: nhLines.join('\n'),
            rawAmount: studentTotal,
        }

        if (!majorMap.has(majorName)) majorMap.set(majorName, [])
        majorMap.get(majorName)?.push(tableRow)
    })

    return Array.from(majorMap.entries()).map(([majorName, items]) => {
        const firstItem = allStudentsInClasses.find(
            (s) => s.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name === majorName
        )
        const project = firstItem?.thesisRegistrations?.[0]?.thesisProject

        const dotXet = project?.thesisSession?.name || ''

        const tongTienSo = items.reduce((acc, curr) => {
            return acc + (Number(curr.rawAmount) || 0)
        }, 0)

        return {
            data: {
                ngay: now.format('DD'),
                thang: now.format('MM'),
                nam: now.format('YYYY'),
                khoa: firstItem?.fixedClass?.trainingCourse?.name || '',
                dotXet: dotXet,
                chuyenNganh: majorName,
                khoaQuanLi: khoaquanli,
                tongTienBangSo: tongTienSo,
                tongTienBangChu: Number(tongTienSo).toVndWord('đồng'),
                data: items.map((item, index) => ({
                    stt: index + 1,
                    thongTinBaoVe: item.thongTinBaoVe,
                    thongTinHoiDong: item.thongTinHoiDong,
                    thongTinThanhToan: item.thongTinThanhToan,
                    thongTinStk: item.thongTinStk,
                    thongTinNganHang: item.thongTinNganHang,
                })),
            },
        }
    })
}
export const exportDanhSachNopLuanVanThuVien = async ({
    allStudentsInClasses,
    showSpinner,
    hideSpinner,
    message,
}: ExportOptions) => {
    if (!allStudentsInClasses?.length) {
        message.error('Không có dữ liệu để xuất danh sách nộp luận văn thư viện')
        return
    }
    const dataConvert = convertToDsnlvtvData(allStudentsInClasses)
    if (dataConvert.data.data.length === 0) {
        message.error('Chưa có dữ liệu để xuất danh sách nộp luận văn thư viện')
        return
    }
    try {
        showSpinner?.()
        //TODO : sửa lại payload
        const payload: ExcelTemplateBody = {
            head: { data: null },
            tail: { data: null },
            fileName: 'DanhSachNopLuanVanThuVien',
            path: 'DanhSachNopLuanVanThuVien.xlsx',
            payload: [dataConvert],
            showGridLines: true,
            wrapText: true,
        }
        const response = await excelTemplate(payload)
        if (response.status !== 200) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        const blob = response.data
        downloadFile(blob, 'DanhSachNopLuanVanThuVien.xlsx')
        message.success('Xuất file thành công')
    } catch (error) {
        message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        return
    } finally {
        hideSpinner?.()
    }
}
const convertToDsnlvtvData = (allStudentsInClasses: any[]): DsnlvtvData => {
    if (!allStudentsInClasses?.length) {
        return {
            data: {
                khoa: '',
                dotxet: '',
                data: [],
                tongSo: '0',
            },
        }
    }

    const firstProject = allStudentsInClasses.find((s) => s.thesisRegistrations?.[0]?.thesisProject)
        ?.thesisRegistrations[0].thesisProject

    const tableData: DsnlvtvTable[] = allStudentsInClasses.map((student, index) => {
        const project = student?.thesisRegistrations?.[0]?.thesisProject

        const hoTen = student.userProfile?.fullname || ''
        const doiTuong = student?.fixedClass?.trainingCourse?.trainingObjectType?.name || ''
        const khoaHoc = student?.fixedClass?.trainingCourse?.name || ''
        const chuyenNganh =
            student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || ''

        const thongTinBaoVe = `${hoTen} \n ${doiTuong} - ${khoaHoc} - ${chuyenNganh}`

        const gvhd1 = project?.supervisor?.name
        const gvhd2 = project?.coSupervisor?.name

        let thongTinHuongDan = ''
        if (gvhd1 && gvhd2) {
            thongTinHuongDan = `1.${gvhd1};\n2.${gvhd2}.`
        } else {
            thongTinHuongDan = gvhd1 || gvhd2 || 'Chưa có GVHD'
        }

        const thongTinDeTai = project?.title || 'Chưa có tên đề tài'

        //TODO: Thông tin Lưu trữ
        const lib = ''
        const thongTinLuuTru = lib

        return {
            stt: index + 1,
            thongTinBaoVe,
            thongTinHuongDan,
            thongTinDeTai,
            thongTinLuuTru,
        }
    })

    return {
        data: {
            khoa: allStudentsInClasses[0]?.fixedClass?.trainingCourse?.name || '',
            dotxet: firstProject?.thesisSession?.name || '',
            data: tableData,
            tongSo: tableData.length.toString(),
        },
    }
}
export const exportThongKeCbThamGiaHd = async ({
    allStudentsInClasses,
    showSpinner,
    hideSpinner,
    message,
}: ExportOptions) => {
    if (!allStudentsInClasses?.length) {
        message.error('Không có dữ liệu để xuất thống kê cán bộ tham gia HĐ')
        return
    }
    try {
        showSpinner?.()
        const dataConvert = convertToThongKeCbThamGiaHdData(allStudentsInClasses)
        if (dataConvert.length === 0) {
            message.error('Chưa có dữ liệu để xuất thống kê cán bộ tham gia HĐ')
            return
        }
        const payload: ExcelTemplateBody = {
            head: { data: null },
            tail: { data: null },
            fileName: 'ThongKeCbThamGiaHd',
            path: 'ThongKeCanBoHoiDong.xlsx',
            payload: dataConvert,
            showGridLines: true,
            wrapText: true,
        }
        const response = await excelTemplate(payload)
        if (response.status !== 200) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
            return
        }
        const blob = response.data
        downloadFile(blob, 'ThongKeCbThamGiaHd.xlsx')
        message.success('Xuất file thành công')
    } catch (error) {
        message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
    } finally {
        hideSpinner?.()
    }
}
export const convertToThongKeCbThamGiaHdData = (
    allStudentsInClasses: any[]
): ThongKeCbThamGiaHdData[] => {
    if (!allStudentsInClasses || allStudentsInClasses.length === 0) return []

    const majorMap = new Map<string, any[]>()
    allStudentsInClasses.forEach((student) => {
        const majorName =
            student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name ||
            'Chưa xác định'
        if (!majorMap.has(majorName)) {
            majorMap.set(majorName, [])
        }
        majorMap.get(majorName)?.push(student)
    })

    const result: ThongKeCbThamGiaHdData[] = []

    majorMap.forEach((students, majorName) => {
        const expertStats = new Map<string, ThongKeCbThamGiaHdTable>()

        let totalParticipations = 0
        let totalCT = 0
        let totalTK = 0
        let totalUV = 0
        let totalPB1 = 0
        let totalPB2 = 0

        students.forEach((student) => {
            const project = student.thesisRegistrations?.[0]?.thesisProject
            if (!project || !project.council) return

            project.council.members.forEach((member: any) => {
                const expert = member.expert
                const name = expert.lecturer ? expert.lecturer.userProfile?.fullname : expert.name
                const donViQuanLi = expert.lecturer
                    ? expert.lecturer.organization
                    : expert.organization
                if (!expert?.id) return

                if (!expertStats.has(expert.id)) {
                    expertStats.set(expert.id, {
                        stt: 0,
                        tenThanhVien: name || '',
                        donViQuanLi: expert.organization || '',
                        tongSo: 0,
                        chuTich: 0,
                        thuKi: 0,
                        uyVien: 0,
                        phanBien1: 0,
                        phanBien2: 0,
                    })
                }

                // biome-ignore lint/style/noNonNullAssertion: id của export luôn có
                const stats = expertStats.get(expert.id)!
                stats.tongSo++
                totalParticipations++

                switch (member.role) {
                    case CouncilRole.CHAIRMAN:
                        stats.chuTich++
                        totalCT++
                        break
                    case CouncilRole.SECRETARY:
                        stats.thuKi++
                        totalTK++
                        break
                    case CouncilRole.REVIEWER_1:
                        stats.phanBien1++
                        totalPB1++
                        break
                    case CouncilRole.REVIEWER_2:
                        stats.phanBien2++
                        totalPB2++
                        break
                    case CouncilRole.MEMBER:
                        stats.uyVien++
                        totalUV++
                        break
                }
            })
        })

        const tableRows = Array.from(expertStats.values())
        tableRows.forEach((row, index) => {
            row.stt = index + 1
        })

        const firstStudent = students[0]
        const project = firstStudent.thesisRegistrations?.[0]?.thesisProject

        result.push({
            data: {
                khoa: firstStudent.fixedClass?.trainingCourse?.name || '',
                chuyenNganh: majorName,
                dotXet: project?.thesisSession?.name || '',
                tong: totalParticipations,
                tongChuTich: totalCT,
                tongThuky: totalTK,
                tongUyVien: totalUV,
                tongPhanBien1: totalPB1,
                tongPhanBien2: totalPB2,
                data: tableRows,
            },
        })
    })

    return result
}
export const exportThanhToanHuongDanTrongHv = async ({
    allStudentsInClasses,
    showSpinner,
    hideSpinner,
    message,
}: ExportOptions) => {
    if (!allStudentsInClasses?.length) {
        message.error('Không có dữ liệu để xuất thanh toán hướng dẫn')
        return []
    }
    try {
        showSpinner?.()
        const dataConvert = convertToThanhToanHuongDanTrongHvData(allStudentsInClasses)
        if (dataConvert.length === 0) {
            message.error('Chưa có dữ liệu để xuất thanh toán hướng dẫn')
            return []
        }
        const payload: ExcelTemplateBody = {
            head: { data: null },
            tail: { data: null },
            fileName: 'ThanhToanHuongDanTrongHv',
            path: 'ThanhToanHuongDanTrongHV.xlsx',
            payload: dataConvert,
            showGridLines: true,
            wrapText: true,
        }
        const response = await excelTemplate(payload)
        if (response.status !== 200) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
            return []
        }
        const blob = response.data
        downloadFile(blob, 'ThanhToanHuongDanTrongHv.xlsx')
        message.success('Xuất file thành công')
    } catch (error) {
        message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
    } finally {
        hideSpinner?.()
    }
}
export const convertToThanhToanHuongDanTrongHvData = (
    allStudentsInClasses: any[]
): ThanhToanHuongDanTrongHvData[] => {
    if (!allStudentsInClasses?.length) {
        return []
    }

    const now = dayjs()
    const organizationMap = new Map<string, ThanhToanHuongDanTrongHvData>()

    allStudentsInClasses.forEach((student) => {
        const project = student?.thesisRegistrations?.[0]?.thesisProject
        if (!project) return

        const orgName = project.organization?.sTen || 'Chưa có đơn vị'

        if (!organizationMap.has(orgName)) {
            organizationMap.set(orgName, {
                data: {
                    ngay: now.format('DD'),
                    thang: now.format('MM'),
                    nam: now.format('YYYY'),
                    khoa: student.fixedClass?.trainingCourse?.name || '',
                    dotXet: project.thesisSession?.name || '',
                    khoaQuanLy: orgName,
                    soHocVien: '0',
                    data: [],
                },
            })
        }

        // biome-ignore lint/style/noNonNullAssertion: orgName luôn có
        const currentGroup = organizationMap.get(orgName)!

        const qdNum = project.thesisSession?.defenseDecisionNumber || '....'
        const qdDate = project.thesisSession?.defenseDecisionDate
            ? dayjs(project.thesisSession.defenseDecisionDate).format('DD/MM/YYYY')
            : '.../.../....'
        const quyetDinh = `${qdNum} \n ngày ${qdDate}`

        const gv1 = project.supervisor?.name
        const gv2 = project.coSupervisor?.name
        let thongTinHuongDan = ''
        if (gv1 && gv2) {
            thongTinHuongDan = `1. ${gv1}\n2. ${gv2}`
        } else {
            thongTinHuongDan = gv1 || gv2 || 'Chưa có GVHD'
        }

        const loaiDoiTuong = student.fixedClass?.trainingCourse?.trainingObjectType?.type || ''
        const shortDoiTuong = tenDoiTuong[loaiDoiTuong as keyof typeof tenDoiTuong]?.shortname || ''
        const tenKhoa = student.fixedClass?.trainingCourse?.name || ''
        const thongTinKhoaStr = `${shortDoiTuong} - ${tenKhoa}`

        const amount1 = Number(project.supervisorPayment?.amount || 0)
        const amount2 = Number(project.coSupervisorPayment?.amount || 0)
        const tongThanhToan = amount1 + amount2

        const stk1 = project.supervisor?.bankAccountNumber || ''
        const stk2 = project.coSupervisor?.bankAccountNumber || ''
        const bank1 = project.supervisor?.bankName || ''
        const bank2 = project.coSupervisor?.bankName || ''

        currentGroup.data.data.push({
            stt: currentGroup.data.data.length + 1,
            quyetDinh: quyetDinh,
            thongTinHuongDan: thongTinHuongDan,
            thongTinBaoVe: student.userProfile?.fullname || '',
            thongTinKhoa: thongTinKhoaStr as any,
            thongTinThanhToan: tongThanhToan,
            thongTinStk: gv1 && gv2 ? `${stk1}\n${stk2}` : stk1 || stk2,
            thongTinBank: gv1 && gv2 ? `${bank1}\n${bank2}` : bank1 || bank2,
        })

        currentGroup.data.soHocVien = currentGroup.data.data.length.toString()
    })

    return Array.from(organizationMap.values())
}
