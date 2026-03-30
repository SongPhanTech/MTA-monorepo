import { DownOutlined } from "@ant-design/icons"
import MonHocTienQuyetSongHanhPage from "@components/sub-pages/mon-hoc-tien-quyet-song-hanh"
import MonHocTuongDuong from "@components/sub-pages/mon-hoc-tuong-duong"
import DefaultLayout from "@layouts/default-layout"
import type { Subject as SubjectDB, SubjectVersion } from "@workspace/db"
import { useInfiniteFindManySubject } from "@workspace/db/hooks"
import { useTrainingObjectTypeStore } from "@workspace/ui"
import { Col, Divider, Input, Segmented, Spin, Tabs, Tree, Typography } from "antd"
import type { DataNode, EventDataNode } from "antd/es/tree"
import { Search } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

const { Title, Text } = Typography

interface CustomDataNode extends DataNode {
  versionId?: string
  children?: CustomDataNode[]
}

export enum SubjectType {
  prerequisite = "prerequisite",
  parallel = "parallel",
  equivalent = "equivalent",
}

export default function Subject() {
  const numberOfPages = 30
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const treeContainerRef = useRef<HTMLDivElement>(null)
  const [search, setSearch] = useState<string>("")
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([])
  const [activeKey, setActiveKey] = useState(SubjectType.prerequisite)

  const items = [
    {
      key: SubjectType.prerequisite,
      label: "Môn học tiên quyết",
      children: (
        <MonHocTienQuyetSongHanhPage
          subjectVersionId={selectedVersionId || ""}
          keyEnum={SubjectType.prerequisite}
        />
      ),
    },
    {
      key: SubjectType.parallel,
      label: "Môn học song hành",
      children: (
        <MonHocTienQuyetSongHanhPage
          subjectVersionId={selectedVersionId || ""}
          keyEnum={SubjectType.parallel}
        />
      ),
    },
    {
      key: SubjectType.equivalent,
      label: "Môn học tương đương",
      children: <MonHocTuongDuong subjectVersionId={selectedVersionId || ""} />,
    },
  ]

  const fetchArgs = {
    where: {
      subjectVersion: {
        some: {
          ...(trainingObjectTypeId ? { trainingObjectTypeId } : {}),
          ...(search && { name: { contains: search, mode: "insensitive" as const } }),
        },
      },
    },
    include: {
      subjectVersion: true,
    },
    orderBy: {
      name: "asc" as const,
    },
    take: numberOfPages,
  }
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteFindManySubject(fetchArgs, {
      getNextPageParam: (lastPage: [], pages: [][]) => {
        if (lastPage.length < numberOfPages) {
          return undefined
        }
        const fetched = pages.flat().length
        return {
          ...fetchArgs,
          skip: fetched,
        }
      },
    })

  const treeData: CustomDataNode[] =
    data?.pages.flatMap((page) =>
      page.map((subject: SubjectDB & { subjectVersion: SubjectVersion[] }) => ({
        title: subject.name,
        key: `subject-${subject.id}`,
        children: subject.subjectVersion.map((version) => ({
          title: (
            <div className="p-2 rounded cursor-pointer">
              <div className="font-semibold">{version.name}</div>
              <div className="text-sm text-gray-500">{version.code || ""}</div>
              <div className="text-xs text-gray-400">{version.credit || ""} tín chỉ</div>
            </div>
          ),
          key: `version-${version.id}`,
          isLeaf: true,
          versionId: version.id,
        })),
      }))
    ) || []

  const handleScroll = useCallback(() => {
    if (treeContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = treeContainerRef.current
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100

      if (isNearBottom && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const onSelect = (
    selectedKeys: React.Key[],
    info: {
      event: "select"
      selected: boolean
      node: EventDataNode<CustomDataNode>
      selectedNodes: CustomDataNode[]
      nativeEvent: MouseEvent
    }
  ) => {
    if (selectedKeys.length > 0) {
      const selectedKey = selectedKeys[0] as string

      if (selectedKey.includes("version-")) {
        const versionId = selectedKey.replace("version-", "")
        setSelectedVersionId(versionId)
      }
    }
  }
  useEffect(() => {
    if (treeData.length > 0 && expandedKeys.length === 0) {
      const keys = treeData.map((node) => node.key)
      setExpandedKeys(keys)
    }
  }, [treeData, expandedKeys.length])

  useEffect(() => {
    const container = treeContainerRef.current
    if (container) {
      container.addEventListener("scroll", handleScroll)
      return () => container.removeEventListener("scroll", handleScroll)
    }
  }, [handleScroll])

  return (
    <div className="flex gap-2 mr-2 h-full">
      <Col span={5} className="bg-white rounded-lg shadow-sm flex flex-col">
        <div className="px-4 pt-4">
          <Title level={4}>Danh mục môn học</Title>
          <Input
            id="search"
            className="w-full"
            placeholder="Tìm kiếm môn học"
            prefix={
              <Search
                size={15}
                style={{
                  color: "rgba(0, 0, 0, 0.25)",
                }}
              />
            }
            allowClear
            style={{ height: 32 }}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Divider className="my-3" />
        </div>
        <div
          ref={treeContainerRef}
          className="overflow-y-auto flex-1"
          style={{ maxHeight: "calc(100vh - 200px)" }}
        >
          <Tree<CustomDataNode>
            treeData={treeData}
            expandedKeys={expandedKeys}
            onExpand={(keys) => setExpandedKeys(keys as React.Key[])}
            onSelect={onSelect}
            selectedKeys={selectedVersionId ? [`version-${selectedVersionId}`] : []}
            selectable={true}
            showLine
            switcherIcon={<DownOutlined />}
            className="subject-tree px-4"
          />
          {isFetchingNextPage && (
            <div className="flex justify-center p-4">
              <Spin />
            </div>
          )}
          {isLoading && (
            <div className="flex justify-center p-4">
              <Spin />
            </div>
          )}
        </div>
      </Col>
      <Col span={19} className="p-4">
        {selectedVersionId ? (
          <>
            <Segmented
              value={activeKey}
              onChange={(val) => setActiveKey(val)}
              options={[
                { label: "Môn học tiên quyết", value: SubjectType.prerequisite },
                { label: "Môn học song hành", value: SubjectType.parallel },
                { label: "Môn học tương đương", value: SubjectType.equivalent },
              ]}
              style={{ marginBottom: 14 }}
              className="w-full flex justify-between"
              size="large"
            />
            <style jsx global>{`
              .ant-segmented.w-full .ant-segmented-item {
                flex: 1;
                justify-content: center;
              }
            `}</style>

            <Tabs
              activeKey={activeKey}
              onChange={(key) => setActiveKey(key as SubjectType)}
              items={items}
              tabBarStyle={{ display: "none" }}
            />
          </>
        ) : (
          <Text>Vui lòng chọn một phiên bản môn học từ danh sách bên trái</Text>
        )}
      </Col>
    </div>
  )
}

Subject.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout unLayout={true}>{page}</DefaultLayout>
}
