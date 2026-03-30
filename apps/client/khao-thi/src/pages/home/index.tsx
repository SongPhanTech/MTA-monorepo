import DashboardLayout from "@layouts/dashboard-layout"

function Page() {
  return (
    <div>
      {/*<Row gutter={[8, 8]}>
                <Col xs={24} lg={18}>
                    <div className="bg-white rounded shadow h-96 flex flex-col">
                        <div className="p-4">
                            <Title level={4}>Thống kê đối tượng đào tạo</Title>
                        </div>
                        <div className="flex-1">
                            <PieChart className="h-full" />
                        </div>
                    </div>
                </Col>
                <Col xs={24} lg={6}>
                    <div className="bg-white rounded shadow h-96 flex flex-col">
                        <div className="p-4">
                            <Title level={4}>Thông báo</Title>
                        </div>
                        <div className="flex-1 overflow-y-auto mb-2 p-2">
                            <Notifications />
                        </div>
                    </div>
                </Col>

                <Col xs={24} lg={18}>
                    <Row gutter={[8, 8]}>
                        <Col xs={24} md={12}>
                            <div className="bg-white rounded shadow h-96 flex flex-col">
                                <div className="p-4">
                                    <Title level={4}>
                                        Thống kê số lượng giảng viên theo trình độ
                                    </Title>
                                </div>
                            </div>
                        </Col>
                        <Col xs={24} md={12}>
                            <div className="bg-white rounded shadow h-96 flex flex-col">
                                <div className="p-4">
                                    <Title level={4}>
                                        Thống kê số lượng học viên theo loại hình đào tạo
                                    </Title>
                                </div>
                            </div>
                        </Col>
                        <Col span={24}>
                            <div className="bg-white rounded shadow h-full flex flex-col">
                                <div className="p-4">
                                    <Title level={4}>
                                        Thống kê số lượng giảng viên theo đầu mối
                                    </Title>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Col>
                <Col xs={24} lg={6}>
                    <div className="bg-white rounded shadow h-full flex flex-col">
                        <div className="p-4">
                            <Title level={4}>Tin tức</Title>
                        </div>
                        <div className="flex-1 p-2">
                            <News />
                        </div>
                    </div>
                </Col>
            </Row>*/}
    </div>
  )
}

export default Page

Page.getLayout = function getLayout(page: React.ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>
}
