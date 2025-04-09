import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, Tooltip, Legend, CategoryScale, LinearScale } from 'chart.js';

ChartJS.register(LineElement, PointElement, Tooltip, Legend, CategoryScale, LinearScale);

function TrendChart({ data }) {
  if (!data || data.length === 0) {
    return <p>No trend data available.</p>;
  }

  // Assuming 'data' is an array of objects with 'date' and 'balance' properties
  const labels = data.map((item) => new Date(item.date).toLocaleDateString());
  const balances = data.map((item) => item.balance);

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Balance Trend',
        data: balances,
        fill: false,
        backgroundColor: 'rgb(75, 192, 192)',
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'category',
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        type: 'linear',
        title: {
          display: true,
          text: 'Balance',
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y); // Adjust currency as needed
            }
            return label;
          },
        },
      },
    },
  };

  return (
    <div>
      <h4>Balance Trend</h4>
      <div style={{ height: '300px', width: '80%' }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}

export default TrendChart;