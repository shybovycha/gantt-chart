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

const RightPaneRow = ({ id, name, columns }) => {
  const gridTemplate = `auto / repeat(${columns}, 1fr)`;

  return (
    <div
      className={style.row}
      style={{
        gridTemplate,
      }}
    >
      <div className={style.entry} style={{ left: 0 }}>
        {id} {/* TODO put data in columns here */}
      </div>
    </div>
  );
};

const RightPane = ({ items, columns }) => {
  const gridTemplate = `auto / repeat(${columns}, 1fr)`;

  const columnHeaders = [...Array(columns)].map((_, idx) => (
    <div>{idx + 1}</div>
  ));

  return (
    <div className={style.right_pane}>
      <div
        className={style.right_pane_header}
        style={{
          gridTemplate,
        }}
      >
        {columnHeaders}
      </div>
      <div className={style.right_pane_rows}>
        {items.map((item) => (
          <RightPaneRow key={item.id} columns={columns} {...item} />
        ))}
      </div>
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
