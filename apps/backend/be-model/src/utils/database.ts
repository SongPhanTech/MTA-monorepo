export function ensureDatabaseInUrl(url: string, dbName: string): string {
  return `${url.replaceAll("/","")}/${dbName}`
}
