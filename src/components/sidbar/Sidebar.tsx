"use client";

import Image from "next/image";
import { JSX, ReactNode, useState } from "react";
import { SidebarItem } from "./sidebarItem";
import { Users2, UserPlus, Building2, ShieldCheck, Settings, BarChart3, ListChecks, MoreVertical, Shield, UserCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useDisplayEmail, useDisplayName } from "../userDisplayName";
import SignInButton from "../login";


type SidebarItemData = {
    icon: ReactNode;
    text: string;
    alert?: boolean;
    path: string
};

// Data for the sidebar navigation items, now typed (removed 'active' property)
const sidebarItems: SidebarItemData[] = [
    {
        icon: <Users2 size={20} />,
        path: 'entities', text: "Entities",
    },
    {
        icon: <UserPlus size={20} />,
        path: 'lo', text: "New KYC",
    },
    {
        icon: <Building2 size={20} />,
        path: '#', text: "New KYB",
    },
    {
        icon: <ShieldCheck size={20} />,
        path: '#', text: "Audit & Access",
        alert: true,
    },
    {
        icon: <Settings size={20} />,
        path: '#', text: "Screening Settings",
    },
    {
        icon: <BarChart3 size={20} />,
        path: '#', text: "Risk Configuration",
    },
    {
        icon: <ListChecks size={20} />,
        path: '#', text: "List Management",
    },
];
export function Sidebar(): JSX.Element {
    const [expanded, setExpanded] = useState<boolean>(false);
    // State to track the active item index, initialized to 0 (the first item)
    const [activeIndex, setActiveIndex] = useState<number>(0);
    const router = useRouter()
    const pathname = usePathname();
    const lastSegment = pathname.split("/").filter(Boolean).pop() || "";
    const name = useDisplayName();
    const email = useDisplayEmail();

    return (
        <aside
            className={`h-screen sticky top-0 ${expanded ? 'w-60' : 'w-16'}`}
            onMouseEnter={() => setExpanded(true)}
            onMouseLeave={() => setExpanded(false)}
        >
            <nav className="h-full flex flex-col bg-white border-r shadow-sm">
                <div className="p-4 pb-2 flex gap-5 items-center mt-4 border-b">
                    {/* A dummy logo that appears when the sidebar is expanded */}
                    <Shield />
                    {expanded && <p className="text-lg font-bold text-gray-800">ComplianceHub</p>}
                </div>

                {/* Map over the sidebarItems array to render each item */}
                <ul className="flex-1 px-3 gap-8 mt-5">
                    {sidebarItems.map((item, index) => (
                        <SidebarItem
                            key={index}
                            icon={item.icon}
                            text={item.text}
                            // The 'active' prop is now determined by comparing the index with the state
                            active={lastSegment === item.path}
                            alert={item.alert}
                            expanded={expanded}
                            // Pass a function to update the active index on click
                            onClick={() => {
                                router.push(item.path)
                                setActiveIndex(index)
                            }}
                        />
                    ))}
                </ul>

                <div className="border-t flex p-3 gap-3">
                    <UserCircle size={32} className="text-gray-600" />

                    <div
                        className={`
              flex justify-between items-center
              overflow-hidden transition-all 
            `}
                    >
                        {expanded && <div className="leading-4">
                            {name ? <>  <h4 className="font-semibold">{name}</h4>
                                <span className="text-xs text-gray-600">{email}</span></> : <SignInButton />}
                        </div>}

                    </div>
                </div>
            </nav>
        </aside>
    );
}