// Build DRAFT blog payload for "barracuda tornado" — 8 languages
const fs = require('fs');

const mjPrompt = `A lone scuba diver hovering motionless at the still centre of a slowly rotating tornado of hundreds of chevron barracuda, the silver school spiralling into a living funnel that closes over the diver's head, the diver small and calm inside the vortex with arms tucked in, shafts of god-ray light falling from the surface through the blue water column and catching the barracudas' mirror flanks, the granite pinnacle dropping away into deep blue haze below, three-layer depth from foreground fish to distant diver to fading blue, a moment of pure awe told through the fish's coordinated motion, cathedral light from above, low angle looking up so the school dwarfs the human, vast negative space of open blue, in the style of Brian Skerry schooling-fish photography, Nikon Z9 in Nauticam housing, Nikkor 14-30mm f/4, shot on Kodak Ektachrome E100, fine grain, faithful color, no digital smoothing, National Geographic editorial photography, documentary wildlife photojournalism, unposed, observed from respectful distance, decisive moment of honest behavior, suspended particulate visible in the water column, honest exposure, no HDR, no saturation boost, deep shadows allowed, no text, no watermark, no logo --no illustration, painting, render, cgi, cartoon, 3d, anime, hdr, oversaturated, stock photo, watercolor, digital art, fantasy, neon, glossy, plastic, airbrushed, smooth skin, cinematic color grade, teal and orange, instagram filter --style raw --s 25 --v 7`;

const en = {
  lang: 'en',
  title: 'Why Thousands of Barracuda Circle Divers and Never Strike',
  slug: 'why-thousands-of-barracuda-circle-divers',
  excerpt: 'The silver tornado at Chumphon Pinnacle and Sail Rock is real — hundreds of chevron barracuda spinning around divers who never get touched. Here is why.',
  keywords: ['barracuda tornado Koh Tao','Chumphon Pinnacle diving','Sail Rock chevron barracuda','barracuda school diving Thailand','Gulf of Thailand pinnacle dive','are barracuda dangerous to divers','Koh Tao advanced dive site','Sail Rock from Koh Samui dive trip'],
  ogTitle: 'The Barracuda Tornado at Chumphon Pinnacle and Sail Rock Is Real',
  ogDescription: 'Hundreds of chevron barracuda spin into a silver funnel around divers in the Gulf of Thailand — and never strike. Where to find it, how deep, and why it is safe.',
  content: `<p>The first sign is a shadow overhead. Not a cloud — the Gulf of Thailand rarely lets the sun through that cleanly at 24 metres — but a moving ceiling of fish, hundreds of them, tightening into a slow rotation above the pinnacle. Within a minute the school has closed the circle. A diver hanging in the middle is now standing inside a living silver funnel that turns, and turns, and shows no interest in leaving.</p>

<p>Thai divers have a name for it: the barracuda storm. The photos look staged. They are not.</p>

<h2>Is the tornado actually real, or a dive-shop legend?</h2>
<p>It is real, and it happens at two specific submerged pinnacles in the western Gulf of Thailand — Chumphon Pinnacle off Koh Tao, and Sail Rock between Koh Tao and Koh Phangan. Both are lonely towers of granite rising out of deep water with nothing else around for a fish to hide behind. That geography is the whole trick. Open water on every side funnels current across the rock, current carries plankton, plankton draws baitfish, and baitfish draw the predators that hang in the blue in their thousands.</p>
<p>The species at the centre of the spectacle is the chevron barracuda, <em>Sphyraena qenie</em>, a schooling cousin of the solitary great barracuda. Chevrons gather in the hundreds, sometimes low thousands, and when a school tightens its formation over a pinnacle it rotates — a shimmering silver column that photographers have called a tornado for good reason. Marine biologists describe the same behaviour more plainly: a coordinated aggregation that gives each individual fish protection and better hunting odds. The rotation itself is thought to work as defence — a turning wall of near-identical bodies makes it hard for anything hunting the barracuda to lock onto a single target, the same predator-confusion trick sardines use off South Africa. What keeps the show repeatable is the rock: the schools return to the same pinnacle day after day because the current that feeds them never really switches off. To a diver in the middle of it, it just looks like the ocean has decided to spin.</p>

<h2>Chumphon Pinnacle, where fish density becomes weather</h2>
<p>Twelve kilometres northwest of Koh Tao, Chumphon Pinnacle is a cluster of granite towers spread across roughly 200 metres of seabed. The main summit sits about 14 metres below the surface; the surrounding pillars fall away to 30–36 metres, with sand and boulders deeper still. Vivid pink anemones carpet the upper rock, and the site is genuinely dense with big fish — batfish, jacks, snapper, groupers, and the resident barracuda schools that patrol a feature divers simply call Barracuda Rock, usually between 20 and 30 metres.</p>
<table>
<tr><th>Metric</th><th>Value</th></tr>
<tr><td>Summit depth</td><td>~14 m</td></tr>
<tr><td>Working depth</td><td>18–30 m</td></tr>
<tr><td>Max depth</td><td>36 m+</td></tr>
<tr><td>Visibility</td><td>15–30 m</td></tr>
<tr><td>Level</td><td>Advanced / Nitrox</td></tr>
</table>
<p>The depth is why this is not a first-week dive. Reaching the good fish action means spending time below 18 metres, and the site sits far enough offshore that current can build quickly and visibility can swing between dives. An Advanced Open Water certification is the sensible floor, and enriched-air Nitrox buys the extra bottom time that turns a rushed pass into a real encounter — worth reading up on if you are weighing <a href="/en/blogs/thailand-deepest-dive-wall-hin-muang">how far to push your depth training</a> before a trip like this.</p>

<h2>Sail Rock, the funnel that closes over your head</h2>
<p>If Chumphon is famous for density, Sail Rock is famous for scale. The pinnacle breaks the surface — a fin of granite standing about 15 metres proud of the water — and drops to roughly 40 metres below. It is the one Gulf site where the schools stop being impressive and start being disorienting. Divers here report not the twenty or thirty barracuda they are used to nearer Koh Tao, but schools numbering in the hundreds, sometimes thousands, of chevron, yellowtail and pickhandle barracuda mixed with big-eye trevally, snapper and fusiliers. When one of those columns wraps around a diver, the silver wall is dense enough to blot out the boat, the surface, and the rest of the group.</p>
<ul>
<li><strong>Pinnacle profile</strong> — 15 m above the surface, dropping to ~40 m below; a satellite cluster of rocks sits to the west, tops at ~18 m.</li>
<li><strong>Signature school</strong> — chevron, yellowtail and pickhandle barracuda in the hundreds, plus the Gulf's biggest resident batfish school.</li>
<li><strong>The chimney</strong> — a vertical swim-through cutting through the rock, entered near 6 m and exited around 18 m; covered in depth in our <a href="/en/blogs/sail-rock-chimney-best-gulf-of-thailand-dive">Sail Rock chimney guide</a>.</li>
<li><strong>Big visitors</strong> — mackerel, jacks, tuna and, in season, the whale sharks that make Sail Rock one of Thailand's most reliable <a href="/en/blogs/bus-sized-whale-shark-koh-tao">whale shark sites</a>.</li>
</ul>
<p>The trade-off is that Sail Rock is open ocean. Visibility ranges from a murky few metres to a crystalline thirty, and it can change between two dives on the same day. Current arrives without much warning. That volatility is exactly what feeds the fish, so it is a feature, not a bug — but it is the reason buoyancy control matters more here than at any sheltered reef.</p>

<h2>Those teeth look like a threat. Here is why they are not.</h2>
<p>Up close, a metre-long barracuda is not a comforting animal. The jaw is underslung, the teeth are visible even when the mouth is shut, and the fish holds station with an unblinking, head-on stare that reads as menace. It is worth being blunt about the biology: the chevron barracuda is an apex reef predator with the equipment to do damage. It simply has no reason to point that equipment at a diver.</p>
<p>Recorded attacks on divers are vanishingly rare, and the ones that exist almost always involve a shiny lure, a speared fish, or a hand offered where it did not belong — a barracuda striking at a flash of metal it mistook for a fleeing baitfish. Left alone, a school treats a diver as scenery. The fish are curious rather than aggressive; approached without sudden lunges, they hold their distance and let the diver drift into the formation. It is the same counterintuitive lesson the Gulf keeps teaching, whether the animal in question is a <a href="/en/blogs/sea-snake-swims-toward-diver-rarely-bites">sea snake gliding straight at your mask</a> or a <a href="/en/blogs/great-hammerhead-face-charge-danger">hammerhead that fills the frame</a> and then turns away: the predator that looks like it wants to hurt you is, almost always, just checking you out.</p>

<h2>How to end up in the middle of the funnel</h2>
<p>The photograph everyone wants — the diver at the still centre of a spinning silver wall — is not about chasing the fish. It is about becoming furniture. Barracuda open a gap for anything that thrashes and close ranks around anything that hangs quietly, so the technique is almost embarrassingly passive.</p>
<ul>
<li><strong>Hover, do not swim.</strong> Neutral buoyancy and slow, minimal fin movement let the school reform around you instead of parting to flee.</li>
<li><strong>Keep your hands in.</strong> An extended arm reads as a lunge; a diver folded small reads as harmless. No touching, no pointing, no reaching for the shot.</li>
<li><strong>Slow your breathing.</strong> A blast of bubbles scatters the column. Long, quiet exhales keep the wall intact and your gas lasting at depth.</li>
<li><strong>Let them come to you.</strong> Drift into the edge of the school on the current and stop. Within a minute the gap usually seals over your head on its own.</li>
</ul>

<h2>When the silver storm actually shows up</h2>
<p>The barracuda are resident year-round — the schools are not a seasonal event the way the whale sharks are — but conditions decide whether you actually see them well. Through 2026 the western Gulf has run a long clear spell, with visibility peaking across the March-to-August window that underwater photographers have been calling the golden run of the year. August sits squarely inside the peak whale shark season at Sail Rock, which stretches roughly March to September, so a single day trip this month carries a genuine shot at the tornado and the bus-sized shadow in the same water.</p>
<p>Chumphon Pinnacle has also been fishier than usual lately: its resident marbled grouper population has grown noticeably in 2026, some individuals now nearly the length of a diver. And for anyone planning past the monsoon, the local wisdom holds that September and October often deliver the single best water of the year here, with visibility pushing past 40 metres once the winds settle.</p>
<p>Getting there is easy from the islands. A speedboat runs from Koh Samui to Sail Rock in about 50 minutes; a standard two-tank day trip departs the pier around 9am, serves lunch between dives, and has you back by early afternoon, typically for 4,650–4,950 baht with gear and transfers included. Chumphon Pinnacle is the longer haul at roughly 90 minutes by speedboat from Samui, or a shorter 45-minute run from Koh Tao itself, from about 5,150 baht for two dives.</p>

<h2>Chumphon or Sail Rock — which one to book first</h2>
<p>Both sites deliver the tornado, so the choice comes down to logistics and appetite for depth. Sail Rock is the easier day out: closer to Koh Samui and Koh Phangan, shallower on top, and forgiving enough that a freshly certified Advanced diver can enjoy the upper rock while the schools swirl overhead between 10 and 18 metres. It is also the more reliable whale shark bet, which is why it fills its boats first in season. Chumphon Pinnacle rewards the more experienced — the best fish density sits deeper, the current can be pushier, and the longer boat ride quietly filters out the casual crowd, part of the reason the big-fish action there stays so consistent from year to year. A diver with a dozen logged dives and steady air consumption will get the most out of Sail Rock; a diver chasing the densest possible wall of silver, comfortable at 30 metres and ideally breathing Nitrox, should point the boat at Chumphon. Plenty of visitors staying a few days simply do both on consecutive mornings and compare notes over lunch — and more than one leaves convinced the two tornadoes are not quite the same animal.</p>

<h2>Save it, and tag the buddy you would trust in the middle of it</h2>
<p>A barracuda tornado is one of those encounters that sounds invented until it is happening around your head — no cage, no bait, no danger to you at all, just a few thousand sharp-toothed predators deciding you are close enough to the rock to be part of the furniture. It belongs on the short list of Thai-water experiences worth booking a whole trip around, next to the whale sharks and the granite chimneys of the same two sites. Pin this one, message the dive buddy who owes you a trip, and pick your window. The storm is already turning out there.</p>

<h3>Sources</h3>
<ul>
<li><a href="https://www.padi.com/dive-site/thailand/sail-rock-3/" rel="nofollow">PADI — Sail Rock dive site reference</a></li>
<li><a href="https://www.divessi.com/en/mydiveguide/divesite/sail-rock-thailand-sailrock-prab-wreck-108489" rel="nofollow">SSI MyDiveGuide — Sail Rock, Thailand</a></li>
<li><a href="https://www.scubadiving.com/diving-with-schools-barracuda" rel="nofollow">Scuba Diving Magazine — Diving with schools of barracuda</a></li>
<li><a href="https://a-z-animals.com/animals/barracuda/" rel="nofollow">A-Z Animals — Barracuda facts and behaviour</a></li>
</ul>`
};

