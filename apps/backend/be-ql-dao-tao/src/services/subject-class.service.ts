import { prisma } from '..'
import type { StudentInfo, StudentTemplateData } from '../dto/student-info.dto'
import * as XLSX from 'xlsx'

export const listStudentInfo = async (subjectClassId: string) => {
    // Query studentSubjectScore with related student and userProfile
    const studentScores = await prisma.studentSubjectScore.findMany({
        where: { subjectClassId },
        include: {
            student: {
                include: {
                    userProfile: true,
                },
            },
        },
    })
    // Check if the result is empty
    if (studentScores.length === 0) {
        throw new Error('No students found for the specified subject class.')
    }

    // Map results to StudentInfo DTO
    const studentsInfo: StudentInfo[] = studentScores.map((score, index) => {
        const { student } = score
        const profile = student.userProfile

        if (!profile) {
            throw new Error(
                `User profile not found for student ID: ${student.id}`
            )
        }

        return {
            stt: index + 1,
            id: profile.id,
            name: `${profile.lastName ?? ''} ${profile.firstName ?? ''}`.trim(),
            code: profile.code ?? '',
            birth: profile.dateOfBirth
                ? new Date(profile.dateOfBirth).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                  })
                : '',
            hometown: profile.homeTown ?? '',
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
    const startRow = 4 // Headers in row 3, data starts in row 4

    // Write headers
    headers.forEach((header, index) => {
        const cellRef = XLSX.utils.encode_cell({ r: startRow - 2, c: index })
        worksheet[cellRef] = { t: 's', v: header }
    })

    // Write student data
    templateData.student.forEach((student, index) => {
        const row = startRow + index
        const cells = [
            { t: 'n', v: student.stt },
            { t: 's', v: student.id },
            { t: 's', v: student.name },
            { t: 's', v: student.code },
            { t: 's', v: student.birth },
            { t: 's', v: student.hometown },
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
