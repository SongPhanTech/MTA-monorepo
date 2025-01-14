import { z } from "zod";
import { UserSchema as PrismaUserSchema, PostSchema } from "@workspace/db/zod";

export const UserSchema = z.object(PrismaUserSchema.shape).openapi("User");

export const UserWithPostsSchema = z
  .object(PrismaUserSchema.shape)
  .merge(
    z.object({
      posts: z.array(PostSchema),
    })
  )
  .openapi("User");
