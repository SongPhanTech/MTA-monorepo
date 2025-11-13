import { DownloadOutlined } from '@ant-design/icons'
import { useFindManySurvey } from '@workspace/db/hooks'
import { Button, Flex } from 'antd'
import dayjs from 'dayjs'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

const ExportLecturerInSurvey = ({ query, surveyName }: { query:any ; surveyName: string }) => {
    const { data } = useFindManySurvey({
        where: { ...query },
              include: {
                clusterSurvey: true,
                surveyObjectType: true,
                lecture: {
                    include: {
                        userProfile: true,
                        organization: true,
                    },
                },
                subjectClass: {
                    include: {
                        subjectClassStudent: {
                            include: {
                                student: true,
                            },
                        },
                        subject: true,
                    },
                },
                surveyQuestion: true,
                surveySessions: true,
            },
            orderBy: { createdAt: 'desc' },
    })

    const exportTemplate = async () => {
        // Tạo workbook mới
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Danh sách bài khảo sát')

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
        worksheet.getCell('A4').value = `Danh sách bài khảo sát: ${surveyName}`
        worksheet.getCell('A4').style = headerSubtitleStyle
        worksheet.getRow(4).height = 20

        // Thêm tiêu đề bảng
        const headerRow = worksheet.getRow(11)
        headerRow.values = [
            'STT',
            'Lớp môn học',
            'Giảng viên',
            'CCCD',
            'SĐT',
            'Đơn vị quản lý',
            'Ngày bắt đầu',
            'Ngày kết thúc',
        ]
        headerRow.eachCell((cell: any) => {
            cell.style = tableHeaderStyle
        })

        // Điều chỉnh độ rộng cột
        worksheet.columns = [
            { width: 10 },
            { width: 40 },
            { width: 40 },
            { width: 20 },
            { width: 20 },
            { width: 20 },
            { width: 20 },
            { width: 20 },
        ]
        if (data && data?.length > 0) {
            data.forEach((i: any, index: number) => {
                const headerRowValue: any = worksheet.getRow(12 + index)
                headerRowValue.values = [
                    index + 1,
                    `${i?.subjectClass?.code || ''} - ${i?.subjectClass?.name || ''}`,
                    `${i?.lecture?.code || ''} - ${i?.lecture?.userProfile?.lastName || ''} ${i?.lecture?.userProfile?.firstName || ''}`,
                    i?.lecture?.userProfile?.idCardNumber || '',
                    i?.lecture?.userProfile?.phoneNumber || '',
                    i?.lecture?.organization?.sMa || '',
                    i?.startDate ? dayjs(i?.startDate).format('DD/MM/YYYY') : '',
                    i?.endDate ? dayjs(i?.endDate).format('DD/MM/YYYY') : '',
                ]
            })
        }

        // Xuất file
        const buffer = await workbook.xlsx.writeBuffer()
        saveAs(new Blob([buffer]), 'danh_sach_giang_vien_khao_sat.xlsx')
    }

    return (
        <Flex>
            <Button type="primary" onClick={exportTemplate} icon={<DownloadOutlined />}>
                Xuất file excel
            </Button>
        </Flex>
    )
}

export default ExportLecturerInSurvey
