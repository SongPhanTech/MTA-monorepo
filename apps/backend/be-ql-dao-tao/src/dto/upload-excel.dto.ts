import { z } from '@hono/zod-openapi'

export const UploadExcelModel = z.object({
    file: z
        .instanceof(File)
        .refine(
            (f) => {
                const allowedExtensions = ['.xls', '.xlsx']
                return allowedExtensions.some((ext) =>
                    f.name.toLowerCase().endsWith(ext)
                )
            },
            { message: 'Định dạng file không hỗ trợ' }
        )
        .openapi({ type: 'string', format: 'binary' }),
})
