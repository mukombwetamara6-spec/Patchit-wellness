import { useState, useEffect, useRef, FormEvent } from "react";
import { 
  Heart, 
  Activity, 
  Sparkles, 
  Calendar, 
  Droplet, 
  HelpCircle, 
  Clock, 
  Volume2, 
  Download, 
  CheckCircle, 
  ShoppingBag, 
  Users, 
  User, 
  Bookmark, 
  Flame, 
  Moon, 
  Smile, 
  VolumeX, 
  CreditCard,
  Grid,
  Bell,
  Play,
  X,
  Plus,
  CheckSquare,
  Square,
  Award,
  BookOpen,
  Info,
  MapPin,
  WifiOff
} from "lucide-react";
import { Language, LifeStage, PainRecord, StoreProduct, PodcastEpisode, PatchReminder } from "../types";
import { LOCAL_TRANSLATIONS } from "../data";

interface CompanionAppProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  dbState: {
    records: PainRecord[];
    impactStats: { subscriberCount: number; distributedFreeCount: number; fundsMobilizedUSD: number };
    orders: any[];
    reminders: PatchReminder[];
    forumPosts: any[];
  };
  onRefresh: () => void;
  isOfflineSimulated?: boolean;
}

export default function CompanionApp({ language, setLanguage, dbState, onRefresh, isOfflineSimulated = false }: CompanionAppProps) {
  const t = LOCAL_TRANSLATIONS[language];

  // Primary Interactive States
  const [lifeStage, setLifeStage] = useState<LifeStage>('cycle');
  const [showOnboarding, setShowOnboarding] = useState<boolean>(true);
  
  // Timer for Thermal Belt (20 minutes)
  const [timerSeconds, setTimerSeconds] = useState<number>(1200); // 20:00 minutes
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [timerIntervalAlert, setTimerIntervalAlert] = useState<boolean>(false);

  // Symptom Logger States
  const [painLevel, setPainLevel] = useState<number>(5);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [symptomNotes, setSymptomNotes] = useState<string>("");
  const [absenteeism, setAbsenteeism] = useState<boolean>(false);
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [aiReport, setAiReport] = useState<any | null>(null);

  // Balance Mode state
  const [hotFlashAlert, setHotFlashAlert] = useState<boolean>(false);
  const [sleepScore, setSleepScore] = useState<string>("ok");

  // Podcast state
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadedMap, setDownloadedMap] = useState<Record<string, boolean>>({
    "ep-1": false,
    "ep-2": false,
    "ep-3": false,
    "ep-4": false,
    "ep-5": false
  });
  const [activePlayId, setActivePlayId] = useState<string | null>(null);
  const [discreetMode, setDiscreetMode] = useState<boolean>(true);

  // New Educational Learn Hub state
  const [eduTab, setEduTab] = useState<'cycle' | 'menopause' | 'factors'>('cycle');

  // Personalized Goals Interface and State
  interface PersonalGoal {
    id: string;
    text: Record<Language, string>;
    checked: boolean;
    category: LifeStage;
    isCustom?: boolean;
  }

  const [personalGoals, setPersonalGoals] = useState<PersonalGoal[]>([
    // Cycle Mode Goals
    { id: "cg-1", text: { en: "Drink warm anti-cramps Zumbani tea twice daily", sn: "Inwa tiye yeZumbani panguva yeKutevera kaviri", nd: "Inwa itiye yeZumbani kabili ngosuku" }, checked: false, category: "cycle" },
    { id: "cg-2", text: { en: "Apply fresh transdermal pain patch before school/work", sn: "Namira chigamba chePatch It usati waenda kuchikoro/basa", nd: "Namathisela isichibi se-Patch It ungakahambi" }, checked: false, category: "cycle" },
    { id: "cg-3", text: { en: "Walk 15 minutes of low-impact stretching steps", sn: "Famba kwemaminetsi 15 ekutambanudza mhasuru", nd: "Hamba imizuzu eyi-15 uvuse amandla" }, checked: false, category: "cycle" },
    
    // Recovery Mode Goals
    { id: "cg-4", text: { en: "Perform 2-minute Diaphragmatic pelvic breathing series", sn: "Ita maekisesaizi ekufema pashure pekubereka", nd: "Yenza amaekisesaizi embelekweni ngemizuzu emibili" }, checked: false, category: "recovery" },
    { id: "cg-5", text: { en: "Wrap supportive warming belt for safe 20-min session", sn: "Shandisa bhandi rekudziisa zvakadzvinyirira kwemaminetsi 20", nd: "Sebenzisa ibhanti elifudumalayo ngemizuzu eyi-20" }, checked: false, category: "recovery" },
    { id: "cg-6", text: { en: "Sip comforting Makoni resurrection tea to support core recovery", sn: "Inwa tiye inopisa yeMakoni inosimbisa chiuno", nd: "Inwa itiye yeMakoni eshisayo kusiza ukuphola kwesizalo" }, checked: false, category: "recovery" },
    
    // Balance Mode Goals
    { id: "cg-7", text: { en: "Place cooling-gel therapy inserts in the support belt", sn: "Shandisa bhandi rine gando kudzivirira kupisa muviri (Hot Flash)", nd: "Faka izichibi ezizolisayo e-cooling kumzimba nxa utshisa" }, checked: false, category: "balance" },
    { id: "cg-8", text: { en: "Sip cold-brewed Makoni tea to level sweat responses", sn: "Inwa tiye yeMakoni inotonhorera kudzikisira kupisa muviri husiku", nd: "Inwa itiye yeMakoni ebandayo nxa wezwa ukutshisa ebusuku" }, checked: false, category: "balance" },
    { id: "cg-9", text: { en: "Anonymously log morning sleep quality and triggers", sn: "Nyora mutsa wekurarama kwehope nemunhu musingazivikanwi", nd: "Bhala phansi ngasese ukulala kwakho lomoya wakho" }, checked: false, category: "balance" },

    // Endo Mode Goals
    { id: "cg-10", text: { en: "Perform 20 mins of Dual-Zone Thermal Rotation (heat then cold)", sn: "Ita maminetsi makumi maviri eKushandura Kupisa neKutonhora paBhandi", nd: "Yenza imizuzu eyi-20 yesigaba sokushisa lokuqeda ubuhlungu ngeqolo" }, checked: false, category: "endo" },
    { id: "cg-11", text: { en: "Drink anti-inflammatory Zumbani & Tsangamidzi (Wild Ginger) herbal blend", sn: "Inwa tiye rine Zumbani neTsangamidzi kudzivirira kuzvimba", nd: "Inwa itiye yeZumbani le-Tsangamidzi ukubuyisela ukuzola emzimbeni" }, checked: false, category: "endo" },
    { id: "cg-12", text: { en: "Track deep non-menstrual pelvic pain or endo-belly bloating", sn: "Nyora kana paine kuzvimba kana marwadzo emuzvimbiri emubhedha", nd: "Bhala phansi ukudubuka kwesisu loba ubuhlungu bengemva kwemenses" }, checked: false, category: "endo" }
  ]);

  const [customGoalText, setCustomGoalText] = useState<string>("");

  // Endo Mode states
  const [endoSelectedSymptoms, setEndoSelectedSymptoms] = useState<string[]>([]);
  const [endoDualTimer, setEndoDualTimer] = useState<number>(1200); // 20 mins (1200 seconds)
  const [endoDualActive, setEndoDualActive] = useState<boolean>(false);
  const [endoDualPhase, setEndoDualPhase] = useState<'heat' | 'cold'>('heat');
  const [showDoctorReport, setShowDoctorReport] = useState<boolean>(false);

  // Goal Manipulation Handlers
  const toggleGoal = (id: string) => {
    setPersonalGoals(prev => prev.map(g => g.id === id ? { ...g, checked: !g.checked } : g));
  };

  const handleAddCustomGoal = (e: FormEvent) => {
    e.preventDefault();
    if (!customGoalText.trim()) return;
    const newG: PersonalGoal = {
      id: "cg-custom-" + Date.now(),
      text: {
        en: customGoalText,
        sn: `${customGoalText}`,
        nd: `${customGoalText}`
      },
      checked: false,
      category: lifeStage,
      isCustom: true
    };
    setPersonalGoals(prev => [...prev, newG]);
    setCustomGoalText("");
  };

  // E-commerce states
  const [selectedPayment, setSelectedPayment] = useState<string>("EcoCash");
  const [checkoutPhone, setCheckoutPhone] = useState<string>("077");
  const [purchaseLoading, setPurchaseLoading] = useState<boolean>(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState<boolean>(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // New Forum states
  const [forumInput, setForumInput] = useState<string>("");
  const [forumLoading, setForumLoading] = useState<boolean>(false);
  const [forumCategory, setForumCategory] = useState<string>("all");

  // Postpartum Exercise guides states
  const [activeExerciseIdx, setActiveExerciseIdx] = useState<number>(-1);
  const [exerciseTimer, setExerciseTimer] = useState<number>(120);
  const [exerciseRunning, setExerciseRunning] = useState<boolean>(false);
  const exerciseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Hot Flash trigger
  const [hotFlashTrigger, setHotFlashTrigger] = useState<string>("");
  const endoDualTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Reminder reset state
  const [resetReminderLoadingId, setResetReminderLoadingId] = useState<string | null>(null);

  // Mock static products
  const storeProducts: StoreProduct[] = [
    {
      id: "prod-1",
      name: "12-Hour Transdermal Pain Patches (Standard Refill)",
      priceUSD: 12.00,
      image: "🔄",
      description: {
        en: "Continuous slow-release topical pain management for intense cramping.",
        sn: "Zvigamba zvemaawa 12 zvinonamira zvinoburitsa mushonga zvishoma nezvishoma.",
        nd: "Izichibi eziletha umphumo omnandi wokuphelisa ubuhlungu emahorweni ayi-12."
      }
    },
    {
      id: "prod-2",
      name: "Premium Loose-Leaf Zumbani Tea Pack",
      priceUSD: 4.50,
      image: "🌿",
      description: {
        en: "Organic high-inflammation comforting medicinal tea grown locally.",
        sn: "Tiye yeZumbani kwayo inosimbisa mhasuru nemwoyo panguva yekuneta.",
        nd: "Itiye yeZumbani emvelo esiza kakhulu ekudambiseni ubuhlungu."
      }
    },
    {
      id: "prod-3",
      name: "Replacement Thermal Insert For Waist Belts",
      priceUSD: 8.00,
      image: "🎒",
      description: {
        en: "High-grade heat/cold retention package for localized core compression.",
        sn: "Chinhu chekuisa mukati mebhandi chekuchengeta madziya nemutonho.",
        nd: "Iseseli esigcina ukufudumala loba ukuqanda kwebhanti lokudambisa."
      }
    }
  ];

  // Static discrete audio clips
  const podcastEpisodes: PodcastEpisode[] = [
    {
      id: "ep-1",
      title: {
        en: "Guidance Track 1 - Standard Core Support",
        sn: "Nzira Yekutanga - Kudzivirisa Mukati",
        nd: "Isihloko soku-1 - Ukunakekela Omoya"
      },
      speaker: "Dr. Rufaro Moyo (OBGYN)",
      duration: "4:15",
      size: "1.2 MB",
      category: "Taboo & Myth Busting",
      description: {
        en: "Exploring scientific safety behind standard transdermal blockades without social stigma.",
        sn: "Kutsanangurwa kwesainzi yezvigamba pasina kunyara vamwe munharaunda yedu.",
        nd: "Ukuchasisiswa kwezichibi lobuhlungu besikhathi ngaphandle kokusolwa."
      },
      downloaded: false
    },
    {
      id: "ep-2",
      title: {
        en: "Guidance Track 2 - Thermal Muscular Recovery",
        sn: "Nzira Yechipiri - Kudziisa neMhasuru",
        nd: "Isihloko sesi-2 - Ukufudumala leMhasuru"
      },
      speaker: "Sister Chidza (Maternal Lead)",
      duration: "6:40",
      size: "1.9 MB",
      category: "Postpartum Support",
      description: {
        en: "How continuous heat paired with Makoni tea accelerates biological muscular tissue repair.",
        sn: "Mashandiro anoita madziya etiye yeMakoni mukuporesa mhasuru dzechiuno.",
        nd: "Indlela ukufudumala letiye leMakoni elisiza ngayo ukuphola kwesizalo."
      },
      downloaded: false
    },
    {
      id: "ep-3",
      title: {
        en: "Guidance Track 3 - Sleep Cycles and Herbal Infusions",
        sn: "Nzira Yechitatu - Hope neZumbani Tea",
        nd: "Isihloko sesi-3 - Ukulala leZumbani"
      },
      speaker: "Gogo MaKhumalo (Herbal Ethnobotanist)",
      duration: "5:10",
      size: "1.5 MB",
      category: "Menopause Balance",
      description: {
        en: "Traditional Zumbani leaf preparation methods mapped precisely onto modern pharmacology.",
        sn: "Maitiro ekubika tiye yeZumbani akanyatsobatana nesainzi yemazuva ano.",
        nd: "Indlela efaneleyo yokupheka iZumbani ihlanganiswe lezesayensi yalamuhla."
      },
      downloaded: false
    },
    {
      id: "ep-4",
      title: {
        en: "Guidance Track 4 - Menstrual Dignity & Public Health",
        sn: "Nzira Yechina - Kurwisa Kusara Kuchikoro",
        nd: "Isihloko sesi-4 - Ukubandakanyeka Kwezikolo"
      },
      speaker: "Dr. Thandiwe Sibanda (Public Health Advocate)",
      duration: "5:45",
      size: "1.7 MB",
      category: "Menstrual Dignity",
      description: {
        en: "Analyzing how localized transdermal patch access directly combats rural school absenteeism in Zimbabwe.",
        sn: "Maitiro anonyatso kubatsira vanasikana panyaya yekusara pamba nekusagadzikana kwemwedzi.",
        nd: "Uhlolo lokuthi ukutholakala kwezichibi kusiza njani ukunciphisa ukungahambi esikoleni."
      },
      downloaded: false
    },
    {
      id: "ep-5",
      title: {
        en: "Guidance Track 5 - Estrogen Swing & Thermoregulation",
        sn: "Nzira Yechishanu - Kuongorora Kushanduka kweMuviri",
        nd: "Isihloko sesi-5 - Ukuguquka kwe-Estrogen Lomzimba"
      },
      speaker: "Sister Tariro Chaminuka (Endocrine Lead)",
      duration: "7:10",
      size: "2.1 MB",
      category: "Hormonal Balance",
      description: {
        en: "Breaking down triggers for spontaneous hot flashes and how thermal cooling protects the autonomic nervous system.",
        sn: "Kutsanangurwa kwekupisa muviri husiku uye nemashandisirwo akachengeteka eizvi bhandi rekutonhodza.",
        nd: "Ukuchasisiswa kokutshisa komzimba ngokuzumayo lendlelo emvelo zokusiza isikhumba."
      },
      downloaded: false
    }
  ];

  // 1. THERMAL COUNTDOWN LOGIC
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            setTimerActive(false);
            setTimerIntervalAlert(true);
            if (timerRef.current) clearInterval(timerRef.current);
            return 1200; // Reset
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive]);

  // Exercise Countdown Timer Effect
  useEffect(() => {
    if (exerciseRunning && exerciseTimer > 0) {
      exerciseTimerRef.current = setTimeout(() => {
        setExerciseTimer(prev => prev - 1);
      }, 1000);
    } else if (exerciseTimer === 0) {
      setExerciseRunning(false);
    }
    return () => {
      if (exerciseTimerRef.current) clearTimeout(exerciseTimerRef.current);
    };
  }, [exerciseRunning, exerciseTimer]);

  // Endometriosis Dual-Zone Alternating Timer Effect
  useEffect(() => {
    if (endoDualActive && endoDualTimer > 0) {
      endoDualTimerRef.current = setTimeout(() => {
        setEndoDualTimer(prev => prev - 1);
      }, 1000);
    } else if (endoDualTimer === 0) {
      if (endoDualPhase === 'heat') {
        setEndoDualPhase('cold');
        setEndoDualTimer(1200); // Proceed to 20 minutes of local chilling
      } else {
        setEndoDualActive(false);
      }
    }
    return () => {
      if (endoDualTimerRef.current) clearTimeout(endoDualTimerRef.current);
    };
  }, [endoDualActive, endoDualTimer, endoDualPhase]);

  const toggleTimer = () => {
    setTimerActive(!timerActive);
    setTimerIntervalAlert(false);
  };

  const resetTimer = () => {
    setTimerActive(false);
    setTimerSeconds(1200);
    setTimerIntervalAlert(false);
  };

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Submit Anonymized Forum Post
  const submitForumPost = async (e: FormEvent) => {
    e.preventDefault();
    if (!forumInput.trim()) return;
    setForumLoading(true);

    try {
      const response = await fetch("/api/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: forumInput,
          category: lifeStage
        })
      });
      if (response.ok) {
        setForumInput("");
        onRefresh(); // Get refreshed forum posts from the server
      }
    } catch (err) {
      console.error("Failed to post on forum:", err);
    } finally {
      setForumLoading(false);
    }
  };

  // Reset standard reminder (e.g., they just replaced their patch or applied gel)
  const conductResetReminder = async (id: string) => {
    setResetReminderLoadingId(id);
    try {
      const response = await fetch("/api/reminders/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (response.ok) {
        onRefresh(); // Pull refreshed reminder info
      }
    } catch (err) {
      console.error("Failed to reset therapeutic reminder:", err);
    } finally {
      setResetReminderLoadingId(null);
    }
  };

  // 2. LIFE-STAGE ONBOARDING CHANCELLOR
  const selectOnboardingStage = (stage: LifeStage) => {
    setLifeStage(stage);
    setShowOnboarding(false);
    // Auto-select standard category symptoms based on mode to speed up interaction
    if (stage === 'cycle') {
      setSelectedSymptoms(["Cramps"]);
      setSelectedProducts(["Transdermal Patch", "Zumbani Tea"]);
    } else if (stage === 'recovery') {
      setSelectedSymptoms(["Backache"]);
      setSelectedProducts(["Heating Belt"]);
    } else {
      setSelectedSymptoms(["Hot Flash"]);
      setSelectedProducts(["Cooling Belt", "Makoni Tea"]);
    }
  };

  // 3. REMINDER TOGGLES WITH SERVER BROADCAST
  const toggleReminder = async (id: string, currentlyEnabled: boolean) => {
    try {
      const response = await fetch("/api/reminders/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, enabled: !currentlyEnabled })
      });
      if (response.ok) {
        onRefresh(); // Pull refreshed DB state
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 4. SUBMIT DYNAMIC SYMPTOM LOGGER (Pain-to-AI Pipeline)
  const submitSymptoms = async (e: FormEvent) => {
    e.preventDefault();
    setLoadingAi(true);
    setAiReport(null);

    // Call unified analysis pipeline endpoint
    try {
      const resp = await fetch("/api/analyze-symptoms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptomText: symptomNotes || `Pain logged: ${painLevel}/10, Symptoms: ${selectedSymptoms.join(",")}`,
          language,
          lifeStage
        })
      });

      if (resp.ok) {
        const aiOutput = await resp.json();
        setAiReport(aiOutput);

        // Feed the unified database using API Create
        await fetch("/api/records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            intensity: painLevel,
            symptomText: symptomNotes || `Logged scale ${painLevel}/10: ${selectedSymptoms.join(", ")}`,
            symptoms: aiOutput.symptoms || selectedSymptoms,
            products: aiOutput.recommendedProducts || selectedProducts,
            channel: "app",
            absenteeism,
            lifeStage
          })
        });

        onRefresh(); // Get new records in DB Explorer
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAi(false);
    }
  };

  // 5. RAPID COMPENSATORY MOTORS
  const triggerEmergencyHotFlash = async () => {
    setHotFlashAlert(true);
    // Instant post to backend
    try {
      await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intensity: 8,
          symptomText: "EMERGENCY HOT FLASH LOGGER CLICKED",
          symptoms: ["Hot Flash"],
          products: ["Cooling Belt"],
          channel: "app",
          absenteeism: false,
          lifeStage: "balance"
        })
      });
      onRefresh();
    } catch (e) {
      console.error(e);
    }

    setTimeout(() => {
      setHotFlashAlert(false);
    }, 6000);
  };

  // 6. OFF-LINE DOWNLOAD MANAGER SIMULATION
  const fakeDownload = (id: string) => {
    setDownloadingId(id);
    setTimeout(() => {
      setDownloadedMap(prev => ({ ...prev, [id]: true }));
      setDownloadingId(null);
    }, 2200);
  };

  // 7. COMPENSATORY MOBILE checkout (Subscribing with EcoCash / InnBucks)
  const conductEcomOrder = async (product: StoreProduct) => {
    setPurchaseLoading(true);
    setSelectedProductId(product.id);
    setCheckoutSuccess(false);

    try {
      const resp = await fetch("/api/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          productName: product.name,
          priceUSD: product.priceUSD,
          paymentMethod: selectedPayment,
          phoneNumber: checkoutPhone
        })
      });

      if (resp.ok) {
        setCheckoutSuccess(true);
        onRefresh(); // Pull refreshed macro-impact values instantly!
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPurchaseLoading(false);
    }
  };

  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
    );
  };

  const handleProductToggle = (product: string) => {
    setSelectedProducts(prev => 
      prev.includes(product) ? prev.filter(p => p !== product) : [...prev, product]
    );
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white border-[10px] border-slate-900 rounded-[3rem] overflow-hidden shadow-2xl relative flex flex-col h-[820px] text-slate-800 font-sans">
      
      {/* 1. SMARTPHONE NOTCH HEADER */}
      <div className="bg-white px-6 pt-6 pb-4 flex justify-between items-center border-b border-slate-100 z-30 shrink-0">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-tight text-xs text-rose-600">
          <Heart className="w-4.5 h-4.5 fill-current animate-pulse text-rose-500" />
          <span>{t.appTitle}</span>
        </div>
        <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg">
          <button 
            type="button"
            onClick={() => setLanguage('en')} 
            className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold transition ${language === 'en' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-950'}`}
          >
            EN
          </button>
          <button 
            type="button"
            onClick={() => setLanguage('sn')} 
            className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold transition ${language === 'sn' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-950'}`}
          >
            SN
          </button>
          <button 
            type="button"
            onClick={() => setLanguage('nd')} 
            className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold transition ${language === 'nd' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-950'}`}
          >
            ND
          </button>
        </div>
      </div>

      {isOfflineSimulated && (
        <div className="bg-amber-500 text-white px-4 py-1.5 text-center font-mono text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shrink-0 z-30 shadow-sm shadow-amber-500/20">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline Heuristic Cache Mode</span>
        </div>
      )}

      {/* 2. ONBOARDING OVERLAY */}
      {showOnboarding ? (
        <div className="absolute inset-0 bg-white/98 z-40 flex flex-col justify-between p-6 overflow-y-auto text-slate-800">
          <div className="my-auto space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-4 tag-sparkle shadow-sm">
              <Sparkles className="w-8 h-8 text-rose-500" />
            </div>
            
            <div className="text-center space-y-2">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">{t.welcomeTitle}</h1>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto font-normal">{t.welcomeDesc}</p>
            </div>

            <div className="space-y-3 pt-4">
              <p className="text-center text-[10px] uppercase font-mono tracking-widest text-rose-500 font-bold">
                {t.selectStage}
              </p>
              
              <button 
                onClick={() => selectOnboardingStage('cycle')}
                className="w-full bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 p-4 rounded-xl flex items-center gap-4 transition text-left"
              >
                <div className="p-3 bg-rose-100/10 border border-rose-200/20 rounded-lg text-rose-500">
                  <Droplet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{t.cycleMode}</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-normal">Menstrual health, period tracking, schools shield.</p>
                </div>
              </button>

              <button 
                onClick={() => selectOnboardingStage('recovery')}
                className="w-full bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 p-4 rounded-xl flex items-center gap-4 transition text-left"
              >
                <div className="p-3 bg-emerald-100/10 border border-emerald-200/20 rounded-lg text-emerald-600">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{t.recoveryMode}</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-normal">Postpartum weekly healing guides, maternal therapy.</p>
                </div>
              </button>

              <button 
                onClick={() => selectOnboardingStage('balance')}
                className="w-full bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 p-4 rounded-xl flex items-center gap-4 transition text-left"
              >
                <div className="p-3 bg-amber-100/10 border border-amber-200/20 rounded-lg text-amber-600">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{t.balanceMode}</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-normal">Menopause support, hot flash clicker, sleep metrics.</p>
                </div>
              </button>

              <button 
                onClick={() => selectOnboardingStage('endo')}
                className="w-full bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-200 p-4 rounded-xl flex items-center gap-4 transition text-left"
              >
                <div className="p-3 bg-purple-100/10 border border-purple-200/20 rounded-lg text-purple-600">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{t.endoMode}</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-normal">Chronic pelvic pain screening, clinic referrals, advanced thermal rotation guidance.</p>
                </div>
              </button>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 mt-4 font-mono font-medium">
            Secured Medical End-to-End Cryptographic Ledger | Harare, ZW
          </div>
        </div>
      ) : null}

      {/* 3. SCROLLABLE APP BODY */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 pb-24 bg-slate-50/50">
        
        {/* LIFE STAGE BANNER */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-150 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${
              lifeStage === 'cycle' ? 'bg-rose-50 text-rose-500' : 
              lifeStage === 'recovery' ? 'bg-emerald-50 text-emerald-600' : 
              lifeStage === 'balance' ? 'bg-amber-50 text-amber-600' : 
              'bg-purple-50 text-purple-600'
            }`}>
              {lifeStage === 'cycle' ? <Droplet className="w-5 h-5" /> : 
               lifeStage === 'recovery' ? <Activity className="w-5 h-5" /> : 
               lifeStage === 'balance' ? <Flame className="w-5 h-5" /> : 
               <Award className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-[9px] uppercase font-mono tracking-wider text-slate-400 font-bold">Active Life Stage Focus</p>
              <h2 className="text-xs font-bold text-slate-900">
                {lifeStage === 'cycle' ? t.cycleMode : 
                 lifeStage === 'recovery' ? t.recoveryMode : 
                 lifeStage === 'balance' ? t.balanceMode : 
                 t.endoMode}
              </h2>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setShowOnboarding(true)}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-[10px] text-rose-600 transition"
          >
            {t.changeStage}
          </button>
        </div>

        {/* ======================================================== */}
        {/* LIFECYCLE MODE DYNAMIC INTERFACES                         */}
        {/* ======================================================== */}
        
        {/* A. CYCLE MODE */}
        {lifeStage === 'cycle' && (
          <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-rose-600 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-50 pb-2">
              <Calendar className="w-4 h-4" />
              <span>{t.cycleModeTitle}</span>
            </h3>
            
            <div className="bg-rose-50/30 border border-rose-100 p-3 rounded-xl space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-900">{t.predictedCycle}</span>
                <span className="px-2 py-0.5 bg-rose-500 text-white text-[9px] rounded-full uppercase tracking-widest font-mono shadow-sm">
                  4 Days Out
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed font-normal">{t.predictedCycleDesc}</p>
            </div>

            <div className="text-[10px] text-slate-400 italic p-1 border-l-2 border-rose-300 bg-rose-50/10 rounded-r pl-2.5">
              {t.absenteeismDisclaimer}
            </div>
          </div>
        )}

        {/* B. RECOVERY MODE */}
        {lifeStage === 'recovery' && (
          <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-emerald-650 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-50 pb-2">
              <Activity className="w-4 h-4" />
              <span>{t.postpartumTitle}</span>
            </h3>
            
            {/* WEEK TIMELINE */}
            <div className="space-y-2">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5 animate-none">
                <span className="text-[9px] font-mono uppercase text-emerald-605 font-bold">{t.ppWeek} 1–2</span>
                <h4 className="text-xs font-bold text-slate-900">{t.ppW1Title}</h4>
                <p className="text-[10px] text-slate-500 leading-normal font-light">{t.ppW1Desc}</p>
              </div>

              <div className="p-2.5 bg-slate-50/50 border border-slate-200 rounded-xl opacity-80 space-y-0.5">
                <span className="text-[9px] font-mono uppercase text-slate-400 font-bold">{t.ppWeek} 3–5</span>
                <h4 className="text-xs font-bold text-slate-800">{t.ppW3Title}</h4>
                <p className="text-[10px] text-slate-500 leading-normal font-light">{t.ppW3Desc}</p>
              </div>

              <div className="p-2.5 bg-slate-50/30 border border-slate-200 rounded-xl opacity-60 space-y-0.5">
                <span className="text-[9px] font-mono uppercase text-slate-400 font-bold">{t.ppWeek} 6+</span>
                <h4 className="text-xs font-bold text-slate-700">{t.ppW6Title}</h4>
                <p className="text-[10px] text-slate-500 leading-normal font-light">{t.ppW6Desc}</p>
              </div>
            </div>

            {/* GENTLE POSTPARTUM MOVEMENT SUITE */}
            <div className="space-y-2.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-mono">
                {t.gentleMovement}
              </span>
              <div className="grid grid-cols-1 gap-2 text-left">
                {[
                  { name: "Diaphragmatic Breathing", desc: "Settle into support, engage deep pelvic floor on exhale.", duration: 120, benefit: "Soothes uterine contractions" },
                  { name: "Supine Pelvic Tilts", desc: "Excellent combining warm heat belt. Flattens lumbar arch.", duration: 120, benefit: "Bridges postural realignment" },
                  { name: "Transverse Core Hold", desc: "Contract lower belly, draw tummy button inward.", duration: 120, benefit: "Supports deep diastasis healing" }
                ].map((ex, idx) => (
                  <div key={ex.name} className="p-3 bg-emerald-50/40 border border-emerald-100 rounded-xl flex items-center justify-between gap-2.5 transition hover:bg-emerald-50 hover:shadow-xs">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-emerald-800 truncate">{ex.name}</span>
                        <span className="text-[8px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 font-bold uppercase rounded font-mono">2 min</span>
                      </div>
                      <p className="text-[9.5px] text-slate-500 leading-normal font-light truncate mt-0.5">{ex.desc}</p>
                      <span className="text-[8.5px] text-emerald-600 italic block mt-0.5 font-sans font-medium">Benefit: {ex.benefit}</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        setActiveExerciseIdx(idx);
                        setExerciseTimer(ex.duration);
                        setExerciseRunning(true);
                      }} 
                      className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full transition shadow-sm shrink-0 cursor-pointer flex items-center justify-center"
                    >
                      <Play className="w-3.5 h-3.5 fill-current text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* C. BALANCE MODE */}
        {lifeStage === 'balance' && (
          <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-amber-600 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-50 pb-2">
              <Flame className="w-4 h-4" />
              <span>{t.menopauseTitle}</span>
            </h3>

            {/* HOT FLASH EMERGENCY TRIGGER BUTTON */}
            <div className="space-y-3">
              <button 
                type="button"
                onClick={() => {
                  triggerEmergencyHotFlash();
                  setHotFlashTrigger(""); // Reset trigger state
                }}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-xl font-bold uppercase text-xs tracking-wider transition-all duration-300 flex items-center justify-center gap-2 border border-blue-600/10 active:scale-98 shadow-sm"
              >
                <Flame className="w-4.5 h-4.5 fill-current animate-bounce text-blue-200" />
                <span>{t.hotFlashBtn}</span>
              </button>
              
              {hotFlashAlert && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-2 animate-fade-in text-left">
                  <p className="text-[10px] text-blue-800 leading-relaxed font-light font-sans">
                    🚨 <strong>Hot Flash Logged!</strong> Please slip your <strong>Cooling Gel Therapy Inserts</strong> into the support belt immediately. Sip iced Makoni tea to cool core temperatures fast.
                  </p>
                  
                  <div className="space-y-1.5 border-t border-blue-200/50 pt-2">
                    <span className="text-[8.5px] uppercase font-bold text-slate-400 block tracking-wider font-mono">
                      Identify Trigger Factor:
                    </span>
                    <div className="flex gap-1.5 flex-wrap">
                      {["Spicy Foods", "Stressful Meeting", "Hot Drink", "Caffeine", "Warm Weather"].map((trig) => (
                        <button
                          key={trig}
                          type="button"
                          onClick={() => {
                            setHotFlashTrigger(trig);
                            // Submit a silent backache/flash record with the trigger!
                            fetch("/api/records", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                intensity: 8,
                                symptomText: `Hot Flash Triggered by: ${trig}`,
                                symptoms: ["Hot Flash"],
                                products: ["Cooling Belt"],
                                channel: "app",
                                absenteeism: false,
                                lifeStage: "balance"
                              })
                            }).then(() => onRefresh());
                          }}
                          className={`px-2 py-0.5 rounded text-[9px] font-semibold transition ${
                            hotFlashTrigger === trig 
                              ? 'bg-blue-500 text-white shadow-xs' 
                              : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {trig}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SLEEP AND MOOD TRACKER INPUT */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <span className="text-[10px] text-slate-700 font-bold block">{t.sleepInsights}</span>
              <p className="text-[9px] text-slate-500">{t.sleepLabel}</p>
              <div className="grid grid-cols-3 gap-1.5">
                {["bad", "ok", "good"].map(level => (
                  <button 
                    key={level}
                    type="button"
                    onClick={() => setSleepScore(level)}
                    className={`py-1.5 px-1 rounded-lg text-[10px] capitalize font-semibold transition ${sleepScore === level ? 'bg-amber-500 text-white font-bold shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'}`}
                  >
                    {level === 'bad' ? t.sleepBad : level === 'ok' ? t.sleepOk : t.sleepGood}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* D. ENDO MODE (CHRONIC PELVIC PAIN & ENDOMETRIOSIS SUPPORT) */}
        {lifeStage === 'endo' && (
          <div className="space-y-4 text-left animate-fade-in">
            {/* HERO DELAY BANNER */}
            <div className="bg-gradient-to-r from-purple-900 to-indigo-950 text-white p-4 rounded-3xl border border-purple-800 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-15">
                <Award className="w-24 h-24 text-white" />
              </div>
              <div className="relative z-10 space-y-2">
                <span className="bg-purple-500/20 text-purple-200 border border-purple-500/30 text-[8px] font-mono tracking-widest uppercase font-bold py-0.5 px-2 rounded-full">
                  🎗️ Endometriosis Validation Protocol
                </span>
                <h3 className="font-extrabold text-sm tracking-tight">
                  {language === 'sn' ? 'Kugadzirisa Dambudziko reEndometriosis' : language === 'nd' ? 'Ukulwa loMkhuhlane we-Endometriosis' : 'Bypassing the 7-10 Year Diagnosis Delay'}
                </h3>
                <p className="text-[10px] text-purple-200 leading-relaxed font-light">
                  {language === 'sn' 
                    ? "Kutora makore manomwe kusvika kune gumi (7-10) kuongororwa endometriosis inyaya hombe kwazvo. Marwadzo emusana nechiuno panguva yekuenda kumwedzi haasi marwadzo ekurerutswa (kurwadziwa panguva yekuenda kumwedzi). Ino nzvimbo inopa rubatsiro nekuunganidza data ririnyore."
                    : language === 'nd'
                    ? "Kuthatha iminyaka eyisikhombisa kusiya kwelitshumi ukuthola ukuthi ulomkhuhlane we-Endo. Ubuhlungu obuphezulu bungeke bube yinto yokudlalisa. Siza umzimba wakho khathesi."
                    : "Severe, persistent pelvic pain is too often dismissed as just a 'bad period.' Globally and in Zimbabwe, it charity takes a staggering 7 to 10 years to get a definitive diagnosis for endometriosis. Use this specialized mode to track cyclical vs acyclical symptoms, export medical diagnostic evidence, and access targeted relief."}
                </p>
              </div>
            </div>

            {/* SYMPTOM ZONE & SPECIFIC FLARE-UP MAPPING */}
            <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm space-y-4">
              <div className="border-b border-slate-50 pb-2">
                <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  <Activity className="w-4 h-4 text-purple-500" />
                  <span>Symptom Intensity & Zone Mapping</span>
                </h4>
                <p className="text-[9.5px] text-slate-500 font-light mt-0.5">Toggle your active severe pain hotspots to track nerve-radiation lines.</p>
              </div>

              {/* Specific Endo Symptoms Toggles */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "deep-pelvic", label: "Deep Pelvic Stabbing", labelSn: "Kuboorwa kweChibereko", labelNd: "Ubuhlungu embelekweni" },
                  { id: "thigh-radiate", label: "Sciatic Thigh Radiation", labelSn: "Marwadzo Mumapendekete", labelNd: "Ukutshekera kwemilenze" },
                  { id: "bowel-pain", label: "Painful Bowel Relief", labelSn: "Marwadzo pakuenda Kuchimbzi", labelNd: "Ubuhlungu nxa uzithuma" },
                  { id: "endo-belly", label: "Endo-Belly Bloating", labelSn: "Kuzvimba Kwenhumbu (Belly)", labelNd: "Ukusukuma kwesisu" },
                  { id: "chronic-fatigue", label: "Chronic Severe Fatigue", labelSn: "Kushaya Simba Kusingapere", labelNd: "Ukudinwa okungapheli" },
                  { id: "sacral-ache", label: "Sacral lower Spine Ache", labelSn: "Marwadzo eMusana neChivuno", labelNd: "Ubuhlungu beqolo phansi" }
                ].map(symp => {
                  const active = endoSelectedSymptoms.includes(symp.id);
                  return (
                    <button
                      key={symp.id}
                      type="button"
                      onClick={() => {
                        if (active) {
                          setEndoSelectedSymptoms(prev => prev.filter(s => s !== symp.id));
                        } else {
                          setEndoSelectedSymptoms(prev => [...prev, symp.id]);
                        }
                      }}
                      className={`p-2.5 rounded-xl text-left border transition-all duration-200 cursor-pointer ${
                        active 
                          ? 'bg-purple-50 border-purple-300 text-purple-800 font-medium scale-[1.01]' 
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-150 text-slate-650'
                      }`}
                    >
                      <div className="text-[10px] leading-tight font-sans">
                        {language === 'sn' ? symp.labelSn : language === 'nd' ? symp.labelNd : symp.label}
                      </div>
                      <span className="text-[7.5px] block font-mono font-medium tracking-wide mt-1 text-slate-400">
                        {active ? "● ACTIVE TRACKING" : "○ TAP TO LOG"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* CLINICAL PELVIC INTERACTIVE RADIATING ZONE SELECTOR */}
              <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-3 text-left">
                <span className="text-[9.5px] font-bold text-slate-605 block uppercase tracking-wider font-mono">
                  Interactive Pelvic Flare Projection Map
                </span>
                <p className="text-[9px] text-slate-500 font-light leading-normal">
                  Tap localized anatomical core pain sectors to highlight nerve inflammation projections inside our real-time clinic report:
                </p>

                <div className="grid grid-cols-2 gap-1.5 select-none text-left">
                  {[
                    { id: "left-ovary", label: "Left Adnexa (Left Ovary)", color: "purple" },
                    { id: "right-ovary", label: "Right Adnexa (Right Ovary)", color: "purple" },
                    { id: "culdesac", label: "Cul-de-sac (Pouch of Douglas)", color: "indigo" },
                    { id: "sacral-nerve", label: "Sacral Nerve Outflow (Sciatica)", color: "amber" }
                  ].map(zone => {
                    const active = endoSelectedSymptoms.includes(zone.id);
                    return (
                      <button
                        key={zone.id}
                        type="button"
                        onClick={() => {
                          if (active) {
                            setEndoSelectedSymptoms(prev => prev.filter(s => s !== zone.id));
                          } else {
                            setEndoSelectedSymptoms(prev => [...prev, zone.id]);
                          }
                        }}
                        className={`p-2 py-2.5 text-[9px] text-left font-bold rounded-xl border transition-all duration-300 cursor-pointer ${
                          active 
                            ? 'bg-purple-600 border-purple-500 text-white shadow-xs scale-102 font-bold' 
                            : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${active ? 'bg-white animate-ping' : 'bg-purple-400'}`} />
                          <span>{zone.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* DUAL-ZONE ALTERNATING THERMOS-ROTATION GUI */}
            <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm space-y-4">
              <div className="flex justify-between items-start border-b border-slate-50 pb-2">
                <div>
                  <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                    <Flame className="w-4 h-4 text-purple-600 animate-pulse" />
                    <span>Advanced Thermal Rotation Timer</span>
                  </h4>
                  <p className="text-[9.5px] text-slate-500 font-light mt-0.5">Alternate heat (to relax uterine spasms) and cold (to numb nerve pathway pain).</p>
                </div>
                <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest font-mono rounded ${
                  endoDualPhase === 'heat' ? 'bg-orange-50 border border-orange-100 text-orange-600' : 'bg-blue-50 border border-blue-100 text-blue-600'
                }`}>
                  {endoDualPhase === 'heat' ? '♨️ HEAT INFUSION' : '❄️ LOCAL COOLING'}
                </span>
              </div>

              {/* COUNTDOWN TIMER RING */}
              <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl flex flex-col justify-center items-center text-center space-y-3">
                <div className="space-y-1">
                  <span className="text-2xl font-mono font-black text-slate-800 tracking-wider">
                    {formatTime(endoDualTimer)}
                  </span>
                  <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-widest font-mono">
                    {endoDualPhase === 'heat' ? 'Phase 1: Deep Muscle relaxation (Heat)' : 'Phase 2: localized Nerve numbing (Cold Gel)'}
                  </p>
                </div>

                {/* Progress bar representing 20-minute (1200 seconds) depletion */}
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 rounded-full ${
                      endoDualPhase === 'heat' ? 'bg-orange-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${(endoDualTimer / 1200) * 100}%` }}
                  />
                </div>

                <div className="flex gap-2 w-full justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setEndoDualActive(!endoDualActive);
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-bold tracking-wider transition uppercase cursor-pointer text-white ${
                      endoDualActive ? 'bg-slate-700 hover:bg-slate-600' : 'bg-purple-650 hover:bg-purple-750 shadow-sm'
                    }`}
                  >
                    {endoDualActive ? "Pause Rotation" : "Start 20m Rotation"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEndoDualPhase(endoDualPhase === 'heat' ? 'cold' : 'heat');
                      setEndoDualTimer(1200);
                    }}
                    className="py-2 px-3 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-[10px] font-bold text-slate-705 transition cursor-pointer"
                  >
                    Swap Phase
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEndoDualActive(false);
                      setEndoDualTimer(1200);
                      setEndoDualPhase('heat');
                    }}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-[10px] text-rose-500 font-bold transition cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* CLINICAL SYMPTOM REPORT EXPORTER */}
            <div className="bg-purple-50/40 p-4 rounded-2xl border border-purple-150 shadow-xs space-y-3.5">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-purple-800 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  <BookOpen className="w-4 h-4 text-purple-750" />
                  <span>Evidence-Based Clinician Report</span>
                </h4>
                <span className="px-1.5 py-0.5 bg-purple-150/10 text-purple-700 text-[7px] font-mono font-bold uppercase rounded">
                  DIAGNOSTIC ACCELERATOR
                </span>
              </div>
              <p className="text-[10px] text-purple-900/90 leading-relaxed font-light">
                Generate and export an official synthesized core symptom dossier to present to your doctor or gynae clinic in Zimbabwe. Reclaiming diagnostic agency bypasses the 7-10 year clinical denial window.
              </p>

              <button
                type="button"
                onClick={() => setShowDoctorReport(!showDoctorReport)}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all duration-200 shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Award className="w-3.5 h-3.5" />
                <span>{showDoctorReport ? "Hide Clinical Report Dashboard" : "Generate Medical Symptom Report"}</span>
              </button>

              {showDoctorReport && (
                <div className="bg-white border border-purple-200 p-4 rounded-xl space-y-4 animate-fade-in shadow-inner text-left">
                  <div className="border-b-2 border-dashed border-slate-200 pb-3 text-center space-y-1 select-none">
                    <h5 className="font-extrabold text-xs text-slate-800 tracking-tight font-sans uppercase">PATCH IT ZIMBABWE - REPRODUCTIVE CLINICAL PROFILE</h5>
                    <p className="text-[8.5px] text-slate-400 font-mono">Patient Clinical Referral Guide | Generated on {new Date().toLocaleDateString('en-ZW')}</p>
                  </div>

                  <div className="space-y-2 text-[9.5px] text-slate-700">
                    <div>
                      <span className="font-bold text-slate-900 block uppercase font-mono text-[8.5px]">A. INDICATION SUMMARY:</span>
                      <p className="font-light mt-0.5 leading-normal">
                        User has actively logged chronic debilitating pelvic pain over multiple longitudinal check-in sessions. Standard over-the-counter anti-inflammatories report as sub-therapeutic. Highly indicative of severe dysmenorrhea secondary to pelvic endometriosis or adenomyosis.
                      </p>
                    </div>

                    <div>
                      <span className="font-bold text-slate-900 block uppercase font-mono text-[8.5px]">B. LOGGED ENDO SYMPTOM HOTSPOTS:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {endoSelectedSymptoms.length > 0 ? (
                          endoSelectedSymptoms.map(s => (
                            <span key={s} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded font-mono font-bold text-[8px] uppercase">
                              {s.replace("-", " ")}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">No localized symptoms selected yet. Toggle buttons above.</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="font-bold text-slate-900 block uppercase font-mono text-[8.5px]">C. RISK & ABSENTEEISM ANALYSIS:</span>
                      <p className="font-light mt-0.5 leading-normal text-rose-700 font-semibold">
                        User reports pain has previously forced school/work absenteeism. Meets prioritized diagnostic referral guidelines under localized Zimbabwe healthcare advisory.
                      </p>
                    </div>

                    <div>
                      <span className="font-bold text-slate-900 block uppercase font-mono text-[8.5px]">D. RECOMMENDED CLINICAL PATHWAY:</span>
                      <ul className="list-disc pl-3.5 space-y-1 font-light mt-0.5 leading-normal">
                        <li>Initiate high-resolution pelvic transvaginal ultrasound or pelvic MRI mapping.</li>
                        <li>Rule out deep infiltrating endometriosis (DIE) nodules in the pouch of Douglas.</li>
                        <li>Consider early diagnostic/therapeutic laparoscopy if non-responsive to localized transdermal patch remedies.</li>
                      </ul>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-[8px] font-mono text-slate-400">
                    <span>MD Referral Code: PI-ZW-ENDO-998</span>
                    <button 
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`PATCH IT ZIMBABWE - CLINICAL EVIDENCE DOSSIER\nDate: ${new Date().toLocaleDateString('en-ZW')}\nIndication: Severe pain unresponsive to NSAIDs.\nSymptom hotspots: ${endoSelectedSymptoms.join(", ") || "None specified"}`);
                        alert("Clinical report copied to clipboard. Share this text with your physician.");
                      }}
                      className="text-purple-600 font-bold hover:underline cursor-pointer"
                    >
                      COPY EVIDENCE TO CLIPBOARD
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* CLINICAL SPECIALIST DIRECTORY */}
            <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm space-y-3.5">
              <div className="border-b border-slate-50 pb-2 flex justify-between items-center select-none">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  <MapPin className="w-4 h-4 text-rose-500 animate-pulse" />
                  <span>Zimbabwe Specialists Care Directory</span>
                </h4>
                <span className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-600 text-[7px] font-mono font-bold uppercase rounded">
                  ZW REPRODUCTIVE HUB
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-light leading-relaxed">
                Connect with primary pelvic care centers and certified gynecological laparoscopists who specialize in managing complex endometriosis cases:
              </p>

              <div className="grid grid-cols-1 gap-2.5">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[10px] text-slate-800">Harare Gynecology & Pelvic Health Center</span>
                    <span className="text-[7.5px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-mono font-extrabold uppercase">Laparoscopy Specialist</span>
                  </div>
                  <p className="text-[9.5px] text-slate-500 font-light leading-normal">
                    Parirenyatwa General Hospital Referral & Spire Specialist Wing, Mazowe St, Harare.
                  </p>
                  <span className="text-[9px] font-semibold text-rose-600 block">📞 Contact Referral Line: +263 242 701 555</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[10px] text-slate-800">Bulawayo Central Pelvic Health Consults</span>
                    <span className="text-[7.5px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-mono font-extrabold uppercase">Endocrine Advisor</span>
                  </div>
                  <p className="text-[9.5px] text-slate-500 font-light leading-normal">
                    Mpilo General Hospital Gynaecology Dept & Bulawayo Medical Centre, Heany Ave, Bulawayo.
                  </p>
                  <span className="text-[9px] font-semibold text-rose-600 block">📞 Contact Referral Line: +263 292 230 460</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[10px] text-slate-800">Mutare & Gweru Provincial Referral Hubs</span>
                    <span className="text-[7.5px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-extrabold uppercase">Community Liaison</span>
                  </div>
                  <p className="text-[9.5px] text-slate-500 font-light leading-normal">
                    Local Mashonaland & Midlands health referral pathways to fasttrack rural girl diagnostic validation.
                  </p>
                  <span className="text-[9px] font-semibold text-slate-600 block">📞 Rural Support Desk: +263 77 123 4567</span>
                </div>
              </div>
            </div>

            {/* ANTI-INFLAMMATORY HERBAL PAIRINGS */}
            <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm space-y-3">
              <span className="text-[9.5px] font-bold text-purple-700 block uppercase tracking-wider font-mono">
                🌿 Advanced Indigenous Anti-Inflammatory Recipes
              </span>
              <div className="p-3 bg-purple-50/20 border border-purple-100 rounded-xl space-y-1.5 text-left">
                <span className="font-bold text-[10px] text-purple-800 block">The Endo-Comfort Bio-Infusion (Zumbani & Tsangamidzi)</span>
                <p className="text-[9.5px] text-slate-650 leading-relaxed font-light font-sans">
                  Endometriosis flares are driven by high prostaglandin (PGE2) inflammatory markers. Blend 2 teaspoons of dried <strong>Zumbani</strong> leaves with half a teaspoon of dry shredded <strong>Tsangamidzi</strong> (Wild Ginger). Steep in boiling water for 8 minutes. Wild Ginger contains specific gingerol properties that inhibit the COX-2 enzyme pathway, while Zumbani provides highly active calm phytosterols. Sip warm twice daily during severe acyclical pelvic flares.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SMART PATCH & GEL REMINDERS                             */}
        {/* ======================================================== */}
        <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm space-y-4">
          <div className="flex justify-between items-center select-none border-b border-slate-50 pb-2">
            <h3 className="text-xs font-bold text-rose-600 uppercase tracking-wide flex items-center gap-1.5">
              <Bell className="w-4 h-4" />
              <span>{t.smartReminders}</span>
            </h3>
            <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[8px] font-mono font-bold tracking-wider uppercase rounded">
              {t.activeReminders}
            </span>
          </div>

          <div className="space-y-3">
            {dbState.reminders?.map((reminder) => {
              const rTitle = reminder.title[language] || reminder.title.en;
              const isOverdue = (() => {
                if (!reminder.enabled) return false;
                const hrs = (Date.now() - new Date(reminder.lastChanged).getTime()) / 3600000;
                return hrs >= reminder.intervalHours;
              })();
              const progressPct = (() => {
                if (!reminder.enabled) return 100;
                const hrs = (Date.now() - new Date(reminder.lastChanged).getTime()) / 3600000;
                const pct = ((reminder.intervalHours - hrs) / reminder.intervalHours) * 100;
                return Math.max(0, Math.min(100, pct));
              })();
              const hoursRemaining = (() => {
                if (!reminder.enabled) return 0;
                const hrs = (Date.now() - new Date(reminder.lastChanged).getTime()) / 3600000;
                return Math.max(0, reminder.intervalHours - hrs);
              })();

              return (
                <div key={reminder.id} className="p-3 bg-slate-50 rounded-xl border border-slate-150 space-y-2.5 transition hover:shadow-xs text-left">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-black text-slate-800 block leading-tight">
                        {rTitle}
                      </span>
                      <span className="text-[8.5px] font-mono text-slate-400">
                        {reminder.type === 'patch' ? t.patchReminderLabel : t.gelReminderLabel}
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={reminder.enabled}
                        onChange={() => toggleReminder(reminder.id, reminder.enabled)}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-rose-500"></div>
                    </label>
                  </div>

                  {reminder.enabled && (
                    <div className="space-y-1.5 pt-1 border-t border-slate-200/50">
                      <div className="flex justify-between text-[9px] font-mono font-bold">
                        {isOverdue ? (
                          <span className="text-rose-600 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                            Overdue! Actions Required
                          </span>
                        ) : (
                          <span className="text-slate-500">
                            ~{hoursRemaining.toFixed(1)}h remaining
                          </span>
                        )}
                        <span className="text-slate-400">
                          Cycle: {reminder.intervalHours}h
                        </span>
                      </div>
                      
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 rounded-full ${isOverdue ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center pt-1.5">
                        <span className="text-[8.5px] text-slate-400 font-mono">
                          Last done: {new Date(reminder.lastChanged).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <button
                          type="button"
                          onClick={() => conductResetReminder(reminder.id)}
                          disabled={resetReminderLoadingId === reminder.id}
                          className="bg-slate-930 text-white hover:bg-slate-800 disabled:opacity-40 text-[9px] font-black px-2.5 py-1 rounded transition uppercase cursor-pointer"
                        >
                          {resetReminderLoadingId === reminder.id ? "Syncing..." : reminder.type === 'patch' ? "Applied New Patch" : "Reapplied Gel"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ======================================================== */}
        {/* CORE THERMISTOR / THERMAL THERAPY TIMER                 */}
        {/* ======================================================== */}
        <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm space-y-3.5">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-rose-600 uppercase tracking-wide flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{t.thermalTimer}</span>
            </h3>
            <span className="px-2 py-0.5 bg-rose-50 border border-rose-100 text-rose-600 text-[8px] font-mono font-bold tracking-wider uppercase rounded">
              Belt SafeGuard Active
            </span>
          </div>

          <p className="text-[10.5px] text-slate-500 leading-relaxed font-normal">{t.thermalTimerDesc}</p>

          <div className="flex items-center justify-between py-2 bg-slate-50/50 rounded-xl px-4 border border-slate-150">
            <div className="font-mono text-3xl font-extrabold text-slate-905 tracking-wider">
              {formatTime(timerSeconds)}
            </div>
            
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={toggleTimer}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${timerActive ? 'bg-slate-200 text-slate-800 hover:bg-slate-250 border border-slate-300' : 'bg-rose-500 text-white hover:bg-rose-600 shadow-sm'}`}
              >
                {timerActive ? t.pauseTimer : t.startTimer}
              </button>
              <button 
                type="button"
                onClick={resetTimer}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-55 text-slate-500 hover:text-slate-800 rounded-lg text-xs transition border border-slate-200"
              >
                {t.resetTimer}
              </button>
            </div>
          </div>

          {timerIntervalAlert && (
            <div className="p-3 bg-rose-50 border border-rose-150 rounded-xl text-[10px] text-rose-700 leading-relaxed animate-pulse">
              {t.timerAlert}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* DYNAMIC SYMPTOM AND RELIEF LOGGER                        */}
        {/* ======================================================== */}
        <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-rose-600 uppercase tracking-wide flex items-center gap-1.5 pb-2 border-b border-slate-50">
            <Activity className="w-4 h-4" />
            <span>{t.logSymptomTitle}</span>
          </h3>

          <form onSubmit={submitSymptoms} className="space-y-4">
            
            {/* PAIN INTENSITY SLIDER */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-700">
                <span>{t.painIntensity}</span>
                <span className="text-rose-600 text-sm font-mono font-extrabold">{painLevel}/10</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={painLevel}
                onChange={(e) => setPainLevel(Number(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer opacity-85 hover:opacity-100 transition"
              />
            </div>

            {/* SYMPTOM LABELS MATRIX */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-705 block">{t.selectSymptoms}</label>
              <div className="flex flex-wrap gap-1.5">
                {["Cramps", "Hot Flash", "Headache", "Fatigue", "Backache"].map(symptom => {
                  const isChosen = selectedSymptoms.includes(symptom);
                  return (
                    <button
                      key={symptom}
                      type="button"
                      onClick={() => handleSymptomToggle(symptom)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-semibold transition ${isChosen ? 'bg-rose-500 text-white font-bold shadow-sm' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-800'}`}
                    >
                      {symptom}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PRODUCTS LOGGED BOXES */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-705 block">{t.selectProducts}</label>
              <div className="flex flex-wrap gap-1.5">
                {["Transdermal Patch", "Heating Belt", "Cooling Belt", "Zumbani Tea", "Makoni Tea"].map(product => {
                  const isChose = selectedProducts.includes(product);
                  return (
                    <button
                      key={product}
                      type="button"
                      onClick={() => handleProductToggle(product)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-semibold transition ${isChose ? 'bg-rose-500 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-800'}`}
                    >
                      {product}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SYMPTOM LOG NOTES TEXT */}
            <div className="space-y-1">
              <textarea 
                value={symptomNotes}
                onChange={(e) => setSymptomNotes(e.target.value)}
                placeholder={t.notesPlaceholder}
                className="w-full bg-white border border-slate-200 hover:border-slate-350 focus:border-rose-450 rounded-xl p-3 text-xs text-slate-800 outline-none placeholder-slate-400 transition h-16 resize-none shadow-inner font-light"
              />
            </div>

            {/* ABSENTEEISM SHIELD LOG */}
            {lifeStage === 'cycle' && (
              <div className="flex items-center gap-2.5 p-1 bg-white">
                <input 
                  type="checkbox" 
                  id="absent"
                  checked={absenteeism}
                  onChange={(e) => setAbsenteeism(e.target.checked)}
                  className="w-4.5 h-4.5 accent-rose-500 rounded border-slate-300 bg-white cursor-pointer"
                />
                <label htmlFor="absent" className="text-[10px] text-slate-600 leading-relaxed cursor-pointer font-medium select-none">
                  {t.absenteeismLabel}
                </label>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button 
              type="submit"
              disabled={loadingAi}
              className="w-full bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-xl text-xs font-bold tracking-wide uppercase transition active:scale-98 disabled:opacity-50 shadow-sm"
            >
              {loadingAi ? t.submitting : t.submitBtn}
            </button>
          </form>

          {/* AI REPORT COMPRESSED FEEDBACK DISPLAY */}
          {aiReport && (
            <div className="border border-rose-100 bg-rose-50/20 p-3.5 rounded-xl space-y-3 animate-fade-in text-[11px] leading-relaxed">
              <h4 className="font-bold text-rose-600 uppercase text-[9.5px] tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-rose-500" />
                <span>{t.aiPipelineHeader}</span>
              </h4>
              
              <div className="space-y-2">
                <div>
                  <span className="text-[9px] font-mono text-slate-400 uppercase block font-bold">{t.detectedSymptom}:</span>
                  <div className="flex gap-1.5 flex-wrap mt-1">
                    {aiReport.symptoms?.map((s: string) => (
                      <span key={s} className="px-2 py-0.5 bg-rose-100/50 rounded text-[9.5px] text-rose-700 font-medium border border-rose-100/40">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center py-1 border-y border-slate-150">
                  <span className="text-[9px] font-mono text-slate-400 uppercase block font-bold">{t.absentRiskLabel}:</span>
                  <span className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-bold uppercase ${aiReport.absenteeismRisk === 'high' ? 'bg-rose-100 text-rose-600 font-bold' : 'bg-emerald-100 text-emerald-600 font-bold'}`}>
                    {aiReport.absenteeismRisk || "low"}
                  </span>
                </div>

                <div>
                  <span className="text-[9px] font-mono text-slate-400 uppercase block font-bold">{t.aiRemedies}:</span>
                  <p className="text-slate-700 text-[10.5px] mt-0.5 leading-relaxed font-light">{aiReport.remedyExplanation}</p>
                </div>

                {aiReport.proactiveTip && (
                  <div className="bg-amber-500/5 p-2.5 rounded border-l-2 border-amber-500 text-[10.5px] italic text-slate-600 leading-normal mt-2">
                    <span className="font-bold text-[9px] text-amber-600 block tracking-wider uppercase font-mono">{t.aiProactiveTip}</span>
                    {aiReport.proactiveTip}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ACTIVE REMEDIAL COHERENCE INSIGHTS */}
        <div className="bg-gradient-to-br from-rose-500/5 to-emerald-500/5 p-4 rounded-2xl border border-slate-150 shadow-sm space-y-3">
          <div className="flex items-center justify-between select-none">
            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 flex items-center gap-1.5 font-mono">
              <Sparkles className="w-4 h-4 text-rose-500" />
              <span>Coherence Comfort Analytics</span>
            </h4>
            <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-500 font-bold uppercase border border-slate-150/40">
              ACTIVE TELEMETRY
            </span>
          </div>
          
          <div className="space-y-2.5 text-left">
            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5 hover:shadow-xs transition">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800">Menstrual Cramps Relief Coherence</span>
                <span className="text-rose-600 font-mono font-black py-0.5 px-2 bg-rose-50 rounded-md border border-rose-100 text-[10px]">-40% Pain</span>
              </div>
              <p className="text-[9.5px] text-slate-500 leading-normal font-light">
                Your menstrual cramps reduce by <strong>40%</strong> when you combine the <strong>Heating Belt</strong> with warm, freshly brewed <strong>Zumbani herbal tea</strong> twice daily.
              </p>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full w-[40%] rounded-full" />
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5 hover:shadow-xs transition">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800">Hot Flashes / Menopause Stabilization</span>
                <span className="text-amber-600 font-mono font-black py-0.5 px-2 bg-amber-50 rounded-md border border-amber-100 text-[10px]">-60% Intensity</span>
              </div>
              <p className="text-[9.5px] text-slate-500 leading-normal font-light">
                Your hot flash frequency reduces by <strong>60%</strong> when combining the <strong>Cooling Therapy Waist Belt</strong> inserts with traditional anti-sweat <strong>Makoni Tea</strong>.
              </p>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full w-[60%] rounded-full" />
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5 hover:shadow-xs transition">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800">Postpartum Muscular Recovery Coherence</span>
                <span className="text-emerald-600 font-mono font-black py-0.5 px-2 bg-emerald-50 rounded-md border border-emerald-100 text-[10px]">+15% Strength</span>
              </div>
              <p className="text-[9.5px] text-slate-500 leading-normal font-light">
                Pairing 20-minute intervals of the <strong>Heating Belt</strong> on low-compression with <strong>Gentle Pelvic movements</strong> has accelerated your tissue healing index by <strong>15%</strong>.
              </p>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[15%] rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* DYNAMIC PERSONALIZED GOALS SECTION                       */}
        {/* ======================================================== */}
        <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm space-y-4">
          <div className="flex justify-between items-center select-none border-b border-slate-50 pb-2">
            <h3 className="text-xs font-bold text-rose-600 uppercase tracking-wide flex items-center gap-1.5 font-sans">
              <Award className="w-4 h-4 text-rose-500" />
              <span>{language === 'sn' ? 'Zvinangwa Zvenyu' : language === 'nd' ? 'Izifiso Zenu' : 'Personalised Daily Goals'}</span>
            </h3>
            <span className="px-2 py-0.5 bg-rose-50 border border-rose-100 text-rose-600 text-[8px] font-mono font-bold tracking-wider uppercase rounded">
              {lifeStage.toUpperCase()} {language === 'sn' ? 'DANHO' : language === 'nd' ? 'ISIGABA' : 'MODE'}
            </span>
          </div>

          {/* GOALS COMPILATION PROGRESS BAR */}
          {(() => {
            const currentStageGoals = personalGoals.filter(g => g.category === lifeStage);
            const total = currentStageGoals.length;
            const checked = currentStageGoals.filter(g => g.checked).length;
            const percentage = total > 0 ? Math.round((checked / total) * 100) : 0;
            const isCompleted = percentage === 100 && total > 0;

            return (
              <div className="space-y-2 p-3 bg-gradient-to-r from-rose-500/5 to-emerald-500/5 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center text-[10px] select-none">
                  <span className="font-bold text-slate-700 font-sans">
                    {language === 'sn' ? 'Kufambira Mberi Kwezuva' : language === 'nd' ? 'Ukuphumelela Kwayizolo' : 'Daily Progress Summary'}
                  </span>
                  <span className={`font-mono font-black ${isCompleted ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {checked}/{total} ({percentage}%)
                  </span>
                </div>
                
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden relative">
                  <div 
                    className={`h-full transition-all duration-500 ease-out rounded-full ${isCompleted ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {isCompleted && (
                  <div className="flex items-center gap-1.5 text-[9px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 p-1.5 px-2.5 rounded-lg animate-fade-in text-left">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 fill-current shrink-0 animate-spin" />
                    <span>{language === 'sn' ? 'Makorokoto! Mazadzisa zvinangwa zvose zva nhasi.' : language === 'nd' ? 'Halala! Liqedile zonke izifiso zanamuhla.' : 'Spectacular! You have completed all stage-specific goals today.'}</span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ACTIVE GOALS FILTERED TARGET LIST */}
          <div className="space-y-2 text-left">
            {personalGoals.filter(g => g.category === lifeStage).map(goal => (
              <button
                key={goal.id}
                type="button"
                onClick={() => toggleGoal(goal.id)}
                className={`w-full p-2.5 rounded-xl border transition flex items-center gap-3 active:scale-[0.99] select-none text-left cursor-pointer ${
                  goal.checked 
                    ? 'bg-emerald-50/50 border-emerald-200 text-slate-800' 
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-150 text-slate-700'
                }`}
              >
                <div className="shrink-0 transition-all duration-300">
                  {goal.checked ? (
                    <CheckSquare className="w-4.5 h-4.5 text-emerald-600 fill-current" />
                  ) : (
                    <Square className="w-4.5 h-4.5 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-[10.5px] leading-snug font-sans ${goal.checked ? 'line-through text-slate-400 font-light' : 'font-normal text-slate-800'}`}>
                    {goal.text[language] || goal.text.en}
                  </span>
                  {goal.isCustom && (
                    <span className="ml-1.5 text-[7.5px] px-1 bg-rose-100 text-rose-605 uppercase font-extrabold font-mono tracking-wider rounded">
                      User Goal
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* CUSTOM GOAL SUBMISSION FORM */}
          <form onSubmit={handleAddCustomGoal} className="flex gap-1.5 border-t border-slate-100 pt-3">
            <input
              type="text"
              value={customGoalText}
              onChange={(e) => setCustomGoalText(e.target.value)}
              placeholder={
                language === 'sn' 
                  ? "Tora rimwe chinangwa cha nhasi..." 
                  : language === 'nd'
                  ? "Bhala isifiso sakho silapha..."
                  : "Add custom daily routine goal (e.g., Limit coffee)..."
              }
              maxLength={70}
              className="flex-1 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-rose-400 rounded-xl px-3 py-1.5 text-[10px] text-slate-800 outline-none leading-normal transition shadow-inner font-light"
            />
            <button
              type="submit"
              disabled={!customGoalText.trim()}
              className="p-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white rounded-xl transition cursor-pointer flex items-center justify-center shrink-0 shadow-sm"
              title="Add Custom Goal"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* ======================================================== */}
        {/* PODCAST STUDIO & TRADITIONAL EDUCATION LIBRARY           */}
        {/* ======================================================== */}
        <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm space-y-4">
          <div className="flex justify-between items-center select-none border-b border-slate-50 pb-2">
            <h3 className="text-xs font-bold text-rose-600 uppercase tracking-wide flex items-center gap-1.5">
              <Volume2 className="w-4 h-4" />
              <span>{t.podcastStudio}</span>
            </h3>
            
            <button 
              type="button"
              onClick={() => setDiscreetMode(!discreetMode)}
              className={`p-1 rounded transition ${discreetMode ? 'text-rose-600 bg-rose-50 border border-rose-100' : 'text-slate-400 hover:text-slate-655'}`}
              title="Toggle Discreet Privacy Cover"
            >
              {discreetMode ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          {/* DISCREET COVER INFORMATION */}
          {discreetMode && (
            <div className="bg-slate-50 p-2.5 border border-slate-250 rounded-xl space-y-1">
              <span className="text-[9.5px] font-bold text-emerald-650 uppercase tracking-widest block font-mono">{t.listenAesthetic}</span>
              <p className="text-[9.5px] text-slate-500 leading-normal">{t.discreetTip}</p>
            </div>
          )}

          {/* AUDIO TRACK REPRESENTATIONS */}
          <div className="space-y-2.5">
            {podcastEpisodes.map(episode => {
              const isPlaying = activePlayId === episode.id;
              const isDownloaded = downloadedMap[episode.id];
              const isDownloading = downloadingId === episode.id;

              return (
                <div key={episode.id} className="p-3 bg-slate-50/50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-sm">
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <span className="text-[8px] bg-slate-100 border border-slate-250 px-1.5 py-0.5 rounded tracking-wide text-rose-600 uppercase font-mono font-bold">
                      {episode.category}
                    </span>
                    <h4 className="text-[10.5px] font-bold text-slate-900 truncate mt-1">
                      {discreetMode ? `Track ${episode.id.toUpperCase()} - Private Session` : episode.title[language]}
                    </h4>
                    <p className="text-[9px] text-slate-400">{episode.speaker} • {episode.duration}</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* DOWNLOAD OPTION */}
                    {isDownloaded ? (
                      <span className="p-1 px-2 bg-emerald-50 border border-emerald-150 text-emerald-655 rounded-lg text-[8px] font-mono uppercase font-bold text-xs" title={t.savedOffline}>
                        Offline
                      </span>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => fakeDownload(episode.id)}
                        disabled={isDownloading}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 disabled:opacity-40 transition"
                      >
                        {isDownloading ? (
                          <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </button>
                    )}

                    {/* PLAYBUTTON */}
                    <button 
                      type="button"
                      onClick={() => setActivePlayId(isPlaying ? null : episode.id)}
                      className={`p-2 rounded-full transition shadow-sm ${isPlaying ? 'bg-rose-500 text-white font-bold scale-105' : 'bg-white border border-slate-200 text-slate-650 hover:bg-slate-50'}`}
                    >
                      {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* INDIGENOUS WELLNESS CYCLOPEDIA & KNOWLEDGE HUB */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-left">
            <div className="flex justify-between items-center select-none border-b border-slate-200/40 pb-2">
              <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 flex items-center gap-1.5 font-mono">
                <BookOpen className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                <span>Empowerment, Education & Factors Hub</span>
              </h4>
              <span className="px-1.5 py-0.5 bg-rose-50 border border-rose-100 text-rose-600 text-[7px] font-bold uppercase rounded font-mono">
                MEDICALLY REVIEWED
              </span>
            </div>

            {/* Hub Subsections Toggles */}
            <div className="flex bg-white p-0.5 rounded-lg border border-slate-150 gap-0.5 select-none">
              {[
                { id: 'cycle', labelEn: 'Cycle Science', labelSn: 'Sainzi yeKutevera', labelNd: 'Ezesayensi' },
                { id: 'menopause', labelEn: 'Menopause Space', labelSn: 'Kuguma Kutevera', labelNd: 'Menopause' },
                { id: 'factors', labelEn: 'Impact Factors', labelSn: 'Summary yeHutano', labelNd: 'Izimbangela' }
              ].map(subTab => (
                <button
                  key={subTab.id}
                  type="button"
                  onClick={() => setEduTab(subTab.id as any)}
                  className={`flex-1 py-1 text-[8.5px] font-bold rounded transition-all duration-200 cursor-pointer ${
                    eduTab === subTab.id 
                      ? 'bg-rose-500 text-white shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                  }`}
                >
                  {language === 'sn' ? subTab.labelSn : language === 'nd' ? subTab.labelNd : subTab.labelEn}
                </button>
              ))}
            </div>

            {/* TAB 1: CYCLE SCIENCE (LEARN MENSTRUAL CYCLE) */}
            {eduTab === 'cycle' && (
              <div className="space-y-2.5 animate-fade-in text-[10px]">
                <p className="text-slate-500 leading-normal font-light">
                  {language === 'sn' 
                    ? "Kutevera kwemwedzi kwakakamurwa kuita matanho mana makuru anotungamirwa nehomoni (Mwedzi, Follicular, Ovulation, neLuteal). Muviri unoda kuchengetedzwa kwakazara."
                    : language === 'nd'
                    ? "Ukuya emfuleni kulendlela ezine ezihlukeneyo ezilawulwa ngamahomoni maveki onke. Umzimba udinga ukuvikelwa ngezikhathi zonke."
                    : "The menstrual cycle consists of 4 biological phases (Menstrual, Follicular, Ovulatory, and Luteal). Hormone levels shift dynamically to prepare the body for potential pregnancy."}
                </p>

                <div className="grid grid-cols-1 gap-2">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-150">
                    <span className="font-extrabold text-rose-600 block text-[9.5px]">1. Menstrual phase (Days 1-5):</span>
                    <span className="text-slate-500 font-light block leading-normal mt-0.5 text-[9.5px]">Estrogen & Progesterone drop, causing the uterine liner to shed. Use <strong>Patch It Transdermal patches</strong> to block localized pain receptors quickly.</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-150">
                    <span className="font-extrabold text-rose-600 block text-[9.5px]">2. Follicular & Ovulatory phase (Days 6-14):</span>
                    <span className="text-slate-500 font-light block leading-normal mt-0.5 text-[9.5px]">Estrogen rises, developing follicles in ovaries. Ovulation releases an egg. Physical energy spikes! Perfect time for active movement.</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-150">
                    <span className="font-extrabold text-rose-600 block text-[9.5px]">3. Luteal phase (Days 15-28):</span>
                    <span className="text-slate-500 font-light block leading-normal mt-0.5 text-[9.5px]">Progesterone peaks. If no fertilization happens, hormones decline sharply, triggering uterine muscle cramps. Sip warm <strong>Zumbani Tea</strong>.</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MENOPAUSE SPACE (LEARN MENOPAUSE) */}
            {eduTab === 'menopause' && (
              <div className="space-y-2.5 animate-fade-in text-[10px]">
                <p className="text-slate-500 leading-normal font-light">
                  {language === 'sn' 
                    ? "Kuguma kutevera (Menopause) ndeapo muviri wemadzimai unopedza mwedzi gumi nemaviri usisateveri nekuda kwekuderera kweEstrogen zvakazara. Izvi zvinotanga nePerimenopause."
                    : language === 'nd'
                    ? "Isikhathi se-Menopause sidinga ingqondo ezolileyo njengoba ama-Estrogen ehla kakhulu. Siza umzimba wakho ngokudla imithi elungileyo yasendulo."
                    : "Menopause is officially reached when ovulation ceases for 12 consecutive months, signaling the natural end of the reproductive years, preceded by a transitional phase called Perimenopause."}
                </p>

                <div className="grid grid-cols-1 gap-2">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-150">
                    <span className="font-extrabold text-amber-600 block text-[9.5px]">A. Vasomotor Hot Flashes:</span>
                    <span className="text-slate-500 font-light block leading-normal mt-0.5 text-[9.5px]">Hormonal low signals confuse the brain's thermostat, causing sudden heat surges. Slip <strong>Cooling Inserts</strong> into your belt for localized temperature drops.</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-150">
                    <span className="font-extrabold text-amber-600 block text-[9.5px]">B. Bone Density & Estrogen Loss:</span>
                    <span className="text-slate-500 font-light block leading-normal mt-0.5 text-[9.5px]">Lower Estrogen levels speed bone resorption. Pair moderate daily weight-bearing walks with anti-inflammatory herbal teas to safeguard calcium balance.</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-150">
                    <span className="font-extrabold text-amber-600 block text-[9.5px]">C. Cardioprotective Restoration:</span>
                    <span className="text-slate-500 font-light block leading-normal mt-0.5 text-[9.5px]">Vascular elasticity declines slightly without estrogen. Rich cardioprotective flavonoids in <strong>Makoni Tea</strong> support capillary resilience.</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: FACTORS SUMMARY (FACTORS IMPACTING MENSTRUAL CYCLE & MENOPAUSE) */}
            {eduTab === 'factors' && (
              <div className="space-y-2.5 animate-fade-in text-[10px]">
                <p className="text-slate-500 leading-normal font-light col-span-full">
                  {language === 'sn' 
                    ? "Tsananguro pfupi yezvinhu zvinokanganisa hutano hwekuenda kumwedzi kana muganhu wekuguma kutevera. Ongorora factors idzi dzinotevera:"
                    : language === 'nd'
                    ? "Izinto ezilawula kumbe ezithikameza ukuya emfuleni kumbe ukuphela kwawo (Menopause). Funda ngombukiso lo:"
                    : "Biological cycles and menopause are complex endocrine pathways. Dynamic internal and external factors constantly influence hormonal stability:"}
                </p>

                <div className="space-y-2 col-span-full">
                  <div className="p-3 bg-white rounded-xl border border-slate-150 space-y-1.5 text-left">
                    <div className="flex justify-between items-center text-[10.5px]">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                        Stress & Cortisol Surge
                      </span>
                      <span className="text-[8px] bg-rose-50 px-1.5 py-0.5 rounded text-rose-600 font-mono font-bold uppercase">HIGH IMPACT</span>
                    </div>
                    <p className="text-[9.5px] text-slate-500 font-light leading-relaxed">
                      Excess cortisol directly suppresses GnRH (gonadotropin-releasing hormone), leading to skipped/delayed periods, highly intense muscular uterine contractions, or heightened vasomotor flash sensitivity.
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-150 space-y-1.5 text-left">
                    <div className="flex justify-between items-center text-[10.5px]">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                        Nutritional Phytochemicals
                      </span>
                      <span className="text-[8px] bg-indigo-50 px-1.5 py-0.5 rounded text-indigo-600 font-mono font-bold uppercase">PROTECTIVE</span>
                    </div>
                    <p className="text-[9.5px] text-slate-500 font-light leading-relaxed">
                      Indigenous plants such as <strong>Zumbani</strong> contain specific monoterpenes and flavonoids that occupy ER (estrogen receptors) to normalize autonomic swings.
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-150 space-y-1.5 text-left">
                    <div className="flex justify-between items-center text-[10.5px]">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                        Local Thermoregulation
                      </span>
                      <span className="text-[8px] bg-amber-50 px-1.5 py-0.5 rounded text-amber-600 font-mono font-bold uppercase">PHYSICAL FACTOR</span>
                    </div>
                    <p className="text-[9.5px] text-slate-500 font-light leading-relaxed">
                      Localized thermal therapy on lower vertebrae dampens sensory pain signals (gate-control theory), while localized neck cooling activates vasoconstriction to control hot sweeps.
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-150 space-y-1.5 text-left">
                    <div className="flex justify-between items-center text-[10.5px]">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        Sleep Quality & REM Circadian
                      </span>
                      <span className="text-[8px] bg-emerald-50 px-1.5 py-0.5 rounded text-emerald-600 font-mono font-bold uppercase">FEEDBACK LOOP</span>
                    </div>
                    <p className="text-[9.5px] text-slate-500 font-light leading-relaxed">
                      Night sweats disrupt slow-wave sleep. This triggers high cortisol levels the next day, escalating pain hypersensitivity and destabilizing cyclic menstrual flow.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Indigenous Herbal Reference (Zumbani & Makoni) */}
            <div className="border-t border-slate-200/60 pt-3 space-y-2 mt-2">
              <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider font-mono">
                {t.traditionalLibrary}
              </span>
              <div className="grid grid-cols-1 gap-2">
                <div className="p-2.5 bg-white rounded-xl border border-slate-150 space-y-1">
                  <span className="font-extrabold text-[10px] text-rose-600 block">{t.zumbaniTitle}</span>
                  <p className="text-[9.5px] text-slate-500/90 leading-relaxed font-light">{t.zumbaniDesc}</p>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-150 space-y-1">
                  <span className="font-extrabold text-[10px] text-rose-600 block">{t.makoniTitle}</span>
                  <p className="text-[9.5px] text-slate-500/90 leading-relaxed font-light">{t.makoniDesc}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
         {/* ======================================================== */}
        {/* REFILL STORE & BUY-ONE GIFT-ONE IMPACT DASHBOARD        */}
        {/* ======================================================== */}
        <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-rose-600 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-55 pb-2">
            <ShoppingBag className="w-4 h-4" />
            <span>{t.ecommerceTitle}</span>
          </h3>

          {/* STORE PRODUCTS GRID */}
          <div className="space-y-2.5">
            {storeProducts.map(product => {
              const isBuying = purchaseLoading && selectedProductId === product.id;
              
              return (
                <div key={product.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-start gap-3 justify-between shadow-sm">
                  <div className="text-2xl pt-1 select-none shrink-0">{product.image}</div>
                  
                  <div className="flex-1 text-left min-w-0">
                    <h4 className="text-[11px] font-bold text-slate-900">{product.name}</h4>
                    <p className="text-[9.5px] text-slate-500 mt-0.5 leading-relaxed font-light">{product.description[language]}</p>
                    <span className="text-xs font-mono font-extrabold text-rose-600 block mt-1.5">${product.priceUSD.toFixed(2)} USD</span>
                  </div>

                  <button 
                    type="button"
                    onClick={() => conductEcomOrder(product)}
                    disabled={isBuying}
                    className="shrink-0 bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 p-2 px-3 hover:border-rose-300 rounded-xl text-[10px] font-bold tracking-wide uppercase transition active:scale-95 disabled:opacity-40 shadow-sm"
                  >
                    {isBuying ? "..." : "Buy"}
                  </button>
                </div>
              );
            })}
          </div>

          {/* MOBILE PAYMENT INPUT */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 font-sans">
            <span className="text-[10px] font-bold tracking-wide text-slate-700 block">{t.paymentLabel}</span>
            
            <div className="grid grid-cols-3 gap-1.5">
              {["EcoCash", "InnBucks", "ZIPIT Card"].map(method => (
                <button 
                  key={method}
                  type="button"
                  onClick={() => setSelectedPayment(method)}
                  className={`py-1 rounded-lg text-[9px] font-mono tracking-wider transition ${selectedPayment === method ? 'bg-rose-500 text-white font-bold shadow-sm' : 'bg-white border border-slate-200 text-slate-550 hover:text-slate-850'}`}
                >
                  {method}
                </button>
              ))}
            </div>

            <input 
              type="text" 
              value={checkoutPhone}
              onChange={(e) => setCheckoutPhone(e.target.value)}
              placeholder="e.g. 0772000000"
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[10.5px] text-slate-800 font-mono text-center outline-none focus:border-rose-450"
            />
          </div>

          {/* CHECKOUT SUCCESS MODUP */}
          {checkoutSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-xl text-[10px] text-emerald-800 leading-normal animate-fade-in flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{t.successOrder}</span>
            </div>
          )}

          {/* "BUY ONE, GIFT ONE" IMPACT SHIELD */}
          <div className="p-4 bg-gradient-to-br from-rose-50/10 to-rose-50/40 border border-rose-100 rounded-2xl space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-rose-500" />
              <span>{t.buyOneGiftOne}</span>
            </h4>

            <p className="text-[9.5px] text-slate-500 leading-relaxed font-light">{t.fundedTribe}</p>

            <div className="pt-2 border-t border-rose-100 flex justify-between items-center bg-white p-2 rounded-lg shadow-sm">
              <span className="text-[9.5px] text-slate-400 uppercase font-mono tracking-wide">{t.ruralImpactStats}</span>
              <span className="text-[10px] font-bold text-rose-600 font-mono">
                {dbState.impactStats.distributedFreeCount} packages
              </span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* NO-SHAME KNOWLEDGE BASE & SISTERHOOD FORUMS              */}
        {/* ======================================================== */}
        <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm space-y-4">
          <div className="flex justify-between items-center select-none border-b border-slate-55 pb-2">
            <h3 className="text-xs font-bold text-rose-600 uppercase tracking-wide flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-500" />
              <span>No-Shame Hub & Anonymous Forum</span>
            </h3>
            <span className="px-2 py-0.5 bg-rose-50 border border-rose-100 text-rose-600 text-[8px] font-mono font-bold tracking-wider uppercase rounded">
              Stigma-Free Zone
            </span>
          </div>

          {/* INNER TABS: FAQ vs FORUM */}
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1 select-none">
            {["faq", "forum"].map(tab => (
              <button 
                key={tab}
                type="button"
                onClick={() => setForumCategory(tab)}
                className={`flex-1 py-1 px-1.5 rounded-lg text-[9.5px] font-extrabold uppercase transition tracking-wider ${
                  (forumCategory === tab || (forumCategory !== 'faq' && forumCategory !== 'forum' && tab === 'forum'))
                    ? 'bg-rose-500 text-white shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab === 'faq' ? "No-Shame FAQs" : "Sisterhood Forum"}
              </button>
            ))}
          </div>

          {/* TAB CONTENT: NO-SHAME FAQs */}
          {(forumCategory === 'faq') ? (
            <div className="space-y-3 pt-1">
              <span className="text-[9.5px] text-slate-400 font-bold block uppercase tracking-wider font-mono text-left">
                Taboo-Busting Medical Realities:
              </span>
              
              <div className="space-y-2 text-left">
                {[
                  {
                    q: language === 'sn' ? "Ndizvo zvakajairika here kurwadziwa zvakanyanya panguva kwekutevera?" : language === 'nd' ? "Kubuhlungu kakhulu yini ukuba semfuleni?" : "Is severe, crippling pain a normal part of menstruation?",
                    ans: language === 'sn' ? "Aiwa, marwadzo anokutadzisa kuenda kuchikoro kana kubasa (dysmenorrhea) haasi ekurarama nawo. Chigamba chePatch It chinorwisa marwadzo aya kuitira kuti urarame hupenyu hwakasununguka." : language === 'nd' ? "Hatshi, ubuhlungu obukuvimbisa ukuya esikolweni kumbe emsebenzini (dysmenorrhea) akungobokwamukela njalo. Isichibi se-Patch It sidambisa lobu buhlungu ukuze usebenze ukhululekile." : "No. Crippling period pain that keeps girls out of school is a medical condition (dysmenorrhea). It is treatable and preventable. Using Patch It local transdermal patches calms inflammation."
                  },
                  {
                    q: language === 'sn' ? "Chii chinonzi postpartum 'lochia' uye zvakajairika?" : language === 'nd' ? "Kuyini 'lochia' emva kokubeletha njalo kujwayelekile yini?" : "What is postpartum 'lochia' and uterine retraction?",
                    ans: language === 'sn' ? "Lochia ndiko kubuda kweropa nemvura zvakajairika mushure mekusununguka apo chibereko chiri kudzokera parugwaro (involution). Kushandisa mabhande anopisa (Heating Belts) kunodzivirira marwadzo emhasuru aya panguva yekupora." : language === 'nd' ? "Lochia yikuphuma kwegazi lejusi emva kokubeletha okuvamileyo lapho isizalo sibuyela esimweni saso (involution). Ukusebenzisa ibhande elihambisa ukufudumala kudambisa lokhu kulimala." : "Lochia is normal postpartum discharge as your uterus shrinks back to its pre-pregnancy size (involution). Gentle pelvic breathing and our Warming Belt safely speed up muscular tissue repair and core recovery."
                  },
                  {
                    q: language === 'sn' ? "Sei ndichinzwa kupisa muviri kuMenopause, ingava n'anga here?" : language === 'nd' ? "Kungani ngizwa ukutshisa komzimba kakhulu ku-Menopause, kuyisintu yini?" : "Why do I experience spontaneous hot flashes during menopause?",
                    ans: language === 'sn' ? "Kupisa muviri husiku hakusi kuroiwa kana n'anga, inyaya yehomoni dzeEstrogen dziri kuderera mumuviri. Kushandisa twugamba tunotonhorera (Cooling inserts) kunodzikamisa kupisa uku mushure mechinguvana." : language === 'nd' ? "Ukutshisa komzimba akusikho kurogwa, kudalwa yikuhla kwama-hormone e-Estrogen. Ukusebenzisa izichibi ezizolisila eziqandayo kukusiza ukumisa ukutshisa ngokuphanyazo." : "Hot flashes are caused by declining estrogen levels confusing the brain's internal thermostat. They are purely hormonal and medical. Applying Cooling Inserts inside your belt instantly brings down core skin temperature."
                  }
                ].map((item, idx) => (
                  <details key={idx} className="group bg-slate-50 border border-slate-150 rounded-xl p-3 [&_summary::-webkit-details-marker]:hidden cursor-pointer select-none">
                    <summary className="flex items-center justify-between font-bold text-slate-800 text-[10.5px] leading-snug">
                      <span>{item.q}</span>
                      <span className="text-rose-500 font-mono text-xs transition group-open:rotate-180">▼</span>
                    </summary>
                    <p className="mt-2 text-[9.5px] text-slate-500 font-light leading-relaxed border-t border-slate-200/50 pt-2 cursor-text">
                      {item.ans}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          ) : (
            /* TAB CONTENT: ANONYMOUS SISTERHOOD FORUMS */
            <div className="space-y-3 text-left">
              <span className="text-[9.5px] text-slate-400 font-bold block uppercase tracking-wider font-mono">
                Anonymized Peer Support Council:
              </span>

              {/* POSTS LISTING */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {dbState.forumPosts && dbState.forumPosts.length > 0 ? (
                  dbState.forumPosts.map((post: any) => (
                    <div key={post.id} className="p-2.5 bg-slate-50 border border-slate-150 rounded-xl space-y-1">
                      <div className="flex justify-between items-center text-[8px] font-mono font-bold select-none">
                        <span className="px-1.5 py-0.5 bg-slate-200/50 text-slate-600 rounded">
                          🔒 Anonymous • {post.author}
                        </span>
                        <span className="text-slate-400">
                          {new Date(post.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-700 leading-snug font-light whitespace-pre-line select-text">
                        {post.text}
                      </p>
                      <div className="flex justify-between items-center pt-1 border-t border-slate-200/30 text-[9px] select-none">
                        <span className="px-1.5 py-0.5 bg-rose-50 border border-rose-100 text-rose-600 text-[7px] font-bold uppercase rounded tracking-wider font-sans">
                          {post.category || "General"}
                        </span>
                        <button className="text-slate-400 hover:text-rose-500 flex items-center gap-1 font-mono">
                          ❤️ <span>{post.likes} likes</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-[10px] text-slate-400 font-light italic">
                    Loading Sisterhood board... Ensure you're connected.
                  </div>
                )}
              </div>

              {/* FORUM LEAF DISPATCH CONTAINER */}
              <form onSubmit={submitForumPost} className="space-y-2 border-t border-slate-200/55 pt-3">
                <textarea 
                  value={forumInput}
                  onChange={(e) => setForumInput(e.target.value)}
                  placeholder={
                    language === 'sn' 
                      ? "Nyora ruzivo kana mhinduro yako pano yehunhu pasina anoziva..." 
                      : language === 'nd'
                      ? "Bhala imfihlo yakho kumbe usizo lapha ngasese..."
                      : "Share an experience or ask a question completely anonymously (e.g. cramps, hot flashes)..."
                  }
                  maxLength={250}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-350 focus:border-rose-450 rounded-xl p-2.5 text-[10.5px] text-slate-800 outline-none placeholder-slate-400 transition h-14 resize-none shadow-inner font-light"
                />
                
                <div className="flex justify-between items-center select-none">
                  <span className="text-[8.5px] text-slate-400 font-sans italic">
                    Signed anonymously as <strong>{lifeStage === 'recovery' ? 'Mother' : 'Sister'}-***</strong>
                  </span>
                  <button 
                    type="submit"
                    disabled={forumLoading || !forumInput.trim()}
                    className="bg-rose-500 hover:bg-rose-600 text-white font-bold uppercase px-4 py-1.5 rounded-lg text-[9px] tracking-wide transition active:scale-95 disabled:opacity-40 shadow-sm cursor-pointer"
                  >
                    {forumLoading ? "Saving..." : "Post Anonymously"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

      </div>

      {/* GENTLE MOVEMENT GUIDED OVERLAY */}
      {activeExerciseIdx !== -1 && (
        <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xs flex flex-col justify-center items-center p-6 z-50 text-white animate-fade-in">
          <div className="w-full max-w-xs bg-slate-800 rounded-3xl border border-slate-700 p-5 space-y-6 text-center select-none shadow-2xl relative text-left">
            
            <button 
              onClick={() => {
                setActiveExerciseIdx(-1);
                setExerciseRunning(false);
              }}
              className="absolute right-3.5 top-3.5 p-1 bg-slate-700 hover:bg-slate-600 rounded-full text-slate-400 transition cursor-pointer flex items-center justify-center"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="space-y-1.5 pt-2 text-center">
              <span className="text-[9px] uppercase font-black text-rose-400 tracking-widest font-mono">
                Safe Postpartum Exercise
              </span>
              <h4 className="font-extrabold text-[#f8fafc] text-sm">
                {[
                  "Diaphragmatic Breathing",
                  "Supine Pelvic Tilts",
                  "Transverse Core Hold"
                ][activeExerciseIdx]}
              </h4>
              <p className="text-[10px] text-slate-400 leading-normal px-2 text-center font-light font-sans">
                {[
                  "Inhale into chest & expand belly. Exhale gently, drawing pelvic muscles up.",
                  "Using the Warming Belt on low. Tilt your hips up to flatten the lower back gently on each exhale.",
                  "Draw your deep core stabilizers in toward the spine, maintaining a continuous shallow breathing rhythm."
                ][activeExerciseIdx]}
              </p>
            </div>

            {/* DYNAMIC VISUAL WAVE EXPANSION TO SIMULATE THE BREATHING RATE */}
            <div className="flex justify-center items-center h-24 relative">
              <div 
                className={`absolute w-20 h-20 rounded-full bg-emerald-500/25 border border-emerald-400/40 mix-blend-screen flex items-center justify-center transition-all duration-[4000ms] ease-in-out ${
                  exerciseRunning && (exerciseTimer % 8 < 4) ? 'scale-[1.8] opacity-100 bg-emerald-500/35' : 'scale-75 opacity-70'
                }`}
              />
              <div className="z-10 font-mono text-3xl font-black text-[#f8fafc]">
                {formatTime(exerciseTimer)}
              </div>
            </div>

            <div className="space-y-1.5 text-center">
              <span className="text-xs font-mono font-bold text-emerald-400 block tracking-wide">
                {exerciseRunning 
                  ? ((exerciseTimer % 8 < 4) ? "😤 Breath In Slowly..." : "😮 Exhale Calmly...")
                  : "Completed! Well Done."
                }
              </span>
              <span className="text-[8.5px] text-slate-400 italic block">
                Make sure your thermal belt is kept at a comfortable warm setting.
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setExerciseRunning(!exerciseRunning)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition uppercase cursor-pointer ${
                  exerciseRunning ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-rose-500 hover:bg-rose-600 text-white'
                }`}
              >
                {exerciseRunning ? "Pause" : "Resume"}
              </button>
              <button
                onClick={() => setExerciseTimer(120)}
                className="bg-slate-700 border border-slate-600 text-slate-350 hover:bg-slate-650 px-4 py-2 rounded-xl text-xs font-bold transition uppercase cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. SMARTPHONE BOTTOM NAVIGATION RAIL */}
      <div className="absolute bottom-0 inset-x-0 bg-white border-t border-slate-100 p-3 flex justify-around items-center text-slate-400 z-30 font-sans shrink-0 shadow-lg">
        <button 
          type="button"
          onClick={() => { setLifeStage('cycle'); setShowOnboarding(false); }}
          className={`flex flex-col items-center gap-0.5 transition ${lifeStage === 'cycle' && !showOnboarding ? 'text-rose-600 font-bold' : 'hover:text-slate-650'}`}
        >
          <Droplet className="w-4.5 h-4.5" />
          <span className="text-[8.5px]">Cycle</span>
        </button>

        <button 
          type="button"
          onClick={() => { setLifeStage('recovery'); setShowOnboarding(false); }}
          className={`flex flex-col items-center gap-0.5 transition ${lifeStage === 'recovery' && !showOnboarding ? 'text-rose-600 font-bold' : 'hover:text-slate-650'}`}
        >
          <Activity className="w-4.5 h-4.5" />
          <span className="text-[8.5px]">Recovery</span>
        </button>

        <button 
          type="button"
          onClick={() => { setLifeStage('balance'); setShowOnboarding(false); }}
          className={`flex flex-col items-center gap-0.5 transition ${lifeStage === 'balance' && !showOnboarding ? 'text-rose-600 font-bold' : 'hover:text-slate-650'}`}
        >
          <Flame className="w-4.5 h-4.5" />
          <span className="text-[8.5px]">Balance</span>
        </button>

        <button 
          type="button"
          onClick={() => { setLifeStage('endo'); setShowOnboarding(false); }}
          className={`flex flex-col items-center gap-0.5 transition ${lifeStage === 'endo' && !showOnboarding ? 'text-purple-600 font-bold' : 'hover:text-slate-650'}`}
        >
          <Award className="w-4.5 h-4.5" />
          <span className="text-[8.5px]">Endo</span>
        </button>

        <button 
          type="button"
          onClick={() => setShowOnboarding(true)}
          className={`flex flex-col items-center gap-0.5 transition ${showOnboarding ? 'text-rose-600 font-bold' : 'hover:text-slate-650'}`}
        >
          <User className="w-4.5 h-4.5" />
          <span className="text-[8.5px]">Onboard</span>
        </button>
      </div>

    </div>
  );
}
