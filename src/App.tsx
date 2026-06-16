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
  Clock
} from "lucide-react";
import CompanionApp from "./components/CompanionApp";
import UssdSimulator from "./components/UssdSimulator";
import WhatsappSimulator from "./components/WhatsappSimulator";
import { Language, PainRecord, PatchReminder } from "./types";
import { LOCAL_TRANSLATIONS } from "./data";

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
      const resp = await fetch("/api/dashboard");
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
        await fetch("/api/records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rec)
        });
      }

      // 2. Sync Forum Posts
      for (const fp of offlineForumPosts) {
        await fetch("/api/forum", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: fp.text, category: fp.category })
        });
      }

      // 3. Sync E-commerce Orders
      for (const order of offlineOrders) {
        await fetch("/api/purchase", {
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
    const originalFetch = window.fetch;

    if (isOfflineSimulated) {
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
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
        window.fetch = originalFetch;
      };
    }
  }, [isOfflineSimulated, offlineRecords, offlineForumPosts, offlineOrders, dbState, ussdMenuPath, ussdLanguage, ussdTempPain, waMessages]);

  const toggleOfflineSimulation = () => {
    setIsOfflineSimulated(prev => !prev);
    // Automatically trigger a refresh to swap context states
    setTimeout(() => {
      fetchDashboardState();
    }, 100);
  };


  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 md:p-8 flex flex-col items-center justify-start gap-8 font-sans select-none relative overflow-y-auto">
      
      {/* BACKGROUND EFFECTS */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none z-0" />

      {/* HEADER BAR - NAVIGATION DESIGN */}
      <div className="w-full max-w-6xl bg-white border border-slate-200 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm z-10 shrink-0 select-text">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm">
              P
            </span>
            <div className="space-y-0.5">
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                <span>Patch It</span>
                <span className="text-rose-500 font-medium text-xs ml-1 px-2.5 py-0.5 bg-rose-50 border border-rose-100 rounded-full">
                  Wellness
                </span>
                <span className="text-slate-400 font-mono text-[9px] font-bold tracking-widest bg-slate-100 px-2 py-0.5 rounded border border-slate-200 uppercase">
                  SIMULATOR DECK
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-normal leading-relaxed">
                {t.appSub}
              </p>
            </div>
          </div>
        </div>

        {/* TOP LEVEL AGGREGATE IMPACT BAR */}
        <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 w-full md:w-auto">
          <div className="flex items-center gap-2.5 px-3 border-r border-slate-200 py-1">
            <Users className="w-4 h-4 text-rose-500" />
            <div>
              <span className="text-[9px] font-mono text-slate-400 block uppercase font-bold">RURAL PATHWAYS DISTRIBUTION</span>
              <span className="text-xs font-mono font-black text-rose-600">{dbState.impactStats.distributedFreeCount} packages</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3 border-r border-slate-200 py-1">
            <Database className="w-4 h-4 text-emerald-500" />
            <div>
              <span className="text-[9px] font-mono text-slate-400 block uppercase font-bold">CHANNELS INTEGRATED</span>
              <span className="text-xs font-mono font-black text-emerald-600">Active Live State</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-1">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <div>
              <span className="text-[9px] font-mono text-slate-400 block uppercase font-bold">ECOCASH COIN MOBILIZED</span>
              <span className="text-xs font-mono font-black text-amber-600">${dbState.impactStats.fundsMobilizedUSD.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* OFFLINE CACHING GATEWAY & SYNC CONTROL CENTER */}
      <div className={`w-full max-w-6xl p-5 md:p-6 rounded-3xl border transition-all duration-300 z-10 shrink-0 ${
        isOfflineSimulated 
          ? 'bg-amber-50/70 border-amber-250 shadow-sm shadow-amber-500/5' 
          : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1 md:max-w-2xl text-left select-text">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
              <span>🌐 PWA Offline-First Sync Gateway</span>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            </h3>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Zimbabwe Rural Telecom Resilience Protocol
            </h2>
            <p className="text-xs text-slate-500 leading-normal font-light">
              This system intercepts connection losses seamlessly. When <strong>Simulate Offline Mode</strong> is active, all mobile interactions, state machines (USSD *123#), and WhatsApp medical queries cache instantly to local state (PWA Service Worker + LocalStorage). Once signal strength is restored, queued logs are flushed safely to the relational cloud node.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0 font-mono">
            {/* OFFLINE / ONLINE TOGGLER */}
            <button
              onClick={toggleOfflineSimulation}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase transition-all duration-200 flex items-center gap-2 border shadow-sm ${
                isOfflineSimulated
                  ? 'bg-amber-600 border-amber-755 text-white hover:bg-amber-700 shadow-amber-600/10'
                  : 'bg-slate-900 border-slate-800 text-white hover:bg-slate-800'
              }`}
            >
              {isOfflineSimulated ? (
                <>
                  <WifiOff className="w-4 h-4 text-amber-200" />
                  <span>📶 Simulated Offline</span>
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4 text-emerald-400" />
                  <span>🌐 Simulated Online</span>
                </>
              )}
            </button>

            {/* SYNC ACTIONS BUTTON */}
            {(offlineRecords.length + offlineForumPosts.length + offlineOrders.length) > 0 && (
              <button
                onClick={syncOfflineQueue}
                disabled={isOfflineSimulated || isSyncingOffline}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase transition flex items-center gap-2 border ${
                  isOfflineSimulated
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 hover:border-emerald-600 cursor-pointer animate-pulse'
                }`}
              >
                {isSyncingOffline ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>
                  Sync Cache ({offlineRecords.length + offlineForumPosts.length + offlineOrders.length} items)
                </span>
              </button>
            )}
          </div>
        </div>

        {/* STATUS BAR DRAWER WHEN OFFLINE ITEMS EXIST */}
        {(offlineRecords.length + offlineForumPosts.length + offlineOrders.length) > 0 && (
          <div className="mt-4 border-t border-slate-200/50 pt-3.5 flex flex-wrap items-center justify-between gap-3 text-left">
            <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono select-text text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                Symptom Logs: <strong>{offlineRecords.length} queued</strong>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                Forum Posts: <strong>{offlineForumPosts.length} queued</strong>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                Ecomm Orders: <strong>{offlineOrders.length} queued</strong>
              </span>
            </div>
            
            {isOfflineSimulated && (
              <span className="text-[10px] uppercase tracking-wide font-bold bg-amber-100 hover:bg-amber-200 text-amber-800 px-2.5 py-0.5 rounded border border-amber-200 transition">
                ⚠️ Toggle ONLINE to enable manual cloud synchronization
              </span>
            )}
          </div>
        )}
      </div>

      {/* MAIN SCREEN WORKSPACE GRID */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start justify-center z-10 select-text">

        {/* COLUMN 1: SMARTPHONE APP VIEW (Columns 5/12) */}
        <div className="lg:col-span-5 flex justify-center w-full">
          <div className="w-full max-w-md">
            <div className="text-center mb-3">
              <span className="text-[10px] uppercase tracking-widest font-mono text-rose-600 font-black">
                📱 PART A: SMARTPHONE PORTAL
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
        </div>

        {/* COLUMN 2: OFFLINE TELECOM TELECOM EMULATION GATEWAYS & DATABASE INSPECTOR (Columns 7/12) */}
        <div className="lg:col-span-7 flex flex-col gap-6 w-full">
          
          <div className="text-center lg:text-left">
            <span className="text-[10px] uppercase tracking-widest font-mono text-rose-600 font-black block">
              📶 PART B: TELECOM SIMULATION GATEWAYS
            </span>
          </div>

          {/* TELECOM CHANNELS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <UssdSimulator 
              language={language} 
              onRefresh={fetchDashboardState} 
            />

            <WhatsappSimulator 
              language={language}
              onRefresh={fetchDashboardState}
            />
          </div>

          {/* REAL-TIME RELATIONAL SCHEMA VIEW */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col gap-4 shadow-sm text-slate-800">
            <div className="flex justify-between items-center select-none">
              <div className="flex items-center gap-2">
                <Database className="w-4.5 h-4.5 text-rose-500" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                  {t.unifiedDbTitle}
                </h3>
              </div>
              <span className="text-[10px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-mono text-slate-650">
                {dbState.records.length} logs synced
              </span>
            </div>

            {loadingDb ? (
              <div className="text-center font-mono py-8 text-slate-400 text-xs">
                Synchronizing relational schema...
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-slate-50/50">
                <table className="w-full text-left font-sans text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase bg-slate-50 font-semibold">
                      <th className="p-3">Time</th>
                      <th className="p-3">Source Channel</th>
                      <th className="p-3 text-center">Intensity</th>
                      <th className="p-3">Logged Symptoms</th>
                      <th className="p-3">Remedy Pipeline</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 leading-relaxed font-light text-slate-700">
                    {dbState.records.map((rec, i) => (
                      <tr key={rec.id} className="hover:bg-slate-50/80 transition-all duration-150">
                        <td className="p-3 text-slate-500 font-mono text-[11px] max-w-[100px] truncate" title={new Date(rec.timestamp).toLocaleString()}>
                          {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold uppercase ${rec.channel === 'app' ? 'bg-rose-50 border border-rose-100 text-rose-600' : rec.channel === 'whatsapp' ? 'bg-emerald-5 border border-emerald-100 text-emerald-600' : 'bg-sky-50 border border-sky-100 text-sky-600'}`}>
                              {rec.channel}
                            </span>
                            {rec.id.toString().includes("-off") && (
                              <span className="px-1.5 py-0.5 bg-amber-100 border border-amber-200 text-amber-800 text-[8px] font-mono uppercase font-bold rounded">
                                Queue
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center font-bold">
                          <span className={`${rec.intensity >= 7 ? 'text-rose-600' : rec.intensity >= 4 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {rec.intensity}/10
                          </span>
                        </td>
                        <td className="p-3 max-w-[150px] truncate font-medium text-slate-800" title={rec.symptoms.join(", ")}>
                          {rec.symptoms.join(", ")}
                        </td>
                        <td className="p-3 text-slate-500 max-w-[160px] truncate font-mono text-[11px]" title={rec.products.join(", ")}>
                          {rec.products.join(", ")}
                        </td>
                      </tr>
                    ))}
                    {dbState.records.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-slate-400 italic font-mono text-xs">
                          No logged entries tracked. Submit symptoms or dial USSD to populate.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="text-[11px] leading-relaxed text-slate-550 border-t border-slate-100 pt-3 select-none">
              📍 <strong>Zimbabwe Hybrid-Sync Protocol Engine:</strong> All entries logged via offline dumbphones (USSD *123#) or WhatsApp packets undergo local state compaction and resolve on this active relational repository concurrently, providing immediate health statistics for macro enterprise planning.
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
