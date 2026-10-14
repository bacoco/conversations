#!/usr/bin/env python3
"""Nestor film v4 + intro: first explain what the Assistant is (the State's AI tool), why a vague request fails,
who Nestor is and why he can be trusted (INTRO, 6 scenes), then one real task (telework reply).
Real 1:1 captures, Nestor's panel always sharp on the right.

Captures are 1920x1080 screenshots of https://dev.bhub.cloud/nestor-chat/ (layout 1010x568 CSS at zoom 1.9),
shown full frame at 1:1: no rescale, so the panel text stays crisp. The headline sits on a light scrim over the
conversation area (x < 1160), never over the panel. Blue outlines; red only for the personal-data alert.

Writes compositions/v4-*.html (one sub-composition per scene) and index.html (scenes + narration at root).
Usage: python3 tools/gen4.py
"""
import json
import os

PROJ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
META = os.path.join(PROJ, ".media/audio/voice-v4/audio_meta.json")
OV = 0.4          # crossfade overlap between scenes
PANEL_X = 1160    # left edge of Nestor's panel in the captures
NAVY, RED = "#000091", "#e1000f"
A = "assets/v4/"
AI = "assets/intro/"

FONTS = """
@font-face { font-family: "Marianne"; src: url("assets/fonts/Marianne-Regular.woff2") format("woff2"); font-weight: 400; }
@font-face { font-family: "Marianne"; src: url("assets/fonts/Marianne-Medium.woff2") format("woff2"); font-weight: 500; }
@font-face { font-family: "Marianne"; src: url("assets/fonts/Marianne-Bold.woff2") format("woff2"); font-weight: 700; }
@font-face { font-family: "Marianne"; src: url("assets/fonts/Marianne-ExtraBold.woff2") format("woff2"); font-weight: 800; }
"""

NB = " "  # narrow no-break space before ? ! : ; and inside « »


def fr(s):
    s = s.replace("'", "’")
    for p in ["?", "!", ":", ";"]:
        s = s.replace(" " + p, NB + p)
    s = s.replace("« ", "«" + NB).replace(" »", NB + "»")
    for w in [" à ", " de ", " la ", " le ", " en ", " un ", " une "]:
        s = s.replace(w, w[:-1] + "\u00a0")
    return s


def H(t, lines, chip=None, out=None):
    """Headline group: lines = [(text, style)], style in {"a" navy, "b" ink, "c" small grey}; each line may carry its own delay."""
    return {"t": t, "lines": lines, "chip": chip, "out": out}


def R(rect, t, until=None, color=NAVY, radius=22):
    return {"rect": rect, "t": t, "until": until, "color": color, "radius": radius}


def P(x, y, t):
    return {"x": x, "y": y, "t": t}


