import type { Prisma } from '@prisma/client'

export const academicRankingConversions: Omit<
    Prisma.AcademicRankingConvertCreateManyInput,
    'trainingCourseId'
>[] = [
    {
        baseScore: 'Base10',
        classification: 'Xuất sắc',
        base10Min: 9.0,
        base10Max: 10,
        // base4Min: 3.6,
        // base4Max: 4.0,
        graduated: true,
    },
    {
        baseScore: 'Base10',

        classification: 'Giỏi',
        base10Min: 8.0,
        base10Max: 8.99,
        // base4Min: 3.2,
        // base4Max: 3.6,
        graduated: true,
    },
    {
        baseScore: 'Base10',
        classification: 'Khá',
        base10Min: 7.0,
        base10Max: 7.99,
        // base4Min: 2.5,
        // base4Max: 3.19,
        graduated: true,
    },
    {
        baseScore: 'Base10',
        classification: 'Trung Bình Khá',
        base10Min: 6.5,
        base10Max: 6.99,
        // base4Min: 2.3,
        // base4Max: 2.49,
        graduated: true,
    },
    {
        baseScore: 'Base10',
        classification: 'Trung Bình',
        base10Min: 5.5,
        base10Max: 6.49,
        // base4Min: 2.0,
        // base4Max: 2.29,
        graduated: true,
    },
    {
        baseScore: 'Base10',
        classification: 'Yếu',
        base10Min: 0,
        base10Max: 5.49,
        // base4Min: 0,
        // base4Max: 1.99,
        graduated: false,
    },
]
