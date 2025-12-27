export async function pReduce<TAcc, TItem>(
  items: readonly TItem[],
  reducer: (acc: TAcc, item: TItem) => TAcc | Promise<TAcc>,
  initial: TAcc
): Promise<TAcc> {
  let acc = initial
  for (const item of items) {
    acc = await reducer(acc, item)
  }
  return acc
}

export async function pMapSeries<TItem, TResult>(
  items: readonly TItem[],
  mapper: (item: TItem) => TResult | Promise<TResult>
): Promise<TResult[]> {
  const results: TResult[] = []
  for (const item of items) {
    results.push(await mapper(item))
  }
  return results
}



