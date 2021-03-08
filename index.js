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
    dependencies: {
      "m2": "start-to-start"
    },
    completed: 0.6,
  },

  {
    id: "m2",
    title: "milestone 2",
    start: addDuration(startOfDay(new Date()), { days: -1 }),
    end: addDuration(startOfDay(new Date()), { days: 1 }),
    dependencies: {
        "m3": "end-to-start",
      "m4": "end-to-end"
    },
    completed: 0,
  },

  {
    id: "m3",
    title: "milestone 3",
    start: addDuration(startOfDay(new Date()), { days: 4 }),
    end: addDuration(startOfDay(new Date()), { days: 5 }),
    dependencies: [],
    completed: 0.75,
  },

  {
    id: "m4",
    title: "milestone 4",
    start: addDuration(startOfDay(new Date()), { days: 3 }),
    end: addDuration(startOfDay(new Date()), { days: 6 }),
    dependencies: [],
    completed: 0.2,
  },
];

const parentElt = document.querySelector('#gantt-chart');

const chart = new GanttChart(parentElt, data);

chart.addEventListener('milestonemove', (e) => console.log('Milestone moved', e.detail));
chart.addEventListener('milestoneresize', (e) => console.log('Milestone resized', e.detail));

chart.render();

const zoomOutBtn = document.querySelector('#zoom-out');
zoomOutBtn.addEventListener('click', () => chart.zoom(0.75));

const zoomInBtn = document.querySelector('#zoom-in');
zoomInBtn.addEventListener('click', () => chart.zoom(1.25));
