import { Bar } from "@ant-design/plots"
import type React from "react"
import { useMemo } from "react"

interface ChartProps {
  className?: string
  dataMap?: {
    value: number
    label: string
    state: string
  }[]
}

const BarChart: React.FC<ChartProps> = ({ className, dataMap }) => {
  const data = useMemo(() => {
    if (dataMap) {
      return dataMap
    }
    return []
  }, [dataMap])
  console.log(dataMap)

  const config = {
    data,
    xField: "label",
    yField: "value",
    colorField: "state",
    stack: true,
    axis: {
      y: { labelFormatter: "~s" },
      x: {
        labelSpacing: 4,
      },
    },
    yAxis: {
      type: "category",
      axisLabel: {
        width: 160, // giới hạn chiều dài
        overflow: "break", // tự xuống dòng
        lineHeight: 18,
      },
    },
  }

  return (
    <div className={className}>
      <Bar {...config} />
    </div>
  )
}

export default BarChart
