import { z } from "zod";
import {
  PostWithRelationsSchema,
  PostOptionalDefaultsWithRelationsSchema,
} from "./PostSchema";
import type {
  PostWithRelations,
  PostOptionalDefaultsWithRelations,
} from "./PostSchema";

/////////////////////////////////////////
// USER SCHEMA
/////////////////////////////////////////

export const UserSchema = z.object({
  id: z.string().cuid(),
  email: z.string(),
  name: z.string().nullish(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type User = z.infer<typeof UserSchema>;

/////////////////////////////////////////
// USER OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const UserOptionalDefaultsSchema = UserSchema.merge(
  z.object({
    id: z.string().cuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  })
);

export type UserOptionalDefaults = z.infer<typeof UserOptionalDefaultsSchema>;

/////////////////////////////////////////
// USER RELATION SCHEMA
/////////////////////////////////////////

export type UserRelations = {
  posts: PostWithRelations[];
};

export type UserWithRelations = z.infer<typeof UserSchema> & UserRelations;

export const UserWithRelationsSchema: z.ZodType<UserWithRelations> =
  UserSchema.merge(
    z.object({
      posts: z.lazy(() => PostWithRelationsSchema).array(),
    })
  );

/////////////////////////////////////////
// USER OPTIONAL DEFAULTS RELATION SCHEMA
/////////////////////////////////////////

export type UserOptionalDefaultsRelations = {
  posts: PostOptionalDefaultsWithRelations[];
};

export type UserOptionalDefaultsWithRelations = z.infer<
  typeof UserOptionalDefaultsSchema
> &
  UserOptionalDefaultsRelations;

export const UserOptionalDefaultsWithRelationsSchema: z.ZodType<UserOptionalDefaultsWithRelations> =
  UserOptionalDefaultsSchema.merge(
    z.object({
      posts: z.lazy(() => PostOptionalDefaultsWithRelationsSchema).array(),
    })
  );

export default UserSchema;
