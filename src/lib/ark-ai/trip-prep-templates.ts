// Static "what to bring" / "what's included" templates per trip type.
// These are the planner-fallback when the operator's schedule.content
// HTML doesn't already enumerate them. The intent is that every plan
// shows the user (a) what they'll get for the price, (b) what they
// still need to budget separately for, (c) what to pack — without
// the AI having to fabricate it on every chat turn.
//
// Templates are keyed by trip TYPE (PlanTrip.type). Cert-level
// modifiers add/remove items (e.g. DSD doesn't need a logbook;
// AOW+ tend to bring their own dive computer).

export type CertLevel = "none" | "dsd" | "ow" | "aow" | "rescue" | "divemaster" | "instructor";

/** A checklist line localized in all 8 supported languages.
 *  Thai (th) is the source of truth; the rest are faithful translations. */
export type ChecklistItem = {
  th: string;
  en: string;
  cn: string;
  ja: string;
  ko: string;
  de: string;
  fr: string;
  ru: string;
};

export type ChecklistTemplate = {
  /** Always provided by operator */
  included: ChecklistItem[];
  /** User pays separately or brings */
  notIncluded: ChecklistItem[];
  /** Recommended packing list */
  prepare: ChecklistItem[];
};

const COMMON_DIVE_INCLUDED: ChecklistItem[] = [
  {
    th: "เรือ + กัปตัน + ลูกเรือ",
    en: "Boat + captain + crew",
    cn: "船只 + 船长 + 船员",
    ja: "ボート + 船長 + クルー",
    ko: "보트 + 선장 + 승무원",
    de: "Boot + Kapitän + Crew",
    fr: "Bateau + capitaine + équipage",
    ru: "Лодка + капитан + экипаж",
  },
  {
    th: "ไกด์ดำน้ำมืออาชีพ",
    en: "Professional dive guide",
    cn: "专业潜水向导",
    ja: "プロのダイブガイド",
    ko: "전문 다이빙 가이드",
    de: "Professioneller Tauchguide",
    fr: "Guide de plongée professionnel",
    ru: "Профессиональный дайв-гид",
  },
  {
    th: "อุปกรณ์ดำน้ำครบเซ็ต (mask, fins, BCD, regulator, wetsuit)",
    en: "Full dive gear (mask, fins, BCD, regulator, wetsuit)",
    cn: "全套潜水装备（面镜、脚蹼、BCD、调节器、潜水服）",
    ja: "ダイビング装備一式（マスク・フィン・BCD・レギュレーター・ウェットスーツ）",
    ko: "다이빙 장비 풀세트 (마스크, 핀, BCD, 호흡기, 웻슈트)",
    de: "Komplette Tauchausrüstung (Maske, Flossen, BCD, Atemregler, Neoprenanzug)",
    fr: "Équipement de plongée complet (masque, palmes, gilet, détendeur, combinaison)",
    ru: "Полный комплект снаряжения (маска, ласты, компенсатор, регулятор, гидрокостюм)",
  },
  {
    th: "ถังอากาศ + น้ำหนัก",
    en: "Air tanks + weights",
    cn: "气瓶 + 配重",
    ja: "エアタンク + ウェイト",
    ko: "공기 탱크 + 웨이트",
    de: "Pressluftflaschen + Bleigewichte",
    fr: "Bouteilles d'air + lestage",
    ru: "Баллоны с воздухом + грузы",
  },
  {
    th: "อาหารกลางวัน + น้ำดื่ม + ผลไม้",
    en: "Lunch + drinking water + fruit",
    cn: "午餐 + 饮用水 + 水果",
    ja: "昼食 + 飲料水 + フルーツ",
    ko: "점심 + 식수 + 과일",
    de: "Mittagessen + Trinkwasser + Obst",
    fr: "Déjeuner + eau potable + fruits",
    ru: "Обед + питьевая вода + фрукты",
  },
  {
    th: "ประกันอุบัติเหตุระหว่างทริป",
    en: "On-trip accident insurance",
    cn: "行程意外保险",
    ja: "ツアー中の傷害保険",
    ko: "여행 중 상해 보험",
    de: "Unfallversicherung während der Tour",
    fr: "Assurance accident pendant le voyage",
    ru: "Страхование от несчастных случаев на время поездки",
  },
];

