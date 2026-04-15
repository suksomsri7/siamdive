// Midjourney prompt builder — NatGeo documentary realism
//
// Design principles (v2 — optimized for authentic National Geographic aesthetic):
// - Avoid stylized adjectives ("vibrant", "dramatic", "ethereal", "breathtaking") — push MJ into stock-photo mode
// - Use photojournalism vocabulary ("observed", "unposed", "decisive moment", "field notes")
// - Reference real film stocks (Kodak Ektachrome E100, Fuji Provia 100F) — MJ reads these as photo aesthetic
// - Allow imperfection ("particulate in water", "natural grain", "uneven light") — documentary over stock
// - Off-center composition, negative space — NatGeo rarely centers subjects
// - Lower --s (stylize) to 0–15, keep --style raw — minimize MJ's painterly bias
// - No technical camera spam — one lens is enough; too many specs make stock output

type Lens = "macro" | "wide" | "telephoto";

type SceneMatch = { test: RegExp; scene: string; lens: Lens };

const SCENES: SceneMatch[] = [
  // ── Macro / small creatures ──────────────────────────────────────────────
  { test: /nudibranch|sea slug|ทากทะเล/, lens: "macro",
    scene: `a Chromodoris nudibranch on coral rubble, photographed close with the texture of individual cerata resolved, background thrown out of focus, observed without staging` },
  { test: /seahorse|ม้าน้ำ/, lens: "macro",
    scene: `a pygmy seahorse anchored to a gorgonian fan, partially obscured by coral branches, one eye visible, field-research encounter rather than a posed portrait` },
  { test: /octopus|หมึก(?!กระดอง)/, lens: "macro",
    scene: `a reef octopus settled into a rock crevice at dusk, skin texture shifting mid-change, one eye tracking the photographer, available light only` },
  { test: /frogfish|กบ/, lens: "macro",
    scene: `a hairy frogfish stationary on a sponge, skin lappets matching the substrate, mouth slightly parted, documented in situ without bait or touch` },
  { test: /cuttlefish|หมึกกระดอง/, lens: "macro",
    scene: `a pharaoh cuttlefish mid-water with chromatophores shifting, arms in neutral hunting position, observed from respectful distance` },
  { test: /shrimp|กุ้ง|cleaner/, lens: "macro",
    scene: `a cleaner shrimp working the gill of a resting grouper, both animals unbothered by the observer, quiet moment of interspecies cooperation` },
  { test: /jellyfish|แมงกะพรุน/, lens: "wide",
    scene: `a moon jellyfish at mid-depth, translucent bell lit from above, trailing oral arms, uncropped frame with negative space to the left` },

  // ── Large pelagics ───────────────────────────────────────────────────────
  { test: /manta/, lens: "wide",
    scene: `an oceanic manta ray at a cleaning station, passing above the reef at slow speed, one remora attached, a diver kneeling small in the lower frame` },
  { test: /whale shark|ฉลามวาฬ/, lens: "wide",
    scene: `a whale shark moving slowly through plankton-rich water, a snorkeler small in the frame keeping distance, natural suspended particulate in the water column` },
  { test: /shark|ฉลาม/, lens: "wide",
    scene: `a grey reef shark on routine patrol along a wall at 20 meters, no bait, no posing, other sharks faint silhouettes further out in the blue` },
  { test: /turtle|เต่า/, lens: "wide",
    scene: `a green sea turtle resting on a ledge, a single cleaner wrasse working its carapace, soft overhead light, the animal mid-breath and calm` },
  { test: /dolphin|โลมา/, lens: "wide",
    scene: `spinner dolphins passing through a sunlit shallow, bubbles from an exhaling adult, off-center composition with empty water on the right` },
  { test: /whale(?! shark)|วาฬ/, lens: "wide",
    scene: `a humpback cow and calf resting at 15 meters in clear water, distance kept, no breach, quiet unposed field observation` },

  // ── Dive sites & environments ────────────────────────────────────────────
  { test: /wreck|shipwreck|htms|sunken|เรือจม/, lens: "wide",
    scene: `a diver pausing at the railing of a WWII-era shipwreck, soft natural light through a hull opening, silt held in the water column from earlier movement` },
  { test: /cave|cavern|cenote|ถ้ำ/, lens: "wide",
    scene: `a diver at the boundary of a cavern, one torch beam into darkness, line visible on the floor, no dramatization — just method and calm` },
  { test: /night div|ดำน้ำกลางคืน/, lens: "macro",
    scene: `a single torch revealing a hunting lionfish at night, particulate visible in the beam, darkness intact around the subject` },
  { test: /deep|pinnacle|wall div|hin daeng|hin muang|หินแดง|หินม่วง/, lens: "wide",
    scene: `a diver along a vertical wall of soft coral, fading into blue below, small compared to the wall, field research atmosphere not travel brochure` },
  { test: /coral|reef|ปะการัง|anemone/, lens: "wide",
    scene: `a working coral reef in late afternoon light, mixed hard and soft species, a lone diver taking notes on a slate, no staged poses` },

  // ── Knowledge & technique ────────────────────────────────────────────────
  { test: /nitrox|trimix|rebreather|equipment|gear|อุปกรณ์/, lens: "wide",
    scene: `a technical diver checking analyzer readings on deck before descent, early morning natural light, working hands and worn equipment` },
  { test: /safe|safety|buoyancy|ปลอดภัย|ลอยตัว|ascent|emergency/, lens: "wide",
    scene: `a diver in neutral trim above the reef, exhaust bubbles rising in an even column, focus on quiet competence, no drama` },
  { test: /photo|camera|ถ่ายภาพ|ถ่ายรูป/, lens: "wide",
    scene: `an underwater photographer at working distance from a subject, housing and strobe arms visible, patient rather than chasing, subject undisturbed` },
  { test: /conservation|eco|อนุรักษ์|protect|restore/, lens: "wide",
    scene: `a marine biologist attaching coral fragments to a nursery frame, hands visible, new growth on adjacent transplants, daily fieldwork rather than posed story` },
  { test: /training|certification|course|เรียน|คอร์ส/, lens: "wide",
    scene: `an instructor and student at 5 meters over a sandy bottom, mask clearing demonstration mid-exhale, instructor's hand open in support not instruction` },

  // ── Boat & travel ────────────────────────────────────────────────────────
  { test: /liveaboard|boat|safari|เรือ|ลิเวอะบอร์ด/, lens: "wide",
    scene: `a wooden dive boat anchored near a reef at dawn, crew preparing tanks on deck, no tourists in frame, working-vessel atmosphere` },
  { test: /freediv|apnea|ฟรีไดฟ์/, lens: "wide",
    scene: `a freediver descending along a guide line, single breath, no mask light, the line receding into blue below` },

  // ── Location ─────────────────────────────────────────────────────────────
  { test: /island|koh |similan|surin|phi phi|lanta|tao|chang|racha|sail rock|chumphon|เกาะ/, lens: "wide",
    scene: `a limestone island at first light, a single longtail boat anchored off a small reef, overcast diffused light rather than golden hour` },
];

