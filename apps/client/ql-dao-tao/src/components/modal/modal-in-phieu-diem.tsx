import { PrinterOutlined } from '@ant-design/icons'
import { queryClient } from '@api/index'
import { useExamTypeOptions } from '@hooks/examType'
import { useScoreConverter } from '@hooks/scoreConverter'
import useSpinner from '@hooks/spinner'
import useScoreToWords from '@hooks/useScoreToWords'
import type { Prisma, SubjectClass } from '@workspace/db'
import { useFindUniqueSubjectClass, useUpdateSubjectClass } from '@workspace/db/hooks'
import { Button, Col, Modal, message, Row } from 'antd'
import dayjs from 'dayjs'
import { useMemo, useRef } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { useReactToPrint } from 'react-to-print'
export type PutSubjectClass = SubjectClass

dayjs.locale('vi')

export enum EnumInPhieuDiem {
    PHIEU_DIEM_NHAP = 0, // In phiếu điểm nháp
    PHIEU_DIEM_KHOA = 1, // In phiếu điểm và khóa
}

type ModalPrintToKQHTInput = {
    dataTable: DataTable[]
    type?: EnumInPhieuDiem // 1: In phiếu điểm và khóa, 0: In phiếu điểm nháp
}

type DataTable = Prisma.StudentSubjectScoreGetPayload<{
    include: {
        student: {
            include: {
                userProfile: true
                fixedClass: {
                    include: {
                        trainingCourse: {
                            include: {
                                scoreConverts: true
                            }
                        }
                    }
                }
            }
        }
        subjectClass: {
            include: {
                subject: true
                semester: {
                    include: {
                        schoolYear: true
                    }
                }
                mainLecturer: {
                    include: {
                        userProfile: true
                    }
                }
                extraLecturer: {
                    include: {
                        userProfile: true
                    }
                }
                enterGradeLecturer: {
                    include: {
                        userProfile: true
                    }
                }
            }
        }
        awards: {
            include: {
                archivedAward: true
            }
        }
        certificates: {
            include: {
                archivedCertificate: true
            }
        }
    }
}>