INTRO = [
    {"id": "in-01-outil", "vo": "intro-01", "dur": 6.8, "vo_at": 0.4, "kind": "demo",
     "shots": [(AI + "i-reponse", 0)],
     "scrim": {"mode": "full", "t": None},
     "heads": [H(0.45, [("L'Assistant.", "a", 0), ("Un outil en ligne de l'État, conçu par la DINUM.", "b", 0.5),
                        ("Vous lui écrivez votre besoin, comme à un collègue.", "c", 2.95)])],
     "rings": [], "pulses": []},
    {"id": "in-02-reponse", "vo": "intro-02", "dur": 10.6, "vo_at": 0.35, "kind": "demo",
     "shots": [(AI + "i-reponse", 0)],
     "scrim": {"mode": "bottom", "y": 640, "t": 0.2},
     "heads": [H(0.45, [("Un courriel, un résumé,", "a", 0), ("une note, une réunion.", "b", 2.2)], out=5.2),
               H(5.55, [("Il répond en quelques secondes.", "a", 0), ("C'est une intelligence artificielle, une IA.", "c", 1.75)])],
     "rings": [R((93, 122, 1092, 238), 0.5, 5.3, NAVY, 24), R((80, 295, 1100, 630), 5.6, None, NAVY, 24)],
     "pulses": []},
    {"id": "in-03-vague", "vo": "intro-03", "dur": 8.6, "vo_at": 0.35, "kind": "demo",
     "shots": [(AI + "i-vague", 0)],
     "scrim": {"mode": "bottom", "y": 640, "t": 3.0},
     "heads": [H(3.25, [("Demande vague,", "a", 0), ("réponse vague.", "b", 0.6),
                        ("L'IA ne sait que ce que vous lui écrivez.", "c", 1.3)])],
     "rings": [R((649, 122, 1092, 203), 0.45, None, NAVY, 22), R((120, 395, 1040, 625), 6.2, None, NAVY, 22)],
     "pulses": []},
    {"id": "in-04-nestor", "vo": "intro-04", "dur": 8.0, "vo_at": 0.35, "kind": "demo",
     "shots": [(AI + "i-nestor-vague", 0)],
     "scrim": {"mode": "full", "t": 0.6},
     "heads": [H(0.7, [("Nestor.", "a", 0), ("Votre coach, à droite de l'écran.", "b", 1.5),
                       ("Il vous apprend à bien demander, pas à pas. Il relit la réponse avec vous.", "c", 2.75)])],
     "rings": [R((1168, 6, 1912, 1074), 0.3, 3.4, NAVY, 26), R((1258, 232, 1862, 502), 5.85, None, NAVY, 26)],
     "pulses": []},
    {"id": "in-05-metiers", "vo": "intro-05", "dur": 8.5, "vo_at": 0.35, "kind": "demo",
     "shots": [("s10-cas", 0), ("s03-pistes", 5.6)],
     "scrim": {"mode": "full", "t": None},
     "heads": [H(0.45, [("Dix métiers du ministère.", "a", 0), ("Plus de 200 cas pratiques, modèles et outils.", "b", 2.05),
                        ("Proposés pendant que vous écrivez.", "c", 5.5)])],
     "rings": [R((1205, 481, 1875, 789), 1.0, 5.4), R((1258, 314, 1819, 468), 6.2)],
     "pulses": []},
    {"id": "in-06-confiance", "vo": "intro-06", "dur": 9.9, "vo_at": 0.35, "kind": "demo",
     "shots": [("s06-telephone", 0), ("s11-parcours", 5.45)],
     "scrim": {"mode": "full", "t": None},
     "heads": [H(0.45, [("Avec Albert, l'IA de l'État.", "a", 0), ("Une alerte avant d'envoyer une donnée personnelle.", "d", 2.65),
                        ("Vos progrès restent sur votre ordinateur.", "d", 5.3), ("Personne n'est classé.", "d", 7.8)])],
     "rings": [R((1282, 384, 1838, 484), 3.2, 5.3, RED, 16), R((1205, 333, 1875, 677), 5.9)],
     "pulses": []},
]

