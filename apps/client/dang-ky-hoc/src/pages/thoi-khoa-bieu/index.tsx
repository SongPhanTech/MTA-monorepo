import Table from "@components/commons/table";
import ViewIcon from "@components/icons/view";
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants";
import type { FilterProps } from "@constants/type";
import { useExamTypeOptions } from "@hooks/examType";
import DefaultLayout from "@layouts/default-layout";
import { formatDate } from "@lib/utils";
import { useSession } from "@workspace/auth/react";
import { emptyObjectIf } from "@workspace/constant";
import type { $Enums, Prisma, SubjectClassTime } from "@workspace/db/client";
import {
  useCountSubjectClass,
  useFindManySemester,
  useFindManySubjectClass,
  useFindUniqueUserProfile,
} from "@workspace/db/hooks";
import { dayjs } from "@workspace/ui";
import { Col, Divider, Row, Select } from "antd";
import _ from "lodash";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDisclosure } from "react-hook-disclosure-modal";

export default function ThoiKhoaBieu({
  type,
}: {
  type?: $Enums.SubjectClassType;
}) {
  const { data: me } = useSession();
  const id = me?.sDM_NhanVienId || "";
  const [currentPage, setCurrentPage] = useState(1);
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE);
  const [selectedSemesterId, setSelectedSemesterId] = useState<
    string | undefined
  >(undefined);
  const [filters, setFilters] = useState<FilterProps>({
    code: "",
    name: "",
    lecturerId: undefined,
    maxStudent: undefined,
    subjectClassStudent: undefined,
    mainLecturer: undefined,
    extraLecturer: undefined,
    examType: undefined,
    room: undefined,
  });

  const toDay = dayjs().startOf("day");
  // const { data: currentSemester } = useFindFirstSemester({
  //   where: {
  //     schoolYear: {
  //       startDate: { lte: toDay.toDate() },
  //       endDate: { gte: toDay.toDate() },
  //     },
  //     startDate: { lte: toDay.toDate() },
  //     endDate: { gte: toDay.toDate() },
  //   },
  //   select: {
  //     id: true,
  //     name: true,
  //     schoolYear: { select: { name: true } },
  //   },
  // })

  const { data: allSemesters = [] } = useFindManySemester(
    {
      where: {
        subjectClasses: {
          some: {
            deletedAt: null,
            active: true,
            status: "OFFICIAL",

            subjectClassStudent: {
              some: {
                student: { userProfileId: id },
              },
            },
            ...(type ? { type } : {}),
          },
        },
      },
      select: {
        id: true,
        name: true,
        schoolYear: { select: { name: true } },
      },
      orderBy: [{ schoolYear: { startDate: "desc" } }, { startDate: "desc" }],
    },
    {
      enabled: !!id,
    },
  );

  useEffect(() => {
    if (allSemesters?.[0]?.id && !selectedSemesterId) {
      setSelectedSemesterId(allSemesters[0].id);
    }
  }, [allSemesters?.[0]?.id]);

  const displaySemester = allSemesters.find((s) => s.id === selectedSemesterId);

  const { data: userProfile } = useFindUniqueUserProfile(
    {
      where: { id },
      select: {
        educationAndTraining: {
          select: {
            id: true,
            fixedClass: {
              select: {
                trainingCourse: {
                  select: { trainingObjectTypeId: true },
                },
              },
            },
          },
        },
      },
    },
    { enabled: !!id },
  );

  const semesterId = selectedSemesterId;
  const trainingObjectTypeId =
    userProfile?.educationAndTraining?.[0]?.fixedClass?.trainingCourse
      ?.trainingObjectTypeId;

  const { options, getExamTypeLabel } = useExamTypeOptions();

  const where = useMemo(
    () =>
      ({
        ...(filters.name
          ? { name: { contains: filters.name, mode: "insensitive" as const } }
          : {}),
        ...(filters.code
          ? { code: { contains: filters.code, mode: "insensitive" as const } }
          : {}),
        ...(filters.examType ? { examType: { in: filters.examType } } : {}),
        ...(filters.lecturerId?.length === 1
          ? filters.lecturerId[0]
            ? { lecturerId: { not: null } }
            : { lecturerId: null }
          : {}),
        ...(filters.mainLecturer
          ? {
              mainLecturer: {
                userProfile: {
                  fullname: {
                    contains: filters.mainLecturer,
                    mode: "insensitive" as const,
                  },
                },
              },
            }
          : {}),
        ...(filters.extraLecturer
          ? {
              extraLecturer: {
                userProfile: {
                  fullname: {
                    contains: filters.extraLecturer,
                    mode: "insensitive" as const,
                  },
                },
              },
            }
          : {}),
        ...(filters.room
          ? {
              room: {
                building: {
                  trainingLocation: {
                    name: {
                      contains: filters.room,
                      mode: "insensitive" as const,
                    },
                  },
                },
              },
            }
          : {}),
        deletedAt: null,
        active: true,
        status: "OFFICIAL",
        trainingObjectTypeId,
        subjectClassStudent: { some: { student: { userProfileId: id } } },
        semesterId,
        type: type,
      }) satisfies Prisma.SubjectClassWhereInput,
    [filters, semesterId, trainingObjectTypeId, id, type],
  );

  const { data: subjectClasses = [], refetch } = useFindManySubjectClass(
    {
      where,
      include: {
        semester: true,
        mainLecturer: { include: { userProfile: true } },
        subject: { include: { managementOrganization: true } },
        extraLecturer: { include: { userProfile: true } },
        enterGradeLecturer: { include: { userProfile: true } },
        room: true,
        trainingLocation: true,
        subjectClassStudent: true,
        subjectClassTimes: true,
        fixedClasses: {
          select: {
            code: true,
            _count: {
              select: {
                students: {
                  where: { deletedAt: null, active: true, status: "ENROLLED" },
                },
              },
            },
          },
        },
      },
      orderBy: [
        ...emptyObjectIf(
          [{ maxStudent: filters.maxStudent }],
          !!filters.maxStudent,
        ),
        ...emptyObjectIf(
          [{ subjectClassStudent: { _count: filters.subjectClassStudent } }],
          !!filters.subjectClassStudent,
        ),
        { code: "asc" },
      ],
      take: numberOfPages,
      skip: (currentPage - 1) * numberOfPages,
    },
    {
      enabled: !!semesterId && !!trainingObjectTypeId,
      refetchOnWindowFocus: false,
    },
  );

  const { data: count } = useCountSubjectClass({ where });

  const debouncedRefetch = useCallback(
    _.debounce(() => refetch(), 500),
    [],
  );

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };
      debouncedRefetch();
      return newFilters;
    });
  };

  const { onOpen: onOpenEditSubjectClass } = useDisclosure<{
    id: string;
    mode: "edit" | "view";
  }>({
    tag: "PutOneSubjectClassModal",
  });

  const handleSemesterChange = (value: string) => {
    setSelectedSemesterId(value);
    setCurrentPage(1);
  };

  return (
    <div>
      <Row gutter={[8, 8]}>
        <Col span={24}>
          <Col span={24}>
            <Divider
              orientation="center"
              className="
    uppercase !my-0 text-lg font-semibold
    [&::before]:border-gray-950
    [&::after]:border-gray-950
  "
              orientationMargin={0}
            >
              Thời khoá biểu{" "}
              {displaySemester
                ? `${displaySemester.name} - ${displaySemester.schoolYear?.name}`
                : ""}
            </Divider>
          </Col>
          <Table
            header={
              <Row gutter={[8, 8]} justify="end" align="middle">
                <Col span={12} md={8} lg={6}>
                  <Select
                    style={{ width: "100%" }}
                    placeholder="Chọn học kỳ"
                    value={selectedSemesterId}
                    onChange={handleSemesterChange}
                    options={allSemesters.map((s) => ({
                      label: `${s.name} - ${s.schoolYear?.name}`,
                      value: s.id,
                    }))}
                    allowClear={false}
                  />
                </Col>
              </Row>
            }
            rowKey="id"
            scrollable
            filters={filters}
            setFilters={(value) => {
              setFilters(value);
              setCurrentPage(1);
            }}
            columns={[
              {
                title: "Mã LMH",
                width: 100,
                align: "center",
                type: "input",
                render: (_, record) => record?.code || "",
              },
              {
                title: "Tên môn",
                align: "center",
                type: "input",
                render: (_, record) => (
                  <p className="text-left">
                    {record?.name} ({record.subject?.credit} TC)
                  </p>
                ),
              },
              {
                title: "Số SV",
                width: 80,
                align: "center",
                type: "order",
                distinctFilters: ["maxStudent"],
                render: (_, record) => (
                  <p>
                    {record?.fixedClasses?.reduce(
                      (acc: number, curr: any) =>
                        acc + (curr?._count?.students ?? 0),
                      0,
                    ) ?? 0}
                  </p>
                ),
              },
              {
                title: "Giảng viên 1",
                align: "center",
                type: "input",
                render: (__, record) =>
                  record?.mainLecturer?.userProfile?.fullname ?? "-",
              },
              {
                title: "Giảng viên 2",
                align: "center",
                type: "input",
                render: (__, record) =>
                  record?.extraLecturer?.userProfile?.fullname ?? "-",
              },
              {
                title: "Hình thức thi",
                align: "center",
                width: 150,
                type: "select",
                options: options,
                render: (__, record) => (
                  <div>{getExamTypeLabel(record?.examType)}</div>
                ),
              },
              {
                title: "Khu vực",
                align: "center",
                width: 120,
                type: "input",
                render: (_, record) =>
                  record.trainingLocation ? record.trainingLocation?.name : "-",
              },
              {
                title: "Phòng học",
                align: "center",
                width: 120,
                render: (_, record) => record?.room?.name || "",
              },
              {
                title: "Thời khoá biểu",
                width: 120,
                align: "center",
                render: (_, record) =>
                  record.subjectClassTimes
                    ?.uniqueByKey?.("dayOfWeek")
                    ?.map?.((tkb: SubjectClassTime) => (
                      <p key={tkb.dayOfWeek}>
                        {tkb.dayOfWeek === 8 ? "CN" : `T${tkb.dayOfWeek}`} -{" "}
                        {tkb.startPeriod} - {tkb.endPeriod}
                      </p>
                    )),
              },
              {
                title: "Ngày thi",
                align: "center",
                width: 100,
                render: (_, record) =>
                  record.examDate ? formatDate(record.examDate) : "",
              },
              {
                title: "Thao tác",
                width: 90,
                align: "center",
                render: (_, record) => (
                  <div className="flex items-center justify-center">
                    <ViewIcon
                      onClick={() =>
                        onOpenEditSubjectClass({ id: record.id, mode: "view" })
                      }
                    />
                  </div>
                ),
              },
            ]}
            data={subjectClasses}
            maxHeight={"calc(100vh - 250px)"}
            pagination={{
              current: currentPage,
              pageSize: numberOfPages,
              total: count,
              onChange: (page, pageSize) => {
                if (numberOfPages === pageSize) {
                  setCurrentPage(page);
                } else {
                  setCurrentPage(1);
                  setNumberOfPages(pageSize);
                }
              },
            }}
          />
        </Col>
      </Row>
    </div>
  );
}

ThoiKhoaBieu.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>;
};