const COMMON_DIVE_NOT_INCLUDED: ChecklistItem[] = [
  {
    th: "ค่าเดินทางจาก/ไปสนามบิน (ถ้าไม่ได้เลือก transfer)",
    en: "Airport transfer (unless transfer add-on selected)",
    cn: "机场接送（未选择接送服务时）",
    ja: "空港送迎（送迎オプションを選択しない場合）",
    ko: "공항 이동 (트랜스퍼 옵션 미선택 시)",
    de: "Flughafentransfer (sofern kein Transfer-Add-on gewählt)",
    fr: "Transfert aéroport (sauf si l'option transfert est choisie)",
    ru: "Трансфер из/в аэропорт (если опция трансфера не выбрана)",
  },
  {
    th: "ค่าธรรมเนียมอุทยานแห่งชาติ (ถ้ามี)",
    en: "National park fees (where applicable)",
    cn: "国家公园费用（如适用）",
    ja: "国立公園入園料（該当する場合）",
    ko: "국립공원 입장료 (해당 시)",
    de: "Nationalparkgebühren (sofern zutreffend)",
    fr: "Frais de parc national (le cas échéant)",
    ru: "Сборы национального парка (если применимо)",
  },
  {
    th: "อุปกรณ์ส่วนตัว (กล้องใต้น้ำ, dive computer ถ้าต้องการ)",
    en: "Personal gear (underwater camera, dive computer if preferred)",
    cn: "个人装备（水下相机、潜水电脑表，如需要）",
    ja: "個人装備（水中カメラ、希望に応じてダイブコンピューター）",
    ko: "개인 장비 (수중 카메라, 원할 경우 다이브 컴퓨터)",
    de: "Persönliche Ausrüstung (Unterwasserkamera, Tauchcomputer auf Wunsch)",
    fr: "Équipement personnel (caméra sous-marine, ordinateur de plongée si souhaité)",
    ru: "Личное снаряжение (подводная камера, дайв-компьютер по желанию)",
  },
  {
    th: "ทิปไกด์/ลูกเรือ (แล้วแต่ใจ ปกติ 200-500 บาท/คน)",
    en: "Tips for guide/crew (optional, typical 200-500 THB pp)",
    cn: "向导/船员小费（自愿，通常每人 200-500 泰铢）",
    ja: "ガイド・クルーへのチップ（任意、通常一人あたり200〜500バーツ）",
    ko: "가이드/승무원 팁 (선택, 보통 1인당 200~500바트)",
    de: "Trinkgeld für Guide/Crew (optional, üblich 200-500 THB p. P.)",
    fr: "Pourboire guide/équipage (facultatif, généralement 200-500 THB/pers.)",
    ru: "Чаевые гиду/экипажу (по желанию, обычно 200-500 бат с человека)",
  },
  {
    th: "ค่าใช้จ่ายส่วนตัวอื่น ๆ",
    en: "Other personal expenses",
    cn: "其他个人开销",
    ja: "その他の個人的な費用",
    ko: "기타 개인 비용",
    de: "Sonstige persönliche Ausgaben",
    fr: "Autres dépenses personnelles",
    ru: "Прочие личные расходы",
  },
];

