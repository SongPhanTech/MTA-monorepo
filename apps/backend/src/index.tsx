import { PrismaClient, enhance } from "@workspace/db";
import { createHonoHandler } from "@workspace/db/hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { csrf } from "hono/csrf";
import { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";
import { Context } from "hono";

import UserApp from "./api/user";
import { getCurrentUser } from "./auth";

export const prisma = new PrismaClient();
const app = new OpenAPIHono({ strict: false });

app.use(
  "/api/model/*",
  createHonoHandler({
    getPrisma: async (ctx: Context) => {
      return enhance(prisma, { user: await getCurrentUser(ctx) });
    },
  })
);

app.use("*", cors());
app.use(csrf());
app.use(logger());

app.get("/", (c) => {
  return c.html(
    <html>
      <head>
        <title>App</title>
      </head>
      <body>
        <a href="/reference">Scalar API Reference</a>
        <br />
        <a href="/openapi">Open API</a>
        <br />
        <a href="/api/user">User API</a>
      </body>
    </html>
  );
});

app.route("/api/user", UserApp);

app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

app.doc("/openapi", (c) => ({
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "My API",
  },
  servers: [
    {
      url: new URL(c.req.url).origin,
      description: "Current environment",
    },
  ],
}));

app.get(
  "/reference",
  apiReference({
    theme: "purple",
    spec: { url: "/openapi" },
  })
);

export default app;

process.on("SIGINT", () => {
  process.exit();
});
