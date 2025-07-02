import * as XLSX from 'xlsx'
import { prisma } from '..'
import type { StudentInfo, StudentTemplateData } from '../dto/student-info.dto'

export const listStudentInfo = async (fixedClassId: string) => {
    const fixedClasses = await prisma.fixedClass.findUnique({
        include: {
            students: {
                include: {
                    userProfile: true,
                },
            },
        },
        where: { id: fixedClassId },
    })
    if (!fixedClasses) {
        throw new Error('Lớp học không tồn tại')
    }
    const studentsInfo: StudentInfo[] = fixedClasses.students.map(({ userProfile }, idx) => {
        return {
            stt: idx + 1,
            id: userProfile?.id ?? '',
            name: `${userProfile?.lastName} ${userProfile?.firstName}`,
            code: userProfile?.code || '',
            birth: userProfile?.dateOfBirth
                ? new Date(userProfile.dateOfBirth).toLocaleDateString('vi-VN')
                : '',
            hometown: userProfile?.homeTown || '',
        }
    })

    return studentsInfo
}

// Sanitize filename
export const sanitizeFilename = (name: string): string => {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_')
}

// Populate Excel template with templateData using xlsx
export const populateExcelTemplate = (
    templateBuffer: Buffer,
    templateData: StudentTemplateData
): Buffer => {
    // Read the template
    const workbook = XLSX.read(templateBuffer, { type: 'buffer' })
    const worksheetName = workbook.SheetNames[0] // Use first worksheet
    if (!worksheetName) {
        throw new Error('No worksheet found in the template.')
    }
    const worksheet = workbook.Sheets[worksheetName]

    if (!worksheet) {
        throw new Error('No valid worksheet found in the template.')
    }

    worksheet.A1 = { t: 's', v: `Class: ${templateData.className}` }
    worksheet.A2 = {
        t: 's',
        v: `Date: ${templateData.date}/${templateData.month}/${templateData.year}`,
    }

    const headers = ['STT', 'ID', 'Name', 'Code', 'Date of Birth', 'Hometown']
    const startRow = 8

    // Write student data
    templateData.student.forEach((student, index) => {
        const row = startRow + index
        const cells = [
            { t: 'n', v: student.stt },
            { t: 's', v: student.code },
            { t: 's', v: student.name },
            { t: 's', v: student.birth },
            { t: 's', v: templateData.className || '' },
        ]

        cells.forEach((cell, colIndex) => {
            const cellRef = XLSX.utils.encode_cell({ r: row - 1, c: colIndex })
            worksheet[cellRef] = cell
        })
    })

    // Update worksheet range to include new data
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1')
    range.e.r = Math.max(range.e.r, startRow + templateData.student.length - 1)
    range.e.c = Math.max(range.e.c, headers.length - 1)
    worksheet['!ref'] = XLSX.utils.encode_range(range)

    // Write buffer
    return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })
}
