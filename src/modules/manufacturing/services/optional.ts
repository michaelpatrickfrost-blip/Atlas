/** A feature whose store the central server has not caught up with yet (table missing, or model not
 * yet on its read allowlist) should fall back to its default rather than take the whole page down. */
export function storeUnavailable(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return /missing data capability|does not exist|P2021|P2022/.test(message);
}

export async function optionalStore<T>(run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (storeUnavailable(error)) return fallback;
    throw error;
  }
}
