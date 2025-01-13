import { z } from 'zod';
import { UserWithRelationsSchema, UserOptionalDefaultsWithRelationsSchema } from './UserSchema'
import type { UserWithRelations, UserOptionalDefaultsWithRelations } from './UserSchema'

/////////////////////////////////////////
// POST SCHEMA
/////////////////////////////////////////

export const PostSchema = z.object({
  id: z.string().cuid(),
  title: z.string(),
  content: z.string().nullish(),
  authorId: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Post = z.infer<typeof PostSchema>

/////////////////////////////////////////
// POST OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const PostOptionalDefaultsSchema = PostSchema.merge(z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type PostOptionalDefaults = z.infer<typeof PostOptionalDefaultsSchema>

/////////////////////////////////////////
// POST RELATION SCHEMA
/////////////////////////////////////////

export type PostRelations = {
  author: UserWithRelations;
};

export type PostWithRelations = z.infer<typeof PostSchema> & PostRelations

export const PostWithRelationsSchema: z.ZodType<PostWithRelations> = PostSchema.merge(z.object({
  author: z.lazy(() => UserWithRelationsSchema),
}))

/////////////////////////////////////////
// POST OPTIONAL DEFAULTS RELATION SCHEMA
/////////////////////////////////////////

export type PostOptionalDefaultsRelations = {
  author: UserOptionalDefaultsWithRelations;
};

export type PostOptionalDefaultsWithRelations = z.infer<typeof PostOptionalDefaultsSchema> & PostOptionalDefaultsRelations

export const PostOptionalDefaultsWithRelationsSchema: z.ZodType<PostOptionalDefaultsWithRelations> = PostOptionalDefaultsSchema.merge(z.object({
  author: z.lazy(() => UserOptionalDefaultsWithRelationsSchema),
}))

export default PostSchema;
