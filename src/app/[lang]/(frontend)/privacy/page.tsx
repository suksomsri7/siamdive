import type { Metadata } from "next";

const VALID_LANGS = ["en", "th", "cn", "ja", "ko", "de", "fr", "ru"];

const T: Record<string, Record<string, string>> = {
  title: {
    en: "Privacy Policy", th: "นโยบายความเป็นส่วนตัว", cn: "隐私政策",
    ja: "プライバシーポリシー", ko: "개인정보 처리방침", de: "Datenschutzrichtlinie",
    fr: "Politique de confidentialité", ru: "Политика конфиденциальности",
  },
  meta: {
    en: "SIAMDIVE privacy policy — how we collect, use, and protect your data.",
    th: "นโยบายความเป็นส่วนตัวของ SIAMDIVE — การเก็บ ใช้ และปกป้องข้อมูลของคุณ",
    cn: "SIAMDIVE隐私政策——我们如何收集、使用和保护您的数据。",
    ja: "SIAMDIVEプライバシーポリシー — データの収集、使用、保護について。",
    ko: "SIAMDIVE 개인정보 처리방침 — 데이터 수집, 사용 및 보호 방법.",
    de: "SIAMDIVE-Datenschutzrichtlinie — wie wir Ihre Daten erfassen, verwenden und schützen.",
    fr: "Politique de confidentialité SIAMDIVE — comment nous collectons, utilisons et protégeons vos données.",
    ru: "Политика конфиденциальности SIAMDIVE — как мы собираем, используем и защищаем ваши данные.",
  },
};

