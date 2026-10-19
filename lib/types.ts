export interface Chat {
    hideInChat: boolean;
    role: string;
    text: string;
    isError?: boolean;
}

export type ChatHistory = {
    hideInChat: boolean;
    role: string;
    text: string;
}[];