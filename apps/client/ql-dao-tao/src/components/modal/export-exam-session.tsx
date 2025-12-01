import { DownloadOutlined } from '@ant-design/icons'
import { useExamTypeOptions } from '@hooks/examType'
import type { Prisma } from '@workspace/db/client'
import { Button, Flex } from 'antd'
import dayjs from 'dayjs'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

const ExportPhach = ({
    data,
}: {
    data: Prisma.ExamPaperGetPayload<{
        include: {
            studentSubjectScore: {
                include: {
                    student: {
                        include: {
                            userProfile: true
                            fixedClass: true
                        }
                    }
                    subjectClass: {
                        include: {
                            fixedClasses: {
                                include: {
                                    trainingCourse: true
                                }
                            }
                        }
                    }
                    subjectVersion: true
                }
            }
        }
    }>[]
}) => {
    const { getExamTypeLabel } = useExamTypeOptions()
    const exportTemplate = async () => {
        // Tạo workbook mới
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Danh sách phách')

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

        const headerStyle = {
            font: { ...golbalFontStyle, bold: true, size: 14 },
            alignment: {
                horizontal: 'center' as const,
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

        const _dataTextCellStyle = {
            ...dataCellStyle,
            alignment: {
                horizontal: 'left' as const,
                vertical: 'middle' as const,
            },
        }

        const italicTextStyle = {
            font: { ...golbalFontStyle, italic: true },
            alignment: {
                horizontal: 'left' as const,
                vertical: 'middle' as const,
            },
        }

        worksheet.mergeCells('A1:D2')
        worksheet.getCell('A1').value = 'BỘ QUỐC PHÒNG\nHỌC VIỆN KỸ THUẬT QUÂN SỰ'
        worksheet.getCell('A1').style = headerTitleStyle

        worksheet.getRow(1).height = 20
        worksheet.getRow(2).height = 20

        worksheet.mergeCells('F1:J2')
        worksheet.getCell('F1').value =
            'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc'
        worksheet.getCell('F1').style = headerTitleStyle

        worksheet.mergeCells('A4:J4')
        worksheet.getCell('A4').value = 'DANH SÁCH PHÁCH'
        worksheet.getCell('A4').style = headerSubtitleStyle
        worksheet.getRow(4).height = 20

        worksheet.mergeCells('A6:B6')
        worksheet.getCell('A6').value = 'Lớp học phần:'
        worksheet.getCell('A6').style = headerStyle

        worksheet.getCell('C6').value = data[0]?.studentSubjectScore?.subjectClass?.code
        worksheet.getCell('C6').style = headerStyle

        worksheet.mergeCells('A7:B7')
        worksheet.getCell('A7').value = 'Tên học phần:'
        worksheet.getCell('A7').style = headerStyle

        worksheet.getCell('C7').value = data[0]?.studentSubjectScore?.subjectVersion?.name
        worksheet.getCell('C7').style = headerStyle

        worksheet.mergeCells('A8:B8')
        worksheet.getCell('A8').value = 'Giảng viên:'
        worksheet.getCell('A8').style = headerStyle

        worksheet.getCell('C8').value = ''
        worksheet.getCell('C8').style = headerStyle

        worksheet.mergeCells('A9:B9')
        worksheet.getCell('A9').value = 'Hệ số điểm chuyên cần: '
        worksheet.getCell('A9').style = headerStyle

        worksheet.getCell('C9').value =
            data[0]?.studentSubjectScore?.subjectClass?.fixedClasses?.[0].trainingCourse?.coef_1
        worksheet.getCell('C9').style = headerStyle

        worksheet.getCell('E6').value = 'Khoá'
        worksheet.getCell('E6').style = headerStyle

        worksheet.getCell('E7').value = 'Khoa'
        worksheet.getCell('E7').style = headerStyle

        worksheet.getCell('E8').value = 'Quân số'
        worksheet.getCell('E8').style = headerStyle

        worksheet.getCell('E9').value = 'Hệ số điểm TX'
        worksheet.getCell('E9').style = headerStyle

        worksheet.getCell('F6').value =
            data[0]?.studentSubjectScore?.subjectClass?.fixedClasses?.[0].trainingCourse?.code
        worksheet.getCell('F6').style = headerStyle

        worksheet.getCell('F7').value = ''
        worksheet.getCell('F7').style = headerStyle

        worksheet.getCell('F8').value = data?.length
        worksheet.getCell('F8').style = headerStyle

        worksheet.getCell('F9').value =
            data[0]?.studentSubjectScore?.subjectClass?.fixedClasses?.[0].trainingCourse?.coef_2
        worksheet.getCell('F9').style = headerStyle

        worksheet.getCell('H6').value = 'Ngày thi'
        worksheet.getCell('H6').style = headerStyle

        worksheet.getCell('H7').value = 'Số tín chỉ'
        worksheet.getCell('H7').style = headerStyle

        worksheet.getCell('H8').value = 'Hình thức thi'
        worksheet.getCell('H8').style = headerStyle

        worksheet.getCell('H9').value = 'Hệ số điểm thi'
        worksheet.getCell('H9').style = headerStyle

        worksheet.getCell('I6').value = data[0]?.studentSubjectScore?.subjectClass?.examDate
            ? dayjs(data[0]?.studentSubjectScore?.subjectClass?.examDate).format('DD/MM/YYYY')
            : ''
        worksheet.getCell('I6').style = headerStyle

        worksheet.getCell('I7').value = data[0]?.studentSubjectScore?.subjectVersion?.credit
        worksheet.getCell('I7').style = headerStyle

        worksheet.getCell('I8').value = getExamTypeLabel(
            data[0]?.studentSubjectScore?.subjectClass?.examType
        )
        worksheet.getCell('I8').style = headerStyle

        worksheet.getCell('I9').value =
            data[0]?.studentSubjectScore?.subjectClass?.fixedClasses?.[0].trainingCourse?.coef_3
        worksheet.getCell('I9').style = headerStyle

        const headerRow = worksheet.getRow(11)
        headerRow.values = [
            'STT',
            'Mã SV',
            'Họ và tên',
            'Ngày sinh (dd/mm/yyyy)',
            'Lớp',
            'Điểm chuyên cần',
            'Điểm thường xuyên',
            'Số phách',
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
            { width: 20 },
            { width: 20 },
            { width: 20 },
        ]

        if (data?.length > 0) {
            data.forEach((i: any, index: number) => {
                const headerRowValue: any = worksheet.getRow(12 + index)
                headerRowValue.values = [
                    index + 1,
                    i?.studentSubjectScore?.student?.userProfile?.code,
                    `${i?.studentSubjectScore?.student?.userProfile?.lastName} ${i?.studentSubjectScore?.student?.userProfile?.firstName}`,
                    `${dayjs(i?.studentSubjectScore?.student?.userProfile.dateOfBirth).format(
                        'DD/MM/YYYY'
                    )}` || '',
                    i?.studentSubjectScore?.student?.fixedClass?.name || '',
                    i.studentSubjectScore?.attendanceScore ?? '',
                    i.studentSubjectScore?.midtermScore ?? '',
                    i.examCode || '',
                ]
                headerRowValue.eachCell((cell: any) => {
                    cell.style = _dataTextCellStyle
                })
            })
        }

        // Xuất file
        const buffer = await workbook.xlsx.writeBuffer()
        saveAs(new Blob([buffer]), 'Mau_phach.xlsx')
    }

    return (
        <Flex>
            <Button type="primary" onClick={exportTemplate} icon={<DownloadOutlined />}>
                Xuất file phách
            </Button>
        </Flex>
    )
}

export default ExportPhach
