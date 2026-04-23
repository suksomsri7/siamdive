import type { Metadata } from "next";

const VALID_LANGS = ["en", "th", "cn", "ja", "ko", "de", "fr", "ru"];

const T: Record<string, Record<string, string>> = {
  title: {
    en: "Terms of Service", th: "ข้อกำหนดการใช้บริการ", cn: "服务条款",
    ja: "利用規約", ko: "이용약관", de: "Nutzungsbedingungen",
    fr: "Conditions d'utilisation", ru: "Условия использования",
  },
  meta: {
    en: "SIAMDIVE terms of service — rules and guidelines for using our platform.",
    th: "ข้อกำหนดการใช้บริการของ SIAMDIVE — กฎและแนวทางในการใช้แพลตฟอร์มของเรา",
    cn: "SIAMDIVE服务条款——使用我们平台的规则和指南。",
    ja: "SIAMDIVE利用規約 — プラットフォーム利用のルールとガイドライン。",
    ko: "SIAMDIVE 이용약관 — 플랫폼 사용 규칙 및 지침.",
    de: "SIAMDIVE-Nutzungsbedingungen — Regeln und Richtlinien für die Nutzung unserer Plattform.",
    fr: "Conditions d'utilisation de SIAMDIVE — règles et directives pour l'utilisation de notre plateforme.",
    ru: "Условия использования SIAMDIVE — правила и рекомендации по использованию нашей платформы.",
  },
};

