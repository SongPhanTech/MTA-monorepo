import { Modal } from 'antd'
import dayjs from 'dayjs'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import Tabs from '@components/commons/tabar'
import DiemTrungBinhKyHoc from '@components/sub-pages/diem-trung-binh-ky-hoc'
import XetHocBong from '@components/sub-pages/xet-hoc-bong'
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
                        children: 'Content of Tab Pane 3',
                    },
                    {
                        key: '4',
                        label: 'Xét cảnh cáo học tập',
                        children: 'Content of Tab Pane 3',
                    },
                    {
                        key: '5',
                        label: 'Xét thôi học',
                        children: 'Content of Tab Pane 3',
                    },
                    {
                        key: '6',
                        label: 'Xét lưu ban',
                        children: 'Content of Tab Pane 3',
                    },
                ]}
            />
        </Modal>
    )
}

export default ModalGPASemester
