"use client";

import { Button } from "@workspace/ui/components/ui/button";
import { User } from "@workspace/db";

export default function UserAction({ user }: { user: User }) {
  const action = (name: string) => {
    alert(`Hello ${name}`);
  };
  return (
    <>
      <Button onClick={() => action(user.name || "Anonymous")}>Click me</Button>
    </>
  );
}
