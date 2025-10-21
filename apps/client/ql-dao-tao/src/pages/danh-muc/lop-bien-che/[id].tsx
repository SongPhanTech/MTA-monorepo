import { SafetyCertificateOutlined } from "@ant-design/icons";
import Table from "@components/commons/table";
import DeleteIcon from "@components/icons/delete";
import ExportStudentInFixedClass from "@components/modal/export-list-student-in-fixedClass";
import { FIXED_CLASS_STUDENT_STATUS } from "@constants/constants";
import type { FilterProps } from "@constants/type";
import useSpinner from "@hooks/spinner";
import DefaultLayout from "@layouts/default-layout";
import type { Student } from "@workspace/db/client";
import {
  useFindManyCurriculumVersion,
  useFindManyDM_GioiTinh,
  useFindManyStudent,
  useFindManyTrainingField,
  useFindManyTrainingMajor,
  useFindUniqueFixedClass,
  useUpdateManyStudent,
  useUpdateStudent,
} from "@workspace/db/hooks";
import { Docxtemplater, exportFile, loadFile } from "@workspace/libs/docxjs";
import { saveAs } from "file-saver";
import { ROUTER_PATH } from "@workspace/router";
import {
  Button,
  Col,
  Divider,
  Dropdown,
  Flex,
  message,
  Popconfirm,
  Row,
  Tag,
  Tooltip,
} from "antd";
import dayjs from "dayjs";
import _ from "lodash";
import { BookCheckIcon } from "lucide-react";
import { useRouter } from "next/router";

import { useCallback, useState } from "react";
import { useDisclosure } from "react-hook-disclosure-modal";
import { useTrainingObjectTypeStore } from "@workspace/ui";
import ExcelTemplateDownloader, {
  IHocKi,
} from "@components/templateExcel/ExcelTemplateDownloader";
import { exportFromTemplate, TableRow } from "@workspace/libs/template-excel";
import { createSimpleExcel, SimpleRowData } from "@workspace/libs/create-excel";

dayjs.locale("vi");

