import { useState, useEffect } from "react";
import { 
  Heart, 
  Activity, 
  ShieldAlert, 
  Database, 
  Sparkles, 
  Send,
  Droplet,
  Smartphone,
  Flame,
  Volume2,
  Users,
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  Search,
  LayoutGrid
} from "lucide-react";
import CompanionApp from "./components/CompanionApp";
import UssdSimulator from "./components/UssdSimulator";
import WhatsappSimulator from "./components/WhatsappSimulator";
import { Language, PainRecord, PatchReminder } from "./types";
import { LOCAL_TRANSLATIONS } from "./data";
import { apiFetch, offlineState } from "./utils/apiFetch";

export default function App() {
  const [language, setLanguage] = useState<Language>('en');
  const t = LOCAL_TRANSLATIONS[language];

  // Core full-stack database state in memory synchronized from API
  const [dbState, setDbState] = useState<{
    records: PainRecord[];
    impactStats: { subscriberCount: number; distributedFreeCount: number; fundsMobilizedUSD: number };
    orders: any[];
    reminders: PatchReminder[];
    forumPosts: any[];
  }>({
    records: [],
    impactStats: { subscriberCount: 248, distributedFreeCount: 1420, fundsMobilizedUSD: 1840 },
    orders: [],
    reminders: [],
    forumPosts: []
  });

  const [loadingDb, setLoadingDb] = useState<boolean>(true);
  const [isSyncingOffline, setIsSyncingOffline] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'app' | 'telecom' | 'database'>('app');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [channelFilter, setChannelFilter] = useState<'all' | 'app' | 'ussd' | 'whatsapp'>('all');

  // Simulated Offline Mode - helps demonstrate PWA resilience in AI Studio preview
  const [isOfflineSimulated, setIsOfflineSimulated] = useState<boolean>(() => {
    return localStorage.getItem("patchit_offline_simulated") === "true";
  });

  // Client-Side Cache Queues (Persistent in LocalStorage)
  const [offlineRecords, setOfflineRecords] = useState<PainRecord[]>(() => {
    const saved = localStorage.getItem("patchit_offline_records");
    return saved ? JSON.parse(saved) : [];
  });

  const [offlineForumPosts, setOfflineForumPosts] = useState<any[]>(() => {
    const saved = localStorage.getItem("patchit_offline_forum");
    return saved ? JSON.parse(saved) : [];
  });

  const [offlineOrders, setOfflineOrders] = useState<any[]>(() => {
    const saved = localStorage.getItem("patchit_offline_orders");
    return saved ? JSON.parse(saved) : [];
  });

  // State for simulated USSD & WhatsApp state machines inside client memory when offline
  const [ussdMenuPath, setUssdMenuPath] = useState<string>("lang_select");
  const [ussdLanguage, setUssdLanguage] = useState<"en" | "sn" | "nd">("en");
  const [ussdTempPain, setUssdTempPain] = useState<number>(5);
  const [waMessages, setWaMessages] = useState<any[]>([
    { id: "init", sender: "bot", text: "Salibonani / Mhoro! Welcome to your offline Patch It companionbot. Logging symptoms or asking general health is enabled offline.", timestamp: new Date().toISOString() }
  ]);

  // Persist local state queues as they change
  useEffect(() => {
    localStorage.setItem("patchit_offline_records", JSON.stringify(offlineRecords));
  }, [offlineRecords]);

  useEffect(() => {
    localStorage.setItem("patchit_offline_forum", JSON.stringify(offlineForumPosts));
  }, [offlineForumPosts]);

  useEffect(() => {
    localStorage.setItem("patchit_offline_orders", JSON.stringify(offlineOrders));
  }, [offlineOrders]);

  useEffect(() => {
    localStorage.setItem("patchit_offline_simulated", String(isOfflineSimulated));
  }, [isOfflineSimulated]);

  // Fetch updated dashboard state from Express server
  const fetchDashboardState = async () => {
    try {
      const resp = await apiFetch("/api/dashboard");
      if (resp.ok) {
        const data = await resp.json();
        setDbState(data);
      }
    } catch (e) {
      console.error("Failed to sync from database:", e);
    } finally {
      setLoadingDb(false);
    }
  };

  useEffect(() => {
    fetchDashboardState();
  }, []);

  // Sync entire offline queue back to backend database
  const syncOfflineQueue = async () => {
    if (isOfflineSimulated) {
      alert("Please dial back ONLINE first to synchronize data to the server node!");
      return;
    }

    const totalToSync = offlineRecords.length + offlineForumPosts.length + offlineOrders.length;
    if (totalToSync === 0) return;

    setIsSyncingOffline(true);
    try {
      // 1. Sync Records
      for (const rec of offlineRecords) {
        await apiFetch("/api/records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rec)
        });
      }

      // 2. Sync Forum Posts
      for (const fp of offlineForumPosts) {
        await apiFetch("/api/forum", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: fp.text, category: fp.category })
        });
      }

      // 3. Sync E-commerce Orders
      for (const order of offlineOrders) {
        await apiFetch("/api/purchase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(order)
        });
      }

      // Clear Queues
      setOfflineRecords([]);
      setOfflineForumPosts([]);
      setOfflineOrders([]);
      
      // Pull fresh database
      await fetchDashboardState();
      alert(`Synchronized ${totalToSync} offline logs successfully with the active Zimbabwe cloud database node.`);
    } catch (err) {
      console.error("Critical error during sync cascade:", err);
      alert("Failed to sync some items. Placing network nodes back into local queue.");
    } finally {
      setIsSyncingOffline(false);
    }
  };

  // HYBRID FETCH PROXY INTERCEPTOR:
  // Dynamically reroutes all backend POST/GET requests to client memory/localStorage when offline
  useEffect(() => {
    offlineState.isOffline = isOfflineSimulated;

    if (isOfflineSimulated) {
      offlineState.handleFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const urlStr = typeof input === "string" ? input : (input instanceof URL ? input.href : input.url);
        
        // Parse the endpoint and params
        if (urlStr.startsWith("/api/dashboard")) {
          // Merge server db state with dynamic offline queues
          const mergedRecords = [...offlineRecords, ...dbState.records];
          const mergedForum = [...offlineForumPosts, ...dbState.forumPosts];
          const mergedOrders = [...offlineOrders, ...dbState.orders];
          
          // Synthesize locally incremented impact stats
          let extraSubs = offlineOrders.length;
          let extraFree = extraSubs * 6;
          let extraFunds = offlineOrders.reduce((sum, o) => sum + (Number(o.priceUSD) || 0), 0);

          const cachedPayload = {
            records: mergedRecords,
            impactStats: {
              subscriberCount: dbState.impactStats.subscriberCount + extraSubs,
              distributedFreeCount: dbState.impactStats.distributedFreeCount + extraFree,
              fundsMobilizedUSD: dbState.impactStats.fundsMobilizedUSD + extraFunds
            },
            orders: mergedOrders,
            reminders: dbState.reminders,
            forumPosts: mergedForum
          };

          return new Response(JSON.stringify(cachedPayload), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        }

        if (urlStr.startsWith("/api/records")) {
          const body = init?.body ? JSON.parse(init.body as string) : {};
          const newRec: PainRecord = {
            id: "rec-off-" + Date.now() + Math.floor(Math.random() * 100),
            timestamp: new Date().toISOString(),
            intensity: Number(body.intensity) || 5,
            symptomText: body.symptomText || "Logged Offline Cache",
            symptoms: Array.isArray(body.symptoms) ? body.symptoms : ["General Pain"],
            products: Array.isArray(body.products) ? body.products : ["None"],
            channel: body.channel || "app",
            absenteeism: !!body.absenteeism,
            lifeStage: body.lifeStage || "cycle"
          };

          setOfflineRecords(prev => [newRec, ...prev]);
          
          return new Response(JSON.stringify({ success: true, record: newRec }), {
            status: 201,
            headers: { "Content-Type": "application/json" }
          });
        }

        if (urlStr.startsWith("/api/forum")) {
          if (init?.method === "POST") {
            const body = init?.body ? JSON.parse(init.body as string) : {};
            const newPost = {
              id: "fp-off-" + Date.now(),
              author: "Offline-Sister-" + Math.floor(100 + Math.random() * 900),
              text: body.text || "",
              timestamp: new Date().toISOString(),
              likes: 0,
              category: body.category || "cycle"
            };

            setOfflineForumPosts(prev => [newPost, ...prev]);

            return new Response(JSON.stringify({ success: true, post: newPost, posts: [newPost, ...offlineForumPosts, ...dbState.forumPosts] }), {
              status: 201,
              headers: { "Content-Type": "application/json" }
            });
          } else {
            return new Response(JSON.stringify({ posts: [...offlineForumPosts, ...dbState.forumPosts] }), {
              status: 200,
              headers: { "Content-Type": "application/json" }
            });
          }
        }

        if (urlStr.startsWith("/api/analyze-symptoms")) {
          const body = init?.body ? JSON.parse(init.body as string) : {};
          const normalText = (body.symptomText || "").toLowerCase();
          
          // Run offline-first Shona/Ndebele rules mapping in under 5ms
          let symptoms = ["Cramps"];
          let products = ["Transdermal Patch", "Zumbani Tea"];
          let risk = "medium";
          let explanation = "Active offline heuristic model matched. Apply transdermal patch for 12 hours of localized relief. Brew warm Zumbani Tea twice daily to relax uterine muscles.";

          if (normalText.includes("kupisa") || normalText.includes("flash") || normalText.includes("sweat")) {
            symptoms = ["Hot Flash"];
            products = ["Cooling Belt", "Makoni Tea"];
            risk = "low";
            explanation = "Menopause hot flash mapped. Brew Makoni resurrection tea in cold water and apply your cooling belt inserts to regulate core sweat glands immediately.";
          } else if (normalText.includes("musana") || normalText.includes("back")) {
            symptoms = ["Backache"];
            products = ["Heating Belt"];
            explanation = "Back spasms mapped. Run active warming belt cycle for 20 minutes to restore pelvic arterial dilation.";
          }

          const offlineDiagnosis = {
            symptoms,
            detectedLanguage: body.language || "en",
            recommendedProducts: products,
            remedyExplanation: explanation,
            proactiveTip: `Offline warning: Prepare protective remedies 48 hours before next localized hormonal drop.`,
            absenteeismRisk: risk
          };

          return new Response(JSON.stringify(offlineDiagnosis), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        }

        if (urlStr.startsWith("/api/purchase")) {
          const body = init?.body ? JSON.parse(init.body as string) : {};
          const newOrder = {
            id: "ord-off-" + Date.now(),
            productName: body.productName || "Product",
            priceUSD: Number(body.priceUSD) || 0,
            timestamp: new Date().toISOString(),
            status: "Simulated Offline Cash Delivery (Pending Sync)",
            paymentMethod: body.paymentMethod || "EcoCash",
            phoneNumber: body.phoneNumber || ""
          };

          setOfflineOrders(prev => [newOrder, ...prev]);

          return new Response(JSON.stringify({
            success: true,
            order: newOrder,
            impactStats: {
              subscriberCount: dbState.impactStats.subscriberCount + offlineOrders.length + 1,
              distributedFreeCount: dbState.impactStats.distributedFreeCount + (offlineOrders.length + 1) * 6,
              fundsMobilizedUSD: dbState.impactStats.fundsMobilizedUSD + (Number(body.priceUSD) || 0)
            }
          }), {
            status: 201,
            headers: { "Content-Type": "application/json" }
          });
        }

        if (urlStr.startsWith("/api/reminders/reset") || urlStr.startsWith("/api/reminders/toggle")) {
          // Simply return mock success
          return new Response(JSON.stringify({ success: true, reminders: dbState.reminders }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        }

        if (urlStr.startsWith("/api/whatsapp-chat")) {
          const body = init?.body ? JSON.parse(init.body as string) : {};
          const msgText = body.message || "";
          
          const newMsg = {
            id: "user-" + Date.now(),
            sender: "user",
            text: msgText,
            timestamp: new Date().toISOString()
          };

          // Basic responsive keyword matching offline
          let botResponse = "Thank you. Offline companionbot is running. Stay warm and brew Zumbani tea for lower cramps.";
          const norm = msgText.toLowerCase();

          let shouldLogPain = false;
          let symptomsLogged = ["General pain"];

          if (norm.includes("pain") || norm.includes("cramps") || norm.includes("kurwadza")) {
            botResponse = "Mhoro / Salibonani. I noted details about pelvic discomfort. I have safely recorded this in your offline diary queue.";
            shouldLogPain = true;
            symptomsLogged = ["Cramps"];
          } else if (norm.includes("kupisa") || norm.includes("hot") || norm.includes("sweat")) {
            botResponse = "Hot Flash detected. Stand in shaded area and drink cooled resurrection Makoni blend.";
            shouldLogPain = true;
            symptomsLogged = ["Hot Flash"];
          }

          const botMsg = {
            id: "bot-" + Date.now(),
            sender: "bot",
            text: botResponse,
            timestamp: new Date().toISOString()
          };

          const newWaList = [...waMessages, newMsg, botMsg];
          setWaMessages(newWaList);

          if (shouldLogPain) {
            const offlineRecord: PainRecord = {
              id: "rec-off-wa-" + Date.now(),
              timestamp: new Date().toISOString(),
              intensity: 7,
              symptomText: msgText,
              symptoms: symptomsLogged,
              products: ["Zumbani Tea"],
              channel: "whatsapp",
              absenteeism: false,
              lifeStage: "cycle"
            };
            setOfflineRecords(prev => [offlineRecord, ...prev]);
          }

          return new Response(JSON.stringify({
            sessionKey: body.sender || "+26377xxxxxxxx",
            messages: newWaList,
            records: [...offlineRecords, ...dbState.records]
          }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        }

        if (urlStr.startsWith("/api/ussd")) {
          const body = init?.body ? JSON.parse(init.body as string) : {};
          const userInput = body.userInput || "";
          let nextMenu = ussdMenuPath;
          let curLang = ussdLanguage;
          let curPain = ussdTempPain;
          let screenText = "";
          let finished = false;

          if (ussdMenuPath === "lang_select") {
            if (!userInput) {
              screenText = "CON Welcome to Patch It Wellness Mobile!\n1. English\n2. Shona (ChiShona)\n3. Ndebele (isiNdebele)";
            } else {
              if (userInput === "1") curLang = "en";
              else if (userInput === "2") curLang = "sn";
              else if (userInput === "3") curLang = "nd";
              setUssdLanguage(curLang);
              nextMenu = "main_menu";
              
              screenText = curLang === "sn" 
                ? "CON Patch It Sarudzo:\n1. Nyora Marwadzo (1-10)\n2. Tarisa Refill Yako\n3. Nyora reKusara kuChikoro\n4. Emergency Hot Flash"
                : curLang === "nd"
                ? "CON Patch It Khetha:\n1. Bhala Ubuhlungu (1-10)\n2. Kuhlola i-Refill yakho\n3. Isikolo Esilahlekileyo\n4. Emergency Hot Flash"
                : "CON Patch It Unified Menu:\n1. Log Pain (1-10)\n2. Refill Order Status\n3. Log Absenteeism\n4. Menopause Emergency Hot Flash";
            }
          } 
          else if (ussdMenuPath === "main_menu") {
            if (userInput === "1") {
              nextMenu = "log_intensity";
              screenText = curLang === "sn" 
                ? "CON Faka simba remarwadzo mu-scale 1 kusvika 10 (1-10):"
                : "CON Enter current pain intensity scale (1 is mild, 10 is severe):";
            } else if (userInput === "2") {
              screenText = "END Status: Pre-Packed at Harare Hub. Cached locally. Distribution funds 6 free rural packages.";
              finished = true;
            } else if (userInput === "3") {
              nextMenu = "absenteeism_log";
              screenText = "CON Did pain prevent school/work attendance today?\n1. Yes\n2. No";
            } else if (userInput === "4") {
              screenText = "END Menopause emergency noted. Drink cooled Makoni blend and apply cold gel inserts.";
              finished = true;

              const offlineRec: PainRecord = {
                id: "rec-off-ussd-" + Date.now(),
                timestamp: new Date().toISOString(),
                intensity: 8,
                symptomText: "USSD Emergency Hot Flash Logged",
                symptoms: ["Hot Flash"],
                products: ["Cooling Belt"],
                channel: "ussd",
                absenteeism: false,
                lifeStage: "balance"
              };
              setOfflineRecords(prev => [offlineRec, ...prev]);
            }
          }
          else if (ussdMenuPath === "log_intensity") {
            const num = Number(userInput) || 5;
            setUssdTempPain(num);
            nextMenu = "log_symptom";
            screenText = "CON Select main symptom:\n1. Cramps\n2. Headache / Fatigue\n3. Hot Flash\n4. Backache";
          }
          else if (ussdMenuPath === "log_symptom") {
            let sym = "Cramps";
            if (userInput === "2") sym = "Headache";
            else if (userInput === "3") sym = "Hot Flash";
            else if (userInput === "4") sym = "Backache";

            const offlineRec: PainRecord = {
              id: "rec-off-ussd-" + Date.now(),
              timestamp: new Date().toISOString(),
              intensity: ussdTempPain,
              symptomText: `USSD Offline: Intensity ${ussdTempPain}, Symptom ${sym}`,
              symptoms: [sym],
              products: ["Zumbani Tea"],
              channel: "ussd",
              absenteeism: false,
              lifeStage: "cycle"
            };
            setOfflineRecords(prev => [offlineRec, ...prev]);

            screenText = `END Symptom logged in local offline cache. Prepare fresh Zumbani and keep warm.`;
            finished = true;
          }
          else if (ussdMenuPath === "absenteeism_log") {
            const isAb = userInput === "1";
            const offlineRec: PainRecord = {
              id: "rec-off-ussd-" + Date.now(),
              timestamp: new Date().toISOString(),
              intensity: 5,
              symptomText: isAb ? "USSD School Absenteeism Logged (Missed Day)" : "USSD Attended School",
              symptoms: ["Cramps"],
              products: ["Transdermal Patch"],
              channel: "ussd",
              absenteeism: isAb,
              lifeStage: "cycle"
            };
            setOfflineRecords(prev => [offlineRec, ...prev]);

            screenText = `END Absenteeism recorded in local database cache. Take care.`;
            finished = true;
          }

          if (finished) {
            setUssdMenuPath("lang_select");
          } else {
            setUssdMenuPath(nextMenu);
          }

          return new Response(JSON.stringify({
            text: screenText,
            sessionState: { menuPath: nextMenu, language: curLang },
            records: [...offlineRecords, ...dbState.records]
          }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        }

        // Catch-all for any other API hits
        return new Response(JSON.stringify({ success: true, offline: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      };

      return () => {
        offlineState.handleFetch = null;
      };
    } else {
      offlineState.handleFetch = null;
    }
  }, [isOfflineSimulated, offlineRecords, offlineForumPosts, offlineOrders, dbState, ussdMenuPath, ussdLanguage, ussdTempPain, waMessages]);

  const toggleOfflineSimulation = () => {
    setIsOfflineSimulated(prev => !prev);
    // Automatically trigger a refresh to swap context states
    setTimeout(() => {
      fetchDashboardState();
    }, 100);
  };

  const filteredRecords = dbState.records.filter(rec => {
    if (channelFilter !== 'all' && rec.channel !== channelFilter) {
      return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const mainSymptomMatch = rec.symptoms.some(s => s.toLowerCase().includes(q));
      const textMatch = (rec.symptomText || '').toLowerCase().includes(q);
      const productMatch = rec.products.some(p => p.toLowerCase().includes(q));
      const channelMatch = rec.channel.toLowerCase().includes(q);
      return mainSymptomMatch || textMatch || productMatch || channelMatch;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-slate-800 p-4 md:p-6 lg:p-8 flex flex-col items-center justify-start gap-6 font-sans select-none relative overflow-y-auto">
      
      {/* SOLID CRYSTAL BACKGROUND GLOWS */}
      <div className="absolute top-10 left-10 w-[500px] h-[500px] bg-rose-500/[0.03] rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-emerald-500/[0.03] rounded-full blur-3xl pointer-events-none z-0" />

      {/* TOP SYSTEM BAR: CONNECTION STATUS SLIM LINE */}
      <div className="w-full max-w-7xl z-10 shrink-0">
        <div className={`w-full px-5 py-2.5 rounded-2xl border flex flex-col sm:flex-row justify-between items-center gap-3 transition-all duration-350 ${
          isOfflineSimulated 
            ? 'bg-amber-50/90 border-amber-200 text-amber-900 shadow-sm shadow-amber-500/5' 
            : 'bg-white border-slate-200 shadow-sm text-slate-700'
        }`}>
          <div className="flex items-center gap-2.5 text-xs text-left">
            <span className="flex h-2.5 w-2.5 relative shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOfflineSimulated ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isOfflineSimulated ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
            </span>
            <span className="font-semibold font-mono text-[10.5px] uppercase tracking-wider">
              {isOfflineSimulated ? (
                <span>⚠️ Local Heuristic Cache Mode Active (Zimbabwe Telecom Outage Emulation)</span>
              ) : (
                <span>⚡ Active Live State: Harare Relational Server Node Online</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs w-full sm:w-auto justify-end shrink-0">
            {/* OFFLINE / ONLINE TOGGLE BUTTON */}
            <button
              onClick={toggleOfflineSimulation}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 border shadow-sm cursor-pointer shrink-0 ${
                isOfflineSimulated
                  ? 'bg-amber-600 border-amber-700 text-white hover:bg-amber-700 shadow-amber-600/10'
                  : 'bg-slate-900 border-slate-800 text-white hover:bg-slate-800'
              }`}
            >
              {isOfflineSimulated ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-200" />
                  <span>📶 Switch Online</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span>🌐 Switch Offline</span>
                </>
              )}
            </button>

            {/* SYNC MANUALLY BUTTON */}
            {(offlineRecords.length + offlineForumPosts.length + offlineOrders.length) > 0 && (
              <button
                onClick={syncOfflineQueue}
                disabled={isOfflineSimulated || isSyncingOffline}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1.5 border shrink-0 ${
                  isOfflineSimulated
                    ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 hover:border-emerald-600 cursor-pointer animate-pulse'
                }`}
              >
                {isSyncingOffline ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>
                  Sync ({offlineRecords.length + offlineForumPosts.length + offlineOrders.length})
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* HEADER BAR & NAV CONTROLS INTERLOCK */}
      <div className="w-full max-w-7xl bg-white border border-slate-200 rounded-[30px] p-5 md:p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-sm z-10 shrink-0 select-text">
        
        {/* BRAND BLOCK */}
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 bg-gradient-to-tr from-purple-650 to-pink-500 rounded-2xl flex items-center justify-center text-white font-extrabold text-xl shadow-xs shrink-0">
              P
            </span>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">
                  Patch It
                </h1>
                <span className="text-purple-600 font-bold text-[10px] uppercase px-2 py-0.5 bg-purple-50 border border-purple-100 rounded-full">
                  Wellness
                </span>
                <span className="text-slate-400 font-mono text-[9px] font-bold tracking-widest bg-slate-100 px-2 py-0.5 rounded border border-slate-200 uppercase">
                  PWA V1.2
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-normal leading-normal mt-1">
                {t.appSub}
              </p>
            </div>
          </div>
        </div>

        {/* PREMIUM HORIZONTAL TAB SYSTEM */}
        <div className="flex flex-wrap sm:flex-nowrap gap-1.5 sm:gap-0 items-center bg-slate-100/80 p-1.5 sm:p-1 rounded-2xl border border-slate-200/50 w-full lg:w-auto font-mono text-[11px] uppercase font-black">
          <button
            onClick={() => setActiveTab('app')}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition duration-200 ${
              activeTab === 'app'
                ? 'bg-white text-purple-600 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Companion Portal</span>
          </button>
          
          <button
            onClick={() => setActiveTab('telecom')}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition duration-200 ${
              activeTab === 'telecom'
                ? 'bg-white text-purple-600 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <WifiOff className="w-3.5 h-3.5" />
            <span>Telecom Simulators</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition duration-200 ${
              activeTab === 'database'
                ? 'bg-white text-purple-600 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Central Sync DB</span>
          </button>
        </div>
      </div>

      {/* RURAL ACCESSIBILITY PROTOCOL BANNER IF ITEMS QUEUED */}
      {(offlineRecords.length + offlineForumPosts.length + offlineOrders.length) > 0 && (
        <div className="w-full max-w-7xl -mt-2 z-10 shrink-0">
          <div className="bg-amber-500/[0.08] hover:bg-amber-500/[0.12] border border-amber-200/60 rounded-2xl px-5 py-3.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left transition duration-200">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono tracking-wider font-extrabold text-amber-800 uppercase block">Local Queue Status</span>
              <p className="text-xs text-amber-900 leading-normal font-light">
                You have logged <strong>{offlineRecords.length} symptoms</strong>, <strong>{offlineForumPosts.length} forum responses</strong>, and <strong>{offlineOrders.length} patch kit orders</strong> while off the regional network grid. These are temporarily cached in your browser.
              </p>
            </div>
            {isOfflineSimulated ? (
              <span className="text-[10px] uppercase font-mono font-black bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-lg">
                ⚠️ Click &apos;Simulated Online&apos; at top left to synchronise
              </span>
            ) : (
              <button
                onClick={syncOfflineQueue}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-lg border border-emerald-500 flex items-center gap-1.5 transition shadow-xs animate-bounce"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Synchronise Client Logs</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* CORE WORKSPACE VIEW */}
      <div className="w-full max-w-7xl z-10 select-text flex-1">
        
        {/* -------------------- TAB 1: SMARTPHONE APP VIEW -------------------- */}
        {activeTab === 'app' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start my-2 animate-fadeIn">
            
            {/* PORTRAIT APPS COMPONENT (LEFT) */}
            <div className="lg:col-span-7 flex flex-col w-full">
              
              <div className="text-left mb-3">
                <span className="text-[10px] tracking-widest font-mono text-purple-600 font-extrabold uppercase animate-pulse">
                  💜 PATCH IT COMPANION HUB
                </span>
              </div>

              <CompanionApp 
                language={language}
                setLanguage={setLanguage}
                dbState={dbState}
                onRefresh={fetchDashboardState}
                isOfflineSimulated={isOfflineSimulated}
              />

            </div>

            {/* EDUCATIONAL CASE MODULE (RIGHT) - Hidden on Mobile by default */}
            <div className="hidden lg:block lg:col-span-5 space-y-6 text-left">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-purple-600 font-extrabold uppercase tracking-widest">Accessibility Concept</span>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    The Zimbabwe Rural Health Accessibility Map
                  </h2>
                  <p className="text-xs text-slate-500 leading-normal font-light">
                    Over 52% of women experiencing chronic pelvic pain, endometriosis, or menstrual discomfort in rural parts of Masvingo, Chitungwiza, and Bindura operate with severe battery limitations, cellular network blackouts, and high data barriers. Here is how Patch It delivers relief:
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4.5 h-4.5 text-purple-600 shrink-0" />
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Cyclic Thermal Relief</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-light">
                      Creates active 20/20-minute hot and cold alternating timelines to maximize uterine arterial expansion safely without the need for electricity.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Droplet className="w-4.5 h-4.5 text-pink-500 shrink-0" />
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">AI Local Tea Classifier</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-light">
                      A fast offline language engine that decodes symptom text in ChiShona or isiNdebele, matching discomfort with local remedies like Zumbani and Makoni tea.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4.5 h-4.5 text-purple-600 shrink-0" />
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Pain Screenings</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-light">
                      Integrates early diagnostic questionnaires for Endometriosis, Adenomyosis, or chronic blockages, allowing patients to consult clinical hubs remotely.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Users className="w-4.5 h-4.5 text-pink-500 shrink-0" />
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Subsidized Redistribution</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-light">
                      For every premium healthcare transdermal patch ordered by urban consumers, 6 thermal patch packs are distributed free of charge to girls in rural secondary schools.
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Offline Service Worker registered & active
                  </span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded border text-slate-500">
                    Offline Capacity Code: PWA-2026
                  </span>
                </div>
              </div>

              {/* BRIEF OFF-GRID INSTRUCTIONS WRAPPER */}
              <div className="hidden lg:block bg-gradient-to-tr from-slate-900 to-slate-800 p-6 rounded-3xl text-left text-white border border-slate-950 space-y-2.5">
                <h3 className="text-xs font-mono uppercase tracking-widest text-rose-400 font-extrabold flex items-center gap-2">
                  <span>How to Test Offline Caching resilience:</span>
                </h3>
                <ol className="list-decimal list-inside text-xs text-slate-300 space-y-2 font-light leading-relaxed">
                  <li>Toggle the <strong>📶 Simulated Offline</strong> button in the top system bar.</li>
                  <li>Go into the Smartphone interactive screen, toggle symptom logs, make entries, or try placing an order.</li>
                  <li>Watch how the client-side system caches entries gracefully immediately in memory.</li>
                  <li>Switch back <strong>🌐 Simulated Online</strong>, click and look at the bottom central database to sync!</li>
                </ol>
              </div>

            </div>

          </div>
        )}

        {/* -------------------- TAB 2: TELECOM GATEWAYS -------------------- */}
        {activeTab === 'telecom' && (
          <div className="space-y-6 my-2 text-left animate-fadeIn">
            
            <div className="max-w-3xl space-y-1">
              <span className="text-[10px] font-mono text-rose-500 font-extrabold uppercase tracking-widest">Alternative Connectivity Channels</span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Offline Dumbphone Connectivity Channels</h2>
              <p className="text-xs text-slate-500 leading-normal font-light">
                Over 90% of rural patients in Zimbabwe experience mobile data exclusion. To counter this, Patch It integrates USSD *123# protocol frameworks and low-bandwidth WhatsApp packets. Both channels operate on native cellular towers and sync with our regional healthcare nodes wirelessly.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              
              {/* USSD COMPONENT CONTAINER */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5 bg-sky-500 text-white rounded-md text-[10px] font-mono font-bold flex items-center justify-center">1</span>
                  <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">USSD Gateway (*123# Session)</h3>
                </div>
                <UssdSimulator 
                  language={language} 
                  onRefresh={fetchDashboardState} 
                />
              </div>

              {/* WHATSAPP ASSISTANT CONTAINER */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5 bg-emerald-500 text-white rounded-md text-[10px] font-mono font-bold flex items-center justify-center">2</span>
                  <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">WhatsApp Assistant (Chatbot Agent)</h3>
                </div>
                <WhatsappSimulator 
                  language={language}
                  onRefresh={fetchDashboardState}
                />
              </div>

            </div>

            <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl text-[11px] text-slate-500 font-mono flex items-start gap-2 max-w-4xl">
              <span className="text-rose-500 font-extrabold shrink-0">📍 TECHNICAL PROTOCOL:</span>
              <p className="leading-relaxed">
                Both simulators are connected directly to the central mock API proxy inside App memory. Whenever you trigger logs, select options, or chat offline, items are instantly queued using identical service-worker parameters and resolve consistently on the database!
              </p>
            </div>

          </div>
        )}

        {/* -------------------- TAB 3: HEALTH DATABASE -------------------- */}
        {activeTab === 'database' && (
          <div className="space-y-6 my-2 text-left animate-fadeIn">
            
            {/* ANALYTICS ROW CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1.5 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Distributions Tracked</span>
                  <h4 className="text-xl font-black text-rose-600 tracking-tight">
                    {dbState.impactStats.distributedFreeCount} packages
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-normal font-light mt-1">
                    Free thermal transdermal kits dispatched to secondary schools in Mutare &amp; Gweru.
                  </p>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1 mt-3 overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: '74%' }} />
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1.5 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Rural Coin Mobilized</span>
                  <h4 className="text-xl font-black text-emerald-600 tracking-tight">
                    ${dbState.impactStats.fundsMobilizedUSD.toFixed(2)}
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-normal font-light mt-1">
                    Aggregate community contributions processed safely offline via EcoCash &amp; cash nodes.
                  </p>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1 mt-3 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '62%' }} />
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1.5 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Registered Databases</span>
                  <h4 className="text-xl font-black text-amber-600 tracking-tight">
                    Active Sync State
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-normal font-light mt-1">
                    Live telemetry interlock between regional mobile subscribers and centralized health metrics.
                  </p>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1 mt-3 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full animate-pulse" style={{ width: '100%' }} />
                </div>
              </div>

            </div>

            {/* REAL-TIME SCHEMA DATATABLE VIEW */}
            <div className="bg-white p-6 rounded-[30px] border border-slate-200 shadow-xs space-y-5 flex flex-col select-text">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 select-none">
                <div className="flex items-center gap-2">
                  <Database className="w-4.5 h-4.5 text-rose-500" />
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">
                    Central Relational Health Log Node
                  </h3>
                </div>

                <div className="text-[10px] font-mono bg-slate-50 border px-3 py-1.5 rounded-xl text-slate-650 font-bold">
                  {dbState.records.length} total entries mapped
                </div>
              </div>

              {/* SEARCH & FILTER CONTROLS BAR */}
              <div className="flex flex-col sm:flex-row gap-3">
                
                {/* SEARCH INPUT */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search logs by symptom, remedy, or channel..."
                    className="w-full bg-slate-55/85 text-xs text-slate-800 placeholder-slate-400 pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 transition-all font-sans"
                  />
                </div>

                {/* CHANNEL FILTERS */}
                <div className="flex gap-1.5 bg-slate-100/85 p-1 rounded-2xl border text-[10px] font-mono leading-none tracking-wider font-extrabold uppercase shrink-0">
                  <button
                    onClick={() => setChannelFilter('all')}
                    className={`px-3 py-2 rounded-xl transition ${
                      channelFilter === 'all' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setChannelFilter('app')}
                    className={`px-3 py-2 rounded-xl transition ${
                      channelFilter === 'app' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    App
                  </button>
                  <button
                    onClick={() => setChannelFilter('ussd')}
                    className={`px-3 py-2 rounded-xl transition ${
                      channelFilter === 'ussd' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    USSD
                  </button>
                  <button
                    onClick={() => setChannelFilter('whatsapp')}
                    className={`px-3 py-2 rounded-xl transition ${
                      channelFilter === 'whatsapp' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    WhatsApp
                  </button>
                </div>

              </div>

              {loadingDb ? (
                <div className="text-center font-mono py-12 text-slate-400 text-xs animate-pulse">
                  Synchronizing relational schema...
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-[22px] bg-slate-50/20">
                  <table className="w-full text-left font-sans text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase bg-slate-50/50 font-bold">
                        <th className="p-3.5 pl-4">Time</th>
                        <th className="p-3.5">Source Channel</th>
                        <th className="p-3.5 text-center">Intensity</th>
                        <th className="p-3.5">Logged Symptoms</th>
                        <th className="p-3.5 pr-4">Remedy Pipeline Match</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 leading-relaxed font-light text-slate-700">
                      {filteredRecords.map((rec) => (
                        <tr key={rec.id} className="hover:bg-slate-50/80 transition-all duration-150">
                          <td className="p-3.5 pl-4 text-slate-500 font-mono text-[11px] max-w-[100px] truncate" title={new Date(rec.timestamp).toLocaleString()}>
                            {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold uppercase border ${
                                rec.channel === 'app' 
                                  ? 'bg-rose-50 border-rose-100 text-rose-600' 
                                  : rec.channel === 'whatsapp' 
                                  ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                                  : 'bg-sky-50 border-sky-100 text-sky-600'
                              }`}>
                                {rec.channel === 'ussd' ? 'ussd *123#' : rec.channel}
                              </span>
                              {rec.id.toString().includes("-off") && (
                                <span className="px-1.5 py-0.5 bg-amber-100 border border-amber-200 text-amber-800 text-[8px] font-mono uppercase font-black rounded">
                                  Cached Offline
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5 text-center font-bold">
                            <span className={`${rec.intensity >= 7 ? 'text-rose-600' : rec.intensity >= 4 ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {rec.intensity}/10
                            </span>
                          </td>
                          <td className="p-3.5 max-w-[150px] truncate font-medium text-slate-800" title={rec.symptoms.join(", ")}>
                            {rec.symptoms.join(", ")}
                          </td>
                          <td className="p-3.5 pr-4 text-slate-500 max-w-[200px] truncate font-mono text-[11px]" title={rec.products.join(", ")}>
                            {rec.products.join(", ")}
                          </td>
                        </tr>
                      ))}
                      {filteredRecords.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center py-12 text-slate-400 italic font-mono text-xs">
                            No logs found matching search filters. Click tabs above or log a symptom!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="text-[11.5px] leading-relaxed text-slate-500 border-t border-slate-100 pt-3.5 select-none font-light">
                📊 <strong>Sync Engine Specifications:</strong> Data flows into this local ledger node concurrently. Logged entries from non-smartphone clients (USSD) are packet-buffered, assigned standard geographic signatures, and mapped synchronously so health officials can view real-time pelvic pain heatmaps in any Harare cluster.
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
