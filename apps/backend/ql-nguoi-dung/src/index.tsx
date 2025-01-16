import {
  getAuth,
  oidcAuthMiddleware,
  processOAuthCallback,
  OidcClaimsHook,
  revokeSession,
} from "@hono/oidc-auth";
import { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";
import { PrismaClient, enhance } from "@workspace/db";
import { createHonoHandler } from "@workspace/db/hono";
import { Context } from "hono";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { logger } from "hono/logger";

import UserApp from "./api/user";
import { getCurrentUser } from "./auth";

export const prisma = new PrismaClient();
const app = new OpenAPIHono({ strict: false });

app.use("*", oidcAuthMiddleware());

app.use("*", cors());
app.use(csrf());
app.use(logger());

const oidcClaimsHook: OidcClaimsHook = async (orig, claims, response) => {
  console.log(111, orig, claims, response);

  return {
    sub: claims?.sub || orig?.sub || "",
    email: (claims?.email as string) || orig?.email || "",
  };
};

app.get("/callback", async (c) => {
  c.set("oidcClaimsHook", oidcClaimsHook);
  return processOAuthCallback(c);
});

app.get("/logout", async (c) => {
  await revokeSession(c);
  return c.text("You have been successfully logged out!");
});

app.get("/", async (c) => {
  c.set("oidcClaimsHook", oidcClaimsHook);
  const auth = await getAuth(c);
  console.log(auth);

  return c.html(
    <html>
      <head>
        <title>App</title>
      </head>
      <body>
        <h1>{auth?.email}</h1>
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
