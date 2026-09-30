import { normalizeVietnamese } from "@workspace/libs/utils"
import {
  formatDateTimeVn,
  formatDateVn as formatDateVnTz,
  toVnDayjs,
} from "@workspace/libs/timezone"
import clsx, { type ClassValue } from "clsx"
import type { Dayjs } from "dayjs"
import { twMerge } from "tailwind-merge"

export function searchVietnamese(
  data: { value: string; label: string }[],
  keyword: string
): { value: string; label: string }[] {
  const normalizedKeyword = normalizeVietnamese(keyword.trim())
  if (!normalizedKeyword) return data

  return data.filter((item) => {
    const normalizedLabel = normalizeVietnamese(item.label)
    const normalizedValue = normalizeVietnamese(item.value)
    return (
      normalizedLabel.includes(normalizedKeyword) || normalizedValue.includes(normalizedKeyword)
    )
  })
}

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs))
}
export const getPageCount = (totalItems: number, itemsPerPage: number) => {
  return Math.ceil(totalItems / itemsPerPage)
}

export const formatDate = (date?: string | Date | Dayjs, unit?: "Day" | "Month" | "Year") => {
  if (!date) return ""
  if (unit === "Year") return formatDateVnTz(date, "YYYY")
  if (unit === "Month") return formatDateVnTz(date, "MM/YYYY")
  return formatDateVnTz(date, "DD/MM/YYYY")
}

export const formatDateReadable = (date: string | Date | Dayjs) => {
  const d = toVnDayjs(date)
  if (!d) return ""
  return `${d.hour().toString().padStart(2, "0")}h:${d.minute().toString().padStart(2, "0")} - ${d.date().toString().padStart(2, "0")}/${(d.month() + 1).toString().padStart(2, "0")}/${d.year()}`
}

export const formatDateVN = (date: string | Date | Dayjs) => {
  const d = toVnDayjs(date)
  if (!d) return ""
  return `Ngày ${d.date().toString().padStart(2, "0")} tháng ${d.month() + 1} năm ${d.year()}`
}

export const formatDateTime = (date?: string | Date | Dayjs) => {
  if (!date) return ""
  return formatDateTimeVn(date)
}

export const getColorByIndex = (index: number) => {
  const colors = [
    "#3182CE",
    "#38A169",
    "#DD6B20",
    "#805AD5",
    "#E53E3E",
    "#D69E2E",
    "#718096",
    "#00CED1",
    "#9400D3",
    "#FF1493",
    "#00BFFF",
    "#696969",
    "#B22222",
    "#228B22",
    "#FF00FF",
    "#DCDCDC",
    "#FFD700",
  ]
  return colors[index % colors.length]
}

export const formatNiceBytes = (x: string) => {
  const units = ["bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
  let l = 0
  let n = Number.parseInt(x, 10) || 0
  while (n >= 1024 && ++l) {
    n = n / 1024
  }
  return `${n.toFixed(n < 10 && l > 0 ? 1 : 0)} ${units[l]}`
}

export const getUniqueArray = <T>(arr: Array<T>, key: keyof T) => {
  return [...new Map(arr.map((item) => [item[key], item])).values()]
}

export const stringToSlug = (str: string) => {
  const from = "àáãảạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệđùúủũụưừứửữựòóỏõọôồốổỗộơờớởỡợìíỉĩịäëïîöüûñçýỳỹỵỷ"
  const to = "aaaaaaaaaaaaaaaaaeeeeeeeeeeeduuuuuuuuuuuoooooooooooooooooiiiiiaeiiouuncyyyyy"
  let strOut = str
  for (let i = 0, l = from.length; i < l; i++) {
    strOut = strOut.replace(RegExp(from[i], "gi"), to[i])
  }
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "_")
}

