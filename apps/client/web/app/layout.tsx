import "@workspace/ui/globals.css";
import type { Metadata } from "next";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) : any{
  return (
    <html lang="en">
      <body>
        <main className="mx-auto">{children}</main>
      </body>
    </html>
  );
}
