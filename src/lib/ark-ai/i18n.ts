// Ark AI label dictionary — 8 languages.
// Replaces the binary `isTh ? "ไทย" : "English"` pattern that left
// cn/ja/ko/de/fr/ru users seeing English-only labels in MyPlan/PlanDetail/PlanTimeline.

export type ArkLang = "en" | "th" | "cn" | "ja" | "ko" | "de" | "fr" | "ru";

export const ARK_LANGS: ArkLang[] = ["en", "th", "cn", "ja", "ko", "de", "fr", "ru"];

export function normalizeArkLang(lang: string | undefined | null): ArkLang {
  if (!lang) return "en";
  return (ARK_LANGS as readonly string[]).includes(lang) ? (lang as ArkLang) : "en";
}

type Entry = Record<ArkLang, string>;

const DICT = {
  // === Common UI ===
  save: { th: "บันทึก", en: "Save", cn: "保存", ja: "保存", ko: "저장", de: "Speichern", fr: "Enregistrer", ru: "Сохранить" },
  saving: { th: "กำลังบันทึก...", en: "Saving...", cn: "保存中...", ja: "保存中...", ko: "저장 중...", de: "Speichern...", fr: "Enregistrement...", ru: "Сохранение..." },
  saved: { th: "บันทึกแล้ว ✓", en: "Saved ✓", cn: "已保存 ✓", ja: "保存しました ✓", ko: "저장됨 ✓", de: "Gespeichert ✓", fr: "Enregistré ✓", ru: "Сохранено ✓" },
  cancel: { th: "ยกเลิก", en: "Cancel", cn: "取消", ja: "キャンセル", ko: "취소", de: "Abbrechen", fr: "Annuler", ru: "Отмена" },
  confirm: { th: "ยืนยัน", en: "Confirm", cn: "确认", ja: "確認", ko: "확인", de: "Bestätigen", fr: "Confirmer", ru: "Подтвердить" },
  close: { th: "ปิด", en: "Close", cn: "关闭", ja: "閉じる", ko: "닫기", de: "Schließen", fr: "Fermer", ru: "Закрыть" },
  dismiss: { th: "ปิด", en: "Dismiss", cn: "忽略", ja: "閉じる", ko: "해제", de: "Verwerfen", fr: "Ignorer", ru: "Отклонить" },
  skip: { th: "ข้าม", en: "Skip", cn: "跳过", ja: "スキップ", ko: "건너뛰기", de: "Überspringen", fr: "Passer", ru: "Пропустить" },
  skipForNow: { th: "ข้ามไปก่อน", en: "Skip", cn: "暂时跳过", ja: "後で", ko: "나중에", de: "Später", fr: "Plus tard", ru: "Позже" },
  add: { th: "เพิ่ม", en: "Add", cn: "添加", ja: "追加", ko: "추가", de: "Hinzufügen", fr: "Ajouter", ru: "Добавить" },
  delete: { th: "ลบ", en: "Delete", cn: "删除", ja: "削除", ko: "삭제", de: "Löschen", fr: "Supprimer", ru: "Удалить" },
  remove: { th: "เอาออก", en: "Remove", cn: "移除", ja: "外す", ko: "제거", de: "Entfernen", fr: "Retirer", ru: "Убрать" },
  clear: { th: "ล้าง", en: "Clear", cn: "清空", ja: "クリア", ko: "지우기", de: "Leeren", fr: "Effacer", ru: "Очистить" },
  create: { th: "สร้าง", en: "Create", cn: "创建", ja: "作成", ko: "생성", de: "Erstellen", fr: "Créer", ru: "Создать" },
  send: { th: "ส่ง", en: "Send", cn: "发送", ja: "送信", ko: "보내기", de: "Senden", fr: "Envoyer", ru: "Отправить" },
  share: { th: "แชร์", en: "Share", cn: "分享", ja: "共有", ko: "공유", de: "Teilen", fr: "Partager", ru: "Поделиться" },
  invite: { th: "เชิญ", en: "Invite", cn: "邀请", ja: "招待", ko: "초대", de: "Einladen", fr: "Inviter", ru: "Пригласить" },
  retry: { th: "ลองใหม่", en: "Try again", cn: "重试", ja: "再試行", ko: "다시 시도", de: "Erneut versuchen", fr: "Réessayer", ru: "Повторить" },
  somethingWentWrong: { th: "เกิดข้อผิดพลาด ลองใหม่", en: "Something went wrong, try again", cn: "出错了,请重试", ja: "エラーが発生しました。再試行してください", ko: "오류가 발생했습니다. 다시 시도해주세요", de: "Etwas ist schiefgelaufen, bitte erneut versuchen", fr: "Une erreur s'est produite, réessayez", ru: "Произошла ошибка, попробуйте снова" },
  somethingWentWrongLong: { th: "เกิดข้อผิดพลาด ลองใหม่อีกครั้ง", en: "Something went wrong. Please try again.", cn: "出错了。请重试。", ja: "エラーが発生しました。もう一度お試しください。", ko: "오류가 발생했습니다. 다시 시도해주세요.", de: "Etwas ist schiefgelaufen. Bitte erneut versuchen.", fr: "Une erreur s'est produite. Veuillez réessayer.", ru: "Произошла ошибка. Пожалуйста, попробуйте снова." },
  comingSoon: { th: "เร็วๆ นี้", en: "Coming soon", cn: "即将推出", ja: "近日公開", ko: "곧 출시", de: "Demnächst", fr: "Bientôt disponible", ru: "Скоро" },
  buildMyPlan: { th: "✨ สร้าง plan ของฉัน", en: "✨ Build my plan", cn: "✨ 构建我的计划", ja: "✨ プランを作成", ko: "✨ 내 플랜 만들기", de: "✨ Meinen Plan erstellen", fr: "✨ Créer mon plan", ru: "✨ Создать мой план" },
  orPickAnotherToCompare: { th: "หรือเลือกทริปอื่นเพื่อมาเปรียบเทียบ", en: "Or pick another trip to compare", cn: "或选择其他行程进行比较", ja: "または別のツアーを選んで比較", ko: "또는 다른 투어를 선택해 비교", de: "Oder weitere Touren zum Vergleich wählen", fr: "Ou choisissez un autre voyage à comparer", ru: "Или выберите другой тур для сравнения" },
  now: { th: "เมื่อกี้", en: "now", cn: "刚刚", ja: "今", ko: "방금", de: "gerade", fr: "à l'instant", ru: "только что" },
  contactUs: { th: "ติดต่อสอบถาม", en: "Contact Us", cn: "联系我们", ja: "お問い合わせ", ko: "문의하기", de: "Kontakt", fr: "Contact", ru: "Связаться" },
  contactTeam: { th: "ติดต่อทีมงาน", en: "Contact us", cn: "联系团队", ja: "サポートに連絡", ko: "팀에 연락", de: "Team kontaktieren", fr: "Contacter l'équipe", ru: "Связаться с командой" },
  linkCopied: { th: "คัดลอกลิงก์แล้ว!", en: "Link copied!", cn: "链接已复制!", ja: "リンクをコピーしました!", ko: "링크가 복사되었습니다!", de: "Link kopiert!", fr: "Lien copié !", ru: "Ссылка скопирована!" },

  // === Plan core ===
  trips: { th: "ทริป", en: "Trips", cn: "行程", ja: "ツアー", ko: "투어", de: "Touren", fr: "Voyages", ru: "Туры" },
  tripsLower: { th: "ทริป", en: "trips", cn: "行程", ja: "ツアー", ko: "투어", de: "Touren", fr: "voyages", ru: "поездок" },
  toursLower: { th: "ทัวร์", en: "tours", cn: "团", ja: "ツアー", ko: "투어", de: "Touren", fr: "tours", ru: "туров" },
  rounds: { th: "รอบ", en: "trips", cn: "班次", ja: "便", ko: "회차", de: "Fahrten", fr: "départs", ru: "рейсов" },
  members: { th: "สมาชิก", en: "Members", cn: "成员", ja: "メンバー", ko: "멤버", de: "Mitglieder", fr: "Membres", ru: "Участники" },
  membersLower: { th: "สมาชิก", en: "members", cn: "成员", ja: "メンバー", ko: "멤버", de: "Mitglieder", fr: "membres", ru: "участников" },
  itemName: { th: "รายการ", en: "Item name", cn: "项目名称", ja: "項目名", ko: "항목 이름", de: "Bezeichnung", fr: "Nom de l'élément", ru: "Название" },
  itemsLower: { th: "รายการ", en: "items", cn: "项", ja: "項目", ko: "항목", de: "Einträge", fr: "éléments", ru: "элементов" },
  daysLower: { th: "วัน", en: "days", cn: "天", ja: "日間", ko: "일", de: "Tage", fr: "jours", ru: "дней" },
  divesLower: { th: "ไดฟ์", en: "dives", cn: "潜水", ja: "ダイブ", ko: "다이브", de: "Tauchgänge", fr: "plongées", ru: "погружений" },
  activitiesLower: { th: "กิจกรรม", en: "activities", cn: "活动", ja: "アクティビティ", ko: "활동", de: "Aktivitäten", fr: "activités", ru: "мероприятий" },
  completedLower: { th: "เสร็จแล้ว", en: "completed", cn: "已完成", ja: "完了", ko: "완료", de: "erledigt", fr: "terminé", ru: "выполнено" },
  you: { th: "คุณ", en: "You", cn: "你", ja: "あなた", ko: "당신", de: "Du", fr: "Vous", ru: "Вы" },
  owner: { th: "เจ้าของ", en: "Owner", cn: "所有者", ja: "オーナー", ko: "소유자", de: "Besitzer", fr: "Propriétaire", ru: "Владелец" },
  editorRole: { th: "แก้ไขได้", en: "Editor", cn: "编辑者", ja: "編集者", ko: "편집자", de: "Bearbeiter", fr: "Éditeur", ru: "Редактор" },
  viewerRole: { th: "ดูอย่างเดียว", en: "Viewer", cn: "查看者", ja: "閲覧者", ko: "뷰어", de: "Betrachter", fr: "Lecteur", ru: "Наблюдатель" },
  ownerOnly: { th: "เฉพาะเจ้าของแพลนเท่านั้น", en: "Owner only", cn: "仅限所有者", ja: "オーナーのみ", ko: "소유자만", de: "Nur Besitzer", fr: "Propriétaire uniquement", ru: "Только владелец" },
  type: { th: "ประเภท", en: "Type", cn: "类型", ja: "タイプ", ko: "유형", de: "Typ", fr: "Type", ru: "Тип" },
  area: { th: "พื้นที่", en: "Area", cn: "区域", ja: "エリア", ko: "지역", de: "Gebiet", fr: "Zone", ru: "Район" },
  duration: { th: "ระยะเวลา", en: "Duration", cn: "时长", ja: "期間", ko: "기간", de: "Dauer", fr: "Durée", ru: "Продолжительность" },
  route: { th: "เส้นทาง", en: "Route", cn: "路线", ja: "ルート", ko: "경로", de: "Route", fr: "Itinéraire", ru: "Маршрут" },
  departure: { th: "วันที่", en: "Departure", cn: "出发日期", ja: "出発日", ko: "출발일", de: "Abfahrt", fr: "Départ", ru: "Отправление" },
  startingPrice: { th: "ราคาเริ่มต้น", en: "Starting price", cn: "起价", ja: "最低価格", ko: "최저가", de: "Ab-Preis", fr: "À partir de", ru: "Цена от" },
  startingPricePerPerson: { th: "เริ่มต้น/คน", en: "Starting price", cn: "起价/人", ja: "1名から", ko: "1인 최저가", de: "Ab pro Person", fr: "À partir de/pers.", ru: "От/чел." },
  perPerson: { th: "/คน", en: "/person", cn: "/人", ja: "/名", ko: "/인", de: "/Person", fr: "/pers.", ru: "/чел." },
  assign: { th: "มอบหมาย", en: "Assign", cn: "分配", ja: "割り当て", ko: "배정", de: "Zuweisen", fr: "Attribuer", ru: "Назначить" },
  category: { th: "หมวด (เช่น Gear)", en: "Category (e.g. Gear)", cn: "类别(例如装备)", ja: "カテゴリ(例:装備)", ko: "카테고리 (예: 장비)", de: "Kategorie (z. B. Ausrüstung)", fr: "Catégorie (ex. Équipement)", ru: "Категория (напр. Снаряжение)" },

  // === MyPlan / PlanList ===
  createNewPlan: { th: "สร้างแพลนใหม่", en: "Create New Plan", cn: "创建新计划", ja: "新しいプランを作成", ko: "새 플랜 만들기", de: "Neuen Plan erstellen", fr: "Créer un nouveau plan", ru: "Создать новый план" },
  newPlan: { th: "สร้างแพลนใหม่", en: "New Plan", cn: "新建计划", ja: "新規プラン", ko: "새 플랜", de: "Neuer Plan", fr: "Nouveau plan", ru: "Новый план" },
  createPlanCta: { th: "+ สร้างแพลนใหม่", en: "+ Create New Plan", cn: "+ 创建新计划", ja: "+ 新しいプラン", ko: "+ 새 플랜 만들기", de: "+ Neuen Plan erstellen", fr: "+ Nouveau plan", ru: "+ Создать новый план" },
  createPlan: { th: "สร้างแพลน", en: "Create Plan", cn: "创建计划", ja: "プラン作成", ko: "플랜 만들기", de: "Plan erstellen", fr: "Créer un plan", ru: "Создать план" },
  planName: { th: "ชื่อแพลน", en: "Plan name", cn: "计划名称", ja: "プラン名", ko: "플랜 이름", de: "Planname", fr: "Nom du plan", ru: "Название плана" },
  planNamePlaceholder: { th: "ชื่อแพลน เช่น สิมิลัน มีนา 2026", en: "Plan name, e.g. Similan March 2026", cn: "计划名称,例如 西米兰 2026年3月", ja: "プラン名(例:シミラン 2026年3月)", ko: "플랜 이름, 예: 시밀란 2026년 3월", de: "Planname, z. B. Similan März 2026", fr: "Nom, ex. Similan mars 2026", ru: "Название, напр. Симилан март 2026" },
  noTripsYet: { th: "ยังไม่มีทริปในแพลน", en: "No trips yet", cn: "还没有行程", ja: "まだツアーがありません", ko: "아직 투어가 없습니다", de: "Noch keine Touren", fr: "Pas encore de voyages", ru: "Пока нет туров" },
  noTripsInPlan: { th: "ยังไม่มีทริปในแพลน", en: "No trips in your plan", cn: "您的计划中还没有行程", ja: "プランにツアーがまだありません", ko: "플랜에 투어가 없습니다", de: "Noch keine Touren im Plan", fr: "Aucun voyage dans votre plan", ru: "В плане пока нет туров" },
  noTripsHint: { th: "กด \"+\" บนทริปที่สนใจเพื่อเพิ่มเข้าแพลน", en: "Tap \"+\" on trips you like to add them to your plan", cn: "点击喜欢的行程上的 \"+\" 加入计划", ja: "気になるツアーの\"+\"をタップしてプランに追加", ko: "마음에 드는 투어의 \"+\"를 눌러 플랜에 추가하세요", de: "Tippe \"+\" auf gewünschten Touren, um sie zum Plan hinzuzufügen", fr: "Touchez \"+\" sur les voyages pour les ajouter au plan", ru: "Нажмите \"+\" на туре, чтобы добавить его в план" },
  noChecklistYet: { th: "ยังไม่มีรายการเตรียมตัว", en: "No checklist items yet", cn: "还没有清单项目", ja: "チェックリストはまだありません", ko: "체크리스트 항목이 없습니다", de: "Noch keine Checklisteneinträge", fr: "Pas encore de liste", ru: "Пока нет пунктов" },
  noPhotosYet: { th: "ยังไม่มีรูปในแพลน", en: "No photos yet", cn: "还没有照片", ja: "まだ写真がありません", ko: "사진이 없습니다", de: "Noch keine Fotos", fr: "Pas encore de photos", ru: "Пока нет фото" },
  noUpcomingSchedules: { th: "ไม่มี Schedule ที่กำลังจะมา", en: "No upcoming schedules", cn: "暂无即将到来的行程", ja: "今後のスケジュールはありません", ko: "예정된 일정 없음", de: "Keine bevorstehenden Termine", fr: "Aucun départ à venir", ru: "Нет предстоящих рейсов" },
  startFirstTripPlan: { th: "เริ่มวางแผนทริปแรก", en: "Start your first trip plan", cn: "开始规划您的第一次行程", ja: "最初のツアープランを始める", ko: "첫 투어 플랜 시작하기", de: "Erstellen Sie Ihren ersten Plan", fr: "Commencez votre premier plan", ru: "Создайте свой первый план" },
  emptyPlansSubtext: { th: "สร้างแพลน เพิ่มทริป ชวนเพื่อน แชร์รูป วางแผนดำน้ำด้วยกัน", en: "Create a plan, add trips, invite friends, share photos — plan your dive trip together", cn: "创建计划、添加行程、邀请朋友、分享照片 — 一起规划潜水之旅", ja: "プランを作り、ツアーを追加し、友達を招待し、写真を共有 — みんなでダイブを計画", ko: "플랜을 만들고 투어를 추가하고 친구를 초대하고 사진을 공유 — 함께 다이빙 계획", de: "Plan erstellen, Touren hinzufügen, Freunde einladen, Fotos teilen — gemeinsam tauchen planen", fr: "Créez un plan, ajoutez des voyages, invitez des amis, partagez des photos — planifiez ensemble", ru: "Создавайте планы, добавляйте туры, приглашайте друзей, делитесь фото — планируйте дайвинг вместе" },
  goChatFindTrips: { th: "ไปแชทหาทริป", en: "Chat to find trips", cn: "聊天找行程", ja: "チャットでツアーを探す", ko: "채팅으로 투어 찾기", de: "Chat: Touren finden", fr: "Discuter pour trouver", ru: "Чат для поиска туров" },
  recommendedTripsFromAi: { th: "ทริปจาก AI", en: "Recommended trips from AI", cn: "AI 推荐行程", ja: "AIのおすすめツアー", ko: "AI 추천 투어", de: "Empfohlene Touren von KI", fr: "Voyages recommandés par l'IA", ru: "Туры от ИИ" },
  deletePlan: { th: "ลบแพลน", en: "Delete Plan", cn: "删除计划", ja: "プランを削除", ko: "플랜 삭제", de: "Plan löschen", fr: "Supprimer le plan", ru: "Удалить план" },
  deleteThisPlan: { th: "ลบแพลนนี้?", en: "Delete this plan?", cn: "删除此计划?", ja: "このプランを削除しますか?", ko: "이 플랜을 삭제하시겠습니까?", de: "Diesen Plan löschen?", fr: "Supprimer ce plan ?", ru: "Удалить этот план?" },
  seeAllPlans: { th: "ดูแพลนทั้งหมด", en: "See all plans", cn: "查看所有计划", ja: "すべてのプランを見る", ko: "모든 플랜 보기", de: "Alle Pläne ansehen", fr: "Voir tous les plans", ru: "Все планы" },
  selectPlanForTrip: { th: "เพิ่มลงแพลนไหน?", en: "Add to which plan?", cn: "添加到哪个计划?", ja: "どのプランに追加?", ko: "어느 플랜에 추가?", de: "Zu welchem Plan hinzufügen?", fr: "Ajouter à quel plan ?", ru: "В какой план добавить?" },
  selectPlanHint: { th: "เลือกแพลนที่ต้องการเพิ่มทริปนี้", en: "Select a plan to add this trip to", cn: "选择要添加此行程的计划", ja: "このツアーを追加するプランを選択", ko: "이 투어를 추가할 플랜 선택", de: "Plan zum Hinzufügen auswählen", fr: "Sélectionnez un plan", ru: "Выберите план" },
  addToSamePlan: { th: "เพิ่มลงแพลนเดิม", en: "Add to Same Plan", cn: "加入同一计划", ja: "同じプランに追加", ko: "같은 플랜에 추가", de: "Zum selben Plan hinzufügen", fr: "Ajouter au même plan", ru: "В тот же план" },
  addMoreTrips: { th: "เพิ่มทริป", en: "Add more trips", cn: "添加更多行程", ja: "ツアーを追加", ko: "투어 더 추가", de: "Weitere Touren hinzufügen", fr: "Ajouter d'autres voyages", ru: "Добавить туры" },
  addItem: { th: "เพิ่มรายการ", en: "Add Item", cn: "添加项目", ja: "項目を追加", ko: "항목 추가", de: "Eintrag hinzufügen", fr: "Ajouter un élément", ru: "Добавить пункт" },

  // === Tabs ===
  tripsTab: { th: "ทริป", en: "Trips", cn: "行程", ja: "ツアー", ko: "투어", de: "Touren", fr: "Voyages", ru: "Туры" },

  // === Schedule / Itinerary ===
  hideItinerary: { th: "ซ่อนกำหนดการ", en: "Hide itinerary", cn: "隐藏行程", ja: "日程を隠す", ko: "일정 숨기기", de: "Programm ausblenden", fr: "Masquer l'itinéraire", ru: "Скрыть программу" },
  hideDetails: { th: "ซ่อนรายละเอียด", en: "Hide details", cn: "隐藏详情", ja: "詳細を隠す", ko: "세부 정보 숨기기", de: "Details ausblenden", fr: "Masquer les détails", ru: "Скрыть детали" },
  viewDetails: { th: "ดูรายละเอียด", en: "View details", cn: "查看详情", ja: "詳細を見る", ko: "세부 정보 보기", de: "Details anzeigen", fr: "Voir les détails", ru: "Подробнее" },
  noAdditionalDetails: { th: "ไม่มีรายละเอียดเพิ่มเติม", en: "No additional details available", cn: "暂无更多详情", ja: "追加情報はありません", ko: "추가 정보 없음", de: "Keine weiteren Details", fr: "Aucun détail supplémentaire", ru: "Дополнительных сведений нет" },
  cantLoadDetails: { th: "ไม่สามารถโหลดรายละเอียดได้", en: "Could not load details", cn: "无法加载详情", ja: "詳細を読み込めません", ko: "세부 정보를 불러올 수 없습니다", de: "Details konnten nicht geladen werden", fr: "Impossible de charger les détails", ru: "Не удалось загрузить детали" },
  loadingDetails: { th: "กำลังโหลดรายละเอียด…", en: "Loading details…", cn: "加载详情中…", ja: "詳細を読み込み中…", ko: "세부 정보 불러오는 중…", de: "Details werden geladen…", fr: "Chargement des détails…", ru: "Загрузка деталей…" },
  unscheduled: { th: "ยังไม่กำหนดวัน", en: "Unscheduled", cn: "未定日期", ja: "日付未定", ko: "날짜 미정", de: "Ohne Datum", fr: "Date non définie", ru: "Без даты" },
  selectDate: { th: "เลือกวันที่", en: "Select date", cn: "选择日期", ja: "日付を選択", ko: "날짜 선택", de: "Datum wählen", fr: "Choisir la date", ru: "Выбрать дату" },
  selectMonth: { th: "เลือกเดือน", en: "Select month", cn: "选择月份", ja: "月を選択", ko: "월 선택", de: "Monat wählen", fr: "Choisir le mois", ru: "Выбрать месяц" },
  clickToChangeDate: { th: "คลิกเพื่อเปลี่ยนวัน", en: "Click to change date", cn: "点击更改日期", ja: "クリックして日付を変更", ko: "클릭하여 날짜 변경", de: "Klicken zum Datum ändern", fr: "Cliquer pour changer", ru: "Нажмите, чтобы изменить" },

  // === Conflict ===
  dateConflictTitle: { th: "วันชนกับทริปอื่น", en: "Date conflict with another trip", cn: "与其他行程日期冲突", ja: "他のツアーと日程が重複", ko: "다른 투어와 일정 충돌", de: "Terminkonflikt mit anderer Tour", fr: "Conflit de dates avec un autre voyage", ru: "Конфликт дат с другим туром" },
  dateOverlap: { th: "วันที่ซ้อนทับ", en: "Date Overlap", cn: "日期重叠", ja: "日程重複", ko: "날짜 겹침", de: "Datumsüberschneidung", fr: "Chevauchement de dates", ru: "Пересечение дат" },
  tripOverlapMessage: { th: "ทริปนี้มีวันที่ทับซ้อนกับทริปที่มีอยู่แล้ว", en: "This trip overlaps with existing trips", cn: "此行程与现有行程日期重叠", ja: "このツアーは既存のツアーと日程が重複しています", ko: "이 투어는 기존 투어와 일정이 겹칩니다", de: "Diese Tour überschneidet sich mit bestehenden", fr: "Ce voyage chevauche d'autres voyages", ru: "Этот тур пересекается с другими" },
  cantBeOnTwoTrips: { th: "ดำน้ำ 2 ที่พร้อมกันในวันเดียวไม่ได้ — กดเลื่อนวันที่ของทริปนี้ หรือเอาออกถ้าไม่จำเป็น", en: "Can't be on two trips the same day — change this trip's date or remove it if not needed", cn: "同一天不能参加两个行程 — 请更改日期或移除不需要的行程", ja: "同じ日に2つのツアーには参加できません — 日程を変更するか不要なら外してください", ko: "같은 날 두 투어에 참여할 수 없습니다 — 날짜를 변경하거나 필요 없으면 제거하세요", de: "Zwei Touren am selben Tag sind nicht möglich — Datum ändern oder entfernen", fr: "Impossible de faire deux voyages le même jour — changez la date ou retirez-le", ru: "Нельзя быть в двух турах в один день — измените дату или удалите тур" },
  leftTrip: { th: "ทริปซ้าย", en: "Left", cn: "左侧", ja: "左", ko: "왼쪽", de: "Links", fr: "Gauche", ru: "Слева" },
  rightTrip: { th: "ทริปขวา", en: "Right", cn: "右侧", ja: "右", ko: "오른쪽", de: "Rechts", fr: "Droite", ru: "Справа" },

  // === Compare ===
  compareTwoTrips: { th: "เปรียบเทียบ 2 ทริป", en: "Compare 2 trips", cn: "比较 2 个行程", ja: "2つのツアーを比較", ko: "투어 2개 비교", de: "2 Touren vergleichen", fr: "Comparer 2 voyages", ru: "Сравнить 2 тура" },
  pickTwoToCompare: { th: "เลือก 2 ทริปเพื่อเปรียบเทียบ", en: "Pick 2 trips to compare", cn: "选择 2 个行程比较", ja: "比較する2つのツアーを選択", ko: "비교할 투어 2개 선택", de: "2 Touren zum Vergleich wählen", fr: "Choisissez 2 voyages", ru: "Выберите 2 тура" },
  greenIsCheaper: { th: "✨ ตัวเลขสีเขียว = ตัวเลือกที่ถูกกว่า / นานกว่า", en: "✨ Green = cheaper / longer option", cn: "✨ 绿色 = 更便宜 / 更长选项", ja: "✨ 緑 = より安い / より長い選択肢", ko: "✨ 초록색 = 더 저렴 / 더 긴 옵션", de: "✨ Grün = günstiger / länger", fr: "✨ Vert = moins cher / plus long", ru: "✨ Зелёный = дешевле / дольше" },
  dayUnit: { th: "วัน", en: "day", cn: "天", ja: "日", ko: "일", de: "Tag", fr: "jour", ru: "день" },

  // === AI / Chat ===
  thinking: { th: "กำลังคิด…", en: "Thinking…", cn: "思考中…", ja: "考え中…", ko: "생각 중…", de: "Denke nach…", fr: "Réflexion…", ru: "Думаю…" },
  aiBuildingPlan: { th: "AI กำลังสร้าง plan ให้...", en: "AI is building your plan...", cn: "AI 正在为您建立计划...", ja: "AIがプランを作成中...", ko: "AI가 플랜을 만들고 있습니다...", de: "KI erstellt deinen Plan...", fr: "L'IA crée votre plan...", ru: "ИИ создаёт ваш план..." },
  buildingYourPlan: { th: "กำลังสร้าง plan ของคุณ...", en: "Building your plan...", cn: "正在建立您的计划...", ja: "プランを作成中...", ko: "플랜 생성 중...", de: "Plan wird erstellt...", fr: "Création du plan...", ru: "Создание плана..." },
  cantBuildPlan: { th: "ยังสร้าง plan ไม่ได้", en: "Can't build the plan yet", cn: "还无法创建计划", ja: "まだプランを作成できません", ko: "플랜을 만들 수 없습니다", de: "Plan kann noch nicht erstellt werden", fr: "Plan pas encore disponible", ru: "Пока не могу создать план" },
  buildPlanFailed: { th: "สร้าง plan ไม่สำเร็จ", en: "Couldn't build the plan", cn: "无法创建计划", ja: "プランを作成できませんでした", ko: "플랜 생성 실패", de: "Plan konnte nicht erstellt werden", fr: "Échec de la création du plan", ru: "Не удалось создать план" },
  buildPlanFailedLong: { th: "สร้าง plan ไม่สำเร็จ ลองอีกครั้งหรือทักเราผ่าน LINE ครับ", en: "Couldn't build the plan. Please try again or contact us via LINE.", cn: "无法创建计划。请重试或通过 LINE 联系我们。", ja: "プランを作成できませんでした。再試行するか LINE でお問い合わせください。", ko: "플랜을 만들 수 없습니다. 다시 시도하거나 LINE으로 문의해주세요.", de: "Plan konnte nicht erstellt werden. Bitte erneut versuchen oder via LINE kontaktieren.", fr: "Échec de la création du plan. Réessayez ou contactez-nous via LINE.", ru: "Не удалось создать план. Попробуйте снова или свяжитесь через LINE." },
  needMoreInfo: { th: "ขอข้อมูลเพิ่มอีกนิดก่อนสร้าง plan — วันที่ จำนวนคน และฝั่ง (อันดามัน/อ่าวไทย)", en: "Need more info — please share dates, headcount, and coast (Andaman/Gulf).", cn: "需要更多信息 — 请告诉我日期、人数和海岸(安达曼海/泰国湾)。", ja: "もう少し情報が必要です — 日程、人数、海岸(アンダマン/タイ湾)を教えてください。", ko: "정보가 더 필요해요 — 날짜, 인원수, 해안(안다만/태국만)을 알려주세요.", de: "Mehr Infos nötig — bitte Datum, Personenzahl und Küste (Andamanen/Golf) angeben.", fr: "Plus d'infos nécessaires — partagez les dates, le nombre de personnes et la côte (Andaman/Golfe).", ru: "Нужно больше информации — укажите даты, количество людей и побережье (Андаман/Залив)." },
  matchingPreferences: { th: "ระบบกำลังจับคู่ความต้องการกับทริปที่มี schedule ตรง ใช้เวลาประมาณ 2-3 วินาที", en: "Matching your preferences against live trip schedules. Takes about 2-3 seconds.", cn: "正在将您的偏好与可用的行程时间匹配。约需 2-3 秒。", ja: "ご希望に合うツアー日程を探しています。2〜3秒ほどかかります。", ko: "선호 사항과 일정을 매칭 중입니다. 약 2-3초 소요됩니다.", de: "Wir vergleichen deine Wünsche mit verfügbaren Touren. Dauert etwa 2–3 Sekunden.", fr: "Comparaison de vos préférences avec les départs. Environ 2-3 secondes.", ru: "Подбираем туры по вашим запросам. Это займёт 2-3 секунды." },
  buildingStepSearch: { th: "กำลังหาเรือที่ตรงกับวัน...", en: "Searching boats for your dates...", cn: "正在为您的日期寻找船只...", ja: "ご希望日のボートを検索中...", ko: "날짜에 맞는 보트 검색 중...", de: "Suche nach Booten für deine Daten...", fr: "Recherche de bateaux pour vos dates...", ru: "Ищем лодки на ваши даты..." },
  buildingStepSchedules: { th: "ตรวจ schedule และ package...", en: "Checking schedules and packages...", cn: "检查行程和套餐...", ja: "日程とパッケージを確認中...", ko: "일정과 패키지 확인 중...", de: "Pläne und Pakete werden geprüft...", fr: "Vérification des horaires et offres...", ru: "Проверяем расписания и пакеты..." },
  buildingStepPicking: { th: "เลือกทริปที่ดีที่สุด...", en: "Picking the best fit...", cn: "挑选最合适的行程...", ja: "最適なツアーを選定中...", ko: "가장 적합한 투어 선정 중...", de: "Beste Tour wird ausgewählt...", fr: "Sélection du meilleur voyage...", ru: "Выбираем оптимальный тур..." },
  buildingStepAlmost: { th: "เกือบเสร็จแล้ว...", en: "Almost ready...", cn: "即将完成...", ja: "もうすぐ完了...", ko: "거의 완료되었습니다...", de: "Fast fertig...", fr: "Presque prêt...", ru: "Почти готово..." },
  emptyResponse: { th: "ระบบไม่ตอบสนอง ลองอีกครั้ง", en: "Empty response, please retry", cn: "无响应,请重试", ja: "応答なし。再試行してください", ko: "응답 없음. 다시 시도하세요", de: "Keine Antwort, bitte erneut versuchen", fr: "Aucune réponse, réessayez", ru: "Нет ответа, попробуйте снова" },
  closeChat: { th: "ปิดแชท", en: "Close chat", cn: "关闭聊天", ja: "チャットを閉じる", ko: "채팅 닫기", de: "Chat schließen", fr: "Fermer le chat", ru: "Закрыть чат" },
  clearChat: { th: "ล้างแชท", en: "Clear chat", cn: "清空聊天", ja: "チャットをクリア", ko: "채팅 지우기", de: "Chat leeren", fr: "Effacer le chat", ru: "Очистить чат" },
  conversationHistory: { th: "ประวัติการสนทนา", en: "Conversation history", cn: "对话历史", ja: "会話履歴", ko: "대화 기록", de: "Gesprächsverlauf", fr: "Historique", ru: "История чата" },
  aiAdvisor: { th: "ผู้ช่วย AI วางแผนทริปดำน้ำ", en: "AI dive trip advisor", cn: "AI 潜水行程顾问", ja: "AIダイブツアーアドバイザー", ko: "AI 다이빙 투어 어드바이저", de: "KI-Tauchtour-Berater", fr: "Conseiller IA plongée", ru: "ИИ-консультант по дайвингу" },
  askAboutDiving: { th: "ถามเกี่ยวกับทริปดำน้ำ...", en: "Ask about diving trips...", cn: "询问潜水行程...", ja: "ダイブツアーについて質問...", ko: "다이빙 투어 문의...", de: "Frag nach Tauchtouren...", fr: "Posez une question...", ru: "Спросите о дайвинге..." },
  typeMessage: { th: "พิมพ์ข้อความ...", en: "Type a message...", cn: "输入消息...", ja: "メッセージを入力...", ko: "메시지 입력...", de: "Nachricht schreiben...", fr: "Tapez un message...", ru: "Сообщение..." },
  sendMessage: { th: "ส่งข้อความ", en: "Send message", cn: "发送消息", ja: "メッセージを送信", ko: "메시지 보내기", de: "Nachricht senden", fr: "Envoyer", ru: "Отправить" },
  backToAiChat: { th: "กลับไปคุยกับ AI", en: "Back to AI chat", cn: "返回 AI 聊天", ja: "AIチャットに戻る", ko: "AI 채팅으로", de: "Zurück zum KI-Chat", fr: "Retour au chat IA", ru: "К чату с ИИ" },
  startChattingCrew: { th: "เริ่มแชทกับเพื่อนร่วมทริป", en: "Start chatting with your trip crew", cn: "开始与队员聊天", ja: "ツアー仲間とチャット開始", ko: "투어 멤버와 채팅 시작", de: "Mit dem Crew-Chat starten", fr: "Discuter avec votre équipe", ru: "Начните чат с командой" },
  viewFullPlan: { th: "ดูรายละเอียดแผนทริป", en: "View full trip plan", cn: "查看完整计划", ja: "プラン全体を見る", ko: "전체 플랜 보기", de: "Vollständigen Plan ansehen", fr: "Voir le plan complet", ru: "Полный план" },
  tripSummaryFromChat: { th: "สรุปแผนทริปจากบทสนทนา", en: "Trip planning summary", cn: "行程规划摘要", ja: "ツアー計画サマリー", ko: "투어 계획 요약", de: "Reiseplan-Zusammenfassung", fr: "Résumé du plan", ru: "Сводка плана" },

  // === Feedback ===
  goodResponse: { th: "คำแนะนำดี", en: "Good response", cn: "推荐很好", ja: "良い回答", ko: "좋은 답변", de: "Gute Antwort", fr: "Bonne réponse", ru: "Хороший ответ" },
  badResponse: { th: "คำแนะนำไม่ตรง", en: "Bad response", cn: "推荐不合适", ja: "回答が外れている", ko: "맞지 않는 답변", de: "Schlechte Antwort", fr: "Réponse inadaptée", ru: "Плохой ответ" },
  helpfulShort: { th: "ดี", en: "Helpful", cn: "有用", ja: "役立つ", ko: "유용", de: "Hilfreich", fr: "Utile", ru: "Полезно" },
  notGreatShort: { th: "ไม่ตรง", en: "Not great", cn: "不准确", ja: "いまいち", ko: "별로", de: "Nicht gut", fr: "Pas top", ru: "Не очень" },
  beforeYouGo: { th: "ก่อนปิด — แชทนี้ช่วยคุณได้ไหม?", en: "Before you go — was this chat helpful?", cn: "走之前 — 这个聊天对您有帮助吗?", ja: "閉じる前に — このチャットは役立ちましたか?", ko: "닫기 전에 — 이 채팅이 도움이 되었나요?", de: "Bevor du gehst — war der Chat hilfreich?", fr: "Avant de partir — ce chat vous a-t-il aidé ?", ru: "Перед закрытием — чат был полезен?" },
  takesTwoSeconds: { th: "ใช้เวลาแค่ 2 วิ ช่วยให้ AI เก่งขึ้น", en: "Takes 2 seconds — helps the AI improve", cn: "只需 2 秒 — 帮助 AI 进步", ja: "2秒で完了 — AIの改善に役立ちます", ko: "2초면 됩니다 — AI 개선에 도움", de: "Dauert 2 Sekunden — hilft der KI", fr: "2 secondes — aide l'IA à progresser", ru: "2 секунды — помогает ИИ" },
  chatFeedbackLabel: { th: "ความเห็นเกี่ยวกับการแชท", en: "Chat feedback", cn: "聊天反馈", ja: "チャットフィードバック", ko: "채팅 피드백", de: "Chat-Feedback", fr: "Avis sur le chat", ru: "Отзыв о чате" },
  wantToTellWhy: { th: "อยากเล่าให้ฟังไหม? (ไม่จำเป็น)", en: "Want to tell us why? (optional)", cn: "想告诉我们原因吗?(可选)", ja: "理由を教えてください(任意)", ko: "이유를 알려주세요 (선택)", de: "Magst du sagen warum? (optional)", fr: "Dites-nous pourquoi ? (facultatif)", ru: "Расскажите почему? (необязательно)" },
  feedbackPlaceholder: { th: "เช่น คำแนะนำไม่ตรงกับวันที่...", en: "e.g. recommendations didn't match my dates...", cn: "例如,推荐与我的日期不符...", ja: "例:日程と合わなかった...", ko: "예: 날짜와 맞지 않았어요...", de: "z. B. Empfehlungen passten nicht zu meinen Daten...", fr: "ex. ne correspond pas à mes dates...", ru: "например, не подошло по датам..." },

  // === Email gate / restore ===
  yourEmail: { th: "อีเมลของคุณ", en: "Your email", cn: "您的电子邮件", ja: "メールアドレス", ko: "이메일", de: "Deine E-Mail", fr: "Votre email", ru: "Ваш email" },
  yourName: { th: "ชื่อที่ใช้เรียก", en: "Your name", cn: "您的称呼", ja: "お名前", ko: "이름", de: "Dein Name", fr: "Votre nom", ru: "Ваше имя" },
  emailSaved: { th: "บันทึกอีเมลแล้ว!", en: "Email saved!", cn: "邮箱已保存!", ja: "メールを保存しました!", ko: "이메일이 저장되었습니다!", de: "E-Mail gespeichert!", fr: "Email enregistré !", ru: "Email сохранён!" },
  invalidEmail: { th: "กรุณากรอก email ที่ถูกต้อง", en: "Please enter a valid email", cn: "请输入有效的邮箱", ja: "有効なメールアドレスを入力してください", ko: "유효한 이메일을 입력하세요", de: "Bitte gültige E-Mail eingeben", fr: "Veuillez entrer un email valide", ru: "Введите корректный email" },
  invalidEmailFull: { th: "กรุณากรอกอีเมลที่ถูกต้อง", en: "Please enter a valid email", cn: "请输入有效的邮箱", ja: "有効なメールアドレスを入力してください", ko: "유효한 이메일을 입력하세요", de: "Bitte gültige E-Mail eingeben", fr: "Veuillez entrer un email valide", ru: "Введите корректный email" },
  enterPriorEmail: { th: "ใส่อีเมลที่เคยบันทึกไว้", en: "Enter the email you saved before", cn: "输入您之前保存的邮箱", ja: "以前保存したメールを入力", ko: "이전에 저장한 이메일 입력", de: "Bisherige E-Mail eingeben", fr: "Entrez l'email enregistré", ru: "Введите сохранённый email" },
  enterEmailToAccess: { th: "ใส่อีเมลเพื่อเข้าถึงแพลนจากทุกเครื่อง", en: "Enter your email to access plans from any device", cn: "输入邮箱以从任何设备访问计划", ja: "あらゆる端末からプランにアクセス", ko: "모든 기기에서 플랜 접근", de: "E-Mail für geräteübergreifenden Zugriff", fr: "Email pour accéder partout", ru: "Email для доступа с любых устройств" },
  noPlansFound: { th: "ไม่พบแพลนจากอีเมลนี้", en: "No plans found for this email", cn: "找不到此邮箱的计划", ja: "このメールのプランが見つかりません", ko: "이 이메일의 플랜이 없습니다", de: "Keine Pläne für diese E-Mail", fr: "Aucun plan pour cet email", ru: "Планы не найдены" },
  restore: { th: "กู้คืน", en: "Restore", cn: "恢复", ja: "復元", ko: "복원", de: "Wiederherstellen", fr: "Restaurer", ru: "Восстановить" },
  restorePlans: { th: "กู้คืนแพลน", en: "Restore your plans", cn: "恢复您的计划", ja: "プランを復元", ko: "플랜 복원", de: "Pläne wiederherstellen", fr: "Restaurer vos plans", ru: "Восстановить планы" },
  plansRestored: { th: "กู้คืนแพลนสำเร็จ!", en: "Plans restored!", cn: "计划恢复成功!", ja: "プランを復元しました!", ko: "플랜이 복원되었습니다!", de: "Pläne wiederhergestellt!", fr: "Plans restaurés !", ru: "Планы восстановлены!" },
  havePlansRestore: { th: "มีแพลนอยู่แล้ว? กู้คืน", en: "Have existing plans? Restore", cn: "已有计划?恢复", ja: "既存のプランがある?復元", ko: "기존 플랜이 있나요? 복원", de: "Schon Pläne? Wiederherstellen", fr: "Plans existants ? Restaurer", ru: "Есть планы? Восстановить" },
  saveYourPlans: { th: "บันทึกแพลนถาวร", en: "Save your plans", cn: "永久保存计划", ja: "プランを保存", ko: "플랜 영구 저장", de: "Pläne dauerhaft speichern", fr: "Enregistrer vos plans", ru: "Сохранить планы" },
  wantToSaveNewPlans: { th: "ต้องการบันทึกแพลนใหม่?", en: "Want to save new plans?", cn: "想保存新计划?", ja: "新しいプランを保存しますか?", ko: "새 플랜을 저장하시겠어요?", de: "Neue Pläne speichern?", fr: "Enregistrer de nouveaux plans ?", ru: "Сохранить новые планы?" },
  linkYourEmail: { th: "เชื่อมอีเมลของคุณ", en: "Link Your Email", cn: "链接您的邮箱", ja: "メールを連携", ko: "이메일 연결", de: "E-Mail verknüpfen", fr: "Lier votre email", ru: "Привязать email" },
  linkEmailReason: { th: "เชื่อมอีเมลเพื่อเชิญเพื่อนร่วมทริป และกู้แพลนคืนได้ทุกเครื่อง", en: "Link your email to invite friends and recover your plan on any device", cn: "链接邮箱以邀请朋友并在任何设备上恢复计划", ja: "メールを連携して友達を招待し、どの端末からでもプランを復元", ko: "이메일을 연결하여 친구를 초대하고 모든 기기에서 플랜 복원", de: "E-Mail verknüpfen, um Freunde einzuladen und Pläne überall wiederherzustellen", fr: "Liez votre email pour inviter des amis et restaurer votre plan partout", ru: "Привяжите email, чтобы приглашать друзей и восстанавливать план на любых устройствах" },

  // === Members ===
  inviteMember: { th: "เชิญสมาชิก", en: "Invite Member", cn: "邀请成员", ja: "メンバーを招待", ko: "멤버 초대", de: "Mitglied einladen", fr: "Inviter un membre", ru: "Пригласить участника" },

  // === Channel sheet / Templates ===
  chooseChannel: { th: "เลือกช่องทางที่สะดวก", en: "Choose your preferred channel", cn: "选择您喜欢的渠道", ja: "ご希望のチャネルを選択", ko: "원하는 채널 선택", de: "Bevorzugten Kanal wählen", fr: "Choisissez votre canal", ru: "Выберите канал" },
  chooseTemplate: { th: "เลือก Template", en: "Choose Template", cn: "选择模板", ja: "テンプレートを選択", ko: "템플릿 선택", de: "Vorlage wählen", fr: "Choisir un modèle", ru: "Выбрать шаблон" },
  useTemplate: { th: "เลือกจาก Template", en: "Use Template", cn: "使用模板", ja: "テンプレートを使う", ko: "템플릿 사용", de: "Vorlage verwenden", fr: "Utiliser un modèle", ru: "Использовать шаблон" },
  templateLabel: { th: "Template", en: "Template", cn: "模板", ja: "テンプレート", ko: "템플릿", de: "Vorlage", fr: "Modèle", ru: "Шаблон" },

  // === Trip Included Block ===
  includedNotIncluded: { th: "รวม / ไม่รวม", en: "Included / Not Included", cn: "包含 / 不包含", ja: "含む / 含まない", ko: "포함 / 미포함", de: "Inklusive / Nicht inklusive", fr: "Inclus / Non inclus", ru: "Включено / Не включено" },
  whatsIncludedTitle: { th: "รวม / ไม่รวมอะไรบ้าง", en: "What's Included / Not Included", cn: "包含什么 / 不包含什么", ja: "含まれるもの / 含まれないもの", ko: "포함 사항 / 미포함 사항", de: "Was ist enthalten / nicht enthalten", fr: "Ce qui est inclus / non inclus", ru: "Что включено / не включено" },

  // === Article ===
  readArticle: { th: "อ่านบทความ →", en: "Read article →", cn: "阅读文章 →", ja: "記事を読む →", ko: "기사 읽기 →", de: "Artikel lesen →", fr: "Lire l'article →", ru: "Читать статью →" },

  // === Plan notifications (rendered from type + payload, server stores TH-only fallback) ===
  notifSoldOutTitle: { th: "ทริปเต็มแล้ว", en: "Trip sold out", cn: "行程已售罄", ja: "ツアー満員", ko: "투어 매진", de: "Tour ausgebucht", fr: "Voyage complet", ru: "Тур распродан" },
  notifSoldOutBody: { th: "ทริปที่คุณเลือกขายหมดแล้ว ติดต่อ SiamDive เพื่อหาวันใกล้เคียง", en: "Your selected trip has sold out — contact SiamDive for nearby dates", cn: "您选择的行程已售罄 — 请联系 SiamDive 寻找其他日期", ja: "選択されたツアーは満員です — 近い日程は SiamDive までお問い合わせください", ko: "선택하신 투어가 매진되었습니다 — 가까운 날짜는 SiamDive에 문의하세요", de: "Deine Tour ist ausgebucht — kontaktiere SiamDive für andere Daten", fr: "Votre voyage est complet — contactez SiamDive pour d'autres dates", ru: "Выбранный тур распродан — свяжитесь с SiamDive по другим датам" },
  notifLowSeatsTitle: { th: "ที่นั่งเหลือน้อย", en: "Seats running low", cn: "席位即将售罄", ja: "残席わずか", ko: "좌석 얼마 남지 않음", de: "Plätze fast voll", fr: "Places limitées", ru: "Мест осталось мало" },
  notifReminderTomorrowTitle: { th: "ทริปออกพรุ่งนี้!", en: "Trip departs tomorrow!", cn: "明天出发!", ja: "明日出発!", ko: "내일 출발!", de: "Tour startet morgen!", fr: "Départ demain !", ru: "Отправление завтра!" },
  notifReminderTomorrowBody: { th: "เช็คอุปกรณ์ ของฝาก เอกสารใบเซอร์ — ทริปออกพรุ่งนี้แล้ว", en: "Check your gear, packing list and certification card — trip departs tomorrow", cn: "检查装备、行李和潜水证 — 明天就出发了", ja: "装備、持ち物、ライセンスカードの確認を — ツアーは明日出発です", ko: "장비, 짐, 자격증 카드를 확인하세요 — 투어가 내일 출발합니다", de: "Ausrüstung, Gepäck und Tauchbrevet checken — Tour startet morgen", fr: "Vérifiez équipement, bagages et brevet — départ demain", ru: "Проверьте снаряжение, вещи и сертификат — поездка завтра" },
  notifNewBlogTitle: { th: "บทความใหม่ที่น่าสนใจ", en: "New article you might like", cn: "新文章推荐", ja: "新しい記事のおすすめ", ko: "새 기사 추천", de: "Neuer Artikel für dich", fr: "Nouvel article", ru: "Новая статья" },

  // === locale codes (kept for date helpers) ===
  localeBcp47: { th: "th-TH", en: "en-GB", cn: "zh-CN", ja: "ja-JP", ko: "ko-KR", de: "de-DE", fr: "fr-FR", ru: "ru-RU" },
  langCodeShort: { th: "th", en: "en", cn: "cn", ja: "ja", ko: "ko", de: "de", fr: "fr", ru: "ru" },
} as const satisfies Record<string, Entry>;

