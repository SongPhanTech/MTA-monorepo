import { CopyOutlined } from "@ant-design/icons"
// import { getRuntimeEnv } from '@workspace/libs/utils'
import { Button, Flex, Input, Modal, message } from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"

const ThongTinKhaoSatModal = () => {
  const { isOpen, onClose, input } = useDisclosure<{ dataTable: any[]; id: string }>({
    tag: "ThongTinKhaoSatModal",
  })
  const link = `${window.location.hostname}/ems/lam-khao-sat/${input?.id}`

  // const handleCopy = async () => {
  //     try {
  //         const link = `${getRuntimeEnv('NEXT_PUBLIC_APP_URL')}/lam-khao-sat/${input?.id}`
  //         await navigator.clipboard.writeText(link)
  //     } catch (err) {
  //         console.error('Failed to copy: ', err)
  //     }
  // }
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      message.success("Đã sao chép liên kết!")
    } catch {
      message.error("Không thể sao chép liên kết")
    }
  }

  return (
    <Modal
      open={isOpen}
      onOk={onClose}
      onCancel={onClose}
      maskClosable={true}
      title="Thông tin bài khảo sát"
      width="600px"
      footer={null}
    >
      <Flex>
        <Input value={link} readOnly className="rounded-r-[0px]" />
        <Button
          icon={<CopyOutlined />}
          onClick={handleCopy}
          type="primary"
          className="rounded-l-[0px]"
        >
          Copy
        </Button>
      </Flex>

      {/* <Table
                columns={[
                    {
                        title: 'STT',
                        dataIndex: 'index',
                        key: 'index',
                        align: 'center',
                        render: (_: any, __: any, index: number) => index + 1,
                        width: 50,
                    },
                    {
                        title: 'Đối tượng làm khảo sát',
                        dataIndex: 'name',
                        align: 'center',
                        key: 'name',
                    },
                    {
                        title: 'Lấy link',
                        dataIndex: 'description',
                        key: 'description',
                        align: 'center',
                        render: (__, { id }) => {
                            return (
                                <Tooltip title={'Copy'} placement="top">
                                    <CopyOutlined onClick={() => handleCopy()} />
                                </Tooltip>
                            )
                        },
                    },
                ]}
                dataSource={input?.dataTable}
                pagination={false}
                rowKey="key"
                size="small"
                bordered
            /> */}
    </Modal>
  )
}

export default ThongTinKhaoSatModal
