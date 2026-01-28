import { exportFromTemplate, type TableRow } from '@workspace/libs/template-excel'
import { getMinioUrl } from '@workspace/libs/utils'
import { dayjs } from '@workspace/ui'
import { CouncilRole } from '@workspace/db/client'
import type { ExcelTemplateBody } from '@workspace/libs/api/schemas'
import { excelTemplate } from '@workspace/libs/api/model'

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
    stt:number
    ngaybaove:string
    giobaove:string
    phongbaove:string
    tenhocvien:string
    chuyennganh:string
    tenchucdanh:string
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
        message.error('Không có dữ liệu để tạo giấy mời chấm LV PB');
        return;
    }
    try {
        showSpinner?.();
        const dataConvert = convertToGmcLvPbData(allStudentsInClasses);
        if (dataConvert.length === 0) {
            message.error('Không có dữ liệu để tạo giấy mời chấm LV PB');
            return;
        }
        const payload: ExcelTemplateBody = {
            fileName: 'GiayMoiChamLuanVan',
            path: 'GiayMoiChamLuanVan.xlsx',
            payload: dataConvert,
            showGridLines: true,
        };
        const response = await excelTemplate(payload);

        if (response.status !== 200) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại');
            return;
        }
        const blob = response.data;
        downloadFile(blob, 'GiayMoiChamLuanVan.xlsx');
        message.success('Xuất file thành công');
    } catch (error) {
        message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại');
    } finally {
        hideSpinner?.();
    }
};
const downloadFile = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}


 const convertToGmcLvPbData = (allStudentsInClasses: any[]): GmcLvPbData[] => {
    if (!allStudentsInClasses?.length) return [];

    const expertMap = new Map<string, GmcLvPbData>();
    
    const now = dayjs();
    const ngay = now.format('DD');
    const thang = now.format('MM');
    const nam = now.format('YYYY');

    allStudentsInClasses.forEach((student) => {
        const project = student?.thesisRegistrations?.[0]?.thesisProject;
        if (!project) return;

        const dotXet = project.thesisSession?.trainingCourse?.name || '';
        const ngaybaove = project.defenseDate ? dayjs(project.defenseDate).format('DD/MM/YYYY') : '';
        const giobaove = project.defenseSession?.startTime ? dayjs(project.defenseSession.startTime).format('HH:mm') : '';
        const phongbaove = project.room?.name || '';
        const tenhocvien = student.userProfile?.fullname || '';
        const chuyennganh = student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || '';

        const members = project.council?.members || [];
        members.forEach((member: any) => {
            const expert = member.expert;
            if (!expert?.id) return;

            if (!expertMap.has(expert.id)) {
                expertMap.set(expert.id,{
                    data: {
                        dotXet,
                        ngay,
                        thang,
                        nam,
                        tenThanhVien: expert.name || '',
                        data: []
                    }
                });
            }

            const expertEntry = expertMap.get(expert.id) as GmcLvPbData;

            let tenchucdanh = '';
            switch (member.role) {
                case CouncilRole.CHAIRMAN: tenchucdanh = 'Chủ tịch'; break;
                case CouncilRole.SECRETARY: tenchucdanh = 'Thư ký'; break;
                case CouncilRole.REVIEWER_1: tenchucdanh = 'Ủy viên, PB1'; break;
                case CouncilRole.REVIEWER_2: tenchucdanh = 'Ủy viên, PB2'; break;
                case CouncilRole.MEMBER: tenchucdanh = 'Ủy viên'; break;
                default: tenchucdanh = member.role;
            }

            expertEntry.data.data.push({
                stt: expertEntry.data.data.length + 1,
                ngaybaove,
                giobaove,
                phongbaove,
                tenhocvien,
                chuyennganh,
                tenchucdanh
            });
        });
    });

    return Array.from(expertMap.values());
};
