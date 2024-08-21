import React from "react";

import { LeftPane } from "./LeftPane/LeftPane";
import { RightPane } from "./RightPane/RightPane";

import { minBy, maxBy } from "./utils";
import { flattenTree } from "./flattenTree";

import style from "./gantt.module.css";

import type { GanttChartItem } from "./types";

export interface GanttChartProps {
  items: GanttChartItem[];
  barLabel: (item: GanttChartItem) => React.Element;
  scale: (item: GanttChartItem) => { start: number; end: number };
  scaleLabel: (column: number) => React.Element;
}

export const Chart = ({
  items,
  barLabel,
  scale,
  scaleLabel,
}: GanttChartProps) => {
  const itemList = flattenTree(items).map((item) => ({
    ...item,
    ...scale(item),
  }));

  const minStartItem = minBy(itemList, (item) => item.start);
  const maxEndItem = maxBy(itemList, (item) => item.end);

  const columns = maxEndItem.end - minStartItem.start;

  return (
    <div className={style.gantt}>
      <LeftPane items={itemList} />
      <RightPane
        items={itemList}
        columns={columns}
        scaleLabel={scaleLabel}
        barLabel={barLabel}
      />
    </div>
  );
};
