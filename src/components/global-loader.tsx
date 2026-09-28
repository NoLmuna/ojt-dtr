import { Loader2 } from "lucide-react";

interface GlobalLoaderProps {
    message?: string;
}

export function GlobalLoader({ message = "Loading..." }: GlobalLoaderProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                <p className="text-sm font-medium text-gray-500">{message}</p>
            </div>
        </div>
    );
}
