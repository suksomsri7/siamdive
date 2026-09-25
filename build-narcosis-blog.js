// Builds the DRAFT blog payload for "Why 40 Metres Down Feels Like Two Martinis"
// Category: EDUCATION. 8 languages, native rewrites. Writes /root/projects/siamdive/narcosis-payload.json
const fs = require('fs');

const mjPrompt = "A recreational scuba diver hovering at forty metres in clear tropical blue water, one hand raised holding a wrist dive computer close to a slightly unfocused mask, the reef wall falling away into deep haze below, faint dreamy stillness in the diver's posture as if the depth itself has slowed them, cathedral shafts of soft sunlight fanning down from the surface far above, three-layer depth from foreground diver to mid-water blue to dark drop-off, in the style of David Doubilet reef and human-in-water photography, Nikon Z9 in Nauticam housing, Nikkor 14-30mm f/4, shot on Kodak Ektachrome E100, fine grain, faithful color, no digital smoothing, National Geographic editorial photography, documentary wildlife photojournalism, unposed, observed from respectful distance, decisive moment of honest behavior, suspended particulate visible in the water column, honest exposure, no HDR, no saturation boost, deep shadows allowed, no text, no watermark, no logo --no illustration, painting, render, cgi, cartoon, 3d, anime, hdr, oversaturated, stock photo, watercolor, digital art, fantasy, neon, glossy, plastic, airbrushed, smooth skin, cinematic color grade, teal and orange, instagram filter --style raw --s 25 --v 7";

const translations = [];