const FILM_WIDE = "shot on Kodak Ektachrome E100 slide film, natural grain, neutral color balance";
const FILM_MACRO = "shot on Fuji Provia 100F with 105mm macro, natural grain, faithful color";
const FILM_TELE = "shot on Kodak Portra 400, natural grain, muted warmth";

const CAMERA_UW = "Nikon Z9 in Nauticam housing, available light only no strobe, Nikkor 14-30mm f/4";
const CAMERA_MACRO = "Nikon Z9 in Nauticam housing, single diffused strobe, Nikkor 105mm f/2.8 macro";
const CAMERA_TELE = "Nikon Z9, Nikkor 70-200mm f/2.8, natural light";

const NATGEO_CORE = [
  "National Geographic documentary photography",
  "unposed field observation",
  "subject off-center with negative space",
  "slight particulate in the water, natural imperfection",
  "honest exposure, no HDR, no saturation boost",
  "photojournalism, editorial non-fiction",
].join(", ");

// What we do NOT want — MJ listens to --no
const NEGATIVE = "--no illustration, painting, render, cgi, cartoon, 3d, anime, hdr, oversaturated, stock photo, watercolor, digital art, fantasy, neon, glossy";

// MJ params: raw style + very low stylize = realism
const MJ_PARAMS = "--style raw --s 10 --v 7";

export function buildMjPrompt(title: string, excerpt: string): string {
  const src = `${title} ${excerpt}`.toLowerCase();

  const match = SCENES.find((s) => s.test.test(src));
  const scene = match?.scene
    ?? `${title.replace(/guide|tips|explained|complete|ultimate|\d{4}|[:&|–—,]/gi, "").replace(/\s+/g, " ").trim()}, a working diver in the frame, reef visible in the background, observed not staged`;

  const lens: Lens = match?.lens ?? "wide";
  const camera = lens === "macro" ? CAMERA_MACRO : lens === "telephoto" ? CAMERA_TELE : CAMERA_UW;
  const film = lens === "macro" ? FILM_MACRO : lens === "telephoto" ? FILM_TELE : FILM_WIDE;

  // Prompt structure: scene → camera → film → aesthetic core → negatives + params
  return [
    scene,
    camera,
    film,
    NATGEO_CORE,
    "no text, no watermark, no logo",
    NEGATIVE,
    MJ_PARAMS,
  ].join(", ").replace(/,\s*--/g, " --");
}
