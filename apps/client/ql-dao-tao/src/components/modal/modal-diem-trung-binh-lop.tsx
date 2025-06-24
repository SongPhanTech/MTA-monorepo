import { Modal } from 'antd'
import dayjs from 'dayjs'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import Tabs from '@components/commons/tabar'
import DiemTrungBinhKyHoc from '@components/sub-pages/diem-trung-binh-ky-hoc'
import XetHocBong from '@components/sub-pages/xet-hoc-bong'
import XetCanhCaoHocDuong from '@components/sub-pages/xet-canh-cao-hoc-duong'
import XetCanhCaoHocTap from '@components/sub-pages/xet-canh-cao-hoc-tap'
import XetThoiHoc from '@components/sub-pages/xet-thoi-hoc'
import XetLuuBan from '@components/sub-pages/xet-luu-ban'
dayjs.locale('vi')

const ModalGPASemester = () => {
    const { isOpen, onClose, input } = useDisclosure<string>({
        tag: ModalGPASemester.name,
    })

    return (
        <Modal
            open={isOpen}
            onCancel={onClose}
            maskClosable={true}
            footer={null}
            title={'Cảnh cáo học tập, Xét học bổng'}
            className="w-[80vw]"
        >
            <Tabs
                items={[
                    {
                        key: '1',
                        label: 'Điểm trung bình kỳ học',
                        children: <DiemTrungBinhKyHoc />,
                    },
                    {
                        key: '2',
                        label: 'Xét học bổng',
                        children: <XetHocBong />,
                    },
                    {
                        key: '3',
                        label: 'Xét cảnh cáo học đường',
                        children: <XetCanhCaoHocDuong />,
                    },
                    {
                        key: '4',
                        label: 'Xét cảnh cáo học tập',
                        children: <XetCanhCaoHocTap />,
                    },
                    {
                        key: '5',
                        label: 'Xét thôi học',
                        children: <XetThoiHoc />,
                    },
                    {
                        key: '6',
                        label: 'Xét lưu ban',
                        children: <XetLuuBan />,
                    },
                ]}
            />
        </Modal>
    )
}

export default ModalGPASemester
