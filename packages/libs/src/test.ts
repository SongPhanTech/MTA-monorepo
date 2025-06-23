import { readFile } from 'node:fs/promises'
import { readSheet } from './parseExcel'

const file = await readFile('./DanhSachSV_Mau2_15h32m36s.xls')
const data = readSheet(file)

console.log(data)
