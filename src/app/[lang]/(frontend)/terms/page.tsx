import type { Metadata } from "next";

const VALID_LANGS = ["en", "th", "cn", "ja", "ko", "de", "fr", "ru"];

// 🔴 17 ก.ย. 2026 — จุดยืนของกิจการ: SIAMDIVE เป็น "แหล่งข้อมูล + ผู้ช่วยประสานงาน"
//    ช่วยติดต่อ ช่วยจอง ช่วยเตรียมเอกสารให้ได้ · แต่ **ลูกค้าชำระเงินตรงกับเรือ/ผู้ประกอบการเอง**
//    เราไม่รับเงิน ไม่ถือเงิน ไม่ส่งต่อเงิน ไม่คืนเงิน ไม่เก็บค่าธรรมเนียม/ค่าคอม
//    และไม่ใช่บริษัทนำเที่ยว — ไม่จัด ไม่ดำเนินการ ไม่ขายต่อทริป
//    ⛔ ห้ามเติมข้อความที่ทำให้ดูเหมือนเรารับเงินหรือเป็นคู่สัญญาการเดินทาง
const UPDATED = "17 September 2026";

const T: Record<string, Record<string, string>> = {
  title: {
    en: "Terms of Service", th: "ข้อกำหนดการใช้บริการ", cn: "服务条款",
    ja: "利用規約", ko: "이용약관", de: "Nutzungsbedingungen",
    fr: "Conditions d'utilisation", ru: "Условия использования",
  },
  meta: {
    en: "SIAMDIVE terms of service — we help you find dive trips and can coordinate a booking, but you pay the operator directly.",
    th: "ข้อกำหนดการใช้บริการของ SIAMDIVE — เราช่วยหาทริปและช่วยประสานงานการจองได้ แต่คุณชำระเงินตรงกับผู้ประกอบการเอง",
    cn: "SIAMDIVE 服务条款——我们协助您寻找行程并可代为协调预订，但款项由您直接支付给运营商。",
    ja: "SIAMDIVE利用規約 — トリップ探しと予約の調整はお手伝いしますが、お支払いはオペレーターへ直接お願いしています。",
    ko: "SIAMDIVE 이용약관 — 트립 검색과 예약 조율은 도와드리지만, 결제는 운영자에게 직접 하셔야 합니다.",
    de: "SIAMDIVE-Nutzungsbedingungen — wir helfen bei der Suche und koordinieren Buchungen, die Zahlung leisten Sie direkt an den Anbieter.",
    fr: "Conditions d'utilisation de SIAMDIVE — nous vous aidons à trouver un voyage et à coordonner la réservation ; vous payez l'opérateur directement.",
    ru: "Условия использования SIAMDIVE — помогаем найти тур и оформить бронирование, но оплату вы вносите оператору напрямую.",
  },
};

