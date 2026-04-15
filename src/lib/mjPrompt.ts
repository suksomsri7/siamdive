// Midjourney prompt builder — NatGeo documentary realism v3
//
// v3 design: v2 was too minimal (stripped all drama → flat images).
// Real NatGeo is BOTH documentary AND dramatic — the drama comes from
// LIGHT and MOMENT, not from saturation or "cinematic" keywords.
//
// Key moves in v3:
// - Name-check NatGeo photographers as style anchors (Paul Nicklen for
//   underwater wildlife, David Doubilet for reef/big-animal scenes,
//   Brian Skerry for marine mammals, Thomas Peschak for sharks/rays).
//   MJ v7 recognizes these names as real photographic styles.
// - Per-scene LIGHTING brief — "backlit by surface sunlight", "god rays",
//   "low-angle afternoon light", "rim light from open water". Light is
//   what makes a NatGeo photo, not adjectives.
// - Per-scene EMOTIONAL beat — tension, awe, tenderness, isolation,
//   curiosity. Told in action ("mother with calf", "first breath at
//   surface"), never as adjectives ("emotional", "powerful").
// - Composition language — foreground/midground/background layering,
//   wide environmental portrait, telephoto compression, low angle.
// - Keep unposed/documentary core, real film stocks, particulate,
//   off-center. Keep `--style raw --v 7`. Lift `--s` 10 → 25 (a touch
//   more style freedom for dramatic lighting).

type Lens = "macro" | "wide" | "telephoto";

type SceneMatch = {
  test: RegExp;
  scene: string;       // subject + action + emotional beat
  light: string;       // the defining light of the frame
  composition: string; // how the frame is constructed
  anchor: string;      // photographer style reference
  lens: Lens;
};

