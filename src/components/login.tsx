import { LogIn } from "lucide-react";
import Link from "next/link";

export default function SignInButton() {
    return (
        <Link href="/auth/login">
            <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
            >
                <LogIn className="h-4 w-4" />
                Sign in
            </button>
        </Link>
    );
}
