import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import type { PrismaClient } from "@workspace/db"
import { PrismaClient as MssqlPrismaClient } from "@workspace/db/mssql"
import { PrismaClient as MysqlPrismaClient } from "@workspace/db/mysql"
import xlsx from "exceljs"
import { ErrorMessageResponseSchema } from "../dto/common-response.dto"
import {
  ColumnInfoSchema,
  DatabaseNameSchema,
  DatabaseTypeSchema,
  DbColumnQuerySchema,
  DbConnectionQuerySchema,
  DbTableQuerySchema,
  ExportTableByColumnsQuerySchema,
  ExportTableBySqlQuerySchema,
  ImportExcelResponseSchema,
  ReadExcelColumnsResponseSchema,
  SqlCheckResponseSchema,
  TableNameSchema,
} from "../dto/excel-import-export-openapi.dto"
import { excelSuccess, jsonSuccess, standardErrorResponses } from "../dto/openapi-route-helpers"
import { UploadExcelModel } from "../dto/upload-excel.dto"
import { ensureDatabaseInUrl } from "../utils/database"

const app = new OpenAPIHono({ strict: false })

app.openapi(
  createRoute({
    operationId: "get-databases",
    tags: ["Import/Export Excel"],
    summary: "Liệt kê database trên server",
    path: "/get-databases",
    method: "get",
    request: {
      query: DbConnectionQuerySchema,
    },
    responses: {
      ...standardErrorResponses(),
      ...jsonSuccess(z.array(DatabaseNameSchema), "Danh sách database"),
    },
  }),
  async (c) => {
    const { url, dbType } = c.req.valid("query")

    let res: { Database: string }[]
    if (dbType === "mysql") {
      const prismaClient = new MysqlPrismaClient({ datasourceUrl: url })
      res = await prismaClient.$queryRaw<{ Database: string }[]>`SHOW DATABASES;`
    } else {
      // MSSQL
      const prismaClient = new MssqlPrismaClient({ datasourceUrl: url })
      res = await prismaClient.$queryRaw<
        { Database: string }[]
      >`SELECT name AS "Database" FROM sys.databases;`
    }
    return c.json(res, 200)
  }
)

app.openapi(
  createRoute({
    operationId: "get-tables",
    tags: ["Import/Export Excel"],
    summary: "Liệt kê bảng trong database",
    path: "/get-tables",
    method: "get",
    request: {
      query: DbTableQuerySchema,
    },
    responses: {
      ...standardErrorResponses(),
      ...jsonSuccess(z.array(TableNameSchema), "Danh sách bảng"),
    },
  }),
  async (c) => {
    const { url, database, dbType } = c.req.valid("query")

    let res: { tableName: string }[]
    if (dbType === "mysql") {
      const prismaClient = new MysqlPrismaClient({ datasourceUrl: url })
      res = await prismaClient.$queryRaw<
        { tableName: string }[]
      >`SELECT TABLE_NAME as tableName FROM information_schema.tables WHERE TABLE_SCHEMA = ${database};`
    } else {
      // MSSQL
      const prismaClient = new MssqlPrismaClient({ datasourceUrl: url })
      res = await prismaClient.$queryRawUnsafe<{ tableName: string }[]>(
        `SELECT TABLE_NAME as "tableName" FROM ${database}.INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE';`
      )
    }
    return c.json(res, 200)
  }
)

