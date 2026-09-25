import BangDanhBa from "@components/cong-giang-vien/danh-ba/bang-danh-ba"
import CayDonVi from "@components/cong-giang-vien/danh-ba/cay-don-vi"
import type { DonViDanhBa } from "@components/cong-giang-vien/danh-ba/types"
import { findFirstRootId } from "@components/cong-giang-vien/danh-ba/utils"
import { ROUTER_PATH } from "@workspace/router"
import { useFindManyDM_DonVi } from "@workspace/db/hooks"
import { Breadcrumb, Col, Row } from "antd"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function DanhBa() {
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const {
    data: donViData = [],
    isLoading,
    refetch,
  } = useFindManyDM_DonVi({
    where: {
      iLoaiDonVi: {
        in: [0, 1, 2, 3, 4, 5, 6, 7],
      },
    },
    include: {
      userProfiles: {
        where: {
          lecturer: { is: { active: true, deletedAt: null } },
        },
        select: {
          code: true,
          fullname: true,
          email: true,
          phoneNumber: true,
          gender: {
            select: {
              sTen: true,
            },
          },
          academicDegreeType: {
            select: {
              sTen: true,
            },
          },
          academicRankType: {
            select: {
              sTen: true,
            },
          },
          lecturer: {
            select: {
              lecturerType: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: [{ iSTT: "asc" }, { sTen: "asc" }],
  })

  useEffect(() => {
    if (!donViData.length || selectedOrgId) return
    const rootId = findFirstRootId(donViData)
    if (rootId) {
      setSelectedOrgId(rootId)
    }
  }, [donViData, selectedOrgId])

  return (
    <div className="flex h-[calc(100vh-112px)] flex-col gap-4">
      <div className="flex shrink-0 items-center justify-between gap-4 px-1">
        <h1 className="m-0 text-xl font-bold uppercase tracking-wide text-cgv-green-dark">
          Danh bạ Học viện
        </h1>
        <Breadcrumb
          className="text-sm"
          items={[
            {
              title: (
                <Link href={ROUTER_PATH.CONG_GIANG_VIEN.HOME} className="text-gray-500">
                  Trang chủ
                </Link>
              ),
            },
            {
              title: <span className="text-gray-700">Danh bạ</span>,
            },
          ]}
        />
      </div>

      <Row gutter={16} className="min-h-0 flex-1">
        <Col span={6} className="h-full">
          <CayDonVi
            donViData={donViData as DonViDanhBa[]}
            selectedOrgId={selectedOrgId}
            onSelectOrg={setSelectedOrgId}
            loading={isLoading}
          />
        </Col>
        <Col span={18} className="h-full">
          <BangDanhBa
            donViData={donViData as DonViDanhBa[]}
            selectedOrgId={selectedOrgId}
            search={search}
            onSearchChange={setSearch}
            loading={isLoading}
            onReload={() => refetch()}
          />
        </Col>
      </Row>
    </div>
  )
}
