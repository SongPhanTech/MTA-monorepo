import * as XLSX from 'xlsx'

import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import type { CellObject } from 'xlsx'

dayjs.extend(customParseFormat)

type ParseSheetError = {
    cellRef: string
    message: string
}

export const readSheet = (file: Buffer) => {
    const wb = XLSX.read(file)
    const sheetNames = wb.SheetNames
    if (!sheetNames[0]) throw new Error('Sheet not found')

    const data = wb.SheetNames.map((name) => {
        const ws = wb.Sheets[name]
        if (!ws) throw new Error('Sheet not found')
        const errors: ParseSheetError[] = []

        const trainingObjectTypeRef = 'D6'
        const trainingObjectTypeCell: CellObject | undefined =
            ws[trainingObjectTypeRef]
        if (trainingObjectTypeCell?.t !== 's' || !trainingObjectTypeCell.v) {
            errors.push({
                cellRef: trainingObjectTypeRef,
                message: 'Không đọc được loại hình đào tạo',
            })
        }

        const trainingCourseRef = 'D7'
        const trainingCourseCell: CellObject | undefined = ws[trainingCourseRef]
        if (trainingCourseCell?.t !== 's' || !trainingCourseCell.v) {
            errors.push({
                cellRef: trainingCourseRef,
                message: 'Không đọc được khóa đào tạo',
            })
        }

        const classNameRef = 'D8'
        const classNameCell: CellObject | undefined = ws[classNameRef]
        if (classNameCell?.t !== 's' || !classNameCell.v) {
            errors.push({
                cellRef: classNameRef,
                message: 'Không đọc được tên lớp',
            })
        }

        // Đọc từ dòng thứ 11 (start from 0)
        const data = XLSX.utils.sheet_to_json(ws, {
            defval: '',
            blankrows: false,
            raw: false,
            header: 'A',
            range: 10,
        }) as (Record<string, string> & { __rowNum__: number })[]

        const students = data
            .filter((row) => row.A)
            .map((row) => {
                const birthday = dayjs(row.D, 'DD/MM/YYYY').startOf('day')

                return {
                    stt: row.A,
                    code: row.B,
                    fullname: row.C,
                    birthday: birthday.isValid() ? birthday.toDate() : null,
                    gender: row.E,
                    placeOfBirth: row.F,
                }
            })

        return {
            code: name,
            trainingObjectType: trainingObjectTypeCell?.v,
            trainingCourse: trainingCourseCell?.v,
            name: classNameCell?.v,
            students,
            errors,
        }
    })

    return data
}
