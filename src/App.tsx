import "./styles.css";

import { Gantt } from "./Gantt";

import { data } from "./data";

export default function App() {
  const scale = ({ start, end }) => {
    return { start: start * 2, end: end * 2 };
  };

  return <Gantt items={data} scale={scale} />;
}
