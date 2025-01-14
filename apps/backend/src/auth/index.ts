import { User } from "@workspace/db";
import { Context } from "hono";

// TODO: need to get the user from the token
export const getCurrentUser = async (ctx: Context) => {
  return {
    id: "1",
    email: "nX8b0@example.com",
    name: "John Doe",
    createdAt: new Date(),
    updatedAt: new Date(),
  } satisfies User;
};
