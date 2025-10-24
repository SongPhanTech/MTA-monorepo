import Select from '@components/commons/select'
import DefaultLayout from '@layouts/default-layout'
import { useFindManyTrainingCourse, useFindManyTrainingMajor } from '@workspace/db/hooks'
import { useOpenSubjectClassRetake } from '@workspace/libs/api/training'
import { useSemesterStore, useTrainingObjectTypeStore } from '@workspace/ui'
import { Col, Form, Input, Row } from 'antd'
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

export const options = {
    responsive: true,
    plugins: {
        legend: {
            position: 'top' as const,
        },
        title: {
            display: true,
            text: 'Số SV nợ',
        },
    },
}

export default function DangKyHocLai() {
    const [form] = Form.useForm<SubjectBySemesterForm>()
    const { id: semesterId } = useSemesterStore()
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const searchText = Form.useWatch('searchText', form)
    const trainingCourseId = Form.useWatch('trainingCourseId', form)
    const trainingMajorId = Form.useWatch('trainingMajorId', form)
    const [subjectVersionId, setSubjectVersionId] = useState<string>()

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
            console.log('sid', rawData.at(e[0].index)?.id)
        }
    }

    return (
        <div className="flex flex-row gap-4 m-4 bg-slate-50">
            <div className="flex-1 md:w-1/2">
                <Form form={form}>
                    <Row gutter={[8, 0]}>
                        <Col span={8}>
                            <Form.Item className="mb-0" name="searchText">
                                <Input id="search" placeholder="Tìm kiếm" allowClear />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
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
                        <Col span={8}>
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
