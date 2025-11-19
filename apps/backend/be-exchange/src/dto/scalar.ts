// biome-ignore lint/correctness/noUnusedImports: <import openapi declare>
import { z } from '@hono/zod-openapi'

import { TrainingObjectTypeScalarSchema } from '@workspace/db/zod/models'

export const TrainingObjectTypeScalar = TrainingObjectTypeScalarSchema.describe(
    'Đối tượng đào tạo'
).openapi('TrainingObjectTypeScalar')
