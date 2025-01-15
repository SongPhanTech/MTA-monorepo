import { Button } from "@workspace/ui/components/ui/button";
import Link from "next/link";

export default async function Home() {
  return (
    <Button>
      <Link href="/users">Users</Link>
    </Button>
  );
}
