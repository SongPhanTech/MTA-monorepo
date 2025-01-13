import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { prisma } from "..";
import { ListOf, PaginationQuerySchema } from "../zod/base";
import { UserSchema } from "../zod/user";

const app = new OpenAPIHono({ strict: false });

const getListUsers = createRoute({
  method: "get",
  request: {
    query: PaginationQuerySchema,
  },
  path: "/",
  responses: {
    200: {
      content: { "application/json": { schema: ListOf(UserSchema) } },
      description: "Retrieve the users",
    },
  },
});

const getOneUser = createRoute({
  method: "get",
  request: {
    params: z.object({ id: z.string() }),
  },
  path: "/:id",
  responses: {
    200: {
      content: { "application/json": { schema: UserSchema } },
      description: "Retrieve one user",
    },
  },
});

app
  .openapi(getListUsers, async (c) => {
    const { page = 1, limit = 10 } = c.req.valid("query");
    const data = await prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
    });
    const count = await prisma.user.count();
    return c.json({ page, limit, data, count }, 200);
  })

  .openapi(getOneUser, async (c) => {
    const { id } = c.req.valid("param");
    const data = await prisma.user.findUniqueOrThrow({
      where: { id },
      include: { posts: true },
    });
    return c.json(data, 200);
  });

export default app;