const th = {
  lang: 'th',
  title: 'พายุปลาสากเกาะเต่า มีจริงไหม แล้วอันตรายหรือเปล่า',
  slug: 'why-thousands-of-barracuda-circle-divers-th',
  excerpt: 'ฝูงปลาสากหลายร้อยตัวหมุนเป็นวงพายุล้อมนักดำน้ำที่ชุมพรพินนาเคิลกับหินใบเรือ เรื่องจริงหรือแค่คำเล่า แล้วฟันแหลม ๆ นั่นทำร้ายเราไหม',
  keywords: ['พายุปลาสาก เกาะเต่า','ชุมพรพินนาเคิล ดำน้ำ','หินใบเรือ ปลาสาก','ฝูงปลาสาก ดำน้ำ','ดำน้ำอ่าวไทย ยอดหินโดด','ปลาสากอันตรายไหม','จุดดำน้ำ Advanced เกาะเต่า','เดย์ทริปหินใบเรือ เกาะสมุย'],
  ogTitle: 'พายุปลาสากที่ชุมพรพินนาเคิลกับหินใบเรือ เรื่องจริง',
  ogDescription: 'ฝูงปลาสากหลายร้อยตัวหมุนเป็นวงเงินล้อมนักดำน้ำในอ่าวไทย แต่ไม่แตะตัวใครเลย ไปดูที่ไหน ลึกแค่ไหน แล้วทำไมถึงปลอดภัย',
  content: `<p>สัญญาณแรกคือเงาบนหัว ไม่ใช่เมฆ เพราะที่ความลึก 24 เมตรในอ่าวไทยแสงแดดแทบไม่ลงมาสะอาดขนาดนั้น แต่เป็นเพดานปลาที่กำลังเคลื่อนตัว หลายร้อยตัว ค่อย ๆ บีบวงหมุนอยู่เหนือยอดหิน ไม่ถึงนาทีฝูงก็ปิดวงจนครบ นักดำน้ำที่ลอยอยู่ตรงกลางเลยกลายเป็นคนที่ยืนอยู่ในกรวยเงินเป็น ๆ ที่หมุนวนไม่หยุดและไม่มีทีท่าจะไปไหน</p>

<p>นักดำน้ำไทยเรียกมันว่าพายุปลาสาก ภาพที่ออกมาดูเหมือนจัดฉาก แต่มันไม่ใช่</p>

<h2>พายุปลาสากมีจริง หรือแค่คำเล่าของร้านดำน้ำ</h2>
<p>มีจริง และเกิดที่ยอดหินใต้น้ำสองจุดในอ่าวไทยฝั่งตะวันตกอย่างเจาะจง คือชุมพรพินนาเคิลนอกเกาะเต่า กับหินใบเรือที่อยู่ระหว่างเกาะเต่ากับเกาะพะงัน ทั้งคู่เป็นเสาหินแกรนิตโดดเดี่ยวที่ผุดขึ้นจากน้ำลึก รอบตัวไม่มีอะไรให้ปลาหลบเลย ภูมิประเทศแบบนี้แหละคือกลไกทั้งหมด น้ำเปิดโล่งทุกด้านบีบให้กระแสน้ำพัดผ่านหิน กระแสน้ำพาแพลงก์ตอน แพลงก์ตอนล่อปลาเหยื่อ ปลาเหยื่อก็ล่อนักล่าที่ลอยรออยู่ในน้ำสีครามเป็นพัน ๆ ตัว</p>
<p>ตัวเอกของฉากนี้คือปลาสากลายเชฟรอน <em>Sphyraena qenie</em> ญาติสายฝูงของปลาสากยักษ์ที่ชอบอยู่ตัวเดียว พวกมันรวมกันเป็นหลักร้อยบางทีถึงหลักพัน และเมื่อฝูงบีบรูปทรงเหนือยอดหินมันจะหมุน เป็นเสาเงินระยิบระยับที่ช่างภาพเรียกว่าพายุด้วยเหตุผลชัดเจน นักชีววิทยาทางทะเลอธิบายพฤติกรรมเดียวกันแบบตรง ๆ ว่าเป็นการรวมฝูงอย่างมีระบบที่ช่วยให้ปลาแต่ละตัวปลอดภัยขึ้นและล่าเหยื่อได้ดีขึ้น แต่สำหรับคนที่ลอยอยู่กลางวง มันก็แค่เหมือนทะเลตัดสินใจจะหมุน</p>

<h2>ชุมพรพินนาเคิล ที่ความหนาแน่นของปลากลายเป็นสภาพอากาศ</h2>
<p>ห่างจากเกาะเต่าไปทางตะวันตกเฉียงเหนือราวสิบสองกิโลเมตร ชุมพรพินนาเคิลเป็นกลุ่มเสาหินแกรนิตที่กระจายอยู่บนพื้นทะเลกว้างราว 200 เมตร ยอดหลักอยู่ลึกจากผิวน้ำประมาณ 14 เมตร ส่วนเส���รอบ ๆ ลาดลงไปถึง 30 ถึง 36 เมตร แล้วค่อยเป็นพื้นทรายกับก้อนหินที่ลึกลงไปอีก ดอกไม้ทะเลสีชมพูสดปูพรมเต็มหินท่อนบน และไซต์นี้แน่นไปด้วยปลาตัวใหญ่จริง ๆ ทั้งปลาค้างคาว ปลาทรงเครื่อง ปลากะพง ปลาเก๋า และฝูงปลาสากประจำถิ่นที่วนอยู่แถวจุดที่นักดำน้ำเรียกกันว่าหินปลาสาก มักอยู่ระหว่าง 20 ถึง 30 เมตร</p>
<table>
<tr><th>ตัวชี้วัด</th><th>ค่า</th></tr>
<tr><td>ความลึกยอดหิน</td><td>~14 ม.</td></tr>
<tr><td>ความลึกใช้งาน</td><td>18–30 ม.</td></tr>
<tr><td>ลึกสุด</td><td>36 ม.+</td></tr>
<tr><td>ทัศนวิสัย</td><td>15–30 ม.</td></tr>
<tr><td>ระดับ</td><td>Advanced / ไนตรอกซ์</td></tr>
</table>
<p>ความลึกนี่แหละคือเหตุผลที่มันไม่ใช่ไดฟ์สำหรับสัปดาห์แรก การจะไปเจอฝูงปลาชุด ๆ ต้องลงไปอยู่ต่ำกว่า 18 เมตรพอสมควร แถมไซต์อยู่ห่างฝั่งมากพอที่กระแสน้ำจะแรงขึ้นเร็วและทัศนวิสัยเปลี่ยนได้ระหว่างไดฟ์ บัตร Advanced จึงเป็นพื้นขั้นต่ำที่สมเหตุสมผล และอากาศผสมไนตรอกซ์ช่วยซื้อเวลาก้นน้ำเพิ่ม เปลี่ยนการผ่านแบบรีบ ๆ ให้กลายเป็นการเจอฝูงจริง ๆ ใครกำลังชั่งใจว่าจะ<a href="/th/blogs/thailand-deepest-dive-wall-hin-muang">ดันคอร์สความลึกไปแค่ไหน</a>ก่อนทริปแบบนี้ ลองอ่านไว้ก่อน</p>

<h2>หินใบเรือ กรวยที่ปิดวงเหนือหัวเรา</h2>
<p>ถ้าชุมพรดังเรื่องความหนาแน่น หินใบเรือดังเรื่องขนาด ยอดหินโผล่พ้นผิวน้ำ เป็นครีบหินแกรนิตที่ตั้งสูงเหนือน้ำราว 15 เมตร แล้วดิ่งลงไปราว 40 เมตรใต้น้ำ นี่คือไซต์เดียวในอ่าวไทยที่ฝูงปลาเลิกแค่น่าประทับใจแล้วเริ่มทำให้งง นักดำน้ำที่นี่ไม่ได้เจอปลาสากยี่สิบสามสิบตัวแบบที่ชินใกล้ ๆ เกาะเต่า แต่เจอฝูงหลักร้อยบางทีหลักพัน ทั้งปลาสากลายเชฟรอน หางเหลือง และพิกแฮนเดิล ปนกับปลาทรงเครื่องตาโต ปลากะพง และปลาสีกุน เมื่อเสาปลาพวกนี้พันรอบตัวนักดำน้ำ กำแพงเงินก็หนาพอจะบังเรือ บังผิวน้ำ และบังเพื่อนที่เหลือทั้งกลุ่ม</p>
<ul>
<li><strong>โครงยอดหิน</strong> — สูงเหนือน้ำ 15 ม. ดิ่งลงราว 40 ม. ใต้น้ำ มีกลุ่มหินบริวารทางทิศตะวันตก ยอดอยู่ราว 18 ม.</li>
<li><strong>ฝูงประจำตัว</strong> — ปลาสากเชฟรอน หางเหลือง และพิกแฮนเดิลหลักร้อย บวกฝูงปลาค้างคาวที่ใหญ่ที่สุดในอ่าวไทย</li>
<li><strong>ปล่องหิน</strong> — ช่องลอดแนวดิ่งทะลุก้อนหิน เข้าที่ราว 6 ม. ออกที่ราว 18 ม. เจาะไว้แล้วใน<a href="/th/blogs/sail-rock-chimney-best-gulf-of-thailand-dive">คู่มือปล่องหินใบเรือ</a></li>
<li><strong>แขกตัวใหญ่</strong> — ปลาทู ปลาสีกุน ปลาทูน่า และในฤดูกาลก็มีฉลามวาฬที่ทำให้หินใบเรือเป็นหนึ่งใน<a href="/th/blogs/bus-sized-whale-shark-koh-tao">จุดเจอฉลามวาฬ</a>ที่ลุ้นได้สุดของไทย</li>
</ul>
<p>ข้อแลกเปลี่ยนคือหินใบเรืออยู่กลางทะเลเปิด ทัศนวิสัยมีตั้งแต่ขุ่นเหลือไม่กี่เมตรไปจนถึงใสสามสิบเมตร และเปลี่ยนได้ระหว่างสองไดฟ์ในวันเดียว กระแสน้ำมาโดยไม่บอกล่วงหน้าเท่าไร ความแปรปรวนนี่แหละที่เลี้ยงฝูงปลา มันจึงเป็นข้อดีไม่ใช่ข้อเสีย แต่ก็เป็นเหตุผลว่าทำไมการทรงตัวถึงสำคัญที่นี่มากกว่าแนวปะการังที่กำบังลมทุกที่</p>

<h2>ฟันพวกนั้นดูน่ากลัว นี่คือเหตุผลว่าทำไมมันไม่เป็นไร</h2>
<p>ในระยะประชิด ปลาสากยาวหนึ่งเมตรไม่ใช่สัตว์ที่ทำให้สบายใจ ขากรรไกรยื่น ฟันโผล่ให้เห็นแม้ปิดปาก แล้วมันก็ลอยนิ่งจ้องตรงหน้าไม่กะพริบตาแบบที่อ่านออกว่าข่มขู่ พูดกันตรง ๆ เรื่องชีววิทยาเลยว่า ปลาสากเชฟรอนคือนักล่าอันดับต้นของแนวหินที่มีอาวุธพร้อมทำร้าย มันแค่ไม่มีเหตุผลจะเอาอาวุธนั้นมาเล็งนักดำน้ำ</p>
<p>บันทึกการโจมตีนักดำน้ำแทบไม่มีเลย และเท่าที่มีก็มักเกี่ยวกับเหยื่อล่อวาววับ ปลาที่เพิ่งถูกยิงหอก หรือมือที่ยื่นไปในที่ที่ไม่ควร ปลาสากพุ่งเข้าหาแสงวับของโลหะเพราะเข้าใจผิดว่าเป็นปลาเหยื่อกำลังหนี ถ้าปล่อยไว้เฉย ๆ ฝูงปลาถือว่านักดำน้ำเป็นแค่ฉากหลัง พวกมันอยากรู้อยากเห็นมากกว่าจะก้าวร้าว เข้าหาช้า ๆ ไม่พรวดพราด มันก็รักษาระยะและปล่อยให้เราลอยเข้าไปในฝูงเอง นี่คือบทเรียนย้อนความรู้สึกแบบเดียวกับที่อ่าวไทยสอนซ้ำ ๆ ไม่ว่าตัวที่ว่าจะเป็น<a href="/th/blogs/sea-snake-swims-toward-diver-rarely-bites">งูทะเลที่เลื้อยตรงมาที่หน้ากาก</a> หรือ<a href="/th/blogs/great-hammerhead-face-charge-danger">ฉลามหัวค้อนที่เต็มเฟรม</a>แล้วหักหลบไป นักล่าที่ดูเหมือนอยากทำร้ายเรา เกือบทุกครั้งแค่มาส่องดูเฉย ๆ</p>

<h2>วิธีไปยืนอยู่กลางกรวยพายุ</h2>
<p>ภาพที่ทุกคนอยากได้ คือนักดำน้ำที่นิ่งอยู่ใจกลางกำแพงเงินหมุนวน ไม่ได้มาจากการไล่ตามปลา แต่มาจากการทำตัวเป็นเฟอร์นิเจอร์ ปลาสากเปิดช่องให้ทุกอย่างที่ดิ้น และปิดวงล้อมทุกอย่างที่ลอยนิ่ง เทคนิคเลยเฉื่อยชาแบบน่าขำ</p>
<ul>
<li><strong>ลอยนิ่ง อย่าว่าย</strong> — ทรงตัวเป็นกลางและขยับตีนกบช้า ๆ น้อย ๆ ทำให้ฝูงกลับมารวมรอบตัวแทนที่จะแหวกหนี</li>
<li><strong>เก็บมือไว้</strong> — แขนที่ยื่นออกอ่านได้ว่าพุ่งเข้าหา ตัวที่ขดเล็ก ๆ อ่านได้ว่าไม่มีพิษภัย ไม่แตะ ไม่ชี้ ไม่เอื้อมไปหาช็อต</li>
<li><strong>ผ่อนลมหายใจ</strong> — ฟองอากาศพรวดเดียวทำเสาปลากระจาย หายใจออกยาว ๆ เงียบ ๆ ช่วยรักษากำแพงไว้และยืดอากาศตอนอยู่ลึก</li>
<li><strong>ให้มันเข้ามาหาเอง</strong> — ลอยตามกระแสน้ำเข้าไปที่ขอบฝูงแล้วหยุด ไม่ถึงนาทีช่องมักปิดเหนือหัวเราเอง</li>
</ul>

<h2>พายุเงินโผล่มาตอนไหนกันแน่</h2>
<p>ปลาสากอยู่ประจำถิ่นตลอดปี ฝูงไม่ใช่เหตุการณ์ตามฤดูแบบฉลามวาฬ แต่สภาพน้ำต่างหากที่ตัดสินว่าเราจะได้เห็นชัดไหม ตลอดปี 2026 อ่าวไทยฝั่งตะวันตกน้ำใสยาวนาน ทัศนวิสัยพีคช่วงมีนาคมถึงสิงหาคมที่ช่างภาพใต้น้ำเรียกกันว่าช่วงทองของปี สิงหาคมอยู่กลางฤดูฉลามวาฬของหินใบเรือพอดี ซึ่งกินเวลาราวมีนาคมถึงกันยายน เดย์ทริปวันเดียวเดือนนี้จึงมีลุ้นทั้งพายุปลาสากและเงาตัวเท่ารถบัสในน้ำเดียวกัน</p>
<p>ช่วงหลังชุมพรพินนาเคิลก็ปลาชุกกว่าเดิม ประชากรปลาเก๋าลายหินอ่อนประจำถิ่นเพิ่มขึ้นชัดในปี 2026 บางตัวยาวเกือบเท่านักดำน้ำ และสำหรับคนวางแผนหลังหมดมรสุม คนพื้นที่รู้กันว่ากันยายนกับตุลาคมมักให้น้ำที่ดีที่สุดของปีที่นี่ ทัศนวิสัยดันเกิน 40 เมตรเมื่อลมสงบ</p>
<p>การเดินทางจากเกาะไม่ยาก สปีดโบ๊ตจากเกาะสมุยถึงหินใบเรือใช้เวลาราว 50 นาที เดย์ทริปสองไดฟ์มาตรฐานออกจากท่าราวเก้าโมงเช้า เสิร์ฟมื้อกลางวันระหว่างไดฟ์ แล้วพากลับช่วงบ่ายต้น ๆ ราคาปกติ 4,650 ถึง 4,950 บาทรวมอุปกรณ์และรถรับส่ง ส่วนชุมพรพินนาเคิลไกลกว่า ราว 90 นาทีโดยสปีดโบ๊ตจากสมุย หรือสั้นกว่าเหลือ 45 นาทีถ้าออกจากเกาะเต่าเอง เริ่มราว 5,150 บาทสำหรับสองไดฟ์</p>

<h2>ชุมพรหรือหินใบเรือ ควรจองที่ไหนก่อน</h2>
<p>ทั้งสองไซต์มีพายุปลาสากให้เจอ การเลือกเลยขึ้นอยู่กับการเดินทางและว่ารับความลึกได้แค่ไหน หินใบเรือเป็นทริปที่ง่ายกว่า ใกล้เกาะสมุยและเกาะพะงันมากกว่า ยอดตื้นกว่า และให้อภัยพอที่นักดำน้ำ Advanced ป้ายแดงจะเพลินกับหินท่อนบนได้ ขณะที่ฝูงปลาวนอยู่เหนือหัวที่ราว 10 ถึง 18 เมตร แถมเป็นตัวเลือกที่ลุ้นฉลามวาฬได้แน่กว่า เรือเลยเต็มก่อนในฤดูกาล ส่วนชุมพรพินนาเคิลเหมาะกับคนช่ำชองกว่า ปลาชุดที่สุดอยู่ลึกกว่า กระแสน้ำแรงกว่า และเรือที่นั่งนานกว่าช่วยกรองคนมาเล่น ๆ ออกไปเงียบ ๆ ส่วนหนึ่งเลยทำให้ฝูงปลาตัวใหญ่ที่นั่นสม่ำเสมอปีต่อปี ใครมีสักสิบไดฟ์ในล็อกและคุมอากาศได้นิ่งจะได้จากหินใบเรือมากสุด ส่วนคนที่ตามหากำแพงเงินที่หนาที่สุด สบายที่ 30 เมตรและมีไนตรอกซ์ยิ่งดี ให้หันหัวเรือไปชุมพร หลายคนที่พักหลายวันก็ดำทั้งสองที่ในเช้าติดกันแล้วมานั่งเทียบกันตอนมื้อเที่ยง</p>

<h2>เซฟไว้ แล้วแท็กบัดดี้ที่ไว้ใจได้ให้อยู่กลางวงด้วยกัน</h2>
<p>พายุปลาสากเป็นหนึ่งในการเจอที่ฟังดูเหมือนแต่งขึ้นจนกว่ามันจะเกิดรอบหัวเราจริง ๆ ไม่มีกรง ไม่มีเหยื่อล่อ ไม่มีอันตรายต่อเราเลย แค่นักล่าฟันแหลมสองสามพันตัวตัดสินใจว่าเราเข้าใกล้หินพอจะนับเป็นส่วนหนึ่งของฉาก มันควรอยู่ในลิสต์สั้น ๆ ของประสบการณ์ทะเลไทยที่คุ้มจะจองทั้งทริปเพื่อไป เคียงข้างฉลามวาฬและปล่องหินแกรนิตของสองไซต์เดียวกัน ปักหมุดอันนี้ไว้ ทักบัดดี้ที่ติดทริปเราอยู่ แล้วเลือกช่วงเวลาของคุณ พายุกำลังหมุนรออยู่ตรงนั้นแล้ว</p>

<h3>แหล่งอ้างอิง</h3>
<ul>
<li><a href="https://www.padi.com/dive-site/thailand/sail-rock-3/" rel="nofollow">PADI — ข้อมูลไซต์ดำน้ำหินใบเรือ</a></li>
<li><a href="https://www.divessi.com/en/mydiveguide/divesite/sail-rock-thailand-sailrock-prab-wreck-108489" rel="nofollow">SSI MyDiveGuide — หินใบเรือ ประเทศไทย</a></li>
<li><a href="https://www.scubadiving.com/diving-with-schools-barracuda" rel="nofollow">Scuba Diving Magazine — ดำน้ำกับฝูงปลาสาก</a></li>
<li><a href="https://a-z-animals.com/animals/barracuda/" rel="nofollow">A-Z Animals — ข้อมูลและพฤติกรรมปลาสาก</a></li>
</ul>`
};

