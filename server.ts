import express from "express";
import path from "path";
import dns from "dns";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

// Ensure IPv4 first to avoid localhost connection hiccups
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialized Gemini client
let aiInstance: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined. Falling back to rule-based symptom responses.");
      return null;
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

// SIMULATED UNIFIED DATABASE
interface LocalDB {
  records: any[];
  impactStats: {
    subscriberCount: number;
    distributedFreeCount: number;
    fundsMobilizedUSD: number;
  };
  whatsappSessions: Record<string, {
    messages: any[];
    language: string;
  }>;
  ussdSessions: Record<string, {
    menuPath: string;
    language: "en" | "sn" | "nd";
    tempPainIntensity?: number;
    tempSymptom?: string;
  }>;
  orders: any[];
  reminders: any[];
  forumPosts: any[];
}

const db: LocalDB = {
  records: [
    {
      id: "rec-1",
      timestamp: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
      intensity: 7,
      symptomText: "Cramps and severe headache in morning",
      symptoms: ["Cramps", "Headache"],
      products: ["Transdermal Patch", "Zumbani Tea"],
      channel: "app",
      absenteeism: true,
      lifeStage: "cycle"
    },
    {
      id: "rec-2",
      timestamp: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
      intensity: 3,
      symptomText: "Musana uri kurwadza (back hurts)",
      symptoms: ["Backache"],
      products: ["Heating Belt"],
      channel: "whatsapp",
      absenteeism: false,
      lifeStage: "cycle"
    },
    {
      id: "rec-3",
      timestamp: new Date(Date.now() - 1 * 24 * 3600000).toISOString(),
      intensity: 8,
      symptomText: "kupisa muviri (severe hot flash) during presentation",
      symptoms: ["Hot Flash"],
      products: ["Cooling Belt"],
      channel: "ussd",
      absenteeism: false,
      lifeStage: "balance"
    }
  ],
  impactStats: {
    subscriberCount: 248,
    distributedFreeCount: 1420,
    fundsMobilizedUSD: 1840,
  },
  whatsappSessions: {},
  ussdSessions: {},
  orders: [
    {
      id: "ord-1",
      productName: "Sustained-Release Pain Patches (Cycle subscription)",
      priceUSD: 12.00,
      timestamp: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
      status: "Dispatched (Harare Main)",
      paymentMethod: "EcoCash"
    }
  ],
  reminders: [
    { id: "rem-1", type: "patch", title: { en: "Replace Pain Patch", sn: "Chinja Chigamba Chekurwadza", nd: "Tshintsha Isichibi Sobuhlungu" }, enabled: true, intervalHours: 12, lastChanged: new Date(Date.now() - 2.5 * 3600000).toISOString() },
    { id: "rem-2", type: "gel", title: { en: "Apply Pain Relief Gel", sn: "Zora Mafuta Anozorodza", nd: "Sula Amafuta Okuphelisa Ubuhlungu" }, enabled: false, intervalHours: 6, lastChanged: new Date(Date.now() - 1.2 * 3600000).toISOString() }
  ],
  forumPosts: [
    { id: "fp-1", author: "Sister-742", text: "Zumbani tea really calms menstrual cramps combined with the heating belt. Has anyone else tried this?", timestamp: new Date(Date.now() - 5 * 3600000).toISOString(), likes: 24, category: "cycle" },
    { id: "fp-2", author: "Mother-385", text: "Uterine involution tips: Warm Makoni tea + 20 mins light horizontal breathing is amazing postpartum. Highly recommend the safe belt timer!", timestamp: new Date(Date.now() - 12 * 3600000).toISOString(), likes: 18, category: "recovery" },
    { id: "fp-3", author: "Sister-901", text: "Menopause sweats are tough, especially around 3am. I'm keeping my Cooling Belt inserts ready. Complete game changer!", timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), likes: 32, category: "balance" }
  ]
};

// ======================================
// 1. API ROUTES
// ======================================

// GET unified database records & stats
app.get("/api/dashboard", (req, res) => {
  res.json({
    records: db.records,
    impactStats: db.impactStats,
    orders: db.orders,
    reminders: db.reminders,
    forumPosts: db.forumPosts
  });
});

