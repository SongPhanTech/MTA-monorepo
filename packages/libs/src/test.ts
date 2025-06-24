import { readFile, writeFile } from 'node:fs/promises'
// biome-ignore lint/correctness/noUnusedImports: <explanation>
import { parseSheetHeQuanSu } from './parseExcel'

// const file = await readFile('./DanhSachSV_Mau2_15h32m36s.xls')
// const data = parseFixedClassesAndStudents(file)

const file = await readFile('./MauImportDSHV_5_24_2025_3_28_21_PM.xls')
const data = parseSheetHeQuanSu(file.buffer)

// console.table(data.students)

const trainingFieldMap = new Map<string, Map<string, Set<string>>>()

for (const student of data.students) {
    const trainingField = student.trainingField || student.curriculum
    const trainingMajor = student.trainingMajor || student.curriculum

    const trainingFieldEntry = trainingFieldMap.get(trainingField)
    if (!trainingFieldEntry) {
        trainingFieldMap.set(
            trainingField,
            new Map([[trainingMajor, new Set([student.curriculum])]])
        )
        continue
    }

    const trainingMajorEntry = trainingFieldEntry.get(trainingMajor)
    if (!trainingMajorEntry) {
        trainingFieldEntry.set(trainingMajor, new Set([student.curriculum]))
    } else {
        trainingMajorEntry.add(student.curriculum)
    }
}

const trainingFields = Array.from(trainingFieldMap.entries()).map(
    ([trainingField, trainingMajorMap]) => {
        return {
            trainingField,
            trainingMajors: Array.from(trainingMajorMap.entries()).map(
                ([trainingMajor, curriculums]) => ({
                    trainingMajor,
                    curriculums: Array.from(curriculums),
                })
            ),
        }
    }
)

console.log(trainingFields)

await writeFile('training.json', JSON.stringify(trainingFields, null, 2))