const cn = {
  lang: 'cn',
  title: '涛岛梭鱼风暴是真的吗？会咬人吗',
  slug: 'why-thousands-of-barracuda-circle-divers-cn',
  excerpt: '春蓬尖峰和帆船岩上，数百条尖梭鱼旋成银色风暴把潜水员团团围住，却从不出手。这景象是真是假？那口尖牙又危不危险？',
  keywords: ['涛岛 梭鱼风暴','春蓬尖峰 潜水','帆船岩 尖梭鱼','梭鱼群 潜水','泰国湾 海底尖顶','梭鱼会咬人吗','涛岛 进阶潜点','苏梅岛 帆船岩 船潜'],
  ogTitle: '春蓬尖峰与帆船岩的梭鱼风暴，是真的',
  ogDescription: '数百条尖梭鱼在泰国湾旋成银色漏斗把潜水员包住，却从不出手。去哪看、下潜多深、为什么安全，一次说清。',
  content: `<p>最先出现的是头顶的一片阴影。不是云——在二十四米深的泰国湾，阳光很少能这么干净地穿下来——而是一层正在移动的鱼的天花板，几百条，在尖峰上方慢慢收拢成旋转。不到一分钟，鱼群就把圈合上了。悬停在正中央的潜水员，此刻就站在一个不停旋转、丝毫没有离开意思的活银色漏斗里。</p>

<p>泰国潜水员给它起了个名字：梭鱼风暴。照片看着像摆拍，其实不是。</p>

<h2>梭鱼风暴是真的，还是潜店的传说</h2>
<p>是真的，而且只发生在泰国湾西侧两座特定的海底尖顶——涛岛外海的春蓬尖峰，以及位于涛岛与帕岸岛之间的帆船岩。两处都是从深水里孤零零拔起的花岗岩塔，四周空无一物，鱼想躲都没地方躲。这种地形就是全部的机关。四面开阔的水把水流逼着扫过岩石，水流带来浮游生物，浮游生物引来饵鱼，饵鱼又把成千上万条悬在蓝水里的掠食者引了过来。</p>
<p>这场戏的主角是尖梭鱼 <em>Sphyraena qenie</em>，独居大梭鱼的群居表亲。它们成百上千地聚在一起，当鱼群在尖顶上方收紧队形，就会旋转成一根闪亮的银柱——摄影师管它叫风暴，理由很充分。海洋生物学家把同样的行为说得更直白：一种有组织的聚群，让每条鱼都更安全、捕猎也更高效。可对于漏斗正中的潜水员来说，那就只是大海决定开始打转了。</p>

<h2>春蓬尖峰：鱼的密度变成了天气</h2>
<p>在涛岛西北约十二公里处，春蓬尖峰是一簇花岗岩塔，散布在约两百米宽的海床上。主峰顶距水面约十四米，四周的石柱下探到三十到三十六米，再往下是沙地和乱石。上层岩壁铺满鲜艳的粉色海葵，这里大鱼是真的多——蝙蝠鱼、鲹鱼、笛鲷、石斑，还有常驻的梭鱼群，它们在潜水员称作"梭鱼岩"的地方巡游，通常在二十到三十米之间。</p>
<table>
<tr><th>指标</th><th>数值</th></tr>
<tr><td>峰顶深度</td><td>约14米</td></tr>
<tr><td>常用深度</td><td>18–30米</td></tr>
<tr><td>最大深度</td><td>36米+</td></tr>
<tr><td>能见度</td><td>15–30米</td></tr>
<tr><td>等级</td><td>进阶／高氧</td></tr>
</table>
<p>深度正是它不适合下水第一周的原因。要看到精彩的鱼群，就得在十八米以下待上一阵，而且此处离岸够远，水流说起就起，能见度在两支潜水之间都会变。进阶潜水执照是合理的底线，而高氧（EANx）能换来更多的底部时间，把匆匆一瞥变成真正的相遇。出发这样一趟前，不妨先看看<a href="/cn/blogs/thailand-deepest-dive-wall-hin-muang">深度训练该推到哪一步</a>。</p>

<h2>帆船岩：在你头顶合拢的漏斗</h2>
<p>如果说春蓬以密度出名，帆船岩则以规模出名。尖顶露出水面——一片高出水面约十五米的花岗岩鳍——再下探到水下约四十米。这是泰国湾唯一一处鱼群不再只是壮观、而是开始让人迷失方向的潜点。这里的潜水员看到的，不是涛岛附近习以为常的二三十条梭鱼，而是成百上千条尖梭鱼、黄尾梭鱼和斑条梭鱼，混着大眼鲹、笛鲷和乌尾鮗。当其中一根银柱裹住潜水员时，那堵银墙密得足以遮住船、遮住水面，也遮住同组其他人。</p>
<ul>
<li><strong>尖顶轮廓</strong>——水面之上15米，下探至水下约40米；西侧有一簇卫星礁石，顶部约在18米。</li>
<li><strong>招牌鱼群</strong>——尖梭、黄尾梭、斑条梭鱼成百上千，外加泰国湾最大的常驻蝙蝠鱼群。</li>
<li><strong>烟囱</strong>——一条穿透岩石的垂直穿洞，约6米进、约18米出；详见我们的<a href="/cn/blogs/sail-rock-chimney-best-gulf-of-thailand-dive">帆船岩烟囱指南</a>。</li>
<li><strong>大块头访客</strong>——鲭鱼、鲹鱼、金枪鱼，以及旺季时让帆船岩成为泰国最靠谱<a href="/cn/blogs/bus-sized-whale-shark-koh-tao">鲸鲨潜点</a>之一的鲸鲨。</li>
</ul>
<p>代价是帆船岩地处外海。能见度从浑浊的几米到清透的三十米不等，同一天两支潜水之间就能变。水流来得几乎没有预兆。可正是这份多变在喂养鱼群，所以它是特色而非缺陷——但也正因如此，这里对中性浮力的要求，比任何一处避风的珊瑚礁都高。</p>

<h2>那口尖牙看着像威胁，其实不是</h2>
<p>凑近看，一条一米长的梭鱼算不上让人安心的动物。下颌前突，闭着嘴也能看见牙，它一动不动、正面直视、眼睛不眨，那副样子读起来就是威胁。生物学上不妨说白：尖梭鱼是礁区顶级掠食者，装备齐全，能造成伤害。它只是没有理由把这套装备对准潜水员。</p>
<p>有记录的梭鱼袭击潜水员极其罕见，仅有的几起也几乎都牵涉到闪亮的假饵、刚被叉中的鱼，或伸到不该伸的地方的手——梭鱼冲向的是它误当成逃窜饵鱼的那一抹金属反光。不去招惹，鱼群就把潜水员当成布景。它们是好奇多过好斗；只要不猛地扑上去，它们会保持距离，任由潜水员漂进队形里。这正是泰国湾反复教的那条反直觉的道理，无论对面是<a href="/cn/blogs/sea-snake-swims-toward-diver-rarely-bites">径直游向你面镜的海蛇</a>，还是<a href="/cn/blogs/great-hammerhead-face-charge-danger">占满取景框</a>随后转身的双髻鲨：那个看起来想伤害你的掠食者，几乎每一次，都只是来看看你而已。</p>

<h2>怎样才能站进漏斗正中</h2>
<p>人人都想要的那张照片——潜水员静立于旋转银墙的正中——靠的不是追鱼，而是把自己变成家具。梭鱼会为一切扑腾的东西让出缺口，也会在一切安静悬停的东西周围合拢，所以技巧被动得近乎好笑。</p>
<ul>
<li><strong>悬停，别游动。</strong>中性浮力加上缓慢、极小的踢动，让鱼群围着你重新合拢，而不是分开逃开。</li>
<li><strong>把手收好。</strong>伸出的手臂读起来像扑击；缩成一小团则读起来无害。不碰、不指、不为拍照去够。</li>
<li><strong>放慢呼吸。</strong>一串猛冒的气泡会把鱼柱冲散。长而安静的呼气既保住那堵墙，也让你在深处的气用得更久。</li>
<li><strong>让它们自己过来。</strong>顺流漂到鱼群边缘再停下。通常不到一分钟，缺口就会自己在你头顶合上。</li>
</ul>

<h2>银色风暴到底什么时候登场</h2>
<p>梭鱼常年驻守——鱼群不像鲸鲨那样是季节性事件——但能否看清，要看水况。整个2026年，泰国湾西侧经历了一段长长的清澈期，能见度在三月到八月这段被水下摄影师称作"年度黄金期"的窗口里达到顶峰。八月正落在帆船岩鲸鲨旺季的正中，那个季节大约从三月延续到九月，所以本月一趟单日行程，很有机会在同一片水里既遇上梭鱼风暴，又撞见那道公交车大小的影子。</p>
<p>春蓬尖峰近来鱼也比往常多：常驻的云纹石斑种群在2026年明显增长，有些个体如今几乎和潜水员一样长。而对于打算在季风之后出行的人，本地经验是：九、十月往往带来这里全年最好的水，风一停，能见度就能突破四十米。</p>
<p>从各岛过去都不难。快艇从苏梅岛到帆船岩约五十分钟；标准的两支气瓶单日行程约上午九点从码头出发，两潜之间供午餐，下午稍早就能回到岸上，通常4,650到4,950铢，含装备与接送。春蓬尖峰路更远，从苏梅乘快艇约九十分钟，若从涛岛本岛出发则短至四十五分钟，两潜约5,150铢起。</p>

<h2>春蓬还是帆船岩，先订哪一个</h2>
<p>两处都能给你梭鱼风暴，所以取舍在于交通和你对深度的胃口。帆船岩这一趟更省心：离苏梅岛和帕岸岛都更近，顶部更浅，也更宽容，刚拿到进阶执照的潜水员就能在上层岩石上尽兴，而鱼群在头顶十到十八米处打转。它也是更靠谱的鲸鲨之选，所以旺季里船位总是先满。春蓬尖峰则更适合老手——最密的鱼群在更深处，水流更冲，更长的船程悄悄滤掉了随便玩玩的人，这也是那里大鱼场面年复一年稳定的部分原因。有十来支潜水记录、耗气平稳的人，从帆船岩收获最多；一心想要最厚那堵银墙、在三十米自在、最好还背着高氧的人，就把船头对准春蓬。不少停留几天的访客干脆两处都去，连着两个上午下水，午饭时再互相比对。</p>

<h2>收藏它，再@上那个你敢和他一起待在正中央的潜伴</h2>
<p>梭鱼风暴属于那种听起来像编出来、直到它真的在你头顶发生的相遇——没有笼子，没有诱饵，对你毫无危险，只是几千条尖牙掠食者认定你离岩石够近，够格成为布景的一部分。它值得进入那份短短的泰国海域清单，与同样两处潜点的鲸鲨和花岗岩烟囱并列，为它订上一整趟行程也不亏。把这篇钉起来，去戳那个还欠你一趟潜水的潜伴，选好你的窗口。风暴，已经在那儿转起来了。</p>

<h3>参考来源</h3>
<ul>
<li><a href="https://www.padi.com/dive-site/thailand/sail-rock-3/" rel="nofollow">PADI — 帆船岩潜点资料</a></li>
<li><a href="https://www.divessi.com/en/mydiveguide/divesite/sail-rock-thailand-sailrock-prab-wreck-108489" rel="nofollow">SSI MyDiveGuide — 泰国帆船岩</a></li>
<li><a href="https://www.scubadiving.com/diving-with-schools-barracuda" rel="nofollow">Scuba Diving 杂志 — 与梭鱼群同潜</a></li>
<li><a href="https://a-z-animals.com/animals/barracuda/" rel="nofollow">A-Z Animals — 梭鱼资料与行为</a></li>
</ul>`
};

