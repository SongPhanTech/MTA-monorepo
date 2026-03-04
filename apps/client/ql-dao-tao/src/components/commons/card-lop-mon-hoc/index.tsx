import { CalendarOutlined, CopyOutlined, ReadOutlined } from '@ant-design/icons'
import { Card, Col, Row, Tag, Tooltip, Typography } from 'antd'
import dayjs from 'dayjs'

const { Text } = Typography

interface SubjectClassCardProps {
    index: number
    code?: string | null
    name?: string | null
    subjectName?: string | null
    subjectCode?: string | null
    semesterName?: string | null
    maxStudent?: number | null
    currentStudent?: number | null
    startDate?: string | Date | null
    endDate?: string | Date | null
    status?: 'DRAFT' | 'OFFICIAL' | string | null
    totalSessions?: number | null
    completedSessions?: number | null
    onClick?: () => void
}

export const CardLopMonHoc = ({
    index,
    code,
    name,
    subjectName,
    subjectCode,
    semesterName,
    maxStudent,
    currentStudent,
    startDate,
    endDate,
    status,
    totalSessions,
    completedSessions,
    onClick,
}: SubjectClassCardProps) => {
    const completed = completedSessions ?? 0
    const total = totalSessions ?? maxStudent ?? 0

    return (
        <Card
            hoverable
            size="small"
            onClick={onClick}
            className="h-full"
            style={{
                borderTop: '3px solid #ff4d4f',
                borderRadius: 8,
                background: 'linear-gradient(135deg, #fff5f5 0%, #ffffff 50%)',
            }}
        >
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Tag
                            color="red"
                            style={{
                                borderRadius: '50%',
                                width: 28,
                                height: 28,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 12,
                                fontWeight: 'bold',
                                padding: 0,
                            }}
                        >
                            {String(index).padStart(2, '0')}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            {subjectCode || code}
                        </Text>
                        <Tooltip title="Sao chép mã lớp">
                            <CopyOutlined
                                style={{ color: '#999', cursor: 'pointer', fontSize: 13 }}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    navigator.clipboard.writeText(code || '')
                                }}
                            />
                        </Tooltip>
                    </div>
                    {status && (
                        <Tag
                            color={status === 'OFFICIAL' ? 'green' : 'default'}
                            style={{ fontSize: 11 }}
                        >
                            {status === 'OFFICIAL' ? 'Chính thức' : 'Nháp'}
                        </Tag>
                    )}
                </div>

                <Tooltip title={name || subjectName}>
                    <Text strong style={{ fontSize: 15 }} ellipsis>
                        {name || subjectName || '-'}
                    </Text>
                </Tooltip>

                <Row gutter={8}>
                    <Col>
                        <Tooltip title="Buổi học">
                            <CalendarOutlined style={{ marginRight: 4, color: '#666' }} />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {completed} / {total}
                            </Text>
                        </Tooltip>
                    </Col>
                    <Col>
                        <Tooltip title="Sĩ số">
                            <ReadOutlined style={{ marginRight: 4, color: '#666' }} />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {currentStudent ?? 0}
                            </Text>
                        </Tooltip>
                    </Col>
                </Row>

                {/* Semester */}
                {semesterName && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Học kỳ: {semesterName}
                    </Text>
                )}

                {/* Date range */}
                {(startDate || endDate) && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {startDate ? dayjs(startDate).format('DD/MM/YYYY') : '?'} -{' '}
                        {endDate ? dayjs(endDate).format('DD/MM/YYYY') : '?'}
                    </Text>
                )}
            </div>
        </Card>
    )
}