export type ArkLabelKey = keyof typeof DICT;

/**
 * Lookup a label for a given language. Falls back to English when the language
 * isn't supported or the key has no entry.
 */
export function t(lang: string | undefined | null, key: ArkLabelKey): string {
  const lng = normalizeArkLang(lang);
  const entry = DICT[key];
  return entry[lng] ?? entry.en ?? entry.th;
}

// === Templated helpers (interpolated strings can't live in a plain dict) ===

const DAY_TPL: Record<ArkLang, (n: number) => string> = {
  th: (n) => `วันที่ ${n}`,
  en: (n) => `Day ${n}`,
  cn: (n) => `第 ${n} 天`,
  ja: (n) => `${n}日目`,
  ko: (n) => `${n}일차`,
  de: (n) => `Tag ${n}`,
  fr: (n) => `Jour ${n}`,
  ru: (n) => `День ${n}`,
};
export const dayLabel = (lang: string | undefined, n: number) => DAY_TPL[normalizeArkLang(lang)](n);

const PLAN_NUM_TPL: Record<ArkLang, (n: number) => string> = {
  th: (n) => `แพลน ${n}`,
  en: (n) => `Plan ${n}`,
  cn: (n) => `计划 ${n}`,
  ja: (n) => `プラン ${n}`,
  ko: (n) => `플랜 ${n}`,
  de: (n) => `Plan ${n}`,
  fr: (n) => `Plan ${n}`,
  ru: (n) => `План ${n}`,
};
export const planNumberedLabel = (lang: string | undefined, n: number) => PLAN_NUM_TPL[normalizeArkLang(lang)](n);

