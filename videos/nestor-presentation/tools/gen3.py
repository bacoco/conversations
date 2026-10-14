#!/usr/bin/env python3
"""Nestor film v3 (Apple-style): whole-screen base shots, spotlight + gentle zoom (<= 1.3x).

Writes compositions/v3-*.html (one self-contained scene each) and a standalone host
(`intro.html` for the preview, later `index.html`) with the narration clips at root level.
"""
import json
import os
import sys
import wave

PROJ = "/data/loic/Bercy-Hub-Loic/projects/assistant-ia/.claude/worktrees/nestor-chat/videos/nestor-presentation"
MASTERS = "/data/loic/Bercy-Hub-Loic/projects/nestor-voix/film/v3"
VO_START, VO_TAIL = 0.6, 1.3

# Screen window on the 1920x1080 canvas (captures are 1280x720 -> scale 1.125).
WIN_X, WIN_Y, WIN_W, WIN_H = 240, 215, 1440, 810
K = WIN_W / 1280

FONTS = """
@font-face { font-family: "Marianne"; src: url("assets/fonts/Marianne-Regular.woff2") format("woff2"); font-weight: 400; }
@font-face { font-family: "Marianne"; src: url("assets/fonts/Marianne-Medium.woff2") format("woff2"); font-weight: 500; }
@font-face { font-family: "Marianne"; src: url("assets/fonts/Marianne-Bold.woff2") format("woff2"); font-weight: 700; }
@font-face { font-family: "Marianne"; src: url("assets/fonts/Marianne-ExtraBold.woff2") format("woff2"); font-weight: 800; }
"""

# rect = (x0, y0, x1, y1) in capture pixels (1280x720)
A = "assets/full/"
PANEL = (881, 64, 1280, 610)


def scr(sid, vo, heads, shots, spots, zooms=None):
    return {"id": sid, "vo": vo, "kind": "screen", "heads": heads,
            "shots": [{"img": A + i + ".png", "t": t} for i, t in shots], "spots": spots, "zooms": zooms or []}


def sp(rect, t, until=None):
    return {"rect": rect, "t": t, "until": until}


