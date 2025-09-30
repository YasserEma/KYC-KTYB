"use client ";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useDisplayName() {
    const [displayName, setDisplayName] = useState<string | null>(null);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
            setDisplayName(data?.user?.user_metadata?.display_name ?? null);
        });
    }, []);

    return displayName;
}
export function useDisplayEmail() {
    const [displayEmail, setDisplayEmail] = useState<string | null>(null);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
            setDisplayEmail(data?.user?.email ?? null);
        });
    }, []);

    return displayEmail;
}