import { 
  ThreatType, 
  ThreatStatus, 
  RuleViolationType, 
  SocialCareCategory, 
  UrgencyLevel 
} from '@/types';

export interface AIAnalysisResult {
  isSecurityThreat: boolean;
  securityThreatType?: ThreatType;
  securityRiskLevel?: ThreatStatus;
  securityAnalysis?: string;
  securityActionSuggested?: 'NONE' | 'REPORTED_ADMIN' | 'MESSAGE_DELETED';

  isRuleViolation: boolean;
  ruleViolationType?: RuleViolationType;
  moderationConfidence?: number;
  moderationAnalysis?: string;
  suggestedModerationAction?: 'NO_ACTION' | 'WARNED_PRIVATELY' | 'SANCTIONED';

  isSocialCareNeeded: boolean;
  socialCareCategory?: SocialCareCategory;
  socialCareUrgency?: UrgencyLevel;
  socialCareSummary?: string;
  socialCareExcerpt?: string;

  rawExplanation: string;
}

const SRJ_SYSTEM_PROMPT = `
Anda adalah AI Security, Moderator, dan Social Care Guardian untuk grup WhatsApp komunitas "SUNDA RANTAU JOGJA (SRJ)".
Prinsip utama komunitas: "Silih Asah, Silih Asih, Silih Asuh, Nulung ka nu butuh Nalang ka nu Susah".
Tujuan grup adalah mempererat silaturahmi, persaudaraan, koordinasi, dan saling tolong-menolong sesama perantau asal Tanah Sunda (Jawa Barat & Banten) di Daerah Istimewa Yogyakarta.

ATURAN RESMI GRUP:
1. Dilarang Flexing (Pamer kekayaan, jabatan, barang mewah dengan nada menyombongkan diri atau merendahkan orang lain).
   PENTING: Jangan menganggap orang yang sekadar bersyukur atas kelulusan, mendapat rezeki, atau membagikan kebahagiaan wajar sebagai flexing. Periksa intonasi dan konteks.
2. Utamakan silaturahmi dan saling membantu.
3. Jaga sikap, persaudaraan, hindari kata kasar, penghinaan, perundungan, atau provokasi daerah/suku/ekonomi.
   PENTING TENTANG BAHASA SLANG: Kata seru santai pergaulan seperti "anjir", "anjiir", "njir", "anjrit" adalah ekspresi keheranan/keakraban wajar dan JANGAN PERNAH diperingatkan atau dihapus! Namun makian hewan dan ujaran kotor asli seperti "anjing", "babi", "bagong", "monyet", "kunyuk", "bangsat", "bajingan", "kontol", "memek", "pantek" HARUS ditindak tegas.
4. Dilarang spam, penipuan, promo berlebihan, hoax.
5. Saling menghargai (yang mapan jangan merendahkan yang berjuang).
6. Dilarang keras mengajak dugem/clubbing liar, mabuk/miras, judi online/slot, prostitusi/open BO, LC (Lady Companion / pemandu karaoke), maupun konten pornografi/asusila/foto vulgar yang merusak marwah paguyuban.

MISI UTAMA ANDA:
1. SECURITY: Deteksi penipuan (scam, APK undangan nikah palsu, phishing perbankan/DANA Kaget, malware, konten pornografi/asusila/foto sekali lihat vulgar/kekerasan).
   - KHUSUS FOTO / GAMBAR / VIEW ONCE: Jika media memuat ketelanjangan (nudity), pakaian transparan/sangat terbuka tak senonoh, organ intim, pose seksual vulgar, atau screenshot judi/scam, tandai sebagai "isSecurityThreat": true, "securityThreatType": "INAPPROPRIATE_MEDIA", "securityRiskLevel": "BERBAHAYA", "securityActionSuggested": "MESSAGE_DELETED".
2. MODERATION: Deteksi pelanggaran aturan grup secara adil dan objektif.
   - KHUSUS KONTEN ASUSILA & LC: Tulisan berbau "LC", "Lady Companion", "purel", "open BO", "pemandu lagu", "vcs", "bokep", "porno", "bugil", "pijat plus" HARUS langsung ditandai "isRuleViolation": true, "ruleViolationType": "INAPPROPRIATE_BEHAVIOR", "suggestedModerationAction": "SANCTIONED".
3. SOCIAL CARE: Kenali anggota rantau yang sedang kesusahan atau butuh bantuan:
   - Sedang mencari pekerjaan / info loker di Jogja.
   - Sedang sakit sendirian di kosan tanpa keluarga.
   - Mengalami kesulitan tempat tinggal / butuh kontrakan darurat.
   - Mengalami musibah / kesulitan mendesak.
   - Butuh informasi penting seputar kehidupan perantau di Jogja.

Keluarkan respon HANYA dalam format JSON valid:
{
  "isSecurityThreat": boolean,
  "securityThreatType": "PHISHING" | "MALWARE" | "SCAM" | "INAPPROPRIATE_MEDIA" | "SUSPICIOUS_LINK" | "SPAM" | "CREDENTIAL_THEFT" | null,
  "securityRiskLevel": "AMAN" | "MENCURIGAKAN" | "BERBAHAYA" | null,
  "securityAnalysis": string | null,
  "securityActionSuggested": "NONE" | "REPORTED_ADMIN" | "MESSAGE_DELETED" | null,

  "isRuleViolation": boolean,
  "ruleViolationType": "FLEXING" | "INSULT" | "PROVOCATION" | "BULLYING" | "SPAM_PROMO" | "SILIH_ASIH_BREACH" | "HOAX" | "INAPPROPRIATE_BEHAVIOR" | null,
  "moderationConfidence": number (0.0 to 1.0) | null,
  "moderationAnalysis": string | null,
  "suggestedModerationAction": "NO_ACTION" | "WARNED_PRIVATELY" | "SANCTIONED" | null,

  "isSocialCareNeeded": boolean,
  "socialCareCategory": "PEKERJAAN" | "BANTUAN_SOSIAL" | "KESEHATAN_DARURAT" | "TEMPAT_TINGGAL" | "INFORMASI_LAIN" | null,
  "socialCareUrgency": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null,
  "socialCareSummary": string | null,
  "socialCareExcerpt": string | null,

  "rawExplanation": string
}
`;

