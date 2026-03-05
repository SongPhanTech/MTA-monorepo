import { $Enums } from '@workspace/db/client'
import { Card, Tag, Typography } from 'antd'
import dayjs from 'dayjs'

const { Text } = Typography

interface SubjectClassCardProps {
    index: number
    subjectName?: string | null
    subjectCode?: string | null
    semesterName?: string | null
    maxStudent?: number | null
    startDate?: string | Date | null
    endDate?: string | Date | null
    status?: $Enums.SubjectClassStatus | string | null
    onClick?: () => void
}

export const CardLopMonHoc = ({
    index,
    subjectName,
    subjectCode,
    semesterName,
    maxStudent,
    startDate,
    endDate,
    status,
    onClick,
}: SubjectClassCardProps) => {
    return (
        <Card
            hoverable
            size="small"
            onClick={onClick}
            className="h-full"
            style={{
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
                            {subjectCode}
                            {subjectName ? ` - ${subjectName}` : ''}
                        </Text>
                    </div>
                    {status && (
                        <Tag
                            color={
                                status === $Enums.SubjectClassStatus.OFFICIAL ? 'green' : 'default'
                            }
                            style={{ fontSize: 11 }}
                        >
                            {status === $Enums.SubjectClassStatus.OFFICIAL ? 'Chính thức' : 'Nháp'}
                        </Tag>
                    )}
                </div>

                <Text strong style={{ fontSize: 15 }} ellipsis>
                    {subjectName || ''}
                </Text>

                {/* Semester & Student count */}
                <div className="flex items-center gap-3">
                    {semesterName && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Học kỳ: {semesterName}
                        </Text>
                    )}
                    {maxStudent != null && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Sĩ số: {maxStudent}
                        </Text>
                    )}
                </div>

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
