import { Search, UserCircle } from "lucide-react";
import { JSX } from "react";

export function Header({ title }: { title: string }): JSX.Element {
    return (
        <header className="bg-white p-4 border-b">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="pl-10 pr-4 py-2 w-64 border rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-300"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <UserCircle size={32} className="text-gray-600" />
                        <div>
                            <span className="font-semibold text-gray-700">Sarah Wilson</span>
                        </div>

                    </div>
                </div>
            </div>
        </header>
    );
}