export async function analyzeContentWithGemini(
  content: string, 
  mediaBase64?: string, 
  mimeType?: string,
  geminiApiKey?: string
): Promise<AIAnalysisResult> {
  const lower = (content || '').toLowerCase();

  // Pengecualian Aman Terdepan: Format Biodata Perkenalan Anggota (Nama, Asal Lembur/Kota, Di Jogja mana)
  // Tidak boleh dianggap pelanggaran atau ancaman siber (misal nama 'Toto Budiarto', 'Judi', dsb bukan judol)
  const isBiodataIntro = /\b(nama|asal\s*lembur|asal\s*kota|di\s*jogjana?)\s*[:=]/i.test(lower) || /•\s*nama/i.test(lower);
  if (isBiodataIntro && !/https?:\/\/[^\s]+/i.test(content)) {
    return {
      isSecurityThreat: false,
      isRuleViolation: false,
      isSocialCareNeeded: false,
      rawExplanation: 'Format biodata perkenalan anggota paguyuban yang sah dan aman.'
    };
  }

  const apiKey = geminiApiKey || process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim().length > 10) {
    try {
      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
        { text: `${SRJ_SYSTEM_PROMPT}\n\nPESAN YANG HARUS DIANALISIS:\n"${content}"` }
      ];

      if (mediaBase64 && mimeType) {
        parts.push({
          inlineData: {
            mimeType,
            data: mediaBase64
          }
        });
      }

      // Model candidates with fallback
      const candidateModels = ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-2.5-flash'];
      let candidateText = '';

      for (const model of candidateModels) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: AbortSignal.timeout(3500),
              body: JSON.stringify({
                contents: [{ parts }],
                generationConfig: {
                  responseMimeType: 'application/json',
                  temperature: 0.1
                }
              })
            }
          );

          if (response.ok) {
            const data = await response.json();
            candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (candidateText) break;
          }
        } catch (e) {
          // Continue to next candidate
        }
      }

      if (candidateText) {
        const parsed = JSON.parse(candidateText);
        return {
          isSecurityThreat: Boolean(parsed.isSecurityThreat),
          securityThreatType: parsed.securityThreatType || undefined,
          securityRiskLevel: parsed.securityRiskLevel || undefined,
          securityAnalysis: parsed.securityAnalysis || '',
          securityActionSuggested: parsed.securityActionSuggested || 'NONE',

          isRuleViolation: Boolean(parsed.isRuleViolation),
          ruleViolationType: parsed.ruleViolationType || undefined,
          moderationConfidence: parsed.moderationConfidence || 0,
          moderationAnalysis: parsed.moderationAnalysis || '',
          suggestedModerationAction: parsed.suggestedModerationAction || 'NO_ACTION',

          isSocialCareNeeded: Boolean(parsed.isSocialCareNeeded),
          socialCareCategory: parsed.socialCareCategory || undefined,
          socialCareUrgency: parsed.socialCareUrgency || undefined,
          socialCareSummary: parsed.socialCareSummary || '',
          socialCareExcerpt: parsed.socialCareExcerpt || '',

          rawExplanation: parsed.rawExplanation || 'Analisis AI Gemini berhasil diproses.'
        };
      }
    } catch (err) {
      console.error('[AI] Gemini API exception:', err);
    }
  }

  // High-performance intelligent heuristic rule analyzer (Grounding & Fallback)
  return runHeuristicIntelligence(content, mediaBase64);
}

