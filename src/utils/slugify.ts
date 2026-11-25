export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"’]/g, '')
    .replace(/[^a-z0-9\u0980-\u09FF]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

export function uniqueSlug(base: string, existing: string[]): string {
  if (!existing.includes(base)) return base
  let index = 2
  while (existing.includes(`${base}-${index}`)) index += 1
  return `${base}-${index}`
}
