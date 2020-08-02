import { createGanttChart } from './gantt-chart';

const data = [
  {
    startDate: '2017-02-27',
    endDate: '2017-03-04',
    label: 'milestone 01',
    id: 'm01',
    dependsOn: [],
  },
  {
    startDate: '2017-02-23',
    endDate: '2017-03-01',
    label: 'milestone 06',
    id: 'm06',
    dependsOn: ['m01'],
  },
  {
    duration: [7, 'days'],
    endDate: '2017-03-24',
    label: 'milestone 02',
    id: 'm02',
    dependsOn: ['m04'],
  },
  {
    startDate: '2017-02-27',
    duration: [12, 'days'],
    label: 'milestone 03',
    id: 'm03',
    dependsOn: ['m01'],
  },
  {
    endDate: '2017-03-17',
    duration: [5, 'days'],
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
