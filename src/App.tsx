import "./styles.css";

import { Gantt } from "./Gantt";

import { data } from "./data";

export default function App() {
  const scale = ({ start, end }) => {
    return { start: start * 4, end: end * 4 };
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

  return <Gantt items={data} scale={scale} scaleLabel={scaleLabel} />;
}
