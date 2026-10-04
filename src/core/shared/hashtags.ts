/** Tags group a customer or a sale. They are not a customer purchase order. */
export function parseTags(value: string) {
  const parts = value.includes("#") ? value.split(/[\s,]+/) : value.split(",");
  const tags = [...new Set(parts.map((part) => part.trim().replace(/^#+/, "").toLowerCase()).filter(Boolean))];
  if (tags.length > 20 || tags.some((tag) => tag.length > 40 || !/^[-\p{L}\p{N} _]+$/u.test(tag))) {
    throw new Error("Use up to 20 tags, each at most 40 letters, numbers, spaces or hyphens.");
  }
  return tags;
}

export function tagLabel(tag: string) {
  return tag.trim().replace(/\s+/g, "-");
}

// Deprecated: use parseTags instead
export const parseHashtags = parseTags;
// Deprecated: use tagLabel instead
export const hashtagLabel = (tag: string) => `#${tagLabel(tag)}`;
