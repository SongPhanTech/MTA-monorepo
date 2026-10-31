import {
  DownloadOutlined,
  FileWordOutlined,
  PlusOutlined,
  ReloadOutlined,
  DeleteOutlined,
} from "@ant-design/icons"
import {
  exportGraduateSurveyWord,
  type GraduateReportData,
} from "@/utils/export-graduate-survey-word"
import { customExamFetch } from "@workspace/libs/api/custom-instance"
import {
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd"
import { useCallback, useEffect, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

const { Title, Text } = Typography
const { TextArea } = Input

const ModalGraduateSurveyReport = () => {
  const { isOpen, onClose, input } = useDisclosure<{
    selectedId?: string
  }>({
    tag: "ModalGraduateSurveyReport",
  })

  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [reportData, setReportData] = useState<GraduateReportData | null>(null)
  const [originalData, setOriginalData] = useState<GraduateReportData | null>(null)

  const surveyId = input?.selectedId

  const fetchData = useCallback(async () => {
    if (!surveyId) return
    setLoading(true)
    try {
      const res = await customExamFetch<any>(`/api/survey/${surveyId}/graduate-report-data`, {
        method: "GET",
      })
      const data: GraduateReportData = res?.data || res
      if (data && data.surveyInfo) {
        setReportData(JSON.parse(JSON.stringify(data)))
        setOriginalData(JSON.parse(JSON.stringify(data)))
      }
    } catch (err: any) {
      console.error("Lỗi tải dữ liệu báo cáo tốt nghiệp:", err)
      message.error(err?.message || "Không thể tải dữ liệu báo cáo tốt nghiệp")
    } finally {
      setLoading(false)
    }
  }, [surveyId])

  useEffect(() => {
    if (isOpen && surveyId) {
      fetchData()
    } else {
      setReportData(null)
      setOriginalData(null)
    }
  }, [isOpen, surveyId, fetchData])

  const handleReset = () => {
    if (originalData) {
      setReportData(JSON.parse(JSON.stringify(originalData)))
      message.info("Đã khôi phục dữ liệu gốc từ hệ thống")
    }
  }

  const handleExportWord = async () => {
    if (!reportData) {
      message.warning("Chưa có dữ liệu để xuất Word")
      return
    }
    setExporting(true)
    try {
      await exportGraduateSurveyWord(reportData)
      message.success("Xuất báo cáo Word thành công!")
    } catch (err: any) {
      console.error("Lỗi xuất file Word:", err)
      message.error("Lỗi khi tạo file Word: " + (err?.message || "Không xác định"))
    } finally {
      setExporting(false)
    }
  }

  // Update handlers for various fields
  const updateSurveyInfo = (key: keyof GraduateReportData["surveyInfo"], value: string) => {
    if (!reportData) return
    setReportData({
      ...reportData,
      surveyInfo: {
        ...reportData.surveyInfo,
        [key]: value,
      },
    })
  }

  const updateSectionA = (key: "title" | "introText", value: string) => {
    if (!reportData) return
    setReportData({
      ...reportData,
      sectionA: {
        ...reportData.sectionA,
        [key]: value,
      },
    })
  }

  const updateField = (
    fieldId: string,
    key: "generalText" | "standoutText" | "title",
    value: string
  ) => {
    if (!reportData) return
    const nextFields = reportData.sectionB.fields.map((f) =>
      f.id === fieldId ? { ...f, [key]: value } : f
    )
    setReportData({
      ...reportData,
      sectionB: {
        ...reportData.sectionB,
        fields: nextFields,
      },
    })
  }

  const updateSectionC = (key: "text" | "satisfactionPercent", value: any) => {
    if (!reportData) return
    setReportData({
      ...reportData,
      sectionC: {
        ...reportData.sectionC,
        [key]: value,
      },
    })
  }

  const updateSectionDIntro = (value: string) => {
    if (!reportData) return
    setReportData({
      ...reportData,
      sectionD: {
        ...reportData.sectionD,
        introText: value,
      },
    })
  }

  const updateRecommendation = (key: "text" | "signTitle", value: string) => {
    if (!reportData) return
    setReportData({
      ...reportData,
      recommendation: {
        ...reportData.recommendation,
        [key]: value,
      },
    })
  }

  const majorsColumns = [
    {
      title: "STT",
      width: 60,
      align: "center" as const,
      render: (_: any, __: any, idx: number) => idx + 1,
    },
    {
      title: "Chuyên ngành đào tạo",
      dataIndex: "name",
      key: "name",
      render: (text: string, _: any, idx: number) => (
        <Input
          size="small"
          value={text}
          onChange={(e) => {
            if (!reportData) return
            const nextMajors = [...reportData.sectionA.majors]
            nextMajors[idx] = { ...nextMajors[idx], name: e.target.value }
            setReportData({
              ...reportData,
              sectionA: {
                ...reportData.sectionA,
                majors: nextMajors,
              },
            })
          }}
        />
      ),
    },
    {
      title: "Khoa/Viện quản lý",
      dataIndex: "organization",
      key: "organization",
      render: (text: string) => text || "—",
    },
    {
      title: "Đã làm",
      dataIndex: "taken",
      key: "taken",
      width: 100,
      align: "center" as const,
      render: (val: number, _: any, idx: number) => (
        <InputNumber
          size="small"
          min={0}
          value={val}
          onChange={(newVal) => {
            if (!reportData) return
            const nextMajors = [...reportData.sectionA.majors]
            nextMajors[idx] = { ...nextMajors[idx], taken: Number(newVal || 0) }
            const totalTaken = nextMajors.reduce((acc, m) => acc + m.taken, 0)
            setReportData({
              ...reportData,
              sectionA: {
                ...reportData.sectionA,
                majors: nextMajors,
                totalTaken,
              },
            })
          }}
        />
      ),
    },
    {
      title: "Tổng số",
      dataIndex: "total",
      key: "total",
      width: 100,
      align: "center" as const,
      render: (val: number, _: any, idx: number) => (
        <InputNumber
          size="small"
          min={0}
          value={val}
          onChange={(newVal) => {
            if (!reportData) return
            const nextMajors = [...reportData.sectionA.majors]
            nextMajors[idx] = { ...nextMajors[idx], total: Number(newVal || 0) }
            const totalStudents = nextMajors.reduce((acc, m) => acc + m.total, 0)
            setReportData({
              ...reportData,
              sectionA: {
                ...reportData.sectionA,
                majors: nextMajors,
                totalStudents,
              },
            })
          }}
        />
      ),
    },
    {
      title: "Tỷ lệ",
      width: 110,
      align: "center" as const,
      render: (_: any, record: any) => {
        if (!record.total || record.total === 0) {
          return <Tag color="default">...%</Tag>
        }
        const percent = ((record.taken / record.total) * 100).toFixed(1)
        return <Tag color={Number(percent) === 100 ? "green" : "blue"}>{`${percent}%`}</Tag>
      },
    },
  ]

  const tabItems = [
    {
      key: "tab-1",
      label: "Thông tin chung & Phần A",
      children: reportData ? (
        <div className="space-y-4">
          <Card size="small" title="1. Thông tin văn bản báo cáo">
            <Row gutter={[16, 12]}>
              <Col span={12}>
                <Form.Item label="Đơn vị chủ quản" className="mb-2">
                  <Input
                    value={reportData.surveyInfo.organizationHeader}
                    onChange={(e) => updateSurveyInfo("organizationHeader", e.target.value)}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Đơn vị lập báo cáo" className="mb-2">
                  <Input
                    value={reportData.surveyInfo.departmentHeader}
                    onChange={(e) => updateSurveyInfo("departmentHeader", e.target.value)}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Khóa đào tạo" className="mb-2">
                  <Input
                    value={reportData.surveyInfo.courseName}
                    onChange={(e) => updateSurveyInfo("courseName", e.target.value)}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Ngày khảo sát" className="mb-2">
                  <Input
                    value={reportData.surveyInfo.surveyDate}
                    onChange={(e) => updateSurveyInfo("surveyDate", e.target.value)}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Địa điểm & ngày ký" className="mb-2">
                  <Input
                    value={reportData.surveyInfo.reportLocationDate}
                    onChange={(e) => updateSurveyInfo("reportLocationDate", e.target.value)}
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="Tiêu đề báo cáo" className="mb-0">
                  <TextArea
                    rows={2}
                    value={reportData.surveyInfo.reportTitle}
                    onChange={(e) => updateSurveyInfo("reportTitle", e.target.value)}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card size="small" title="2. Phần A: Thống kê các chuyên ngành đào tạo và số phiếu">
            <Form.Item label="Tiêu đề Phần A" className="mb-2">
              <Input
                value={reportData.sectionA.title}
                onChange={(e) => updateSectionA("title", e.target.value)}
              />
            </Form.Item>
            <Form.Item label="Đoạn văn mở đầu Phần A" className="mb-3">
              <TextArea
                rows={3}
                value={reportData.sectionA.introText}
                onChange={(e) => updateSectionA("introText", e.target.value)}
              />
            </Form.Item>

            <div className="flex justify-between items-center mb-2">
              <Text strong>
                Danh sách chuyên ngành ({reportData.sectionA.majors.length} chuyên ngành,{" "}
                {reportData.sectionA.totalTaken}/{reportData.sectionA.totalStudents} phiếu):
              </Text>
              <Button
                size="small"
                icon={<PlusOutlined />}
                onClick={() => {
                  const nextMajors = [
                    ...reportData.sectionA.majors,
                    { name: "Chuyên ngành mới", taken: 0, total: 0, organization: "" },
                  ]
                  setReportData({
                    ...reportData,
                    sectionA: {
                      ...reportData.sectionA,
                      majors: nextMajors,
                      totalMajors: nextMajors.length,
                    },
                  })
                }}
              >
                Thêm chuyên ngành
              </Button>
            </div>

            <Table
              size="small"
              rowKey="name"
              columns={majorsColumns}
              dataSource={reportData.sectionA.majors}
              pagination={false}
              scroll={{ y: 280 }}
            />
          </Card>
        </div>
      ) : null,
    },
    {
      key: "tab-2",
      label: "Phần B: Nhận xét đánh giá theo lĩnh vực",
      children: reportData ? (
        <div className="space-y-4">
          <Card size="small" className="bg-gray-50 border-gray-200">
            <Text type="secondary">
              Mục này tổng hợp nhận xét đánh giá của học viên theo 5 lĩnh vực đào tạo. Bạn có thể
              kiểm tra tỷ lệ chuyên ngành đồng ý, danh sách các chuyên ngành có 100% học viên đánh
              giá "Rất đồng ý" / "Rất hài lòng" và chỉnh sửa nội dung văn bản cho phù hợp.
            </Text>
          </Card>

          {reportData.sectionB.fields.map((field) => (
            <Card
              key={field.id}
              size="small"
              title={
                <Space>
                  <Text strong>{field.title}</Text>
                  {field.agreeRatio && <Tag color="blue">{field.agreeRatio} chuyên ngành đồng ý</Tag>}
                </Space>
              }
            >
              <Form.Item label="Đoạn nhận xét đánh giá chung" className="mb-2">
                <TextArea
                  rows={3}
                  value={field.generalText}
                  onChange={(e) => updateField(field.id, "generalText", e.target.value)}
                />
              </Form.Item>
              <Form.Item label="Các chuyên ngành có kết quả nổi bật" className="mb-0">
                <TextArea
                  rows={2}
                  value={field.standoutText}
                  onChange={(e) => updateField(field.id, "standoutText", e.target.value)}
                />
              </Form.Item>
            </Card>
          ))}
        </div>
      ) : null,
    },
    {
      key: "tab-3",
      label: "Phần C: Tổng hợp chung",
      children: reportData ? (
        <div className="space-y-4">
          <Card size="small" title="Thống kê tỷ lệ hài lòng chung">
            <Row gutter={[16, 12]} className="mb-3">
              <Col span={8}>
                <Card size="small" className="text-center bg-blue-50 border-blue-200">
                  <div className="text-xs text-gray-500">Tỷ lệ hài lòng chung</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {reportData.sectionC.totalCount > 0
                      ? `${reportData.sectionC.satisfactionPercent}%`
                      : "...%"}
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" className="text-center bg-green-50 border-green-200">
                  <div className="text-xs text-gray-500">Hài lòng / Tổng học viên các ngành</div>
                  <div className="text-2xl font-bold text-green-600">
                    {reportData.sectionC.totalCount > 0
                      ? `${reportData.sectionC.satisfiedCount}/${reportData.sectionC.totalCount}`
                      : ".../..."}
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" className="text-center bg-purple-50 border-purple-200">
                  <div className="text-xs text-gray-500">Yêu cầu Chuẩn CSGD ĐH</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {reportData.sectionC.totalCount > 0
                      ? `≥ 70% (${reportData.sectionC.satisfactionPercent >= 70 ? "Đạt" : "Chưa đạt"})`
                      : "≥ 70% (Yêu cầu)"}
                  </div>
                </Card>
              </Col>
            </Row>

            <Form.Item
              label="Nội dung tổng hợp chung (theo Thông tư số 01/2024/TT-BGDĐT)"
              className="mb-0"
            >
              <TextArea
                rows={5}
                value={reportData.sectionC.text}
                onChange={(e) => updateSectionC("text", e.target.value)}
              />
            </Form.Item>
          </Card>
        </div>
      ) : null,
    },
    {
      key: "tab-4",
      label: "Phần D: Ý kiến góp ý của học viên",
      children: reportData ? (
        <div className="space-y-4">
          <Card size="small" title="1. Đoạn giới thiệu tổng hợp góp ý">
            <TextArea
              rows={4}
              value={reportData.sectionD.introText}
              onChange={(e) => updateSectionDIntro(e.target.value)}
            />
          </Card>

          <Card
            size="small"
            title="2. Tổng hợp ý kiến tự luận theo Khoa/Viện và Chuyên ngành"
            extra={
              <Text type="secondary" className="text-xs">
                Tổng hợp từ các câu hỏi tự luận trong đợt khảo sát
              </Text>
            }
          >
            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
              {reportData.sectionD.departments.map((dept, dIdx) => (
                <div key={dept.name} className="border border-gray-200 rounded p-3 bg-gray-50">
                  <div className="font-semibold text-base text-blue-800 mb-2">
                    {dept.romanIndex}. {dept.name}
                  </div>
                  {dept.majors.map((major, mIdx) => (
                    <div key={major.name} className="ml-3 mb-3 bg-white p-2.5 rounded border border-gray-100">
                      <div className="font-semibold text-sm text-gray-800 mb-1.5">
                        {major.arabicIndex}. Chuyên ngành {major.name}
                      </div>
                      {major.categories.map((cat, cIdx) => (
                        <div key={cat.title} className="ml-2 mb-2">
                          <div className="text-xs font-semibold text-gray-700 italic mb-1">
                            {cat.title}
                          </div>
                          <div className="space-y-1 ml-2">
                            {cat.items.map((item, iIdx) => (
                              <div key={iIdx} className="flex items-start gap-2 text-xs text-gray-600">
                                <span className="text-gray-400 mt-1">•</span>
                                <Input
                                  size="small"
                                  className="flex-1 text-xs"
                                  value={item.text}
                                  onChange={(e) => {
                                    const nextDepts = [...reportData.sectionD.departments]
                                    nextDepts[dIdx].majors[mIdx].categories[cIdx].items[iIdx].text =
                                      e.target.value
                                    setReportData({
                                      ...reportData,
                                      sectionD: {
                                        ...reportData.sectionD,
                                        departments: nextDepts,
                                      },
                                    })
                                  }}
                                />
                                <Input
                                  size="small"
                                  className="w-24 text-xs text-center"
                                  placeholder="Tỷ lệ"
                                  value={item.countText}
                                  onChange={(e) => {
                                    const nextDepts = [...reportData.sectionD.departments]
                                    nextDepts[dIdx].majors[mIdx].categories[cIdx].items[iIdx].countText =
                                      e.target.value
                                    setReportData({
                                      ...reportData,
                                      sectionD: {
                                        ...reportData.sectionD,
                                        departments: nextDepts,
                                      },
                                    })
                                  }}
                                />
                                <Button
                                  type="text"
                                  danger
                                  size="small"
                                  icon={<DeleteOutlined />}
                                  onClick={() => {
                                    const nextDepts = [...reportData.sectionD.departments]
                                    nextDepts[dIdx].majors[mIdx].categories[cIdx].items.splice(iIdx, 1)
                                    setReportData({
                                      ...reportData,
                                      sectionD: {
                                        ...reportData.sectionD,
                                        departments: nextDepts,
                                      },
                                    })
                                  }}
                                />
                              </div>
                            ))}
                            <Button
                              type="dashed"
                              size="small"
                              icon={<PlusOutlined />}
                              className="mt-1 text-xs"
                              onClick={() => {
                                const nextDepts = [...reportData.sectionD.departments]
                                nextDepts[dIdx].majors[mIdx].categories[cIdx].items.push({
                                  text: "Ý kiến góp ý bổ sung",
                                  countText: "01/10",
                                })
                                setReportData({
                                  ...reportData,
                                  sectionD: {
                                    ...reportData.sectionD,
                                    departments: nextDepts,
                                  },
                                })
                              }}
                            >
                              Thêm góp ý
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null,
    },
    {
      key: "tab-5",
      label: "Kiến nghị & Ký duyệt",
      children: reportData ? (
        <div className="space-y-4">
          <Card size="small" title="Kiến nghị">
            <Form.Item label="Nội dung kiến nghị Thủ trưởng Học viện" className="mb-2">
              <TextArea
                rows={5}
                value={reportData.recommendation.text}
                onChange={(e) => updateRecommendation("text", e.target.value)}
              />
            </Form.Item>
            <Form.Item label="Chức danh ký báo cáo" className="mb-0 w-64">
              <Input
                value={reportData.recommendation.signTitle}
                onChange={(e) => updateRecommendation("signTitle", e.target.value)}
              />
            </Form.Item>
          </Card>
        </div>
      ) : null,
    },
  ]

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      width={1050}
      title={
        <div className="flex items-center justify-between pr-8">
          <div>
            <Title level={5} className="!mb-0 text-blue-900">
              Báo cáo kết quả lấy ý kiến phản hồi từ học viên tốt nghiệp
            </Title>
            <Text type="secondary" className="text-xs">
              Mẫu biểu số liệu chuẩn Học viện Kỹ thuật Quân sự (Phần A, B, C, D và Kiến nghị)
            </Text>
          </div>
          <Space>
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={handleReset}
              disabled={loading || !originalData}
            >
              Dữ liệu gốc
            </Button>
            <Button
              type="primary"
              size="middle"
              className="bg-green-600 hover:bg-green-700"
              icon={<FileWordOutlined />}
              loading={exporting}
              disabled={loading || !reportData}
              onClick={handleExportWord}
            >
              Tải xuống file Word
            </Button>
          </Space>
        </div>
      }
      footer={
        <div className="flex justify-between items-center">
          <Text type="secondary" className="text-xs">
            Hỗ trợ kiểm tra, chỉnh sửa nội dung trước khi xuất Word để trình ký.
          </Text>
          <Space>
            <Button onClick={onClose}>Đóng</Button>
            <Button
              type="primary"
              className="bg-green-600 hover:bg-green-700"
              icon={<DownloadOutlined />}
              loading={exporting}
              disabled={loading || !reportData}
              onClick={handleExportWord}
            >
              Xuất file Word
            </Button>
          </Space>
        </div>
      }
    >
      <Spin spinning={loading} tip="Đang tổng hợp số liệu khảo sát tốt nghiệp...">
        {reportData ? (
          <Tabs defaultActiveKey="tab-1" items={tabItems} className="mt-2" />
        ) : !loading ? (
          <Empty description="Không có dữ liệu khảo sát" />
        ) : (
          <div className="h-64" />
        )}
      </Spin>
    </Modal>
  )
}

export default ModalGraduateSurveyReport

