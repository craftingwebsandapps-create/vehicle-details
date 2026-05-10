/** Footer text for paginated admin lists (avoids API jargon like "limit"). */
export function formatPaginationSummary(opts: {
  page: number
  pageSize: number
  total: number
  totalPages: number
}): string {
  const { page, pageSize, total, totalPages } = opts
  if (total <= 0) {
    return "No results"
  }
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)
  const fmt = (n: number) => n.toLocaleString()
  return `Showing ${fmt(start)}–${fmt(end)} of ${fmt(total)} · Page ${page} of ${totalPages}`
}
