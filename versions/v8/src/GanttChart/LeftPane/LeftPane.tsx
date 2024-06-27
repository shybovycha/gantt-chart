import React from "react";
import { GanttChartItemWithLevel } from "./flattenTree";

import { LeftPaneRow } from "./LeftPaneRow";

import style from "../gantt.module.css";

export interface LeftPaneProps {
  items: GanttChartItemWithLevel[];
}

export const LeftPane = ({ items }: LeftPaneProps) => {
  return (
    <div className={style.left_pane}>
      <div className={style.left_pane_header}>/</div>

      <div className={style.left_pane_rows}>
        {items.map((item) => (
          <LeftPaneRow key={item.id} {...item} />
        ))}
      </div>
    </div>
  );
};