// Create symptom log manually
app.post("/api/records", (req, res) => {
  try {
    const { intensity, symptomText, symptoms, products, channel, absenteeism, lifeStage } = req.body;
    
    const newRecord = {
      id: "rec-" + Date.now(),
      timestamp: new Date().toISOString(),
      intensity: Number(intensity) || 5,
      symptomText: symptomText || "",
      symptoms: Array.isArray(symptoms) ? symptoms : [],
      products: Array.isArray(products) ? products : [],
      channel: channel || "app",
      absenteeism: !!absenteeism,
      lifeStage: lifeStage || "cycle"
    };

    db.records.push(newRecord);
    res.status(201).json({ success: true, record: newRecord });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update standard reminders settings
app.post("/api/reminders/toggle", (req, res) => {
  const { id, enabled } = req.body;
  const reminder = db.reminders.find(r => r.id === id);
  if (reminder) {
    reminder.enabled = enabled;
    reminder.lastChanged = new Date().toISOString();
    return res.json({ success: true, reminders: db.reminders });
  }
  res.status(404).json({ error: "Reminder not found" });
});

// Reset standard reminder timestamp (e.g. they just changed/applied product)
app.post("/api/reminders/reset", (req, res) => {
  const { id } = req.body;
  const reminder = db.reminders.find(r => r.id === id);
  if (reminder) {
    reminder.lastChanged = new Date().toISOString();
    return res.json({ success: true, reminders: db.reminders });
  }
  res.status(404).json({ error: "Reminder not found" });
});

// GET all active forum posts
app.get("/api/forum", (req, res) => {
  res.json({ posts: db.forumPosts });
});

// Create a new anonymized forum post
app.post("/api/forum", (req, res) => {
  try {
    const { text, category } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Post content is required" });
    }
    const idNum = Math.floor(100 + Math.random() * 900);
    const prefixes = {
      cycle: "Sister-",
      recovery: "Mother-",
      balance: "Sister-"
    };
    const prefix = prefixes[category as keyof typeof prefixes] || "Sister-";
    
    const newPost = {
      id: "fp-" + Date.now(),
      author: `${prefix}${idNum}`,
      text: text || "",
      timestamp: new Date().toISOString(),
      likes: 0,
      category: category || "cycle"
    };

    db.forumPosts.unshift(newPost); // Add at the beginning
    res.status(201).json({ success: true, post: newPost, posts: db.forumPosts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AI SYMPTOM & TRADITIONAL REMEDY ANALYZER (Pain-to-AI Pipeline)
app.post("/api/analyze-symptoms", async (req, res) => {
  const { symptomText, language, lifeStage } = req.body;
  const lang = language || "en";
  const stage = lifeStage || "cycle";

  const ai = getGemini();

  if (!ai) {
    // Elegant Rule-based Fallback when API key is missing
    return res.json(getFallbackDiagnosis(symptomText, lang, stage));
  }

  try {
    const systemInstruction = 
      "You are the expert Zimbabwean AI Gynecologist & Indigenous Herb Therapist for the 'Patch It Wellness App'. " +
      "Analyze the user's logged symptoms (which may be in English, Shona 'ChiShona', or Ndebele 'isiNdebele'). " +
      "Identify symptoms, mapping Shona/Ndebele words (e.g. 'kupisa muviri' -> hot flash, 'kurwadza mudumbu' -> menstrual cramps, 'musana' -> back pain, 'kuneta' -> fatigue). " +
      "Select optimal remedies from physical products: 'Transdermal Patches' (for slow-release localized block), 'Heating/Cooling Belt' (cooling insert for hot flash; heating for cramps), 'Pain Relief Gels'. " +
      "Provide optimal dosage steps of local flora: 'Zumbani Tea' (anti-inflammatory, perfect for cramps & relaxation) and 'Makoni Tea' (uplifting antioxidant for headaches & hormonal balance). " +
      "Predict school/work absenteeism risk (high/medium/low). " +
      "You MUST formulate the entire counselor response in the requested language: '" + lang + "' (code: 'en' for English, 'sn' for ChiShona, 'nd' for isiNdebele). " +
      "Provide your output EXCLUSIVELY in valid JSON following the schema specified.";

    const promptText = `User says: "${symptomText}"
Preference Language: ${lang}
User's Biological Life-stage Focus: ${stage} Mode.
Evaluate and output JSON structure.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["symptoms", "detectedLanguage", "recommendedProducts", "remedyExplanation", "proactiveTip", "absenteeismRisk"],
          properties: {
            symptoms: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Identified standardized symptom tokens (e.g., Cramps, Hot Flash, Headache, Fatigue, Backache)."
            },
            detectedLanguage: {
              type: Type.STRING,
              description: "Two-letter language code identified ('en', 'sn', or 'nd')."
            },
            recommendedProducts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Recommended Patch It solutions and teas."
            },
            remedyExplanation: {
              type: Type.STRING,
              description: "A highly empathetic translation of symptoms and step-by-step guidance on how to make tea and use patches, completely written in " + lang + "."
            },
            proactiveTip: {
              type: Type.STRING,
              description: "Predictive, preventive health alert to prepare 48 hours in advance in " + lang + "."
            },
            absenteeismRisk: {
              type: Type.STRING,
              enum: ["high", "medium", "low"],
              description: "Absenteesim risk assessment for school/work."
            }
          }
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("Gemini API Error in symptom analyzer:", error);
    res.json(getFallbackDiagnosis(symptomText, lang, stage));
  }
});

// WHATSAPP CHAT BOT INTEGRATION SIMULATOR
app.post("/api/whatsapp-chat", async (req, res) => {
  const { sender, message, language = "en" } = req.body;
  const phone = sender || "+263772001122";

  if (!db.whatsappSessions[phone]) {
    db.whatsappSessions[phone] = {
      messages: [
        { id: "init", sender: "bot", text: getWhatsAppWelcome(language), timestamp: new Date(Date.now() - 3600000).toISOString() }
      ],
      language
    };
  }

  const session = db.whatsappSessions[phone];
  
  // Push user message
  const userMsg = {
    id: "user-" + Date.now(),
    sender: "user",
    text: message,
    timestamp: new Date().toISOString()
  };
  session.messages.push(userMsg);

  // Trigger AI evaluation or Rule-based response to reply in correct WhatsApp style
  const ai = getGemini();
  let replyText = "";
  let detectedSymptomTokens: string[] = [];
  let isPainSpikeDetected = false;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Respond as the helpful Patch It WhatsApp AI BOT ('Mwari weUnyanzvi' / Sister Companion).
User message: "${message}"
Language preference: ${session.language} (English, Shona or Ndebele).
Respond in a friendly, concise, WhatsApp-friendly manner (use short paragraphs, maybe 1-2 bullet points max, no unnecessary preamble). Broken down/taboo-deflating language. 
IMPORTANT: If they log/describe physical pain (cramps, hot flashes, fever, headache, backache), end the message with a trigger array string like: "[DETECTED_SYMPTOMS: Cramps, Headaches]" so we can register it automatically in the dashboard.`,
      });

      replyText = response.text || "";
      
      // Look for [DETECTED_SYMPTOMS: ...]
      const regex = /\[DETECTED_SYMPTOMS:\s*(.*?)\]/i;
      const match = replyText.match(regex);
      if (match) {
        isPainSpikeDetected = true;
        detectedSymptomTokens = match[1].split(",").map(s => s.trim());
        replyText = replyText.replace(regex, "").trim();
      }
    } catch {
      replyText = getWhatsAppFallbackReply(message, session.language);
    }
  } else {
    replyText = getWhatsAppFallbackReply(message, session.language);
    if (message.toLowerCase().includes("pain") || message.toLowerCase().includes("kurwadza") || message.toLowerCase().includes("kupisa")) {
      isPainSpikeDetected = true;
      detectedSymptomTokens = ["Cramps"];
    }
  }

  const botMsg = {
    id: "bot-" + Date.now(),
    sender: "bot",
    text: replyText,
    timestamp: new Date().toISOString()
  };
  session.messages.push(botMsg);

  // If pain spike detected, auto-inject into unified DB records
  if (isPainSpikeDetected) {
    db.records.push({
      id: "rec-wa-" + Date.now(),
      timestamp: new Date().toISOString(),
      intensity: 6,
      symptomText: message,
      symptoms: detectedSymptomTokens.length > 0 ? detectedSymptomTokens : ["General Pain"],
      products: ["Zumbani Tea", "Transdermal Patch"],
      channel: "whatsapp",
      absenteeism: false,
      lifeStage: "cycle"
    });
  }

  res.json({
    sessionKey: phone,
    messages: session.messages,
    records: db.records
  });
});

// STATEFUL USSD MENU SIMULATOR (*123#)
app.post("/api/ussd", (req, res) => {
  const { sessionKey = "test-session", userInput, language = "en" } = req.body;

  if (!db.ussdSessions[sessionKey]) {
    db.ussdSessions[sessionKey] = {
      menuPath: "lang_select",
      language: "en"
    };
  }

  const session = db.ussdSessions[sessionKey];
  let responseText = "";
  let isPromptFinished = false;

  // Flow State Machine
  // 1. Language Selection
  if (session.menuPath === "lang_select") {
    if (!userInput) {
      responseText = "CON Welcome to Patch It Wellness Mobile!\n1. English\n2. Shona (ChiShona)\n3. Ndebele (isiNdebele)";
    } else {
      if (userInput === "1") session.language = "en";
      else if (userInput === "2") session.language = "sn";
      else if (userInput === "3") session.language = "nd";
      else session.language = "en"; // Default

      session.menuPath = "main_menu";
      responseText = getUssdMainMenu(session.language);
    }
  } 
  // 2. Main Menu Actions
  else if (session.menuPath === "main_menu") {
    if (userInput === "1") {
      session.menuPath = "log_intensity";
      responseText = getUssdLogIntensityPrompt(session.language);
    } else if (userInput === "2") {
      session.menuPath = "order_status";
      responseText = getUssdOrderStatus(session.language);
      isPromptFinished = true;
    } else if (userInput === "3") {
      session.menuPath = "absenteeism_log";
      responseText = getUssdAbsenteeismPrompt(session.language);
    } else if (userInput === "4") {
      session.menuPath = "emergency_cooling";
      responseText = getUssdEmergencyResponse(session.language);
      isPromptFinished = true;

      // Log an automatic menopause hot flash to the database
      db.records.push({
        id: "rec-ussd-" + Date.now(),
        timestamp: new Date().toISOString(),
        intensity: 8,
        symptomText: "USSD Emergency Hot Flash Logged",
        symptoms: ["Hot Flash"],
        products: ["Cooling Belt"],
        channel: "ussd",
        absenteeism: false,
        lifeStage: "balance"
      });
    } else {
      responseText = "CON Invalid input.\n" + getUssdMainMenu(session.language);
    }
  }
  // 3. Submenus
  else if (session.menuPath === "log_intensity") {
    const level = Number(userInput);
    if (isNaN(level) || level < 1 || level > 10) {
      responseText = "CON Please enter a valid number between 1 and 10:";
    } else {
      session.tempPainIntensity = level;
      session.menuPath = "log_symptom";
      responseText = getUssdSymptomsPrompt(session.language);
    }
  }
  else if (session.menuPath === "log_symptom") {
    let sym = "General Pain";
    if (userInput === "1") sym = "Cramps";
    else if (userInput === "2") sym = "Headache";
    else if (userInput === "3") sym = "Hot Flash";
    else if (userInput === "4") sym = "Backache";

    const intensity = session.tempPainIntensity || 5;
    
    // Save to DB
    const newRecord = {
      id: "rec-ussd-" + Date.now(),
      timestamp: new Date().toISOString(),
      intensity,
      symptomText: `USSD Log: Intensity ${intensity}, Symptom ${sym}`,
      symptoms: [sym],
      products: sym === "Cramps" ? ["Transdermal Patch", "Zumbani Tea"] : ["Heating Belt"],
      channel: "ussd",
      absenteeism: false,
      lifeStage: sym === "Hot Flash" ? "balance" : "cycle"
    };
    db.records.push(newRecord);

    responseText = getUssdLogSuccess(session.language, sym);
    isPromptFinished = true;
  }
  else if (session.menuPath === "absenteeism_log") {
    const choice = userInput;
    const isAbsent = choice === "1";

    db.records.push({
      id: "rec-ussd-abs-" + Date.now(),
      timestamp: new Date().toISOString(),
      intensity: 5,
      symptomText: isAbsent ? "USSD School Absenteeism Logged (Missed Day)" : "USSD Absenteeism Tracking - Attended School",
      symptoms: ["Cramps"],
      products: ["Transdermal Patch"],
      channel: "ussd",
      absenteeism: isAbsent,
      lifeStage: "cycle"
    });

    responseText = getUssdAbsenteeismSuccess(session.language);
    isPromptFinished = true;
  }

  // If prompt is completely finished, reset state so next time dials starts fresh
  if (isPromptFinished) {
    db.ussdSessions[sessionKey] = {
      menuPath: "lang_select",
      language: session.language
    };
    responseText = "END " + responseText;
  }

  res.json({
    text: responseText,
    sessionState: db.ussdSessions[sessionKey],
    records: db.records
  });
});

// ECO-COMMERCE TRANSACTIONS & GROW DASHBOARD (EcoCash, InnBucks, ZIPIT)
app.post("/api/purchase", (req, res) => {
  try {
    const { productId, productName, priceUSD, paymentMethod, phoneNumber } = req.body;

    const newOrder = {
      id: "ord-" + Date.now(),
      productName,
      priceUSD: Number(priceUSD),
      timestamp: new Date().toISOString(),
      status: "Processing Payment with " + paymentMethod,
      paymentMethod,
      phoneNumber: phoneNumber || ""
    };

    db.orders.push(newOrder);

    // Business Logic: Buy-One-Gift-One!
    // Increment stats
    db.impactStats.subscriberCount += 1;
    // Each subscriber purchase funds distributing 6 free pain packages to rural schools!
    db.impactStats.distributedFreeCount += 6;
    db.impactStats.fundsMobilizedUSD += Number(priceUSD);

    res.status(201).json({
      success: true,
      order: newOrder,
      impactStats: db.impactStats
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// ======================================
// HELPER TRANSLATION METHODS
// ======================================

function getFallbackDiagnosis(text: string, language: string, stage: string) {
  const normText = text.toLowerCase();
  let symptoms: string[] = ["Cramps"];
  let products: string[] = ["Transdermal Patch", "Zumbani Tea"];
  let risk = "medium";

  if (normText.includes("kupisa") || normText.includes("sweat") || normText.includes("flash")) {
    symptoms = ["Hot Flash"];
    products = ["Cooling Belt", "Makoni Tea"];
    risk = "low";
  } else if (normText.includes("musana") || normText.includes("back")) {
    symptoms = ["Backache"];
    products = ["Heating Belt"];
  } else if (normText.includes("head") || normText.includes("musoro")) {
    symptoms = ["Headache"];
    products = ["Makoni Tea"];
  }

  const translations = {
    en: {
      remedy: `We detected ${symptoms.join(", ")}. Comfort Guidelines: Apply your Patch It Transdermal Patch onto clean skin behind the pelvic area for continuous 12-hour relief. Ensure you drink freshly brewed hot Zumbani Tea to alleviate core cramping and minimize stress. Use your custom Heating Belt for a maximum of 20 minutes to prevent skin irritation.`,
      proactive: "Your high-pain period is approaching in exactly 48 hours. Please verify your Patch It subscription and brew a cup of warm Zumbani Tea tonight.",
    },
    sn: {
      remedy: `Kupimwa: Taona dambudziko re${symptoms.join(", ")}. Matanho Ekuzorodza: Isa Patch It Chigamba panzvimbo yakacheneswa rezasi pemusana kwemaawa gumi nemaviri. Inwa mukombe weZumbani Inopisa doro rinogadzirwa nenzira yechinyakare kudzikisa marwadzo. Shandisa Bhandi Rako rinoisa madziya kwemaminetsi makumi maviri chete kuti usakuvadza ganda rako.`,
      proactive: "Mutsa wekutambura kwako uri kusvika muawa makumi mana nemasere. Enda unozora mafuta panzvimbo kana chinja zvigamba zvako mazuva asati asvika.",
    },
    nd: {
      remedy: `Kuhloliwe: Sifumane ubuhhlungu be${symptoms.join(", ")}. Amanyathelo Okukhulula Ubuhlungu: Faka isichibi sePatch It emzimbeni ogcotshwe kahle ngehora le-12 ukuze uphelise ubuhlungu. Hlanza inkomishi yetiye yeZumbani eshisayo uze usebenzise ibhanti lokushisa kwemizuzu engu-20 kuphela.`,
      proactive: "Ubunzima bemizwa buguquka emasontweni amabili azayo. Lungiselela amaphakethe akho usebenzise amayezi omdabu weZumbani lamuhla kusihlwa.",
    }
  };

  const t = translations[language as "en" | "sn" | "nd"] || translations.en;

  return {
    symptoms,
    detectedLanguage: language,
    recommendedProducts: products,
    remedyExplanation: t.remedy,
    proactiveTip: t.proactive,
    absenteeismRisk: risk
  };
}

function getWhatsAppWelcome(language: string): string {
  const welcomes = {
    en: "Salibonani / Mhoro! Welcome to your Patch It Wellness Helper. Log symptons, ask reproductive health questions secretly, or order patches here.",
    sn: "Mhoro! Mauya kuPatch It WhatsApp Helper. Unogona kunyora kusanzwa zvakanaka kwemuviri, kubvunza mibvunzo yehutano hwemadzimai pachivande, kana kuodha zvigamba zvedu pano.",
    nd: "Salibonani! Wamukelekile ku-Patch It WhatsApp Helper. Ungabhala ubuhlungu bomzimba, ubuze imibuzo yezempilakahle yabesifazana ngasese, kumbe u-ode izichibi zethu lapha."
  };
  return welcomes[language as "en" | "sn" | "nd"] || welcomes.en;
}

function getWhatsAppFallbackReply(message: string, language: string): string {
  const norm = message.toLowerCase();
  if (language === "sn") {
    if (norm.includes("kurwadza") || norm.includes("musana") || norm.includes("dumbe")) {
      return "Zvine urombo, ndanzwa nezve marwadzo. Tinokukurudzira kuisa chigamba (Patch It Transdermal Patch) kana bhandi remadziya. Inwawo yetiye yeZumbani ino pisa kuti marwadzo amire. Cherechedza kuti marwadzo aya anyoreswa mudatabase yedu.";
    }
    return "Ndatenda nemashoko ako. Iyo Patch It AI iri kuongorora hutano hwako. Iva nechokwadi chekunwa Zumbani kana Makoni tea mazuva ano!";
  } else if (language === "nd") {
    if (norm.includes("buhlungu") || norm.includes("isihlabo") || norm.includes("sisu")) {
      return "Ngozi enkulu, ngizwile ngobuhlungu bakho. Sebenzisa izichibi ze-Patch It kumbe inkomishi yetiye yeZumbani. Ubuhlungu bakho bugcinwe kudatabase yethu ukuze sikusize.";
    }
    return "Siyabonga ngomyalezo wakho. I-Patch It AI izakuphendula masinyane. Ungeza utiye lweZumbani nxa ubuhlungu buqala.";
  } else {
    if (norm.includes("pain") || norm.includes("cramps") || norm.includes("ache")) {
      return "I'm sorry to hear that you are experiencing pain. Apply a Patch It slow-release transdermal patch for 12 hours of relief and brew deep Zumbani Herb Tea. I've logged this symptom instance in your unified calendar pipeline.";
    }
    return "Thank you for reaching out. Please stay warm. Let me know if you would like to log localized pain, inspect school absenteeism correlations, or request Makoni herbal instructions.";
  }
}

function getUssdMainMenu(language: string): string {
  const menus = {
    en: "CON Patch It Unified Menu:\n1. Log Pain (1-10)\n2. Refill Order Status\n3. Log Absenteeism\n4. Menopause Emergency Hot Flash",
    sn: "CON Patch It Sarudzo:\n1. Nyora Marwadzo (1-10)\n2. Tarisa Refill Yako\n3. Nyora reKusara kuChikoro\n4. Emergency Hot Flash weMenopause",
    nd: "CON Patch It Khetha:\n1. Bhala Ubuhlungu (1-10)\n2. Kuhlola i-Refill yakho\n3. Isikolo Esilahlekileyo\n4. Emergency Hot Flash weMenopause"
  };
  return menus[language as "en" | "sn" | "nd"] || menus.en;
}

function getUssdLogIntensityPrompt(language: string): string {
  const prompts = {
    en: "CON Enter current pain intensity scale (1 is mild, 10 is severe):",
    sn: "CON Isa simba remarwadzo mu scale 1 kusvika 10 (1 idiki, 10 isimba kwazvo):",
    nd: "CON Faka amandla obuhlungu phakathi kuka 1 lo 10 (1 kuncane, 10 kubuhlungu kakhulu):"
  };
  return prompts[language as "en" | "sn" | "nd"] || prompts.en;
}

function getUssdSymptomsPrompt(language: string): string {
  const prompts = {
    en: "CON Select your main symptom:\n1. Cramps (Menstruation)\n2. Headache / Fatigue\n3. Hot Flash\n4. Lower Back Pain",
    sn: "CON Sarudza dambudziko guru:\n1. Marumbo emusi (Cramps)\n2. Musoro / Kuneta\n3. Kudziya Muviri (Hot Flash)\n4. Musana Kurwadza",
    nd: "CON Khetha isibonakaliso esikhulu:\n1. Ubuhlungu besikhathi\n2. Ikhanda / Ukuneta\n3. Ukutshisa komzimba\n4. Ubuhlungu bomsana"
  };
  return prompts[language as "en" | "sn" | "nd"] || prompts.en;
}

function getUssdLogSuccess(language: string, symptom: string): string {
  const texts = {
    en: `Thank you. Logged ${symptom} successfully in unified database. Drink warm Zumbani Tea and apply Patch It. Stay safe.`,
    sn: `Maita basa. Tanyora dambudziko re ${symptom} mu database. Inwa tiye yeZumbani, namira chigamba chedu. Mirai zvakanaka.`,
    nd: `Siyabonga. Sibhale ${symptom} kudatabase. Inwa itiye yeZumbani, ufake isichibi somzimba. Sala kuhle.`
  };
  return texts[language as "en" | "sn" | "nd"] || texts.en;
}

function getUssdOrderStatus(language: string): string {
  const texts = {
    en: "Order Status: Paid via EcoCash. 1x Transdermal Patches Subscription is PACKED at Harare Logistics Hub. Distribution funds 6 free rural units.",
    sn: "Zvekuodha: Tabhadharwa neEcoCash. Zvigamba zvenyu zviri kuHarare Hub zvakapakwa. Odha iyi inotumira mapakeji matanhatu kuve dze rural.",
    nd: "Konke o-ode: Isikhwama se-EcoCash silungisiwe. Izichibi zilungiswe eHarare Hub. Lokhu kunikeza abantwana basesigabeni esingaphandle amaphakethe angu-6."
  };
  return texts[language as "en" | "sn" | "nd"] || texts.en;
}

function getUssdAbsenteeismPrompt(language: string): string {
  const prompts = {
    en: "CON Did pain prevent you from attending school or work today?\n1. Yes\n2. No",
    sn: "CON Ko kuzvimba kurwadza uku kuita kuti usare kuchikoro kana kubasa nhasi?\n1. Ehe, ndasara kumba\n2. Kwete, ndaenda",
    nd: "CON Kambe kukulimaza kubangele ukuthi uphuthe isikolo kumbe umsebenzi lamuhla?\n1. Yebo\n2. Hatshi"
  };
  return prompts[language as "en" | "sn" | "nd"] || prompts.en;
}

function getUssdAbsenteeismSuccess(language: string): string {
  const successes = {
    en: "Thank you for logging. We've recorded this. A predictive patch alert has been configured to secure your attendance next cycle.",
    sn: "Ndatenda nekunyora. Tanyora izvi pachivande. Takurongerai alarm yekukumbusai chinjo dzechigamba kuitira chikoro cycle inotevera.",
    nd: "Siyabonga ngokubhala. Siyigcinile imininingwane. Lungiselela amaphakethe mazuva amabili ngaphambili isikhathi esizayo."
  };
  return successes[language as "en" | "sn" | "nd"] || successes.en;
}

function getUssdEmergencyResponse(language: string): string {
  const replies = {
    en: "Emergency Hot Flash Logged. Cooling insert protocol: Grab Cold Belt, drink iced Makoni Tea, rest in shade immediately. System updated.",
    sn: "Zvakanyorwa muDatabase. Maitiro ekutonhodza muviri: Tora Bhandi rako reCooling, inwa Makoni tea inotonhora, chizorora mumumvuri izvozvi.",
    nd: "Kubhaliwe. Umthetho wokudambisa ukutshisa komzimba: Thatha isichibi esi-Cooling sebhanti, inwa itiye yeMakoni, ziphumulele kancane khathesi."
  };
  return replies[language as "en" | "sn" | "nd"] || replies.en;
}


// ======================================
// 2. VITE MIDDLEWARE SETUP
// ======================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // Mount Vite middleware after the backend API endpoints
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer();
