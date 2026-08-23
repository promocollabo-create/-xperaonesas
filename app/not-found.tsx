import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-xpera flex min-h-[60vh] flex-col items-center justify-center py-10 text-center">
      <p className="text-sm font-semibold text-brand-600">404</p>
      <h1 className="mt-2 text-3xl font-bold">Page Not Found</h1>
      <p className="mt-2 text-slate-500">The page you're looking for doesn't exist or has moved.</p>
      <Link href="/" className="btn-primary mt-8">Back to Home</Link>
    </div>
  );
}
