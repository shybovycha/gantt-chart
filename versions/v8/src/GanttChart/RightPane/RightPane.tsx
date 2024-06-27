import React from "react";

import { RightPaneHeader } from "./RightPaneHeader";
import { RightPaneHeaderRow } from "./RightPaneHeaderRow";
import { RightPaneRow } from "./RightPaneRow";
import { RightPaneRowEntry } from "./RightPaneRowEntry";

import type { GanttChartItem } from "../../types";

import style from "../gantt.module.css";

export interface RightPaneProps {
  items: Partial<GanttChartItem>[];
  columns: number;
  scaleLabel: (column: number) => React.Element;
}

export const RightPane = ({ items, columns, scaleLabel }: RightPaneProps) => {
  const columnHeaders = [...Array(columns)].map((_, idx) => (
    <RightPaneHeader>{scaleLabel(idx)}</RightPaneHeader>
  ));

  const rows = items.map((item) => (
    <RightPaneRow key={item.id} columns={columns}>
      <RightPaneRowEntry {...item}>{item.id}</RightPaneRowEntry>
    </RightPaneRow>
  ));

  return (
    <div className={style.right_pane} style={{ "--columns": columns }}>
      <RightPaneHeaderRow>{columnHeaders}</RightPaneHeaderRow>
      <div className={style.right_pane_rows}>{rows}</div>
    </div>
  );
};
