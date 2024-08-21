export function minBy<T>(
  items: T[],
  selector: (item: T) => number
): T | undefined {
  if (items.length === 0) {
    return undefined;
  }

  let minIndex = 0;

  items.forEach((item, index) => {
    if (selector(item) < selector(items[minIndex])) {
      minIndex = index;
    }
  });

  return items[minIndex];
}

export function maxBy<T>(
  items: T[],
  selector: (item: T) => number
): T | undefined {
  if (items.length === 0) {
    return undefined;
  }

  let maxIndex = 0;

  items.forEach((item, index) => {
    if (selector(item) > selector(items[maxIndex])) {
      maxIndex = index;
    }
  });

  return items[maxIndex];
}
