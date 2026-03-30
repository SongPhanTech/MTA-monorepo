import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { createId, type Prisma } from "@workspace/db";
import {
  parseSheetSubject,
  parseSheetTrainingBlock,
  zParseSheetError,
} from "@workspace/libs/parseExcel";
import { prisma } from "..";
import { UploadExcelModel } from "../dto/upload-excel.dto";
import { buildSubjectMapOrThrow, buildTrainingBlockMapOrThrow } from "../utils";
import { $Enums } from "@workspace/db";
const app = new OpenAPIHono({ strict: false });

const importCurriculumVersion = createRoute({
  operationId: "import-phien-ban-CTDT-Subject",
  tags: ["Curriculum"],
  path: "/import-phien-ban-ctdt-subject",
  method: "post",
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: UploadExcelModel.extend({
            trainingObjectTypeId: z.string(),
            curriculumVersionId: z.string(),
            createNewSubjects: z.coerce.boolean().default(false),
            deleteOldData: z.coerce.boolean().default(false),
            timeout: z.coerce.number().default(30),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Import successfully",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
    400: {
      description: "Invalid file type",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
            errors: z.array(zParseSheetError).optional(),
          }),
        },
      },
    },
  },
});

app.openapi(importCurriculumVersion, async (c) => {
  const {
    curriculumVersionId,
    trainingObjectTypeId,
    file,
    timeout,
    createNewSubjects,
    deleteOldData,
  } = c.req.valid("form");

  const buf = await file.arrayBuffer();
  const data = parseSheetSubject(buf);
  const trainingBlocks = parseSheetTrainingBlock(buf);

  if (data.errors.length || trainingBlocks.errors.length) {
    return c.json(
      {
        message: "Lỗi khi đọc file",
        errors: [...data.errors, ...trainingBlocks.errors],
      },
      400,
    );
  }

  const uniqueTrainingBlockNames = [
    ...new Set(data.subjects.map(({ trainingBlockName }) => trainingBlockName)),
  ];

  const trainingBlockMap = await buildTrainingBlockMapOrThrow(
    prisma,
    trainingObjectTypeId,
    uniqueTrainingBlockNames,
  );

  const subjectMap = await buildSubjectMapOrThrow(
    prisma,
    data.subjects.map((s) => ({
      trainingObjectTypeId,
      ...s,
      type: s.subjectVersionType,
    })),
    createNewSubjects,
  );

  let existingTBCVs: { id: string; trainingBlockId: string }[] = [];
  let existingTBSs: {
    trainingBlockOnCurriculumVersionId: string;
    subjectId: string;
  }[] = [];

  if (!deleteOldData) {
    existingTBCVs = await prisma.trainingBlockOnCurriculumVersion.findMany({
      where: { curriculumVersionId },
      select: { id: true, trainingBlockId: true },
    });

    existingTBSs = await prisma.trainingBlockSubject.findMany({
      where: {
        trainingBlockOnCurriculumVersion: {
          curriculumVersionId,
        },
      },
      select: { trainingBlockOnCurriculumVersionId: true, subjectId: true },
    });
  }

  const existingTBCVMap = new Map(
    existingTBCVs.map((item) => [item.trainingBlockId, item.id]),
  );
  const existingTBSSet = new Set(
    existingTBSs.map(
      (item) => `${item.trainingBlockOnCurriculumVersionId}-${item.subjectId}`,
    ),
  );

  const curriculumTrainingBlock = new Map(
    uniqueTrainingBlockNames.map((trainingBlock) => {
      const trainingBlockId = trainingBlockMap.get(trainingBlock) as string;
      const existingId = existingTBCVMap.get(trainingBlockId);

      return [
        trainingBlock,
        {
          id: existingId ?? createId(),
          electiveCreditsRequired:
            trainingBlocks.trainingBlocks.find(
              (tb) => tb.trainingBlockName === trainingBlock,
            )?.credit || 0,
          isNew: !existingId,
        },
      ];
    }),
  );

  const trainingBlockOnCurriculumVersion: Prisma.TrainingBlockOnCurriculumVersionCreateManyInput[] =
    Array.from(curriculumTrainingBlock.entries())
      .filter(([, { isNew }]) => isNew)
      .map(([name, { id, electiveCreditsRequired }], i) => ({
        id,
        curriculumVersionId,
        trainingBlockId: trainingBlockMap.get(name) as string,
        electiveCreditsRequired,
        priority: i + 1,
      }));

  const trainingBlockSubjects: Prisma.TrainingBlockSubjectCreateManyInput[] =
    data.subjects
      .map(
        ({
          code,
          trainingBlockName,
          semester,
          type,
          useForFinalScore,
          graduation,
        }) => {
          const trainingBlockOnCurriculumVersionId =
            curriculumTrainingBlock.get(trainingBlockName)?.id as string;
          const subjectId = subjectMap.get(code) as string;

          if (
            existingTBSSet.has(
              `${trainingBlockOnCurriculumVersionId}-${subjectId}`,
            )
          ) {
            return null;
          }

          return {
            id: createId(),
            trainingBlockOnCurriculumVersionId,
            subjectId,
            semester,
            type,
            useForFinalScore,
            graduation,
          };
        },
      )
      .filter(
        (item) => item !== null,
      ) as Prisma.TrainingBlockSubjectCreateManyInput[];

  const maxSemester = Math.max(...data.subjects.map((s) => s.semester || 0));

  const { totalMandatoryCredits, totalElectiveCredits } = (
    data?.subjects || []
  ).reduce(
    (acc, s) => {
      const credit = Number(s.credit) || 0;

      if (s.type === $Enums.SubjectRequirementType.Mandatory) {
        acc.totalMandatoryCredits += credit;
      } else if (s.type === $Enums.SubjectRequirementType.Optional) {
        acc.totalElectiveCredits += credit;
      }

      return acc;
    },
    { totalMandatoryCredits: 0, totalElectiveCredits: 0 },
  );
  await prisma.$transaction(
    async (tx) => {
      if (deleteOldData) {
        await tx.trainingBlockSubject.deleteMany({
          where: {
            trainingBlockOnCurriculumVersion: {
              curriculumVersionId,
            },
          },
        });

        await tx.trainingBlockOnCurriculumVersion.deleteMany({
          where: { curriculumVersionId },
        });
      }

      await tx.trainingBlockOnCurriculumVersion.createMany({
        data: trainingBlockOnCurriculumVersion,
      });

      await tx.trainingBlockSubject.createMany({
        data: trainingBlockSubjects,
      });

      await tx.curriculumVersion.update({
        where: { id: curriculumVersionId },
        data: {
          numberOfSemesters: maxSemester,
          requiredCredits: totalMandatoryCredits,
          electiveCredits: totalElectiveCredits,
        },
      });
    },
    { timeout: timeout * 1000 },
  );

  return c.json(
    {
      message: `Import training blocks successfully: ${uniqueTrainingBlockNames.length}`,
    },
    200,
  );
});

export default app;
