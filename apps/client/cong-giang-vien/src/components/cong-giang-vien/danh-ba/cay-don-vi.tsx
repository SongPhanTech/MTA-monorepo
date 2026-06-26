import type { DonViDanhBa } from "@components/cong-giang-vien/danh-ba/types"
import {
  buildDonViTreeNodes,
  getDefaultExpandedKeys,
} from "@components/cong-giang-vien/danh-ba/utils"
import { Spin, Tree } from "antd"
import type { DataNode } from "antd/es/tree"
import { Building2 } from "lucide-react"
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

  const treeData = useMemo(() => buildDonViTreeNodes(donViData), [donViData])

  useEffect(() => {
    if (!treeData.length) return
    setExpandedKeys(getDefaultExpandedKeys(treeData))
  }, [treeData])

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
