import Select from "@components/commons/select";
import Table from "@components/commons/table";
import DeleteIcon from "@components/icons/delete";
import SettingsIcon from "@components/icons/settings";
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants";
import useSpinner from "@hooks/spinner";
import DefaultLayout from "@layouts/default-layout";
import TreeSelect from "@/components/commons/tree-select";
import {
  useCountStudent,
  useCreateStudentThesisRegistration,
  useCreateThesisProject,
  useFindManyDM_DonVi,
  useFindManyExpertProfile,
  useFindManyFixedClass,
  useFindManyRoom,
  useFindManyStudent,
  useFindManyDefenseSession,
  useFindManyThesisSession,
  useFindManyTrainingCourse,
  useUpdateThesisProject,
} from "@workspace/db/hooks";

import { dayjs, useTrainingObjectTypeStore } from "@workspace/ui";
import {
  Button,
  Col,
  Flex,
  Form,
  Input,
  message,
  Popconfirm,
  Row,
  Tag,
} from "antd";
import type React from "react";
import { useState } from "react";
import { useThesisProjectStatusOptions } from "@hooks/thesisProjectStatus";
import { exportFromTemplate, TableRow } from "@workspace/libs/template-excel";
import { useDisclosure } from "react-hook-disclosure-modal";
import {
  CouncilProposalStatus,
  CouncilRole,
  ThesisProjectStatus,
  ThesisType,
} from "@workspace/db/client";
import { buildOrgTree } from "@lib/utils";
import { getMinioUrl } from "@workspace/constant";
import { createStyles } from "antd-style";
import ApproveIcon from "@components/icons/approve";

// import { getMinioUrl } from '@workspace/constant'

// interface thống kê các chuyên gia hướng dẫn
interface ExpertStat {
  expertId: string;
  name: string;
  sDonvi: string;
  stk: string;
  tennganhang: string;
  GVHD1Student: number;
  GVHD2Student: number;
  totalPayment: number;
}

// interface props cho component PostgraduateProject
export interface PostgraduateProjectProps {
  role?: "P7" | "P2" | "P13";
  isManage?: boolean;
}

