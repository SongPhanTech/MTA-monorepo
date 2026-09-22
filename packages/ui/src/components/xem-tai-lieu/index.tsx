import { useQuery } from "@tanstack/react-query"
import { createId } from "@workspace/db"
import { convertDocument } from "@workspace/libs/api/model"
import { signOnlyOfficeConfig } from "@workspace/libs/api/onlyoffice"
import { getMinioUrl } from "@workspace/libs/utils"
import { Image, Modal } from "antd"
import { useEffect, useId, useRef } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
export type DocumentType =
  | "word"
  | "cell"
  | "slide"
  | "pdf"
  | "diagram"
  | "text"
  | "spreadsheet"
  | "presentation"

export type OnlyOfficeFullConfig = Partial<{
  type: "desktop" | "mobile" | "embedded"
  width: string
  height: string
  token: string
  documentType: DocumentType

  document: Partial<{
    title: string
    url: string
    fileType: string
    key: string
    vkey: string
    referenceData: string
    info: Partial<{
      owner: string
      folder: string
      uploaded: string
      sharingSettings: {
        user: string
        permissions: string
        isLink: boolean
      }[]
      favorite: boolean
    }>
    permissions: Partial<{
      edit: boolean
      download: boolean
      reader: boolean
      review: boolean
      print: boolean
      comment: boolean
      modifyFilter: boolean
      modifyContentControl: boolean
      fillForms: boolean
      copy: boolean
      editCommentAuthorOnly: boolean
      deleteCommentAuthorOnly: boolean
      reviewGroups: string[]
      commentGroups: {
        view?: string[]
        edit?: string[]
        remove?: string[]
      }
      userInfoGroups: string[]
      protect: boolean
      chat: boolean
    }>
    options: Record<string, any>
  }>

  editorConfig: Partial<{
    mode: "view" | "edit"
    lang: string
    location: string
    canCoAuthoring: boolean
    createUrl: string
    sharingSettingsUrl: string
    fileChoiceUrl: string
    callbackUrl: string
    saveAsUrl: string
    licenseUrl: string
    customerId: string
    region: string
    user: Partial<{
      id: string
      name: string
      group: string
      image: string
      roles: string[]
    }>
    recent: {
      title: string
      url: string
      folder?: string
    }[]
    templates: {
      title: string
      image: string
      url: string
    }[]
    customization: Partial<{
      logo: Partial<{
        image: string
        imageDark: string
        imageLight: string
        url: string
        visible: boolean
      }>
      customer: Partial<{
        name: string
        address: string
        mail: string
        www: string
        phone: string
        info: string
        logo: string
        logoDark: string
      }>
      about: boolean
      feedback: {
        visible: boolean
        url?: string
      }
      goback: {
        url?: string
        text?: string
        blank?: boolean
        requestClose?: boolean
      }
      close: {
        visible?: boolean
        text?: string
      }
      reviewPermissions: Record<string, string[]>
      anonymous: {
        request?: boolean
        label?: string
      }
      review: Partial<{
        hideReviewDisplay: boolean
        hoverMode: boolean
        showReviewChanges: boolean
        reviewDisplay: "original" | "markup"
        trackChanges: boolean
      }>
      layout: Partial<{
        toolbar: boolean | Record<string, any>
        header: Record<string, boolean>
        leftMenu: Record<string, boolean>
        rightMenu: Record<string, boolean>
        statusBar: Record<string, boolean>
      }>
      features: Partial<{
        spellcheck: boolean | { mode: boolean; change: boolean }
        roles: boolean
        tabStyle: any
        tabBackground: any
        featuresTips: boolean
      }>
      font: Partial<{
        name: string
        size: string
      }>
      chat: boolean
      comments: boolean
      zoom: number
      compactToolbar: boolean
      toolbar: boolean
      statusBar: boolean
      autosave: boolean
      forcesave: boolean
      help: boolean
      compatibleFeatures: boolean
      unit: "cm" | "pt" | "inch"
      mentionShare: boolean
      macros: boolean
      plugins: boolean
      macrosMode: "enable" | "disable" | "warn"
      trackChanges: boolean
      hideRulers: boolean
      hideNotes: boolean
      uiTheme: string
      integrationMode: "embed"
      pointerMode: "select" | "hand"
      mobile: {
        forceView?: boolean
        standardView?: boolean
        disableForceDesktop?: boolean
      }
      submitForm: {
        visible?: boolean
        resultMessage?: string | null
      }
      forceWesternFontSize: boolean
      slidePlayerBackground: string
      wordHeadingsColor: string
      showVerticalScroll: boolean
      showHorizontalScroll: boolean
      startFillingForm: {
        text?: string
      }
    }>
    coEditing: {
      mode?: "fast" | "strict"
      change?: boolean
    }
    plugins: {
      autostart?: string[]
      pluginsData?: string[]
    }
    wopi: {
      FileNameMaxLength?: number
    }
    actionLink: {
      action: {
        type: "bookmark" | "comment"
        data: string
      }
    }
  }>

  events: Partial<{
    onAppReady: () => void
    onDocumentStateChange: (state: any) => void
    onDocumentReady: () => void
    onRequestEditRights: () => void
    onRequestHistory: () => void
    onRequestHistoryData: () => void
    onRequestRestore: () => void
    onRequestHistoryClose: () => void
    onError: (error: any) => void
    onWarning: (warning: any) => void
    onInfo: (info: any) => void
    onOutdatedVersion: () => void
    onDownloadAs: (data: { data: { url: string } }) => void
    onRequestSaveAs: (event: {
      data: {
        url: string
        title: string
        fileType: string
      }
    }) => void
    onCollaborativeChanges: (changes: any) => void
    onRequestRename: () => void
    onMetaChange: () => void
    onRequestClose: () => void
    onMakeActionLink: () => void
    onRequestUsers: () => void
    onRequestSendNotify: () => void
    onRequestInsertImage: () => void
    onRequestCompareFile: () => void
    onRequestSharingSettings: () => void
    onRequestCreateNew: () => void
    onRequestReferenceData: () => void
    onRequestOpen: () => void
    onRequestSelectDocument: () => void
    onRequestSelectSpreadsheet: () => void
    onRequestReferenceSource: () => void
    onSaveDocument: () => void
    onRequestStartFilling: () => void
    onSubmit: () => void
    onRequestRefreshFile: () => void
    onUserActionRequired: () => void
    onRequestFillingStatus: () => void
    onStartFilling: () => void
  }>
}>

