export async function readStreamToText(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader()
  const decoder = new TextDecoder("utf-8")
  let result = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    result += decoder.decode(value, { stream: true })
  }

  return result
}

export async function readStreamWithLiveUpdate(
  stream: ReadableStream<Uint8Array>,
  onChunk: (chunk: string, accumulated: string) => void
): Promise<string> {
  const reader = stream.getReader()
  const decoder = new TextDecoder("utf-8")
  let result = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    result += chunk
    onChunk(chunk, result)
  }

  return result
}
