/** Longest slug in a file name. A constant so it is easy to change. */
export const SLUG_MAX = 50;
/** Used when a title has no letters or digits. */
export const EMPTY_SLUG = "task";

/** Lowercase ASCII letters and digits, other runs become one hyphen, cut to SLUG_MAX. */
export function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/, "");
  return slug === "" ? EMPTY_SLUG : slug;
}

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