export const supportedDocFileTypes = [
  "doc",
  "docx",
  "txt",
  "pdf",
  "odt",
  "xls",
  "xlsx",
  "ods",
  "csv",
  "ppt",
  "pptx",
  "odp",
]

export const supportedImageFileTypes = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"]

type Props = {
  uri: string
  title?: string
  fileType?: string // ví dụ: 'docx', 'xlsx', 'pptx'
  mode?: "view" | "edit"
  documentServerUrl?: string // Mặc định là http://localhost
  allowDownload?: boolean
  containerClassName?: string
  editorHeight?: string
  /** OnlyOffice save callback (required for edit mode to persist). */
  callbackUrl?: string
  /** Stable document key; bump when file content is replaced so editor reloads. */
  documentKey?: string
  /**
   * When set, `downloadAs` / Save-as events call this with the temporary file URL
   * instead of triggering a browser download. Useful for client-side persist.
   */
  onDownloadAsUrl?: (url: string) => void
}

declare global {
  interface Window {
    DocsAPI: any
    docEditor: any
  }
}

const OnlyOfficeViewer = ({
  uri,
  title = "Tài liệu",
  fileType = "docx",
  mode = "view",
  allowDownload = true,
  containerClassName = "w-full h-full",
  editorHeight = "100%",
  callbackUrl,
  documentKey,
  onDownloadAsUrl,
}: Props) => {
  const containerId = useId().replace(/:/g, "")
  const canEdit = mode === "edit"
  const onDownloadAsUrlRef = useRef(onDownloadAsUrl)
  onDownloadAsUrlRef.current = onDownloadAsUrl

  useEffect(() => {
    let cancelled = false
    const editorNodeId = documentKey || createId()

    const placeholderContainer = document.getElementById(containerId)
    if (!window.DocsAPI) return

    while (placeholderContainer?.firstChild) {
      if (placeholderContainer.lastChild)
        placeholderContainer.removeChild(placeholderContainer.lastChild)
    }
    window.docEditor?.destroyEditor?.()
    const placeholder = document.createElement("div")
    placeholder.id = editorNodeId
    placeholder.style.height = "100%"
    placeholderContainer?.appendChild(placeholder)

    const config = {
      width: "100%",
      height: editorHeight,
      type: allowDownload || canEdit ? "desktop" : "embedded",
      documentType: getDocumentType(fileType),
      document: {
        fileType,
        key: editorNodeId,
        title,
        url: uri,
        permissions: {
          download: allowDownload || !!onDownloadAsUrlRef.current,
          print: allowDownload,
          edit: canEdit,
          copy: allowDownload,
        },
      },
      editorConfig: {
        mode,
        lang: "vi",
        // Remote OnlyOffice cannot reach localhost callback — omit when unreachable
        ...(canEdit && callbackUrl ? { callbackUrl } : {}),
        customization: {
          forcesave: Boolean(canEdit && callbackUrl),
          toolbar: allowDownload || canEdit,
          compactToolbar: !allowDownload && !canEdit,
          statusBar: canEdit,
          autosave: Boolean(canEdit && callbackUrl),
          help: false,
          logo: {
            visible: false,
          },
          chat: false,
          comments: false,
          anonymous: {
            request: false,
          },
          plugins: false,
          ...(allowDownload || canEdit
            ? {}
            : {
                layout: {
                  toolbar: {
                    file: false,
                    home: true,
                    layout: true,
                    insert: false,
                    draw: false,
                    review: false,
                    view: true,
                  },
                  header: {
                    save: false,
                    edit: false,
                    users: false,
                  },
                },
              }),
        },
        region: "vn",
      },
    } satisfies OnlyOfficeFullConfig

    const events = {
      onRequestSaveAs: () => {},
      onDownloadAs(data: { data?: { url?: string } }) {
        const fileUrl = data?.data?.url ?? ""
        if (!fileUrl) return
        if (onDownloadAsUrlRef.current) {
          onDownloadAsUrlRef.current(fileUrl)
          return
        }
        if (!allowDownload) return
        const link = document.createElement("a")
        link.href = fileUrl
        link.setAttribute("download", title || "download")
        document.body.appendChild(link)
        link.click()
        link.parentNode?.removeChild(link)
      },
    }

    const initEditor = async () => {
      let token = ""
      try {
        // Only sign serializable config (no event handlers)
        const signed = await signOnlyOfficeConfig(config as Record<string, unknown>)
        if (signed.status === 200 && signed.data && "token" in signed.data) {
          token = signed.data.token
        } else {
          console.error("[OnlyOffice] Failed to sign config:", signed)
        }
      } catch (error) {
        console.error("[OnlyOffice] Sign config error:", error)
      }
      if (cancelled) return
      window.docEditor = new window.DocsAPI.DocEditor(editorNodeId, {
        ...config,
        events,
        token,
      })
    }

    void initEditor()

    return () => {
      cancelled = true
      window.docEditor?.destroyEditor?.()
    }
  }, [
    uri,
    title,
    fileType,
    mode,
    allowDownload,
    editorHeight,
    containerId,
    callbackUrl,
    documentKey,
    canEdit,
  ])

  return <div id={containerId} className={containerClassName} />
}

