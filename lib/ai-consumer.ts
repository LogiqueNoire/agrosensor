export async function askGemini(history: {
    role: string;
    parts: {
        text: string;
    }[];
}[]) {
    const res = await fetch(`/api/gemini/generate`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            history,
        }),
    });

    return res;
}