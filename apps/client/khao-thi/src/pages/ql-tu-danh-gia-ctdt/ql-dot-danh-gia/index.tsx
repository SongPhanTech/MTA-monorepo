import { EyeOutlined } from "@ant-design/icons";
import Table from "@components/commons/table";
import type { FilterProps } from "@components/commons/typeFilter";
import DeleteIcon from "@components/icons/delete";
import EditIcon from "@components/icons/edit";
import UserPlusIcon from "@components/icons/phan-cong-giang-vien";
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants";
import useSpinner from "@hooks/spinner";
import DefaultLayout from "@layouts/default-layout";
import {
  useCountEvaluationPeriod,
  useFindManyEvaluationPeriod,
  useUpdateEvaluationPeriod,
} from "@workspace/db/hooks";
import { useAbility } from "@workspace/permissions/hooks";
import { KHAO_THI_PERMISSION, ROUTER_PATH } from "@workspace/router";
import { Button, Col, Flex, message, Row, Tooltip } from "antd";
import dayjs from "dayjs";
import { BookPlus } from "lucide-react";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { useDisclosure } from "react-hook-disclosure-modal";

export default function EvaluationPeriod() {
  const { can, canSome } = useAbility();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE);
  const [filters, setFilters] = useState<FilterProps>({
    name: "",
    startDate: undefined,
    endDate: undefined,
  });

  const where = useMemo(
    () => ({
      ...(filters.name && filters.name !== ""
        ? {
            name: {
              contains: filters.name,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(filters.startDate?.length === 2
        ? {
            startDate: {
              gte: dayjs(filters.startDate?.[0], "DD/MM/YYYY").toDate(),
              lte: dayjs(filters.startDate?.[1], "DD/MM/YYYY").toDate(),
            },
          }
        : {}),
      ...(filters.endDate?.length === 2
        ? {
            endDate: {
              gte: dayjs(filters.endDate?.[0], "DD/MM/YYYY").toDate(),
              lte: dayjs(filters.endDate?.[1], "DD/MM/YYYY").toDate(),
            },
          }
        : {}),
    }),
    [filters.name, filters.startDate, filters.endDate]
  );

  const { data, refetch } = useFindManyEvaluationPeriod({
    where,
    include: {
      councils: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  });

  const { data: count, refetch: refetchCount } = useCountEvaluationPeriod({
    where: {
      ...where,
      deletedAt: null,
    },
  });

  const { onOpen: onOpenPutEvaluationPeriod } = useDisclosure<string>({
    tag: "PutEvaluationPeriod",
    onClose() {
      refetch();
      refetchCount();
    },
  });

  const { showSpinner, hideSpinner } = useSpinner();

  const { mutateAsync: updateEvaluationPeriod } = useUpdateEvaluationPeriod();
  async function handleDeleteEvaluationPeriod(id: string) {
    try {
      showSpinner();
      await updateEvaluationPeriod({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error?.info?.message);
        return;
      }
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại");
    } finally {
      hideSpinner();
    }
  }

  return (
    <div>
      <Row gutter={[16, 0]}>
        <Col span={24}>
          <Row gutter={[16, 16]} align="top">
            {/* Thêm mới */}
            <Col span={24}>
              <Flex justify="end">
                {can(
                  KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QL_DOT_DANH_GIA,
                  "THEM"
                ) && (
                  <Button
                    type="primary"
                    onClick={() => {
                      onOpenPutEvaluationPeriod();
                    }}
                  >
                    <BookPlus />
                    Thêm mới
                  </Button>
                )}
              </Flex>
            </Col>
          </Row>
        </Col>

        <Col span={24}>
          <Table
            rowKey="id"
            filters={filters}
            setFilters={(value) => {
              setFilters(value);
              setCurrentPage(1);
            }}
            onRow={(record) => {
              return {
                onClick: () => {
                  if (
                    record?.id &&
                    can(
                      KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QL_DOT_DANH_GIA,
                      "XEM_CHI_TIET"
                    )
                  ) {
                    router.push(
                      `${ROUTER_PATH.KHAO_THI.QL_TU_DANH_GIA_CTDT_QL_DOT_DANH_GIA}/${record?.id}`
                    );
                  }
                },
              };
            }}
            columns={[
              {
                title: "STT",
                width: 30,
                align: "center",
                render: (_, __, index) =>
                  index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
              },
              {
                title: "Tên",
                dataIndex: "name",
                width: 200,
                align: "center",
                type: "input",
              },
              {
                title: "Ngày bắt đầu",
                dataIndex: "startDate",
                width: 150,
                type: "date",
                render: (_, record) =>
                  record?.startDate
                    ? dayjs(record?.startDate).format("DD/MM/YYYY")
                    : "",
              },
              {
                title: "Hội đồng đánh giá",
                width: 200,
                render: (_, record) => {
                  if (!record.councils || record.councils.length === 0) return;

                  return (
                    <div className="text-left">
                      {record.councils.map(
                        (council: { id: string; name: string }) => (
                          <div key={council.id} className="py-0.5">
                            - {council.name}
                          </div>
                        )
                      )}
                    </div>
                  );
                },
              },
              {
                title: "Ngày kết thúc",
                dataIndex: "endDate",
                width: 150,
                type: "date",
                render: (_, record) =>
                  record?.endDate
                    ? dayjs(record?.endDate).format("DD/MM/YYYY")
                    : "",
              },
              {
                title: "Mô tả",
                width: 200,
                align: "center",
                dataIndex: "description",
                render: (value: string) => {
                  return (
                    <Tooltip title={value}>
                      <div className="line-clamp-2">{value}</div>
                    </Tooltip>
                  );
                },
              },
              {
                title: "Thao tác",
                width: 100,
                align: "center",
                fixed: "right",
                hidden: !canSome(
                  KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QL_DOT_DANH_GIA,
                  "SUA",
                  "XOA",
                  "XEM_CHI_TIET"
                ),
                render: (_, record) => {
                  if (record?.id) {
                    return (
                      <Row className="justify-center gap-2">
                        {can(
                          KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QL_DOT_DANH_GIA,
                          "XEM_CHI_TIET"
                        ) && (
                          <Tooltip title={"Chi tiết"} placement="top">
                            <EyeOutlined
                              style={{ fontSize: "16px" }}
                              onClick={(e) => {
                                router.push(
                                  `${ROUTER_PATH.KHAO_THI.QL_TU_DANH_GIA_CTDT_QL_DOT_DANH_GIA}/${record?.id}`
                                );
                                e?.stopPropagation();
                              }}
                            />
                          </Tooltip>
                        )}
                        {/* {can(
                                                    KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QL_DOT_DANH_GIA,
                                                    'XEM_CHI_TIET'
                                                ) && (
                                                    <Tooltip title={'Chi tiết'} placement="top">
                                                        <EyeOutlined
                                                            style={{ fontSize: '16px' }}
                                                            onClick={(e) => {
                                                                router.push(
                                                                    `${ROUTER_PATH.KHAO_THI.QL_TU_DANH_GIA_CTDT_QL_DOT_DANH_GIA}/${record?.id}/phancong`
                                                                )
                                                                e?.stopPropagation()
                                                            }}
                                                        />
                                                    </Tooltip>
                                                )} */}
                        {can(
                          KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QL_DOT_DANH_GIA,
                          "DUYET"
                        ) && (
                          <UserPlusIcon
                            onClick={(e) => {
                              router.push(
                                `${ROUTER_PATH.KHAO_THI.QL_TU_DANH_GIA_CTDT_QL_DOT_DANH_GIA}/${record?.id}/phancong`
                              );
                              e?.stopPropagation();
                            }}
                          />
                        )}
                        {can(
                          KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QL_DOT_DANH_GIA,
                          "SUA"
                        ) && (
                          <EditIcon
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenPutEvaluationPeriod(record?.id);
                            }}
                            className="text-sm text-blue-700 cursor-pointer"
                          />
                        )}
                        {can(
                          KHAO_THI_PERMISSION.KHAO_THI_QL_TU_DANH_GIA_CTDT_QL_DOT_DANH_GIA,
                          "XOA"
                        ) && (
                          <DeleteIcon
                            popConfirm={{
                              onConfirm: (e) => {
                                handleDeleteEvaluationPeriod(record?.id);
                                e?.stopPropagation();
                              },
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                      </Row>
                    );
                  }
                  return "";
                },
              },
            ]}
            data={data}
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

EvaluationPeriod.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>;
};
