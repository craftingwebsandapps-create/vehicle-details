export const getByPath = (
  obj: Record<string, unknown>,
  path: string
): unknown => {
  return path.split(".").reduce<unknown>((acc, segment) => {
    if (acc === null || acc === undefined) {
      return undefined
    }

    if (typeof acc !== "object") {
      return undefined
    }

    return (acc as Record<string, unknown>)[segment]
  }, obj)
}

export const setByPath = (
  obj: Record<string, unknown>,
  path: string,
  value: unknown
) => {
  const segments = path.split(".")
  const target = { ...obj }
  let cursor: Record<string, unknown> = target

  segments.forEach((segment, index) => {
    const isLast = index === segments.length - 1

    if (isLast) {
      cursor[segment] = value
      return
    }

    const currentValue = cursor[segment]

    if (!currentValue || typeof currentValue !== "object") {
      cursor[segment] = {}
    }

    cursor = cursor[segment] as Record<string, unknown>
  })

  return target
}