const CONTENT: Record<string, { heading: string; body: string }[]> = {
  en: [
    { heading: "Information We Collect", body: "We collect anonymous usage data through Google Analytics (page views, device type, approximate location) and our internal analytics system (trip views, search queries). We do not collect personal information unless you voluntarily provide it through our contact channels (Line, WhatsApp, Messenger)." },
    { heading: "How We Use Your Data", body: "Usage data helps us improve our website, understand which dive trips are most popular, and deliver a better experience. We do not sell, rent, or share your personal data with third parties for marketing purposes." },
    { heading: "Cookies", body: "We use essential cookies for website functionality and analytics cookies (Google Analytics) to understand site usage. You can disable cookies in your browser settings at any time." },
    { heading: "Third-Party Services", body: "Our website uses Google Analytics for traffic analysis, Bunny CDN for media delivery, and Vercel for hosting. Each service has its own privacy policy governing data they process." },
    { heading: "Data Retention", body: "Anonymous analytics data is retained for up to 14 months. Contact information provided through messaging platforms is subject to those platforms' privacy policies." },
    { heading: "Your Rights", body: "You may request access to, correction of, or deletion of any personal data we hold about you by contacting us through any of our contact channels." },
    { heading: "Ark AI Trip Advisor", body: "Our chat assistant (\"Ark AI\") sends your messages to a third-party large-language-model provider (Anthropic, OpenAI, OpenRouter, or Google, depending on configuration) to generate responses. We retain a 1-hour cached behavior profile (anonymous device-level browsing pattern: viewed boats, areas, certifications) to give better recommendations, plus a 90-day token-usage log (no message content) to monitor cost. We do not store your full chat transcripts on our servers beyond what your browser keeps in session storage. Medical questions are intercepted server-side and never sent to the AI; they receive a static doctor-referral response instead." },
    { heading: "Mobile App (SiamDive)", body: "Our SiamDive mobile app stores a device identifier and, if you sign in, your email address and display name, so the maps you build and your in-game coins follow you across devices. Maps you create, your coin balance, and gameplay progress are saved to our servers (Supabase). Photos or videos you capture during the dive tour are saved only to your device's photo library, and only with your permission. The app uses your device's motion sensors for the tilt / holographic map view and the camera for the optional AR mode — neither the camera feed nor sensor data is recorded or uploaded. Map content is cached on your device so it can be opened offline. We do not sell or share this data for marketing." },
    { heading: "Contact", body: "For privacy-related inquiries, reach us via Line (@siamdive), WhatsApp (+66 98 376 8135), or email." },
  ],
  th: [
    { heading: "ข้อมูลที่เราเก็บรวบรวม", body: "เราเก็บข้อมูลการใช้งานแบบไม่ระบุตัวตนผ่าน Google Analytics (การเข้าชมหน้า, ประเภทอุปกรณ์, ตำแหน่งโดยประมาณ) และระบบวิเคราะห์ภายในของเรา (การดูทริป, การค้นหา) เราไม่เก็บข้อมูลส่วนบุคคล เว้นแต่คุณจะให้ข้อมูลด้วยตนเองผ่านช่องทางติดต่อของเรา (Line, WhatsApp, Messenger)" },
    { heading: "การใช้ข้อมูลของคุณ", body: "ข้อมูลการใช้งานช่วยให้เราปรับปรุงเว็บไซต์ เข้าใจว่าทริปดำน้ำใดได้รับความนิยมมากที่สุด และมอบประสบการณ์ที่ดีขึ้น เราไม่ขาย ไม่ให้เช่า และไม่แบ่งปันข้อมูลส่วนบุคคลของคุณกับบุคคลที่สามเพื่อวัตถุประสงค์ทางการตลาด" },
    { heading: "คุกกี้", body: "เราใช้คุกกี้ที่จำเป็นสำหรับการทำงานของเว็บไซต์ และคุกกี้วิเคราะห์ (Google Analytics) เพื่อทำความเข้าใจการใช้งานเว็บไซต์ คุณสามารถปิดคุกกี้ในการตั้งค่าเบราว์เซอร์ได้ตลอดเวลา" },
    { heading: "บริการของบุคคลที่สาม", body: "เว็บไซต์ของเราใช้ Google Analytics สำหรับวิเคราะห์การเข้าชม, Bunny CDN สำหรับส่งมอบสื่อ และ Vercel สำหรับโฮสติ้ง แต่ละบริการมีนโยบายความเป็นส่วนตัวของตนเอง" },
    { heading: "การเก็บรักษาข้อมูล", body: "ข้อมูลวิเคราะห์แบบไม่ระบุตัวตนจะถูกเก็บรักษาไว้สูงสุด 14 เดือน ข้อมูลการติดต่อที่ให้ผ่านแพลตฟอร์มส่งข้อความอยู่ภายใต้นโยบายความเป็นส่วนตัวของแพลตฟอร์มนั้นๆ" },
    { heading: "สิทธิ์ของคุณ", body: "คุณสามารถขอเข้าถึง แก้ไข หรือลบข้อมูลส่วนบุคคลใดๆ ที่เราเก็บเกี่ยวกับคุณ โดยติดต่อเราผ่านช่องทางติดต่อใดก็ได้" },
    { heading: "Ark AI ผู้ช่วยวางแผนทริป", body: "ผู้ช่วยแชท (\"Ark AI\") จะส่งข้อความของคุณไปยังผู้ให้บริการ AI ภายนอก (Anthropic, OpenAI, OpenRouter หรือ Google ขึ้นอยู่กับการตั้งค่า) เพื่อสร้างคำตอบ เราเก็บโปรไฟล์พฤติกรรมแบบไม่ระบุตัวตน (ทริปที่คุณดู, พื้นที่, cert) ที่ระดับอุปกรณ์ในแคช 1 ชั่วโมง เพื่อแนะนำได้แม่นยำขึ้น พร้อมบันทึกการใช้ token 90 วัน (ไม่เก็บเนื้อหาข้อความ) เพื่อควบคุมต้นทุน เราไม่เก็บ chat transcript บนเซิร์ฟเวอร์ของเรา (เก็บเฉพาะใน sessionStorage ของเบราว์เซอร์คุณ) คำถามด้านการแพทย์จะถูกดักจับฝั่งเซิร์ฟเวอร์และไม่ส่งให้ AI — เราตอบกลับด้วยข้อความแนะนำให้ปรึกษาแพทย์เท่านั้น" },
    { heading: "แอปมือถือ (SiamDive)", body: "แอป SiamDive เก็บรหัสอุปกรณ์ (device identifier) และหากคุณเข้าสู่ระบบ จะเก็บอีเมลและชื่อที่แสดง เพื่อให้แมพที่คุณสร้างและเหรียญในเกมติดตามข้ามอุปกรณ์ได้ แมพที่คุณสร้าง ยอดเหรียญ และความคืบหน้าในเกมจะถูกบันทึกบนเซิร์ฟเวอร์ของเรา (Supabase) ภาพถ่ายหรือวิดีโอที่คุณถ่ายระหว่างทัวร์ดำน้ำจะถูกบันทึกไว้เฉพาะในคลังภาพของเครื่องคุณ และต่อเมื่อคุณอนุญาตเท่านั้น แอปใช้เซ็นเซอร์การเคลื่อนไหวสำหรับมุมมองแมพแบบเอียง/โฮโลแกรม และใช้กล้องสำหรับโหมด AR (ตัวเลือก) โดยทั้งภาพจากกล้องและข้อมูลเซ็นเซอร์ไม่ถูกบันทึกหรืออัปโหลด ข้อมูลแมพถูกแคชไว้ในเครื่องเพื่อเปิดแบบออฟไลน์ได้ เราไม่ขายหรือแบ่งปันข้อมูลนี้เพื่อการตลาด" },
    { heading: "ติดต่อ", body: "สำหรับคำถามเกี่ยวกับความเป็นส่วนตัว ติดต่อเราผ่าน Line (@siamdive), WhatsApp (+66 98 376 8135) หรืออีเมล" },
  ],
  cn: [
    { heading: "我们收集的信息", body: "我们通过 Google Analytics（页面浏览量、设备类型、大致位置）和内部分析系统（行程浏览、搜索查询）收集匿名使用数据。除非您通过我们的联系渠道（Line、WhatsApp、Messenger）自愿提供，否则我们不会收集个人信息。" },
    { heading: "我们如何使用您的数据", body: "使用数据帮助我们改进网站、了解哪些潜水行程最受欢迎，并提供更好的体验。我们不会出于营销目的向第三方出售、出租或分享您的个人数据。" },
    { heading: "Cookies", body: "我们使用必要的 Cookie 来实现网站功能，以及分析 Cookie（Google Analytics）来了解网站使用情况。您可以随时在浏览器设置中禁用 Cookie。" },
    { heading: "第三方服务", body: "我们的网站使用 Google Analytics 进行流量分析、Bunny CDN 进行媒体交付、Vercel 进行托管。每项服务都有其自己的隐私政策。" },
    { heading: "数据保留", body: "匿名分析数据最多保留 14 个月。通过消息平台提供的联系信息受该平台隐私政策的约束。" },
    { heading: "您的权利", body: "您可以通过我们的任何联系渠道请求访问、更正或删除我们持有的关于您的任何个人数据。" },
    { heading: "Ark AI 旅行顾问", body: "我们的聊天助手（\"Ark AI\"）会将您的消息发送给第三方大语言模型提供商（Anthropic、OpenAI、OpenRouter 或 Google）以生成回复。我们保留 1 小时的匿名行为缓存（设备级别的浏览模式：查看的船只、地区、证书）以提供更好的推荐，以及 90 天的 token 使用日志（不含消息内容）以监控成本。我们不在服务器上存储完整的聊天记录（仅存储在您浏览器的会话存储中）。医疗相关问题会在服务器端拦截，不会发送给 AI——它们会收到静态的医生转诊回复。" },
    { heading: "移动应用 (SiamDive)", body: "SiamDive 移动应用会存储设备标识符；如果您登录，还会存储您的电子邮件和显示名称，以便您创建的地图和游戏内金币在不同设备间同步。您创建的地图、金币余额和游戏进度会保存在我们的服务器 (Supabase) 上。您在潜水游览中拍摄的照片或视频仅在您授权后保存到您设备的相册中。应用使用设备的运动传感器实现倾斜/全息地图视图，并使用摄像头实现可选的 AR 模式——摄像头画面和传感器数据均不会被记录或上传。地图内容会缓存在您的设备上以便离线打开。我们不会出于营销目的出售或分享这些数据。" },
    { heading: "联系方式", body: "如有隐私相关问题，请通过 Line (@siamdive)、WhatsApp (+66 98 376 8135) 或电子邮件与我们联系。" },
  ],
  ja: [
    { heading: "収集する情報", body: "Google Analytics（ページビュー、デバイスタイプ、おおよその位置情報）および内部分析システム（トリップ閲覧、検索クエリ）を通じて匿名の使用データを収集しています。お客様が連絡チャネル（Line、WhatsApp、Messenger）を通じて自発的に提供しない限り、個人情報は収集しません。" },
    { heading: "データの使用方法", body: "使用データは、ウェブサイトの改善、人気のダイブトリップの把握、より良い体験の提供に役立てています。マーケティング目的で個人データを第三者に販売、貸与、共有することはありません。" },
    { heading: "Cookie", body: "ウェブサイトの機能に必要な Cookie と、サイト利用状況を把握するための分析 Cookie（Google Analytics）を使用しています。ブラウザの設定でいつでも Cookie を無効にできます。" },
    { heading: "第三者サービス", body: "当ウェブサイトは、トラフィック分析に Google Analytics、メディア配信に Bunny CDN、ホスティングに Vercel を使用しています。各サービスには独自のプライバシーポリシーがあります。" },
    { heading: "データ保持", body: "匿名の分析データは最長14ヶ月間保持されます。メッセージングプラットフォームを通じて提供された連絡先情報は、各プラットフォームのプライバシーポリシーに準じます。" },
    { heading: "お客様の権利", body: "当社が保有するお客様の個人データへのアクセス、訂正、削除を、いずれかの連絡チャネルを通じてリクエストできます。" },
    { heading: "Ark AI トリップアドバイザー", body: "チャットアシスタント（\"Ark AI\"）は、お客様のメッセージをサードパーティの大規模言語モデルプロバイダー（Anthropic、OpenAI、OpenRouter、または Google）に送信して応答を生成します。より良い推奨を提供するため、デバイスレベルの匿名行動プロファイル（閲覧したトリップ、エリア、資格情報）を 1 時間キャッシュし、コスト監視のため 90 日間のトークン使用ログ（メッセージ内容は含みません）を保持します。完全なチャット履歴をサーバーには保存しません（お使いのブラウザのセッションストレージにのみ保存）。医療関連の質問はサーバー側でインターセプトされ、AI には送信されません。代わりに、静的な医師紹介の応答を返します。" },
    { heading: "モバイルアプリ (SiamDive)", body: "SiamDiveモバイルアプリはデバイス識別子を保存し、サインインした場合はメールアドレスと表示名も保存して、作成したマップとゲーム内コインを複数のデバイス間で同期します。作成したマップ、コイン残高、ゲームの進行状況は当社のサーバー (Supabase) に保存されます。ダイブツアー中に撮影した写真や動画は、許可された場合にのみお使いのデバイスのフォトライブラリにのみ保存されます。アプリはチルト/ホログラフィックマップ表示にデバイスのモーションセンサーを、オプションのARモードにカメラを使用します。カメラ映像もセンサーデータも記録・アップロードされません。マップコンテンツはオフラインで開けるようにデバイスにキャッシュされます。当社はこのデータをマーケティング目的で販売・共有することはありません。" },
    { heading: "お問い合わせ", body: "プライバシーに関するお問い合わせは、Line (@siamdive)、WhatsApp (+66 98 376 8135)、またはメールにてご連絡ください。" },
  ],
  ko: [
    { heading: "수집하는 정보", body: "Google Analytics(페이지 조회수, 기기 유형, 대략적 위치)와 내부 분석 시스템(트립 조회, 검색 쿼리)을 통해 익명 사용 데이터를 수집합니다. 연락 채널(Line, WhatsApp, Messenger)을 통해 자발적으로 제공하지 않는 한 개인 정보를 수집하지 않습니다." },
    { heading: "데이터 사용 방법", body: "사용 데이터는 웹사이트 개선, 인기 다이빙 트립 파악, 더 나은 경험 제공에 도움이 됩니다. 마케팅 목적으로 개인 데이터를 제3자에게 판매, 임대 또는 공유하지 않습니다." },
    { heading: "쿠키", body: "웹사이트 기능에 필수적인 쿠키와 사이트 사용을 이해하기 위한 분석 쿠키(Google Analytics)를 사용합니다. 브라우저 설정에서 언제든지 쿠키를 비활성화할 수 있습니다." },
    { heading: "제3자 서비스", body: "웹사이트는 트래픽 분석에 Google Analytics, 미디어 전송에 Bunny CDN, 호스팅에 Vercel을 사용합니다. 각 서비스에는 자체 개인정보 처리방침이 있습니다." },
    { heading: "데이터 보관", body: "익명 분석 데이터는 최대 14개월간 보관됩니다. 메시징 플랫폼을 통해 제공된 연락처 정보는 해당 플랫폼의 개인정보 처리방침에 따릅니다." },
    { heading: "귀하의 권리", body: "저희가 보유한 귀하의 개인 데이터에 대한 접근, 수정 또는 삭제를 모든 연락 채널을 통해 요청할 수 있습니다." },
    { heading: "Ark AI 트립 어드바이저", body: "채팅 어시스턴트(\"Ark AI\")는 응답을 생성하기 위해 메시지를 제3자 대규모 언어 모델 제공업체(Anthropic, OpenAI, OpenRouter 또는 Google)에 전송합니다. 더 나은 추천을 위해 기기 수준의 익명 행동 프로필(조회한 트립, 지역, 자격증)을 1시간 캐시하고, 비용 모니터링을 위해 90일간의 토큰 사용 로그(메시지 내용 미포함)를 보관합니다. 전체 채팅 기록은 서버에 저장하지 않습니다(브라우저 세션 저장소에만 저장). 의료 관련 질문은 서버 측에서 차단되며 AI에 전송되지 않습니다. 대신 정적 의사 안내 응답이 반환됩니다." },
    { heading: "모바일 앱 (SiamDive)", body: "SiamDive 모바일 앱은 기기 식별자를 저장하며, 로그인하는 경우 이메일과 표시 이름도 저장하여 사용자가 만든 지도와 게임 내 코인이 여러 기기에서 동기화되도록 합니다. 만든 지도, 코인 잔액, 게임 진행 상황은 당사 서버 (Supabase)에 저장됩니다. 다이브 투어 중 촬영한 사진이나 동영상은 사용자가 허용한 경우에만 기기의 사진 보관함에만 저장됩니다. 앱은 기울기/홀로그램 지도 보기를 위해 기기의 모션 센서를, 선택적 AR 모드를 위해 카메라를 사용하며, 카메라 영상과 센서 데이터 모두 기록되거나 업로드되지 않습니다. 지도 콘텐츠는 오프라인에서 열 수 있도록 기기에 캐시됩니다. 당사는 이 데이터를 마케팅 목적으로 판매하거나 공유하지 않습니다." },
    { heading: "연락처", body: "개인정보 관련 문의는 Line (@siamdive), WhatsApp (+66 98 376 8135) 또는 이메일로 연락해 주세요." },
  ],
  de: [
    { heading: "Informationen, die wir erheben", body: "Wir erheben anonyme Nutzungsdaten über Google Analytics (Seitenaufrufe, Gerätetyp, ungefährer Standort) und unser internes Analysesystem (Trip-Aufrufe, Suchanfragen). Wir erheben keine personenbezogenen Daten, es sei denn, Sie stellen sie freiwillig über unsere Kontaktkanäle (Line, WhatsApp, Messenger) zur Verfügung." },
    { heading: "Wie wir Ihre Daten verwenden", body: "Nutzungsdaten helfen uns, unsere Website zu verbessern, zu verstehen, welche Tauchtrips am beliebtesten sind, und ein besseres Erlebnis zu bieten. Wir verkaufen, vermieten oder teilen Ihre persönlichen Daten nicht zu Marketingzwecken mit Dritten." },
    { heading: "Cookies", body: "Wir verwenden wesentliche Cookies für die Website-Funktionalität und Analyse-Cookies (Google Analytics), um die Website-Nutzung zu verstehen. Sie können Cookies jederzeit in Ihren Browser-Einstellungen deaktivieren." },
    { heading: "Drittanbieter-Dienste", body: "Unsere Website nutzt Google Analytics für die Verkehrsanalyse, Bunny CDN für die Medienbereitstellung und Vercel für das Hosting. Jeder Dienst hat seine eigene Datenschutzrichtlinie." },
    { heading: "Datenaufbewahrung", body: "Anonyme Analysedaten werden bis zu 14 Monate aufbewahrt. Kontaktinformationen, die über Messaging-Plattformen bereitgestellt werden, unterliegen den Datenschutzrichtlinien dieser Plattformen." },
    { heading: "Ihre Rechte", body: "Sie können den Zugang zu, die Berichtigung oder die Löschung aller personenbezogenen Daten, die wir über Sie gespeichert haben, über jeden unserer Kontaktkanäle beantragen." },
    { heading: "Ark AI Reiseberater", body: "Unser Chat-Assistent (\"Ark AI\") sendet Ihre Nachrichten an einen Drittanbieter eines großen Sprachmodells (Anthropic, OpenAI, OpenRouter oder Google), um Antworten zu generieren. Wir speichern ein anonymes Verhaltensprofil auf Geräteebene (angesehene Trips, Gebiete, Zertifikate) für 1 Stunde im Cache, um bessere Empfehlungen zu geben, sowie ein 90-tägiges Token-Nutzungsprotokoll (ohne Nachrichteninhalt) zur Kostenüberwachung. Wir speichern keine vollständigen Chat-Transkripte auf unseren Servern (nur im Session-Storage Ihres Browsers). Medizinische Fragen werden serverseitig abgefangen und nie an die KI gesendet — sie erhalten stattdessen eine statische Arzt-Verweisantwort." },
    { heading: "Mobile App (SiamDive)", body: "Unsere SiamDive-App speichert eine Gerätekennung und, wenn Sie sich anmelden, Ihre E-Mail-Adresse und Ihren Anzeigenamen, damit die von Ihnen erstellten Karten und Ihre In-Game-Münzen geräteübergreifend erhalten bleiben. Von Ihnen erstellte Karten, Ihr Münzguthaben und Ihr Spielfortschritt werden auf unseren Servern (Supabase) gespeichert. Während der Tauchtour aufgenommene Fotos oder Videos werden nur mit Ihrer Erlaubnis und ausschließlich in der Fotomediathek Ihres Geräts gespeichert. Die App nutzt die Bewegungssensoren Ihres Geräts für die Neige-/Holografie-Kartenansicht und die Kamera für den optionalen AR-Modus — weder Kamerabild noch Sensordaten werden aufgezeichnet oder hochgeladen. Karteninhalte werden auf Ihrem Gerät zwischengespeichert, um sie offline öffnen zu können. Wir verkaufen oder teilen diese Daten nicht zu Marketingzwecken." },
    { heading: "Kontakt", body: "Für datenschutzbezogene Anfragen erreichen Sie uns über Line (@siamdive), WhatsApp (+66 98 376 8135) oder E-Mail." },
  ],
  fr: [
    { heading: "Informations collectées", body: "Nous collectons des données d'utilisation anonymes via Google Analytics (pages vues, type d'appareil, localisation approximative) et notre système d'analyse interne (vues de voyages, requêtes de recherche). Nous ne collectons pas d'informations personnelles sauf si vous les fournissez volontairement via nos canaux de contact (Line, WhatsApp, Messenger)." },
    { heading: "Utilisation de vos données", body: "Les données d'utilisation nous aident à améliorer notre site web, à comprendre quels voyages de plongée sont les plus populaires et à offrir une meilleure expérience. Nous ne vendons, ne louons ni ne partageons vos données personnelles avec des tiers à des fins marketing." },
    { heading: "Cookies", body: "Nous utilisons des cookies essentiels pour le fonctionnement du site et des cookies analytiques (Google Analytics) pour comprendre l'utilisation du site. Vous pouvez désactiver les cookies dans les paramètres de votre navigateur à tout moment." },
    { heading: "Services tiers", body: "Notre site utilise Google Analytics pour l'analyse du trafic, Bunny CDN pour la livraison des médias et Vercel pour l'hébergement. Chaque service a sa propre politique de confidentialité." },
    { heading: "Conservation des données", body: "Les données analytiques anonymes sont conservées jusqu'à 14 mois. Les informations de contact fournies via les plateformes de messagerie sont soumises aux politiques de confidentialité de ces plateformes." },
    { heading: "Vos droits", body: "Vous pouvez demander l'accès, la correction ou la suppression de toute donnée personnelle que nous détenons à votre sujet en nous contactant via l'un de nos canaux de contact." },
    { heading: "Conseiller voyage Ark AI", body: "Notre assistant de chat (\"Ark AI\") envoie vos messages à un fournisseur tiers de grand modèle de langage (Anthropic, OpenAI, OpenRouter ou Google) pour générer des réponses. Nous conservons un profil comportemental anonyme au niveau de l'appareil (trips consultés, zones, certifications) pendant 1 heure en cache pour de meilleures recommandations, ainsi qu'un journal d'utilisation des tokens de 90 jours (sans contenu des messages) pour surveiller les coûts. Nous ne stockons pas les transcriptions complètes du chat sur nos serveurs (uniquement dans le stockage de session de votre navigateur). Les questions médicales sont interceptées côté serveur et ne sont jamais envoyées à l'IA — elles reçoivent une réponse statique de référence à un médecin." },
    { heading: "Application mobile (SiamDive)", body: "Notre application SiamDive stocke un identifiant d'appareil et, si vous vous connectez, votre adresse e-mail et votre nom d'affichage, afin que les cartes que vous créez et vos pièces de jeu vous suivent d'un appareil à l'autre. Les cartes que vous créez, votre solde de pièces et votre progression sont enregistrés sur nos serveurs (Supabase). Les photos ou vidéos que vous capturez pendant la visite de plongée sont enregistrées uniquement dans la photothèque de votre appareil, et seulement avec votre autorisation. L'application utilise les capteurs de mouvement de votre appareil pour la vue de carte inclinée/holographique et la caméra pour le mode AR optionnel — ni le flux de la caméra ni les données des capteurs ne sont enregistrés ou téléversés. Le contenu des cartes est mis en cache sur votre appareil pour un accès hors ligne. Nous ne vendons ni ne partageons ces données à des fins marketing." },
    { heading: "Contact", body: "Pour toute question relative à la confidentialité, contactez-nous via Line (@siamdive), WhatsApp (+66 98 376 8135) ou par e-mail." },
  ],
  ru: [
    { heading: "Собираемая информация", body: "Мы собираем анонимные данные об использовании через Google Analytics (просмотры страниц, тип устройства, приблизительное местоположение) и нашу внутреннюю систему аналитики (просмотры туров, поисковые запросы). Мы не собираем личную информацию, если вы не предоставите её добровольно через наши каналы связи (Line, WhatsApp, Messenger)." },
    { heading: "Как мы используем ваши данные", body: "Данные об использовании помогают нам улучшать наш сайт, понимать, какие дайв-туры наиболее популярны, и предоставлять лучший опыт. Мы не продаём, не сдаём в аренду и не передаём ваши личные данные третьим лицам в маркетинговых целях." },
    { heading: "Файлы cookie", body: "Мы используем необходимые файлы cookie для функционирования сайта и аналитические cookie (Google Analytics) для понимания использования сайта. Вы можете отключить cookie в настройках браузера в любое время." },
    { heading: "Сторонние сервисы", body: "Наш сайт использует Google Analytics для анализа трафика, Bunny CDN для доставки медиа и Vercel для хостинга. Каждый сервис имеет собственную политику конфиденциальности." },
    { heading: "Хранение данных", body: "Анонимные аналитические данные хранятся до 14 месяцев. Контактная информация, предоставленная через платформы обмена сообщениями, регулируется политиками конфиденциальности этих платформ." },
    { heading: "Ваши права", body: "Вы можете запросить доступ, исправление или удаление любых персональных данных, которые мы храним о вас, связавшись с нами через любой из наших каналов связи." },
    { heading: "Ark AI Туристический консультант", body: "Наш чат-помощник (\"Ark AI\") отправляет ваши сообщения сторонним провайдерам больших языковых моделей (Anthropic, OpenAI, OpenRouter или Google) для генерации ответов. Мы храним анонимный профиль поведения на уровне устройства (просмотренные трипы, регионы, сертификаты) в кеше в течение 1 часа для улучшения рекомендаций, а также 90-дневный журнал использования токенов (без содержимого сообщений) для мониторинга затрат. Мы не храним полные транскрипты чата на наших серверах (только в хранилище сессии вашего браузера). Медицинские вопросы перехватываются на стороне сервера и никогда не отправляются ИИ — вместо этого предоставляется статический ответ с направлением к врачу." },
    { heading: "Мобильное приложение (SiamDive)", body: "Приложение SiamDive хранит идентификатор устройства, а если вы вошли в систему — вашу электронную почту и отображаемое имя, чтобы созданные вами карты и игровые монеты синхронизировались между устройствами. Созданные вами карты, баланс монет и игровой прогресс сохраняются на наших серверах (Supabase). Фотографии или видео, снятые во время дайв-тура, сохраняются только в фотогалерее вашего устройства и только с вашего разрешения. Приложение использует датчики движения устройства для наклонного/голографического просмотра карты и камеру для опционального режима AR — ни изображение с камеры, ни данные датчиков не записываются и не загружаются. Содержимое карт кэшируется на вашем устройстве для офлайн-доступа. Мы не продаём и не передаём эти данные в маркетинговых целях." },
    { heading: "Контакт", body: "По вопросам конфиденциальности свяжитесь с нами через Line (@siamdive), WhatsApp (+66 98 376 8135) или электронную почту." },
  ],
};

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const l = VALID_LANGS.includes(lang) ? lang : "en";
  return { title: T.title[l], description: T.meta[l] };
}

export default async function PrivacyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const l = VALID_LANGS.includes(lang) ? lang : "en";
  const sections = CONTENT[l] || CONTENT["en"];

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "80px 24px 60px" }}>
      <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 900, marginBottom: 8, color: "#fff" }}>
        {T.title[l]}
      </h1>
      <p style={{ color: "#444", fontSize: 13, marginBottom: 32 }}>Last updated: May 2026</p>
      {sections.map((s, i) => (
        <section key={i} style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: "#e5e5e5" }}>{s.heading}</h2>
          <p style={{ color: "#999", fontSize: 15, lineHeight: 1.8 }}>{s.body}</p>
        </section>
      ))}
    </main>
  );
}
