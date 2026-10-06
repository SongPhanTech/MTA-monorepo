import { formatDateInSlash, formatDateVn, formatNgayIn, formatThangIn } from "@workspace/libs/timezone"
import clsx, { type ClassValue } from "clsx"
import dayjs, { type Dayjs } from "dayjs"
import { twMerge } from "tailwind-merge"

const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs))
}
const getPageCount = (totalItems: number, itemsPerPage: number) => {
  return Math.ceil(totalItems / itemsPerPage)
}

const formatDate = (date: string | Date | Dayjs, unit?: "Day" | "Month" | "Year") => {
  if (unit === "Year") return formatDateVn(date, "YYYY")
  if (unit === "Month") return formatDateVn(date, "MM/YYYY")
  return formatDateInSlash(date)
}

const formatDateReadable = (date: string | Date | Dayjs) => {
  const d = dayjs(date)
  return `${d.hour().toString().padStart(2, "0")}h:${d.minute().toString().padStart(2, "0")} - ${formatNgayIn(d.date())}/${formatThangIn(d.month() + 1)}/${d.year()}`
}

const formatDateVN = (date: string | Date | Dayjs) => {
  const d = dayjs(date)
  return `Ngày ${formatNgayIn(d.date())} tháng ${formatThangIn(d.month() + 1)} năm ${d.year()}`
}

const getColorByIndex = (index: number) => {
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

const formatNiceBytes = (x: string | number | null) => {
  if (!x) return "0 kB"
  const units = ["bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
  let l = 0
  let n = Number.parseInt(`${x}`, 10) || 0
  while (n >= 1024 && ++l) {
    n = n / 1024
  }
  return `${n.toFixed(n < 10 && l > 0 ? 1 : 0)} ${units[l]}`
}

const getUniqueArray = <T>(arr: Array<T>, key: keyof T) => {
  return [...new Map(arr.map((item) => [item[key], item])).values()]
}

const stringToSlug = (str: string) => {
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

function generatePassword(length = 12): string {
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

export {
  formatDate,
  formatDateReadable,
  formatDateVN,
  formatNiceBytes,
  getColorByIndex,
  getPageCount,
  getUniqueArray,
  cn,
  stringToSlug,
  generatePassword,
}
