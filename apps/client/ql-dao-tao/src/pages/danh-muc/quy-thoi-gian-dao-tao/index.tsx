import Table from "@components/commons/table";
import DeleteIcon from "@components/icons/delete";
import EditIcon from "@components/icons/edit";
import {
  DEFAULT_PAGINATE_PAGE,
  DEFAULT_PAGINATE_SIZE,
} from "@constants/constants";
import type { FilterProps } from "@constants/type";
import useSpinner from "@hooks/spinner";
import DefaultLayout from "@layouts/default-layout";
import {
  useCountAvailableTrainingTime,
  useFindManyAvailableTrainingTime,
  useUpdateAvailableTrainingTime,
} from "@workspace/db/hooks";
import { useAbility } from "@workspace/permissions/hooks";
import { QL_DAO_TAO_PERMISSION } from "@workspace/router";
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui";
import { Button, Col, Flex, message, Row } from "antd";
import _ from "lodash";
import type React from "react";
import { useState } from "react";
import { useDisclosure } from "react-hook-disclosure-modal";

const initialFilters: FilterProps = {
  code: "",
};

export default function AvailableTrainingTimePage() {
  const { can, canSome } = useAbility();
  const { showSpinner, hideSpinner } = useSpinner();
  const { id: semesterId } = useSemesterStore();
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore();

  const [currentPage, setCurrentPage] = useState(DEFAULT_PAGINATE_PAGE);
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE);
  const [_searchText, _setSearchText] = useState<string>("");
  const [filters, setFilters] = useState<FilterProps>(initialFilters);

  const {
    data = [],
    isLoading: isLoadingAvailableTrainingTime,
    isFetching: isFetchingAvailableTrainingTime,
  } = useFindManyAvailableTrainingTime(
    {
      where: {
        semesterId,
        trainingObjectTypeId,
      },
      include: {
        trainingObjectType: true,
        semester: true,
      },
      take: numberOfPages,
      skip: (currentPage - 1) * numberOfPages,
    },
    {
      refetchOnWindowFocus: false,
      enabled: !!semesterId && !!trainingObjectTypeId,
    },
  );

  const { data: count } = useCountAvailableTrainingTime(
    {
      where: {
        semesterId,
        trainingObjectTypeId,
        deletedAt: null,
      },
    },
    {
      refetchOnWindowFocus: false,
      enabled: !!semesterId && !!trainingObjectTypeId,
    },
  );

  const { onOpen } = useDisclosure<{ id: string }>({
    tag: "PutAvailableTrainingTimeModal",
  });

  const { mutateAsync: updateAvailableTrainingTime } =
    useUpdateAvailableTrainingTime({
      onSuccess: (res) => {
        if (!res) return;
        message.success("Cập nhật thành công!");
      },
      onError: (error: any) => {
        if (error?.info?.message) {
          message.error(error?.info?.message);
          return;
        }
        message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại");
      },
      onSettled: () => {
        hideSpinner();
      },
    });

  const handleDelete = async (id: string) => {
    showSpinner();
    await updateAvailableTrainingTime({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  };

  const handleEdit = (id: string) => () => {
    onOpen?.({ id });
  };

  const handleModal = () => {
    onOpen?.();
  };

  return (
    <div>
      <Row gutter={[16, 0]}>
        <Col span={24}>
          <Row gutter={[16, 16]} align="top" justify="end">
            <Col span={4}>
              <Flex justify="end" gap={4}>
                {can(
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_QUY_THOI_GIAN_DAO_TAO,
                  "THEM",
                ) && (
                  <Button onClick={handleModal} type="primary">
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
            id="fixed-class"
            loading={
              isLoadingAvailableTrainingTime || isFetchingAvailableTrainingTime
            }
            filters={filters}
            setFilters={(value) => {
              setFilters(value);
              setCurrentPage(DEFAULT_PAGINATE_PAGE);
            }}
            columns={[
              {
                title: "STT",
                width: 60,
                align: "center",
                fixed: "left",
                render: (_, __, index) =>
                  index + 1 + (currentPage - 1) * numberOfPages,
              },
              {
                title: "ĐTĐT",
                align: "left",
                width: 250,
                render: (_, record) => {
                  return record?.trainingObjectType?.name || "";
                },
              },
              {
                title: "Học kỳ",
                align: "left",
                width: 250,
                render: (_, record) => {
                  return record?.semester?.name || "";
                },
              },
              {
                title: "Quỹ thời gian đào tạo",
                align: "left",
                dataIndex: "duration",
                type: "input",
                width: 150,
                render: (value) => `${value} ngày`,
              },
              {
                title: "Thao tác",
                width: 150,
                align: "center",
                hidden: !canSome(
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_QUY_THOI_GIAN_DAO_TAO,
                  "SUA",
                  "XOA",
                ),
                render: (_, { id }) => (
                  <Row className="justify-center gap-2">
                    {can(
                      QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_QUY_THOI_GIAN_DAO_TAO,
                      "SUA",
                    ) && (
                      <EditIcon
                        onClick={handleEdit(id)}
                        className="text-sm text-blue-700 cursor-pointer"
                      />
                    )}
                    {can(
                      QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_QUY_THOI_GIAN_DAO_TAO,
                      "XOA",
                    ) && (
                      <DeleteIcon
                        popConfirm={{
                          onConfirm: () => handleDelete(id),
                        }}
                      />
                    )}
                  </Row>
                ),
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
              showTotal: (total, range) =>
                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
            }}
          />
        </Col>
      </Row>
    </div>
  );
}

AvailableTrainingTimePage.getLayout = function getLayout(
  page: React.ReactElement,
) {
  return <DefaultLayout>{page}</DefaultLayout>;
};