SCENES = [
    scr("v3-accroche", 1, [("Une demande écrite trop vite.", 0.3), ("Une réponse qui ne vous avance pas.", 3.0)],
        [("hook1-vague", 0), ("hook1-answer", 2.9)],
        [sp((414, 292, 1166, 396), 0.9, 2.7), sp((422, 132, 1172, 400), 3.6)]),
    {"id": "v3-promesse", "vo": 2, "kind": "title", "lines": ["Bien demander,", "ça s’apprend."]},
    scr("v3-nestor", 3, [("Voici Nestor.", 0.5), ("Votre coach, à droite de l’écran.", 3.4)],
        [("hook1-answer", 0), ("hook1-reveal", 1.0)],
        [sp((881, 0, 1280, 720), 1.9, 6.0), sp((930, 212, 1252, 360), 6.4)]),
    scr("v3-metier", 4, [("Il part de votre métier.", 0.3), ("Trois tâches pour commencer.", 4.4)],
        [("s4-metier", 0), ("s4-taches", 4.2)],
        [sp((930, 120, 1252, 600), 1.0, 4.0), sp((930, 325, 1252, 525), 5.0)]),
    scr("v3-pistes", 5, [("Nestor réfléchit avec vous.", 0.3), ("Des pistes proches de la vôtre.", 3.6)],
        [("s5-reflechit", 0), ("s5-pistes", 3.4)],
        [sp((414, 571, 1166, 673), 0.6, 2.2), sp((893, 562, 1000, 600), 2.4, 3.3), sp((930, 290, 1270, 600), 4.2)]),
    scr("v3-analyser", 6, [("Analyser mon texte.", 0.3), ("Ce qui est dit. Ce qui manque.", 3.6)],
        [("s6-analyse", 0)],
        [sp((907, 610, 968, 710), 0.8, 2.8), sp((930, 215, 1252, 495), 3.4)]),
    scr("v3-conseils", 7, [("Améliorer mon texte.", 0.3), ("Ajouter · Ignorer · Je le fais déjà.", 3.4)],
        [("s7-conseils", 0), ("s7-decide", 4.6)],
        [sp((997, 610, 1058, 710), 0.8, 2.6), sp((930, 125, 1252, 605), 2.8, 4.4), sp((960, 330, 1240, 490), 5.4)]),
    scr("v3-versions", 8, [("Le bon texte, ou deux versions.", 0.3), ("Ou vous corrigez vous-même.", 4.6)],
        [("s8-versions", 0), ("s8-corrige", 4.4)],
        [sp((943, 285, 1240, 330), 1.6, 4.2), sp((928, 535, 1142, 585), 5.2)]),
    scr("v3-donnees", 9, [("Un numéro de téléphone ?", 0.3), ("Nestor vous prévient avant l’envoi.", 3.4)],
        [("s9-donnees", 0)],
        [sp((325, 571, 856, 673), 0.8, 3.0), sp((933, 416, 1249, 580), 3.4)]),
    scr("v3-verifier", 10, [("Il relit la réponse.", 0.3), ("Des chiffres que vous n’avez pas donnés ?", 3.4)],
        [("s10-verifier", 0)],
        [sp((340, 175, 852, 362), 0.8, 3.2), sp((930, 170, 1252, 342), 3.6)]),
    scr("v3-suite", 11, [("Un conseil après chaque réponse.", 0.3), ("Et trois idées pour continuer.", 2.4)],
        [("s10-verifier", 0)],
        [sp((930, 170, 1252, 342), 0.6, 2.2), sp((930, 352, 1266, 592), 2.6)]),
    scr("v3-bilan", 12, [("Faire le bilan.", 0.3), ("Le point sur votre séance.", 3.2)],
        [("s12-bilan", 0)],
        [sp((1087, 610, 1148, 710), 0.8, 2.6), sp((930, 250, 1252, 455), 3.0)]),
    scr("v3-parler", 13, [("Parlez-lui.", 0.3), ("Une question ? Il répond.", 4.4)],
        [("s13-micro", 0), ("s13-reponse", 4.2)],
        [sp((893, 190, 1268, 595), 0.8, 4.0), sp((930, 190, 1268, 545), 5.0)]),
    scr("v3-boutons", 14, [("Quatre boutons, toujours là.", 0.3), ("Auto : il vous aide de lui-même.", 3.6)],
        [("s13-reponse", 0)],
        [sp((881, 612, 1280, 712), 0.8, 3.4), sp((1004, 14, 1094, 50), 3.8)]),
    scr("v3-profil", 15, [("Votre direction, vos thèmes.", 0.3), ("Jamais ajoutés à vos demandes.", 3.4)],
        [("s15-profil", 0)],
        [sp((897, 282, 1263, 700), 0.8)]),
    {"id": "v3-progresser", "vo": 16, "kind": "title", "lines": ["Et vous progressez,", "semaine après semaine."]},
    scr("v3-entrainer", 17, [("De vrais cas de votre métier.", 0.3), ("Lire · Demander · Conseils · Comparer · Vérifier.", 3.6)],
        [("s17-cas", 0), ("s17-lire", 3.4)],
        [sp((905, 230, 1257, 515), 0.8, 3.2), sp((890, 70, 1270, 120), 4.0)]),
    scr("v3-semaine", 18, [("Chaque semaine, quelques actions.", 0.3), ("Vingt minutes dans votre agenda.", 3.0)],
        [("s18-semaine", 0), ("s19-parcours", 2.8)],
        [sp((897, 575, 1263, 720), 0.8, 2.6), sp((900, 618, 1144, 668), 3.6)]),
    scr("v3-parcours", 19, [("Niveaux, badges, attestation.", 0.3), ("Vos progrès restent sur votre poste.", 3.6)],
        [("s19-parcours", 0), ("s19-attestation", 2.6)],
        [sp((905, 172, 1257, 360), 0.8, 2.4), sp((900, 572, 1260, 612), 3.0, 4.4), sp((905, 120, 1257, 200), 4.8)]),
    scr("v3-cours", 20, [("Huit leçons courtes.", 0.3), ("Des quiz et un mémo.", 3.0)],
        [("s20-cours", 0)],
        [sp((905, 205, 1257, 676), 0.8, 2.8), sp((905, 455, 1257, 505), 3.2)]),
    scr("v3-outils-favoris", 21, [("Des demandes prêtes, en quelques clics.", 0.3), ("Vos favoris, partagés par un lien.", 3.6)],
        [("s21-synthese", 0), ("s21-etoiles", 2.6), ("s21-partage", 4.6)],
        [sp((893, 70, 1272, 330), 0.8, 2.4), sp((897, 268, 1263, 520), 3.0, 4.4), sp((1162, 186, 1194, 214), 5.2)]),
    scr("v3-fermeture", 22, [("Nestor.", 0.3), ("Avec Albert, l’IA de l’État.", 2.6), ("Revoyez cette présentation avec le « ? ».", 6.4)],
        [("s18-semaine", 0)],
        [sp((881, 0, 1280, 720), 0.8, 6.0), sp((1092, 14, 1122, 50), 7.0)]),
]


