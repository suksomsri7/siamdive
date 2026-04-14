import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "postgresql://siamdive:siamdive_password@localhost:5432/siamdive_db" });
const prisma = new PrismaClient({ adapter });

type Trans = {
  lang: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  itinerary: string;
  route: string;
  keywords: string[];
};

type TemplateTrans = {
  scheduleId: string;
  routeName: string;
  translations: Trans[];
};

const templates: TemplateTrans[] = [

// ═══════════════════════════════════════════════════════════════════════════
// 1. N. Andaman 4D5N — Trip #30
// ═══════════════════════════════════════════════════════════════════════════
{
  scheduleId: "cmnrmfir40000tckzp5kvsepr",
  routeName: "N. Andaman 4D5N",
  translations: [
    // ── EN ──
    {
      lang: "en",
      title: "North Andaman 4 Days 5 Nights",
      slug: "north-andaman-4d5n",
      excerpt: "Experience world-class dive site Richelieu Rock with a chance to spot manta rays at Koh Bon. 15 dives in 4 full days among the Similan and Surin Islands.",
      route: "Similan Islands — Koh Bon — Koh Tachai — Richelieu Rock — Surin Islands",
      keywords: ["Similan", "Richelieu Rock", "Koh Bon", "manta ray", "Koh Tachai", "North Andaman", "liveaboard"],
      content: `<h3>Highlights</h3>
<ul>
<li><strong>Richelieu Rock</strong> — Thailand's #1 dive site; chance to see whale sharks, seahorses, and barracuda schools</li>
<li><strong>Koh Bon</strong> — Manta ray cleaning station (Feb–Apr peak season)</li>
<li><strong>Koh Tachai Pinnacle</strong> — Underwater pinnacle covered in soft corals and schooling fish</li>
<li><strong>Similan Islands</strong> — Crystal-clear water, pristine coral reefs, stunning underwater photography</li>
<li><strong>15 dives</strong> in 4 days, small groups of 1 Divemaster : 4–5 divers</li>
</ul>

<h3>Dive Sites</h3>
<ul>
<li>Similan Islands — West of Eden, Anita's Reef, Christmas Point, Breakfast Bend</li>
<li>Koh Bon — West Ridge, Manta Cleaning Station</li>
<li>Koh Tachai — Pinnacle, Twin Peaks</li>
<li>Richelieu Rock</li>
<li>Surin Islands</li>
</ul>

<h3>Included</h3>
<ul>
<li>Air-conditioned cabin with en-suite bathroom, 4 nights</li>
<li>3 meals + snacks, fruits & unlimited soft drinks (excluding alcohol)</li>
<li>Full dive equipment (BCD, regulator, computer, wetsuit, torch, mask, fins)</li>
<li>Dive insurance</li>
<li>Dive guide, small groups (1 DM : 4–5 divers)</li>
<li>Free airport transfer: Phuket Airport ⇄ pier</li>
</ul>

<h3>Excluded</h3>
<ul>
<li>National park fees (approx. 600–900 ฿/person)</li>
<li>Alcoholic beverages</li>
<li>Nitrox (available for rent on board)</li>
<li>Tips (suggested 1,000–2,000 ฿/person)</li>
<li>Pre/post-trip accommodation</li>
<li>Personal items</li>
</ul>

<h3>Port Information</h3>
<ul>
<li><strong>Port:</strong> Chalong Pier, Phuket</li>
<li><strong>Check-in:</strong> Airport pickup 18:00–20:00</li>
<li><strong>Check-out:</strong> Airport drop-off 09:00 (recommend flights after noon)</li>
</ul>`,
      itinerary: `<h3>Day 1 — Boarding</h3>
<p>18:00–20:00 Airport pickup → Chalong Pier<br>
Check-in, equipment setup, briefing & dinner on board<br>
Depart for Similan Islands (no dives)</p>

<h3>Day 2 — Similan Islands (4 dives)</h3>
<p>07:30 Dive 1 — <strong>Anita's Reef</strong> (coral garden)<br>
10:30 Dive 2 — <strong>West of Eden</strong> (boulders, caverns, soft corals)<br>
14:00 Dive 3 — <strong>Christmas Point</strong> (swim-throughs, sharks)<br>
17:00 Dive 4 — <strong>Breakfast Bend</strong> (night dive)</p>

<h3>Day 3 — Koh Bon & Koh Tachai (4 dives)</h3>
<p>07:30 Dive 5 — <strong>Koh Bon West Ridge</strong> (manta ray chance)<br>
10:30 Dive 6 — <strong>Koh Bon Pinnacle</strong><br>
14:00 Dive 7 — <strong>Koh Tachai Pinnacle</strong> (soft corals, fish schools)<br>
17:00 Dive 8 — <strong>Koh Tachai Twin Peaks</strong></p>

<h3>Day 4 — Richelieu Rock & Surin (4 dives)</h3>
<p>07:30 Dive 9 — <strong>Richelieu Rock</strong> (seahorses, whale sharks)<br>
10:30 Dive 10 — <strong>Richelieu Rock</strong> (barracuda schools)<br>
14:00 Dive 11 — <strong>Surin Islands</strong><br>
17:00 Dive 12 — <strong>Surin Islands</strong> (sunset dive)</p>

<h3>Day 5 — Similan & Return (3 dives)</h3>
<p>07:30 Dive 13 — <strong>Koh Tachai</strong><br>
10:30 Dive 14 — <strong>Koh Bon</strong><br>
13:00 Dive 15 — <strong>Similan Islands</strong> (farewell dive)<br>
15:00 Return to pier, check-out<br>
17:00 Drop-off at Phuket Airport</p>`,
    },
    // ── CN ──
    {
      lang: "cn",
      title: "北安达曼 4天5夜",
      slug: "north-andaman-4d5n",
      excerpt: "体验世界级潜点黎塞留岩，在达琴岛邂逅蝠鲼。4天15潜，畅游斯米兰群岛和素林群岛。",
      route: "斯米兰群岛 — 达琴岛 — 塔猜岛 — 黎塞留岩 — 素林群岛",
      keywords: ["斯米兰", "黎塞留岩", "达琴岛", "蝠鲼", "塔猜岛", "北安达曼", "船宿"],
      content: `<h3>亮点</h3>
<ul>
<li><strong>黎塞留岩 (Richelieu Rock)</strong> — 泰国排名第一的潜点，有机会看到鲸鲨、海马和梭鱼群</li>
<li><strong>达琴岛 (Koh Bon)</strong> — 蝠鲼清洁站（2-4月旺季）</li>
<li><strong>塔猜岛尖峰 (Koh Tachai Pinnacle)</strong> — 水下尖峰布满软珊瑚和鱼群</li>
<li><strong>斯米兰群岛</strong> — 水清见底，珊瑚原始，水下摄影绝佳</li>
<li><strong>15潜</strong>，4天，小团1潜导：4-5潜水员</li>
</ul>

<h3>潜点</h3>
<ul>
<li>斯米兰群岛 — West of Eden、Anita's Reef、Christmas Point、Breakfast Bend</li>
<li>达琴岛 — West Ridge、蝠鲼清洁站</li>
<li>塔猜岛 — Pinnacle、Twin Peaks</li>
<li>黎塞留岩</li>
<li>素林群岛</li>
</ul>

<h3>费用包含</h3>
<ul>
<li>空调客舱，独立卫浴，4晚</li>
<li>一日三餐 + 点心水果及无限量软饮（不含酒精）</li>
<li>全套潜水装备（BCD、调节器、电脑表、湿衣、手电、面镜、脚蹼）</li>
<li>潜水保险</li>
<li>潜导带队，小团（1潜导：4-5人）</li>
<li>普吉机场 ⇄ 码头免费接送</li>
</ul>

<h3>费用不含</h3>
<ul>
<li>国家公园费（约600-900泰铢/人）</li>
<li>含酒精饮料</li>
<li>高氧 Nitrox（船上可租）</li>
<li>小费（建议1,000-2,000泰铢/人）</li>
<li>行程前后住宿</li>
<li>个人物品</li>
</ul>

<h3>码头信息</h3>
<ul>
<li><strong>码头：</strong>查龙码头 (Chalong Pier)，普吉</li>
<li><strong>登船：</strong>普吉机场接机 18:00-20:00</li>
<li><strong>离船：</strong>送至机场 09:00（建议预订中午后航班）</li>
</ul>`,
      itinerary: `<h3>第1天 — 登船</h3>
<p>18:00-20:00 机场接机 → 查龙码头<br>
办理登船、整理装备、听取简报、船上晚餐<br>
出发前往斯米兰群岛（无潜水）</p>

<h3>第2天 — 斯米兰群岛（4潜）</h3>
<p>07:30 第1潜 — <strong>Anita's Reef</strong>（珊瑚花园）<br>
10:30 第2潜 — <strong>West of Eden</strong>（巨石、洞穴、软珊瑚）<br>
14:00 第3潜 — <strong>Christmas Point</strong>（穿越泳道、鲨鱼）<br>
17:00 第4潜 — <strong>Breakfast Bend</strong>（夜潜）</p>

<h3>第3天 — 达琴岛 & 塔猜岛（4潜）</h3>
<p>07:30 第5潜 — <strong>Koh Bon West Ridge</strong>（邂逅蝠鲼）<br>
10:30 第6潜 — <strong>Koh Bon Pinnacle</strong><br>
14:00 第7潜 — <strong>Koh Tachai Pinnacle</strong>（软珊瑚、鱼群）<br>
17:00 第8潜 — <strong>Koh Tachai Twin Peaks</strong></p>

<h3>第4天 — 黎塞留岩 & 素林（4潜）</h3>
<p>07:30 第9潜 — <strong>Richelieu Rock</strong>（海马、鲸鲨）<br>
10:30 第10潜 — <strong>Richelieu Rock</strong>（梭鱼群）<br>
14:00 第11潜 — <strong>素林群岛</strong><br>
17:00 第12潜 — <strong>素林群岛</strong>（日落潜）</p>

<h3>第5天 — 斯米兰 & 返回（3潜）</h3>
<p>07:30 第13潜 — <strong>塔猜岛</strong><br>
10:30 第14潜 — <strong>达琴岛</strong><br>
13:00 第15潜 — <strong>斯米兰群岛</strong>（告别潜）<br>
15:00 返回码头，退房<br>
17:00 送至普吉机场</p>`,
    },
    // ── DE ──
    {
      lang: "de",
      title: "Nord-Andamanen 4 Tage 5 Nächte",
      slug: "nord-andamanen-4t5n",
      excerpt: "Erleben Sie den Weltklasse-Tauchplatz Richelieu Rock mit der Chance, Mantarochen am Koh Bon zu sehen. 15 Tauchgänge in 4 Tagen rund um die Similan- und Surin-Inseln.",
      route: "Similan-Inseln — Koh Bon — Koh Tachai — Richelieu Rock — Surin-Inseln",
      keywords: ["Similan", "Richelieu Rock", "Koh Bon", "Mantarochen", "Koh Tachai", "Nord-Andamanen", "Tauchsafari"],
      content: `<h3>Highlights</h3>
<ul>
<li><strong>Richelieu Rock</strong> — Thailands Tauchplatz Nr. 1; Chance auf Walhaie, Seepferdchen und Barrakudaschwärme</li>
<li><strong>Koh Bon</strong> — Mantarochen-Putzstation (Hochsaison Feb–Apr)</li>
<li><strong>Koh Tachai Pinnacle</strong> — Unterwasser-Felsnadel mit Weichkorallen und Fischschwärmen</li>
<li><strong>Similan-Inseln</strong> — Kristallklares Wasser, unberührte Korallenriffe</li>
<li><strong>15 Tauchgänge</strong> in 4 Tagen, Kleingruppen 1 Divemaster : 4–5 Taucher</li>
</ul>

<h3>Tauchplätze</h3>
<ul>
<li>Similan-Inseln — West of Eden, Anita's Reef, Christmas Point, Breakfast Bend</li>
<li>Koh Bon — West Ridge, Manta Cleaning Station</li>
<li>Koh Tachai — Pinnacle, Twin Peaks</li>
<li>Richelieu Rock</li>
<li>Surin-Inseln</li>
</ul>

<h3>Inklusive</h3>
<ul>
<li>Klimatisierte Kabine mit eigenem Bad, 4 Nächte</li>
<li>3 Mahlzeiten + Snacks, Obst & unbegrenzt Softdrinks (ohne Alkohol)</li>
<li>Komplette Tauchausrüstung (BCD, Regler, Computer, Neoprenanzug, Lampe, Maske, Flossen)</li>
<li>Tauchversicherung</li>
<li>Tauchguide, Kleingruppen (1 DM : 4–5 Taucher)</li>
<li>Kostenloser Flughafentransfer: Phuket Airport ⇄ Hafen</li>
</ul>

<h3>Exklusive</h3>
<ul>
<li>Nationalparkgebühren (ca. 600–900 ฿/Person)</li>
<li>Alkoholische Getränke</li>
<li>Nitrox (an Bord mietbar)</li>
<li>Trinkgeld (empfohlen 1.000–2.000 ฿/Person)</li>
<li>Unterkunft vor/nach der Tour</li>
<li>Persönliche Gegenstände</li>
</ul>

<h3>Hafeninformation</h3>
<ul>
<li><strong>Hafen:</strong> Chalong Pier, Phuket</li>
<li><strong>Check-in:</strong> Flughafenabholung 18:00–20:00</li>
<li><strong>Check-out:</strong> Flughafentransfer 09:00 (Flüge nach Mittag empfohlen)</li>
</ul>`,
      itinerary: `<h3>Tag 1 — Einschiffung</h3>
<p>18:00–20:00 Abholung vom Flughafen → Chalong Pier<br>
Check-in, Ausrüstung einrichten, Briefing & Abendessen an Bord<br>
Abfahrt zu den Similan-Inseln (keine Tauchgänge)</p>

<h3>Tag 2 — Similan-Inseln (4 Tauchgänge)</h3>
<p>07:30 TG 1 — <strong>Anita's Reef</strong> (Korallengarten)<br>
10:30 TG 2 — <strong>West of Eden</strong> (Felsen, Höhlen, Weichkorallen)<br>
14:00 TG 3 — <strong>Christmas Point</strong> (Durchschwimmstellen, Haie)<br>
17:00 TG 4 — <strong>Breakfast Bend</strong> (Nachttauchgang)</p>

<h3>Tag 3 — Koh Bon & Koh Tachai (4 Tauchgänge)</h3>
<p>07:30 TG 5 — <strong>Koh Bon West Ridge</strong> (Mantarochen-Chance)<br>
10:30 TG 6 — <strong>Koh Bon Pinnacle</strong><br>
14:00 TG 7 — <strong>Koh Tachai Pinnacle</strong> (Weichkorallen, Fischschwärme)<br>
17:00 TG 8 — <strong>Koh Tachai Twin Peaks</strong></p>

<h3>Tag 4 — Richelieu Rock & Surin (4 Tauchgänge)</h3>
<p>07:30 TG 9 — <strong>Richelieu Rock</strong> (Seepferdchen, Walhaie)<br>
10:30 TG 10 — <strong>Richelieu Rock</strong> (Barrakudaschwärme)<br>
14:00 TG 11 — <strong>Surin-Inseln</strong><br>
17:00 TG 12 — <strong>Surin-Inseln</strong> (Sonnenuntergangs-Tauchgang)</p>

<h3>Tag 5 — Similan & Rückkehr (3 Tauchgänge)</h3>
<p>07:30 TG 13 — <strong>Koh Tachai</strong><br>
10:30 TG 14 — <strong>Koh Bon</strong><br>
13:00 TG 15 — <strong>Similan-Inseln</strong> (Abschieds-Tauchgang)<br>
15:00 Rückfahrt zum Hafen, Check-out<br>
17:00 Transfer zum Flughafen Phuket</p>`,
    },
    // ── FR ──
    {
      lang: "fr",
      title: "Andaman Nord 4 Jours 5 Nuits",
      slug: "andaman-nord-4j5n",
      excerpt: "Découvrez le site de plongée de renommée mondiale Richelieu Rock et observez les raies manta à Koh Bon. 15 plongées en 4 jours parmi les îles Similan et Surin.",
      route: "Îles Similan — Koh Bon — Koh Tachai — Richelieu Rock — Îles Surin",
      keywords: ["Similan", "Richelieu Rock", "Koh Bon", "raie manta", "Koh Tachai", "Andaman Nord", "croisière plongée"],
      content: `<h3>Points forts</h3>
<ul>
<li><strong>Richelieu Rock</strong> — Site de plongée n°1 de Thaïlande ; requin-baleine, hippocampes et bancs de barracudas</li>
<li><strong>Koh Bon</strong> — Station de nettoyage des raies manta (saison fév–avr)</li>
<li><strong>Koh Tachai Pinnacle</strong> — Pic sous-marin couvert de coraux mous et bancs de poissons</li>
<li><strong>Îles Similan</strong> — Eau cristalline, récifs coralliens préservés</li>
<li><strong>15 plongées</strong> en 4 jours, petits groupes 1 guide : 4–5 plongeurs</li>
</ul>

<h3>Sites de plongée</h3>
<ul>
<li>Îles Similan — West of Eden, Anita's Reef, Christmas Point, Breakfast Bend</li>
<li>Koh Bon — West Ridge, Manta Cleaning Station</li>
<li>Koh Tachai — Pinnacle, Twin Peaks</li>
<li>Richelieu Rock</li>
<li>Îles Surin</li>
</ul>

<h3>Inclus</h3>
<ul>
<li>Cabine climatisée avec salle de bain privée, 4 nuits</li>
<li>3 repas + collations, fruits & boissons non alcoolisées à volonté</li>
<li>Équipement de plongée complet (BCD, détendeur, ordinateur, combinaison, lampe, masque, palmes)</li>
<li>Assurance plongée</li>
<li>Guide de plongée, petits groupes (1 DM : 4–5 plongeurs)</li>
<li>Transfert aéroport gratuit : Aéroport de Phuket ⇄ port</li>
</ul>

<h3>Non inclus</h3>
<ul>
<li>Frais de parc national (env. 600–900 ฿/personne)</li>
<li>Boissons alcoolisées</li>
<li>Nitrox (disponible en location à bord)</li>
<li>Pourboires (suggéré 1 000–2 000 ฿/personne)</li>
<li>Hébergement avant/après le voyage</li>
<li>Effets personnels</li>
</ul>

<h3>Informations portuaires</h3>
<ul>
<li><strong>Port :</strong> Chalong Pier, Phuket</li>
<li><strong>Embarquement :</strong> Transfert aéroport 18h00–20h00</li>
<li><strong>Débarquement :</strong> Transfert aéroport 09h00 (vols après midi recommandés)</li>
</ul>`,
      itinerary: `<h3>Jour 1 — Embarquement</h3>
<p>18h00–20h00 Transfert aéroport → Chalong Pier<br>
Enregistrement, installation du matériel, briefing & dîner à bord<br>
Départ vers les îles Similan (pas de plongée)</p>

<h3>Jour 2 — Îles Similan (4 plongées)</h3>
<p>07h30 Plongée 1 — <strong>Anita's Reef</strong> (jardin de corail)<br>
10h30 Plongée 2 — <strong>West of Eden</strong> (rochers, grottes, coraux mous)<br>
14h00 Plongée 3 — <strong>Christmas Point</strong> (passages, requins)<br>
17h00 Plongée 4 — <strong>Breakfast Bend</strong> (plongée de nuit)</p>

<h3>Jour 3 — Koh Bon & Koh Tachai (4 plongées)</h3>
<p>07h30 Plongée 5 — <strong>Koh Bon West Ridge</strong> (chance de raie manta)<br>
10h30 Plongée 6 — <strong>Koh Bon Pinnacle</strong><br>
14h00 Plongée 7 — <strong>Koh Tachai Pinnacle</strong> (coraux mous, bancs de poissons)<br>
17h00 Plongée 8 — <strong>Koh Tachai Twin Peaks</strong></p>

<h3>Jour 4 — Richelieu Rock & Surin (4 plongées)</h3>
<p>07h30 Plongée 9 — <strong>Richelieu Rock</strong> (hippocampes, requins-baleines)<br>
10h30 Plongée 10 — <strong>Richelieu Rock</strong> (bancs de barracudas)<br>
14h00 Plongée 11 — <strong>Îles Surin</strong><br>
17h00 Plongée 12 — <strong>Îles Surin</strong> (plongée au coucher du soleil)</p>

<h3>Jour 5 — Similan & Retour (3 plongées)</h3>
<p>07h30 Plongée 13 — <strong>Koh Tachai</strong><br>
10h30 Plongée 14 — <strong>Koh Bon</strong><br>
13h00 Plongée 15 — <strong>Îles Similan</strong> (plongée d'adieu)<br>
15h00 Retour au port, check-out<br>
17h00 Transfert à l'aéroport de Phuket</p>`,
    },
    // ── RU ──
    {
      lang: "ru",
      title: "Северный Андаман 4 дня 5 ночей",
      slug: "severnyj-andaman-4d5n",
      excerpt: "Погрузитесь на дайв-сайте мирового класса Ришелье Рок и встретьте мант на Ко Бон. 15 погружений за 4 дня среди Симиланских и Суринских островов.",
      route: "Симиланские острова — Ко Бон — Ко Тачай — Ришелье Рок — Суринские острова",
      keywords: ["Симиланы", "Ришелье Рок", "Ко Бон", "манта", "Ко Тачай", "Северный Андаман", "дайв-сафари"],
      content: `<h3>Особенности</h3>
<ul>
<li><strong>Ришелье Рок</strong> — дайв-сайт №1 в Таиланде; шанс увидеть китовых акул, морских коньков и стаи барракуд</li>
<li><strong>Ко Бон</strong> — станция очистки мант (пик сезона фев–апр)</li>
<li><strong>Ко Тачай Пиннакл</strong> — подводная скала с мягкими кораллами и косяками рыб</li>
<li><strong>Симиланские острова</strong> — кристально чистая вода, нетронутые коралловые рифы</li>
<li><strong>15 погружений</strong> за 4 дня, малые группы 1 дайвмастер : 4–5 дайверов</li>
</ul>

<h3>Дайв-сайты</h3>
<ul>
<li>Симиланские острова — West of Eden, Anita's Reef, Christmas Point, Breakfast Bend</li>
<li>Ко Бон — West Ridge, Manta Cleaning Station</li>
<li>Ко Тачай — Pinnacle, Twin Peaks</li>
<li>Ришелье Рок</li>
<li>Суринские острова</li>
</ul>

<h3>Включено</h3>
<ul>
<li>Каюта с кондиционером и собственной ванной, 4 ночи</li>
<li>3-разовое питание + снеки, фрукты и безлимитные безалкогольные напитки</li>
<li>Полный комплект снаряжения (BCD, регулятор, компьютер, гидрокостюм, фонарь, маска, ласты)</li>
<li>Страховка дайвинга</li>
<li>Дайв-гид, малые группы (1 DM : 4–5 человек)</li>
<li>Бесплатный трансфер: аэропорт Пхукета ⇄ пирс</li>
</ul>

<h3>Не включено</h3>
<ul>
<li>Сборы национального парка (прим. 600–900 ฿/чел.)</li>
<li>Алкогольные напитки</li>
<li>Найтрокс (аренда на борту)</li>
<li>Чаевые (рекомендуется 1 000–2 000 ฿/чел.)</li>
<li>Проживание до/после тура</li>
<li>Личные вещи</li>
</ul>

<h3>Информация о порте</h3>
<ul>
<li><strong>Порт:</strong> Чалонг Пирс, Пхукет</li>
<li><strong>Посадка:</strong> трансфер из аэропорта 18:00–20:00</li>
<li><strong>Высадка:</strong> трансфер в аэропорт 09:00 (рейсы после полудня рекомендуются)</li>
</ul>`,
      itinerary: `<h3>День 1 — Посадка</h3>
<p>18:00–20:00 Трансфер из аэропорта → Чалонг Пирс<br>
Регистрация, подготовка снаряжения, брифинг и ужин на борту<br>
Отправление к Симиланским островам (без погружений)</p>

<h3>День 2 — Симиланские острова (4 погружения)</h3>
<p>07:30 Погружение 1 — <strong>Anita's Reef</strong> (коралловый сад)<br>
10:30 Погружение 2 — <strong>West of Eden</strong> (валуны, пещеры, мягкие кораллы)<br>
14:00 Погружение 3 — <strong>Christmas Point</strong> (проплывы, акулы)<br>
17:00 Погружение 4 — <strong>Breakfast Bend</strong> (ночное погружение)</p>

<h3>День 3 — Ко Бон и Ко Тачай (4 погружения)</h3>
<p>07:30 Погружение 5 — <strong>Koh Bon West Ridge</strong> (шанс на манту)<br>
10:30 Погружение 6 — <strong>Koh Bon Pinnacle</strong><br>
14:00 Погружение 7 — <strong>Koh Tachai Pinnacle</strong> (мягкие кораллы, косяки рыб)<br>
17:00 Погружение 8 — <strong>Koh Tachai Twin Peaks</strong></p>

<h3>День 4 — Ришелье Рок и Сурин (4 погружения)</h3>
<p>07:30 Погружение 9 — <strong>Richelieu Rock</strong> (морские коньки, китовые акулы)<br>
10:30 Погружение 10 — <strong>Richelieu Rock</strong> (стаи барракуд)<br>
14:00 Погружение 11 — <strong>Суринские острова</strong><br>
17:00 Погружение 12 — <strong>Суринские острова</strong> (закатное погружение)</p>

<h3>День 5 — Симиланы и возвращение (3 погружения)</h3>
<p>07:30 Погружение 13 — <strong>Ко Тачай</strong><br>
10:30 Погружение 14 — <strong>Ко Бон</strong><br>
13:00 Погружение 15 — <strong>Симиланские острова</strong> (прощальное погружение)<br>
15:00 Возвращение в порт, выселение<br>
17:00 Трансфер в аэропорт Пхукета</p>`,
    },
    // ── KO ──
    {
      lang: "ko",
      title: "북 안다만 4일 5박",
      slug: "north-andaman-4d5n",
      excerpt: "세계적 다이브 사이트 리슐리외 록을 경험하고 꼬본에서 만타레이를 만나보세요. 시밀란·수린 제도에서 4일간 15회 다이빙.",
      route: "시밀란 제도 — 꼬본 — 꼬따차이 — 리슐리외 록 — 수린 제도",
      keywords: ["시밀란", "리슐리외 록", "꼬본", "만타레이", "꼬따차이", "북안다만", "리브어보드"],
      content: `<h3>하이라이트</h3>
<ul>
<li><strong>리슐리외 록 (Richelieu Rock)</strong> — 태국 최고의 다이브 사이트; 고래상어, 해마, 바라쿠다 떼를 만날 기회</li>
<li><strong>꼬본 (Koh Bon)</strong> — 만타레이 클리닝 스테이션 (2~4월 성수기)</li>
<li><strong>꼬따차이 피나클</strong> — 연산호와 어군으로 뒤덮인 수중 봉우리</li>
<li><strong>시밀란 제도</strong> — 맑은 물, 원시 산호초, 수중 사진 명소</li>
<li><strong>15회 다이빙</strong>, 4일간 소그룹 다이브마스터 1명 : 다이버 4~5명</li>
</ul>

<h3>다이브 사이트</h3>
<ul>
<li>시밀란 제도 — West of Eden, Anita's Reef, Christmas Point, Breakfast Bend</li>
<li>꼬본 — West Ridge, Manta Cleaning Station</li>
<li>꼬따차이 — Pinnacle, Twin Peaks</li>
<li>리슐리외 록</li>
<li>수린 제도</li>
</ul>

<h3>포함 사항</h3>
<ul>
<li>에어컨 캐빈, 전용 욕실, 4박</li>
<li>3식 + 간식, 과일 & 무제한 소프트 드링크 (주류 제외)</li>
<li>풀 다이빙 장비 (BCD, 레귤레이터, 컴퓨터, 웻수트, 랜턴, 마스크, 핀)</li>
<li>다이빙 보험</li>
<li>다이브 가이드, 소그룹 (DM 1명 : 4~5명)</li>
<li>무료 공항 픽업: 푸켓 공항 ⇄ 항구</li>
</ul>

<h3>불포함 사항</h3>
<ul>
<li>국립공원 입장료 (약 600~900 ฿/인)</li>
<li>주류</li>
<li>나이트록스 (선상 대여 가능)</li>
<li>팁 (권장 1,000~2,000 ฿/인)</li>
<li>투어 전후 숙소</li>
<li>개인 물품</li>
</ul>

<h3>항구 정보</h3>
<ul>
<li><strong>항구:</strong> 찰롱 피어 (Chalong Pier), 푸켓</li>
<li><strong>체크인:</strong> 공항 픽업 18:00~20:00</li>
<li><strong>체크아웃:</strong> 공항 드롭오프 09:00 (오후 이후 항공편 권장)</li>
</ul>`,
      itinerary: `<h3>1일차 — 승선</h3>
<p>18:00~20:00 공항 픽업 → 찰롱 피어<br>
체크인, 장비 세팅, 브리핑 & 선상 석식<br>
시밀란 제도로 출발 (다이빙 없음)</p>

<h3>2일차 — 시밀란 제도 (4회 다이빙)</h3>
<p>07:30 다이빙 1 — <strong>Anita's Reef</strong> (산호 정원)<br>
10:30 다이빙 2 — <strong>West of Eden</strong> (바위, 동굴, 연산호)<br>
14:00 다이빙 3 — <strong>Christmas Point</strong> (스윔스루, 상어)<br>
17:00 다이빙 4 — <strong>Breakfast Bend</strong> (야간 다이빙)</p>

<h3>3일차 — 꼬본 & 꼬따차이 (4회 다이빙)</h3>
<p>07:30 다이빙 5 — <strong>Koh Bon West Ridge</strong> (만타레이 기대)<br>
10:30 다이빙 6 — <strong>Koh Bon Pinnacle</strong><br>
14:00 다이빙 7 — <strong>Koh Tachai Pinnacle</strong> (연산호, 어군)<br>
17:00 다이빙 8 — <strong>Koh Tachai Twin Peaks</strong></p>

<h3>4일차 — 리슐리외 록 & 수린 (4회 다이빙)</h3>
<p>07:30 다이빙 9 — <strong>Richelieu Rock</strong> (해마, 고래상어)<br>
10:30 다이빙 10 — <strong>Richelieu Rock</strong> (바라쿠다 떼)<br>
14:00 다이빙 11 — <strong>수린 제도</strong><br>
17:00 다이빙 12 — <strong>수린 제도</strong> (선셋 다이빙)</p>

<h3>5일차 — 시밀란 & 복귀 (3회 다이빙)</h3>
<p>07:30 다이빙 13 — <strong>꼬따차이</strong><br>
10:30 다이빙 14 — <strong>꼬본</strong><br>
13:00 다이빙 15 — <strong>시밀란 제도</strong> (페어웰 다이빙)<br>
15:00 항구 복귀, 체크아웃<br>
17:00 푸켓 공항 드롭오프</p>`,
    },
    // ── JA ──
    {
      lang: "ja",
      title: "北アンダマン 4日間5泊",
      slug: "north-andaman-4d5n",
      excerpt: "世界屈指のダイブサイト、リシュリューロックを体験。コボンでマンタに出会えるチャンスも。シミラン諸島・スリン諸島で4日間15本のダイビング。",
      route: "シミラン諸島 — コボン — コタチャイ — リシュリューロック — スリン諸島",
      keywords: ["シミラン", "リシュリューロック", "コボン", "マンタ", "コタチャイ", "北アンダマン", "ダイブクルーズ"],
      content: `<h3>ハイライト</h3>
<ul>
<li><strong>リシュリューロック</strong> — タイNo.1のダイブサイト。ジンベエザメ、タツノオトシゴ、バラクーダの群れに出会えるチャンス</li>
<li><strong>コボン (Koh Bon)</strong> — マンタレイのクリーニングステーション（2〜4月がピーク）</li>
<li><strong>コタチャイ・ピナクル</strong> — ソフトコーラルと魚群に覆われた水中の岩山</li>
<li><strong>シミラン諸島</strong> — 透明度抜群、手付かずのサンゴ礁、水中写真の名所</li>
<li><strong>15ダイブ</strong>、4日間、少人数制 ダイブマスター1名：ダイバー4〜5名</li>
</ul>

<h3>ダイブサイト</h3>
<ul>
<li>シミラン諸島 — West of Eden、Anita's Reef、Christmas Point、Breakfast Bend</li>
<li>コボン — West Ridge、Manta Cleaning Station</li>
<li>コタチャイ — Pinnacle、Twin Peaks</li>
<li>リシュリューロック</li>
<li>スリン諸島</li>
</ul>

<h3>料金に含まれるもの</h3>
<ul>
<li>エアコン付きキャビン、専用バスルーム、4泊</li>
<li>1日3食＋スナック、フルーツ、ソフトドリンク飲み放題（アルコール除く）</li>
<li>フルダイビング器材（BCD、レギュレーター、ダイブコンピューター、ウェットスーツ、ライト、マスク、フィン）</li>
<li>ダイビング保険</li>
<li>ダイブガイド、少人数制（DM1名：4〜5名）</li>
<li>無料空港送迎：プーケット空港 ⇄ 港</li>
</ul>

<h3>料金に含まれないもの</h3>
<ul>
<li>国立公園入園料（約600〜900 ฿/名）</li>
<li>アルコール飲料</li>
<li>ナイトロックス（船上レンタル可）</li>
<li>チップ（推奨 1,000〜2,000 ฿/名）</li>
<li>ツアー前後の宿泊</li>
<li>身の回り品</li>
</ul>

<h3>港の情報</h3>
<ul>
<li><strong>港：</strong>シャロン桟橋（Chalong Pier）、プーケット</li>
<li><strong>チェックイン：</strong>空港ピックアップ 18:00〜20:00</li>
<li><strong>チェックアウト：</strong>空港送り 09:00（正午以降のフライト推奨）</li>
</ul>`,
      itinerary: `<h3>1日目 — 乗船</h3>
<p>18:00〜20:00 空港ピックアップ → シャロン桟橋<br>
チェックイン、器材セットアップ、ブリーフィング＆船上ディナー<br>
シミラン諸島へ出発（ダイビングなし）</p>

<h3>2日目 — シミラン諸島（4ダイブ）</h3>
<p>07:30 ダイブ1 — <strong>Anita's Reef</strong>（サンゴの庭）<br>
10:30 ダイブ2 — <strong>West of Eden</strong>（巨岩、洞窟、ソフトコーラル）<br>
14:00 ダイブ3 — <strong>Christmas Point</strong>（スイムスルー、サメ）<br>
17:00 ダイブ4 — <strong>Breakfast Bend</strong>（ナイトダイブ）</p>

<h3>3日目 — コボン＆コタチャイ（4ダイブ）</h3>
<p>07:30 ダイブ5 — <strong>Koh Bon West Ridge</strong>（マンタレイのチャンス）<br>
10:30 ダイブ6 — <strong>Koh Bon Pinnacle</strong><br>
14:00 ダイブ7 — <strong>Koh Tachai Pinnacle</strong>（ソフトコーラル、魚群）<br>
17:00 ダイブ8 — <strong>Koh Tachai Twin Peaks</strong></p>

<h3>4日目 — リシュリューロック＆スリン（4ダイブ）</h3>
<p>07:30 ダイブ9 — <strong>Richelieu Rock</strong>（タツノオトシゴ、ジンベエザメ）<br>
10:30 ダイブ10 — <strong>Richelieu Rock</strong>（バラクーダの群れ）<br>
14:00 ダイブ11 — <strong>スリン諸島</strong><br>
17:00 ダイブ12 — <strong>スリン諸島</strong>（サンセットダイブ）</p>

<h3>5日目 — シミラン＆帰港（3ダイブ）</h3>
<p>07:30 ダイブ13 — <strong>コタチャイ</strong><br>
10:30 ダイブ14 — <strong>コボン</strong><br>
13:00 ダイブ15 — <strong>シミラン諸島</strong>（フェアウェルダイブ）<br>
15:00 港に帰着、チェックアウト<br>
17:00 プーケット空港へ送迎</p>`,
    },
  ],
},

// ═══════════════════════════════════════════════════════════════════════════
// 2. S. Andaman 4D5N — Trip #34
// ═══════════════════════════════════════════════════════════════════════════
{
  scheduleId: "cmnrmfitk001ctckz4z2xy09w",
  routeName: "S. Andaman 4D5N",
  translations: [
    {
      lang: "en",
      title: "South Andaman 4 Days 5 Nights",
      slug: "south-andaman-4d5n",
      excerpt: "15 dives exploring the southern Andaman — from the King Cruiser wreck and Shark Point to Cathedral Cave at Koh Haa, plus Hin Daeng and Hin Muang famous for manta rays.",
      route: "Phi Phi Islands — Shark Point — King Cruiser Wreck — Anemone Reef — Koh Haa — Hin Daeng — Hin Muang",
      keywords: ["South Andaman", "Phi Phi", "Shark Point", "King Cruiser", "Koh Haa", "Hin Daeng", "Hin Muang", "liveaboard"],
      content: `<h3>Highlights</h3>
<ul>
<li><strong>Hin Daeng & Hin Muang</strong> — Premier dive sites; chance to spot manta rays and whale sharks</li>
<li><strong>Koh Haa</strong> — Cathedral Cave, Lagoon Wall with pristine corals</li>
<li><strong>King Cruiser Wreck</strong> — Large sunken ship teeming with marine life</li>
<li><strong>Shark Point</strong> — Leopard sharks and vibrant soft corals</li>
<li><strong>Phi Phi Islands</strong> — Bida Nok & Bida Nai with sea turtles and blacktip reef sharks</li>
</ul>

<h3>Dive Sites</h3>
<ul>
<li>Phi Phi — Bida Nok, Bida Nai, Palong Wall</li>
<li>Shark Point (Shark Fin Reef)</li>
<li>King Cruiser Wreck (32m depth)</li>
<li>Anemone Reef</li>
<li>Koh Haa — Lagoon, Canyon, Pinnacle, Cathedral Cave</li>
<li>Hin Daeng & Hin Muang</li>
</ul>

<h3>Included</h3>
<ul>
<li>Air-conditioned cabin with en-suite bathroom, 4 nights</li>
<li>3 meals + snacks, fruits & unlimited soft drinks (excluding alcohol)</li>
<li>Full dive equipment (BCD, regulator, computer, wetsuit, torch, mask, fins)</li>
<li>Dive insurance</li>
<li>Dive guide, small groups (1 DM : 4–5 divers)</li>
<li>Free airport transfer: Phuket Airport ⇄ pier</li>
</ul>

<h3>Excluded</h3>
<ul>
<li>Mu Ko Lanta National Park fees (approx. 600–900 ฿/person)</li>
<li>Alcoholic beverages</li>
<li>Nitrox (available for rent on board)</li>
<li>Tips (suggested 1,000–2,000 ฿/person)</li>
<li>Pre/post-trip accommodation</li>
<li>Personal items</li>
</ul>

<h3>Port Information</h3>
<ul>
<li><strong>Port:</strong> Chalong Pier, Phuket</li>
<li><strong>Check-in:</strong> 12:00–16:00 at the pier</li>
<li><strong>Check-out:</strong> 13:00–14:00 return to pier on last day</li>
</ul>`,
      itinerary: `<h3>Day 1 — Boarding & Phi Phi (3 dives)</h3>
<p>12:00–16:00 Check-in at Chalong Pier, equipment setup, briefing<br>
Depart for Phi Phi Islands<br>
18:00 Dive 1 — <strong>Bida Nok</strong> (leopard sharks, turtles)<br>
20:00 Dinner<br>
21:00 Dive 2 — <strong>Bida Nai</strong> (night dive, nocturnal life)</p>

<h3>Day 2 — Shark Point & King Cruiser (4 dives)</h3>
<p>07:30 Dive 3 — <strong>Anemone Reef</strong> (soft corals, clownfish)<br>
10:30 Dive 4 — <strong>Shark Point</strong> (leopard sharks)<br>
14:00 Dive 5 — <strong>King Cruiser Wreck</strong> (wreck, fish schools)<br>
17:00 Dive 6 — <strong>Shark Point</strong> (sunset dive)<br>
Overnight transit to Koh Haa</p>

<h3>Day 3 — Koh Haa (4 dives)</h3>
<p>07:30 Dive 7 — <strong>Koh Haa Pinnacle</strong> (caves, turtles, rays)<br>
10:30 Dive 8 — <strong>Koh Haa Canyon</strong> (currents, hard corals)<br>
14:00 Dive 9 — <strong>Koh Haa Lagoon Wall</strong> (macro, nudibranchs)<br>
17:00 Dive 10 — <strong>Koh Haa Cathedral Cave</strong> (night dive)<br>
Overnight transit to Hin Daeng–Hin Muang</p>

<h3>Day 4 — Hin Daeng & Hin Muang (4 dives)</h3>
<p>07:30 Dive 11 — <strong>Hin Daeng</strong> (vertical wall, manta ray chance)<br>
10:30 Dive 12 — <strong>Hin Daeng</strong> (barracuda schools)<br>
14:00 Dive 13 — <strong>Hin Muang</strong> (purple soft corals, sharks)<br>
17:00 Dive 14 — <strong>Hin Muang</strong> (sunset dive)<br>
Overnight return to Phuket</p>

<h3>Day 5 — Return (1 dive)</h3>
<p>07:30 Dive 15 — <strong>Anemone Reef</strong> or <strong>Shark Point</strong> (farewell dive)<br>
10:00 Breakfast, relax<br>
13:00–14:00 Arrive Chalong Pier, check-out</p>`,
    },
    {
      lang: "cn",
      title: "南安达曼 4天5夜",
      slug: "south-andaman-4d5n",
      excerpt: "15潜探索南安达曼——从国王巡洋舰沉船、鲨鱼角到甲米五岛的大教堂洞穴，以及以蝠鲼闻名的红石紫石。",
      route: "皮皮岛 — 鲨鱼角 — 国王巡洋舰沉船 — 海葵礁 — 甲米五岛 — 红石 — 紫石",
      keywords: ["南安达曼", "皮皮岛", "鲨鱼角", "国王巡洋舰", "甲米五岛", "红石", "紫石", "船宿"],
      content: `<h3>亮点</h3>
<ul>
<li><strong>红石 & 紫石 (Hin Daeng & Hin Muang)</strong> — 顶级潜点，有机会邂逅蝠鲼和鲸鲨</li>
<li><strong>甲米五岛 (Koh Haa)</strong> — 大教堂洞穴，泻湖壁原始珊瑚</li>
<li><strong>国王巡洋舰沉船</strong> — 大型沉船，海洋生物丰富</li>
<li><strong>鲨鱼角 (Shark Point)</strong> — 豹纹鲨和色彩鲜艳的软珊瑚</li>
<li><strong>皮皮岛</strong> — Bida Nok & Bida Nai，海龟和黑鳍礁鲨</li>
</ul>

<h3>潜点</h3>
<ul>
<li>皮皮岛 — Bida Nok、Bida Nai、Palong Wall</li>
<li>鲨鱼角 (Shark Fin Reef)</li>
<li>国王巡洋舰沉船（32米）</li>
<li>海葵礁</li>
<li>甲米五岛 — Lagoon、Canyon、Pinnacle、大教堂洞穴</li>
<li>红石 & 紫石</li>
</ul>

<h3>费用包含</h3>
<ul>
<li>空调客舱，独立卫浴，4晚</li>
<li>一日三餐 + 点心水果及无限量软饮（不含酒精）</li>
<li>全套潜水装备</li>
<li>潜水保险</li>
<li>潜导带队，小团</li>
<li>普吉机场 ⇄ 码头免费接送</li>
</ul>

<h3>费用不含</h3>
<ul>
<li>兰达群岛国家公园费（约600-900泰铢/人）</li>
<li>含酒精饮料</li>
<li>高氧 Nitrox（船上可租）</li>
<li>小费（建议1,000-2,000泰铢/人）</li>
<li>行程前后住宿</li>
<li>个人物品</li>
</ul>

<h3>码头信息</h3>
<ul>
<li><strong>码头：</strong>查龙码头，普吉</li>
<li><strong>登船：</strong>12:00-16:00 码头集合</li>
<li><strong>离船：</strong>13:00-14:00 最后一天返回码头</li>
</ul>`,
      itinerary: `<h3>第1天 — 登船 & 皮皮岛（3潜）</h3>
<p>12:00-16:00 查龙码头办理登船、整理装备、简报<br>
出发前往皮皮岛<br>
18:00 第1潜 — <strong>Bida Nok</strong>（豹纹鲨、海龟）<br>
20:00 晚餐<br>
21:00 第2潜 — <strong>Bida Nai</strong>（夜潜）</p>

<h3>第2天 — 鲨鱼角 & 国王巡洋舰（4潜）</h3>
<p>07:30 第3潜 — <strong>海葵礁</strong>（软珊瑚、小丑鱼）<br>
10:30 第4潜 — <strong>鲨鱼角</strong>（豹纹鲨）<br>
14:00 第5潜 — <strong>国王巡洋舰沉船</strong>（沉船、鱼群）<br>
17:00 第6潜 — <strong>鲨鱼角</strong>（日落潜）<br>
夜间航行至甲米五岛</p>

<h3>第3天 — 甲米五岛（4潜）</h3>
<p>07:30 第7潜 — <strong>Koh Haa Pinnacle</strong>（洞穴、海龟、鳐鱼）<br>
10:30 第8潜 — <strong>Koh Haa Canyon</strong>（水流、硬珊瑚）<br>
14:00 第9潜 — <strong>Koh Haa Lagoon Wall</strong>（微距、海蛞蝓）<br>
17:00 第10潜 — <strong>Koh Haa 大教堂洞穴</strong>（夜潜）<br>
夜间航行至红石紫石</p>

<h3>第4天 — 红石 & 紫石（4潜）</h3>
<p>07:30 第11潜 — <strong>红石</strong>（垂直峭壁、邂逅蝠鲼）<br>
10:30 第12潜 — <strong>红石</strong>（梭鱼群）<br>
14:00 第13潜 — <strong>紫石</strong>（紫色软珊瑚、鲨鱼）<br>
17:00 第14潜 — <strong>紫石</strong>（日落潜）<br>
夜间返回普吉</p>

<h3>第5天 — 返回（1潜）</h3>
<p>07:30 第15潜 — <strong>海葵礁</strong>或<strong>鲨鱼角</strong>（告别潜）<br>
10:00 早餐、休息<br>
13:00-14:00 抵达查龙码头，退房</p>`,
    },
    {
      lang: "de",
      title: "Süd-Andamanen 4 Tage 5 Nächte",
      slug: "sued-andamanen-4t5n",
      excerpt: "15 Tauchgänge im südlichen Andaman — vom King Cruiser Wrack und Shark Point bis zur Cathedral Cave auf Koh Haa sowie Hin Daeng und Hin Muang, berühmt für Mantarochen.",
      route: "Phi Phi Inseln — Shark Point — King Cruiser Wrack — Anemone Reef — Koh Haa — Hin Daeng — Hin Muang",
      keywords: ["Süd-Andamanen", "Phi Phi", "Shark Point", "King Cruiser", "Koh Haa", "Hin Daeng", "Hin Muang", "Tauchsafari"],
      content: `<h3>Highlights</h3>
<ul>
<li><strong>Hin Daeng & Hin Muang</strong> — Erstklassige Tauchplätze; Chance auf Mantarochen und Walhaie</li>
<li><strong>Koh Haa</strong> — Cathedral Cave, Lagoon Wall mit unberührten Korallen</li>
<li><strong>King Cruiser Wrack</strong> — Großes Schiffswrack voller Meeresleben</li>
<li><strong>Shark Point</strong> — Leopardenhaie und lebhafte Weichkorallen</li>
<li><strong>Phi Phi Inseln</strong> — Bida Nok & Bida Nai, Meeresschildkröten und Schwarzspitzen-Riffhaie</li>
</ul>

<h3>Tauchplätze</h3>
<ul>
<li>Phi Phi — Bida Nok, Bida Nai, Palong Wall</li>
<li>Shark Point (Shark Fin Reef)</li>
<li>King Cruiser Wrack (32m Tiefe)</li>
<li>Anemone Reef</li>
<li>Koh Haa — Lagoon, Canyon, Pinnacle, Cathedral Cave</li>
<li>Hin Daeng & Hin Muang</li>
</ul>

<h3>Inklusive</h3>
<ul>
<li>Klimatisierte Kabine mit eigenem Bad, 4 Nächte</li>
<li>3 Mahlzeiten + Snacks, Obst & unbegrenzt Softdrinks (ohne Alkohol)</li>
<li>Komplette Tauchausrüstung</li>
<li>Tauchversicherung</li>
<li>Tauchguide, Kleingruppen</li>
<li>Kostenloser Flughafentransfer: Phuket Airport ⇄ Hafen</li>
</ul>

<h3>Exklusive</h3>
<ul>
<li>Mu Ko Lanta Nationalparkgebühren (ca. 600–900 ฿/Person)</li>
<li>Alkoholische Getränke</li>
<li>Nitrox (an Bord mietbar)</li>
<li>Trinkgeld (empfohlen 1.000–2.000 ฿/Person)</li>
<li>Unterkunft vor/nach der Tour</li>
<li>Persönliche Gegenstände</li>
</ul>

<h3>Hafeninformation</h3>
<ul>
<li><strong>Hafen:</strong> Chalong Pier, Phuket</li>
<li><strong>Check-in:</strong> 12:00–16:00 am Hafen</li>
<li><strong>Check-out:</strong> 13:00–14:00 Rückkehr am letzten Tag</li>
</ul>`,
      itinerary: `<h3>Tag 1 — Einschiffung & Phi Phi (3 TG)</h3>
<p>12:00–16:00 Check-in am Chalong Pier, Ausrüstung, Briefing<br>
Abfahrt nach Phi Phi<br>
18:00 TG 1 — <strong>Bida Nok</strong> (Leopardenhaie, Schildkröten)<br>
20:00 Abendessen<br>
21:00 TG 2 — <strong>Bida Nai</strong> (Nachttauchgang)</p>

<h3>Tag 2 — Shark Point & King Cruiser (4 TG)</h3>
<p>07:30 TG 3 — <strong>Anemone Reef</strong> (Weichkorallen, Anemonenfische)<br>
10:30 TG 4 — <strong>Shark Point</strong> (Leopardenhaie)<br>
14:00 TG 5 — <strong>King Cruiser Wrack</strong> (Wrack, Fischschwärme)<br>
17:00 TG 6 — <strong>Shark Point</strong> (Sonnenuntergangs-TG)<br>
Nachtfahrt nach Koh Haa</p>

<h3>Tag 3 — Koh Haa (4 TG)</h3>
<p>07:30 TG 7 — <strong>Koh Haa Pinnacle</strong> (Höhlen, Schildkröten, Rochen)<br>
10:30 TG 8 — <strong>Koh Haa Canyon</strong> (Strömung, Hartkorallen)<br>
14:00 TG 9 — <strong>Koh Haa Lagoon Wall</strong> (Makro, Nacktschnecken)<br>
17:00 TG 10 — <strong>Koh Haa Cathedral Cave</strong> (Nachttauchgang)<br>
Nachtfahrt nach Hin Daeng–Hin Muang</p>

<h3>Tag 4 — Hin Daeng & Hin Muang (4 TG)</h3>
<p>07:30 TG 11 — <strong>Hin Daeng</strong> (Steilwand, Mantarochen-Chance)<br>
10:30 TG 12 — <strong>Hin Daeng</strong> (Barrakudaschwärme)<br>
14:00 TG 13 — <strong>Hin Muang</strong> (lila Weichkorallen, Haie)<br>
17:00 TG 14 — <strong>Hin Muang</strong> (Sonnenuntergangs-TG)<br>
Nachtfahrt zurück nach Phuket</p>

<h3>Tag 5 — Rückkehr (1 TG)</h3>
<p>07:30 TG 15 — <strong>Anemone Reef</strong> oder <strong>Shark Point</strong> (Abschieds-TG)<br>
10:00 Frühstück, Entspannung<br>
13:00–14:00 Ankunft Chalong Pier, Check-out</p>`,
    },
    {
      lang: "fr",
      title: "Andaman Sud 4 Jours 5 Nuits",
      slug: "andaman-sud-4j5n",
      excerpt: "15 plongées explorant le sud de l'Andaman — de l'épave du King Cruiser et Shark Point à la Cathedral Cave de Koh Haa, plus Hin Daeng et Hin Muang célèbres pour les raies manta.",
      route: "Îles Phi Phi — Shark Point — Épave King Cruiser — Anemone Reef — Koh Haa — Hin Daeng — Hin Muang",
      keywords: ["Andaman Sud", "Phi Phi", "Shark Point", "King Cruiser", "Koh Haa", "Hin Daeng", "Hin Muang", "croisière plongée"],
      content: `<h3>Points forts</h3>
<ul>
<li><strong>Hin Daeng & Hin Muang</strong> — Sites de plongée de premier choix ; raies manta et requins-baleines possibles</li>
<li><strong>Koh Haa</strong> — Cathedral Cave, Lagoon Wall aux coraux préservés</li>
<li><strong>Épave King Cruiser</strong> — Grande épave foisonnante de vie marine</li>
<li><strong>Shark Point</strong> — Requins-léopards et coraux mous colorés</li>
<li><strong>Îles Phi Phi</strong> — Bida Nok & Bida Nai, tortues et requins à pointes noires</li>
</ul>

<h3>Sites de plongée</h3>
<ul>
<li>Phi Phi — Bida Nok, Bida Nai, Palong Wall</li>
<li>Shark Point (Shark Fin Reef)</li>
<li>Épave King Cruiser (32m)</li>
<li>Anemone Reef</li>
<li>Koh Haa — Lagoon, Canyon, Pinnacle, Cathedral Cave</li>
<li>Hin Daeng & Hin Muang</li>
</ul>

<h3>Inclus</h3>
<ul>
<li>Cabine climatisée avec salle de bain privée, 4 nuits</li>
<li>3 repas + collations, fruits & boissons à volonté (hors alcool)</li>
<li>Équipement de plongée complet</li>
<li>Assurance plongée</li>
<li>Guide de plongée, petits groupes</li>
<li>Transfert aéroport gratuit : Phuket ⇄ port</li>
</ul>

<h3>Non inclus</h3>
<ul>
<li>Frais du parc national Mu Ko Lanta (env. 600–900 ฿/pers.)</li>
<li>Boissons alcoolisées</li>
<li>Nitrox (location à bord)</li>
<li>Pourboires (suggéré 1 000–2 000 ฿/pers.)</li>
<li>Hébergement avant/après le voyage</li>
<li>Effets personnels</li>
</ul>

<h3>Informations portuaires</h3>
<ul>
<li><strong>Port :</strong> Chalong Pier, Phuket</li>
<li><strong>Embarquement :</strong> 12h00–16h00 au port</li>
<li><strong>Débarquement :</strong> 13h00–14h00 dernier jour</li>
</ul>`,
      itinerary: `<h3>Jour 1 — Embarquement & Phi Phi (3 plongées)</h3>
<p>12h00–16h00 Enregistrement à Chalong Pier, matériel, briefing<br>
Départ vers Phi Phi<br>
18h00 Plongée 1 — <strong>Bida Nok</strong> (requins-léopards, tortues)<br>
20h00 Dîner<br>
21h00 Plongée 2 — <strong>Bida Nai</strong> (plongée de nuit)</p>

<h3>Jour 2 — Shark Point & King Cruiser (4 plongées)</h3>
<p>07h30 Plongée 3 — <strong>Anemone Reef</strong> (coraux mous, poissons-clowns)<br>
10h30 Plongée 4 — <strong>Shark Point</strong> (requins-léopards)<br>
14h00 Plongée 5 — <strong>Épave King Cruiser</strong> (épave, bancs de poissons)<br>
17h00 Plongée 6 — <strong>Shark Point</strong> (plongée au coucher du soleil)<br>
Navigation nocturne vers Koh Haa</p>

<h3>Jour 3 — Koh Haa (4 plongées)</h3>
<p>07h30 Plongée 7 — <strong>Koh Haa Pinnacle</strong> (grottes, tortues, raies)<br>
10h30 Plongée 8 — <strong>Koh Haa Canyon</strong> (courants, coraux durs)<br>
14h00 Plongée 9 — <strong>Koh Haa Lagoon Wall</strong> (macro, nudibranches)<br>
17h00 Plongée 10 — <strong>Koh Haa Cathedral Cave</strong> (plongée de nuit)<br>
Navigation nocturne vers Hin Daeng–Hin Muang</p>

<h3>Jour 4 — Hin Daeng & Hin Muang (4 plongées)</h3>
<p>07h30 Plongée 11 — <strong>Hin Daeng</strong> (paroi verticale, chance de manta)<br>
10h30 Plongée 12 — <strong>Hin Daeng</strong> (bancs de barracudas)<br>
14h00 Plongée 13 — <strong>Hin Muang</strong> (coraux mous violets, requins)<br>
17h00 Plongée 14 — <strong>Hin Muang</strong> (plongée au coucher du soleil)<br>
Retour nocturne vers Phuket</p>

<h3>Jour 5 — Retour (1 plongée)</h3>
<p>07h30 Plongée 15 — <strong>Anemone Reef</strong> ou <strong>Shark Point</strong> (plongée d'adieu)<br>
10h00 Petit-déjeuner, détente<br>
13h00–14h00 Arrivée Chalong Pier, check-out</p>`,
    },
    {
      lang: "ru",
      title: "Южный Андаман 4 дня 5 ночей",
      slug: "juzhnyj-andaman-4d5n",
      excerpt: "15 погружений по южному Андаману — от рэка King Cruiser и Шарк Пойнт до Кафедральной пещеры Ко Хаа, а также Хин Дэнг и Хин Муанг, знаменитые мантами.",
      route: "Острова Пхи-Пхи — Шарк Пойнт — Рэк King Cruiser — Анемон Риф — Ко Хаа — Хин Дэнг — Хин Муанг",
      keywords: ["Южный Андаман", "Пхи-Пхи", "Шарк Пойнт", "King Cruiser", "Ко Хаа", "Хин Дэнг", "Хин Муанг", "дайв-сафари"],
      content: `<h3>Особенности</h3>
<ul>
<li><strong>Хин Дэнг и Хин Муанг</strong> — Топовые дайв-сайты; шанс встретить мант и китовых акул</li>
<li><strong>Ко Хаа</strong> — Кафедральная пещера, Lagoon Wall с нетронутыми кораллами</li>
<li><strong>Рэк King Cruiser</strong> — Крупное затонувшее судно, полное морской жизни</li>
<li><strong>Шарк Пойнт</strong> — Леопардовые акулы и яркие мягкие кораллы</li>
<li><strong>Острова Пхи-Пхи</strong> — Bida Nok & Bida Nai, морские черепахи и черноплавничные акулы</li>
</ul>

<h3>Дайв-сайты</h3>
<ul>
<li>Пхи-Пхи — Bida Nok, Bida Nai, Palong Wall</li>
<li>Шарк Пойнт (Shark Fin Reef)</li>
<li>Рэк King Cruiser (глубина 32м)</li>
<li>Анемон Риф</li>
<li>Ко Хаа — Lagoon, Canyon, Pinnacle, Кафедральная пещера</li>
<li>Хин Дэнг и Хин Муанг</li>
</ul>

<h3>Включено</h3>
<ul>
<li>Каюта с кондиционером и ванной, 4 ночи</li>
<li>3-разовое питание + снеки, фрукты и безлимитные напитки (без алкоголя)</li>
<li>Полный комплект снаряжения</li>
<li>Страховка дайвинга</li>
<li>Дайв-гид, малые группы</li>
<li>Бесплатный трансфер: аэропорт Пхукета ⇄ пирс</li>
</ul>

<h3>Не включено</h3>
<ul>
<li>Сборы нац. парка Му Ко Ланта (прим. 600–900 ฿/чел.)</li>
<li>Алкогольные напитки</li>
<li>Найтрокс (аренда на борту)</li>
<li>Чаевые (рекомендуется 1 000–2 000 ฿/чел.)</li>
<li>Проживание до/после тура</li>
<li>Личные вещи</li>
</ul>

<h3>Информация о порте</h3>
<ul>
<li><strong>Порт:</strong> Чалонг Пирс, Пхукет</li>
<li><strong>Посадка:</strong> 12:00–16:00 на пирсе</li>
<li><strong>Высадка:</strong> 13:00–14:00 в последний день</li>
</ul>`,
      itinerary: `<h3>День 1 — Посадка и Пхи-Пхи (3 погружения)</h3>
<p>12:00–16:00 Регистрация на Чалонг Пирс, снаряжение, брифинг<br>
Отправление к островам Пхи-Пхи<br>
18:00 Погружение 1 — <strong>Bida Nok</strong> (леопардовые акулы, черепахи)<br>
20:00 Ужин<br>
21:00 Погружение 2 — <strong>Bida Nai</strong> (ночное погружение)</p>

<h3>День 2 — Шарк Пойнт и King Cruiser (4 погружения)</h3>
<p>07:30 Погружение 3 — <strong>Анемон Риф</strong> (мягкие кораллы, рыбы-клоуны)<br>
10:30 Погружение 4 — <strong>Шарк Пойнт</strong> (леопардовые акулы)<br>
14:00 Погружение 5 — <strong>Рэк King Cruiser</strong> (затонувший корабль, косяки рыб)<br>
17:00 Погружение 6 — <strong>Шарк Пойнт</strong> (закатное погружение)<br>
Ночной переход к Ко Хаа</p>

<h3>День 3 — Ко Хаа (4 погружения)</h3>
<p>07:30 Погружение 7 — <strong>Koh Haa Pinnacle</strong> (пещеры, черепахи, скаты)<br>
10:30 Погружение 8 — <strong>Koh Haa Canyon</strong> (течения, жёсткие кораллы)<br>
14:00 Погружение 9 — <strong>Koh Haa Lagoon Wall</strong> (макро, голожаберники)<br>
17:00 Погружение 10 — <strong>Koh Haa Кафедральная пещера</strong> (ночное погружение)<br>
Ночной переход к Хин Дэнг–Хин Муанг</p>

<h3>День 4 — Хин Дэнг и Хин Муанг (4 погружения)</h3>
<p>07:30 Погружение 11 — <strong>Хин Дэнг</strong> (отвесная стена, шанс на манту)<br>
10:30 Погружение 12 — <strong>Хин Дэнг</strong> (стаи барракуд)<br>
14:00 Погружение 13 — <strong>Хин Муанг</strong> (фиолетовые мягкие кораллы, акулы)<br>
17:00 Погружение 14 — <strong>Хин Муанг</strong> (закатное погружение)<br>
Ночной переход обратно в Пхукет</p>

<h3>День 5 — Возвращение (1 погружение)</h3>
<p>07:30 Погружение 15 — <strong>Анемон Риф</strong> или <strong>Шарк Пойнт</strong> (прощальное погружение)<br>
10:00 Завтрак, отдых<br>
13:00–14:00 Прибытие на Чалонг Пирс, выселение</p>`,
    },
    {
      lang: "ko",
      title: "남 안다만 4일 5박",
      slug: "south-andaman-4d5n",
      excerpt: "킹크루저 난파선, 샤크포인트, 꼬하 Cathedral Cave, 그리고 만타레이로 유명한 힌대엥·힌무앙까지 남 안다만 15회 다이빙.",
      route: "피피 섬 — 샤크포인트 — 킹크루저 난파선 — 아네모네 리프 — 꼬하 — 힌대엥 — 힌무앙",
      keywords: ["남안다만", "피피", "샤크포인트", "킹크루저", "꼬하", "힌대엥", "힌무앙", "리브어보드"],
      content: `<h3>하이라이트</h3>
<ul>
<li><strong>힌대엥 & 힌무앙</strong> — 최고의 다이브 사이트; 만타레이와 고래상어를 만날 기회</li>
<li><strong>꼬하 (Koh Haa)</strong> — Cathedral Cave, 라군 월의 원시 산호</li>
<li><strong>킹크루저 난파선</strong> — 해양 생물로 가득한 대형 침몰선</li>
<li><strong>샤크포인트</strong> — 표범상어와 선명한 연산호</li>
<li><strong>피피 섬</strong> — Bida Nok & Bida Nai, 바다거북과 블랙팁 리프 상어</li>
</ul>

<h3>다이브 사이트</h3>
<ul>
<li>피피 — Bida Nok, Bida Nai, Palong Wall</li>
<li>샤크포인트 (Shark Fin Reef)</li>
<li>킹크루저 난파선 (수심 32m)</li>
<li>아네모네 리프</li>
<li>꼬하 — Lagoon, Canyon, Pinnacle, Cathedral Cave</li>
<li>힌대엥 & 힌무앙</li>
</ul>

<h3>포함 사항</h3>
<ul>
<li>에어컨 캐빈, 전용 욕실, 4박</li>
<li>3식 + 간식, 과일 & 무제한 소프트 드링크 (주류 제외)</li>
<li>풀 다이빙 장비</li>
<li>다이빙 보험</li>
<li>다이브 가이드, 소그룹</li>
<li>무료 공항 픽업: 푸켓 공항 ⇄ 항구</li>
</ul>

<h3>불포함 사항</h3>
<ul>
<li>무꼬란타 국립공원 입장료 (약 600~900 ฿/인)</li>
<li>주류</li>
<li>나이트록스 (선상 대여 가능)</li>
<li>팁 (권장 1,000~2,000 ฿/인)</li>
<li>투어 전후 숙소</li>
<li>개인 물품</li>
</ul>

<h3>항구 정보</h3>
<ul>
<li><strong>항구:</strong> 찰롱 피어, 푸켓</li>
<li><strong>체크인:</strong> 12:00~16:00 항구 집합</li>
<li><strong>체크아웃:</strong> 13:00~14:00 마지막 날 항구 복귀</li>
</ul>`,
      itinerary: `<h3>1일차 — 승선 & 피피 (3회 다이빙)</h3>
<p>12:00~16:00 찰롱 피어 체크인, 장비 세팅, 브리핑<br>
피피 섬으로 출발<br>
18:00 다이빙 1 — <strong>Bida Nok</strong> (표범상어, 거북)<br>
20:00 석식<br>
21:00 다이빙 2 — <strong>Bida Nai</strong> (야간 다이빙)</p>

<h3>2일차 — 샤크포인트 & 킹크루저 (4회 다이빙)</h3>
<p>07:30 다이빙 3 — <strong>아네모네 리프</strong> (연산호, 흰동가리)<br>
10:30 다이빙 4 — <strong>샤크포인트</strong> (표범상어)<br>
14:00 다이빙 5 — <strong>킹크루저 난파선</strong> (난파선, 어군)<br>
17:00 다이빙 6 — <strong>샤크포인트</strong> (선셋 다이빙)<br>
야간 항해로 꼬하 이동</p>

<h3>3일차 — 꼬하 (4회 다이빙)</h3>
<p>07:30 다이빙 7 — <strong>Koh Haa Pinnacle</strong> (동굴, 거북, 가오리)<br>
10:30 다이빙 8 — <strong>Koh Haa Canyon</strong> (조류, 경산호)<br>
14:00 다이빙 9 — <strong>Koh Haa Lagoon Wall</strong> (매크로, 갯민숭달팽이)<br>
17:00 다이빙 10 — <strong>Koh Haa Cathedral Cave</strong> (야간 다이빙)<br>
야간 항해로 힌대엥-힌무앙 이동</p>

<h3>4일차 — 힌대엥 & 힌무앙 (4회 다이빙)</h3>
<p>07:30 다이빙 11 — <strong>힌대엥</strong> (절벽, 만타레이 기대)<br>
10:30 다이빙 12 — <strong>힌대엥</strong> (바라쿠다 떼)<br>
14:00 다이빙 13 — <strong>힌무앙</strong> (보라색 연산호, 상어)<br>
17:00 다이빙 14 — <strong>힌무앙</strong> (선셋 다이빙)<br>
야간 항해로 푸켓 복귀</p>

<h3>5일차 — 복귀 (1회 다이빙)</h3>
<p>07:30 다이빙 15 — <strong>아네모네 리프</strong> 또는 <strong>샤크포인트</strong> (페어웰 다이빙)<br>
10:00 조식, 휴식<br>
13:00~14:00 찰롱 피어 도착, 체크아웃</p>`,
    },
    {
      lang: "ja",
      title: "南アンダマン 4日間5泊",
      slug: "south-andaman-4d5n",
      excerpt: "キングクルーザー沈船、シャークポイントからコハーのカテドラルケーブ、マンタで有名なヒンデーン・ヒンムアンまで、南アンダマン15ダイブ。",
      route: "ピピ島 — シャークポイント — キングクルーザー沈船 — アネモネリーフ — コハー — ヒンデーン — ヒンムアン",
      keywords: ["南アンダマン", "ピピ島", "シャークポイント", "キングクルーザー", "コハー", "ヒンデーン", "ヒンムアン", "ダイブクルーズ"],
      content: `<h3>ハイライト</h3>
<ul>
<li><strong>ヒンデーン＆ヒンムアン</strong> — トップクラスのダイブサイト。マンタレイとジンベエザメに出会えるチャンス</li>
<li><strong>コハー (Koh Haa)</strong> — カテドラルケーブ、手付かずのサンゴのラグーンウォール</li>
<li><strong>キングクルーザー沈船</strong> — 海洋生物であふれる大型沈船</li>
<li><strong>シャークポイント</strong> — トラフザメと鮮やかなソフトコーラル</li>
<li><strong>ピピ島</strong> — Bida Nok＆Bida Nai、ウミガメとツマグロ</li>
</ul>

<h3>ダイブサイト</h3>
<ul>
<li>ピピ島 — Bida Nok、Bida Nai、Palong Wall</li>
<li>シャークポイント (Shark Fin Reef)</li>
<li>キングクルーザー沈船（水深32m）</li>
<li>アネモネリーフ</li>
<li>コハー — Lagoon、Canyon、Pinnacle、Cathedral Cave</li>
<li>ヒンデーン＆ヒンムアン</li>
</ul>

<h3>料金に含まれるもの</h3>
<ul>
<li>エアコン付きキャビン、専用バスルーム、4泊</li>
<li>1日3食＋スナック、フルーツ、ソフトドリンク飲み放題（アルコール除く）</li>
<li>フルダイビング器材</li>
<li>ダイビング保険</li>
<li>ダイブガイド、少人数制</li>
<li>無料空港送迎：プーケット空港 ⇄ 港</li>
</ul>

<h3>料金に含まれないもの</h3>
<ul>
<li>ムコランタ国立公園入園料（約600〜900 ฿/名）</li>
<li>アルコール飲料</li>
<li>ナイトロックス（船上レンタル可）</li>
<li>チップ（推奨 1,000〜2,000 ฿/名）</li>
<li>ツアー前後の宿泊</li>
<li>身の回り品</li>
</ul>

<h3>港の情報</h3>
<ul>
<li><strong>港：</strong>シャロン桟橋、プーケット</li>
<li><strong>チェックイン：</strong>12:00〜16:00 港集合</li>
<li><strong>チェックアウト：</strong>13:00〜14:00 最終日帰着</li>
</ul>`,
      itinerary: `<h3>1日目 — 乗船＆ピピ島（3ダイブ）</h3>
<p>12:00〜16:00 シャロン桟橋チェックイン、器材セットアップ、ブリーフィング<br>
ピピ島へ出発<br>
18:00 ダイブ1 — <strong>Bida Nok</strong>（トラフザメ、ウミガメ）<br>
20:00 ディナー<br>
21:00 ダイブ2 — <strong>Bida Nai</strong>（ナイトダイブ）</p>

<h3>2日目 — シャークポイント＆キングクルーザー（4ダイブ）</h3>
<p>07:30 ダイブ3 — <strong>アネモネリーフ</strong>（ソフトコーラル、クマノミ）<br>
10:30 ダイブ4 — <strong>シャークポイント</strong>（トラフザメ）<br>
14:00 ダイブ5 — <strong>キングクルーザー沈船</strong>（沈船、魚群）<br>
17:00 ダイブ6 — <strong>シャークポイント</strong>（サンセットダイブ）<br>
夜間航行でコハーへ</p>

<h3>3日目 — コハー（4ダイブ）</h3>
<p>07:30 ダイブ7 — <strong>Koh Haa Pinnacle</strong>（洞窟、ウミガメ、エイ）<br>
10:30 ダイブ8 — <strong>Koh Haa Canyon</strong>（潮流、ハードコーラル）<br>
14:00 ダイブ9 — <strong>Koh Haa Lagoon Wall</strong>（マクロ、ウミウシ）<br>
17:00 ダイブ10 — <strong>Koh Haa Cathedral Cave</strong>（ナイトダイブ）<br>
夜間航行でヒンデーン・ヒンムアンへ</p>

<h3>4日目 — ヒンデーン＆ヒンムアン（4ダイブ）</h3>
<p>07:30 ダイブ11 — <strong>ヒンデーン</strong>（垂直の壁、マンタのチャンス）<br>
10:30 ダイブ12 — <strong>ヒンデーン</strong>（バラクーダの群れ）<br>
14:00 ダイブ13 — <strong>ヒンムアン</strong>（紫のソフトコーラル、サメ）<br>
17:00 ダイブ14 — <strong>ヒンムアン</strong>（サンセットダイブ）<br>
夜間航行でプーケットへ</p>

<h3>5日目 — 帰港（1ダイブ）</h3>
<p>07:30 ダイブ15 — <strong>アネモネリーフ</strong>または<strong>シャークポイント</strong>（フェアウェルダイブ）<br>
10:00 朝食、リラックス<br>
13:00〜14:00 シャロン桟橋到着、チェックアウト</p>`,
    },
  ],
},

// ═══════════════════════════════════════════════════════════════════════════
// 3. Hin Muang-Hin Daeng 3D4N — Trip #38
// ═══════════════════════════════════════════════════════════════════════════
{
  scheduleId: "cmnrmfiut002otckzxu34rnkm",
  routeName: "Hin Muang-Hin Daeng 3D4N",
  translations: [
    {
      lang: "en",
      title: "Hin Muang – Hin Daeng 3 Days 4 Nights",
      slug: "hin-muang-hin-daeng-3d4n",
      excerpt: "10–12 dives focusing on world-class Hin Daeng and Hin Muang — vertical walls, manta rays and whale shark encounters, plus stops at Koh Haa and Phi Phi.",
      route: "Koh Haa — Hin Daeng — Hin Muang — Phi Phi Islands",
      keywords: ["Hin Daeng", "Hin Muang", "Koh Haa", "manta ray", "vertical wall", "liveaboard"],
      content: `<h3>Highlights</h3>
<ul>
<li><strong>Hin Daeng</strong> — Underwater pinnacle with vertical red soft-coral walls; manta rays and whale sharks</li>
<li><strong>Hin Muang</strong> — Vertical wall plunging over 60 m, purple soft corals, grey reef sharks</li>
<li><strong>Koh Haa</strong> — Cathedral Cave, crystal-clear lagoon</li>
<li><strong>4–8 dives</strong> at Hin Daeng–Hin Muang; multiple dives at the same site to maximize encounters</li>
</ul>

<h3>Dive Sites</h3>
<ul>
<li>Koh Haa — Lagoon, Canyon, Yamashita's Hole</li>
<li>Hin Daeng — East Wall, Summit, Drift</li>
<li>Hin Muang — Vertical Wall, Anemone Carpet</li>
<li>Hin Musung (conditions permitting)</li>
<li>King Cruiser Wreck or Bida Nok/Nai (en route back)</li>
</ul>

<h3>Included</h3>
<ul>
<li>Air-conditioned cabin with en-suite bathroom, 3 nights</li>
<li>3 meals + snacks, fruits & unlimited soft drinks (excluding alcohol)</li>
<li>Full dive equipment</li>
<li>Dive insurance</li>
<li>Dive guide, small groups</li>
<li>Free airport transfer: Phuket Airport ⇄ pier</li>
</ul>

<h3>Excluded</h3>
<ul>
<li>Mu Ko Lanta National Park fees (approx. 600–900 ฿/person)</li>
<li>Alcoholic beverages</li>
<li>Nitrox</li>
<li>Tips (suggested 1,000–2,000 ฿/person)</li>
<li>Pre/post-trip accommodation</li>
</ul>

<h3>Port Information</h3>
<ul>
<li><strong>Port:</strong> Chalong Pier, Phuket</li>
<li><strong>Check-in:</strong> 08:00–09:00 at the pier</li>
<li><strong>Check-out:</strong> Evening on the last day</li>
</ul>

<h3>Note</h3>
<p>Hin Daeng–Hin Muang has strong currents. Recommended for Advanced Open Water divers and above.</p>`,
      itinerary: `<h3>Day 1 — Boarding & Koh Haa (2 dives)</h3>
<p>08:00–09:00 Check-in at Chalong Pier<br>
Depart for Koh Haa<br>
14:00 Dive 1 — <strong>Koh Haa Lagoon</strong> (check dive, caves, lagoon)<br>
16:30 Dive 2 — <strong>Koh Haa Canyon</strong> or <strong>Yamashita's Hole</strong><br>
Overnight transit to Hin Daeng</p>

<h3>Day 2 — Hin Daeng (4 dives)</h3>
<p>07:30 Dive 3 — <strong>Hin Daeng</strong> (drift dive, vertical wall, manta chance)<br>
10:30 Dive 4 — <strong>Hin Daeng Summit</strong> (barracuda schools)<br>
14:00 Dive 5 — <strong>Hin Daeng East Wall</strong><br>
17:00 Dive 6 — <strong>Hin Daeng</strong> (night dive, sleeping sharks)</p>

<h3>Day 3 — Hin Muang & Return (4 dives)</h3>
<p>07:30 Dive 7 — <strong>Hin Muang</strong> (vertical wall, purple soft corals)<br>
10:30 Dive 8 — <strong>Hin Muang</strong> (anemone carpet, grey reef sharks)<br>
14:00 Dive 9 — <strong>Hin Musung</strong> or <strong>Koh Dok Mai</strong><br>
Overnight return to Phuket</p>

<h3>Day 4 — Phi Phi & Return (2 dives)</h3>
<p>07:30 Dive 10 — <strong>King Cruiser Wreck</strong> or <strong>Bida Nok</strong><br>
10:00 Dive 11 — <strong>Shark Point</strong> (farewell dive)<br>
12:00 Lunch, relax<br>
15:00–16:00 Arrive Chalong Pier, check-out</p>`,
    },
    {
      lang: "cn",
      title: "紫石-红石 3天4夜",
      slug: "hin-muang-hin-daeng-3d4n",
      excerpt: "10-12潜，深度探索世界级潜点红石和紫石——垂直峭壁、蝠鲼和鲸鲨，途经甲米五岛和皮皮岛。",
      route: "甲米五岛 — 红石 — 紫石 — 皮皮岛",
      keywords: ["红石", "紫石", "Hin Daeng", "Hin Muang", "甲米五岛", "蝠鲼", "船宿"],
      content: `<h3>亮点</h3>
<ul>
<li><strong>红石 (Hin Daeng)</strong> — 水下尖峰，垂直红色软珊瑚墙，邂逅蝠鲼和鲸鲨</li>
<li><strong>紫石 (Hin Muang)</strong> — 超过60米的垂直墙，紫色软珊瑚，灰礁鲨</li>
<li><strong>甲米五岛</strong> — 大教堂洞穴，清澈泻湖</li>
<li><strong>4-8潜</strong>在红石紫石，可多次重潜同一潜点</li>
</ul>

<h3>潜点</h3>
<ul>
<li>甲米五岛 — Lagoon、Canyon、Yamashita's Hole</li>
<li>红石 — East Wall、Summit、Drift</li>
<li>紫石 — Vertical Wall、Anemone Carpet</li>
<li>Hin Musung（视条件）</li>
<li>国王巡洋舰沉船或Bida Nok/Nai（返程途中）</li>
</ul>

<h3>费用包含</h3>
<ul>
<li>空调客舱，独立卫浴，3晚</li>
<li>一日三餐 + 点心水果及无限量软饮（不含酒精）</li>
<li>全套潜水装备</li>
<li>潜水保险</li>
<li>潜导带队，小团</li>
<li>普吉机场 ⇄ 码头免费接送</li>
</ul>

<h3>费用不含</h3>
<ul>
<li>兰达群岛国家公园费（约600-900泰铢/人）</li>
<li>含酒精饮料</li>
<li>高氧 Nitrox</li>
<li>小费（建议1,000-2,000泰铢/人）</li>
<li>行程前后住宿</li>
</ul>

<h3>码头信息</h3>
<ul>
<li><strong>码头：</strong>查龙码头，普吉</li>
<li><strong>登船：</strong>08:00-09:00 码头集合</li>
<li><strong>离船：</strong>最后一天傍晚</li>
</ul>

<h3>备注</h3>
<p>红石紫石水流较强，建议进阶开放水域潜水员（AOW）及以上。</p>`,
      itinerary: `<h3>第1天 — 登船 & 甲米五岛（2潜）</h3>
<p>08:00-09:00 查龙码头办理登船<br>
出发前往甲米五岛<br>
14:00 第1潜 — <strong>Koh Haa Lagoon</strong>（检查潜、洞穴、泻湖）<br>
16:30 第2潜 — <strong>Koh Haa Canyon</strong>或<strong>Yamashita's Hole</strong><br>
夜间航行至红石</p>

<h3>第2天 — 红石（4潜）</h3>
<p>07:30 第3潜 — <strong>红石</strong>（放流潜、垂直墙、邂逅蝠鲼）<br>
10:30 第4潜 — <strong>红石 Summit</strong>（梭鱼群）<br>
14:00 第5潜 — <strong>红石 East Wall</strong><br>
17:00 第6潜 — <strong>红石</strong>（夜潜、鲨鱼）</p>

<h3>第3天 — 紫石 & 返回（4潜）</h3>
<p>07:30 第7潜 — <strong>紫石</strong>（垂直墙、紫色软珊瑚）<br>
10:30 第8潜 — <strong>紫石</strong>（海葵地毯、灰礁鲨）<br>
14:00 第9潜 — <strong>Hin Musung</strong>或<strong>Koh Dok Mai</strong><br>
夜间返回普吉</p>

<h3>第4天 — 皮皮岛 & 返回（2潜）</h3>
<p>07:30 第10潜 — <strong>国王巡洋舰沉船</strong>或<strong>Bida Nok</strong><br>
10:00 第11潜 — <strong>鲨鱼角</strong>（告别潜）<br>
12:00 午餐、休息<br>
15:00-16:00 抵达查龙码头，退房</p>`,
    },
    {
      lang: "de",
      title: "Hin Muang – Hin Daeng 3 Tage 4 Nächte",
      slug: "hin-muang-hin-daeng-3t4n",
      excerpt: "10–12 Tauchgänge mit Fokus auf die Weltklasse-Spots Hin Daeng und Hin Muang — Steilwände, Mantarochen und Walhaibegegnungen, plus Koh Haa und Phi Phi.",
      route: "Koh Haa — Hin Daeng — Hin Muang — Phi Phi Inseln",
      keywords: ["Hin Daeng", "Hin Muang", "Koh Haa", "Mantarochen", "Steilwand", "Tauchsafari"],
      content: `<h3>Highlights</h3>
<ul>
<li><strong>Hin Daeng</strong> — Unterwasserfelsen mit senkrechten roten Weichkorallenwänden; Mantarochen und Walhaie</li>
<li><strong>Hin Muang</strong> — Steilwand über 60 m tief, lila Weichkorallen, Graue Riffhaie</li>
<li><strong>Koh Haa</strong> — Cathedral Cave, kristallklare Lagune</li>
<li><strong>4–8 Tauchgänge</strong> an Hin Daeng–Hin Muang; Mehrfachtauchgänge am selben Spot</li>
</ul>

<h3>Tauchplätze</h3>
<ul>
<li>Koh Haa — Lagoon, Canyon, Yamashita's Hole</li>
<li>Hin Daeng — East Wall, Summit, Drift</li>
<li>Hin Muang — Vertical Wall, Anemone Carpet</li>
<li>Hin Musung (bei guten Bedingungen)</li>
<li>King Cruiser Wrack oder Bida Nok/Nai (auf dem Rückweg)</li>
</ul>

<h3>Inklusive</h3>
<ul>
<li>Klimatisierte Kabine mit eigenem Bad, 3 Nächte</li>
<li>3 Mahlzeiten + Snacks, Obst & unbegrenzt Softdrinks (ohne Alkohol)</li>
<li>Komplette Tauchausrüstung</li>
<li>Tauchversicherung</li>
<li>Tauchguide, Kleingruppen</li>
<li>Kostenloser Flughafentransfer</li>
</ul>

<h3>Exklusive</h3>
<ul>
<li>Mu Ko Lanta Nationalparkgebühren (ca. 600–900 ฿/Person)</li>
<li>Alkoholische Getränke</li>
<li>Nitrox</li>
<li>Trinkgeld (empfohlen 1.000–2.000 ฿/Person)</li>
<li>Unterkunft vor/nach der Tour</li>
</ul>

<h3>Hafeninformation</h3>
<ul>
<li><strong>Hafen:</strong> Chalong Pier, Phuket</li>
<li><strong>Check-in:</strong> 08:00–09:00 am Hafen</li>
<li><strong>Check-out:</strong> Abend des letzten Tages</li>
</ul>

<h3>Hinweis</h3>
<p>Hin Daeng–Hin Muang hat starke Strömungen. Empfohlen für Advanced Open Water Taucher und höher.</p>`,
      itinerary: `<h3>Tag 1 — Einschiffung & Koh Haa (2 TG)</h3>
<p>08:00–09:00 Check-in am Chalong Pier<br>
Abfahrt nach Koh Haa<br>
14:00 TG 1 — <strong>Koh Haa Lagoon</strong> (Check-Dive, Höhlen, Lagune)<br>
16:30 TG 2 — <strong>Koh Haa Canyon</strong> oder <strong>Yamashita's Hole</strong><br>
Nachtfahrt nach Hin Daeng</p>

<h3>Tag 2 — Hin Daeng (4 TG)</h3>
<p>07:30 TG 3 — <strong>Hin Daeng</strong> (Drift-Dive, Steilwand, Mantarochen-Chance)<br>
10:30 TG 4 — <strong>Hin Daeng Summit</strong> (Barrakudaschwärme)<br>
14:00 TG 5 — <strong>Hin Daeng East Wall</strong><br>
17:00 TG 6 — <strong>Hin Daeng</strong> (Nachttauchgang, schlafende Haie)</p>

<h3>Tag 3 — Hin Muang & Rückkehr (4 TG)</h3>
<p>07:30 TG 7 — <strong>Hin Muang</strong> (Steilwand, lila Weichkorallen)<br>
10:30 TG 8 — <strong>Hin Muang</strong> (Anemonenteppich, Graue Riffhaie)<br>
14:00 TG 9 — <strong>Hin Musung</strong> oder <strong>Koh Dok Mai</strong><br>
Nachtfahrt zurück nach Phuket</p>

<h3>Tag 4 — Phi Phi & Rückkehr (2 TG)</h3>
<p>07:30 TG 10 — <strong>King Cruiser Wrack</strong> oder <strong>Bida Nok</strong><br>
10:00 TG 11 — <strong>Shark Point</strong> (Abschieds-TG)<br>
12:00 Mittagessen, Entspannung<br>
15:00–16:00 Ankunft Chalong Pier, Check-out</p>`,
    },
    {
      lang: "fr",
      title: "Hin Muang – Hin Daeng 3 Jours 4 Nuits",
      slug: "hin-muang-hin-daeng-3j4n",
      excerpt: "10–12 plongées focalisées sur les sites d'exception Hin Daeng et Hin Muang — parois verticales, raies manta et requins-baleines, avec escales à Koh Haa et Phi Phi.",
      route: "Koh Haa — Hin Daeng — Hin Muang — Îles Phi Phi",
      keywords: ["Hin Daeng", "Hin Muang", "Koh Haa", "raie manta", "paroi verticale", "croisière plongée"],
      content: `<h3>Points forts</h3>
<ul>
<li><strong>Hin Daeng</strong> — Pic sous-marin aux parois verticales de coraux mous rouges ; raies manta et requins-baleines</li>
<li><strong>Hin Muang</strong> — Paroi verticale de plus de 60 m, coraux mous violets, requins gris de récif</li>
<li><strong>Koh Haa</strong> — Cathedral Cave, lagon cristallin</li>
<li><strong>4–8 plongées</strong> à Hin Daeng–Hin Muang ; plongées multiples au même site</li>
</ul>

<h3>Sites de plongée</h3>
<ul>
<li>Koh Haa — Lagoon, Canyon, Yamashita's Hole</li>
<li>Hin Daeng — East Wall, Summit, Drift</li>
<li>Hin Muang — Vertical Wall, Anemone Carpet</li>
<li>Hin Musung (selon conditions)</li>
<li>Épave King Cruiser ou Bida Nok/Nai (sur le retour)</li>
</ul>

<h3>Inclus</h3>
<ul>
<li>Cabine climatisée avec salle de bain, 3 nuits</li>
<li>3 repas + collations, fruits & boissons à volonté (hors alcool)</li>
<li>Équipement de plongée complet</li>
<li>Assurance plongée</li>
<li>Guide de plongée, petits groupes</li>
<li>Transfert aéroport gratuit</li>
</ul>

<h3>Non inclus</h3>
<ul>
<li>Frais parc national Mu Ko Lanta (env. 600–900 ฿/pers.)</li>
<li>Boissons alcoolisées</li>
<li>Nitrox</li>
<li>Pourboires (suggéré 1 000–2 000 ฿/pers.)</li>
<li>Hébergement avant/après</li>
</ul>

<h3>Informations portuaires</h3>
<ul>
<li><strong>Port :</strong> Chalong Pier, Phuket</li>
<li><strong>Embarquement :</strong> 08h00–09h00 au port</li>
<li><strong>Débarquement :</strong> Soirée du dernier jour</li>
</ul>

<h3>Remarque</h3>
<p>Hin Daeng–Hin Muang présente de forts courants. Recommandé pour plongeurs Advanced Open Water et plus.</p>`,
      itinerary: `<h3>Jour 1 — Embarquement & Koh Haa (2 plongées)</h3>
<p>08h00–09h00 Enregistrement à Chalong Pier<br>
Départ vers Koh Haa<br>
14h00 Plongée 1 — <strong>Koh Haa Lagoon</strong> (check dive, grottes, lagon)<br>
16h30 Plongée 2 — <strong>Koh Haa Canyon</strong> ou <strong>Yamashita's Hole</strong><br>
Navigation nocturne vers Hin Daeng</p>

<h3>Jour 2 — Hin Daeng (4 plongées)</h3>
<p>07h30 Plongée 3 — <strong>Hin Daeng</strong> (plongée dérivante, paroi, manta)<br>
10h30 Plongée 4 — <strong>Hin Daeng Summit</strong> (bancs de barracudas)<br>
14h00 Plongée 5 — <strong>Hin Daeng East Wall</strong><br>
17h00 Plongée 6 — <strong>Hin Daeng</strong> (plongée de nuit, requins endormis)</p>

<h3>Jour 3 — Hin Muang & Retour (4 plongées)</h3>
<p>07h30 Plongée 7 — <strong>Hin Muang</strong> (paroi verticale, coraux mous violets)<br>
10h30 Plongée 8 — <strong>Hin Muang</strong> (tapis d'anémones, requins gris)<br>
14h00 Plongée 9 — <strong>Hin Musung</strong> ou <strong>Koh Dok Mai</strong><br>
Navigation nocturne retour Phuket</p>

<h3>Jour 4 — Phi Phi & Retour (2 plongées)</h3>
<p>07h30 Plongée 10 — <strong>Épave King Cruiser</strong> ou <strong>Bida Nok</strong><br>
10h00 Plongée 11 — <strong>Shark Point</strong> (plongée d'adieu)<br>
12h00 Déjeuner, détente<br>
15h00–16h00 Arrivée Chalong Pier, check-out</p>`,
    },
    {
      lang: "ru",
      title: "Хин Муанг – Хин Дэнг 3 дня 4 ночи",
      slug: "hin-muang-hin-daeng-3d4n",
      excerpt: "10–12 погружений с фокусом на дайв-сайты мирового класса Хин Дэнг и Хин Муанг — отвесные стены, манты и встречи с китовыми акулами, плюс Ко Хаа и Пхи-Пхи.",
      route: "Ко Хаа — Хин Дэнг — Хин Муанг — Острова Пхи-Пхи",
      keywords: ["Хин Дэнг", "Хин Муанг", "Ко Хаа", "манта", "отвесная стена", "дайв-сафари"],
      content: `<h3>Особенности</h3>
<ul>
<li><strong>Хин Дэнг</strong> — Подводная скала с вертикальными стенами из красных мягких кораллов; манты и китовые акулы</li>
<li><strong>Хин Муанг</strong> — Отвесная стена глубиной более 60 м, фиолетовые мягкие кораллы, серые рифовые акулы</li>
<li><strong>Ко Хаа</strong> — Кафедральная пещера, кристальная лагуна</li>
<li><strong>4–8 погружений</strong> на Хин Дэнг–Хин Муанг; повторные погружения для максимума встреч</li>
</ul>

<h3>Дайв-сайты</h3>
<ul>
<li>Ко Хаа — Lagoon, Canyon, Yamashita's Hole</li>
<li>Хин Дэнг — East Wall, Summit, Drift</li>
<li>Хин Муанг — Vertical Wall, Anemone Carpet</li>
<li>Хин Мусунг (при хороших условиях)</li>
<li>Рэк King Cruiser или Bida Nok/Nai (по пути обратно)</li>
</ul>

<h3>Включено</h3>
<ul>
<li>Каюта с кондиционером и ванной, 3 ночи</li>
<li>3-разовое питание + снеки, фрукты и безлимитные напитки (без алкоголя)</li>
<li>Полный комплект снаряжения</li>
<li>Страховка дайвинга</li>
<li>Дайв-гид, малые группы</li>
<li>Бесплатный трансфер из аэропорта</li>
</ul>

<h3>Не включено</h3>
<ul>
<li>Сборы нац. парка Му Ко Ланта (прим. 600–900 ฿/чел.)</li>
<li>Алкогольные напитки</li>
<li>Найтрокс</li>
<li>Чаевые (рекомендуется 1 000–2 000 ฿/чел.)</li>
<li>Проживание до/после тура</li>
</ul>

<h3>Информация о порте</h3>
<ul>
<li><strong>Порт:</strong> Чалонг Пирс, Пхукет</li>
<li><strong>Посадка:</strong> 08:00–09:00 на пирсе</li>
<li><strong>Высадка:</strong> Вечер последнего дня</li>
</ul>

<h3>Примечание</h3>
<p>Хин Дэнг–Хин Муанг — сильные течения. Рекомендуется для дайверов уровня Advanced Open Water и выше.</p>`,
      itinerary: `<h3>День 1 — Посадка и Ко Хаа (2 погружения)</h3>
<p>08:00–09:00 Регистрация на Чалонг Пирс<br>
Отправление к Ко Хаа<br>
14:00 Погружение 1 — <strong>Koh Haa Lagoon</strong> (чек-дайв, пещеры, лагуна)<br>
16:30 Погружение 2 — <strong>Koh Haa Canyon</strong> или <strong>Yamashita's Hole</strong><br>
Ночной переход к Хин Дэнг</p>

<h3>День 2 — Хин Дэнг (4 погружения)</h3>
<p>07:30 Погружение 3 — <strong>Хин Дэнг</strong> (дрифт-дайв, отвесная стена, шанс на манту)<br>
10:30 Погружение 4 — <strong>Хин Дэнг Summit</strong> (стаи барракуд)<br>
14:00 Погружение 5 — <strong>Хин Дэнг East Wall</strong><br>
17:00 Погружение 6 — <strong>Хин Дэнг</strong> (ночное погружение, спящие акулы)</p>

<h3>День 3 — Хин Муанг и возвращение (4 погружения)</h3>
<p>07:30 Погружение 7 — <strong>Хин Муанг</strong> (отвесная стена, фиолетовые мягкие кораллы)<br>
10:30 Погружение 8 — <strong>Хин Муанг</strong> (ковёр анемонов, серые рифовые акулы)<br>
14:00 Погружение 9 — <strong>Хин Мусунг</strong> или <strong>Koh Dok Mai</strong><br>
Ночной переход обратно в Пхукет</p>

<h3>День 4 — Пхи-Пхи и возвращение (2 погружения)</h3>
<p>07:30 Погружение 10 — <strong>Рэк King Cruiser</strong> или <strong>Bida Nok</strong><br>
10:00 Погружение 11 — <strong>Шарк Пойнт</strong> (прощальное погружение)<br>
12:00 Обед, отдых<br>
15:00–16:00 Прибытие на Чалонг Пирс, выселение</p>`,
    },
    {
      lang: "ko",
      title: "힌무앙 – 힌대엥 3일 4박",
      slug: "hin-muang-hin-daeng-3d4n",
      excerpt: "세계적 다이브 사이트 힌대엥·힌무앙에 집중하는 10~12회 다이빙 — 절벽, 만타레이, 고래상어, 꼬하와 피피 경유.",
      route: "꼬하 — 힌대엥 — 힌무앙 — 피피 섬",
      keywords: ["힌대엥", "힌무앙", "꼬하", "만타레이", "절벽", "리브어보드"],
      content: `<h3>하이라이트</h3>
<ul>
<li><strong>힌대엥</strong> — 붉은 연산호 수직벽의 수중 봉우리; 만타레이와 고래상어</li>
<li><strong>힌무앙</strong> — 60m 이상의 수직벽, 보라색 연산호, 그레이 리프 상어</li>
<li><strong>꼬하</strong> — Cathedral Cave, 맑은 라군</li>
<li><strong>4~8회 다이빙</strong> 힌대엥-힌무앙에서 반복 다이빙 가능</li>
</ul>

<h3>다이브 사이트</h3>
<ul>
<li>꼬하 — Lagoon, Canyon, Yamashita's Hole</li>
<li>힌대엥 — East Wall, Summit, Drift</li>
<li>힌무앙 — Vertical Wall, Anemone Carpet</li>
<li>힌무숭 (조건에 따라)</li>
<li>킹크루저 난파선 또는 Bida Nok/Nai (복귀 중)</li>
</ul>

<h3>포함 사항</h3>
<ul>
<li>에어컨 캐빈, 전용 욕실, 3박</li>
<li>3식 + 간식, 과일 & 무제한 소프트 드링크 (주류 제외)</li>
<li>풀 다이빙 장비</li>
<li>다이빙 보험</li>
<li>다이브 가이드, 소그룹</li>
<li>무료 공항 픽업</li>
</ul>

<h3>불포함 사항</h3>
<ul>
<li>무꼬란타 국립공원 입장료 (약 600~900 ฿/인)</li>
<li>주류</li>
<li>나이트록스</li>
<li>팁 (권장 1,000~2,000 ฿/인)</li>
<li>투어 전후 숙소</li>
</ul>

<h3>항구 정보</h3>
<ul>
<li><strong>항구:</strong> 찰롱 피어, 푸켓</li>
<li><strong>체크인:</strong> 08:00~09:00 항구 집합</li>
<li><strong>체크아웃:</strong> 마지막 날 저녁</li>
</ul>

<h3>참고</h3>
<p>힌대엥-힌무앙은 조류가 강합니다. 어드밴스드 오픈워터 이상 권장.</p>`,
      itinerary: `<h3>1일차 — 승선 & 꼬하 (2회 다이빙)</h3>
<p>08:00~09:00 찰롱 피어 체크인<br>
꼬하로 출발<br>
14:00 다이빙 1 — <strong>Koh Haa Lagoon</strong> (체크 다이빙, 동굴, 라군)<br>
16:30 다이빙 2 — <strong>Koh Haa Canyon</strong> 또는 <strong>Yamashita's Hole</strong><br>
야간 항해로 힌대엥 이동</p>

<h3>2일차 — 힌대엥 (4회 다이빙)</h3>
<p>07:30 다이빙 3 — <strong>힌대엥</strong> (드리프트, 절벽, 만타 기대)<br>
10:30 다이빙 4 — <strong>힌대엥 Summit</strong> (바라쿠다 떼)<br>
14:00 다이빙 5 — <strong>힌대엥 East Wall</strong><br>
17:00 다이빙 6 — <strong>힌대엥</strong> (야간 다이빙, 잠자는 상어)</p>

<h3>3일차 — 힌무앙 & 복귀 (4회 다이빙)</h3>
<p>07:30 다이빙 7 — <strong>힌무앙</strong> (수직벽, 보라색 연산호)<br>
10:30 다이빙 8 — <strong>힌무앙</strong> (말미잘 카펫, 그레이 리프 상어)<br>
14:00 다이빙 9 — <strong>힌무숭</strong> 또는 <strong>Koh Dok Mai</strong><br>
야간 항해로 푸켓 복귀</p>

<h3>4일차 — 피피 & 복귀 (2회 다이빙)</h3>
<p>07:30 다이빙 10 — <strong>킹크루저 난파선</strong> 또는 <strong>Bida Nok</strong><br>
10:00 다이빙 11 — <strong>샤크포인트</strong> (페어웰 다이빙)<br>
12:00 점심, 휴식<br>
15:00~16:00 찰롱 피어 도착, 체크아웃</p>`,
    },
    {
      lang: "ja",
      title: "ヒンムアン – ヒンデーン 3日間4泊",
      slug: "hin-muang-hin-daeng-3d4n",
      excerpt: "ヒンデーン・ヒンムアンに集中する10〜12ダイブ — 垂直の壁、マンタレイ、ジンベエザメとの遭遇。コハーとピピ島も巡ります。",
      route: "コハー — ヒンデーン — ヒンムアン — ピピ島",
      keywords: ["ヒンデーン", "ヒンムアン", "コハー", "マンタ", "垂直の壁", "ダイブクルーズ"],
      content: `<h3>ハイライト</h3>
<ul>
<li><strong>ヒンデーン</strong> — 赤いソフトコーラルの垂直壁を持つ水中の岩山。マンタレイとジンベエザメ</li>
<li><strong>ヒンムアン</strong> — 60m以上の垂直壁、紫のソフトコーラル、オグロメジロザメ</li>
<li><strong>コハー</strong> — カテドラルケーブ、透明なラグーン</li>
<li><strong>4〜8ダイブ</strong>をヒンデーン・ヒンムアンで。同じサイトで複数回潜水可能</li>
</ul>

<h3>ダイブサイト</h3>
<ul>
<li>コハー — Lagoon、Canyon、Yamashita's Hole</li>
<li>ヒンデーン — East Wall、Summit、Drift</li>
<li>ヒンムアン — Vertical Wall、Anemone Carpet</li>
<li>ヒンムスン（条件次第）</li>
<li>キングクルーザー沈船またはBida Nok/Nai（帰路途中）</li>
</ul>

<h3>料金に含まれるもの</h3>
<ul>
<li>エアコン付きキャビン、専用バスルーム、3泊</li>
<li>1日3食＋スナック、フルーツ、ソフトドリンク飲み放題（アルコール除く）</li>
<li>フルダイビング器材</li>
<li>ダイビング保険</li>
<li>ダイブガイド、少人数制</li>
<li>無料空港送迎</li>
</ul>

<h3>料金に含まれないもの</h3>
<ul>
<li>ムコランタ国立公園入園料（約600〜900 ฿/名）</li>
<li>アルコール飲料</li>
<li>ナイトロックス</li>
<li>チップ（推奨 1,000〜2,000 ฿/名）</li>
<li>ツアー前後の宿泊</li>
</ul>

<h3>港の情報</h3>
<ul>
<li><strong>港：</strong>シャロン桟橋、プーケット</li>
<li><strong>チェックイン：</strong>08:00〜09:00 港集合</li>
<li><strong>チェックアウト：</strong>最終日の夕方</li>
</ul>

<h3>注意</h3>
<p>ヒンデーン・ヒンムアンは潮流が強いです。アドバンスドオープンウォーター以上のダイバー推奨。</p>`,
      itinerary: `<h3>1日目 — 乗船＆コハー（2ダイブ）</h3>
<p>08:00〜09:00 シャロン桟橋チェックイン<br>
コハーへ出発<br>
14:00 ダイブ1 — <strong>Koh Haa Lagoon</strong>（チェックダイブ、洞窟、ラグーン）<br>
16:30 ダイブ2 — <strong>Koh Haa Canyon</strong>または<strong>Yamashita's Hole</strong><br>
夜間航行でヒンデーンへ</p>

<h3>2日目 — ヒンデーン（4ダイブ）</h3>
<p>07:30 ダイブ3 — <strong>ヒンデーン</strong>（ドリフトダイブ、垂直壁、マンタのチャンス）<br>
10:30 ダイブ4 — <strong>ヒンデーン Summit</strong>（バラクーダの群れ）<br>
14:00 ダイブ5 — <strong>ヒンデーン East Wall</strong><br>
17:00 ダイブ6 — <strong>ヒンデーン</strong>（ナイトダイブ、眠るサメ）</p>

<h3>3日目 — ヒンムアン＆帰路（4ダイブ）</h3>
<p>07:30 ダイブ7 — <strong>ヒンムアン</strong>（垂直壁、紫のソフトコーラル）<br>
10:30 ダイブ8 — <strong>ヒンムアン</strong>（イソギンチャクのカーペット、オグロメジロザメ）<br>
14:00 ダイブ9 — <strong>ヒンムスン</strong>または<strong>Koh Dok Mai</strong><br>
夜間航行でプーケットへ</p>

<h3>4日目 — ピピ島＆帰港（2ダイブ）</h3>
<p>07:30 ダイブ10 — <strong>キングクルーザー沈船</strong>または<strong>Bida Nok</strong><br>
10:00 ダイブ11 — <strong>シャークポイント</strong>（フェアウェルダイブ）<br>
12:00 昼食、リラックス<br>
15:00〜16:00 シャロン桟橋到着、チェックアウト</p>`,
    },
  ],
},

// ═══════════════════════════════════════════════════════════════════════════
// 4. Racha-Phi Phi 3D4N — Trip #42
// ═══════════════════════════════════════════════════════════════════════════
{
  scheduleId: "cmnrmfiw00040tckzgtwwi0nk",
  routeName: "Racha-Phi Phi 3D4N",
  translations: [
    {
      lang: "en",
      title: "Racha – Phi Phi 3 Days 4 Nights",
      slug: "racha-phi-phi-3d4n",
      excerpt: "12 dives exploring crystal-clear Racha Islands with wrecks and stunning corals, then on to Phi Phi's Bida Nok and Bida Nai for leopard sharks and sea turtles.",
      route: "Racha Noi — Racha Yai — Phi Phi Islands",
      keywords: ["Racha", "Phi Phi", "Racha Yai", "Racha Noi", "Bida Nok", "Bida Nai", "liveaboard"],
      content: `<h3>Highlights</h3>
<ul>
<li><strong>Racha Noi</strong> — Crystal-clear visibility, South Tip with strong currents and chance of manta rays</li>
<li><strong>Racha Yai</strong> — Shipwrecks, hard corals, suitable for all levels</li>
<li><strong>Phi Phi — Bida Nok & Bida Nai</strong> — Vertical walls, leopard sharks, sea turtles, swim-throughs</li>
<li><strong>Suitable for all levels</strong> from Open Water and above</li>
</ul>

<h3>Dive Sites</h3>
<ul>
<li>Racha Noi — Banana Bay, South Tip</li>
<li>Racha Yai — Bay 1, Bay 2, Bungalow Bay, Wreck</li>
<li>Phi Phi — Bida Nok, Bida Nai, Palong Wall, Maya Bay</li>
</ul>

<h3>Included</h3>
<ul>
<li>Air-conditioned cabin with en-suite bathroom, 3 nights</li>
<li>3 meals + snacks, fruits & unlimited soft drinks (excluding alcohol)</li>
<li>Full dive equipment</li>
<li>Dive insurance</li>
<li>Dive guide, small groups</li>
<li>Free airport transfer: Phuket Airport ⇄ pier</li>
</ul>

<h3>Excluded</h3>
<ul>
<li>National park fees (approx. 600 ฿/person)</li>
<li>Alcoholic beverages</li>
<li>Nitrox</li>
<li>Tips (suggested 1,000–2,000 ฿/person)</li>
<li>Pre/post-trip accommodation</li>
</ul>

<h3>Port Information</h3>
<ul>
<li><strong>Port:</strong> Chalong Pier, Phuket</li>
<li><strong>Check-in:</strong> 19:00–20:00 at the pier</li>
<li><strong>Check-out:</strong> 10:00–14:00 on the last day</li>
</ul>`,
      itinerary: `<h3>Day 1 — Boarding & Night Dive (1 dive)</h3>
<p>19:00–20:00 Check-in at Chalong Pier, equipment setup, briefing<br>
Depart for Racha Noi<br>
21:00 Dive 1 — <strong>Racha Noi – Banana Bay</strong> (night dive)</p>

<h3>Day 2 — Racha Islands (4 dives)</h3>
<p>07:30 Dive 2 — <strong>Racha Noi – South Tip</strong> (wall, currents, big fish)<br>
10:30 Dive 3 — <strong>Racha Noi – Banana Bay</strong> (turtles, rays)<br>
14:00 Dive 4 — <strong>Racha Yai – Bay 1</strong> (hard corals, shallow reef)<br>
17:00 Dive 5 — <strong>Racha Yai – Bungalow Bay</strong> (sunset dive)<br>
Overnight transit to Phi Phi</p>

<h3>Day 3 — Racha Yai & Phi Phi (4 dives)</h3>
<p>07:30 Dive 6 — <strong>Racha Yai – Wreck</strong> (shipwreck, marine life)<br>
10:30 Dive 7 — <strong>Racha Yai – Bay 2</strong> (coral reef, underwater statues)<br>
Transit to Phi Phi<br>
14:00 Dive 8 — <strong>Phi Phi – Bida Nok</strong> (leopard sharks, wall)<br>
17:00 Dive 9 — <strong>Phi Phi – Bida Nai</strong> (caves, swim-throughs)</p>

<h3>Day 4 — Phi Phi & Return (3 dives)</h3>
<p>07:30 Dive 10 — <strong>Phi Phi – Palong Wall</strong> (soft corals, sea fans)<br>
10:00 Dive 11 — <strong>Phi Phi – Maya Bay</strong> (coral garden)<br>
12:00 Dive 12 — <strong>Shark Point</strong> (farewell dive)<br>
Return to Phuket<br>
15:00–16:00 Arrive Chalong Pier, check-out</p>`,
    },
    {
      lang: "cn",
      title: "皇帝岛-皮皮岛 3天4夜",
      slug: "racha-phi-phi-3d4n",
      excerpt: "12潜探索清澈的皇帝岛（沉船和珊瑚），再到皮皮岛Bida Nok和Bida Nai寻觅豹纹鲨和海龟。",
      route: "皇帝岛小岛 — 皇帝岛大岛 — 皮皮岛",
      keywords: ["皇帝岛", "皮皮岛", "Racha Yai", "Racha Noi", "Bida Nok", "Bida Nai", "船宿"],
      content: `<h3>亮点</h3>
<ul>
<li><strong>皇帝岛小岛 (Racha Noi)</strong> — 能见度极高，South Tip水流强劲可遇蝠鲼</li>
<li><strong>皇帝岛大岛 (Racha Yai)</strong> — 沉船、硬珊瑚，适合所有级别</li>
<li><strong>皮皮岛 Bida Nok & Bida Nai</strong> — 峭壁、豹纹鲨、海龟、穿越泳道</li>
<li><strong>适合所有级别</strong>，开放水域潜水员即可参加</li>
</ul>

<h3>潜点</h3>
<ul>
<li>皇帝岛小岛 — Banana Bay、South Tip</li>
<li>皇帝岛大岛 — Bay 1、Bay 2、Bungalow Bay、沉船</li>
<li>皮皮岛 — Bida Nok、Bida Nai、Palong Wall、Maya Bay</li>
</ul>

<h3>费用包含</h3>
<ul>
<li>空调客舱，独立卫浴，3晚</li>
<li>一日三餐 + 点心水果及无限量软饮</li>
<li>全套潜水装备</li>
<li>潜水保险</li>
<li>潜导带队，小团</li>
<li>普吉机场 ⇄ 码头免费接送</li>
</ul>

<h3>费用不含</h3>
<ul>
<li>国家公园费（约600泰铢/人）</li>
<li>含酒精饮料</li>
<li>高氧 Nitrox</li>
<li>小费（建议1,000-2,000泰铢/人）</li>
<li>行程前后住宿</li>
</ul>

<h3>码头信息</h3>
<ul>
<li><strong>码头：</strong>查龙码头，普吉</li>
<li><strong>登船：</strong>19:00-20:00</li>
<li><strong>离船：</strong>10:00-14:00 最后一天</li>
</ul>`,
      itinerary: `<h3>第1天 — 登船 & 夜潜（1潜）</h3>
<p>19:00-20:00 查龙码头办理登船、整理装备、简报<br>
出发前往皇帝岛小岛<br>
21:00 第1潜 — <strong>Racha Noi - Banana Bay</strong>（夜潜）</p>

<h3>第2天 — 皇帝岛（4潜）</h3>
<p>07:30 第2潜 — <strong>Racha Noi - South Tip</strong>（峭壁、水流、大鱼）<br>
10:30 第3潜 — <strong>Racha Noi - Banana Bay</strong>（海龟、鳐鱼）<br>
14:00 第4潜 — <strong>Racha Yai - Bay 1</strong>（硬珊瑚、浅礁）<br>
17:00 第5潜 — <strong>Racha Yai - Bungalow Bay</strong>（日落潜）<br>
夜间航行至皮皮岛</p>

<h3>第3天 — 皇帝岛大岛 & 皮皮岛（4潜）</h3>
<p>07:30 第6潜 — <strong>Racha Yai - 沉船</strong>（沉船、海洋生物）<br>
10:30 第7潜 — <strong>Racha Yai - Bay 2</strong>（珊瑚礁、水下雕像）<br>
航行至皮皮岛<br>
14:00 第8潜 — <strong>皮皮岛 - Bida Nok</strong>（豹纹鲨、峭壁）<br>
17:00 第9潜 — <strong>皮皮岛 - Bida Nai</strong>（洞穴、穿越）</p>

<h3>第4天 — 皮皮岛 & 返回（3潜）</h3>
<p>07:30 第10潜 — <strong>皮皮岛 - Palong Wall</strong>（软珊瑚、海扇）<br>
10:00 第11潜 — <strong>皮皮岛 - Maya Bay</strong>（珊瑚花园）<br>
12:00 第12潜 — <strong>鲨鱼角</strong>（告别潜）<br>
返回普吉<br>
15:00-16:00 抵达查龙码头，退房</p>`,
    },
    {
      lang: "de",
      title: "Racha – Phi Phi 3 Tage 4 Nächte",
      slug: "racha-phi-phi-3t4n",
      excerpt: "12 Tauchgänge an den kristallklaren Racha-Inseln mit Wracks und Korallen, dann weiter nach Phi Phi zu Bida Nok und Bida Nai für Leopardenhaie und Meeresschildkröten.",
      route: "Racha Noi — Racha Yai — Phi Phi Inseln",
      keywords: ["Racha", "Phi Phi", "Racha Yai", "Racha Noi", "Bida Nok", "Bida Nai", "Tauchsafari"],
      content: `<h3>Highlights</h3>
<ul>
<li><strong>Racha Noi</strong> — Kristallklare Sicht, South Tip mit starken Strömungen und Mantarochen-Chance</li>
<li><strong>Racha Yai</strong> — Schiffswracks, Hartkorallen, für alle Niveaus geeignet</li>
<li><strong>Phi Phi — Bida Nok & Bida Nai</strong> — Steilwände, Leopardenhaie, Schildkröten, Durchschwimmstellen</li>
<li><strong>Für alle Niveaus</strong> ab Open Water geeignet</li>
</ul>

<h3>Tauchplätze</h3>
<ul>
<li>Racha Noi — Banana Bay, South Tip</li>
<li>Racha Yai — Bay 1, Bay 2, Bungalow Bay, Wrack</li>
<li>Phi Phi — Bida Nok, Bida Nai, Palong Wall, Maya Bay</li>
</ul>

<h3>Inklusive</h3>
<ul>
<li>Klimatisierte Kabine mit eigenem Bad, 3 Nächte</li>
<li>3 Mahlzeiten + Snacks, Obst & unbegrenzt Softdrinks</li>
<li>Komplette Tauchausrüstung</li>
<li>Tauchversicherung</li>
<li>Tauchguide, Kleingruppen</li>
<li>Kostenloser Flughafentransfer</li>
</ul>

<h3>Exklusive</h3>
<ul>
<li>Nationalparkgebühren (ca. 600 ฿/Person)</li>
<li>Alkoholische Getränke</li>
<li>Nitrox</li>
<li>Trinkgeld (empfohlen 1.000–2.000 ฿/Person)</li>
<li>Unterkunft vor/nach der Tour</li>
</ul>

<h3>Hafeninformation</h3>
<ul>
<li><strong>Hafen:</strong> Chalong Pier, Phuket</li>
<li><strong>Check-in:</strong> 19:00–20:00</li>
<li><strong>Check-out:</strong> 10:00–14:00 am letzten Tag</li>
</ul>`,
      itinerary: `<h3>Tag 1 — Einschiffung & Nachttauchgang (1 TG)</h3>
<p>19:00–20:00 Check-in am Chalong Pier, Ausrüstung, Briefing<br>
Abfahrt nach Racha Noi<br>
21:00 TG 1 — <strong>Racha Noi – Banana Bay</strong> (Nachttauchgang)</p>

<h3>Tag 2 — Racha-Inseln (4 TG)</h3>
<p>07:30 TG 2 — <strong>Racha Noi – South Tip</strong> (Wand, Strömung, große Fische)<br>
10:30 TG 3 — <strong>Racha Noi – Banana Bay</strong> (Schildkröten, Rochen)<br>
14:00 TG 4 — <strong>Racha Yai – Bay 1</strong> (Hartkorallen, Flachwasser)<br>
17:00 TG 5 — <strong>Racha Yai – Bungalow Bay</strong> (Sonnenuntergangs-TG)<br>
Nachtfahrt nach Phi Phi</p>

<h3>Tag 3 — Racha Yai & Phi Phi (4 TG)</h3>
<p>07:30 TG 6 — <strong>Racha Yai – Wrack</strong> (Schiffswrack, Meeresleben)<br>
10:30 TG 7 — <strong>Racha Yai – Bay 2</strong> (Korallenriff, Unterwasserstatuen)<br>
Fahrt nach Phi Phi<br>
14:00 TG 8 — <strong>Phi Phi – Bida Nok</strong> (Leopardenhaie, Wand)<br>
17:00 TG 9 — <strong>Phi Phi – Bida Nai</strong> (Höhlen, Durchschwimmstellen)</p>

<h3>Tag 4 — Phi Phi & Rückkehr (3 TG)</h3>
<p>07:30 TG 10 — <strong>Phi Phi – Palong Wall</strong> (Weichkorallen, Fächerkorallen)<br>
10:00 TG 11 — <strong>Phi Phi – Maya Bay</strong> (Korallengarten)<br>
12:00 TG 12 — <strong>Shark Point</strong> (Abschieds-TG)<br>
Rückfahrt nach Phuket<br>
15:00–16:00 Ankunft Chalong Pier, Check-out</p>`,
    },
    {
      lang: "fr",
      title: "Racha – Phi Phi 3 Jours 4 Nuits",
      slug: "racha-phi-phi-3j4n",
      excerpt: "12 plongées aux îles Racha limpides avec épaves et coraux, puis Phi Phi à Bida Nok et Bida Nai pour les requins-léopards et tortues marines.",
      route: "Racha Noi — Racha Yai — Îles Phi Phi",
      keywords: ["Racha", "Phi Phi", "Racha Yai", "Racha Noi", "Bida Nok", "Bida Nai", "croisière plongée"],
      content: `<h3>Points forts</h3>
<ul>
<li><strong>Racha Noi</strong> — Visibilité cristalline, South Tip avec courants forts et chance de manta</li>
<li><strong>Racha Yai</strong> — Épaves, coraux durs, adapté à tous les niveaux</li>
<li><strong>Phi Phi — Bida Nok & Bida Nai</strong> — Parois, requins-léopards, tortues, passages</li>
<li><strong>Pour tous niveaux</strong> à partir d'Open Water</li>
</ul>

<h3>Sites de plongée</h3>
<ul>
<li>Racha Noi — Banana Bay, South Tip</li>
<li>Racha Yai — Bay 1, Bay 2, Bungalow Bay, Épave</li>
<li>Phi Phi — Bida Nok, Bida Nai, Palong Wall, Maya Bay</li>
</ul>

<h3>Inclus</h3>
<ul>
<li>Cabine climatisée avec salle de bain, 3 nuits</li>
<li>3 repas + collations, fruits & boissons à volonté</li>
<li>Équipement complet</li>
<li>Assurance plongée</li>
<li>Guide, petits groupes</li>
<li>Transfert aéroport gratuit</li>
</ul>

<h3>Non inclus</h3>
<ul>
<li>Frais de parc national (env. 600 ฿/pers.)</li>
<li>Boissons alcoolisées</li>
<li>Nitrox</li>
<li>Pourboires (suggéré 1 000–2 000 ฿/pers.)</li>
<li>Hébergement avant/après</li>
</ul>

<h3>Informations portuaires</h3>
<ul>
<li><strong>Port :</strong> Chalong Pier, Phuket</li>
<li><strong>Embarquement :</strong> 19h00–20h00</li>
<li><strong>Débarquement :</strong> 10h00–14h00 dernier jour</li>
</ul>`,
      itinerary: `<h3>Jour 1 — Embarquement & Plongée de nuit (1 plongée)</h3>
<p>19h00–20h00 Enregistrement à Chalong Pier, matériel, briefing<br>
Départ vers Racha Noi<br>
21h00 Plongée 1 — <strong>Racha Noi – Banana Bay</strong> (plongée de nuit)</p>

<h3>Jour 2 — Îles Racha (4 plongées)</h3>
<p>07h30 Plongée 2 — <strong>Racha Noi – South Tip</strong> (paroi, courants, gros poissons)<br>
10h30 Plongée 3 — <strong>Racha Noi – Banana Bay</strong> (tortues, raies)<br>
14h00 Plongée 4 — <strong>Racha Yai – Bay 1</strong> (coraux durs, récif peu profond)<br>
17h00 Plongée 5 — <strong>Racha Yai – Bungalow Bay</strong> (plongée au coucher du soleil)<br>
Navigation nocturne vers Phi Phi</p>

<h3>Jour 3 — Racha Yai & Phi Phi (4 plongées)</h3>
<p>07h30 Plongée 6 — <strong>Racha Yai – Épave</strong> (épave, vie marine)<br>
10h30 Plongée 7 — <strong>Racha Yai – Bay 2</strong> (récif, statues sous-marines)<br>
Navigation vers Phi Phi<br>
14h00 Plongée 8 — <strong>Phi Phi – Bida Nok</strong> (requins-léopards, paroi)<br>
17h00 Plongée 9 — <strong>Phi Phi – Bida Nai</strong> (grottes, passages)</p>

<h3>Jour 4 — Phi Phi & Retour (3 plongées)</h3>
<p>07h30 Plongée 10 — <strong>Phi Phi – Palong Wall</strong> (coraux mous, gorgones)<br>
10h00 Plongée 11 — <strong>Phi Phi – Maya Bay</strong> (jardin de corail)<br>
12h00 Plongée 12 — <strong>Shark Point</strong> (plongée d'adieu)<br>
Retour vers Phuket<br>
15h00–16h00 Arrivée Chalong Pier, check-out</p>`,
    },
    {
      lang: "ru",
      title: "Рача – Пхи-Пхи 3 дня 4 ночи",
      slug: "racha-phi-phi-3d4n",
      excerpt: "12 погружений у кристально чистых островов Рача с рэками и кораллами, затем Пхи-Пхи — Bida Nok и Bida Nai с леопардовыми акулами и морскими черепахами.",
      route: "Рача Ной — Рача Яй — Острова Пхи-Пхи",
      keywords: ["Рача", "Пхи-Пхи", "Рача Яй", "Рача Ной", "Bida Nok", "Bida Nai", "дайв-сафари"],
      content: `<h3>Особенности</h3>
<ul>
<li><strong>Рача Ной</strong> — Кристальная видимость, South Tip с сильными течениями и шансом на манту</li>
<li><strong>Рача Яй</strong> — Затонувшие суда, жёсткие кораллы, подходит для всех уровней</li>
<li><strong>Пхи-Пхи — Bida Nok & Bida Nai</strong> — Отвесные стены, леопардовые акулы, черепахи, проплывы</li>
<li><strong>Для всех уровней</strong> от Open Water и выше</li>
</ul>

<h3>Дайв-сайты</h3>
<ul>
<li>Рача Ной — Banana Bay, South Tip</li>
<li>Рача Яй — Bay 1, Bay 2, Bungalow Bay, Wreck</li>
<li>Пхи-Пхи — Bida Nok, Bida Nai, Palong Wall, Maya Bay</li>
</ul>

<h3>Включено</h3>
<ul>
<li>Каюта с кондиционером и ванной, 3 ночи</li>
<li>3-разовое питание + снеки, фрукты и безлимитные напитки</li>
<li>Полный комплект снаряжения</li>
<li>Страховка дайвинга</li>
<li>Дайв-гид, малые группы</li>
<li>Бесплатный трансфер из аэропорта</li>
</ul>

<h3>Не включено</h3>
<ul>
<li>Сборы национального парка (прим. 600 ฿/чел.)</li>
<li>Алкогольные напитки</li>
<li>Найтрокс</li>
<li>Чаевые (рекомендуется 1 000–2 000 ฿/чел.)</li>
<li>Проживание до/после тура</li>
</ul>

<h3>Информация о порте</h3>
<ul>
<li><strong>Порт:</strong> Чалонг Пирс, Пхукет</li>
<li><strong>Посадка:</strong> 19:00–20:00</li>
<li><strong>Высадка:</strong> 10:00–14:00 в последний день</li>
</ul>`,
      itinerary: `<h3>День 1 — Посадка и ночное погружение (1 погружение)</h3>
<p>19:00–20:00 Регистрация на Чалонг Пирс, снаряжение, брифинг<br>
Отправление к Рача Ной<br>
21:00 Погружение 1 — <strong>Рача Ной – Banana Bay</strong> (ночное погружение)</p>

<h3>День 2 — Острова Рача (4 погружения)</h3>
<p>07:30 Погружение 2 — <strong>Рача Ной – South Tip</strong> (стена, течения, крупная рыба)<br>
10:30 Погружение 3 — <strong>Рача Ной – Banana Bay</strong> (черепахи, скаты)<br>
14:00 Погружение 4 — <strong>Рача Яй – Bay 1</strong> (жёсткие кораллы, мелководье)<br>
17:00 Погружение 5 — <strong>Рача Яй – Bungalow Bay</strong> (закатное погружение)<br>
Ночной переход к Пхи-Пхи</p>

<h3>День 3 — Рача Яй и Пхи-Пхи (4 погружения)</h3>
<p>07:30 Погружение 6 — <strong>Рача Яй – Рэк</strong> (затонувший корабль)<br>
10:30 Погружение 7 — <strong>Рача Яй – Bay 2</strong> (риф, подводные статуи)<br>
Переход к Пхи-Пхи<br>
14:00 Погружение 8 — <strong>Пхи-Пхи – Bida Nok</strong> (леопардовые акулы, стена)<br>
17:00 Погружение 9 — <strong>Пхи-Пхи – Bida Nai</strong> (пещеры, проплывы)</p>

<h3>День 4 — Пхи-Пхи и возвращение (3 погружения)</h3>
<p>07:30 Погружение 10 — <strong>Пхи-Пхи – Palong Wall</strong> (мягкие кораллы, горгонарии)<br>
10:00 Погружение 11 — <strong>Пхи-Пхи – Maya Bay</strong> (коралловый сад)<br>
12:00 Погружение 12 — <strong>Шарк Пойнт</strong> (прощальное погружение)<br>
Возвращение в Пхукет<br>
15:00–16:00 Прибытие на Чалонг Пирс, выселение</p>`,
    },
    {
      lang: "ko",
      title: "라차 – 피피 3일 4박",
      slug: "racha-phi-phi-3d4n",
      excerpt: "맑은 라차 제도에서 난파선과 산호 12회 다이빙, 이어서 피피 섬 Bida Nok·Bida Nai에서 표범상어와 바다거북을 만납니다.",
      route: "라차노이 — 라차야이 — 피피 섬",
      keywords: ["라차", "피피", "라차야이", "라차노이", "Bida Nok", "Bida Nai", "리브어보드"],
      content: `<h3>하이라이트</h3>
<ul>
<li><strong>라차노이</strong> — 최고의 시야, South Tip 강한 조류와 만타레이 기회</li>
<li><strong>라차야이</strong> — 침몰선, 경산호, 모든 레벨 적합</li>
<li><strong>피피 — Bida Nok & Bida Nai</strong> — 절벽, 표범상어, 바다거북, 스윔스루</li>
<li><strong>모든 레벨 가능</strong> 오픈워터 이상</li>
</ul>

<h3>다이브 사이트</h3>
<ul>
<li>라차노이 — Banana Bay, South Tip</li>
<li>라차야이 — Bay 1, Bay 2, Bungalow Bay, Wreck</li>
<li>피피 — Bida Nok, Bida Nai, Palong Wall, Maya Bay</li>
</ul>

<h3>포함 사항</h3>
<ul>
<li>에어컨 캐빈, 전용 욕실, 3박</li>
<li>3식 + 간식, 과일 & 무제한 소프트 드링크</li>
<li>풀 다이빙 장비</li>
<li>다이빙 보험</li>
<li>다이브 가이드, 소그룹</li>
<li>무료 공항 픽업</li>
</ul>

<h3>불포함 사항</h3>
<ul>
<li>국립공원 입장료 (약 600 ฿/인)</li>
<li>주류</li>
<li>나이트록스</li>
<li>팁 (권장 1,000~2,000 ฿/인)</li>
<li>투어 전후 숙소</li>
</ul>

<h3>항구 정보</h3>
<ul>
<li><strong>항구:</strong> 찰롱 피어, 푸켓</li>
<li><strong>체크인:</strong> 19:00~20:00</li>
<li><strong>체크아웃:</strong> 10:00~14:00 마지막 날</li>
</ul>`,
      itinerary: `<h3>1일차 — 승선 & 야간 다이빙 (1회)</h3>
<p>19:00~20:00 찰롱 피어 체크인, 장비, 브리핑<br>
라차노이로 출발<br>
21:00 다이빙 1 — <strong>Racha Noi – Banana Bay</strong> (야간 다이빙)</p>

<h3>2일차 — 라차 제도 (4회)</h3>
<p>07:30 다이빙 2 — <strong>Racha Noi – South Tip</strong> (벽, 조류, 대형 어류)<br>
10:30 다이빙 3 — <strong>Racha Noi – Banana Bay</strong> (거북, 가오리)<br>
14:00 다이빙 4 — <strong>Racha Yai – Bay 1</strong> (경산호, 얕은 리프)<br>
17:00 다이빙 5 — <strong>Racha Yai – Bungalow Bay</strong> (선셋 다이빙)<br>
야간 항해로 피피 이동</p>

<h3>3일차 — 라차야이 & 피피 (4회)</h3>
<p>07:30 다이빙 6 — <strong>Racha Yai – Wreck</strong> (침몰선)<br>
10:30 다이빙 7 — <strong>Racha Yai – Bay 2</strong> (산호, 수중 조각상)<br>
피피로 이동<br>
14:00 다이빙 8 — <strong>피피 – Bida Nok</strong> (표범상어, 벽)<br>
17:00 다이빙 9 — <strong>피피 – Bida Nai</strong> (동굴, 스윔스루)</p>

<h3>4일차 — 피피 & 복귀 (3회)</h3>
<p>07:30 다이빙 10 — <strong>피피 – Palong Wall</strong> (연산호, 부채산호)<br>
10:00 다이빙 11 — <strong>피피 – Maya Bay</strong> (산호 정원)<br>
12:00 다이빙 12 — <strong>샤크포인트</strong> (페어웰 다이빙)<br>
푸켓 복귀<br>
15:00~16:00 찰롱 피어 도착, 체크아웃</p>`,
    },
    {
      lang: "ja",
      title: "ラチャ – ピピ 3日間4泊",
      slug: "racha-phi-phi-3d4n",
      excerpt: "透明度抜群のラチャ諸島で沈船とサンゴの12ダイブ、そしてピピ島のBida Nok・Bida Naiでトラフザメとウミガメに出会います。",
      route: "ラチャノイ — ラチャヤイ — ピピ島",
      keywords: ["ラチャ", "ピピ", "ラチャヤイ", "ラチャノイ", "Bida Nok", "Bida Nai", "ダイブクルーズ"],
      content: `<h3>ハイライト</h3>
<ul>
<li><strong>ラチャノイ</strong> — 抜群の透明度、South Tipは強い潮流でマンタレイのチャンスも</li>
<li><strong>ラチャヤイ</strong> — 沈船、ハードコーラル、全レベル対応</li>
<li><strong>ピピ島 — Bida Nok＆Bida Nai</strong> — 垂直壁、トラフザメ、ウミガメ、スイムスルー</li>
<li><strong>全レベル対応</strong> オープンウォーター以上</li>
</ul>

<h3>ダイブサイト</h3>
<ul>
<li>ラチャノイ — Banana Bay、South Tip</li>
<li>ラチャヤイ — Bay 1、Bay 2、Bungalow Bay、沈船</li>
<li>ピピ島 — Bida Nok、Bida Nai、Palong Wall、Maya Bay</li>
</ul>

<h3>料金に含まれるもの</h3>
<ul>
<li>エアコン付きキャビン、専用バスルーム、3泊</li>
<li>1日3食＋スナック、フルーツ、ソフトドリンク飲み放題</li>
<li>フルダイビング器材</li>
<li>ダイビング保険</li>
<li>ダイブガイド、少人数制</li>
<li>無料空港送迎</li>
</ul>

<h3>料金に含まれないもの</h3>
<ul>
<li>国立公園入園料（約600 ฿/名）</li>
<li>アルコール飲料</li>
<li>ナイトロックス</li>
<li>チップ（推奨 1,000〜2,000 ฿/名）</li>
<li>ツアー前後の宿泊</li>
</ul>

<h3>港の情報</h3>
<ul>
<li><strong>港：</strong>シャロン桟橋、プーケット</li>
<li><strong>チェックイン：</strong>19:00〜20:00</li>
<li><strong>チェックアウト：</strong>10:00〜14:00 最終日</li>
</ul>`,
      itinerary: `<h3>1日目 — 乗船＆ナイトダイブ（1ダイブ）</h3>
<p>19:00〜20:00 シャロン桟橋チェックイン、器材セットアップ、ブリーフィング<br>
ラチャノイへ出発<br>
21:00 ダイブ1 — <strong>ラチャノイ – Banana Bay</strong>（ナイトダイブ）</p>

<h3>2日目 — ラチャ諸島（4ダイブ）</h3>
<p>07:30 ダイブ2 — <strong>ラチャノイ – South Tip</strong>（壁、潮流、大型魚）<br>
10:30 ダイブ3 — <strong>ラチャノイ – Banana Bay</strong>（ウミガメ、エイ）<br>
14:00 ダイブ4 — <strong>ラチャヤイ – Bay 1</strong>（ハードコーラル、浅瀬）<br>
17:00 ダイブ5 — <strong>ラチャヤイ – Bungalow Bay</strong>（サンセットダイブ）<br>
夜間航行でピピ島へ</p>

<h3>3日目 — ラチャヤイ＆ピピ島（4ダイブ）</h3>
<p>07:30 ダイブ6 — <strong>ラチャヤイ – 沈船</strong>（沈船、海洋生物）<br>
10:30 ダイブ7 — <strong>ラチャヤイ – Bay 2</strong>（サンゴ礁、水中彫刻）<br>
ピピ島へ移動<br>
14:00 ダイブ8 — <strong>ピピ島 – Bida Nok</strong>（トラフザメ、壁）<br>
17:00 ダイブ9 — <strong>ピピ島 – Bida Nai</strong>（洞窟、スイムスルー）</p>

<h3>4日目 — ピピ島＆帰港（3ダイブ）</h3>
<p>07:30 ダイブ10 — <strong>ピピ島 – Palong Wall</strong>（ソフトコーラル、ウミウチワ）<br>
10:00 ダイブ11 — <strong>ピピ島 – Maya Bay</strong>（サンゴの庭）<br>
12:00 ダイブ12 — <strong>シャークポイント</strong>（フェアウェルダイブ）<br>
プーケットへ帰港<br>
15:00〜16:00 シャロン桟橋到着、チェックアウト</p>`,
    },
  ],
},

// ═══════════════════════════════════════════════════════════════════════════
// 5. Koh Lipe 3D4N — Trip #46
// ═══════════════════════════════════════════════════════════════════════════
{
  scheduleId: "cmnrmfiwr005ctckzl6mndyww",
  routeName: "Koh Lipe 3D4N",
  translations: [
    {
      lang: "en",
      title: "Koh Lipe 3 Days 4 Nights",
      slug: "koh-lipe-3d4n",
      excerpt: "10–12 dives on the southernmost Andaman route — from Hin Daeng–Hin Muang down to Koh Lipe, exploring 8 Mile Rock and Stonehenge, rare and special dive sites.",
      route: "Koh Haa — Hin Daeng — Hin Muang — 8 Mile Rock — Stonehenge — Koh Lipe",
      keywords: ["Koh Lipe", "8 Mile Rock", "Stonehenge", "Tarutao", "South Andaman", "liveaboard"],
      content: `<h3>Highlights</h3>
<ul>
<li><strong>8 Mile Rock</strong> — Remote underwater rock in deep ocean; chance to encounter whale sharks and big pelagics</li>
<li><strong>Stonehenge</strong> — Unique underwater coral arch formations near Koh Adang</li>
<li><strong>Koh Lipe</strong> — Crystal-clear water, pristine corals, diverse marine life</li>
<li><strong>Hin Daeng–Hin Muang</strong> — En-route stop; manta ray chance</li>
<li><strong>Tarutao National Park</strong> — Unspoiled nature, uncrowded dive sites</li>
</ul>

<h3>Dive Sites</h3>
<ul>
<li>Koh Haa — Lagoon, Canyon</li>
<li>Hin Daeng & Hin Muang (en route)</li>
<li>8 Mile Rock</li>
<li>Stonehenge (Koh Adang)</li>
<li>Shark Fin Reef</li>
<li>Hin Musung</li>
<li>Koh Lipe House Reef</li>
</ul>

<h3>Included</h3>
<ul>
<li>Air-conditioned cabin with en-suite bathroom, 3 nights</li>
<li>3 meals + snacks, fruits & unlimited soft drinks (excluding alcohol)</li>
<li>Full dive equipment</li>
<li>Dive insurance</li>
<li>Dive guide, small groups</li>
<li>Free airport transfer: Phuket Airport ⇄ pier</li>
</ul>

<h3>Excluded</h3>
<ul>
<li>Tarutao National Park fees (approx. 600 ฿/person)</li>
<li>Alcoholic beverages</li>
<li>Nitrox</li>
<li>Tips (suggested 1,000–2,000 ฿/person)</li>
<li>Pre/post-trip accommodation</li>
</ul>

<h3>Port Information</h3>
<ul>
<li><strong>Port:</strong> Chalong Pier, Phuket</li>
<li><strong>Check-in:</strong> Morning of Day 1</li>
<li><strong>Check-out:</strong> Evening of the last day</li>
</ul>

<h3>Note</h3>
<p>This is a long-distance route with extended transit times. Weather and currents may affect dive site accessibility. Recommended for Advanced Open Water divers and above.</p>`,
      itinerary: `<h3>Day 1 — Boarding & Koh Haa (2 dives)</h3>
<p>Morning check-in at Chalong Pier, equipment setup, briefing<br>
Depart for Koh Haa<br>
14:00 Dive 1 — <strong>Koh Haa Lagoon</strong> (check dive)<br>
16:30 Dive 2 — <strong>Koh Haa Canyon</strong><br>
Overnight transit southward</p>

<h3>Day 2 — Hin Daeng–Hin Muang & South (4 dives)</h3>
<p>07:30 Dive 3 — <strong>Hin Daeng</strong> (vertical wall, manta chance)<br>
10:30 Dive 4 — <strong>Hin Muang</strong> (purple soft corals)<br>
14:00 Dive 5 — <strong>8 Mile Rock</strong> (deep-sea rock, whale shark chance)<br>
17:00 Dive 6 — <strong>Hin Musung</strong><br>
Transit to Koh Lipe</p>

<h3>Day 3 — Koh Lipe & Koh Adang (4 dives)</h3>
<p>07:30 Dive 7 — <strong>Stonehenge</strong> (coral arches, Koh Adang)<br>
10:30 Dive 8 — <strong>Shark Fin Reef</strong> (sharks, rays)<br>
14:00 Dive 9 — <strong>Koh Lipe House Reef</strong> (pristine corals)<br>
17:00 Dive 10 — <strong>8 Mile Rock</strong> (sunset dive)<br>
Overnight return to Phuket</p>

<h3>Day 4 — Return (2 dives)</h3>
<p>07:30 Dive 11 — <strong>Shark Point</strong> or <strong>Bida Nok</strong> (en route)<br>
10:00 Dive 12 — <strong>Anemone Reef</strong> (farewell dive)<br>
Lunch, relax<br>
15:00–16:00 Arrive Chalong Pier, check-out</p>`,
    },
    {
      lang: "cn",
      title: "丽贝岛 3天4夜",
      slug: "koh-lipe-3d4n",
      excerpt: "10-12潜，安达曼最南线路——从红石紫石南下丽贝岛，探索8 Mile Rock和Stonehenge等稀有潜点。",
      route: "甲米五岛 — 红石 — 紫石 — 8 Mile Rock — Stonehenge — 丽贝岛",
      keywords: ["丽贝岛", "8 Mile Rock", "Stonehenge", "达鲁岛", "南安达曼", "船宿"],
      content: `<h3>亮点</h3>
<ul>
<li><strong>8 Mile Rock</strong> — 深海中的孤立岩石，有机会遇到鲸鲨和大型远洋鱼类</li>
<li><strong>Stonehenge</strong> — 阿当岛附近独特的水下珊瑚拱门</li>
<li><strong>丽贝岛</strong> — 清澈海水，原始珊瑚，丰富海洋生物</li>
<li><strong>红石-紫石</strong> — 途经停靠，邂逅蝠鲼</li>
<li><strong>达鲁岛国家公园</strong> — 原始自然，潜点人少</li>
</ul>

<h3>潜点</h3>
<ul>
<li>甲米五岛 — Lagoon、Canyon</li>
<li>红石 & 紫石（途经）</li>
<li>8 Mile Rock</li>
<li>Stonehenge（阿当岛）</li>
<li>Shark Fin Reef</li>
<li>Hin Musung</li>
<li>丽贝岛 House Reef</li>
</ul>

<h3>费用包含</h3>
<ul>
<li>空调客舱，独立卫浴，3晚</li>
<li>一日三餐 + 点心水果及无限量软饮</li>
<li>全套潜水装备</li>
<li>潜水保险</li>
<li>潜导带队，小团</li>
<li>普吉机场 ⇄ 码头免费接送</li>
</ul>

<h3>费用不含</h3>
<ul>
<li>达鲁岛国家公园费（约600泰铢/人）</li>
<li>含酒精饮料</li>
<li>高氧 Nitrox</li>
<li>小费（建议1,000-2,000泰铢/人）</li>
<li>行程前后住宿</li>
</ul>

<h3>码头信息</h3>
<ul>
<li><strong>码头：</strong>查龙码头，普吉</li>
<li><strong>登船：</strong>第一天早上</li>
<li><strong>离船：</strong>最后一天傍晚</li>
</ul>

<h3>备注</h3>
<p>此线路行程较远，航行时间长。天气和水流可能影响可达潜点。建议进阶开放水域潜水员（AOW）及以上。</p>`,
      itinerary: `<h3>第1天 — 登船 & 甲米五岛（2潜）</h3>
<p>早上 查龙码头办理登船、整理装备、简报<br>
出发前往甲米五岛<br>
14:00 第1潜 — <strong>Koh Haa Lagoon</strong>（检查潜）<br>
16:30 第2潜 — <strong>Koh Haa Canyon</strong><br>
夜间南下航行</p>

<h3>第2天 — 红石紫石 & 南下（4潜）</h3>
<p>07:30 第3潜 — <strong>红石</strong>（垂直墙、邂逅蝠鲼）<br>
10:30 第4潜 — <strong>紫石</strong>（紫色软珊瑚）<br>
14:00 第5潜 — <strong>8 Mile Rock</strong>（深海岩石、鲸鲨机会）<br>
17:00 第6潜 — <strong>Hin Musung</strong><br>
航行至丽贝岛</p>

<h3>第3天 — 丽贝岛 & 阿当岛（4潜）</h3>
<p>07:30 第7潜 — <strong>Stonehenge</strong>（珊瑚拱门、阿当岛）<br>
10:30 第8潜 — <strong>Shark Fin Reef</strong>（鲨鱼、鳐鱼）<br>
14:00 第9潜 — <strong>丽贝岛 House Reef</strong>（原始珊瑚）<br>
17:00 第10潜 — <strong>8 Mile Rock</strong>（日落潜）<br>
夜间返回普吉</p>

<h3>第4天 — 返回（2潜）</h3>
<p>07:30 第11潜 — <strong>鲨鱼角</strong>或<strong>Bida Nok</strong>（途中）<br>
10:00 第12潜 — <strong>海葵礁</strong>（告别潜）<br>
午餐、休息<br>
15:00-16:00 抵达查龙码头，退房</p>`,
    },
    {
      lang: "de",
      title: "Koh Lipe 3 Tage 4 Nächte",
      slug: "koh-lipe-3t4n",
      excerpt: "10–12 Tauchgänge auf der südlichsten Andamanen-Route — von Hin Daeng–Hin Muang bis Koh Lipe mit 8 Mile Rock und Stonehenge.",
      route: "Koh Haa — Hin Daeng — Hin Muang — 8 Mile Rock — Stonehenge — Koh Lipe",
      keywords: ["Koh Lipe", "8 Mile Rock", "Stonehenge", "Tarutao", "Süd-Andamanen", "Tauchsafari"],
      content: `<h3>Highlights</h3>
<ul>
<li><strong>8 Mile Rock</strong> — Abgelegener Unterwasserfelsen im offenen Meer; Walhai- und Großfisch-Chance</li>
<li><strong>Stonehenge</strong> — Einzigartige Unterwasser-Korallenbögen bei Koh Adang</li>
<li><strong>Koh Lipe</strong> — Kristallklares Wasser, unberührte Korallen</li>
<li><strong>Hin Daeng–Hin Muang</strong> — Zwischenstopp; Mantarochen-Chance</li>
<li><strong>Tarutao-Nationalpark</strong> — Unberührte Natur, wenig besuchte Tauchplätze</li>
</ul>

<h3>Tauchplätze</h3>
<ul>
<li>Koh Haa — Lagoon, Canyon</li>
<li>Hin Daeng & Hin Muang (unterwegs)</li>
<li>8 Mile Rock</li>
<li>Stonehenge (Koh Adang)</li>
<li>Shark Fin Reef</li>
<li>Hin Musung</li>
<li>Koh Lipe House Reef</li>
</ul>

<h3>Inklusive</h3>
<ul>
<li>Klimatisierte Kabine mit Bad, 3 Nächte</li>
<li>3 Mahlzeiten + Snacks, Obst & Softdrinks</li>
<li>Komplette Tauchausrüstung</li>
<li>Tauchversicherung</li>
<li>Tauchguide, Kleingruppen</li>
<li>Kostenloser Flughafentransfer</li>
</ul>

<h3>Exklusive</h3>
<ul>
<li>Tarutao-Nationalparkgebühren (ca. 600 ฿/Person)</li>
<li>Alkohol</li>
<li>Nitrox</li>
<li>Trinkgeld (empfohlen 1.000–2.000 ฿/Person)</li>
<li>Unterkunft vor/nach der Tour</li>
</ul>

<h3>Hafeninformation</h3>
<ul>
<li><strong>Hafen:</strong> Chalong Pier, Phuket</li>
<li><strong>Check-in:</strong> Morgens am ersten Tag</li>
<li><strong>Check-out:</strong> Abend des letzten Tages</li>
</ul>

<h3>Hinweis</h3>
<p>Lange Strecke mit viel Fahrzeit. Wetter und Strömungen beeinflussen die Tauchplatzwahl. Für Advanced Open Water und höher empfohlen.</p>`,
      itinerary: `<h3>Tag 1 — Einschiffung & Koh Haa (2 TG)</h3>
<p>Morgens Check-in am Chalong Pier, Ausrüstung, Briefing<br>
Abfahrt nach Koh Haa<br>
14:00 TG 1 — <strong>Koh Haa Lagoon</strong> (Check-Dive)<br>
16:30 TG 2 — <strong>Koh Haa Canyon</strong><br>
Nachtfahrt Richtung Süden</p>

<h3>Tag 2 — Hin Daeng–Hin Muang & Süden (4 TG)</h3>
<p>07:30 TG 3 — <strong>Hin Daeng</strong> (Steilwand, Mantarochen)<br>
10:30 TG 4 — <strong>Hin Muang</strong> (lila Weichkorallen)<br>
14:00 TG 5 — <strong>8 Mile Rock</strong> (Tiefsee-Felsen, Walhai)<br>
17:00 TG 6 — <strong>Hin Musung</strong><br>
Weiterfahrt nach Koh Lipe</p>

<h3>Tag 3 — Koh Lipe & Koh Adang (4 TG)</h3>
<p>07:30 TG 7 — <strong>Stonehenge</strong> (Korallenbögen, Koh Adang)<br>
10:30 TG 8 — <strong>Shark Fin Reef</strong> (Haie, Rochen)<br>
14:00 TG 9 — <strong>Koh Lipe House Reef</strong> (unberührte Korallen)<br>
17:00 TG 10 — <strong>8 Mile Rock</strong> (Sonnenuntergangs-TG)<br>
Nachtfahrt zurück nach Phuket</p>

<h3>Tag 4 — Rückkehr (2 TG)</h3>
<p>07:30 TG 11 — <strong>Shark Point</strong> oder <strong>Bida Nok</strong> (unterwegs)<br>
10:00 TG 12 — <strong>Anemone Reef</strong> (Abschieds-TG)<br>
Mittagessen, Entspannung<br>
15:00–16:00 Ankunft Chalong Pier, Check-out</p>`,
    },
    {
      lang: "fr",
      title: "Koh Lipe 3 Jours 4 Nuits",
      slug: "koh-lipe-3j4n",
      excerpt: "10–12 plongées sur la route la plus méridionale de l'Andaman — de Hin Daeng–Hin Muang jusqu'à Koh Lipe avec 8 Mile Rock et Stonehenge, sites uniques.",
      route: "Koh Haa — Hin Daeng — Hin Muang — 8 Mile Rock — Stonehenge — Koh Lipe",
      keywords: ["Koh Lipe", "8 Mile Rock", "Stonehenge", "Tarutao", "Andaman Sud", "croisière plongée"],
      content: `<h3>Points forts</h3>
<ul>
<li><strong>8 Mile Rock</strong> — Roc isolé en haute mer ; requin-baleine et pélagiques possibles</li>
<li><strong>Stonehenge</strong> — Formations d'arches coralliennes uniques près de Koh Adang</li>
<li><strong>Koh Lipe</strong> — Eau cristalline, coraux préservés, vie marine variée</li>
<li><strong>Hin Daeng–Hin Muang</strong> — Escale en route ; chance de manta</li>
<li><strong>Parc national de Tarutao</strong> — Nature intacte, sites peu fréquentés</li>
</ul>

<h3>Sites de plongée</h3>
<ul>
<li>Koh Haa — Lagoon, Canyon</li>
<li>Hin Daeng & Hin Muang (en route)</li>
<li>8 Mile Rock</li>
<li>Stonehenge (Koh Adang)</li>
<li>Shark Fin Reef</li>
<li>Hin Musung</li>
<li>Koh Lipe House Reef</li>
</ul>

<h3>Inclus</h3>
<ul>
<li>Cabine climatisée avec salle de bain, 3 nuits</li>
<li>3 repas + collations, fruits & boissons à volonté</li>
<li>Équipement complet</li>
<li>Assurance plongée</li>
<li>Guide, petits groupes</li>
<li>Transfert aéroport gratuit</li>
</ul>

<h3>Non inclus</h3>
<ul>
<li>Frais parc national Tarutao (env. 600 ฿/pers.)</li>
<li>Boissons alcoolisées</li>
<li>Nitrox</li>
<li>Pourboires (suggéré 1 000–2 000 ฿/pers.)</li>
<li>Hébergement avant/après</li>
</ul>

<h3>Informations portuaires</h3>
<ul>
<li><strong>Port :</strong> Chalong Pier, Phuket</li>
<li><strong>Embarquement :</strong> Matin du 1er jour</li>
<li><strong>Débarquement :</strong> Soirée du dernier jour</li>
</ul>

<h3>Remarque</h3>
<p>Route longue distance avec temps de navigation conséquent. Météo et courants peuvent affecter les sites accessibles. Recommandé pour Advanced Open Water et plus.</p>`,
      itinerary: `<h3>Jour 1 — Embarquement & Koh Haa (2 plongées)</h3>
<p>Matin, enregistrement à Chalong Pier, matériel, briefing<br>
Départ vers Koh Haa<br>
14h00 Plongée 1 — <strong>Koh Haa Lagoon</strong> (check dive)<br>
16h30 Plongée 2 — <strong>Koh Haa Canyon</strong><br>
Navigation nocturne vers le sud</p>

<h3>Jour 2 — Hin Daeng–Hin Muang & Sud (4 plongées)</h3>
<p>07h30 Plongée 3 — <strong>Hin Daeng</strong> (paroi, manta)<br>
10h30 Plongée 4 — <strong>Hin Muang</strong> (coraux mous violets)<br>
14h00 Plongée 5 — <strong>8 Mile Rock</strong> (roc hauturier, requin-baleine)<br>
17h00 Plongée 6 — <strong>Hin Musung</strong><br>
Navigation vers Koh Lipe</p>

<h3>Jour 3 — Koh Lipe & Koh Adang (4 plongées)</h3>
<p>07h30 Plongée 7 — <strong>Stonehenge</strong> (arches coralliennes, Koh Adang)<br>
10h30 Plongée 8 — <strong>Shark Fin Reef</strong> (requins, raies)<br>
14h00 Plongée 9 — <strong>Koh Lipe House Reef</strong> (coraux préservés)<br>
17h00 Plongée 10 — <strong>8 Mile Rock</strong> (plongée au coucher du soleil)<br>
Retour nocturne vers Phuket</p>

<h3>Jour 4 — Retour (2 plongées)</h3>
<p>07h30 Plongée 11 — <strong>Shark Point</strong> ou <strong>Bida Nok</strong> (en route)<br>
10h00 Plongée 12 — <strong>Anemone Reef</strong> (plongée d'adieu)<br>
Déjeuner, détente<br>
15h00–16h00 Arrivée Chalong Pier, check-out</p>`,
    },
    {
      lang: "ru",
      title: "Ко Липе 3 дня 4 ночи",
      slug: "koh-lipe-3d4n",
      excerpt: "10–12 погружений по самому южному маршруту Андамана — от Хин Дэнг–Хин Муанг до Ко Липе с 8 Mile Rock и Стоунхенджем.",
      route: "Ко Хаа — Хин Дэнг — Хин Муанг — 8 Mile Rock — Стоунхендж — Ко Липе",
      keywords: ["Ко Липе", "8 Mile Rock", "Стоунхендж", "Тарутао", "Южный Андаман", "дайв-сафари"],
      content: `<h3>Особенности</h3>
<ul>
<li><strong>8 Mile Rock</strong> — Уединённая подводная скала в открытом море; китовые акулы и крупные пелагические рыбы</li>
<li><strong>Стоунхендж</strong> — Уникальные подводные коралловые арки у Ко Аданг</li>
<li><strong>Ко Липе</strong> — Кристальная вода, нетронутые кораллы, разнообразная фауна</li>
<li><strong>Хин Дэнг–Хин Муанг</strong> — Остановка по пути; шанс на манту</li>
<li><strong>Национальный парк Тарутао</strong> — Нетронутая природа, немноголюдные дайв-сайты</li>
</ul>

<h3>Дайв-сайты</h3>
<ul>
<li>Ко Хаа — Lagoon, Canyon</li>
<li>Хин Дэнг & Хин Муанг (по пути)</li>
<li>8 Mile Rock</li>
<li>Стоунхендж (Ко Аданг)</li>
<li>Shark Fin Reef</li>
<li>Хин Мусунг</li>
<li>Ко Липе House Reef</li>
</ul>

<h3>Включено</h3>
<ul>
<li>Каюта с кондиционером и ванной, 3 ночи</li>
<li>3-разовое питание + снеки, фрукты и безлимитные напитки</li>
<li>Полный комплект снаряжения</li>
<li>Страховка дайвинга</li>
<li>Дайв-гид, малые группы</li>
<li>Бесплатный трансфер из аэропорта</li>
</ul>

<h3>Не включено</h3>
<ul>
<li>Сборы нац. парка Тарутао (прим. 600 ฿/чел.)</li>
<li>Алкогольные напитки</li>
<li>Найтрокс</li>
<li>Чаевые (рекомендуется 1 000–2 000 ฿/чел.)</li>
<li>Проживание до/после тура</li>
</ul>

<h3>Информация о порте</h3>
<ul>
<li><strong>Порт:</strong> Чалонг Пирс, Пхукет</li>
<li><strong>Посадка:</strong> Утро первого дня</li>
<li><strong>Высадка:</strong> Вечер последнего дня</li>
</ul>

<h3>Примечание</h3>
<p>Длинный маршрут с продолжительными переходами. Погода и течения влияют на выбор дайв-сайтов. Рекомендуется для Advanced Open Water и выше.</p>`,
      itinerary: `<h3>День 1 — Посадка и Ко Хаа (2 погружения)</h3>
<p>Утро — регистрация на Чалонг Пирс, снаряжение, брифинг<br>
Отправление к Ко Хаа<br>
14:00 Погружение 1 — <strong>Koh Haa Lagoon</strong> (чек-дайв)<br>
16:30 Погружение 2 — <strong>Koh Haa Canyon</strong><br>
Ночной переход на юг</p>

<h3>День 2 — Хин Дэнг–Хин Муанг и далее на юг (4 погружения)</h3>
<p>07:30 Погружение 3 — <strong>Хин Дэнг</strong> (отвесная стена, манта)<br>
10:30 Погружение 4 — <strong>Хин Муанг</strong> (фиолетовые мягкие кораллы)<br>
14:00 Погружение 5 — <strong>8 Mile Rock</strong> (скала в открытом море, китовая акула)<br>
17:00 Погружение 6 — <strong>Хин Мусунг</strong><br>
Переход к Ко Липе</p>

<h3>День 3 — Ко Липе и Ко Аданг (4 погружения)</h3>
<p>07:30 Погружение 7 — <strong>Стоунхендж</strong> (коралловые арки, Ко Аданг)<br>
10:30 Погружение 8 — <strong>Shark Fin Reef</strong> (акулы, скаты)<br>
14:00 Погружение 9 — <strong>Ко Липе House Reef</strong> (нетронутые кораллы)<br>
17:00 Погружение 10 — <strong>8 Mile Rock</strong> (закатное погружение)<br>
Ночной переход обратно в Пхукет</p>

<h3>День 4 — Возвращение (2 погружения)</h3>
<p>07:30 Погружение 11 — <strong>Шарк Пойнт</strong> или <strong>Bida Nok</strong> (по пути)<br>
10:00 Погружение 12 — <strong>Анемон Риф</strong> (прощальное погружение)<br>
Обед, отдых<br>
15:00–16:00 Прибытие на Чалонг Пирс, выселение</p>`,
    },
    {
      lang: "ko",
      title: "꼬리뻬 3일 4박",
      slug: "koh-lipe-3d4n",
      excerpt: "안다만 최남단 루트 10~12회 다이빙 — 힌대엥·힌무앙에서 꼬리뻬까지, 8 Mile Rock과 스톤헨지 등 특별한 다이브 사이트 탐험.",
      route: "꼬하 — 힌대엥 — 힌무앙 — 8 Mile Rock — 스톤헨지 — 꼬리뻬",
      keywords: ["꼬리뻬", "8 Mile Rock", "스톤헨지", "따루따오", "남안다만", "리브어보드"],
      content: `<h3>하이라이트</h3>
<ul>
<li><strong>8 Mile Rock</strong> — 심해의 외딴 수중 바위; 고래상어와 대형 원양어류</li>
<li><strong>스톤헨지</strong> — 꼬아당 인근 독특한 수중 산호 아치 지형</li>
<li><strong>꼬리뻬</strong> — 맑은 물, 원시 산호, 다양한 해양 생물</li>
<li><strong>힌대엥-힌무앙</strong> — 경유 정차; 만타레이 기회</li>
<li><strong>따루따오 국립공원</strong> — 때묻지 않은 자연, 한적한 다이브 사이트</li>
</ul>

<h3>다이브 사이트</h3>
<ul>
<li>꼬하 — Lagoon, Canyon</li>
<li>힌대엥 & 힌무앙 (경유)</li>
<li>8 Mile Rock</li>
<li>스톤헨지 (꼬아당)</li>
<li>Shark Fin Reef</li>
<li>힌무숭</li>
<li>꼬리뻬 House Reef</li>
</ul>

<h3>포함 사항</h3>
<ul>
<li>에어컨 캐빈, 전용 욕실, 3박</li>
<li>3식 + 간식, 과일 & 무제한 소프트 드링크</li>
<li>풀 다이빙 장비</li>
<li>다이빙 보험</li>
<li>다이브 가이드, 소그룹</li>
<li>무료 공항 픽업</li>
</ul>

<h3>불포함 사항</h3>
<ul>
<li>따루따오 국립공원 입장료 (약 600 ฿/인)</li>
<li>주류</li>
<li>나이트록스</li>
<li>팁 (권장 1,000~2,000 ฿/인)</li>
<li>투어 전후 숙소</li>
</ul>

<h3>항구 정보</h3>
<ul>
<li><strong>항구:</strong> 찰롱 피어, 푸켓</li>
<li><strong>체크인:</strong> 첫째 날 아침</li>
<li><strong>체크아웃:</strong> 마지막 날 저녁</li>
</ul>

<h3>참고</h3>
<p>장거리 루트로 항해 시간이 깁니다. 날씨와 조류에 따라 방문 가능한 사이트가 달라질 수 있습니다. 어드밴스드 오픈워터 이상 권장.</p>`,
      itinerary: `<h3>1일차 — 승선 & 꼬하 (2회)</h3>
<p>아침 찰롱 피어 체크인, 장비, 브리핑<br>
꼬하로 출발<br>
14:00 다이빙 1 — <strong>Koh Haa Lagoon</strong> (체크 다이빙)<br>
16:30 다이빙 2 — <strong>Koh Haa Canyon</strong><br>
야간 남하 항해</p>

<h3>2일차 — 힌대엥-힌무앙 & 남하 (4회)</h3>
<p>07:30 다이빙 3 — <strong>힌대엥</strong> (절벽, 만타)<br>
10:30 다이빙 4 — <strong>힌무앙</strong> (보라색 연산호)<br>
14:00 다이빙 5 — <strong>8 Mile Rock</strong> (심해 바위, 고래상어)<br>
17:00 다이빙 6 — <strong>힌무숭</strong><br>
꼬리뻬로 이동</p>

<h3>3일차 — 꼬리뻬 & 꼬아당 (4회)</h3>
<p>07:30 다이빙 7 — <strong>스톤헨지</strong> (산호 아치, 꼬아당)<br>
10:30 다이빙 8 — <strong>Shark Fin Reef</strong> (상어, 가오리)<br>
14:00 다이빙 9 — <strong>꼬리뻬 House Reef</strong> (원시 산호)<br>
17:00 다이빙 10 — <strong>8 Mile Rock</strong> (선셋 다이빙)<br>
야간 항해로 푸켓 복귀</p>

<h3>4일차 — 복귀 (2회)</h3>
<p>07:30 다이빙 11 — <strong>샤크포인트</strong> 또는 <strong>Bida Nok</strong> (경유)<br>
10:00 다이빙 12 — <strong>아네모네 리프</strong> (페어웰 다이빙)<br>
점심, 휴식<br>
15:00~16:00 찰롱 피어 도착, 체크아웃</p>`,
    },
    {
      lang: "ja",
      title: "コリペ 3日間4泊",
      slug: "koh-lipe-3d4n",
      excerpt: "アンダマン最南端ルート10〜12ダイブ — ヒンデーン・ヒンムアンからコリペまで、8マイルロックとストーンヘンジなど特別なダイブサイトを探検。",
      route: "コハー — ヒンデーン — ヒンムアン — 8 Mile Rock — ストーンヘンジ — コリペ",
      keywords: ["コリペ", "8 Mile Rock", "ストーンヘンジ", "タルタオ", "南アンダマン", "ダイブクルーズ"],
      content: `<h3>ハイライト</h3>
<ul>
<li><strong>8 Mile Rock</strong> — 外洋の孤立した水中岩。ジンベエザメと大型回遊魚のチャンス</li>
<li><strong>ストーンヘンジ</strong> — コアダン島近くのユニークな水中サンゴアーチ</li>
<li><strong>コリペ</strong> — 透明な海、手付かずのサンゴ、多様な海洋生物</li>
<li><strong>ヒンデーン・ヒンムアン</strong> — 途中立ち寄り、マンタのチャンス</li>
<li><strong>タルタオ国立公園</strong> — 手付かずの自然、混雑しないダイブサイト</li>
</ul>

<h3>ダイブサイト</h3>
<ul>
<li>コハー — Lagoon、Canyon</li>
<li>ヒンデーン＆ヒンムアン（途中）</li>
<li>8 Mile Rock</li>
<li>ストーンヘンジ（コアダン）</li>
<li>Shark Fin Reef</li>
<li>ヒンムスン</li>
<li>コリペ House Reef</li>
</ul>

<h3>料金に含まれるもの</h3>
<ul>
<li>エアコン付きキャビン、専用バスルーム、3泊</li>
<li>1日3食＋スナック、フルーツ、ソフトドリンク飲み放題</li>
<li>フルダイビング器材</li>
<li>ダイビング保険</li>
<li>ダイブガイド、少人数制</li>
<li>無料空港送迎</li>
</ul>

<h3>料金に含まれないもの</h3>
<ul>
<li>タルタオ国立公園入園料（約600 ฿/名）</li>
<li>アルコール飲料</li>
<li>ナイトロックス</li>
<li>チップ（推奨 1,000〜2,000 ฿/名）</li>
<li>ツアー前後の宿泊</li>
</ul>

<h3>港の情報</h3>
<ul>
<li><strong>港：</strong>シャロン桟橋、プーケット</li>
<li><strong>チェックイン：</strong>初日の朝</li>
<li><strong>チェックアウト：</strong>最終日の夕方</li>
</ul>

<h3>注意</h3>
<p>長距離ルートで航行時間が長めです。天候と潮流によりダイブサイトが変更になる場合があります。アドバンスドオープンウォーター以上推奨。</p>`,
      itinerary: `<h3>1日目 — 乗船＆コハー（2ダイブ）</h3>
<p>朝 シャロン桟橋チェックイン、器材、ブリーフィング<br>
コハーへ出発<br>
14:00 ダイブ1 — <strong>Koh Haa Lagoon</strong>（チェックダイブ）<br>
16:30 ダイブ2 — <strong>Koh Haa Canyon</strong><br>
夜間航行で南下</p>

<h3>2日目 — ヒンデーン・ヒンムアン＆南下（4ダイブ）</h3>
<p>07:30 ダイブ3 — <strong>ヒンデーン</strong>（垂直壁、マンタ）<br>
10:30 ダイブ4 — <strong>ヒンムアン</strong>（紫のソフトコーラル）<br>
14:00 ダイブ5 — <strong>8 Mile Rock</strong>（外洋の岩、ジンベエザメ）<br>
17:00 ダイブ6 — <strong>ヒンムスン</strong><br>
コリペへ移動</p>

<h3>3日目 — コリペ＆コアダン（4ダイブ）</h3>
<p>07:30 ダイブ7 — <strong>ストーンヘンジ</strong>（サンゴのアーチ、コアダン）<br>
10:30 ダイブ8 — <strong>Shark Fin Reef</strong>（サメ、エイ）<br>
14:00 ダイブ9 — <strong>コリペ House Reef</strong>（手付かずのサンゴ）<br>
17:00 ダイブ10 — <strong>8 Mile Rock</strong>（サンセットダイブ）<br>
夜間航行でプーケットへ</p>

<h3>4日目 — 帰港（2ダイブ）</h3>
<p>07:30 ダイブ11 — <strong>シャークポイント</strong>または<strong>Bida Nok</strong>（途中）<br>
10:00 ダイブ12 — <strong>アネモネリーフ</strong>（フェアウェルダイブ）<br>
昼食、リラックス<br>
15:00〜16:00 シャロン桟橋到着、チェックアウト</p>`,
    },
  ],
},

// ═══════════════════════════════════════════════════════════════════════════
// 6. N+S Andaman 5D6N — Trip #68
// ═══════════════════════════════════════════════════════════════════════════
{
  scheduleId: "cmnrmfj0i00cotckzdn5yrmrp",
  routeName: "N+S Andaman 5D6N",
  translations: [
    {
      lang: "en",
      title: "North + South Andaman 5 Days 6 Nights",
      slug: "north-south-andaman-5d6n",
      excerpt: "18 dives on the ultimate combined route — Richelieu Rock, Similan Islands, Koh Bon, Koh Haa, Hin Daeng and Hin Muang. Every highlight in one trip.",
      route: "Similan Islands — Richelieu Rock — Koh Bon — Koh Tachai — Koh Haa — Hin Daeng — Hin Muang",
      keywords: ["North Andaman", "South Andaman", "Similan", "Richelieu Rock", "Koh Haa", "Hin Daeng", "Hin Muang", "liveaboard"],
      content: `<h3>Highlights</h3>
<ul>
<li><strong>All top dive sites</strong> — Both North and South Andaman in a single trip</li>
<li><strong>Richelieu Rock</strong> — Thailand's #1 dive site</li>
<li><strong>Similan Islands</strong> — Crystal-clear water, pristine reefs</li>
<li><strong>Koh Bon</strong> — Manta ray cleaning station</li>
<li><strong>Hin Daeng–Hin Muang</strong> — Vertical walls; whale sharks and manta rays</li>
<li><strong>Koh Haa</strong> — Cathedral Cave</li>
<li><strong>18 dives</strong> in 5 full days — best value</li>
</ul>

<h3>Dive Sites</h3>
<ul>
<li>Similan Islands — West of Eden, Anita's Reef, Christmas Point</li>
<li>Koh Bon — West Ridge, Manta Cleaning Station</li>
<li>Koh Tachai — Pinnacle</li>
<li>Richelieu Rock</li>
<li>Surin Islands</li>
<li>Koh Haa — Lagoon, Canyon, Cathedral Cave</li>
<li>Hin Daeng & Hin Muang</li>
</ul>

<h3>Included</h3>
<ul>
<li>Air-conditioned cabin with en-suite bathroom, 5 nights</li>
<li>3 meals + snacks, fruits & unlimited soft drinks (excluding alcohol)</li>
<li>Full dive equipment</li>
<li>Dive insurance</li>
<li>Dive guide, small groups (1 DM : 4–5 divers)</li>
<li>Free airport transfer: Phuket Airport ⇄ pier</li>
</ul>

<h3>Excluded</h3>
<ul>
<li>Similan + Mu Ko Lanta National Park fees (approx. 1,200–1,500 ฿/person)</li>
<li>Alcoholic beverages</li>
<li>Nitrox</li>
<li>Tips (suggested 1,500–2,500 ฿/person)</li>
<li>Pre/post-trip accommodation</li>
</ul>

<h3>Port Information</h3>
<ul>
<li><strong>Port:</strong> Chalong Pier, Phuket</li>
<li><strong>Check-in:</strong> Airport pickup 18:00–20:00</li>
<li><strong>Check-out:</strong> Airport drop-off 09:00</li>
</ul>`,
      itinerary: `<h3>Day 1 — Boarding</h3>
<p>18:00–20:00 Airport pickup → Chalong Pier<br>
Check-in, equipment setup, briefing & dinner on board<br>
Depart for Similan Islands (no dives)</p>

<h3>Day 2 — Similan Islands (4 dives)</h3>
<p>07:30 Dive 1 — <strong>Anita's Reef</strong> (coral garden)<br>
10:30 Dive 2 — <strong>West of Eden</strong> (boulders, caverns)<br>
14:00 Dive 3 — <strong>Christmas Point</strong> (swim-throughs, sharks)<br>
17:00 Dive 4 — <strong>Similan Night Dive</strong></p>

<h3>Day 3 — Koh Bon & Richelieu Rock (4 dives)</h3>
<p>07:30 Dive 5 — <strong>Koh Bon West Ridge</strong> (manta ray chance)<br>
10:30 Dive 6 — <strong>Koh Tachai Pinnacle</strong><br>
14:00 Dive 7 — <strong>Richelieu Rock</strong> (seahorses, whale sharks)<br>
17:00 Dive 8 — <strong>Richelieu Rock</strong> (sunset dive)</p>

<h3>Day 4 — Surin & Transit South (3 dives)</h3>
<p>07:30 Dive 9 — <strong>Surin Islands</strong><br>
10:30 Dive 10 — <strong>Koh Bon</strong> (repeat dive, manta chance)<br>
14:00 Dive 11 — <strong>Koh Tachai</strong><br>
Overnight transit south to Koh Haa</p>

<h3>Day 5 — Koh Haa & Hin Daeng–Hin Muang (4 dives)</h3>
<p>07:30 Dive 12 — <strong>Koh Haa Lagoon</strong> (Cathedral Cave)<br>
10:30 Dive 13 — <strong>Koh Haa Pinnacle</strong><br>
14:00 Dive 14 — <strong>Hin Daeng</strong> (vertical wall, manta chance)<br>
17:00 Dive 15 — <strong>Hin Muang</strong> (purple soft corals)</p>

<h3>Day 6 — Return (3 dives)</h3>
<p>07:30 Dive 16 — <strong>Hin Daeng</strong> (morning dive)<br>
10:00 Dive 17 — <strong>Shark Point</strong><br>
12:30 Dive 18 — <strong>Anemone Reef</strong> (farewell dive)<br>
Return to Phuket<br>
17:00 Arrive Chalong Pier, airport drop-off</p>`,
    },
    {
      lang: "cn",
      title: "北+南安达曼 5天6夜",
      slug: "north-south-andaman-5d6n",
      excerpt: "18潜终极组合线路——黎塞留岩、斯米兰、达琴岛、甲米五岛、红石紫石。所有精华一网打尽。",
      route: "斯米兰群岛 — 黎塞留岩 — 达琴岛 — 塔猜岛 — 甲米五岛 — 红石 — 紫石",
      keywords: ["北安达曼", "南安达曼", "斯米兰", "黎塞留岩", "甲米五岛", "红石", "紫石", "船宿"],
      content: `<h3>亮点</h3>
<ul>
<li><strong>汇集所有顶级潜点</strong> — 一次行程涵盖北安达曼和南安达曼</li>
<li><strong>黎塞留岩</strong> — 泰国第一潜点</li>
<li><strong>斯米兰群岛</strong> — 水清见底，珊瑚原始</li>
<li><strong>达琴岛</strong> — 蝠鲼清洁站</li>
<li><strong>红石-紫石</strong> — 垂直峭壁，鲸鲨和蝠鲼</li>
<li><strong>甲米五岛</strong> — 大教堂洞穴</li>
<li><strong>18潜</strong>，5天，超高性价比</li>
</ul>

<h3>潜点</h3>
<ul>
<li>斯米兰群岛 — West of Eden、Anita's Reef、Christmas Point</li>
<li>达琴岛 — West Ridge、蝠鲼清洁站</li>
<li>塔猜岛 — Pinnacle</li>
<li>黎塞留岩</li>
<li>素林群岛</li>
<li>甲米五岛 — Lagoon、Canyon、大教堂洞穴</li>
<li>红石 & 紫石</li>
</ul>

<h3>费用包含</h3>
<ul>
<li>空调客舱，独立卫浴，5晚</li>
<li>一日三餐 + 点心水果及无限量软饮</li>
<li>全套潜水装备</li>
<li>潜水保险</li>
<li>潜导带队，小团（1潜导：4-5人）</li>
<li>普吉机场 ⇄ 码头免费接送</li>
</ul>

<h3>费用不含</h3>
<ul>
<li>斯米兰 + 兰达群岛国家公园费（约1,200-1,500泰铢/人）</li>
<li>含酒精饮料</li>
<li>高氧 Nitrox</li>
<li>小费（建议1,500-2,500泰铢/人）</li>
<li>行程前后住宿</li>
</ul>

<h3>码头信息</h3>
<ul>
<li><strong>码头：</strong>查龙码头，普吉</li>
<li><strong>登船：</strong>机场接机 18:00-20:00</li>
<li><strong>离船：</strong>送至机场 09:00</li>
</ul>`,
      itinerary: `<h3>第1天 — 登船</h3>
<p>18:00-20:00 机场接机 → 查龙码头<br>
办理登船、整理装备、简报、船上晚餐<br>
出发前往斯米兰群岛（无潜水）</p>

<h3>第2天 — 斯米兰群岛（4潜）</h3>
<p>07:30 第1潜 — <strong>Anita's Reef</strong>（珊瑚花园）<br>
10:30 第2潜 — <strong>West of Eden</strong>（巨石、洞穴）<br>
14:00 第3潜 — <strong>Christmas Point</strong>（穿越、鲨鱼）<br>
17:00 第4潜 — <strong>斯米兰夜潜</strong></p>

<h3>第3天 — 达琴岛 & 黎塞留岩（4潜）</h3>
<p>07:30 第5潜 — <strong>Koh Bon West Ridge</strong>（蝠鲼机会）<br>
10:30 第6潜 — <strong>Koh Tachai Pinnacle</strong><br>
14:00 第7潜 — <strong>黎塞留岩</strong>（海马、鲸鲨）<br>
17:00 第8潜 — <strong>黎塞留岩</strong>（日落潜）</p>

<h3>第4天 — 素林 & 南下（3潜）</h3>
<p>07:30 第9潜 — <strong>素林群岛</strong><br>
10:30 第10潜 — <strong>达琴岛</strong>（再潜、蝠鲼）<br>
14:00 第11潜 — <strong>塔猜岛</strong><br>
夜间南下至甲米五岛</p>

<h3>第5天 — 甲米五岛 & 红石紫石（4潜）</h3>
<p>07:30 第12潜 — <strong>Koh Haa Lagoon</strong>（大教堂洞穴）<br>
10:30 第13潜 — <strong>Koh Haa Pinnacle</strong><br>
14:00 第14潜 — <strong>红石</strong>（垂直墙、蝠鲼）<br>
17:00 第15潜 — <strong>紫石</strong>（紫色软珊瑚）</p>

<h3>第6天 — 返回（3潜）</h3>
<p>07:30 第16潜 — <strong>红石</strong>（晨潜）<br>
10:00 第17潜 — <strong>鲨鱼角</strong><br>
12:30 第18潜 — <strong>海葵礁</strong>（告别潜）<br>
返回普吉<br>
17:00 抵达查龙码头，送至机场</p>`,
    },
    {
      lang: "de",
      title: "Nord + Süd Andamanen 5 Tage 6 Nächte",
      slug: "nord-sued-andamanen-5t6n",
      excerpt: "18 Tauchgänge auf der ultimativen Kombi-Route — Richelieu Rock, Similan, Koh Bon, Koh Haa, Hin Daeng und Hin Muang. Alle Highlights in einer Tour.",
      route: "Similan-Inseln — Richelieu Rock — Koh Bon — Koh Tachai — Koh Haa — Hin Daeng — Hin Muang",
      keywords: ["Nord-Andamanen", "Süd-Andamanen", "Similan", "Richelieu Rock", "Koh Haa", "Hin Daeng", "Hin Muang", "Tauchsafari"],
      content: `<h3>Highlights</h3>
<ul>
<li><strong>Alle Top-Tauchplätze</strong> — Nord- und Süd-Andamanen in einer Tour</li>
<li><strong>Richelieu Rock</strong> — Thailands Tauchplatz Nr. 1</li>
<li><strong>Similan-Inseln</strong> — Kristallklares Wasser, unberührte Riffe</li>
<li><strong>Koh Bon</strong> — Mantarochen-Putzstation</li>
<li><strong>Hin Daeng–Hin Muang</strong> — Steilwände; Walhaie und Mantarochen</li>
<li><strong>Koh Haa</strong> — Cathedral Cave</li>
<li><strong>18 Tauchgänge</strong> in 5 vollen Tagen — bestes Preis-Leistungs-Verhältnis</li>
</ul>

<h3>Tauchplätze</h3>
<ul>
<li>Similan-Inseln — West of Eden, Anita's Reef, Christmas Point</li>
<li>Koh Bon — West Ridge, Manta Cleaning Station</li>
<li>Koh Tachai — Pinnacle</li>
<li>Richelieu Rock</li>
<li>Surin-Inseln</li>
<li>Koh Haa — Lagoon, Canyon, Cathedral Cave</li>
<li>Hin Daeng & Hin Muang</li>
</ul>

<h3>Inklusive</h3>
<ul>
<li>Klimatisierte Kabine mit Bad, 5 Nächte</li>
<li>3 Mahlzeiten + Snacks, Obst & Softdrinks</li>
<li>Komplette Tauchausrüstung</li>
<li>Tauchversicherung</li>
<li>Tauchguide, Kleingruppen (1 DM : 4–5 Taucher)</li>
<li>Kostenloser Flughafentransfer</li>
</ul>

<h3>Exklusive</h3>
<ul>
<li>Similan + Mu Ko Lanta Nationalparkgebühren (ca. 1.200–1.500 ฿/Person)</li>
<li>Alkohol</li>
<li>Nitrox</li>
<li>Trinkgeld (empfohlen 1.500–2.500 ฿/Person)</li>
<li>Unterkunft vor/nach der Tour</li>
</ul>

<h3>Hafeninformation</h3>
<ul>
<li><strong>Hafen:</strong> Chalong Pier, Phuket</li>
<li><strong>Check-in:</strong> Flughafenabholung 18:00–20:00</li>
<li><strong>Check-out:</strong> Flughafentransfer 09:00</li>
</ul>`,
      itinerary: `<h3>Tag 1 — Einschiffung</h3>
<p>18:00–20:00 Abholung → Chalong Pier<br>
Check-in, Ausrüstung, Briefing & Abendessen<br>
Abfahrt zu den Similan-Inseln (keine TG)</p>

<h3>Tag 2 — Similan-Inseln (4 TG)</h3>
<p>07:30 TG 1 — <strong>Anita's Reef</strong><br>10:30 TG 2 — <strong>West of Eden</strong><br>14:00 TG 3 — <strong>Christmas Point</strong><br>17:00 TG 4 — <strong>Similan Nachttauchgang</strong></p>

<h3>Tag 3 — Koh Bon & Richelieu Rock (4 TG)</h3>
<p>07:30 TG 5 — <strong>Koh Bon West Ridge</strong> (Mantarochen)<br>10:30 TG 6 — <strong>Koh Tachai Pinnacle</strong><br>14:00 TG 7 — <strong>Richelieu Rock</strong> (Seepferdchen, Walhaie)<br>17:00 TG 8 — <strong>Richelieu Rock</strong> (Sonnenuntergang)</p>

<h3>Tag 4 — Surin & Südfahrt (3 TG)</h3>
<p>07:30 TG 9 — <strong>Surin-Inseln</strong><br>10:30 TG 10 — <strong>Koh Bon</strong><br>14:00 TG 11 — <strong>Koh Tachai</strong><br>Nachtfahrt nach Koh Haa</p>

<h3>Tag 5 — Koh Haa & Hin Daeng–Hin Muang (4 TG)</h3>
<p>07:30 TG 12 — <strong>Koh Haa Lagoon</strong> (Cathedral Cave)<br>10:30 TG 13 — <strong>Koh Haa Pinnacle</strong><br>14:00 TG 14 — <strong>Hin Daeng</strong> (Steilwand, Mantarochen)<br>17:00 TG 15 — <strong>Hin Muang</strong> (lila Weichkorallen)</p>

<h3>Tag 6 — Rückkehr (3 TG)</h3>
<p>07:30 TG 16 — <strong>Hin Daeng</strong><br>10:00 TG 17 — <strong>Shark Point</strong><br>12:30 TG 18 — <strong>Anemone Reef</strong> (Abschieds-TG)<br>Rückfahrt<br>17:00 Ankunft Chalong Pier</p>`,
    },
    {
      lang: "fr",
      title: "Andaman Nord + Sud 5 Jours 6 Nuits",
      slug: "andaman-nord-sud-5j6n",
      excerpt: "18 plongées sur l'itinéraire ultime — Richelieu Rock, Similan, Koh Bon, Koh Haa, Hin Daeng et Hin Muang. Tous les incontournables en un seul voyage.",
      route: "Îles Similan — Richelieu Rock — Koh Bon — Koh Tachai — Koh Haa — Hin Daeng — Hin Muang",
      keywords: ["Andaman Nord", "Andaman Sud", "Similan", "Richelieu Rock", "Koh Haa", "Hin Daeng", "Hin Muang", "croisière plongée"],
      content: `<h3>Points forts</h3>
<ul>
<li><strong>Tous les meilleurs sites</strong> — Andaman Nord et Sud en un seul voyage</li>
<li><strong>Richelieu Rock</strong> — Site n°1 de Thaïlande</li>
<li><strong>Similan</strong> — Eau cristalline, récifs préservés</li>
<li><strong>Koh Bon</strong> — Station de nettoyage des raies manta</li>
<li><strong>Hin Daeng–Hin Muang</strong> — Parois verticales ; requins-baleines et mantas</li>
<li><strong>Koh Haa</strong> — Cathedral Cave</li>
<li><strong>18 plongées</strong> en 5 jours — meilleur rapport qualité-prix</li>
</ul>

<h3>Sites de plongée</h3>
<ul>
<li>Similan — West of Eden, Anita's Reef, Christmas Point</li>
<li>Koh Bon — West Ridge, Manta Cleaning Station</li>
<li>Koh Tachai — Pinnacle</li>
<li>Richelieu Rock</li>
<li>Surin</li>
<li>Koh Haa — Lagoon, Canyon, Cathedral Cave</li>
<li>Hin Daeng & Hin Muang</li>
</ul>

<h3>Inclus</h3>
<ul>
<li>Cabine climatisée avec salle de bain, 5 nuits</li>
<li>3 repas + collations, fruits & boissons à volonté</li>
<li>Équipement complet</li>
<li>Assurance plongée</li>
<li>Guide, petits groupes (1 DM : 4–5)</li>
<li>Transfert aéroport gratuit</li>
</ul>

<h3>Non inclus</h3>
<ul>
<li>Frais parcs Similan + Mu Ko Lanta (env. 1 200–1 500 ฿/pers.)</li>
<li>Alcool</li>
<li>Nitrox</li>
<li>Pourboires (suggéré 1 500–2 500 ฿/pers.)</li>
<li>Hébergement avant/après</li>
</ul>

<h3>Informations portuaires</h3>
<ul>
<li><strong>Port :</strong> Chalong Pier, Phuket</li>
<li><strong>Embarquement :</strong> Transfert aéroport 18h00–20h00</li>
<li><strong>Débarquement :</strong> Transfert aéroport 09h00</li>
</ul>`,
      itinerary: `<h3>Jour 1 — Embarquement</h3>
<p>18h00–20h00 Transfert aéroport → Chalong Pier<br>Enregistrement, matériel, briefing & dîner<br>Départ vers Similan (pas de plongée)</p>

<h3>Jour 2 — Similan (4 plongées)</h3>
<p>07h30 P1 — <strong>Anita's Reef</strong><br>10h30 P2 — <strong>West of Eden</strong><br>14h00 P3 — <strong>Christmas Point</strong><br>17h00 P4 — <strong>Similan nuit</strong></p>

<h3>Jour 3 — Koh Bon & Richelieu (4 plongées)</h3>
<p>07h30 P5 — <strong>Koh Bon</strong> (manta)<br>10h30 P6 — <strong>Koh Tachai</strong><br>14h00 P7 — <strong>Richelieu Rock</strong><br>17h00 P8 — <strong>Richelieu Rock</strong> (coucher de soleil)</p>

<h3>Jour 4 — Surin & Transit Sud (3 plongées)</h3>
<p>07h30 P9 — <strong>Surin</strong><br>10h30 P10 — <strong>Koh Bon</strong><br>14h00 P11 — <strong>Koh Tachai</strong><br>Navigation nocturne vers Koh Haa</p>

<h3>Jour 5 — Koh Haa & Hin Daeng–Hin Muang (4 plongées)</h3>
<p>07h30 P12 — <strong>Koh Haa Lagoon</strong> (Cathedral Cave)<br>10h30 P13 — <strong>Koh Haa Pinnacle</strong><br>14h00 P14 — <strong>Hin Daeng</strong><br>17h00 P15 — <strong>Hin Muang</strong></p>

<h3>Jour 6 — Retour (3 plongées)</h3>
<p>07h30 P16 — <strong>Hin Daeng</strong><br>10h00 P17 — <strong>Shark Point</strong><br>12h30 P18 — <strong>Anemone Reef</strong> (adieu)<br>Retour Phuket<br>17h00 Arrivée Chalong Pier</p>`,
    },
    {
      lang: "ru",
      title: "Северный + Южный Андаман 5 дней 6 ночей",
      slug: "severnyj-juzhnyj-andaman-5d6n",
      excerpt: "18 погружений по максимальному маршруту — Ришелье Рок, Симиланы, Ко Бон, Ко Хаа, Хин Дэнг и Хин Муанг. Все лучшее в одном туре.",
      route: "Симиланские острова — Ришелье Рок — Ко Бон — Ко Тачай — Ко Хаа — Хин Дэнг — Хин Муанг",
      keywords: ["Северный Андаман", "Южный Андаман", "Симиланы", "Ришелье Рок", "Ко Хаа", "Хин Дэнг", "Хин Муанг", "дайв-сафари"],
      content: `<h3>Особенности</h3>
<ul>
<li><strong>Все топовые дайв-сайты</strong> — Северный и Южный Андаман за один тур</li>
<li><strong>Ришелье Рок</strong> — дайв-сайт №1 Таиланда</li>
<li><strong>Симиланы</strong> — кристально чистая вода</li>
<li><strong>Ко Бон</strong> — станция очистки мант</li>
<li><strong>Хин Дэнг–Хин Муанг</strong> — отвесные стены; китовые акулы и манты</li>
<li><strong>Ко Хаа</strong> — Кафедральная пещера</li>
<li><strong>18 погружений</strong> за 5 дней — лучшее соотношение цена/качество</li>
</ul>

<h3>Дайв-сайты</h3>
<ul>
<li>Симиланы — West of Eden, Anita's Reef, Christmas Point</li>
<li>Ко Бон — West Ridge, Manta Cleaning Station</li>
<li>Ко Тачай — Pinnacle</li>
<li>Ришелье Рок</li>
<li>Суринские острова</li>
<li>Ко Хаа — Lagoon, Canyon, Кафедральная пещера</li>
<li>Хин Дэнг & Хин Муанг</li>
</ul>

<h3>Включено</h3>
<ul>
<li>Каюта с кондиционером и ванной, 5 ночей</li>
<li>3-разовое питание + снеки, фрукты и напитки</li>
<li>Полный комплект снаряжения</li>
<li>Страховка</li>
<li>Дайв-гид, малые группы (1 DM : 4–5)</li>
<li>Бесплатный трансфер из аэропорта</li>
</ul>

<h3>Не включено</h3>
<ul>
<li>Сборы парков Симиланы + Му Ко Ланта (прим. 1 200–1 500 ฿/чел.)</li>
<li>Алкоголь</li>
<li>Найтрокс</li>
<li>Чаевые (рекомендуется 1 500–2 500 ฿/чел.)</li>
<li>Проживание до/после тура</li>
</ul>

<h3>Информация о порте</h3>
<ul>
<li><strong>Порт:</strong> Чалонг Пирс, Пхукет</li>
<li><strong>Посадка:</strong> трансфер из аэропорта 18:00–20:00</li>
<li><strong>Высадка:</strong> трансфер в аэропорт 09:00</li>
</ul>`,
      itinerary: `<h3>День 1 — Посадка</h3>
<p>18:00–20:00 Трансфер → Чалонг Пирс<br>Регистрация, снаряжение, брифинг и ужин<br>Отправление к Симиланам (без погружений)</p>

<h3>День 2 — Симиланы (4 погружения)</h3>
<p>07:30 П1 — <strong>Anita's Reef</strong><br>10:30 П2 — <strong>West of Eden</strong><br>14:00 П3 — <strong>Christmas Point</strong><br>17:00 П4 — <strong>Симиланы ночное</strong></p>

<h3>День 3 — Ко Бон и Ришелье Рок (4 погружения)</h3>
<p>07:30 П5 — <strong>Koh Bon West Ridge</strong> (манта)<br>10:30 П6 — <strong>Koh Tachai Pinnacle</strong><br>14:00 П7 — <strong>Ришелье Рок</strong><br>17:00 П8 — <strong>Ришелье Рок</strong> (закат)</p>

<h3>День 4 — Сурин и переход на юг (3 погружения)</h3>
<p>07:30 П9 — <strong>Суринские острова</strong><br>10:30 П10 — <strong>Ко Бон</strong><br>14:00 П11 — <strong>Ко Тачай</strong><br>Ночной переход к Ко Хаа</p>

<h3>День 5 — Ко Хаа и Хин Дэнг–Хин Муанг (4 погружения)</h3>
<p>07:30 П12 — <strong>Koh Haa Lagoon</strong> (Кафедральная пещера)<br>10:30 П13 — <strong>Koh Haa Pinnacle</strong><br>14:00 П14 — <strong>Хин Дэнг</strong><br>17:00 П15 — <strong>Хин Муанг</strong></p>

<h3>День 6 — Возвращение (3 погружения)</h3>
<p>07:30 П16 — <strong>Хин Дэнг</strong><br>10:00 П17 — <strong>Шарк Пойнт</strong><br>12:30 П18 — <strong>Анемон Риф</strong> (прощальное)<br>Возвращение<br>17:00 Чалонг Пирс</p>`,
    },
    {
      lang: "ko",
      title: "북+남 안다만 5일 6박",
      slug: "north-south-andaman-5d6n",
      excerpt: "리슐리외 록, 시밀란, 꼬본, 꼬하, 힌대엥·힌무앙까지 모든 하이라이트를 한 트립에. 5일간 18회 다이빙.",
      route: "시밀란 제도 — 리슐리외 록 — 꼬본 — 꼬따차이 — 꼬하 — 힌대엥 — 힌무앙",
      keywords: ["북안다만", "남안다만", "시밀란", "리슐리외 록", "꼬하", "힌대엥", "힌무앙", "리브어보드"],
      content: `<h3>하이라이트</h3>
<ul>
<li><strong>모든 최고 다이브 사이트</strong> — 북·남 안다만을 한 트립에</li>
<li><strong>리슐리외 록</strong> — 태국 최고 다이브 사이트</li>
<li><strong>시밀란</strong> — 맑은 물, 원시 산호</li>
<li><strong>꼬본</strong> — 만타레이 클리닝 스테이션</li>
<li><strong>힌대엥-힌무앙</strong> — 절벽; 고래상어와 만타</li>
<li><strong>꼬하</strong> — Cathedral Cave</li>
<li><strong>18회 다이빙</strong> 5일간 — 최고의 가성비</li>
</ul>

<h3>다이브 사이트</h3>
<ul>
<li>시밀란 — West of Eden, Anita's Reef, Christmas Point</li>
<li>꼬본 — West Ridge, Manta Cleaning Station</li>
<li>꼬따차이 — Pinnacle</li>
<li>리슐리외 록</li>
<li>수린 제도</li>
<li>꼬하 — Lagoon, Canyon, Cathedral Cave</li>
<li>힌대엥 & 힌무앙</li>
</ul>

<h3>포함 사항</h3>
<ul>
<li>에어컨 캐빈, 전용 욕실, 5박</li>
<li>3식 + 간식, 과일 & 무제한 음료</li>
<li>풀 다이빙 장비</li>
<li>보험</li>
<li>가이드, 소그룹 (DM 1명 : 4~5명)</li>
<li>무료 공항 픽업</li>
</ul>

<h3>불포함 사항</h3>
<ul>
<li>시밀란 + 무꼬란타 국립공원비 (약 1,200~1,500 ฿/인)</li>
<li>주류</li>
<li>나이트록스</li>
<li>팁 (권장 1,500~2,500 ฿/인)</li>
<li>투어 전후 숙소</li>
</ul>

<h3>항구 정보</h3>
<ul>
<li><strong>항구:</strong> 찰롱 피어, 푸켓</li>
<li><strong>체크인:</strong> 공항 픽업 18:00~20:00</li>
<li><strong>체크아웃:</strong> 공항 드롭오프 09:00</li>
</ul>`,
      itinerary: `<h3>1일차 — 승선</h3>
<p>18:00~20:00 공항 픽업 → 찰롱 피어<br>체크인, 장비, 브리핑 & 석식<br>시밀란으로 출발 (다이빙 없음)</p>

<h3>2일차 — 시밀란 (4회)</h3>
<p>07:30 D1 — <strong>Anita's Reef</strong><br>10:30 D2 — <strong>West of Eden</strong><br>14:00 D3 — <strong>Christmas Point</strong><br>17:00 D4 — <strong>시밀란 야간</strong></p>

<h3>3일차 — 꼬본 & 리슐리외 (4회)</h3>
<p>07:30 D5 — <strong>Koh Bon</strong> (만타)<br>10:30 D6 — <strong>Koh Tachai</strong><br>14:00 D7 — <strong>리슐리외 록</strong><br>17:00 D8 — <strong>리슐리외 록</strong> (선셋)</p>

<h3>4일차 — 수린 & 남하 (3회)</h3>
<p>07:30 D9 — <strong>수린 제도</strong><br>10:30 D10 — <strong>꼬본</strong><br>14:00 D11 — <strong>꼬따차이</strong><br>야간 항해로 꼬하 이동</p>

<h3>5일차 — 꼬하 & 힌대엥-힌무앙 (4회)</h3>
<p>07:30 D12 — <strong>Koh Haa Lagoon</strong> (Cathedral Cave)<br>10:30 D13 — <strong>Koh Haa Pinnacle</strong><br>14:00 D14 — <strong>힌대엥</strong><br>17:00 D15 — <strong>힌무앙</strong></p>

<h3>6일차 — 복귀 (3회)</h3>
<p>07:30 D16 — <strong>힌대엥</strong><br>10:00 D17 — <strong>샤크포인트</strong><br>12:30 D18 — <strong>아네모네 리프</strong> (페어웰)<br>푸켓 복귀<br>17:00 찰롱 피어</p>`,
    },
    {
      lang: "ja",
      title: "北＋南アンダマン 5日間6泊",
      slug: "north-south-andaman-5d6n",
      excerpt: "リシュリューロック、シミラン、コボン、コハー、ヒンデーン・ヒンムアンまで全ハイライトを1トリップに。5日間18ダイブ。",
      route: "シミラン諸島 — リシュリューロック — コボン — コタチャイ — コハー — ヒンデーン — ヒンムアン",
      keywords: ["北アンダマン", "南アンダマン", "シミラン", "リシュリューロック", "コハー", "ヒンデーン", "ヒンムアン", "ダイブクルーズ"],
      content: `<h3>ハイライト</h3>
<ul>
<li><strong>トップダイブサイト完全制覇</strong> — 北・南アンダマンを1トリップで</li>
<li><strong>リシュリューロック</strong> — タイNo.1ダイブサイト</li>
<li><strong>シミラン諸島</strong> — 透明度抜群、手付かずのリーフ</li>
<li><strong>コボン</strong> — マンタレイ・クリーニングステーション</li>
<li><strong>ヒンデーン・ヒンムアン</strong> — 垂直壁、ジンベエザメとマンタ</li>
<li><strong>コハー</strong> — カテドラルケーブ</li>
<li><strong>18ダイブ</strong>、5日間 — 最高のコストパフォーマンス</li>
</ul>

<h3>ダイブサイト</h3>
<ul>
<li>シミラン — West of Eden、Anita's Reef、Christmas Point</li>
<li>コボン — West Ridge、Manta Cleaning Station</li>
<li>コタチャイ — Pinnacle</li>
<li>リシュリューロック</li>
<li>スリン諸島</li>
<li>コハー — Lagoon、Canyon、Cathedral Cave</li>
<li>ヒンデーン＆ヒンムアン</li>
</ul>

<h3>料金に含まれるもの</h3>
<ul>
<li>エアコン付きキャビン、専用バスルーム、5泊</li>
<li>1日3食＋スナック、フルーツ、ソフトドリンク飲み放題</li>
<li>フルダイビング器材</li>
<li>ダイビング保険</li>
<li>ダイブガイド、少人数制（DM1名：4〜5名）</li>
<li>無料空港送迎</li>
</ul>

<h3>料金に含まれないもの</h3>
<ul>
<li>シミラン＋ムコランタ国立公園料（約1,200〜1,500 ฿/名）</li>
<li>アルコール</li>
<li>ナイトロックス</li>
<li>チップ（推奨 1,500〜2,500 ฿/名）</li>
<li>ツアー前後の宿泊</li>
</ul>

<h3>港の情報</h3>
<ul>
<li><strong>港：</strong>シャロン桟橋、プーケット</li>
<li><strong>チェックイン：</strong>空港ピックアップ 18:00〜20:00</li>
<li><strong>チェックアウト：</strong>空港送り 09:00</li>
</ul>`,
      itinerary: `<h3>1日目 — 乗船</h3>
<p>18:00〜20:00 空港ピックアップ → シャロン桟橋<br>チェックイン、器材、ブリーフィング＆ディナー<br>シミランへ出発（ダイビングなし）</p>

<h3>2日目 — シミラン（4ダイブ）</h3>
<p>07:30 D1 — <strong>Anita's Reef</strong><br>10:30 D2 — <strong>West of Eden</strong><br>14:00 D3 — <strong>Christmas Point</strong><br>17:00 D4 — <strong>シミラン ナイトダイブ</strong></p>

<h3>3日目 — コボン＆リシュリューロック（4ダイブ）</h3>
<p>07:30 D5 — <strong>Koh Bon</strong>（マンタ）<br>10:30 D6 — <strong>Koh Tachai</strong><br>14:00 D7 — <strong>リシュリューロック</strong><br>17:00 D8 — <strong>リシュリューロック</strong>（サンセット）</p>

<h3>4日目 — スリン＆南下（3ダイブ）</h3>
<p>07:30 D9 — <strong>スリン諸島</strong><br>10:30 D10 — <strong>コボン</strong><br>14:00 D11 — <strong>コタチャイ</strong><br>夜間航行でコハーへ</p>

<h3>5日目 — コハー＆ヒンデーン・ヒンムアン（4ダイブ）</h3>
<p>07:30 D12 — <strong>Koh Haa Lagoon</strong>（カテドラルケーブ）<br>10:30 D13 — <strong>Koh Haa Pinnacle</strong><br>14:00 D14 — <strong>ヒンデーン</strong><br>17:00 D15 — <strong>ヒンムアン</strong></p>

<h3>6日目 — 帰港（3ダイブ）</h3>
<p>07:30 D16 — <strong>ヒンデーン</strong><br>10:00 D17 — <strong>シャークポイント</strong><br>12:30 D18 — <strong>アネモネリーフ</strong>（フェアウェル）<br>帰港<br>17:00 シャロン桟橋</p>`,
    },
  ],
},

// ═══════════════════════════════════════════════════════════════════════════
// 7. Racha 2D2N — Trip #75
// ═══════════════════════════════════════════════════════════════════════════
{
  scheduleId: "cmnrmfj1j00f0tckz9var2ybi",
  routeName: "Racha 2D2N",
  translations: [
    {
      lang: "en",
      title: "Racha 2 Days 2 Nights",
      slug: "racha-2d2n",
      excerpt: "Short 2-day trip with 6–7 dives at Racha Noi and Racha Yai — crystal-clear water, suitable for all levels. A quick getaway from Phuket.",
      route: "Racha Noi — Racha Yai",
      keywords: ["Racha", "Racha Yai", "Racha Noi", "short trip", "Phuket", "liveaboard"],
      content: `<h3>Highlights</h3>
<ul>
<li><strong>Racha Noi</strong> — Clearest water near Phuket; South Tip for big fish and manta rays</li>
<li><strong>Racha Yai</strong> — Shipwrecks, pristine hard corals, underwater statues</li>
<li><strong>Suitable for all levels</strong> — From Open Water and above</li>
<li><strong>Short trip</strong> — Perfect for those with limited time or as an add-on trip</li>
</ul>

<h3>Dive Sites</h3>
<ul>
<li>Racha Noi — Banana Bay, South Tip</li>
<li>Racha Yai — Bay 1, Bay 2, Bungalow Bay, Wreck</li>
</ul>

<h3>Included</h3>
<ul>
<li>Air-conditioned cabin with en-suite bathroom, 1 night</li>
<li>3 meals + snacks, fruits & unlimited soft drinks (excluding alcohol)</li>
<li>Full dive equipment</li>
<li>Dive insurance</li>
<li>Dive guide, small groups</li>
<li>Free airport transfer: Phuket Airport ⇄ pier</li>
</ul>

<h3>Excluded</h3>
<ul>
<li>National park fees (approx. 400 ฿/person)</li>
<li>Alcoholic beverages</li>
<li>Nitrox</li>
<li>Tips (suggested 500–1,000 ฿/person)</li>
<li>Pre/post-trip accommodation</li>
</ul>

<h3>Port Information</h3>
<ul>
<li><strong>Port:</strong> Chalong Pier, Phuket</li>
<li><strong>Check-in:</strong> 19:00–20:00 at the pier</li>
<li><strong>Check-out:</strong> 12:00 on the last day</li>
</ul>`,
      itinerary: `<h3>Day 1 — Boarding & Night Dive (1 dive)</h3>
<p>19:00–20:00 Check-in at Chalong Pier, equipment setup, briefing<br>
Depart for Racha Noi<br>
21:00 Dive 1 — <strong>Racha Noi – Banana Bay</strong> (night dive)</p>

<h3>Day 2 — Racha Islands (4 dives)</h3>
<p>07:30 Dive 2 — <strong>Racha Noi – South Tip</strong> (wall, currents, big fish chance)<br>
10:30 Dive 3 — <strong>Racha Noi – Banana Bay</strong> (turtles, rays)<br>
14:00 Dive 4 — <strong>Racha Yai – Bay 1</strong> (hard corals, shallow reef)<br>
17:00 Dive 5 — <strong>Racha Yai – Bungalow Bay</strong> (sunset dive)</p>

<h3>Day 3 — Racha Yai & Return (2 dives)</h3>
<p>07:30 Dive 6 — <strong>Racha Yai – Wreck</strong> (shipwreck, marine life)<br>
09:30 Dive 7 — <strong>Racha Yai – Bay 2</strong> (underwater statues, farewell dive)<br>
Breakfast, relax<br>
12:00 Arrive Chalong Pier, check-out</p>`,
    },
    {
      lang: "cn",
      title: "皇帝岛 2天2夜",
      slug: "racha-2d2n",
      excerpt: "2天短途行程，6-7潜探索皇帝岛——水清见底，适合所有级别，从普吉出发最近的船宿体验。",
      route: "皇帝岛小岛 — 皇帝岛大岛",
      keywords: ["皇帝岛", "Racha Yai", "Racha Noi", "短途", "普吉", "船宿"],
      content: `<h3>亮点</h3>
<ul>
<li><strong>皇帝岛小岛</strong> — 普吉最清澈的海水；South Tip可遇大鱼和蝠鲼</li>
<li><strong>皇帝岛大岛</strong> — 沉船、硬珊瑚、水下雕像</li>
<li><strong>适合所有级别</strong> — 开放水域即可参加</li>
<li><strong>短途行程</strong> — 适合时间有限的潜水员或作为附加行程</li>
</ul>

<h3>潜点</h3>
<ul>
<li>皇帝岛小岛 — Banana Bay、South Tip</li>
<li>皇帝岛大岛 — Bay 1、Bay 2、Bungalow Bay、沉船</li>
</ul>

<h3>费用包含</h3>
<ul>
<li>空调客舱，独立卫浴，1晚</li>
<li>一日三餐 + 点心水果及无限量软饮</li>
<li>全套潜水装备</li>
<li>潜水保险</li>
<li>潜导带队，小团</li>
<li>普吉机场 ⇄ 码头免费接送</li>
</ul>

<h3>费用不含</h3>
<ul>
<li>国家公园费（约400泰铢/人）</li>
<li>含酒精饮料</li>
<li>高氧 Nitrox</li>
<li>小费（建议500-1,000泰铢/人）</li>
<li>行程前后住宿</li>
</ul>

<h3>码头信息</h3>
<ul>
<li><strong>码头：</strong>查龙码头，普吉</li>
<li><strong>登船：</strong>19:00-20:00</li>
<li><strong>离船：</strong>最后一天12:00</li>
</ul>`,
      itinerary: `<h3>第1天 — 登船 & 夜潜（1潜）</h3>
<p>19:00-20:00 查龙码头登船、装备、简报<br>出发前往皇帝岛小岛<br>21:00 第1潜 — <strong>Racha Noi - Banana Bay</strong>（夜潜）</p>

<h3>第2天 — 皇帝岛（4潜）</h3>
<p>07:30 第2潜 — <strong>Racha Noi - South Tip</strong>（峭壁、大鱼）<br>10:30 第3潜 — <strong>Racha Noi - Banana Bay</strong>（海龟、鳐鱼）<br>14:00 第4潜 — <strong>Racha Yai - Bay 1</strong>（硬珊瑚）<br>17:00 第5潜 — <strong>Racha Yai - Bungalow Bay</strong>（日落潜）</p>

<h3>第3天 — 皇帝岛大岛 & 返回（2潜）</h3>
<p>07:30 第6潜 — <strong>Racha Yai - 沉船</strong><br>09:30 第7潜 — <strong>Racha Yai - Bay 2</strong>（水下雕像、告别潜）<br>早餐、休息<br>12:00 抵达查龙码头，退房</p>`,
    },
    {
      lang: "de",
      title: "Racha 2 Tage 2 Nächte",
      slug: "racha-2t2n",
      excerpt: "Kurztrip mit 6–7 Tauchgängen an Racha Noi und Racha Yai — kristallklares Wasser, für alle Niveaus. Schneller Ausflug ab Phuket.",
      route: "Racha Noi — Racha Yai",
      keywords: ["Racha", "Racha Yai", "Racha Noi", "Kurztrip", "Phuket", "Tauchsafari"],
      content: `<h3>Highlights</h3>
<ul>
<li><strong>Racha Noi</strong> — Klarste Sicht nahe Phuket; South Tip für Großfische und Mantas</li>
<li><strong>Racha Yai</strong> — Schiffswracks, Hartkorallen, Unterwasserstatuen</li>
<li><strong>Für alle Niveaus</strong> ab Open Water</li>
<li><strong>Kurztrip</strong> — Ideal bei wenig Zeit oder als Ergänzungstour</li>
</ul>

<h3>Tauchplätze</h3>
<ul>
<li>Racha Noi — Banana Bay, South Tip</li>
<li>Racha Yai — Bay 1, Bay 2, Bungalow Bay, Wrack</li>
</ul>

<h3>Inklusive</h3>
<ul>
<li>Klimatisierte Kabine mit Bad, 1 Nacht</li>
<li>3 Mahlzeiten + Snacks, Obst & Softdrinks</li>
<li>Komplette Tauchausrüstung</li>
<li>Tauchversicherung</li>
<li>Tauchguide, Kleingruppen</li>
<li>Kostenloser Flughafentransfer</li>
</ul>

<h3>Exklusive</h3>
<ul>
<li>Nationalparkgebühren (ca. 400 ฿/Person)</li>
<li>Alkohol</li>
<li>Nitrox</li>
<li>Trinkgeld (empfohlen 500–1.000 ฿/Person)</li>
<li>Unterkunft vor/nach der Tour</li>
</ul>

<h3>Hafeninformation</h3>
<ul>
<li><strong>Hafen:</strong> Chalong Pier, Phuket</li>
<li><strong>Check-in:</strong> 19:00–20:00</li>
<li><strong>Check-out:</strong> 12:00 am letzten Tag</li>
</ul>`,
      itinerary: `<h3>Tag 1 — Einschiffung & Nachttauchgang (1 TG)</h3>
<p>19:00–20:00 Check-in Chalong Pier, Ausrüstung, Briefing<br>Abfahrt nach Racha Noi<br>21:00 TG 1 — <strong>Racha Noi – Banana Bay</strong> (Nachttauchgang)</p>

<h3>Tag 2 — Racha-Inseln (4 TG)</h3>
<p>07:30 TG 2 — <strong>Racha Noi – South Tip</strong> (Wand, Strömung, große Fische)<br>10:30 TG 3 — <strong>Racha Noi – Banana Bay</strong> (Schildkröten, Rochen)<br>14:00 TG 4 — <strong>Racha Yai – Bay 1</strong> (Hartkorallen)<br>17:00 TG 5 — <strong>Racha Yai – Bungalow Bay</strong> (Sonnenuntergang)</p>

<h3>Tag 3 — Racha Yai & Rückkehr (2 TG)</h3>
<p>07:30 TG 6 — <strong>Racha Yai – Wrack</strong><br>09:30 TG 7 — <strong>Racha Yai – Bay 2</strong> (Unterwasserstatuen, Abschieds-TG)<br>Frühstück, Entspannung<br>12:00 Ankunft Chalong Pier, Check-out</p>`,
    },
    {
      lang: "fr",
      title: "Racha 2 Jours 2 Nuits",
      slug: "racha-2j2n",
      excerpt: "Court séjour de 2 jours avec 6–7 plongées à Racha Noi et Racha Yai — eau cristalline, pour tous niveaux. Escapade rapide depuis Phuket.",
      route: "Racha Noi — Racha Yai",
      keywords: ["Racha", "Racha Yai", "Racha Noi", "court séjour", "Phuket", "croisière plongée"],
      content: `<h3>Points forts</h3>
<ul>
<li><strong>Racha Noi</strong> — Eau la plus claire près de Phuket ; South Tip pour gros poissons et mantas</li>
<li><strong>Racha Yai</strong> — Épaves, coraux durs, statues sous-marines</li>
<li><strong>Pour tous niveaux</strong> à partir d'Open Water</li>
<li><strong>Court séjour</strong> — Idéal pour temps limité ou comme complément</li>
</ul>

<h3>Sites de plongée</h3>
<ul>
<li>Racha Noi — Banana Bay, South Tip</li>
<li>Racha Yai — Bay 1, Bay 2, Bungalow Bay, Épave</li>
</ul>

<h3>Inclus</h3>
<ul>
<li>Cabine climatisée avec salle de bain, 1 nuit</li>
<li>3 repas + collations, fruits & boissons</li>
<li>Équipement complet</li>
<li>Assurance plongée</li>
<li>Guide, petits groupes</li>
<li>Transfert aéroport gratuit</li>
</ul>

<h3>Non inclus</h3>
<ul>
<li>Frais parc national (env. 400 ฿/pers.)</li>
<li>Alcool</li>
<li>Nitrox</li>
<li>Pourboires (suggéré 500–1 000 ฿/pers.)</li>
<li>Hébergement avant/après</li>
</ul>

<h3>Informations portuaires</h3>
<ul>
<li><strong>Port :</strong> Chalong Pier, Phuket</li>
<li><strong>Embarquement :</strong> 19h00–20h00</li>
<li><strong>Débarquement :</strong> 12h00 dernier jour</li>
</ul>`,
      itinerary: `<h3>Jour 1 — Embarquement & Nuit (1 plongée)</h3>
<p>19h00–20h00 Enregistrement Chalong Pier, matériel, briefing<br>Départ vers Racha Noi<br>21h00 P1 — <strong>Racha Noi – Banana Bay</strong> (nuit)</p>

<h3>Jour 2 — Îles Racha (4 plongées)</h3>
<p>07h30 P2 — <strong>Racha Noi – South Tip</strong> (paroi, courants, gros poissons)<br>10h30 P3 — <strong>Racha Noi – Banana Bay</strong> (tortues, raies)<br>14h00 P4 — <strong>Racha Yai – Bay 1</strong> (coraux durs)<br>17h00 P5 — <strong>Racha Yai – Bungalow Bay</strong> (coucher de soleil)</p>

<h3>Jour 3 — Racha Yai & Retour (2 plongées)</h3>
<p>07h30 P6 — <strong>Racha Yai – Épave</strong><br>09h30 P7 — <strong>Racha Yai – Bay 2</strong> (statues, adieu)<br>Petit-déjeuner, détente<br>12h00 Arrivée Chalong Pier, check-out</p>`,
    },
    {
      lang: "ru",
      title: "Рача 2 дня 2 ночи",
      slug: "racha-2d2n",
      excerpt: "Короткий 2-дневный тур с 6–7 погружениями на Рача Ной и Рача Яй — кристальная вода, для всех уровней. Быстрый выезд из Пхукета.",
      route: "Рача Ной — Рача Яй",
      keywords: ["Рача", "Рача Яй", "Рача Ной", "короткий тур", "Пхукет", "дайв-сафари"],
      content: `<h3>Особенности</h3>
<ul>
<li><strong>Рача Ной</strong> — Самая чистая вода у Пхукета; South Tip для крупной рыбы и мант</li>
<li><strong>Рача Яй</strong> — Затонувшие суда, жёсткие кораллы, подводные статуи</li>
<li><strong>Для всех уровней</strong> от Open Water</li>
<li><strong>Короткий тур</strong> — Идеален при ограниченном времени или как доп. тур</li>
</ul>

<h3>Дайв-сайты</h3>
<ul>
<li>Рача Ной — Banana Bay, South Tip</li>
<li>Рача Яй — Bay 1, Bay 2, Bungalow Bay, Wreck</li>
</ul>

<h3>Включено</h3>
<ul>
<li>Каюта с кондиционером и ванной, 1 ночь</li>
<li>3-разовое питание + снеки, фрукты и напитки</li>
<li>Полный комплект снаряжения</li>
<li>Страховка</li>
<li>Дайв-гид, малые группы</li>
<li>Бесплатный трансфер из аэропорта</li>
</ul>

<h3>Не включено</h3>
<ul>
<li>Сборы нац. парка (прим. 400 ฿/чел.)</li>
<li>Алкоголь</li>
<li>Найтрокс</li>
<li>Чаевые (рекомендуется 500–1 000 ฿/чел.)</li>
<li>Проживание до/после тура</li>
</ul>

<h3>Информация о порте</h3>
<ul>
<li><strong>Порт:</strong> Чалонг Пирс, Пхукет</li>
<li><strong>Посадка:</strong> 19:00–20:00</li>
<li><strong>Высадка:</strong> 12:00 в последний день</li>
</ul>`,
      itinerary: `<h3>День 1 — Посадка и ночное погружение (1)</h3>
<p>19:00–20:00 Регистрация на Чалонг Пирс, снаряжение, брифинг<br>Отправление к Рача Ной<br>21:00 П1 — <strong>Рача Ной – Banana Bay</strong> (ночное)</p>

<h3>День 2 — Острова Рача (4 погружения)</h3>
<p>07:30 П2 — <strong>Рача Ной – South Tip</strong> (стена, течения, крупная рыба)<br>10:30 П3 — <strong>Рача Ной – Banana Bay</strong> (черепахи, скаты)<br>14:00 П4 — <strong>Рача Яй – Bay 1</strong> (жёсткие кораллы)<br>17:00 П5 — <strong>Рача Яй – Bungalow Bay</strong> (закат)</p>

<h3>День 3 — Рача Яй и возвращение (2 погружения)</h3>
<p>07:30 П6 — <strong>Рача Яй – Рэк</strong><br>09:30 П7 — <strong>Рача Яй – Bay 2</strong> (подводные статуи, прощальное)<br>Завтрак, отдых<br>12:00 Прибытие на Чалонг Пирс, выселение</p>`,
    },
    {
      lang: "ko",
      title: "라차 2일 2박",
      slug: "racha-2d2n",
      excerpt: "라차노이·라차야이에서 6~7회 다이빙 단기 트립 — 맑은 물, 모든 레벨 적합. 푸켓에서 가까운 리브어보드 체험.",
      route: "라차노이 — 라차야이",
      keywords: ["라차", "라차야이", "라차노이", "단기", "푸켓", "리브어보드"],
      content: `<h3>하이라이트</h3>
<ul>
<li><strong>라차노이</strong> — 푸켓 최고 투명도; South Tip 대형 어류와 만타</li>
<li><strong>라차야이</strong> — 침몰선, 경산호, 수중 조각상</li>
<li><strong>모든 레벨 가능</strong> 오픈워터 이상</li>
<li><strong>단기 트립</strong> — 시간 부족 시 또는 부가 트립으로 최적</li>
</ul>

<h3>다이브 사이트</h3>
<ul>
<li>라차노이 — Banana Bay, South Tip</li>
<li>라차야이 — Bay 1, Bay 2, Bungalow Bay, Wreck</li>
</ul>

<h3>포함 사항</h3>
<ul>
<li>에어컨 캐빈, 전용 욕실, 1박</li>
<li>3식 + 간식, 과일 & 무제한 음료</li>
<li>풀 다이빙 장비</li>
<li>보험</li>
<li>가이드, 소그룹</li>
<li>무료 공항 픽업</li>
</ul>

<h3>불포함 사항</h3>
<ul>
<li>국립공원비 (약 400 ฿/인)</li>
<li>주류</li>
<li>나이트록스</li>
<li>팁 (권장 500~1,000 ฿/인)</li>
<li>투어 전후 숙소</li>
</ul>

<h3>항구 정보</h3>
<ul>
<li><strong>항구:</strong> 찰롱 피어, 푸켓</li>
<li><strong>체크인:</strong> 19:00~20:00</li>
<li><strong>체크아웃:</strong> 마지막 날 12:00</li>
</ul>`,
      itinerary: `<h3>1일차 — 승선 & 야간 (1회)</h3>
<p>19:00~20:00 찰롱 피어 체크인, 장비, 브리핑<br>라차노이로 출발<br>21:00 D1 — <strong>Racha Noi – Banana Bay</strong> (야간)</p>

<h3>2일차 — 라차 제도 (4회)</h3>
<p>07:30 D2 — <strong>Racha Noi – South Tip</strong> (벽, 조류, 대형 어류)<br>10:30 D3 — <strong>Racha Noi – Banana Bay</strong> (거북, 가오리)<br>14:00 D4 — <strong>Racha Yai – Bay 1</strong> (경산호)<br>17:00 D5 — <strong>Racha Yai – Bungalow Bay</strong> (선셋)</p>

<h3>3일차 — 라차야이 & 복귀 (2회)</h3>
<p>07:30 D6 — <strong>Racha Yai – Wreck</strong><br>09:30 D7 — <strong>Racha Yai – Bay 2</strong> (수중 조각상, 페어웰)<br>조식, 휴식<br>12:00 찰롱 피어 도착, 체크아웃</p>`,
    },
    {
      lang: "ja",
      title: "ラチャ 2日間2泊",
      slug: "racha-2d2n",
      excerpt: "ラチャノイ・ラチャヤイで6〜7ダイブの短期トリップ — 透明度抜群、全レベル対応。プーケットからすぐのダイブクルーズ体験。",
      route: "ラチャノイ — ラチャヤイ",
      keywords: ["ラチャ", "ラチャヤイ", "ラチャノイ", "短期", "プーケット", "ダイブクルーズ"],
      content: `<h3>ハイライト</h3>
<ul>
<li><strong>ラチャノイ</strong> — プーケット最高の透明度; South Tipで大型魚とマンタ</li>
<li><strong>ラチャヤイ</strong> — 沈船、手付かずのハードコーラル、水中彫刻</li>
<li><strong>全レベル対応</strong> オープンウォーター以上</li>
<li><strong>短期トリップ</strong> — 時間が限られた方や追加トリップに最適</li>
</ul>

<h3>ダイブサイト</h3>
<ul>
<li>ラチャノイ — Banana Bay、South Tip</li>
<li>ラチャヤイ — Bay 1、Bay 2、Bungalow Bay、沈船</li>
</ul>

<h3>料金に含まれるもの</h3>
<ul>
<li>エアコン付きキャビン、専用バスルーム、1泊</li>
<li>1日3食＋スナック、フルーツ、ソフトドリンク飲み放題</li>
<li>フルダイビング器材</li>
<li>ダイビング保険</li>
<li>ダイブガイド、少人数制</li>
<li>無料空港送迎</li>
</ul>

<h3>料金に含まれないもの</h3>
<ul>
<li>国立公園入園料（約400 ฿/名）</li>
<li>アルコール</li>
<li>ナイトロックス</li>
<li>チップ（推奨 500〜1,000 ฿/名）</li>
<li>ツアー前後の宿泊</li>
</ul>

<h3>港の情報</h3>
<ul>
<li><strong>港：</strong>シャロン桟橋、プーケット</li>
<li><strong>チェックイン：</strong>19:00〜20:00</li>
<li><strong>チェックアウト：</strong>最終日 12:00</li>
</ul>`,
      itinerary: `<h3>1日目 — 乗船＆ナイトダイブ（1ダイブ）</h3>
<p>19:00〜20:00 シャロン桟橋チェックイン、器材、ブリーフィング<br>ラチャノイへ出発<br>21:00 D1 — <strong>ラチャノイ – Banana Bay</strong>（ナイトダイブ）</p>

<h3>2日目 — ラチャ諸島（4ダイブ）</h3>
<p>07:30 D2 — <strong>ラチャノイ – South Tip</strong>（壁、潮流、大型魚）<br>10:30 D3 — <strong>ラチャノイ – Banana Bay</strong>（ウミガメ、エイ）<br>14:00 D4 — <strong>ラチャヤイ – Bay 1</strong>（ハードコーラル）<br>17:00 D5 — <strong>ラチャヤイ – Bungalow Bay</strong>（サンセット）</p>

<h3>3日目 — ラチャヤイ＆帰港（2ダイブ）</h3>
<p>07:30 D6 — <strong>ラチャヤイ – 沈船</strong><br>09:30 D7 — <strong>ラチャヤイ – Bay 2</strong>（水中彫刻、フェアウェル）<br>朝食、リラックス<br>12:00 シャロン桟橋到着、チェックアウト</p>`,
    },
  ],
},

]; // end templates array

async function main() {
  console.log(`Updating translations for ${templates.length} schedule templates...`);

  for (const t of templates) {
    console.log(`\n── ${t.routeName} (${t.scheduleId}) ──`);
    for (const tr of t.translations) {
      const result = await prisma.scheduleTranslation.updateMany({
        where: { scheduleId: t.scheduleId, lang: tr.lang },
        data: {
          title: tr.title,
          slug: tr.slug,
          excerpt: tr.excerpt,
          content: tr.content,
          itinerary: tr.itinerary,
          route: tr.route,
          keywords: tr.keywords,
        },
      });
      console.log(`  [${tr.lang}] updated ${result.count} row`);
    }
  }

  console.log("\n✓ All translations saved!");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
