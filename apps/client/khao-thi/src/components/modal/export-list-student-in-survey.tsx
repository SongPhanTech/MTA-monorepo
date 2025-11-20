import { DownloadOutlined } from '@ant-design/icons'
import { useFindManyUserProfile } from '@workspace/db/hooks'
import { Button, Flex } from 'antd'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

const ExportStudentInSurvey = ({ query, survey }: { query: any; survey?: any }) => {
    const { data } = useFindManyUserProfile(
        {
            where: { ...query },
            include: {
                educationAndTraining: {
                    include: {
                        subjectClassStudent: {
                            include: {
                                subjectClass: {
                                    include: {
                                        survey: {
                                            include: {
                                                surveySessions: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        fixedClass: {
                            include: {
                                trainingCourse: true,
                            },
                        },
                    },
                },
                surveySession: {
                    where: { surveyId: survey?.id },
                },
            },
            orderBy: {
                firstName: 'asc',
            },
        },
        {
            enabled: !!survey?.id,
        }
    )

    const exportTemplate = async () => {
        // Tạo workbook mới
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Danh sách người làm khảo sát')

        // Thiết lập style
        const golbalFontStyle = {
            name: 'Times New Roman',
        }

        const headerTitleStyle = {
            font: { ...golbalFontStyle, bold: true, size: 14 },
            alignment: {
                horizontal: 'center' as const,
                vertical: 'middle' as const,
                wrapText: true as const,
            },
        }

        const headerSubtitleStyle = {
            font: { ...golbalFontStyle, bold: true, size: 16 },
            alignment: {
                horizontal: 'center' as const,
                vertical: 'middle' as const,
                wrapText: true as const,
            },
        }

        const headerStyleNormal = {
            font: { ...golbalFontStyle, size: 14 },
            alignment: {
                horizontal: 'right' as const,
                vertical: 'middle' as const,
                wrapText: true as const,
            },
        }

        const tableHeaderStyle = {
            font: {
                ...golbalFontStyle,
                bold: true,
                size: 14,
                color: { argb: 'FF000000' },
            },
            fill: {
                type: 'pattern',
                pattern: 'none',
            },
            alignment: {
                horizontal: 'center',
                vertical: 'middle',
                wrapText: true,
            },
            border: {
                top: {
                    style: 'thin' as ExcelJS.BorderStyle,
                    color: { argb: 'FF000000' },
                },
                left: {
                    style: 'thin' as ExcelJS.BorderStyle,
                    color: { argb: 'FF000000' },
                },
                right: {
                    style: 'thin' as ExcelJS.BorderStyle,
                    color: { argb: 'FF000000' },
                },
                bottom: {
                    style: 'thin' as ExcelJS.BorderStyle,
                    color: { argb: 'FF000000' },
                },
            },
        }

        const dataCellStyle = {
            font: { ...golbalFontStyle, size: 14 },
            alignment: {
                horizontal: 'center' as const,
                vertical: 'middle' as const,
            },
            border: {
                top: {
                    style: 'thin' as ExcelJS.BorderStyle,
                    color: { argb: 'FF000000' },
                },
                left: {
                    style: 'thin' as ExcelJS.BorderStyle,
                    color: { argb: 'FF000000' },
                },
                right: {
                    style: 'thin' as ExcelJS.BorderStyle,
                    color: { argb: 'FF000000' },
                },
                bottom: {
                    style: 'thin' as ExcelJS.BorderStyle,
                    color: { argb: 'FF000000' },
                },
            },
        }

        worksheet.mergeCells('A1:D2')
        worksheet.getCell('A1').value = 'BỘ QUỐC PHÒNG\nHỌC VIỆN KỸ THUẬT QUÂN SỰ'
        worksheet.getCell('A1').style = headerTitleStyle

        worksheet.getRow(1).height = 30
        worksheet.getRow(2).height = 30

        worksheet.mergeCells('J1:R2')
        worksheet.getCell('J1').value =
            'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc'
        worksheet.getCell('J1').style = headerTitleStyle

        worksheet.mergeCells('A4:R4')
        worksheet.getCell('A4').value = `DANH SÁCH NGƯỜI LÀM KHẢO SÁT: ${survey?.name}`
        worksheet.getCell('A4').style = headerSubtitleStyle
        worksheet.getRow(4).height = 20

        worksheet.getCell('F5').value = 'Giảng viên:'
        worksheet.getCell('F5').style = headerSubtitleStyle

        worksheet.getCell('G5').value =
            `${survey?.lecture?.code} - ${survey?.lecture?.userProfile?.fullname}`
        worksheet.getCell('G5').style = headerSubtitleStyle

        worksheet.getCell('F6').value = 'Lớp môn học:'
        worksheet.getCell('F6').style = headerTitleStyle

        worksheet.getCell('G6').value =
            `${survey?.subjectClass?.code} - ${survey?.subjectClass?.name}`
        worksheet.getCell('G6').style = headerTitleStyle
        // Thêm tiêu đề bảng
        const headerRow = worksheet.getRow(11)
        headerRow.values = [
            'STT',
            'Mã học viên',
            'Họ và tên',
            'CCCD',
            'SĐT',
            'Lớp quản lý',
            'Khoá',
            'Trạng thái khảo sát',
        ]
        headerRow.eachCell((cell: any) => {
            cell.style = tableHeaderStyle
        })

        // Điều chỉnh độ rộng cột
        worksheet.columns = [
            { width: 10 },
            { width: 20 },
            { width: 40 },
            { width: 20 },
            { width: 20 },
            { width: 30 },
            { width: 30 },
            { width: 20 },
        ]
        if (data && data?.length > 0) {
            data.forEach((i: any, index: number) => {
                const headerRowValue: any = worksheet.getRow(12 + index)
                headerRowValue.values = [
                    index + 1,
                    i?.educationAndTraining?.length > 0 ? i?.educationAndTraining[0]?.code : '',
                    `${i?.lastName || ''} ${i?.firstName || ''}`,
                    i?.idCardNumber || '',
                    i?.phoneNumber || '',
                    i?.educationAndTraining?.length > 0
                        ? `${i?.educationAndTraining[0]?.fixedClass?.code || ''}-${i?.educationAndTraining[0]?.fixedClass?.name || ''}`
                        : '',
                    i?.educationAndTraining?.length > 0
                        ? `${i?.educationAndTraining[0]?.fixedClass?.trainingCourse?.name || ''}`
                        : '',
                    i?.surveySession ? 'Đã làm' : 'Chưa làm',
                ]
            })
        }

        // Xuất file
        const buffer = await workbook.xlsx.writeBuffer()
        saveAs(new Blob([buffer]), 'danh_sach_nguoi_lam_khao_sat.xlsx')
    }

    return (
        <Flex>
            <Button type="primary" onClick={exportTemplate} icon={<DownloadOutlined />}>
                Xuất file excel
            </Button>
        </Flex>
    )
}

export default ExportStudentInSurvey
