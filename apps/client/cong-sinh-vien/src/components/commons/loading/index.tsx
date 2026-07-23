import { Spin } from "antd"
import "./index.css"

function Loading() {
  return (
    <div className="loading-global">
      <div className="loading">
        <Spin spinning={true} size="large" />
      </div>
    </div>
  )
}

export default Loading
