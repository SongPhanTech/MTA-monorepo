// biome-ignore assist/source/organizeImports: biomes auto organize imports
import useSpinner from "@hooks/spinner";
import type { ExpertProfile, SubjectClass } from "@workspace/db/client";
import {
  useCreateCouncil,
  useFindManyCouncil,
  useFindManyDefenseSession,
  useFindManyExpertProfile,
  useFindManyRoom,
  useFindUniqueThesisSession,
  useUpdateManyThesisProject,
} from "@workspace/db/hooks";
import {
  Badge,
  Button,
  Col,
  Empty,
  Form,
  message,
  Select,
  Tag,
  Typography,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/vi";
import DatePicker from "@components/commons/date-picker";
import Table from "@components/commons/table";
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants";
import type { FilterProps } from "@constants/type";
import DefaultLayout from "@layouts/default-layout";
import { ROUTER_PATH } from "@workspace/router";
import { debounce } from "lodash";
import { useRouter } from "next/router";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeftOutlined,
  InboxOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

export type PutSettingClass = SubjectClass & {
  roomIds?: string[];
  defenseSessionIds?: string[];
  defenseDate?: Date[];
};
dayjs.locale("vi");

export default function SettingCouncil() {
  const router = useRouter();
  const thesisSessionId = router.query.id as string;
  const { showSpinner, hideSpinner } = useSpinner();
  const [searchRoom, setSearchRoom] = useState("");
  const { mutateAsync: createCouncil } = useCreateCouncil();
  const { mutateAsync: updateProjects } = useUpdateManyThesisProject();
  const { data: councils, isLoading: isLoadingCouncils } = useFindManyCouncil({
    where: {
      thesis: {
        some: { thesisSessionId: thesisSessionId },
      },
    },
    include: {
      members: {
        include: { expert: true },
      },
      thesis: {
        include: {
          room: true,
          defenseSession: true,
          registrations: {
            include: { student: { include: { userProfile: true } } },
          },
        },
      },
    },
  });
  const [form] = Form.useForm<PutSettingClass>();
  const [selectedLeftKeys, setSelectedLeftKeys] = useState<React.Key[]>([]);
  const [selectedRightKeys, setSelectedRightKeys] = useState<React.Key[]>([]);
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [selectedDefenseSessionIds, setSelectedDefenseSessionIds] = useState<
    string[]
  >([]);
  const [selectedDefenseDate, setSelectedDefenseDate] = useState<string[]>([]);
  const [leftData, setLeftData] = useState<ExpertProfile[]>([]);
  const [rightData, setRightData] = useState<ExpertProfile[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterProps>({
    code: undefined,
    name: undefined,
    academicRank: undefined,
    academicDegree: undefined,
    specialization: undefined,
    workplace: undefined,
    phone: undefined,
    email: undefined,
  });
  const where = useMemo(
    () => ({
      thesisExpert: true,
      ...(filters.code
        ? { code: { contains: filters.code, mode: "insensitive" as const } }
        : {}),
      ...(filters.name
        ? { name: { contains: filters.name, mode: "insensitive" as const } }
        : {}),
      ...(filters.academicRank
        ? {
            academicRank: {
              contains: filters.academicRank,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(filters.academicDegree
        ? {
            academicDegree: {
              contains: filters.academicDegree,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(filters.specialization
        ? {
            specialization: {
              contains: filters.specialization,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(filters.workplace
        ? {
            workplace: {
              contains: filters.workplace,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(filters.phone
        ? { phone: { contains: filters.phone, mode: "insensitive" as const } }
        : {}),
      ...(filters.email
        ? { email: { contains: filters.email, mode: "insensitive" as const } }
        : {}),
    }),
    [
      filters.code,
      filters.name,
      filters.academicRank,
      filters.academicDegree,
      filters.specialization,
      filters.workplace,
      filters.phone,
      filters.email,
    ]
  );
  const { data: thesisSession } = useFindUniqueThesisSession({
    where: { id: thesisSessionId },
    include: {
      thesisProject: {
        include: {
          council: {
            include: { members: { include: { expert: true } } },
          },
        },
      },
    },
  });

  const { data: room = [], refetch } = useFindManyRoom({
    where: {
      active: true,
      ...(searchRoom
        ? { name: { contains: searchRoom, mode: "insensitive" } }
        : {}),
    },
  });

  const { data: defenseSession } = useFindManyDefenseSession({});

  const { data: expertProfileData } = useFindManyExpertProfile(
    {
      where,
      include: { lecturer: { include: { userProfile: true } } },
    },
    { refetchOnWindowFocus: false }
  );
  const experts = useMemo(() => {
    if (!thesisSession) return [];

    const allExperts = thesisSession.thesisProject?.flatMap(
      (thesis) =>
        thesis.council?.members.filter((m) => m.expert).map((m) => m.expert) ||
        []
    );

    const uniqueExperts = Array.from(
      new Map(allExperts.map((exp) => [exp.id, exp])).values()
    );

    return uniqueExperts;
  }, [thesisSession]);
  useEffect(() => {
    if (experts.length) {
      setRightData(experts);

      const filtered = (expertProfileData || []).filter(
        (item) => !experts.some((exp) => exp.id === item.id)
      );
      setLeftData(filtered);
    } else {
      setLeftData(expertProfileData || []);
    }
  }, [expertProfileData, experts]);
  const handleSearchRoom = (value: string) => {
    setSearchRoom(value);
    debouncedRefetch();
  };
  const handleCreateCouncil = async () => {
    try {
      const values = await form.validateFields();

      const { defenseSessionIds, defenseDate, roomIds } = values;
      const allProjects = [...(thesisSession?.thesisProject || [])];
      const availableExperts = [...rightData];
      const slotsPerCouncil =
        (defenseDate?.length || 0) * (defenseSessionIds?.length || 0);

      const requiredCouncilsCount = Math.ceil(
        allProjects.length / slotsPerCouncil
      );

      if ((roomIds?.length || 0) < requiredCouncilsCount) {
        message.error(
          `Bạn cần chọn ít nhất ${requiredCouncilsCount} phòng để đáp ứng ${allProjects.length} đề tài.`
        );
        return;
      }

      if (availableExperts.length < requiredCouncilsCount * 5) {
        message.error(
          `Cần ít nhất ${
            requiredCouncilsCount * 5
          } chuyên gia để lập ${requiredCouncilsCount} hội đồng.`
        );
        return;
      }

      const usedChairmanIds = new Set<string>();
      let projectOffset = 0;

      for (let i = 0; i < requiredCouncilsCount; i++) {
        const roomId = roomIds?.[i];
        const councilProjects = allProjects.slice(
          projectOffset,
          projectOffset + slotsPerCouncil
        );

        if (councilProjects.length === 0) break;

        const councilSupervisorIds = new Set(
          councilProjects.map((p) => p.supervisorId)
        );
        const validExperts = availableExperts.filter(
          (exp) => !councilSupervisorIds.has(exp.id)
        );

        const chairman = validExperts.find(
          (exp) => exp.eligiblePresident && !usedChairmanIds.has(exp.id)
        );

        if (!chairman)
          throw new Error(
            `Không tìm thấy chủ tịch phù hợp cho hội đồng tại phòng ${roomId}.`
          );
        usedChairmanIds.add(chairman.id);

        const others = validExperts.filter((e) => e.id !== chairman.id);
        const secretary = others.find((e) => e.eligibleSecretary);
        const remaining = others.filter((e) => e.id !== secretary?.id);

        if (!secretary || remaining.length < 3) {
          throw new Error(
            `Không đủ nhân sự để cấu hình hội đồng tại phòng ${roomId}.`
          );
        }

        const newCouncil = await createCouncil({
          data: {
            status: "PENDING",
            description: `Hội đồng ${i + 1}`,
            members: {
              create: [
                { expertId: chairman.id, role: "CHAIRMAN" },
                { expertId: secretary.id, role: "SECRETARY" },
                { expertId: remaining[0].id, role: "REVIEWER_1" },
                { expertId: remaining[1].id, role: "REVIEWER_2" },
                { expertId: remaining[2].id, role: "MEMBER" },
              ],
            },
          },
        });

        let slotIdx = 0;
        for (const date of defenseDate || []) {
          for (const sessionId of defenseSessionIds || []) {
            if (slotIdx >= councilProjects.length) break;

            const project = councilProjects[slotIdx];
            await updateProjects({
              where: { id: project.id },
              data: {
                councilId: newCouncil?.id,
                roomId: roomId,
                defenseSessionId: sessionId,
                defenseDate: dayjs(date, "DD/MM/YYYY").toDate(),
              },
            });
            slotIdx++;
          }
        }

        projectOffset += slotsPerCouncil;
      }

      message.success(
        `Đã tạo ${requiredCouncilsCount} hội đồng và phân bổ thành công ${allProjects.length} đề tài.`
      );
    } catch {
      message.error("Lỗi hệ thống khi tạo hội đồng");
    } finally {
    }
  };
  const minRoomsRequired =
    selectedDefenseSessionIds.length * selectedDefenseDate.length > 0
      ? Math.ceil(
          (thesisSession?.thesisProject?.length || 0) /
            (selectedDefenseSessionIds.length * selectedDefenseDate.length)
        )
      : 0;
  const moveRight = () => {
    const selectedItems = leftData.filter((item) =>
      selectedLeftKeys.includes(item.id)
    );
    setRightData([...rightData, ...selectedItems]);
    setLeftData(leftData.filter((item) => !selectedLeftKeys.includes(item.id)));
    setSelectedLeftKeys([]);
  };

  const moveLeft = () => {
    const selectedItems = rightData.filter((item) =>
      selectedRightKeys.includes(item.id)
    );
    setLeftData([...leftData, ...selectedItems]);
    setRightData(
      rightData.filter((item) => !selectedRightKeys.includes(item.id))
    );
    setSelectedRightKeys([]);
  };
  const debouncedRefetch = useCallback(
    debounce(() => {
      refetch();
    }, 500),
    []
  );
  const CouncilListTable = () => {
    const expandedRowRender = (council: any) => {
      const projectColumns = [
        {
          title: "Ngày bảo vệ",
          dataIndex: "defenseDate",
          render: (date: Date) =>
            date ? dayjs(date).format("DD/MM/YYYY") : "Chưa xếp",
        },
        {
          title: "Ca",
          dataIndex: ["defenseSession", "startTime"],
          render: (time: Date) =>
            time ? dayjs(time).format("HH:mm") : "Chưa xếp",
        },
        {
          title: "Sinh viên",
          render: (_: any, record: any) => {
            const reg = record.registrations?.[0];
            return (
              <div>
                <div className="font-medium">
                  {reg?.student?.userProfile?.fullname || "N/A"}
                </div>
                <div className="text-xs text-gray-500">
                  {reg?.student?.code || "N/A"}
                </div>
              </div>
            );
          },
        },
        {
          title: "Tên đề tài",
          dataIndex: "title",
          ellipsis: true,
        },
      ];

      return (
        <Table
          columns={projectColumns}
          dataSource={council.thesis}
          pagination={false}
          rowKey="id"
          size="small"
          bordered
        />
      );
    };

    const mainColumns = [
      {
        title: "Phòng bảo vệ",
        render: (_: any, record: any) =>
          record.thesis?.[0]?.room?.name || "Chưa gán",
      },
      {
        title: "Thành viên hội đồng",
        dataIndex: "members",
        render: (members: any[]) => (
          <div className="space-y-1">
            {members.map((m) => (
              <div key={m.id} className="text-sm">
                <Badge status="processing" className="mr-2" />
                <span className="font-semibold">
                  {getRoleText(m.role)}:
                </span>{" "}
                {m.expert?.name}
              </div>
            ))}
          </div>
        ),
      },
      {
        title: "Số đề tài",
        render: (_: any, record: any) => (
          <Tag color="cyan" className="text-base px-3">
            {record.thesis?.length || 0} đề tài
          </Tag>
        ),
        align: "center" as const,
      },
    ];

    return (
      <div className="mt-10 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <Typography.Title level={4} className="mb-4">
          <span className="border-l-4 border-primary pl-3">
            Thông tin các hội đồng đã thiết lập
          </span>
        </Typography.Title>
        <Table
          rowKey="id"
          columns={mainColumns}
          dataSource={councils}
          loading={isLoadingCouncils}
          expandable={{
            expandedRowRender,
            expandRowByClick: true,
            columnTitle: "Chi tiết",
            columnWidth: 70,
          }}
          pagination={false}
        />
      </div>
    );
  };
  const getRoleText = (role: string) => {
    const roles: Record<string, string> = {
      CHAIRMAN: "Chủ tịch",
      SECRETARY: "Thư ký",
      REVIEWER_1: "Phản biện 1",
      REVIEWER_2: "Phản biện 2",
      MEMBER: "Ủy viên",
    };
    return roles[role] || role;
  };
  if (thesisSession?.thesisProject?.length) {
    return (
      <Col span={24} className="p-2">
        <Form form={form} layout="horizontal" className="w-full mb-6">
          <div className="flex items-start gap-x-4">
            <Form.Item
              name="defenseSessionIds"
              label={<span className="font-semibold">Ca bảo vệ</span>}
              className="mb-0 flex-1"
            >
              <Select
                mode="multiple"
                placeholder="Chọn ca bảo vệ"
                options={defenseSession?.map((item) => ({
                  label: item.startTime
                    ? dayjs(item.startTime).format("HH:mm")
                    : "",
                  value: item.id,
                }))}
                showSearch
                maxTagCount="responsive"
                allowClear
                className="w-full"
                onChange={(values: string[]) =>
                  setSelectedDefenseSessionIds(values)
                }
              />
            </Form.Item>

            <Form.Item
              name="defenseDate"
              label={<span className="font-semibold">Thời gian bảo vệ</span>}
              className="mb-0 flex-1"
            >
              <DatePicker
                multiple
                format="DD/MM/YYYY"
                placeholder="Chọn các ngày"
                className="w-full"
                maxTagCount="responsive"
                onChange={(_date: Dayjs, dateString: string[] | string) => {
                  setSelectedDefenseDate(dateString as string[]);
                }}
              />
            </Form.Item>

            <Form.Item
              name="roomIds"
              label={<span className="font-semibold">Phòng bảo vệ</span>}
              className="mb-0 flex-1"
              dependencies={["defenseSessionIds", "defenseDate"]}
              rules={[
                {
                  validator: async (_, values) => {
                    const selectedRoomCount = values?.length || 0;
                    if (
                      selectedDefenseSessionIds.length === 0 ||
                      selectedDefenseDate.length === 0
                    ) {
                      return Promise.resolve();
                    }
                    if (selectedRoomCount < minRoomsRequired) {
                      return Promise.reject(
                        new Error(`Cần ít nhất ${minRoomsRequired} phòng.`)
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Select
                mode="multiple"
                placeholder="Chọn phòng"
                options={room.map((item) => ({
                  label: item.name,
                  value: item.id,
                }))}
                showSearch
                maxTagCount="responsive"
                onSearch={handleSearchRoom}
                filterOption={false}
                allowClear
                className="w-full"
                onChange={(values: string[]) => setSelectedRoomIds(values)}
              />
            </Form.Item>

            <Form.Item className="mb-0 flex-none">
              <Button
                onClick={() => handleCreateCouncil()}
                type="primary"
                className="h-[32px]"
              >
                Tạo hội đồng bảo vệ
              </Button>
            </Form.Item>
          </div>
        </Form>
        <Col span={24} className="flex flex-row  gap-2">
          <Col span={12}>
            <div
              style={{
                fontWeight: "bold",
              }}
            >
              Danh sách chuyên gia
            </div>

            <Table
              rowKey="id"
              id="expert-profile"
              filters={filters}
              setFilters={(value) => {
                setFilters(value);
                setCurrentPage(1);
              }}
              rowSelection={{
                selectedRowKeys: selectedLeftKeys,
                onChange: setSelectedLeftKeys,
              }}
              columns={[
                {
                  title: "STT",
                  width: 60,
                  align: "center",
                  fixed: "left",
                  render: (_, __, index: number) =>
                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                },
                {
                  title: "Tên chuyên gia",
                  dataIndex: "name",
                  width: 150,
                  type: "input",
                  align: "center",
                },
                {
                  title: "Học hàm",
                  dataIndex: "academicRank",
                  width: 150,
                  align: "center",
                  type: "input",
                },
                {
                  title: "Hàm vị",
                  dataIndex: "academicDegree",
                  width: 150,
                  align: "center",
                  type: "input",
                },
                {
                  title: "Chuyên ngành",
                  dataIndex: "specialization",
                  width: 150,
                  align: "center",
                  type: "input",
                },
                {
                  title: "Đơn vị công tác",
                  dataIndex: "workplace",
                  width: 150,
                  align: "center",
                  type: "input",
                },
                {
                  title: "Số điện thoại",
                  dataIndex: "phone",
                  width: 150,
                  align: "center",
                  type: "input",
                },
                {
                  title: "Email",
                  dataIndex: "email",
                  width: 150,
                  align: "center",
                  type: "input",
                },
              ]}
              data={leftData}
            />
          </Col>
          <Col
            span={1}
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <Button onClick={moveRight} disabled={!selectedLeftKeys.length}>
              →
            </Button>
            <Button onClick={moveLeft} disabled={!selectedRightKeys.length}>
              ←
            </Button>
          </Col>
          <Col span={11}>
            <div
              style={{
                fontWeight: "bold",
              }}
            >
              Danh sách chuyên gia hội đồng{" "}
              {selectedDefenseSessionIds.length
                ? `(Cần ít nhất ${
                    Math.ceil(
                      (thesisSession?.thesisProject?.length || 0) /
                        (selectedDefenseSessionIds.length *
                          selectedDefenseDate.length)
                    ) * 5
                  } chuyên gia)`
                : ""}
            </div>
            <Table
              rowKey="id"
              id="expert-profile"
              rowSelection={{
                selectedRowKeys: selectedRightKeys,
                onChange: setSelectedRightKeys,
              }}
              columns={[
                {
                  title: "STT",
                  width: 60,
                  align: "center",
                  fixed: "left",
                  render: (_, __, index: number) =>
                    index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
                },
                {
                  title: "Tên chuyên gia",
                  dataIndex: "name",
                  width: 150,
                  align: "center",
                },
                {
                  title: "Học hàm",
                  dataIndex: "academicRank",
                  width: 150,
                  align: "center",
                },
                {
                  title: "Hàm vị",
                  dataIndex: "academicDegree",
                  width: 150,
                  align: "center",
                },
                {
                  title: "Chuyên ngành",
                  dataIndex: "specialization",
                  width: 150,
                  align: "center",
                },
                {
                  title: "Đơn vị công tác",
                  dataIndex: "workplace",
                  width: 150,
                  align: "center",
                },
                {
                  title: "Số điện thoại",
                  dataIndex: "phone",
                  width: 150,
                  align: "center",
                },
                {
                  title: "Email",
                  dataIndex: "email",
                  width: 150,
                  align: "center",
                },
              ]}
              data={rightData}
            />
          </Col>
        </Col>
        <Col span={24}>
          <CouncilListTable />
        </Col>
      </Col>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-white p-4">
      <div className="max-w-lg w-full text-center animate-fade-in-up">
        <Empty
          image={
            <div className="flex justify-center">
              <div className="relative">
                <InboxOutlined className="relative text-8xl text-primary" />
              </div>
            </div>
          }
          description={
            <div className="mt-2">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Chưa có đề tài nào
              </h1>
              <p className="text-base text-gray-500 max-w-sm mx-auto leading-relaxed">
                Hệ thống hiện chưa ghi nhận đề tài luận văn hoặc đề án nào trong
                đợt xét này
              </p>
            </div>
          }
        >
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="large"
              icon={<ArrowLeftOutlined />}
              className="flex items-center justify-center px-8  h-12 rounded-full"
            >
              Quay lại bảng điều khiển
            </Button>

            <Button
              type="primary"
              size="large"
              icon={<ReloadOutlined />}
              onClick={() => window.location.reload()}
              className="flex items-center justify-center px-8 h-12 rounded-full "
            >
              Làm mới dữ liệu
            </Button>
          </div>
        </Empty>
      </div>
    </div>
  );
}

SettingCouncil.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <DefaultLayout
      breadcrumbList={[
        { title: "Quản lý luận văn" },
        {
          title: "Danh mục luận văn",
          href: ROUTER_PATH.QL_DAO_TAO.QUAN_LY_LUAN_VAN_DANH_MUC_LUAN_VAN,
        },
        { title: "Cấu hình hội đồng" },
      ]}
    >
      {page}
    </DefaultLayout>
  );
};
