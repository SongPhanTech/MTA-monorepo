import FormItem from '@components/commons/form-item'
import NhapDiem from '@components/sub-pages/nhap-diem'
import NhapDiemPhach from '@components/sub-pages/nhap-diem-phach'
import PhongThi from '@components/sub-pages/ql-phong-thi'
import SinhPhach from '@components/sub-pages/sinh-phach'
import DefaultLayout from '@layouts/default-layout'
import { formatDate } from '@lib/utils'
import { Store, useStore } from '@tanstack/react-store'
import { useFindUniqueSubjectClass, useUpdateSubjectClass } from '@workspace/db/hooks'
import { Checkbox, Col, Form, Input, Row, Tabs, type TabsProps } from 'antd'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import DanhSachLopMonHoc from '@/components/sub-pages/danh-sach-lop-mon-hoc'

export type DiemLopMonHocProps = {
    role?: 'GV' | 'P2/P7' | 'P13'
    score?: 'CC/TX' | 'THI' | 'PHACH'
}
type SubmitFormType = {
    isLockExamScore?: boolean
    scoreSubmitted?: boolean
    scoreChecked?: boolean
    isLockExamScoreOld?: boolean
    scoreSubmittedOld?: boolean
    scoreCheckedOld?: boolean
}
export type DiemLopMonHocStoreState = {
    selectedSubjectClassId?: string
}

export const diemLopMonHocStore = new Store<DiemLopMonHocStoreState>({
    selectedSubjectClassId: undefined,
})

export const diemPhongThiStore = new Store<{
    selectedExamListId?: string
}>({
    selectedExamListId: undefined,
})

