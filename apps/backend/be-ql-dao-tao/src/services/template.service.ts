import axios from 'axios'
import { prisma } from '..'

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
