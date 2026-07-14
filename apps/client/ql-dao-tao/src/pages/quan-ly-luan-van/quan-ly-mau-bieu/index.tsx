import { FileOutlined, FolderOutlined, SearchOutlined, UploadOutlined } from "@ant-design/icons"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import { useQuery } from "@tanstack/react-query"
import {
  generatePresignedUrl,
  deleteObject,
  listObjects,
  presignedGetObject,
  useListObjects,
} from "@workspace/libs/api/model"
import type { BucketItemDto } from "@workspace/libs/api/schemas"
import { normalizeVietnamese } from "@workspace/libs/utils"
import { OnlyOfficeViewer, supportedDocFileTypes, supportedImageFileTypes } from "@workspace/ui"
import {
  Badge,
  Button,
  Empty,
  Flex,
  Image,
  Input,
  message,
  Popconfirm,
  Spin,
  Tooltip,
  Tree,
  Typography,
  Upload,
} from "antd"
import type { DataNode } from "antd/es/tree"
import axios from "axios"
import dayjs from "dayjs"
import _ from "lodash"
import { Download, RefreshCcw, Trash2 } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState, type Key, type MouseEvent } from "react"

const { Text } = Typography

const LUAN_VAN_PREFIX = "luan-van/"
const LUAN_VAN_PATH = "luan-van"
const LIST_ALL_OBJECTS_LIMIT = 10_000
const MAX_UPLOAD_SIZE_MB = 50

type MauBieuTreeNode = DataNode & {
  isFile?: boolean
  isFolder?: boolean
  folderPrefix?: string
  objectName?: string
  item?: BucketItemDto
}

const toFolderPrefix = (relativePath: string) => {
  const normalized = relativePath.replace(/^\/+|\/+$/g, "")
  return normalized ? `${LUAN_VAN_PREFIX}${normalized}/` : LUAN_VAN_PREFIX
}

const prefixToTreeKey = (prefix: string) => stripPrefix(prefix).replace(/\/$/, "")

type TreeAccumulator = {
  children: Map<string, TreeAccumulator>
  file?: BucketItemDto
}

const splitFileName = (fileName: string) => {
  const lastDot = fileName.lastIndexOf(".")
  if (lastDot <= 0) return { baseName: fileName, extension: "" }
  return {
    baseName: fileName.slice(0, lastDot),
    extension: fileName.slice(lastDot + 1),
  }
}

