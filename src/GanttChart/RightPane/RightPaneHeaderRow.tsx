import React from "react";

import style from "../gantt.module.css";

export const RightPaneHeaderRow = ({ children }) => {
  return <div className={style.right_pane_header_row}>{children}</div>;
};
