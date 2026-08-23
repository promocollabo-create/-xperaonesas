import Link from "next/link";

export default function UnauthorizedPage({ searchParams }: { searchParams: { code?: string } }) {
  const is401 = searchParams.code === "401";
  return (
    <div className="container-xpera flex min-h-[60vh] flex-col items-center justify-center py-10 text-center">
      <p className="text-sm font-semibold text-red-600">{is401 ? "401" : "403"}</p>
      <h1 className="mt-2 text-3xl font-bold">{is401 ? "Login Required" : "Access Denied"}</h1>
      <p className="mt-2 text-slate-500">
        {is401 ? "You need to be logged in to view this page." : "You don't have permission to access this page."}
      </p>
      <Link href={is401 ? "/login" : "/"} className="btn-primary mt-8">
        {is401 ? "Log In" : "Back to Home"}
      </Link>
    </div>
  );
}
