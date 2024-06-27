import pluralize from "pluralize";

import { Chart } from "./GanttChart";

import { data } from "./data";

import "./styles.css";

export default function App() {
  const scale = ({ start, end }) => {
    return { start, end };
  };

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const scaleLabel = (col) => months[col % 12];

  const barLabel = ({ start, end }) => (
    <>
      {end - start} {pluralize("month", end - start)}
    </>
  );

  return (
    <Chart
      items={data}
      scale={scale}
      scaleLabel={scaleLabel}
      barLabel={barLabel}
    />
  );
}
