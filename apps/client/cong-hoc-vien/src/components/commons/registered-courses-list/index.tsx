import ThoiKhoaBieuDangKy from "@components/commons/registration-schedule"
import registrationScheduleHelper from "@components/commons/registration-schedule/helper"
import Select from "@components/commons/select"
import TableCollapse from "@components/commons/tableCollapse"
import { cn } from "@lib/utils"
import { useMutation } from "@tanstack/react-query"
import { $Enums } from "@workspace/db"
import { customPortalFetch } from "@workspace/libs/api/custom-instance"
import { classRegister, useGetClassesInfo, useGetStudentInfo } from "@workspace/libs/api/portal"
import type { GetClassesInfo200ItemSubjectClassItem } from "@workspace/libs/api/schemas/getClassesInfo200ItemSubjectClassItem"
import type { GetClassRegisterSession200ItemCreditLimitItem } from "@workspace/libs/api/schemas/getClassRegisterSession200ItemCreditLimitItem"
import { Button, Checkbox, message, Popconfirm } from "antd"
import dayjs from "dayjs"
import { CircleAlertIcon, LogOutIcon } from "lucide-react"
import { useMemo, useState } from "react"
import clsx from "clsx"
import registeredCoursesListHelper from "./helper"
import { EquivalencySide } from "@workspace/db/client"

export interface ClassRegisterSessionProps {
  sessionId: string
  curriculumVersions: {
    id: string
    name: string
    code: string
  }[]
  endDate: string | null
  creditLimit: GetClassRegisterSession200ItemCreditLimitItem[]
  tuitionPerCredit?: number
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
]

/** Đăng ký bất đồng bộ: BE trả 202 + jobId, FE poll trạng thái mỗi 2s tới khi có kết quả */
const POLL_INTERVAL_MS = 2000
const POLL_MAX_TRIES = 30 // ~60 giây

type RegistrationJobResponse = {
  status: number
  data?: { status?: string; message?: string }
}

async function pollRegistrationResult(jobId: string): Promise<Awaited<ReturnType<typeof classRegister>>> {
  for (let attempt = 0; attempt < POLL_MAX_TRIES; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))

    let job: RegistrationJobResponse | null = null
    try {
      job = await customPortalFetch<RegistrationJobResponse>(
        `/api/class-register/registration-status/${jobId}`,
        { method: "GET" }
      )
    } catch {
      continue // lỗi mạng tạm thời -> poll tiếp
    }

    if (job?.status !== 200) continue
    const jobStatus = job.data?.status

    if (jobStatus === "success") {
      return { status: 200, data: { message: "success" } } as unknown as Awaited<
        ReturnType<typeof classRegister>
      >
    }
    if (jobStatus === "failed") {
      return { status: 400, data: { message: job.data?.message || "Đăng ký thất bại" } } as unknown as Awaited<
        ReturnType<typeof classRegister>
      >
    }
    // pending / processing -> tiếp tục chờ
  }

  return {
    status: 503,
    data: {
      message:
        "Yêu cầu đang được xử lý, vui lòng kiểm tra lại danh sách đã đăng ký sau ít phút.",
    },
  } as unknown as Awaited<ReturnType<typeof classRegister>>
}