SCENES = [
    {"id": "v4-01-dossier", "vo": "vo-015", "dur": 7.5, "vo_at": 0.5, "kind": "demo",
     "shots": [("s01-brouillon", 0)],
     "scrim": {"mode": "top", "h": 790, "t": 0.15},
     "heads": [H(0.55, [("Un exemple.", "a", 0), ("Un agent demande un jour de télétravail en plus.", "b", 1.75),
                        ("Vous commencez à écrire votre demande.", "c", 4.6)])],
     "rings": [R((47, 800, 1113, 990), 5.2, None, NAVY, 30)],
     "pulses": []},
    {"id": "v4-02-nestor", "vo": "vo-014", "dur": 5.2, "vo_at": 0.35, "kind": "demo",
     "shots": [("s01-brouillon", 0)],
     "scrim": {"mode": "full", "t": 1.5},
     "heads": [H(1.6, [("Nestor.", "a", 0), ("Votre coach, à droite de l'écran.", "b", 0.5),
                       ("Il vous apprend à bien demander, en travaillant.", "c", 1.5)])],
     "rings": [R((1168, 6, 1912, 1074), 0.35, None, NAVY, 26)],
     "pulses": []},
    {"id": "v4-03-pistes", "vo": "vo-003", "dur": 6.8, "vo_at": 0.35, "kind": "demo",
     "shots": [("s01-brouillon", 0), ("s03-pistes", 0.5)],
     "scrim": {"mode": "full", "t": None},
     "heads": [H(0.4, [("Pendant que vous écrivez,", "a", 0), ("des débuts plus précis.", "b", 0.5),
                       ("Un clic, et la piste est dans votre champ.", "c", 3.5)])],
     "rings": [R((1258, 314, 1819, 468), 4.1)],
     "pulses": []},
    {"id": "v4-04-manque", "vo": "vo-004", "dur": 6.2, "vo_at": 0.8, "kind": "demo",
     "shots": [("s03-pistes", 0), ("s04-analyse", 0.75)],
     "scrim": {"mode": "full", "t": None},
     "heads": [H(0.45, [("Ce qui manque,", "a", 0), ("avant d'envoyer.", "b", 0.4)], chip="Analyser mon texte")],
     "rings": [R((1258, 181, 1862, 624), 1.3)],
     "pulses": [P(1268, 939, 0.1)]},
    {"id": "v4-05-conseils", "vo": "vo-005", "dur": 8.4, "vo_at": 0.6, "kind": "demo",
     "shots": [("s04-analyse", 0), ("s05-conseils", 0.55), ("s05-ajoute", 2.75), ("s05-bon-texte", 4.3)],
     "scrim": {"mode": "top", "h": 765, "t": None},
     "heads": [H(0.5, [("D'abord, des conseils.", "a", 0), ("Vous choisissez.", "b", 1.3)],
                 chip="Ajouter · Ignorer · Je le fais déjà", out=3.95),
               H(4.2, [("Puis le bon texte,", "a", 0), ("avec vos références.", "b", 0.5)])],
     "rings": [R((1314, 540, 1787, 596), 1.9, 2.7, NAVY, 26), R((1314, 545, 1568, 584), 2.95, 4.2, NAVY, 14),
               R((47, 770, 1113, 990), 2.95, 4.2, NAVY, 30), R((1282, 258, 1838, 727), 4.7)],
     "pulses": [P(1380, 684, 0.05), P(1384, 567, 2.3)]},
    {"id": "v4-06-donnees", "vo": "vo-006", "dur": 5.4, "vo_at": 0.4, "kind": "demo",
     "shots": [("s06-telephone", 0)],
     "scrim": {"mode": "top", "h": 628, "t": None},
     "heads": [H(0.4, [("Un numéro de téléphone ?", "a", 0), ("Une alerte, avant l'envoi.", "b", 1.7)])],
     "rings": [R((1282, 384, 1838, 484), 0.7, None, RED, 16)],
     "pulses": []},
    {"id": "v4-07-relecture", "vo": "vo-007", "dur": 7.6, "vo_at": 0.4, "kind": "demo",
     "shots": [("s07-relecture", 0)],
     "scrim": {"mode": "bottom", "y": 640, "t": 1.7},
     "heads": [H(1.8, [("La réponse, relue.", "a", 0), ("Vous savez quoi faire.", "b", 2.7)])],
     "rings": [R((76, 400, 1086, 600), 0.45, 1.9, NAVY, 24), R((1258, 194, 1862, 462), 3.2)],
     "pulses": []},
    {"id": "v4-08-boutons", "vo": "vo-008", "dur": 6.2, "vo_at": 0.3, "kind": "demo",
     "shots": [("s07-relecture", 0), ("s08-parler", 2.7)],
     "scrim": {"mode": "full", "t": None},
     "heads": [H(0.3, [("À portée de main.", "a", 0), ("Et vous pouvez lui parler.", "b", 2.45)],
                 chip="Analyser · Améliorer · Faire le bilan · Demander à Nestor")],
     "rings": [R((1178, 884, 1906, 1064), 0.4, 2.6), R((1452, 328, 1628, 504), 3.0, None, NAVY, 88)],
     "pulses": []},
    {"id": "v4-09-progresser", "vo": "vo-009", "dur": 3.8, "vo_at": 0.8, "kind": "title",
     "fox": "nestor-volee", "lines": ["Et vous progressez."]},
    {"id": "v4-10-cas", "vo": "vo-010", "dur": 6.4, "vo_at": 0.4, "kind": "demo",
     "shots": [("s10-cas", 0), ("s10-etapes", 3.6)],
     "scrim": {"mode": "full", "t": 0.0},
     "heads": [H(0.4, [("De vrais cas de votre métier.", "a", 0), ("Dix métiers, trois niveaux.", "b", 1.4),
                       ("Pas à pas, en cinq étapes.", "c", 3.3)])],
     "rings": [R((1205, 481, 1875, 789), 1.0, 3.4), R((1182, 141, 1899, 219), 3.9, None, NAVY, 18)],
     "pulses": []},
    {"id": "v4-11-semaine", "vo": "vo-011", "dur": 9.6, "vo_at": 0.4, "kind": "demo",
     "shots": [("s11-semaine", 0), ("s11-parcours", 5.4)],
     "scrim": {"mode": "full", "t": None},
     "heads": [H(0.4, [("Vingt minutes par semaine,", "a", 0), ("dans votre agenda.", "b", 1.1),
                       ("Des badges, une attestation à imprimer.", "c", 2.7)], out=5.15),
               H(5.45, [("Vos progrès restent sur votre poste.", "a", 0), ("Personne ne vous classe.", "b", 2.1)])],
     "rings": [R((1205, 615, 1654, 694), 0.6, 3.0, NAVY, 14), R((1205, 811, 1877, 869), 3.1, 5.3, NAVY, 30),
               R((1205, 333, 1875, 677), 5.8)],
     "pulses": []},
    {"id": "v4-12-aussi", "vo": "vo-012", "dur": 6.6, "vo_at": 0.3, "kind": "demo",
     "shots": [("s12-cours", 0), ("s12-outils", 2.6)],
     "scrim": {"mode": "full", "t": None},
     "heads": [H(0.3, [("Huit leçons courtes.", "a", 0), ("Des outils pour chaque jour.", "b", 2.4)])],
     "rings": [R((1205, 330, 1875, 1046), 0.6, 2.5), R((1189, 321, 1529, 745), 3.1)],
     "pulses": []},
    {"id": "v4-13-fin", "vo": "vo-013", "dur": 9.6, "vo_at": 0.8, "kind": "end"},
]


