"use client"
import { askGemini } from "@/lib/services/gemini";
import { ChatHistory } from "";
import { useEffect, useRef, useState } from "react";
import { Sparkle, X, ChevronDown } from "lucide-react" // Import TrendingUp icon
import ChatMessage from "./ChatMessage";
import { Button } from "../ui/button";
import ChatForm from "./ChatForm";
import "@/app/AIstyles.css"
import { systemPrompt } from "./systemPrompt";

const ChatComponent = () => {

    const chatBodyRef = useRef<HTMLDivElement>(null);
    const [showChatbot, setShowChatbot] = useState(false);
    const [chatHistory, setChatHistory] = useState<{ hideInChat: boolean; role: string; text: string; }[]>([
        {
            hideInChat: true,
            role: "model",
            text: systemPrompt,
        },
    ]);

    const [streamingText, setStreamingText] = useState("");

    const streamQueueRef = useRef("");
    const typedTextRef = useRef("");
    const isTypingRef = useRef(false);
    const streamFinishedRef = useRef(false);

    const startTyping = () => {
        if (isTypingRef.current) return;

        isTypingRef.current = true;

        const interval = setInterval(() => {
            if (streamQueueRef.current.length === 0) {
                clearInterval(interval);
                isTypingRef.current = false;

                if (streamFinishedRef.current) {
                    const finalText = typedTextRef.current;

                    setChatHistory((prev) => [
                        ...prev,
                        {
                            role: "model",
                            text: finalText,
                            hideInChat: false,
                        },
                    ]);

                    setStreamingText("");

                    typedTextRef.current = "";
                    streamFinishedRef.current = false;
                }

                return;
            }

            // Primera letra que llega:
            // quitamos "Razonando..."
            if (typedTextRef.current.length === 0) {
                setChatHistory((prev) =>
                    prev.filter((msg) => msg.text !== "Razonando...")
                );
            }

            const character = streamQueueRef.current.charAt(0);

            streamQueueRef.current = streamQueueRef.current.slice(1);

            typedTextRef.current += character;

            setStreamingText(typedTextRef.current);
        }, 20);
    };

    const generateBotResponse = async (history: ChatHistory) => {
        try {
            const response = await askGemini(
                history.map(({ role, text }) => ({
                    role,
                    parts: [{ text }],
                }))
            );

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error);
            }

            if (!response.body) {
                throw new Error("El servidor no devolvió un stream");
            }

            streamQueueRef.current = "";
            typedTextRef.current = "";
            streamFinishedRef.current = false;

            setStreamingText("");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                const chunk = decoder.decode(value, { stream: true });

                streamQueueRef.current += chunk;

                // Arrancar el efecto de escritura cuando
                // realmente haya texto disponible
            }

            const remaining = decoder.decode();

            if (remaining) {
                streamQueueRef.current += remaining;
            }

            streamFinishedRef.current = true;


            // Si ya terminó de escribir, guardar el mensaje
            /*
            if (!isTypingRef.current && streamQueueRef.current.length === 0) {
                setChatHistory((prev) => [
                    ...prev.filter((msg) => msg.text !== "Razonando..."),
                    {
                        role: "model",
                        text: typedTextRef.current,
                        hideInChat: false,
                    },
                ]);

                setStreamingText("");
                typedTextRef.current = "";
                streamFinishedRef.current = false;
            }*/
            startTyping();

        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Something went wrong!";

            setChatHistory((prev) => [
                ...prev.filter((msg) => msg.text !== "Razonando..."),
                {
                    role: "model",
                    text: errorMessage,
                    isError: true,
                    hideInChat: false,
                },
            ]);
        }
    };

    useEffect(() => {
        chatBodyRef.current?.scrollTo({
            top: chatBodyRef.current.scrollHeight,
            behavior: "auto",
        });
    }, [chatHistory, streamingText]);

    return (
        <div className={`container fixed z-[80] ${showChatbot ? "show-chatbot" : ""}`}>
            <Button onClick={() => setShowChatbot((prev) => !prev)} className="chatbot-toggler">
                {!showChatbot ? <Sparkle className="!w-7 !h-7" strokeWidth={"0px"} fill="white" /> : <X className="!w-7 !h-7"></X>}
            </Button>
            <div className="chatbot-popup">
                {/* Chatbot Header */}
                <div className="chat-header">
                    <div className="header-info">
                        <Sparkle strokeWidth={"0px"} />
                        <h2 className="logo-text">Cori AI</h2>
                    </div>
                    <Button onClick={() => setShowChatbot((prev) => !prev)} className="flex items-center justify-center">
                        <ChevronDown className="!w-7 !h-7"></ChevronDown>
                    </Button>
                </div>
                {/* Chatbot Body */}
                <div ref={chatBodyRef} className="chat-body">
                    <div className="message bot-message">
                        <Sparkle className="svg" strokeWidth={"0px"} />
                        <p className="message-text">
                            Hola estudiante 👋<br /> Soy Cori AI, el chatbot de Core Tools Lab. Puedo ayudarte con tus dudas académicas y explicarte cómo usar la plataforma
                        </p>
                    </div>
                    {/* Render the chat history dynamically */}
                    {chatHistory.map((chat, index) => (
                        <ChatMessage key={"C" + index} chat={chat} />
                    ))}

                    {streamingText && (
                        <ChatMessage
                            chat={{
                                role: "model",
                                text: streamingText,
                                hideInChat: false,
                            }}
                        />
                    )}
                </div>
                {/* Chatbot Footer */}
                <div className="chat-footer">
                    <ChatForm chatHistory={chatHistory} setChatHistory={setChatHistory} generateBotResponse={generateBotResponse} />
                </div>
            </div>
        </div>
    )
}
export default ChatComponent