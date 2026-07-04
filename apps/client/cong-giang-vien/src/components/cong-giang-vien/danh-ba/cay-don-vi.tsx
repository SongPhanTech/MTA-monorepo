import type { DonViDanhBa } from "@components/cong-giang-vien/danh-ba/types"
import {
  buildDonViTreeNodes,
  filterDonViByKeyword,
  getAllTreeNodeKeys,
  getDefaultExpandedKeys,
} from "@components/cong-giang-vien/danh-ba/utils"
import { Input, Spin, Tree } from "antd"
import type { DataNode } from "antd/es/tree"
import { useEffect, useMemo, useRef, useState, type Key } from "react"

interface CayDonViProps {
  donViData: DonViDanhBa[]
  selectedOrgId: string | null
  onSelectOrg: (orgId: string) => void
  loading?: boolean
}

const CayDonVi = ({ donViData, selectedOrgId, onSelectOrg, loading }: CayDonViProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [treeHeight, setTreeHeight] = useState(480)
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])
  const [search, setSearch] = useState("")

  const filteredDonViData = useMemo(
    () => filterDonViByKeyword(donViData, search),
    [donViData, search]
  )

  const treeData = useMemo(() => buildDonViTreeNodes(filteredDonViData), [filteredDonViData])

  useEffect(() => {
    if (!treeData.length) return
    setExpandedKeys(search.trim() ? getAllTreeNodeKeys(treeData) : getDefaultExpandedKeys(treeData))
  }, [treeData, search])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const updateHeight = () => {
      setTreeHeight(Math.max(240, el.clientHeight - 16))
    }

    updateHeight()
    const observer = new ResizeObserver(updateHeight)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const handleSelect = (keys: Key[], info: { node: DataNode }) => {
    const key = String(info.node.key)
    if (keys.length > 0) {
      onSelectOrg(key)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-gray-200 bg-white">
      <div className="shrink-0 border-b border-gray-100 p-2">
        <Input
          allowClear
          placeholder="Tìm theo mã, tên đơn vị..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div ref={containerRef} className="min-h-0 flex-1 overflow-hidden p-2">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Spin />
          </div>
        ) : (
          <Tree
            showLine
            blockNode
            selectedKeys={selectedOrgId ? [selectedOrgId] : []}
            expandedKeys={expandedKeys}
            onExpand={(keys) => setExpandedKeys(keys.map(String))}
            onSelect={handleSelect}
            treeData={treeData}
            virtual
            height={treeHeight}
          />
        )}
      </div>
    </div>
  )
}

export default CayDonVi
