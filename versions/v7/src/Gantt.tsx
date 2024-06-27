import React, { useMemo, useState } from "react";
import classnames from "classnames";

import style from "./gantt.module.css";

const LeftPaneRow = ({ level, id, name }) => {
  const nestingPadding = `${level}rem`;

  return (
    <div className={style.row} style={{ "--label-padding": nestingPadding }}>
      {name}
    </div>
  );
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

const RightPanelRowEntry = ({ id, start, end, children }) => {
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

const RightPaneHeaderRow = ({ children }) => {
  return <div className={style.right_pane_header_row}>{children}</div>;
};

const RightPaneHeader = ({ children }) => {
  return <div className={style.right_pane_header}>{children}</div>;
};

const RightPane = ({ items, columns, scaleLabel }) => {
  const columnHeaders = [...Array(columns)].map((_, idx) => (
    <RightPaneHeader>{scaleLabel(idx)}</RightPaneHeader>
  ));

  const rows = items.map((item) => (
    <RightPaneRow key={item.id} columns={columns}>
      <RightPanelRowEntry {...item}>{item.id}</RightPanelRowEntry>
    </RightPaneRow>
  ));

  return (
    <div className={style.right_pane} style={{ "--columns": columns }}>
      <RightPaneHeaderRow>{columnHeaders}</RightPaneHeaderRow>
      <div className={style.right_pane_rows}>{rows}</div>
    </div>
  );
};

export const flattenTree = (items) => {
  const queue = [];

  items
    .filter(({ parent }) => !parent)
    .forEach((item) => queue.push({ level: 0, item }));

  const result = [];
  const visited = new Set();

  while (queue.length > 0) {
    const { level, item } = queue.shift();

    if (visited.has(item.id)) {
      continue;
    }

    result.push({ ...item, level });
    visited.add(item.id);

    items
      .filter((child) => child.parent === item.id)
      .forEach((child) => queue.unshift({ item: child, level: level + 1 }));
  }

  return result;
};

function minBy<T>(items: T[], selector: (item: T) => number): T | undefined {
  if (items.length === 0) {
    return undefined;
  }

  let minIndex = 0;

  items.forEach((item, index) => {
    if (selector(item) < selector(items[minIndex])) {
      minIndex = index;
    }
  });

  return items[minIndex];
}

function maxBy<T>(items: T[], selector: (item: T) => number): T | undefined {
  if (items.length === 0) {
    return undefined;
  }

  let maxIndex = 0;

  items.forEach((item, index) => {
    if (selector(item) > selector(items[maxIndex])) {
      maxIndex = index;
    }
  });

  return items[maxIndex];
}

interface GanttChartItem {
  id: string;
  name: string;
}

interface GanttChartProps {
  items: GanttChartItem[];
  scale: (item: GanttChartItem) => { start: number; end: number };
  scaleLabel: (column: number) => React.Element;
}

export const Gantt = ({ items, scale, scaleLabel }: GanttChartProps) => {
  const itemList = flattenTree(items).map((item) => ({
    ...item,
    ...scale(item),
  }));

  const minStartItem = minBy(itemList, (item) => item.start);
  const maxEndItem = maxBy(itemList, (item) => item.end);

  const columns = maxEndItem.end - minStartItem.start;

  return (
    <div className={style.gantt}>
      <LeftPane items={itemList} />
      <RightPane items={itemList} columns={columns} scaleLabel={scaleLabel} />
    </div>
  );
};