const SCHEDULES_DAILY_TPL: Record<ArkLang, (n: number) => string> = {
  th: (n) => `กำหนดการรายวัน (${n} วัน)`,
  en: (n) => `Day-by-day itinerary (${n} days)`,
  cn: (n) => `每日行程 (${n} 天)`,
  ja: (n) => `日別の日程 (${n}日間)`,
  ko: (n) => `일별 일정 (${n}일)`,
  de: (n) => `Tagesprogramm (${n} Tage)`,
  fr: (n) => `Programme jour par jour (${n} jours)`,
  ru: (n) => `Программа по дням (${n} дн.)`,
};
export const schedulesDailyLabel = (lang: string | undefined, n: number) => SCHEDULES_DAILY_TPL[normalizeArkLang(lang)](n);

const SCHEDULES_STOPS_TPL: Record<ArkLang, (n: number) => string> = {
  th: (n) => `กำหนดการ (${n} ช่วง)`,
  en: (n) => `Schedule (${n} stops)`,
  cn: (n) => `行程 (${n} 站)`,
  ja: (n) => `日程 (${n}区間)`,
  ko: (n) => `일정 (${n} 구간)`,
  de: (n) => `Programm (${n} Etappen)`,
  fr: (n) => `Programme (${n} étapes)`,
  ru: (n) => `Программа (${n} участков)`,
};
export const schedulesStopsLabel = (lang: string | undefined, n: number) => SCHEDULES_STOPS_TPL[normalizeArkLang(lang)](n);