const COMMON_DIVE_PREPARE: ChecklistItem[] = [
  {
    th: "ชุดว่ายน้ำ + ผ้าเช็ดตัว",
    en: "Swimsuit + towel",
    cn: "泳衣 + 毛巾",
    ja: "水着 + タオル",
    ko: "수영복 + 수건",
    de: "Badebekleidung + Handtuch",
    fr: "Maillot de bain + serviette",
    ru: "Купальник + полотенце",
  },
  {
    th: "ครีมกันแดดแบบ reef-safe",
    en: "Reef-safe sunscreen",
    cn: "珊瑚礁友好型防晒霜",
    ja: "サンゴに優しい日焼け止め",
    ko: "산호초 안전 자외선 차단제",
    de: "Riffsicheres Sonnenschutzmittel",
    fr: "Crème solaire respectueuse des récifs",
    ru: "Безопасный для рифов солнцезащитный крем",
  },
  {
    th: "เสื้อกันลม / กันหนาวสำหรับบนเรือ",
    en: "Windbreaker / warm layer for the boat",
    cn: "防风衣／船上保暖衣物",
    ja: "ウインドブレーカー／船上用の防寒着",
    ko: "바람막이 / 보트용 방한 의류",
    de: "Windjacke / warme Schicht für das Boot",
    fr: "Coupe-vent / couche chaude pour le bateau",
    ru: "Ветровка / тёплая одежда для лодки",
  },
  {
    th: "ยาแก้เมาเรือ (ถ้าต้องการ)",
    en: "Seasickness medication if needed",
    cn: "晕船药（如需要）",
    ja: "酔い止め薬（必要に応じて）",
    ko: "멀미약 (필요 시)",
    de: "Mittel gegen Seekrankheit (bei Bedarf)",
    fr: "Médicament contre le mal de mer (si besoin)",
    ru: "Лекарство от морской болезни (при необходимости)",
  },
  {
    th: "เงินสดสำหรับทิป + อุทยาน",
    en: "Cash for tips + park fees",
    cn: "用于小费和公园门票的现金",
    ja: "チップ・公園入園料用の現金",
    ko: "팁 및 공원 입장료용 현금",
    de: "Bargeld für Trinkgeld + Parkgebühren",
    fr: "Espèces pour pourboires + frais de parc",
    ru: "Наличные на чаевые + сборы парка",
  },
  {
    th: "บัตรประชาชน / passport (สำหรับลงทะเบียนทริป)",
    en: "ID / passport (for trip registration)",
    cn: "身份证／护照（用于行程登记）",
    ja: "身分証明書／パスポート（ツアー登録用）",
    ko: "신분증 / 여권 (투어 등록용)",
    de: "Ausweis / Reisepass (für die Tourregistrierung)",
    fr: "Pièce d'identité / passeport (pour l'enregistrement)",
    ru: "Удостоверение личности / паспорт (для регистрации на поездку)",
  },
];

const LIVEABOARD_EXTRA_INCLUDED: ChecklistItem[] = [
  {
    th: "ที่พักบนเรือ (ห้องตามแพ็กเกจที่เลือก)",
    en: "Onboard accommodation (cabin per chosen package)",
    cn: "船上住宿（按所选套餐的舱位）",
    ja: "船内宿泊（選択したパッケージのキャビン）",
    ko: "선상 숙박 (선택한 패키지에 따른 객실)",
    de: "Unterkunft an Bord (Kabine je nach gewähltem Paket)",
    fr: "Hébergement à bord (cabine selon le forfait choisi)",
    ru: "Размещение на борту (каюта согласно выбранному пакету)",
  },
  {
    th: "อาหารทุกมื้อ + เครื่องดื่ม non-alcoholic",
    en: "All meals + non-alcoholic drinks",
    cn: "全部餐食 + 无酒精饮料",
    ja: "全食事 + ノンアルコール飲料",
    ko: "전 식사 + 무알코올 음료",
    de: "Alle Mahlzeiten + alkoholfreie Getränke",
    fr: "Tous les repas + boissons sans alcool",
    ru: "Все приёмы пищи + безалкогольные напитки",
  },
  {
    th: "Night dive (ในทริปที่กำหนด)",
    en: "Night dive (where included in the route)",
    cn: "夜潜（行程中包含时）",
    ja: "ナイトダイブ（コースに含まれる場合）",
    ko: "야간 다이빙 (코스에 포함된 경우)",
    de: "Nachttauchgang (sofern in der Route enthalten)",
    fr: "Plongée de nuit (si incluse dans l'itinéraire)",
    ru: "Ночное погружение (если включено в маршрут)",
  },
];

