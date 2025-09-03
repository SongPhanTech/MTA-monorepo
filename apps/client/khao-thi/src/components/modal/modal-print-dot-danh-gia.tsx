import type { DataPrintDotDanhGia } from '@pages/ql-tu-danh-gia-ctdt/ql-dot-danh-gia/[id]'
import type { ScoreScaleCatalog } from '@workspace/db'
import { Button, Modal } from 'antd'
import { Printer } from 'lucide-react'
import { useRef } from 'react'
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
        <span style={{ color: evaluation.color }}>
            {evaluation.displayText} {evaluation.scoreText && `(${evaluation.scoreText})`}
        </span>
    )
}

const ModalPrintDotDanhGia = () => {
    const { isOpen, onClose, input } = useDisclosure<{ data: DataPrintDotDanhGia }>({
        tag: 'ModalPrintDotDanhGia',
    })

    const evidenceTags = new Map<string, string>()
    for (const [o1, standard] of (input?.data?.standards || []).entries()) {
        for (const [o2, criteria] of (standard?.criteria || []).entries()) {
            let evidenceCount = 0
            for (const requirementCriterions of criteria?.requirementCriterions || [])
                for (const evidences of requirementCriterions?.evidences || []) {
                    if (evidenceTags.has(evidences.evidenceId)) continue
                    evidenceCount++
                    const tag = [o1 + 1, o2 + 1, evidenceCount]
                        .map((t) => t.toString().padStart(2, '0'))
                        .join('.')
                    evidenceTags.set(evidences.evidenceId, `KM.${tag}`)
                }
        }
    }

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
      }
    `,
    })

    console.log('input', input?.data)

    return (
        <Modal
            title="Báo cáo đợt đánh giá"
            open={isOpen}
            onCancel={onClose}
            width="80vw"
            style={{ maxWidth: '1200px' }}
            footer={null}
        >
            <div className="space-y-4">
                <div className="flex justify-end w-full mb-4 space-x-2">
                    <Button type="primary" onClick={() => handlePrint()} icon={<Printer />}>
                        In báo cáo
                    </Button>
                    {/* <Button onClick={handleExportWord}>Xuất Word</Button> */}
                </div>

                <div
                    ref={printRef}
                    className="!font-time-news-roman text-black bg-white flex flex-col gap-2"
                    style={{ whiteSpace: 'normal', textAlign: 'justify' }}
                >
                    {input?.data?.standards.map((standard, index) => (
                        <div key={standard.id} className="page-break paragraph flex flex-col gap-2">
                            <strong className="text-base block">
                                Tiêu chuẩn {index + 1}: {standard?.name}
                            </strong>
                            <div className="content-wrapper">
                                <span className="font-bold italic text-[15px]">Mở đầu: </span>
                                <span
                                    className="normal-case"
                                    style={{ display: 'inline' }}
                                    dangerouslySetInnerHTML={{
                                        __html: standard?.opening || '',
                                    }}
                                />
                            </div>
                            <div className="content-wrapper">
                                {standard?.criteria?.map((criteria, idx) => (
                                    <div key={criteria?.id} className="content-wrapper mb-2">
                                        <span className="italic text-base">
                                            Tiêu chí {index + 1}.{idx + 1}:{' '}
                                        </span>
                                        <span
                                            className="normal-case"
                                            style={{ display: 'inline' }}
                                            dangerouslySetInnerHTML={{
                                                __html: criteria?.name || '',
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
                                                    __html: criteria?.currentSituation || '',
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <span className="italic text-[15px]">2. Điểm mạnh</span>
                                            <span
                                                className="normal-case"
                                                style={{ display: 'inline' }}
                                                dangerouslySetInnerHTML={{
                                                    __html: criteria?.strengths || '',
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
                                                    __html: criteria?.weakness || '',
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
                                                    __html: criteria?.actionPlan || '',
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
                            <div className="content-wrapper">
                                <span className="font-bold italic text-[15px]">
                                    Kết luận về Tiêu chuẩn {index + 1}:
                                </span>
                                <span
                                    className="normal-case"
                                    style={{ display: 'inline' }}
                                    dangerouslySetInnerHTML={{
                                        __html: standard?.conclusion || '',
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