const COMPARE_PICKED_TPL: Record<ArkLang, (n: number) => string> = {
  th: (n) => `⚖️ เปรียบเทียบ ${n} ทริปที่เลือก`,
  en: (n) => `⚖️ Compare ${n} selected trips`,
  cn: (n) => `⚖️ 比较已选 ${n} 个行程`,
  ja: (n) => `⚖️ 選択した${n}ツアーを比較`,
  ko: (n) => `⚖️ 선택한 투어 ${n}개 비교`,
  de: (n) => `⚖️ ${n} ausgewählte Touren vergleichen`,
  fr: (n) => `⚖️ Comparer ${n} voyages sélectionnés`,
  ru: (n) => `⚖️ Сравнить ${n} выбранных туров`,
};
export const comparePickedLabel = (lang: string | undefined, n: number) => COMPARE_PICKED_TPL[normalizeArkLang(lang)](n);

const COMPARE_IN_PLAN_TPL: Record<ArkLang, (n: number) => string> = {
  th: (n) => `⚖️ เปรียบเทียบทริปในแพลน (${n})`,
  en: (n) => `⚖️ Compare trips in plan (${n})`,
  cn: (n) => `⚖️ 比较计划中的行程 (${n})`,
  ja: (n) => `⚖️ プラン内のツアーを比較 (${n})`,
  ko: (n) => `⚖️ 플랜의 투어 비교 (${n})`,
  de: (n) => `⚖️ Touren im Plan vergleichen (${n})`,
  fr: (n) => `⚖️ Comparer les voyages du plan (${n})`,
  ru: (n) => `⚖️ Сравнить туры плана (${n})`,
};
export const compareInPlanLabel = (lang: string | undefined, n: number) => COMPARE_IN_PLAN_TPL[normalizeArkLang(lang)](n);

