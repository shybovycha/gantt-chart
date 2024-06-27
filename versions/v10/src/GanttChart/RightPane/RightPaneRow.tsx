import React, { useState } from "react";
import classnames from "classnames";

import style from "../gantt.module.css";

export const RightPaneRow = ({ children }) => {
  const [hover, setHover] = useState(false);

  const onEnter = (e) => {
    setHover(true);
    console.log(e);
  };

  const onLeave = () => {
    setHover(false);
  };

  return (
    <div
      className={classnames(style.row, {
        [style.left_pane_row__hovered]: hover,
      })}
      onDragEnter={onEnter}
      onDragLeave={onLeave}
    >
      {children}
    </div>
  );
};
