import { Pie } from "@ant-design/plots"
import type React from "react"
import { useEffect, useState } from "react"

interface ChartProps {
  className?: string
}

const PieChart: React.FC<ChartProps> = ({ className }) => {
  interface DataItem {
    type: string
    value: number
  }

  const [data, setData] = useState<DataItem[]>([])

  useEffect(() => {
    setTimeout(() => {
      setData([
        { type: "Học viên quân sự", value: 2000 },
        { type: "Sinh viên dân sự", value: 400 },
      ])
    }, 1000)
  }, [])

  const config = {
    data,
    angleField: "value",
    colorField: "type",
    label: {
      text: "value",
      style: { fontWeight: "bold" },
    },
    legend: {
      color: {
        position: "right",
        // rowPadding: 4,
      },
    },
  }

  return (
    <div className={className}>
      <Pie {...config} />
    </div>
  )
}

export default PieChart