def wav_dur(i):
    with wave.open(os.path.join(MASTERS, f"vo-{i:03d}-nestor.wav")) as w:
        return w.getnframes() / w.getframerate()


def esc(s):
    s = s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return s.replace("« ", "« ").replace(" »", " »").replace(" :", " :").replace(" ?", " ?")


def base_css(sid):
    return f"""
#root {{ position: absolute; inset: 0; overflow: hidden; font-family: "Marianne", sans-serif; color: #161616; }}
#{sid}-bg {{ position: absolute; inset: 0; background: #f7f8fd; }}
#{sid}-flag {{ position: absolute; left: 120px; top: 64px; width: 150px; height: 10px; border-radius: 5px;
  background: linear-gradient(90deg, #000091 33%, #ffffff 33% 66%, #e1000f 66%); box-shadow: 0 0 0 1px #dde0ee; }}
#{sid}-content {{ position: absolute; inset: 0; }}
"""


def scene_html(sc):
    sid, dur = sc["id"], sc["dur"]
    css = base_css(sid)
    html, js = [], []
    js.append(f'tl.fromTo("#{sid}-content", {{opacity: 0}}, {{opacity: 1, duration: 0.5, ease: "sine.out"}}, 0);')
    js.append(f'tl.to("#{sid}-content", {{opacity: 0, duration: 0.45, ease: "sine.in"}}, {dur - 0.45:.2f});')
    if sc["kind"] == "title":
        css += f"""
#{sid}-stack {{ position: absolute; left: 120px; right: 120px; top: 0; bottom: 0; display: flex; flex-direction: column; justify-content: center; gap: 10px; }}
.{sid}-l {{ font-size: 150px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.02; color: #000091; }}
.{sid}-l.second {{ color: #161616; }}
"""
        html.append(f'<div id="{sid}-stack">' + "".join(
            f'<div class="{sid}-l{" second" if i else ""}" id="{sid}-l{i}">{esc(l)}</div>'
            for i, l in enumerate(sc["lines"])) + "</div>")
        for i in range(len(sc["lines"])):
            js.append(f'tl.fromTo("#{sid}-l{i}", {{opacity: 0, y: 40}}, {{opacity: 1, y: 0, duration: 0.9, ease: "power3.out"}}, {0.3 + i * 1.2:.2f});')
    else:
        css += f"""
.{sid}-head {{ position: absolute; left: 120px; right: 120px; top: 92px; font-size: 76px; font-weight: 800; letter-spacing: -0.02em;
  line-height: 1.1; color: #000091; white-space: nowrap; opacity: 0; }}
#{sid}-win {{ position: absolute; left: {WIN_X}px; top: {WIN_Y}px; width: {WIN_W}px; height: {WIN_H}px; border-radius: 22px; overflow: hidden;
  background: #ffffff; box-shadow: 0 30px 80px rgba(0, 0, 80, 0.18), 0 0 0 1px #dde0ee; }}
#{sid}-cam {{ position: absolute; left: 0; top: 0; width: {WIN_W}px; height: {WIN_H}px; transform-origin: 50% 50%; }}
.{sid}-shot {{ position: absolute; left: 0; top: 0; width: {WIN_W}px; height: {WIN_H}px; opacity: 0; }}
.{sid}-spot {{ position: absolute; border-radius: 16px; opacity: 0; box-shadow: 0 0 0 3000px rgba(18, 20, 60, 0.42); }}
.{sid}-ring {{ position: absolute; inset: -3px; border-radius: 18px; border: 5px solid #e1000f; }}
"""
        for i, (txt, t) in enumerate(sc["heads"]):
            fs = 76 if len(txt) <= 38 else 62
            html.append(f'<div class="{sid}-head" id="{sid}-h{i}" style="font-size:{fs}px">{esc(txt)}</div>')
            js.append(f'tl.fromTo("#{sid}-h{i}", {{opacity: 0, y: 24}}, {{opacity: 1, y: 0, duration: 0.7, ease: "power2.out"}}, {t:.2f});')
            if i + 1 < len(sc["heads"]):
                js.append(f'tl.to("#{sid}-h{i}", {{opacity: 0, y: -16, duration: 0.4, ease: "power1.in"}}, {sc["heads"][i + 1][1] - 0.35:.2f});')
        inner = []
        for k, sh in enumerate(sc["shots"]):
            inner.append(f'<img class="{sid}-shot" id="{sid}-s{k}" src="{sh["img"]}" alt="">')
            js.append(f'tl.fromTo("#{sid}-s{k}", {{opacity: 0}}, {{opacity: 1, duration: {0.01 if k == 0 else 0.6}, ease: "sine.inOut"}}, {sh["t"]:.2f});')
        for k, sp in enumerate(sc["spots"]):
            x0, y0, x1, y1 = sp["rect"]
            inner.append(f'<div class="{sid}-spot" id="{sid}-p{k}" style="left:{x0 * K:.0f}px;top:{y0 * K:.0f}px;'
                         f'width:{(x1 - x0) * K:.0f}px;height:{(y1 - y0) * K:.0f}px"><div class="{sid}-ring"></div></div>')
            js.append(f'tl.fromTo("#{sid}-p{k}", {{opacity: 0, scale: 1.04}}, {{opacity: 1, scale: 1, duration: 0.6, ease: "power2.out"}}, {sp["t"]:.2f});')
            if sp.get("until") is not None:
                js.append(f'tl.to("#{sid}-p{k}", {{opacity: 0, duration: 0.4}}, {sp["until"]:.2f});')
        for zi, z in enumerate(sc["zooms"]):
            fx, fy = z["focus"]
            ir = "" if zi == 0 else ", immediateRender: false"
            js.append(f'tl.fromTo("#{sid}-cam", {{scale: {z.get("from", 1)}, transformOrigin: "{fx * K:.0f}px {fy * K:.0f}px"}}, '
                      f'{{scale: {z["scale"]}, transformOrigin: "{fx * K:.0f}px {fy * K:.0f}px", duration: {z["d"]}, ease: "sine.inOut"{ir}}}, {z["t"]:.2f});')
        if not sc["zooms"]:
            js.append(f'tl.fromTo("#{sid}-cam", {{scale: 1}}, {{scale: 1.03, duration: {dur:.2f}, ease: "none"}}, 0);')
        html.append(f'<div id="{sid}-win" data-layout-allow-overflow><div id="{sid}-cam">{"".join(inner)}</div></div>')
    js_body = "\n      ".join(js)
    return f'''<!doctype html>
<html lang="fr">
  <head><meta charset="UTF-8" /><title>{sid}</title></head>
  <body>
    <template>
      <style>
{FONTS}
{css}
      </style>
      <div id="root" data-composition-id="{sid}" data-start="0" data-duration="{dur}" data-width="1920" data-height="1080">
        <div id="{sid}-bg"></div>
        <div id="{sid}-flag"></div>
        <div id="{sid}-content">
          {"".join(html)}
        </div>
      </div>
      <script>
      const tl = gsap.timeline({{ paused: true }});
      {js_body}
      window.__timelines["{sid}"] = tl;
      </script>
    </template>
  </body>
</html>
'''


