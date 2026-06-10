import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Sparkles, Send, X, MessageSquare, Terminal } from "lucide-react";
import { renderMarkdown } from "./AiChatPanel";
import { fetchWithAuth } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function GlobalSocCopilot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (question: string) => {
    if (!question.trim() || loading) return;
    const userMsg: Message = { role: "user", content: question };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const data = await fetchWithAuth("/chat/", {
        method: "POST",
        body: JSON.stringify({ query: question, context: "Global SOC Context" })
      });
      
      const assistantMsg: Message = { role: "assistant", content: data.response || "No response generated." };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "assistant", content: `Error communicating with SOC Copilot: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 bg-primary text-primary-foreground p-4 rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-transform flex items-center justify-center z-50 group border border-primary/50"
        >
          <Sparkles className="h-6 w-6 group-hover:animate-pulse" />
          <span className="absolute -top-10 right-0 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-primary/30">
            SOC Copilot
          </span>
        </button>
      )}

      {/* Floating Chat Window */}
      {open && (
        <Card className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[400px] h-[550px] sm:h-[600px] flex flex-col shadow-2xl z-50 border-primary/30 bg-background/95 backdrop-blur-md">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
            <div className="flex items-center gap-2">
              <div className="bg-primary/20 p-1.5 rounded-md">
                 <Terminal className="h-4 w-4 text-primary" />
              </div>
              <div>
                 <div className="text-sm font-semibold text-foreground tracking-wide">SOC Copilot</div>
                 <div className="text-[10px] text-primary flex items-center gap-1">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                    </span>
                    System Online
                 </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-3 opacity-70">
                <Sparkles className="h-8 w-8 text-primary" />
                <p className="text-sm text-center max-w-[250px]">
                  I am your autonomous SOC Copilot. Ask me to analyze logs, look up CVEs, or recommend mitigations.
                </p>
                <div className="flex flex-col gap-2 w-full mt-4">
                  <button onClick={() => sendMessage("What are the most recent critical CVEs?")} className="text-xs bg-secondary hover:bg-primary/20 p-2 rounded border border-border text-left">
                    "What are the most recent critical CVEs?"
                  </button>
                  <button onClick={() => sendMessage("Write an iptables rule to block 192.168.1.100")} className="text-xs bg-secondary hover:bg-primary/20 p-2 rounded border border-border text-left">
                    "Write an iptables rule to block 192.168.1.100"
                  </button>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`text-sm px-3 py-2 rounded-lg max-w-[85%] shadow-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary border border-border/50 text-foreground'}`}>
                  {msg.role === 'user' ? (
                    msg.content
                  ) : (
                    <div className="space-y-1">
                      {renderMarkdown(msg.content)}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-primary">
                <Loader2 className="h-3 w-3 animate-spin" />
                Copilot is typing...
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border bg-secondary/30">
            <div className="relative flex items-center">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
                placeholder="Ask Copilot..."
                className="w-full bg-background border border-border rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none focus:border-primary/50"
                disabled={loading}
              />
              <Button
                size="sm"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="absolute right-1 h-7 w-7 p-0 rounded-full bg-primary hover:bg-primary/80"
              >
                <Send className="h-3 w-3 text-primary-foreground ml-0.5" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
