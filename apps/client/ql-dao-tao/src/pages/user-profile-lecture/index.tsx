import {
  DownloadOutlined,
  EyeOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { fetchUpdateUser } from "@api/open-api/appComponents";
import Table from "@components/commons/table";
import DeleteIcon from "@components/icons/delete";
import {
  PutUpdateProfileModal,
  PutUploadProfileModal,
  PutUserProfileUpdateModal,
  PutUserProfileLectureModal,
} from "@components/modal";
import { DEFAULT_PAGINATE_SIZE, GENDER_MEAN } from "@constants/constants";
import useSpinner from "@hooks/spinner";
import DefaultLayout from "@layouts/default-layout";
import {
  convertToTree,
  getAllChildrenByParentId,
} from "@/utils/convertOrganizationToTree";
import {
  useCountUserProfile,
  useFindManyUserProfile,
  useFindManyTrainingForm,
  useUpdateUserProfile,
  useFindManyTrainingType,
  useFindManyTrainingObjectType,
  useFindManyTrainingLevel,
  useFindManyUserType,
  useFindManyTemplateFile,
  useFindManyOrganization,
} from "@workspace/db/hooks";

import {
  Button,
  Col,
  Divider,
  Dropdown,
  Flex,
  Form,
  Input,
  Menu,
  Row,
  Space,
  Tooltip,
  message,
} from "antd";
import dayjs from "dayjs";
import _ from "lodash";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { useDisclosure } from "react-hook-disclosure-modal";
import FilterDropdown from "./filter";
import { FilterProps } from "./filter";
type Filter = FilterProps & {
  searchText: string;
};
dayjs.locale("vi");
export default function UserProfilePageLecture() {
  const [currentPage, setCurrentPage] = useState(1);
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE);
  const [organizationIds, setOrganizationIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filter>({
    searchText: "",
    priorityObjectId: null,
    nationalityId: null,
    religionId: null,
    ethnicityId: null,
  });

  const { data: organiztion_data = [], refetch: refetch_organization } =
    useFindManyOrganization({
      take: 10000,
      skip: 0,
    });

  const tree_organization = convertToTree(organiztion_data);

  const { data = [], refetch } = useFindManyUserProfile({
    where: {
      firstName: {
        contains: filters.searchText,
      },
      ...(filters.priorityObjectId
        ? { priorityObjectId: filters.priorityObjectId }
        : {}),
      ...(filters.nationalityId
        ? { nationalityId: filters.nationalityId }
        : {}),
      ...(filters.religionId ? { nationalityId: filters.religionId } : {}),
      ...(filters.ethnicityId ? { ethnicityId: filters.ethnicityId } : {}),

      UserType: {
        is: {
          code: "GV",
        },
      },
    },
    include: {
      UserType: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  });

  const { data: count } = useCountUserProfile({
    where: {
      firstName: {
        contains: filters.searchText,
      },
      UserType: {
        is: {
          code: "GV",
        },
      },
    },
  });

  const debouncedRefetch = useCallback(
    _.debounce(() => {
      refetch();
    }, 500),
    []
  );
  const { onOpen, onClose } = useDisclosure<any>({
    tag: PutUserProfileLectureModal.name,
  });

  const { onOpen: onOpenUpload, onClose: onCloseUpload } =
    useDisclosure<string>({
      tag: PutUploadProfileModal.name,
    });
  const { onOpen: onOpenUpdateFile, onClose: onCloseUpdateFile } =
    useDisclosure<string>({
      tag: PutUpdateProfileModal.name,
    });
  const { onOpen: onOpenUpdate, onClose: onCloseUpdate } = useDisclosure<any>({
    tag: PutUserProfileUpdateModal.name,
  });

  const { showSpinner, hideSpinner } = useSpinner();

  const handleModal = () => {
    onOpen({ id: null, code: "GV" });
  };
  const handleModalUpload = (type: string) => {
    if (type === "upload") {
      onOpenUpload("GV");
    } else {
      onOpenUpdateFile("GV");
    }
  };

  const handleSelectOrganization = (idOrganization: any) => {
    const children = getAllChildrenByParentId(
      tree_organization,
      idOrganization
    );
    const listChidlrenOrganizationId = children.map((item: any) => item.id);
    console.log(children);
    console.log(listChidlrenOrganizationId);
    setOrganizationIds(listChidlrenOrganizationId);
  };
  const { mutateAsync: updateUserProfile } = useUpdateUserProfile();
  async function handleDelete(id: string) {
    try {
      showSpinner();
      await updateUserProfile({
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
  const { data: userTypeData = [], refetch: refetchUserType } =
    useFindManyUserType({
      take: 1000,
      skip: 0,
    });
  const { data: templateFile = [], refetch: refetchTemplateFile } =
    useFindManyTemplateFile({
      take: 1000,
      skip: 0,
    });

  const handleFilterChange = (key: any, value: any) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };
      debouncedRefetch();
      return newFilters;
    });
  };

  const handleDownloadTemplate = (type: string) => {
    const fileRecord = templateFile?.find((item) => item.code === type);
    const fileLink = fileRecord ? fileRecord.path : null;
    if (fileLink) {
      const link = document.createElement("a");
      link.href = fileLink;
      link.setAttribute("download", "");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const itemsDownload = [
    {
      key: "import",
      label: "Tải file nhập thông tin giảng viên",
      onClick: () => handleDownloadTemplate("IMPORT_USERPROFILE"),
    },
    {
      key: "update",
      label: "Tải file cập nhật thông tin giảng viên",
      onClick: () => handleDownloadTemplate("UPDATE_USERPROFILE"),
    },
  ];

  const itemsUpload = [
    {
      key: "upload",
      label: "Nhập file nhập thông tin giảng viên",
      onClick: () => handleModalUpload("upload"),
    },
    {
      key: "update",
      label: "Nhập file cập nhật thông tin giảng viên",
      onClick: () => handleModalUpload("update"),
    },
  ];
  const menuDownload = (
    <Menu>
      {itemsDownload.map((item) => (
        <Menu.Item key={item.key} onClick={item.onClick}>
          {item.label}
        </Menu.Item>
      ))}
    </Menu>
  );

  const menuUpload = (
    <Menu>
      {itemsUpload.map((item) => (
        <Menu.Item key={item.key} onClick={item.onClick}>
          {item.label}
        </Menu.Item>
      ))}
    </Menu>
  );

  const handleAdvancedFilter = (values: FilterProps) => {
    const newFilters = { ...filters, ...values };
    // setFilters((prev) => {
    //   const newFilters = { ...prev, values };
    //   return newFilters;
    // });
    setFilters(newFilters);
  };
  return (
    <div>
      <Divider orientation="left" orientationMargin={0}>
        Cán bộ / Giảng viên
      </Divider>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          {/* Row nút thêm */}
          <Row gutter={[16, 16]} align="top" justify="space-between">
            <Col span={24}>
              <Flex justify="end">
                <Button onClick={handleModal} type="primary">
                  Thêm mới
                </Button>

                {/* Gói Dropdown vào Space để đảm bảo chỉ có một child */}
                <>
                  <Dropdown overlay={menuDownload} trigger={["hover"]}>
                    <Button
                      className="ml-4"
                      type="primary"
                      icon={<DownloadOutlined />}
                    >
                      Tải file mẫu
                    </Button>
                  </Dropdown>
                </>
                <>
                  <Dropdown overlay={menuUpload} trigger={["hover"]}>
                    <Button
                      className="ml-4"
                      type="primary"
                      icon={<UploadOutlined />}
                    >
                      Nhập file
                    </Button>
                  </Dropdown>
                </>
              </Flex>
            </Col>
          </Row>
          {/* Row ô tìm kiếm */}
          <Row gutter={[16, 16]}>
            {/* <Col span={6}>
              <Form.Item label="Tìm kiếm" name="searchText">
                <Input
                  id="search"
                  onChange={(e) =>
                    handleFilterChange("searchText", e.target.value)
                  }
                  placeholder="Tìm kiếm theo tên,..."
                />
              </Form.Item>
            </Col> */}
            {/* Search and filter row */}
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col span={24}>
                <FilterDropdown
                  onSearchChange={handleFilterChange}
                  onFilterChange={handleAdvancedFilter}
                />
              </Col>
            </Row>
          </Row>
        </Col>
        <Col span={7}>
          <Table
            columns={[
              {
                title: "Mã đơn vị",
                dataIndex: "code",
              },
              {
                title: "Tên đơn vị",
                dataIndex: "name",
              },
              {
                title: "Thao tác",
                width: 100,
                align: "center",
                render: (_, { id }) => (
                  <Row className="justify-center gap-2">
                    <Tooltip title="Xem chi tiết" placement="leftTop">
                      <EyeOutlined
                        onClick={() => handleSelectOrganization(id)}
                        className="text-sm text-blue-700 cursor-pointer"
                      />
                    </Tooltip>
                  </Row>
                ),
              },
            ]}
            data={tree_organization}
            expandable={{
              defaultExpandedRowKeys: ["root"],
            }}
            pagination={{
              current: 1,
              pageSize: 10000,
              // total: count,
              onChange: setCurrentPage,
              showSizeChanger: false,
              showTotal: () => null,
            }}
          />
        </Col>
        <Col span={17}>
          <Table
            columns={[
              {
                title: "STT",
                width: 20,
                align: "center",
                render: (_, __, index) =>
                  index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
              },
              {
                title: "Mã cán bộ/giảng viên",
                dataIndex: "code",
                align: "center",
              },
              {
                title: "Họ và tên",
                // dataIndex: 'name',
                render: ({ firstName, lastName }: any) =>
                  `${lastName}` + " " + `${firstName}`,
              },
              // {
              //     title: 'Đối tượng',
              //     dataIndex: 'UserType',
              //     render: (value) => value?.name ? value?.name : ""
              // },
              {
                title: "Ngày sinh",
                // dataIndex: 'startDate',
                render: ({ dateOfBirth }) =>
                  dayjs(dateOfBirth).format("DD/MM/YYYY"),
              },
              {
                title: "Giới tính",
                // dataIndex: 'gender',
                render: ({ gender }) =>
                  GENDER_MEAN[gender as keyof typeof GENDER_MEAN],
              },
              {
                title: "Số CCCD",
                dataIndex: "idCardNumber",
              },
              {
                title: "Số điện thoại",
                dataIndex: "phoneNumber",
              },
              {
                title: "Thao tác",
                width: 100,
                align: "center",
                render: (_, { id }) => (
                  <Row className="justify-center gap-2">
                    <Tooltip title="Xem chi tiết" placement="leftTop">
                      <EyeOutlined
                        onClick={onOpenUpdate.bind(null, {
                          id: id,
                          code: "SV",
                        })}
                        className="text-sm text-blue-700 cursor-pointer"
                      />
                    </Tooltip>
                    <DeleteIcon
                      popConfirm={{
                        onConfirm: () => handleDelete(id),
                      }}
                    />
                  </Row>
                ),
              },
            ]}
            data={data}
            pagination={{
              current: currentPage,
              pageSize: numberOfPages,
              total: count,
              onChange: setCurrentPage,
              onShowSizeChange: setNumberOfPages,
              showTotal: (total, range) =>
                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
            }}
          />
        </Col>
      </Row>
    </div>
  );
}

UserProfilePageLecture.getLayout = function getLayout(
  page: React.ReactElement
) {
  return <DefaultLayout>{page}</DefaultLayout>;
};