const formatBytes = (bytes?: number) => {
  if (bytes === undefined || bytes === null) return ""
  if (bytes === 0) return "0 B"
  const units = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, i)
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`
}

const stripPrefix = (name: string | undefined) => {
  if (!name) return ""
  return name.startsWith(LUAN_VAN_PREFIX) ? name.slice(LUAN_VAN_PREFIX.length) : name
}

const isFileEntry = (item: BucketItemDto) => Boolean(item.name)
const isFolderEntry = (item: BucketItemDto) => !item.name && Boolean(item.prefix)

const getDisplayName = (item: BucketItemDto) => {
  if (item.name) return stripPrefix(item.name)
  if (item.prefix) {
    const relative = stripPrefix(item.prefix).replace(/\/$/, "")
    const parts = relative.split("/").filter(Boolean)
    return parts[parts.length - 1] || relative
  }
  return ""
}

const getFileExtension = (fileName: string) => fileName.split(".").pop()?.toLowerCase() || ""

const normalizeBucketItems = (value: unknown): BucketItemDto[] => {
  if (Array.isArray(value)) return value
  if (value && typeof value === "object" && "data" in value) {
    const nestedData = (value as { data?: unknown }).data
    if (Array.isArray(nestedData)) return nestedData
  }
  return []
}

const getOrCreateChild = (parent: TreeAccumulator, name: string): TreeAccumulator => {
  if (!parent.children.has(name)) {
    parent.children.set(name, { children: new Map() })
  }
  return parent.children.get(name)!
}

const buildFileTreeFromItems = (items: BucketItemDto[]): MauBieuTreeNode[] => {
  const root: TreeAccumulator = { children: new Map() }

  for (const item of items) {
    if (item.name) {
      const relativePath = stripPrefix(item.name)
      if (!relativePath) continue
      const parts = relativePath.split("/").filter(Boolean)
      let node = root
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        const isLast = i === parts.length - 1
        node = getOrCreateChild(node, part)
        if (isLast) {
          node.file = item
        }
      }
      continue
    }

    if (item.prefix) {
      const relativePath = stripPrefix(item.prefix).replace(/\/$/, "")
      if (!relativePath) continue
      const parts = relativePath.split("/").filter(Boolean)
      let node = root
      for (const part of parts) {
        node = getOrCreateChild(node, part)
      }
    }
  }

  const convertNode = (node: TreeAccumulator, parentKey: string): MauBieuTreeNode[] => {
    const entries = Array.from(node.children.entries()).sort(([nameA, childA], [nameB, childB]) => {
      const aIsFile = Boolean(childA.file) && childA.children.size === 0
      const bIsFile = Boolean(childB.file) && childB.children.size === 0
      if (aIsFile !== bIsFile) return aIsFile ? 1 : -1
      return nameA.localeCompare(nameB, "vi")
    })

    return entries.map(([name, child]) => {
      const key = parentKey ? `${parentKey}/${name}` : name
      const childNodes = convertNode(child, key)
      const isLeafFile = Boolean(child.file) && child.children.size === 0

      if (isLeafFile && child.file) {
        return {
          key,
          title: name,
          isLeaf: true,
          isFile: true,
          objectName: child.file.name,
          item: child.file,
          icon: <FileOutlined />,
        }
      }

      const relativePath = parentKey ? `${parentKey}/${name}` : name

      return {
        key,
        title: name,
        isFile: false,
        isFolder: true,
        folderPrefix: toFolderPrefix(relativePath),
        selectable: false,
        icon: <FolderOutlined />,
        children: childNodes,
      }
    })
  }

  return convertNode(root, "")
}

const findFirstFileNode = (nodes: MauBieuTreeNode[]): MauBieuTreeNode | null => {
  for (const node of nodes) {
    if (node.isFile && node.objectName) return node
    if (node.children?.length) {
      const found = findFirstFileNode(node.children as MauBieuTreeNode[])
      if (found) return found
    }
  }
  return null
}

const findFileNodeByObjectName = (
  nodes: MauBieuTreeNode[],
  objectName: string
): MauBieuTreeNode | null => {
  for (const node of nodes) {
    if (node.objectName === objectName) return node
    if (node.children?.length) {
      const found = findFileNodeByObjectName(node.children as MauBieuTreeNode[], objectName)
      if (found) return found
    }
  }
  return null
}

const mergeBucketItems = (...groups: BucketItemDto[][]) => {
  const byKey = new Map<string, BucketItemDto>()
  for (const group of groups) {
    for (const item of group) {
      const key = item.name ?? item.prefix
      if (key) byKey.set(key, item)
    }
  }
  return Array.from(byKey.values())
}

export default function QuanLyMauBieu() {
  const [uploading, setUploading] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const [searchText, setSearchText] = useState("")
  const [deletingObjectName, setDeletingObjectName] = useState<string | null>(null)
  const [selectedObjectName, setSelectedObjectName] = useState<string | null>(null)
  const [selectedTreeKey, setSelectedTreeKey] = useState<string | null>(null)
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])
  const [folderListings, setFolderListings] = useState<Record<string, BucketItemDto[]>>({})
  const [loadingFolderPrefixes, setLoadingFolderPrefixes] = useState<Set<string>>(new Set())
  const loadedFolderPrefixesRef = useRef<Set<string>>(new Set())

  const { showSpinner, hideSpinner } = useSpinner()

  const debouncedSetSearch = useCallback(
    _.debounce((value: string) => {
      setSearchText(value)
    }, 300),
    []
  )

  useEffect(() => {
    return () => debouncedSetSearch.cancel()
  }, [debouncedSetSearch])

  const queryParams = useMemo(
    () => ({
      path: LUAN_VAN_PREFIX,
      limit: LIST_ALL_OBJECTS_LIMIT,
    }),
    []
  )

  const { data, isFetching, refetch } = useListObjects(queryParams, {
    query: {
      placeholderData: (prev) => prev,
    },
  })

  const rootItems = useMemo(() => normalizeBucketItems(data?.data), [data])

  const nestedItems = useMemo(() => Object.values(folderListings).flat(), [folderListings])

  const allItems = useMemo(() => mergeBucketItems(rootItems, nestedItems), [rootItems, nestedItems])

  const fileItems = useMemo(() => allItems.filter(isFileEntry), [allItems])

  const folderItems = useMemo(() => allItems.filter(isFolderEntry), [allItems])

  const loadFolderContents = useCallback(async (folderPrefix: string) => {
    if (loadedFolderPrefixesRef.current.has(folderPrefix)) return
    loadedFolderPrefixesRef.current.add(folderPrefix)

    setLoadingFolderPrefixes((prev) => new Set(prev).add(folderPrefix))
    try {
      const res = await listObjects({ path: folderPrefix, limit: LIST_ALL_OBJECTS_LIMIT })
      setFolderListings((prev) => ({
        ...prev,
        [folderPrefix]: normalizeBucketItems(res.data),
      }))
    } catch (error) {
      console.error(error)
      message.error("Không thể tải nội dung thư mục.")
      loadedFolderPrefixesRef.current.delete(folderPrefix)
      setFolderListings((prev) => ({ ...prev, [folderPrefix]: [] }))
    } finally {
      setLoadingFolderPrefixes((prev) => {
        const next = new Set(prev)
        next.delete(folderPrefix)
        return next
      })
    }
  }, [])

  const treeSourceItems = useMemo(() => {
    const keyword = normalizeVietnamese(searchText.trim())
    if (!keyword) {
      return allItems
    }

    const matchedFiles = fileItems.filter((item) =>
      normalizeVietnamese(getDisplayName(item)).includes(keyword)
    )

    const matchedFolders = folderItems.filter((item) => {
      const relative = stripPrefix(item.prefix).replace(/\/$/, "")
      return normalizeVietnamese(relative).includes(keyword)
    })

    const ancestorFolderPaths = new Set<string>()
    for (const file of matchedFiles) {
      const parts = stripPrefix(file.name).split("/").filter(Boolean)
      for (let i = 0; i < parts.length - 1; i++) {
        ancestorFolderPaths.add(parts.slice(0, i + 1).join("/"))
      }
    }

    const ancestorFolders = folderItems.filter((item) => {
      const relative = stripPrefix(item.prefix).replace(/\/$/, "")
      return ancestorFolderPaths.has(relative)
    })

    return mergeBucketItems(matchedFiles, matchedFolders, ancestorFolders)
  }, [allItems, fileItems, folderItems, searchText])

  const treeData = useMemo(() => buildFileTreeFromItems(treeSourceItems), [treeSourceItems])

  useEffect(() => {
    const rootFolders = rootItems.filter(isFolderEntry)
    if (rootFolders.length === 0) return

    rootFolders.forEach((item) => {
      if (item.prefix) void loadFolderContents(item.prefix)
    })

    setExpandedKeys((prev) => {
      const keys = rootFolders.map((item) => prefixToTreeKey(item.prefix!))
      return [...new Set([...prev, ...keys])]
    })
  }, [rootItems, loadFolderContents])

  useEffect(() => {
    if (!selectedObjectName) {
      const firstFile = findFirstFileNode(treeData)
      if (firstFile?.objectName) {
        setSelectedObjectName(firstFile.objectName)
        setSelectedTreeKey(String(firstFile.key))
      }
      return
    }

    const stillExists = findFileNodeByObjectName(treeData, selectedObjectName)
    if (!stillExists) {
      const firstFile = findFirstFileNode(treeData)
      setSelectedObjectName(firstFile?.objectName ?? null)
      setSelectedTreeKey(firstFile ? String(firstFile.key) : null)
      return
    }

    setSelectedTreeKey(String(stillExists.key))
  }, [treeData, selectedObjectName])

  const selectedItem = useMemo(
    () => fileItems.find((item) => item.name === selectedObjectName),
    [fileItems, selectedObjectName]
  )

  const selectedDisplayName = selectedItem ? getDisplayName(selectedItem) : ""
  const selectedFileType = getFileExtension(selectedDisplayName)

  const {
    data: previewUrl,
    isFetching: previewLoading,
    isError: previewError,
  } = useQuery({
    queryKey: ["mau-bieu-preview", selectedObjectName],
    queryFn: async () => {
      const res = await presignedGetObject({ objectName: selectedObjectName! })
      if (res.status !== 200) {
        throw new Error("message" in res.data ? res.data.message : "Không thể tạo presigned URL")
      }
      return res.data.url
    },
    enabled: Boolean(selectedObjectName),
    refetchOnWindowFocus: false,
  })

  const handleReload = () => {
    loadedFolderPrefixesRef.current.clear()
    setFolderListings({})
    refetch()
  }

  const handleTreeExpand = (keys: Key[], info: { expanded: boolean; node: MauBieuTreeNode }) => {
    setExpandedKeys(keys as string[])
    if (info.expanded && info.node.folderPrefix) {
      void loadFolderContents(info.node.folderPrefix)
    }
  }

  const handleSelectFile = (objectName: string, treeKey: string) => {
    setSelectedObjectName(objectName)
    setSelectedTreeKey(treeKey)
  }

  const handleDownload = async (objectName: string, e?: MouseEvent) => {
    e?.stopPropagation()
    try {
      showSpinner()
      const res = await presignedGetObject({ objectName })
      if (res.status !== 200) {
        throw new Error("message" in res.data ? res.data.message : "Không thể tạo presigned URL")
      }
      const response = await fetch(res.data.url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const downloadName = stripPrefix(objectName) || objectName
      const anchor = document.createElement("a")
      anchor.href = blobUrl
      anchor.download = downloadName.split("/").pop() || downloadName
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error(error)
      message.error("Không thể tải file. Vui lòng thử lại.")
    } finally {
      hideSpinner()
    }
  }

  const handleDelete = async (objectName: string) => {
    try {
      setDeletingObjectName(objectName)
      showSpinner()
      const res = await deleteObject({ objectName })
      if (res.status !== 200) {
        throw new Error(`HTTP ${res.status}`)
      }
      message.success(`Đã xóa "${stripPrefix(objectName)}".`)
      if (selectedObjectName === objectName) {
        setSelectedObjectName(null)
        setSelectedTreeKey(null)
      }
      await refetch()
    } catch (error) {
      console.error(error)
      message.error("Không thể xóa file. Vui lòng thử lại.")
    } finally {
      setDeletingObjectName(null)
      hideSpinner()
    }
  }

  const uploadSingle = async (file: File) => {
    const { baseName, extension } = splitFileName(file.name)
    const resPresignedUrl = await generatePresignedUrl({
      path: LUAN_VAN_PATH,
      extension,
      name: baseName || undefined,
      flat: true,
    })

    if (resPresignedUrl.status !== 200) {
      throw new Error(
        "message" in resPresignedUrl.data
          ? resPresignedUrl.data.message
          : "Không thể tạo presigned URL"
      )
    }

    await axios.put(resPresignedUrl.data.url, file, {
      headers: { "Content-Type": file.type || "application/octet-stream" },
    })
  }

  const handleUpload = async (file: File) => {
    try {
      setUploading(true)
      showSpinner()
      await uploadSingle(file)
      message.success(`Đã tải lên "${file.name}".`)
      await refetch()
    } catch (error) {
      console.error(error)
      message.error(`Không thể tải lên "${file.name}". Vui lòng thử lại.`)
    } finally {
      setUploading(false)
      hideSpinner()
    }
  }

  const renderTreeTitle = (node: MauBieuTreeNode) => {
    if (node.isFolder || (!node.isFile && !node.objectName)) {
      const isLoading =
        node.folderPrefix !== undefined && loadingFolderPrefixes.has(node.folderPrefix)

      return (
        <Flex align="center" gap={6} className="min-w-0 h-8">
          <FolderOutlined className="text-amber-500 text-sm shrink-0 leading-none" />
          <Text strong className="text-[13px] text-gray-700 truncate leading-snug">
            {String(node.title)}
          </Text>
          {isLoading && <Spin size="small" />}
        </Flex>
      )
    }

    if (!node.objectName) {
      return <span>{String(node.title)}</span>
    }

    const objectName = node.objectName
    const displayName = String(node.title)
    const isSelected = selectedObjectName === objectName

    return (
      <div
        className={`group flex items-center gap-2 w-full min-w-0 h-8 rounded-md px-1 ${
          isSelected ? "bg-[#e8f5ef]" : "hover:bg-gray-50"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <FileOutlined className="shrink-0 text-gray-400 text-xs" />
        <Tooltip title={displayName}>
          <button
            type="button"
            className={`flex-1 min-w-0 text-left text-[13px] truncate border-0 bg-transparent p-0 cursor-pointer ${
              isSelected ? "text-[#16774b] font-medium" : "text-gray-800"
            }`}
            onClick={() => handleSelectFile(objectName, String(node.key))}
          >
            {displayName}
          </button>
        </Tooltip>
        <Flex gap={0} className="shrink-0 opacity-70 group-hover:opacity-100">
          <Tooltip title="Tải xuống">
            <Button
              type="text"
              size="small"
              className="!w-7 !h-7"
              icon={<Download size={15} />}
              onClick={(e) => handleDownload(objectName, e)}
            />
          </Tooltip>
          <Popconfirm
            title={`Xóa file "${displayName}"?`}
            description="Hành động này không thể hoàn tác."
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{
              danger: true,
              loading: deletingObjectName === objectName,
            }}
            onConfirm={() => handleDelete(objectName)}
          >
            <Tooltip title="Xóa file">
              <Button
                type="text"
                size="small"
                danger
                className="!w-7 !h-7"
                icon={<Trash2 size={15} />}
                loading={deletingObjectName === objectName}
                onClick={(e) => e.stopPropagation()}
              />
            </Tooltip>
          </Popconfirm>
        </Flex>
      </div>
    )
  }

  const renderPreviewContent = () => {
    if (!selectedObjectName) {
      return (
        <Empty className="my-auto" description="Chọn một file ở danh sách bên trái để xem trước" />
      )
    }

    if (previewLoading) {
      return (
        <Flex align="center" justify="center" className="flex-1 min-h-[400px]">
          <Spin tip="Đang tải file xem trước..." />
        </Flex>
      )
    }

    if (previewError || !previewUrl) {
      return (
        <Empty className="my-auto" description="Không thể tải file xem trước. Vui lòng thử lại." />
      )
    }

    if (supportedImageFileTypes.includes(selectedFileType)) {
      return (
        <Flex align="center" justify="center" className="absolute inset-0 p-4 overflow-auto">
          <Image
            src={previewUrl}
            alt={selectedDisplayName}
            className="max-h-full max-w-full object-contain shadow-sm rounded"
            preview={false}
          />
        </Flex>
      )
    }

    if (supportedDocFileTypes.includes(selectedFileType)) {
      return (
        <div className="absolute inset-0">
          <OnlyOfficeViewer
            key={selectedObjectName}
            uri={previewUrl}
            title={selectedDisplayName}
            fileType={selectedFileType}
            mode="view"
            allowDownload={false}
            containerClassName="w-full h-full"
            editorHeight="100%"
          />
        </div>
      )
    }

    return (
      <Empty
        className="my-auto"
        description={`Định dạng .${selectedFileType || "unknown"} chưa hỗ trợ xem trước. Vui lòng tải xuống từ danh sách bên trái.`}
      />
    )
  }

  const fileCount = fileItems.length

  return (
    <div className="flex flex-col gap-3 h-[calc(100vh-168px)] min-h-[620px]">
      <Flex align="center" justify="space-between" gap={12} className="shrink-0">
        <h2 className="text-base font-semibold m-0">Quản lý mẫu biểu/tài liệu phòng sau đại học</h2>
        <Upload
          multiple
          showUploadList={false}
          beforeUpload={(file: File) => {
            const isValidSize = file.size / 1024 / 1024 < MAX_UPLOAD_SIZE_MB
            if (!isValidSize) {
              message.error(`"${file.name}" vượt quá ${MAX_UPLOAD_SIZE_MB}MB.`)
              return Upload.LIST_IGNORE
            }
            handleUpload(file)
            return false
          }}
        >
          <Button type="primary" icon={<UploadOutlined />} loading={uploading}>
            Tải file lên
          </Button>
        </Upload>
      </Flex>

      <div className="grid grid-cols-[minmax(280px,340px)_1fr] gap-4 flex-1 min-h-0">
        {/* Sidebar */}
        <section className="flex flex-col min-h-0 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-3 py-2.5 border-b border-gray-100 bg-gray-50/80 shrink-0">
            <Flex align="center" justify="space-between" gap={8}>
              <Text strong className="text-sm">
                Danh sách tài liệu
              </Text>
              <Badge
                count={fileCount}
                showZero
                color="#16774b"
                overflowCount={9999}
                className="[&_.ant-badge-count]:text-[11px]"
              />
            </Flex>
          </div>

          <div className="p-3 space-y-2.5 shrink-0 border-b border-gray-100">
            <Input
              placeholder="Tìm kiếm theo tên file"
              prefix={<SearchOutlined className="text-gray-400" />}
              allowClear
              size="middle"
              value={searchInput}
              onChange={(e) => {
                const value = e.target.value
                setSearchInput(value)
                debouncedSetSearch(value)
              }}
              onClear={() => {
                setSearchInput("")
                debouncedSetSearch.cancel()
                setSearchText("")
              }}
            />
            <Button
              block
              icon={<RefreshCcw size={14} />}
              onClick={handleReload}
              loading={isFetching}
            >
              Tải lại danh sách
            </Button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-1 py-2 mau-bieu-file-tree">
            {isFetching && treeData.length === 0 ? (
              <Flex align="center" justify="center" className="h-40">
                <Spin />
              </Flex>
            ) : treeData.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={searchText ? "Không tìm thấy file phù hợp" : "Chưa có file nào"}
                className="mt-10"
              />
            ) : (
              <Tree
                blockNode
                showIcon={false}
                treeData={treeData}
                expandedKeys={expandedKeys}
                onExpand={handleTreeExpand}
                selectedKeys={selectedTreeKey ? [selectedTreeKey] : []}
                onSelect={(_, info) => {
                  const node = info.node as MauBieuTreeNode
                  if (node.isFile && node.objectName) {
                    handleSelectFile(node.objectName, String(node.key))
                  }
                }}
                titleRender={(node) => renderTreeTitle(node as MauBieuTreeNode)}
              />
            )}
          </div>
        </section>

        {/* Preview */}
        <section className="flex flex-col min-h-0 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 shrink-0 bg-gray-50/50">
            {selectedItem ? (
              <Flex vertical gap={2}>
                <Text
                  strong
                  className="text-[15px] leading-snug"
                  ellipsis
                  title={selectedDisplayName}
                >
                  {selectedDisplayName}
                </Text>
                <Flex wrap="wrap" gap={12} className="text-xs text-gray-500">
                  <span>Kích thước: {formatBytes(selectedItem.size)}</span>
                  <span>
                    Cập nhật:{" "}
                    {selectedItem.lastModified
                      ? dayjs(selectedItem.lastModified).format("HH:mm DD/MM/YYYY")
                      : "—"}
                  </span>
                </Flex>
              </Flex>
            ) : (
              <Text type="secondary">Xem trước tài liệu</Text>
            )}
          </div>

          <div className="relative flex-1 min-h-0 bg-[#f3f4f6]">
            {!selectedObjectName || previewLoading || previewError || !previewUrl ? (
              <Flex align="center" justify="center" className="absolute inset-0 p-6">
                {renderPreviewContent()}
              </Flex>
            ) : (
              renderPreviewContent()
            )}
          </div>
        </section>
      </div>

      <style jsx global>{`
        .mau-bieu-file-tree .ant-tree-treenode {
          display: flex;
          align-items: center;
          padding-bottom: 2px;
        }
        .mau-bieu-file-tree .ant-tree-switcher {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          align-self: center;
          width: 24px;
          height: 32px;
          line-height: 0;
          margin-inline-end: 2px;
          background: transparent !important;
        }
        .mau-bieu-file-tree .ant-tree-switcher::before {
          top: auto !important;
        }
        .mau-bieu-file-tree .ant-tree-switcher .ant-tree-switcher-icon,
        .mau-bieu-file-tree .ant-tree-switcher .ant-select-tree-switcher-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          line-height: 0;
          vertical-align: middle;
        }
        .mau-bieu-file-tree .ant-tree-switcher-leaf-line::before,
        .mau-bieu-file-tree .ant-tree-switcher-leaf-line::after {
          top: 50%;
        }
        .mau-bieu-file-tree .ant-tree-indent {
          align-self: center;
        }
        .mau-bieu-file-tree .ant-tree-node-content-wrapper {
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 0;
          min-height: 32px;
          line-height: normal;
          padding: 0 6px 0 4px !important;
          border-radius: 6px;
        }
        .mau-bieu-file-tree .ant-tree-title {
          display: flex;
          align-items: center;
          width: 100%;
          min-height: 32px;
        }
        .mau-bieu-file-tree .ant-tree-node-selected .ant-tree-node-content-wrapper {
          background: transparent !important;
        }
        .mau-bieu-file-tree .ant-tree-indent-unit {
          width: 16px;
        }
      `}</style>
    </div>
  )
}

QuanLyMauBieu.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