const LIVEABOARD_EXTRA_PREPARE: ChecklistItem[] = [
  {
    th: "เสื้อผ้าใส่บนเรือ (3-5 ชุด เผื่อเปียก)",
    en: "Spare clothes (3-5 sets for wet days)",
    cn: "船上换洗衣物（3-5 套，以备潮湿）",
    ja: "船内用の着替え（濡れる日に備え3〜5着）",
    ko: "선상용 여벌 옷 (젖을 경우 대비 3~5벌)",
    de: "Wechselkleidung (3-5 Sätze für nasse Tage)",
    fr: "Vêtements de rechange (3 à 5 tenues pour les jours humides)",
    ru: "Сменная одежда (3-5 комплектов на случай сырости)",
  },
  {
    th: "Toiletries + ยาประจำตัว",
    en: "Toiletries + personal medication",
    cn: "洗漱用品 + 个人常用药",
    ja: "洗面用具 + 常備薬",
    ko: "세면도구 + 개인 상비약",
    de: "Toilettenartikel + persönliche Medikamente",
    fr: "Articles de toilette + médicaments personnels",
    ru: "Туалетные принадлежности + личные лекарства",
  },
  {
    th: "Power bank + adapter (ปลั๊กบนเรือมีจำกัด)",
    en: "Power bank + adapter (cabin outlets are limited)",
    cn: "充电宝 + 转换插头（船上插座有限）",
    ja: "モバイルバッテリー + 変換プラグ（船内のコンセントは限られています）",
    ko: "보조 배터리 + 어댑터 (선상 콘센트가 제한적)",
    de: "Powerbank + Adapter (Steckdosen an Bord sind begrenzt)",
    fr: "Batterie externe + adaptateur (prises limitées à bord)",
    ru: "Повербанк + переходник (розеток на борту мало)",
  },
  {
    th: "Logbook + ใบ cert (สำหรับ briefing)",
    en: "Logbook + cert card (for dive briefing)",
    cn: "潜水日志 + 潜水证（用于潜水简报）",
    ja: "ログブック + 認定カード（ブリーフィング用）",
    ko: "로그북 + 자격증 카드 (다이빙 브리핑용)",
    de: "Logbuch + Brevet-Karte (für das Tauchbriefing)",
    fr: "Carnet de plongée + carte de certification (pour le briefing)",
    ru: "Лог-бук + сертификационная карта (для брифинга)",
  },
  {
    th: "ยาแก้เมาเรือสำรอง (ทริปยาว 3-5 วัน)",
    en: "Extra seasickness meds (3-5 day trips)",
    cn: "备用晕船药（3-5 天长行程）",
    ja: "予備の酔い止め薬（3〜5日の長期ツアー）",
    ko: "여분의 멀미약 (3~5일 장기 투어)",
    de: "Zusätzliche Mittel gegen Seekrankheit (3-5-Tage-Touren)",
    fr: "Médicaments anti-mal de mer supplémentaires (voyages de 3 à 5 jours)",
    ru: "Запас лекарств от морской болезни (поездки на 3-5 дней)",
  },
];

