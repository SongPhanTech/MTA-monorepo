import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { PrismaClient as MysqlPrismaClient, Prisma } from '@workspace/db/mysql'
import xlsx from 'exceljs'
import { ensureDatabaseInUrl } from '../utils/database'
import { UploadExcelModel } from '../dto/upload-excel.dto'
const app = new OpenAPIHono({ strict: false })

app.openapi(
    createRoute({
        operationId: 'get-databases',
        path: '/get-databases',
        method: 'get',
        request: {
            query: z.object({
                url: z.string(),
            }),
        },
        responses: {
            200: {
                content: {
                    'application/json': {
                        schema: z.array(
                            z.object({
                                Database: z.string(),
                            })
                        ),
                    },
                },
                description: 'Successfully',
            },
        },
    }),
    async (c) => {
        const { url } = c.req.valid('query')
        const prismaApimLogs = new MysqlPrismaClient({
            datasourceUrl: url,
        })

        const res = await prismaApimLogs.$queryRaw<
            {
                Database: string
            }[]
        >`SHOW DATABASES;`
        return c.json(res, 200)
    }
)

app.openapi(
    createRoute({
        operationId: 'get-tables',
        path: '/get-tables',
        method: 'get',
        request: {
            query: z.object({
                url: z.string(),
                database: z.string(),
            }),
        },
        responses: {
            200: {
                content: {
                    'application/json': {
                        schema: z.array(
                            z.object({
                                tableName: z.string(),
                            })
                        ),
                    },
                },
                description: 'Successfully',
            },
        },
    }),
    async (c) => {
        const { url, database } = c.req.valid('query')
        const prismaApimLogs = new MysqlPrismaClient({
            datasourceUrl: url,
        })
        const res = await prismaApimLogs.$queryRaw<
            {
                tableName: string
            }[]
        >`select TABLE_NAME as tableName from information_schema.tables where TABLE_SCHEMA = ${database};`
        return c.json(res, 200)
    }
)

app.openapi(
    createRoute({
        operationId: 'get-columns',
        path: '/get-columns',
        method: 'get',
        request: {
            query: z.object({
                url: z.string(),
                database: z.string(),
                table: z.string(),
            }),
        },
        responses: {
            200: {
                content: {
                    'application/json': {
                        schema: z.array(
                            z.object({
                                columnName: z.string(),
                                isNullable: z.boolean(),
                                dataType: z.string(),
                                characterMaximumLength: z.number().nullable(),
                                numericPrecision: z.number().nullable(),
                                numericScale: z.number().nullable(),
                                datetimePrecision: z.number().nullable(),
                                columnType: z.string(),
                                columnKey: z.string(),
                                columnComment: z.string(),
                            })
                        ),
                    },
                },
                description: 'Successfully',
            },
        },
    }),
    async (c) => {
        const { url, database, table } = c.req.valid('query')
        const prismaApimLogs = new MysqlPrismaClient({
            datasourceUrl: url,
        })
        const res = await prismaApimLogs.$queryRaw<
            {
                columnName: string
                isNullable: string
                dataType: string
                characterMaximumLength: bigint | null
                numericPrecision: bigint | null
                numericScale: bigint | null
                datetimePrecision: bigint | null
                columnType: string
                columnKey: string
                columnComment: string
            }[]
        >`select COLUMN_NAME AS columnName,
       IS_NULLABLE AS isNullable,
       DATA_TYPE AS dataType,
       CHARACTER_MAXIMUM_LENGTH AS characterMaximumLength,
       NUMERIC_PRECISION AS numericPrecision,
       NUMERIC_SCALE AS numericScale,
       DATETIME_PRECISION AS datetimePrecision,
       COLUMN_TYPE AS columnType,
       COLUMN_KEY AS columnKey,
       COLUMN_COMMENT AS columnComment
        from information_schema.columns
        where TABLE_SCHEMA = ${database}
        and TABLE_NAME = ${table};`
        return c.json(
            res.map((r) => ({
                ...r,
                characterMaximumLength:
                    r.characterMaximumLength !== null ? Number(r.characterMaximumLength) : null,
                numericPrecision: r.numericPrecision !== null ? Number(r.numericPrecision) : null,
                numericScale: r.numericScale !== null ? Number(r.numericScale) : null,
                datetimePrecision:
                    r.datetimePrecision !== null ? Number(r.datetimePrecision) : null,
                isNullable: r.isNullable === 'YES',
            })),
            200
        )
    }
)

