import Loading from "@components/commons/loading";
import ThoiKhoaBieuDangKy from "@components/commons/registration-schedule";
import Select from "@components/commons/select";
import TableCollapse from "@components/commons/tableCollapse";
import DefaultLayout from "@layouts/default-layout";
import { cn } from "@lib/utils";
import { useMutation } from "@tanstack/react-query";
import { $Enums } from "@workspace/db";
import {
  classRegister,
  useGetClassesInfo,
  useGetClassRegisterSession,
  useGetStudentInfo,
} from "@workspace/libs/api/portal";
import type { GetClassesInfo200ItemSubjectClassItem } from "@workspace/libs/api/schemas/getClassesInfo200ItemSubjectClassItem";
import type { GetClassRegisterSession200ItemCreditLimitItem } from "@workspace/libs/api/schemas/getClassRegisterSession200ItemCreditLimitItem";
import { Button, Checkbox, message, Popconfirm, Tabs } from "antd";
import dayjs from "dayjs";
import { LogOutIcon } from "lucide-react";
import { useMemo, useState } from "react";
import clsx from "clsx";

dayjs.locale("vi");

export interface ClassRegisterSessionProps {
  sessionId: string;
  curriculumVersions: {
    id: string;
    name: string;
    code: string;
  }[];
  endDate: string | null;
  creditLimit: GetClassRegisterSession200ItemCreditLimitItem[];
  tuitionPerCredit?: number;
}

export default function DangKyHocPage() {
  const [_filters, _setFilters] = useState({
    searchText: "",
  });
  const { data: classRegisterSession, isFetching, isLoading } =
    useGetClassRegisterSession();

  if (isFetching || isLoading) {
    return <Loading />;
  }

  return (
    <div>
      {classRegisterSession?.status !== 200 ||
      classRegisterSession.data.length === 0 ? (
        <center>
          <b className="text-lg">
            {"Tạm ngừng đăng ký học. Vui lòng quay lại sau!"}
          </b>
        </center>
      ) : (
        <Tabs
          hideAdd
          type="card"
          items={
            classRegisterSession?.data?.map((session) => ({
              label: [
                session.name,
                session.semester.name,
                session.semester.schoolYear.name,
              ].join(" - "),
              key: session.id,
              children: (
                <DanhSachMonDangKy
                  sessionId={session.id}
                  curriculumVersions={session.curriculumVersions.map((cv) => ({
                    id: cv?.id ?? "",
                    name: cv?.name ?? "",
                    code: cv?.code ?? "",
                  }))}
                  endDate={session.endDate}
                  creditLimit={session.creditLimit}
                  tuitionPerCredit={session.tuitionPerCredit}
                />
              ),
            })) || []
          }
        />
      )}
    </div>
  );
}

