import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting data import...')
    // Data QuestionBank

    const questionBank = await prisma.questionBank.createManyAndReturn({
        skipDuplicates: true,

        data: [
            {
                id: 'THDC_CNTT_1',
                name: 'Tin học đại cương',
                description: 'Tạo ví dụ môn Tin học đại cương',
                createdAt: new Date(),
                updatedAt: new Date(),
                subjectVersionId: 'THDC_CNTT_1',
            },
        ],
    })

    // const difficulties = await prisma.difficulty.createManyAndReturn({
    //     skipDuplicates: true,
    //     data: [
    //         {
    //             id: 'De_1',
    //             name: 'Dễ',
    //             level: 1,
    //             createdAt: new Date(),
    //             updatedAt: new Date()
    //         },
    //         {
    //             id: 'Trung_binh_1',
    //             name: 'Trung bình',
    //             level: 1,
    //             createdAt: new Date(),
    //             updatedAt: new Date()
    //         },
    //         {
    //             id: 'Kho_1',
    //             name: 'Khó',
    //             level: 1,
    //             createdAt: new Date(),
    //             updatedAt: new Date()
    //         }
    //     ]
    // })

    const KnowledgeBlock = await prisma.knowledgeBlock.createManyAndReturn({
        skipDuplicates: true,
        data: [
            {
                id: 'THDC_CNTT_1_Chuong_1',
                name: 'Chuong 1',
                subjectVersionId: 'THDC_CNTT_1',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: 'THDC_CNTT_1_Chuong_2',
                name: 'Chuong 2',
                subjectVersionId: 'THDC_CNTT_1',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ],
    })

    const exam = await prisma.exam.createManyAndReturn({
        skipDuplicates: true,
        data: [
            {
                id: 'THDC_CNTT_1_DE_1',
                title: 'Thi cuối kỳ Tin học đại cương 1',
                description: 'Mô tả đề thi Tin học đại cương 1',
                questionBankId: 'THDC_CNTT_1',
                createdAt: new Date(),
                updatedAt: new Date(),
                startTime: new Date(),
                endTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
                duration: 60, // 60 minutes
            },
        ],
    })

    // Một câu chương 1, một câu chương 2
    const testStructureRule = await prisma.testStructureRule.createManyAndReturn({
        skipDuplicates: true,
        data: [
            {
                id: 'THDC_CNTT_1_DE_1_TL_1',
                examId: 'THDC_CNTT_1_DE_1',
                questionPoint: 5,
                questionType: 'ESSAY',
                knowledgeBlockId: 'THDC_CNTT_1_Chuong_1',
                createdAt: new Date(),
                updatedAt: new Date(),
                count: 1,
            },
            {
                id: 'THDC_CNTT_1_DE_1_TL_2',
                examId: 'THDC_CNTT_1_DE_1',
                questionPoint: 5,
                questionType: 'ESSAY',
                knowledgeBlockId: 'THDC_CNTT_1_Chuong_2',
                createdAt: new Date(),
                updatedAt: new Date(),
                count: 1,
            },
        ],
    })

    const questions = await prisma.question.createManyAndReturn({
        skipDuplicates: true,
        data: [
            {
                id: 'THDC_CNTT_1_TL_1',
                content: 'Câu hỏi tự luận 1',
                questionBankId: 'THDC_CNTT_1',
                knowledgeBlockId: 'THDC_CNTT_1_Chuong_1',
                point: 5,
                type: 'ESSAY',
                difficultyId: 'cmdic5uxt001tmx014zn6e87j',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: 'THDC_CNTT_1_TL_2',
                content: 'Câu hỏi tự luận 2',
                questionBankId: 'THDC_CNTT_1',
                knowledgeBlockId: 'THDC_CNTT_1_Chuong_1',
                point: 5,
                type: 'ESSAY',
                difficultyId: 'cmdic5uxt001tmx014zn6e87j',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: 'THDC_CNTT_1_TL_3',
                content: 'Câu hỏi tự luận 3',
                questionBankId: 'THDC_CNTT_1',
                knowledgeBlockId: 'THDC_CNTT_1_Chuong_1',
                point: 5,
                type: 'ESSAY',
                difficultyId: 'cmdic5uxt001tmx014zn6e87j',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: 'THDC_CNTT_1_TL_4',
                content: 'Câu hỏi tự luận 4',
                questionBankId: 'THDC_CNTT_1',
                knowledgeBlockId: 'THDC_CNTT_1_Chuong_2',
                point: 5,
                type: 'ESSAY',
                difficultyId: 'cmdic5uxt001tmx014zn6e87j',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: 'THDC_CNTT_1_TL_5',
                content: 'Câu hỏi tự luận 5',
                questionBankId: 'THDC_CNTT_1',
                knowledgeBlockId: 'THDC_CNTT_1_Chuong_2',
                point: 5,
                type: 'ESSAY',
                difficultyId: 'cmdic5uxt001tmx014zn6e87j',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ],
    })
}

main()
    .then(async () => {
        await prisma.$disconnect()
        console.log('Database connection closed.')
    })
    .catch(async (e) => {
        console.error('Error during data import:', e)
        await prisma.$disconnect()
    })