const ja = {
  lang: 'ja',
  title: 'タオ島のバラクーダの嵐は本当？噛まれない理由',
  slug: 'why-thousands-of-barracuda-circle-divers-ja',
  excerpt: 'チュンポンピナクルとセイルロックで、数百匹のバラクーダが銀の渦になってダイバーを取り囲む。噂は本物なのか、あの鋭い歯は危なくないのか。',
  keywords: ['タオ島 バラクーダ 嵐','チュンポンピナクル ダイビング','セイルロック バラクーダ','バラクーダ 群れ ダイビング','タイランド湾 ピナクル','バラクーダ 危険','タオ島 アドバンス ポイント','サムイ島 セイルロック ボートダイブ'],
  ogTitle: 'チュンポンピナクルとセイルロックのバラクーダの嵐は本物',
  ogDescription: '数百匹のバラクーダがタイランド湾で銀の漏斗となりダイバーを包む。でも誰も噛まれない。どこで、何メートルで、なぜ安全か。',
  content: `<p>最初の兆しは、頭上の影です。雲ではありません。水深24メートルのタイランド湾では、太陽の光がそこまできれいに届くことは少ないからです。それは動く魚の天井でした。数百匹が、ピナクルの上でゆっくりと回転しながら輪を狭めていきます。一分もしないうちに群れは輪を閉じ、その真ん中にホバリングするダイバーは、回り続けて去る気配のない、生きた銀の漏斗の中に立っていました。</p>

<p>タイのダイバーはこれをバラクーダの嵐と呼びます。写真はやらせのように見えますが、そうではありません。</p>

<h2>バラクーダの嵐は本物か、ダイブショップの言い伝えか</h2>
<p>本物です。しかもタイランド湾西部の、二つの決まった海底ピナクルでしか起きません。タオ島沖のチュンポンピナクルと、タオ島とパンガン島のあいだにあるセイルロックです。どちらも深い海から孤立して立つ花崗岩の塔で、まわりに魚が隠れられるものは何もありません。この地形こそが仕掛けのすべてです。四方の開けた海が潮を岩へと押し流し、潮がプランクトンを運び、プランクトンが小魚を呼び、小魚が青い海に何千と漂う捕食者を呼び寄せます。</p>
<p>主役はカマス、正確にはチェブロン・バラクーダ <em>Sphyraena qenie</em> です。単独で暮らすオオカマスの、群れる従兄弟にあたります。数百から時に数千で集まり、ピナクルの上で隊形を締めると回転します。写真家が嵐と呼ぶのももっともな、きらめく銀の柱です。海洋生物学者はもっと素っ気なく、これを組織立った群れと説明します。一匹ずつの安全を高め、狩りの効率も上げる行動だと。けれども漏斗の真ん中にいるダイバーには、ただ海が回り始めたようにしか見えません。</p>

<h2>チュンポンピナクル、魚の密度が天気になる場所</h2>
<p>タオ島の北西およそ12キロ。チュンポンピナクルは、およそ200メートルの海底に散らばる花崗岩の塔の集まりです。主峰の頂は水面下およそ14メートル、まわりの柱は30から36メートルまで落ち込み、その下は砂と岩塊になります。上部の岩には鮮やかなピンクのイソギンチャクが敷き詰められ、ここは本当に大きな魚が濃い。ツバメウオ、ギンガメアジ、フエダイ、ハタ、そして常駐のバラクーダの群れが、ダイバーがバラクーダロックと呼ぶ場所を、たいてい20から30メートルで巡回しています。</p>
<table>
<tr><th>項目</th><th>値</th></tr>
<tr><td>頂の深度</td><td>約14m</td></tr>
<tr><td>実用深度</td><td>18〜30m</td></tr>
<tr><td>最大深度</td><td>36m以上</td></tr>
<tr><td>透明度</td><td>15〜30m</td></tr>
<tr><td>レベル</td><td>アドバンス／ナイトロックス</td></tr>
</table>
<p>この深さが、初週のダイブではない理由です。見応えのある魚の群れに出会うには18メートルより下でしばらく過ごす必要があり、しかも沖に十分離れているので潮は一気に強まり、透明度は本と本のあいだで変わります。アドバンスの資格が妥当な下限で、ナイトロックスは底時間を延ばし、慌ただしい通過を本物の遭遇に変えてくれます。こうしたトリップの前に、<a href="/ja/blogs/thailand-deepest-dive-wall-hin-muang">深度のトレーニングをどこまで進めるか</a>を読んでおくとよいでしょう。</p>

<h2>セイルロック、頭上で閉じる漏斗</h2>
<p>チュンポンが密度で名高いなら、セイルロックは規模で名高い。ピナクルは水面を突き破り、水面上およそ15メートルの花崗岩のヒレとして立ち、水面下およそ40メートルまで落ちます。タイランド湾で唯一、魚の群れが見事さを通り越して方向感覚を奪いにかかるポイントです。ここでダイバーが見るのは、タオ島近くで見慣れた二、三十匹のカマスではありません。数百、時に数千のチェブロン、キイロホソカマス、オオメカマスが、ギンガメアジ、フエダイ、タカサゴと混じります。その柱の一つがダイバーを包むと、銀の壁はボートも水面も、同じグループの仲間さえも覆い隠すほど密になります。</p>
<ul>
<li><strong>ピナクルの姿</strong> — 水面上15m、水面下およそ40mまで。西側に衛星のような岩の群れがあり、頂は約18m。</li>
<li><strong>看板の群れ</strong> — チェブロン、キイロ、オオメカマスが数百規模。加えてタイランド湾最大の常駐ツバメウオの群れ。</li>
<li><strong>チムニー</strong> — 岩を貫く縦のスイムスルー。約6mで入り約18mで抜けます。詳しくは<a href="/ja/blogs/sail-rock-chimney-best-gulf-of-thailand-dive">セイルロックのチムニー解説</a>で。</li>
<li><strong>大物の来訪者</strong> — サバ、アジ、マグロ、そしてシーズンにはセイルロックをタイ屈指の<a href="/ja/blogs/bus-sized-whale-shark-koh-tao">ジンベエザメのポイント</a>にするジンベエザメ。</li>
</ul>
<p>代償として、セイルロックは外洋です。透明度は濁った数メートルから澄んだ30メートルまで幅があり、同じ日の二本のあいだでも変わります。潮は前触れもなくやってきます。けれどもその移ろいこそが魚を養うので、これは欠点ではなく持ち味です。ただ、どんな風裏のリーフよりも中性浮力が問われる理由でもあります。</p>

<h2>あの歯は脅しに見える。でも脅しではない理由</h2>
<p>間近で見ると、体長1メートルのカマスは安心できる相手ではありません。下あごは前に突き出し、口を閉じても歯が見え、まばたきもせず正面から見据えて動かない姿は、まさに威嚇に読めます。生物学の話ははっきり言いましょう。チェブロン・バラクーダはリーフの頂点捕食者で、傷を負わせる装備をそなえています。ただ、その装備をダイバーに向ける理由がないだけです。</p>
<p>ダイバーへの襲撃の記録はごくわずかで、あるものもほぼ必ず、光るルアーや、突いたばかりの魚や、場違いに差し出された手が絡んでいます。カマスは、逃げる小魚と見まちがえた金属のきらめきに突っ込むのです。放っておけば、群れはダイバーを背景として扱います。攻撃的というより好奇心が勝ち、急に飛びかからなければ距離を保ち、ダイバーが隊形へ漂い込むのを許します。これはタイランド湾がくり返し教える、直感に反する教訓と同じです。相手が<a href="/ja/blogs/sea-snake-swims-toward-diver-rarely-bites">マスクへまっすぐ泳いでくるウミヘビ</a>でも、<a href="/ja/blogs/great-hammerhead-face-charge-danger">画面を埋め尽くして向きを変えるハンマーヘッド</a>でも、傷つけたがっているように見える捕食者は、ほとんどの場合、ただこちらを確かめているだけなのです。</p>

<h2>漏斗の真ん中に立つには</h2>
<p>誰もが欲しがるあの一枚、回る銀の壁の真ん中で静止するダイバーの写真は、魚を追って撮るものではありません。自分が家具になることで撮るものです。カマスはばたつくものにはすき間を開け、静かに漂うもののまわりでは隊列を閉じます。だから技術は、笑ってしまうほど受け身です。</p>
<ul>
<li><strong>泳がず、ホバリングする。</strong> 中性浮力とゆっくり最小限のフィンで、群れは逃げて割れる代わりにあなたを囲んで組み直します。</li>
<li><strong>手はしまう。</strong> 伸ばした腕は突進に読め、小さく縮めた体は無害に読めます。触れない、指さない、写真のために手を伸ばさない。</li>
<li><strong>呼吸をゆるめる。</strong> 一気の泡は魚の柱を散らします。長く静かな吐き出しが壁を保ち、深場でのエアも長持ちさせます。</li>
<li><strong>向こうから来させる。</strong> 潮に乗って群れの縁まで漂い、止まる。たいてい一分とたたずに、すき間は頭上でひとりでに閉じます。</li>
</ul>

<h2>銀の嵐が実際に現れるのはいつか</h2>
<p>カマスは一年じゅう居着いています。群れはジンベエザメのような季節の出来事ではありません。ただ、よく見えるかどうかはコンディション次第です。2026年を通してタイランド湾西部は長い澄んだ時期が続き、透明度は3月から8月という、水中写真家が今年の黄金期と呼ぶ窓でピークを迎えました。8月はセイルロックのジンベエザメのハイシーズン、おおむね3月から9月のちょうど真ん中にあたります。ですから今月の日帰り一本にも、同じ海でバラクーダの嵐とバスほどの影の両方に出会える現実的なチャンスがあります。</p>
<p>チュンポンピナクルも近ごろは例年より魚が濃い。常駐のマーブルドグルーパーの個体群が2026年に目に見えて増え、いまや一部はダイバーとほぼ同じ長さです。そしてモンスーンの後を考える人へ。地元の知恵では、9月と10月がここで一年で最良の水をもたらすことが多く、風が収まれば透明度は40メートルを超えます。</p>
<p>島からのアクセスは楽です。スピードボートでサムイ島からセイルロックまで約50分。標準の2本の日帰りは午前9時ごろ桟橋を出て、2本のあいだに昼食を出し、昼過ぎには戻ります。ふつうは器材と送迎込みで4,650〜4,950バーツです。チュンポンピナクルはもっと遠く、サムイからスピードボートで約90分、タオ島からなら45分と短く、2本で約5,150バーツからです。</p>

<h2>チュンポンかセイルロックか、先に予約するなら</h2>
<p>どちらのポイントでも嵐には出会えるので、選ぶ基準はアクセスと深度への意欲になります。セイルロックのほうが楽な一日です。サムイ島やパンガン島から近く、上部が浅く、アドバンスを取りたてのダイバーでも上の岩を楽しめるほど寛容で、その頭上10から18メートルで群れが渦を巻きます。ジンベエザメの確率も高いほうで、だからシーズンには船が先に埋まります。チュンポンピナクルは経験者向きです。最も濃い魚は深く、潮は強めで、長い船旅が気軽な層を静かにふるい落とす。そのあたりが、あの大物の見応えが年ごとに安定している理由の一つでもあります。ログが十数本、エアの消費が安定した人はセイルロックで一番得をし、できるだけ厚い銀の壁を求め、30メートルで落ち着け、できればナイトロックスを吸う人はチュンポンへ舳先を向けましょう。数日滞在する人の多くは、二つの朝に続けて両方を潜り、昼食の席で見比べます。</p>

<h2>保存して、真ん中で一緒にいられる相棒をタグづけしよう</h2>
<p>バラクーダの嵐は、頭上で実際に起きるまでは作り話に聞こえる、そんな遭遇のひとつです。ケージもなく、餌づけもなく、あなたへの危険もいっさいなく、ただ数千の鋭い歯の捕食者が、あなたを岩に十分近い家具の一部と見なしただけ。同じ二つのポイントのジンベエザメや花崗岩のチムニーと並んで、まるまる一トリップを組む価値のある、タイの海の短いリストに入ります。これをピン留めして、トリップを一本借りのある相棒に連絡して、あなたの窓を選んでください。嵐はもう、あそこで回り始めています。</p>

<h3>出典</h3>
<ul>
<li><a href="https://www.padi.com/dive-site/thailand/sail-rock-3/" rel="nofollow">PADI — セイルロックのポイント情報</a></li>
<li><a href="https://www.divessi.com/en/mydiveguide/divesite/sail-rock-thailand-sailrock-prab-wreck-108489" rel="nofollow">SSI MyDiveGuide — タイ・セイルロック</a></li>
<li><a href="https://www.scubadiving.com/diving-with-schools-barracuda" rel="nofollow">Scuba Diving 誌 — バラクーダの群れと潜る</a></li>
<li><a href="https://a-z-animals.com/animals/barracuda/" rel="nofollow">A-Z Animals — バラクーダの生態と行動</a></li>
</ul>`
};

