import { UploadOutlined } from "@ant-design/icons";
import FormItem from "@components/commons/form-item";
import { DIFFICULT_LABELS, QUESTION_TYPE_LABELS } from "@constants/constants";
import useSpinner from "@hooks/spinner";
import { type Difficult, QuestionType } from "@workspace/db";
import {
  useCreateQuestion,
  useFindManyKnowledgeBlock,
} from "@workspace/db/hooks";
import {
  Button,
  Modal,
  message,
  Table,
  Col,
  Select,
  Radio,
  Form,
  Row,
} from "antd";
import { XMLParser } from "fast-xml-parser";
import PizZip from "pizzip";
import type React from "react";
import { useEffect, useState } from "react";
import { useDisclosure } from "react-hook-disclosure-modal";

interface WordImportModalInput {
  questionBankId: string;
  knowledgeBlockId: string;
  subjectVersionId: string;
}

const WordImportModal: React.FC = () => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const { showSpinner, hideSpinner } = useSpinner();
  const [storageType, setStorageType] = useState<"khung" | "kho">("khung");
  const [form] = Form.useForm();
  const { isOpen, onClose, input } = useDisclosure<WordImportModalInput>({
    tag: "WordImportModal",
    onClose: () => {
      questions.forEach((q) => {
        [
          ...(q.contentImagesRaw || []),
          ...(q.explanationImagesRaw || []),
        ].forEach((img) => {
          if (img.blobUrl) {
            URL.revokeObjectURL(img.blobUrl);
          }
        });
      });
      form.resetFields();
      setQuestions([]);
      setSelectedRowKeys([]);
    },
  });

  const questionBankId = input?.questionBankId;
  const knowledgeBlockId = Form.useWatch("knowledgeBlockId", form) as
    | string
    | undefined;
  const DETECT_QUESTION_TYPE = (text: string): QuestionType | "" => {
    if (text.includes("SINGLE_CHOICE")) return QuestionType.SINGLE_CHOICE;
    if (text.includes("MULTIPLE_CHOICE")) return QuestionType.MULTIPLE_CHOICE;
    if (text.includes("ESSAY")) return QuestionType.ESSAY;
    if (text.includes("ORAL")) return QuestionType.ORAL;
    if (text.includes("FILL_IN_BLANK")) return QuestionType.FILL_IN_BLANK;
    if (text.includes("ORDERING")) return QuestionType.ORDERING;
    return "";
  };

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });

  const parseMCQOptions = (
    rows: any[],
    startIndex: number,
    zip: PizZip,
    relMap: Map<string, string>,
  ): { label: string; content: string; isCorrect: boolean }[] => {
    const choices = [];
    // chạy từ row kế tiếp câu hỏi
    for (let i = startIndex + 1; i < rows.length; i++) {
      const row = rows[i];
      const cells = Array.isArray(row["w:tc"]) ? row["w:tc"] : [row["w:tc"]];
      const { text } = extractTextAndImagesFromCell(cells[0], zip, relMap);

      if (!text) {
        continue;
      }

      const clean = text.trim();
      if (clean === "") {
        continue;
      }

      if (/^Giải thích|Đáp án/i.test(clean)) {
        break;
      }

      const match = clean.match(/^([A-D])\.\s*(.+)$/i);
      if (!match) {
        break;
      }

      const label = match[1].toUpperCase();
      let content = match[2].trim();

      // Detect đáp án đúng - hỗ trợ nhiều loại ngoặc đơn (ASCII và Unicode)
      // Regex: [(（]?\s*(đáp án đúng|Đáp án đúng)\s*[)）]?
      const correctPattern = /[(（]?\s*(đáp án đúng|Đáp án đúng)\s*[)）]?/gi;
      const isCorrect = correctPattern.test(content);

      // Remove text "(đáp án đúng)" khỏi content - hỗ trợ nhiều loại ngoặc
      content = content
        .replace(/[(（]?\s*(đáp án đúng|Đáp án đúng)\s*[)）]?/gi, "")
        .trim();

      choices.push({ label, content, isCorrect });
    }

    return choices;
  };

  const parseQuestionsFromPlainText = (doc: any) => {
    const paragraphs = doc["w:document"]["w:body"]["w:p"];
    if (!paragraphs) return [];

    const lines: string[] = [];

    // thu thập mọi dòng text
    for (const p of paragraphs) {
      const runs = p["w:r"];
      if (!runs) continue;

      const runArray = Array.isArray(runs) ? runs : [runs];
      let content = "";

      for (const r of runArray) {
        if (typeof r["w:t"] === "string") content += r["w:t"];
        else if (typeof r["w:t"] === "object" && r["w:t"]["#text"])
          content += r["w:t"]["#text"];
      }

      if (content.trim().length > 0) lines.push(content.trim());
    }

    const questions = [];
    let current: any = null;

    for (const line of lines) {
      // detect câu mới
      // Nhận dạng mọi kiểu bắt đầu câu
      if (/^(Câu\s*\d+|Câu hỏi|Question\s*\d*|Q\d+)/i.test(line)) {
        if (current) questions.push(current);
        current = { raw: [] };
      }
      if (current) current.raw.push(line);
    }
    if (current) questions.push(current);

    return questions;
  };

  const parsePlainTextToQuestions = (rawItems: any[]) => {
    const result: any[] = [];

    for (const item of rawItems) {
      const lines = item.raw;

      const questionText = lines[0];
      const type = DETECT_QUESTION_TYPE(questionText);

      let content = "";
      let explanation = "";
      const options: any[] = [];

      for (const line of lines.slice(1)) {
        // A. Option
        const match = line.match(/^([A-D])\.\s*(.+)/i);
        if (match) {
          const label = match[1].toUpperCase();
          let text = match[2].trim();

          // Detect đáp án đúng - hỗ trợ nhiều loại ngoặc đơn
          const correctPattern =
            /[(（]?\s*(đáp án đúng|Đáp án đúng)\s*[)）]?/gi;
          const isCorrect = correctPattern.test(text);

          // Remove text "(đáp án đúng)" khỏi content
          text = text
            .replace(/[(（]?\s*(đáp án đúng|Đáp án đúng)\s*[)）]?/gi, "")
            .trim();

          options.push({ label, content: text, isCorrect });
          continue;
        }

        // Giải thích
        if (/^Giải thích/i.test(line)) {
          explanation = line.replace(/^Giải thích[:]?/i, "").trim();
          continue;
        }

        content += `${line}\n`;
      }

      result.push({
        type,
        difficult: "D1",
        content: content.trim(),
        optionsRaw: options,
        explanation,
        point: 1,
      });
    }

    return result;
  };

  const cleanQuestionText = (text: string) => {
    let result = text.trim();
    result = result.replace(/^(Câu\s*hỏi\s*\d*:?|Câu\s*\d*:?)/i, "").trim();
    result = result
      .replace(
        /^(ESSAY|ORAL|SINGLE_CHOICE|MULTIPLE_CHOICE|FILL_IN_BLANK|ORDERING)_(D1|D2|D3|D4)/,
        "",
      )
      .trim();
    result = result
      .replace(
        /(ESSAY|ORAL|SINGLE_CHOICE|MULTIPLE_CHOICE|FILL_IN_BLANK|ORDERING)_(D1|D2|D3|D4)/,
        "",
      )
      .trim();
    // Remove "(đáp án đúng)" - hỗ trợ nhiều loại ngoặc
    result = result
      .replace(/[(（]?\s*(đáp án đúng|Đáp án đúng)\s*[)）]?/gi, "")
      .trim();

    return result;
  };

  const cleanAnswerText = (text: string) => {
    if (!text) return "";

    return (
      text
        // xóa "Đáp án:" / "Giải thích:" (mọi kiểu hoa thường)
        .replace(/^(đáp án|giải thích)\s*[:\-]?\s*/i, "")
        // xóa nếu nằm giữa đoạn
        .replace(/(đáp án|giải thích)\s*[:\-]?\s*/gi, "")
        .trim()
    );
  };

  const extractTextAndImagesFromCell = (
    cell: any,
    zip: PizZip,
    relMap: Map<string, string>,
  ) => {
    const paragraphs = Array.isArray(cell?.["w:p"])
      ? cell["w:p"]
      : [cell?.["w:p"]];
    let rawText = "";
    let prevEndedWithChar = false;
    const images: { name: string; blob: Blob }[] = [];
    let imgIndex = 1;

    for (const p of paragraphs) {
      const runs = Array.isArray(p?.["w:r"]) ? p["w:r"] : [p?.["w:r"]];
      let paragraphText = "";

      for (const r of runs) {
        const t = r?.["w:t"];
        let value = "";
        if (typeof t === "string") {
          value = t;
        } else if (typeof t === "object" && t?.["#text"]) {
          value = t["#text"];
        }

        if (value) {
          const startsWithPunctuation = /^[.,!?;:]/.test(value);
          const endsWithChar = /[a-zA-ZÀ-ỹ0-9]$/.test(value);
          if (paragraphText && prevEndedWithChar && !startsWithPunctuation) {
            paragraphText += " ";
          }
          paragraphText += value;
          prevEndedWithChar = endsWithChar;
        }

        const drawing = r?.["w:drawing"];
        const blip =
          drawing?.["wp:inline"]?.["a:graphic"]?.["a:graphicData"]?.[
            "pic:pic"
          ]?.["pic:blipFill"]?.["a:blip"];
        const relId = blip?.["@_r:embed"];
        if (relId) {
          const imagePath = `word/${relMap.get(relId)}`;
          const file = zip.file(imagePath);
          if (file) {
            const blob = new Blob([file.asArrayBuffer()], {
              type: "image/png",
            });
            const placeholder = `{img_${imgIndex}}`;
            paragraphText += ` ${placeholder} `;
            images.push({ name: placeholder, blob });
            imgIndex++;
          }
        }
      }

      rawText += `${paragraphText.trim()}\n`;
    }

    const cleanedText = rawText.replace(/[ \t]{2,}/g, " ").trim();

    return { text: cleanedText, images };
  };

  const parseMetadataFromTitle = (text: string) => {
    // Ví dụ tiêu đề:  "Câu 1: K13_B1_ESSAY_D3"
    const match = text.match(
      /(ESSAY|ORAL|SINGLE_CHOICE|MULTIPLE_CHOICE|FILL_IN_BLANK|ORDERING)_(D1|D2|D3|D4)/,
    );

    if (!match) {
      return {
        type: "",
        difficult: "",
      };
    }

    const [, type, difficult] = match;

    return {
      type,
      difficult,
    };
  };

  const extractPointFromCell = (
    cell: any,
    zip: PizZip,
    relMap: Map<string, string>,
  ) => {
    const { text } = extractTextAndImagesFromCell(cell, zip, relMap);
    const match = text.match(/(\d+(?:[.,]\d+)?)\s*(đ|điểm)?/i);
    if (match) {
      return Number.parseFloat(match[1].replace(",", "."));
    }
    return undefined;
  };

  const uploadImagesAndReplacePlaceholders = async (
    rawText: string,
    images: { name: string; blob: Blob }[],
  ): Promise<string> => {
    let result = rawText;

    for (const img of images) {
      try {
        const arrayBuffer = await img.blob.arrayBuffer();
        const buffer = Array.from(new Uint8Array(arrayBuffer));

        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const fileName = `question_image_${timestamp}_${randomSuffix}.png`;

        // const uploadResult = await window.electronAPI.saveImageLocal({
        //   buffer,
        //   fileName,
        // });

        // if (!uploadResult.success) {
        //   throw new Error(uploadResult.error || "Upload failed");
        // }

        // const imageUrl = uploadResult.imageUrl;
        // result = result.replace(
        //   img.name,
        //   `<img src="${imageUrl}" style="max-width: 100%;" />`
        // );
      } catch (error) {
        console.error(`Failed to upload image ${img.name}:`, error);
        // Giữ nguyên placeholder nếu upload thất bại
      }
    }

    result = result.replace(/\n/g, "<br />");

    return result;
  };

  const handleImport = async (file: File) => {
    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = new PizZip(arrayBuffer);

      const documentXml = zip.file("word/document.xml")?.asText();
      const relsXml = zip.file("word/_rels/document.xml.rels")?.asText();

      const doc = parser.parse(documentXml || "");
      const rels = relsXml
        ? parser.parse(relsXml)?.Relationships?.Relationship || []
        : [];
      const plainRaw = parseQuestionsFromPlainText(doc);
      const plainQuestions = parsePlainTextToQuestions(plainRaw);

      const relMap = new Map();
      (Array.isArray(rels) ? rels : [rels]).forEach((rel) => {
        if (rel["@_Type"]?.includes("image")) {
          relMap.set(rel["@_Id"], rel["@_Target"]);
        }
      });

      const body = doc["w:document"]["w:body"];
      const tables = Array.isArray(body["w:tbl"])
        ? body["w:tbl"]
        : body["w:tbl"]
          ? [body["w:tbl"]]
          : [];

      // let extracted: any[] = [];

      if (tables.length > 0) {
        message.info("Đang đọc file bảng Word...");
      }

      // if (tables.length === 0) {
      //   const plain = parseQuestionsFromPlainText(doc);
      //   extracted = parsePlainTextToQuestions(plain);
      // }

      const extractedQuestions: any[] = [];

      for (const tbl of tables) {
        const rows = Array.isArray(tbl["w:tr"]) ? tbl["w:tr"] : [tbl["w:tr"]];

        for (let i = 0; i < rows.length - 1; i += 2) {
          const question: any = {};

          // Row lẻ (câu hỏi + điểm)
          const contentRow = rows[i];
          const contentCells = Array.isArray(contentRow["w:tc"])
            ? contentRow["w:tc"]
            : [contentRow["w:tc"]];
          const contentResult = extractTextAndImagesFromCell(
            contentCells[0],
            zip,
            relMap,
          );

          const processedContent = contentResult.text;
          const meta = parseMetadataFromTitle(processedContent);
          question.type = DETECT_QUESTION_TYPE(processedContent);

          // Parse options từ nội dung câu hỏi (options nằm trong cùng cell)
          let questionContent = "";
          const options: any[] = [];

          // Tìm vị trí bắt đầu của options (A. B. C. hoặc D.)
          const firstOptionMatch = processedContent.match(/([A-D])\.\s*/i);

          if (
            firstOptionMatch &&
            typeof firstOptionMatch.index !== "undefined"
          ) {
            const optionStartIndex = firstOptionMatch.index;

            // Nội dung câu hỏi là phần trước option đầu tiên
            questionContent = processedContent
              .substring(0, optionStartIndex)
              .trim();

            // Phần chứa options
            const optionsText = processedContent.substring(optionStartIndex);

            const optionParts = optionsText
              .split(/(?=[A-D]\.\s)/i)
              .filter((p) => p.trim());

            for (const part of optionParts) {
              // Không dùng flag 's' - thay vào đó dùng [\s\S]* để match bất kỳ ký tự nào kể cả newline
              const optionMatch = part.match(
                /^([A-D])\.\s*([\s\S]+?)(?=\s*[A-D]\.\s|$)/i,
              );
              if (optionMatch) {
                const label = optionMatch[1].toUpperCase();
                let content = optionMatch[2].trim();

                // Detect đáp án đúng
                const correctPattern =
                  /[(（]?\s*(đáp án đúng|Đáp án đúng)\s*[)）]?/gi;
                const isCorrect = correctPattern.test(content);

                // Remove "(đáp án đúng)"
                content = content
                  .replace(/[(（]?\s*(đáp án đúng|Đáp án đúng)\s*[)）]?/gi, "")
                  .trim();

                options.push({ label, content, isCorrect });
              }
            }
          } else {
            // Không có options, toàn bộ là nội dung câu hỏi
            questionContent = processedContent;
          }

          const cleanedContent = cleanQuestionText(
            questionContent || processedContent,
          );

          question.type = meta.type || question.type;
          question.difficult = meta.difficult;
          question.content = cleanedContent;
          question.contentImagesRaw = contentResult.images;
          question.point = extractPointFromCell(
            contentCells[contentCells.length - 1],
            zip,
            relMap,
          );

          if (
            question.type === QuestionType.SINGLE_CHOICE ||
            question.type === QuestionType.MULTIPLE_CHOICE ||
            question.type === QuestionType.ORDERING
          ) {
            // Ưu tiên options parse từ nội dung câu hỏi
            question.optionsRaw =
              options.length > 0
                ? options
                : parseMCQOptions(rows, i, zip, relMap);

            if (question.optionsRaw?.length > 0) {
              const correct = question.optionsRaw.filter(
                (o: any) => o.isCorrect,
              );

              question.answer = correct.length
                ? correct
                    .map((o: any) => `${o.label}. ${o.content}`)
                    .join("<br/>")
                : "—";
            }
          }

          // Row chẵn (giải thích)
          const explanationRow = rows[i + 1];
          const explanationCells = Array.isArray(explanationRow["w:tc"])
            ? explanationRow["w:tc"]
            : [explanationRow["w:tc"]];
          const explanationResult = await extractTextAndImagesFromCell(
            explanationCells[0],
            zip,
            relMap,
          );

          let explanationText = explanationResult.text;

          if (
            question.type === QuestionType.SINGLE_CHOICE &&
            question.optionsRaw
          ) {
            const htmlOptions = question.optionsRaw
              .map(
                (opt: {
                  label: string;
                  content: string;
                  isCorrect: boolean;
                }) => {
                  const base = `${opt.label}. ${opt.content}`;
                  return opt.isCorrect
                    ? `<span style="color: green; font-weight: bold">${base}</span>`
                    : base;
                },
              )
              .join("<br />");

            explanationText =
              explanationText +
              "<br /><br /><b>Các lựa chọn:</b><br />" +
              htmlOptions;
          }
          question.explanation = cleanAnswerText(explanationText);
          question.explanationImagesRaw = explanationResult.images;

          if (question.type === QuestionType.FILL_IN_BLANK) {
            question.answer = cleanAnswerText(explanationText);
          } else if (question.type === QuestionType.ORDERING) {
            question.answer = cleanAnswerText(explanationText);
          }

          if (
            question.content &&
            question.explanation &&
            question.point !== undefined
          ) {
            extractedQuestions.push(question);
          }
        }
      }
      const merged = [...extractedQuestions, ...plainQuestions];
      const cleaned = merged.filter((q) => q.content?.trim());
      setQuestions(cleaned);
      setSelectedRowKeys(cleaned.map((_, index: number) => index.toString()));

      message.success(
        `Đã import thành công ${extractedQuestions.length} câu hỏi`,
      );
    } catch (error) {
      message.error("Có lỗi xảy ra khi đọc file Word");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderContentWithImagePlaceholders = (text: string, images: any[]) => {
    if (!images || images.length === 0) return text;

    let result = text;
    images.forEach((img) => {
      const blobUrl = URL.createObjectURL(img.blob);
      result = result.replace(
        img.name,
        `<img src="${blobUrl}" style="max-width: 100%;" />`,
      );
    });
    return result;
  };

  const columns = [
    {
      title: "Câu hỏi",
      dataIndex: "content",
      width: 350,
      render: (text: string, record: any) => {
        let html = text;

        if (record.point !== undefined) {
          html += ` <span style="color:#1890ff;font-weight:600">(${record.point}đ)</span>`;
        }

        if (record.optionsRaw?.length > 0) {
          const cleanedOptions = record.optionsRaw.map(
            (opt: { label: string; content: string }) =>
              `${opt.label}. ${opt.content.replace("(đáp án đúng)", "").trim()}`,
          );

          html += `<br/><br/>${cleanedOptions.join("<br/>")}`;
        }

        return (
          <div
            dangerouslySetInnerHTML={{
              __html: html,
            }}
          />
        );
      },
    },

    {
      title: "Loại câu hỏi",
      dataIndex: "type",
      width: 120,
      key: "type",
      render: (value: string) => {
        const key = value as QuestionType;
        return QUESTION_TYPE_LABELS[key] ?? value;
      },
      align: "center" as const,
    },
    {
      title: "Độ khó",
      dataIndex: "difficult",
      width: 120,
      key: "difficult",
      render: (value: Difficult) => DIFFICULT_LABELS[value] ?? value,
      align: "center" as const,
    },
    // {
    //   title: "Chuẩn đầu ra",
    //   dataIndex: "chapter",
    //   width: 150,
    //   key: "chapter",
    //   render: (value: string) => value || "-",
    //   align: "center" as const,
    // },
    {
      title: "Đáp án",
      dataIndex: "explanation",
      width: 320,
      render: (_: any, record: any) => {
        let html = "";

        switch (record.type) {
          case QuestionType.SINGLE_CHOICE: {
            const correct =
              record.optionsRaw?.filter((o: any) => o.isCorrect) || [];

            if (correct.length > 0) {
              const c = correct[0];
              html = `${c.label}. ${c.content}`;
            } else {
              html = "—";
            }
            break;
          }

          case QuestionType.MULTIPLE_CHOICE: {
            const correct =
              record.optionsRaw?.filter((o: any) => o.isCorrect) || [];

            if (correct.length === 0) {
              html = "—";
            }
            // Một đáp án đúng
            else if (correct.length === 1) {
              const c = correct[0];
              html = `${c.label}. ${c.content}`;
            }
            // Nhiều đáp án đúng
            else {
              html =
                "" +
                correct
                  .map(
                    (c: { label: string; content: string }) =>
                      `${c.label}. ${c.content}`,
                  )
                  .join("<br/>");
            }
            break;
          }

          case "FILL_IN_BLANK": {
            html = record.answer || "—";
            break;
          }

          case "ORDERING":
            html = record.answer ? `${record.answer}` : "—";
            break;

          case "ESSAY":
          case "ORAL": {
            html = record.explanation || "—";
            break;
          }

          default: {
            html = renderContentWithImagePlaceholders(
              html,
              record.explanationImagesRaw || [],
            );
            break;
          }
        }
        html = renderContentWithImagePlaceholders(
          html,
          record.explanationImagesRaw || [],
        );
        return (
          <div
            style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
            dangerouslySetInnerHTML={{
              __html: html,
            }}
          />
        );
      },
    },

    {
      title: "Điểm",
      dataIndex: "point",
      width: 80,
      key: "point",
      align: "center" as const,
      render: (point: number) => `${point} đ`,
    },
  ];

  const { mutateAsync: createQuestion } = useCreateQuestion();
  const { data: knowledgeBlockData } = useFindManyKnowledgeBlock({
    where: {
      deletedAt: null,
      examMatrix: {
        examFramework: {
          subjectVersionId: input?.subjectVersionId,
        },
      },
    },
  });

  useEffect(() => {
    if (storageType === "kho") {
      form.setFieldsValue({ knowledgeBlockId: undefined });
    }
  }, [storageType, form]);

  const onOk = async () => {
    try {
      if (storageType === "khung" && !knowledgeBlockId) {
        message.error("Bạn phải chọn Chuẩn đầu ra khi lưu tại khung");
        return;
      }

      if (!questionBankId) {
        message.error("Bạn phải chọn Ngân hàng câu hỏi (Question Bank)!");
        return;
      }

      showSpinner();
      const selectedQuestions = questions.filter((_, index) =>
        selectedRowKeys.includes(index.toString()),
      );

      for (const q of selectedQuestions) {
        const content = await uploadImagesAndReplacePlaceholders(
          q.content,
          q.contentImagesRaw || [],
        );
        const explanation = await uploadImagesAndReplacePlaceholders(
          q.explanation,
          q.explanationImagesRaw || [],
        );

        const payload: any = {
          content,
          explanation,
          type: q.type,
          difficult: q.difficult,
          point: q.point ?? 1,
          isAutoGraded: false,
          questionBankId,
          ...(storageType === "khung" ? { knowledgeBlockId } : {}),
        };

        if (
          (q.type === QuestionType.SINGLE_CHOICE ||
            q.type === QuestionType.MULTIPLE_CHOICE) &&
          q.optionsRaw?.length > 0
        ) {
          payload.multipleChoiceOptions = {
            create: q.optionsRaw.map((opt: any, index: number) => ({
              content: `${opt.label}. ${opt.content}`,
              isCorrect: opt.isCorrect,
              order: index + 1,
            })),
          };
        }

        if (q.type === QuestionType.ORDERING && q.optionsRaw?.length > 0) {
          // Parse thứ tự đúng từ answer (VD: "Thứ tự đúng là A → B → C" hoặc "A → B → C")
          const orderMatch = q.answer?.match(
            /([A-D])\s*(?:→|->)\s*([A-D])(?:\s*(?:→|->)\s*([A-D]))?(?:\s*(?:→|->)\s*([A-D]))?/,
          );

          if (orderMatch) {
            // Lấy các label theo thứ tự đúng (A, B, C, D)
            const correctSequence = orderMatch
              .slice(1)
              .filter(Boolean) as string[];

            // Tạo map từ label -> correctOrder
            const orderMap = new Map<string, number>();
            correctSequence.forEach((label: string, idx: number) => {
              orderMap.set(label, idx + 1);
            });

            payload.orderingItems = {
              create: q.optionsRaw.map((opt: any) => ({
                content: `${opt.label}. ${opt.content}`,
                correctOrder:
                  orderMap.get(opt.label) ?? q.optionsRaw.length + 1,
              })),
            };
          }

          if (q.type === QuestionType.FILL_IN_BLANK) {
            /**
             * Ví dụ answer:
             * 1: Paris
             * 2: France
             */
            const slotMatches =
              q.answer
                ?.split(/[\n;]/)
                .map((line: string) => {
                  const match = line.match(/(\d+)\s*[:=]\s*(.+)/);
                  if (!match) return null;
                  return {
                    order: Number(match[1]),
                    correctAnswer: match[2].trim(),
                  };
                })
                .filter(Boolean) || [];

            if (slotMatches.length > 0) {
              payload.fillInBlankSlots = {
                create: slotMatches.map((slot: any) => ({
                  order: slot.order,
                  correctAnswer: slot.correctAnswer,
                })),
              };
            }
          }

          if (q.type === QuestionType.ESSAY || q.type === QuestionType.ORAL) {
          }

          // if (q.type === QuestionType.TRUE_FALSE) {
          //   payload.multipleChoiceOptions = {
          //     create: [
          //       {
          //         content: "A. Đúng",
          //         isCorrect: q.answer === "TRUE",
          //         order: 1,
          //       },
          //       {
          //         content: "B. Sai",
          //         isCorrect: q.answer === "FALSE",
          //         order: 2,
          //       },
          //     ],
          //   };
          // }
        }

        await createQuestion({ data: payload });
      }

      message.success("Import câu hỏi thành công");
      onClose();
      setQuestions([]);
      setSelectedRowKeys([]);
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lưu câu hỏi");
    } finally {
      hideSpinner();
    }
  };

  return (
    <Modal
      title="Import câu hỏi từ Word"
      open={isOpen}
      width="90vw"
      onCancel={onClose}
      style={{ top: 20, maxHeight: "90vh", overflowY: "auto" }}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Đóng
        </Button>,

        <Button
          key="submit"
          type="primary"
          disabled={selectedRowKeys.length === 0}
          onClick={onOk}
        >
          Lưu Câu Hỏi
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
          <input
            type="file"
            accept=".docx"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleImport(file);
              }
              e.target.value = "";
            }}
            style={{ display: "none" }}
            id="word-import-input"
          />
          <Col>
            <Button
              icon={<UploadOutlined />}
              onClick={() =>
                document.getElementById("word-import-input")?.click()
              }
            >
              Chọn File Word
            </Button>
          </Col>
          <Col span={12}>
            <div>
              <div className="text-sm font-medium ">Vị trí lưu trữ</div>
              <Radio.Group
                value={storageType}
                onChange={(e) => setStorageType(e.target.value)}
              >
                <Radio value="khung">Lưu tại khung</Radio>
                <Radio value="kho">Lưu tại kho</Radio>
              </Radio.Group>
            </div>
          </Col>

          {storageType === "khung" && (
            <Col span={12}>
              <FormItem
                form={form}
                name="knowledgeBlockId"
                label="Chuẩn đầu ra"
                layout="vertical"
                rules={[
                  { required: true, message: "Vui lòng chọn chuẩn đầu ra" },
                ]}
              >
                <Select
                  maxTagCount={"responsive"}
                  placeholder="Chọn chuẩn đầu ra"
                  options={knowledgeBlockData?.map(({ id, name }) => ({
                    value: id,
                    label: name,
                  }))}
                />
              </FormItem>
            </Col>
          )}
        </Row>

        {loading && <div style={{ margin: "16px 0" }}>Đang đọc file...</div>}

        {questions.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Table
              columns={columns}
              dataSource={questions}
              rowKey={(record, index) => index?.toString() || ""}
              rowSelection={{
                type: "checkbox",
                selectedRowKeys,
                onChange: (keys) => {
                  setSelectedRowKeys(keys);
                },
              }}
              scroll={{
                x: "100%",
                y: "calc(70vh - 130px)",
              }}
              sticky={{
                offsetHeader: 0,
              }}
              style={{
                maxHeight: "70vh",
              }}
              pagination={{
                position: ["bottomRight"],
                defaultPageSize: 10,
                showSizeChanger: {
                  labelRender: ({ value }) => `${value} / trang`,
                  optionRender: (oriOption) => `${oriOption.value} / trang`,
                },
                showTotal: (total, range) =>
                  `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
              }}
            />
          </div>
        )}
      </Form>
    </Modal>
  );
};

export default WordImportModal;