app.openapi(
  createRoute({
    operationId: "get-columns",
    tags: ["Import/Export Excel"],
    summary: "Liệt kê cột của bảng",
    path: "/get-columns",
    method: "get",
    request: {
      query: DbColumnQuerySchema,
    },
    responses: {
      ...standardErrorResponses(),
      ...jsonSuccess(z.array(ColumnInfoSchema), "Danh sách cột"),
    },
  }),
  async (c) => {
    const { url, database, table, dbType } = c.req.valid("query")

    let res: {
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

    if (dbType === "mysql") {
      const prismaClient = new MysqlPrismaClient({ datasourceUrl: url })
      res = await prismaClient.$queryRaw`
                SELECT COLUMN_NAME AS columnName,
                    IS_NULLABLE AS isNullable,
                    DATA_TYPE AS dataType,
                    CHARACTER_MAXIMUM_LENGTH AS characterMaximumLength,
                    NUMERIC_PRECISION AS numericPrecision,
                    NUMERIC_SCALE AS numericScale,
                    DATETIME_PRECISION AS datetimePrecision,
                    COLUMN_TYPE AS columnType,
                    COLUMN_KEY AS columnKey,
                    COLUMN_COMMENT AS columnComment
                FROM information_schema.columns
                WHERE TABLE_SCHEMA = ${database}
                AND TABLE_NAME = ${table};`
    } else {
      // MSSQL
      const prismaClient = new MssqlPrismaClient({ datasourceUrl: url })
      res = await prismaClient.$queryRawUnsafe(`
                SELECT 
                    c.COLUMN_NAME AS columnName,
                    c.IS_NULLABLE AS isNullable,
                    c.DATA_TYPE AS dataType,
                    c.CHARACTER_MAXIMUM_LENGTH AS characterMaximumLength,
                    c.NUMERIC_PRECISION AS numericPrecision,
                    c.NUMERIC_SCALE AS numericScale,
                    c.DATETIME_PRECISION AS datetimePrecision,
                    c.DATA_TYPE AS columnType,
                    CASE WHEN pk.COLUMN_NAME IS NOT NULL THEN 'PRI' ELSE '' END AS columnKey,
                    CAST(ep.value AS NVARCHAR(MAX)) AS columnComment
                FROM ${database}.INFORMATION_SCHEMA.COLUMNS c
                LEFT JOIN ${database}.INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc 
                    ON c.TABLE_NAME = tc.TABLE_NAME AND tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
                LEFT JOIN ${database}.INFORMATION_SCHEMA.KEY_COLUMN_USAGE pk 
                    ON c.COLUMN_NAME = pk.COLUMN_NAME AND c.TABLE_NAME = pk.TABLE_NAME AND tc.CONSTRAINT_NAME = pk.CONSTRAINT_NAME
                LEFT JOIN sys.extended_properties ep 
                    ON ep.major_id = OBJECT_ID(c.TABLE_CATALOG + '.' + c.TABLE_SCHEMA + '.' + c.TABLE_NAME)
                    AND ep.minor_id = c.ORDINAL_POSITION AND ep.name = 'MS_Description'
                WHERE c.TABLE_NAME = '${table}';`)
    }

    return c.json(
      res.map((r) => ({
        ...r,
        characterMaximumLength:
          r.characterMaximumLength !== null ? Number(r.characterMaximumLength) : null,
        numericPrecision: r.numericPrecision !== null ? Number(r.numericPrecision) : null,
        numericScale: r.numericScale !== null ? Number(r.numericScale) : null,
        datetimePrecision: r.datetimePrecision !== null ? Number(r.datetimePrecision) : null,
        isNullable: r.isNullable === "YES",
      })),
      200
    )
  }
)

app.openapi(
  createRoute({
    operationId: "export-table-by-columns",
    tags: ["Import/Export Excel"],
    summary: "Export bảng theo danh sách cột ra Excel",
    path: "/export-table-by-columns",
    method: "get",
    request: {
      query: ExportTableByColumnsQuerySchema,
    },
    responses: {
      ...standardErrorResponses(),
      ...excelSuccess("File Excel chứa dữ liệu bảng"),
    },
  }),
  async (c) => {
    let { url, database, table, columns, dbType } = c.req.valid("query")
    if (typeof columns === "string") {
      columns = [columns]
    }

    let allColumn: { columnName: string }[]
    let res: any[]

    if (dbType === "mysql") {
      const prismaClient = new MysqlPrismaClient({ datasourceUrl: url })
      allColumn = await prismaClient.$queryRaw<
        { columnName: string }[]
      >`SELECT COLUMN_NAME AS columnName
            FROM information_schema.columns
            WHERE TABLE_SCHEMA = ${database}
            AND TABLE_NAME = ${table};`

      const selectedColumns = allColumn
        .filter((col) => columns.includes(col.columnName))
        .map((col) => `\`${col.columnName}\``)
        .join(", ")
      res = await prismaClient.$queryRawUnsafe<any[]>(`SELECT ${selectedColumns}
            FROM \`${database}\`.\`${table}\`;`)
    } else {
      // MSSQL
      const prismaClient = new MssqlPrismaClient({ datasourceUrl: url })

      allColumn = await prismaClient.$queryRawUnsafe<
        { columnName: string }[]
      >(`SELECT COLUMN_NAME AS columnName
            FROM ${database}.INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = '${table}';`)

      const selectedColumns = allColumn
        .filter((col) => columns.includes(col.columnName))
        .map((col) => `[${col.columnName}]`)
        .join(", ")

      res = await prismaClient.$queryRawUnsafe<any[]>(`SELECT ${selectedColumns}
            FROM [${database}].[dbo].[${table}];`)
    }

    const workbook = new xlsx.Workbook()
    const worksheet = workbook.addWorksheet(table)
    const headerRow = worksheet.addRow(columns)
    headerRow.font = { bold: true, name: "Times New Roman", size: 14 }
    headerRow.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    }

    res.forEach((row) => {
      const rowData = columns.map((col) => row[col])
      const rowAdded = worksheet.addRow(rowData)
      rowAdded.font = { name: "Times New Roman", size: 14 }
      rowAdded.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      }
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const fileName = `${database}-${table}.xlsx`
    const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`
    return c.body(buffer, 200, {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": disposition,
    })
  }
)

app.openapi(
  createRoute({
    operationId: "check-export-table-by-sql",
    tags: ["Import/Export Excel"],
    summary: "Kiểm tra câu SQL trước khi export",
    path: "/check-export-table-by-sql",
    method: "get",
    request: {
      query: ExportTableBySqlQuerySchema,
    },
    responses: {
      ...standardErrorResponses(),
      ...jsonSuccess(SqlCheckResponseSchema, "Câu SQL hợp lệ"),
      500: {
        description: "Lỗi thực thi SQL",
        content: { "application/json": { schema: ErrorMessageResponseSchema } },
      },
    },
  }),
  async (c) => {
    const { url, database, sql, dbType } = c.req.valid("query")
    // SQL is user-provided, works for both MySQL and MSSQL
    try {
      const datasourceUrl = dbType === "mysql" ? ensureDatabaseInUrl(url, database) : url
      const prisma = (
        dbType === "mysql"
          ? await new MysqlPrismaClient({ datasourceUrl })
          : await new MssqlPrismaClient({ datasourceUrl })
      ) as PrismaClient
      await prisma.$transaction(async (tx) => {
        await tx.$queryRawUnsafe<any[]>(sql)
        throw new Error("Rollback transaction after check")
      })
      return c.json(
        {
          message: "Câu lệnh SQL hợp lệ và có thể thực thi.",
        },
        200
      )
    } catch (error) {
      if ((error as Error).message === "Rollback transaction after check") {
        return c.json(
          {
            message: "Câu lệnh SQL hợp lệ và có thể thực thi.",
          },
          200
        )
      }
      const CLEAN_ALL_PRISMA_WRAPPER = /Invalid[\s\S]*?invocation:\s*/gi
      return c.json(
        {
          message: `Lỗi thực thi SQL: ${(error as Error)?.message?.replace?.(CLEAN_ALL_PRISMA_WRAPPER, "")?.trim?.()}`,
        },
        500
      )
    }
  }
)

app.openapi(
  createRoute({
    operationId: "export-table-by-sql",
    tags: ["Import/Export Excel"],
    summary: "Export kết quả câu SQL ra Excel",
    path: "/export-table-by-sql",
    method: "get",
    request: {
      query: ExportTableBySqlQuerySchema,
    },
    responses: {
      ...standardErrorResponses(),
      ...excelSuccess("File Excel chứa kết quả truy vấn SQL"),
    },
  }),
  async (c) => {
    const { url, database, sql, dbType } = c.req.valid("query")
    const datasourceUrl = dbType === "mysql" ? ensureDatabaseInUrl(url, database) : url

    // SQL is user-provided, works for both MySQL and MSSQL
    const res =
      dbType === "mysql"
        ? await new MysqlPrismaClient({ datasourceUrl }).$queryRawUnsafe<any[]>(sql)
        : await new MssqlPrismaClient({ datasourceUrl }).$queryRawUnsafe<any[]>(sql)

    const columns = Object.keys(res[0] || {})

    const workbook = new xlsx.Workbook()
    const worksheet = workbook.addWorksheet(database)
    const headerRow = worksheet.addRow(columns)
    headerRow.font = { bold: true, name: "Times New Roman", size: 14 }
    headerRow.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    }

    res.forEach((row: any) => {
      const rowData = columns.map((col) => row[col])
      const rowAdded = worksheet.addRow(rowData)
      rowAdded.font = { name: "Times New Roman", size: 14 }
      rowAdded.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      }
    })
    const buffer = await workbook.xlsx.writeBuffer()
    const fileName = `${database}-sql.xlsx`
    const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`
    return c.body(buffer, 200, {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": disposition,
    })
  }
)

app.openapi(
  createRoute({
    operationId: "read-excel-columns",
    tags: ["Import/Export Excel"],
    summary: "Đọc danh sách cột từ file Excel upload",
    path: "/read-excel-columns",
    method: "post",
    request: {
      body: {
        content: {
          "multipart/form-data": {
            schema: UploadExcelModel,
          },
        },
      },
    },
    responses: {
      ...standardErrorResponses(),
      ...jsonSuccess(ReadExcelColumnsResponseSchema, "Đọc cột Excel thành công"),
    },
  }),
  async (c) => {
    const { file } = c.req.valid("form")
    const buf = await file.arrayBuffer()
    const workbook = new xlsx.Workbook()
    await workbook.xlsx.load(buf)
    const worksheet = workbook.worksheets[0]
    if (!worksheet) {
      return c.json(
        {
          columns: [],
          count: 0,
        },
        200
      )
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
    const columns: {
      name: string
      sampleData1?: string | null
      sampleData2?: string | null
    }[] = []
    firstRow.eachCell((cell) => {
      columns.push({
        name: cell.value?.toString().trim() || "",
        sampleData1: worksheet.getRow(headerRowNumber + 1).getCell(cell.col).value
          ? worksheet
              .getRow(headerRowNumber + 1)
              .getCell(cell.col)
              .value?.toString()
          : null,
        sampleData2: worksheet.getRow(headerRowNumber + 2).getCell(cell.col).value
          ? worksheet
              .getRow(headerRowNumber + 2)
              .getCell(cell.col)
              .value?.toString()
          : null,
      })
    })
    return c.json({ columns, count: worksheet.rowCount - headerRowNumber }, 200)
  }
)

app.openapi(
  createRoute({
    operationId: "import-excel-to-database",
    tags: ["Import/Export Excel"],
    summary: "Import dữ liệu từ Excel vào bảng database",
    path: "/import-excel-to-database",
    method: "post",
    request: {
      body: {
        content: {
          "multipart/form-data": {
            schema: UploadExcelModel.extend({
              url: z.string(),
              database: z.string(),
              table: z.string(),
              columns: z
                .string()
                .transform((val) => val.split(",").map((c) => c.trim().split(":"))),
              dbType: DatabaseTypeSchema,
            }),
          },
        },
      },
    },
    responses: {
      ...standardErrorResponses(),
      ...jsonSuccess(ImportExcelResponseSchema, "Import Excel thành công"),
    },
  }),
  async (c) => {
    const { file, url, columns, database, table, dbType } = c.req.valid("form")

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
    const datasourceUrl = dbType === "mysql" ? ensureDatabaseInUrl(url, database) : url
    const prismaDB =
      dbType === "mysql"
        ? new MysqlPrismaClient({ datasourceUrl })
        : new MssqlPrismaClient({ datasourceUrl })

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
      excelHeaders.push(cell.value?.toString().trim() || "")
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

      let sql: string
      if (dbType === "mysql") {
        sql = `INSERT INTO \`${database}\`.\`${table}\` (${keys.map((k) => `\`${k}\``).join(", ")})
                VALUES (${keys.map(() => "?").join(", ")});`
      } else {
        // MSSQL
        sql = `INSERT INTO [${database}].[dbo].[${table}] (${keys.map((k) => `[${k}]`).join(", ")})
                VALUES (${keys.map((_, i) => `@p${i + 1}`).join(", ")});`
      }

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