const ko = {
  lang: 'ko',
  title: '따오섬 바라쿠다 폭풍 진짜일까 물지 않는 이유',
  slug: 'why-thousands-of-barracuda-circle-divers-ko',
  excerpt: '춤폰 피너클과 세일록에서 수백 마리 바라쿠다가 은빛 폭풍처럼 다이버를 에워쌉니다. 소문은 사실일까요, 저 날카로운 이빨은 위험할까요.',
  keywords: ['따오섬 바라쿠다 폭풍','춤폰 피너클 다이빙','세일록 바라쿠다','바라쿠다 무리 다이빙','태국만 피너클','바라쿠다 위험','따오섬 어드밴스 포인트','사무이 세일록 보트다이빙'],
  ogTitle: '춤폰 피너클과 세일록의 바라쿠다 폭풍은 진짜다',
  ogDescription: '수백 마리 바라쿠다가 태국만에서 은빛 깔때기처럼 다이버를 감싸지만 아무도 물리지 않습니다. 어디서, 몇 미터에서, 왜 안전한지.',
  content: `<p>첫 신호는 머리 위 그림자입니다. 구름이 아닙니다. 수심 24미터의 태국만에서는 햇빛이 그렇게 깨끗하게 내려오는 일이 드무니까요. 그것은 움직이는 물고기의 천장이었습니다. 수백 마리가 피너클 위에서 천천히 회전하며 원을 좁혀 갑니다. 일 분도 지나지 않아 무리는 원을 닫았고, 한가운데 호버링하던 다이버는 이제 멈추지 않고 돌며 떠날 기색이 없는 살아 있는 은빛 깔때기 속에 서 있습니다.</p>

<p>태국 다이버들은 이걸 바라쿠다 폭풍이라 부릅니다. 사진은 연출처럼 보이지만, 그렇지 않습니다.</p>

<h2>바라쿠다 폭풍은 진짜인가, 다이브숍의 전설인가</h2>
<p>진짜입니다. 그것도 태국만 서쪽의 특정한 수중 피너클 두 곳에서만 일어납니다. 따오섬 앞바다의 춤폰 피너클과, 따오섬과 파응안섬 사이에 있는 세일록입니다. 둘 다 깊은 물에서 홀로 솟은 화강암 탑으로, 주변에는 물고기가 숨을 만한 것이 아무것도 없습니다. 바로 이 지형이 모든 장치입니다. 사방으로 트인 물이 조류를 바위로 몰아붙이고, 조류는 플랑크톤을 실어 오고, 플랑크톤은 미끼 물고기를 부르고, 미끼 물고기는 푸른 물에 수천 마리로 떠 있는 포식자를 불러들입니다.</p>
<p>이 장면의 주인공은 셰브런 바라쿠다 <em>Sphyraena qenie</em>, 홀로 사는 큰바라쿠다의 무리 짓는 사촌입니다. 수백에서 때로 수천 마리로 모이고, 피너클 위에서 대형을 조이면 회전합니다. 사진가들이 폭풍이라 부르는, 반짝이는 은빛 기둥입니다. 해양생물학자는 같은 행동을 더 담담하게 설명합니다. 물고기 한 마리 한 마리를 더 안전하게 하고 사냥 효율도 높이는 조직적인 무리 짓기라고요. 그러나 깔때기 한가운데의 다이버에게는, 그저 바다가 돌기로 마음먹은 것처럼 보일 뿐입니다.</p>

<h2>춤폰 피너클, 물고기의 밀도가 날씨가 되는 곳</h2>
<p>따오섬 북서쪽 약 12킬로미터. 춤폰 피너클은 약 200미터 해저에 흩어진 화강암 탑의 무리입니다. 주봉의 꼭대기는 수면 아래 약 14미터, 둘레의 기둥들은 30에서 36미터까지 떨어지고, 그 아래는 모래와 바위입니다. 위쪽 바위에는 선명한 분홍 말미잘이 깔려 있고, 이곳은 정말로 큰 물고기가 빽빽합니다. 제비활치, 줄전갱이, 퉁돔, 그루퍼, 그리고 다이버들이 바라쿠다 바위라 부르는 지점을 대개 20에서 30미터에서 순찰하는 터줏대감 바라쿠다 무리입니다.</p>
<table>
<tr><th>항목</th><th>값</th></tr>
<tr><td>꼭대기 수심</td><td>약 14m</td></tr>
<tr><td>주 수심</td><td>18~30m</td></tr>
<tr><td>최대 수심</td><td>36m+</td></tr>
<tr><td>시야</td><td>15~30m</td></tr>
<tr><td>등급</td><td>어드밴스／나이트록스</td></tr>
</table>
<p>이 깊이가 첫 주에 할 다이빙이 아닌 이유입니다. 볼만한 물고기 무리를 만나려면 18미터 아래에서 얼마간 머물러야 하고, 이 포인트는 뭍에서 충분히 멀어 조류가 순식간에 세지고 시야가 다이빙 사이에도 바뀝니다. 어드밴스 자격이 합리적인 최소선이고, 나이트록스는 바닥 시간을 벌어 서두른 통과를 진짜 만남으로 바꿔 줍니다. 이런 트립 전에 <a href="/ko/blogs/thailand-deepest-dive-wall-hin-muang">수심 훈련을 어디까지 밀어붙일지</a> 읽어 두면 좋습니다.</p>

<h2>세일록, 머리 위에서 닫히는 깔때기</h2>
<p>춤폰이 밀도로 유명하다면, 세일록은 규모로 유명합니다. 피너클은 수면을 뚫고 올라와 수면 위 약 15미터의 화강암 지느러미로 서 있다가 수면 아래 약 40미터까지 떨어집니다. 태국만에서 물고기 무리가 감탄을 넘어 방향 감각을 앗아가기 시작하는 유일한 포인트입니다. 이곳 다이버가 보는 것은 따오섬 근처에서 익숙한 스무 마리, 서른 마리 바라쿠다가 아닙니다. 수백, 때로 수천의 셰브런, 옐로테일, 픽핸들 바라쿠다가 큰눈전갱이, 퉁돔, 실꼬리돔과 뒤섞입니다. 그 기둥 하나가 다이버를 감싸면, 은빛 벽은 배도 수면도, 같은 팀의 나머지 사람들까지 가릴 만큼 촘촘합니다.</p>
<ul>
<li><strong>피너클 형태</strong> — 수면 위 15m, 수면 아래 약 40m까지. 서쪽에 위성 같은 바위 무리가 있고 꼭대기는 약 18m.</li>
<li><strong>대표 무리</strong> — 셰브런, 옐로테일, 픽핸들 바라쿠다가 수백 규모. 여기에 태국만 최대의 터줏대감 제비활치 무리.</li>
<li><strong>침니</strong> — 바위를 관통하는 수직 스윔스루. 약 6m에서 들어가 약 18m에서 나옵니다. 자세한 내용은 <a href="/ko/blogs/sail-rock-chimney-best-gulf-of-thailand-dive">세일록 침니 안내</a>에서.</li>
<li><strong>큰 손님들</strong> — 고등어, 전갱이, 참치, 그리고 시즌에는 세일록을 태국 최고의 <a href="/ko/blogs/bus-sized-whale-shark-koh-tao">고래상어 포인트</a> 중 하나로 만드는 고래상어.</li>
</ul>
<p>대가는 세일록이 외해라는 점입니다. 시야는 탁한 몇 미터에서 맑은 30미터까지 폭이 크고, 같은 날 두 다이빙 사이에도 바뀝니다. 조류는 별 예고 없이 밀려옵니다. 그러나 바로 그 변덕이 물고기를 먹여 살리니, 이것은 흠이 아니라 특징입니다. 다만 어떤 바람 잔잔한 리프보다 이곳에서 중성부력이 더 중요한 이유이기도 합니다.</p>

<h2>저 이빨은 위협처럼 보인다. 그렇지 않은 이유</h2>
<p>가까이서 보면 1미터짜리 바라쿠다는 마음 놓이는 동물이 아닙니다. 아래턱이 튀어나오고, 입을 다물어도 이빨이 보이며, 눈도 깜빡이지 않고 정면으로 노려보며 꼼짝 않는 모습은 그대로 위협으로 읽힙니다. 생물학은 분명히 말해 둡시다. 셰브런 바라쿠다는 리프의 최상위 포식자로, 상처를 낼 장비를 갖췄습니다. 다만 그 장비를 다이버에게 겨눌 이유가 없을 뿐입니다.</p>
<p>다이버를 공격한 기록은 극히 드물고, 있는 것들도 거의 언제나 번쩍이는 루어나 방금 작살에 꿰인 물고기, 혹은 있어선 안 될 곳에 내민 손이 얽혀 있습니다. 바라쿠다는 달아나는 미끼 물고기로 착각한 금속의 번득임을 향해 달려드는 것입니다. 건드리지 않으면 무리는 다이버를 배경으로 취급합니다. 공격적이기보다 호기심이 앞서고, 갑자기 달려들지만 않으면 거리를 지키며 다이버가 대형 안으로 떠들어오게 둡니다. 이것은 태국만이 거듭 가르치는 직관에 반하는 교훈과 같습니다. 상대가 <a href="/ko/blogs/sea-snake-swims-toward-diver-rarely-bites">마스크로 곧장 헤엄쳐 오는 바다뱀</a>이든, <a href="/ko/blogs/great-hammerhead-face-charge-danger">화면을 가득 채우고</a> 이내 돌아서는 귀상어든, 해치려는 듯 보이는 포식자는 거의 언제나 그저 당신을 확인하러 온 것뿐입니다.</p>

<h2>깔때기 한가운데에 서는 법</h2>
<p>모두가 원하는 그 한 장, 회전하는 은빛 벽 한가운데 멈춰 선 다이버 사진은 물고기를 쫓아 얻는 것이 아닙니다. 스스로 가구가 되어 얻는 것입니다. 바라쿠다는 파닥이는 것에는 틈을 열고, 조용히 떠 있는 것 둘레로는 대열을 닫습니다. 그래서 기술은 우스울 만큼 수동적입니다.</p>
<ul>
<li><strong>헤엄치지 말고 호버링하라.</strong> 중성부력과 느리고 최소한의 핀킥이면 무리는 흩어져 달아나는 대신 당신을 둘러싸고 다시 모입니다.</li>
<li><strong>손은 넣어 둬라.</strong> 뻗은 팔은 돌진으로 읽히고, 작게 웅크린 몸은 무해하게 읽힙니다. 만지지도, 가리키지도, 사진을 위해 뻗지도 마세요.</li>
<li><strong>호흡을 늦춰라.</strong> 한 번의 거센 기포는 물고기 기둥을 흩뜨립니다. 길고 조용한 날숨이 벽을 지키고 깊은 곳에서 공기도 오래 갑니다.</li>
<li><strong>다가오게 두라.</strong> 조류를 타고 무리 가장자리로 떠들어가 멈추세요. 대개 일 분도 안 되어 틈은 머리 위에서 저절로 닫힙니다.</li>
</ul>

<h2>은빛 폭풍은 실제로 언제 나타나나</h2>
<p>바라쿠다는 일 년 내내 터줏대감입니다. 무리는 고래상어처럼 계절 이벤트가 아닙니다. 다만 잘 보이느냐는 컨디션이 결정합니다. 2026년 내내 태국만 서쪽은 긴 맑은 시기가 이어졌고, 시야는 수중 사진가들이 올해의 황금 구간이라 부르는 3월에서 8월 창에서 정점을 찍었습니다. 8월은 대략 3월에서 9월에 걸치는 세일록 고래상어 성수기 한가운데에 놓입니다. 그러니 이달의 당일 한 번에도 같은 물에서 바라쿠다 폭풍과 버스만 한 그림자를 함께 만날 진짜 가능성이 있습니다.</p>
<p>춤폰 피너클도 요즘 여느 때보다 물고기가 짙습니다. 터줏대감 마블드 그루퍼 개체군이 2026년에 눈에 띄게 늘어 일부는 이제 다이버와 거의 같은 길이입니다. 그리고 몬순 이후를 계획하는 분께. 현지의 지혜로는 9월과 10월이 이곳에서 한 해 최고의 물을 자주 내주고, 바람이 잦아들면 시야가 40미터를 넘어섭니다.</p>
<p>섬에서 가기는 쉽습니다. 스피드보트로 사무이섬에서 세일록까지 약 50분. 표준 2탱크 당일은 오전 9시쯤 선착장을 떠나 두 다이빙 사이에 점심을 내고 이른 오후에 돌아옵니다. 보통 장비와 픽업 포함 4,650~4,950바트입니다. 춤폰 피너클은 더 멀어 사무이에서 스피드보트로 약 90분, 따오섬에서라면 45분으로 짧고, 2다이빙에 약 5,150바트부터입니다.</p>

<h2>춤폰이냐 세일록이냐, 먼저 예약한다면</h2>
<p>두 곳 다 폭풍을 보여 주니, 선택은 이동과 수심에 대한 욕심으로 갈립니다. 세일록이 더 편한 하루입니다. 사무이섬과 파응안섬에서 더 가깝고, 위쪽이 더 얕으며, 갓 자격을 딴 어드밴스 다이버도 위쪽 바위를 즐길 만큼 너그럽고, 그 머리 위 10에서 18미터에서 무리가 소용돌이칩니다. 고래상어 확률도 더 높은 쪽이라 시즌에는 배가 먼저 찹니다. 춤폰 피너클은 숙련자에게 보답합니다. 가장 짙은 물고기는 더 깊고, 조류는 더 세며, 긴 뱃길이 가벼운 마음의 사람들을 조용히 걸러 냅니다. 그곳의 큰 물고기 장면이 해마다 한결같은 이유의 하나이기도 합니다. 로그 열몇 번에 공기 소모가 안정된 사람은 세일록에서 가장 많이 얻고, 되도록 두꺼운 은빛 벽을 좇으며 30미터에서 편안하고 되도록 나이트록스를 마시는 사람은 뱃머리를 춤폰으로 돌리세요. 며칠 머무는 방문객 상당수는 그냥 이틀 아침 내리 두 곳을 다 잠수하고 점심 자리에서 견주어 봅니다.</p>

<h2>저장하고, 한가운데 함께 있을 버디를 태그하라</h2>
<p>바라쿠다 폭풍은 머리 위에서 실제로 벌어지기 전까지는 지어낸 이야기처럼 들리는, 그런 만남 가운데 하나입니다. 케이지도, 미끼 주기도, 당신에게 어떤 위험도 없이, 그저 수천 마리 날카로운 이빨의 포식자가 당신을 바위에 충분히 가까운 배경의 일부로 여긴 것뿐입니다. 같은 두 포인트의 고래상어, 화강암 침니와 나란히, 통째로 한 트립을 잡을 만한 태국 바다 경험의 짧은 목록에 듭니다. 이 글을 저장하고, 트립 한 번 빚진 버디에게 연락하고, 당신의 창을 고르세요. 폭풍은 이미 저기서 돌고 있습니다.</p>

<h3>출처</h3>
<ul>
<li><a href="https://www.padi.com/dive-site/thailand/sail-rock-3/" rel="nofollow">PADI — 세일록 포인트 정보</a></li>
<li><a href="https://www.divessi.com/en/mydiveguide/divesite/sail-rock-thailand-sailrock-prab-wreck-108489" rel="nofollow">SSI MyDiveGuide — 태국 세일록</a></li>
<li><a href="https://www.scubadiving.com/diving-with-schools-barracuda" rel="nofollow">Scuba Diving 매거진 — 바라쿠다 무리와 다이빙하기</a></li>
<li><a href="https://a-z-animals.com/animals/barracuda/" rel="nofollow">A-Z Animals — 바라쿠다 생태와 행동</a></li>
</ul>`
};

