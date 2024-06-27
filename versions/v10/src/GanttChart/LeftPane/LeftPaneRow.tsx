import React from "react";
import { GanttChartItemWithLevel } from "./flattenTree";

import style from "../gantt.module.css";

export type LeftPaneRowProps = Partial<GanttChartItemWithLevel>;

export const LeftPaneRow = ({ level, name }: LeftPaneRowProps) => {
  const nestingPadding = `${level}rem`;

  return (
    <div className={style.row} style={{ "--label-padding": nestingPadding }}>
      <span dangerouslySetInnerHTML={{__html: name}}></span>
    </div>
  );
};
