import React, { useMemo } from "react";

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

const RightPaneRow = ({ id, name, columns, start, end }) => {
  const gridTemplate = `auto / repeat(${columns}, 1fr)`;
  const gridArea = `1 / ${start} / 1 / ${end}`;

  return (
    <div
      className={style.row}
      style={{
        gridTemplate,
      }}
    >
      <div
        className={style.entry}
        style={{
          gridArea,
        }}
      >
        {id}
      </div>
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
    <RightPaneRow key={item.id} columns={columns} {...item} />
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
