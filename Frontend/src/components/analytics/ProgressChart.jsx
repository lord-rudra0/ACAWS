import React from 'react';
import { Card, Typography, Empty } from 'antd';
import { Line } from 'react-chartjs-2';
import { format } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const { Title: AntdTitle } = Typography;

const ProgressChart = ({ progressData }) => {
  if (!progressData || progressData.length === 0) {
    return (
      <Card className="progress-chart-card">
        <Empty description="No progress data available" />
      </Card>
    );
  }

  // Process progress data
  const processData = () => {
    const labels = [];
    const completionData = [];
    const scoreData = [];
    const timeSpentData = [];

    // Sort data by date
    const sortedData = [...progressData].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    // Extract data for chart
    sortedData.forEach(item => {
      labels.push(format(new Date(item.date), 'MMM d'));
      completionData.push(item.completionPercentage || 0);
      scoreData.push(item.averageScore || 0);
      timeSpentData.push(Math.round((item.timeSpent || 0) / 60)); // Convert to hours
    });

    return {
      labels,
      datasets: [
        {
          label: 'Completion %',
          data: completionData,
          borderColor: '#52c41a',
          backgroundColor: 'rgba(82, 196, 26, 0.1)',
          tension: 0.4,
          fill: true,
          yAxisID: 'y',
        },
        {
          label: 'Average Score',
          data: scoreData,
          borderColor: '#1890ff',
          backgroundColor: 'transparent',
          tension: 0.4,
          borderDash: [5, 5],
          yAxisID: 'y1',
        },
        {
          label: 'Time Spent (hrs)',
          data: timeSpentData,
          borderColor: '#722ed1',
          backgroundColor: 'transparent',
          tension: 0.4,
          borderDash: [3, 3],
          yAxisID: 'y2',
        },
      ],
    };
  };

  const chartData = processData();

  const options = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: 'Learning Progress Over Time',
        font: {
          size: 16,
          weight: '500',
        },
        padding: { bottom: 20 },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (label.includes('%')) {
                label += context.parsed.y + '%';
              } else if (label.includes('Score')) {
                label += context.parsed.y + '%';
              } else {
                label += context.parsed.y + ' hrs';
              }
            }
            return label;
          }
        }
      },
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          boxWidth: 12,
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 0,
          autoSkipPadding: 16,
        },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Completion %',
        },
        min: 0,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%';
          },
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Score %',
        },
        min: 0,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%';
          },
        },
      },
      y2: {
        type: 'linear',
        display: false,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        min: 0,
      },
    },
  };

  return (
    <Card className="progress-chart-card">
      <div className="chart-container">
        <Line data={chartData} options={options} />
      </div>
      <style jsx global>{`
        .progress-chart-card {
          margin-bottom: 24px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        .chart-container {
          position: relative;
          height: 350px;
          width: 100%;
        }
        @media (max-width: 768px) {
          .chart-container {
            height: 300px;
          }
        }
      `}</style>
    </Card>
  );
};

export default ProgressChart;
