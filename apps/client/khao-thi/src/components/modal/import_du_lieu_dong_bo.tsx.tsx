import { Upload, Button, message, Tabs, Modal } from "antd";
import type { UploadProps } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { useDisclosure } from "react-hook-disclosure-modal";
import Table from "@/components/commoms/table";
import { SYNC_ITEM_TO_SHEET } from "@/types/sheet_excel";
import {
  useCreateBuilding,
  useCreateDM_DonVi,
  useCreateExam,
  useCreateExamList,
  useCreateExamRoom,
  useCreateRoom,
  useCreateSchoolYear,
  useCreateSemester,
  useCreateSubject,
  useCreateSubjectVersion,
  useCreateTrainingLocation,
} from "@/hooks/zenstack";

type SheetMatrix = {
  columns: any[];
  data: any[];
};
type ExcelRow = Record<string, any>;

function sheetToObjects(sheet: SheetMatrix): ExcelRow[] {
  if (!sheet?.data?.length) return [];

  const headerRow = sheet.data[0] as ExcelRow;

  const colKeys = Object.keys(headerRow)
    .filter((k) => k.startsWith("COL_"))
    .sort(
      (a, b) => Number(a.replace("COL_", "")) - Number(b.replace("COL_", ""))
    );

  const headers = colKeys
    .map((k) => String(headerRow[k] ?? "").trim())
    .filter(Boolean);

  return sheet.data
    .slice(1)
    .map((rowRaw) => {
      const row = rowRaw as ExcelRow;
      const obj: ExcelRow = {};

      headers.forEach((key, idx) => {
        const colKey = colKeys[idx];
        obj[key] = colKey ? row[colKey] : "";
      });

      return obj;
    })
    .filter((row) =>
      Object.values(row).some((v) => v !== "" && v !== null && v !== undefined)
    );
}

const toNumber = (v: any) => (v === "" || v == null ? undefined : Number(v));
const toBoolean = (v: any) => v === true || v === "true" || v === 1;
const toDate = (v: any) => (v ? new Date(v) : undefined);

