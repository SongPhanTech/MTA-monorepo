import CriteriaAnalysisSubPage from '@components/sub-pages/tu-danh-gia-ctdt/criteria-analysis'
import { evaluationPeriodStore } from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia'
import { useStore } from '@tanstack/react-store'
import { useSession } from '@workspace/auth/react'
import type { StandardPeriod } from '@workspace/db/client'
import { useFindUniqueEvaluationPeriod } from '@workspace/db/hooks'
import { Col, Empty, Row, Tabs } from 'antd'
import {
    AlignmentType,
    BorderStyle,
    Document,
    HeadingLevel,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableOfContents,
    TableRow,
    TextRun,
    VerticalAlign,
    WidthType,
} from 'docx'
import { saveAs } from 'file-saver'
import { useCallback, useMemo } from 'react'

export default function CriteriaAnalysisWrite() {
    const { data: me } = useSession()
    const idProfile = me?.sDM_NhanVienId || '8cab103d-8159-4aa8-8e25-0edcdba5d0a1'
    const { selectedEvaluationPeriodId } = useStore(evaluationPeriodStore)

    const { data, refetch } = useFindUniqueEvaluationPeriod(
        {
            where: {
                id: selectedEvaluationPeriodId,
                standards: {
                    some: {
                        criteria: {
                            some: {
                                analysisCriterions: {
                                    lecturer: {
                                        userProfile: {
                                            id: idProfile,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            include: {
                standards: {
                    where: {
                        criteria: {
                            some: {
                                analysisCriterions: {
                                    lecturer: {
                                        userProfile: {
                                            id: idProfile,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    include: {
                        criteria: {
                            where: {
                                analysisCriterions: {
                                    lecturer: {
                                        userProfile: {
                                            id: idProfile,
                                        },
                                    },
                                },
                            },
                            include: {
                                analysisCriterions: {
                                    include: {
                                        lecturer: {
                                            include: {
                                                userProfile: true,
                                            },
                                        },
                                        requirementCriterions: {
                                            include: {
                                                evidences: {
                                                    include: {
                                                        evidence: true,
                                                    },
                                                    orderBy: {
                                                        order: 'asc',
                                                    },
                                                },
                                                evaluationCriterionComment: {
                                                    include: {
                                                        reviewer: true,
                                                    },
                                                    orderBy: {
                                                        createdAt: 'desc',
                                                    },
                                                },
                                            },
                                            orderBy: {
                                                order: 'asc',
                                            },
                                        },
                                        evaluationCriterionComments: {
                                            include: {
                                                reviewer: true,
                                            },
                                            orderBy: {
                                                createdAt: 'desc',
                                            },
                                        },
                                    },
                                },
                            },
                            orderBy: {
                                order: 'asc',
                            },
                        },
                    },
                    orderBy: {
                        order: 'asc',
                    },
                },
            },
        },
        {
            enabled: !!idProfile && !!selectedEvaluationPeriodId,
        }
    )

    const exportDanhyeuCau = useCallback((dataTable: any) => {
        // ==== Tạo header bảng ====
        const headerRow1 = new TableRow({
            children: [
                new TableCell({
                    rowSpan: 2,
                    width: {
                        size: 5,
                        type: WidthType.PERCENTAGE,
                    },
                    children: [
                        new Paragraph({
                            text: 'STT',
                            alignment: AlignmentType.CENTER,
                        }),
                    ],
                    verticalAlign: VerticalAlign.CENTER,
                }),
                new TableCell({
                    columnSpan: 2,
                    children: [
                        new Paragraph({
                            text: 'Phân tích tiêu chí',
                            alignment: AlignmentType.CENTER,
                        }),
                    ],
                    verticalAlign: VerticalAlign.CENTER,
                }),
                new TableCell({
                    columnSpan: 3,
                    children: [
                        new Paragraph({
                            text: 'Thông tin minh chứng',
                            alignment: AlignmentType.CENTER,
                        }),
                    ],
                    verticalAlign: VerticalAlign.CENTER,
                }),
            ],
        })

        const headerRow2 = new TableRow({
            children: [
                // 2 cột nhỏ trong "Phân tích tiêu chí"
                new TableCell({
                    width: {
                        size: 20,
                        type: WidthType.PERCENTAGE,
                    },
                    children: [
                        new Paragraph({
                            text: 'Các yêu cầu',
                            alignment: AlignmentType.CENTER,
                        }),
                    ],
                }),
                new TableCell({
                    width: {
                        size: 20,
                        type: WidthType.PERCENTAGE,
                    },
                    children: [
                        new Paragraph({
                            text: 'Các câu hỏi đặt ra',
                            alignment: AlignmentType.CENTER,
                        }),
                    ],
                }),

                // 3 cột nhỏ trong "Thông tin minh chứng"
                new TableCell({
                    width: {
                        size: 15,
                        type: WidthType.PERCENTAGE,
                    },
                    children: [
                        new Paragraph({
                            text: 'Tên minh chứng',
                            alignment: AlignmentType.CENTER,
                        }),
                    ],
                }),
                new TableCell({
                    width: {
                        size: 15,
                        type: WidthType.PERCENTAGE,
                    },
                    children: [
                        new Paragraph({
                            text: 'Nơi thu thập',
                            alignment: AlignmentType.CENTER,
                        }),
                    ],
                }),
                new TableCell({
                    width: {
                        size: 25,
                        type: WidthType.PERCENTAGE,
                    },
                    children: [
                        new Paragraph({
                            text: 'Phương pháp thu thập',
                            alignment: AlignmentType.CENTER,
                        }),
                    ],
                }),
            ],
        })

        // ==== Tạo các dòng dữ liệu ====
        const dataRows = dataTable.map(
            (item: any, index: number) =>
                new TableRow({
                    children: [
                        new TableCell({
                            width: {
                                size: 5,
                                type: WidthType.PERCENTAGE,
                            },
                            children: [new Paragraph(`${index + 1}`)],
                        }),
                        new TableCell({
                            width: {
                                size: 20,
                                type: WidthType.PERCENTAGE,
                            },
                            children: [new Paragraph(`${item?.name || ''}`)],
                        }),
                        new TableCell({
                            width: {
                                size: 20,
                                type: WidthType.PERCENTAGE,
                            },
                            children: item?.questions.map((t: string) => new Paragraph(`${t}`)),
                        }),
                        new TableCell({
                            width: {
                                size: 15,
                                type: WidthType.PERCENTAGE,
                            },
                            children: item?.evidences.map(
                                (t: any) => new Paragraph(`${t?.evidence?.name || ''}`)
                            ),
                        }),

                        new TableCell({
                            width: {
                                size: 15,
                                type: WidthType.PERCENTAGE,
                            },
                            children: [new Paragraph(`${item?.evidencePlaces || ''}`)],
                        }),
                        new TableCell({
                            width: {
                                size: 25,
                                type: WidthType.PERCENTAGE,
                            },
                            children: [new Paragraph(`${item?.collectionMethod || ''}`)],
                        }),
                    ],
                })
        )

        // ==== Tạo bảng ====
        const table = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
                left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
                right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
                insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
            },
            rows: [headerRow1, headerRow2, ...dataRows],
        })

        return table
    }, [])

    const handleViewAll = useCallback(
        async (dataExport: StandardPeriod[]) => {
            try {
                if (!dataExport) return
                const sections = await Promise.all([
                    ...dataExport.map(async (standard: any, idx: number) => {
                        const children: any = []

                        // Tiêu chuẩn
                        children.push(
                            new Paragraph({
                                indent: { firstLine: 720 },
                                alignment: AlignmentType.JUSTIFIED,
                                heading: HeadingLevel.HEADING_1,
                                children: [
                                    new TextRun({
                                        text: `Tiêu chuẩn ${idx + 1}: ${standard.name}`,
                                        bold: true,
                                        size: 28,
                                        color: '000000',
                                    }),
                                ],
                            })
                        )

                        // Tiêu chí
                        for (const [cIdx, criterion] of standard.criteria.entries()) {
                            children.push(
                                new Paragraph({
                                    indent: { firstLine: 720 },
                                    alignment: AlignmentType.JUSTIFIED,
                                    heading: HeadingLevel.HEADING_2,
                                    children: [
                                        new TextRun({
                                            text: `Tiêu chí ${idx + 1}.${cIdx + 1}: ${criterion.name}`,
                                            size: 28,
                                            italics: true,
                                            color: '000000',
                                        }),
                                    ],
                                })
                            )

                            children.push(
                                exportDanhyeuCau(
                                    criterion?.analysisCriterions?.requirementCriterions
                                )
                            )
                        }

                        return { children }
                    }),
                ])
                const doc = new Document({
                    sections: [
                        {
                            children: [
                                new Paragraph({
                                    heading: HeadingLevel.HEADING_1,
                                    children: [
                                        new TextRun({
                                            text: 'Mục lục',
                                            size: 28,
                                            color: '000000',
                                        }),
                                    ],
                                }),
                                new TableOfContents('Mục lục', {
                                    hyperlink: true,
                                    headingStyleRange: '1-5',
                                }),
                            ],
                        },
                        ...sections,
                    ],
                })

                const blob = await Packer.toBlob(doc)
                saveAs(blob, `phieu_phan_tich_danh_gia_${data?.name}.docx`)
            } catch (error) {
                console.log(error)
            }
        },
        [data, exportDanhyeuCau]
    )

    const dataTab = useMemo(() => {
        if (data) {
            return data.standards.map((standard) => {
                return {
                    key: standard.id,
                    label: `Tiêu chuẩn ${standard.order}`,
                    children: (
                        <CriteriaAnalysisSubPage
                            key={standard.id}
                            data={standard}
                            idx={standard.order}
                            userRole="GV"
                            refetch={refetch}
                            handleViewAll={() => handleViewAll(data?.standards || [])}
                        />
                    ),
                }
            })
        }
    }, [data, refetch, handleViewAll])

    return (
        <div className="h-full">
            <Row gutter={[8, 0]}>
                <Col span={24}>
                    {data && data.standards.length > 0 ? (
                        <Tabs
                            className="h-[calc(100vh-200px)]"
                            tabPosition="left"
                            items={dataTab}
                            tabBarStyle={{
                                height: '100%',
                                overflow: 'auto',
                            }}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                            <Empty
                                description="Chưa có phiếu phân tích tiêu chí nào"
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            />
                        </div>
                    )}
                </Col>
            </Row>
        </div>
    )
}
