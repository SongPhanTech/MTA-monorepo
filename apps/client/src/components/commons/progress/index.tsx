import React from 'react'
import './index.css'
import { Progress } from 'antd'

type ProgressBarProps = {
    title: string
    percent: number
}

function ProgressBar(props: ProgressBarProps) {
    return (
        <div className="progress-global">
            <h2 align-text="center">{props.title}</h2>
            <div className="progress">
                <Progress
                    type="circle"
                    strokeColor={{
                        '0%': '#108ee9',
                        '100%': '#87d068',
                    }}
                    percent={props.percent}
                />
            </div>
        </div>
    )
}

export default ProgressBar
