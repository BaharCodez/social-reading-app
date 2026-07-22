import { redirect } from "next/navigation";
import { auth } from "@/app/lib/auth";
import AuthForm from "@/app/components/AuthForm";

export default async function SignupPage() {
  const session = await auth();
  if (session?.user) redirect("/study");
  return <AuthForm mode="signup" />;
}