app.openapi(
    createRoute({
        operationId: 'export-table-by-columns',
        path: '/export-table-by-columns',
        method: 'get',
        request: {
            query: z.object({
                url: z.string(),
                database: z.string(),
                table: z.string(),
                columns: z.array(z.string()).or(z.string()),
            }),
        },
        responses: {
            200: {
                description: 'Successfully',
                content: {
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
                        schema: z.any().openapi({ type: 'string', format: 'binary' }),
                    },
                },
            },
        },
    }),
    async (c) => {
        let { url, database, table, columns } = c.req.valid('query')
        if (typeof columns === 'string') {
            columns = [columns]
        }
        const prismaApimLogs = new MysqlPrismaClient({
            datasourceUrl: url,
        })
        const allColumn = await prismaApimLogs.$queryRaw<
            {
                columnName: string
            }[]
        >`select COLUMN_NAME AS columnName
        from information_schema.columns
        where TABLE_SCHEMA = ${database}
        and TABLE_NAME = ${table};`

        const selectedColumns = allColumn
            .filter((col) => columns.includes(col.columnName))
            .map((col) => `\`${col.columnName}\``)
            .join(', ')

        const res = await prismaApimLogs.$queryRaw<any[]>`SELECT ${Prisma.raw(selectedColumns)}
        from ${Prisma.raw(`\`${database}\`.\`${table}\``)};`

        const workbook = new xlsx.Workbook()
        const worksheet = workbook.addWorksheet(table)
        worksheet.addRow(columns)

        res.forEach((row) => {
            const rowData = columns.map((col) => row[col])
            worksheet.addRow(rowData)
        })

        const buffer = await workbook.xlsx.writeBuffer()
        const fileName = `${database}-${table}.xlsx`
        const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`
        return c.body(buffer, 200, {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': disposition,
        })
    }
)

