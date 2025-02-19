import DefaultLayout from '@layouts/default-layout'

function Home() {
    return (
        <DefaultLayout className="p-0">
            <iframe
                title="backup"
                className="w-full h-full"
                src={'http://localhost:8085'}
            />
        </DefaultLayout>
    )
}

export default Home
