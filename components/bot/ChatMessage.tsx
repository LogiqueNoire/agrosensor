import { Chat } from "@shared";
import { Sparkle } from "lucide-react";

const ChatMessage = ({ chat }: { chat: Chat }) => {
    return (
        !chat.hideInChat && (
            <div className={`message ${chat.role === "model" ? "bot" : "user"}-message ${chat.isError ? "error" : ""}`}>
                {chat.role === "model" && <Sparkle strokeWidth={"0px"} />}
                <p className="message-text">{chat.text}</p>
            </div>
        )
    );
};
export default ChatMessage;