// component PostgraduateProject
export default function PostgraduateProject({
  role = "P7",
  isManage = false,
}: PostgraduateProjectProps) {
  // dùng cho textarea của antd
  const { TextArea } = Input;
  // dùng cho spinner
  const { showSpinner, hideSpinner } = useSpinner();
  // dùng cho custom table
  const useStyle = createStyles(({ css, token }) => {
    const { antCls } = token;
    return {
      customTable: css`
        ${antCls}-table {
          ${antCls}-table-container {
            ${antCls}-table-body,
            ${antCls}-table-content {
              scrollbar-width: thin;
              scrollbar-color: #eaeaea transparent;
              scrollbar-gutter: stable;
            }
          }
        }
      `,
    };
  });
  // hàm xử lý lấy ra styles cho bảng
  const { styles } = useStyle();
  // state cho session đang chọn
  const [thesisSessionSelected, setThesisSessionSelected] = useState<any>(null);
  // state cho row keys đang chỉnh sửa
  const [editingRowKeys, setEditingRowKeys] = useState<string[]>([]);
  // state cho values đang chỉnh sửa
  const [editingValues, setEditingValues] = useState<
    Record<string, Record<string, any>>
  >({});
  // state cho current page
  const [currentPage, setCurrentPage] = useState(1);
  // state cho selected row keys
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  // state cho training course đang chọn
  const [trainingCourseSelected, setTrainingCourseSelected] = useState<
    string | null
  >(null);
  // state cho fixed classes đang chọn
  const [fixedClassesSelected, setFixedClassesSelected] = useState<string[]>(
    []
  );
  // state cho query fixed classes
  const [queryFixedClasses, setQueryFixedClasses] = useState<string[]>([]);
  // state cho need all students để lấy tất cả sinh viên trong lớp học
  const [needAllStudents, setNeedAllStudents] = useState<boolean>(false);
  // state cho has clicked fetch để check xem đã click vào button xem kết quả hay chưa
  const [hasClickedFetch, setHasClickedFetch] = useState<boolean>(false);
  // hàm xử lý row selection để chọn sinh viên
  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };
  // state cho số lượng trang để phân trang
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE);
  // hàm xử lý batch save
  const handleBatchSave = async () => {
    if (editingRowKeys.length === 0) {
      message.info("Không có hàng nào đang ở chế độ chỉnh sửa để lưu.");
      return;
    }

    showSpinner();
    try {
      const updatePromises = editingRowKeys.map(async (studentId) => {
        const rowData = editingValues[studentId];

        const studentRecord = students?.find((s) => s.id === studentId);
        const thesisProjectId =
          studentRecord?.thesisRegistrations?.[0]?.thesisProject?.id;

        if (!thesisProjectId || !rowData) return;

        const description = `Ngôn ngữ: ${rowData.language} - Luận án/Đề án: ${rowData.type}`;
        let status = rowData.status;
        if (status === ThesisProjectStatus.PROPOSED) {
          status = ThesisProjectStatus.APPROVED_BY_DEPT;
        }
        const basePayload = {
          title: rowData.title,
          description: description,
          status: status,
        };
        const supervisorPayload =
          rowData.supervisor === "" || rowData.supervisor === null
            ? { supervisor: { disconnect: true } }
            : {
                supervisor: {
                  connect: {
                    id: rowData.supervisor,
                  },
                },
              };
        const coSupervisorPayload =
          rowData.coSupervisor === "" || rowData.coSupervisor === null
            ? { coSupervisor: { disconnect: true } }
            : {
                coSupervisor: {
                  connect: {
                    id: rowData.coSupervisor,
                  },
                },
              };

        const payload = {
          ...basePayload,
          ...supervisorPayload,
          ...coSupervisorPayload,
        };

        await updateThesisProject({
          data: payload,
          where: {
            id: thesisProjectId,
          },
        });
      });

      await Promise.all(updatePromises.filter((p) => p !== undefined)); // Chờ tất cả promise hoàn thành

      message.success(
        `Lưu thành công ${editingRowKeys.length} hàng đã chỉnh sửa.`
      );
    } catch (error) {
      message.error("Đã xảy ra lỗi khi lưu hàng loạt, vui lòng kiểm tra lại");
    } finally {
      hideSpinner();
      await refetch();
      if (refetchCount) await refetchCount();
    }
    // Reset trạng thái chỉnh sửa
    setEditingRowKeys([]);
    setEditingValues({});
  };
  // hàm xử lý bật chế edit cho bảng
  const handleActivateEdit = () => {
    if (!students || students.length === 0) {
      message.info("Không có dữ liệu sinh viên để chỉnh sửa.");
      return;
    }

    const newEditingRowKeys = students.map((s) => s.id);
    const initialEditingValues: Record<string, Record<string, any>> = {};

    students.forEach((record) => {
      const thesisProject = record?.thesisRegistrations?.[0]?.thesisProject;
      if (thesisProject) {
        // Logic để phân tích language và type từ chuỗi description
        const description = thesisProject.description || "";
        const parts = description.split("-");
        const languagePart = parts[0];
        const typePart = parts.length > 1 ? parts[1] : "";

        // Trích xuất giá trị sau ':' và loại bỏ khoảng trắng
        const language = languagePart.split(":")[1]?.trim() || "";
        const type = typePart.split(":")[1]?.trim() || "";

        initialEditingValues[record.id] = {
          title: thesisProject.title || "",
          supervisor: thesisProject.supervisor?.id || "",
          coSupervisor: thesisProject.coSupervisor?.id || "",
          language: language,
          type: type,
          status: thesisProject.status || "",
        };
      }
    });

    setEditingRowKeys(newEditingRowKeys);
    setEditingValues(initialEditingValues);
  };

  // hàm xử lý chọn training object type lấy ra từ store
  const { id: trainingObjectId } = useTrainingObjectTypeStore();
  // hàm xử lý mở modal cau hinh luan van
  const { onOpen: openModalCauHinhLuanVan } = useDisclosure<{
    thesisProjectId: string;
    thesisSessionId: string;
  }>({
    tag: "ModalCauHinhLuanVan",
  });
  // hàm xử lý lấy ra danh sách đơn vị
  const { data: sDm_Donvi = [] } = useFindManyDM_DonVi();
  // hàm xử lý lấy ra danh sách phòng bảo vệ
  const { data: roomData } = useFindManyRoom();
  // hàm xử lý lấy ra danh sách ca bảo vệ
  const { data: defenseSessionData } = useFindManyDefenseSession();

  // hàm xử lý build tree cho danh sách đơn vị
  const treeData = buildOrgTree(sDm_Donvi ?? [], "0");
  // hàm xử lý lấy ra label và color cho trạng thái đồ án
  const { getThesisProjectStatusLabel, getThesisProjectStatusColor } =
    useThesisProjectStatusOptions();
  // hàm xử lý lấy ra danh sách khóa học
  const { data: trainingCourses } = useFindManyTrainingCourse(
    {
      where: {
        id: thesisSessionSelected?.trainingCourseId,
      },
    },
    {
      enabled: !!thesisSessionSelected?.trainingCourseId,
    }
  );
  // hàm xử lý lấy ra danh sách lớp học
  const { data: fixedClasses } = useFindManyFixedClass({
    where: {
      trainingCourseId: trainingCourseSelected ?? "",
    },
  });
  // hàm xử lý lấy ra danh sách chuyên gia hướng dẫn
  const { data: expertProfileData } = useFindManyExpertProfile({
    include: {
      lecturer: {
        include: {
          userProfile: true,
        },
      },
    },
  });
  // hàm xử lý lấy ra danh sách sinh viên để hiển thị trong bảng
  const { data: students, refetch } = useFindManyStudent(
    {
      where: {
        thesisRegistrations: {
          some: {
            thesisProject: {
              thesisSessionId: thesisSessionSelected?.id ?? "",
              thesisType: ThesisType.THESIS,
            },
          },
        },
        fixedClassId: {
          in:
            queryFixedClasses.length > 0
              ? queryFixedClasses
              : fixedClasses?.map((fixedClass) => fixedClass.id),
        },
      },
      include: {
        userProfile: true,
        fixedClass: {
          include: {
            trainingCourse: true,
          },
        },
        trainingObjectType: true,
        thesisRegistrations: {
          where: {
            thesisProject: {
              thesisSessionId: thesisSessionSelected?.id ?? "",
              thesisType: ThesisType.THESIS,
            },
          },
          include: {
            thesisProject: {
              include: {
                council: {
                  include: { members: { include: { expert: true } } },
                },
                thesisSession: true,
                defenseSession: true,
                defenseRecord: true,
                room: true,
                organization: true,
                supervisor: true,
                coSupervisor: true,
              },
            },
          },
        },
      },
      skip: (currentPage - 1) * numberOfPages,
      take: numberOfPages,
    },
    {
      enabled: hasClickedFetch,
    }
  );
  // hàm xử lý lấy ra danh sách sinh viên để dùng cho các hàm xuất excel
  const { data: allStudentsInClasses } = useFindManyStudent(
    {
      where: {
        fixedClassId: {
          in:
            queryFixedClasses.length > 0
              ? queryFixedClasses
              : fixedClasses?.map((fixedClass) => fixedClass.id),
        },
      },
      include: {
        userProfile: true,
        fixedClass: {
          include: {
            trainingCourse: true,
            curriculumVersion: {
              include: {
                curriculum: {
                  include: {
                    trainingMajor: {
                      include: { trainingField: true },
                    },
                    trainingObjectType: true,
                  },
                },
              },
            },
          },
        },
        trainingObjectType: true,
        thesisRegistrations: {
          include: {
            thesisProject: {
              include: {
                defenseSession: true,
                thesisSession: true,
                organization: true,
                supervisor: true,
                coSupervisor: true,
                room: true,
                defenseRecord: true,
                supervisorPayments: {
                  include: {
                    expert: true,
                  },
                  orderBy: {
                    description: "asc",
                  },
                },
                council: {
                  include: { members: { include: { expert: true } } },
                },
              },
            },
          },
        },
      },
    },
    { enabled: needAllStudents }
  );
  // hàm xử lý lấy ra số lượng sinh viên để hiển thị trong bảng
  const { data: countStudent, refetch: refetchCount } = useCountStudent(
    {
      where: {
        thesisRegistrations: {
          some: {
            thesisProject: {
              thesisSessionId: thesisSessionSelected?.id ?? "",
              thesisType: ThesisType.THESIS,
            },
          },
        },
        fixedClassId: {
          in:
            queryFixedClasses.length > 0
              ? queryFixedClasses
              : fixedClasses?.map((fixedClass) => fixedClass.id),
        },
      },
    },
    {
      enabled: hasClickedFetch,
    }
  );
  // hàm xử lý lấy ra danh sách session
  const { data: thesisSessionData } = useFindManyThesisSession({
    orderBy: { startDate: "desc" },
    where: {
      trainingObjectTypeId: trainingObjectId,
    },
    include: {
      trainingObjectType: true,
      trainingCourse: true,
    },
  });
  // hàm xử lý tạo đồ án
  const { mutateAsync: createThesisProject } = useCreateThesisProject();
  // hàm xử lý tạo sinh viên đồ án
  const { mutateAsync: createStudentThesisRegistration } =
    useCreateStudentThesisRegistration();
  // hàm xử lý cập nhật đồ án
  const { mutateAsync: updateThesisProject } = useUpdateThesisProject();
  // hàm xử lý xử lý thay đổi giá trị trong bảng
  const handleEditChange = (rowId: string, field: string, value: any) => {
    setEditingValues((prev) => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        [field]: value,
      },
    }));
  };
  // hàm xử lý click vào button mặc định
  const defaultButtonClick = () => {
    message.info("Tính năng đang trong quá trình phát triển");
  };

  // hàm xử lý xuất file sao QĐ HDLV
  const saoQDHDLV = async () => {
    if (!students?.length && !allStudentsInClasses?.length) {
      message.error("Không có dữ liệu để sao QĐ HDLV");
      return;
    }
    showSpinner();
    const presentDay = dayjs().format("DD/MM/YYYY");
    const ngayQD = presentDay.split("/")[0];
    const thangQD = presentDay.split("/")[1];
    const namQD = presentDay.split("/")[2];

    try {
      const allSheetOptions = allStudentsInClasses?.map((student) => {
        const supervisor =
          student?.thesisRegistrations?.[0]?.thesisProject?.supervisor?.name;
        if (!supervisor) {
          return null;
        }
        const coSupervisor =
          student?.thesisRegistrations?.[0]?.thesisProject?.coSupervisor?.name;

        const data = {
          ngayQD: ngayQD,
          thangQD: thangQD,
          namQD: namQD,
          type:
            student?.thesisRegistrations?.[0]?.thesisProject?.description
              ?.split("-")[1]
              .trim()
              .split(":")[1] || "",
          khoa: student?.fixedClass?.trainingCourse?.name || "",
          chuyennganh:
            student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
              ?.name || "",
          nganh:
            student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
              ?.trainingField?.name || "",
          detai: student?.thesisRegistrations?.[0]?.thesisProject?.title || "",
          hoten: student?.userProfile?.fullname,
          canbohuongdan1: supervisor ? `1. ${supervisor}` : "",
          canbohuongdan2: coSupervisor ? `2. ${coSupervisor}` : "",
          khoaquanli:
            student?.thesisRegistrations?.[0]?.thesisProject?.organization
              ?.sTen || "",
          ngay: ngayQD,
          thang: thangQD,
          nam: namQD,
        };
        const gapRow: TableRow = {
          cells: [{ value: null, colSpan: 18, border: false }],
        };
        return {
          sheet: `${student.userProfile?.code} `,
          data: data,
          tableStartCell: { row: 40, col: 1 },
          rows: [gapRow],
        };
      });
      await exportFromTemplate({
        templateUrl: getMinioUrl("mta/template/BanSaoQDHuongDanLuanVan.xlsx"),
        sheets: allSheetOptions?.filter((item) => item !== null) ?? [],
        fileName: "BanSaoQDHuongDanLuanVan",
        mergeSheetsToOne: true,
        sheetName: "BanSaoQDHuongDanLuanVan",
      });
      message.success("Xuất file thành công");
    } catch (error) {
      message.error("Vui lòng kiểm tra lại dữ liệu đầu vào");
    } finally {
      hideSpinner();
    }
  };
  // hàm xử lý xuất file giấy mời HDLV
  const giaymoihdlv = async () => {
    if (!students?.length && !allStudentsInClasses?.length) {
      message.error("Không có dữ liệu để tạo giấy mời HDLV");
      return;
    }
    showSpinner();
    const presentDay = dayjs().format("DD/MM/YYYY");
    const ngay = presentDay.split("/")[0];
    const thang = presentDay.split("/")[1];
    const nam = presentDay.split("/")[2];

    try {
      const allSheetOptions = allStudentsInClasses?.map((student) => {
        const supervisor =
          student?.thesisRegistrations?.[0]?.thesisProject?.supervisor?.name;

        const data = {
          ngay: ngay,
          thang: thang,
          nam: nam,
          tenhocvien: student?.userProfile?.fullname,
          tenhuongdan: supervisor ? ` ${supervisor}` : "",
          khoa: student?.fixedClass?.trainingCourse?.name || "",
          chuyennganh:
            student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
              ?.name || "",
          tendetai:
            student?.thesisRegistrations?.[0]?.thesisProject?.title || "",
          type:
            student?.thesisRegistrations?.[0]?.thesisProject?.description
              ?.split("-")[1]
              .trim()
              .split(":")[1]
              .trim()
              .toLowerCase() || "",
        };
        const gapRow: TableRow = {
          cells: [{ value: null, colSpan: 18, border: false }],
        };
        return {
          sheet: `${student.userProfile?.fullname} - ${student.userProfile?.code}`,
          data: data,
          tableStartCell: { row: 25, col: 1 },
          rows: [gapRow],
        };
      });
      await exportFromTemplate({
        templateUrl: getMinioUrl("mta/template/GiayMoiHDLV.xlsx"),
        sheets: allSheetOptions ?? [],
        fileName: "GiayMoiHDLV",
        mergeSheetsToOne: true,
        sheetName: "GiayMoiHDLV",
      });
    } catch (error) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại");
    } finally {
      hideSpinner();
    }
  };
  // hàm xử lý xuất file hồ sơ bảo vệ LV
  const hosobvlv = async () => {
    if (!students?.length && !allStudentsInClasses?.length) {
      message.error("Không có dữ liệu để tạo hồ sơ bảo vệ LV");
      return;
    }
    showSpinner();
    try {
      const allSheetOptions = allStudentsInClasses?.map((student) => {
        const thanhvienhoidong =
          student?.thesisRegistrations?.[0]?.thesisProject?.council?.members;
        const phanbien1 = thanhvienhoidong?.find(
          (member) => member.role === CouncilRole.REVIEWER_1
        );
        const phanbien2 = thanhvienhoidong?.find(
          (member) => member.role === CouncilRole.REVIEWER_2
        );
        const chutich = thanhvienhoidong?.find(
          (member) => member.role === CouncilRole.CHAIRMAN
        );
        const thuky = thanhvienhoidong?.find(
          (member) => member.role === CouncilRole.SECRETARY
        );
        const uyvien = thanhvienhoidong?.find(
          (member) => member.role === CouncilRole.MEMBER
        );
        const data = {
          tenhocvien: student.userProfile?.fullname || "",
          type:
            student.thesisRegistrations?.[0]?.thesisProject?.description
              ?.split("-")[1]
              .trim()
              .split(":")[1]
              .trim()
              .toLowerCase() || "",
          khoa: student?.fixedClass?.trainingCourse?.name || "",
          chuyennganh:
            student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
              ?.name || "",
          nganh:
            student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
              ?.trainingField?.name || "",
          detai: student?.thesisRegistrations?.[0]?.thesisProject?.title || "",
          ngaybaove: student?.thesisRegistrations?.[0]?.thesisProject
            ?.defenseDate
            ? dayjs(
                student?.thesisRegistrations?.[0]?.thesisProject?.defenseDate
              ).format("DD/MM/YYYY")
            : "",
          phanbien1: phanbien1?.expert?.name || "",
          phanbien2: phanbien2?.expert?.name || "",
          chutich: chutich?.expert?.name || "",
          thuky: thuky?.expert?.name || "",
          uyvien: uyvien?.expert?.name || "",
        };
        const gapRow: TableRow = {
          cells: [{ value: null, colSpan: 18, border: false }],
        };
        return {
          sheet: `${student.userProfile?.code}`,
          data: data,
          tableStartCell: { row: 104, col: 1 },
          rows: [gapRow],
        };
      });
      await exportFromTemplate({
        templateUrl: getMinioUrl("mta/template/HoSoBVLVTN.xlsx"),
        sheets: allSheetOptions ?? [],
        fileName: "Hosobvlv",
        mergeSheetsToOne: true,
        sheetName: "Hosobvlv",
      });
    } catch (error) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại");
    } finally {
      hideSpinner();
    }
  };
  // hàm xử lý xuất file danh sách bảo vệ LV
  const danhsachbaove = async () => {
    if (!students?.length && !allStudentsInClasses?.length) {
      message.error("Không có dữ liệu để tạo danh sách bảo vệ LV");
      return;
    }
    showSpinner();
    try {
      const row: TableRow[] =
        allStudentsInClasses?.map((student, index) => {
          return {
            cells: [
              { value: index + 1, border: true, align: "center" },
              {
                value:
                  student?.fixedClass?.curriculumVersion?.curriculum
                    ?.trainingMajor?.name || "",
                border: true,
                align: "center",
              },
              {
                value: student?.trainingObjectType?.name || "",
                border: true,
                align: "center",
              },
              {
                value: student.userProfile?.lastName || "",
                border: true,
                align: "center",
              },
              {
                value: student.userProfile?.firstName || "",
                border: true,
                align: "center",
              },
              { value: "", border: true, align: "center" },
              {
                value: student?.thesisRegistrations?.[0]?.thesisProject
                  ?.defenseDate
                  ? dayjs(
                      student?.thesisRegistrations?.[0]?.thesisProject
                        ?.defenseDate
                    ).format("DD/MM/YYYY")
                  : "",
                border: true,
                align: "center",
              },
              {
                value: student?.thesisRegistrations?.[0]?.thesisProject
                  ?.defenseSession?.startTime
                  ? dayjs(
                      student?.thesisRegistrations?.[0]?.thesisProject
                        ?.defenseSession?.startTime
                    ).format("HH:mm")
                  : "",
                border: true,
                align: "center",
              },
              {
                value:
                  student?.thesisRegistrations?.[0]?.thesisProject?.room
                    ?.name || "",
                border: true,
                align: "center",
              },
              { value: "", border: true },
              { value: "", border: true },
              { value: "", border: true },
            ],
          };
        }) ?? [];
      const gapRow: TableRow = {
        cells: [{ value: null, border: false }],
      };
      const totalRow: TableRow = {
        cells: [
          {
            value: `(Tổng số: ${allStudentsInClasses?.length} học viên)`,
            align: "center",
            colSpan: 13,
            border: false,
            bold: true,
          },
        ],
      };
      await exportFromTemplate({
        templateUrl: getMinioUrl("mta/template/DanhSachBaoVe.xlsx"),
        sheets: [
          {
            sheet: "DanhSachBaoVe",
            rows: [...row, gapRow, totalRow],
            tableStartCell: { row: 7, col: 1 },
            data: {
              dotxet: thesisSessionSelected?.name || "",
            },
          },
        ],
        fileName: "DanhSachBaoVe",
      });
    } catch (error) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại");
    } finally {
      hideSpinner();
    }
  };
  // hàm xử lý xuất file thống kê cán bộ hướng dẫn LV
  const thongkecbhdlv = async () => {
    if (!students?.length && !allStudentsInClasses?.length) {
      message.error("Không có dữ liệu để tạo thống kê cán bộ hướng dẫn LV");
      return;
    }
    showSpinner();
    const dataMapping = getExpertSupervisionStats();
    const ngayhientai = dayjs().format("DD/MM/YYYY");
    const ngay = ngayhientai.split("/")[0];
    const thang = ngayhientai.split("/")[1];
    const nam = ngayhientai.split("/")[2];
    const tendot = thesisSessionSelected?.name || "";

    const tenkhoa = "";
    const rows: TableRow[] = dataMapping?.map((item, index) => {
      return {
        cells: [
          { value: index + 1, border: true, align: "center" },
          { value: item.name, border: true, align: "center" },
          { value: item.sDonvi, border: true, align: "center" },
          {
            value: item.GVHD1Student + item.GVHD2Student || 0,
            border: true,
            align: "center",
          },
          { value: 0, border: true, align: "center" },
          { value: item.GVHD1Student, border: true, align: "center" },
          { value: item.GVHD2Student, border: true, align: "center" },
          { value: item.totalPayment, border: true, align: "center" },
          { value: item.stk, border: true, align: "center" },
          { value: item.tennganhang, border: true, align: "center" },
        ],
      };
    });
    const totalRow: TableRow = {
      cells: [
        { value: "", border: true, align: "center" },
        {
          value: "Tổng cộng",
          border: true,
          align: "right",
          colSpan: 2,
          bold: true,
        },
        {
          value: dataMapping?.reduce(
            (acc, item) => acc + item.GVHD1Student + item.GVHD2Student,
            0
          ),
          border: true,
          align: "center",
          bold: true,
        },
        { value: 0, border: true, align: "center", bold: true },
        {
          value: dataMapping?.reduce((acc, item) => acc + item.GVHD1Student, 0),
          border: true,
          align: "center",
          bold: true,
        },
        {
          value: dataMapping?.reduce((acc, item) => acc + item.GVHD2Student, 0),
          border: true,
          align: "center",
          bold: true,
        },
        {
          value: dataMapping?.reduce((acc, item) => acc + item.totalPayment, 0),
          border: true,
          align: "center",
          bold: true,
        },
        { value: "", border: true, align: "center", bold: true },
        { value: "", border: true, align: "center", bold: true },
      ],
    };
    try {
      await exportFromTemplate({
        templateUrl: getMinioUrl("mta/template/ThongKeCanBoHuongDan.xlsx"),
        sheets: [
          {
            sheet: "ThongKeCanBoHuongDan",
            data: {
              tendot: tendot,
              tenkhoa: tenkhoa,
              ngay: ngay,
              thang: thang,
              nam: nam,
            },
            rows: [...rows, totalRow],
            tableStartCell: { row: 10, col: 1 },
          },
        ],
        fileName: "ThongKeCanBoHuongDan",
      });
    } catch (error) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại");
    } finally {
      hideSpinner();
    }
  };

  // hàm xử lý lấy ra danh sách thống kê cán bộ hướng dẫn LV
  const getExpertSupervisionStats = (): ExpertStat[] => {
    if (!allStudentsInClasses || allStudentsInClasses.length === 0) {
      return [];
    }

    const expertStatsMap = new Map<string, ExpertStat>();

    for (const student of allStudentsInClasses) {
      for (const registration of student.thesisRegistrations) {
        const project = registration.thesisProject;

        if (
          !project
          // !project ||
          // !project.supervisorPayments ||
          // project.thesisType !== ThesisType.THESIS
        )
          continue;

        const countedExperts: { [expertId: string]: boolean } = {};

        for (const payment of project.supervisorPayments) {
          if (!payment.expert) continue;

          const expertId = payment.expert.id;
          const paymentAmount =
            Number.parseFloat(payment.amount.toString()) || 0;

          let newStats = expertStatsMap.get(expertId);
          if (!newStats) {
            newStats = {
              expertId: expertId,
              name: payment.expert.name ?? "",
              sDonvi: payment.expert.organization ?? "",
              stk: payment.expert.bankAccountNumber ?? "",
              tennganhang: payment.expert.bankName ?? "",
              GVHD1Student: 0,
              GVHD2Student: 0,
              totalPayment: 0,
            };
            expertStatsMap.set(expertId, newStats);
          }

          newStats.totalPayment += paymentAmount;

          if (!countedExperts[expertId]) {
            if (
              payment.description === "1" &&
              expertId === project.supervisorId
            ) {
              newStats.GVHD1Student += 1;
            } else if (
              payment.description === "2" &&
              expertId === project.coSupervisorId
            ) {
              newStats.GVHD2Student += 1;
            }

            countedExperts[expertId] = true;
          }
        }
      }
    }

    return Array.from(expertStatsMap.values());
  };
  // hàm xử lý tạo dữ liệu mẫu
  const taodulieumau = async () => {
    showSpinner();
    setNeedAllStudents(true);
    const createPromises = allStudentsInClasses?.map(async (student) => {
      const hasThesisRegistration = student.thesisRegistrations?.some(
        (registration) =>
          registration.thesisProject?.thesisType === ThesisType.THESIS
      );

      if (hasThesisRegistration) {
        return null;
      }
      const payload = {
        title: "",
        summary: "",
        titleEN: "",
        maxStudents: 1,
        description: "Ngôn ngữ: Tiếng Việt - Luận án/Đề án: Luận văn",
        thesisSession: {
          connect: {
            id: thesisSessionSelected?.id ?? "",
          },
        },
        thesisType: ThesisType.THESIS,
        librarySubmission: {
          create: {
            isHardcopy: false,
            isSoftcopy: false,
            librarianNote: "",
          },
        },
        council: {
          create: {
            proposedDate: new Date(),
            status: CouncilProposalStatus.PENDING,
          },
        },
        defenseRecord: {
          create: {
            isProfileComplete: false,
          },
        },
      };
      const response = await createThesisProject({
        data: {
          ...payload,
        },
      });
      const payloadRegistration = {
        thesisProjectId: response?.id ?? "",
        studentId: student.id,
      };
      const responseRegistration = await createStudentThesisRegistration({
        data: payloadRegistration,
      });
      return { response, responseRegistration };
    });
    try {
      const validPromises = (createPromises || []).filter((p) => p !== null);
      await Promise.all(validPromises);

      const skippedCount = (createPromises?.length || 0) - validPromises.length;
      if (skippedCount > 0) {
        message.success(
          `Tạo dữ liệu mẫu thành công. Đã bỏ qua ${skippedCount} sinh viên đã có luận văn.`
        );
      } else {
        message.success("Tạo dữ liệu mẫu thành công");
      }
    } catch (error) {
      message.error("Đã xảy ra lỗi trong lúc tạo dữ liệu mẫu");
    } finally {
      hideSpinner();
    }
  };
  // hàm xử lý lấy ra danh sách button
  const buttonList = [
    {
      id: 1,
      label: "Phụ lục ds luận văn",
      onClick: () => defaultButtonClick(),
      disabled: true,
    },
    {
      id: 2,
      label: "Sao QĐ HDLV",
      onClick: async () => await saoQDHDLV(),
    },
    {
      id: 3,
      label: "Giấy mời HDLV",
      onClick: async () => await giaymoihdlv(),
    },
    {
      id: 5,
      label: "Giấy mời chấm LV PB",
      onClick: () => defaultButtonClick(),
      disabled: true,
    },
    {
      id: 6,
      label: "Phụ lục QĐHĐ",
      onClick: () => defaultButtonClick(),
      disabled: true,
    },
    {
      id: 6.1,
      label: "Bản sao HDDGLV",
      onClick: () => defaultButtonClick(),
      disabled: true,
    },
    {
      id: 7,
      label: "Đề xuất hội đồng",
      onClick: () => defaultButtonClick(),
      disabled: true,
    },
    {
      id: 8,
      label: "Hồ sơ BV LV",
      onClick: async () => await hosobvlv(),
    },
    {
      id: 9,
      label: "Danh sách bảo vệ",
      onClick: async () => await danhsachbaove(),
    },
    {
      id: 10,
      label: "Danh sách bảo vệ(Dán PBV)",
      onClick: () => defaultButtonClick(),
      disabled: true,
    },

    {
      id: 12,
      label: "Danh sách chuyên gia",
      onClick: () => defaultButtonClick(),
      disabled: true,
    },

    {
      id: 13,
      label: "Thanh toán hướng dẫn",
      onClick: () => defaultButtonClick(),
      disabled: true,
    },
    {
      id: 13.1,
      label: "Thanh toán hướng dẫn - Ngoài HV",
      onClick: () => defaultButtonClick(),
      disabled: true,
    },
    {
      id: 14,
      label: "Thống kê CBHD LV",
      onClick: async () => await thongkecbhdlv(),
    },
    {
      id: 15,
      label: "Thống kê cán bộ tham gia HĐ",
      onClick: () => defaultButtonClick(),
      disabled: true,
    },
    {
      id: 16,
      label: "Thống kê KQ BV LV",
      onClick: () => defaultButtonClick(),
      disabled: true,
    },
    {
      id: 19,
      label: "Danh sách nộp luận văn thư viện",
      onClick: () => defaultButtonClick(),
      disabled: true,
    },
    {
      id: 11,
      label: "Thanh toán hội đồng bảo vệ",
      onClick: () => defaultButtonClick(),
      disabled: true,
    },
  ];
  // hàm xử lý render component
  return (
    <div>
      <Row gutter={[16, 0]}>
        <Col span={24}>
          <Row gutter={[16, 16]} align="top" justify="space-between">
            <Col span={36}>
              <Flex gap={12}>
                <Form.Item name="searchDotXet" label="Đợt xét" required>
                  <Select
                    className="w-36"
                    options={thesisSessionData?.map((item) => ({
                      label: item.name,
                      value: item.id,
                    }))}
                    onChange={(value) => {
                      setThesisSessionSelected(
                        thesisSessionData?.find((x) => x.id === value) || null
                      );
                      setTrainingCourseSelected(null);
                      setFixedClassesSelected([]);
                    }}
                    placeholder="Chọn đợt xét"
                  />
                </Form.Item>
                <Form.Item name="searchKhoaHoc" label="Khóa học" required>
                  <Select
                    className="w-36"
                    options={
                      trainingCourses?.map((item) => ({
                        label: item.name,
                        value: item.id,
                      })) || []
                    }
                    onChange={(value) => {
                      setTrainingCourseSelected(value as string | null);
                    }}
                    placeholder="Chọn khóa học"
                    disabled={!thesisSessionSelected}
                  />
                </Form.Item>
                <Form.Item name="searchText" label="Lớp học">
                  <Select
                    mode="multiple"
                    className=" w-64"
                    maxTagCount="responsive"
                    maxTagPlaceholder={(omittedValues) =>
                      `+${omittedValues.length}`
                    }
                    options={fixedClasses?.map((x) => {
                      return {
                        label: x.name,
                        value: x.id,
                      };
                    })}
                    onChange={(value) => {
                      setFixedClassesSelected(value as string[]);
                    }}
                    placeholder="Chọn lớp học"
                  />
                </Form.Item>
                <Form.Item name="searchKhoaQuanLy" label="Khoa quản lí">
                  <TreeSelect
                    className="w-80"
                    placeholder="Chọn đơn vị quản lý"
                    allowClear
                    showSearch
                    treeDefaultExpandAll
                    treeData={treeData}
                  />
                </Form.Item>
                <Form.Item className="flex justify-end gap-3">
                  <Button
                    type="primary"
                    onClick={() => {
                      setEditingRowKeys([]);
                      setNeedAllStudents(true);
                      setQueryFixedClasses(fixedClassesSelected);

                      if (!hasClickedFetch) {
                        setHasClickedFetch(true);
                      }
                      console.log("allStudentsInClasses", students);
                    }}
                  >
                    Xem kết quả
                  </Button>
                  {role === "P7" ? (
                    <Popconfirm
                      placement="rightTop"
                      title="Xác nhận tạo dữ liệu mẫu"
                      description="Tạo dữ liệu mẫu sẽ ghi đè lại dữ liệu (nếu có). Bạn có chắc chắn muốn tạo dữ liệu mẫu không?"
                      onConfirm={async () => {
                        setEditingRowKeys([]);
                        setQueryFixedClasses(fixedClassesSelected);
                        if (!hasClickedFetch) {
                          setHasClickedFetch(true);
                        }
                        await taodulieumau();
                      }}
                    >
                      <Button type="primary" className="ml-2">
                        Tạo dữ liệu mẫu
                      </Button>
                    </Popconfirm>
                  ) : null}
                  {editingRowKeys.length > 0 && isManage ? (
                    <>
                      <Button
                        type="default"
                        className="ml-2"
                        onClick={() => {
                          setEditingRowKeys([]);
                          setEditingValues({});
                          message.info("Đã hủy tất cả các thay đổi chưa lưu.");
                        }}
                      >
                        Hủy thay đổi
                      </Button>
                      <Button
                        type="primary"
                        className="ml-2"
                        onClick={handleBatchSave} // Gọi hàm lưu hàng loạt
                      >
                        Lưu thay đổi
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="default"
                      className="ml-2"
                      onClick={handleActivateEdit}
                      disabled={!students?.length}
                    >
                      Chỉnh sửa
                    </Button>
                  )}
                </Form.Item>
              </Flex>
            </Col>
          </Row>
          <Row gutter={[16, 16]}>
            <Col>
              <Flex gap={4} wrap="wrap">
                {buttonList.map((item) => (
                  <Button
                    key={item.id}
                    type="primary"
                    onClick={async () => await item.onClick()}
                    disabled={item.disabled}
                  >
                    {item.id}. {item.label}
                  </Button>
                ))}
              </Flex>
            </Col>
          </Row>
        </Col>

        <Col span={24}>
          <Table
            bordered
            scroll={{ x: "max-content" }}
            className={styles.customTable + " mt-2"}
            rowKey="id"
            columns={[
              {
                title: "Đối tượng đào tạo",
                width: 120,
                fixed: "left",
                render: (_, record) => {
                  return record?.trainingObjectType?.name;
                },
              },
              {
                title: "Đợt xét",
                width: 100,
                render: (_, record) => {
                  return (
                    record?.thesisRegistrations?.[0]?.thesisProject
                      ?.thesisSession?.name || ""
                  );
                },
              },
              {
                title: "Mã sinh viên",
                width: 100,
                fixed: "left",
                render: (_, record) => {
                  return record?.code;
                },
              },
              {
                title: "Họ tên",
                width: 180,
                fixed: "left",
                dataIndex: "name",
                render: (_, record) => {
                  return record?.userProfile?.fullname;
                },
              },
              {
                title: "Ngày sinh",
                width: 130,
                dataIndex: "name",
                render: (_, record) => {
                  return record?.userProfile?.dateOfBirth
                    ? dayjs(record?.userProfile?.dateOfBirth).format(
                        "DD/MM/YYYY"
                      )
                    : "";
                },
              },
              {
                title: "Đề tài",
                width: 200,
                dataIndex: "title",
                render: (_, record) => {
                  const status =
                    record?.thesisRegistrations?.[0]?.thesisProject?.status ||
                    "";
                  if (
                    editingRowKeys.includes(record?.id) &&
                    isManage &&
                    status === ThesisProjectStatus.PROPOSED
                  ) {
                    const currentValue =
                      editingValues[record?.id]?.title !== undefined
                        ? editingValues[record?.id]?.title
                        : record?.thesisRegistrations?.[0]?.thesisProject
                            ?.title || "";

                    return (
                      <div
                        onClick={(e) => e.stopPropagation()} // <-- Thêm dòng này
                      >
                        <TextArea
                          rows={2}
                          value={currentValue}
                          onChange={(e) => {
                            handleEditChange(
                              record?.id,
                              "title",
                              e.target.value
                            );
                          }}
                        />
                      </div>
                    );
                  }
                  return (
                    record?.thesisRegistrations?.[0]?.thesisProject?.title || ""
                  );
                },
              },
              {
                title: "GVHD 1",
                width: 150,
                dataIndex: "supervisor",
                render: (_, record) => {
                  const status =
                    record?.thesisRegistrations?.[0]?.thesisProject?.status ||
                    "";
                  if (
                    editingRowKeys.includes(record?.id) &&
                    isManage &&
                    status === ThesisProjectStatus.PROPOSED
                  ) {
                    const currentValue =
                      editingValues[record?.id]?.supervisor !== undefined
                        ? editingValues[record?.id]?.supervisor
                        : record?.thesisRegistrations?.[0]?.thesisProject
                            ?.supervisor?.name || "";

                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Select
                          className="w-full"
                          options={expertProfileData?.map((item) => ({
                            label: item.name,
                            value: item.id,
                          }))}
                          value={currentValue || ""}
                          onChange={(value) =>
                            handleEditChange(record?.id, "supervisor", value)
                          }
                        />
                      </div>
                    );
                  }
                  return (
                    record?.thesisRegistrations?.[0]?.thesisProject?.supervisor
                      ?.name || ""
                  );
                },
              },
              {
                title: "GVHD 2",
                width: 150,
                dataIndex: "coSupervisor",
                render: (_, record) => {
                  const status =
                    record?.thesisRegistrations?.[0]?.thesisProject?.status ||
                    "";
                  if (
                    editingRowKeys.includes(record?.id) &&
                    isManage &&
                    status === ThesisProjectStatus.PROPOSED
                  ) {
                    const currentValue =
                      editingValues[record?.id]?.coSupervisor !== undefined
                        ? editingValues[record?.id]?.coSupervisor
                        : record?.thesisRegistrations?.[0]?.thesisProject
                            ?.coSupervisor?.name || "";

                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Select
                          className="w-full"
                          options={expertProfileData?.map((item) => ({
                            label: item.name,
                            value: item.id,
                          }))}
                          value={currentValue || ""}
                          onChange={(value) =>
                            handleEditChange(record?.id, "coSupervisor", value)
                          }
                        />
                      </div>
                    );
                  }
                  return (
                    record?.thesisRegistrations?.[0]?.thesisProject
                      ?.coSupervisor?.name || ""
                  );
                },
              },
              {
                title: "Chủ tịch ",
                width: 150,
                dataIndex: "councilChairman",
                render: (_, record) => {
                  const status =
                    record?.thesisRegistrations?.[0]?.thesisProject?.status ||
                    "";
                  if (editingRowKeys.includes(record?.id)) {
                    const currentValue =
                      editingValues[record?.id]?.councilChairman !== undefined
                        ? editingValues[record?.id]?.councilChairman
                        : record?.thesisRegistrations?.[0]?.thesisProject?.council?.members?.find(
                            (member) => member.role === CouncilRole.CHAIRMAN
                          )?.expert?.name || "";
                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Select
                          className="w-full"
                          options={expertProfileData?.map((item) => ({
                            label: item.name,
                            value: item.id,
                          }))}
                          value={currentValue || ""}
                          onChange={(value) =>
                            handleEditChange(
                              record?.id,
                              "councilChairman",
                              value
                            )
                          }
                        />
                      </div>
                    );
                  }
                  return (
                    record?.thesisRegistrations?.[0]?.thesisProject?.council?.members?.find(
                      (member) => member.role === CouncilRole.CHAIRMAN
                    )?.expert?.name || ""
                  );
                },
              },
              {
                title: "Thư ký",
                width: 150,
                dataIndex: "councilSecretary",
                render: (_, record) => {
                  const status =
                    record?.thesisRegistrations?.[0]?.thesisProject?.status ||
                    "";
                  if (editingRowKeys.includes(record?.id)) {
                    const currentValue =
                      editingValues[record?.id]?.councilSecretary !== undefined
                        ? editingValues[record?.id]?.councilSecretary
                        : record?.thesisRegistrations?.[0]?.thesisProject?.council?.members?.find(
                            (member) => member.role === CouncilRole.SECRETARY
                          )?.expert?.name || "";
                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Select
                          className="w-full"
                          options={expertProfileData?.map((item) => ({
                            label: item.name,
                            value: item.id,
                          }))}
                          value={currentValue || ""}
                          onChange={(value) =>
                            handleEditChange(
                              record?.id,
                              "councilSecretary",
                              value
                            )
                          }
                        />
                      </div>
                    );
                  }
                  return (
                    record?.thesisRegistrations?.[0]?.thesisProject?.council?.members?.find(
                      (member) => member.role === CouncilRole.SECRETARY
                    )?.expert?.name || ""
                  );
                },
              },
              {
                title: "Phản biện 1",
                width: 150,
                dataIndex: "reviewer1",
                render: (_, record) => {
                  const status =
                    record?.thesisRegistrations?.[0]?.thesisProject?.status ||
                    "";
                  if (editingRowKeys.includes(record?.id)) {
                    const currentValue =
                      editingValues[record?.id]?.reviewer1 !== undefined
                        ? editingValues[record?.id]?.reviewer1
                        : record?.thesisRegistrations?.[0]?.thesisProject?.council?.members?.find(
                            (member) => member.role === CouncilRole.REVIEWER_1
                          )?.expert?.name || "";
                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Select
                          className="w-full"
                          options={expertProfileData?.map((item) => ({
                            label: item.name,
                            value: item.id,
                          }))}
                          value={currentValue || ""}
                          onChange={(value) =>
                            handleEditChange(record?.id, "reviewer1", value)
                          }
                        />
                      </div>
                    );
                  }
                  return (
                    record?.thesisRegistrations?.[0]?.thesisProject?.council?.members?.find(
                      (member) => member.role === CouncilRole.REVIEWER_1
                    )?.expert?.name || ""
                  );
                },
              },
              {
                title: "Phản biện 2",
                width: 150,
                dataIndex: "reviewer2",
                render: (_, record) => {
                  const status =
                    record?.thesisRegistrations?.[0]?.thesisProject?.status ||
                    "";
                  if (editingRowKeys.includes(record?.id)) {
                    const currentValue =
                      editingValues[record?.id]?.reviewer2 !== undefined
                        ? editingValues[record?.id]?.reviewer2
                        : record?.thesisRegistrations?.[0]?.thesisProject?.council?.members?.find(
                            (member) => member.role === CouncilRole.REVIEWER_2
                          )?.expert?.name || "";
                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Select
                          className="w-full"
                          options={expertProfileData?.map((item) => ({
                            label: item.name,
                            value: item.id,
                          }))}
                          value={currentValue || ""}
                          onChange={(value) =>
                            handleEditChange(record?.id, "reviewer2", value)
                          }
                        />
                      </div>
                    );
                  }
                  return (
                    record?.thesisRegistrations?.[0]?.thesisProject?.council?.members?.find(
                      (member) => member.role === CouncilRole.REVIEWER_2
                    )?.expert?.name || ""
                  );
                },
              },
              {
                title: "Ủy viên",
                width: 150,
                dataIndex: "councilMember",
                render: (_, record) => {
                  const status =
                    record?.thesisRegistrations?.[0]?.thesisProject?.status ||
                    "";
                  if (editingRowKeys.includes(record?.id)) {
                    const currentValue =
                      editingValues[record?.id]?.councilMember !== undefined
                        ? editingValues[record?.id]?.councilMember
                        : record?.thesisRegistrations?.[0]?.thesisProject?.council?.members?.find(
                            (member) => member.role === CouncilRole.MEMBER
                          )?.expert?.name || "";
                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Select
                          className="w-full"
                          options={expertProfileData?.map((item) => ({
                            label: item.name,
                            value: item.id,
                          }))}
                          value={currentValue || ""}
                          onChange={(value) =>
                            handleEditChange(record?.id, "councilMember", value)
                          }
                        />
                      </div>
                    );
                  }
                  return (
                    record?.thesisRegistrations?.[0]?.thesisProject?.council?.members?.find(
                      (member) => member.role === CouncilRole.MEMBER
                    )?.expert?.name || ""
                  );
                },
              },
              {
                title: "Phòng bảo vệ",
                width: 150,
                dataIndex: "room",
                render: (text: string, record: any) => {
                  const status =
                    record?.thesisRegistrations?.[0]?.thesisProject?.status ||
                    "";
                  if (editingRowKeys.includes(record?.id)) {
                    const currentValue =
                      editingValues[record?.id]?.room !== undefined
                        ? editingValues[record?.id]?.room
                        : record?.thesisRegistrations?.[0]?.thesisProject?.room
                            ?.name || "";
                    return (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Select
                          className="w-full"
                          options={roomData?.map((item) => ({
                            label: item.name,
                            value: item.id,
                          }))}
                        />
                      </div>
                    );
                  }

                  return (
                    record?.thesisRegistrations?.[0]?.thesisProject?.room
                      ?.name || ""
                  );
                },
              },
              {
                title: "Ngày bảo vệ",
                width: 150,
                dataIndex: "defenseDate",
                render: (_, record) => {
                  return record?.thesisRegistrations?.[0]?.thesisProject
                    ?.defenseDate
                    ? dayjs(
                        record?.thesisRegistrations?.[0]?.thesisProject
                          ?.defenseDate
                      ).format("DD/MM/YYYY")
                    : "";
                },
              },

              {
                title: "Ca bảo vệ",
                width: 90,
                dataIndex: "defenseSession",
                render: (_, record) => {
                  return record?.thesisRegistrations?.[0]?.thesisProject
                    ?.defenseSession?.startTime
                    ? dayjs(
                        record?.thesisRegistrations?.[0]?.thesisProject
                          ?.defenseSession?.startTime
                      ).format("HH:mm")
                    : "";
                },
              },
              {
                title: "Điểm",
                width: 150,
                align: "center",

                dataIndex: "score",
                render: (_, record) => {
                  return (
                    record?.thesisRegistrations?.[0]?.thesisProject?.defenseRecord?.finalScore?.toString() ||
                    ""
                  );
                },
              },
              {
                title: "Nhận xét",
                width: 150,
                dataIndex: "comments",
                render: (_, record) => {
                  return (
                    record?.thesisRegistrations?.[0]?.thesisProject
                      ?.defenseRecord?.comments || ""
                  );
                },
              },
              {
                title: "Ngôn ngữ",
                width: 100,
                dataIndex: "language",
                render: (_, record) => {
                  if (editingRowKeys.includes(record?.id) && isManage) {
                    const currentValue =
                      editingValues[record?.id]?.language !== undefined
                        ? editingValues[record?.id]?.language
                        : record?.thesisRegistrations?.[0]?.thesisProject?.description
                            ?.split("-")[0]
                            .trim()
                            .split(":")[1] || "";
                    return (
                      <div
                        onClick={(e) => e.stopPropagation()} // <-- Thêm dòng này
                      >
                        <Input
                          value={currentValue || ""}
                          onChange={(e) =>
                            handleEditChange(
                              record?.id,
                              "language",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    );
                  }
                  const data =
                    record?.thesisRegistrations?.[0]?.thesisProject
                      ?.description;
                  return data ? data.split("-")[0].trim().split(":")[1] : "";
                },
              },
              {
                title: "Luận văn/Đề án",
                width: 130,
                dataIndex: "type",
                render: (_, record) => {
                  if (editingRowKeys.includes(record?.id) && isManage) {
                    const currentValue =
                      editingValues[record?.id]?.type !== undefined
                        ? editingValues[record?.id]?.type
                        : record?.thesisRegistrations?.[0]?.thesisProject?.description
                            ?.split("-")[1]
                            .trim()
                            .split(":")[1] || "";
                    return (
                      <div
                        onClick={(e) => e.stopPropagation()} // <-- Thêm dòng này
                      >
                        <Select
                          className="w-full"
                          options={["Luận văn", "Đề án"].map((item) => ({
                            label: item,
                            value: item,
                          }))}
                          value={currentValue || ""}
                          onChange={(value) =>
                            handleEditChange(record?.id, "type", value)
                          }
                        />
                      </div>
                    );
                  }
                  const data =
                    record?.thesisRegistrations?.[0]?.thesisProject
                      ?.description;
                  return data ? data.split("-")[1].trim().split(":")[1] : "";
                },
              },
              {
                title: "Trạng thái",
                width: 100,
                fixed: "right",
                dataIndex: "status",
                render: (_, record) => {
                  if (editingRowKeys.includes(record?.id)) {
                    const currentValue =
                      editingValues[record?.id]?.status !== undefined
                        ? editingValues[record?.id]?.status
                        : record?.thesisRegistrations?.[0]?.thesisProject
                            ?.status || "";
                    return (
                      <div
                        onClick={(e) => e.stopPropagation()} // <-- Thêm dòng này
                      >
                        <Select
                          className="w-full"
                          disabled={role !== "P7"}
                          options={useThesisProjectStatusOptions()
                            .ignoreProjectStatus([ThesisProjectStatus.ASSIGNED])
                            .map((item) => ({
                              label: item.label,
                              value: item.value,
                            }))}
                          value={currentValue || ""}
                          onChange={(value) =>
                            handleEditChange(record?.id, "status", value)
                          }
                        />
                      </div>
                    );
                  }
                  const label = getThesisProjectStatusLabel(
                    record?.thesisRegistrations?.[0]?.thesisProject?.status
                  );
                  const color = getThesisProjectStatusColor(
                    record?.thesisRegistrations?.[0]?.thesisProject?.status
                  );
                  return <Tag color={color}>{label}</Tag>;
                },
              },
              {
                title: "Thao tác",
                width: 100,
                fixed: "right",
                align: "center",
                render: (_, record) => {
                  if (record?.id) {
                    const status =
                      record?.thesisRegistrations?.[0]?.thesisProject?.status ||
                      "";
                    return (
                      <Row className="justify-center gap-2">
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {!isManage &&
                          status === ThesisProjectStatus.APPROVED_BY_DEPT ? (
                            <ApproveIcon
                              title="Phê duyệt"
                              className="text-lg font-bold text-green-700"
                              size={24}
                              onClick={async () => {
                                let status =
                                  record?.thesisRegistrations?.[0]
                                    ?.thesisProject?.status || "";
                                switch (status) {
                                  case ThesisProjectStatus.APPROVED_BY_DEPT:
                                    status = ThesisProjectStatus.IN_PROGRESS;
                                    break;
                                }
                                const payload = {
                                  status: status,
                                };
                                await updateThesisProject({
                                  data: payload,
                                  where: {
                                    id: record?.thesisRegistrations?.[0]
                                      ?.thesisProject?.id,
                                  },
                                });
                              }}
                            />
                          ) : null}
                          {status === ThesisProjectStatus.IN_PROGRESS ? (
                            <ApproveIcon
                              title="Đủ điều kiện bảo vệ"
                              className="text-lg font-bold text-green-700"
                              size={24}
                              onClick={async () => {
                                const payload = {
                                  status: ThesisProjectStatus.DEFENSE_ELIGIBLE,
                                };
                                await updateThesisProject({
                                  data: payload,
                                  where: {
                                    id: record?.thesisRegistrations?.[0]
                                      ?.thesisProject?.id,
                                  },
                                });
                              }}
                            />
                          ) : null}

                          <DeleteIcon
                            title="Xóa"
                            size={24}
                            className="text-lg font-bold text-red-700"
                            onClick={async () => {
                              const payload = {
                                deletedAt: new Date(),
                              };
                              try {
                                showSpinner();
                                await updateThesisProject({
                                  data: payload,
                                  where: {
                                    id:
                                      record?.thesisRegistrations?.[0]
                                        ?.thesisProject?.id || "",
                                  },
                                });
                                message.success("Xóa thành công");
                              } catch (error) {
                                message.error(
                                  "Đã xảy ra lỗi, vui lòng kiểm tra lại"
                                );
                              } finally {
                                hideSpinner();
                              }
                            }}
                          />
                        </div>
                      </Row>
                    );
                  }
                  return "";
                },
              },
            ]}
            data={students || []}
            rowSelection={rowSelection}
            onRow={(record) => ({
              onClick: () => {
                openModalCauHinhLuanVan({
                  thesisProjectId:
                    record?.thesisRegistrations?.[0]?.thesisProject?.id,
                  thesisSessionId: thesisSessionSelected?.id || "",
                });
              },
            })}
            pagination={{
              current: currentPage,
              pageSize: numberOfPages,
              total: countStudent || 0,
              onChange: async (page, pageSize) => {
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
