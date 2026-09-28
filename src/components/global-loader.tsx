import { Loader2 } from "lucide-react";

interface GlobalLoaderProps {
  message?: string;
}

export function GlobalLoader({ message = "Loading..." }: GlobalLoaderProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-zinc-900">
      <div className="bg-white border border-zinc-200/90 p-6 rounded-2xl shadow-sm flex flex-col items-center gap-3">
        <Loader2 className="h-7 w-7 text-zinc-900 animate-spin" />
        <p className="text-xs font-medium text-zinc-500">{message}</p>
      </div>
    </div>
  );
}
