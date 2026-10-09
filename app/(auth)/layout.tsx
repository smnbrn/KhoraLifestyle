import { APP_NAME, APP_TAGLINE } from "@/lib/constants/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <p className="text-3xl font-bold tracking-tight text-foreground">{APP_NAME}</p>
          <p className="text-sm text-muted-foreground">{APP_TAGLINE}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
