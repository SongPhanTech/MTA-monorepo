import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useSpinner from '@hooks/spinner'
import { useSurveyQuestionTypeOptions } from '@hooks/survey-question-type'
import type { SurveyQuestion, SurveyQuestionGroup } from '@workspace/db'
import {
  useCreateSurveyQuestion,
  useFindManySurveyQuestionGroup,
  useFindUniqueSurveyQuestion,
  useUpdateSurveyQuestion
} from '@workspace/db/hooks'
import { Button, Col, Form, message, Table, Upload } from 'antd'
import { useEffect, useState } from 'react'
import type { Key } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

import { UploadOutlined } from '@ant-design/icons'
import { XMLParser } from 'fast-xml-parser'
import { PizZip } from '@workspace/libs/docxjs'

export type PutSurveyQuestionType = SurveyQuestion
const PutSurveyImportQuestionModal = () => {
  const [form] = Form.useForm<SurveyQuestion>()
  const { isOpen, onClose, input } = useDisclosure<{
    id: string
    surveyQuestionGroupId?: string
  }>({
    tag: 'PutSurveyImportQuestionModal',
    onClose: form.resetFields
  })
  const [importedQuestions, setImportedQuestions] = useState<string[]>([])
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])

  const { showSpinner, hideSpinner } = useSpinner()
  const tableData = importedQuestions.map((q, index) => ({
    key: index,
    content: q
  }))

  const { options: surveyQuestionTypeOptions, getSurveyQuestionTypeLabel } =
    useSurveyQuestionTypeOptions()
  const { mutateAsync: create } = useCreateSurveyQuestion()

  const { data: surveyQuestionGroupData = [] } =
    useFindManySurveyQuestionGroup()

  const parser = new XMLParser({
    ignoreAttributes: false
  })

  const handleImportWord = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const zip = new PizZip(arrayBuffer)

      const documentXml = zip.file('word/document.xml')?.asText()
      if (!documentXml) {
        message.error('File Word không hợp lệ')
        return
      }

      const doc = parser.parse(documentXml)
      const rawParagraphs = doc?.['w:document']?.['w:body']?.['w:p']
      const paragraphs = Array.isArray(rawParagraphs)
        ? rawParagraphs
        : rawParagraphs
        ? [rawParagraphs]
        : []

      if (!paragraphs) {
        message.error('Không đọc được nội dung Word')
        return
      }

      const questions: string[] = []

      for (const p of paragraphs) {
        const runs = Array.isArray(p['w:r']) ? p['w:r'] : [p['w:r']]
        let text = ''

        for (const r of runs) {
          const t = r?.['w:t']
          if (typeof t === 'string') text += t
          else if (t?.['#text']) text += t['#text']
        }
        if (text && text.trim().length > 0) {
          questions.push(text)
        }
      }

      if (!questions.length) {
        message.error('Không có câu hỏi hợp lệ')
        return
      }
      const uniqueQuestions = Array.from(new Set(questions))
      setImportedQuestions(uniqueQuestions)
      setSelectedRowKeys([])
    } catch (err) {
      console.error(err)
      message.error('Lỗi khi đọc file Word')
    }
  }

  async function onOk (output?: SurveyQuestion) {
    if (!output) return
    if (!output.type) {
      message.warning('Vui lòng chọn loại câu hỏi')
      return
    }

    if (!output.surveyQuestionGroupId) {
      message.warning('Vui lòng chọn nhóm câu hỏi khảo sát')
      return
    }
    const selectedQuestions: string[] = selectedRowKeys
      .map(key => importedQuestions[Number(key)])
      .filter((q): q is string => Boolean(q))

    if (!selectedQuestions.length) {
      message.warning('Vui lòng chọn ít nhất một câu hỏi')
      return
    }

    try {
      showSpinner()

      for (const question of selectedQuestions) {
        await create({
          data: {
            name: question,
            surveyQuestionGroupId: output.surveyQuestionGroupId,
            type: output.type,
            description: null
          }
        })
        message.success('Thêm mới thành công')
      }
      queryClient.invalidateQueries({ queryKey: ['SurveyQuestion'] })
      message.success(`Đã import ${selectedQuestions.length} câu hỏi`)
      onClose()
    } catch (err) {
      message.error('Đã xảy ra lỗi')
    } finally {
      hideSpinner()
    }
  }

  const { data: surveyQuestion } = useFindUniqueSurveyQuestion(
    {
      where: { id: input?.id }
    },
    {
      enabled: !!input?.id
    }
  )
  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    console.log(input)
    if (input?.surveyQuestionGroupId) {
      form.setFieldsValue({
        surveyQuestionGroupId: input?.surveyQuestionGroupId
      })
    }
  }, [input?.surveyQuestionGroupId])
  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (surveyQuestion) {
      form.setFieldsValue(surveyQuestion)
    }
  }, [surveyQuestion])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={
        input?.id ? 'Chỉnh sửa câu hỏi khảo sát' : 'Thêm mới câu hỏi khảo sát'
      }
      className='w-[700px]'
    >
      <Col span={24}>
        <Form.Item label='Import câu hỏi từ Word'>
          <Upload
            accept='.doc,.docx'
            showUploadList={false}
            beforeUpload={file => {
              handleImportWord(file)
              return false
            }}
          >
            <Button icon={<UploadOutlined />}>Import từ file Word</Button>
          </Upload>
        </Form.Item>
      </Col>

      <Col span={12}>
        <FormItem
          form={form}
          name='surveyQuestionGroupId'
          label='Nhóm câu hỏi khảo sát'
          required
        >
          <Select
            placeholder='Chọn nhóm câu hỏi khảo sát'
            options={surveyQuestionGroupData.map((i: SurveyQuestionGroup) => {
              return {
                value: i.id,
                label: i.name
              }
            })}
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem
          form={form}
          name='type'
          label='Loại câu hỏi khảo sát'
          required
        >
          <Select
            placeholder='Chọn loại câu hỏi khảo sát'
            options={surveyQuestionTypeOptions}
          />
        </FormItem>
      </Col>
      <Col span={24}>
        {importedQuestions.length > 0 && (
          <Col span={24}>
            <div className='mt-4'>
              <div className='font-semibold mb-2'>
                Danh sách câu hỏi từ file Word
              </div>

              <Table<{ key: number; content: string }>
                rowKey='key'
                dataSource={tableData}
                pagination={false}
                rowSelection={{
                  selectedRowKeys,
                  onChange: (keys: Key[]) => setSelectedRowKeys(keys)
                }}
                columns={[
                  {
                    title: 'STT',
                    width: 60,
                    align: 'center',
                    render: (_: any, __: any, index: number) => index + 1
                  },
                  {
                    title: 'Nội dung câu hỏi',
                    dataIndex: 'content'
                  }
                ]}
              />
            </div>
          </Col>
        )}
      </Col>
    </PutFormModal>
  )
}

export default PutSurveyImportQuestionModal
