import BangLopMonHoc from "@components/cong-giang-vien/giang-vien/bang-lop-mon-hoc"
import BangLopQuanLy from "@components/cong-giang-vien/giang-vien/bang-lop-quan-ly"
import BangThongBao from "@components/cong-giang-vien/giang-vien/bang-thong-bao"
import BoLocThoiGian from "@components/cong-giang-vien/giang-vien/bo-loc-thoi-gian"
import LichCuaToi from "@components/cong-giang-vien/giang-vien/lich-cua-toi"
import LoiChao from "@components/cong-giang-vien/giang-vien/loi-chao"
import TheThongKe from "@components/cong-giang-vien/giang-vien/the-thong-ke"
import TheThongTinCaNhan from "@components/cong-giang-vien/giang-vien/the-thong-tin-ca-nhan"
import type { ThongTinCaNhanTomTat } from "@components/cong-giang-vien/giang-vien/types"
import { useHoSoCaNhan } from "@hooks/use-ho-so-ca-nhan"
import { useKhaoSatGiangVien } from "@hooks/use-khao-sat-giang-vien"
import { useTrangChuGiangVien } from "@hooks/use-trang-chu-giang-vien"
import { ROUTER_PATH } from "@workspace/router"
import { useSemesterStore } from "@workspace/ui"
import { Col, Row } from "antd"
import { useRouter } from "next/router"
import { useMemo } from "react"

function CongGiangVienTrangChuPage() {
  const router = useRouter()
  const { thongTin, daoTao, isLoading: dangTaiHoSo } = useHoSoCaNhan()
  const { id: semesterId } = useSemesterStore()
  const { tongSo, thongKe: thongKeKhaoSat } = useKhaoSatGiangVien({ semesterId })
  const {
    lopGiangDay,
    lopTroGiang,
    lopQuanLy,
    soLopGiangDay,
    soLopQuanLy,
    soLopTroGiang,
    isLoading: dangTaiLop,
  } = useTrangChuGiangVien()

  const thongTinCaNhan: ThongTinCaNhanTomTat = useMemo(
    () => ({
      hoVaTen: thongTin.hoVaTen,
      maGiangVien: thongTin.maGiangVien,
      khoa: thongTin.donViCongTac,
      boMon: thongTin.chucDanh,
      hocVi: daoTao.trinhDo || thongTin.hocHam,
      email: thongTin.email,
      dienThoai: thongTin.soDienThoai,
      anhDaiDien: thongTin.anhDaiDien,
    }),
    [thongTin, daoTao]
  )

  const goTo = (path: string) => router.push(path)

  return (
    <div className="flex h-[calc(100vh-80px)] flex-col overflow-y-auto lg:overflow-hidden">
      <Row className="h-full min-h-0 flex-1" gutter={[8, 8]} align="stretch">
        <Col xs={24} xl={18} className="flex h-full min-h-0">
          <div className="flex min-h-0 w-full flex-1 flex-col gap-1">
            <div className="shrink-0">
              <LoiChao hoVaTen={thongTin.hoVaTen} khoa={thongTin.donViCongTac} />
              <div className="mb-1 flex justify-end">
                <BoLocThoiGian />
              </div>
              <TheThongKe
                soLopGiangDay={soLopGiangDay}
                soLopQuanLy={soLopQuanLy}
                soLopTroGiang={soLopTroGiang}
                tongKhaoSat={tongSo}
                khaoSatDangDienRa={thongKeKhaoSat.dangDienRa}
                khaoSatSapDienRa={thongKeKhaoSat.sapDienRa}
                onXemLopGiangDay={() =>
                  goTo(ROUTER_PATH.QL_DAO_TAO.CONG_GIANG_VIEN_LOP_GIANG_DAY_DANH_SACH_LOP_GIANG_DAY)
                }
                onXemLopQuanLy={() => goTo(ROUTER_PATH.QL_DAO_TAO.CONG_GIANG_VIEN_LOP_QUAN_LY)}
                onXemLopTroGiang={() => goTo(ROUTER_PATH.QL_DAO_TAO.CONG_GIANG_VIEN_LOP_TRO_GIANG)}
                onXemKhaoSat={() => goTo(ROUTER_PATH.QL_DAO_TAO.CONG_GIANG_VIEN_KHAO_SAT)}
              />
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-1 lg:grid-cols-2 lg:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="flex h-full min-h-0 flex-col overflow-hidden">
                <LichCuaToi />
              </div>
              <div className="flex h-full min-h-0 flex-col overflow-hidden">
                <BangLopMonHoc
                  gon
                  tieuDe="Lớp giảng dạy"
                  data={lopGiangDay}
                  loading={dangTaiLop}
                  onXemTatCa={() =>
                    goTo(
                      ROUTER_PATH.QL_DAO_TAO.CONG_GIANG_VIEN_LOP_GIANG_DAY_DANH_SACH_LOP_GIANG_DAY
                    )
                  }
                />
              </div>
              <div className="flex h-full min-h-0 flex-col overflow-hidden">
                <BangLopQuanLy
                  gon
                  data={lopQuanLy}
                  loading={dangTaiLop}
                  onXemTatCa={() => goTo(ROUTER_PATH.QL_DAO_TAO.CONG_GIANG_VIEN_LOP_QUAN_LY)}
                />
              </div>
              <div className="flex h-full min-h-0 flex-col overflow-hidden">
                <BangLopMonHoc
                  gon
                  tieuDe="Lớp trợ giảng"
                  data={lopTroGiang}
                  loading={dangTaiLop}
                  onXemTatCa={() => goTo(ROUTER_PATH.QL_DAO_TAO.CONG_GIANG_VIEN_LOP_TRO_GIANG)}
                />
              </div>
            </div>
          </div>
        </Col>

        <Col xs={24} xl={6} className="flex h-full min-h-0 flex-col gap-1">
          <div className="shrink-0">
            <TheThongTinCaNhan thongTin={thongTinCaNhan} isLoading={dangTaiHoSo} />
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <BangThongBao gon />
          </div>
        </Col>
      </Row>
    </div>
  )
}

export default CongGiangVienTrangChuPage