// ---------------- EN ----------------
translations.push({
  lang: "en",
  title: "Why 40 Metres Down Feels Like Two Martinis",
  slug: "why-40-metres-feels-like-two-martinis",
  excerpt: "Descend past 30 metres and the nitrogen in your tank starts working like alcohol, dulling judgment before you notice. Here is why — and the three-metre fix.",
  keywords: ["nitrogen narcosis","martini effect diving","rapture of the deep","nitrogen narcosis symptoms","gas narcosis scuba","narcosis depth onset","how to treat nitrogen narcosis","martini's law diving","narcosis at 30 metres"],
  ogTitle: "Nitrogen Narcosis: The Deep-Water Buzz That Fools Divers",
  ogDescription: "Why deep diving can feel like drinking, what really happens at 30 and 40 metres, and the simple ascent that clears your head in seconds.",
  content: `<p>Fin down past thirty metres on a clear day and something quietly strange can happen. The reef looks a shade brighter. A joke that fell flat on the boat is suddenly hilarious. Reading the pressure gauge takes a beat longer than it should. Nothing hurts, nothing alarms — and that pleasant, slightly-removed feeling is exactly the problem.</p>

<p>Divers have a name for it: nitrogen narcosis. Older hands call it the martini effect, or rapture of the deep. It is one of the few hazards in diving that arrives feeling <em>good</em>, which is precisely why it catches experienced people off guard.</p>

<h2>The gas in every tank has a second life</h2>
<p>The air in your cylinder is about 78 percent nitrogen. At the surface it is inert — it rides in and out of your lungs and does nothing. Squeeze it under pressure, though, and it changes character.</p>
<p>At thirty metres the water above you presses down at four times the weight of the atmosphere at sea level. The air you breathe is four times denser, which means four times as many nitrogen molecules cross into your blood with every breath. That nitrogen dissolves easily into fat, and nerve cells are wrapped in fatty membranes. The brain, richest in lipids of all, soaks it up. Once inside those membranes the gas gums up the electrical signalling between neurons — the same broad way a mild anaesthetic works. As the Encyclopædia Britannica puts it, the narcotic effect becomes detectable at roughly four times surface pressure, which is the depth where this story starts.</p>

<h2>Martini's Law, minus the glass</h2>
<p>Instructors reach for an old rule of thumb to describe the feeling. Martini's Law says that every ten metres or so below about twenty metres hits you like one dry martini on an empty stomach. It is an analogy, not a measurement — but it captures the shape of the thing well.</p>
<dl>
  <dt>Around 20 metres</dt>
  <dd>Nothing obvious, though lab tests catch tiny dips in concentration and quick thinking.</dd>
  <dt>Around 30 metres</dt>
  <dd>Roughly one martini. A loose, warm, slightly slow feeling for many divers.</dd>
  <dt>Around 40 metres</dt>
  <dd>Roughly two martinis — and forty metres is the outer limit of recreational diving.</dd>
  <dt>Below 40 metres</dt>
  <dd>The effect climbs faster than the depth. This is no longer recreational territory.</dd>
</dl>
<p>The crucial word is <em>roughly</em>. There is no gauge for narcosis and no fixed depth where it switches on. One diver feels clear-headed at forty; another notices a fog at twenty-five. Cold water, hard work, a heavy breathing rate and stress all bring it on sooner. The same person can be affected differently on two dives in the same week.</p>

<h2>It arrives on a ladder, not a cliff</h2>
<p>Because the onset creeps rather than jumps, narcosis maps neatly onto the way divers build depth through their training.</p>
<ul>
  <li><strong>Open Water, to 18 metres:</strong> most divers feel nothing at all, yet controlled studies have measured small slips in executive function — planning, judgment — at depths as shallow as 20 metres.</li>
  <li><strong>Advanced, to 30 metres:</strong> this is the threshold where the risk of real impairment begins to climb, and where the martini feeling starts to show for many people.</li>
  <li><strong>Recreational limit, 40 metres:</strong> about two martinis' worth of fog, with far less mental margin for a problem than the same diver has at 18 metres.</li>
  <li><strong>Beyond 40 metres:</strong> impairment becomes consistent rather than occasional. In one classic memory study, divers asked to recall information at sixty metres lost around 31 percent of their long-term recall compared with the surface.</li>
</ul>

<h2>Why a happy diver at depth is a dangerous one</h2>
<p>The buzz is the bait. Because narcosis usually feels mild and pleasant, the affected diver is the last to know. Judgment blunts, reactions slow, and the mind can lock onto a single idea and ignore everything else — a phenomenon instructors call fixation.</p>
<p>The sport's founding literature is full of it. Jacques Cousteau coined the phrase <em>l'ivresse des grandes profondeurs</em> — the rapture of the deep — after watching divers at depth behave as though drunk, some fumbling with their gear, some described as offering a regulator to a passing fish because a narced brain had decided it no longer needed to breathe. Those old accounts sound cartoonish, but the modern danger is duller and more real: a narced diver quietly disregards the plan. They drift deeper chasing something, forget to check their gas, mistime an ascent, or miss a buddy's signal. The gas does not make you pass out at recreational depths. It makes you a worse decision-maker at the exact moment good decisions matter most.</p>
<p>It is also easy to confuse with other problems. A slow, foggy diver at depth might be narced — or might be showing the first sign of something else entirely, which is why it pays to know <a href="/en/blogs/why-heart-attack-at-25-metres-looks-like-narcosis">how a cardiac event at 25 metres can look exactly like narcosis</a>, and why <a href="/en/blogs/headache-at-20-metres-might-not-be-narcosis">a headache at 20 metres often is not narcosis at all</a>.</p>

<h2>The fix is three metres up</h2>
<p>Here is the reassuring part. Narcosis is completely reversible, and the cure needs no drug, no chamber and no drama. Ascend a few metres — as little as three — and the pressure drops, the excess nitrogen comes back out of those nerve membranes, and the head clears within seconds to a couple of minutes. There is no hangover and, for a normal recreational dive, no lasting mark. The golden sequence taught worldwide is three short words: stop, signal, ascend. Stop descending, tell your buddy, go up a little. Do not push deeper to "see if it passes."</p>
<p>One caveat has surfaced recently. A 2024 study that ran divers through a simulated fifty-metre dive found that breathing plain air on the way up left a measurable trace behind: balance control, tested with a sharpened Romberg stand, worsened after the dive, with the share of failed tests rising from 47 percent before to 67 percent after. Divers who breathed oxygen during decompression stayed steady. It is a reminder that deep exposures may not scrub as instantly clean as the "just go shallower" rule suggests — one more argument for treating 40 metres as a hard ceiling, not a target.</p>

<h2>What your buddy is actually for</h2>
<p>Because you cannot reliably judge your own narcosis, the buddy system stops being a formality and becomes the safety net. A narced diver is often obvious from the outside long before they feel anything is wrong. Watch a partner for a blank stare into the blue, fumbling with a simple clip, slow or wrong answers to hand signals, wandering off the planned route, or a mood that has swung oddly cheerful or anxious.</p>
<p>One neat field check: at depth, hold up a number of fingers and expect your buddy to answer with that number plus one. Show two, they should show three. Any other answer — or a long pause — is a cue to head shallower together. It is the same principle behind knowing the <a href="/en/blogs/5-narcosis-red-flags-buddy-misses-30-metres">narcosis red flags a buddy tends to miss at 30 metres</a>, and it is why <a href="/en/blogs/at-30-metres-instructor-stops-helping-on-purpose">instructors deliberately step back at 30 metres</a> so students learn to catch it themselves.</p>

<h2>Staying ahead of the narc</h2>
<p>You cannot train your body to stop absorbing nitrogen, but you can shrink your exposure and stack the odds.</p>
<ul>
  <li><strong>Dive your card.</strong> The depth limits on a certification are not bureaucracy; they keep you inside the zone where narcosis stays mild and a three-metre ascent still fixes it.</li>
  <li><strong>Descend slowly, feet first, on a line.</strong> A rapid drop lands you deep before your head has caught up, which magnifies the hit.</li>
  <li><strong>Arrive rested and warm.</strong> Cold, fatigue, a hangover, high carbon-dioxide from heavy finning and plain stress all lower the depth at which the fog sets in.</li>
  <li><strong>Do not expect nitrox to save you.</strong> This is the big misconception. Enriched air still contains plenty of nitrogen, so it does nothing to reduce narcosis — and its lower oxygen limit actually caps how deep you can safely take it, a trap covered in <a href="/en/blogs/nitrox-mod-oxygen-toxicity-depth-limit">the 34-metre nitrox limit too many divers ignore</a>.</li>
</ul>
<p>The only gas that genuinely thins the narcotic load is helium, which is why technical and commercial divers heading below recreational depths breathe trimix. On the relative scale of narcotic strength, helium sits at 0.045, nitrogen at 1.0 and argon at a hefty 2.3 — helium is barely narcotic at all, which is exactly why it is worth its considerable cost at depth.</p>

<p>None of this makes narcosis a character flaw or a rare freak event. It is physics acting on every diver who goes deep enough — as ordinary as your ears needing to equalise. Respect the ceiling, dive with a buddy who can read you, and remember that the cure is always just a few metres above your head. Tag the buddy you always follow into the deep. Has the bottom ever felt a little too good?</p>

<h3>Sources</h3>
<ul>
  <li><a href="https://blog.padi.com/nitrogen-narcosis-what-divers-need-to-know/" rel="nofollow">PADI — Nitrogen Narcosis: symptoms, onset and management</a></li>
  <li><a href="https://www.britannica.com/science/nitrogen-narcosis" rel="nofollow">Encyclopaedia Britannica — Nitrogen narcosis: physiology and pressure</a></li>
  <li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC11278881/" rel="nofollow">NIH/NCBI — Narcotic nitrogen effects persist after a simulated 50 m dive (2024)</a></li>
  <li><a href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4337274/" rel="nofollow">NIH/NCBI — Inert gas narcosis and underwater activities (review)</a></li>
</ul>`
});