export default function QuanLyDiemLopMonHoc({
    role = 'P2/P7',
    score = 'CC/TX',
}: DiemLopMonHocProps) {
    const [form] = Form.useForm<SubmitFormType>()
    const [activeKey, setActiveKey] = useState('1')
    const { selectedSubjectClassId } = useStore(diemLopMonHocStore)
    const { selectedExamListId } = useStore(diemPhongThiStore)
    const { data } = useFindUniqueSubjectClass(
        {
            where: {
                id: selectedSubjectClassId,
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
            enabled: !!selectedSubjectClassId,
            refetchOnWindowFocus: false,
        }
    )

    const items = useMemo(() => {
        let baseMenu: TabsProps['items'] =
            role === 'P13' && score === 'PHACH'
                ? [
                      {
                          label: 'Phòng thi',
                          key: '1',
                          children: <PhongThi />,
                      },
                  ]
                : [
                      {
                          label: 'Danh sách lớp môn học',
                          key: '1',
                          children: <DanhSachLopMonHoc role={role} />,
                      },
                  ]

        if (role === 'GV') {
            if (score === 'CC/TX') {
                baseMenu = [
                    ...baseMenu,
                    {
                        label: 'Nhập điểm quá trình',
                        key: '2',
                        children: (
                            <NhapDiem role={role} loadData={activeKey !== '1'} score={'CC/TX'} />
                        ),
                        disabled: !data,
                    },
                ]
            }

            if (score === 'THI') {
                baseMenu = [
                    ...baseMenu,
                    {
                        label: 'Nhập điểm thi',
                        key: '2',
                        children: <NhapDiem role={role} score="THI" loadData={activeKey !== '1'} />,
                        disabled: !data,
                    },
                ]
            }
        }

        if ((role === 'P2/P7' || role === 'P13') && score !== 'PHACH') {
            baseMenu = [
                ...baseMenu,
                {
                    label: 'Điểm',
                    key: '2',
                    children: <NhapDiem role={role} loadData={activeKey !== '1'} />,
                    disabled: !data,
                },
            ]
        }

        if (role === 'P13' && score === 'PHACH') {
            baseMenu = [
                ...baseMenu,
                {
                    label: 'Đánh phách',
                    key: '2',
                    children: <SinhPhach />,
                    disabled: !selectedExamListId,
                },
                {
                    label: 'Nhập điểm theo phách',
                    key: '3',
                    children: <NhapDiemPhach />,
                    disabled: !selectedExamListId,
                },
            ]
        }
        return baseMenu
    }, [data, role, score, activeKey, selectedExamListId])

    const reasonDate = useCallback(() => {
        if (score === 'CC/TX' && (data?.scoreDeadLineStart || data?.scoreDeadline)) {
            if (dayjs()?.isAfter(data?.scoreDeadline) && !data?.enteredScore) {
                return (
                    <Input
                        size="small"
                        className="bg-red-600 text-white"
                        placeholder="Hạn nhập điểm pointer-events-none"
                        value={`Ngoài hạn nhập điểm quá trình, ${formatDate(data?.scoreDeadLineStart || '')} đến ${formatDate(data?.scoreDeadline || '')}`}
                    />
                )
            }
            return (
                <Input
                    className="pointer-events-none"
                    placeholder="Hạn nhập điểm"
                    size="small"
                    value={`${data?.scoreDeadLineStart && formatDate(data?.scoreDeadLineStart)} đến ${data?.scoreDeadline && formatDate(data?.scoreDeadline || '')}`}
                />
            )
        }

        if (score === 'THI' && (data?.scoreDeadLineStart || data?.scoreDeadline)) {
            if (dayjs()?.isAfter(data?.examScoreDeadline) && !data?.enteredExamScore) {
                return (
                    <Input
                        size="small"
                        className="bg-red-600 text-white pointer-events-none"
                        placeholder="Hạn nhập điểm"
                        value={`Ngoài hạn nhập điểm quá trình, ${formatDate(data?.scoreDeadLineStart || '')} đến ${formatDate(data?.scoreDeadline || '')}`}
                    />
                )
            }
            return (
                <Input
                    size="small"
                    className="pointer-events-none"
                    placeholder="Hạn nhập điểm"
                    value={`${data?.scoreDeadLineStart && formatDate(data?.scoreDeadLineStart)} đến ${data?.scoreDeadline && formatDate(data?.scoreDeadline || '')}`}
                />
            )
        }

        return <Input placeholder="Hạn nhập điểm" className="pointer-events-none" size="small" />
    }, [data, score])

    const { mutateAsync: updateSubjectClass } = useUpdateSubjectClass()

    useEffect(() => {
        if (data) {
            form.setFieldsValue({
                isLockExamScore: data?.isLockExamScore,
                scoreSubmitted: data?.scoreSubmitted,
                scoreChecked: data?.scoreChecked,
            })
        }
    }, [data, form])
    return (
        <Row gutter={[16, 4]}>
            {score !== 'PHACH' && (
                <>
                    <Col span={12}>
                        <div className="flex items-center mb-2 w-full">
                            <div className="min-w-[150px] w-[150px]">Lớp môn học:</div>
                            <div className="w-[300px]">
                                <Input
                                    size="small"
                                    placeholder="Mã lớp MH"
                                    className="pointer-events-none"
                                    value={data?.code}
                                />
                            </div>
                            <div className="ml-3 w-full">
                                <Input
                                    size="small"
                                    placeholder="Tên lớp MH"
                                    className="pointer-events-none"
                                    value={data?.name}
                                />
                            </div>
                        </div>
                        <div className="flex items-center mb-2 w-full">
                            <div className="min-w-[150px] w-[150px]">Giảng viên:</div>
                            <div className="w-full">
                                <Input
                                    className="w-full pointer-events-none"
                                    placeholder="Giảng viên"
                                    size="small"
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
                                    size="small"
                                    className="w-full pointer-events-none"
                                    placeholder="Giảng viên"
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
                        <Form
                            form={form}
                            layout="vertical"
                            onValuesChange={(changedValue) => {
                                updateSubjectClass({
                                    where: { id: selectedSubjectClassId || '' },
                                    data: {
                                        ...changedValue,
                                    },
                                })
                            }}
                        >
                            <div className="flex items-center mb-2 w-full">
                                <div className="min-w-[150px] w-[150px]">Hạn nhập điểm</div>
                                <div className="w-full">{reasonDate()}</div>
                            </div>
                            <div className="flex items-center mb-2 w-full h-6">
                                <div className="flex items-center mr-9 ">
                                    <FormItem
                                        form={form}
                                        name="isLockExamScore"
                                        className="min-w-[200px] !mb-0"
                                        valuePropName="checked"
                                    >
                                        <Checkbox
                                            disabled={role !== 'P13' || !selectedSubjectClassId}
                                        >
                                            P13 đã khoá
                                        </Checkbox>
                                    </FormItem>
                                </div>
                                <div className="flex items-center w-full">
                                    <FormItem
                                        form={form}
                                        name="scoreSubmitted"
                                        className="min-w-[200px] !mb-0"
                                        valuePropName="checked"
                                    >
                                        <Checkbox
                                            disabled={role !== 'P13' || !selectedSubjectClassId}
                                        >
                                            P13 đã nhận Phiếu điểm
                                        </Checkbox>
                                    </FormItem>
                                    <div className="w-full">
                                        <Input size="small" className="pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center mb-2 w-full h-6">
                                <div className="flex items-center w-full">
                                    <FormItem
                                        form={form}
                                        name="scoreChecked"
                                        className="min-w-[250px]"
                                        valuePropName="checked"
                                    >
                                        <Checkbox
                                            disabled={role !== 'P2/P7' || !selectedSubjectClassId}
                                        >
                                            P2/P7 kiểm tra lại phiếu điểm
                                        </Checkbox>
                                    </FormItem>
                                    <div className="w-full">
                                        <Input size="small" className="pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </Form>
                    </Col>
                </>
            )}
            <Col span={24}>
                <Tabs activeKey={activeKey} onChange={(key) => setActiveKey(key)} items={items} />
            </Col>
        </Row>
    )
}

QuanLyDiemLopMonHoc.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
