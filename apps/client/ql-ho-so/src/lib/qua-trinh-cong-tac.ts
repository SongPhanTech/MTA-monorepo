import type { QuaTrinhCongTac } from "@workspace/db"
import type { FormInstance } from "antd"
import type { Dayjs } from "dayjs"
import dayjs from "dayjs"
import { useEffect, useRef } from "react"

export type OrgDonVi = {
  Id: string
  sMa?: string | null
  sTen?: string | null
}

export function getOrgLabel(org?: OrgDonVi | null) {
  if (!org) return ""
  return [org.sMa, org.sTen].filter(Boolean).join(" - ") || org.sTen || org.sMa || ""
}

export function recordMatchesOrg(donVi: string | null | undefined, org: OrgDonVi) {
  const value = (donVi || "").trim().toLowerCase()
  if (!value) return false
  const ten = (org.sTen || "").trim().toLowerCase()
  const ma = (org.sMa || "").trim().toLowerCase()
  const label = getOrgLabel(org).trim().toLowerCase()
  return value === ten || value === ma || value === label || (!!ten && value.includes(ten))
}

type QuaTrinhCongTacForm = Omit<Partial<QuaTrinhCongTac>, "tuThangNam" | "denThangNam"> & {
  donVi?: string | null
  tuThangNam?: Dayjs | Date | string | null
  denThangNam?: Dayjs | Date | string | null
}

export function appendQuaTrinhCongTacForOrgChange(
  records: QuaTrinhCongTacForm[] | undefined,
  previousOrg: OrgDonVi | undefined,
  nextOrg: OrgDonVi | undefined
): QuaTrinhCongTacForm[] {
  const list = [...(records || [])]
  if (!nextOrg || previousOrg?.Id === nextOrg.Id) return list

  const now = dayjs()
  if (previousOrg && !list.some((item) => recordMatchesOrg(item.donVi, previousOrg))) {
    list.push({
      donVi: getOrgLabel(previousOrg),
      denThangNam: now,
    })
  }

  list.push({
    donVi: getOrgLabel(nextOrg),
    tuThangNam: now,
  })

  return list
}

export function useSyncQuaTrinhCongTacOnOrgChange(
  form: FormInstance,
  orgId: string | null | undefined,
  organizations: OrgDonVi[]
) {
  const prevOrgIdRef = useRef<string | undefined>()
  const readyRef = useRef(false)

  useEffect(() => {
    if (!orgId) return
    if (!readyRef.current) {
      readyRef.current = true
      prevOrgIdRef.current = orgId
      return
    }
    if (prevOrgIdRef.current === orgId) return

    const previousOrg = organizations.find((item) => item.Id === prevOrgIdRef.current)
    const nextOrg = organizations.find((item) => item.Id === orgId)
    if (!nextOrg) return
    prevOrgIdRef.current = orgId

    form.setFieldValue(
      "quaTrinhCongTac",
      appendQuaTrinhCongTacForOrgChange(
        form.getFieldValue("quaTrinhCongTac"),
        previousOrg,
        nextOrg
      )
    )
  }, [form, orgId, organizations])
}
