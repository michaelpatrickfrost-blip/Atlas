/** Retain installed desktop callers when /atlas moves to its own route group. */
export function withAdminActionAliases<T>(actions: Record<string, T>): Record<string, T> {
  const result = { ...actions };
  for (const [key, action] of Object.entries(actions)) {
    const alias = key.startsWith("src/app/(admin)/atlas/") ? key.replace("src/app/(admin)/atlas/", "src/app/(app)/atlas/") : key.startsWith("src/app/(app)/atlas/") ? key.replace("src/app/(app)/atlas/", "src/app/(admin)/atlas/") : null;
    if (!alias) continue;
    if (Object.hasOwn(result, alias) && result[alias] !== action) throw new Error(`Conflicting Admin action alias: ${alias}`);
    result[alias] = action;
  }
  return result;
}