def esc(s):
    return fr(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def base(sid, dur, css, body, js):
    js_body = "\n      ".join(js)
    return f'''<!doctype html>
<html lang="fr">
  <head><meta charset="UTF-8" /><title>{sid}</title></head>
  <body>
    <template>
      <style>
{FONTS}
#root {{ position: absolute; inset: 0; overflow: hidden; font-family: "Marianne", sans-serif; color: #161616; }}
#{sid}-bg {{ position: absolute; inset: 0; background: #f7f8fd; }}
#{sid}-content {{ position: absolute; inset: 0; }}
{css}
      </style>
      <div id="root" data-composition-id="{sid}" data-start="0" data-duration="{dur}" data-width="1920" data-height="1080">
        <div id="{sid}-bg"></div>
        <div id="{sid}-content">
{body}
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


def demo(sc, first):
    sid, dur = sc["id"], sc["dur"]
    css = f"""
.{sid}-shot {{ position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; opacity: 0; }}
#{sid}-scrim {{ position: absolute; left: 0; width: {PANEL_X}px; }}
.{sid}-hg {{ position: absolute; left: 104px; width: 990px; display: flex; flex-direction: column; justify-content: center; gap: 6px; }}
.{sid}-dash {{ width: 132px; height: 9px; border-radius: 5px; margin-bottom: 26px;
  background: linear-gradient(90deg, {NAVY} 33.3%, #ffffff 33.3% 66.6%, {RED} 66.6%); box-shadow: 0 0 0 1px #dde0ee; }}
.{sid}-l {{ font-weight: 800; letter-spacing: -0.02em; line-height: 1.07; opacity: 0; text-wrap: balance; }}
.{sid}-l.a {{ font-size: 74px; color: {NAVY}; }}
.{sid}-l.b {{ font-size: 74px; color: #161616; }}
.{sid}-l.c {{ font-size: 40px; font-weight: 500; letter-spacing: 0; line-height: 1.25; color: #3a3a4a; margin-top: 18px; }}
.{sid}-l.d {{ font-size: 46px; font-weight: 700; letter-spacing: -0.01em; line-height: 1.2; color: #161616; margin-top: 26px;
  padding-left: 44px; position: relative; }}
.{sid}-l.d::before {{ content: ""; position: absolute; left: 0; top: 0.32em; width: 22px; height: 22px; border-radius: 6px; background: {NAVY}; }}
.{sid}-chip {{ align-self: flex-start; margin-top: 30px; padding: 12px 26px; border-radius: 40px; background: #ffffff;
  border: 2px solid #c9cbf2; color: {NAVY}; font-size: 32px; font-weight: 700; opacity: 0; }}
.{sid}-ring {{ position: absolute; opacity: 0; box-sizing: border-box; }}
.{sid}-pulse {{ position: absolute; width: 150px; height: 150px; margin: -75px 0 0 -75px; border-radius: 50%;
  border: 6px solid {NAVY}; opacity: 0; }}
"""
    body, js = [], []
    if not first:
        js.append(f'tl.fromTo("#{sid}-content", {{opacity: 0}}, {{opacity: 1, duration: {OV}, ease: "sine.inOut"}}, 0);')
    for k, (img, t) in enumerate(sc["shots"]):
        src = img if img.startswith("assets/") else A + img
        body.append(f'<img class="{sid}-shot" id="{sid}-s{k}" src="{src}.png" alt="">')
        d = 0.01 if k == 0 else 0.45
        js.append(f'tl.fromTo("#{sid}-s{k}", {{opacity: 0}}, {{opacity: 1, duration: {d}, ease: "sine.inOut"}}, {t:.2f});')
    for k, r in enumerate(sc["rings"]):
        x0, y0, x1, y1 = r["rect"]
        glow = "rgba(0,0,145,0.14)" if r["color"] == NAVY else "rgba(225,0,15,0.16)"
        body.append(f'<div class="{sid}-ring" id="{sid}-r{k}" style="left:{x0}px;top:{y0}px;width:{x1 - x0}px;height:{y1 - y0}px;'
                    f'border:5px solid {r["color"]};border-radius:{r["radius"]}px;box-shadow:0 0 0 8px {glow}"></div>')
        js.append(f'tl.fromTo("#{sid}-r{k}", {{opacity: 0, scale: 1.035}}, {{opacity: 1, scale: 1, duration: 0.5, ease: "power2.out"}}, {r["t"]:.2f});')
        if r["until"] is not None:
            js.append(f'tl.to("#{sid}-r{k}", {{opacity: 0, duration: 0.35, ease: "sine.in"}}, {r["until"]:.2f});')
    for k, p in enumerate(sc["pulses"]):
        for j in range(2):
            pid = f"{sid}-p{k}{j}"
            body.append(f'<div class="{sid}-pulse" id="{pid}" style="left:{p["x"]}px;top:{p["y"]}px"></div>')
            js.append(f'tl.fromTo("#{pid}", {{opacity: 0.95, scale: 0.55}}, {{opacity: 0, scale: 1.35, duration: 0.6, ease: "power2.out"}}, {p["t"] + j * 0.22:.2f});')
    s = sc["scrim"]
    if s["mode"] == "top":
        y, h = 0, s["h"]
        bg = "linear-gradient(180deg, rgba(247,248,253,0.985) 0%, rgba(247,248,253,0.985) 95%, rgba(247,248,253,0) 100%)"
        hy, hh = 0, s["h"] - 70
    elif s["mode"] == "bottom":
        y, h = s["y"], 1080 - s["y"]
        bg = "linear-gradient(0deg, rgba(247,248,253,0.985) 0%, rgba(247,248,253,0.985) 90%, rgba(247,248,253,0) 100%)"
        hy, hh = s["y"] + 60, 1080 - s["y"] - 60
    else:
        y, h = 0, 1080
        bg = "rgba(247,248,253,0.985)"
        hy, hh = 0, 1080
    body.append(f'<div id="{sid}-scrim" style="top:{y}px;height:{h}px;background:{bg}"></div>')
    if s["t"] is None:
        js.append(f'tl.set("#{sid}-scrim", {{opacity: 1}}, 0);')
    else:
        js.append(f'tl.fromTo("#{sid}-scrim", {{opacity: 0, x: -80}}, {{opacity: 1, x: 0, duration: 0.6, ease: "power3.out"}}, {s["t"]:.2f});')
    for g, hd in enumerate(sc["heads"]):
        gid = f"{sid}-g{g}"
        inner = [f'<div class="{sid}-dash"></div>']
        for i, (txt, sty, dl) in enumerate(hd["lines"]):
            inner.append(f'<div class="{sid}-l {sty}" id="{gid}-l{i}">{esc(txt)}</div>')
            js.append(f'tl.fromTo("#{gid}-l{i}", {{opacity: 0, y: 26}}, {{opacity: 1, y: 0, duration: 0.6, ease: "power3.out"}}, {hd["t"] + dl:.2f});')
        if hd["chip"]:
            inner.append(f'<div class="{sid}-chip" id="{gid}-chip">{esc(hd["chip"])}</div>')
            js.append(f'tl.fromTo("#{gid}-chip", {{opacity: 0, y: 14}}, {{opacity: 1, y: 0, duration: 0.5, ease: "power2.out"}}, {hd["t"] + 0.9:.2f});')
        body.append(f'<div class="{sid}-hg" id="{gid}" style="top:{hy}px;height:{hh}px">{"".join(inner)}</div>')
        js.append(f'tl.fromTo("#{gid} .{sid}-dash", {{opacity: 0, scaleX: 0, transformOrigin: "0% 50%"}}, {{opacity: 1, scaleX: 1, duration: 0.5, ease: "power2.out"}}, {hd["t"]:.2f});')
        if hd["out"] is not None:
            js.append(f'tl.to("#{gid}", {{opacity: 0, y: -20, duration: 0.3, ease: "power1.in"}}, {hd["out"]:.2f});')
    return base(sid, dur, css, "\n".join("          " + b for b in body), js)


def title(sc):
    sid, dur = sc["id"], sc["dur"]
    css = f"""
#{sid}-wrap {{ position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 110px; }}
#{sid}-fox {{ width: 520px; height: 520px; border-radius: 50%; overflow: hidden; background: #eeeefb;
  box-shadow: 0 30px 80px rgba(0,0,80,0.14), 0 0 0 1px #e3e4f3; opacity: 0; }}
#{sid}-fox img {{ width: 100%; height: 100%; object-fit: cover; }}
#{sid}-txt {{ display: flex; flex-direction: column; }}
.{sid}-dash {{ width: 160px; height: 11px; border-radius: 6px; margin-bottom: 40px; opacity: 0;
  background: linear-gradient(90deg, {NAVY} 33.3%, #ffffff 33.3% 66.6%, {RED} 66.6%); box-shadow: 0 0 0 1px #dde0ee; }}
.{sid}-l {{ font-size: 132px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.02; color: {NAVY}; opacity: 0; max-width: 900px; }}
"""
    body = [f'<div id="{sid}-wrap"><div id="{sid}-fox"><img src="{A}{sc["fox"]}.webp" alt=""></div><div id="{sid}-txt">'
            f'<div class="{sid}-dash" id="{sid}-dash"></div>'
            + "".join(f'<div class="{sid}-l" id="{sid}-l{i}">{esc(l)}</div>' for i, l in enumerate(sc["lines"]))
            + "</div></div>"]
    js = [f'tl.fromTo("#{sid}-content", {{opacity: 0}}, {{opacity: 1, duration: {OV}, ease: "sine.inOut"}}, 0);',
          f'tl.fromTo("#{sid}-fox", {{opacity: 0, scale: 0.9}}, {{opacity: 1, scale: 1, duration: 0.8, ease: "back.out(1.4)"}}, 0.25);',
          f'tl.fromTo("#{sid}-dash", {{opacity: 0, scaleX: 0, transformOrigin: "0% 50%"}}, {{opacity: 1, scaleX: 1, duration: 0.5}}, 0.5);']
    for i in range(len(sc["lines"])):
        js.append(f'tl.fromTo("#{sid}-l{i}", {{opacity: 0, y: 40}}, {{opacity: 1, y: 0, duration: 0.8, ease: "power3.out"}}, {0.7 + 0.4 * i:.2f});')
    return base(sid, dur, css, "          " + "".join(body), js)


def end(sc):
    sid, dur = sc["id"], sc["dur"]
    css = f"""
#{sid}-wrap {{ position: absolute; left: 0; right: 0; top: 0; bottom: 120px; display: flex; align-items: center; justify-content: center; gap: 100px; }}
#{sid}-fox {{ width: 470px; height: 470px; border-radius: 50%; overflow: hidden; background: #eeeefb; flex: none;
  box-shadow: 0 30px 80px rgba(0,0,80,0.14), 0 0 0 1px #e3e4f3; opacity: 0; }}
#{sid}-fox img {{ width: 100%; height: 100%; object-fit: cover; object-position: 50% 30%; }}
#{sid}-txt {{ display: flex; flex-direction: column; max-width: 1040px; }}
#{sid}-name {{ font-size: 176px; font-weight: 800; letter-spacing: -0.035em; line-height: 0.95; color: {NAVY}; opacity: 0; }}
#{sid}-tag {{ font-size: 50px; font-weight: 700; color: #161616; margin-top: 18px; opacity: 0; }}
#{sid}-cta {{ display: flex; align-items: center; gap: 26px; margin-top: 54px; padding: 22px 34px 22px 22px; background: #ffffff;
  border-radius: 28px; border: 2px solid #d5d7f4; box-shadow: 0 18px 50px rgba(0,0,80,0.10); opacity: 0; }}
#{sid}-cta img {{ width: 96px; height: 96px; border-radius: 50%; flex: none; }}
#{sid}-cta div {{ font-size: 38px; font-weight: 500; line-height: 1.25; color: #161616; }}
#{sid}-cta b {{ font-weight: 800; color: {NAVY}; }}
#{sid}-foot {{ position: absolute; left: 0; right: 0; bottom: 92px; display: flex; align-items: center; justify-content: center; gap: 26px; opacity: 0; }}
#{sid}-flag {{ width: 132px; height: 10px; border-radius: 5px; background: linear-gradient(90deg, {NAVY} 33.3%, #ffffff 33.3% 66.6%, {RED} 66.6%);
  box-shadow: 0 0 0 1px #dde0ee; }}
#{sid}-albert {{ font-size: 40px; font-weight: 700; color: #3a3a4a; }}
"""
    cta = (f'<div id="{sid}-cta"><img src="{A}icone-analyser.png" alt=""><div>{esc("Écrivez votre demande, puis cliquez sur")} '
           f'<b>{esc("Analyser mon texte")}</b>.</div></div>')
    tag = esc("Votre coach pour bien demander à l'IA.")
    albert = esc("Avec Albert, l'IA de l'État")
    body = (f'<div id="{sid}-wrap"><div id="{sid}-fox"><img src="{A}nestor-salut.webp" alt=""></div><div id="{sid}-txt">'
            f'<div id="{sid}-name">Nestor</div><div id="{sid}-tag">{tag}</div>{cta}</div></div>'
            f'<div id="{sid}-foot"><div id="{sid}-flag"></div><div id="{sid}-albert">{albert}</div></div>')
    js = [f'tl.fromTo("#{sid}-content", {{opacity: 0}}, {{opacity: 1, duration: 0.6, ease: "sine.inOut"}}, 0);',
          f'tl.fromTo("#{sid}-fox", {{opacity: 0, scale: 0.9}}, {{opacity: 1, scale: 1, duration: 0.9, ease: "back.out(1.4)"}}, 0.3);',
          f'tl.fromTo("#{sid}-name", {{opacity: 0, y: 40}}, {{opacity: 1, y: 0, duration: 0.8, ease: "power3.out"}}, 0.5);',
          f'tl.fromTo("#{sid}-tag", {{opacity: 0, y: 24}}, {{opacity: 1, y: 0, duration: 0.7, ease: "power3.out"}}, 0.9);',
          f'tl.fromTo("#{sid}-foot", {{opacity: 0}}, {{opacity: 1, duration: 0.7}}, 1.4);',
          f'tl.fromTo("#{sid}-cta", {{opacity: 0, y: 24}}, {{opacity: 1, y: 0, duration: 0.7, ease: "power3.out"}}, 4.5);']
    return base(sid, dur, css, "          " + body, js)


def main():
    meta = {m["id"]: m for m in json.load(open(META))}
    t, slots, table = 0.0, [], []
    for i, sc in enumerate(INTRO + SCENES):
        html = demo(sc, i == 0) if sc["kind"] == "demo" else title(sc) if sc["kind"] == "title" else end(sc)
        with open(os.path.join(PROJ, "compositions", sc["id"] + ".html"), "w") as f:
            f.write(html)
        if i:
            t -= OV
        vo = meta[sc["vo"]]
        slots.append(f'      <div id="slot-{sc["id"]}" class="clip" data-composition-id="{sc["id"]}" data-composition-src="compositions/{sc["id"]}.html" '
                     f'data-start="{t:.2f}" data-duration="{sc["dur"]}" data-track-index="{1 + i % 2}" data-width="1920" data-height="1080" style="z-index:{i + 1}"></div>')
        slots.append(f'      <audio id="vo-{sc["id"]}" src="{vo["path"]}" data-start="{t + sc["vo_at"]:.2f}" data-duration="{vo["duration_s"]:.3f}" '
                     f'data-track-index="9" data-volume="1"></audio>')
        table.append({"scene": sc["id"], "start": round(t, 2), "duration": sc["dur"], "vo": sc["vo"],
                      "vo_start": round(t + sc["vo_at"], 2), "vo_end": round(t + sc["vo_at"] + vo["duration_s"], 2),
                      "master": vo["master"], "text": vo["text"]})
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
      .clip {{ position: absolute; inset: 0; }}
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
    with open(os.path.join(PROJ, "index.html"), "w") as f:
        f.write(doc)
    with open(os.path.join(PROJ, "tools", "timeline-v4.json"), "w") as f:
        json.dump({"duration": round(t, 2), "scenes": table}, f, ensure_ascii=False, indent=1)
    print(f"total {t:.2f}s, {len(INTRO)} + {len(SCENES)} scenes")


if __name__ == "__main__":
    main()
