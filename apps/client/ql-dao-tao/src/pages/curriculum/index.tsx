import { EyeOutlined, SearchOutlined } from "@ant-design/icons";
import { fetchUpdateUser } from "@api/open-api/appComponents";
import Table from "@components/commons/table";
import DeleteIcon from "@components/icons/delete";
import { PutCurriculumModal } from "@components/modal";
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants";
import useSpinner from "@hooks/spinner";
import DefaultLayout from "@layouts/default-layout";
import {
  useCountCurriculum,
  useFindManyCurriculum,
  useFindManyTrainingForm,
  useUpdateCurriculum,
  useFindManyTrainingType,
  useFindManyTrainingObjectType,
  useFindManyTrainingLevel,
  useFindManySchoolYear,
  useFindManyOrganization,
  useFindManyTrainingMajor,
} from "@workspace/db/hooks";
import {
  Curriculum,
  SchoolYear,
  TrainingForm,
  TrainingLevel,
  TrainingType,
  TrainingObjectType,
  CurriculumStatus,
  TrainingTime,
  TrainingMajor,
} from "@workspace/db";

import {
  Button,
  Col,
  Divider,
  Flex,
  Form,
  Input,
  Row,
  Space,
  Tag,
  Tooltip,
  message,
  TreeSelect,
} from "antd";
import dayjs from "dayjs";
import _ from "lodash";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { useDisclosure } from "react-hook-disclosure-modal";
import { TRAINING_COURSE_STATUS } from "@constants/constants";
import Select from "@components/commons/select";
import FixedClassPage from "@pages/fixed-class";
import { buildOrgTree } from "@lib/utils";
import CurriculumVersionPage from "@pages/curriculum-version";

// const { Option } = Select;

