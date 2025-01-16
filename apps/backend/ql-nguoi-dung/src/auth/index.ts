import {
  getAuth,
  oidcAuthMiddleware,
  OidcClaimsHook,
  processOAuthCallback,
  revokeSession,
} from "@hono/oidc-auth";
import { Context, Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { prisma } from "..";
import { OpenAPIHono } from "@hono/zod-openapi";

// TODO: need to get the user from the token
export const getCurrentUser = async (ctx: Context) => {
  const token = ctx.req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  const response = await fetch(`${process.env.OIDC_BASE_URL}/oauth2/userinfo`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  }).then((res) => res.json());

  return prisma.user.findFirstOrThrow({
    where: { id: response.sub },
    include: {
      groups: {
        include: { roles: true },
      },
    },
  });
};

const oidcClaimsHook: OidcClaimsHook = async (orig, claims, response) => {
  return {
    sub: claims?.sub || orig?.sub || "",
    email: (claims?.email as string) || orig?.email || "",
  };
};

export const setupOidcAuth = (app: OpenAPIHono) => {
  app.use("*", oidcAuthMiddleware());

  app.get("/callback", processOAuthCallback);

  app.get("/", async (c) => {
    const user = getAuth(c);
    return c.json(user, 200);
  });

  app.get("/logout", async (c) => {
    await revokeSession(c);
    return c.text("You have been successfully logged out!");
  });
};