function getDocumentType(fileType: string): DocumentType {
  const map: Record<string, DocumentType> = {
    doc: "text",
    docx: "text",
    txt: "text",
    pdf: "text",
    odt: "text",
    xls: "spreadsheet",
    xlsx: "spreadsheet",
    ods: "spreadsheet",
    csv: "spreadsheet",
    ppt: "presentation",
    pptx: "presentation",
    odp: "presentation",
  }
  return map[fileType.toLowerCase()] || "text"
}

const XemTaiLieu = () => {
  const { isOpen, input, onClose, onChange } = useDisclosure<{
    uri: string
    name?: string
    mimeType?: string
    mode?: "view" | "edit"
    convertTo?: string
  }>({
    tag: "XemTaiLieu",
  })

  const { data: convertedDocumentUrl, isFetching: convertedDocumentUrlLoading } = useQuery({
    queryKey: ["convertedDocumentUrl", input?.convertTo, input?.uri, input?.name, input?.mimeType],
    queryFn: async () => {
      if (input?.convertTo && input?.uri && input?.name && input?.mimeType) {
        const fileType = input.mimeType.toLowerCase()
        const convertedUrl = await convertDocument({
          fileType,
          outputtype: input.convertTo,
          url: input.uri,
          title: input.name,
        })
        return convertedUrl
      }
      return null
    },
    enabled: !!input?.convertTo && !!input?.uri && !!input?.name && !!input?.mimeType,
    refetchOnWindowFocus: false,
  })

  const documentUrl = input?.convertTo
    ? convertedDocumentUrl?.status === 200
      ? convertedDocumentUrl.data.fileUrl
      : undefined
    : getMinioUrl(input?.uri || "")

  const fileType = input?.mimeType?.toLowerCase() ?? ""

  return (
    <Modal
      title="Xem tài liệu"
      open={isOpen}
      width="100vw"
      style={{
        top: 0,
        maxWidth: "100vw",
        paddingBottom: 0,
        margin: 0,
        display: supportedImageFileTypes.includes(fileType) ? "none" : undefined,
      }}
      styles={{
        body: {
          height: "calc(100vh - 55px)",
          padding: 0,
          overflow: "hidden",
        },
        content: {
          borderRadius: 0,
        },
      }}
      onCancel={onClose}
      okButtonProps={{
        hidden: true,
      }}
      cancelButtonProps={{
        hidden: true,
      }}
      footer={null}
    >
      <div className="w-full h-full">
        {input?.convertTo && convertedDocumentUrlLoading ? (
          <div className="p-4">Đang chuyển đổi tài liệu...</div>
        ) : (
          documentUrl &&
          supportedDocFileTypes.includes(fileType) && (
            <OnlyOfficeViewer
              uri={documentUrl}
              fileType={input?.convertTo ?? fileType}
              title={input?.name}
              mode={input?.mode || "view"}
              containerClassName="w-full h-[calc(100vh-55px)]"
              editorHeight="100%"
            />
          )
        )}
        {documentUrl && supportedImageFileTypes.includes(fileType) && (
          <Image
            preview={{
              visible: isOpen,
              src: documentUrl,
              onVisibleChange: onChange,
            }}
          />
        )}
        {input?.uri &&
          !supportedImageFileTypes.includes(fileType) &&
          !supportedDocFileTypes.includes(fileType) && (
            <span className="p-4 inline-block">
              Không hỗ trợ xem tài liệu này. Vui lòng{" "}
              <a href={input.uri} className="text-primary">
                tải xuống
              </a>{" "}
              để xem.
            </span>
          )}
      </div>
    </Modal>
  )
}

export { OnlyOfficeViewer, XemTaiLieu }