const statusOptions = {
  ACTIVE: { label: "Đang hoạt động", color: "green" },
  INACTIVATED: { label: "Không hoạt động", color: "red" },
};
export default function CurriculumPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE);
  const [filters, setFilters] = useState({
    name: "",
    infomation: "",
    managementOrganizationId: undefined,
    trainingObjectTypeId: undefined,
    trainingTimeId: undefined,
    trainingLevelId: undefined,
    status: undefined,
    startDate: undefined,
    endDate: undefined,
    trainingMajorId: undefined,
  });

  const [dataToView, setDataToView] = useState<any>([]);
  const { data = [], refetch } = useFindManyCurriculum({
    where: {
      ...(filters.name && filters.name !== ""
        ? { name: { contains: filters.name } }
        : {}),
      ...(filters.infomation && filters.infomation !== ""
        ? { infomation: { contains: filters.infomation } }
        : {}),
      ...(filters.managementOrganizationId
        ? { managementOrganizationId: filters.managementOrganizationId }
        : {}),
      ...(filters.trainingTimeId
        ? { trainingTimeId: filters.trainingTimeId }
        : {}),
      ...(filters.trainingLevelId
        ? { trainingLevelId: filters.trainingLevelId }
        : {}),
      ...(filters.trainingObjectTypeId
        ? { trainingObjectTypeId: filters.trainingObjectTypeId }
        : {}),
      ...(filters.trainingMajorId
        ? { trainingMajorId: filters.trainingMajorId }
        : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.startDate && filters.endDate
        ? {
            startDate: {
              gte: new Date(filters.startDate),
              lte: new Date(filters.endDate),
            },
          }
        : {}),
    },
    include: {
      ManagementOrganization: true,
      TrainingLevel: true,
      TrainingObjectType: true,
      TraingTime: true,
      TrainingMajor: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  });

  const { data: count } = useCountCurriculum({
    where: {
      ...(filters.name && filters.name !== ""
        ? { name: { contains: filters.name } }
        : {}),
      ...(filters.infomation && filters.infomation !== ""
        ? { infomation: { contains: filters.infomation } }
        : {}),
      ...(filters.managementOrganizationId
        ? { managementOrganizationId: filters.managementOrganizationId }
        : {}),
      ...(filters.trainingTimeId
        ? { trainingTimeId: filters.trainingTimeId }
        : {}),
      ...(filters.trainingLevelId
        ? { trainingLevelId: filters.trainingLevelId }
        : {}),
      ...(filters.trainingObjectTypeId
        ? { trainingObjectTypeId: filters.trainingObjectTypeId }
        : {}),
      ...(filters.trainingMajorId
        ? { trainingMajorId: filters.trainingMajorId }
        : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.startDate && filters.endDate
        ? {
            startDate: {
              gte: new Date(filters.startDate),
              lte: new Date(filters.endDate),
            },
          }
        : {}),
    },
  });

  const debouncedRefetch = useCallback(
    _.debounce(() => {
      refetch();
    }, 500),
    []
  );
  const { onOpen, onClose } = useDisclosure<string>({
    tag: PutCurriculumModal.name,
  });

  const { showSpinner, hideSpinner } = useSpinner();

  const handleModal = () => {
    onOpen();
  };
  const { mutateAsync: updateCurriculum } = useUpdateCurriculum();
  async function handleDelete(id: string) {
    try {
      showSpinner();
      await updateCurriculum({
        where: {
          id,
        },
        data: {
          deletedAt: new Date(),
        },
      });
    } catch (error) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại");
    }
    hideSpinner();
  }

  const { data: trainingTimeData = [], refetch: refetchTime } =
    useFindManyTrainingType({
      take: 1000,
      skip: 0,
    });
  const { data: trainingLevelData = [], refetch: refetchLevel } =
    useFindManyTrainingLevel({
      take: 1000,
      skip: 0,
    });
  const { data: trainingObjectTypeData = [], refetch: refetchObjectType } =
    useFindManyTrainingObjectType({
      take: 1000,
      skip: 0,
    });
  const { data: trainingMajorData = [], refetch: refetchObjectMajor } =
    useFindManyTrainingMajor({
      take: 1000,
      skip: 0,
    });
  const handleFilterChange = (key: any, value: any) => {
    if (key !== "time") {
      setFilters((prev) => {
        const newFilters = { ...prev, [key]: value };
        debouncedRefetch();
        return newFilters;
      });
    } else {
      setFilters((prev) => {
        const newFilters = {
          ...prev,
          startDate: value?.startDate ?? undefined,
          endDate: value?.endDate ?? undefined,
        };
        debouncedRefetch();
        return newFilters;
      });
    }
  };
  async function handleStatusChange(id: string, newStatus: CurriculumStatus) {
    try {
      showSpinner();
      await updateCurriculum({
        where: {
          id,
        },
        data: {
          status: newStatus,
        },
      });
    } catch (error) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại");
    }
    hideSpinner();
  }
  const options = Object.entries(statusOptions).map(
    ([value, { label, color }]) => ({
      value,
      label: <Tag color={color}>{label}</Tag>, // hiển thị trong dropdown
    })
  );
  const filterRow = {
    isFilterRow: true,
    key: "filter",
  };
  useEffect(() => {
    const dataWithFilter = [filterRow, ...data];
    setDataToView(dataWithFilter);
  }, [data]);
  const { data: dataSchoolYear = [], refetch: refetchSchoolYear } =
    useFindManySchoolYear({
      take: 1000,
      skip: 0,
    });
  const { data: manageOrgData = [], refetch: refetchManageOrg } =
    useFindManyOrganization({
      take: 1000,
      skip: 0,
    });
  const treeData = buildOrgTree(manageOrgData);

  return (
    <div>
      <Divider orientation="left" orientationMargin={0}>
        Chương trình đào tạo
      </Divider>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Row gutter={[16, 16]} align="top" justify="space-between">
            <Col span={6}>
              {/* <Form.Item label="Năm học" name="schoolYearId" value={filters.schoolYearId}> */}
              <Flex justify="space-between" align="center">
                <label>Năm học:</label>
                <Select
                  className="w-[70%]"
                  placeholder="Chọn năm học"
                  allowClear
                  options={dataSchoolYear.map((i: SchoolYear) => {
                    return {
                      value: i.id,
                      label: i.name,
                      startDate: i.startDate,
                      endDate: i.endDate,
                    };
                  })}
                  // value={filters.schoolYearId}
                  onChange={(value: number | null, option: any) => {
                    handleFilterChange("time", option ?? undefined);
                  }}
                />
              </Flex>

              {/* </Form.Item> */}
            </Col>
            <Col span={6}>
              <Flex justify="end">
                <Button onClick={handleModal} type="primary">
                  Thêm mới
                </Button>
              </Flex>
            </Col>
          </Row>
        </Col>

        <Col span={24}>
          <Table
            rowKey="id"
            id="training-course"
            columns={[
              {
                title: "STT",
                width: 20,
                align: "center",
                render: (_, record, index) => {
                  if (record.isFilterRow) return "";
                  return index + (currentPage - 1) * DEFAULT_PAGINATE_SIZE;
                },
              },
              {
                title: "Nội dung",
                dataIndex: "name",
                align: "center",
                width: 100,
                render: (value: any, record: any) => {
                  if (record.isFilterRow) {
                    return (
                      <Input
                        // placeholder="Nhập mã khóa"
                        allowClear
                        onPressEnter={(e) => {
                          const value = e.currentTarget.value?.trim();
                          handleFilterChange("name", value);
                        }}
                        onChange={(e) => {
                          if (!e.target.value || e.target.value === "") {
                            handleFilterChange("name", undefined);
                          }
                        }}
                      />
                    );
                  }
                  return value;
                },
              },
              {
                title: "Đơn vị phụ trách",
                dataIndex: "managementOrganization",
                width: 150,
                render: (value: any, record: any) => {
                  if (record.isFilterRow) {
                    return (
                      // <Select
                      //     className='w-[110px]'
                      //     // placeholder="Chọn loại hình đào tạo"
                      //     options={trainingTypeData.map((i: TrainingType) => ({
                      //         value: i.id,
                      //         label: i.name,
                      //     }))}
                      //     onChange={(val) => handleFilterChange('trainingTypeId', val)}
                      //     allowClear
                      // />
                      <TreeSelect
                        className="w-[110px]"
                        allowClear
                        showSearch
                        treeDefaultExpandAll
                        treeData={treeData}
                        filterTreeNode={(input, node) =>
                          (node.title as string)
                            .toLowerCase()
                            .includes(input.toLowerCase())
                        }
                        onChange={(val) =>
                          handleFilterChange("managementOrganizationId", val)
                        }
                      />
                    );
                  }
                  return value?.name ? value?.name : "";
                },
              },
              {
                title: "Đối tượng đào tạo",
                dataIndex: "TrainingObjectType",
                width: 120,
                render: (value: any, record: any) => {
                  if (record.isFilterRow) {
                    return (
                      <Select
                        className="w-[110px]"
                        options={trainingObjectTypeData.map(
                          (i: TrainingObjectType) => ({
                            value: i.id,
                            label: i.name,
                          })
                        )}
                        onChange={(val) =>
                          handleFilterChange("trainingObjectTypeId", val)
                        }
                        allowClear
                      />
                    );
                  }
                  return value?.name ? value?.name : "";
                },
              },
              {
                title: "Bậc đào tạo",
                dataIndex: "TrainingLevel",
                width: 120,
                render: (value: any, record: any) => {
                  if (record.isFilterRow) {
                    return (
                      <Select
                        className="w-[110px]"
                        // placeholder="Chọn hình thức đào tạo"
                        options={trainingLevelData.map((i: TrainingLevel) => ({
                          value: i.id,
                          label: i.name,
                        }))}
                        onChange={(val) =>
                          handleFilterChange("trainingFormId", val)
                        }
                        allowClear
                      />
                    );
                  }
                  return value?.name ? value?.name : "";
                },
              },
              {
                title: "Thời gian",
                dataIndex: "TraingTime",
                render: (value: any, record: any) => {
                  if (record.isFilterRow) {
                    return (
                      <Select
                        className="w-[110px]"
                        // placeholder="Chọn trình độ đào tạo"
                        options={trainingTimeData.map((i: TrainingTime) => ({
                          value: i.id,
                          label: i.name,
                        }))}
                        onChange={(val) =>
                          handleFilterChange("trainingLevelId", val)
                        }
                        allowClear
                      />
                    );
                  }
                  return value?.name ? value?.name : "";
                },
              },
              {
                title: "Chuyên ngành",
                dataIndex: "TrainingMajor",
                render: (value: any, record: any) => {
                  if (record.isFilterRow) {
                    return (
                      <Select
                        className="w-[130px]"
                        // placeholder="Chọn trình độ đào tạo"
                        options={trainingMajorData.map((i: TrainingMajor) => ({
                          value: i.id,
                          label: i.name,
                        }))}
                        onChange={(val) =>
                          handleFilterChange("trainingMajorId", val)
                        }
                        allowClear
                      />
                    );
                  }
                  return value?.name ? value?.name : "";
                },
              },
              {
                title: "Ngày bắt đầu",
                render: ({ startDate }) =>
                  startDate ? dayjs(startDate).format("DD/MM/YYYY") : "",
              },
              {
                title: "Ngày kết thúc",
                render: ({ endDate }) =>
                  endDate ? dayjs(endDate).format("DD/MM/YYYY") : "",
              },
              {
                title: "Tài liệu",
                render: ({ documentPath }) =>
                  documentPath ? (
                    <a
                      href={documentPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "blue",
                        textDecoration: "underline",
                      }}
                    >
                      Xem thêm
                    </a>
                  ) : (
                    ""
                  ),
              },
              {
                title: "Tài liệu kết xuất",
                render: ({ renderPath }) =>
                  renderPath ? (
                    <a
                      href={renderPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "blue",
                        textDecoration: "underline",
                      }}
                    >
                      Xem thêm
                    </a>
                  ) : (
                    ""
                  ),
              },
              {
                title: "Thông tin",
                dataIndex: "infomation",
                width: 100,
                render: (value: any, record: any) => {
                  if (record.isFilterRow) {
                    return (
                      <Input
                        // placeholder="Nhập tên khóa"
                        allowClear
                        onPressEnter={(e) => {
                          const value = e.currentTarget.value?.trim();
                          handleFilterChange("infomation", value);
                        }}
                        onChange={(e) => {
                          if (!e.target.value || e.target.value === "") {
                            handleFilterChange("infomation", undefined);
                          }
                        }}
                      />
                    );
                  }
                  return value;
                },
              },
              {
                title: "Trạng thái",
                width: 130,
                render: (record: any) => {
                  if (record.isFilterRow) {
                    return (
                      <Select
                        className="w-[155px]"
                        onChange={(val) => handleFilterChange("status", val)}
                        options={Object.entries(statusOptions).map(
                          ([value, { label, color }]) => ({
                            value,
                            label, // hiển thị trong dropdown
                          })
                        )}
                        allowClear
                        // style={{ width: 180 }}
                      />
                    );
                  } else
                    return (
                      <Select
                        className="w-[155px]"
                        value={record.status}
                        onChange={(newStatus) =>
                          handleStatusChange(
                            record.id,
                            newStatus as CurriculumStatus
                          )
                        }
                        options={options}
                        optionLabelProp="label"
                        // style={{ width: 180 }}
                        bordered={false}
                        showSearch={false}
                      />
                    );
                },
              },
              {
                title: "Thao tác",
                width: 100,
                align: "center",
                render: (_, { id }) => {
                  if (id) {
                    return (
                      <Row className="justify-center gap-2">
                        <Tooltip title="Xem chi tiết" placement="leftTop">
                          <EyeOutlined
                            onClick={onOpen.bind(null, id)}
                            className="text-sm text-blue-700 cursor-pointer"
                          />
                        </Tooltip>
                        <DeleteIcon
                          popConfirm={{
                            onConfirm: () => handleDelete(id),
                          }}
                        />
                      </Row>
                    );
                  } else return "";
                },
              },
            ]}
            data={dataToView}
            pagination={{
              current: currentPage,
              pageSize: numberOfPages,
              total: count,
              onChange: setCurrentPage,
              onShowSizeChange: setNumberOfPages,
              showTotal: (total, range) =>
                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
            }}
            expandable={{
              expandedRowRender: (record) => (
                <div style={{ maxWidth: "100%" }}>
                  <CurriculumVersionPage
                    key={record.id}
                    curriculumInfo={record}
                  />
                </div>
              ),
              rowExpandable: (record) => !(record.isFilterRow === true), // điều kiện nào đó
            }}
          />
        </Col>
      </Row>
    </div>
  );
}

CurriculumPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>;
};
