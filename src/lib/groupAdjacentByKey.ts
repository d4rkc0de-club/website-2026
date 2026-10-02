export type AdjacentGroup<Item, Key> = { key: Key; items: Item[] };

export function groupAdjacentByKey<Item, Key>(
  items: readonly Item[],
  getKey: (item: Item) => Key,
): AdjacentGroup<Item, Key>[] {
  const groups: AdjacentGroup<Item, Key>[] = [];
  items.forEach((item) => {
    const key = getKey(item);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.key === key) lastGroup.items.push(item);
    else groups.push({ key, items: [item] });
  });
  return groups;
}
