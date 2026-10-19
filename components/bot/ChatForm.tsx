import { ChatHistory } from "@shared";
import { Dispatch, SetStateAction, useRef } from "react";
import { Button } from "../ui/button";
import { ArrowUp } from "lucide-react";

const ChatForm = ({ chatHistory, setChatHistory, generateBotResponse }
  : {
    chatHistory: ChatHistory,
    setChatHistory: Dispatch<SetStateAction<ChatHistory>>,
    generateBotResponse: (history: ChatHistory) => void
  }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFormSubmit = (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    const input = inputRef.current;
    if (!input) return;

    const userMessage = input.value.trim();
    if (!userMessage) return;
    input.value = "";
    // Update chat history with the user's message
    setChatHistory((history: ChatHistory) => [...history, { role: "user", text: userMessage, hideInChat: false }]);
    // Delay 600 ms before showing "Thinking..." and generating response
    setTimeout(() => {
      // Add a "Thinking..." placeholder for the bot's response
      setChatHistory((history: ChatHistory) => [...history, { role: "model", text: "Razonando...", hideInChat: false }]);
      // Call the function to generate the bot's response
      generateBotResponse([...chatHistory, { role: "user", text: `Using the details provided above, please address this query: ${userMessage}`, hideInChat: false }]);
    }, 600);
  };
  return (
    <form onSubmit={handleFormSubmit} className="chat-form">
      <input ref={inputRef} placeholder="Message..." className="message-input" required />
      <Button type="submit" id="send-message" className="material-symbols-rounded px-2">
        <ArrowUp className="!h-5 !w-5"></ArrowUp>
      </Button>
    </form>
  );
};
export default ChatForm;