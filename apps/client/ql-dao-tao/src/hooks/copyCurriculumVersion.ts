import type { Prisma } from '@workspace/db/client'
import { useCreateCurriculumVersion } from '@workspace/db/hooks'
import { sqlTransaction } from '@workspace/libs/api/model'
import { ROUTER_PATH } from '@workspace/router'
import { message } from 'antd'
import { useRouter } from 'next/router'
import useSpinner from './spinner'

export const useCloneCurriculumVersion = () => {
    const { mutateAsync: createCurriculumVersion } = useCreateCurriculumVersion()
    const { showSpinner, hideSpinner } = useSpinner()
    const router = useRouter()

    const handleCloneCurriculumVersion = async (id: string, targetCurriculumId?: string) => {
        try {
            showSpinner()
            const res = await sqlTransaction([
                {
                    model: 'CurriculumVersion',
                    operation: 'findUnique',
                    data: {
                        where: { id },
                        include: {
                            trainingTime: { select: { id: true } },
                            trainingBlocks: {
                                include: {
                                    subjects: {
                                        include: {
                                            subject: true,
                                        },
                                    },
                                },
                            },
                            trainingObjectType: true,
                            documentFiles: true,
                        },
                    },
                },
            ])

            const originalVersion = res.data[0] as Prisma.CurriculumVersionGetPayload<{
                include: {
                    documentFiles: true
                    trainingBlocks: {
                        include: {
                            subjects: true
                        }
                    }
                }
            }>

            if (!originalVersion) {
                throw new Error('Không tìm thấy phiên bản')
            }

            const shortSuffix = new Date().toISOString().slice(11, 19).replace(/:/g, '')

            const cloneData: Prisma.CurriculumVersionCreateInput = {
                name: `${originalVersion?.name} (Bản sao)`,
                code: originalVersion.code
                    ? `${originalVersion.code}-COPY-${shortSuffix}`
                    : `COPY-${Date.now()}`,
                curriculum: {
                    connect: { id: targetCurriculumId ?? originalVersion?.curriculumId },
                },
                trainingObjectType: { connect: { id: originalVersion.trainingObjectTypeId } },
                ...(originalVersion.trainingLevelId
                    ? { trainingLevel: { connect: { id: originalVersion.trainingLevelId ?? '' } } }
                    : {}),
                ...(originalVersion.trainingTimeId
                    ? { trainingTime: { connect: { id: originalVersion.trainingTimeId ?? '' } } }
                    : {}),
                ...(originalVersion.trainingTypeId
                    ? { trainingType: { connect: { id: originalVersion.trainingTypeId ?? '' } } }
                    : {}),
                ...(originalVersion.trainingLanguageId
                    ? {
                          trainingLanguage: {
                              connect: { id: originalVersion.trainingLanguageId },
                          },
                      }
                    : {}),
                shortName: originalVersion.shortName,
                englishName: originalVersion.englishName,
                numberOfSemesters: originalVersion.numberOfSemesters,
                yearCreation: originalVersion.yearCreation,
                yearApplication: originalVersion.yearApplication,
                requiredCredits: originalVersion.requiredCredits,
                electiveCredits: originalVersion.electiveCredits,
                jobPosition: originalVersion.jobPosition,
                objectives: originalVersion.objectives,
                learningOutcome: originalVersion.learningOutcome,
                inputStandard: originalVersion.inputStandard,
                time: originalVersion.time,
                structure: originalVersion.structure,
                matrixLearningOutcome: originalVersion.matrixLearningOutcome,
                summary: originalVersion.summary,
                learningDiagram: originalVersion.learningDiagram,
                guide: originalVersion.guide,
                documentFiles: {
                    createMany: {
                        data: (originalVersion.documentFiles || []).map(
                            ({ name, path, mimeType, size }) => ({
                                name,
                                path,
                                mimeType,
                                size,
                            })
                        ),
                    },
                },
                renderPath: originalVersion.renderPath,
                ...(originalVersion.diplomaTypeId
                    ? {
                          diplomaType: { connect: { id: originalVersion.diplomaTypeId } },
                      }
                    : {}),
                trainingBlocks: {
                    create:
                        originalVersion.trainingBlocks?.map((block) => ({
                            priority: block.priority,
                            electiveCreditsRequired: block.electiveCreditsRequired,
                            trainingBlock: { connect: { id: block.trainingBlockId } },
                            subjects: {
                                create:
                                    block.subjects?.map((subject) => ({
                                        semester: subject.semester,
                                        type: subject.type,
                                        useForFinalScore: subject.useForFinalScore,
                                        graduation: subject.graduation,
                                        // print: subject.print,
                                        subject: { connect: { id: subject.subjectId } },
                                    })) || [],
                            },
                        })) || [],
                },
            }

            const result = await createCurriculumVersion({
                data: cloneData,
            })

            message.success('Sao chép phiên bản chương trình đào tạo thành công')
            if (result?.id) {
                router.push(
                    `${
                        ROUTER_PATH.QL_DAO_TAO.CHUONG_TRINH_DAO_TAO_DANH_MUC_CHUONG_TRINH_DAO_TAO
                    }/${result.id}`
                )
            }
        } catch (error) {
            console.error('Lỗi khi sao chép:', error)
            message.error('Đã xảy ra lỗi khi sao chép phiên bản')
        } finally {
            hideSpinner()
        }
    }

    return { handleCloneCurriculumVersion }
}
