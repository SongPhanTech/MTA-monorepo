import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js"
import { Line } from "react-chartjs-2"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

export const options = {
  responsive: true,
  plugins: {
    legend: {
      position: "top" as const,
    },
    title: {
      display: true,
      // text: 'Chart.js Line Chart',
    },
  },
}

const labels = ["January", "February", "March", "April", "May", "June", "July"]

// Hàm tạo dữ liệu ngẫu nhiên trong khoảng giá trị cho trước
const generateRandomData = (min: number, max: number, length: number) => {
  return Array.from({ length }, () => Math.floor(Math.random() * (max - min + 1)) + min)
}

export const data = {
  labels,
  datasets: [
    {
      label: "Dataset 1",
      data: generateRandomData(-1000, 1000, labels.length), // Dữ liệu ngẫu nhiên cho dataset 1
      borderColor: "rgb(255, 99, 132)",
      backgroundColor: "rgba(255, 99, 132, 0.5)",
    },
    {
      label: "Dataset 2",
      data: generateRandomData(-1000, 1000, labels.length), // Dữ liệu ngẫu nhiên cho dataset 2
      borderColor: "rgb(53, 162, 235)",
      backgroundColor: "rgba(53, 162, 235, 0.5)",
    },
  ],
}

export function LineChart() {
  return <Line options={options} data={data} />
}
