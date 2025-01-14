import React from 'react'
import { Row, Col } from 'antd'

interface FieldProps {
    label: string
    value: string | number | React.ReactNode
}

interface CardDetailProps {
    fields: FieldProps[]
    className?: string
}

const CardDetail: React.FC<CardDetailProps> = ({ fields, className }) => {
    return (
        <div
            className={`p-4 mt-4 bg-[#D5EBDB] rounded-md border border-[#7bd198] ${className || ''}`}
        >
            <Row gutter={[8, 8]}>
                {fields.map((field, index) => (
                    <React.Fragment key={index}>
                        <Col span={4}>
                            <p className="font-semibold text-base">
                                {field.label}
                            </p>
                        </Col>
                        <Col span={20}>
                            <p className="text-base">: {field.value}</p>
                        </Col>
                    </React.Fragment>
                ))}
            </Row>
        </div>
    )
}

export default CardDetail
