import Select from '@components/commons/select'
import DefaultLayout from '@layouts/default-layout'
import { useFindManyTrainingCourse, useFindManyTrainingMajor } from '@workspace/db/hooks'
import { debtStatistics, useOpenSubjectClassRetake } from '@workspace/libs/api/training'
import { getFilenameFromContentDisposition } from '@workspace/libs/utils'
import { useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
import { Button, Col, Form, Input, message, Row } from 'antd'
import {
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    Title,
    Tooltip,
} from 'chart.js'
import type React from 'react'
import { useMemo, useRef, useState } from 'react'
import { Bar, getElementAtEvent } from 'react-chartjs-2'
import HSSVChuaDat from '../../ke-hoach-giao-duc/lap-ke-hoach/_components/hssv-chua-dat'

interface SubjectBySemesterForm {
    searchText?: string
    trainingCourseId?: string
    trainingMajorId?: string
}

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function DangKyHocLai() {
    const [form] = Form.useForm<SubjectBySemesterForm>()
    const { id: semesterId } = useSemesterStore()
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const searchText = Form.useWatch('searchText', form)
    const trainingCourseId = Form.useWatch('trainingCourseId', form)
    const trainingMajorId = Form.useWatch('trainingMajorId', form)
    const [subjectVersionId, setSubjectVersionId] = useState<string>()
    const [loading, setLoading] = useState(false)

    const downloadStatsFile = async () => {
        if (!trainingObjectTypeId) {
            message.error('Vui lòng chọn ĐTĐT')
            return
        }
        if (!trainingCourseId) {
            message.error('Vui lòng chọn khoá đào tạo')
            return
        }
        try {
            setLoading(true)
            // TODO: cho chọn ngày hoặc lấy ngày từ HK đang chọn
            const { status, headers, data } = await debtStatistics({
                trainingObjectTypeId: trainingObjectTypeId,
                trainingCourseId,
            })
            if (status === 200) {
                const filename = getFilenameFromContentDisposition(
                    headers.get('content-disposition') as string
                )
                const blob = new Blob([data], { type: headers.get('content-type') as string })
                const url = window.URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = filename || 'thong-ke-no.xlsx'
                link.click()
                window.URL.revokeObjectURL(url)
            }
        } catch (error) {
            console.error(error)
            message.error('Lỗi khi tải file')
        } finally {
            setLoading(false)
        }
    }

    const { data: res } = useOpenSubjectClassRetake(
        {
            search: searchText || undefined,
            trainingCourseId,
            trainingMajorId,
            semesterId: semesterId || undefined,
            trainingObjectTypeId: trainingObjectTypeId as string,
        },
        { query: { enabled: !!trainingObjectTypeId } }
    )

    const { data: trainingMajorData = [] } = useFindManyTrainingMajor({
        orderBy: { name: 'asc' },
    })

    const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
        orderBy: { name: 'asc' },
        where: { trainingObjectTypeId, deletedAt: null, active: true },
    })

    const rawData = useMemo(() => (res?.status === 200 ? res?.data.data : []), [res])

    const options = useMemo(() => {
        return {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top' as const,
                },
                title: {
                    display: true,
                    text: rawData.length ? 'Số SV nợ' : 'Không có SV nợ',
                },
            },
        }
    }, [rawData.length])

    const labels = useMemo(() => {
        return rawData.map((item) => [item.code, item.name].join(' - '))
    }, [rawData])

    const data = {
        labels,
        datasets: [
            {
                label: 'SV nợ',
                data: rawData.map((item) => item.count),
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
            },
        ],
    }

    const chartRef = useRef()
    const onClick = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        if (!chartRef.current) return
        const e = getElementAtEvent(chartRef.current, event)
        if (e[0]) {
            setSubjectVersionId(rawData.at(e[0].index)?.id)
        }
    }

    return (
        <div className="flex flex-row gap-4 m-4 bg-slate-50">
            <div className="flex-1 md:w-1/2">
                <Form form={form}>
                    <Row gutter={[8, 0]}>
                        <Col span={7}>
                            <Form.Item className="mb-0" name="searchText">
                                <Input id="search" placeholder="Tìm kiếm" allowClear />
                            </Form.Item>
                        </Col>
                        <Col span={7}>
                            <Form.Item className="mb-0" name="trainingMajorId" labelAlign="left">
                                <Select
                                    placeholder="Chọn chuyên ngành đào tạo"
                                    options={trainingMajorData.map((i) => ({
                                        value: i.id,
                                        label: i.name,
                                    }))}
                                    allowClear
                                />
                            </Form.Item>
                        </Col>
                        <Col span={7}>
                            <Form.Item className="mb-0" name="trainingCourseId" labelAlign="left">
                                <Select
                                    placeholder="Khoá đào tạo"
                                    options={trainingCourseData.map((i) => ({
                                        value: i.id,
                                        label: i.name,
                                    }))}
                                    allowClear
                                />
                            </Form.Item>
                        </Col>
                        <Col span={3}>
                            <Button type="primary" onClick={downloadStatsFile} loading={loading}>
                                Tải thống kê
                            </Button>
                        </Col>
                        <Col span={24}>
                            <Form.Item hidden name="subjectSelected" />
                        </Col>
                    </Row>
                </Form>
                <Bar ref={chartRef} onClick={onClick} options={options} data={data} />
            </div>
            <div className="flex-1 md:w-1/2">
                <HSSVChuaDat subjectVersionId={subjectVersionId} viewOnly />
            </div>
        </div>
    )
}

DangKyHocLai.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout unLayout={true}>{page}</DefaultLayout>
}
