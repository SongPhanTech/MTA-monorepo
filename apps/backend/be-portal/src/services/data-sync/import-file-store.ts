import { mkdir, readFile, unlink, writeFile } from "node:fs/promises"
import { join } from "node:path"

export function importDir() {
  return process.env.DATA_SYNC_IMPORT_DIR || "/tmp/mta-import"
}

export async function saveImportFile(
  syncHistoryId: string,
  bytes: Buffer | Uint8Array
): Promise<string> {
  const dir = importDir()
  await mkdir(dir, { recursive: true })
  const filePath = join(dir, `${syncHistoryId}.json`)
  await writeFile(filePath, bytes)
  return filePath
}

export async function readImportJson(filePath: string): Promise<unknown> {
  const text = await readFile(filePath, "utf8")
  return JSON.parse(text)
}

export async function removeImportFile(filePath: string): Promise<void> {
  await unlink(filePath).catch(() => undefined)
}