app.openapi(
    createRoute({
        operationId: 'export-table-by-sql',
        path: '/export-table-by-sql',
        method: 'get',
        request: {
            query: z.object({
                url: z.string(),
                database: z.string(),
                sql: z.string(),
            }),
        },
        responses: {
            200: {
                description: 'Successfully',
                content: {
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
                        schema: z.any().openapi({ type: 'string', format: 'binary' }),
                    },
                },
            },
        },
    }),
    async (c) => {
        const { url, database, sql } = c.req.valid('query')
        const prismaApimLogs = new MysqlPrismaClient({
            datasourceUrl: ensureDatabaseInUrl(url, database),
        })
        const res = await prismaApimLogs.$queryRawUnsafe<any[]>(`${sql}`)

        const columns = Object.keys(res[0] || {})

        const workbook = new xlsx.Workbook()
        const worksheet = workbook.addWorksheet(database)
        worksheet.addRow(columns)

        res.forEach((row) => {
            const rowData = columns.map((col) => row[col])
            worksheet.addRow(rowData)
        })

        const buffer = await workbook.xlsx.writeBuffer()
        const fileName = `${database}-sql.xlsx`
        const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`
        return c.body(buffer, 200, {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': disposition,
        })
    }
)

app.openapi(
    createRoute({
        operationId: 'read-excel-columns',
        path: '/read-excel-columns',
        method: 'post',
        request: {
            body: {
                content: {
                    'multipart/form-data': {
                        schema: UploadExcelModel,
                    },
                },
            },
        },
        responses: {
            200: {
                description: 'Successfully',
                content: {
                    'application/json': {
                        schema: z.array(z.string()),
                    },
                },
            },
        },
    }),
    async (c) => {
        const { file } = c.req.valid('form')
        const buf = await file.arrayBuffer()
        const workbook = new xlsx.Workbook()
        await workbook.xlsx.load(buf)
        const worksheet = workbook.worksheets[0]
        if (!worksheet) {
            return c.json([], 200)
        }
        let headerRowNumber = 1
        for (let i = 1; i <= worksheet.rowCount; i++) {
            const row = worksheet.getRow(i)
            if (row?.values?.length && Array.isArray(row.values)) {
                const hasData = row?.values?.some?.((v) => !!v)
                if (hasData) {
                    headerRowNumber = i
                    break
                }
            }
            // Kiểm tra xem row có ít nhất 1 ô có dữ liệu
        }
        const firstRow = worksheet.getRow(headerRowNumber)
        const columns: string[] = []
        firstRow.eachCell((cell) => {
            columns.push(cell.value?.toString() || '')
        })
        return c.json(columns, 200)
    }
)

app.openapi(
    createRoute({
        operationId: 'import-excel-to-database',
        path: '/import-excel-to-database',
        method: 'post',
        request: {
            body: {
                content: {
                    'multipart/form-data': {
                        schema: UploadExcelModel.extend({
                            url: z.string(),
                            database: z.string(),
                            table: z.string(),
                            columns: z
                                .string()
                                .transform((val) => val.split(',').map((c) => c.trim().split(':'))),
                        }),
                    },
                },
            },
        },
        responses: {
            200: {
                description: 'Successfully',
                content: {
                    'application/json': {
                        schema: z.object({
                            inserted: z.number(),
                        }),
                    },
                },
            },
        },
    }),
    async (c) => {
        const { file, url, columns, database, table } = c.req.valid('form')

        const buf = await file.arrayBuffer()
        const workbook = new xlsx.Workbook()
        await workbook.xlsx.load(buf)
        const worksheet = workbook.worksheets[0]

        if (!worksheet) return c.json({ inserted: 0 }, 200)

        // Tìm header
        let headerRowNumber = 1
        for (let i = 1; i <= worksheet.rowCount; i++) {
            const row = worksheet.getRow(i)
            if (row?.values?.length && Array.isArray(row.values)) {
                const hasData = row?.values?.some?.((v) => !!v)
                if (hasData) {
                    headerRowNumber = i
                    break
                }
            }
        }
        const dataRowNumber = headerRowNumber + 1

        // Chuẩn bị prisma
        const prismaDB = new MysqlPrismaClient({
            datasourceUrl: ensureDatabaseInUrl(url, database),
        })

        // Tạo map excelHeader → dbColumn
        const columnMap = new Map<string, string>()
        for (const [excelCol, dbCol] of columns) {
            if (excelCol && dbCol) {
                columnMap.set(excelCol.trim(), dbCol.trim())
            }
        }

        // Lấy header thật của Excel
        const headerRow = worksheet.getRow(headerRowNumber)
        const excelHeaders: string[] = []
        headerRow.eachCell((cell) => {
            excelHeaders.push(cell.value?.toString().trim() || '')
        })

        // Map sang column DB
        const dbColumns = excelHeaders.map((h) => columnMap.get(h) || null)

        // Parse toàn bộ data
        const results = []
        for (let r = dataRowNumber; r <= worksheet.rowCount; r++) {
            const row = worksheet.getRow(r)
            if (!row) continue

            const rowData = {} as Record<string, xlsx.CellValue>

            row.eachCell((cell, colIndex) => {
                const dbCol = dbColumns[colIndex - 1]
                if (dbCol) {
                    rowData[dbCol] = cell.value
                }
            })

            if (Object.keys(rowData).length > 0) {
                results.push(rowData)
            }
        }

        // Insert vào DB
        for (const row of results) {
            const keys = Object.keys(row)
            const values = Object.values(row)

            const sql = `
        INSERT INTO \`${database}\`.\`${table}\` (${keys.map((k) => `\`${k}\``).join(', ')})
        VALUES (${keys.map(() => '?').join(', ')});
    `

            await prismaDB.$queryRawUnsafe(sql, ...values)
        }

        return c.json(
            {
                inserted: results.length,
            },
            200
        )
    }
)

export default app
