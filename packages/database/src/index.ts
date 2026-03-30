export { createId } from "@paralleldrive/cuid2"
export * from "../generated/prisma-client"
export { enhance } from "../generated/zenstack/enhance"

export const getOrganizationAndAllChildren = async (prisma: any, rootId: string) => {
  const allOrgs = await prisma.dM_DonVi.findMany()

  const childrenMap = new Map<string, typeof allOrgs>()
  const orgMap = new Map<string, (typeof allOrgs)[0]>()

  for (const org of allOrgs) {
    orgMap.set(org.Id, org)
    if (org.sParentId) {
      const list = childrenMap.get(org.sParentId) || []
      list.push(org)
      childrenMap.set(org.sParentId, list)
    }
  }

  const rootOrg = orgMap.get(rootId)
  if (!rootOrg) return []

  const result: typeof allOrgs = []
  const stack = [rootOrg]

  while (stack.length > 0) {
    const current = stack.pop()
    if (!current) continue

    result.push(current)

    const children = childrenMap.get(current.Id)
    if (children) {
      // Push children in reverse order so they are processed in original order
      for (let i = children.length - 1; i >= 0; i--) {
        const child = children[i]
        if (child) {
          stack.push(child)
        }
      }
    }
  }

  return result
}
