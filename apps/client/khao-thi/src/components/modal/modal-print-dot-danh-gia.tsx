import type {
    DataIndex,
    DataPrintDotDanhGia,
} from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia/[id]'
import type { ScoreScaleCatalog } from '@workspace/db'
import { Button, Modal } from 'antd'
import { Bookmark, Printer } from 'lucide-react'
import { useMemo, useRef } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { useReactToPrint } from 'react-to-print'

const evaluateScore = (score: number | null, scoreScale: ScoreScaleCatalog) => {
    if (score === null) {
        return {
            status: 'Chưa đánh giá',
            displayText: 'Chưa đánh giá',
            isPass: false,
            scoreText: '',
            color: 'gray',
        }
    }

    const { minValue, maxValue, passFrom } = scoreScale

    const actualPassFrom =
        passFrom !== null && passFrom !== undefined
            ? passFrom
            : Math.round((minValue + maxValue) / 2)

    const isPass = score >= actualPassFrom && score <= maxValue

    return {
        status: isPass ? 'Đạt' : 'Không đạt',
        displayText: isPass ? 'Đạt' : 'Không đạt',
        isPass,
        scoreText: `${score}/${maxValue}`,
        color: isPass ? 'green' : 'red',
    }
}

const EvaluationResult = ({
    score,
    scoreScale,
}: {
    score: number | null
    scoreScale: ScoreScaleCatalog
}) => {
    const evaluation = evaluateScore(score, scoreScale)

    return (
        <span style={{ color: evaluation.color }} className="!font-time-news-roman">
            {evaluation.displayText} {evaluation.scoreText && `(${evaluation.scoreText})`}
        </span>
    )
}

const processHtmlContent = (html: string, evidenceTags: Map<string, string>): string => {
    if (!html) return ''

    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    const spans = doc.querySelectorAll('span[id]')

    spans.forEach((span) => {
        const id = span.getAttribute('id')
        if (id && evidenceTags.has(id)) {
            span.textContent = evidenceTags.get(id) || ''
            ;(span as HTMLElement).style.color = 'red'
            span.removeAttribute('style')
            span.setAttribute('style', 'color: red;')
        }
    })

    return doc.body.innerHTML
}