export function generatePassword(length = 12): string {
  const upperCaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const lowerCaseChars = "abcdefghijklmnopqrstuvwxyz"
  const numberChars = "0123456789"
  const specialChars = "!@#$%"
  const allChars = upperCaseChars + lowerCaseChars + numberChars + specialChars

  if (length < 4) {
    throw new Error("Password length must be at least 4 characters")
  }

  let password = ""
  password += upperCaseChars[Math.floor(Math.random() * upperCaseChars.length)]
  password += numberChars[Math.floor(Math.random() * numberChars.length)]
  password += specialChars[Math.floor(Math.random() * specialChars.length)]

  for (let i = 3; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  return password
    .split("")
    .sort(() => 0.5 - Math.random())
    .join("")
}

export type OrgTreeItem = {
  value: string
  label: string
  children?: OrgTreeItem[]
}

export function buildOrgTree(
  list: Array<{
    Id: string
    sTen: string | null
    sParentId: string | null
    sMa: string | null
  }>,
  parentId = "0"
): OrgTreeItem[] {
  return list
    .filter((item) => (item.sParentId || "0") === parentId)
    .map((item) => ({
      label: [item.sMa, item.sTen].filter(Boolean).join(" - ") || "",
      value: item.Id,
      searchText: [item.sTen, item.sMa].filter(Boolean).join(" "),
      children: buildOrgTree(list, item.Id),
    }))
}
export const limitTreeDepth = (
  nodes: OrgTreeItem[],
  maxDepth: number,
  currentDepth = 1
): OrgTreeItem[] => {
  if (currentDepth > maxDepth) return []

  return nodes.map((node) => ({
    ...node,
    children:
      currentDepth === maxDepth
        ? undefined
        : limitTreeDepth(node.children || [], maxDepth, currentDepth + 1),
  }))
}

export const buildOrgFlat = (
  list: Array<{ Id: string; sTen: string | null; sParentId: string | null; sMa: string | null }>,
  parentId = "0"
): OrgTreeItem[] => {
  let result: OrgTreeItem[] = []
  list
    .filter((item) => (item.sParentId || "0") === parentId)
    .forEach((item) => {
      result.push({
        label: [item.sMa, item.sTen].filter(Boolean).join(" - ") || "",
        value: item.Id,
      })
      result = [...result, ...buildOrgFlat(list, item.Id)]
    })
  return result
}

export const validateExamScore = (score?: number | null) => {
  if (score === null || score === undefined) {
    return Promise.resolve()
  }
  if (score < 0 || score > 10) {
    return Promise.reject(new Error("Điểm phải nằm trong khoảng từ 0 đến 10"))
  }

  const scaledValue = score * 10
  if (scaledValue !== Math.round(scaledValue)) {
    // message.error('Điểm phải là bội số của 0.1')
    return Promise.reject(new Error("Điểm phải là bội số của 0.1"))
  }
  return Promise.resolve()
}

export const validateScore = (score: number | null | undefined, isOnePoint: boolean) => {
  if (score === null || score === undefined) {
    return Promise.resolve()
  }
  if (score < 0 || score > 10) {
    return Promise.reject(new Error("Điểm phải nằm trong khoảng từ 0 đến 10"))
  }

  if (!isOnePoint) {
    if (score % 0.5 !== 0) {
      // message.error('Điểm phải là bội số của 0.5')
      return Promise.reject(new Error("Điểm phải là bội số của 0.5"))
    }
  } else {
    const scaledValue = score * 10
    if (scaledValue !== Math.round(scaledValue)) {
      // message.error('Điểm phải là bội số của 0.1')
      return Promise.reject(new Error("Điểm phải là bội số của 0.1"))
    }
  }

  return Promise.resolve()
}

// function buildOrgTree(
//     list: Array<{ id: string; name: string; parentId: string | null }>,
//     parentId = '0'
// ): Array<{ title: string; value: string; children: any[] }> {
//     return list
//         .filter((item) => (item.parentId ?? '0') === parentId)
//         .map((item) => ({
//             title: item.name,
//             value: item.id,
//             children: buildOrgTree(list, item.id),
//         }))
// }