const BUILD_MY_PLAN_WITH_COUNT_TPL: Record<ArkLang, (n: number) => string> = {
  th: (n) => `✨ สร้าง plan ของฉัน (${n} ทริป)`,
  en: (n) => `✨ Build my plan (${n} trips)`,
  cn: (n) => `✨ 构建我的计划 (${n} 个行程)`,
  ja: (n) => `✨ プランを作成 (${n}ツアー)`,
  ko: (n) => `✨ 내 플랜 만들기 (${n}개 투어)`,
  de: (n) => `✨ Meinen Plan erstellen (${n} Touren)`,
  fr: (n) => `✨ Créer mon plan (${n} voyages)`,
  ru: (n) => `✨ Создать мой план (${n} туров)`,
};
export const buildMyPlanWithCountLabel = (lang: string | undefined, n: number) => BUILD_MY_PLAN_WITH_COUNT_TPL[normalizeArkLang(lang)](n);

// Auto-greeting injected as a "user" turn when chat opens with pre-staged
// picks. The whole conversation is then seeded with this language, so the
// AI's first reply matches it. This is THE key signal driving response
// language — without per-lang strings here, JP/KO users get a TH/EN seed
// and the model responds in TH/EN no matter what the system prompt says.
const PICK_GREETING_TPL: Record<ArkLang, (labels: string) => string> = {
  th: (l) => `สนใจทริป ${l} ช่วยจัดการ Plan ให้หน่อยครับ`,
  en: (l) => `Interested in ${l} — help me shape this into a plan`,
  cn: (l) => `对 ${l} 感兴趣 — 帮我整理一个计划`,
  ja: (l) => `${l} に興味があります — プランを組み立てるのを手伝ってください`,
  ko: (l) => `${l}에 관심이 있어요 — 플랜을 짜도록 도와주세요`,
  de: (l) => `Interessiere mich für ${l} — hilf mir, daraus einen Plan zu machen`,
  fr: (l) => `Intéressé par ${l} — aide-moi à en faire un plan`,
  ru: (l) => `Меня интересует ${l} — помогите собрать план`,
};
export const pickGreetingMessage = (lang: string | undefined, labels: string) =>
  PICK_GREETING_TPL[normalizeArkLang(lang)](labels);

