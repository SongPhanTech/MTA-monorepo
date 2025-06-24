import { readFile } from 'node:fs/promises'
// biome-ignore lint/correctness/noUnusedImports: <explanation>
import { parseSheetHeQuanSu } from './parseExcel'

// const file = await readFile('./DanhSachSV_Mau2_15h32m36s.xls')
// const data = parseFixedClassesAndStudents(file)

const file = await readFile('./MauImportDSHV_5_24_2025_3_28_21_PM.xls')
const data = parseSheetHeQuanSu(file.buffer)

console.table(data.students)
