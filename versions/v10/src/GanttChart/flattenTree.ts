import type { GanttChartItem } from "./types";

export type GanttChartItemWithLevel = GanttChartItem & { level: number };

export const flattenTree = (
  items: GanttChartItem[]
): GanttChartItemWithLevel[] => {
  type QueueItem = { level: number; item: GanttChartItem };

  const queue: QueueItem[] = [];
  const result: GanttChartItemWithLevel[] = [];
  const visited = new Set<string>();

  items
    .filter(({ parent }) => !parent)
    .forEach((item) => queue.push({ level: 0, item }));

  while (queue.length > 0) {
    const { level, item } = queue.shift()!;

    if (visited.has(item.id)) {
      continue;
    }

    result.push({ ...item, level });
    visited.add(item.id);

    items
      .filter((child) => child.parent === item.id)
      .forEach((child) => queue.unshift({ item: child, level: level + 1 }));
  }

  return result;
};
