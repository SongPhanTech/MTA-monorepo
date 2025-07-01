import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import axios from 'axios'
import * as XLSX from 'xlsx'
import { prisma } from '..' // Adjust import based on your setup

export const getBufferFromUrl = async (
    templateCode: string,
    downloadPath?: string
): Promise<Buffer> => {
    // Fetch template file metadata from database
    const templateFile = await prisma.templateFile.findFirst({
        where: { code: templateCode },
    })

    if (!templateFile) {
        console.error(`No template found for code: ${templateCode}`)
        return Buffer.from('')
    }

    try {
        // Fetch the file as arraybuffer
        const response = await axios.get(templateFile.path, {
            responseType: 'arraybuffer',
        })

        // Create a buffer from the response data
        const buffer = Buffer.from(response.data)

        // Read workbook from buffer to ensure it's valid
        const workbook = XLSX.read(buffer, { type: 'buffer' })

        // Write workbook back to buffer to preserve formatting
        const wbout = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

        // If downloadPath is provided, save the file locally
        if (downloadPath) {
            const resolvedPath = path.resolve(downloadPath)
            await fs.writeFile(resolvedPath, wbout)
            console.log(`File successfully downloaded to: ${resolvedPath}`)
        }

        return Buffer.from(wbout)
    } catch (error) {
        console.error('Error fetching or processing file from URL:', error)
        throw error
    }
}