const ModalPrintStudentSubjectScore = () => {
    const formattedDate = '..., ngày ... tháng ... năm ...'
    const printRef = useRef<HTMLDivElement>(null)
    const { getExamTypeLabel } = useExamTypeOptions()
    const { convert } = useScoreToWords()

    const { isOpen, onClose, input } = useDisclosure<ModalPrintToKQHTInput>({
        tag: ModalPrintStudentSubjectScore.name,
    })

    console.log(input?.dataTable)

    const { data } = useFindUniqueSubjectClass(
        {
            where: { id: input?.dataTable?.[0]?.subjectClass?.id || '' },
            include: {
                subject: {
                    include: {
                        managementOrganization: true,
                    },
                },
                semester: {
                    include: {
                        schoolYear: true,
                    },
                },
                mainLecturer: {
                    include: {
                        userProfile: true,
                    },
                },
                extraLecturer: {
                    include: {
                        userProfile: true,
                    },
                },
                subjectClassStudent: {
                    include: {
                        student: {
                            include: {
                                fixedClass: {
                                    include: {
                                        trainingCourse: {
                                            include: {
                                                scoreConverts: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        { enabel: input?.dataTable?.[0]?.subjectClass?.id }
    )

    const { convertScore } = useScoreConverter(
        data?.subjectClassStudent?.[0]?.student?.fixedClass?.trainingCourse?.scoreConverts
    )

    const firstTrainingCourse = useMemo(() => {
        return data?.subjectClassStudent.find(({ student }) =>
            Boolean(student.fixedClass?.trainingCourse)
        )?.student?.fixedClass?.trainingCourse
    }, [data?.subjectClassStudent])

    const trainingCourseSame = useMemo(() => {
        if (!data?.subjectClassStudent) return null

        const uniqTrainingCourse = new Set(
            data.subjectClassStudent.map(({ student }) => student.fixedClass?.trainingCourse?.code)
        )

        return uniqTrainingCourse.size === 1 ? [...uniqTrainingCourse][0] : null
    }, [data?.subjectClassStudent])

    const { showSpinner, hideSpinner } = useSpinner()

    const { mutateAsync: updateSubjectClass } = useUpdateSubjectClass()

    async function onOk({ ...rest }: PutSubjectClass) {
        try {
            showSpinner()
            if (input?.type === EnumInPhieuDiem.PHIEU_DIEM_KHOA) {
                await updateSubjectClass({
                    data: {
                        isLockExamScore: true,
                        isLockScore: true,
                    },
                    where: { id: data?.id },
                })
                message.success('Cập nhật thành công')
            }
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['SubjectClass'],
            })
            onClose()
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        pageStyle: `
        @page {
            size: A4;
        }
        @media print {
            @page { margin: 1 1 1 1 !important; }
            body, html, #root {
                height: auto !important;
                overflow: visible !important;
            }
            .page {
                page-break-after: auto !important;
                break-after: auto !important;
                min-height: 297mm;
                width: 210mm;
                padding: 15mm;
            }
            table {
                page-break-inside: auto;
            }
            tr {
                page-break-inside: avoid;
            }
        }
      `,
    })

    const basicInfoCol1 = [
        {
            title: 'Mã lớp môn học:',
            value: <span className="font-medium">{data?.code || '-'}</span>,
        },
        {
            title: 'Khóa:',
            value: <span>{trainingCourseSame || '-'}</span>,
        },
        {
            title: 'Giảng viên:',
            value: (
                <span>
                    {data?.mainLecturer?.userProfile?.fullname ||
                        data?.extraLecturer?.userProfile?.fullname ||
                        '-'}
                </span>
            ),
        },
        {
            title: 'Khoa:',
            value: <span>{data?.subject?.managementOrganization?.sTen || '-'}</span>,
        },
        {
            title: 'Hình thức thi:',
            value: <span>{getExamTypeLabel(data?.examType)}</span>,
        },
    ]

    const basicInfoCol2 = [
        {
            title: 'Tên lớp môn học:',
            value: <span>{data?.name || '-'}</span>,
        },
        {
            title: 'Số tín chỉ:',
            value: <span>{data?.subject?.credit || '-'}</span>,
        },
        {
            title: 'Ngày thi:',
            value: <span>{data?.examDate ? dayjs(data?.examDate).format('DD/MM/YYYY') : '-'}</span>,
        },
        {
            title: 'Quân số:',
            value: <span>{data?.subjectClassStudent?.length || '-'}</span>,
        },
    ]

    const scoreCoefs = useMemo(
        () => [
            {
                title: 'Hệ số điểm chuyên cần:',
                value: firstTrainingCourse?.coef_1 ?? '-',
            },
            {
                title: 'Hệ số điểm thường xuyên:',
                value: firstTrainingCourse?.coef_2 ?? '-',
            },
            {
                title: 'Hệ số điểm thi:',
                value: firstTrainingCourse?.coef_3 ?? '-',
            },
        ],
        [firstTrainingCourse]
    )

    return (
        <Modal
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width={900}
            style={{ top: 20 }}
            title={
                <div className="flex items-center justify-between w-[95%]">
                    <span>
                        {input?.type === EnumInPhieuDiem.PHIEU_DIEM_NHAP
                            ? 'In phiếu điểm nháp'
                            : 'In phiếu điểm và khóa'}
                    </span>
                    <Button
                        icon={<PrinterOutlined />}
                        onClick={() => {
                            handlePrint()
                            if (input?.type === EnumInPhieuDiem.PHIEU_DIEM_KHOA) {
                                onOk(data as PutSubjectClass)
                            }
                        }}
                        size="small"
                        type="primary"
                    >
                        In
                    </Button>
                </div>
            }
        >
            <div
                ref={printRef}
                className="mx-auto p-10 page text-sm leading-relaxed font-[Times New Roman]"
            >
                <div className="text-center font-bold uppercase">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="font-normal">BỘ QUỐC PHÒNG</span>
                            <span>HỌC VIỆN KỸ THUẬT QUÂN SỰ</span>
                            <hr className="text-black border-[1px] mx-14" />
                        </div>
                        <div className="flex flex-col">
                            <span>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span>
                            <span className="normal-case">Độc lập - Tự do - Hạnh phúc</span>
                            <hr className="text-black border-[1px] mx-14" />
                        </div>
                    </div>
                    {input?.type === EnumInPhieuDiem.PHIEU_DIEM_NHAP ? (
                        <div className="font-normal border max-w-32 mt-5 text-[18px] border-black">
                            Bản nháp
                        </div>
                    ) : (
                        ''
                    )}

                    <div className="mt-4 uppercase text-[20px]">Phiếu điểm</div>
                    <div className="text-sm normal-case font-normal italic">
                        {`(${data?.semester?.name} - ${data?.semester?.schoolYear?.name})`}
                    </div>
                </div>
                <div className="flex justify-between gap-5 mt-6">
                    <div className="flex flex-col gap-2.5 w-[50%]">
                        {basicInfoCol1?.filter(Boolean).map((item, index) => (
                            <div key={item?.title || index} className="flex gap-2 w-full">
                                <span className="text-[#656565] text-sm min-w-32">
                                    {item?.title}
                                </span>
                                <span className="text-sm font-semibold">{item?.value}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-col gap-2.5 w-[50%]">
                        {basicInfoCol2?.filter(Boolean).map((item, index) => (
                            <div key={item?.title || index} className="flex gap-2 w-full">
                                <span className="text-[#656565] text-sm min-w-32">
                                    {item?.title}
                                </span>
                                <span className="text-sm font-semibold">{item?.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <Row gutter={[16, 8]} className="pt-2.5">
                    {scoreCoefs.map((item) => (
                        <Col span={8} key={item.title}>
                            <div className="flex gap-1 items-center">
                                <span className="text-[#656565] text-sm">{item.title}</span>
                                <span className="text-sm font-semibold">
                                    {item.value.toString()}
                                </span>
                            </div>
                        </Col>
                    ))}
                </Row>
                <div className="overflow-x-auto text-sm mt-6">
                    <table className="w-full border border-black border-collapse">
                        <thead>
                            <tr>
                                <th
                                    rowSpan={2}
                                    className="border border-black px-1 py-1 w-[40px] text-center"
                                >
                                    TT
                                </th>
                                <th
                                    rowSpan={2}
                                    className="border border-black px-1 py-1 text-center w-[100px]"
                                >
                                    Mã SV
                                </th>
                                <th
                                    rowSpan={2}
                                    className="border border-black px-1 py-1 text-center w-[200px]"
                                >
                                    Họ tên
                                </th>
                                <th
                                    rowSpan={2}
                                    className="border border-black px-1 py-1 text-center w-[100px]"
                                >
                                    Ngày sinh
                                </th>
                                <th
                                    rowSpan={2}
                                    className="border border-black px-1 py-1 text-center w-[100px]"
                                >
                                    Lớp
                                </th>
                                <th
                                    colSpan={2}
                                    className="border border-black px-1 py-1 text-center"
                                >
                                    Điểm
                                </th>
                                <th
                                    rowSpan={2}
                                    className="border border-black px-1 py-1 text-center w-[60px]"
                                >
                                    Điểm thi
                                </th>
                                <th
                                    colSpan={3}
                                    className="border border-black px-1 py-1 text-center"
                                >
                                    Điểm học phần
                                </th>
                                <th
                                    rowSpan={2}
                                    className="border border-black px-1 py-1 text-center w-[100px]"
                                >
                                    Ghi chú
                                </th>
                            </tr>
                            <tr>
                                <th className="border border-black px-1 py-1 w-[60px] text-center">
                                    C.cần
                                </th>
                                <th className="border border-black px-1 py-1 w-[60px] text-center">
                                    T.xuyên
                                </th>
                                <th className="border border-black px-1 py-1 w-[60px] text-center">
                                    Số
                                </th>
                                <th className="border border-black px-1 py-1 w-[60px] text-center">
                                    TC
                                </th>
                                <th className="border border-black px-1 py-1 w-[100px] text-center">
                                    Bằng chữ
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {input?.dataTable?.map((item, index: number) => (
                                <tr key={item.id}>
                                    <td className="border border-black text-center">{index + 1}</td>
                                    <td className="border border-black text-center">
                                        {item?.student?.code}
                                    </td>
                                    <td className="border border-black text-left px-1">
                                        {item?.student?.userProfile?.fullname}
                                    </td>
                                    <td className="border border-black text-center">
                                        {dayjs(item?.student?.userProfile?.dateOfBirth).format(
                                            'DD/MM/YYYY'
                                        )}
                                    </td>
                                    <td className="border border-black text-center">
                                        {item?.student?.fixedClass?.name}
                                    </td>
                                    <td className="border border-black text-center">
                                        {item?.attendanceScore}
                                    </td>
                                    <td className="border border-black text-center">
                                        {item?.midtermScore}
                                    </td>
                                    <td className="border border-black text-center">
                                        {item?.examScore}
                                    </td>
                                    <td className="border border-black text-center">
                                        {item?.manualFinalScore || item?.finalScore?.toString()}
                                    </td>
                                    <td className="border border-black text-center">{''}</td>
                                    <td className="border border-black text-left">
                                        {convert(
                                            item?.manualFinalScore ||
                                                item?.finalScore?.toNumber() ||
                                                0
                                        )}
                                    </td>
                                    <td className="border border-black text-left">
                                        {(() => {
                                            const statusTexts = []

                                            if (item.examPostponed) statusTexts.push('Hoãn thi')
                                            if (item.exempted) statusTexts.push('Miễn học')
                                            if (item.withdrew) statusTexts.push('Rút khỏi')
                                            if (item.examBanned) statusTexts.push('Cấm thi')
                                            if (item.suspended) statusTexts.push('Đình chỉ')

                                            return statusTexts.length > 0
                                                ? statusTexts.join(', ')
                                                : null
                                        })()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-6">
                    <span className="font-semibold">Tổng hợp kết quả thi:</span>
                </div>
                <Row gutter={[16, 0]} className="mt-6 text-center">
                    <Col span={8} className="flex flex-col items-center justify-center">
                        <div className="italic text-left">{formattedDate}</div>
                        <div className="uppercase font-bold">
                            <span>Phòng khảo thí & dbcl gd-đt</span>
                            <br />
                            <span>(hoặc chủ nhiệm bộ môn)</span>
                        </div>
                        <span>(Ký và ghi rõ họ tên)</span>
                    </Col>

                    <Col span={8}>
                        <div className="uppercase font-bold mt-6">
                            <span>Giáo viên chấm thi</span>
                        </div>
                        <span>(Ký và ghi rõ họ tên)</span>
                    </Col>

                    <Col span={8}>
                        <div className="uppercase font-bold mt-6">
                            <span>cơ quan đào tạo</span>
                        </div>
                        <span>(Ký và ghi rõ họ tên)</span>
                    </Col>
                </Row>
            </div>
            <style>
                {`
            @media print {
                .page {
                    width: 210mm;
                    min-height: 297mm; 
                    page-break-after: auto;
                    background: white;
                    overflow: visible;
                }
            }
            table {
                page-break-inside: auto;
            }
            tr {
                page-break-inside: avoid;
                page-break-after: auto;
            }
            @page {
                size: A4;
            }
            @media screen {
                .page {
                    width: 210mm;
                    min-height: 297mm;
                    margin: 10px auto;
                    padding: 20mm;
                    background: white;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
            }
            `}
            </style>
        </Modal>
    )
}

export default ModalPrintStudentSubjectScore
