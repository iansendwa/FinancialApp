import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

function ExpenseBreakdownChart({ data }) {
  if (!data || data.length === 0) {
    return <p>No expense data available for the current month.</p>;
  }

  const labels = data.map((item) => item.category);
  const amounts = data.map((item) => item.amount);
  const backgroundColors = [
    'rgba(255, 99, 132, 0.6)',
    'rgba(54, 162, 235, 0.6)',
    'rgba(255, 206, 86, 0.6)',
    'rgba(75, 192, 192, 0.6)',
    'rgba(153, 102, 255, 0.6)',
    'rgba(255, 159, 64, 0.6)',
  ];
  const borderColor = 'rgba(0, 0, 0, 0.1)';

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Expense Breakdown',
        data: amounts,
        backgroundColor: backgroundColors,
        borderColor: borderColor,
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            let label = context.label || '';
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
      <h4>Expense Breakdown</h4>
      <div style={{ height: '300px', width: '300px' }}>
        <Pie data={chartData} options={options} />
      </div>
    </div>
  );
}

export default ExpenseBreakdownChart;