def host(name, scenes):
    t, slots, table = 0.0, [], []
    for i, sc in enumerate(scenes):
        slots.append(f'      <div id="slot-{sc["id"]}" data-composition-id="{sc["id"]}" data-composition-src="compositions/{sc["id"]}.html" '
                     f'data-start="{t:.2f}" data-duration="{sc["dur"]}" data-track-index="{1 + i % 2}" data-width="1920" data-height="1080"></div>')
        vo = f'.media/audio/voice-v3/vo-{sc["vo"]:03d}-nestor.mp3'
        slots.append(f'      <audio id="vo-{sc["id"]}" src="{vo}" data-start="{t + VO_START:.2f}" data-duration="{sc["vo_dur"]:.3f}" '
                     f'data-track-index="9" data-volume="1"></audio>')
        table.append({"id": sc["id"], "start": round(t, 2), "duration": sc["dur"],
                      "voice": {"path": vo, "start_in_scene": VO_START, "duration": round(sc["vo_dur"], 3)}})
        t += sc["dur"]
    doc = f'''<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <title>Nestor — présentation</title>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ width: 1920px; height: 1080px; overflow: hidden; background: #f7f8fd; }}
      #root {{ position: relative; width: 100%; height: 100%; overflow: hidden; background: #f7f8fd; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{t:.2f}" data-width="1920" data-height="1080" data-fps="30">
{chr(10).join(slots)}
    </div>
    <script>
      const tl = gsap.timeline({{ paused: true }});
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
'''
    open(os.path.join(PROJ, name), "w").write(doc)
    return t, table


def main():
    name = sys.argv[1] if len(sys.argv) > 1 else "intro.html"
    for sc in SCENES:
        sc["vo_dur"] = wav_dur(sc["vo"])
        sc["dur"] = round(VO_START + sc["vo_dur"] + VO_TAIL, 1)
        open(os.path.join(PROJ, "compositions", f"{sc['id']}.html"), "w").write(scene_html(sc))
    total, table = host(name, SCENES)
    for r in table:
        print(f'{r["id"]:16s} {r["start"]:6.2f} {r["duration"]:5.1f}')
    print("total", round(total, 2))


if __name__ == "__main__":
    main()
