import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/theme-toggle";
import { Cookie, User, TrendingUp, LogOut, Send, Bot, MessageCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

const FITNESS_MASTER_PROMPT = `You are FitMaster, an expert fitness and nutrition coach with 20+ years of experience helping people achieve their health goals. You have deep knowledge in:

• Exercise science and workout programming
• Nutrition science and meal planning
• Weight loss/gain strategies
• Muscle building and strength training
• Cardiovascular health and endurance
• Recovery and injury prevention
• Supplement guidance
• Mental health and motivation

Your personality:
- Encouraging and supportive, never judgmental
- Evidence-based and scientific in your approach
- Practical and realistic with advice
- Adaptable to different fitness levels and goals
- Always prioritize safety and proper form

Guidelines:
- Ask follow-up questions to personalize advice
- Provide specific, actionable recommendations
- Include safety warnings when appropriate
- Suggest modifications for different ability levels
- Reference current fitness research when relevant
- Keep responses concise but comprehensive

Always remember you're talking to someone on their fitness journey - meet them where they are and help them take the next step forward!`;

const Chat = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: "👋 Hi there! I'm your personal fitness and nutrition coach! I'm here to help you with workout plans, nutrition advice, goal setting, and any fitness questions you have. What would you like to work on today?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Simple markdown-like formatting
  const formatMessage = (text: string) => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') // Bold text
      .replace(/^\*\s+(.+)$/gm, '• $1') // Bullet points (must come before italic)
      .replace(/^-\s+(.+)$/gm, '• $1') // Dash bullet points
      .replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>') // Italic text (but not bullet points)
      .replace(/\n/g, '<br />'); // Line breaks
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Check if API key is available
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      
      if (!apiKey) {
        throw new Error('Gemini API key not found. Please add VITE_GEMINI_API_KEY to your .env file.');
      }

      console.log('API Key available:', apiKey ? 'Yes' : 'No');
      
      // Using Google's latest Gemini API model
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${FITNESS_MASTER_PROMPT}\n\nUser: ${inputValue}`
            }]
          }]
        })
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
      
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process that request. Please try again.";

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      
      let errorMessage = "I'm sorry, I'm having trouble connecting right now.";
      
      if (error instanceof Error) {
        if (error.message.includes('API key not found')) {
          errorMessage = "❌ API key not configured. Please check your .env file and restart the development server.";
        } else if (error.message.includes('403')) {
          errorMessage = "❌ API key is invalid or doesn't have permission. Please check your Gemini API key.";
        } else if (error.message.includes('400')) {
          errorMessage = "❌ Bad request. There might be an issue with the request format.";
        } else {
          errorMessage = `❌ Error: ${error.message}`;
        }
      }
      
      toast.error(errorMessage);
      
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        content: errorMessage,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickPrompts = [
    "Create a beginner workout plan",
    "What should I eat for muscle gain?",
    "How to lose weight safely?",
    "Best exercises for core strength"
  ];

  // Debug API key availability
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const isApiKeyConfigured = Boolean(apiKey && apiKey !== 'your_gemini_api_key_here');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cookie className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold">Fitify</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <TrendingUp className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
              <User className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl flex-1 flex flex-col">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-bold">AI Coach</h2>
          </div>
          <p className="text-muted-foreground">Get personalized fitness and nutrition advice from your AI coach</p>
        </div>

        <Card className="flex-1 min-h-[500px] flex flex-col">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              Chat with your AI Coach
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.isUser
                          ? 'bg-primary text-primary-foreground ml-4'
                          : 'bg-muted text-foreground mr-4'
                      }`}
                    >
                      <div 
                        className="whitespace-pre-wrap leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                      />
                      <div className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted text-foreground rounded-lg px-4 py-2 mr-4">
                      <div className="flex items-center gap-2">
                        <div className="animate-pulse flex space-x-1">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm">FitMaster is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Quick Prompts */}
            <div className="border-t p-4">
              {/* API Key Status */}
              <div className="mb-3 p-3 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${isApiKeyConfigured ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className={isApiKeyConfigured ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
                    API Status: {isApiKeyConfigured ? 'Connected' : 'Not Configured'}
                  </span>
                </div>
                {!isApiKeyConfigured && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p>⚠️ Please restart your development server after adding the API key to .env</p>
                    <p>💡 Get your free key at: <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a></p>
                  </div>
                )}
              </div>

              <div className="mb-3">
                <p className="text-sm text-muted-foreground mb-2">Quick prompts:</p>
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setInputValue(prompt)}
                      className="text-xs"
                      disabled={!isApiKeyConfigured}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isApiKeyConfigured ? "Ask FitMaster anything about fitness, nutrition, or health..." : "Please configure API key and restart server..."}
                  disabled={isLoading || !isApiKeyConfigured}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || !inputValue.trim() || !isApiKeyConfigured}
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Chat;