const DanhSachMonDangKy = (props: ClassRegisterSessionProps) => {
  const { sessionId, curriculumVersions, endDate, creditLimit, tuitionPerCredit } = props
  const [curriculumVersionId, setCurriculumVersionId] = useState(
    curriculumVersions.length > 0 ? curriculumVersions[0].id : ""
  )
  const [byCurriculum, setByCurriculum] = useState(1)
  const { data: classStudentData } = useGetStudentInfo(
    {
      sessionId: sessionId,
    },
    {
      query: {
        refetchOnWindowFocus: false,
      },
    }
  )

  const studentData = useMemo(() => {
    if (classStudentData?.status !== 200) return null

    const data = classStudentData.data

    return {
      studentName: data?.userProfile?.fullname,
      studentCode: data?.student?.code,
      classification: data?.latestSemesterResult?.rank?.classification,
      maxCredit: data?.creditLimit?.maxCredit,
    }
  }, [classStudentData])

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
  ].filter((item) => item.value)

  const { data: classesInfo, refetch: refetchClassesInfo } = useGetClassesInfo(
    {
      sessionId,
      curriculumVersionId,
      byCurriculum: byCurriculum === 1 ? "true" : "false",
      isRegistered: "false",
    },
    {
      query: {
        refetchOnWindowFocus: false,
      },
    }
  )

  const registeredClasses =
    classesInfo?.status === 200
      ? classesInfo.data
          ?.flatMap((e) => e?.subjectClass)
          ?.filter((sc) => (sc?.classRegisterLogs?.length || 0) > 0)
      : []

  const { classToSubjectCodeMap, registeredSubjectCodes, classToParentMap } = useMemo(() => {
    const map = new Map<string, string>()
    const parentMap = new Map<string, any>()
    const set = new Set<string>()

    if (classesInfo?.status === 200) {
      classesInfo.data?.forEach((subject) => {
        const subjectCode = subject.code ?? ""

        const hasRegistered = subject.subjectClass?.some(
          (sc) => (sc?.classRegisterLogs?.length || 0) > 0
        )

        if (hasRegistered) set.add(subjectCode)

        subject.subjectClass?.forEach((sc) => {
          if (sc?.id) {
            map.set(sc.id, subjectCode)
            parentMap.set(sc.id, subject)
          }
        })
      })
    }

    return {
      classToSubjectCodeMap: map,
      registeredSubjectCodes: set,
      classToParentMap: parentMap,
    }
  }, [classesInfo])

  const { mutateAsync: classRegisterMutate, isPending: isPendingClassRegister } = useMutation({
    mutationFn: async (subjectClassIds: string[]) => {
      const res = await classRegister({
        sessionId,
        subjectClassIds,
        curriculumVersionId,
      })

      // 202: yêu cầu đã vào hàng đợi -> poll kết quả thật (isPending giữ nút disabled suốt lúc chờ)
      if (Number(res?.status) === 202) {
        const jobId = (res as { data?: { jobId?: string } }).data?.jobId
        if (jobId) {
          return await pollRegistrationResult(jobId)
        }
      }

      return res
    },
    onSuccess: (res, subjectClassIds) => {
      const status = Number(res?.status)
      if (status === 200) {
        refetchClassesInfo()
        message.success("Đăng ký thành công")

        const registeredIds = new Set(
          (registeredClasses ?? []).map((c) => c.id).filter((id): id is string => Boolean(id))
        )
        const newlyRegistered =
          classesInfo?.status === 200
            ? (classesInfo.data
                ?.flatMap((e) => e?.subjectClass ?? [])
                ?.filter((sc) => subjectClassIds.includes(sc?.id ?? "")) ?? [])
            : []

        const nextRegistered = [
          ...(registeredClasses ?? []),
          ...newlyRegistered.filter((sc) => sc?.id && !registeredIds.has(sc.id)),
        ]

        const conflicts = registrationScheduleHelper.getConflictSummaries(nextRegistered)
        if (conflicts.some((c) => subjectClassIds.includes(c.courseId))) {
          message.warning(
            "Lịch học bị trùng tiết với môn đã đăng ký. Vui lòng hủy đăng ký hoặc chọn lớp khác để thay đổi.",
            6
          )
        }
      } else if (status === 429 || status === 503) {
        const data = (res as { data?: { message?: string } }).data
        message.warning(
          data?.message || "Hệ thống đang quá tải. Vui lòng đợi vài giây rồi thử lại.",
          5
        )
      } else {
        const data = (res as { data?: { message?: string } }).data
        message.error(data?.message || "Đăng ký thất bại")
      }
    },
    onError: (error: any) => {
      message.error(error?.message || "Đăng ký thất bại")
    },
  })

  const handleClassRegister = (subjectClassIds: string[]) => {
    if (isPendingClassRegister) return
    classRegisterMutate(subjectClassIds)
  }

  return (
    <div>
      {endDate && (
        <div className="mb-4 flex gap-4 rounded-sm bg-red-50 p-3 border not-print items-center flex-row  border-red-200">
          <CircleAlertIcon className="mt-0.5 h-5 w-5 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-600">
              Hạn đăng ký học: {dayjs(endDate).format("DD/MM/YYYY")}
            </p>
            <p className="text-xs font-normal text-red-600/80">
              Vui lòng hoàn tất đăng ký học phần trước thời gian này để đảm bảo kế hoạch học tập!
            </p>
          </div>
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3 not-print">
        <div className="lg:col-span-2 rounded-sm border border-gray-300 bg-white">
          <div className="flex items-center justify-between bg-green-700 border-b border-gray-200 px-5 py-3">
            <h2 className="text-sm font-semibold text-white uppercase tracking-tight">
              Thông tin sinh viên
            </h2>
            <span className="rounded-sm border border-white bg-white px-2 py-0.5 text-[10px] font-semibold text-green-600 uppercase tracking-wider">
              Hệ chính quy
            </span>
          </div>

          <div
            className={clsx(
              "grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-10 px-5 py-3",
              classStudentData?.status !== 200 && "hidden"
            )}
          >
            {infoItems.map((item) => (
              <div key={item?.label} className="flex flex-col gap-0.5">
                <span className="text-[10px] font-normal uppercase tracking-wider text-gray-500">
                  {item.label}
                </span>
                <span className="text-xs font-normal text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-sm border border-gray-300 bg-white flex flex-col">
          <div className="mb-2.5 bg-green-700 border-b border-gray-200 pb-3 px-5 py-3">
            <h2 className="text-sm font-semibold text-white uppercase tracking-tight">
              Lưu ý đăng ký
            </h2>
          </div>

          <div className="flex items-center gap-2 rounded-sm mx-5 my-3 p-1.5 bg-green-50/50 border border-green-400">
            <p className="text-[11px] font-medium text-green-600">
              Môn học đã đăng ký sẽ được tô màu xanh lá
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-sm mx-5 mb-3 p-1.5 bg-red-50/50 border border-red-300">
            <p className="text-[11px] font-medium text-red-600">
              Học phần trùng tiết sẽ hiện màu đỏ kèm cảnh báo — vui lòng hủy hoặc chọn lớp khác
            </p>
          </div>

          <p className="text-[11px] px-5 py-3 leading-relaxed text-gray-400 ">
            Sinh viên cần kiểm tra kỹ số tín chỉ tối thiểu và tối đa được phép đăng ký trong học kỳ
            này. Mọi thắc mắc vui lòng liên hệ phòng đào tạo.
          </p>
        </div>
      </div>
      <div className="flex gap-2 flex-row justify-between not-print">
        <div className="flex gap-2 flex-row">
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
        <Button
          type="primary"
          onClick={() => {
            window.print()
          }}
        >
          In Danh sách môn đã đăng ký
        </Button>
      </div>

      <div className="flex gap-2 items-center border-gray-300 border border-b-0 px-2.5 py-2.5 justify-between not-print">
        <b className="text-sm uppercase ">Danh sách môn học đã đăng ký</b>
        {classesInfo?.status === 200 && (
          <p>
            Bạn đã đăng ký <b>{registeredClasses?.length || 0}</b> học phần,{" "}
            <b>
              {registeredClasses?.reduce(
                (acc: number, curr: GetClassesInfo200ItemSubjectClassItem) =>
                  acc + (curr?.credit || 0),
                0
              )}
            </b>{" "}
            tín chỉ, học phí{" "}
            {(
              (registeredClasses?.reduce(
                (acc: number, curr: GetClassesInfo200ItemSubjectClassItem) =>
                  acc + (curr?.credit || 0),
                0
              ) ?? 0) * (tuitionPerCredit || 0)
            ).formatVND()}
          </p>
        )}
      </div>
      {classesInfo?.status === 200 && (
        <ThoiKhoaBieuDangKy
          key={registeredClasses?.length}
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
          scroll={{ x: 1480, y: 400 }}
          className="!mt-0 !rounded-0 not-print register-open-courses-table"
          columns={[
            {
              title: "Mã học phần",
              dataIndex: "code",
              align: "center",
              width: 100,
              ellipsis: true,
            },
            {
              title: "Tên học phần",
              dataIndex: "name",
              width: 220,
              onCell: () => ({
                style: { minWidth: 180, whiteSpace: "normal", wordBreak: "normal" },
              }),
            },
            {
              title: "Số TC",
              dataIndex: "credit",
              align: "center",
              width: 64,
            },
            {
              title: "Bắt buộc",
              align: "center",
              width: 80,
              render: (_, record) => (
                <Checkbox
                  checked={record?.type === $Enums.SubjectRequirementType.Mandatory}
                  disabled
                />
              ),
            },
            {
              title: "Giảng viên",
              width: 180,
              onCell: () => ({
                style: { minWidth: 140, whiteSpace: "normal", wordBreak: "normal" },
              }),
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
              width: 110,
              ellipsis: true,
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
              width: 110,
              align: "center",
              render: (_, record) => {
                return record?.subjectClassTimes?.map?.((tkb) => {
                  return (
                    <p key={`${tkb?.dayOfWeek}-${tkb?.startPeriod}-${tkb?.endPeriod}`} className="mb-0 whitespace-nowrap">
                      {tkb?.dayOfWeek === 8 ? "CN" : `T${tkb?.dayOfWeek}`} - {tkb?.startPeriod} -{" "}
                      {tkb?.endPeriod}
                    </p>
                  )
                })
              },
            },
            {
              title: "Học phí",
              align: "center",
              width: 110,
              render: (_, record) =>
                tuitionPerCredit
                  ? `${((record?.credit || 0) * tuitionPerCredit).formatVND()}`
                  : "-",
            },
            {
              title: "Tiên quyết / Học trước",
              align: "center",
              width: 140,
              render: (_, record) => {
                const parent = record.$type === "child" ? classToParentMap.get(record.id) : record

                const prerequisites = parent?.prerequisiteSubject ?? []
                const corequisites = parent?.coRequisiteSubject ?? []

                if (!prerequisites.length && !corequisites.length) {
                  return <span className="text-gray-400 italic">Không có</span>
                }

                const renderList = (
                  title: string,
                  color: string,
                  subjects: { code: string; name: string }[]
                ) => (
                  <div>
                    <span className={cn("font-semibold", color)}>{title}:</span>
                    {subjects?.map?.((s) => (
                      <div key={s.code} className="ml-1 text-gray-700">
                        • {s.name}
                      </div>
                    ))}
                  </div>
                )

                return (
                  <div className="flex flex-col gap-1 text-[11px] text-left">
                    {prerequisites.length > 0 &&
                      renderList("Tiên quyết", "text-red-600", prerequisites)}

                    {corequisites.length > 0 && (
                      <div className={prerequisites.length ? "mt-1 border-t pt-1" : ""}>
                        {renderList("Học trước", "text-blue-600", corequisites)}
                      </div>
                    )}
                  </div>
                )
              },
            },
            {
              title: "Môn học tương đương",
              align: "center",
              width: 140,
              render: (_, record) => {
                const parent = record.$type === "child" ? classToParentMap.get(record.id) : record

                const equivalencies =
                  parent?.equivalencyGroups
                    ?.flatMap((eg: any) => {
                      const targetSide =
                        eg.side === EquivalencySide.SOURCE
                          ? EquivalencySide.TARGET
                          : EquivalencySide.SOURCE
                      return eg?.equivalencyGroup?.subjects
                        ?.filter((s: any) => s?.side === targetSide)
                        ?.map((s: any) => s?.subject)
                    })
                    ?.filter(Boolean) ?? []

                if (!equivalencies.length) {
                  return <span className="text-gray-400 italic">Không có</span>
                }

                return (
                  <div className="flex flex-col gap-1 text-[11px] text-left">
                    <div>
                      <span className="font-semibold text-purple-600">Môn tương đương:</span>
                      {equivalencies.map((s: { code: string; name: string }) => (
                        <div key={s?.code} className="ml-1 text-gray-700">
                          • {s?.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              },
            },
            {
              title: "Thao tác",
              align: "center",
              width: 110,
              fixed: "right",
              render: (_, record) => {
                const totalCredit =
                  registeredClasses?.reduce((acc, curr) => acc + (curr?.credit || 0), 0) ?? 0

                const { isDisabled } = registeredCoursesListHelper.getRegisterState({
                  record,
                  maxCredit: studentData?.maxCredit as number,
                  totalRegisteredCredit: totalCredit,
                  classToSubjectCodeMap,
                  registeredSubjectCodes,
                  isPending: isPendingClassRegister,
                })

                const handleConfirm = () => handleClassRegister([record?.id])

                const willConflict = registrationScheduleHelper.wouldConflictWithRegistered(
                  record as GetClassesInfo200ItemSubjectClassItem,
                  registeredClasses ?? []
                )

                return (
                  <Popconfirm
                    title={
                      willConflict
                        ? "Lớp này trùng tiết với môn đã đăng ký. Vẫn đăng ký?"
                        : "Xác nhận đăng ký học phần?"
                    }
                    description={
                      willConflict
                        ? "Sau khi đăng ký, vui lòng hủy một trong các lớp trùng lịch hoặc chọn lớp khác."
                        : undefined
                    }
                    okText="Đăng ký"
                    cancelText="Đóng"
                    okButtonProps={willConflict ? { danger: true } : undefined}
                    disabled={isDisabled}
                    onConfirm={handleConfirm}
                  >
                    <Button
                      disabled={isDisabled}
                      type="text"
                      className={cn(
                        "flex items-center justify-center gap-2 text-primary",
                        isDisabled && "cursor-not-allowed opacity-50"
                      )}
                    >
                      <LogOutIcon />
                      Đăng ký
                    </Button>
                  </Popconfirm>
                )
              },
            },
          ]}
          onRow={(record) => {
            const r = record as unknown as GetClassesInfo200ItemSubjectClassItem
            return {
              className:
                (r?.classRegisterLogs?.length || 0) > 0
                  ? "bg-green-200 [&>td]:!bg-green-200 [&>td]:hover:!bg-green-200"
                  : "",
            }
          }}
          headerTitleKey={(record) => [record?.code, record?.name].filter(Boolean).join(" - ")}
          childrenFieldName={"subjectClass"}
          data={classesInfo?.data?.filter((cls) => cls?.subjectClass?.length > 0)}
        />
      )}
    </div>
  )
}

export default DanhSachMonDangKy
