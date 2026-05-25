import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { prisma } from ".."
import { fieldDesc } from "../dto/openapi-helpers"

const app = new OpenAPIHono({ strict: false })

const RoomItemSchema = z.object({
  id: z.string().openapi(fieldDesc("ID phòng (Room).")),
  name: z.string().openapi(fieldDesc("Tên phòng học.")),
  code: z.string().nullable().openapi(fieldDesc("Mã phòng.")),
})

const getRoom = createRoute({
  operationId: "room",
  tags: ["Phòng học"],
  path: "",
  method: "get",
  summary: "Danh sách phòng học",
  description: `Lấy toàn bộ phòng học kèm thông tin tòa nhà.

**Bảng dữ liệu nguồn:** Room, Building.

**Tham số:** không có.`,
  responses: {
    200: {
      description: "Thành công",
      content: {
        "application/json": {
          schema: z.array(RoomItemSchema),
        },
      },
    },
    400: {
      description: "Lỗi truy vấn",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string().openapi(fieldDesc("Thông báo lỗi.")),
          }),
        },
      },
    },
  },
})

app.openapi(getRoom, async (c) => {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        building: true,
      },
    })
    return c.json(rooms, 200)
  } catch (err) {
    return c.json({ message: "Failed to get TrainingField" }, 400)
  }
})

export default app
