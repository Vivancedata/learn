/** Index into an array in a test, failing loudly instead of yielding `undefined`. */
export function at<T>(items: ArrayLike<T>, index: number): T {
  const item = items[index]
  if (item === undefined) {
    throw new Error(`Expected an item at index ${index}, but the collection has ${items.length}`)
  }
  return item
}