const PICK_DATE_LABEL_TPL: Record<ArkLang, (title: string, date: string) => string> = {
  th: (t, d) => `${t} วันที่ ${d}`,
  en: (t, d) => `${t} on ${d}`,
  cn: (t, d) => `${t} ${d}`,
  ja: (t, d) => `${t}(${d})`,
  ko: (t, d) => `${t} (${d})`,
  de: (t, d) => `${t} am ${d}`,
  fr: (t, d) => `${t} le ${d}`,
  ru: (t, d) => `${t} ${d}`,
};
export const pickDateLabel = (lang: string | undefined, title: string, date: string) =>
  PICK_DATE_LABEL_TPL[normalizeArkLang(lang)](title, date);

// Trip-type names emitted into the auto-message after a schedule pick. The
// AI uses these as the category cue (system prompt: "Skip the category
// $$ASK$$ when the message clearly names a category"). Keep the ALL-CAPS
// boatType label inside parentheses so the LLM can pattern-match regardless
// of language.
const TRIP_TYPE_LABEL_TPL: Record<ArkLang, Record<string, string>> = {
  th: { DAYTRIP: "Day Trip", SNORKELING: "Snorkeling", LIVEABOARD: "Liveaboard", DIVE_RESORT: "Dive Resort", FREEDIVE: "Freedive", LAND_TOUR: "Land Tour" },
  en: { DAYTRIP: "Day Trip", SNORKELING: "Snorkeling", LIVEABOARD: "Liveaboard", DIVE_RESORT: "Dive Resort", FREEDIVE: "Freedive", LAND_TOUR: "Land Tour" },
  cn: { DAYTRIP: "Day Trip", SNORKELING: "Snorkeling", LIVEABOARD: "Liveaboard", DIVE_RESORT: "Dive Resort", FREEDIVE: "Freedive", LAND_TOUR: "Land Tour" },
  ja: { DAYTRIP: "Day Trip", SNORKELING: "Snorkeling", LIVEABOARD: "Liveaboard", DIVE_RESORT: "Dive Resort", FREEDIVE: "Freedive", LAND_TOUR: "Land Tour" },
  ko: { DAYTRIP: "Day Trip", SNORKELING: "Snorkeling", LIVEABOARD: "Liveaboard", DIVE_RESORT: "Dive Resort", FREEDIVE: "Freedive", LAND_TOUR: "Land Tour" },
  de: { DAYTRIP: "Day Trip", SNORKELING: "Snorkeling", LIVEABOARD: "Liveaboard", DIVE_RESORT: "Dive Resort", FREEDIVE: "Freedive", LAND_TOUR: "Land Tour" },
  fr: { DAYTRIP: "Day Trip", SNORKELING: "Snorkeling", LIVEABOARD: "Liveaboard", DIVE_RESORT: "Dive Resort", FREEDIVE: "Freedive", LAND_TOUR: "Land Tour" },
  ru: { DAYTRIP: "Day Trip", SNORKELING: "Snorkeling", LIVEABOARD: "Liveaboard", DIVE_RESORT: "Dive Resort", FREEDIVE: "Freedive", LAND_TOUR: "Land Tour" },
};