const SCENES: SceneMatch[] = [
  // ── Macro / small creatures ──────────────────────────────────────────────
  { test: /nudibranch|sea slug|ทากทะเล/, lens: "macro",
    scene: `a Chromodoris nudibranch mid-crawl across a sponge, cerata catching the light, rhinophores angled forward — curiosity held in a small body`,
    light: `single diffused strobe from above-left, falling off into black negative space`,
    composition: `extreme close-up, subject in upper third, sponge texture as foreground layer`,
    anchor: `in the style of David Liittschwager macro studio work` },
  { test: /seahorse|ม้าน้ำ/, lens: "macro",
    scene: `a pygmy seahorse wrapped around a gorgonian branch, tail gripping, one visible eye tracking the lens — a stillness under observation`,
    light: `soft side light from a single strobe, background deep green-blue fading to black`,
    composition: `tight frame, subject partly hidden behind coral branch, foreground bokeh`,
    anchor: `in the style of David Doubilet reef macro` },
  { test: /octopus|หมึก(?!กระดอง)/, lens: "macro",
    scene: `a reef octopus low in a rock den at dusk, skin texture shifting from smooth to papillae, one eye meeting the camera — intelligence holding its breath`,
    light: `warm low-angle ambient from the surface, no strobe, shadows deep`,
    composition: `eye-level with the subject, rock as frame around the animal`,
    anchor: `in the style of Laurent Ballesta quiet encounter photography` },
  { test: /frogfish|กบ/, lens: "macro",
    scene: `a hairy frogfish locked into a sponge, lappets matching the substrate exactly, mouth slightly open — predator waiting, time suspended`,
    light: `single snooted strobe isolating the animal from its background`,
    composition: `spot-lit subject against black falloff, texture-heavy foreground`,
    anchor: `in the style of Alex Mustard black-background macro` },
  { test: /cuttlefish|หมึกกระดอง/, lens: "macro",
    scene: `a pharaoh cuttlefish hovering with arms in hunting curl, chromatophores pulsing across the mantle — a moment before it strikes`,
    light: `side-lit from an angled strobe, water column behind the subject open and blue`,
    composition: `profile view, negative space to the right for anticipated motion`,
    anchor: `in the style of Paul Nicklen behavior photography` },
  { test: /shrimp|กุ้ง|cleaner/, lens: "macro",
    scene: `a cleaner shrimp working the open mouth of a moray eel at a cleaning station, trust held between predator and partner`,
    light: `ambient reef light, soft fill from a diffused strobe, no harsh shadows`,
    composition: `frame split between shrimp and eel's eye, intimate interspecies portrait`,
    anchor: `in the style of Thomas Peschak symbiosis work` },
  { test: /jellyfish|แมงกะพรุน/, lens: "wide",
    scene: `a moon jellyfish pulsing through open water, oral arms trailing — drifting alone in an empty column`,
    light: `backlit by surface sunlight, translucent bell glowing against dark water below`,
    composition: `subject in upper-left third, negative space below carrying weight`,
    anchor: `in the style of David Doubilet water-column portraiture` },

  // ── Large pelagics ───────────────────────────────────────────────────────
  { test: /manta/, lens: "wide",
    scene: `an oceanic manta ray at a cleaning station, passing over the reef in slow rotation, cleaner wrasse working the underside — the quiet authority of a ten-foot wingspan`,
    light: `god rays breaking through the surface above, water column filled with slanted light shafts`,
    composition: `low-angle looking up, manta silhouetted across the top of the frame, diver small in the lower corner for scale`,
    anchor: `in the style of Thomas Peschak elasmobranch photography` },
  { test: /whale shark|ฉลามวาฬ/, lens: "wide",
    scene: `a whale shark moving through plankton clouds, spotted pattern catching the light along its flank — a snorkeler small in the frame, giving the animal its room`,
    light: `slanted afternoon sunlight from the upper surface, suspended particulate visible in the beams`,
    composition: `wide environmental portrait, shark at 40-degree diagonal across the frame, human for scale in lower right`,
    anchor: `in the style of Brian Skerry pelagic work` },
  { test: /shark|ฉลาม/, lens: "wide",
    scene: `a grey reef shark at the edge of visibility, patrolling along a coral wall — other sharks faint shapes in the blue beyond`,
    light: `low-angle blue light from open water, no surface sun, wall in shadow`,
    composition: `telephoto compression, subject centered in depth but offset in frame, layered silhouettes behind`,
    anchor: `in the style of Paul Nicklen predator photography` },
  { test: /turtle|เต่า/, lens: "wide",
    scene: `a green sea turtle mid-breath at a resting ledge, a cleaner wrasse picking algae from the carapace — eyes half-closed, trust earned`,
    light: `dappled surface light across the shell, soft and breathing`,
    composition: `eye-level with the animal, reef as foreground layer, open blue in the upper third`,
    anchor: `in the style of David Doubilet intimate wildlife portraiture` },
  { test: /dolphin|โลมา/, lens: "wide",
    scene: `spinner dolphins passing through a sunlit shallow, one adult exhaling a trailing bubble ring — joy that doesn't need performing`,
    light: `strong directional sunlight from above, ripples projecting caustics onto sand below`,
    composition: `low angle across the sandy bottom, dolphins cutting diagonally through the upper frame`,
    anchor: `in the style of Paul Nicklen cetacean photography` },
  { test: /whale(?! shark)|วาฬ/, lens: "wide",
    scene: `a humpback cow and calf suspended at 15 meters, the calf tucked into the mother's pectoral fin — a private moment, photographed from distance`,
    light: `soft blue ambient, faint surface light on the calf's back, mother in shadow`,
    composition: `mother as anchor on the left, calf in the cradle of her fin, negative space to the right`,
    anchor: `in the style of Brian Skerry humpback work` },

  // ── Dive sites & environments ────────────────────────────────────────────
  { test: /wreck|shipwreck|htms|sunken|เรือจม/, lens: "wide",
    scene: `a diver inside the hull of a wartime wreck, pausing at a doorway, torch beam ahead — the weight of what this ship was`,
    light: `shafts of natural light through broken hull plating, silt in suspension catching the beams`,
    composition: `diver small against the scale of the structure, framed by a corroded bulkhead`,
    anchor: `in the style of Cristina Mittermeier environmental documentary` },
  { test: /cave|cavern|cenote|ถ้ำ/, lens: "wide",
    scene: `a diver at the cavern entrance, line reel in hand, torch beam cutting into dark water beyond — a line between the known and the unknown`,
    light: `blue-green ambient from the cavern mouth behind the diver, torch beam forward as the only warm light`,
    composition: `silhouette against the outside light, rock as dark frame on both sides`,
    anchor: `in the style of Wes Skiles cave photography` },
  { test: /night div|ดำน้ำกลางคืน/, lens: "macro",
    scene: `a lionfish in hunting posture at night, fins fanned, eye reflecting the torch — a predator on its own shift`,
    light: `single narrow torch beam from the upper left, all else black`,
    composition: `spot-lit animal against total darkness, particulate visible in the beam`,
    anchor: `in the style of Alex Mustard night macro` },
  { test: /deep|pinnacle|wall div|hin daeng|hin muang|หินแดง|หินม่วง/, lens: "wide",
    scene: `a diver descending along a vertical wall of soft corals, the wall disappearing into blue below — the honest scale of a deep dive`,
    light: `light falling off rapidly with depth, surface glow faint far above`,
    composition: `vertical frame, diver as small element on the left, wall texture running top to bottom, blue void on the right`,
    anchor: `in the style of Laurent Ballesta deep-water documentary` },
  { test: /coral|reef|ปะการัง|anemone/, lens: "wide",
    scene: `a healthy working reef in late afternoon, a researcher with a slate taking notes, fish reorganizing around the intrusion — ordinary fieldwork on an extraordinary place`,
    light: `warm low-angle sunlight breaking through the surface from the left, shafts across the reef face`,
    composition: `three-layer frame — reef foreground, researcher midground, open water background`,
    anchor: `in the style of David Doubilet environmental reef portraiture` },

  // ── Knowledge & technique ────────────────────────────────────────────────
  { test: /nitrox|trimix|rebreather|equipment|gear|อุปกรณ์/, lens: "wide",
    scene: `a technical diver at the boat, analyzer in hand, checking gas before a dive — the quiet work that comes before the story`,
    light: `early morning overcast light, flat and honest, no golden hour theatrics`,
    composition: `hands and equipment in foreground, diver's face partially in frame, boat rail as leading line`,
    anchor: `in the style of Magnum Photos working-hands documentary` },
  { test: /safe|safety|buoyancy|ปลอดภัย|ลอยตัว|ascent|emergency/, lens: "wide",
    scene: `a diver in neutral horizontal trim over sand, exhaust rising in an even column — competence looking like nothing`,
    light: `soft overhead ambient, bubble column catching surface light`,
    composition: `side profile, diver parallel to the bottom, reef as distant backdrop`,
    anchor: `in the style of Alex Mustard technical instructional photography` },
  { test: /photo|camera|ถ่ายภาพ|ถ่ายรูป/, lens: "wide",
    scene: `an underwater photographer at working distance from a reef subject, housing steady, strobes arms angled — patience rather than pursuit`,
    light: `mixed strobe fill and ambient blue, soft transition between the two`,
    composition: `photographer framed from behind-left, subject small on the reef, negative space in the blue above`,
    anchor: `in the style of Brian Skerry behind-the-lens documentary` },
  { test: /conservation|eco|อนุรักษ์|protect|restore/, lens: "wide",
    scene: `a marine biologist attaching coral fragments to a nursery frame, older transplants with new growth visible behind — the slow hopeful arithmetic of restoration`,
    light: `flat diffused midday light, no drama — the work itself is the story`,
    composition: `hands in foreground, frame and coral fragments in midground, reef slope falling away behind`,
    anchor: `in the style of Cristina Mittermeier conservation storytelling` },
  { test: /training|certification|course|เรียน|คอร์ส/, lens: "wide",
    scene: `an instructor and student at 5 meters, mask-clearing skill in progress, instructor's hand open and steady — teaching, not performing`,
    light: `bright shallow-water ambient, ripples on the sand below`,
    composition: `side-on frame, student's face partially obscured by mask water, instructor as reassuring weight on the right`,
    anchor: `in the style of quiet documentary reportage` },

  // ── Boat & travel ────────────────────────────────────────────────────────
  { test: /liveaboard|boat|safari|เรือ|ลิเวอะบอร์ด/, lens: "wide",
    scene: `a wooden dive boat at anchor before sunrise, crew preparing tanks on the deck, single bulb lighting the galley — working hours, not advertising hours`,
    light: `pre-dawn blue sky with warm single-bulb light on deck, overcast sea`,
    composition: `boat at lower-right, sky and horizon carrying the upper two-thirds`,
    anchor: `in the style of James Nachtwey environmental reportage` },
  { test: /freediv|apnea|ฟรีไดฟ์/, lens: "wide",
    scene: `a freediver descending along a guide line at 30 meters, monofin trailing — one breath, no sound, no backup`,
    light: `falling-off surface light from above, line receding into a darker blue below`,
    composition: `vertical frame, diver small in the upper third, line as strong diagonal`,
    anchor: `in the style of Alexey Molchanov freediving imagery` },

  // ── Location ─────────────────────────────────────────────────────────────
  { test: /island|koh |similan|surin|phi phi|lanta|tao|chang|racha|sail rock|chumphon|เกาะ/, lens: "wide",
    scene: `a limestone island at first light, one longtail boat anchored off a reef, still water — the Andaman before the day begins`,
    light: `low-angle overcast dawn, soft warmth on the limestone walls, sea flat`,
    composition: `boat on the left third, island mass on the right, wide horizon and negative sky`,
    anchor: `in the style of Sebastião Salgado landscape documentary` },
];

