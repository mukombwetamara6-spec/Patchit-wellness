import { useState } from "react";
import { Phone, WifiOff, RefreshCw } from "lucide-react";
import { Language, PainRecord } from "../types";
import { LOCAL_TRANSLATIONS } from "../data";

interface UssdSimulatorProps {
  language: Language;
  onRefresh: () => void;
}

export default function UssdSimulator({ language, onRefresh }: UssdSimulatorProps) {
  const t = LOCAL_TRANSLATIONS[language];

  // Simulator States
  const [sessionKey] = useState<string>("ussd-session-" + Math.floor(Math.random() * 10000));
  const [isActive, setIsActive] = useState<boolean>(false);
  const [displayScreen, setDisplayScreen] = useState<string>("Press Dial to connect stateful *123# offline gateway");
  const [userInput, setUserInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Quick Action Clickers for rapid navigation
  const dialUssd = async () => {
    setIsLoading(true);
    setIsActive(true);
    try {
      const resp = await fetch("/api/ussd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionKey, userInput: "", language })
      });
      if (resp.ok) {
        const data = await resp.json();
        // Remove 'CON ' or 'END ' prefix if needed, or keep for authenticity!
        setDisplayScreen(data.text);
      }
    } catch (e) {
      console.error(e);
      setDisplayScreen("Error connecting USSD network.");
    } finally {
      setIsLoading(false);
    }
  };

  const pressSend = async (customValue?: string) => {
    setIsLoading(true);
    const valueToSend = customValue !== undefined ? customValue : userInput;
    try {
      const resp = await fetch("/api/ussd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionKey, userInput: valueToSend, language })
      });
      if (resp.ok) {
        const data = await resp.json();
        setDisplayScreen(data.text);
        setUserInput("");
        onRefresh(); // Refresh central db explorer

        // If 'END' code returned, session resets
        if (data.text.startsWith("END ")) {
          // Keep screen active showing final message, let user reset manually
        }
      }
    } catch (e) {
      console.error(e);
      setDisplayScreen("Error executing transaction.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetSession = () => {
    setIsActive(false);
    setDisplayScreen("Press Dial to connect stateful *123# offline gateway");
    setUserInput("");
  };

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200 flex flex-col gap-4 font-sans text-slate-800 shadow-sm">
      <div className="flex justify-between items-center select-none">
        <div>
          <span className="px-2 py-0.5 bg-rose-50 border border-rose-100 text-rose-600 text-[8.5px] font-mono uppercase rounded font-bold">
            Cellular Portal
          </span>
          <h3 className="font-bold text-xs text-slate-900 mt-1">{t.ussdSubtitle}</h3>
        </div>
        <div className="flex gap-1.5 text-slate-400">
          <WifiOff className="w-4.5 h-4.5" />
        </div>
      </div>

      <p className="text-[10px] text-slate-500 leading-relaxed italic border-l-2 border-rose-300 pl-2 bg-rose-50/20 p-2 rounded-r">
        {t.ussdWarning}
      </p>

      {/* COMPACT RETRO USSD PHONE INTERFACE */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col gap-3.5 shadow-sm">
        
        {/* RETRO GREEN LED SCREEN REPRESENTATION */}
        <div className="bg-[#1c221a] text-[#86997d] p-3.5 rounded-xl font-mono text-[11px] leading-relaxed select-all border border-slate-350 h-28 flex flex-col justify-between overflow-y-auto shadow-inner relative">
          <div className="whitespace-pre-line tracking-tight">
            {displayScreen}
          </div>
          
          {isLoading && (
            <div className="absolute right-2.5 bottom-2.5">
              <RefreshCw className="w-3.5 h-3.5 animate-spin opacity-80" />
            </div>
          )}
        </div>

        {/* CONTROLS INPUT */}
        {isActive ? (
          <div className="space-y-2 font-mono">
            {!displayScreen.startsWith("END") && (
              <div className="flex gap-1.5">
                <input 
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={t.enterInput}
                  disabled={isLoading}
                  className="flex-1 bg-white border border-slate-200 text-[#2c3327] font-mono p-2 text-xs rounded-lg outline-none focus:border-rose-400"
                  onKeyDown={(e) => { if (e.key === 'Enter') pressSend(); }}
                />
                
                <button 
                  onClick={() => pressSend()}
                  disabled={isLoading}
                  className="bg-slate-900 text-white hover:bg-slate-800 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center border border-slate-800"
                >
                  Send
                </button>
              </div>
            )}

            <button 
              onClick={resetSession}
              className="w-full py-1.5 bg-slate-200/80 hover:bg-slate-200 text-slate-600 hover:text-slate-800 text-[10px] uppercase font-bold rounded-lg border border-slate-250 transition"
            >
              {t.resetUssd}
            </button>
          </div>
        ) : (
          <button 
            type="button"
            onClick={dialUssd}
            className="w-full bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-sm shadow-rose-500/10"
          >
            <Phone className="w-4 h-4 fill-current text-white" />
            <span>{t.dialNow}</span>
          </button>
        )}

        {/* SHORTCUT MATRIX (Only visible when active to speed up UX) */}
        {isActive && !displayScreen.startsWith("END") && (
          <div className="space-y-1 mt-1 border-t border-slate-200 pt-2.5 select-none">
            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block font-mono">
              Quick Select keys:
            </span>
            <div className="grid grid-cols-4 gap-1 font-mono">
              {["1", "2", "3", "4"].map(n => (
                <button 
                  key={n}
                  onClick={() => pressSend(n)}
                  className="py-1 bg-white hover:bg-rose-50 hover:text-rose-600 rounded-lg text-[10.5px] border border-slate-200 transition text-slate-700"
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