const SNORKEL_INCLUDED: ChecklistItem[] = [
  {
    th: "เรือ + กัปตัน + ลูกเรือ",
    en: "Boat + captain + crew",
    cn: "船只 + 船长 + 船员",
    ja: "ボート + 船長 + クルー",
    ko: "보트 + 선장 + 승무원",
    de: "Boot + Kapitän + Crew",
    fr: "Bateau + capitaine + équipage",
    ru: "Лодка + капитан + экипаж",
  },
  {
    th: "ไกด์",
    en: "Guide",
    cn: "向导",
    ja: "ガイド",
    ko: "가이드",
    de: "Guide",
    fr: "Guide",
    ru: "Гид",
  },
  {
    th: "หน้ากาก + snorkel + life jacket",
    en: "Mask + snorkel + life jacket",
    cn: "面镜 + 呼吸管 + 救生衣",
    ja: "マスク + シュノーケル + ライフジャケット",
    ko: "마스크 + 스노클 + 구명조끼",
    de: "Maske + Schnorchel + Schwimmweste",
    fr: "Masque + tuba + gilet de sauvetage",
    ru: "Маска + трубка + спасательный жилет",
  },
  {
    th: "อาหารกลางวัน + น้ำดื่ม",
    en: "Lunch + drinking water",
    cn: "午餐 + 饮用水",
    ja: "昼食 + 飲料水",
    ko: "점심 + 식수",
    de: "Mittagessen + Trinkwasser",
    fr: "Déjeuner + eau potable",
    ru: "Обед + питьевая вода",
  },
  {
    th: "ประกันทริป",
    en: "Trip insurance",
    cn: "行程保险",
    ja: "ツアー保険",
    ko: "여행 보험",
    de: "Reiseversicherung",
    fr: "Assurance voyage",
    ru: "Страховка на поездку",
  },
];

const SNORKEL_NOT_INCLUDED: ChecklistItem[] = [
  {
    th: "ค่าธรรมเนียมอุทยาน",
    en: "National park fees",
    cn: "国家公园费用",
    ja: "国立公園入園料",
    ko: "국립공원 입장료",
    de: "Nationalparkgebühren",
    fr: "Frais de parc national",
    ru: "Сборы национального парка",
  },
  {
    th: "ค่าเดินทางจาก/ไปสนามบิน",
    en: "Airport transfer",
    cn: "机场接送",
    ja: "空港送迎",
    ko: "공항 이동",
    de: "Flughafentransfer",
    fr: "Transfert aéroport",
    ru: "Трансфер из/в аэропорт",
  },
  {
    th: "ทิปไกด์/ลูกเรือ",
    en: "Tips for guide/crew",
    cn: "向导/船员小费",
    ja: "ガイド・クルーへのチップ",
    ko: "가이드/승무원 팁",
    de: "Trinkgeld für Guide/Crew",
    fr: "Pourboire guide/équipage",
    ru: "Чаевые гиду/экипажу",
  },
];

const SNORKEL_PREPARE: ChecklistItem[] = [
  {
    th: "ชุดว่ายน้ำ + ผ้าเช็ดตัว",
    en: "Swimsuit + towel",
    cn: "泳衣 + 毛巾",
    ja: "水着 + タオル",
    ko: "수영복 + 수건",
    de: "Badebekleidung + Handtuch",
    fr: "Maillot de bain + serviette",
    ru: "Купальник + полотенце",
  },
  {
    th: "ครีมกันแดด reef-safe",
    en: "Reef-safe sunscreen",
    cn: "珊瑚礁友好型防晒霜",
    ja: "サンゴに優しい日焼け止め",
    ko: "산호초 안전 자외선 차단제",
    de: "Riffsicheres Sonnenschutzmittel",
    fr: "Crème solaire respectueuse des récifs",
    ru: "Безопасный для рифов солнцезащитный крем",
  },
  {
    th: "ยาแก้เมาเรือ (ถ้าต้องการ)",
    en: "Seasickness meds if needed",
    cn: "晕船药（如需要）",
    ja: "酔い止め薬（必要に応じて）",
    ko: "멀미약 (필요 시)",
    de: "Mittel gegen Seekrankheit (bei Bedarf)",
    fr: "Médicament contre le mal de mer (si besoin)",
    ru: "Лекарство от морской болезни (при необходимости)",
  },
  {
    th: "เสื้อกันลม",
    en: "Windbreaker",
    cn: "防风衣",
    ja: "ウインドブレーカー",
    ko: "바람막이",
    de: "Windjacke",
    fr: "Coupe-vent",
    ru: "Ветровка",
  },
  {
    th: "เงินสดสำหรับทิป + อุทยาน",
    en: "Cash for tips + park fees",
    cn: "用于小费和公园门票的现金",
    ja: "チップ・公園入園料用の現金",
    ko: "팁 및 공원 입장료용 현금",
    de: "Bargeld für Trinkgeld + Parkgebühren",
    fr: "Espèces pour pourboires + frais de parc",
    ru: "Наличные на чаевые + сборы парка",
  },
];

