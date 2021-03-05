import {
  startOfDay,
  add as addDuration
} from "date-fns";

import { GanttChart } from './gantt-chart';

const data = [
  {
    id: "m1",
    title: "milestone 1",
    start: addDuration(startOfDay(new Date()), { days: 1 }),
    end: addDuration(startOfDay(new Date()), { days: 2 }),
    dependencies: []
  },

  {
    id: "m2",
    title: "milestone 2",
    start: addDuration(startOfDay(new Date()), { days: -1 }),
    end: addDuration(startOfDay(new Date()), { days: 1 }),
    dependencies: []
  },

  {
    id: "m3",
    title: "milestone 3",
    start: addDuration(startOfDay(new Date()), { days: 4 }),
    end: addDuration(startOfDay(new Date()), { days: 5 }),
    dependencies: []
  },

  {
    id: "m4",
    title: "milestone 4",
    start: addDuration(startOfDay(new Date()), { days: 3 }),
    end: addDuration(startOfDay(new Date()), { days: 6 }),
    dependencies: []
  },
];

const chart = new GanttChart(document.querySelector('#chart'), data);

chart.addEventListener('milestonemove', (e) => console.log('Milestone moved', e.detail));
chart.addEventListener('milestoneresize', (e) => console.log('Milestone resized', e.detail));

chart.render();
