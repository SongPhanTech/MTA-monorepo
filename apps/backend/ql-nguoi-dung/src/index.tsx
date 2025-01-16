import { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";
import { PrismaClient, enhance } from "@workspace/db";
import { createHonoHandler } from "@workspace/db/hono";
import { Context } from "hono";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { logger } from "hono/logger";

import UserApp from "./api/user";
import { getCurrentUser, setupOidcAuth } from "./auth";

export const prisma = new PrismaClient();
const app = new OpenAPIHono({ strict: false });

app.use("*", cors());
app.use(csrf());
app.use(logger());

declare module "hono" {
  interface ContextVariableMap {
    user: Awaited<ReturnType<typeof getCurrentUser>>;
  }
}

// setupOidcAuth(app);

// app.use("*", async (c, next) => {
//   const user = await getCurrentUser(c);
//   console.log(111, user);

//   c.set("user", user);
//   await next();
// });

app.route("/api/user", UserApp);

app.doc("/openapi", (c) => ({
  openapi: "3.0.0",
  info: { version: "1.0.0", title: "My API" },
  servers: [
    { url: new URL(c.req.url).origin, description: "Current environment" },
  ],
}));

app.get(
  "/reference",
  apiReference({
    theme: "purple",
    spec: { url: "/openapi" },
  })
);

app.use(
  "/api/model/*",
  createHonoHandler({
    getPrisma: async (ctx: Context) => {
      return enhance(prisma, { user: await getCurrentUser(ctx) });
    },
  })
);

app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

export default app;

process.on("SIGINT", () => {
  process.exit();
});
