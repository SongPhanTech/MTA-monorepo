import axios from 'axios'
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import * as XLSX from 'xlsx'
import { prisma } from '..'
import { CreateFilledTemplateDto } from '../dto/template.dto'

export const getBufferFromUrl = async (
    templateCode: string
): Promise<Buffer> => {
    const templateFile = await prisma.templateFile.findFirst({
        where: { code: templateCode }, // Tìm kiếm lớp biên chế
    })
    if (!templateFile) {
        console.log('Không tìm thấy template nào', templateCode)
        return Buffer.from('')
    }
    try {
        const response = await axios.get(templateFile?.path, {
            responseType: 'arraybuffer',
        })
        return Buffer.from(response.data)
    } catch (error) {
        console.error('Error fetching buffer from URL:', error)
        throw error
    }
}

export const getCurrentDateForReport = () => {
    const currentDate = new Date()
    const date = String(currentDate.getDate()).padStart(2, '0')
    const month = String(currentDate.getMonth() + 1).padStart(2, '0') // Tháng bắt đầu từ 0
    const year = currentDate.getFullYear()
    return { date, month, year }
}