function runHeuristicIntelligence(text: string, hasMedia?: string): AIAnalysisResult {
  const lower = text.toLowerCase();

  // Pengecualian Aman: Format Biodata Perkenalan (Nama, Asal Lembur, Domisili Jogja)
  // Tidak boleh dianggap sebagai pelanggaran moderasi (misal nama 'Toto Budiarto' bukan judi online)
  const isBiodataIntro = /\b(nama|asal\s*lembur|asal\s*kota|di\s*jogjana?)\s*[:=]/i.test(lower) || /•\s*nama/i.test(lower);
  if (isBiodataIntro && !/https?:\/\/[^\s]+/i.test(text)) {
    return {
      isSecurityThreat: false,
      isRuleViolation: false,
      isSocialCareNeeded: false,
      rawExplanation: 'Format biodata perkenalan anggota paguyuban yang sah dan aman.'
    };
  }

  // 1. Social Care Detection (Indonesian & Sundanese Rantau Jogja phrases)
  const isJobSeeker = /butuh (loker|kerja|pekerjaan|padamelan)|aya info padamelan|lowongan kerja jogja|serabutan|supir|kenek|pelayan|nganggur/i.test(lower);
  const isHealthEmergency = /sakit|muriang|paranas|tiris|teu damang|teu tiasa gugah|kosan sendirian|butuh obat|puskesmas|rumah sakit sardjito|panti rapih|darurat/i.test(lower);
  const isHousing = /cari kontrakan|kosan murah|tempat tinggal|penginapan sementara|seep sasih|pindah kos/i.test(lower);
  const isSocialHardship = /butuh bantuan|nulung ka nu butuh|nalang ka nu susah|musibah|kelaparan|teu aya artos|sulit makan/i.test(lower);

  if (isHealthEmergency || isJobSeeker || isHousing || isSocialHardship) {
    let category: SocialCareCategory = 'INFORMASI_LAIN';
    let urgency: UrgencyLevel = 'MEDIUM';
    let summary = 'Anggota komunitas membutuhkan bantuan/informasi di perantauan Jogja.';

    if (isHealthEmergency) {
      category = 'KESEHATAN_DARURAT';
      urgency = 'CRITICAL';
      summary = 'Kondisi kesehatan mendesak / sakit sendirian di perantauan Jogja tanpa pendamping keluarga.';
    } else if (isJobSeeker) {
      category = 'PEKERJAAN';
      urgency = 'HIGH';
      summary = 'Membutuhkan informasi lowongan pekerjaan atau pekerjaan darurat di wilayah Yogyakarta.';
    } else if (isHousing) {
      category = 'TEMPAT_TINGGAL';
      urgency = 'MEDIUM';
      summary = 'Mencari tempat tinggal atau kontrakan terjangkau di Yogyakarta.';
    } else if (isSocialHardship) {
      category = 'BANTUAN_SOSIAL';
      urgency = 'HIGH';
      summary = 'Membutuhkan bantuan sosial atau dukungan kebutuhan pokok sesama perantau.';
    }

    return {
      isSecurityThreat: false,
      isRuleViolation: false,
      isSocialCareNeeded: true,
      socialCareCategory: category,
      socialCareUrgency: urgency,
      socialCareSummary: summary,
      socialCareExcerpt: text.length > 120 ? text.slice(0, 120) + '...' : text,
      rawExplanation: `Terdeteksi indikasi kebutuhan Social Care pada kategori ${category}. Semangat Silih Asah, Silih Asih, Silih Asuh.`
    };
  }

  // 2. Security Threat Detection (Phishing, Fake Balance/Saldo Masuk, Scams, APK Malware)
  const hasUrl = /https?:\/\/[^\s]+|www\.[^\s]+/i.test(lower);
  const isFakeBalanceOrScamReward = /(saldo.*(masuk|cair|klaim|gratis|rp)|(masuk|klaim|terima|dapat).*saldo|penarikan.*(saldo|dana)|dana kaget|danakaget|bagi.*duit|menang.*undian|hadiah.*(uang|tunai|jutaan)|bantuan.*(cair|bansos|pemerintah)|bonus.*rp|transfer.*berhasil)/i.test(lower);
  const isPhishingAction = /(klik|buka|cek|klaim).*(link|tautan|di sini|disini|web|url|situs)|link.*(klaim|penarikan|daftar|hadiah)/i.test(lower);
  const isBankPhishing = /(login|aktivasi|blokir|update|verifikasi|otp).*(bca|mandiri|bri|bni|dana|ovo|gopay|shopeepay|bank)/i.test(lower);
  const isExplicitMalware = /\.apk|\.exe|\.scr|surat tilang.*(download|unduh)|undangan.*nikah.*\.apk|paket.*(jnt|jne|sicepat).*\.apk/i.test(lower);

  const isPhishing = isExplicitMalware || 
    (hasUrl && (isFakeBalanceOrScamReward || isPhishingAction || isBankPhishing)) ||
    (isFakeBalanceOrScamReward && (isPhishingAction || /http|\.com|\.id|\.xyz|\.top/i.test(lower))) ||
    /dana kaget|danakaget|klaim saldo|gratis saldo|login bca|klik link ini/i.test(lower);

  if (isPhishing || isExplicitMalware) {
    return {
      isSecurityThreat: true,
      securityThreatType: isExplicitMalware ? 'MALWARE' : 'PHISHING',
      securityRiskLevel: 'BERBAHAYA',
      securityAnalysis: isExplicitMalware 
        ? 'Ditemukan indikasi file APK berbahaya (Trojan / Sniffing Saldo & OTP M-Banking).' 
        : 'Ditemukan modus penipuan berkedok transfer saldo masuk, hadiah, atau tautan phishing yang membahayakan rekening.',
      securityActionSuggested: 'MESSAGE_DELETED',
      isRuleViolation: false,
      isSocialCareNeeded: false,
      rawExplanation: 'Pesan tergolong ancaman siber berisiko tinggi. Wajib dihapus otomatis dan laporkan ke admin.'
    };
  }

  // 3. Judi Online / Judol Detection (Slot Gacor, Togel, Situs Judi, Zeus, Maxwin, Taruhan)
  const isJudiOnline = /\b(judol|slot|gacor|zeus|olympus|maxwin|sensational|scatter|pragmatic|togel|toto\s*macau|toto\s*gelap|bandar\s*toto|situs\s*toto|link\s*toto|sbobet|baccarat|roulette|kasino)\b|judi online|slot gacor|pola gacor|deposit pulsa|depo 10k|depo 20k|depo 25k|depo 50k|link slot|situs slot|bandar togel|toto macau|togel hk|togel sgp|agen slot|rtp live|rtp slot|link gacor|taruhan bola|taruhan judi|main slot|daftar slot|situs judol|link judol/i.test(lower);

  if (isJudiOnline) {
    return {
      isSecurityThreat: false,
      isRuleViolation: true,
      ruleViolationType: 'JUDI_ONLINE',
      moderationConfidence: 0.98,
      moderationAnalysis: 'Pesan memuat promosi, ajakan, atau tautan perjudian online (slot gacor/judol/togel) yang melanggar hukum RI (Pasal 27 ayat 2 UU ITE) serta aturan tegas paguyuban Sunda Rantau Jogja.',
      suggestedModerationAction: 'SANCTIONED',
      isSocialCareNeeded: false,
      rawExplanation: 'Pesan tergolong promosi judi online (JUDI_ONLINE). Pesan wajib langsung dihapus dan berikan peringatan sanksi tegas di grup.'
    };
  }

  // 4. Inappropriate Behavior (LC / Lady Companion, Prostitusi, Open BO, Pornografi, Asusila, Dugem, Miras, Narkoba)
  const isPornOrLc = /\b(lc|lady\s*companion|purel|pemandu\s*lagu|pemandu\s*karaoke|open\s*bo|openbo|bo\s*include|ava\s*bo|bokingan|bispak|bispun|michat|vcs|colmek|coli|bokep|porno|bugil|telanjang|pap\s*tt|pap\s*bugil|sange|ngentot|ngewe|lendir|lonte|perek|pelacur|pijat\s*plus|spa\s*plus|massage\s*plus|therapis\s*plus)\b/i.test(lower);
  const isInappropriateBehavior = isPornOrLc || /\b(dugem|clubbing|diskotik|mabok|mabuk|miras|ciu|arak|oplosan|amer|soju|whiskey|vodka|tuak|mendem|ngablu|sabu|ganja|inex|ekstasi|sinte|trihex|tramadol|alprazolam|seks|mesum)\b|ajak dugem|ajak party|party liar|minum miras|nyekek botol|open bo|\b(ewe|entot)\b/i.test(lower);

  if (isInappropriateBehavior) {
    return {
      isSecurityThreat: isPornOrLc,
      securityThreatType: isPornOrLc ? 'INAPPROPRIATE_MEDIA' : undefined,
      securityRiskLevel: isPornOrLc ? 'BERBAHAYA' : undefined,
      securityAnalysis: isPornOrLc 
        ? 'Terdeteksi konten vulgar, pornografi, ajakan LC (Lady Companion), atau prostitusi/open BO yang dilarang keras.' 
        : undefined,
      securityActionSuggested: isPornOrLc ? 'MESSAGE_DELETED' : undefined,

      isRuleViolation: true,
      ruleViolationType: 'INAPPROPRIATE_BEHAVIOR',
      moderationConfidence: 0.98,
      moderationAnalysis: isPornOrLc
        ? 'Pesan memuat penyebutan LC (Lady Companion), ajakan asusila/open BO, atau konten vulgar/pornografi yang melanggar norma dan marwah paguyuban SRJ.'
        : 'Pesan memuat ajakan atau penyebutan hal tidak pantas (dugem/clubbing, pesta miras/mabuk, atau obat terlarang) yang merusak marwah paguyuban Sunda Rantau Jogja.',
      suggestedModerationAction: 'SANCTIONED',
      isSocialCareNeeded: false,
      rawExplanation: 'Pesan tergolong konten asusila/perilaku tidak pantas (INAPPROPRIATE_BEHAVIOR). Wajib dihapus otomatis dan berikan peringatan sanksi di grup.'
    };
  }

  // 5. Moderation (Flexing, Insult, Provocation, Swear words, Classist harassment)
  const isFlexing = /jajan.*juta|kalian yang umr|mobil baru.*kalian miskin|gaji puluhan juta.*santai|pamer.*duit|sombong|paling kaya|paling sukses|pamer kekayaan/i.test(lower);
  
  // Kata kasar, makian hewan, ujaran kotor, perundungan (Indonesia & Sunda)
  // CATATAN: 'anjir', 'anjiir', 'njir', 'anjrit' adalah kata seru slang santai dan TIDAK DIPERINGATKAN.
  // Makian hewan asli & kata kotor: anjing, babi, bagong, monyet, kunyuk, asu, bangsat, bajingan, kontol, memek, pantek, dll.
  const isInsultOrProvocation = /\b(anying|anjing|ajg|asw|asu|bangsat|bajingan|babi|babik|bagong|monyet|kunyuk|tolol|goblok|bego|bodo|bodoh|belegug|kehed|modar|sialan|kampret|brengsek|idiot|kontol|kntl|memek|mmk|pepek|itil|jembut|peler|pantek|puki|pukimak|tai|tay|jancuk|jancok|dancok|setan|kere)\b|dasar.*miskin|kaum miskin|orang miskin|merendahkan|ngajak ribut|saling menyindir|adu domba|provokasi/i.test(lower);

  if (isFlexing || isInsultOrProvocation) {
    const violation: RuleViolationType = isFlexing ? 'FLEXING' : 'INSULT';
    return {
      isSecurityThreat: false,
      isRuleViolation: true,
      ruleViolationType: violation,
      moderationConfidence: 0.92,
      moderationAnalysis: isFlexing
        ? 'Pesan mengindikasikan pamer kekayaan disertai nada merendahkan anggota lain yang sedang berjuang, melanggar Aturan 1 dan 5 grup SRJ.'
        : 'Pesan mengandung ujaran kasar, hinaan status sosial/ekonomi, atau makian yang melanggar Aturan 3 & 5 grup SRJ (kesantunan & persaudaraan Sunda).',
      suggestedModerationAction: 'WARNED_PRIVATELY',
      isSocialCareNeeded: false,
      rawExplanation: `Pesan melanggar pedoman komunitas pada kategori ${violation}. Admin disarankan meninjau secara pribadi.`
    };
  }

  // Normal Safe Message
  return {
    isSecurityThreat: false,
    isRuleViolation: false,
    isSocialCareNeeded: false,
    rawExplanation: 'Pesan wajar dalam koridor silaturahmi Sunda Rantau Jogja.'
  };
}