const DanhSachMonDangKy = (props: ClassRegisterSessionProps) => {
  const {
    sessionId,
    curriculumVersions,
    endDate,
    creditLimit,
    tuitionPerCredit,
  } = props;
  const [curriculumVersionId, setCurriculumVersionId] = useState(
    curriculumVersions.length > 0 ? curriculumVersions[0].id : "",
  );
  const [byCurriculum, setByCurriculum] = useState(1);
  const { data: classStudentData } = useGetStudentInfo({
    sessionId: sessionId,
  });

  const studentData = useMemo(() => {
    if (classStudentData?.status !== 200) return null;

    const data = classStudentData.data;

    return {
      studentName: data?.userProfile?.fullname,
      studentCode: data?.student?.code,
      classification: data?.latestSemesterResult?.rank?.classification,
      maxCredit: data?.creditLimit?.maxCredit,
    };
  }, [classStudentData]);

  const infoItems = [
    {
      label: "Họ và tên",
      value: studentData?.studentName,
    },
    {
      label: "Mã sinh viên",
      value: studentData?.studentCode,
    },
    {
      label: "Xếp loại",
      value: studentData?.classification,
    },
    {
      label: "Giới hạn tín chỉ đăng ký",
      value: studentData?.maxCredit ? (
        <>
          tối đa <b>{studentData?.maxCredit}</b>
        </>
      ) : creditLimit.length > 0 ? (
        "chưa xác định"
      ) : null,
    },
  ].filter((item) => item.value);

  const { data: classesInfo, refetch: refetchClassesInfo } = useGetClassesInfo({
    sessionId,
    curriculumVersionId,
    byCurriculum: byCurriculum === 1 ? "true" : "false",
    isRegistered: "false",
  });

  const registeredClasses =
    classesInfo?.status === 200
      ? classesInfo.data
          ?.flatMap((e) => e?.subjectClass)
          ?.filter((sc) => (sc?.classRegisterLogs?.length || 0) > 0)
      : [];

  const classToSubjectCodeMap = new Map<string, string>();
  const registeredSubjectCodes = new Set<string>();
  if (classesInfo?.status === 200) {
    classesInfo.data?.forEach((subject) => {
      const subjectCode = subject.code ?? "";
      const hasRegistered = subject.subjectClass?.some(
        (sc) => (sc?.classRegisterLogs?.length || 0) > 0,
      );
      if (hasRegistered) registeredSubjectCodes.add(subjectCode);
      subject.subjectClass?.forEach((sc) => {
        if (sc?.id) classToSubjectCodeMap.set(sc.id, subjectCode);
      });
    });
  }

  const {
    mutateAsync: classRegisterMutate,
    isPending: isPendingClassRegister,
  } = useMutation({
    mutationFn: async (subjectClassIds: string[]) => {
      const res = await classRegister({
        sessionId,
        subjectClassIds,
        curriculumVersionId,
      });

      if (res.status !== 200) {
        throw new Error(res.data?.message || "Đăng ký thất bại");
      }

      return res;
    },
    onSuccess: () => {
      refetchClassesInfo();
      message.success("Đăng ký thành công");
    },
    onError: (error: any) => {
      message.error(error?.message || "Đăng ký thất bại");
    },
  });

  const handleClassRegister = (subjectClassIds: string[]) => {
    classRegisterMutate(subjectClassIds);
  };

  return (
    <div>
      {endDate && (
        <p className="mb-2">
          Hạn đăng ký học:{" "}
          <b className="text-red-500">{dayjs(endDate).format("DD/MM/YYYY")}</b>,
          vui lòng đăng ký trước thời gian này!
        </p>
      )}
      <div
        className={clsx(
          "mb-2 flex flex-wrap gap-4",
          classStudentData?.status !== 200 && "hidden",
        )}
      >
        {infoItems.map((item) => (
          <p key={item?.label}>
            {item.label}: <b>{item.value}</b>
          </p>
        ))}
      </div>
      <p className="mb-4">Lưu ý: Môn học đã đăng ký sẽ được tô màu xanh lá</p>
      <div className="flex gap-2">
        <Select
          options={curriculumVersions?.map((cv) => ({
            label: `${cv?.code} - ${cv?.name}`,
            value: cv?.id,
          }))}
          placeholder="Chọn chương trình đào tạo"
          style={{ width: 300, marginBottom: 16 }}
          value={curriculumVersionId}
          allowClear={false}
          onChange={setCurriculumVersionId}
        />
        <Select
          options={[
            {
              label: "Môn học trong chương trình đào tạo",
              value: 1,
            },
            {
              label: "Môn học toàn khoá",
              value: 0,
            },
          ]}
          placeholder="Chọn loại môn học"
          style={{ width: 300, marginBottom: 16 }}
          value={byCurriculum}
          allowClear={false}
          onChange={setByCurriculum}
        />
      </div>

      <div className="flex gap-2 items-center">
        <b className="text-lg">Danh sách môn học đã đăng ký</b>
        {classesInfo?.status === 200 && (
          <p>
            Bạn đã đăng ký <b>{registeredClasses?.length || 0}</b> học phần,{" "}
            <b>
              {registeredClasses?.reduce(
                (acc: number, curr: GetClassesInfo200ItemSubjectClassItem) =>
                  acc + (curr?.credit || 0),
                0,
              )}
            </b>{" "}
            tín chỉ, học phí{" "}
            {(
              (registeredClasses?.reduce(
                (acc: number, curr: GetClassesInfo200ItemSubjectClassItem) =>
                  acc + (curr?.credit || 0),
                0,
              ) ?? 0) * (tuitionPerCredit || 0)
            ).formatVND()}
          </p>
        )}
      </div>
      {classesInfo?.status === 200 && (
        <ThoiKhoaBieuDangKy
          registeredClasses={registeredClasses}
          sessionId={sessionId}
          curriculumVersionId={curriculumVersionId}
          onUnregisterSuccess={refetchClassesInfo}
        />
      )}

      <b className="text-lg">Danh sách môn học mở đăng ký</b>
      {classesInfo?.status === 200 && (
        <TableCollapse
          defaultExpandAll
          columns={[
            {
              title: "Mã học phần",
              dataIndex: "code",
              align: "center",
              width: 120,
            },
            {
              title: "Tên học phần",
              dataIndex: "name",
            },
            {
              title: "Số TC",
              dataIndex: "credit",
              align: "center",
              width: 60,
            },
            {
              title: "Bắt buộc",
              align: "center",
              width: 80,
              render: (_, record) => (
                <Checkbox
                  checked={
                    record?.type === $Enums.SubjectRequirementType.Mandatory
                  }
                  disabled
                />
              ),
            },
            {
              title: "Giảng viên",
              render: (_, record) =>
                [
                  record.mainLecturer?.userProfile?.fullname,
                  record.extraLecturer?.userProfile?.fullname,
                ]
                  .filter(Boolean)
                  .join(", "),
            },
            {
              title: "Phòng học",
              align: "center",
              width: 150,
              render: (_, record) => record?.room?.name,
            },
            {
              title: "Số lượng",
              align: "center",
              width: 80,
              render: (_, record) =>
                `${record?._count?.subjectClassStudent || 0}/${record?.maxStudent}`,
            },
            {
              title: "Thời khoá biểu",
              width: 150,
              align: "center",
              render: (_, record) => {
                return record?.subjectClassTimes?.map?.((tkb) => {
                  return (
                    <p>
                      {tkb?.dayOfWeek === 8 ? "CN" : `T${tkb?.dayOfWeek}`} -{" "}
                      {tkb?.startPeriod} - {tkb?.endPeriod}
                    </p>
                  );
                });
              },
            },
            {
              title: "Học phí",
              align: "center",
              width: 120,
              render: (_, record) =>
                tuitionPerCredit
                  ? `${((record?.credit || 0) * tuitionPerCredit).formatVND()}`
                  : "-",
            },
            {
              title: "Thao tác",
              align: "center",
              width: 120,
              fixed: "right",
              render: (_, record) => {
                const isMaxed =
                  (record?.maxStudent || 0) <=
                  (record?._count?.subjectClassStudent || 0);
                const isRegisteredBool =
                  (record?.classRegisterLogs?.length || 0) > 0;
                const totalRegisteredCredit =
                  registeredClasses?.reduce(
                    (
                      acc: number,
                      curr: GetClassesInfo200ItemSubjectClassItem,
                    ) => acc + (curr?.credit || 0),
                    0,
                  ) ?? 0;

                const isOverMaxCredit =
                  studentData?.maxCredit != null &&
                  totalRegisteredCredit + (record?.credit ?? 0) >
                    studentData?.maxCredit;
                const parentSubjectCode = classToSubjectCodeMap.get(
                  record?.id ?? "",
                );
                const siblingAlreadyRegistered =
                  !isRegisteredBool &&
                  !!parentSubjectCode &&
                  registeredSubjectCodes.has(parentSubjectCode);
                const isDisabled =
                  isMaxed ||
                  isRegisteredBool ||
                  isPendingClassRegister ||
                  isOverMaxCredit ||
                  siblingAlreadyRegistered;

                return (
                  <Popconfirm
                    title={`Xác nhận đăng ký học phần ?`}
                    okText="Đăng ký"
                    cancelText="Đóng"
                    disabled={isDisabled}
                    onConfirm={() => handleClassRegister([record?.id])}
                  >
                    <Button
                      disabled={isDisabled}
                      type="text"
                      className={cn(
                        "text-primary flex justify-center items-center gap-2 cursor-pointer",
                        isDisabled ? "opacity-50 cursor-not-allowed" : "",
                      )}
                    >
                      <LogOutIcon />
                      Đăng ký
                    </Button>
                  </Popconfirm>
                );
              },
            },
          ]}
          onRow={(record) => {
            const r =
              record as unknown as GetClassesInfo200ItemSubjectClassItem;
            return {
              className:
                (r?.classRegisterLogs?.length || 0) > 0
                  ? "bg-green-200 [&>td]:!bg-green-200 [&>td]:hover:!bg-green-200"
                  : "",
            };
          }}
          headerTitleKey={(record) =>
            [record?.code, record?.name].filter(Boolean).join(" - ")
          }
          childrenFieldName={"subjectClass"}
          data={classesInfo?.data?.filter(
            (cls) => cls?.subjectClass?.length > 0,
          )}
        />
      )}
    </div>
  );
};

DangKyHocPage.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <DefaultLayout breadcrumbList={[{ title: "Đăng ký học" }]}>
      {page}
    </DefaultLayout>
  );
};
