import { formatDateInSlash } from "@workspace/libs/timezone"
import { PrinterOutlined } from "@ant-design/icons"
import { useCouncilRoleOptions } from "@hooks/councilRole"
import type {
  Council,
  CouncilMember,
  ExpertProfileVersion,
  FixedClass,
  Student,
  StudentThesisRegistration,
  SubjectClass,
  ThesisProject,
  TrainingCourse,
  UserProfile,
} from "@workspace/db/client"
import { Button, Modal } from "antd"
import dayjs from "dayjs"
import { useRef } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { useReactToPrint } from "react-to-print"

dayjs.locale("vi")

type ModalPrintDecisionInput = SubjectClass &
  {
    thesisProjects: ThesisProject[]
  }[]

type PrintExpertProfile = Partial<ExpertProfileVersion> & {
  expert?: { lecturer?: { userProfile?: { fullname?: string | null } | null } | null } | null
}

type ThesisProjectInput = ThesisProject & {
  supervisor?: PrintExpertProfile
  council?: Council & {
    members: Array<
      CouncilMember & {
        expert?: PrintExpertProfile
        expertProfileVersion?: PrintExpertProfile
      }
    >
  }
  registrations: Array<
    StudentThesisRegistration & {
      student?: Student & {
        userProfile?: UserProfile
        fixedClass?: FixedClass & {
          trainingCourse?: TrainingCourse
        }
      }
    }
  >
}

