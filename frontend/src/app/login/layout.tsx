import { ReactNode } from "react";

export default function LoginLayout({ children }: { children: ReactNode }) {
  return <div className="h-full">{children}</div>;
}
