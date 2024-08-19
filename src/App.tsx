import "./styles.css";

import { Gantt } from "./Gantt";

import { data } from "./data";

export default function App() {
  return <Gantt items={data} />;
}