const CONTENT: Record<string, { heading: string; body: string }[]> = {
  en: [
    { heading: "Acceptance of Terms", body: "By accessing and using SIAMDIVE (siamdive.com), you agree to be bound by these Terms of Service. If you do not agree, please do not use our website." },
    { heading: "What SIAMDIVE Is", body: "SIAMDIVE is an information and search service for divers. We gather and publish information about dive sites, dive trips, liveaboards, dive resorts and dive schools in Thailand, together with maps, 3D dive-site views and tools for searching and planning. If you want to join a trip, we can also help you contact the operator, arrange the booking and prepare the paperwork. SIAMDIVE does not sell trips and is not a travel agency or tour operator: we do not organise, operate, resell or guarantee any trip, and we never handle your money." },
    { heading: "How Booking Works — We Coordinate, You Pay the Operator", body: "If you ask us to, we will contact the operator on your behalf, help arrange your booking and prepare the paperwork. We act only as a coordinator. All payment is made by you directly to the operator — the boat, resort or dive school. We never take, hold, forward or refund money, and we charge you no fee or commission. The contract for the trip is between you and that operator, on their terms; their cancellation and refund rules apply." },
    { heading: "Accuracy of Information", body: "Trip details, schedules and prices shown on SIAMDIVE come from operators and public sources and are published for reference only. They are not an offer to sell, and they may be out of date or incomplete. Operators may change or withdraw anything without notice. Always confirm every detail directly with the operator before you commit or pay." },
    { heading: "Diving Safety", body: "Diving carries real risk. Everything on SIAMDIVE — depths, conditions, maps, dive-site views and answers from our AI assistant — is for information and planning only. It is never a substitute for certified training, a briefing from your dive guide, or your own judgement on the day. Always dive within your certification and follow your operator's instructions." },
    { heading: "User Conduct", body: "You agree not to misuse our platform, attempt to access restricted areas, or use automated tools to scrape content without permission." },
    { heading: "Intellectual Property", body: "All content on SIAMDIVE — including text, images, logos, and design — is owned by SIAMDIVE or its content providers and protected by copyright law. You may not reproduce or redistribute content without written permission." },
    { heading: "Limitation of Liability", body: "SIAMDIVE provides information “as is” and does not promise that it is always available, complete or error-free. Because we neither organise nor sell trips, SIAMDIVE is not liable for any injury, loss or damage arising from any dive activity, or from the acts, omissions, pricing or cancellation policies of any operator, boat, resort or dive school mentioned on the service. Participants are responsible for ensuring they meet the health and certification requirements of the activity they join." },
    { heading: "Changes to Terms", body: "We may update these terms at any time. Continued use of the website after changes constitutes acceptance of the updated terms." },
    { heading: "Contact", body: "Questions about these terms? Reach us via Line (@siamdive), WhatsApp (+66 98 376 8135), or email." },
  ],
  th: [
    { heading: "การยอมรับข้อกำหนด", body: "การเข้าถึงและใช้งาน SIAMDIVE (siamdive.com) ถือว่าคุณตกลงผูกพันตามข้อกำหนดการใช้บริการเหล่านี้ หากคุณไม่ยอมรับ กรุณาอย่าใช้เว็บไซต์ของเรา" },
    { heading: "SIAMDIVE คืออะไร", body: "SIAMDIVE เป็นแหล่งค้นหาและรวบรวมข้อมูลสำหรับนักดำน้ำ เรารวบรวมและเผยแพร่ข้อมูลจุดดำน้ำ ทริปดำน้ำ เรือ Liveaboard รีสอร์ตดำน้ำ และโรงเรียนสอนดำน้ำในประเทศไทย พร้อมแผนที่ มุมมองจุดดำน้ำแบบ 3 มิติ และเครื่องมือสำหรับค้นหาและวางแผน หากคุณสนใจร่วมทริป เรายังช่วยติดต่อผู้ประกอบการ ดำเนินการจอง และจัดเตรียมเอกสารให้ได้ — SIAMDIVE ไม่ได้ขายทริป และไม่ใช่บริษัทนำเที่ยวหรือผู้ประกอบธุรกิจจัดการท่องเที่ยว เราไม่จัดทริป ไม่ดำเนินทริป ไม่ขายต่อ ไม่รับประกันทริปใด ๆ และไม่รับเงินของคุณไม่ว่ากรณีใด" },
    { heading: "การจองทำงานอย่างไร — เราช่วยประสานงาน คุณชำระเงินกับผู้ประกอบการโดยตรง", body: "หากคุณต้องการ เราจะติดต่อผู้ประกอบการแทนคุณ ช่วยดำเนินการจอง และจัดเตรียมเอกสารให้ โดยเราทำหน้าที่เป็นผู้ช่วยประสานงานเท่านั้น การชำระเงินทั้งหมด คุณต้องชำระตรงกับผู้ประกอบการเอง ไม่ว่าจะเป็นเรือ รีสอร์ต หรือโรงเรียนสอนดำน้ำ เราไม่รับเงิน ไม่ถือเงิน ไม่ส่งต่อเงิน ไม่คืนเงิน และไม่เก็บค่าธรรมเนียมหรือค่าคอมมิชชั่นจากคุณ สัญญาการเดินทางเป็นระหว่างคุณกับผู้ประกอบการรายนั้นภายใต้เงื่อนไขของเขา รวมถึงเงื่อนไขการยกเลิกและการคืนเงิน" },
    { heading: "ความถูกต้องของข้อมูล", body: "รายละเอียดทริป ตารางเวลา และราคาที่แสดงบน SIAMDIVE มาจากผู้ประกอบการและแหล่งข้อมูลสาธารณะ เผยแพร่ไว้เพื่อการอ้างอิงเท่านั้น ไม่ถือเป็นคำเสนอขาย และอาจไม่เป็นปัจจุบันหรือไม่ครบถ้วน ผู้ประกอบการอาจเปลี่ยนแปลงหรือยกเลิกรายละเอียดได้โดยไม่แจ้งล่วงหน้า กรุณาตรวจสอบทุกรายละเอียดกับผู้ประกอบการโดยตรงทุกครั้งก่อนตัดสินใจหรือชำระเงิน" },
    { heading: "ความปลอดภัยในการดำน้ำ", body: "การดำน้ำมีความเสี่ยงจริง ข้อมูลทั้งหมดบน SIAMDIVE ทั้งความลึก สภาพน้ำ แผนที่ มุมมองจุดดำน้ำ และคำตอบจากผู้ช่วย AI ของเรา มีไว้เพื่อให้ข้อมูลและใช้วางแผนเท่านั้น ไม่สามารถใช้แทนการอบรมที่ได้รับการรับรอง การบรีฟจากไกด์ดำน้ำ หรือวิจารณญาณของคุณเองหน้างานได้ ดำน้ำภายในขอบเขตใบรับรองของคุณเสมอ และปฏิบัติตามคำแนะนำของผู้ประกอบการ" },
    { heading: "การประพฤติของผู้ใช้", body: "คุณตกลงที่จะไม่ใช้แพลตฟอร์มของเราในทางที่ผิด พยายามเข้าถึงพื้นที่ที่ถูกจำกัด หรือใช้เครื่องมืออัตโนมัติเพื่อดึงเนื้อหาโดยไม่ได้รับอนุญาต" },
    { heading: "ทรัพย์สินทางปัญญา", body: "เนื้อหาทั้งหมดบน SIAMDIVE รวมถึงข้อความ รูปภาพ โลโก้ และการออกแบบ เป็นกรรมสิทธิ์ของ SIAMDIVE หรือผู้ให้บริการเนื้อหา และได้รับการคุ้มครองโดยกฎหมายลิขสิทธิ์ คุณไม่สามารถทำซ้ำหรือแจกจ่ายเนื้อหาโดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร" },
    { heading: "ข้อจำกัดความรับผิด", body: "SIAMDIVE ให้ข้อมูลตามสภาพที่เป็นอยู่ และไม่รับประกันว่าข้อมูลจะใช้งานได้ตลอดเวลา ครบถ้วน หรือปราศจากข้อผิดพลาด เนื่องจากเราไม่ได้จัดทริปและไม่ได้ขายทริป SIAMDIVE จึงไม่รับผิดต่อการบาดเจ็บ การสูญเสีย หรือความเสียหายใด ๆ ที่เกิดจากกิจกรรมดำน้ำ หรือจากการกระทำ การละเว้น การตั้งราคา หรือเงื่อนไขการยกเลิกของผู้ประกอบการ เรือ รีสอร์ต หรือโรงเรียนสอนดำน้ำที่ปรากฏอยู่ในบริการนี้ ผู้เข้าร่วมมีหน้าที่ตรวจสอบว่าตนเองมีคุณสมบัติด้านสุขภาพและใบรับรองตรงตามข้อกำหนดของกิจกรรมที่เข้าร่วม" },
    { heading: "การเปลี่ยนแปลงข้อกำหนด", body: "เราอาจอัปเดตข้อกำหนดเหล่านี้ได้ตลอดเวลา การใช้เว็บไซต์ต่อหลังจากมีการเปลี่ยนแปลงถือว่ายอมรับข้อกำหนดที่อัปเดตแล้ว" },
    { heading: "ติดต่อ", body: "มีคำถามเกี่ยวกับข้อกำหนดเหล่านี้? ติดต่อเราผ่าน Line (@siamdive), WhatsApp (+66 98 376 8135) หรืออีเมล" },
  ],
  cn: [
    { heading: "接受条款", body: "访问和使用 SIAMDIVE (siamdive.com) 即表示您同意受这些服务条款的约束。如果您不同意，请不要使用我们的网站。" },
    { heading: "SIAMDIVE 是什么", body: "SIAMDIVE 是面向潜水员的信息与搜索服务。我们收集并发布泰国潜水点、潜水行程、船宿、潜水度假村和潜水学校的资料，并提供地图、3D 潜点视图以及搜索和规划工具。如果您想参加某个行程，我们还可以帮您联系运营商、协助办理预订并准备相关文件。SIAMDIVE 不销售行程，也不是旅行社或旅游经营者：我们不组织、不运营、不转售、也不担保任何行程，并且绝不经手您的款项。" },
    { heading: "预订如何进行——我们协助协调，您直接向运营商付款", body: "如果您需要，我们会代您联系运营商、协助办理预订并准备相关文件。我们仅担任协调者的角色。所有款项均由您直接支付给运营商——船只、度假村或潜水学校。我们绝不收取、保管、转交或退还任何款项，也不向您收取任何费用或佣金。行程合同存在于您与该运营商之间，适用其自身条款，包括其取消和退款规定。" },
    { heading: "信息准确性", body: "SIAMDIVE 上显示的行程详情、时间表和价格来自运营商及公开来源，仅供参考，不构成销售要约，且可能过时或不完整。运营商可随时更改或撤回相关内容，恕不另行通知。在做出决定或付款之前，请务必直接向运营商确认每一项细节。" },
    { heading: "潜水安全", body: "潜水存在真实风险。SIAMDIVE 上的一切——深度、水况、地图、潜点视图以及我们 AI 助手的回答——仅用于提供信息和规划，绝不能替代经认证的培训、潜导的行前简报或您当天的自身判断。请始终在您的认证范围内潜水，并遵从运营商的指示。" },
    { heading: "用户行为", body: "您同意不滥用我们的平台、不试图访问受限区域、不在未经许可的情况下使用自动化工具抓取内容。" },
    { heading: "知识产权", body: "SIAMDIVE 上的所有内容——包括文字、图片、标志和设计——均归 SIAMDIVE 或其内容提供商所有，并受版权法保护。未经书面许可，不得复制或转发内容。" },
    { heading: "责任限制", body: "SIAMDIVE 按“现状”提供信息，不保证信息始终可用、完整或无错误。由于我们既不组织也不销售行程，SIAMDIVE 对任何潜水活动，或对本服务中提及的任何运营商、船只、度假村或潜水学校的作为、不作为、定价或取消政策所引起的伤害、损失或损害，均不承担责任。参与者有责任确保自己符合所参加活动的健康和认证要求。" },
    { heading: "条款变更", body: "我们可能随时更新这些条款。在变更后继续使用网站即表示接受更新后的条款。" },
    { heading: "联系方式", body: "对这些条款有疑问？请通过 Line (@siamdive)、WhatsApp (+66 98 376 8135) 或电子邮件联系我们。" },
  ],
  ja: [
    { heading: "規約の受諾", body: "SIAMDIVE（siamdive.com）にアクセスし利用することにより、お客様はこれらの利用規約に拘束されることに同意するものとします。同意されない場合は、当ウェブサイトをご利用にならないでください。" },
    { heading: "SIAMDIVEとは", body: "SIAMDIVEはダイバーのための情報・検索サービスです。タイのダイブサイト、ダイブトリップ、リブアボード、ダイブリゾート、ダイビングスクールに関する情報を収集・掲載し、地図、3Dダイブサイトビュー、検索・プランニングツールを提供しています。トリップへの参加をご希望の場合は、オペレーターへのご連絡、予約の手配、書類のご準備もお手伝いします。SIAMDIVEはトリップを販売せず、旅行代理店でもツアーオペレーターでもありません。いかなるトリップも企画・運営・再販・保証せず、お客様の金銭を取り扱うこともありません。" },
    { heading: "予約の流れ — 当社は調整のみ、お支払いはオペレーターへ直接", body: "ご希望があれば、当社がお客様に代わってオペレーターに連絡し、予約の手配や書類のご準備をお手伝いします。当社はあくまで調整役です。お支払いはすべて、お客様からオペレーター（船・リゾート・ダイビングスクール）へ直接行っていただきます。当社が金銭を受け取る、預かる、転送する、返金することは一切なく、手数料や仲介料をいただくこともありません。トリップの契約はお客様と当該オペレーターとの間で成立し、キャンセル・返金規定を含め、そのオペレーターの条件が適用されます。" },
    { heading: "情報の正確性", body: "SIAMDIVEに掲載されているトリップ内容・スケジュール・料金は、オペレーターおよび公開情報に基づくもので、参考としてのみ掲載しています。販売の申込みではなく、古くなっていたり不完全な場合があります。オペレーターは予告なく変更または取り下げを行うことがあります。お申し込みやお支払いの前に、必ずオペレーターに直接すべての詳細をご確認ください。" },
    { heading: "ダイビングの安全", body: "ダイビングには現実の危険が伴います。水深、コンディション、地図、ダイブサイトビュー、AIアシスタントの回答を含むSIAMDIVE上のすべての情報は、情報提供と計画のためのものであり、認定された訓練、ダイブガイドのブリーフィング、当日のご自身の判断に代わるものでは決してありません。常にご自身の認定範囲内で潜水し、オペレーターの指示に従ってください。" },
    { heading: "ユーザーの行動規範", body: "お客様は、当プラットフォームを悪用したり、制限された領域にアクセスしようとしたり、許可なく自動化ツールを使用してコンテンツをスクレイピングしたりしないことに同意するものとします。" },
    { heading: "知的財産権", body: "SIAMDIVE上のすべてのコンテンツ（テキスト、画像、ロゴ、デザインを含む）は、SIAMDIVEまたはそのコンテンツプロバイダーに帰属し、著作権法により保護されています。書面による許可なくコンテンツを複製または再配布することはできません。" },
    { heading: "責任の制限", body: "SIAMDIVEは情報を「現状のまま」提供し、常時利用可能であること、完全であること、誤りがないことを保証しません。当社はトリップの企画も販売も行わないため、SIAMDIVEは、ダイビング活動に起因する、または本サービスに掲載されたオペレーター・船舶・リゾート・ダイビングスクールの作為・不作為・価格設定・キャンセル規定に起因する傷害、損失、損害について責任を負いません。参加者は、参加する活動の健康要件および資格要件を満たしていることをご自身で確認する責任を負います。" },
    { heading: "規約の変更", body: "当社はいつでもこれらの規約を更新する場合があります。変更後もウェブサイトを継続して使用することは、更新された規約の受諾を意味します。" },
    { heading: "お問い合わせ", body: "これらの規約についてご質問がありますか？Line (@siamdive)、WhatsApp (+66 98 376 8135)、またはメールにてお問い合わせください。" },
  ],
  ko: [
    { heading: "약관 동의", body: "SIAMDIVE (siamdive.com)에 접속하고 사용함으로써 귀하는 본 이용약관에 구속되는 것에 동의합니다. 동의하지 않으시면 웹사이트를 사용하지 마십시오." },
    { heading: "SIAMDIVE란", body: "SIAMDIVE는 다이버를 위한 정보·검색 서비스입니다. 태국의 다이브 사이트, 다이빙 트립, 리브어보드, 다이브 리조트, 다이빙 스쿨 정보를 모아 제공하며, 지도와 3D 다이브 사이트 뷰, 검색 및 계획 도구를 함께 제공합니다. 트립에 참여하고 싶으시면 운영자 연락, 예약 진행, 서류 준비까지 도와드릴 수 있습니다. SIAMDIVE는 트립을 판매하지 않으며 여행사나 투어 운영사가 아닙니다. 어떠한 트립도 기획·운영·재판매하지 않고 보증하지도 않으며, 귀하의 금전을 취급하지 않습니다." },
    { heading: "예약 방식 — 저희는 조율만 하고, 결제는 운영자에게 직접", body: "요청하시면 저희가 대신 운영자에게 연락하고, 예약 진행을 돕고, 서류를 준비해 드립니다. 저희는 조율자 역할만 합니다. 모든 결제는 귀하가 운영자(보트, 리조트 또는 다이빙 스쿨)에게 직접 하셔야 합니다. 저희는 금전을 받거나 보관하거나 전달하거나 환불하지 않으며, 수수료나 커미션도 청구하지 않습니다. 트립 계약은 귀하와 해당 운영자 사이에 성립하며, 취소 및 환불 규정을 포함해 그 운영자의 약관이 적용됩니다." },
    { heading: "정보의 정확성", body: "SIAMDIVE에 표시되는 트립 정보, 일정, 가격은 운영자와 공개 자료에서 수집한 것으로 참고용으로만 제공되며, 판매 청약이 아니고 최신이 아니거나 불완전할 수 있습니다. 운영자는 사전 통지 없이 내용을 변경하거나 철회할 수 있습니다. 결정하거나 결제하기 전에 항상 운영자에게 직접 모든 세부 사항을 확인하십시오." },
    { heading: "다이빙 안전", body: "다이빙에는 실제 위험이 따릅니다. 수심, 수중 상황, 지도, 다이브 사이트 뷰, AI 어시스턴트의 답변을 포함한 SIAMDIVE의 모든 정보는 정보 제공과 계획 목적으로만 제공되며, 공인된 교육이나 다이브 가이드의 브리핑, 당일 본인의 판단을 결코 대신할 수 없습니다. 항상 본인의 자격 범위 내에서 다이빙하고 운영자의 지시를 따르십시오." },
    { heading: "사용자 행동", body: "귀하는 플랫폼을 오용하거나, 제한된 영역에 접근을 시도하거나, 허가 없이 자동화 도구를 사용하여 콘텐츠를 스크래핑하지 않을 것에 동의합니다." },
    { heading: "지적 재산권", body: "SIAMDIVE의 모든 콘텐츠(텍스트, 이미지, 로고 및 디자인 포함)는 SIAMDIVE 또는 콘텐츠 제공자의 소유이며 저작권법에 의해 보호됩니다. 서면 허가 없이 콘텐츠를 복제하거나 재배포할 수 없습니다." },
    { heading: "책임 제한", body: "SIAMDIVE는 정보를 '있는 그대로' 제공하며 항상 이용 가능하거나 완전하거나 오류가 없음을 보장하지 않습니다. 저희는 트립을 기획하지도 판매하지도 않으므로, SIAMDIVE는 다이빙 활동으로 인해 발생하거나 본 서비스에 소개된 운영자, 보트, 리조트, 다이빙 스쿨의 행위·부작위·가격 책정·취소 정책으로 인해 발생한 부상, 손실, 손해에 대해 책임을 지지 않습니다. 참가자는 참여하는 활동의 건강 및 자격 요건을 충족하는지 확인할 책임이 있습니다." },
    { heading: "약관 변경", body: "당사는 언제든지 본 약관을 업데이트할 수 있습니다. 변경 후 웹사이트를 계속 사용하면 업데이트된 약관에 동의하는 것으로 간주됩니다." },
    { heading: "연락처", body: "본 약관에 대해 질문이 있으신가요? Line (@siamdive), WhatsApp (+66 98 376 8135) 또는 이메일로 연락해 주세요." },
  ],
  de: [
    { heading: "Annahme der Bedingungen", body: "Durch den Zugriff auf und die Nutzung von SIAMDIVE (siamdive.com) erklären Sie sich mit diesen Nutzungsbedingungen einverstanden. Wenn Sie nicht einverstanden sind, nutzen Sie bitte unsere Website nicht." },
    { heading: "Was SIAMDIVE ist", body: "SIAMDIVE ist ein Informations- und Suchdienst für Taucher. Wir sammeln und veröffentlichen Informationen zu Tauchplätzen, Tauchtrips, Liveaboards, Tauchresorts und Tauchschulen in Thailand, zusammen mit Karten, 3D-Ansichten von Tauchplätzen sowie Such- und Planungswerkzeugen. Wenn Sie an einem Trip teilnehmen möchten, helfen wir Ihnen außerdem, den Anbieter zu kontaktieren, die Buchung zu veranlassen und die Unterlagen vorzubereiten. SIAMDIVE verkauft keine Reisen und ist weder ein Reisebüro noch ein Reiseveranstalter: Wir organisieren, betreiben, verkaufen und garantieren keine Reisen und wickeln zu keinem Zeitpunkt Ihr Geld ab." },
    { heading: "So läuft eine Buchung — wir koordinieren, Sie zahlen direkt an den Anbieter", body: "Auf Wunsch kontaktieren wir den Anbieter für Sie, helfen bei der Buchung und bereiten die Unterlagen vor. Wir handeln dabei ausschließlich als Koordinator. Sämtliche Zahlungen leisten Sie direkt an den Anbieter — das Boot, das Resort oder die Tauchschule. Wir nehmen, verwahren, leiten und erstatten niemals Geld und berechnen Ihnen weder Gebühren noch Provisionen. Der Vertrag über die Reise besteht zwischen Ihnen und diesem Anbieter zu dessen Bedingungen; dessen Storno- und Erstattungsregeln gelten." },
    { heading: "Genauigkeit der Informationen", body: "Trip-Details, Zeitpläne und Preise auf SIAMDIVE stammen von Anbietern und aus öffentlichen Quellen und dienen ausschließlich der Orientierung. Sie stellen kein Verkaufsangebot dar und können veraltet oder unvollständig sein. Anbieter können Angaben jederzeit ohne Vorankündigung ändern oder zurückziehen. Bestätigen Sie vor einer Zusage oder Zahlung stets alle Einzelheiten direkt beim Anbieter." },
    { heading: "Tauchsicherheit", body: "Tauchen birgt reale Risiken. Alle Angaben auf SIAMDIVE — Tiefen, Bedingungen, Karten, Tauchplatzansichten und Antworten unseres KI-Assistenten — dienen ausschließlich der Information und Planung und ersetzen niemals eine zertifizierte Ausbildung, das Briefing Ihres Tauchguides oder Ihr eigenes Urteilsvermögen vor Ort. Tauchen Sie stets im Rahmen Ihrer Zertifizierung und befolgen Sie die Anweisungen Ihres Anbieters." },
    { heading: "Nutzerverhalten", body: "Sie verpflichten sich, unsere Plattform nicht zu missbrauchen, nicht zu versuchen, auf eingeschränkte Bereiche zuzugreifen, oder automatisierte Tools zum Scraping von Inhalten ohne Erlaubnis zu verwenden." },
    { heading: "Geistiges Eigentum", body: "Alle Inhalte auf SIAMDIVE — einschließlich Texte, Bilder, Logos und Design — sind Eigentum von SIAMDIVE oder seinen Inhaltsanbietern und durch das Urheberrecht geschützt. Sie dürfen Inhalte nicht ohne schriftliche Genehmigung reproduzieren oder weiterverbreiten." },
    { heading: "Haftungsbeschränkung", body: "SIAMDIVE stellt Informationen „wie besehen“ bereit und sichert nicht zu, dass sie jederzeit verfügbar, vollständig oder fehlerfrei sind. Da wir Reisen weder organisieren noch verkaufen, haftet SIAMDIVE nicht für Verletzungen, Verluste oder Schäden, die aus Tauchaktivitäten oder aus Handlungen, Unterlassungen, Preisgestaltung oder Stornobedingungen von Anbietern, Booten, Resorts oder Tauchschulen entstehen, die auf dem Dienst genannt werden. Teilnehmer sind selbst dafür verantwortlich sicherzustellen, dass sie die Gesundheits- und Zertifizierungsanforderungen der jeweiligen Aktivität erfüllen." },
    { heading: "Änderungen der Bedingungen", body: "Wir können diese Bedingungen jederzeit aktualisieren. Die fortgesetzte Nutzung der Website nach Änderungen gilt als Annahme der aktualisierten Bedingungen." },
    { heading: "Kontakt", body: "Fragen zu diesen Bedingungen? Erreichen Sie uns über Line (@siamdive), WhatsApp (+66 98 376 8135) oder E-Mail." },
  ],
  fr: [
    { heading: "Acceptation des conditions", body: "En accédant et en utilisant SIAMDIVE (siamdive.com), vous acceptez d'être lié par ces conditions d'utilisation. Si vous n'êtes pas d'accord, veuillez ne pas utiliser notre site web." },
    { heading: "Ce qu'est SIAMDIVE", body: "SIAMDIVE est un service d'information et de recherche destiné aux plongeurs. Nous rassemblons et publions des informations sur les sites de plongée, les voyages de plongée, les croisières plongée, les resorts et les écoles de plongée en Thaïlande, avec des cartes, des vues 3D des sites et des outils de recherche et de planification. Si vous souhaitez participer à un voyage, nous pouvons aussi vous aider à contacter l'opérateur, à organiser la réservation et à préparer les documents. SIAMDIVE ne vend pas de voyages et n'est ni une agence de voyages ni un voyagiste : nous n'organisons, n'exploitons, ne revendons et ne garantissons aucun voyage, et nous ne manipulons jamais votre argent." },
    { heading: "Comment se passe une réservation — nous coordonnons, vous payez directement l'opérateur", body: "Si vous le souhaitez, nous contactons l'opérateur pour vous, aidons à organiser votre réservation et préparons les documents. Nous agissons uniquement en tant que coordinateur. Tous les paiements sont effectués par vous directement auprès de l'opérateur — le bateau, le resort ou l'école de plongée. Nous ne recevons, ne détenons, ne transférons et ne remboursons jamais d'argent, et nous ne vous facturons ni frais ni commission. Le contrat du voyage est conclu entre vous et cet opérateur, selon ses conditions ; ses règles d'annulation et de remboursement s'appliquent." },
    { heading: "Exactitude des informations", body: "Les détails des voyages, les horaires et les tarifs affichés sur SIAMDIVE proviennent des opérateurs et de sources publiques et sont publiés à titre indicatif uniquement. Ils ne constituent pas une offre de vente et peuvent être obsolètes ou incomplets. Les opérateurs peuvent les modifier ou les retirer sans préavis. Confirmez toujours chaque détail directement auprès de l'opérateur avant de vous engager ou de payer." },
    { heading: "Sécurité en plongée", body: "La plongée comporte des risques réels. Tout ce qui figure sur SIAMDIVE — profondeurs, conditions, cartes, vues des sites et réponses de notre assistant IA — sert uniquement à l'information et à la planification et ne remplace jamais une formation certifiée, le briefing de votre guide de plongée ou votre propre jugement le jour même. Plongez toujours dans les limites de votre certification et suivez les instructions de votre opérateur." },
    { heading: "Conduite des utilisateurs", body: "Vous acceptez de ne pas abuser de notre plateforme, de ne pas tenter d'accéder à des zones restreintes ou d'utiliser des outils automatisés pour extraire du contenu sans autorisation." },
    { heading: "Propriété intellectuelle", body: "Tout le contenu sur SIAMDIVE — y compris les textes, images, logos et le design — appartient à SIAMDIVE ou à ses fournisseurs de contenu et est protégé par le droit d'auteur. Vous ne pouvez pas reproduire ou redistribuer le contenu sans autorisation écrite." },
    { heading: "Limitation de responsabilité", body: "SIAMDIVE fournit ses informations « en l'état » et ne garantit pas qu'elles soient toujours disponibles, complètes ou exemptes d'erreurs. Comme nous n'organisons ni ne vendons de voyages, SIAMDIVE n'est pas responsable des blessures, pertes ou dommages résultant d'une activité de plongée, ni des actes, omissions, tarifs ou conditions d'annulation des opérateurs, bateaux, resorts ou écoles de plongée mentionnés sur le service. Il appartient aux participants de s'assurer qu'ils remplissent les conditions de santé et de certification de l'activité à laquelle ils participent." },
    { heading: "Modifications des conditions", body: "Nous pouvons mettre à jour ces conditions à tout moment. L'utilisation continue du site web après les modifications constitue l'acceptation des conditions mises à jour." },
    { heading: "Contact", body: "Des questions sur ces conditions ? Contactez-nous via Line (@siamdive), WhatsApp (+66 98 376 8135) ou par e-mail." },
  ],
  ru: [
    { heading: "Принятие условий", body: "Получая доступ к SIAMDIVE (siamdive.com) и используя его, вы соглашаетесь соблюдать настоящие Условия использования. Если вы не согласны, пожалуйста, не используйте наш сайт." },
    { heading: "Что такое SIAMDIVE", body: "SIAMDIVE — это информационно-поисковый сервис для дайверов. Мы собираем и публикуем сведения о дайв-сайтах, дайв-турах, лайвэбордах, дайв-курортах и дайв-школах Таиланда, а также предоставляем карты, 3D-виды дайв-сайтов и инструменты поиска и планирования. Если вы хотите поехать, мы также поможем связаться с оператором, оформить бронирование и подготовить документы. SIAMDIVE не продаёт туры и не является турагентством или туроператором: мы не организуем, не проводим, не перепродаём и не гарантируем поездки и никогда не работаем с вашими деньгами." },
    { heading: "Как проходит бронирование — мы координируем, вы платите оператору напрямую", body: "По вашей просьбе мы свяжемся с оператором от вашего имени, поможем оформить бронирование и подготовим документы. Мы выступаем исключительно как координатор. Всю оплату вы вносите напрямую оператору — судну, курорту или дайв-школе. Мы никогда не принимаем, не храним, не пересылаем и не возвращаем деньги и не берём с вас комиссию или плату за услуги. Договор на поездку заключается между вами и этим оператором на его условиях; действуют его правила отмены и возврата." },
    { heading: "Точность информации", body: "Сведения о турах, расписания и цены на SIAMDIVE получены от операторов и из открытых источников и публикуются исключительно для справки. Они не являются офертой и могут быть устаревшими или неполными. Операторы вправе изменить или отозвать их без предупреждения. Всегда уточняйте все детали напрямую у оператора, прежде чем принимать решение или платить." },
    { heading: "Безопасность погружений", body: "Дайвинг связан с реальным риском. Всё, что размещено на SIAMDIVE — глубины, условия, карты, виды дайв-сайтов и ответы нашего ИИ-ассистента — предназначено только для информации и планирования и никогда не заменяет сертифицированного обучения, брифинга вашего дайв-гида или вашего собственного суждения на месте. Всегда погружайтесь в пределах своей сертификации и следуйте указаниям оператора." },
    { heading: "Поведение пользователей", body: "Вы соглашаетесь не злоупотреблять нашей платформой, не пытаться получить доступ к ограниченным зонам и не использовать автоматизированные инструменты для сбора контента без разрешения." },
    { heading: "Интеллектуальная собственность", body: "Весь контент на SIAMDIVE — включая тексты, изображения, логотипы и дизайн — принадлежит SIAMDIVE или его поставщикам контента и защищён законом об авторском праве. Вы не можете воспроизводить или распространять контент без письменного разрешения." },
    { heading: "Ограничение ответственности", body: "SIAMDIVE предоставляет информацию «как есть» и не гарантирует её постоянную доступность, полноту или безошибочность. Поскольку мы не организуем и не продаём туры, SIAMDIVE не несёт ответственности за травмы, потери или ущерб, возникшие в результате дайвинг-активности либо действий, бездействия, ценообразования или правил отмены операторов, судов, курортов или дайв-школ, упомянутых на сервисе. Участники сами отвечают за соответствие требованиям к здоровью и сертификации того мероприятия, в котором они участвуют." },
    { heading: "Изменение условий", body: "Мы можем обновить эти условия в любое время. Продолжение использования сайта после изменений означает принятие обновлённых условий." },
    { heading: "Контакт", body: "Есть вопросы по этим условиям? Свяжитесь с нами через Line (@siamdive), WhatsApp (+66 98 376 8135) или электронную почту." },
  ],
};

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const l = VALID_LANGS.includes(lang) ? lang : "en";
  return { title: T.title[l], description: T.meta[l] };
}

export default async function TermsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const l = VALID_LANGS.includes(lang) ? lang : "en";
  const sections = CONTENT[l] || CONTENT["en"];

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "80px 24px 60px" }}>
      <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 900, marginBottom: 8, color: "#fff" }}>
        {T.title[l]}
      </h1>
      <p style={{ color: "#444", fontSize: 13, marginBottom: 32 }}>Last updated: {UPDATED}</p>
      {sections.map((s, i) => (
        <section key={i} style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: "#e5e5e5" }}>{s.heading}</h2>
          <p style={{ color: "#999", fontSize: 15, lineHeight: 1.8 }}>{s.body}</p>
        </section>
      ))}
    </main>
  );
}
