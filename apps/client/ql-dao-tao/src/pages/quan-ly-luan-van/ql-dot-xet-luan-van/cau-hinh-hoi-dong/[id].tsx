import FormItem from "@components/commons/form-item";
import useSpinner from "@hooks/spinner";
import {
  CouncilProposalStatus,
  CouncilRole,
  type ExpertProfile,
  type SubjectClass,
} from "@workspace/db/client";
import {
  useCreateManyCouncil,
  useFindManyDefenseSession,
  useFindManyExpertProfile,
  useFindManyRoom,
  useFindUniqueSubjectClass,
  useFindUniqueThesisProject,
  useFindUniqueThesisSession,
  useUpdateThesisProject,
} from "@workspace/db/hooks";
import { Button, Col, Form, message, Row, Select } from "antd";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/vi";
import DatePicker from "@components/commons/date-picker";
import Table from "@components/commons/table";
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants";
import type { FilterProps } from "@constants/type";
import DefaultLayout from "@layouts/default-layout";
import { ROUTER_PATH } from "@workspace/router";
import { debounce } from "lodash";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useMemo, useState } from "react";

export type PutSettingClass = SubjectClass & {
  roomIds?: string[];
  defenseSessionIds?: string[];
  defenseDate?: Date;
};
dayjs.locale("vi");

export default function SettingCouncil() {
  const router = useRouter();
  const thesisSessionId = router.query.id as string;
  const { showSpinner, hideSpinner } = useSpinner();
  const [searchRoom, setSearchRoom] = useState("");
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
  const handleCreateCouncil = () => {
    console.log("create council");
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
  if (thesisSession) {
    return (
      <Col span={24} className="p-2">
        <Form form={form} layout="horizontal" className="w-full mb-6">
          <div className="flex items-end gap-x-4">
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
                onSearch={handleSearchRoom}
                filterOption={false}
                allowClear
                className="w-full"
                onChange={(values: string[]) => setSelectedRoomIds(values)}
              />
            </Form.Item>

            <div className="flex-none">
              <Button
                onClick={() => handleCreateCouncil()}
                type="primary"
                className="h-[32px]"
              >
                Tạo hội đồng bảo vệ
              </Button>
            </div>
          </div>
        </Form>
        <Col span={24} className="flex flex-row h-[200px] gap-2">
          <Col span={11}>
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
            span={2}
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
                        selectedDefenseSessionIds.length
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
      </Col>
    );
  }

  return (
    <div className="text-center text-lg">
      Hiện chưa có đề tài nào trong lớp đồ án
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
