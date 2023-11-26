import React from 'react';
import { createRoot } from 'react-dom/client';

import {
  startOfDay,
  add as addDuration
} from "date-fns";

import { GanttChart } from '../src/GanttChart';

const data = [
  {
    id: "m1",
    title: "milestone 1",
    start: addDuration(startOfDay(new Date()), { days: 1 }),
    end: addDuration(startOfDay(new Date()), { days: 2 }),
    parent: "m2",
    completed: 0.6,
  },

  {
    id: "m2",
    title: "milestone 2",
    start: addDuration(startOfDay(new Date()), { days: -1 }),
    end: addDuration(startOfDay(new Date()), { days: 1 }),
    parent: "m3",
    completed: 0,
  },

  {
    id: "m3",
    title: "milestone 3",
    start: addDuration(startOfDay(new Date()), { days: 4 }),
    end: addDuration(startOfDay(new Date()), { days: 5 }),
    parent: null,
    completed: 0.75,
  },

  {
    id: "m4",
    title: "milestone 4",
    start: addDuration(startOfDay(new Date()), { days: 3 }),
    end: addDuration(startOfDay(new Date()), { days: 6 }),
    parent: null,
    completed: 0.2,
  },

  {
    id: "m5",
    title: "milestone 5",
    start: addDuration(startOfDay(new Date()), { days: 3 }),
    end: addDuration(startOfDay(new Date()), { days: 6 }),
    parent: null,
    completed: 0.2,
  },

  {
    id: "m6",
    title: "milestone 6",
    start: addDuration(startOfDay(new Date()), { days: 3 }),
    end: addDuration(startOfDay(new Date()), { days: 6 }),
    parent: null,
    completed: 0.2,
  },
];

const parentElt = document.querySelector('#root');
const root = createRoot(parentElt);

root.render(<GanttChart items={data} />);