const FILM_WIDE = "shot on Kodak Ektachrome E100, fine grain, faithful color, no digital smoothing";
const FILM_MACRO = "shot on Fuji Provia 100F, fine grain, faithful color";
const FILM_TELE = "shot on Kodak Portra 400, natural grain, muted warmth";

const CAMERA_UW = "Nikon Z9 in Nauticam housing, Nikkor 14-30mm f/4";
const CAMERA_MACRO = "Nikon Z9 in Nauticam housing, Nikkor 105mm f/2.8 macro with single diffused strobe";
const CAMERA_TELE = "Nikon Z9, Nikkor 70-200mm f/2.8";

const NATGEO_CORE = [
  "National Geographic editorial photography",
  "documentary wildlife photojournalism",
  "unposed, observed from respectful distance",
  "decisive moment of honest behavior",
  "suspended particulate visible in the water column",
  "honest exposure, no HDR, no saturation boost, deep shadows allowed",
].join(", ");

const NEGATIVE = "--no illustration, painting, render, cgi, cartoon, 3d, anime, hdr, oversaturated, stock photo, watercolor, digital art, fantasy, neon, glossy, plastic, airbrushed, smooth skin, cinematic color grade, teal and orange, instagram filter";

const MJ_PARAMS = "--style raw --s 25 --v 7";

