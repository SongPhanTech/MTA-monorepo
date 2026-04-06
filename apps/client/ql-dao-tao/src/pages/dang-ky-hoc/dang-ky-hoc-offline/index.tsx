import DefaultLayout from "@layouts/default-layout"
import MonHocLai from "@pages/dang-ky-hoc/dang-ky-hoc-offline/_components/dang-ky-hoc-cho-ca-nhan/mon-hoc-lai"
import MonThiLai from "@pages/dang-ky-hoc/dang-ky-hoc-offline/_components/dang-ky-hoc-cho-ca-nhan/mon-thi-lai"
import { Store } from "@tanstack/react-store"
import { Col, Row, Tabs } from "antd"
import type React from "react"
import KetQuaDangKyHoc from "./_components/dang-ky-hoc-cho-ca-nhan/ket-qua-dang-ky-hoc"
import MonToanTruong from "./_components/dang-ky-hoc-cho-ca-nhan/mon-toan-truong"
import MonTrongCTDT from "./_components/dang-ky-hoc-cho-ca-nhan/mon-trong-ctdt"
import MonTuongDuong from "./_components/dang-ky-hoc-cho-ca-nhan/mon-tuong-duong"
import DangKyHocChoCaNhan from "./_components/dang-ky-hoc-cho-lop-ca-nhan"
import CaNhanTrongLopQuanLy from "./_components/dang-ky-hoc-cho-lop-quan-ly/ca-nhan-trong-lop-quan-ly"
import DangKyHocChoLopQuanLy from "./_components/dang-ky-hoc-cho-lop-quan-ly/dang-ky-hoc-cho-lop-quan-ly"
import LopQuanLyDaGhep from "./_components/dang-ky-hoc-cho-lop-quan-ly/lop-quan-ly-da-ghep"
import CaNhanHocLai from "./_components/dang-ky-hoc-lai/ca-nhan-hoc-lai"
import DangKyHocLai from "./_components/dang-ky-hoc-lai/dang-ky-hoc-lai"
import CaNhanThiLai from "./_components/dang-ky-thi-lai/ca-nhan-thi-lai"
import DangKyThiLai from "./_components/dang-ky-thi-lai/dang-ky-thi-lai"
import KeQuaDangKyHocLopQuanLy from "./_components/ket-qua-dang-ky-hoc-lop-quan-ly"

interface TabItem {
  key: string
  label: string
  content: React.ReactNode
}

type DangKyHocChoLopQuanLyStore = {
  subjectClassId?: string
  fixedClassesIds: string[]
  studentIds: string[]
}
type DangKyHocChoCaNhanStore = {
  subjectClassIds: string[]
  studentId?: string
}

type DangKyHocLaiThiLaiStore = {
  subjectClassId?: string
  studentIds: string[]
}

export const dangKyHocChoLopQuanLyStore = new Store<DangKyHocChoLopQuanLyStore>({
  subjectClassId: undefined,
  fixedClassesIds: [],
  studentIds: [],
})

export const dangKyHocChoCaNhanStore = new Store<DangKyHocChoCaNhanStore>({
  studentId: undefined,
  subjectClassIds: [],
})

export const dangKyHocLaiStore = new Store<DangKyHocLaiThiLaiStore>({
  subjectClassId: undefined,
  studentIds: [],
})

export const dangKyThiLaiStore = new Store<DangKyHocLaiThiLaiStore>({
  subjectClassId: undefined,
  studentIds: [],
})

export default function DangKyHoc() {
  const leftTabs: TabItem[] = [
    {
      key: "1",
      label: "Đăng ký học cho lớp quản lý",
      content: (
        <Row gutter={[8, 8]}>
          <Col span={8}>
            <DangKyHocChoLopQuanLy />
          </Col>
          <Col span={6}>
            <LopQuanLyDaGhep />
          </Col>
          <Col span={10}>
            <CaNhanTrongLopQuanLy />
          </Col>
        </Row>
      ),
    },
    {
      key: "2",
      label: "Đăng ký học cho cá nhân",
      content: (
        <Row gutter={[8, 8]}>
          <Col span={12}>
            <DangKyHocChoCaNhan />
          </Col>
          <Col span={12}>
            <Tabs className="m-0 p-0">
              <Tabs.TabPane className="m-0 p-0" tab={"Kết quả ĐKH"} key={"ket-qua-dang-ky-hoc"}>
                <KetQuaDangKyHoc />
              </Tabs.TabPane>
              <Tabs.TabPane className="m-0 p-0" tab={"Môn toàn trường"} key={"mon-toan-truong"}>
                <MonToanTruong />
              </Tabs.TabPane>
              <Tabs.TabPane className="m-0 p-0" tab={"Môn trong CTĐT"} key={"mon-trong-ctdt"}>
                <MonTrongCTDT />
              </Tabs.TabPane>
              <Tabs.TabPane className="m-0 p-0" tab={"Môn tương đương"} key={"mon-tuong-duong"}>
                <MonTuongDuong />
              </Tabs.TabPane>
              <Tabs.TabPane className="m-0 p-0" tab={"Môn học lại"} key={"mon-hoc-lai"}>
                <MonHocLai />
              </Tabs.TabPane>
              <Tabs.TabPane className="m-0 p-0" tab={"Môn thi lại"} key={"mon-thi-lai"}>
                <MonThiLai />
              </Tabs.TabPane>
            </Tabs>
          </Col>
        </Row>
      ),
    },
    {
      key: "3",
      label: "Kết quả đăng ký học lớp quản lý",
      content: <KeQuaDangKyHocLopQuanLy />,
    },
    {
      key: "4",
      label: "Đăng ký học lại",
      content: (
        <Row gutter={[8, 8]}>
          <Col span={10}>
            <DangKyHocLai />
          </Col>
          <Col span={14}>
            <CaNhanHocLai />
          </Col>
        </Row>
      ),
    },
    {
      key: "5",
      label: "Đăng ký thi lại",
      content: (
        <Row gutter={[8, 8]}>
          <Col span={10}>
            <DangKyThiLai />
          </Col>
          <Col span={14}>
            <CaNhanThiLai />
          </Col>
        </Row>
      ),
    },
  ]

  return (
    <Row gutter={[8, 0]} className="bg-white">
      <Col span={24}>
        <div className="rounded-lg shadow-sm">
          <Tabs className="m-0 p-0">
            {leftTabs.map((tab) => (
              <Tabs.TabPane className="m-0 p-0" tab={tab.label} key={tab.key}>
                {tab.content}
              </Tabs.TabPane>
            ))}
          </Tabs>
        </div>
      </Col>
    </Row>
  )
}

DangKyHoc.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout unLayout={true}>{page}</DefaultLayout>
}
