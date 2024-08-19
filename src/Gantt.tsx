import React, { useMemo, useState } from "react";
import classnames from "classnames";

import style from "./gantt.module.css";

const LeftPaneRow = ({ id, name }) => {
  return <div className={style.row}>{name}</div>;
};

const LeftPane = ({ items }) => {
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

const RightPaneRow = ({ id, columns, children }) => {
  const gridTemplate = `auto / repeat(${columns}, 1fr)`;

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
      style={{
        gridTemplate,
      }}
      onDragEnter={onEnter}
      onDragLeave={onLeave}
    >
      {children}
    </div>
  );
};

const RightPanelRowEntry = ({ id, start, end, children }) => {
  const gridArea = `1 / ${start} / 1 / ${end}`;

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
        gridArea,
      }}
      draggable
      onDragStart={onDragStart}
    >
      {children}
    </div>
  );
};

const RightPaneHeaderRow = ({ columns, children }) => {
  const gridTemplate = `auto / repeat(${columns}, 1fr)`;

  return (
    <div
      className={style.right_pane_header_row}
      style={{
        gridTemplate,
      }}
    >
      {children}
    </div>
  );
};

const RightPaneHeader = ({ children }) => {
  return <div className={style.right_pane_header}>{children}</div>;
};

const RightPane = ({ items, columns }) => {
  const columnHeaders = [...Array(columns)].map((_, idx) => (
    <RightPaneHeader>{idx + 1}</RightPaneHeader>
  ));

  const rows = items.map((item) => (
    <RightPaneRow key={item.id} columns={columns}>
      <RightPanelRowEntry {...item}>{item.id}</RightPanelRowEntry>
    </RightPaneRow>
  ));

  return (
    <div className={style.right_pane}>
      <RightPaneHeaderRow columns={columns}>{columnHeaders}</RightPaneHeaderRow>
      <div className={style.right_pane_rows}>{rows}</div>
    </div>
  );
};

export const flattenTree = (items) => {
  const queue = [];

  items.filter(({ parent }) => !parent).forEach((item) => queue.push(item));

  const result = [];
  const visited = new Set();

  while (queue.length > 0) {
    const item = queue.shift();

    if (visited.has(item.id)) {
      continue;
    }

    result.push(item);
    visited.add(item.id);

    items
      .filter((child) => child.parent === item.id)
      .forEach((child) => queue.unshift(child));
  }

  return result;
};

export const Gantt = ({ items }) => {
  const itemList = useMemo(() => flattenTree(items), [items]);

  return (
    <div className={style.gantt}>
      <LeftPane items={itemList} />
      <RightPane items={itemList} columns={12} />
    </div>
  );
};
