import { useState } from "react"
import "./evaluation.css"

const Q12_OPTIONS = ["Rất không hài lòng", "Không hài lòng", "Phân vân", "Hài lòng", "Rất hài lòng"]

const Q13_OPTIONS = ["Rất không nên chọn", "Không nên chọn", "Phân vân", "Nên chọn", "Rất nên chọn"]

export default function EvaluationTable() {
  const [answers, setAnswers] = useState<Record<number, number>>({})

  const renderRow = (no: number, question: string, options: string[]) => (
    <tr>
      <td className="col-tt">{no}</td>
      <td className="col-question" colSpan={6}>
        <div className="q-text">{question}</div>

        <div className="q-options-text">
          {options.map((o, i) => (
            <div key={o}>
              <div>{o}</div>
              <input
                type="checkbox"
                checked={answers[no] === i + 1}
                onChange={() => setAnswers((prev) => ({ ...prev, [no]: i + 1 }))}
              />
            </div>
          ))}
        </div>
      </td>

      {/* {options.map((_, i) => (
        <td key={i} className="col-answer">
          <input
            type="checkbox"
            checked={answers[no] === i + 1}
            onChange={() =>
              setAnswers(prev => ({ ...prev, [no]: i + 1 }))
            }
          />
        </td>
      ))} */}
    </tr>
  )

  return (
    <table className="evaluation-table">
      <thead>
        <tr>
          <th rowSpan={2} className="col-tt">
            TT
          </th>
          <th rowSpan={2} className="col-question">
            NỘI DUNG ĐÁNH GIÁ
          </th>
          <th colSpan={5}>CÁC PHƯƠNG ÁN TRẢ LỜI</th>
        </tr>
        <tr>
          <th>1</th>
          <th>2</th>
          <th>3</th>
          <th>4</th>
          <th>5</th>
        </tr>
      </thead>

      <tbody>
        {/* SECTION V */}
        <tr className="section-row">
          <td className="col-tt">V</td>
          <td colSpan={6} className="section-title">
            CẢM NHẬN VỀ KẾT QUẢ ĐẠT ĐƯỢC
          </td>
        </tr>

        {renderRow(
          12,
          "Đồng chí (anh/chị) hài lòng như thế nào về tổng thể quá trình học tập và trải nghiệm đối với sự phát triển về kiến thức, năng lực và phẩm chất của bản thân?",
          Q12_OPTIONS
        )}

        {renderRow(
          13,
          "Lời khuyên của đồng chí (anh/chị) đối với cá nhân có mong muốn lựa chọn học tập tại Học viện:",
          Q13_OPTIONS
        )}
      </tbody>
    </table>
  )
}
