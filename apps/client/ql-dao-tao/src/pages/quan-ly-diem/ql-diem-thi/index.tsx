import DefaultLayout from '@layouts/default-layout'
import { Checkbox, Col, Form, Input, Row, Tabs } from 'antd'
import ClassSubject from '@/components/sub-pages/danh-sach-lop-mon-hoc'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { useFindUniqueSubjectClass } from '@workspace/db/hooks'
import { formatDate } from '@lib/utils'
import dayjs from 'dayjs'
import DiemThi from '@components/sub-pages/diem-thi'
import { useSession } from '@workspace/auth/react'
import { listUser } from '@workspace/libs/constants'
import FormItem from '@components/commons/form-item'
import { useWatch } from 'antd/es/form/Form'
type SubmitFormType = {
    isLockExamScore?: boolean
    scoreSubmitted?: boolean
    scoreChecked?: boolean
}
export default function SubjectClassScore() {
    const [form] = Form.useForm<SubmitFormType>()
    const [activeKey, setActiveKey] = useState('1')
    const [selectedRowKeys, setSelectedRowKeys] = useState<string>('')
    const { data: session } = useSession()
    const profileId = session?.sDM_NhanVienId || ''
    const { data, refetch } = useFindUniqueSubjectClass(
        {
            where: {
                id: selectedRowKeys,
            },
            include: {
                mainLecturer: {
                    include: {
                        userProfile: true,
                    },
                },
                subject: {
                    include: {
                        managementOrganization: true,
                    },
                },
                subjectClassStudent: {
                    include: {
                        student: {
                            include: {
                                userProfile: true,
                                fixedClass: {
                                    include: {
                                        trainingCourse: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        {
            enabled: !!selectedRowKeys,
            refetchOnWindowFocus: false,
        }
    )
    const dataForm = useWatch([], form)
    const items = useMemo(() => {
        return [
            {
                label: 'Danh sách lớp môn học',
                key: '1',
                children: (
                    <ClassSubject
                        selectedRowKeys={selectedRowKeys}
                        setSelectedRowKeys={(value: string) => {
                            setSelectedRowKeys(value)
                        }}
                    />
                ),
            },
            {
                label: 'Nhập điểm thi',
                key: '2',
                children: (
                    <DiemThi
                        dataDetailSubjectClass={data}
                        refetchSubjectClass={refetch}
                        subjectClassId={selectedRowKeys}
                        dataForm={dataForm}
                    />
                ),
                disabled: !selectedRowKeys,
            },
        ]
    }, [selectedRowKeys, data, refetch, dataForm])

    const reasonDate = useCallback(() => {
        if (data?.scoreDeadLineStart || data?.scoreDeadline) {
            if (dayjs()?.isAfter(data?.examScoreDeadline) && !data?.enteredExamScore) {
                return (
                    <Input
                        className="bg-red-600 text-white"
                        placeholder="Hạn nhập điểm"
                        disabled
                        value={`Ngoài hạn nhập điểm quá trình, ${formatDate(data?.scoreDeadLineStart || '')} đến ${formatDate(data?.scoreDeadline || '')}`}
                    />
                )
            }
            return (
                <Input
                    placeholder="Hạn nhập điểm"
                    disabled
                    value={`${data?.scoreDeadLineStart && formatDate(data?.scoreDeadLineStart)} đến ${data?.scoreDeadline && formatDate(data?.scoreDeadline || '')}`}
                />
            )
        }
        return <Input placeholder="Hạn nhập điểm" disabled />
    }, [data])
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (data) {
            form.setFieldsValue({
                isLockExamScore: data?.isLockExamScore,
                scoreSubmitted: data?.scoreSubmitted,
                scoreChecked: data?.scoreChecked,
            })
        }
    }, [data])

    return (
        <Row gutter={[16, 16]} className="relative">
            <Col span={12}>
                <div className="flex items-center mb-3 w-full">
                    <div className="min-w-[150px] w-[150px]">Lớp môn học:</div>
                    <div className="w-[300px]">
                        <Input placeholder="Mã lớp MH" disabled value={data?.code} />
                    </div>
                    <div className="ml-3 w-full">
                        <Input placeholder="Tên lớp MH" disabled value={data?.name} />
                    </div>
                </div>
                <div className="flex items-center mb-3 w-full">
                    <div className="min-w-[150px] w-[150px]">Giảng viên:</div>
                    <div className="w-full">
                        <Input
                            className="w-full"
                            placeholder="Giảng viên"
                            disabled
                            value={
                                data?.mainLecturer
                                    ? `${data?.mainLecturer?.userProfile?.lastName} ${data?.mainLecturer?.userProfile?.firstName}`
                                    : ''
                            }
                        />
                    </div>
                </div>
                <div className="flex items-center w-full">
                    <div className="min-w-[150px] w-[150px]">Đơn vị quản lý</div>
                    <div className="w-full">
                        <Input
                            className="w-full"
                            placeholder="Giảng viên"
                            disabled
                            value={
                                data?.subject?.managementOrganization
                                    ? `${data?.subject?.managementOrganization?.sMa} - ${data?.subject?.managementOrganization?.sTen}`
                                    : ''
                            }
                        />
                    </div>
                </div>
            </Col>

            <Col span={12}>
                <Form form={form} layout="vertical">
                    <div className="flex items-center mb-3 w-full">
                        <div className="min-w-[150px] w-[150px]">Hạn nhập điểm</div>
                        <div className="w-full">{reasonDate()}</div>
                    </div>
                    <div className="flex items-center mb-3 w-full">
                        <div className="flex items-center mr-9 ">
                            <FormItem
                                form={form}
                                name="isLockExamScore"
                                className="min-w-[200px]"
                                valuePropName="checked"
                            >
                                <Checkbox
                                    disabled={profileId !== listUser?.P13 && !!selectedRowKeys}
                                >
                                    Khoá điểm thi
                                </Checkbox>
                            </FormItem>
                        </div>
                        <div className="flex items-center w-full">
                            <FormItem
                                form={form}
                                name="scoreSubmitted"
                                className="min-w-[200px]"
                                valuePropName="checked"
                            >
                                <Checkbox
                                    disabled={profileId !== listUser?.P13 && !!selectedRowKeys}
                                >
                                    P13 đã nhận Phiếu điểm
                                </Checkbox>
                            </FormItem>
                            <div className="w-full">
                                <Input disabled />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center mb-3 w-full">
                        <div className="flex items-center w-full">
                            <FormItem
                                form={form}
                                name="scoreChecked"
                                className="min-w-[250px]"
                                valuePropName="checked"
                            >
                                <Checkbox
                                    disabled={profileId !== listUser?.P13 && !!selectedRowKeys}
                                >
                                    P2/P7 kiểm tra lại phiếu điểm
                                </Checkbox>
                            </FormItem>
                            <div className="w-full">
                                <Input disabled />
                            </div>
                        </div>
                    </div>
                </Form>
            </Col>

            <Col span={24}>
                <Tabs activeKey={activeKey} onChange={(key) => setActiveKey(key)} items={items} />
            </Col>
        </Row>
    )
}

SubjectClassScore.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
