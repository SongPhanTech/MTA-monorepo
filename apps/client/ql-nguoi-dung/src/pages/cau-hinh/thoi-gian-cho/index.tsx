import {
    fetchGetConfigs,
    fetchUpdateConfigs,
    type UpdateConfigsRequestBody,
} from '@api/open-api/appComponents'
import FormItem from '@components/commons/form-item'
import useSpinner from '@hooks/spinner'
import DefaultLayout from '@layouts/default-layout'
import { CONFIG_KEY } from '@workspace/constant'
import { useFindUniqueConfig, useUpdateConfig } from '@workspace/db/hooks'
import { Button } from '@workspace/ui'
import { Col, Divider, Form, Input, message, Row } from 'antd'
import { useEffect } from 'react'

type Configs = {
    userTimeout: number
} & UpdateConfigsRequestBody

export default function Page() {
    const [form] = Form.useForm<Configs>()

    const getDataConfigs = async () => {
        const data = await fetchGetConfigs({})
        form.setFieldValue('idleSessionTimeoutPeriod', data.idleSessionTimeoutPeriod)
        form.setFieldValue('rememberMePeriod', data.rememberMePeriod)
    }

    const {
        data: userSessionTimeout,
        isFetched,
        refetch,
    } = useFindUniqueConfig({
        where: {
            key: CONFIG_KEY.USER_SESSION_TIMEOUT,
        },
    })

    const { mutateAsync: updateConfigs } = useUpdateConfig()

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (isFetched) {
            getDataConfigs()
            form.setFieldValue('userTimeout', Number.parseFloat(userSessionTimeout?.value || '0'))
        }
    }, [isFetched])

    const { showSpinner, hideSpinner } = useSpinner()

    async function onOk(output?: Configs) {
        if (!output) return
        const { userTimeout, ...rest } = output
        try {
            showSpinner()
            await fetchUpdateConfigs({
                body: rest,
            })
            await updateConfigs({
                where: {
                    key: CONFIG_KEY.USER_SESSION_TIMEOUT,
                },
                data: {
                    value: `${userTimeout}`,
                },
            })
            message.success('Cập nhật thành công')
            refetch()
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    return (
        <div>
            <Divider orientation="left" orientationMargin={0}>
                Cấu hình thời gian chờ
            </Divider>
            <Form form={form} layout="vertical" onFinish={onOk}>
                <Row gutter={[16 * 8, 16]}>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="idleSessionTimeoutPeriod"
                            label="Thời gian chờ phiên làm việc trang quản trị SSO (phút)"
                        >
                            <Input type="number" />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="rememberMePeriod"
                            label="Thời gian chờ ghi nhớ tài khoản (phút)"
                        >
                            <Input type="number" />
                        </FormItem>
                    </Col>
                </Row>
                <Row gutter={[16 * 8, 16]}>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="userTimeout"
                            label="Thời gian chờ phiên làm việc người dùng (phút)"
                        >
                            <Input type="number" />
                        </FormItem>
                    </Col>
                </Row>
                <Button htmlType="submit">Cập nhật</Button>
            </Form>
        </div>
    )
}

Page.getLayout = function getLayout(page: React.ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>
}