const de = {
  lang: 'de',
  title: 'Der Barrakuda-Sturm am Sail Rock — und warum er harmlos ist',
  slug: 'why-thousands-of-barracuda-circle-divers-de',
  excerpt: 'Am Chumphon Pinnacle und am Sail Rock wickeln sich Hunderte Chevron-Barrakudas zu einem silbernen Wirbel um Taucher — und rühren sie nie an. Warum das so ist.',
  keywords: ['Barrakuda Sturm Koh Tao','Chumphon Pinnacle Tauchen','Sail Rock Barrakuda','Barrakuda Schwarm Tauchen','Golf von Thailand Felsnadel','sind Barrakudas gefährlich','Koh Tao Advanced Tauchplatz','Sail Rock Tagestour Koh Samui'],
  ogTitle: 'Der Barrakuda-Sturm am Chumphon Pinnacle und Sail Rock ist echt',
  ogDescription: 'Hunderte Chevron-Barrakudas bilden im Golf von Thailand einen silbernen Trichter um Taucher — ohne je zuzustoßen. Wo, wie tief und warum sicher.',
  content: `<p>Das erste Zeichen ist ein Schatten über dir. Keine Wolke — der Golf von Thailand lässt die Sonne auf 24 Metern selten so klar durch —, sondern eine sich bewegende Decke aus Fischen, Hunderte davon, die sich über der Felsnadel zu einer langsamen Drehung zusammenziehen. Innerhalb einer Minute hat der Schwarm den Kreis geschlossen. Ein Taucher, der in der Mitte schwebt, steht nun in einem lebenden silbernen Trichter, der sich dreht und dreht und keinerlei Absicht zeigt, zu verschwinden.</p>

<p>Thailands Taucher haben einen Namen dafür: der Barrakuda-Sturm. Die Fotos wirken gestellt. Sind sie nicht.</p>

<h2>Ist der Sturm echt oder eine Legende der Tauchbasen?</h2>
<p>Er ist echt, und er geschieht an zwei bestimmten unterseeischen Felsnadeln im westlichen Golf von Thailand — am Chumphon Pinnacle vor Koh Tao und am Sail Rock zwischen Koh Tao und Koh Phangan. Beide sind einsame Granittürme, die aus tiefem Wasser aufragen, ringsum nichts, hinter dem sich ein Fisch verstecken könnte. Genau diese Geografie ist der ganze Trick. Offenes Wasser auf allen Seiten drängt die Strömung über den Fels, die Strömung trägt Plankton heran, das Plankton lockt Köderfische, und die Köderfische locken die Räuber, die zu Tausenden im Blau hängen.</p>
<p>Die Hauptrolle spielt der Chevron-Barrakuda, <em>Sphyraena qenie</em>, der im Schwarm lebende Vetter des einzelgängerischen Großen Barrakudas. Chevrons sammeln sich zu Hunderten, mitunter Tausenden, und wenn ein Schwarm über der Felsnadel seine Formation strafft, dreht er sich — eine schimmernde silberne Säule, die Fotografen aus gutem Grund einen Sturm nennen. Meeresbiologen beschreiben dasselbe Verhalten nüchterner: eine organisierte Ansammlung, die jedem einzelnen Fisch mehr Schutz und bessere Jagdchancen verschafft. Für den Taucher mitten im Trichter sieht es allerdings einfach so aus, als hätte das Meer beschlossen, sich zu drehen.</p>

<h2>Chumphon Pinnacle, wo Fischdichte zum Wetter wird</h2>
<p>Zwölf Kilometer nordwestlich von Koh Tao ist der Chumphon Pinnacle eine Ansammlung von Granittürmen, verteilt über rund 200 Meter Meeresgrund. Der Hauptgipfel liegt etwa 14 Meter unter der Oberfläche; die umliegenden Säulen fallen auf 30 bis 36 Meter ab, darunter folgen Sand und Felsblöcke. Leuchtend rosa Seeanemonen überziehen den oberen Fels, und der Platz ist wirklich dicht an großen Fischen — Fledermausfische, Stachelmakrelen, Schnapper, Zackenbarsche und die ansässigen Barrakuda-Schwärme, die eine Stelle patrouillieren, die Taucher schlicht Barracuda Rock nennen, meist zwischen 20 und 30 Metern.</p>
<table>
<tr><th>Kennwert</th><th>Wert</th></tr>
<tr><td>Gipfeltiefe</td><td>~14 m</td></tr>
<tr><td>Arbeitstiefe</td><td>18–30 m</td></tr>
<tr><td>Maximaltiefe</td><td>36 m+</td></tr>
<tr><td>Sicht</td><td>15–30 m</td></tr>
<tr><td>Niveau</td><td>Advanced / Nitrox</td></tr>
</table>
<p>Die Tiefe ist der Grund, warum dies kein Tauchgang für die erste Woche ist. Um an das gute Fischgeschehen zu kommen, muss man Zeit unterhalb von 18 Metern verbringen, und der Platz liegt weit genug draußen, dass die Strömung schnell auffrischt und die Sicht zwischen den Tauchgängen kippen kann. Ein Advanced-Open-Water-Brevet ist die vernünftige Untergrenze, und angereichertes Nitrox erkauft die zusätzliche Grundzeit, die aus einem hastigen Vorbeiziehen eine echte Begegnung macht. Wer eine solche Tour plant, sollte vorab nachlesen, <a href="/de/blogs/thailand-deepest-dive-wall-hin-muang">wie weit sich das Tiefentraining treiben lässt</a>.</p>

<h2>Sail Rock, der Trichter, der sich über deinem Kopf schließt</h2>
<p>Ist Chumphon für Dichte berühmt, so ist Sail Rock für Ausmaß berühmt. Die Felsnadel durchbricht die Oberfläche — eine Granitflosse, die etwa 15 Meter aus dem Wasser ragt — und fällt auf rund 40 Meter darunter ab. Es ist der eine Platz im Golf, an dem die Schwärme aufhören, bloß beeindruckend zu sein, und anfangen, die Orientierung zu rauben. Taucher sehen hier nicht die zwanzig oder dreißig Barrakudas, die sie näher an Koh Tao gewohnt sind, sondern Schwärme zu Hunderten, mitunter Tausenden aus Chevron-, Gelbschwanz- und Pickhandle-Barrakudas, gemischt mit Großaugen-Stachelmakrelen, Schnappern und Füsilieren. Wickelt sich eine solche Säule um einen Taucher, ist die silberne Wand dicht genug, um das Boot, die Oberfläche und den Rest der Gruppe auszulöschen.</p>
<ul>
<li><strong>Profil der Felsnadel</strong> — 15 m über der Oberfläche, Abfall auf ~40 m darunter; westlich liegt eine trabantenhafte Felsgruppe, Spitzen bei ~18 m.</li>
<li><strong>Charakterschwarm</strong> — Chevron-, Gelbschwanz- und Pickhandle-Barrakudas zu Hunderten, dazu der größte ansässige Fledermausfisch-Schwarm des Golfs.</li>
<li><strong>Der Kamin</strong> — ein senkrechter Durchschwimmgang durch den Fels, Einstieg bei etwa 6 m, Ausstieg bei rund 18 m; ausführlich in unserem <a href="/de/blogs/sail-rock-chimney-best-gulf-of-thailand-dive">Sail-Rock-Kamin-Guide</a>.</li>
<li><strong>Große Gäste</strong> — Makrelen, Stachelmakrelen, Thunfische und, in der Saison, die Walhaie, die Sail Rock zu einem der zuverlässigsten <a href="/de/blogs/bus-sized-whale-shark-koh-tao">Walhai-Plätze</a> Thailands machen.</li>
</ul>
<p>Der Haken ist, dass Sail Rock offenes Meer ist. Die Sicht reicht von trüben paar Metern bis zu kristallenen dreißig und kann zwischen zwei Tauchgängen desselben Tages wechseln. Strömung kommt fast ohne Vorwarnung. Doch gerade diese Unbeständigkeit nährt die Fische, sie ist also ein Merkmal, kein Mangel — aber sie ist der Grund, warum Tarierung hier mehr zählt als an jedem geschützten Riff.</p>

<h2>Diese Zähne wirken wie eine Drohung. Warum sie es nicht sind.</h2>
<p>Aus der Nähe ist ein meterlanger Barrakuda kein beruhigendes Tier. Der Unterkiefer steht vor, die Zähne sind selbst bei geschlossenem Maul sichtbar, und der Fisch hält mit einem starren, frontalen Blick die Stellung, der sich als Drohung liest. Es lohnt, bei der Biologie deutlich zu sein: Der Chevron-Barrakuda ist ein Spitzenräuber des Riffs mit der Ausrüstung, Schaden anzurichten. Er hat nur keinen Grund, diese Ausrüstung auf einen Taucher zu richten.</p>
<p>Belegte Angriffe auf Taucher sind verschwindend selten, und die wenigen betreffen fast immer einen glänzenden Köder, einen aufgespießten Fisch oder eine Hand, die dort war, wo sie nicht hingehörte — ein Barrakuda, der nach einem Metallblitz schnappt, den er für einen fliehenden Köderfisch hielt. In Ruhe gelassen, behandelt ein Schwarm den Taucher als Kulisse. Die Fische sind eher neugierig als aggressiv; nähert man sich ohne ruckartige Bewegungen, halten sie Abstand und lassen den Taucher in die Formation treiben. Es ist dieselbe kontraintuitive Lektion, die der Golf immer wieder erteilt, ob es nun um eine <a href="/de/blogs/sea-snake-swims-toward-diver-rarely-bites">Seeschlange geht, die schnurstracks auf deine Maske zuschwimmt</a>, oder um einen <a href="/de/blogs/great-hammerhead-face-charge-danger">Hammerhai, der das Bild ausfüllt</a> und dann abdreht: Der Räuber, der aussieht, als wolle er dir wehtun, sieht sich fast immer nur an, wer du bist.</p>

<h2>Wie man in der Mitte des Trichters landet</h2>
<p>Das Foto, das alle wollen — der Taucher im ruhenden Zentrum einer sich drehenden silbernen Wand —, entsteht nicht durch Hinterherjagen. Es entsteht, indem man zum Möbelstück wird. Barrakudas öffnen eine Lücke für alles, was zappelt, und schließen die Reihen um alles, was ruhig verharrt, also ist die Technik beinahe peinlich passiv.</p>
<ul>
<li><strong>Schweben, nicht schwimmen.</strong> Neutrale Tarierung und langsame, minimale Flossenschläge lassen den Schwarm sich um dich neu formieren, statt zu fliehen.</li>
<li><strong>Die Hände drin lassen.</strong> Ein ausgestreckter Arm liest sich als Angriff; ein klein zusammengezogener Taucher liest sich als harmlos. Nicht berühren, nicht zeigen, nicht nach dem Bild greifen.</li>
<li><strong>Ruhiger atmen.</strong> Ein Schwall Blasen zerstreut die Säule. Lange, leise Ausatmung hält die Wand und lässt dein Gas in der Tiefe länger reichen.</li>
<li><strong>Sie kommen lassen.</strong> Treibe mit der Strömung an den Rand des Schwarms und halte an. Meist schließt sich die Lücke binnen einer Minute von selbst über deinem Kopf.</li>
</ul>

<h2>Wann der silberne Sturm wirklich auftaucht</h2>
<p>Die Barrakudas sind ganzjährig ansässig — die Schwärme sind kein saisonales Ereignis wie die Walhaie —, doch ob man sie gut sieht, entscheiden die Bedingungen. Über 2026 hinweg hatte der westliche Golf eine lange klare Phase, mit Sichtweiten, die im Fenster von März bis August ihren Höhepunkt erreichten, das Unterwasserfotografen den goldenen Lauf des Jahres nennen. Der August liegt mitten in der Walhai-Hochsaison am Sail Rock, die etwa von März bis September reicht, sodass eine einzige Tagestour in diesem Monat eine echte Chance auf den Wirbel und den busgroßen Schatten im selben Wasser bietet.</p>
<p>Auch der Chumphon Pinnacle war zuletzt fischreicher als sonst: Sein ansässiger Bestand an Marmor-Zackenbarschen ist 2026 spürbar gewachsen, manche Exemplare inzwischen fast so lang wie ein Taucher. Und für alle, die über den Monsun hinaus planen: Die örtliche Erfahrung besagt, dass September und Oktober hier oft das beste Wasser des Jahres bringen, mit Sicht über 40 Meter, sobald sich die Winde legen.</p>
<p>Die Anreise von den Inseln ist einfach. Ein Speedboat fährt von Koh Samui in etwa 50 Minuten zum Sail Rock; eine übliche Zwei-Flaschen-Tagestour legt gegen 9 Uhr vom Pier ab, serviert zwischen den Tauchgängen Mittagessen und ist am frühen Nachmittag zurück, meist für 4.650 bis 4.950 Baht inklusive Ausrüstung und Transfers. Der Chumphon Pinnacle ist der weitere Weg mit rund 90 Minuten per Speedboat ab Samui, oder kürzeren 45 Minuten von Koh Tao selbst, ab etwa 5.150 Baht für zwei Tauchgänge.</p>

<h2>Chumphon oder Sail Rock — was zuerst buchen?</h2>
<p>Beide Plätze liefern die Tornade, die Wahl entscheidet sich also an Logistik und Tiefenhunger. Sail Rock ist der bequemere Tag: näher an Koh Samui und Koh Phangan, oben flacher und nachsichtig genug, dass ein frisch brevetierter Advanced-Taucher den oberen Fels genießen kann, während die Schwärme darüber zwischen 10 und 18 Metern wirbeln. Es ist auch die verlässlichere Walhai-Wette, weshalb sich seine Boote in der Saison zuerst füllen. Der Chumphon Pinnacle belohnt die Erfahreneren — die beste Fischdichte liegt tiefer, die Strömung fällt kräftiger aus, und die längere Bootsfahrt siebt die Gelegenheitsgäste leise aus, mit ein Grund, warum das Großfischgeschehen dort von Jahr zu Jahr so beständig bleibt. Wer ein Dutzend Tauchgänge im Logbuch und ruhigen Luftverbrauch hat, holt aus Sail Rock am meisten heraus; wer die dichtestmögliche silberne Wand sucht, sich auf 30 Metern wohlfühlt und idealerweise Nitrox atmet, sollte das Boot Richtung Chumphon lenken. Viele Gäste mit ein paar Tagen Zeit tauchen an zwei aufeinanderfolgenden Vormittagen schlicht beide und vergleichen beim Mittagessen.</p>

<h2>Speichern und den Buddy markieren, dem du mittendrin vertraust</h2>
<p>Ein Barrakuda-Sturm gehört zu den Begegnungen, die erfunden klingen, bis sie um deinen Kopf herum geschehen — kein Käfig, kein Anfüttern, keine Gefahr für dich, nur ein paar tausend spitzzahnige Räuber, die entscheiden, dass du nah genug am Fels bist, um zur Kulisse zu zählen. Es gehört auf die kurze Liste thailändischer Wassererlebnisse, für die sich eine ganze Reise lohnt, neben den Walhaien und den Granitkaminen derselben zwei Plätze. Pinn diesen Beitrag an, schreib dem Tauchbuddy, der dir eine Tour schuldet, und wähle dein Fenster. Der Sturm dreht sich da draußen bereits.</p>

<h3>Quellen</h3>
<ul>
<li><a href="https://www.padi.com/dive-site/thailand/sail-rock-3/" rel="nofollow">PADI — Tauchplatz-Info Sail Rock</a></li>
<li><a href="https://www.divessi.com/en/mydiveguide/divesite/sail-rock-thailand-sailrock-prab-wreck-108489" rel="nofollow">SSI MyDiveGuide — Sail Rock, Thailand</a></li>
<li><a href="https://www.scubadiving.com/diving-with-schools-barracuda" rel="nofollow">Scuba Diving Magazine — Tauchen mit Barrakuda-Schwärmen</a></li>
<li><a href="https://a-z-animals.com/animals/barracuda/" rel="nofollow">A-Z Animals — Barrakuda, Fakten und Verhalten</a></li>
</ul>`
};

