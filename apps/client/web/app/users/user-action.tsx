"use client";
import { User } from "@workspace/db";

export default function UserAction({ user }: { user: User }):any {
  const action = (name: string) => {
    alert(`Hello ${name}`);
  };
  return (
    <>
      <button onClick={() => action(user.name || "Anonymous")}>Click me</button>
    </>
  );
}
