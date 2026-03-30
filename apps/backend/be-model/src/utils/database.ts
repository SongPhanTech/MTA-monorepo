export function ensureDatabaseInUrl(url: string, dbName: string): string {
  const obj = new URL(url)

  // pathName: "/dbname" hoặc "/"
  const path = obj.pathname

  if (path === "/" || path === "") {
    // Chưa có DB → thêm vào
    obj.pathname = `/${dbName}`
  }

  return obj.toString()
}