export function buildMjPrompt(title: string, excerpt: string): string {
  const src = `${title} ${excerpt}`.toLowerCase();

  const match = SCENES.find((s) => s.test.test(src));

  let sceneLine: string;
  let lightLine: string;
  let compositionLine: string;
  let anchorLine: string;
  let lens: Lens;

  if (match) {
    sceneLine = match.scene;
    lightLine = match.light;
    compositionLine = match.composition;
    anchorLine = match.anchor;
    lens = match.lens;
  } else {
    const cleaned = title
      .replace(/guide|tips|explained|complete|ultimate|\d{4}|[:&|–—,]/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    sceneLine = `${cleaned}, a working diver in the frame, honest field encounter`;
    lightLine = `natural directional sunlight from the surface, god rays in the water column`;
    compositionLine = `wide environmental portrait, subject off-center, three-layer depth`;
    anchorLine = `in the style of David Doubilet environmental photography`;
    lens = "wide";
  }

  const camera = lens === "macro" ? CAMERA_MACRO : lens === "telephoto" ? CAMERA_TELE : CAMERA_UW;
  const film = lens === "macro" ? FILM_MACRO : lens === "telephoto" ? FILM_TELE : FILM_WIDE;

  return [
    sceneLine,
    lightLine,
    compositionLine,
    anchorLine,
    camera,
    film,
    NATGEO_CORE,
    "no text, no watermark, no logo",
    NEGATIVE,
    MJ_PARAMS,
  ].join(", ").replace(/,\s*--/g, " --");
}