const fr = {
  lang: 'fr',
  title: 'La tornade de barracudas de Sail Rock est bien réelle',
  slug: 'why-thousands-of-barracuda-circle-divers-fr',
  excerpt: 'À Chumphon Pinnacle et à Sail Rock, des centaines de barracudas chevron enroulent les plongeurs dans une tornade argentée — sans jamais les toucher. Voici pourquoi.',
  keywords: ['tornade barracuda Koh Tao','plongée Chumphon Pinnacle','Sail Rock barracuda chevron','banc barracuda plongée','piton sous-marin golfe de Thaïlande','le barracuda est-il dangereux','site plongée Advanced Koh Tao','sortie Sail Rock depuis Koh Samui'],
  ogTitle: 'La tornade de barracudas à Chumphon Pinnacle et Sail Rock est réelle',
  ogDescription: 'Des centaines de barracudas chevron forment un entonnoir argenté autour des plongeurs dans le golfe de Thaïlande — sans jamais frapper. Où, à quelle profondeur, pourquoi sans danger.',
  content: `<p>Le premier signe est une ombre au-dessus de soi. Pas un nuage — le golfe de Thaïlande laisse rarement passer le soleil aussi nettement à 24 mètres —, mais un plafond mouvant de poissons, des centaines, qui se resserrent en une lente rotation au-dessus du piton. En moins d'une minute, le banc a refermé le cercle. Le plongeur suspendu au milieu se tient désormais dans un entonnoir d'argent vivant qui tourne, et tourne, sans la moindre intention de partir.</p>

<p>Les plongeurs thaïlandais lui donnent un nom : la tornade de barracudas. Les photos semblent mises en scène. Elles ne le sont pas.</p>

<h2>La tornade est-elle réelle, ou une légende de centre de plongée ?</h2>
<p>Elle est réelle, et elle se produit sur deux pitons immergés bien précis de l'ouest du golfe de Thaïlande — Chumphon Pinnacle au large de Koh Tao, et Sail Rock entre Koh Tao et Koh Phangan. Ce sont deux tours de granit solitaires jaillies d'une eau profonde, sans rien autour derrière quoi un poisson pourrait se cacher. Toute l'astuce tient à cette géographie. L'eau libre de tous côtés pousse le courant sur la roche, le courant charrie le plancton, le plancton attire les poissons-proies, et les poissons-proies attirent les prédateurs qui planent par milliers dans le bleu.</p>
<p>La vedette du spectacle est le barracuda chevron, <em>Sphyraena qenie</em>, cousin grégaire du grand barracuda solitaire. Les chevrons se rassemblent par centaines, parfois par milliers, et lorsqu'un banc resserre sa formation au-dessus du piton, il se met à tourner — une colonne d'argent scintillante que les photographes appellent une tornade, à juste titre. Les biologistes marins décrivent le même comportement plus sobrement : un rassemblement organisé qui offre à chaque poisson plus de protection et de meilleures chances de chasse. Mais pour le plongeur au cœur de l'entonnoir, on dirait simplement que la mer a décidé de tourner.</p>

<h2>Chumphon Pinnacle, où la densité de poissons devient un climat</h2>
<p>À douze kilomètres au nord-ouest de Koh Tao, Chumphon Pinnacle est un bouquet de tours de granit dispersées sur environ 200 mètres de fond. Le sommet principal se tient à quelque 14 mètres sous la surface ; les piliers voisins plongent à 30 puis 36 mètres, avant le sable et les blocs plus bas encore. Des anémones roses éclatantes tapissent la roche supérieure, et le site est vraiment dense en gros poissons — poissons-chauves-souris, carangues, vivaneaux, mérous, et les bancs de barracudas résidents qui patrouillent un relief que les plongeurs appellent simplement Barracuda Rock, le plus souvent entre 20 et 30 mètres.</p>
<table>
<tr><th>Repère</th><th>Valeur</th></tr>
<tr><td>Profondeur sommet</td><td>~14 m</td></tr>
<tr><td>Profondeur d'évolution</td><td>18–30 m</td></tr>
<tr><td>Profondeur max</td><td>36 m+</td></tr>
<tr><td>Visibilité</td><td>15–30 m</td></tr>
<tr><td>Niveau</td><td>Advanced / Nitrox</td></tr>
</table>
<p>La profondeur explique pourquoi ce n'est pas une plongée de première semaine. Atteindre la belle animation suppose de passer du temps sous 18 mètres, et le site est assez au large pour que le courant forcisse vite et que la visibilité bascule d'une plongée à l'autre. Un brevet Advanced Open Water est le plancher raisonnable, et le Nitrox achète le temps de fond supplémentaire qui transforme un passage pressé en vraie rencontre. Avant une telle sortie, mieux vaut lire <a href="/fr/blogs/thailand-deepest-dive-wall-hin-muang">jusqu'où pousser sa formation en profondeur</a>.</p>

<h2>Sail Rock, l'entonnoir qui se referme au-dessus de la tête</h2>
<p>Si Chumphon est réputé pour la densité, Sail Rock l'est pour l'échelle. Le piton perce la surface — une nageoire de granit dressée à environ 15 mètres au-dessus de l'eau — et descend à quelque 40 mètres en dessous. C'est le seul site du golfe où les bancs cessent d'être impressionnants pour devenir désorientants. Les plongeurs n'y voient pas les vingt ou trente barracudas dont ils ont l'habitude près de Koh Tao, mais des bancs se comptant par centaines, parfois par milliers, de barracudas chevron, à queue jaune et pickhandle, mêlés de carangues à gros yeux, de vivaneaux et de fusiliers. Quand l'une de ces colonnes enveloppe un plongeur, le mur d'argent est assez dense pour effacer le bateau, la surface et le reste de la palanquée.</p>
<ul>
<li><strong>Profil du piton</strong> — 15 m au-dessus de la surface, chute à ~40 m en dessous ; un chapelet de roches satellites se tient à l'ouest, sommets vers 18 m.</li>
<li><strong>Banc emblématique</strong> — barracudas chevron, à queue jaune et pickhandle par centaines, plus le plus grand banc résident de poissons-chauves-souris du golfe.</li>
<li><strong>La cheminée</strong> — un passage vertical à travers la roche, entrée vers 6 m et sortie autour de 18 m ; détaillée dans notre <a href="/fr/blogs/sail-rock-chimney-best-gulf-of-thailand-dive">guide de la cheminée de Sail Rock</a>.</li>
<li><strong>Grands visiteurs</strong> — maquereaux, carangues, thons et, en saison, les requins-baleines qui font de Sail Rock l'un des <a href="/fr/blogs/bus-sized-whale-shark-koh-tao">sites à requin-baleine</a> les plus fiables de Thaïlande.</li>
</ul>
<p>La contrepartie, c'est que Sail Rock est en pleine mer. La visibilité va de quelques mètres troubles à trente mètres cristallins, et peut changer entre deux plongées du même jour. Le courant arrive presque sans prévenir. Or c'est précisément cette instabilité qui nourrit les poissons : c'est un atout, pas un défaut — mais aussi la raison pour laquelle la flottabilité compte ici plus que sur n'importe quel récif abrité.</p>

<h2>Ces dents ressemblent à une menace. Voici pourquoi elles n'en sont pas.</h2>
<p>De près, un barracuda d'un mètre n'a rien de rassurant. La mâchoire est proéminente, les dents restent visibles même la bouche fermée, et le poisson tient position d'un regard frontal, fixe, qui se lit comme une menace. Autant être direct sur la biologie : le barracuda chevron est un superprédateur du récif, doté de l'équipement pour blesser. Il n'a simplement aucune raison de pointer cet équipement vers un plongeur.</p>
<p>Les attaques recensées sur des plongeurs sont infimes, et les rares connues impliquent presque toujours un leurre brillant, un poisson fraîchement harponné, ou une main tendue là où elle n'avait rien à faire — un barracuda frappant un éclat de métal pris pour un poisson-proie en fuite. Qu'on le laisse tranquille, et le banc traite le plongeur comme un décor. Ces poissons sont curieux plus qu'agressifs ; abordés sans gestes brusques, ils gardent leurs distances et laissent le plongeur dériver dans la formation. C'est la même leçon à contre-courant que le golfe répète, qu'il s'agisse d'un <a href="/fr/blogs/sea-snake-swims-toward-diver-rarely-bites">serpent de mer nageant droit sur votre masque</a> ou d'un <a href="/fr/blogs/great-hammerhead-face-charge-danger">requin-marteau qui remplit le cadre</a> avant de virer : le prédateur qui a l'air de vouloir vous faire du mal vient, presque toujours, seulement voir qui vous êtes.</p>

<h2>Comment se retrouver au centre de l'entonnoir</h2>
<p>La photo que tout le monde veut — le plongeur au centre immobile d'un mur d'argent tournoyant — ne s'obtient pas en poursuivant les poissons. Elle s'obtient en devenant meuble. Les barracudas ouvrent un passage à tout ce qui s'agite et resserrent les rangs autour de tout ce qui plane tranquillement : la technique est donc d'une passivité presque gênante.</p>
<ul>
<li><strong>Faire du surplace, pas nager.</strong> Une flottabilité neutre et des coups de palme lents et réduits laissent le banc se reformer autour de vous au lieu de s'écarter pour fuir.</li>
<li><strong>Garder les mains contre soi.</strong> Un bras tendu se lit comme une attaque ; un plongeur replié se lit comme inoffensif. Ne rien toucher, ne rien montrer, ne pas se tendre pour la photo.</li>
<li><strong>Ralentir sa respiration.</strong> Une salve de bulles disperse la colonne. Des expirations longues et discrètes gardent le mur intact et font durer votre gaz en profondeur.</li>
<li><strong>Les laisser venir.</strong> Dérivez avec le courant jusqu'au bord du banc et arrêtez-vous. En général, en moins d'une minute, le passage se referme de lui-même au-dessus de votre tête.</li>
</ul>

<h2>Quand la tempête d'argent se montre vraiment</h2>
<p>Les barracudas sont résidents toute l'année — les bancs ne sont pas un événement saisonnier comme les requins-baleines —, mais ce sont les conditions qui décident si on les voit bien. Tout au long de 2026, l'ouest du golfe a connu une longue période claire, la visibilité culminant sur la fenêtre de mars à août que les photographes sous-marins appellent la période dorée de l'année. Le mois d'août tombe en plein cœur de la haute saison des requins-baleines à Sail Rock, qui s'étend en gros de mars à septembre : une seule sortie à la journée ce mois-ci offre donc une vraie chance de croiser la tornade et l'ombre grande comme un bus dans la même eau.</p>
<p>Chumphon Pinnacle est lui aussi plus poissonneux que d'habitude ces temps-ci : sa population résidente de mérous marbrés a nettement augmenté en 2026, certains individus atteignant presque la taille d'un plongeur. Et pour qui planifie après la mousson, la sagesse locale veut que septembre et octobre livrent souvent la meilleure eau de l'année ici, la visibilité dépassant 40 mètres dès que les vents tombent.</p>
<p>L'accès depuis les îles est facile. Un speedboat rejoint Sail Rock depuis Koh Samui en une cinquantaine de minutes ; une sortie classique à deux plongées quitte le ponton vers 9 h, sert le déjeuner entre les plongées et vous ramène en début d'après-midi, en général pour 4 650 à 4 950 bahts, matériel et transferts compris. Chumphon Pinnacle demande plus de route, environ 90 minutes en speedboat depuis Samui, ou 45 minutes plus courtes depuis Koh Tao même, à partir d'environ 5 150 bahts pour deux plongées.</p>

<h2>Chumphon ou Sail Rock — lequel réserver d'abord ?</h2>
<p>Les deux sites offrent la tornade ; le choix tient donc à la logistique et à l'appétit de profondeur. Sail Rock fait la journée la plus facile : plus proche de Koh Samui et de Koh Phangan, moins profond sur le dessus, et assez indulgent pour qu'un plongeur Advanced fraîchement breveté profite du haut de la roche pendant que les bancs tourbillonnent au-dessus, entre 10 et 18 mètres. C'est aussi le pari requin-baleine le plus fiable, et ses bateaux se remplissent donc d'abord en saison. Chumphon Pinnacle récompense les plus aguerris — la meilleure densité de poissons se tient plus bas, le courant se fait plus insistant, et le trajet plus long écarte discrètement les visiteurs de passage, ce qui explique en partie pourquoi le ballet des gros poissons y reste si constant d'année en année. Un plongeur avec une douzaine d'immersions au carnet et une consommation d'air posée tirera le meilleur de Sail Rock ; celui qui traque le mur d'argent le plus dense possible, à l'aise à 30 mètres et de préférence au Nitrox, mettra le cap sur Chumphon. Bien des visiteurs restant quelques jours font tout simplement les deux, deux matins de suite, et comparent au déjeuner.</p>

<h2>À enregistrer, et à taguer le binôme en qui vous auriez confiance au milieu</h2>
<p>La tornade de barracudas fait partie de ces rencontres qui sonnent inventées jusqu'à ce qu'elles se déroulent autour de votre tête — pas de cage, pas d'appâtage, aucun danger pour vous, seulement quelques milliers de prédateurs à dents pointues jugeant que vous êtes assez près de la roche pour compter comme décor. Elle mérite sa place sur la courte liste des expériences des eaux thaïlandaises qui valent qu'on organise tout un voyage, aux côtés des requins-baleines et des cheminées de granit de ces deux mêmes sites. Épinglez celle-ci, écrivez au binôme qui vous doit une sortie, et choisissez votre créneau. La tempête tourne déjà là-bas.</p>

<h3>Sources</h3>
<ul>
<li><a href="https://www.padi.com/dive-site/thailand/sail-rock-3/" rel="nofollow">PADI — fiche du site de plongée Sail Rock</a></li>
<li><a href="https://www.divessi.com/en/mydiveguide/divesite/sail-rock-thailand-sailrock-prab-wreck-108489" rel="nofollow">SSI MyDiveGuide — Sail Rock, Thaïlande</a></li>
<li><a href="https://www.scubadiving.com/diving-with-schools-barracuda" rel="nofollow">Scuba Diving Magazine — plonger avec les bancs de barracudas</a></li>
<li><a href="https://a-z-animals.com/animals/barracuda/" rel="nofollow">A-Z Animals — le barracuda, faits et comportement</a></li>
</ul>`
};