const ExcelPreviewModal = () => {
  const { isOpen, onClose, input } = useDisclosure<{
    selectedItems: string[];
  }>({
    tag: "ExcelPreviewModal",
  });

  const selectedSheets = (input?.selectedItems || [])
    .map((id) => SYNC_ITEM_TO_SHEET[id])
    .filter((s): s is string => Boolean(s));
  const donViMapRef = useRef(new Map<string, string>());
  const locationMapRef = useRef(new Map<string, string>());
  const buildingMapRef = useRef(new Map<string, string>());
  const roomMapRef = useRef(new Map<string, string>());
  const semesterMapRef = useRef(new Map<string, string>());
  const examMapRef = useRef(new Map<string, string>());
  const examRoomMapRef = useRef(new Map<string, string>());
  const subjectVersionMapRef = useRef(new Map<string, string>());
  const schoolYearMapRef = useRef(new Map<string, string>());

  const [sheets, setSheets] = useState<Record<string, SheetMatrix>>({});
  const [activeSheet, setActiveSheet] = useState<string>();
  const [missingSheets, setMissingSheets] = useState<string[]>([]);
  const [isValidExcel, setIsValidExcel] = useState(false);

  const { mutateAsync: createDM_DonVi } = useCreateDM_DonVi();
  const { mutateAsync: createSubject } = useCreateSubject();
  const { mutateAsync: createSemester } = useCreateSemester();
  const { mutateAsync: createExam } = useCreateExam();
  const { mutateAsync: createExamRoom } = useCreateExamRoom();
  const { mutateAsync: createExamList } = useCreateExamList();
  const { mutateAsync: createRoom } = useCreateRoom();
  const { mutateAsync: createBuilding } = useCreateBuilding();
  const { mutateAsync: createTrainingLocation } = useCreateTrainingLocation();
  const { mutateAsync: createSchoolYear } = useCreateSchoolYear();
  const { mutateAsync: createSubjectVersion } = useCreateSubjectVersion();

  const checkExcelSheets = (sheetNames: string[]) => {
    if (selectedSheets.length === 0) {
      setMissingSheets([]);
      setIsValidExcel(false);
      return;
    }

    const missing = selectedSheets.filter(
      (sheet) => !sheetNames.includes(sheet)
    );

    setMissingSheets(missing);

    const hasInvalidDependency =
      selectedSheets.includes("Room") && !selectedSheets.includes("Building");

    setIsValidExcel(missing.length === 0 && !hasInvalidDependency);
  };

  const beforeUpload: UploadProps["beforeUpload"] = (file) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const binary = e.target?.result;
      if (!binary) return;

      const workbook = XLSX.read(binary, { type: "array" });
      const result: Record<string, SheetMatrix> = {};
      const sheetNames = workbook.SheetNames;

      workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet || !sheet["!ref"]) return;

        const matrix = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: "",
          blankrows: false,
          raw: false,
        }) as any[][];

        if (!matrix.length) return;

        const maxCol = Math.max(...matrix.map((r) => r.length));

        const columns = [
          {
            title: "",
            dataIndex: "__rowIndex",
            key: "__rowIndex",
            width: 50,
            fixed: "left",
            align: "center",
            className: "excel-row-header",
            render: (_: any, __: any, index: number) => index + 1,
          },
          ...Array.from({ length: maxCol }).map((_, i) => ({
            title: XLSX.utils.encode_col(i),
            dataIndex: `COL_${i}`,
            key: `COL_${i}`,
            width: 120,
            align: "left",
            className: "excel-col",
          })),
        ];

        const data = matrix.map((row, rowIndex) => {
          const record: any = { __key: rowIndex };
          for (let i = 0; i < maxCol; i++) {
            record[`COL_${i}`] = row[i] ?? "";
          }
          return record;
        });

        result[sheetName] = { columns, data };
      });

      if (!Object.keys(result).length) {
        message.warning("File Excel không có dữ liệu");
        return;
      }
      checkExcelSheets(sheetNames);
      setSheets(result);
      setActiveSheet(Object.keys(result)[0]);
    };

    reader.readAsArrayBuffer(file);
    return false;
  };

  const isSelectedSheet = (sheetName: string) =>
    selectedSheets.includes(sheetName) && sheets[sheetName];
  const hasPreviewData = Object.keys(sheets).length > 0 && Boolean(activeSheet);

  const onSync = async () => {
    const donViMap = donViMapRef.current;
    const locationMap = locationMapRef.current;
    const buildingMap = buildingMapRef.current;
    const roomMap = roomMapRef.current;
    const semesterMap = semesterMapRef.current;
    const examMap = examMapRef.current;
    const examRoomMap = examRoomMapRef.current;

    try {
      /** 1. SchoolYear */
      if (isSelectedSheet("SchoolYear")) {
        for (const r of sheetToObjects(sheets["SchoolYear"])) {
          const res = await createSchoolYear({
            data: {
              name: r.name,
              startDate: toDate(r.startDate),
              endDate: toDate(r.endDate),
            },
          });

          schoolYearMapRef.current.set(r.id ?? r.name, res.id);
        }
      }

      /** 2. TrainingLocation */
      if (isSelectedSheet("TrainingLocation")) {
        for (const r of sheetToObjects(sheets["TrainingLocation"])) {
          const res = await createTrainingLocation({
            data: { name: r.name },
          });

          // Excel dùng name làm code
          locationMap.set(r.id ?? r.name, res.id);
        }
      }

      /** 3. Building */
      if (isSelectedSheet("Building")) {
        for (const r of sheetToObjects(sheets["Building"])) {
          const locationId = locationMap.get(r.trainingLocationId);
          if (!locationId)
            throw new Error(
              `Không tìm thấy TrainingLocation: ${r.trainingLocationId}`
            );

          const res = await createBuilding({
            data: {
              name: r.name,
              floor: toNumber(r.floor),
              trainingLocationId: locationId,
            },
          });

          buildingMap.set(r.id ?? r.name, res.id);
        }
      }

      /** 4. Room */
      if (isSelectedSheet("Room")) {
        for (const r of sheetToObjects(sheets["Room"])) {
          const buildingId = buildingMap.get(r.buildingId);
          if (!buildingId)
            throw new Error(`Không tìm thấy Building: ${r.buildingId}`);

          const res = await createRoom({
            data: {
              name: r.name,
              capacity: toNumber(r.capacity) ?? 0,
              examCapacity: toNumber(r.examCapacity),
              buildingId,
            },
          });

          roomMap.set(r.id ?? r.name, res.id);
        }
      }

      /** 5. DM_DonVi */
      if (isSelectedSheet("DM_DonVi")) {
        for (const r of sheetToObjects(sheets["DM_DonVi"])) {
          const res = await createDM_DonVi({
            data: {
              sCode: r.sCode,
              sTen: r.sTen,
              sTenVietTat: r.sTenVietTat,
              iCapDonVi: toNumber(r.iCapDonVi),
              iLoaiDonVi: toNumber(r.iLoaiDonVi),
            },
          });

          donViMap.set(r.sCode, res.Id);
        }
      }

      /** 6. Subject */
      if (isSelectedSheet("Subject")) {
        for (const r of sheetToObjects(sheets["Subject"])) {
          const donViId = donViMap.get(r.donViId);
          if (!donViId) throw new Error(`Không tìm thấy Đơn vị: ${r.donViId}`);

          await createSubject({
            data: {
              name: r.name,
              donViId,
            },
          });
        }
      }

      /** 7. Semester */
      if (isSelectedSheet("Semester")) {
        for (const r of sheetToObjects(sheets["Semester"])) {
          const startDate = toDate(r.startDate);
          const endDate = toDate(r.endDate);

          if (!startDate || !endDate) {
            throw new Error("Semester thiếu startDate hoặc endDate");
          }
          const schoolYearId = schoolYearMapRef.current.get(r.schoolYearId);
          if (!schoolYearId)
            throw new Error(`Không tìm thấy SchoolYear: ${r.schoolYearId}`);

          const res = await createSemester({
            data: {
              name: r.name,
              semesterType: r.semesterType,
              schoolYearId,
              startDate,
              endDate,
            },
          });

          semesterMap.set(r.id ?? r.name, res.id);
        }
      }
      /** 8. SubjectVersion */
      if (isSelectedSheet("SubjectVersion")) {
        for (const r of sheetToObjects(sheets["SubjectVersion"])) {
          const res = await createSubjectVersion({
            data: {
              name: r.name,
              subjectId: r.subjectId,
              semesterId: r.semesterId,
            },
          });

          subjectVersionMapRef.current.set(r.id ?? r.name, res.id);
        }
      }

      /** 9. Exam */
      if (isSelectedSheet("Exam")) {
        for (const r of sheetToObjects(sheets["Exam"])) {
          const semesterId = semesterMap.get(r.semesterId);
          if (!semesterId)
            throw new Error(`Không tìm thấy Semester: ${r.semesterId}`);
          const subjectVersionId = subjectVersionMapRef.current.get(
            r.subjectVersionId
          );
          if (!subjectVersionId)
            throw new Error(
              `Không tìm thấy SubjectVersion: ${r.subjectVersionId}`
            );
          const res = await createExam({
            data: {
              subjectVersionId,
              semesterId,
              duration: toNumber(r.duration),
              session: toNumber(r.session) ?? 1,
              status: r.status,
            },
          });

          examMap.set(r.id ?? r.examCode, res.id);
        }
      }

      /** 10. ExamRoom */
      if (isSelectedSheet("ExamRoom")) {
        for (const r of sheetToObjects(sheets["ExamRoom"])) {
          const examId = examMap.get(r.examId);
          const roomId = roomMap.get(r.roomId);

          if (!examId || !roomId) throw new Error("Lỗi mapping");

          const res = await createExamRoom({
            data: {
              examId,
              roomId,
              capacity: toNumber(r.capacity) ?? 0,
            },
          });

          examRoomMap.set(r.id ?? `${r.examId}_${r.roomId}`, res.id);
        }
      }

      /** 11. ExamList */
      if (isSelectedSheet("ExamList")) {
        for (const r of sheetToObjects(sheets["ExamList"])) {
          const examRoomId = examRoomMap.get(r.examRoomId);
          if (!examRoomId)
            throw new Error(`Không tìm thấy ExamRoom: ${r.examRoomId}`);

          await createExamList({
            data: {
              examRoomId,
              start: toNumber(r.start),
              end: toNumber(r.end),
              createdExamCode: toBoolean(r.createdExamCode),
            },
          });
        }
      }

      message.success("Đồng bộ dữ liệu thành công");
      onClose();
    } catch (e: any) {
      console.error(e);
      message.error(e?.message ?? "Đồng bộ thất bại");
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSheets({});
      setActiveSheet(undefined);
      setMissingSheets([]);
      setIsValidExcel(false);
    }
  }, [isOpen]);

  return (
    <Modal
      title="Xem trước và đồng bộ dữ liệu từ Excel"
      open={isOpen}
      onCancel={onClose}
      centered
      width={hasPreviewData ? "90vw" : 520}
      style={{
        top: hasPreviewData ? 20 : undefined,
      }}
      styles={{
        body: hasPreviewData
          ? {
              maxHeight: "80vh",
              padding: 12,
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
            }
          : {
              padding: 16,
            },
      }}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          className="!bg-green-700 !text-white font-semibold"
          onClick={onSync}
          disabled={!isValidExcel}
        >
          Lưu
        </Button>,
      ]}
    >
      {/* ===== TRẠNG THÁI CHƯA CÓ DỮ LIỆU ===== */}
      {!hasPreviewData && (
        <div className="flex flex-col gap-3">
          <Upload accept=".xlsx,.xls" beforeUpload={beforeUpload} maxCount={1}>
            <Button icon={<UploadOutlined />}>Chọn file Excel</Button>
          </Upload>

          <div className="text-gray-500 text-sm">
            Vui lòng chọn file Excel để xem trước dữ liệu trước khi đồng bộ.
          </div>
        </div>
      )}

      {/* ===== TRẠNG THÁI ĐÃ CÓ DỮ LIỆU ===== */}
      {hasPreviewData && (
        <div className="flex flex-col gap-8">
          {/* Toolbar */}
          <Upload accept=".xlsx,.xls" beforeUpload={beforeUpload} maxCount={1}>
            <Button icon={<UploadOutlined />}>Chọn file Excel</Button>
          </Upload>

          {/* Warning thiếu sheet */}
          {missingSheets.length > 0 && (
            <div
              style={{
                background: "#fff7e6",
                border: "1px solid #ffd591",
                padding: "8px 12px",
                borderRadius: 6,
                color: "#ad4e00",
              }}
            >
              <b>Thiếu sheet bắt buộc:</b>
              <ul className="list-disc ml-5 mt-1">
                {missingSheets.map((sheet) => (
                  <li key={sheet}>{sheet}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Tabs + Table */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minHeight: 0,
            }}
          >
            <Tabs
              activeKey={activeSheet}
              onChange={setActiveSheet}
              items={Object.keys(sheets)
                .filter((name) => selectedSheets.includes(name))
                .map((name) => ({
                  key: name,
                  label: name,
                }))}
            />

            <div
              style={{
                overflow: "hidden",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                background: "#fff",
              }}
            >
              <Table
                rowKey="__key"
                data={sheets[activeSheet].data}
                columns={sheets[activeSheet].columns}
                pagination={false}
                scroll={{
                  x: "max-content",
                  y: "calc(90vh - 360px)",
                }}
                size="small"
                bordered
                className="excel-table"
              />
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ExcelPreviewModal;
