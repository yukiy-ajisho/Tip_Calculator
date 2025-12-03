import { redirect } from "next/navigation";

export default function Home() {
  // middlewareでリダイレクト処理を行うため、ここでは何もしない
  // このコンポーネントは実際には表示されない（middlewareでリダイレクトされる）
  redirect("/login");
}
