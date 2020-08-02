import { createGanttChart } from './gantt-chart';

const data = [
  {
    startDate: new Date('2020-02-27T00:00:00'),
    endDate: new Date('2020-03-04T00:00:00'),
    label: 'milestone 01',
    id: 'm01',
    dependsOn: [],
  },
  {
    startDate: new Date('2020-02-23T00:00:00'),
    endDate: new Date('2020-03-01T00:00:00'),
    label: 'milestone 06',
    id: 'm06',
    dependsOn: ['m01'],
  },
  {
    duration: 7 * 24 * 60 * 60 * 1000, // 7 days
    endDate: new Date('2020-03-24T00:00:00'),
    label: 'milestone 02',
    id: 'm02',
    dependsOn: ['m04'],
  },
  {
    startDate: new Date('2020-02-27T00:00:00'),
    duration: 12 * 24 * 60 * 60 * 1000, // 12 days
    label: 'milestone 03',
    id: 'm03',
    dependsOn: ['m01'],
  },
  {
    endDate: new Date('2020-03-17T00:00:00'),
    duration: 5 * 24 * 60 * 60 * 1000, // 5 days
    label: 'milestone 04',
    id: 'm04',
    dependsOn: ['m01'],
  },
];

createGanttChart(
  document.querySelector('#chart'),
  data,
  {
    elementHeight: 20,
    sortMode: 'date', // alternatively, 'childrenCount'
    svgOptions: {
      width: 1200,
      height: 400,
      fontSize: 12
    }
  }
);
