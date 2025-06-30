import { readFile } from 'node:fs/promises'
import { parseCurriculumSheet } from './parseExcel'

// const file = await readFile('./DanhSachSV_Mau2_15h32m36s.xls')
// const data = parseFixedClassesAndStudents(file)

const file = await readFile('./3.1 Split CTĐT  PL1_PL2_PL3_CNTT_KTPM_V4_29.5_1_Final.xlsx')
const data = parseCurriculumSheet(file.buffer)

// console.log(JSON.stringify(data, null, 2))

Bun.write('training-block.json', JSON.stringify(data, null, 2))