const ADDED_TO_MYPLAN_TPL: Record<ArkLang, (boat: string, date: string, typeLabel: string) => string> = {
  th: (b, d, t) => `เพิ่ม ${b} ${t ? `(${t}, ${d})` : `(${d})`} เข้า MyPlan แล้ว — ใน plan ยังขาดข้อมูลอะไรอีกครับ?`,
  en: (b, d, t) => `Added ${b} ${t ? `(${t}, ${d})` : `(${d})`} to MyPlan — what else is missing in the plan?`,
  cn: (b, d, t) => `已将 ${b} ${t ? `(${t}, ${d})` : `(${d})`} 添加到 MyPlan — 计划中还缺少什么信息?`,
  ja: (b, d, t) => `${b} ${t ? `(${t}, ${d})` : `(${d})`} を MyPlan に追加しました — プランで他に必要な情報は何ですか?`,
  ko: (b, d, t) => `${b} ${t ? `(${t}, ${d})` : `(${d})`}을 MyPlan에 추가했습니다 — 플랜에 더 필요한 정보가 있나요?`,
  de: (b, d, t) => `${b} ${t ? `(${t}, ${d})` : `(${d})`} zum MyPlan hinzugefügt — was fehlt noch im Plan?`,
  fr: (b, d, t) => `${b} ${t ? `(${t}, ${d})` : `(${d})`} ajouté au MyPlan — qu'est-ce qui manque dans le plan ?`,
  ru: (b, d, t) => `${b} ${t ? `(${t}, ${d})` : `(${d})`} добавлено в MyPlan — чего ещё не хватает в плане?`,
};
export const addedToMyPlanMessage = (lang: string | undefined, boat: string, date: string, type?: string) => {
  const l = normalizeArkLang(lang);
  const typeLabel = type ? (TRIP_TYPE_LABEL_TPL[l][type] || "") : "";
  return ADDED_TO_MYPLAN_TPL[l](boat, date, typeLabel);
};

const NOTIF_LOW_SEATS_BODY_TPL: Record<ArkLang, (seats: number) => string> = {
  th: (n) => `เหลือเพียง ${n} ที่ — รีบ confirm ก่อนเต็ม`,
  en: (n) => `Only ${n} seats left — confirm before they're gone`,
  cn: (n) => `仅剩 ${n} 个席位 — 请尽快确认`,
  ja: (n) => `残り ${n} 席 — 満員になる前に確定を`,
  ko: (n) => `${n}석 남음 — 매진 전에 확정하세요`,
  de: (n) => `Nur noch ${n} Plätze — schnell bestätigen`,
  fr: (n) => `Plus que ${n} places — confirmez vite`,
  ru: (n) => `Осталось ${n} мест — подтвердите скорее`,
};
export const notifLowSeatsBody = (lang: string | undefined, seats: number) =>
  NOTIF_LOW_SEATS_BODY_TPL[normalizeArkLang(lang)](seats);

