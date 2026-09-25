# -*- coding: utf-8 -*-
import json

p1 = json.load(open("/tmp/blog-part1.json"))
p2 = json.load(open("/tmp/blog-part2.json"))
p3 = json.load(open("/tmp/blog-part3.json"))

mjPrompt = p1["mjPrompt"]
en = p1["langs"]["en"]
th = p1["langs"]["th"]

cn = {
  "lang": "cn",
  "title": "失恋后去潜水，真的有用吗？",
  "slug": "does-scuba-diving-heal-a-broken-heart-cn",
  "excerpt": "关于潜水员、退伍军人和迷走神经的研究，解释了大海为何能抚平受伤的心，以及什么时候失恋是下水的错误理由。",
  "content": p2["cn"],
  "keywords": ["潜水缓解压力","失恋后潜水","潜水心理健康","体验潜水涛岛","潜水抗抑郁药","蓝色思维","第一次潜水新手","潜水改善情绪"],
  "ogTitle": "失恋之后潜水的科学",
  "ogDescription": "潜水员浮上来时更轻松，研究解释了原因：压力更低、睡眠更好、心更安静。哪些能治愈、哪些不能，以及如何安全开始。"
}
ja = {
  "lang": "ja",
  "title": "失恋して潜る、本当に効くのか？",
  "slug": "does-scuba-diving-heal-a-broken-heart-ja",
  "excerpt": "ダイバーや退役軍人、迷走神経の研究が、海がなぜ傷ついた心を静めるのか、そして失恋が潜る理由として間違うのはいつかを説く。",
  "content": p2["ja"],
  "keywords": ["ダイビング ストレス軽減","失恋 ダイビング","ダイビング メンタルヘルス","体験ダイビング タオ島","抗うつ薬 ダイビング","ブルーマインド","初めてのダイビング","ダイビング 気分改善"],
  "ogTitle": "失恋のあとに潜ることの科学",
  "ogDescription": "ダイバーは潜る前より軽くなって浮上する。研究がその理由を語る。ストレス減、睡眠改善、静かな心。癒えるもの、癒えないもの、安全な始め方。"
}
ko = {
  "lang": "ko",
  "title": "이별 후 다이빙, 정말 효과 있을까?",
  "slug": "does-scuba-diving-heal-a-broken-heart-ko",
  "excerpt": "다이버와 제대군인, 미주신경 연구가 바다가 왜 아픈 마음을 가라앉히는지, 그리고 이별이 잠수의 잘못된 이유가 되는 때를 설명한다.",
  "content": p2["ko"],
  "keywords": ["다이빙 스트레스 완화","이별 후 다이빙","다이빙 정신건강","체험 다이빙 꼬따오","항우울제 다이빙","블루 마인드","첫 다이빙 초보","다이빙 기분 개선"],
  "ogTitle": "이별 뒤 다이빙의 과학",
  "ogDescription": "다이버는 내려갈 때보다 가벼워져 올라온다. 연구가 그 이유를 말한다. 낮은 스트레스, 나은 수면, 조용한 마음. 무엇이 낫고 무엇이 아닌지, 안전하게 시작하는 법."
}
de = {
  "lang": "de",
  "title": "Hilft Tauchen wirklich gegen Liebeskummer?",
  "slug": "does-scuba-diving-heal-a-broken-heart-de",
  "excerpt": "Studien zu Tauchern, Veteranen und dem Vagusnerv erklären, warum das Meer einen trauernden Kopf beruhigt, und wann Liebeskummer der falsche Grund zum Tauchen ist.",
  "content": p3["de"],
  "keywords": ["Tauchen Stressabbau","Tauchen nach Trennung","Tauchen psychische Gesundheit","Discover Scuba Koh Tao","Tauchen Antidepressiva","Blue Mind","erster Tauchgang Anfänger","Tauchen bessere Stimmung"],
  "ogTitle": "Die Wissenschaft vom Tauchen nach Liebeskummer",
  "ogDescription": "Taucher tauchen leichter auf, als sie abgetaucht sind, und die Forschung erklärt warum: weniger Stress, besserer Schlaf, ruhigerer Kopf. Was heilt, was nicht, und wie man sicher beginnt."
}
fr = {
  "lang": "fr",
  "title": "Plonger après une rupture, est-ce que ça aide vraiment ?",
  "slug": "does-scuba-diving-heal-a-broken-heart-fr",
  "excerpt": "Des études sur les plongeurs, les vétérans et le nerf vague expliquent pourquoi la mer apaise un esprit qui souffre, et quand le chagrin est une mauvaise raison de plonger.",
  "content": p3["fr"],
  "keywords": ["plongée réduction stress","plonger après rupture","plongée santé mentale","baptême plongée Koh Tao","plongée antidépresseurs","blue mind","première plongée débutant","plongée meilleure humeur"],
  "ogTitle": "La science de la plongée après un chagrin",
  "ogDescription": "Les plongeurs remontent plus légers qu'ils ne sont descendus, et la recherche explique pourquoi : moins de stress, meilleur sommeil, esprit plus calme. Ce qui guérit, ce qui non, et comment commencer en sécurité."
}
ru = {
  "lang": "ru",
  "title": "Помогает ли дайвинг после расставания?",
  "slug": "does-scuba-diving-heal-a-broken-heart-ru",
  "excerpt": "Исследования дайверов, ветеранов и блуждающего нерва объясняют, почему море успокаивает горюющее сознание и когда сердечная боль — неверная причина погружаться.",
  "content": p3["ru"],
  "keywords": ["дайвинг снятие стресса","дайвинг после расставания","дайвинг психическое здоровье","пробное погружение Ко Тао","дайвинг антидепрессанты","синий разум","первое погружение новичок","дайвинг настроение"],
  "ogTitle": "Наука о дайвинге после сердечной боли",
  "ogDescription": "Дайверы всплывают легче, чем уходили под воду, и наука объясняет почему: меньше стресса, лучше сон, тише в голове. Что исцеляет, что нет и как начать безопасно."
}

payload = {
  "status": "DRAFT",
  "category": "EDUCATION",
  "covers": [],
  "mjPrompt": mjPrompt,
  "translations": [en, th, cn, ja, ko, de, fr, ru]
}

with open("/tmp/blog-payload.json","w") as f:
    json.dump(payload, f, ensure_ascii=False)

# quick self-check on char ratios and link prefixes
enlen = len(en["content"])
import re
print("EN words ~", len(re.sub('<[^>]+>',' ',en["content"]).split()))
for t in payload["translations"]:
    pct = int(len(t["content"])*100/enlen)
    # check link prefixes
    bad = [m for m in re.findall(r'href="/([a-z]{2})/blogs/', t["content"]) if m != t["lang"]]
    print(f'{t["lang"]}: chars={pct}% title_len={len(t["title"])} badlinks={bad}')
print("langs:", sorted([t["lang"] for t in payload["translations"]]))
print("mjPrompt len:", len(mjPrompt))
