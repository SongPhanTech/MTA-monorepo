import { Typography, Progress } from "antd"

const { Title } = Typography

interface CardStudyResultProps {
  gpaScore: {
    gpa: number
    totalCredits: number
  }
  curriculumVersion: {
    requiredCredits: number
    electiveCredits: number
  }
  academicRanking: string
}

const CardStudyResult = (props: CardStudyResultProps) => {
  const { gpaScore, curriculumVersion, academicRanking } = props

  return (
    <div className="bg-white rounded-md overflow-hidden border border-gray-200 border-solid flex flex-col">
      <div className="px-4 py-2 border-b border-gray-200 bg-green-700">
        <Title className="mb-0 uppercase font-medium text-white" level={4}>
          Kết quả học tập
        </Title>
      </div>
      <div className="px-4 py-2.5 flex flex-col gap-4 items-center justify-center">
        <div className="flex justify-center gap-3 w-full items-center">
          <div className="flex flex-col items-start flex-1 gap-2 w-full justify-center">
            <div className="uppercase font-medium text-xs ">Điểm tích luỹ</div>
            <span className="text-xl font-semibold">{gpaScore.gpa.toFixed(2)}</span>
          </div>
          <div className="border border-gray-200 h-10" />
          <div className="flex flex-col items-start flex-1 gap-2 w-full justify-center">
            <div className="uppercase font-medium">Xếp hạng</div>
            <span className="text-xl font-semibold">{academicRanking}</span>
          </div>
        </div>
      </div>
      <hr />
      <div className="flex flex-col px-4 pb-4 py-2.5 gap-2.5">
        <div className="flex flex-row justify-between items-center h-full">
          <div className="uppercase">Tín chỉ tích luỹ</div>
          <div className="text-sm text-blue-600">
            {Math.min(
              100,
              Number(
                ((gpaScore.totalCredits || 0) /
                  ((curriculumVersion?.requiredCredits ?? 0) +
                    (curriculumVersion?.electiveCredits ?? 0) || 1)) *
                  100
              )
            ).toFixed(1)}
            % Hoàn thành
          </div>
        </div>
        <div className="flex flex-row justify-start items-center gap-4">
          <Progress
            type="circle"
            size={"small"}
            percent={
              (gpaScore.totalCredits /
                ((curriculumVersion?.requiredCredits ?? 0) +
                  (curriculumVersion?.electiveCredits ?? 0)) || 1) * 100
            }
            format={() => <span>{gpaScore.totalCredits}</span>}
          />

          <div className="flex flex-col justify-between items-start gap-1">
            <div className="text-sm font-semibold">
              {gpaScore.totalCredits}/
              {(curriculumVersion?.requiredCredits ?? 0) +
                (curriculumVersion?.electiveCredits ?? 0)}
            </div>

            <div className="text-xs text-gray-400">
              {(curriculumVersion?.requiredCredits ?? 0) +
                (curriculumVersion?.electiveCredits ?? 0) -
                (gpaScore.totalCredits || 0) <=
              0
                ? "Đã đủ điều kiện để xét tốt nghiệp"
                : `Còn lại ${
                    (curriculumVersion?.requiredCredits ?? 0) +
                    (curriculumVersion?.electiveCredits ?? 0) -
                    (gpaScore.totalCredits || 0)
                  } tín chỉ để đạt điều kiện xét tốt nghiệp`}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CardStudyResult
