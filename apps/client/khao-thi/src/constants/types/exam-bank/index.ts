import type { DM_DonVi } from "@workspace/db/client"
import type { DataNode } from "antd/es/tree"

interface QuestionBankNode extends DataNode {
  key: string
  title: React.ReactNode
  isLeaf: true
  data: {
    id: string
    code: string | null
    name: string
    description: string | null
    deletedAt: Date | null
    subjectVersionId: string
  }
}

interface SubjectVersionNode extends DataNode {
  key: string
  title: React.ReactNode
  children: QuestionBankNode[]
  data: {
    id: string
    code: string | null
    name: string
    period: number
    credit: number
  }
}

interface SubjectNode extends DataNode {
  key: string
  title: React.ReactNode
  children: SubjectVersionNode[]
  data: {
    id: string
    code: string | null
    name: string
  }
}

interface OrganizationNode extends DataNode {
  key: string
  title: React.ReactNode
  children: SubjectNode[]
  data: DM_DonVi
}

export type { OrganizationNode, SubjectNode, SubjectVersionNode, QuestionBankNode }
