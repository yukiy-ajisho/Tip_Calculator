import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { Layout } from "@/components/Layout";

export const metadata: Metadata = {
  title: "Tip Calculator",
  description: "Tip Calculator App",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isLoginPage = pathname === "/login";

  return (
    <html lang="en">
      <body>{isLoginPage ? children : <Layout>{children}</Layout>}</body>
    </html>
  );
}
