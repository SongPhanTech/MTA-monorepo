import FormItem from '@components/commons/form-item'
import logo_mta from '@assets/images/logo_mta.png'
import ROUTER_PATH from '@constants/page-path'
import { useToast } from '@hooks/toast'
import { Button, Form, Input } from 'antd'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

type LoginFormType = {
    username: string
    password: string
}
const LoginPage = () => {
    const [form] = Form.useForm<LoginFormType>()
    const router = useRouter()
    const { toast } = useToast()

    const onLogin = async (payload: LoginFormType) => {
        try {
            const ok = {
                ok: true,
            }
            if (!ok || !ok.ok) throw new Error('Đăng nhập thất bại')
            router.replace(ROUTER_PATH.HOME)
        } catch (error) {
            console.error('[Login][error]', error)
            toast({
                title: 'Đăng nhập thất bại',
                description: 'Email hoặc mật khẩu không chính xác',
                variant: 'destructive',
            })
        }
    }

    return (
        <div className="flex-col flex mt-10 items-center justify-center gap-10">
            <Image alt="logo" width={200} height={200} src={logo_mta} />
            <div className="w-[400px] max-w-md rounded-lg border border-gray-300 p-6 shadow-[0_2px_22px_-4px_rgba(93,96,127,0.2)] max-md:mx-auto">
                <div className="flex flex-col justify-center items-center mb-8">
                    <h3 className="text-3xl font-extrabold text-gray-800">
                        Đăng nhập
                    </h3>
                    <p className="mt-4 text-sm leading-relaxed text-gray-500">
                        HỌC VIỆN KỸ THUẬT QUÂN SỰ
                    </p>
                </div>
                <Form
                    form={form}
                    autoComplete="off"
                    onFinish={onLogin}
                    layout="vertical"
                >
                    <FormItem
                        label="Tên đăng nhập"
                        form={form}
                        name={'username'}
                        rules={[
                            {
                                required: true,
                                message: 'Vui lòng nhập tên đăng nhập',
                            },
                        ]}
                    >
                        <Input />
                    </FormItem>
                    <FormItem
                        label="Mật khẩu"
                        form={form}
                        name={'password'}
                        rules={[
                            {
                                required: true,
                                message: 'Vui lòng nhập mật khẩu',
                            },
                            {
                                min: 6,
                                message: 'Mật khẩu phải có ít nhất 6 ký tự',
                            },
                        ]}
                    >
                        <Input.Password />
                    </FormItem>
                    <div className="flex flex-col gap-5">
                        <div className="text-sm justify-end flex">
                            <a className="font-semibold hover:underline">
                                Quên mật khẩu?
                            </a>
                        </div>
                        <Button htmlType="submit" type="primary">
                            Đăng nhập
                        </Button>
                    </div>
                </Form>
            </div>
        </div>
    )
}

export default LoginPage