export default function StudentFixedClassPage() {
  const router = useRouter();
  const fixedClassId = router.query.id as string;
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<FilterProps>({
    gender: undefined,
    name: "",
    code: "",
    curriculumVersion: undefined,
    trainingMajors: undefined,
    trainingField: undefined,
    dateOfBirth: undefined,
    phone: undefined,
    statusStudent: undefined,
    rank: undefined,
    curriculumVersionParallel: undefined,
  });
  const { data: trainingMajorData = [] } = useFindManyTrainingMajor({
    orderBy: { name: "asc" },
  });

  const { data: trainingFieldData = [] } = useFindManyTrainingField({
    orderBy: { name: "asc" },
  });

  const { data: curriculumVersionData = [] } = useFindManyCurriculumVersion({
    orderBy: { name: "asc" },
  });

  const { getLabel: getLabelTrainingObjectType } = useTrainingObjectTypeStore();
  const { data: genderData = [] } = useFindManyDM_GioiTinh();

  const { data: fixedClass } = useFindUniqueFixedClass(
    {
      where: {
        id: fixedClassId,
      },
      include: {
        _count: {
          select: {
            students: {
              where: {
                active: true,
                status: "ENROLLED",
              },
            },
          },
        },
        trainingCourse: {
          include: {
            trainingObjectType: true,
          },
        },
        curriculumVersion: {
          include: {
            curriculum: {
              include: {
                trainingMajor: {
                  include: {
                    trainingField: true,
                  },
                },
              },
            },
            trainingBlocks: {
              include: {
                subjects: {
                  include: {
                    subject: {
                      include: {
                        managementOrganization: true,
                      },
                    },
                    trainingBlockOnCurriculumVersion: {
                      select: {
                        trainingBlock: {
                          select: {
                            name: true,
                          },
                        },
                      },
                    },
                  },
                  orderBy: {
                    semester: "asc",
                  },
                },
              },
              orderBy: {
                priority: "asc",
              },
            },
          },
        },
        managementOrganization: true,
      },
    },
    {
      enabled: !!fixedClassId,
    }
  );

  const { data = [], refetch } = useFindManyStudent({
    where: {
      fixedClassId,
      userProfile: {
        OR: [
          {
            firstName: {
              contains: filters.name,
              mode: "insensitive",
            },
          },
          {
            lastName: {
              contains: filters.name,
              mode: "insensitive",
            },
          },
        ],
        ...(filters.rank
          ? {
              rank: {
                sTen: {
                  contains: filters.rank,
                  mode: "insensitive",
                },
              },
            }
          : {}),
        ...(filters.phone
          ? {
              phoneNumber: {
                contains: filters.phone,
                mode: "insensitive",
              },
            }
          : {}),
        ...(filters.gender
          ? {
              genderId: {
                in: filters.gender,
              },
            }
          : {}),
        ...(filters.dateOfBirth?.length === 2
          ? {
              dateOfBirth: {
                gte: dayjs(filters.dateOfBirth?.[0], "DD/MM/YYYY").toDate(),
                lte: dayjs(filters.dateOfBirth?.[1], "DD/MM/YYYY").toDate(),
              },
            }
          : {}),
      },

      ...(filters.code
        ? {
            code: {
              contains: filters.code,
              mode: "insensitive",
            },
          }
        : {}),
      ...(filters.curriculumVersion
        ? {
            curriculumVersionId: {
              in: filters.curriculumVersion,
            },
          }
        : {}),
      ...(filters.statusStudent
        ? {
            status: {
              in: filters.statusStudent,
            },
          }
        : {}),
      ...(filters.curriculumVersionParallel
        ? {
            curriculumVersionParallelId: {
              in: filters.curriculumVersionParallel,
            },
          }
        : {}),
      fixedClass: {
        curriculumVersion: {
          curriculum: {
            trainingMajor: {
              ...(filters.trainingMajors
                ? {
                    id: {
                      in: filters.trainingMajors,
                    },
                  }
                : {}),
              ...(filters.trainingField
                ? {
                    trainingFieldId: {
                      in: filters.trainingField,
                    },
                  }
                : {}),
            },
          },
        },
      },
    },
    include: {
      userProfile: {
        include: {
          rank: true,
        },
      },
      trainingObjectType: {
        include: {
          trainingFields: {
            include: {
              trainingField: true,
            },
          },
          trainingMajors: {
            include: {
              trainingMajor: true,
            },
          },
        },
      },
      fixedClass: {
        include: {
          trainingCourse: true,
          curriculumVersion: {
            include: {
              curriculum: {
                include: {
                  trainingMajor: {
                    include: {
                      trainingField: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      curriculumVersion: {
        include: {
          curriculum: true,
        },
      },
      curriculumVersionParallel: true,
    },
    orderBy: {
      userProfile: {
        firstName: "asc",
      },
    },
  });

  // Dữ liệu mẫu cho Kỳ 1
  const hocKi_1_Data: IHocKi = {
    TenHocKi: "Học kỳ 1 năm học 2024 - 2025",
    SoTinChiKy: 7,
    DiemTBKyHe10: 7.9,
    DiemTBKyHe4: 3.2,
    monHocs: [
      {
        TenMonhoc: "Hình giải tích và Đại số tuyến tính",
        MaMH: "TOAN101",
        soTC: 3,
        diem01: 8.0,
        diem02: 7.5,
        diem07: 8.5,
        diemhe10: 8.2,
        diemhe4: 3.5,
        diemchu: "B+",
        ghichu: "",
      },
      {
        TenMonhoc: "Nhập môn Lập trình",
        MaMH: "IT101",
        soTC: 4,
        diem01: 7.0,
        diem02: 8.0,
        diem07: 7.5,
        diemhe10: 7.6,
        diemhe4: 3.0,
        diemchu: "B",
        ghichu: "",
      },
    ],
  };

  // Dữ liệu mẫu cho Kỳ 2
  const hocKi_2_Data: IHocKi = {
    TenHocKi: "Học kỳ 2 năm học 2024 - 2025",
    SoTinChiKy: 6,
    DiemTBKyHe10: 8.5,
    DiemTBKyHe4: 3.6,
    monHocs: [
      {
        TenMonhoc: "Cấu trúc dữ liệu và Giải thuật",
        MaMH: "IT201",
        soTC: 3,
        diem01: 9.0,
        diem02: 8.0,
        diem07: 8.5,
        diemhe10: 8.6,
        diemhe4: 3.7,
        diemchu: "A",
        ghichu: "",
      },
      {
        TenMonhoc: "Giải tích 2",
        MaMH: "TOAN102",
        soTC: 3,
        diem01: 8.0,
        diem02: 8.0,
        diem07: 9.0,
        diemhe10: 8.4,
        diemhe4: 3.5,
        diemchu: "B+",
        ghichu: "",
      },
    ],
  };

  const sampleStudentData = {
    fullname: "Nguyễn Văn An",
    dateOfBirth: "01/01/2004",
    maSV: "20221234",
    htdt: "Chính quy",
    nganh: "Kỹ thuật phần mềm",
    lop: "KHMT-01",

    hocKis: [hocKi_1_Data, hocKi_2_Data],

    SoTinChiTichLuy: 13,
    DiemTBTichLuyHe10: 8.2,
    DiemTBTichLuyHe4: 3.4,
  };
  const flattenedMonHocs = [];
  for (const hocKi of sampleStudentData.hocKis) {
    for (const monHoc of hocKi.monHocs) {
      flattenedMonHocs.push({
        TenHocKi: hocKi.TenHocKi,
        DiemTBKyHe10_CuaKy: hocKi.DiemTBKyHe10,

        ...monHoc,
      });
    }
  }
  const reportData = {
    // Giữ lại tất cả thông tin sinh viên
    fullname: sampleStudentData.fullname,
    dateOfBirth: sampleStudentData.dateOfBirth,
    maSV: sampleStudentData.maSV,
    nganh: sampleStudentData.nganh,
    lop: sampleStudentData.lop,

    // Giữ lại thông tin tổng kết
    SoTinChiTichLuy: sampleStudentData.SoTinChiTichLuy,
    DiemTBTichLuyHe10: sampleStudentData.DiemTBTichLuyHe10,
    DiemTBTichLuyHe4: sampleStudentData.DiemTBTichLuyHe4,

    // Thay thế 'hocKis' bằng mảng phẳng mới
    danhSachDiem: flattenedMonHocs,
  };

  const debouncedRefetch = useCallback(
    _.debounce(() => {
      refetch();
    }, 500),
    []
  );
  const { onOpen } = useDisclosure<{
    id: string;
  }>({
    tag: "AddStudentToFixedClassModal",
  });

  const { onOpen: onOpenPrint } = useDisclosure<{
    dataTable: Student[];
    dataFixedClass: any;
  }>({
    tag: "ModalPrintToDSHV",
  });

  const { onOpen: onOpenStandardOutput } = useDisclosure<{
    id: string;
  }>({
    tag: "PutChuanDauRaModal",
  });

  // TODO!: anh TUẤN sửa
  // const { onOpen: onOpenUpdate } = useDisclosure<{
  //     tag?: string
  //     preSelectedValues?: {
  //         trainingObjectTypeId?: string
  //         trainingCourseId?: string
  //         fixedClassId?: string
  //     }
  //     id: string | null
  // }>({
  //     tag: 'PutStudentModal',
  // })

  const { showSpinner, hideSpinner } = useSpinner();

  const handleModal = () => {
    onOpen({ id: fixedClassId });
  };

  const handleModalPrint = () => {
    onOpenPrint({ dataFixedClass: fixedClass, dataTable: data });
  };

  const { mutateAsync: updateUserProfile } = useUpdateStudent();
  const { mutateAsync: updateManyUserProfile } = useUpdateManyStudent();
  async function handleDelete(id: string) {
    try {
      showSpinner();
      await updateUserProfile({
        where: {
          id,
        },
        data: {
          fixedClassId: null,
        },
      });
      setSelectedRowKeys([]);
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

  async function handleDeleteMulti() {
    try {
      showSpinner();
      if (selectedRowKeys?.length > 0) {
        await updateManyUserProfile({
          where: {
            id: {
              in: selectedRowKeys,
            },
          },
          data: {
            fixedClassId: null,
          },
        });
      }
      setOpen(false);
      setSelectedRowKeys([]);
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

  const handleCancel = () => {
    setOpen(false);
  };

  const showPopconfirm = () => {
    setOpen(true);
  };

  return (
    <div>
      <Divider orientation="left" orientationMargin={0}>
        {[
          fixedClass?.trainingCourse?.trainingObjectType?.name,
          fixedClass?.trainingCourse?.name,
          fixedClass?.curriculumVersion?.name,
          fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name,
          fixedClass?.curriculumVersion?.curriculum?.trainingMajor
            ?.trainingField?.name,
        ]
          .filter(Boolean)
          .join(" - ")}
      </Divider>
      <Row gutter={[16, 0]}>
        <Col span={24}>
          {/* Row nút thêm */}
          <Row gutter={[8, 8]} align="top" justify="space-between">
            <Col span={12} />

            {/* Hàng chứa các button */}
            <Col xs={12}>
              <Flex justify="end" wrap="wrap" gap="8px" className="mt-1">
                <Dropdown
                  menu={{
                    items: [
                      {
                        label: "CTTK dài hạn",
                        key: "CTTK-dai-han",
                        onClick: async () => {
                          const res = await loadFile(
                            "/lms/templates/chuong-trinh-dao-tao/CTTK-dai-han.docx"
                          );
                          const doc = new Docxtemplater(res, {
                            linebreaks: true,
                            paragraphLoop: true,
                          });
                          await doc.renderAsync({
                            d: dayjs().format("DD"),
                            m: dayjs().format("MM"),
                            y: dayjs().format("YYYY"),
                            TEN_CTDT:
                              fixedClass?.curriculumVersion?.name?.toUpperCase(),
                            KHOA_HOC:
                              fixedClass?.trainingCourse?.name?.toUpperCase(),
                            lop_quan_ly: fixedClass?.name,
                            mon_hoc:
                              fixedClass?.curriculumVersion?.trainingBlocks
                                .flatMap((e) => e.subjects)
                                .map((e, index) => ({
                                  tt: index + 1,
                                  ten_mon: e.subject.name,
                                  trong_so: e.subject.credit,
                                  so_tiet: e.subject.period,
                                  dv_phu_trach:
                                    e.subject?.managementOrganization?.sMa ??
                                    "",
                                  ghi_chu:
                                    e.trainingBlockOnCurriculumVersion?.trainingBlock?.name?.firstCase() ??
                                    "",
                                  ky_1:
                                    e.semester === 1 && e.subject.period
                                      ? e.subject.period
                                      : "",
                                  ky_2:
                                    e.semester === 2 && e.subject.period
                                      ? e.subject.period
                                      : "",
                                  ky_3:
                                    e.semester === 3 && e.subject.period
                                      ? e.subject.period
                                      : "",
                                })),
                            tong_trong_so:
                              fixedClass?.curriculumVersion?.trainingBlocks
                                .flatMap((e) => e.subjects)
                                .reduce(
                                  (total, curr) =>
                                    total + (curr.subject.credit || 0),
                                  0
                                ),
                            tong_so_tiet:
                              fixedClass?.curriculumVersion?.trainingBlocks
                                ?.flatMap((e) => e.subjects)
                                .reduce(
                                  (total, curr) =>
                                    total + (curr.subject.period || 0),
                                  0
                                ),
                            tong_ky_1:
                              fixedClass?.curriculumVersion?.trainingBlocks
                                .flatMap((e) => e.subjects)
                                .reduce(
                                  (total, curr) =>
                                    total +
                                    (curr.semester === 1
                                      ? curr.subject.period || 0
                                      : 0),
                                  0
                                ),
                            tong_ky_2:
                              fixedClass?.curriculumVersion?.trainingBlocks
                                .flatMap((e) => e.subjects)
                                .reduce(
                                  (total, curr) =>
                                    total +
                                    (curr.semester === 2
                                      ? curr.subject.period || 0
                                      : 0),
                                  0
                                ),
                            tong_ky_3:
                              fixedClass?.curriculumVersion?.trainingBlocks
                                .flatMap((e) => e.subjects)
                                .reduce(
                                  (total, curr) =>
                                    total +
                                    (curr.semester === 3
                                      ? curr.subject.period || 0
                                      : 0),
                                  0
                                ),
                          });
                          const blob = exportFile(doc.getZip());
                          saveAs(
                            blob,
                            `CTTK-dai-han.${dayjs().format("DDMMYY")}.docx`
                          );
                        },
                      },
                      {
                        label: "CTTK ngắn hạn",
                        key: "CTTK-ngan-han",
                        onClick: async () => {
                          const res = await loadFile(
                            "/lms/templates/chuong-trinh-dao-tao/CTTK-ngan-han.docx"
                          );
                          const doc = new Docxtemplater(res, {
                            linebreaks: true,
                            paragraphLoop: true,
                          });
                          await doc.renderAsync({
                            d: dayjs().format("DD"),
                            m: dayjs().format("MM"),
                            y: dayjs().format("YYYY"),
                            TEN_CTDT:
                              fixedClass?.curriculumVersion?.name?.toUpperCase(),
                            KHOA_HOC:
                              fixedClass?.trainingCourse?.name?.toUpperCase(),
                            lop_quan_ly: fixedClass?.name,
                            mon_hoc:
                              fixedClass?.curriculumVersion?.trainingBlocks
                                .flatMap((e) => e.subjects)
                                .map((e, index) => ({
                                  tt: index + 1,
                                  ten_mon: e.subject.name,
                                  trong_so: e.subject.credit,
                                  so_tiet: e.subject.period,
                                  dv_phu_trach:
                                    e.subject?.managementOrganization?.sMa ??
                                    "",
                                  ghi_chu:
                                    e.trainingBlockOnCurriculumVersion?.trainingBlock?.name?.firstCase() ??
                                    "",
                                  ky_1:
                                    e.semester === 1 && e.subject.period
                                      ? e.subject.period
                                      : "",
                                  ky_2:
                                    e.semester === 2 && e.subject.period
                                      ? e.subject.period
                                      : "",
                                })),
                            tong_trong_so:
                              fixedClass?.curriculumVersion?.trainingBlocks
                                .flatMap((e) => e.subjects)
                                .reduce(
                                  (total, curr) =>
                                    total + (curr.subject.credit || 0),
                                  0
                                ),
                            tong_so_tiet:
                              fixedClass?.curriculumVersion?.trainingBlocks
                                ?.flatMap((e) => e.subjects)
                                .reduce(
                                  (total, curr) =>
                                    total + (curr.subject.period || 0),
                                  0
                                ),
                            tong_ky_1:
                              fixedClass?.curriculumVersion?.trainingBlocks
                                .flatMap((e) => e.subjects)
                                .reduce(
                                  (total, curr) =>
                                    total +
                                    (curr.semester === 1
                                      ? curr.subject.period || 0
                                      : 0),
                                  0
                                ),
                            tong_ky_2:
                              fixedClass?.curriculumVersion?.trainingBlocks
                                .flatMap((e) => e.subjects)
                                .reduce(
                                  (total, curr) =>
                                    total +
                                    (curr.semester === 2
                                      ? curr.subject.period || 0
                                      : 0),
                                  0
                                ),
                          });
                          const blob = exportFile(doc.getZip());
                          saveAs(
                            blob,
                            `CTTK-ngan-han.${dayjs().format("DDMMYY")}.docx`
                          );
                        },
                      },
                      {
                        label: "KHTK định hướng nghiên cứu",
                        key: "KHTK-ding-huong-nghien-cuu",
                        onClick: async () => {
                          const res = await loadFile(
                            "/lms/templates/chuong-trinh-dao-tao/KHTK-ding-huong-nghien-cuu.docx"
                          );
                          const doc = new Docxtemplater(res, {
                            linebreaks: true,
                            paragraphLoop: true,
                          });
                          await doc.renderAsync({
                            d: dayjs().format("DD"),
                            m: dayjs().format("MM"),
                            y: dayjs().format("YYYY"),
                            HE: getLabelTrainingObjectType(
                              fixedClass?.trainingCourse.trainingObjectType.type
                            ).toUpperCase(),
                            KHOA_HOC:
                              fixedClass?.trainingCourse?.name?.toUpperCase(),
                            ten_lop: fixedClass?.name,
                            chuyen_nganh:
                              fixedClass?.curriculumVersion?.curriculum
                                ?.trainingMajor?.name ?? "",
                            ma_nganh:
                              fixedClass?.curriculumVersion?.curriculum
                                ?.trainingMajor?.code ?? "",
                            quan_so: fixedClass?._count.students ?? 0,
                            mon_hoc:
                              fixedClass?.curriculumVersion?.trainingBlocks
                                .flatMap((e) => e.subjects)
                                .map((e, index) => ({
                                  tt: index + 1,
                                  ten_mon: e.subject.name,
                                  trong_so: e.subject.credit,
                                  so_tiet: e.subject.period,
                                  dv_phu_trach:
                                    e.subject?.managementOrganization?.sMa ??
                                    "",
                                  ghi_chu:
                                    e.trainingBlockOnCurriculumVersion?.trainingBlock?.name?.firstCase() ??
                                    "",
                                  ky_1:
                                    e.semester === 1 && e.subject.period
                                      ? e.subject.period
                                      : "",
                                  ky_2:
                                    e.semester === 2 && e.subject.period
                                      ? e.subject.period
                                      : "",
                                  ky_3:
                                    e.semester === 3 && e.subject.period
                                      ? e.subject.period
                                      : "",
                                  ky_4:
                                    e.semester === 4 && e.subject.period
                                      ? e.subject.period
                                      : "",
                                })),
                            tong_trong_so:
                              fixedClass?.curriculumVersion?.trainingBlocks
                                .flatMap((e) => e.subjects)
                                .reduce(
                                  (total, curr) =>
                                    total + (curr.subject.credit || 0),
                                  0
                                ),
                            tong_so_tiet:
                              fixedClass?.curriculumVersion?.trainingBlocks
                                ?.flatMap((e) => e.subjects)
                                .reduce(
                                  (total, curr) =>
                                    total + (curr.subject.period || 0),
                                  0
                                ),
                            tong_ky_1:
                              fixedClass?.curriculumVersion?.trainingBlocks
                                .flatMap((e) => e.subjects)
                                .reduce(
                                  (total, curr) =>
                                    total +
                                    (curr.semester === 1
                                      ? curr.subject.period || 0
                                      : 0),
                                  0
                                ),
                            tong_ky_2:
                              fixedClass?.curriculumVersion?.trainingBlocks
                                .flatMap((e) => e.subjects)
                                .reduce(
                                  (total, curr) =>
                                    total +
                                    (curr.semester === 2
                                      ? curr.subject.period || 0
                                      : 0),
                                  0
                                ),
                            tong_ky_3:
                              fixedClass?.curriculumVersion?.trainingBlocks
                                .flatMap((e) => e.subjects)
                                .reduce(
                                  (total, curr) =>
                                    total +
                                    (curr.semester === 3
                                      ? curr.subject.period || 0
                                      : 0),
                                  0
                                ),
                            tong_ky_4:
                              fixedClass?.curriculumVersion?.trainingBlocks
                                .flatMap((e) => e.subjects)
                                .reduce(
                                  (total, curr) =>
                                    total +
                                    (curr.semester === 4
                                      ? curr.subject.period || 0
                                      : 0),
                                  0
                                ),
                          });
                          const blob = exportFile(doc.getZip());
                          saveAs(
                            blob,
                            `KHTK-ding-huong-nghien-cuu.${dayjs().format(
                              "DDMMYY"
                            )}.docx`
                          );
                        },
                      },
                      {
                        label: "KHTK định hướng ứng dụng",
                        key: "KHTK-ding-huong-ung-dung",
                        onClick: async () => {
                          const res = await loadFile(
                            "/lms/templates/chuong-trinh-dao-tao/KHTK-ding-huong-ung-dung.docx"
                          );
                          const doc = new Docxtemplater(res, {
                            linebreaks: true,
                            paragraphLoop: true,
                          });
                          await doc.renderAsync({
                            d: dayjs().format("DD"),
                            m: dayjs().format("MM"),
                            y: dayjs().format("YYYY"),
                            HE: getLabelTrainingObjectType(
                              fixedClass?.trainingCourse.trainingObjectType.type
                            ).toUpperCase(),
                            KHOA_HOC:
                              fixedClass?.trainingCourse?.name?.toUpperCase(),
                            ten_lop: fixedClass?.name,
                            chuyen_nganh:
                              fixedClass?.curriculumVersion?.curriculum
                                ?.trainingMajor?.name ?? "",
                            ma_nganh:
                              fixedClass?.curriculumVersion?.curriculum
                                ?.trainingMajor?.code ?? "",
                            quan_so: fixedClass?._count.students ?? 0,
                            mon_hoc:
                              fixedClass?.curriculumVersion?.trainingBlocks
                                .flatMap((e) => e.subjects)
                                .map((e, index) => ({
                                  tt: index + 1,
                                  ten_mon: e.subject.name,
                                  trong_so: e.subject.credit,
                                  so_tiet: e.subject.period,
                                  dv_phu_trach:
                                    e.subject?.managementOrganization?.sMa ??
                                    "",
                                  ghi_chu:
                                    e.trainingBlockOnCurriculumVersion?.trainingBlock?.name?.firstCase() ??
                                    "",
                                  ky_1:
                                    e.semester === 1 && e.subject.period
                                      ? e.subject.period
                                      : "",
                                  ky_2:
                                    e.semester === 2 && e.subject.period
                                      ? e.subject.period
                                      : "",
                                  ky_3:
                                    e.semester === 3 && e.subject.period
                                      ? e.subject.period
                                      : "",
                                  ky_4:
                                    e.semester === 4 && e.subject.period
                                      ? e.subject.period
                                      : "",
                                })),
                            tong_trong_so:
                              fixedClass?.curriculumVersion?.trainingBlocks
                                .flatMap((e) => e.subjects)
                                .reduce(
                                  (total, curr) =>
                                    total + (curr.subject.credit || 0),
                                  0
                                ),
                            tong_so_tiet:
                              fixedClass?.curriculumVersion?.trainingBlocks
                                ?.flatMap((e) => e.subjects)
                                .reduce(
                                  (total, curr) =>
                                    total + (curr.subject.period || 0),
                                  0
                                ),
                            tong_ky_1:
                              fixedClass?.curriculumVersion?.trainingBlocks
                                .flatMap((e) => e.subjects)
                                .reduce(
                                  (total, curr) =>
                                    total +
                                    (curr.semester === 1
                                      ? curr.subject.period || 0
                                      : 0),
                                  0
                                ),
                            tong_ky_2:
                              fixedClass?.curriculumVersion?.trainingBlocks
                                .flatMap((e) => e.subjects)
                                .reduce(
                                  (total, curr) =>
                                    total +
                                    (curr.semester === 2
                                      ? curr.subject.period || 0
                                      : 0),
                                  0
                                ),
                            tong_ky_3:
                              fixedClass?.curriculumVersion?.trainingBlocks
                                .flatMap((e) => e.subjects)
                                .reduce(
                                  (total, curr) =>
                                    total +
                                    (curr.semester === 3
                                      ? curr.subject.period || 0
                                      : 0),
                                  0
                                ),
                            tong_ky_4:
                              fixedClass?.curriculumVersion?.trainingBlocks
                                .flatMap((e) => e.subjects)
                                .reduce(
                                  (total, curr) =>
                                    total +
                                    (curr.semester === 4
                                      ? curr.subject.period || 0
                                      : 0),
                                  0
                                ),
                          });
                          const blob = exportFile(doc.getZip());
                          saveAs(
                            blob,
                            `KHTK-ding-huong-ung-dung.${dayjs().format(
                              "DDMMYY"
                            )}.docx`
                          );
                        },
                      },
                    ],
                  }}
                >
                  <Button type="primary">Xuất mẫu</Button>
                </Dropdown>
                <Popconfirm
                  title="Xác nhận xóa dữ liệu?"
                  description="Bạn có chắc chắn muốn xoá những sinh viên đã chọn ra khỏi lớp này không?"
                  open={open}
                  onConfirm={handleDeleteMulti}
                  onCancel={handleCancel}
                >
                  <Button
                    disabled={selectedRowKeys?.length <= 0}
                    onClick={showPopconfirm}
                    type="primary"
                  >
                    {selectedRowKeys?.length > 0 && (
                      <span>({selectedRowKeys?.length})</span>
                    )}
                    Xoá SV khỏi lớp
                  </Button>
                </Popconfirm>
                <ExportStudentInFixedClass
                  data={data}
                  fixedClassName={`${fixedClass?.name}_${fixedClass?.trainingCourse?.name}`}
                />
            
                  <Button type="primary" 
                  onClick={() => {
                    const tableRows = sampleStudentData.hocKis.flatMap((hocKi) => {
                        // Dòng môn học
                        const monHocRows: TableRow[] = hocKi.monHocs.map((monHoc, index) => ({
                          cells: [
                            { value: index + 1 },
                            { value: monHoc.TenMonhoc, colSpan: 6, border: true }, // Có viền (mặc định)
                            { value: monHoc.MaMH },
                            { value: monHoc.soTC, align: 'center' },
                            { value: monHoc.diem01, align: 'right' },
                            { value: monHoc.diem02, align: 'right' },
                            { value: monHoc.diem07, align: 'right' },
                            { value: null },
                            { value: null },
                            { value: monHoc.diemhe10, align: 'right' },
                            { value: monHoc.diemhe4, align: 'right' },
                            { value: monHoc.diemchu, align: 'center' },
                            { value: null },
                            { value: monHoc.ghichu },
                          ]
                        }));
                  
                        // Dòng trung bình học kỳ
                        const trungBinhRow: TableRow = {
                          cells: [
                            { value: null },
                            { value: 'Điểm trung bình học kỳ:', colSpan: 6, bold: true, align: 'center' },
                            { value: null }, // Cột 7
                            { value: hocKi.SoTinChiKy, bold: true, align: 'center' }, // Cột 8
                            { value: null }, // Cột 9
                            { value: null }, // Cột 10
                            { value: null }, // Cột 11
                            { value: null }, // Cột 12
                            { value: null }, // Cột 13
                            { value: hocKi.DiemTBKyHe10, bold: true, align: 'right' }, // Cột 14
                            { value: hocKi.DiemTBKyHe4, bold: true, align: 'right' }, // Cột 15
                            { value: null }, // Cột 16
                            { value: null }, // Cột 17
                            { value: null }, // Cột 18
                          ]
                        };
                        
                        return [...monHocRows, trungBinhRow];
                      });
                  

                      const gapRow: TableRow = {
                        cells: [{ value: null, colSpan: 18, border: false }]
                      };
                  

                      const dateSignatureRow: TableRow = {
                        cells: [
                          { value: null, colSpan: 12, border: false }, // Ô trống bên trái
                          { 
                            value: 'Hà Nội, ngày ... tháng ... năm 20...', 
                            colSpan: 6, 
                            border: false, 
                            align: 'center' 
                          } 
                        ]
                      };
                      
                      const titleSignatureRow: TableRow = {
                        cells: [
                          { value: null, colSpan: 12, border: false },
                          { 
                            value: '  KT. TRƯỞNG PHÒNG \n PHÓ TRƯỞNG PHÒNG', 
                            colSpan: 6, 
                            border: false, 
                            align: 'center',
                            bold: true,
                          } 
                        ]
                      };
                      const nameSignatureRow: TableRow = {
                        cells: [
                          { value: null, colSpan: 12, border: false }, // Ô trống bên trái
                          { 
                            value: 'Đại tá, TS Nguyễn Văn Bình												', 
                            colSpan: 6, 
                            border: false, 
                            align: 'center' ,
                            bold: true
                          } 
                        ]
                      };
                    exportFromTemplate({
                      templateUrl: "/lms/templates/chuong-trinh-dao-tao/quatrinh.xlsx",
                      sheets: [
                        {
                          sheet: "BaoCaoDiem",
                          data: {
                            fullname: sampleStudentData.fullname,
                            dateOfBirth: sampleStudentData.dateOfBirth,
                            htdt: sampleStudentData.htdt,
                            maSV: sampleStudentData.maSV,
                            nganh: sampleStudentData.nganh,
                            lop: sampleStudentData.lop,
                          },
                          tableStartCell: { row: 11, col: 1 },
                          rows: [
                            ...tableRows,   
                            gapRow,         
                            gapRow,         
                            dateSignatureRow, 
                            titleSignatureRow, 

                            gapRow,
                            gapRow,
                            nameSignatureRow
                          ],
                          hiddenColumns: ['M', 'N', 'R']
                        },
                      ],
                      fileName: `quatrinh-${sampleStudentData.fullname}.xlsx`,
                    });
                  }}
                  >Xuất mẫu</Button>
                  {/* <Button type="primary"
                  onClick={ 
                    async () => {
                        const handleExport = async () => {

                            // 1. Chuẩn bị dữ liệu
                            const myRows: SimpleRowData[] = [
                                // Hàng 1: Tiêu đề gộp cột
                                {
                                    cells: [
                                        { 
                                            value: 'BÁO CÁO DOANH THU QUÝ 1', 
                                            merge: { colSpan: 3 }, // ✅ Gộp 3 cột
                                            font: { bold: true, size: 16 },
                                            alignment: { horizontal: 'center' }
                                        },
                                        { value: null }, // Ô này bị gộp, để null
                                        { value: null }  // Ô này bị gộp, để null
                                    ],
                                    height: 30
                                },
                                // Hàng 2: Tiêu đề bảng
                                {
                                    cells: [
                                        { value: 'Sản phẩm', font: { bold: true }, fill: { bgColor: 'FFEEEEEE' }, border: true },
                                        { value: 'Số lượng', font: { bold: true }, fill: { bgColor: 'FFEEEEEE' }, border: true },
                                        { value: 'Doanh thu', font: { bold: true }, fill: { bgColor: 'FFEEEEEE' }, border: true }
                                    ]
                                },
                                // Hàng 3: Dữ liệu
                                {
                                    cells: [
                                        { value: 'Sản phẩm A', border: true },
                                        { value: 150, border: true },
                                        { 
                                            value: 15000000, 
                                            border: true,
                                            font: { color: 'FF00FF00' } // ✅ Chữ màu xanh lá
                                        }
                                    ]
                                },
                                // Hàng 4: Dữ liệu
                                {
                                    cells: [
                                        { value: 'Sản phẩm B', border: true },
                                        { value: 80, border: true },
                                        { 
                                            value: 8000000, 
                                            border: true,
                                            font: { color: 'FFFF0000' } // ✅ Chữ màu đỏ
                                        }
                                    ]
                                }
                            ];
                        
                            // 2. Gọi hàm xuất file
                            await createSimpleExcel({
                                sheetName: 'DoanhThuQ1',
                                fileName: 'BaoCaoQuy1.xlsx',
                                rows: myRows
                            });
                        
                            console.log('Xuất file thành công!');
                        };
                  }
                }
                  
                  >Xuất file excel</Button>  */}
                
                <Button onClick={handleModalPrint} type="primary">
                  In danh sách
                </Button>
                <Button onClick={handleModal} type="primary">
                  Thêm SV
                </Button>
                {/* <Dropdown overlay={menuDownload} trigger={['hover']}>
                                    <Button type="primary" icon={<DownloadOutlined />}>
                                        Tải file mẫu
                                    </Button>
                                </Dropdown>
                                <Dropdown overlay={menuUpload} trigger={['hover']}>
                                    <Button type="primary" icon={<UploadOutlined />}>
                                        Nhập file
                                    </Button>
                                </Dropdown> */}
              </Flex>
            </Col>
          </Row>
        </Col>
        <Col span={24}>
          <Table
            rowKey="id"
            rowSelection={{
              selectedRowKeys,
              onChange: (selectedKeys: any) => setSelectedRowKeys(selectedKeys),
            }}
            filters={filters}
            setFilters={setFilters}
            columns={[
              {
                title: "STT",
                width: 60,
                align: "center",
                fixed: "left",
                render: (_, __, index) => index + 1,
              },
              {
                title: "Mã sinh viên",
                dataIndex: "code",
                fixed: "left",
                width: 150,
                align: "center",
                type: "input",
              },
              {
                title: "Họ và tên",
                width: 150,
                fixed: "left",
                align: "center",
                type: "input",
                dataIndex: "name",
                render: (__, record) =>
                  record.userProfile
                    ? `${record.userProfile.lastName} ${record.userProfile.firstName}`
                    : "",
              },
              {
                title: "Ngày sinh",
                align: "center",
                width: 150,
                dataIndex: "dateOfBirth",
                type: "date",
                render: (__, record) =>
                  record.userProfile?.dateOfBirth
                    ? dayjs(record.userProfile.dateOfBirth).format("DD/MM/YYYY")
                    : "",
              },
              {
                title: "Giới tính",
                align: "center",
                width: 120,
                type: "select",
                dataIndex: "gender",
                // options: [
                //     { label: 'Nam', value: 'Male' },
                //     { label: 'Nữ', value: 'Female' },
                // ],
                options: genderData.map((i) => ({
                  label: i.sTen,
                  value: i.Id,
                })),

                render: (__, record) =>
                  record?.userProfile?.gender
                    ? record?.userProfile?.gender?.sTen
                    : "",
              },
              {
                title: "SĐT",
                align: "center",
                width: 120,
                dataIndex: "phone",
                type: "input",
                render: (__, record) =>
                  record.userProfile?.phoneNumber
                    ? record.userProfile?.phoneNumber
                    : "",
              },
              {
                title: "Cấp bậc",
                align: "center",
                width: 120,
                dataIndex: "rank",
                type: "input",
                render: (__, record) =>
                  record.userProfile?.rank?.sTen
                    ? record.userProfile?.rank?.sTen
                    : "",
              },
              {
                title: "Ngành",
                width: 150,
                align: "center",
                type: "select",
                dataIndex: "trainingField",
                options: trainingFieldData.map((item) => ({
                  label: item.name,
                  value: item.id,
                })),
                render: (__, record) => {
                  return (
                    record?.fixedClass?.curriculumVersion?.curriculum
                      ?.trainingMajor?.trainingField?.name || ""
                  );
                },
              },
              {
                title: "Chuyên ngành",
                width: 180,
                align: "center",
                type: "select",
                dataIndex: "trainingMajors",
                options: trainingMajorData.map((item) => ({
                  label: item.name,
                  value: item.id,
                })),
                render: (__, record) => {
                  return (
                    record?.fixedClass?.curriculumVersion?.curriculum
                      ?.trainingMajor?.name || ""
                  );
                },
              },
              {
                title: "Chương trình đào tạo",
                width: 250,
                align: "center",
                dataIndex: "curriculumVersion",
                type: "select",
                options: curriculumVersionData.map((item) => ({
                  label: item.name,
                  value: item.id,
                })),
                render: (__, record) => {
                  const curriculum = record.curriculumVersion;
                  return curriculum ? curriculum.name : "";
                },
              },
              {
                title: "CTĐT song song",
                width: 200,
                align: "center",
                dataIndex: "curriculumVersionParallel",
                type: "select",
                options: curriculumVersionData.map((item) => ({
                  label: item.name,
                  value: item.id,
                })),
                render: (__, record) => {
                  const curriculum = record.curriculumVersionParallel;
                  return curriculum ? curriculum.name : "";
                },
              },
              {
                title: "Trạng thái",
                align: "center",
                width: 120,
                type: "select",
                dataIndex: "status",
                options: Object.entries(FIXED_CLASS_STUDENT_STATUS).map(
                  ([value, item]) => ({
                    label: item.label,
                    value,
                  })
                ),
                render: (_, record) => {
                  const statusInfo =
                    FIXED_CLASS_STUDENT_STATUS[
                      record.status as keyof typeof FIXED_CLASS_STUDENT_STATUS
                    ];
                  return statusInfo ? (
                    <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
                  ) : (
                    <Tag color="default">Không xác định</Tag>
                  );
                },
              },
              {
                title: "Thao tác",
                width: 100,
                align: "center",
                fixed: "right",
                render: (_, { id }) => (
                  <Row className="justify-center gap-2">
                    <Tooltip title="Kết quả học tập">
                      <BookCheckIcon
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(
                            ROUTER_PATH.QL_DAO_TAO.DANH_MUC_LOP_BIEN_CHE_KET_QUA_HOC_TAP_ID.replace(
                              "[id]",
                              id
                            )
                          );
                        }}
                        size={16}
                      />
                    </Tooltip>
                    <Tooltip title="Chuẩn đầu ra">
                      <SafetyCertificateOutlined
                        onClick={() => onOpenStandardOutput(id)}
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
            scroll={{ x: "max-content" }}
            pagination={false}
          />
        </Col>
      </Row>
    </div>
  );
}

StudentFixedClassPage.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <DefaultLayout
      breadcrumbList={[
        { title: "Danh mục" },
        {
          title: "Lớp quản lý",
          href: ROUTER_PATH.QL_DAO_TAO.DANH_MUC_LOP_BIEN_CHE,
        },
        { title: "Chi tiết lớp quản lý" },
      ]}
    >
      {page}
    </DefaultLayout>
  );
};
