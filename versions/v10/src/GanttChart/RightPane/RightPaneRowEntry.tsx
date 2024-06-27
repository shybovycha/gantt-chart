import React from "react";

import style from "../gantt.module.css";

export interface RightPaneRowProps {
  id: string;
  start: number;
  end: number;
}

export const RightPaneRowEntry = ({
  id,
  start,
  end,
  children,
}: PropsWithChildren<RightPaneRowProps>) => {
  const onDragStart = (evt) => {
    evt.dataTransfer.setData(
      "application/json",
      JSON.stringify({ source: id })
    );
  };

  return (
    <div
      className={style.entry}
      style={{
        "--col-start": start,
        "--col-end": end,
      }}
      draggable
      onDragStart={onDragStart}
    >
      {children}
    </div>
  );
};