const LAND_INCLUDED: ChecklistItem[] = [
  {
    th: "รถ + คนขับ + ไกด์",
    en: "Vehicle + driver + guide",
    cn: "车辆 + 司机 + 向导",
    ja: "車両 + ドライバー + ガイド",
    ko: "차량 + 운전기사 + 가이드",
    de: "Fahrzeug + Fahrer + Guide",
    fr: "Véhicule + chauffeur + guide",
    ru: "Транспорт + водитель + гид",
  },
  {
    th: "ค่าเข้าสถานที่ตามรายการ",
    en: "Site entry fees per itinerary",
    cn: "行程内景点门票",
    ja: "行程に含まれる施設入場料",
    ko: "일정에 따른 명소 입장료",
    de: "Eintrittsgebühren laut Reiseplan",
    fr: "Frais d'entrée des sites selon l'itinéraire",
    ru: "Входные билеты по маршруту",
  },
  {
    th: "อาหารกลางวัน (ถ้ามี)",
    en: "Lunch (where applicable)",
    cn: "午餐（如适用）",
    ja: "昼食（該当する場合）",
    ko: "점심 (해당 시)",
    de: "Mittagessen (sofern zutreffend)",
    fr: "Déjeuner (le cas échéant)",
    ru: "Обед (если предусмотрен)",
  },
  {
    th: "น้ำดื่ม",
    en: "Drinking water",
    cn: "饮用水",
    ja: "飲料水",
    ko: "식수",
    de: "Trinkwasser",
    fr: "Eau potable",
    ru: "Питьевая вода",
  },
  {
    th: "ประกันทริป",
    en: "Trip insurance",
    cn: "行程保险",
    ja: "ツアー保険",
    ko: "여행 보험",
    de: "Reiseversicherung",
    fr: "Assurance voyage",
    ru: "Страховка на поездку",
  },
];

const LAND_NOT_INCLUDED: ChecklistItem[] = [
  {
    th: "ค่าใช้จ่ายส่วนตัว",
    en: "Personal expenses",
    cn: "个人开销",
    ja: "個人的な費用",
    ko: "개인 비용",
    de: "Persönliche Ausgaben",
    fr: "Dépenses personnelles",
    ru: "Личные расходы",
  },
  {
    th: "ทิปไกด์/คนขับ",
    en: "Tips for guide/driver",
    cn: "向导/司机小费",
    ja: "ガイド・ドライバーへのチップ",
    ko: "가이드/운전기사 팁",
    de: "Trinkgeld für Guide/Fahrer",
    fr: "Pourboire guide/chauffeur",
    ru: "Чаевые гиду/водителю",
  },
  {
    th: "อาหารมื้อที่ไม่ระบุ",
    en: "Meals not listed",
    cn: "未列明的餐食",
    ja: "記載のない食事",
    ko: "명시되지 않은 식사",
    de: "Nicht aufgeführte Mahlzeiten",
    fr: "Repas non mentionnés",
    ru: "Питание, не указанное в программе",
  },
];