const NOTIF_REMINDER_DAYS_TITLE_TPL: Record<ArkLang, (days: number) => string> = {
  th: (d) => `เหลืออีก ${d} วันก่อนทริป`,
  en: (d) => `${d} days until your trip`,
  cn: (d) => `还有 ${d} 天就出发`,
  ja: (d) => `あと ${d} 日で出発`,
  ko: (d) => `출발까지 ${d}일 남음`,
  de: (d) => `Noch ${d} Tage bis zur Tour`,
  fr: (d) => `${d} jours avant le départ`,
  ru: (d) => `${d} дней до поездки`,
};
export const notifReminderDaysTitle = (lang: string | undefined, days: number) =>
  NOTIF_REMINDER_DAYS_TITLE_TPL[normalizeArkLang(lang)](days);

const NOTIF_REMINDER_DAYS_BODY_TPL: Record<ArkLang, (days: number) => string> = {
  th: (d) => `เริ่มแพ็คของได้แล้ว — ทริปออกอีก ${d} วัน`,
  en: (d) => `Time to start packing — trip departs in ${d} days`,
  cn: (d) => `可以开始打包了 — ${d} 天后出发`,
  ja: (d) => `荷造りを始めましょう — ${d}日後に出発`,
  ko: (d) => `짐을 챙길 시간 — ${d}일 후 출발`,
  de: (d) => `Zeit zu packen — Abreise in ${d} Tagen`,
  fr: (d) => `Il est temps de préparer vos affaires — départ dans ${d} jours`,
  ru: (d) => `Пора собирать вещи — отправление через ${d} дн.`,
};
export const notifReminderDaysBody = (lang: string | undefined, days: number) =>
  NOTIF_REMINDER_DAYS_BODY_TPL[normalizeArkLang(lang)](days);

// BCP-47 locale codes for Date.toLocaleDateString — used wherever we format a
// date for chat output so each language gets its native short format.
export function bcp47Locale(lang: string | undefined): string {
  switch (normalizeArkLang(lang)) {
    case "th": return "th-TH";
    case "en": return "en-GB";
    case "cn": return "zh-CN";
    case "ja": return "ja-JP";
    case "ko": return "ko-KR";
    case "de": return "de-DE";
    case "fr": return "fr-FR";
    case "ru": return "ru-RU";
  }
}

const CONNECTED_TPL: Record<ArkLang, (email: string) => string> = {
  th: (e) => `เชื่อมต่อกับ ${e} แล้ว`,
  en: (e) => `Connected to ${e}`,
  cn: (e) => `已连接到 ${e}`,
  ja: (e) => `${e} に接続済み`,
  ko: (e) => `${e}에 연결됨`,
  de: (e) => `Verbunden mit ${e}`,
  fr: (e) => `Connecté à ${e}`,
  ru: (e) => `Подключено к ${e}`,
};
export const connectedToLabel = (lang: string | undefined, email: string) => CONNECTED_TPL[normalizeArkLang(lang)](email);

/**
 * Format a date range "from – to" / "from → to". Thai uses an en-dash; other
 * languages use the right-arrow per the original v1 design.
 */
export function dateRangeLabel(lang: string | undefined, from: string, to: string): string {
  return normalizeArkLang(lang) === "th" ? `${from} – ${to}` : `${from} → ${to}`;
}

const PLAN_DELETE_PERMANENT_TPL: Record<ArkLang, (name: string) => string> = {
  th: (n) => `"${n}" จะถูกลบถาวร ไม่สามารถกู้คืนได้`,
  en: (n) => `"${n}" will be permanently deleted and cannot be recovered`,
  cn: (n) => `"${n}" 将被永久删除,无法恢复`,
  ja: (n) => `"${n}" は完全に削除され復元できません`,
  ko: (n) => `"${n}"은(는) 영구적으로 삭제되며 복구할 수 없습니다`,
  de: (n) => `"${n}" wird endgültig gelöscht und kann nicht wiederhergestellt werden`,
  fr: (n) => `"${n}" sera supprimé définitivement et ne pourra pas être récupéré`,
  ru: (n) => `"${n}" будет удалён навсегда и не подлежит восстановлению`,
};
export const planDeletePermanentLabel = (lang: string | undefined, name: string) =>
  PLAN_DELETE_PERMANENT_TPL[normalizeArkLang(lang)](name);

const PLAN_REUSED_EXISTING_TPL: Record<ArkLang, (n: string) => string> = {
  th: (n) => `ทริปนี้อยู่ใน "${n}" แล้ว`,
  en: (n) => `This trip is already in "${n}"`,
  cn: (n) => `此行程已在 "${n}" 中`,
  ja: (n) => `このツアーは既に "${n}" に含まれています`,
  ko: (n) => `이 투어는 이미 "${n}"에 있습니다`,
  de: (n) => `Diese Tour ist bereits in "${n}"`,
  fr: (n) => `Ce voyage est déjà dans "${n}"`,
  ru: (n) => `Этот тур уже есть в "${n}"`,
};
export const planReusedExistingLabel = (lang: string | undefined, name: string) =>
  PLAN_REUSED_EXISTING_TPL[normalizeArkLang(lang)](name);

const OPEN_PLAN_TPL: Record<ArkLang, string> = {
  th: "เปิด Plan",
  en: "Open Plan",
  cn: "打开计划",
  ja: "プランを開く",
  ko: "플랜 열기",
  de: "Plan öffnen",
  fr: "Ouvrir le plan",
  ru: "Открыть план",
};
export const openPlanLabel = (lang: string | undefined) =>
  OPEN_PLAN_TPL[normalizeArkLang(lang)];

const PLAN_RECENTLY_DELETED_TPL: Record<ArkLang, (n: string) => string> = {
  th: (n) => `คุณเพิ่งลบ "${n}" ไป ต้องการสร้างใหม่หรือไม่?`,
  en: (n) => `You just deleted "${n}" — create a new one anyway?`,
  cn: (n) => `您刚刚删除了 "${n}",仍要新建吗?`,
  ja: (n) => `先ほど "${n}" を削除しました。新しく作成しますか?`,
  ko: (n) => `방금 "${n}"을(를) 삭제했습니다. 새로 만드시겠습니까?`,
  de: (n) => `Du hast "${n}" gerade gelöscht — trotzdem neu erstellen?`,
  fr: (n) => `Vous venez de supprimer "${n}" — créer quand même un nouveau ?`,
  ru: (n) => `Вы только что удалили "${n}" — всё равно создать новый?`,
};
export const planRecentlyDeletedLabel = (lang: string | undefined, name: string) =>
  PLAN_RECENTLY_DELETED_TPL[normalizeArkLang(lang)](name);

const CREATE_NEW_TPL: Record<ArkLang, string> = {
  th: "สร้างใหม่",
  en: "Create new",
  cn: "新建",
  ja: "新規作成",
  ko: "새로 만들기",
  de: "Neu erstellen",
  fr: "Créer nouveau",
  ru: "Создать новый",
};
export const createNewLabel = (lang: string | undefined) =>
  CREATE_NEW_TPL[normalizeArkLang(lang)];

// Static assistant confirmation for the chat-opened-with-pending-picks flow.
// Template — the picked $$TRIP$$ marker(s) get inserted before the closing
// question. Skipping the LLM round-trip avoids the "we don't have this trip
// on the website" hallucination users hit when the AI didn't recognize the
// boat name they just clicked + on.
const PICK_CONFIRM_INTRO_TPL: Record<ArkLang, string> = {
  th: "เห็นคุณเลือกทริปนี้แล้ว ผมจะช่วยจัด plan รอบทริปนี้ให้ครับ",
  en: "Got it — I'll build a plan around this trip.",
  cn: "好的 — 我来为这个行程制定计划。",
  ja: "承知しました — このツアーを中心にプランを組み立てます。",
  ko: "알겠습니다 — 이 투어를 중심으로 플랜을 만들어드릴게요.",
  de: "Verstanden — ich baue einen Plan rund um diese Tour.",
  fr: "Compris — je prépare un plan autour de ce voyage.",
  ru: "Понял — составлю план вокруг этой поездки.",
};
const PICK_CONFIRM_HEADCOUNT_TPL: Record<ArkLang, string> = {
  th: "ไปกี่คนครับ?",
  en: "How many people?",
  cn: "几位出行?",
  ja: "何名で行かれますか?",
  ko: "몇 분이 가시나요?",
  de: "Mit wie vielen Personen?",
  fr: "Combien de personnes ?",
  ru: "Сколько человек?",
};
export const pickConfirmIntro = (lang: string | undefined) =>
  PICK_CONFIRM_INTRO_TPL[normalizeArkLang(lang)];
export const pickConfirmHeadcountAsk = (lang: string | undefined) =>
  PICK_CONFIRM_HEADCOUNT_TPL[normalizeArkLang(lang)];
