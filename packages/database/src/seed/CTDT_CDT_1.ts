import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    //#region Delete existing data before import
    console.log('Deleting existing data...')

    // Delete in reverse order of dependencies
    await prisma.fixedClass.deleteMany({
        where: {
            id: {
                in: ['K25_CĐT'],
            },
        },
    })

    await prisma.trainingBlockSubject.deleteMany({
        where: {
            trainingBlockOnCurriculumVersionId: {
                in: ['DC_CDT_K6_V1', 'CSN_CDT_K6_V1', 'CN_CDT_K6_V1'],
            },
        },
    })

    await prisma.trainingBlockOnCurriculumVersion.deleteMany({
        where: {
            id: {
                in: ['DC_CDT_K6_V1', 'CSN_CDT_K6_V1', 'CN_CDT_K6_V1'],
            },
        },
    })

    await prisma.trainingBlock.deleteMany({
        where: {
            id: {
                in: ['DC', 'CSN', 'CN'],
            },
        },
    })

    await prisma.curriculumVersion.deleteMany({
        where: {
            id: {
                in: ['CDT_K6_V1'],
            },
        },
    })

    await prisma.curriculum.deleteMany({
        where: {
            id: {
                in: ['CDT_K6'],
            },
        },
    })

    await prisma.subjectVersion.deleteMany({
        where: {
            id: {
                in: [
                    // Đại cương subjects
                    'VLĐC1_CĐT_1',
                    'TNVLĐC1_CĐT_1',
                    'VLĐC2_CĐT_1',
                    'TNVLĐC2_CĐT_1',
                    'CSLTHH_1',
                    'TNCSDLTHH_1',
                    'DSTTHGT_1',
                    'GT1_1',
                    'GT2_1',
                    'LTXSTK_1',
                    'LTCB_1',
                    'TA_B11_1',
                    'TA_B12_1',
                    'HHVKTCB_1',
                    'NNLCBCNMLN1_1',
                    'NNLCBCNMLN2_1',
                    'PLĐC_1',
                    'TTHCM_1',
                    'DLCM_1',
                    // Cơ sở ngành subjects
                    'CLT1_1',
                    'SBVL1_1',
                    'TNCH_1',
                    'CLT2_1',
                    'SBVL2_1',
                    'VKTCK_1',
                    'NLM_1',
                    'CTM_1',
                    'DACTM_1',
                    'TLMTL_1',
                    'DSBTL_1',
                    'CNKL_1',
                    'CSCNCTM_1',
                    'VLHĐC_1',
                    'TNVL_1',
                    'DCD_1',
                    'CADCAE_1',
                    'CKDT_1',
                    'TNCKDT_1',
                    'LTMBTL_1',
                    'TNLTM_1',
                    'LTDKTD1_1',
                    'ATLDVBVMT_1',
                    'LTDKTD2_1',
                    // Chuyên ngành subjects
                    'HTTDTK_1',
                    'PTCHNVNMT_1',
                    'KTRB_1',
                    'PTVTHHTCDT_1',
                    'DAPTVTHHTCDT_1',
                    'DKMTHTSX_1',
                    'DACNCAD_1',
                    'HTSXLHVTH_1',
                    'DTSBTL_1',
                    'TNDTS_1',
                    'DTTTBTL_1',
                    'TNDTTT_1',
                    'TKHTN_1',
                    'DATKHTN_1',
                    'PLCPCMTTCN_1',
                    'DTCSVKTBD_1',
                    'CSTDD_1',
                    'LTPTCADCAE_1',
                    'CSTDHMCC_1',
                    'TTCK_1',
                    'TTCDT_1',
                    'TTD_1',
                    'TTDTCB_1',
                    'ATDKCD_1',
                    'TTTN_K6_1',
                    'DATN_1',
                ],
            },
        },
    })

    await prisma.subject.deleteMany({
        where: {
            id: {
                in: [
                    // Đại cương subjects
                    'VLĐC1_CĐT',
                    'TNVLĐC1_CĐT',
                    'VLĐC2_CĐT',
                    'TNVLĐC2_CĐT',
                    'CSLTHH',
                    'TNCSDLTHH',
                    'DSTTHGT',
                    'GT1',
                    'GT2',
                    'LTXSTK',
                    'LTCB',
                    'TA_B11',
                    'TA_B12',
                    'HHVKTCB',
                    'NNLCBCNMLN1',
                    'NNLCBCNMLN2',
                    'PLĐC',
                    'TTHCM',
                    'DLCM',
                    // Cơ sở ngành subjects
                    'CLT1',
                    'SBVL1',
                    'TNCH',
                    'CLT2',
                    'SBVL2',
                    'VKTCK',
                    'NLM',
                    'CTM',
                    'DACTM',
                    'TLMTL',
                    'DSBTL',
                    'CNKL',
                    'CSCNCTM',
                    'VLHĐC',
                    'TNVL',
                    'DCD',
                    'CADCAE',
                    'CKDT',
                    'TNCKDT',
                    'LTMBTL',
                    'TNLTM',
                    'LTDKTD1',
                    'ATLDVBVMT',
                    'LTDKTD2',
                    // Chuyên ngành subjects
                    'HTTDTK',
                    'PTCHNVNMT',
                    'KTRB',
                    'PTVTHHTCDT',
                    'DAPTVTHHTCDT',
                    'DKMTHTSX',
                    'DACNCAD',
                    'HTSXLHVTH',
                    'DTSBTL',
                    'TNDTS',
                    'DTTTBTL',
                    'TNDTTT',
                    'TKHTN',
                    'DATKHTN',
                    'PLCPCMTTCN',
                    'DTCSVKTBD',
                    'CSTDD',
                    'LTPTCADCAE',
                    'CSTDHMCC',
                    'TTCK',
                    'TTCDT',
                    'TTD',
                    'TTDTCB',
                    'ATDKCD',
                    'TTTN_MTA',
                    'DATN',
                ],
            },
        },
    })

    await prisma.scoreConvert.deleteMany({
        where: {
            trainingCourseId: {
                in: ['K25'],
            },
        },
    })

    await prisma.trainingCourse.deleteMany({
        where: {
            id: {
                in: ['K25'],
            },
        },
    })

    console.log('Existing data deleted successfully.')
    console.log('All data imported successfully!')
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