const ru = {
  lang: 'ru',
  title: 'Барракудовый шторм у Сейл-Рок — правда и не опасно',
  slug: 'why-thousands-of-barracuda-circle-divers-ru',
  excerpt: 'У Чумпхон-Пиннакл и Сейл-Рок сотни барракуд закручиваются в серебряный вихрь вокруг дайверов — и ни разу их не трогают. Разбираемся почему.',
  keywords: ['барракудовый шторм Ко Тао','дайвинг Чумпхон Пиннакл','Сейл Рок барракуда','стая барракуд дайвинг','подводная вершина Сиамский залив','опасна ли барракуда','Ко Тао продвинутый дайв-сайт','Сейл Рок тур с Самуи'],
  ogTitle: 'Барракудовый шторм у Чумпхон-Пиннакл и Сейл-Рок реален',
  ogDescription: 'Сотни барракуд в Сиамском заливе образуют серебряную воронку вокруг дайверов — и ни разу не нападают. Где, на какой глубине и почему безопасно.',
  content: `<p>Первый признак — тень над головой. Не облако: на глубине 24 метра в Сиамском заливе солнце редко пробивается так чисто, а движущийся потолок из рыбы, сотни особей, которые над вершиной стягиваются в медленное вращение. Меньше чем за минуту стая замыкает круг. Дайвер, зависший в центре, теперь стоит внутри живой серебряной воронки, что вращается и вращается и не собирается уходить.</p>

<p>У тайских дайверов для этого есть название — барракудовый шторм. Снимки выглядят постановочными. Они не постановочные.</p>

<h2>Шторм настоящий или байка дайв-центров?</h2>
<p>Настоящий, и случается он на двух вполне определённых подводных вершинах в западной части Сиамского залива — Чумпхон-Пиннакл у Ко Тао и Сейл-Рок между Ко Тао и Ко Пханган. Обе — одинокие гранитные башни, поднимающиеся из глубины, вокруг которых рыбе попросту негде спрятаться. Вся хитрость в этой географии. Открытая со всех сторон вода гонит течение через скалу, течение несёт планктон, планктон манит мелкую рыбу-корм, а рыба-корм манит хищников, что тысячами висят в синеве.</p>
<p>Главный герой зрелища — барракуда шеврон, <em>Sphyraena qenie</em>, стайный родич одиночной большой барракуды. Шевроны собираются сотнями, порой тысячами, и когда стая над вершиной уплотняет строй, она вращается — мерцающий серебряный столб, который фотографы не зря зовут штормом. Морские биологи описывают то же поведение суше: организованное скопление, дающее каждой рыбе больше защиты и лучшие шансы на охоту. Но дайверу в сердце воронки просто кажется, будто море решило закрутиться.</p>

<h2>Чумпхон-Пиннакл, где плотность рыбы становится погодой</h2>
<p>В двенадцати километрах к северо-западу от Ко Тао Чумпхон-Пиннакл — это скопление гранитных башен, разбросанных примерно на 200 метрах дна. Главная вершина стоит метрах в 14 под поверхностью; окружающие столбы обрываются до 30, затем 36 метров, а ниже идут песок и валуны. Верх скалы устилают ярко-розовые актинии, и место и вправду насыщено крупной рыбой — платаксы, каранксы, луцианы, груперы и местные стаи барракуд, что патрулируют участок, который дайверы попросту зовут Скалой Барракуд, обычно между 20 и 30 метрами.</p>
<table>
<tr><th>Показатель</th><th>Значение</th></tr>
<tr><td>Глубина вершины</td><td>~14 м</td></tr>
<tr><td>Рабочая глубина</td><td>18–30 м</td></tr>
<tr><td>Макс. глубина</td><td>36 м+</td></tr>
<tr><td>Видимость</td><td>15–30 м</td></tr>
<tr><td>Уровень</td><td>Advanced / найтрокс</td></tr>
</table>
<p>Из-за глубины это погружение не для первой недели. Чтобы попасть к настоящему рыбному действу, нужно провести время ниже 18 метров, а место лежит достаточно далеко от берега, чтобы течение быстро крепчало, а видимость менялась между погружениями. Сертификат Advanced Open Water — разумный минимум, а обогащённый воздух найтрокс покупает лишнее донное время, превращая беглый проход в настоящую встречу. Перед такой поездкой стоит прочитать, <a href="/ru/blogs/thailand-deepest-dive-wall-hin-muang">как далеко стоит гнать глубинную подготовку</a>.</p>

<h2>Сейл-Рок, воронка, что смыкается над головой</h2>
<p>Если Чумпхон славится плотностью, то Сейл-Рок — масштабом. Вершина пробивает поверхность — гранитный плавник, поднятый над водой метров на 15, — и уходит примерно на 40 метров вниз. Это единственное место в заливе, где стаи перестают просто впечатлять и начинают сбивать с ориентира. Дайверы видят здесь не тех двадцать-тридцать барракуд, к которым привыкли ближе к Ко Тао, а стаи в сотни, порой тысячи шевронов, желтохвостых и пикхэндл-барракуд вперемешку с большеглазыми каранксами, луцианами и цезиями. Когда один из таких столбов обвивает дайвера, серебряная стена достаточно плотна, чтобы стереть лодку, поверхность и всю остальную группу.</p>
<ul>
<li><strong>Профиль вершины</strong> — 15 м над поверхностью, обрыв до ~40 м вниз; к западу лежит спутниковая гряда камней, макушки около 18 м.</li>
<li><strong>Фирменная стая</strong> — шевроны, желтохвостые и пикхэндл-барракуды сотнями, плюс крупнейшая в заливе оседлая стая платаксов.</li>
<li><strong>Дымоход</strong> — вертикальный сквозной проход сквозь скалу, вход около 6 м, выход около 18 м; подробно в нашем <a href="/ru/blogs/sail-rock-chimney-best-gulf-of-thailand-dive">путеводителе по дымоходу Сейл-Рок</a>.</li>
<li><strong>Крупные гости</strong> — скумбрия, каранксы, тунец и в сезон китовые акулы, что делают Сейл-Рок одним из самых надёжных <a href="/ru/blogs/bus-sized-whale-shark-koh-tao">мест встречи с китовой акулой</a> в Таиланде.</li>
</ul>
<p>Расплата в том, что Сейл-Рок — открытое море. Видимость меняется от мутных нескольких метров до кристальных тридцати и может смениться между двумя погружениями одного дня. Течение приходит почти без предупреждения. Но именно это непостоянство кормит рыбу, так что это достоинство, а не изъян — и та самая причина, по которой плавучесть тут важнее, чем на любом укрытом рифе.</p>

<h2>Эти зубы выглядят угрозой. Вот почему это не так.</h2>
<p>Вблизи метровая барракуда — животное, отнюдь не успокаивающее. Нижняя челюсть выдаётся вперёд, зубы видны даже при закрытом рте, а рыба держит позицию немигающим фронтальным взглядом, который читается как угроза. О биологии стоит сказать прямо: барракуда шеврон — верховный хищник рифа, оснащённый всем, чтобы навредить. У неё просто нет причины направлять это оснащение на дайвера.</p>
<p>Задокументированные нападения на дайверов исчезающе редки, а те, что известны, почти всегда связаны с блестящей приманкой, только что подстреленной рыбой или рукой, протянутой не туда, — барракуда бьёт по вспышке металла, приняв её за удирающую рыбёшку. Оставленная в покое стая относится к дайверу как к декорации. Рыбы скорее любопытны, чем агрессивны; если подходить без резких выпадов, они держат дистанцию и позволяют дайверу вплыть в строй. Это тот же противоречащий интуиции урок, что залив повторяет снова и снова, будь то <a href="/ru/blogs/sea-snake-swims-toward-diver-rarely-bites">морская змея, плывущая прямо на маску</a>, или <a href="/ru/blogs/great-hammerhead-face-charge-danger">акула-молот, заполняющая кадр</a> и затем отворачивающая: хищник, который словно хочет причинить вред, почти всегда всего лишь разглядывает, кто ты.</p>

<h2>Как оказаться в самом центре воронки</h2>
<p>Тот самый снимок, которого все хотят, — дайвер в неподвижном центре вращающейся серебряной стены — получается не погоней за рыбой. Он получается, когда становишься мебелью. Барракуды раскрывают проход всему, что дёргается, и смыкают ряды вокруг всего, что тихо висит, так что техника почти неловко пассивна.</p>
<ul>
<li><strong>Зависать, а не плыть.</strong> Нейтральная плавучесть и медленные, минимальные движения ласт дают стае снова собраться вокруг вас, а не расступиться в бегстве.</li>
<li><strong>Руки держать при себе.</strong> Вытянутая рука читается как выпад; поджавшийся дайвер читается как безобидный. Не трогать, не указывать, не тянуться за кадром.</li>
<li><strong>Замедлить дыхание.</strong> Залп пузырей рассеивает столб. Долгий тихий выдох сохраняет стену и растягивает газ на глубине.</li>
<li><strong>Дать им подойти.</strong> Дрейфуйте по течению к краю стаи и остановитесь. Обычно меньше чем за минуту проход сам смыкается над головой.</li>
</ul>

<h2>Когда серебряный шторм и вправду появляется</h2>
<p>Барракуды живут здесь круглый год — стаи не сезонное событие, как китовые акулы, — но увидишь ли их толком, решают условия. Весь 2026 год западная часть залива держала долгую чистую полосу, и видимость достигала пика в окне с марта по август, которое подводные фотографы зовут золотым временем года. Август приходится на самую середину сезона китовых акул у Сейл-Рок, что тянется примерно с марта по сентябрь, так что одна дневная поездка в этом месяце даёт реальный шанс встретить и вихрь, и тень размером с автобус в одной воде.</p>
<p>Чумпхон-Пиннакл в последнее время тоже богаче рыбой обычного: местная популяция мраморного групера заметно выросла в 2026 году, отдельные особи теперь почти в длину дайвера. А тем, кто планирует после муссона, местный опыт подсказывает: сентябрь и октябрь часто дают здесь лучшую воду в году, а видимость переваливает за 40 метров, едва стихают ветры.</p>
<p>Добраться с островов легко. Скоростной катер идёт от Самуи до Сейл-Рок примерно 50 минут; обычная поездка на два погружения отходит от пирса около 9 утра, между погружениями подают обед, а к раннему дню вы уже на берегу — как правило, за 4650–4950 батов со снаряжением и трансфером. Чумпхон-Пиннакл дальше: около 90 минут на катере с Самуи или короче, 45 минут, если стартовать с самого Ко Тао, от примерно 5150 батов за два погружения.</p>

<h2>Чумпхон или Сейл-Рок — что бронировать первым</h2>
<p>Оба места дарят вихрь, так что выбор сводится к логистике и аппетиту к глубине. Сейл-Рок — более простой день: ближе к Самуи и Ко Пханган, мельче наверху и достаточно снисходителен, чтобы дайвер с только что полученным Advanced наслаждался верхом скалы, пока стаи кружат над головой между 10 и 18 метрами. Это и более надёжная ставка на китовую акулу, поэтому в сезон лодки здесь заполняются первыми. Чумпхон-Пиннакл вознаграждает опытных — самая густая рыба стоит глубже, течение напористее, а долгая дорога на катере тихо отсеивает случайную публику, отчасти поэтому крупная рыба там держится из года в год так стабильно. Дайвер с десятком записей в логбуке и ровным расходом воздуха возьмёт от Сейл-Рок больше всего; тот, кто гонится за самой плотной серебряной стеной, уверен на 30 метрах и в идеале дышит найтроксом, пусть направляет лодку к Чумпхону. Многие, кто остаётся на несколько дней, попросту ныряют в оба места два утра подряд и сверяют впечатления за обедом.</p>

<h2>Сохраните и отметьте бадди, которому доверитесь в самом центре</h2>
<p>Барракудовый шторм — из тех встреч, что звучат выдумкой, пока не разворачиваются вокруг вашей головы: ни клетки, ни прикорма, ни малейшей опасности для вас — лишь пара тысяч зубастых хищников решают, что вы достаточно близко к скале, чтобы сойти за декорацию. Ему место в коротком списке впечатлений тайских вод, ради которых стоит спланировать целую поездку, рядом с китовыми акулами и гранитными дымоходами тех же двух точек. Закрепите этот материал, напишите бадди, что должен вам поездку, и выберите своё окно. Шторм там уже закручивается.</p>

<h3>Источники</h3>
<ul>
<li><a href="https://www.padi.com/dive-site/thailand/sail-rock-3/" rel="nofollow">PADI — карточка дайв-сайта Сейл-Рок</a></li>
<li><a href="https://www.divessi.com/en/mydiveguide/divesite/sail-rock-thailand-sailrock-prab-wreck-108489" rel="nofollow">SSI MyDiveGuide — Сейл-Рок, Таиланд</a></li>
<li><a href="https://www.scubadiving.com/diving-with-schools-barracuda" rel="nofollow">Scuba Diving Magazine — погружения со стаями барракуд</a></li>
<li><a href="https://a-z-animals.com/animals/barracuda/" rel="nofollow">A-Z Animals — барракуда: факты и поведение</a></li>
</ul>`
};

const payload = {
  status: 'DRAFT',
  category: 'DIVE_SITES',
  covers: [],
  mjPrompt: mjPrompt,
  translations: [en, th, cn, ja, ko, de, fr, ru]
};

fs.writeFileSync('/tmp/blog-payload.json', JSON.stringify(payload));
console.log('written', JSON.stringify(payload).length, 'bytes');
console.log('langs', payload.translations.map(t => t.lang).join(','));
for (const t of payload.translations) {
  console.log(t.lang, 'title', t.title.length, 'ch | content', t.content.length, 'ch');
}
