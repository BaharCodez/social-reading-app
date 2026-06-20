import { redirect } from "next/navigation";
import { auth } from "@/app/lib/auth";
import ReaderApp from "./components/ReaderApp";

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <ReaderApp
      currentUser={{
        id: session.user.id,
        name: session.user.name ?? session.user.email ?? "You",
      }}
    />
  );
}
