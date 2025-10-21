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
import { exportFromTemplate } from "@workspace/libs/template-excel";

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

  
      const handleExportBangDiem = () => {
          showSpinner();
          try {
              // 1. Dữ liệu mẫu (Giữ nguyên)
              const reportData = {
                khoa: "KẾT QUẢ ĐÀO TẠO TOÀN KHÓA 35",
                chuyenNganh: "8 52 03 01_01 - Kỹ thuật hoá học",
                lop: "KTHH-NC-35",
                students: [
                  { stt: 1, hoTen: "Vũ Đức Anh", ngaySinh: "08/03/1995", doiTuong: "QS", diem: [7.6, 7.8, 8.1, 8.3, 9.3, 6.2, 7.1, 8.3, "0/10", 8.3, 7.8, 8.3, 8.2, 7.6, 8.4, 9, 7.8, 6.9, 8.1, 9, 8, 8.5, null], ccta: null, tbc: 8.19, dlv: 8.7 },
                  { stt: 2, hoTen: "Hà Huy Hưng", ngaySinh: "07/01/1997", doiTuong: "QS", diem: [8, 8.3, 8.7, 8.2, 8.9, 7.8, 6.9, 8.7, "0/10", 7.8, 7.2, 8.3, 7.8, 9, 9, 8.6, 7.9, 7.4, 9, 8.5, 8, 9, null], ccta: null, tbc: 8.34, dlv: 8.7 },
                  { stt: 3, hoTen: "Trần Tiến Tùng", ngaySinh: "09/10/1994", doiTuong: "QS", diem: [8.4, 8, 8.2, 8.4, 9, 7, 7.5, 8.6, "0/10", 7.2, 7.2, 8.7, 7.6, 7.3, 8.1, 8.3, 7.5, 7.1, 8.4, 9.5, 7.5, 8.5, null], ccta: null, tbc: 8.15, dlv: 9.2 },
                  { stt: 4, hoTen: "Vũ Văn Tùng", ngaySinh: "18/05/1994", doiTuong: "QS", diem: [9, 8.1, 8.5, 8.4, 9, 7, 7.4, 8.4, "0/10", 8.3, 7.5, 8.7, 8.4, 8.7, 8.7, 9, 7.7, 7.2, 8.4, 8.5, 8.5, 9, null], ccta: null, tbc: 8.43, dlv: 8.5 }
                ],
                tongSoHP: 22,
                tongSoTC: 53,
              };
  
              // 2. Chuyển đổi JSON thành TableRow[]
              const studentRows = reportData.students.map(student => ({
                cells: [
                  { value: student.stt, align: 'center' as const, border: true },
                  { value: student.hoTen, border: true },
                  { value: student.ngaySinh, align: 'center' as const, border: true },
                  { value: student.doiTuong, align: 'center' as const, border: true },
                  ...student.diem.map(d => ({ 
                      value: d !== null ? String(d) : null,
                      align: 'right' as const, 
                      border: true 
                  })),
                  { value: student.ccta !== null ? String(student.ccta) : null, align: 'right' as const, border: true },
                  { value: student.tbc !== null ? String(student.tbc) : null, align: 'right' as const, border: true, bold: true },
                  { value: student.dlv !== null ? String(student.dlv) : null, align: 'right' as const, border: true, bold: true },
                ]
              }));
  
              const totalCell = [{ cells: [{ value: `Tổng số học phần: ${reportData.tongSoHP} HP, tổng số tín chỉ: ${reportData.tongSoTC} TC.`, border: false, colSpan: 10, bold:true }]}];
  
              // === PHẦN MỚI 1: TẠO CHÚ THÍCH MÔN HỌC (3 CỘT) ===
              const chuthichMonHoc = [
                  "M1. Các phương pháp vật lý và hoá lý trong nghiên cứu vật chất",
                  "M2. Công nghệ xử lý môi trường.",
                  "M3. Hoá học chất rắn",
                  "M4. Nhiệt động học và động học trong hoá kỹ thuật",
                  "M5. Những vấn đề hiện đại trong hoá học hữu cơ",
                  "M6. Những vấn đề hiện đại trong hoá học vô cơ",
                  "M7. Phương pháp luận nghiên cứu khoa học",
                  "M8. Quá trình và thiết bị chuyển khối - truyền nhiệt",
                  "M9. Tiếng Anh",
                  "M10. Tin học trong công nghệ hoá học",
                  "M11. Triết học",
                  "M12. Vật liệu chuyên dụng",
                  "M13. Chỉ huy, quản lý kỹ thuật quân sự",
                  "M14. Hóa lý bề mặt",
                  "M15. Năng lượng tái tạo",
                  "M16. Công nghệ vật liệu polyme-composite nâng cao",
                  "M17. Hóa học và công nghệ nitroxenlulo",
                  "M18. Các phương pháp quang phổ và sắc kí trong phân tích",
                  "M19. Kỹ thuật điện hóa và ứng dụng",
                  "M20. Chuyên đề nghiên cứu 2 (KTHH)",
                  "M21. Chuyên đề nghiên cứu 1 (KTHH)",
                  "M22. Chuyên đề nghiên cứu 3 (KTHH)",
              ];
  
              const columnFooterRows = [];
              // Chia làm 3 cột (Cột 1: 9 item, Cột 2: 9 item, Cột 3: 4 item)
              const maxRowsPerColumn = 9; 
              
              for (let i = 0; i < maxRowsPerColumn; i++) {
                  // (colSpan 10 cho mỗi cột, tổng 30 cột)
                  const cell1 = chuthichMonHoc[i] ? { value: chuthichMonHoc[i], border: false, colSpan: 10 } : { value: null, border: false, colSpan: 10 };
                  const cell2 = chuthichMonHoc[i + 9] ? { value: chuthichMonHoc[i + 9], border: false, colSpan: 10 } : { value: null, border: false, colSpan: 10 };
                  const cell3 = chuthichMonHoc[i + 18] ? { value: chuthichMonHoc[i + 18], border: false, colSpan: 10 } : { value: null, border: false, colSpan: 10 };
                  
                  columnFooterRows.push({ cells: [cell1, cell2, cell3] });
              }
  
              // === PHẦN MỚI 2: TẠO PHẦN GHI CHÚ CUỐI FILE ===
               const ghiChuRows = [
                  { cells: [{ value: null, border: false }] }, // Dòng trống
                  { cells: [{ value: 'GHI CHÚ:', border: false, bold: true, colSpan: 10 }] },
                  { cells: [{ value: "1. 'Null': Môn đã lên danh sách thi nhưng chưa thi hoặc giáo viên chưa nhập điểm", border: false, colSpan: 20 }] },
                  { cells: [{ value: "2. ' ': Môn chưa lên danh sách thi", border: false, colSpan: 20 }] },
                  { cells: [{ value: "3. 'Miễn': Môn miễn học", border: false, colSpan: 20 }] },
                  { cells: [{ value: "4. 'HT': Môn hoãn thi", border: false, colSpan: 20 }] },
                  { cells: [{ value: "4. 'CT': Môn cấm thi", border: false, colSpan: 20 }] },
                  { cells: [{ value: "5. 'ĐCT': Môn đình chỉ thi", border: false, colSpan: 20 }] },
                  { cells: [{ value: "6. Điểm TBC: Tính điểm trung bình cộng của tất cả các môn đã có điểm ở thời điểm xuất file excel điểm (Không tính điểm môn chưa thi, không tính điểm môn hoãn thi, miễn thi)", border: false, colSpan: 30 }] },
              ];
  
  
              // 3. Gọi hàm export
              exportFromTemplate({
                templateUrl: "/lms/templates/chuong-trinh-dao-tao/Bangdiemtheolop.xlsx",
                sheets: [
                  {
                    sheet: "BaoCaoDiem", // Đảm bảo tên sheet này chính xác
                    data: {
                      khoa: reportData.khoa,
                      chuyenNganh: reportData.chuyenNganh,
                      lop: reportData.lop,
                      tongSoHP: reportData.tongSoHP,
                      tongSoTC: reportData.tongSoTC,
                    },
                    tableStartCell: { row: 9, col: 1 }, 
                    
                    rows: [
                      ...studentRows, 
                      ...totalCell,
                      ...columnFooterRows, 
                      ...ghiChuRows
                    ], 
                  },
                ],
                fileName: `BangDiem-${reportData.lop}.xlsx`,
              });
          } catch (error) {
              console.error("Export failed:", error);
              message.error("Xuất file thất bại, vui lòng thử lại!");
          } finally {
              hideSpinner();
          }
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
                   <Button
                                                      className="mr-3"
                                                      type="primary"
                                                      onClick={handleExportBangDiem}
                                                  >
                                                     Xuất excel
                                                  </Button>
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
