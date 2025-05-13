import React, { useState, useRef, useEffect, useCallback } from "react";
import { X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardFooter } from "../../components/UI/card";
import { Input } from "../../components/UI/input";
import { useChatAPI } from "../../API/ChatAPI";

const cn = (...classes) => classes.filter(Boolean).join(' ');

function AiAssistant({ isOpen, onClose }) {
  const { getConversationHistory, sendMessage } = useChatAPI();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false); // Added state for history loading
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesEndRef]);

  useEffect(() => {
    if (isOpen && !hasLoadedHistory) { 
      fetchMessages();
    }
    // eslint-disable-next-line
  }, [isOpen, hasLoadedHistory, ]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedMessages = await getConversationHistory();
      if (fetchedMessages.length > 0) {
        setMessages(fetchedMessages);
      }
      setHasLoadedHistory(true);
    } catch (error) {
      console.error("Error fetching conversation history:", error);
      setError(error.message || "Failed to load conversation history");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    const messageText = newMessage.trim();
    setNewMessage(""); 

    const userMessage = {
      id: Date.now(),
      content: messageText,
      sender: { name: "You", isBot: false },
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    try {
      setIsLoading(true);
      setError(null);
      
      setMessages(prev => [...prev, userMessage]);

      const response = await sendMessage(messageText);
      
      if (response.botMessage) {
        const botMessage = {
          id: response.botMessage._id || Date.now() + 1,
          content: response.botMessage.content,
          sender: { name: "AI Assistant", isBot: true },
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        id: Date.now(),
        content: error.message || "I apologize, but I'm currently unable to process your request due to high demand. Please try again later.",
        sender: { name: "AI Assistant", isBot: true },
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center -mt-12 z-50 ">
      <Card className="w-50  bg-gray-900 border-0 flex flex-col h-[calc(100vh-12rem)] mt-16 shadow-xl relative  ">
        <CardHeader className="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-green-300">
          <div className="flex items-center gap-4 w-full">
            <svg
              viewBox="0 0 240 240"
              className="w-12 h-12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M45 120 C45 65 95 25 120 25 C145 25 195 65 195 120 C195 175 160 205 120 205 C80 205 45 175 45 120Z"
                className="fill-[url(#robotGradient)]"
              />
              <path d="M60 45 Q95 0 120 15 Q145 0 180 45" fill="#000000" />
              <path d="M70 45 Q95 15 120 30 Q145 15 170 45" stroke="#A5F3FC" strokeWidth="12" strokeLinecap="round" fill="none" />
              <path d="M85 35 Q120 0 155 35" stroke="#A5F3FC" strokeWidth="12" strokeLinecap="round" fill="none" />
              <path d="M80 40 Q60 10 90 30" stroke="#A5F3FC" strokeWidth="8" strokeLinecap="round" />
              <path d="M160 40 Q180 10 150 30" stroke="#A5F3FC" strokeWidth="8" strokeLinecap="round" />
              <path d="M100 35 Q120 10 140 35" stroke="#A5F3FC" strokeWidth="8" strokeLinecap="round" />
              <path
                d="M65 100 C65 70 95 50 120 50 C145 50 175 70 175 100 C175 130 150 160 120 160 C90 160 65 100 65 100Z"
                fill="#C4A484"
                opacity="0.9"
              />
              <path d="M90 130 Q120 140 150 130" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" fill="none" />
              <g className="glow">
                <circle cx="90" cy="100" r="20" className="fill-[url(#eyeGradient)]" />
                <circle cx="150" cy="100" r="20" className="fill-[url(#eyeGradient)]" />
                <circle cx="90" cy="100" r="10" fill="white" />
                <circle cx="150" cy="100" r="10" fill="white" />
              </g>
              <rect x="70" y="180" width="100" height="15" className="fill-[#80EE98]" /> 
              <rect x="80" y="165" width="80" height="15" className="fill-[#80EE98]" />
              <rect x="90" y="150" width="60" height="15" className="fill-[#80EE98]" />
              <g className="waving-hands">
                <path d="M50 140 Q40 130 45 120" stroke="#C4A484" strokeWidth="6" strokeLinecap="round" fill="none" className="waving-hand left-hand" />
                <path d="M190 140 Q200 130 195 120" stroke="#C4A484" strokeWidth="6" strokeLinecap="round" fill="none" className="waving-hand right-hand" />
              </g>
              <defs>
                <linearGradient id="robotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#000000" />
                  <stop offset="100%" stopColor="#111827" />
                </linearGradient>
                <linearGradient id="eyeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0ea5e9" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <h2 className="text-xl font-semibold text-[#80EE98]">AI Assistant</h2>
            <button onClick={onClose} className="ml-auto text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
        </CardHeader>
        
        <CardContent
          ref={chatContainerRef}
          className="flex-grow overflow-y-auto p-0 pb-2 custom-scrollbar"
        >
          {error ? (
            <div className="flex flex-col items-start p-4">
              <div className="bg-[#1f2937] text-gray-100 px-4 py-2 rounded-lg max-w-[75%]">
                <p className="text-sm">{error}</p>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-4 px-4">
              <div className="flex flex-col gap-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "w-full py-2",
                      message.sender.isBot ? "bg-gray-900" : "bg-transparent"
                    )}
                  >
                    <div className="max-w-3xl mx-auto">
                      <div
                        className={cn(
                          "flex flex-col gap-1",
                          message.sender.isBot ? "items-start" : "items-end"
                        )}
                      >
                        <div
                          className={cn(
                            "rounded-lg px-4 py-3",
                            message.sender.isBot
                              ? "bg-[#374151] text-gray-100"
                              : "bg-[#374151] text-gray-100"
                          )}
                          style={{
                            maxWidth: "75%",
                            wordWrap: "break-word",
                            overflowWrap: "break-word",
                            whiteSpace: "pre-line",
                          }}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400 px-1">
                          <time dateTime={message.timestamp}>{message.timestamp}</time>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </CardContent>

        {isLoading && (
          <div className="h-2 w-full bg-gray-800 relative overflow-hidden mb-2">
            <div
              className="h-full absolute left-0 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500"
              style={{
                width: '50%',
                animation: 'moveLoadingBar 1.5s ease-in-out infinite, pulseLoading 2s ease-in-out infinite',
              }}
            />
          </div>
        )}

        <CardFooter className="p-4 pt-2 border-t border-green-200 bg-gray-900">
          <form onSubmit={handleSubmit} className="flex gap-2 w-full">
            <Input
              placeholder="Type your message here..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-grow border border-gray-600 bg-[#2A3F5A] text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-gray-500 rounded-lg"
              aria-label="Message"
              disabled={!!error}
            />
            <button
              type="submit"
              className="h-10 w-10 p-0 bg-gradient-to-r from-[#80EE98] to-[#09D1C7] hover:from-[#09D1C7] hover:to-[#80EE98] rounded-lg flex items-center justify-center disabled:opacity-50"
              disabled={isLoading || !!error}
            >
              <svg 
                viewBox="0 0 24 24" 
                className="w-5 h-5 text-white"
                fill="currentColor"
              >
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
              <span className="sr-only">Send message</span>
            </button>
          </form>
        </CardFooter>
      </Card>
      <style jsx global>{`
        @keyframes moveLoadingBar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(300%); }
        }

        @keyframes pulseLoading {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-15deg); }
          75% { transform: rotate(15deg); }
        }

        .waving-hand {
          animation: wave 2s ease-in-out infinite;
        }

        .left-hand {
          transform-origin: 45px 120px;
        }

        .right-hand {
          transform-origin: 195px 120px;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(128, 238, 152, 0.1);
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(128, 238, 152, 0.5);
          border-radius: 4px;
          transition: background 0.2s ease;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(128, 238, 152, 0.7);
        }
      `}</style>
    </div>
  );
}

export default AiAssistant;

