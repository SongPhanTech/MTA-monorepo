import ThoiKhoaBieuDangKy from "@components/commons/registration-schedule";
import Select from "@components/commons/select";
import TableCollapse from "@components/commons/tableCollapse";
import { cn } from "@lib/utils";
import { useMutation } from "@tanstack/react-query";
import { $Enums } from "@workspace/db";
import {
  classRegister,
  useGetClassesInfo,
  useGetStudentInfo,
} from "@workspace/libs/api/portal";
import type { GetClassesInfo200ItemSubjectClassItem } from "@workspace/libs/api/schemas/getClassesInfo200ItemSubjectClassItem";
import type { GetClassRegisterSession200ItemCreditLimitItem } from "@workspace/libs/api/schemas/getClassRegisterSession200ItemCreditLimitItem";
import { Button, Checkbox, message, Popconfirm } from "antd";
import dayjs from "dayjs";
import {
  CircleAlertIcon,
  InfoIcon,
  LogOutIcon,
  UserIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import clsx from "clsx";
import registeredCoursesListHelper from "./helper";

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

const BY_CURRICULUM_OPTIONS = [
  {
    label: "Môn học trong chương trình đào tạo",
    value: 1,
  },
  {
    label: "Môn học toàn khoá",
    value: 0,
  },
];

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

  const { classToSubjectCodeMap, registeredSubjectCodes } = useMemo(() => {
    const map = new Map<string, string>();
    const set = new Set<string>();

    if (classesInfo?.status === 200) {
      classesInfo.data?.forEach((subject) => {
        const subjectCode = subject.code ?? "";

        const hasRegistered = subject.subjectClass?.some(
          (sc) => (sc?.classRegisterLogs?.length || 0) > 0,
        );

        if (hasRegistered) set.add(subjectCode);

        subject.subjectClass?.forEach((sc) => {
          if (sc?.id) map.set(sc.id, subjectCode);
        });
      });
    }

    return { classToSubjectCodeMap: map, registeredSubjectCodes: set };
  }, [classesInfo]);

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
        <div className="mb-4 flex gap-4 rounded-sm bg-red-50 p-3 border items-center flex-row  border-red-200">
          <CircleAlertIcon className="mt-0.5 h-5 w-5 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-600">
              Hạn đăng ký học: {dayjs(endDate).format("DD/MM/YYYY")}
            </p>
            <p className="text-xs font-normal text-red-600/80">
              Vui lòng hoàn tất đăng ký học phần trước thời gian này để đảm bảo
              kế hoạch học tập!
            </p>
          </div>
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-sm border border-gray-300 bg-white">
          <div className="flex items-center justify-between bg-gray-100 border-b border-gray-200 px-5 py-3">
            <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-tight">
              Thông tin sinh viên
            </h2>
            <span className="rounded-sm border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600 uppercase tracking-wider">
              Hệ chính quy
            </span>
          </div>

          <div
            className={clsx(
              "grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-10 px-5 py-3",
              classStudentData?.status !== 200 && "hidden",
            )}
          >
            {infoItems.map((item) => (
              <div key={item?.label} className="flex flex-col gap-0.5">
                <span className="text-[10px] font-normal uppercase tracking-wider text-gray-500">
                  {item.label}
                </span>
                <span className="text-xs font-normal text-gray-900">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-sm border border-gray-300 bg-white flex flex-col">
          <div className="mb-2.5 bg-gray-100 border-b border-gray-200 pb-3 px-5 py-3">
            <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-tight">
              Lưu ý đăng ký
            </h2>
          </div>

          <div className="flex items-center gap-2 rounded-sm mx-5 my-3 p-1.5 bg-green-50/50 border border-green-400">
            <p className="text-[11px] font-medium text-green-600">
              Môn học đã đăng ký sẽ được tô màu xanh lá
            </p>
          </div>

          <p className="text-[11px] px-5 py-3 leading-relaxed text-gray-400 ">
            Sinh viên cần kiểm tra kỹ số tín chỉ tối thiểu và tối đa được phép
            đăng ký trong học kỳ này. Mọi thắc mắc vui lòng liên hệ phòng đào
            tạo.
          </p>
        </div>
      </div>
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
          options={BY_CURRICULUM_OPTIONS}
          placeholder="Chọn loại môn học"
          style={{ width: 300, marginBottom: 16 }}
          value={byCurriculum}
          allowClear={false}
          onChange={setByCurriculum}
        />
      </div>

      <div className="flex gap-2 items-center border-gray-300 border border-b-0 px-2.5 py-2.5 justify-between">
        <b className="text-sm uppercase ">Danh sách môn học đã đăng ký</b>
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

      {classesInfo?.status === 200 && (
        <TableCollapse
          header={<b className="text-sm uppercase">Danh sách môn học mở đăng ký</b>}
          defaultExpandAll
          scroll={{ y: 400 }}
          className="!mt-0 !rounded-0"
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
              title: "Môn học tiên quyết",
              align: "center",
              width: 150,
              render: (_, record) => {
                if (!record?.prerequisiteSubject?.length) {
                  return <div>Không có</div>;
                }
                const prerequisiteSubjects = record?.prerequisiteSubject?.map(
                  (subject) => {
                    return <p>{subject?.name}</p>;
                  },
                );
                return prerequisiteSubjects;
              },
            },
            {
              title: "Thao tác",
              align: "center",
              width: 120,
              fixed: "right",
              render: (_, record) => {
                const totalRegisteredCredit =
                  registeredClasses?.reduce(
                    (
                      acc: number,
                      curr: GetClassesInfo200ItemSubjectClassItem,
                    ) => acc + (curr?.credit || 0),
                    0,
                  ) ?? 0;

                const { isDisabled } =
                  registeredCoursesListHelper.getRegisterState({
                    record,
                    maxCredit: studentData?.maxCredit as number,
                    totalRegisteredCredit,
                    classToSubjectCodeMap,
                    registeredSubjectCodes,
                    isPending: isPendingClassRegister,
                  });

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

export default DanhSachMonDangKy;
