import React from 'react';
import { Line } from 'react-chartjs-2';

const DataGraph = ({ data }) => {
  // Assuming 'data' is an array of { timestamp: Date, distance: number }

  // Convert data for Chart.js
  const chartData = {
    labels: data.map(item => item.timestamp.toLocaleTimeString()), // Convert timestamps to readable time strings
    datasets: [
      {
        label: 'Surface Distance',
        data: data.map(item => item.distance),
        fill: false,
        backgroundColor: 'rgb(255, 99, 132)',
        borderColor: 'rgba(255, 99, 132, 0.2)',
      },
    ],
  };

  const options = {
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'second'
        },
        title: {
          display: true,
          text: 'Time'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Distance (cm)'
        }
      }
    },
    maintainAspectRatio: false
  };

  return <Line data={chartData} options={options} />;
};

export default DataGraph;