const ModalPrintDecision = () => {
  const printRef = useRef<HTMLDivElement>(null)
  const { isOpen, onClose, input } = useDisclosure<{
    subjecClassData: ModalPrintDecisionInput
    isCopy?: boolean
  }>({
    tag: "ModalPrintDecision",
  })
  const { getCouncilRoleLabel } = useCouncilRoleOptions()

  const allThesisProjects = input?.subjecClassData.flatMap((sc: any) => sc.thesisProjects) ?? []
  const getMemberProfile = (member: {
    expertProfileVersion?: PrintExpertProfile
    expert?: PrintExpertProfile
  }) => member.expertProfileVersion ?? member.expert

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    pageStyle: `
        @page {
            size: A4;
            margin: 1cm;
        }
        @media print {
            .page-break {
                page-break-after: always;
            }
            .blank-page {
                height: 100vh;
                visibility: hidden;
            }
            table {
                page-break-inside: auto;
            }
            tr {
                page-break-inside: avoid;
            }
        }
      `,
  })
  //TODO: ghép, cấu hình thông tin
  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={900}
      style={{ top: 20 }}
      title={
        <div className="flex items-center justify-between w-[95%]">
          <span>Danh sách quyết định</span>
          <Button icon={<PrinterOutlined />} onClick={handlePrint} size="small" type="primary">
            In
          </Button>
        </div>
      }
    >
      <div ref={printRef} className="mx-auto p-6 text-sm leading-relaxed !font-time-news-roman">
        {allThesisProjects.map((tp: ThesisProjectInput, index: number) => (
          <div key={tp.id}>
            <div className="text-center font-bold uppercase">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-normal">BỘ QUỐC PHÒNG</span>
                  <span className="leading-none">HỌC VIỆN KỸ THUẬT QUÂN SỰ</span>
                  <hr className="border-t-[1px] border-black mx-14" />
                  <span className="font-normal normal-case mt-1">Số: 2954/QĐ-HV</span>
                </div>
                <div className="flex flex-col">
                  <span>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span>
                  <span className="normal-case leading-none">Độc lập - Tự do - Hạnh phúc</span>
                  <hr className="border-t-[1px] border-black mx-14" />
                  <div className="font-normal normal-case italic mt-1">
                    Hà Nội, ngày 02 tháng 6 năm 2025
                  </div>
                </div>
              </div>

              <div className="mt-4 text-[20px]">Quyết định</div>
              <div className="font-semibold normal-case text-[20px] leading-none">
                Thành lập hội đồng đánh giá luận văn - Đợt tháng 6/2025
              </div>
              <hr className="border-t-[1px] border-black w-[240px] mx-auto" />

              <div className="mt-4 text-[20px]">Giám đốc học viện kỹ thuật quân sự</div>
              <div>
                <div className="text-left italic font-normal normal-case text-[18px] indent-6 leading-5">
                  Căn cứ chức năng, nhiệm vụ, quyền hạn của Học viện KTQS;
                </div>
                <div className="text-left italic font-normal normal-case text-[18px] indent-6 leading-5">
                  Căn cứ Quy chế số 923/QC-HV ngày 28/3/2022 của Học viện về Tuyển sinh và đào tạo
                  trình độ thạc sĩ tại Học viện KTQS;
                </div>
                <div className="text-left italic font-normal normal-case text-[18px] indent-6 leading-5">
                  Theo đề nghị của đồng chí Trưởng phòng Sau đại học tại tờ trình số 406/TTr-SĐH
                  ngày 30/5/2025.
                </div>
              </div>
            </div>
            <div className="text-[18px] mt-8 leading-5">
              <div className="indent-6">
                <strong>Điều 1.</strong> Thành lập hội đồng đánh giá luận văn thạc sĩ ngành Khoa học
                máy tính về đề tài:{" "}
                <i>
                  <strong>{`"${tp.title}"`}.</strong>
                </i>
              </div>
              <div className="indent-6">
                Học viên thực hiện:
                {tp.registrations
                  .map((registration) => {
                    const fullname = registration.student?.userProfile?.fullname
                    const dateOfBirth = registration.student?.userProfile?.dateOfBirth
                    const trainingCourse = registration.student?.fixedClass?.trainingCourse
                    return `${fullname}${
                      dateOfBirth
                        ? `, sinh ngày ${formatDateInSlash(dateOfBirth)}
                                        ${trainingCourse ? `, ${trainingCourse.name}(${trainingCourse.startYear}-${trainingCourse.endYear})` : ""}`
                        : ""
                    }`
                  })
                  .join(". ")}
              </div>
              <div className="indent-6">Cán bộ hướng dẫn: {tp.supervisor?.name}</div>
              <div className="indent-6">
                Chỉ định và mời các đồng chí có tên sau đây tham gia hội đồng:
              </div>
              <ul className="list-none indent-6">
                {tp.council?.members
                  ?.slice()
                  .reverse()
                  .map((mem: any) => {
                    const profile = getMemberProfile(mem)
                    return (
                      <li key={mem.id} className="grid grid-cols-3 gap-2 mb-1">
                        <span className="col-span-1 before:content-['-'] before:mr-1">
                          {profile?.name || profile?.expert?.lecturer?.userProfile?.fullname}
                        </span>
                        <span>{profile?.workplace}</span>
                        <span>{getCouncilRoleLabel(mem.role)}</span>
                      </li>
                    )
                  })}
              </ul>
              <div className="indent-6 mt-1">
                <strong>Điều 2.</strong> Nhiệm vụ của Hội đồng được quy định theo Quy chế đào tạo
                trình độ thạc sĩ của Bộ GD&ĐT và của Học viện.
              </div>
              <div className="indent-6 mt-1">
                <strong>Điều 3.</strong> Quyết định này có hiệu lực kể từ ngày ký. Đồng chí Trưởng
                phòng Sau đại học, Viện trưởng Viện công nghệ thông tin và Truyền thông chủ trì
                chuyên ngành đào tạo và các đồng chí có tên tại Điều 1 chịu trách nhiệm thi hành
                Quyết định này./.
              </div>
            </div>
            <div className="overflow-x-auto mt-6 flex justify-between">
              <div className="flex flex-col text-[16px]">
                <div className="flex flex-col">
                  <span className="font-semibold italic">Nơi nhận:</span>
                  <ul className="list-none leading-4">
                    <li>- GĐHV;</li>
                    <li>- K11, K21, K21, K22, K24, K31;</li>
                    <li>- V2, V4, V5, V6, P9;</li>
                    <li>- Lưu: VT, P7 (03). Tha17.</li>
                  </ul>
                </div>
              </div>
              <div className="flex flex-col text-center">
                <div className="font-bold flex flex-col text-[18px]">
                  <span className="uppercase">GIÁM ĐỐC</span>
                  {input?.isCopy ? (
                    <span className="font-normal my-2">(Đã ký)</span>
                  ) : (
                    <div className="h-[40px]"> </div>
                  )}
                  <span>Trung tướng Lê Minh Thái</span>
                </div>
              </div>
            </div>
            {input?.isCopy ? (
              <>
                <hr className="border-t-[1px] border-black" />
                <div className="flex items-center text-center font-bold uppercase justify-between mt-2">
                  <div className="flex flex-col">
                    <span className="font-normal">BỘ QUỐC PHÒNG</span>
                    <span className="leading-none">HỌC VIỆN KỸ THUẬT QUÂN SỰ</span>
                    <hr className="border-t-[1px] border-black mx-14" />
                    <span className="font-normal normal-case mt-1">Số: &emsp;&emsp;/QĐ-HV</span>
                  </div>
                  <div className="flex flex-col gap-4">
                    <span>Trích sao</span>
                    <div className="font-normal normal-case italic mt-1">
                      Hà Nội, ngày 02 tháng 6 năm 2025
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto mt-6 flex justify-between">
                  <div className="flex flex-col text-[16px]">
                    <div className="flex flex-col">
                      <span className="font-semibold italic">Nơi nhận:</span>
                      <ul className="list-none leading-4">
                        <li>- Thành viên Hội đồng(05);</li>
                        <li>- Hồ sơ bảo vệ(01);</li>
                        <li>- Lưu: QL/P7. Th07;</li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex flex-col text-center">
                    <div className="font-bold flex flex-col text-[18px]">
                      <span className="uppercase">TL. GIÁM ĐỐC</span>
                      <span className="uppercase">KT. TRƯỞNG PHÒNG SAU ĐẠI HỌC</span>
                      <span className="uppercase">PHÓ TRƯỞNG PHÒNG</span>
                      <span className="mt-12">Đại tá Trần Ngọc Châu</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-[40px]"> </div>
            )}
            {index < allThesisProjects.length - 1 && <div className="page-break" />}
          </div>
        ))}
      </div>
      <style>
        {`
            @media print {
                .page {
                    width: 210mm;
                    min-height: 297mm; 
                    page-break-after: auto;
                    background: white;
                    overflow: visible;
                }
            }
            table {
                page-break-inside: auto;
            }
            tr {
                page-break-inside: avoid;
                page-break-after: auto;
            }
            @page {
                size: A4;
            }
            @media screen {
                .page {
                    width: 210mm;
                    min-height: 297mm;
                    margin: 10px auto;
                    padding: 20mm;
                    background: white;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
            }
            `}
      </style>
    </Modal>
  )
}

export default ModalPrintDecision
