import { z } from "@hono/zod-openapi"
import { fieldDesc } from "./openapi-helpers"

export const DatabaseTypeSchema = z
  .enum(["mysql", "mssql"])
  .default("mysql")
  .openapi(fieldDesc("Loại cơ sở dữ liệu.", "mysql"))

export const DatabaseNameSchema = z
  .object({
    Database: z.string().openapi(fieldDesc("Tên database.")),
  })
  .openapi("DatabaseName")

export const TableNameSchema = z
  .object({
    tableName: z.string().openapi(fieldDesc("Tên bảng.")),
  })
  .openapi("TableName")

export const ColumnInfoSchema = z
  .object({
    columnName: z.string().openapi(fieldDesc("Tên cột.")),
    isNullable: z.boolean().openapi(fieldDesc("Cho phép NULL.")),
    dataType: z.string().openapi(fieldDesc("Kiểu dữ liệu SQL.")),
    characterMaximumLength: z.number().nullable().openapi(fieldDesc("Độ dài tối đa (ký tự).")),
    numericPrecision: z.number().nullable().openapi(fieldDesc("Độ chính xác số.")),
    numericScale: z.number().nullable().openapi(fieldDesc("Số chữ số thập phân.")),
    datetimePrecision: z.number().nullable().openapi(fieldDesc("Độ chính xác datetime.")),
    columnType: z.string().openapi(fieldDesc("Kiểu cột đầy đủ.")),
    columnKey: z.string().openapi(fieldDesc("Khóa (PRI, ...).")),
    columnComment: z.string().openapi(fieldDesc("Ghi chú cột.")),
  })
  .openapi("ColumnInfo")

export const SqlCheckResponseSchema = z
  .object({
    message: z.string().openapi(fieldDesc("Kết quả kiểm tra câu SQL.")),
  })
  .openapi("SqlCheckResponse")

export const ExcelColumnPreviewSchema = z
  .object({
    name: z.string().openapi(fieldDesc("Tên cột trong file Excel.")),
    sampleData1: z.any().nullish().openapi(fieldDesc("Giá trị mẫu dòng 1.")),
    sampleData2: z.any().nullish().openapi(fieldDesc("Giá trị mẫu dòng 2.")),
  })
  .openapi("ExcelColumnPreview")

export const ReadExcelColumnsResponseSchema = z
  .object({
    columns: z.array(ExcelColumnPreviewSchema).openapi(fieldDesc("Danh sách cột đọc được.")),
    count: z.number().openapi(fieldDesc("Số dòng dữ liệu (không tính header).")),
  })
  .openapi("ReadExcelColumnsResponse")

export const ImportExcelResponseSchema = z
  .object({
    inserted: z.number().openapi(fieldDesc("Số dòng đã insert vào database.")),
  })
  .openapi("ImportExcelResponse")

export const DbConnectionQuerySchema = z.object({
  url: z.string().openapi(fieldDesc("Connection string database.")),
  dbType: DatabaseTypeSchema,
})

export const DbTableQuerySchema = DbConnectionQuerySchema.extend({
  database: z.string().openapi(fieldDesc("Tên database.")),
})

export const DbColumnQuerySchema = DbTableQuerySchema.extend({
  table: z.string().openapi(fieldDesc("Tên bảng.")),
})

export const ExportTableByColumnsQuerySchema = DbColumnQuerySchema.extend({
  columns: z.array(z.string()).or(z.string()).openapi(fieldDesc("Danh sách tên cột cần export.")),
})

export const ExportTableBySqlQuerySchema = DbTableQuerySchema.extend({
  sql: z.string().openapi(fieldDesc("Câu lệnh SELECT để export.")),
})
