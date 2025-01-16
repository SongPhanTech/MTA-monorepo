import { z } from 'zod'
import * as models from '@workspace/db/zod/models'

export const UserSchema = z.object(models.UserSchema.shape).openapi('User')

export const UserWithPostsSchema = z
    .object(models.UserSchema.shape)
    .merge(
        z.object({
            posts: z.array(models.PostSchema),
        })
    )
    .openapi('User')
