import { z } from "@hono/zod-openapi"
import { API_RESULT, fieldDesc } from "./openapi-helpers"
import { SuccessResponseSchema } from "./base"

export const DepartmentItem = z
  .object({
    gid: z.number().openapi(fieldDesc("Số thứ tự trong danh sách trả về (không lưu DB).", 1)),
    dept_code: z.string().openapi(fieldDesc("Mã đơn vị (DM_DonVi.sMa).", "K_CNTT")),
    dept_name: z.string().openapi(fieldDesc("Tên viết tắt đơn vị (DM_DonVi.sTenVietTat).", "K.CNTT")),
    dept_full_name: z.string().openapi(fieldDesc("Tên đầy đủ đơn vị (DM_DonVi.sTen).", "Khoa Công nghệ thông tin")),
    dept_email: z.string().openapi(fieldDesc("Email đơn vị (hiện chưa map từ DB, trả về rỗng).", "")),
    dept_address: z.string().openapi(fieldDesc("Địa chỉ đơn vị (DM_DonVi.sDiaChi).", "")),
    dept_order: z.string().openapi(fieldDesc("Thứ tự hiển thị (DM_DonVi.iSTT).", "1")),
    dept_level: z
      .number()
      .openapi(fieldDesc("Cấp đơn vị trong cây tổ chức, tính từ DM_DonVi.sCode.", 2)),
    dept_parent_id: z
      .string()
      .nullable()
      .openapi(fieldDesc("Mã đơn vị cha (DM_DonVi.sParentId).", "HVKTQS")),
    dept_code_build_tree: z
      .string()
      .openapi(fieldDesc("Mã dạng cây (build từ sCode), dùng hiển thị phân cấp.", "0.1.2")),
  })
  .openapi("DepartmentItem")

export const GetAllDepartmentResponse = SuccessResponseSchema.extend({
  department_list: z.array(DepartmentItem),
}).openapi("GetAllDepartmentResponse")
