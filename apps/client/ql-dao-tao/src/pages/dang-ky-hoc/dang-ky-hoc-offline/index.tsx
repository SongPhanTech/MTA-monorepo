import DefaultLayout from '@layouts/default-layout'
import { Col, Row, Tabs } from 'antd'
import type React from 'react'
import { useState } from 'react'
import DangKyHocChoCaNhan from './_components/dang-ky-hoc-cho-lop-ca-nhan'
import DangKyHocChoLopQuanLy from './_components/dang-ky-hoc-cho-lop-quan-ly'
import KeQuaDangKyHocLopQuanLy from './_components/ket-qua-dang-ky-hoc-lop-quan-ly'
import LopCoMonTheoKhgd from './_components/lop-co-mon-theo-khgd'
import LopMonHocDaMo from './_components/lop-mon-hoc-da-mo'
import CaNhanTrongLopQuanLy from './_components/ca-nhan-trong-lop-quan-ly'

interface TabItem {
    key: string
    label: string
    content: React.ReactNode
}

export default function DangKyHoc({ hocLai = false }: { hocLai?: boolean }) {
    const [activeLeftTab, setActiveLeftTab] = useState(hocLai ? '2' : '1')
    const [subjectClassId, setSubjectClassId] = useState<string | null>(null)
    const [studentId, setStudentId] = useState<string | null>(null)
    const leftTabs: TabItem[] = hocLai
        ? [
              {
                  key: '2',
                  label: 'Đăng ký học cho cá nhân',
                  content: <DangKyHocChoCaNhan hocLai={hocLai} setStudentId={setStudentId} />,
              },
          ]
        : [
              {
                  key: '1',
                  label: 'Đăng ký học cho lớp quản lý',
                  content: (
                      <Row gutter={[8, 0]}>
                          <Col span={8}>
                              <DangKyHocChoLopQuanLy setSubjectClassId={setSubjectClassId} />
                          </Col>
                          <Col span={6}>
                              <LopCoMonTheoKhgd subjectClassId={subjectClassId} />
                          </Col>
                          <Col span={10}>
                              <CaNhanTrongLopQuanLy setStudentId={setStudentId} />
                          </Col>
                      </Row>
                  ),
              },
              {
                  key: '2',
                  label: 'Đăng ký học cho cá nhân',
                  content: <DangKyHocChoCaNhan setStudentId={setStudentId} />,
              },
              {
                  key: '3',
                  label: 'Kết quả đăng ký học lớp quản lý',
                  content: <KeQuaDangKyHocLopQuanLy />,
              },
          ]

    const rightTabsMap: Record<string, TabItem[]> = {
        '1': [
            {
                key: '1',
                label: 'Lớp có môn theo KHGD',
                content: <></>,
            },
        ],
        '2': [
            {
                key: '1',
                label: 'Lớp môn học đã mở',
                content: <LopMonHocDaMo hocLai={hocLai} studentId={studentId} />,
            },
        ],
    }

    const renderRightTabs = () => {
        const rightTabs = rightTabsMap[activeLeftTab]
        if (!rightTabs) return null

        return (
            <Tabs defaultActiveKey={'1'}>
                {rightTabs.map((tab) => (
                    <Tabs.TabPane tab={tab.label} key={tab.key}>
                        {tab.content}
                    </Tabs.TabPane>
                ))}
            </Tabs>
        )
    }

    return (
        <Row gutter={[8, 0]} className="bg-white">
            <Col span={24}>
                <div className="rounded-lg shadow-sm">
                    <Tabs
                        activeKey={activeLeftTab}
                        onChange={(activeKey) => {
                            setSubjectClassId(null)
                            setActiveLeftTab(activeKey)
                        }}
                        className="m-0 p-0"
                    >
                        {leftTabs.map((tab) => (
                            <Tabs.TabPane className="m-0 p-0" tab={tab.label} key={tab.key}>
                                {tab.content}
                            </Tabs.TabPane>
                        ))}
                    </Tabs>
                </div>
            </Col>
            {/* {activeLeftTab !== '3' && (
                <Col span={10}>
                    <div className="rounded-lg shadow-sm">{renderRightTabs()}</div>
                </Col>
            )} */}
        </Row>
    )
}

DangKyHoc.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout unLayout={true}>{page}</DefaultLayout>
}
