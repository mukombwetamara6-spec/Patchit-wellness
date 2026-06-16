import { useState } from "react";
import { MessageSquare, Send, CheckCheck } from "lucide-react";
import { Language, ChatMessage } from "../types";
import { LOCAL_TRANSLATIONS } from "../data";

interface WhatsappSimulatorProps {
  language: Language;
  onRefresh: () => void;
}

export default function WhatsappSimulator({ language, onRefresh }: WhatsappSimulatorProps) {
  const t = LOCAL_TRANSLATIONS[language];

  // Simulator States
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial",
      sender: "bot",
      text: language === 'sn' 
        ? "Mhoro! Mauya kuPatch It WhatsApp Helper. Unogona kunyora kusanzwa zvakanaka kwemuviri, kubvunza mibvunzo yehutano hwemadzimai pachivande, kana kuodha zvigamba zvedu pano."
        : language === 'nd'
        ? "Salibonani! Wamukelekile ku-Patch It WhatsApp Helper. Ungabhala ubuhlungu bomzimba, ubuze imibuzo yezempilakahle yabesifazana ngasese, kumbe u-ode izichibi zethu lapha."
        : "Salibonani / Mhoro! Welcome to your Patch It Wellness Helper. Log symptoms, ask sexual and reproductive health questions secretly, or order patches here.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Suggestions Chip sets
  const chipSuggestions = {
    en: [
      { label: "My back is hurting", query: "I have lower back pain today" },
      { label: "Menopause sweats", query: "Night sweats are disrupting my sleep" },
      { label: "How to use tea", query: "Tell me how to prepare Zumbani tea for cramps" }
    ],
    sn: [
      { label: "Musana uri kurwadza", query: "ndiri kunzwa musana kurwadza, ndozora mafuta api?" },
      { label: "Kupisa muviri husiku", query: "Muviri uri kupisa husiku hweMenopause" },
      { label: "Kubika Zumbani tea", query: "Ndeipi nzira yekubikisa Zumbani tea?" }
    ],
    nd: [
      { label: "Isisu sibuhlungu", query: "Isisu sami sibuhlungu sikhathi se-period" },
      { label: "Kutshisa komzimba", query: "Ukutshisa komzimba ebusuku" },
      { label: "Indlela yetiye yeMakoni", query: "Ngifuna usizo lwendlela yokupheka itiye yeMakoni" }
    ]
  };

  const handleSendMessage = async (textToSend?: string) => {
    const rawMsg = textToSend !== undefined ? textToSend : inputText;
    if (!rawMsg.trim()) return;

    setIsLoading(true);
    setInputText("");

    // 1. Instantly append user's bubble
    const userMsg: ChatMessage = {
      id: "user-" + Date.now(),
      sender: "user",
      text: rawMsg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);

    // 2. Fetch bot's reply from API endpoint
    try {
      const resp = await fetch("/api/whatsapp-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: "+263772001122",
          message: rawMsg,
          language
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        // The endpoint responds with the full session messages. Grab the last one
        const length = data.messages?.length;
        if (length > 0) {
          const lastBotMessage = data.messages[length - 1];
          const botMsg: ChatMessage = {
            id: "bot-" + Date.now(),
            sender: "bot",
            text: lastBotMessage.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, botMsg]);
        }
        
        onRefresh(); // Refresh central db records instantly!
      }
    } catch (e) {
      console.error(e);
      const errMsg: ChatMessage = {
        id: "err-" + Date.now(),
        sender: "bot",
        text: "Sorry, connection is fluctuating. Ensure you are on Econet data bundle packages. Please retry.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200 flex flex-col gap-4 font-sans text-slate-800 shadow-sm">
      <div className="flex justify-between items-center select-none">
        <div>
          <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-150 text-emerald-600 text-[8.5px] font-mono uppercase rounded font-bold">
            Chat Gateway
          </span>
          <h3 className="font-bold text-xs text-slate-900 mt-1">{t.whatsappSubtitle}</h3>
        </div>
        <MessageSquare className="w-4.5 h-4.5 text-slate-400" />
      </div>

      {/* WHATSAPP BUBBLES WINDOW */}
      <div className="bg-[#efeae2] rounded-2xl border border-slate-200 p-3 flex flex-col h-[320px] select-text">
        
        {/* MESSAGES CONSOLE */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1.5 scrollbar-thin">
          {messages.map(msg => {
            const isBot = msg.sender === 'bot';
            return (
              <div 
                key={msg.id}
                className={`flex flex-col max-w-[85%] rounded-2xl p-2.5 text-xs text-left relative shadow-sm ${
                  isBot 
                    ? 'bg-white text-slate-800 border border-slate-100 self-start rounded-tl-none' 
                    : 'bg-[#d9fdd3] text-slate-800 border border-emerald-100/40 self-end rounded-tr-none'
                }`}
              >
                <p className="whitespace-pre-line leading-relaxed font-light">{msg.text}</p>
                <div className="flex items-center justify-end gap-1 mt-1 font-mono text-[8.5px] text-slate-400 leading-none">
                  <span>{msg.timestamp}</span>
                  {!isBot && <CheckCheck className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />}
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="bg-white border border-slate-100 text-slate-450 p-2.5 text-[10px] tracking-wide rounded-lg self-start italic shadow-sm">
              Empathetic counseling model typing...
            </div>
          )}
        </div>

        {/* QUICK SUGGEST SUGGESTION CHIPS */}
        <div className="mt-2.5 pb-2 pt-1 border-t border-slate-200/60 overflow-x-auto flex gap-1.5 select-none shrink-0 scrollbar-none">
          {chipSuggestions[language].map(chip => (
            <button
              key={chip.label}
              type="button"
              onClick={() => handleSendMessage(chip.query)}
              disabled={isLoading}
              className="bg-white/95 hover:bg-white text-emerald-700 border border-slate-200/80 hover:border-emerald-200 text-[10px] py-1 px-2.5 rounded-full transition whitespace-nowrap active:scale-95 disabled:opacity-50 font-normal shadow-sm"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* INPUT SEND DRAWER */}
        <div className="flex gap-2 border-t border-slate-200/60 pt-2 shrink-0 select-none">
          <input 
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            placeholder={t.whatsappPrompt}
            className="flex-1 bg-white border border-slate-250 text-slate-800 p-2 text-xs rounded-xl outline-none focus:border-emerald-500 font-light shadow-inner"
            onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
          />
          <button 
            type="button"
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputText.trim()}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition disabled:opacity-40 shadow-sm cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
