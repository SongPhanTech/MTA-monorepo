import { PrismaClient } from '../generated/prisma-client'
import { seedAcademicActionConfig } from './seed/academic-action-config'
import { seedAcademicWarningRule } from './seed/academic-warning-rule'

const prisma = new PrismaClient()

await seedAcademicActionConfig()
await seedAcademicWarningRule()
