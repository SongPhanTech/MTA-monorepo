import type {
    CurriculumVersion,
    DocumentFile,
    Prisma,
    TrainingBlockOnCurriculumVersion,
    TrainingBlockSubject,
} from '@workspace/db'
import { useCreateCurriculumVersion } from '@workspace/db/hooks'
import { message } from 'antd'
import useSpinner from './spinner'

interface UseCloneCurriculumVersionProps {
    refetch?: () => void
}

export const useCloneCurriculumVersion = ({ refetch }: UseCloneCurriculumVersionProps) => {
    const { mutateAsync: createCurriculumVersion } = useCreateCurriculumVersion()
    const { showSpinner, hideSpinner } = useSpinner()

    const handleCloneCurriculumVersion = async (
        initialValue: CurriculumVersion & {
            trainingBlocks: TrainingBlockOnCurriculumVersion[]
            documentFiles: DocumentFile[]
        }
    ) => {
        try {
            showSpinner()
            const originalVersion = initialValue

            if (!originalVersion) {
                throw new Error('Không tìm thấy phiên bản')
            }

            const shortSuffix = new Date().toISOString().slice(11, 19).replace(/:/g, '')

            const cloneData: Prisma.CurriculumVersionCreateInput = {
                name: `${originalVersion?.name} (Bản sao)`,
                code: originalVersion.code
                    ? `${originalVersion.code}-COPY-${shortSuffix}`
                    : `COPY-${Date.now()}`,
                curriculum: { connect: { id: originalVersion?.curriculumId } },
                trainingObjectType: { connect: { id: originalVersion.trainingObjectTypeId } },
                trainingLevel: { connect: { id: originalVersion.trainingLevelId } },
                trainingTime: { connect: { id: originalVersion.trainingTimeId } },
                shortName: originalVersion.shortName,
                englishName: originalVersion.englishName,
                trainingLanguage: originalVersion.trainingLanguage,
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
                        data: originalVersion.documentFiles.map(({ name, path, mimeType }) => ({
                            name,
                            path,
                            mimeType,
                        })),
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
                        (
                            originalVersion.trainingBlocks as (TrainingBlockOnCurriculumVersion & {
                                subjects?: TrainingBlockSubject[]
                            })[]
                        )?.map((block) => ({
                            priority: block.priority,
                            trainingBlock: { connect: { id: block.trainingBlockId } },
                            subjects: {
                                create:
                                    block.subjects?.map((subject: TrainingBlockSubject) => ({
                                        semester: subject.semester,
                                        type: subject.type,
                                        useForFinalScore: subject.useForFinalScore,
                                        graduation: subject.graduation,
                                        project: subject.project,
                                        print: subject.print,
                                        subject: { connect: { id: subject.subjectId } },
                                    })) || [],
                            },
                        })) || [],
                },
            }

            await createCurriculumVersion({
                data: cloneData,
            })

            message.success('Sao chép phiên bản chương trình đào tạo thành công')
            if (refetch) refetch()
        } catch (error) {
            console.error('Lỗi khi sao chép:', error)
            message.error('Đã xảy ra lỗi khi sao chép phiên bản')
        } finally {
            hideSpinner()
        }
    }

    return { handleCloneCurriculumVersion }
}
