import Link from 'next/link';

export default async function Home(): Promise<JSX.Element> {
    return (
        <div>
            <h1>Home page</h1>
            <button>
                <Link href='/users'>Users</Link>
            </button>
        </div>
    );
}