const LAND_PREPARE: ChecklistItem[] = [
  {
    th: "เสื้อผ้าสบาย ๆ + รองเท้าเดินสะดวก",
    en: "Comfortable clothes + walking shoes",
    cn: "舒适衣物 + 便于步行的鞋",
    ja: "動きやすい服装 + 歩きやすい靴",
    ko: "편안한 옷 + 걷기 편한 신발",
    de: "Bequeme Kleidung + Wanderschuhe",
    fr: "Vêtements confortables + chaussures de marche",
    ru: "Удобная одежда + обувь для ходьбы",
  },
  {
    th: "ครีมกันแดด + หมวก + แว่นกันแดด",
    en: "Sunscreen + hat + sunglasses",
    cn: "防晒霜 + 帽子 + 太阳镜",
    ja: "日焼け止め + 帽子 + サングラス",
    ko: "자외선 차단제 + 모자 + 선글라스",
    de: "Sonnenschutz + Hut + Sonnenbrille",
    fr: "Crème solaire + chapeau + lunettes de soleil",
    ru: "Солнцезащитный крем + головной убор + солнцезащитные очки",
  },
  {
    th: "กล้อง / มือถือ (พร้อม power bank)",
    en: "Camera / phone (with power bank)",
    cn: "相机／手机（带充电宝）",
    ja: "カメラ／スマートフォン（モバイルバッテリー付き）",
    ko: "카메라 / 휴대폰 (보조 배터리 포함)",
    de: "Kamera / Smartphone (mit Powerbank)",
    fr: "Appareil photo / téléphone (avec batterie externe)",
    ru: "Камера / телефон (с повербанком)",
  },
  {
    th: "เงินสดสำหรับซื้อของ + ทิป",
    en: "Cash for shopping + tips",
    cn: "用于购物和小费的现金",
    ja: "買い物・チップ用の現金",
    ko: "쇼핑 및 팁용 현금",
    de: "Bargeld für Einkäufe + Trinkgeld",
    fr: "Espèces pour les achats + pourboires",
    ru: "Наличные на покупки + чаевые",
  },
];

const DSD_MEDICAL_FORM: ChecklistItem = {
  th: "ใบรับรองแพทย์ (สำหรับ DSD ตามที่ผู้ประกอบการขอ)",
  en: "Medical clearance form (where requested for DSD)",
  cn: "医疗证明表（DSD 体验潜水按经营者要求）",
  ja: "健康診断書（体験ダイビングでオペレーターが求める場合）",
  ko: "건강 진단서 (체험 다이빙 시 운영사 요청에 따라)",
  de: "Ärztliches Tauchtauglichkeitsattest (sofern für Schnuppertauchen verlangt)",
  fr: "Certificat médical d'aptitude (si demandé pour le baptême de plongée)",
  ru: "Медицинская справка (если требуется для пробного погружения)",
};

const CERT_CARD_LOGBOOK: ChecklistItem = {
  th: "บัตรนักดำน้ำ (cert card) + logbook",
  en: "Cert card + logbook",
  cn: "潜水证 + 潜水日志",
  ja: "認定カード + ログブック",
  ko: "다이버 자격증 카드 + 로그북",
  de: "Brevet-Karte + Logbuch",
  fr: "Carte de certification + carnet de plongée",
  ru: "Сертификационная карта + лог-бук",
};

export function getTripTemplate(tripType: string, cert: CertLevel = "ow"): ChecklistTemplate {
  const t = tripType.toUpperCase();

  if (t === "SNORKELING") {
    return {
      included: SNORKEL_INCLUDED,
      notIncluded: SNORKEL_NOT_INCLUDED,
      prepare: SNORKEL_PREPARE,
    };
  }

  if (t === "LAND_TOUR") {
    return {
      included: LAND_INCLUDED,
      notIncluded: LAND_NOT_INCLUDED,
      prepare: LAND_PREPARE,
    };
  }

  // DAYTRIP / FREEDIVE / DIVE_RESORT / LIVEABOARD all share the dive base
  const isLiveaboard = t === "LIVEABOARD" || t === "DIVE_RESORT";
  const isDsd = cert === "dsd" || cert === "none";

  const included = [
    ...COMMON_DIVE_INCLUDED,
    ...(isLiveaboard ? LIVEABOARD_EXTRA_INCLUDED : []),
  ];

  const notIncluded = [...COMMON_DIVE_NOT_INCLUDED];

  const prepare = [
    ...COMMON_DIVE_PREPARE,
    ...(isLiveaboard ? LIVEABOARD_EXTRA_PREPARE : []),
    ...(isDsd ? [DSD_MEDICAL_FORM] : [CERT_CARD_LOGBOOK]),
  ];

  return { included, notIncluded, prepare };
}