const NavigationSidebar = ({
    standards,
    onNavigate,
}: {
    standards: DataIndex[]
    onNavigate: (id: string) => void
}) => {
    return (
        <div className="fixed left-4 top-1/2 transform -translate-y-1/2 bg-white shadow-lg p-4 rounded-lg z-10 hidden print:hidden md:block max-h-max overflow-y-auto">
            <div className="font-bold mb-2 flex items-center gap-2 text-[15px]">
                <Bookmark size={16} />
                Điều hướng
            </div>
            <div className="flex flex-col space-y-2">
                {standards.map((standard, index) => (
                    <div key={standard.id} className="pl-2 border-l-2 border-blue-200">
                        <Button
                            onClick={() => onNavigate(`standard-${standard.id}`)}
                            className="text-left text-[15px] font-medium w-full"
                        >
                            Tiêu chuẩn {index + 1}
                        </Button>

                        <div className="mt-1 ml-2 flex flex-col space-y-1">
                            {standard?.criteria?.map((criterion, idx) => (
                                <Button
                                    key={criterion.id}
                                    onClick={() => onNavigate(`criterion-${criterion.id}`)}
                                    className="text-left text-sm w-full text-gray-700"
                                >
                                    Tiêu chí {index + 1}.{idx + 1}
                                </Button>
                            ))}

                            <Button
                                onClick={() => onNavigate(`conclusion-${standard.id}`)}
                                className="text-left text-sm w-full mt-1"
                            >
                                Kết luận {index + 1}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

const TableOfContents = ({
    standards,
    onNavigate,
}: {
    standards: DataIndex[]
    onNavigate: (id: string) => void
}) => {
    return (
        <div className="p-4 mb-4 print:break-after-page">
            <h2 className="text-xl font-bold text-center mb-4">Mục lục</h2>
            <div className="grid grid-cols-1 gap-2">
                {standards.map((standard, index) => (
                    <div key={standard.id} className="pl-4">
                        <div
                            onClick={() => onNavigate(`standard-${standard.id}`)}
                            className="text-left font-bold w-full text-base cursor-pointer"
                        >
                            Tiêu chuẩn {index + 1}: {standard.name}
                        </div>

                        <div className="mt-1 ml-4 flex flex-col space-y-1">
                            {standard?.criteria?.map((criterion, idx) => (
                                <div
                                    key={criterion.id}
                                    onClick={() => onNavigate(`criterion-${criterion.id}`)}
                                    className="text-left w-full text-[15px] cursor-pointer"
                                >
                                    Tiêu chí {index + 1}.{idx + 1}
                                </div>
                            ))}

                            <div
                                onClick={() => onNavigate(`conclusion-${standard.id}`)}
                                className="text-left w-full mt-1 text-[15px] cursor-pointer"
                            >
                                Kết luận về Tiêu chuẩn {index + 1}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

const ModalPrintDotDanhGia = () => {
    const { isOpen, onClose, input } = useDisclosure<{ data: DataPrintDotDanhGia }>({
        tag: 'ModalPrintDotDanhGia',
    })

    const evidenceTags = useMemo(() => {
        const map = new Map<string, string>()

        for (const [o1, standard] of (input?.data?.standards || []).entries()) {
            for (const [o2, criteria] of (standard?.criteria || []).entries()) {
                let evidenceCount = 0
                for (const requirementCriterions of criteria?.requirementCriterions || []) {
                    for (const evidences of requirementCriterions?.evidences || []) {
                        if (map.has(evidences.evidenceId)) continue
                        evidenceCount++
                        const tag = [o1 + 1, o2 + 1, evidenceCount]
                            .map((t) => t.toString().padStart(2, '0'))
                            .join('.')
                        map.set(evidences.evidenceId, `[KM.${tag}]`)
                    }
                }
            }
        }
        return map
    }, [input?.data])

    const printRef = useRef<HTMLDivElement>(null)

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: 'bao_cao_dot_danh_gia.pdf',
        pageStyle: `
      @page {
        size: A4;
        margin: 1cm;
      }
      @media print {
        .page-break {
          page-break-after: always;
        }
        .blank-page {
          height: 100vh;
          visibility: hidden;
        }
        .paragraph {
          text-indent: 2em;
        }
        .content-wrapper {
          white-space: normal !important;
          word-wrap: break-word !important;
        }
        .navigation-sidebar {
          display: none;
        }
        .table-of-contents {
          page-break-after: always;
        }
      }
    `,
    })
    const scrollToSection = (id: string) => {
        const element = document.getElementById(id)
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
        }
    }

    return (
        <Modal
            title="Báo cáo đợt đánh giá"
            open={isOpen}
            onCancel={onClose}
            width="80vw"
            style={{ maxWidth: '1200px' }}
            footer={null}
            className="relative"
        >
            <NavigationSidebar
                standards={input?.data?.standards || []}
                onNavigate={scrollToSection}
            />

            <div className="space-y-4">
                <div className="flex justify-end w-full mb-4 space-x-2">
                    <Button type="primary" onClick={() => handlePrint()} icon={<Printer />}>
                        In báo cáo
                    </Button>
                </div>

                <div
                    ref={printRef}
                    className="!font-time-news-roman text-black bg-white flex flex-col gap-2"
                    style={{ whiteSpace: 'normal', textAlign: 'justify' }}
                >
                    <TableOfContents
                        standards={input?.data?.standards || []}
                        onNavigate={scrollToSection}
                    />

                    {input?.data?.standards.map((standard, index) => (
                        <div
                            key={standard.id}
                            id={`standard-${standard.id}`}
                            className="page-break paragraph flex flex-col gap-2 scroll-mt-16"
                        >
                            <strong className="text-base block">
                                Tiêu chuẩn {index + 1}: {standard?.name}
                            </strong>
                            <div className="content-wrapper">
                                <span className="font-bold italic text-base">Mở đầu: </span>
                                <span
                                    className="normal-case"
                                    style={{ display: 'inline' }}
                                    dangerouslySetInnerHTML={{
                                        __html: processHtmlContent(
                                            standard?.opening || '',
                                            evidenceTags
                                        ),
                                    }}
                                />
                            </div>
                            <div className="content-wrapper">
                                {standard?.criteria?.map((criteria, idx) => (
                                    <div
                                        id={`criterion-${criteria.id}`}
                                        key={criteria?.id}
                                        className="content-wrapper mb-2 scroll-mt-16"
                                    >
                                        <span className="italic text-base">
                                            Tiêu chí {index + 1}.{idx + 1}:{' '}
                                        </span>
                                        <span
                                            className="normal-case italic text-base"
                                            style={{ display: 'inline' }}
                                            dangerouslySetInnerHTML={{
                                                __html: processHtmlContent(
                                                    criteria?.name || '',
                                                    evidenceTags
                                                ),
                                            }}
                                        />
                                        <div>
                                            <span className="italic text-[15px]">
                                                1. Mô tả hiện trạng
                                            </span>
                                            <span
                                                className="normal-case"
                                                style={{ display: 'inline' }}
                                                dangerouslySetInnerHTML={{
                                                    __html: processHtmlContent(
                                                        criteria?.currentSituation || '',
                                                        evidenceTags
                                                    ),
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <span className="italic text-[15px]">2. Điểm mạnh</span>
                                            <span
                                                className="normal-case"
                                                style={{ display: 'inline' }}
                                                dangerouslySetInnerHTML={{
                                                    __html: processHtmlContent(
                                                        criteria?.strengths || '',
                                                        evidenceTags
                                                    ),
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <span className="italic text-[15px]">
                                                3. Điểm tồn tại
                                            </span>
                                            <span
                                                className="normal-case"
                                                style={{ display: 'inline' }}
                                                dangerouslySetInnerHTML={{
                                                    __html: processHtmlContent(
                                                        criteria?.weakness || '',
                                                        evidenceTags
                                                    ),
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <span className="italic text-[15px]">
                                                4. Kế hoạch hành động
                                            </span>
                                            <span
                                                className="normal-case"
                                                style={{ display: 'inline' }}
                                                dangerouslySetInnerHTML={{
                                                    __html: processHtmlContent(
                                                        criteria?.actionPlan || '',
                                                        evidenceTags
                                                    ),
                                                }}
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="italic text-[15px]">
                                                5. Tự đánh giá
                                            </span>
                                            <div
                                                className="normal-case"
                                                style={{ display: 'inline' }}
                                            >
                                                Tự đánh giá tiêu chí:{' '}
                                                <EvaluationResult
                                                    score={criteria?.score}
                                                    scoreScale={criteria?.scoreScale}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div
                                id={`conclusion-${standard.id}`}
                                className="content-wrapper scroll-mt-16"
                            >
                                <span className="font-bold italic text-base">
                                    Kết luận về Tiêu chuẩn {index + 1}:
                                </span>
                                <span
                                    className="normal-case"
                                    style={{ display: 'inline' }}
                                    dangerouslySetInnerHTML={{
                                        __html: processHtmlContent(
                                            standard?.conclusion || '',
                                            evidenceTags
                                        ),
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Modal>
    )
}

export default ModalPrintDotDanhGia
