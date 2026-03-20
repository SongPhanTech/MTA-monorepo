import { Decimal } from 'decimal.js'
import { calcFinalScore } from './utils'

const n = ((10 * 0.1 + 8.5 * 0.3 + 8.5 * 0.6) * 100) / 10

const d = new Decimal(10)
    .mul(0.1)
    .add(new Decimal(8.5).mul(0.3))
    .add(new Decimal(8.5).mul(0.6))
    .toNumber()

const finalScore = calcFinalScore(
    {
        coef_1: 0.1,
        coef_2: 0.3,
        coef_3: 0.6,
        scoreToTakeExam: 4,
        scoreToPass: 4,
        maxReExamScore: 4,
        reduceReExamScore: 1,
        examScoreToPass: 4,
    },
    {
        attendanceScore: 10,
        midtermScore: 8.5,
        examScore: 8.5,
        awards: [],
        certificates: [],
    },
    'NORMAL'
)

