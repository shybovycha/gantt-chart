import React from "react";

import style from "../gantt.module.css";

export const RightPaneHeader = ({ children }) => {
  return <div className={style.right_pane_header}>{children}</div>;
};
