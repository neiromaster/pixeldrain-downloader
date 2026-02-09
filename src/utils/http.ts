export async function downloadStream(
  url: string,
  options: RequestInit,
  onChunk: (chunk: Uint8Array) => void,
): Promise<Response> {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(value);
  }

  return response;
}