const CONTENT: Record<string, { heading: string; body: string }[]> = {
  en: [
    { heading: "Acceptance of Terms", body: "By accessing and using SIAMDIVE (siamdive.com), you agree to be bound by these Terms of Service. If you do not agree, please do not use our website." },
    { heading: "Service Description", body: "SIAMDIVE is an information and booking platform that connects divers with dive trip operators, liveaboard companies, and dive schools in Thailand. We curate and display trip information, schedules, and pricing provided by operators." },
    { heading: "Booking and Payments", body: "Bookings are facilitated through direct communication with operators via our contact channels (Line, WhatsApp, Messenger). SIAMDIVE acts as an intermediary; the contractual relationship for any dive trip is between you and the operator." },
    { heading: "Accuracy of Information", body: "We strive to keep all trip information, schedules, and prices accurate and up to date. However, operators may change details without notice. Always confirm details directly with the operator before your trip." },
    { heading: "User Conduct", body: "You agree not to misuse our platform, attempt to access restricted areas, or use automated tools to scrape content without permission." },
    { heading: "Intellectual Property", body: "All content on SIAMDIVE — including text, images, logos, and design — is owned by SIAMDIVE or its content providers and protected by copyright law. You may not reproduce or redistribute content without written permission." },
    { heading: "Limitation of Liability", body: "SIAMDIVE is not liable for any injury, loss, or damage arising from dive activities booked through our platform. Diving is an inherently risky activity; participants are responsible for ensuring they meet health and certification requirements." },
    { heading: "Changes to Terms", body: "We may update these terms at any time. Continued use of the website after changes constitutes acceptance of the updated terms." },
    { heading: "Contact", body: "Questions about these terms? Reach us via Line (@siamdive), WhatsApp (+66 98 376 8135), or email." },
  ],
  th: [
    { heading: "การยอมรับข้อกำหนด", body: "การเข้าถึงและใช้งาน SIAMDIVE (siamdive.com) ถือว่าคุณตกลงผูกพันตามข้อกำหนดการใช้บริการเหล่านี้ หากคุณไม่ยอมรับ กรุณาอย่าใช้เว็บไซต์ของเรา" },
    { heading: "คำอธิบายบริการ", body: "SIAMDIVE เป็นแพลตฟอร์มข้อมูลและการจองที่เชื่อมต่อนักดำน้ำกับผู้ให้บริการทริปดำน้ำ, บริษัท Liveaboard และโรงเรียนดำน้ำในประเทศไทย เราคัดสรรและแสดงข้อมูลทริป ตารางเวลา และราคาที่ผู้ให้บริการจัดหาให้" },
    { heading: "การจองและการชำระเงิน", body: "การจองดำเนินการผ่านการสื่อสารโดยตรงกับผู้ให้บริการผ่านช่องทางติดต่อของเรา (Line, WhatsApp, Messenger) SIAMDIVE ทำหน้าที่เป็นตัวกลาง ความสัมพันธ์ตามสัญญาสำหรับทริปดำน้ำใดๆ คือระหว่างคุณและผู้ให้บริการ" },
    { heading: "ความถูกต้องของข้อมูล", body: "เราพยายามรักษาข้อมูลทริป ตารางเวลา และราคาทั้งหมดให้ถูกต้องและเป็นปัจจุบัน อย่างไรก็ตาม ผู้ให้บริการอาจเปลี่ยนแปลงรายละเอียดโดยไม่แจ้งให้ทราบ โปรดยืนยันรายละเอียดกับผู้ให้บริการโดยตรงก่อนทริปของคุณ" },
    { heading: "การประพฤติของผู้ใช้", body: "คุณตกลงที่จะไม่ใช้แพลตฟอร์มของเราในทางที่ผิด พยายามเข้าถึงพื้นที่ที่ถูกจำกัด หรือใช้เครื่องมืออัตโนมัติเพื่อดึงเนื้อหาโดยไม่ได้รับอนุญาต" },
    { heading: "ทรัพย์สินทางปัญญา", body: "เนื้อหาทั้งหมดบน SIAMDIVE รวมถึงข้อความ รูปภาพ โลโก้ และการออกแบบ เป็นกรรมสิทธิ์ของ SIAMDIVE หรือผู้ให้บริการเนื้อหา และได้รับการคุ้มครองโดยกฎหมายลิขสิทธิ์ คุณไม่สามารถทำซ้ำหรือแจกจ่ายเนื้อหาโดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร" },
    { heading: "ข้อจำกัดความรับผิด", body: "SIAMDIVE ไม่รับผิดชอบต่อการบาดเจ็บ การสูญเสีย หรือความเสียหายใดๆ ที่เกิดจากกิจกรรมดำน้ำที่จองผ่านแพลตฟอร์มของเรา การดำน้ำเป็นกิจกรรมที่มีความเสี่ยงโดยธรรมชาติ ผู้เข้าร่วมมีหน้าที่ตรวจสอบว่าตนเองมีคุณสมบัติด้านสุขภาพและการรับรองที่ตรงตามข้อกำหนด" },
    { heading: "การเปลี่ยนแปลงข้อกำหนด", body: "เราอาจอัปเดตข้อกำหนดเหล่านี้ได้ตลอดเวลา การใช้เว็บไซต์ต่อหลังจากมีการเปลี่ยนแปลงถือว่ายอมรับข้อกำหนดที่อัปเดตแล้ว" },
    { heading: "ติดต่อ", body: "มีคำถามเกี่ยวกับข้อกำหนดเหล่านี้? ติดต่อเราผ่าน Line (@siamdive), WhatsApp (+66 98 376 8135) หรืออีเมล" },
  ],
  cn: [
    { heading: "接受条款", body: "访问和使用 SIAMDIVE (siamdive.com) 即表示您同意受这些服务条款的约束。如果您不同意，请不要使用我们的网站。" },
    { heading: "服务描述", body: "SIAMDIVE 是一个信息和预订平台，将潜水员与泰国的潜水行程运营商、船宿公司和潜水学校联系起来。我们策划和展示运营商提供的行程信息、时间表和价格。" },
    { heading: "预订和付款", body: "预订通过我们的联系渠道（Line、WhatsApp、Messenger）与运营商直接沟通来完成。SIAMDIVE 充当中介；任何潜水行程的合同关系是在您和运营商之间。" },
    { heading: "信息准确性", body: "我们努力保持所有行程信息、时间表和价格的准确性和最新性。但运营商可能会在不另行通知的情况下更改详细信息。请务必在出行前直接与运营商确认详细信息。" },
    { heading: "用户行为", body: "您同意不滥用我们的平台、不试图访问受限区域、不在未经许可的情况下使用自动化工具抓取内容。" },
    { heading: "知识产权", body: "SIAMDIVE 上的所有内容——包括文字、图片、标志和设计——均归 SIAMDIVE 或其内容提供商所有，并受版权法保护。未经书面许可，不得复制或转发内容。" },
    { heading: "责任限制", body: "SIAMDIVE 对通过我们平台预订的潜水活动中产生的任何伤害、损失或损害不承担责任。潜水本身具有固有风险；参与者有责任确保自己符合健康和认证要求。" },
    { heading: "条款变更", body: "我们可能随时更新这些条款。在变更后继续使用网站即表示接受更新后的条款。" },
    { heading: "联系方式", body: "对这些条款有疑问？请通过 Line (@siamdive)、WhatsApp (+66 98 376 8135) 或电子邮件联系我们。" },
  ],
  ja: [
    { heading: "規約の受諾", body: "SIAMDIVE（siamdive.com）にアクセスし利用することにより、お客様はこれらの利用規約に拘束されることに同意するものとします。同意されない場合は、当ウェブサイトをご利用にならないでください。" },
    { heading: "サービスの説明", body: "SIAMDIVEは、ダイバーとタイのダイブトリップオペレーター、リブアボード会社、ダイビングスクールをつなぐ情報・予約プラットフォームです。オペレーターが提供するトリップ情報、スケジュール、料金を厳選して表示しています。" },
    { heading: "予約と支払い", body: "予約は、当社の連絡チャネル（Line、WhatsApp、Messenger）を通じてオペレーターとの直接コミュニケーションにより行われます。SIAMDIVEは仲介者として機能し、ダイブトリップの契約関係はお客様とオペレーターの間にあります。" },
    { heading: "情報の正確性", body: "すべてのトリップ情報、スケジュール、料金を正確かつ最新に保つよう努めています。ただし、オペレーターは予告なく詳細を変更する場合があります。トリップ前に必ずオペレーターに直接詳細をご確認ください。" },
    { heading: "ユーザーの行動規範", body: "お客様は、当プラットフォームを悪用したり、制限された領域にアクセスしようとしたり、許可なく自動化ツールを使用してコンテンツをスクレイピングしたりしないことに同意するものとします。" },
    { heading: "知的財産権", body: "SIAMDIVE上のすべてのコンテンツ（テキスト、画像、ロゴ、デザインを含む）は、SIAMDIVEまたはそのコンテンツプロバイダーに帰属し、著作権法により保護されています。書面による許可なくコンテンツを複製または再配布することはできません。" },
    { heading: "責任の制限", body: "SIAMDIVEは、当プラットフォームを通じて予約されたダイビング活動から生じるいかなる怪我、損失、損害に対しても責任を負いません。ダイビングは本質的にリスクを伴う活動であり、参加者は健康要件および資格要件を満たしていることを確認する責任があります。" },
    { heading: "規約の変更", body: "当社はいつでもこれらの規約を更新する場合があります。変更後もウェブサイトを継続して使用することは、更新された規約の受諾を意味します。" },
    { heading: "お問い合わせ", body: "これらの規約についてご質問がありますか？Line (@siamdive)、WhatsApp (+66 98 376 8135)、またはメールにてお問い合わせください。" },
  ],
  ko: [
    { heading: "약관 동의", body: "SIAMDIVE (siamdive.com)에 접속하고 사용함으로써 귀하는 본 이용약관에 구속되는 것에 동의합니다. 동의하지 않으시면 웹사이트를 사용하지 마십시오." },
    { heading: "서비스 설명", body: "SIAMDIVE는 다이버와 태국의 다이빙 트립 운영자, 리브어보드 회사 및 다이빙 스쿨을 연결하는 정보 및 예약 플랫폼입니다. 운영자가 제공하는 트립 정보, 일정 및 가격을 선별하여 표시합니다." },
    { heading: "예약 및 결제", body: "예약은 저희 연락 채널(Line, WhatsApp, Messenger)을 통해 운영자와 직접 소통하여 진행됩니다. SIAMDIVE는 중개자로서 활동하며, 다이빙 트립에 대한 계약 관계는 귀하와 운영자 사이에 있습니다." },
    { heading: "정보의 정확성", body: "모든 트립 정보, 일정 및 가격을 정확하고 최신으로 유지하기 위해 노력합니다. 그러나 운영자는 사전 통지 없이 세부 사항을 변경할 수 있습니다. 트립 전에 항상 운영자에게 직접 세부 사항을 확인하십시오." },
    { heading: "사용자 행동", body: "귀하는 플랫폼을 오용하거나, 제한된 영역에 접근을 시도하거나, 허가 없이 자동화 도구를 사용하여 콘텐츠를 스크래핑하지 않을 것에 동의합니다." },
    { heading: "지적 재산권", body: "SIAMDIVE의 모든 콘텐츠(텍스트, 이미지, 로고 및 디자인 포함)는 SIAMDIVE 또는 콘텐츠 제공자의 소유이며 저작권법에 의해 보호됩니다. 서면 허가 없이 콘텐츠를 복제하거나 재배포할 수 없습니다." },
    { heading: "책임 제한", body: "SIAMDIVE는 플랫폼을 통해 예약된 다이빙 활동에서 발생하는 부상, 손실 또는 손해에 대해 책임을 지지 않습니다. 다이빙은 본질적으로 위험한 활동이며, 참가자는 건강 및 자격 요건을 충족하는지 확인할 책임이 있습니다." },
    { heading: "약관 변경", body: "당사는 언제든지 본 약관을 업데이트할 수 있습니다. 변경 후 웹사이트를 계속 사용하면 업데이트된 약관에 동의하는 것으로 간주됩니다." },
    { heading: "연락처", body: "본 약관에 대해 질문이 있으신가요? Line (@siamdive), WhatsApp (+66 98 376 8135) 또는 이메일로 연락해 주세요." },
  ],
  de: [
    { heading: "Annahme der Bedingungen", body: "Durch den Zugriff auf und die Nutzung von SIAMDIVE (siamdive.com) erklären Sie sich mit diesen Nutzungsbedingungen einverstanden. Wenn Sie nicht einverstanden sind, nutzen Sie bitte unsere Website nicht." },
    { heading: "Dienstbeschreibung", body: "SIAMDIVE ist eine Informations- und Buchungsplattform, die Taucher mit Tauchtrip-Anbietern, Liveaboard-Unternehmen und Tauchschulen in Thailand verbindet. Wir kuratieren und zeigen Trip-Informationen, Zeitpläne und Preise an, die von Anbietern bereitgestellt werden." },
    { heading: "Buchung und Zahlung", body: "Buchungen werden durch direkte Kommunikation mit Anbietern über unsere Kontaktkanäle (Line, WhatsApp, Messenger) abgewickelt. SIAMDIVE fungiert als Vermittler; das Vertragsverhältnis für jeden Tauchtrip besteht zwischen Ihnen und dem Anbieter." },
    { heading: "Genauigkeit der Informationen", body: "Wir bemühen uns, alle Trip-Informationen, Zeitpläne und Preise genau und aktuell zu halten. Anbieter können Details jedoch ohne Vorankündigung ändern. Bestätigen Sie Details immer direkt beim Anbieter vor Ihrem Trip." },
    { heading: "Nutzerverhalten", body: "Sie verpflichten sich, unsere Plattform nicht zu missbrauchen, nicht zu versuchen, auf eingeschränkte Bereiche zuzugreifen, oder automatisierte Tools zum Scraping von Inhalten ohne Erlaubnis zu verwenden." },
    { heading: "Geistiges Eigentum", body: "Alle Inhalte auf SIAMDIVE — einschließlich Texte, Bilder, Logos und Design — sind Eigentum von SIAMDIVE oder seinen Inhaltsanbietern und durch das Urheberrecht geschützt. Sie dürfen Inhalte nicht ohne schriftliche Genehmigung reproduzieren oder weiterverbreiten." },
    { heading: "Haftungsbeschränkung", body: "SIAMDIVE haftet nicht für Verletzungen, Verluste oder Schäden, die aus über unsere Plattform gebuchten Tauchaktivitäten entstehen. Tauchen ist eine inhärent risikoreiche Aktivität; Teilnehmer sind dafür verantwortlich sicherzustellen, dass sie die Gesundheits- und Zertifizierungsanforderungen erfüllen." },
    { heading: "Änderungen der Bedingungen", body: "Wir können diese Bedingungen jederzeit aktualisieren. Die fortgesetzte Nutzung der Website nach Änderungen gilt als Annahme der aktualisierten Bedingungen." },
    { heading: "Kontakt", body: "Fragen zu diesen Bedingungen? Erreichen Sie uns über Line (@siamdive), WhatsApp (+66 98 376 8135) oder E-Mail." },
  ],
  fr: [
    { heading: "Acceptation des conditions", body: "En accédant et en utilisant SIAMDIVE (siamdive.com), vous acceptez d'être lié par ces conditions d'utilisation. Si vous n'êtes pas d'accord, veuillez ne pas utiliser notre site web." },
    { heading: "Description du service", body: "SIAMDIVE est une plateforme d'information et de réservation qui connecte les plongeurs avec les opérateurs de voyages de plongée, les compagnies de liveaboard et les écoles de plongée en Thaïlande. Nous sélectionnons et affichons les informations sur les voyages, les horaires et les tarifs fournis par les opérateurs." },
    { heading: "Réservation et paiement", body: "Les réservations sont facilitées par une communication directe avec les opérateurs via nos canaux de contact (Line, WhatsApp, Messenger). SIAMDIVE agit en tant qu'intermédiaire ; la relation contractuelle pour tout voyage de plongée est entre vous et l'opérateur." },
    { heading: "Exactitude des informations", body: "Nous nous efforçons de maintenir toutes les informations, horaires et tarifs exacts et à jour. Cependant, les opérateurs peuvent modifier les détails sans préavis. Confirmez toujours les détails directement avec l'opérateur avant votre voyage." },
    { heading: "Conduite des utilisateurs", body: "Vous acceptez de ne pas abuser de notre plateforme, de ne pas tenter d'accéder à des zones restreintes ou d'utiliser des outils automatisés pour extraire du contenu sans autorisation." },
    { heading: "Propriété intellectuelle", body: "Tout le contenu sur SIAMDIVE — y compris les textes, images, logos et le design — appartient à SIAMDIVE ou à ses fournisseurs de contenu et est protégé par le droit d'auteur. Vous ne pouvez pas reproduire ou redistribuer le contenu sans autorisation écrite." },
    { heading: "Limitation de responsabilité", body: "SIAMDIVE n'est pas responsable des blessures, pertes ou dommages résultant d'activités de plongée réservées via notre plateforme. La plongée est une activité intrinsèquement risquée ; les participants sont responsables de s'assurer qu'ils remplissent les conditions de santé et de certification." },
    { heading: "Modifications des conditions", body: "Nous pouvons mettre à jour ces conditions à tout moment. L'utilisation continue du site web après les modifications constitue l'acceptation des conditions mises à jour." },
    { heading: "Contact", body: "Des questions sur ces conditions ? Contactez-nous via Line (@siamdive), WhatsApp (+66 98 376 8135) ou par e-mail." },
  ],
  ru: [
    { heading: "Принятие условий", body: "Получая доступ к SIAMDIVE (siamdive.com) и используя его, вы соглашаетесь соблюдать настоящие Условия использования. Если вы не согласны, пожалуйста, не используйте наш сайт." },
    { heading: "Описание сервиса", body: "SIAMDIVE — это информационная и букинговая платформа, связывающая дайверов с операторами дайв-туров, компаниями лайвэбордов и дайв-школами в Таиланде. Мы курируем и отображаем информацию о турах, расписания и цены, предоставленные операторами." },
    { heading: "Бронирование и оплата", body: "Бронирование осуществляется через прямое общение с операторами через наши каналы связи (Line, WhatsApp, Messenger). SIAMDIVE выступает посредником; договорные отношения для любого дайв-тура существуют между вами и оператором." },
    { heading: "Точность информации", body: "Мы стремимся поддерживать всю информацию о турах, расписания и цены точными и актуальными. Однако операторы могут изменять детали без предварительного уведомления. Всегда подтверждайте детали непосредственно у оператора перед поездкой." },
    { heading: "Поведение пользователей", body: "Вы соглашаетесь не злоупотреблять нашей платформой, не пытаться получить доступ к ограниченным зонам и не использовать автоматизированные инструменты для сбора контента без разрешения." },
    { heading: "Интеллектуальная собственность", body: "Весь контент на SIAMDIVE — включая тексты, изображения, логотипы и дизайн — принадлежит SIAMDIVE или его поставщикам контента и защищён законом об авторском праве. Вы не можете воспроизводить или распространять контент без письменного разрешения." },
    { heading: "Ограничение ответственности", body: "SIAMDIVE не несёт ответственности за любые травмы, потери или ущерб, возникшие в результате дайвинг-мероприятий, забронированных через нашу платформу. Дайвинг — это деятельность с inherentным риском; участники несут ответственность за соответствие требованиям к здоровью и сертификации." },
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
      <p style={{ color: "#444", fontSize: 13, marginBottom: 32 }}>Last updated: April 2025</p>
      {sections.map((s, i) => (
        <section key={i} style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: "#e5e5e5" }}>{s.heading}</h2>
          <p style={{ color: "#999", fontSize: 15, lineHeight: 1.8 }}>{s.body}</p>
        </section>
      ))}
    </main>
  );
}
