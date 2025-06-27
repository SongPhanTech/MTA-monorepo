import { $Enums } from '@workspace/db'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import type { CellObject } from 'xlsx'
import { read, utils } from 'xlsx'
import type { ParseSheetError } from './types'

dayjs.extend(customParseFormat)

// TODO!: now depends on stt column(it need to be a integer), maybe need to change to more reliable way

export const parseCurriculumSheet = (file: ArrayBufferLike) => {
    const wb = read(file)
    const sheetName = wb.SheetNames[0]
    if (!sheetName) {
        throw new Error('Không tìm thấy sheet trong file')
    }
    const errors: ParseSheetError[] = []

    const ws = wb.Sheets[sheetName]
    if (!ws) {
        errors.push({
            sheetRef: sheetName,
            cellRef: sheetName,
            message: `Không tìm thấy sheet "${sheetName}" trong file`,
        })
        return {
            trainingObjectType: '',
            trainingCourse: '',
            students: [],
            errors,
        }
    }

    // start: Các tham chiếu ô cố định trong sheet
    const trainingMajorRef = 'D3' // Chuyên ngành
    const startRow = 6 // Dòng bắt đầu đọc dữ liệu (0-based index)
    const semesters = {
        semester1: 'O',
        semester2: 'P',
        semester3: 'Q',
        semester4: 'R',
        semester5: 'S',
        semester6: 'T',
        semester7: 'U',
        semester8: 'V',
        semester9: 'W',
        semester10: 'X',
    } as const
    const cols = {
        stt: 'A',
        subjectName: 'B',
        inCurriculum: 'C',
        organizationCode: 'D',
        credit: 'E',
        structure: 'F',
        period: 'G',
        ...semesters,
        description: 'Y', // Mô tả: can be 'Điều kiện'
    } as const
    // end: Các tham chiếu ô cố định trong sheet

    const trainingMajorCell: CellObject | undefined = ws[trainingMajorRef]
    if (trainingMajorCell?.t !== 's' || !trainingMajorCell.v) {
        errors.push({
            sheetRef: sheetName,
            cellRef: trainingMajorRef,
            message: 'Chuyên ngành không hợp lệ',
        })
    }

    const rows = utils.sheet_to_json(ws, {
        defval: '',
        blankrows: false,
        raw: false,
        header: 'A',
        range: startRow,
    }) as (Record<(typeof cols)[keyof typeof cols], string | null> & {
        __rowNum__: number
    })[]

    const trainingBlocks: {
        name: string
        priority: number
        subjects: {
            name: string | null
            organizationCode: string | null
            credit: number
            period: number
            semester: number
            type: $Enums.SubjectRequirementType
            useForFinalScore: boolean
            graduation: boolean // có phải là môn học tốt nghiệp hay không
            project: boolean // có phải là môn học đồ án hay không
            print: boolean
        }[]
    }[] = []

    let isMandatory = true

    for (const row of rows) {
        if (
            row[cols.stt] &&
            !row[cols.subjectName] &&
            !row[cols.inCurriculum] &&
            !row[cols.organizationCode] &&
            row[cols.credit]
        ) {
            // Khối kiến thức
            const maybeTrainingBlock = row[cols.stt]?.split('.').pop()
            if (!maybeTrainingBlock) {
                errors.push({
                    sheetRef: sheetName,
                    cellRef: `${cols.stt}${row.__rowNum__ + 1}`,
                    message: `Tên khối kiến thức không hợp lệ: ${row[cols.stt]}`,
                })
                return { trainingBlocks, errors }
            }

            // Bỏ qua nếu là khối kiến thức nhỏ
            if (maybeTrainingBlock?.toUpperCase() !== maybeTrainingBlock) {
                continue
            }

            trainingBlocks.push({
                name: maybeTrainingBlock,
                priority: trainingBlocks.length + 1,
                subjects: [],
            })
            isMandatory = true

            continue
        }

        // Môn bắt buộc hay tự chọn
        if (
            !row[cols.stt] &&
            row[cols.subjectName] &&
            !row[cols.inCurriculum] &&
            !row[cols.organizationCode] && // môn thực tập không có đơn vị quản lý
            row[cols.credit]
        ) {
            const requirement = row[cols.subjectName]
            if (requirement?.toLocaleLowerCase().includes('tự chọn')) {
                isMandatory = false
            } else {
                isMandatory = true
            }
            continue
        }

        // Môn học
        if (
            row[cols.stt] &&
            row[cols.subjectName] &&
            ((row[cols.inCurriculum] && row[cols.organizationCode]) ||
                (row[cols.organizationCode] && row[cols.credit]) ||
                (row[cols.inCurriculum] && row[cols.credit]))
        ) {
            const credit =
                Number.parseInt(row[cols.credit] || '') ||
                Number.parseInt(row[cols.structure] || '')
            if (!Number.isInteger(credit)) {
                errors.push({
                    sheetRef: sheetName,
                    cellRef: `${cols.credit}${row.__rowNum__ + 1}`,
                    message: 'Số tín chỉ không hợp lệ',
                })
            }
            const period = Number.parseInt(row[cols.period] || '')
            if (!Number.isInteger(period)) {
                errors.push({
                    sheetRef: sheetName,
                    cellRef: `${cols.period}${row.__rowNum__ + 1}`,
                    message: 'Số tiết học không hợp lệ',
                })
            }

            const useForFinalScore = !row[cols.description]
                ?.toLocaleLowerCase()
                .includes('điều kiện')

            const semester = Object.values(semesters).findIndex((semester) => row[semester]) + 1

            trainingBlocks[trainingBlocks.length - 1]?.subjects.push({
                name: row[cols.subjectName],
                organizationCode: row[cols.organizationCode],
                credit,
                period,
                semester,
                useForFinalScore,
                type: isMandatory
                    ? $Enums.SubjectRequirementType.Mandatory
                    : $Enums.SubjectRequirementType.Optional,
                print: true,
                graduation: false,
                project: false,
            })

            continue
        }

        console.log('skip:', Object.values(row).join('; '))
    }

    return { trainingBlocks, errors }
}
