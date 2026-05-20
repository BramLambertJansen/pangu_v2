/** Safely extracts an error message from a failed API response. */
export async function getApiError(res: Response, fallback: string): Promise<string> {
  try {
    const json = await res.json() as { error?: string }
    return json.error ?? fallback
  } catch {
    return fallback
  }
}
