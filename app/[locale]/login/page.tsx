import { LoginPageClient } from "./login-page-client";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <LoginPageClient next={next} />;
}