// ---------------- TH ----------------
translations.push({
  lang: "th",
  title: "ลึก 40 เมตร เมาเท่ามาร์ตินี่ 2 แก้ว",
  slug: "why-40-metres-feels-like-two-martinis-th",
  excerpt: "ลงลึกเกิน 30 เมตร ไนโตรเจนในถังเริ่มออกฤทธิ์เหมือนเหล้า ทำให้มึนก่อนจะรู้ตัว มาดูว่าทำไม และวิธีแก้ที่ใช้แค่ลอยขึ้น 3 เมตร",
  keywords: ["เมาน้ำลึก","ไนโตรเจนนาร์โคซิส","martini effect ดำน้ำ","อาการเมาน้ำลึก","ดำน้ำลึกมึน","แก้เมาน้ำลึก","ความลึกที่เริ่มเมา","กฎมาร์ตินี่ดำน้ำ","เมาน้ำลึก 30 เมตร"],
  ogTitle: "เมาน้ำลึกคืออะไร อาการมึนที่หลอกนักดำน้ำเก่ง ๆ",
  ogDescription: "ทำไมดำลึกแล้วเหมือนเมาเหล้า เกิดอะไรที่ 30 กับ 40 เมตร และวิธีเคลียร์หัวในไม่กี่วินาที",
  content: `<p>ดำลงไปเกินสามสิบเมตรในวันที่น้ำใส บางครั้งจะเกิดเรื่องแปลก ๆ เงียบ ๆ ปะการังดูสีสดขึ้นนิดหนึ่ง มุกที่บนเรือฝืดสุด ๆ กลับตลกขึ้นมาเฉย ๆ อ่านเกจวัดแรงดันช้ากว่าปกติไปครึ่งจังหวะ ไม่มีอะไรเจ็บ ไม่มีอะไรเตือน และความรู้สึกล่องลอยสบาย ๆ นั่นแหละคือปัญหา</p>

<p>นักดำน้ำเรียกอาการนี้ว่า "เมาน้ำลึก" หรือไนโตรเจนนาร์โคซิส รุ่นเก๋าเรียกมันว่า martini effect หรือ "ความเคลิ้มแห่งห้วงลึก" มันเป็นหนึ่งในไม่กี่อันตรายของการดำน้ำที่มาพร้อมความรู้สึก <em>ดี</em> และนั่นคือเหตุผลที่มันเล่นงานคนมีประสบการณ์ได้เสมอ</p>

<h2>อากาศในถังทุกใบมีอีกด้านที่ซ่อนอยู่</h2>
<p>อากาศในถังของคุณเป็นไนโตรเจนราว 78 เปอร์เซ็นต์ ที่ผิวน้ำมันเฉื่อยสนิท เข้าออกปอดไปเฉย ๆ ไม่ทำอะไร แต่พออัดด้วยความดัน มันเปลี่ยนนิสัย</p>
<p>ที่สามสิบเมตร น้ำเหนือหัวกดลงมาหนักเป็นสี่เท่าของบรรยากาศที่ระดับน้ำทะเล อากาศที่หายใจจึงหนาแน่นขึ้นสี่เท่า แปลว่าไนโตรเจนเข้าสู่เลือดต่อหนึ่งลมหายใจมากขึ้นสี่เท่าเช่นกัน ไนโตรเจนละลายเข้าไขมันได้ง่าย และเซลล์ประสาทก็ห่อหุ้มด้วยเยื่อไขมัน สมองซึ่งมีไขมันมากที่สุดจึงดูดซับมันไว้ พอแทรกเข้าไปในเยื่อหุ้ม ก๊าซก็ไปกวนสัญญาณไฟฟ้าระหว่างเซลล์ประสาท คล้ายกับที่ยาสลบอ่อน ๆ ทำงาน สารานุกรมบริแทนนิการะบุว่าฤทธิ์กดประสาทเริ่มจับสังเกตได้ที่ราวสี่เท่าของความดันผิวน้ำ ซึ่งก็คือความลึกที่เรื่องนี้เริ่มต้น</p>

<h2>กฎมาร์ตินี่ ฉบับไม่ต้องมีแก้ว</h2>
<p>ครูสอนดำน้ำมักหยิบกฎเก่ามาอธิบายความรู้สึกนี้ กฎมาร์ตินี่บอกว่า ทุก ๆ สิบเมตรที่ลึกเกินราวยี่สิบเมตร จะซัดคุณเหมือนดื่มมาร์ตินี่แห้งหนึ่งแก้วตอนท้องว่าง มันเป็นการเปรียบเทียบ ไม่ใช่การวัดจริง แต่ก็จับรูปร่างของอาการได้ดี</p>
<dl>
  <dt>ราว 20 เมตร</dt>
  <dd>ยังไม่มีอะไรชัด แต่การทดลองในแล็บจับได้ว่าสมาธิและความคิดเร็วเริ่มตกเล็กน้อย</dd>
  <dt>ราว 30 เมตร</dt>
  <dd>ประมาณมาร์ตินี่หนึ่งแก้ว หลายคนรู้สึกโล่ง ๆ อุ่น ๆ และช้าลงนิดหน่อย</dd>
  <dt>ราว 40 เมตร</dt>
  <dd>ประมาณสองแก้ว และสี่สิบเมตรคือเพดานนอกสุดของการดำน้ำเพื่อการพักผ่อน</dd>
  <dt>ลึกกว่า 40 เมตร</dt>
  <dd>ฤทธิ์ไต่ขึ้นเร็วกว่าความลึก ตรงนี้ไม่ใช่เขตของนักดำน้ำทั่วไปแล้ว</dd>
</dl>
<p>คำสำคัญคือ "ประมาณ" ไม่มีเกจวัดความเมา และไม่มีความลึกตายตัวที่มันจะเปิดสวิตช์ บางคนหัวโล่งที่สี่สิบเมตร อีกคนเริ่มมึนตั้งแต่ยี่สิบห้า น้ำเย็น การออกแรงหนัก อัตราหายใจถี่ และความเครียด ล้วนเรียกมันมาเร็วขึ้น คน ๆ เดียวกันยังเมาไม่เท่ากันในการดำสองไดฟ์ในสัปดาห์เดียว</p>

<h2>มันมาแบบค่อย ๆ ไต่ ไม่ใช่ตกหน้าผา</h2>
<p>เพราะอาการค่อย ๆ คืบ ไม่ได้กระโดด เมาน้ำลึกจึงทาบได้พอดีกับวิธีที่นักดำน้ำสะสมความลึกไปตามคอร์ส</p>
<ul>
  <li><strong>Open Water ถึง 18 เมตร:</strong> ส่วนใหญ่ไม่รู้สึกอะไรเลย แต่งานวิจัยที่ควบคุมตัวแปรวัดได้ว่าการวางแผนและการตัดสินใจเริ่มพลาดเล็กน้อยตั้งแต่ตื้นแค่ 20 เมตร</li>
  <li><strong>Advanced ถึง 30 เมตร:</strong> นี่คือเส้นที่ความเสี่ยงของอาการจริงเริ่มไต่ขึ้น และเป็นจุดที่ความรู้สึกแบบมาร์ตินี่เริ่มโผล่สำหรับหลายคน</li>
  <li><strong>เพดานทั่วไป 40 เมตร:</strong> มึนราวสองแก้ว โดยเหลือพื้นที่ให้สมองรับมือปัญหาน้อยกว่าตอนอยู่ที่ 18 เมตรมาก</li>
  <li><strong>ลึกกว่า 40 เมตร:</strong> อาการเริ่มสม่ำเสมอ ไม่ใช่นาน ๆ ที ในงานวิจัยความจำชิ้นคลาสสิก นักดำน้ำที่ถูกให้จำข้อมูลที่หกสิบเมตร ความจำระยะยาวหายไปราว 31 เปอร์เซ็นต์เทียบกับที่ผิวน้ำ</li>
</ul>

<h2>ทำไมนักดำน้ำที่อารมณ์ดีใต้น้ำลึกถึงอันตราย</h2>
<p>ความเคลิ้มคือเหยื่อล่อ เพราะเมาน้ำลึกมักรู้สึกเบาและสบาย คนที่โดนจึงเป็นคนสุดท้ายที่รู้ตัว การตัดสินใจทื่อลง ปฏิกิริยาช้าลง และสมองอาจล็อกอยู่กับความคิดเดียวจนมองข้ามทุกอย่าง อาการที่ครูเรียกว่า "จมกับความคิด"</p>
<p>ตำราต้นตำรับของวงการเต็มไปด้วยเรื่องแบบนี้ ฌัก กุสโต ตั้งชื่อมันว่า <em>l'ivresse des grandes profondeurs</em> หรือความเคลิ้มแห่งห้วงลึก หลังเห็นนักดำน้ำที่ระดับลึกทำตัวเหมือนคนเมา บางคนจับอุปกรณ์งก ๆ บางคนถูกเล่าว่ายื่นเรกกูเลเตอร์ให้ปลาที่ว่ายผ่าน เพราะสมองที่มึนตัดสินไปแล้วว่าไม่ต้องหายใจอีก เรื่องเก่าเหล่านี้ฟังดูเว่อร์ แต่อันตรายยุคนี้จืดกว่าและจริงกว่า คนที่เมาน้ำลึกจะแอบทิ้งแผนเงียบ ๆ ไหลลึกลงไปตามอะไรบางอย่าง ลืมเช็กอากาศ ขึ้นผิดจังหวะ หรือมองไม่เห็นสัญญาณของบัดดี้ ที่ความลึกทั่วไปก๊าซไม่ได้ทำให้สลบ แต่มันทำให้คุณตัดสินใจแย่ลงพอดีในจังหวะที่การตัดสินใจดี ๆ สำคัญที่สุด</p>
<p>แถมยังสับสนกับปัญหาอื่นได้ง่าย นักดำน้ำที่ช้าและมึนใต้น้ำอาจกำลังเมาน้ำลึก หรืออาจกำลังแสดงสัญญาณแรกของอย่างอื่นไปเลย จึงควรรู้ว่า <a href="/th/blogs/why-heart-attack-at-25-metres-looks-like-narcosis">ภาวะหัวใจที่ 25 เมตรดูเหมือนเมาน้ำลึกเป๊ะได้อย่างไร</a> และทำไม <a href="/th/blogs/headache-at-20-metres-might-not-be-narcosis">อาการปวดหัวที่ 20 เมตรมักไม่ใช่เมาน้ำลึก</a></p>

<h2>ทางแก้อยู่เหนือหัวขึ้นไปแค่ 3 เมตร</h2>
<p>ตรงนี้คือส่วนที่ให้อุ่นใจ เมาน้ำลึกหายกลับได้สนิท และวิธีรักษาไม่ต้องใช้ยา ไม่ต้องเข้าห้องอัดความดัน ไม่ต้องดราม่า แค่ลอยขึ้นไม่กี่เมตร น้อยแค่สามเมตรก็พอ ความดันลด ไนโตรเจนส่วนเกินไหลออกจากเยื่อประสาท และหัวก็เคลียร์ภายในไม่กี่วินาทีถึงสองสามนาที ไม่มีอาการค้าง และสำหรับไดฟ์ทั่วไปก็ไม่ทิ้งรอยอะไรไว้ ลำดับทองที่สอนกันทั่วโลกคือสามคำสั้น ๆ หยุด ส่งสัญญาณ ลอยขึ้น หยุดลงลึก บอกบัดดี้ แล้วขึ้นมานิดหนึ่ง อย่าดันลึกต่อเพื่อ "ลองดูว่ามันจะหายไหม"</p>
<p>มีข้อควรระวังหนึ่งที่เพิ่งโผล่มา งานวิจัยปี 2024 ที่ให้นักดำน้ำผ่านการจำลองไดฟ์ห้าสิบเมตร พบว่าการหายใจอากาศธรรมดาตอนขึ้นทิ้งร่องรอยที่วัดได้ไว้ การทรงตัวซึ่งทดสอบด้วยท่ายืน Sharpened Romberg แย่ลงหลังดำ สัดส่วนที่สอบไม่ผ่านเพิ่มจาก 47 เปอร์เซ็นต์ก่อนดำเป็น 67 เปอร์เซ็นต์หลังดำ ส่วนคนที่หายใจออกซิเจนระหว่างช่วงคลายความดันยังทรงตัวได้นิ่ง มันเตือนว่าการดำลึกอาจไม่ได้สะอาดหมดจดในทันทีอย่างที่กฎ "แค่ขึ้นตื้น" ชวนให้คิด และเป็นอีกเหตุผลที่ควรถือ 40 เมตรเป็นเพดานตายตัว ไม่ใช่เป้าหมาย</p>

<h2>บัดดี้มีไว้เพื่ออะไรกันแน่</h2>
<p>เพราะคุณตัดสินความเมาของตัวเองได้ไม่แม่น ระบบบัดดี้จึงเลิกเป็นพิธีการและกลายเป็นตาข่ายกันตก คนที่เมาน้ำลึกมักดูออกจากข้างนอกก่อนที่เจ้าตัวจะรู้สึกว่าผิดปกตินานเลย คอยดูเพื่อนว่ามีสายตาเหม่อลอยมองเข้าไปในสีน้ำเงินไหม จับตัวล็อกง่าย ๆ งก ๆ ไหม ตอบสัญญาณมือช้าหรือผิดไหม ว่ายหลุดจากเส้นทางที่วางไว้ไหม หรืออารมณ์แกว่งร่าเริงหรือกังวลผิดปกติไหม</p>
<p>มีวิธีเช็กง่าย ๆ ใต้น้ำ ชูนิ้วให้เพื่อนดูจำนวนหนึ่ง แล้วคาดให้เพื่อนตอบด้วยจำนวนนั้นบวกหนึ่ง ชูสองนิ้ว เพื่อนควรชูสาม ถ้าตอบเป็นอย่างอื่นหรือนิ่งไปนาน นั่นคือสัญญาณให้ขึ้นตื้นไปด้วยกัน หลักการเดียวกับการรู้ <a href="/th/blogs/5-narcosis-red-flags-buddy-misses-30-metres">สัญญาณเมาน้ำลึกที่บัดดี้มักพลาดที่ 30 เมตร</a> และเป็นเหตุผลที่ <a href="/th/blogs/at-30-metres-instructor-stops-helping-on-purpose">ครูจงใจถอยออกที่ 30 เมตร</a> เพื่อให้ลูกศิษย์ฝึกจับอาการเอง</p>

<h2>ตัดหน้าความเมาให้ทัน</h2>
<p>คุณฝึกร่างกายให้เลิกดูดไนโตรเจนไม่ได้ แต่ลดการรับเข้าและเพิ่มโอกาสฝั่งตัวเองได้</p>
<ul>
  <li><strong>ดำตามบัตร</strong> ขีดจำกัดความลึกบนบัตรไม่ใช่กฎกระดาษ มันกันคุณให้อยู่ในโซนที่ความเมายังเบา และการลอยขึ้นสามเมตรยังแก้ได้</li>
  <li><strong>ลงช้า ๆ เอาเท้าลงก่อน เกาะเชือก</strong> การดิ่งเร็วพาคุณไปลึกก่อนที่หัวจะตามทัน ยิ่งทำให้โดนหนัก</li>
  <li><strong>มาแบบพักเต็มที่และตัวอุ่น</strong> ความหนาว ความล้า อาการค้างจากเหล้า คาร์บอนไดออกไซด์สูงจากการตีฟินหนัก และความเครียด ล้วนดึงความลึกที่เริ่มมึนให้ตื้นขึ้น</li>
  <li><strong>อย่าหวังให้ไนตรอกซ์ช่วย</strong> นี่คือความเข้าใจผิดข้อใหญ่ อากาศเสริมออกซิเจนยังมีไนโตรเจนอยู่เพียบ จึงไม่ได้ช่วยลดความเมาเลย แถมขีดจำกัดออกซิเจนที่ต่ำกว่ายังจำกัดความลึกที่พาลงได้อย่างปลอดภัย กับดักที่อธิบายไว้ใน <a href="/th/blogs/nitrox-mod-oxygen-toxicity-depth-limit">ขีดจำกัด 34 เมตรของไนตรอกซ์ที่นักดำน้ำหลายคนมองข้าม</a></li>
</ul>
<p>ก๊าซเดียวที่เจือความเมาให้จางลงจริง ๆ คือฮีเลียม จึงเป็นเหตุผลที่นักดำน้ำเทคนิคและงานพาณิชย์ซึ่งลงลึกเกินเขตทั่วไปหายใจไตรมิกซ์ บนสเกลความแรงของฤทธิ์กดประสาท ฮีเลียมอยู่ที่ 0.045 ไนโตรเจนที่ 1.0 และอาร์กอนสูงถึง 2.3 ฮีเลียมแทบไม่กดประสาทเลย ซึ่งก็คือเหตุผลที่มันคุ้มค่าตัวแพงลิบเมื่ออยู่ที่ระดับลึก</p>

<p>ทั้งหมดนี้ไม่ได้แปลว่าเมาน้ำลึกเป็นข้อบกพร่องของใคร หรือเป็นเหตุประหลาดที่นาน ๆ เกิดที มันคือฟิสิกส์ที่ทำงานกับนักดำน้ำทุกคนที่ลงลึกพอ ธรรมดาพอ ๆ กับที่หูต้องเคลียร์ความดัน เคารพเพดาน ดำกับบัดดี้ที่อ่านคุณออก และจำไว้ว่าทางแก้อยู่เหนือหัวขึ้นไปแค่ไม่กี่เมตรเสมอ แท็กบัดดี้ที่คุณตามลงลึกด้วยกันประจำ เคยไหมที่พื้นข้างล่างรู้สึกดีเกินไปหน่อย?</p>

<h3>แหล่งอ้างอิง</h3>
<ul>
  <li><a href="https://blog.padi.com/nitrogen-narcosis-what-divers-need-to-know/" rel="nofollow">PADI — เมาน้ำลึก อาการ จุดเริ่ม และการจัดการ</a></li>
  <li><a href="https://www.britannica.com/science/nitrogen-narcosis" rel="nofollow">Encyclopaedia Britannica — สรีรวิทยาและความดันของเมาน้ำลึก</a></li>
  <li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC11278881/" rel="nofollow">NIH/NCBI — ฤทธิ์ไนโตรเจนค้างหลังจำลองไดฟ์ 50 เมตร (2024)</a></li>
  <li><a href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4337274/" rel="nofollow">NIH/NCBI — บทปริทัศน์ก๊าซเฉื่อยกดประสาทกับการดำน้ำ</a></li>
</ul>`
});

fs.writeFileSync('/root/projects/siamdive/narcosis-payload-part1.json', JSON.stringify(translations));
console.log('part1 langs:', translations.map(t=>t.lang).join(','));
console.log('EN content chars:', translations[0].content.length);
