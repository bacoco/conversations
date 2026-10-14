#!/usr/bin/env python3
"""Generate the Nestor presentation: one sub-composition per feature + index.html.

Every scene is self-contained (own background, title, captures) so it can be
rendered alone later as a short contextual clip.
"""
import json
import os
from PIL import Image

PROJ = "/data/loic/Bercy-Hub-Loic/projects/assistant-ia/.claude/worktrees/nestor-chat/videos/nestor-presentation"
SHOTS = os.path.join(PROJ, "assets", "shots")

# Card (screenshot frame) geometry on the 1920x1080 canvas.
CARD_X, CARD_Y, CARD_W, CARD_H = 830, 70, 990, 940
PAD = 24
VIEW_W, VIEW_H = CARD_W - 2 * PAD, CARD_H - 2 * PAD
MAX_SCALE = 1.25
FADE = 0.5

FONTS = """
@font-face { font-family: "Marianne"; src: url("assets/fonts/Marianne-Regular.woff2") format("woff2"); font-weight: 400; }
@font-face { font-family: "Marianne"; src: url("assets/fonts/Marianne-Medium.woff2") format("woff2"); font-weight: 500; }
@font-face { font-family: "Marianne"; src: url("assets/fonts/Marianne-Bold.woff2") format("woff2"); font-weight: 700; }
@font-face { font-family: "Marianne"; src: url("assets/fonts/Marianne-ExtraBold.woff2") format("woff2"); font-weight: 800; }
"""

CURSOR_SVG = (
    '<svg viewBox="0 0 40 52" width="56" height="72" aria-hidden="true">'
    '<path d="M3 3 L3 42 L13 33 L20 49 L27 46 L20 30 L34 30 Z" fill="#ffffff" '
    'stroke="#000091" stroke-width="3" stroke-linejoin="round"/></svg>'
)


def img_size(name):
    with Image.open(os.path.join(SHOTS, name)) as im:
        return im.size


# --------------------------------------------------------------------------
# Scenes. Times inside a scene are relative to the scene start.
# shot: file, t (start), d (duration), scale (optional), pan (y0, y1) in image
# px for the top of the view (optional), rings [(x0,y0,x1,y1,t)], click (x,y,t)
# --------------------------------------------------------------------------
SCENES = [
    {
        "id": "ouverture", "dur": 6.5, "kind": "hook",
        "lines": ["Vos agents utilisent déjà l’Assistant.", "Savent-ils bien lui demander ?"],
        "art": "assets/nestor-accueil.webp",
    },
    {
        "id": "coach-presentation", "dur": 8,
        "eyebrow": "Dans l’Assistant",
        "title": "Nestor, un coach assis à côté de vous",
        "body": ["Il est déjà là, à droite. Rien à installer.",
                 "Il ne fait pas à votre place : il vous apprend."],
        "shots": [{"file": "c01-panel.png", "t": 0.3, "d": 7.7, "pan": (0, 1060)}],
    },
    {
        "id": "coach-metier", "dur": 9,
        "eyebrow": "Il part de votre métier",
        "title": "D’abord, votre métier",
        "body": ["10 métiers du ministère.",
                 "Puis trois tâches de ce métier pour commencer."],
        "shots": [
            {"file": "c02-metier.png", "t": 0.3, "d": 4.6, "click": (236, 339, 3.0),
             "rings": [(108, 308, 364, 370, 3.2)]},
            {"file": "c02b-trois-taches.png", "t": 4.9, "d": 4.1},
        ],
    },
    {
        "id": "coach-profil", "dur": 7.5,
        "eyebrow": "Il vous connaît",
        "title": "Votre direction, vos thèmes de travail",
        "body": ["Ils servent seulement à choisir les exemples.",
                 "Jamais ajoutés à vos demandes."],
        "shots": [{"file": "c03-reglages-metier.png", "t": 0.3, "d": 7.2,
                   "rings": [(26, 186, 716, 352, 3.0)]}],
    },
    {
        "id": "coach-pistes", "dur": 10,
        "eyebrow": "Pendant que vous écrivez",
        "title": "Il suit ce que vous tapez",
        "body": ["Nestor réfléchit…",
                 "puis des pistes proches de la vôtre, et un cas pratique proche."],
        "shots": [
            {"file": "c04-champ.png", "t": 0.3, "d": 3.0},
            {"file": "c04a-reflechit.png", "t": 3.3, "d": 2.2},
            {"file": "c04b-pistes.png", "t": 5.5, "d": 4.5,
             "rings": [(410, 610, 770, 710, 7.8 - 5.5)]},
        ],
    },
    {
        "id": "coach-analyser", "dur": 10,
        "eyebrow": "Analyser mon texte",
        "title": "Ce que dit votre demande, ce qui lui manque",
        "body": ["Coché : c’est dit. Rond vide : il manque.",
                 "Vous complétez : vous seul connaissez votre dossier."],
        "shots": [{"file": "c06a-analyse.png", "t": 0.3, "d": 9.7,
                   "rings": [(100, 160, 600, 345, 3.0)],
                   "click": (213, 537, 7.2)}],
    },
    {
        "id": "coach-conseils", "dur": 12,
        "eyebrow": "Améliorer mon texte",
        "title": "D’abord des conseils, pas un texte tout fait",
        "body": ["Pour chaque conseil, vous décidez :",
                 "Ajouter · Ignorer · Je le fais déjà."],
        "shots": [
            {"file": "c06b-conseils.png", "t": 0.3, "d": 6.2, "pan": (0, 120),
             "click": (220, 459, 4.4), "rings": [(150, 432, 640, 488, 4.6)]},
            {"file": "c06c-ajoutes.png", "t": 6.5, "d": 5.5, "pan": (60, 160),
             "rings": [(150, 700, 730, 742, 8.6 - 6.5)]},
        ],
    },
    {
        "id": "coach-versions", "dur": 10,
        "eyebrow": "Ensuite seulement",
        "title": "Le bon texte, ou deux versions au choix",
        "body": ["Vos chiffres et vos références ne sont pas changés.",
                 "Ou bien : « Je corrige moi-même »."],
        "shots": [{"file": "c07b-versions.png", "t": 0.3, "d": 9.7, "pan": (0, 120),
                   "rings": [(128, 312, 674, 400, 3.2)]}],
    },
    {
        "id": "coach-donnees", "dur": 8.5,
        "eyebrow": "Vos données",
        "title": "Un numéro de téléphone ? Il vous prévient",
        "body": ["Avant tout envoi. Rien n’est parti.",
                 "Vous le retirez, ou vous continuez."],
        "shots": [
            {"file": "c09b-champ-donnees.png", "t": 0.3, "d": 3.4,
             "rings": [(490, 42, 765, 98, 1.4)]},
            {"file": "c09-donnees.png", "t": 3.7, "d": 4.8},
        ],
    },
    {
        "id": "coach-verifier", "dur": 12, "layout": "wide",
        "eyebrow": "Après la réponse",
        "title": "Il relit la réponse de l’Assistant",
        "body": ["Un chiffre que vous n’avez pas donné ? Il le signale.",
                 "« À faire » : ce que vous devez vérifier."],
        "shots": [
            {"file": "c08-reponse-assistant.png", "t": 0.3, "d": 5.6,
             "rings": [(536, 238, 650, 282, 2.4), (283, 356, 420, 400, 3.0)]},
            {"file": "c08b-verif-chiffres.png", "t": 5.9, "d": 6.1,
             "rings": [(104, 24, 700, 140, 7.4 - 5.9)]},
        ],
    },
    {
        "id": "coach-suite", "dur": 9,
        "eyebrow": "Auto · après chaque réponse",
        "title": "Un conseil, puis la suite",
        "body": ["Ce que l’Assistant ne peut pas savoir.",
                 "Et trois idées « Pour continuer »."],
        "shots": [{"file": "c08a-conseil-reponse.png", "t": 0.3, "d": 8.7, "pan": (0, 100)}],
    },
    {
        "id": "coach-bilan", "dur": 9.5,
        "eyebrow": "Faire le bilan",
        "title": "Le point sur votre séance",
        "body": ["Ce qui va, « La prochaine fois »,",
                 "et un cas de votre métier pour vous entraîner."],
        "shots": [{"file": "c11-bilan.png", "t": 0.3, "d": 9.2, "pan": (0, 420),
                   "rings": [(20, 190, 720, 345, 1.0)]}],
    },
    {
        "id": "coach-le-dire", "dur": 7,
        "eyebrow": "Le dire",
        "title": "Parlez au lieu d’écrire",
        "body": ["Le micro ne s’allume que quand vous appuyez.",
                 "« Le dire » revient dans chaque échange."],
        "shots": [{"file": "c12-demander.png", "t": 0.3, "d": 6.7, "click": (370, 200, 3.4)}],
    },
    {
        "id": "coach-demander", "dur": 9.5,
        "eyebrow": "Demander à Nestor",
        "title": "Une question ? Demandez-lui",
        "body": ["À la voix ou au clavier.",
                 "Rien n’est envoyé à l’Assistant."],
        "shots": [
            {"file": "c12b-demander-ecrit.png", "t": 0.3, "d": 4.2},
            {"file": "c12c-demander-reponse.png", "t": 4.5, "d": 5.0},
        ],
    },
    {
        "id": "coach-boutons", "dur": 7,
        "eyebrow": "Quatre boutons",
        "title": "Toujours au même endroit",
        "body": ["Analyser mon texte · Améliorer mon texte",
                 "Faire le bilan · Demander à Nestor"],
        "shots": [{"file": "c13-barre.png", "t": 0.3, "d": 6.7,
                   "rings": [(18, 14, 210, 205, 1.4), (200, 14, 392, 205, 2.6),
                             (382, 14, 572, 205, 3.8), (596, 14, 790, 205, 5.0)],
                   "ring_hold": 1.1}],
    },
    {
        "id": "coach-auto", "dur": 7.5,
        "eyebrow": "Auto",
        "title": "Il vous aide de lui-même",
        "body": ["Ou seulement quand vous le demandez :",
                 "un seul bouton, Auto."],
        "shots": [
            {"file": "c40-entete.png", "t": 0.3, "d": 3.2, "rings": [(250, 28, 422, 102, 1.2)]},
            {"file": "c05-auto.png", "t": 3.5, "d": 4.0},
        ],
    },
    {
        "id": "progresser", "dur": 4.5, "kind": "card",
        "lines": ["Et le coach vous fait progresser,", "semaine après semaine."],
        "art": "assets/nestor-defis.webp",
    },
    {
        "id": "entrainer", "dur": 14,
        "eyebrow": "S’entraîner",
        "title": "De vrais cas de votre métier, pas à pas",
        "body": ["Lire · Demander · Conseils · Comparer · Vérifier.",
                 "Trois niveaux, du plus simple au plus complet."],
        "shots": [
            {"file": "c22-cas-metier.png", "t": 0.3, "d": 2.9},
            {"file": "c23a-cas-lire.png", "t": 3.2, "d": 2.7, "pan": (0, 300)},
            {"file": "c23d-cas-comparer.png", "t": 5.9, "d": 3.0, "pan": (0, 600)},
            {"file": "c23e-cas-verifier.png", "t": 8.9, "d": 2.7},
            {"file": "c23f-cas-fini.png", "t": 11.6, "d": 2.4},
        ],
    },
    {
        "id": "semaine", "dur": 8.5,
        "eyebrow": "Chaque semaine",
        "title": "Quelques actions pour votre métier",
        "body": ["20 minutes réservées dans votre agenda.",
                 "Un programme sur plusieurs semaines."],
        "shots": [
            {"file": "c30-semaine.png", "t": 0.3, "d": 4.4, "rings": [(30, 350, 510, 418, 2.6)]},
            {"file": "c31b-agenda-attestation.png", "t": 4.7, "d": 3.8,
             "rings": [(14, 4, 492, 94, 5.6 - 4.7)]},
        ],
    },
    {
        "id": "parcours", "dur": 10,
        "eyebrow": "Mon parcours",
        "title": "Vos progrès, pour vous seul",
        "body": ["Niveaux, badges, attestation à imprimer.",
                 "Ils restent sur votre poste. Aucun classement."],
        "shots": [
            {"file": "c31a-parcours.png", "t": 0.3, "d": 3.4},
            {"file": "c31c-badges.png", "t": 3.7, "d": 3.3},
            {"file": "c31b-agenda-attestation.png", "t": 7.0, "d": 3.0,
             "rings": [(14, 210, 726, 280, 7.8 - 7.0)]},
        ],
    },
    {
        "id": "cours", "dur": 8,
        "eyebrow": "Cours",
        "title": "Huit leçons courtes, des quiz, un mémo",
        "body": ["Dont : vérifier et adapter la réponse,",
                 "obtenir une réponse sans invention."],
        "shots": [
            {"file": "c21-lecons.png", "t": 0.3, "d": 5.0, "pan": (0, 160),
             "rings": [(36, 640, 712, 720, 2.6), (36, 990, 712, 1070, 3.4)]},
            {"file": "c21b-quiz-memo.png", "t": 5.3, "d": 2.7},
        ],
    },
    {
        "id": "outils", "dur": 8,
        "eyebrow": "Outils du quotidien",
        "title": "Des demandes prêtes, classées par travail",
        "body": ["Écrire, résumer, organiser…",
                 "et des exemples pour chaque type de travail."],
        "shots": [
            {"file": "c32-outils.png", "t": 0.3, "d": 3.6},
            {"file": "c32c-demandes.png", "t": 3.9, "d": 4.1, "pan": (0, 300)},
        ],
    },
    {
        "id": "favoris", "dur": 9,
        "eyebrow": "Favoris et partage",
        "title": "Gardez vos meilleures demandes",
        "body": ["Une étoile, et elles restent sous la main.",
                 "Partagez-les avec un collègue, par un lien."],
        "shots": [
            {"file": "c33-modeles-etoiles.png", "t": 0.3, "d": 3.3, "click": (697, 827, 1.6)},
            {"file": "c34-favoris.png", "t": 3.6, "d": 2.7},
            {"file": "c35-mes-demandes.png", "t": 6.3, "d": 2.7,
             "click": (567, 244, 7.2 - 6.3), "rings": [(530, 205, 604, 283, 7.4 - 6.3)]},
        ],
    },
    {
        "id": "fermeture", "dur": 8, "kind": "end",
    },
]


def esc(s):
    s = s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return s.replace("« ", "«\u00a0").replace(" »", "\u00a0»").replace(" :", "\u00a0:").replace(" ?", "\u00a0?")


BASE_CSS = """
#root { position: absolute; inset: 0; overflow: hidden; font-family: "Marianne", sans-serif; color: #161616; }
#%(id)s-bg { position: absolute; inset: 0; background: #f7f8fd; }
#%(id)s-flag { position: absolute; left: 110px; top: 70px; width: 150px; height: 10px; border-radius: 5px;
  background: linear-gradient(90deg, #000091 33%%, #ffffff 33%% 66%%, #e1000f 66%%); box-shadow: 0 0 0 1px #dde0ee; }
#%(id)s-content { position: absolute; inset: 0; }
#%(id)s-text { position: absolute; left: 110px; top: 0; bottom: 0; width: 660px; display: flex; flex-direction: column;
  justify-content: center; gap: 30px; }
#%(id)s-eyebrow { font-size: 40px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #000091; }
#%(id)s-title { font-size: 76px; font-weight: 800; line-height: 1.06; letter-spacing: -0.015em; color: #000091; }
.%(id)s-body { font-size: 44px; font-weight: 500; line-height: 1.3; color: #3a3f55; }
#%(id)s-card { position: absolute; left: %(cx)dpx; top: %(cy)dpx; width: %(cw)dpx; height: %(ch)dpx; border-radius: 36px;
  background: #ffffff; border: 2px solid #dde0ee; box-shadow: 0 24px 60px rgba(0, 0, 145, 0.10); overflow: hidden; }
.%(id)s-view { position: absolute; left: %(pad)dpx; top: %(pad)dpx; width: %(vw)dpx; height: %(vh)dpx; overflow: hidden; }
.%(id)s-pan { position: absolute; left: 0; top: 0; transform-origin: 50%% 0%%; }
.%(id)s-pan img { display: block; width: 100%%; height: 100%%; }
.%(id)s-ring { position: absolute; border: 6px solid #e1000f; border-radius: 22px; box-shadow: 0 0 0 6px rgba(225, 0, 15, 0.12); opacity: 0; }
.%(id)s-cursor { position: absolute; width: 56px; height: 72px; opacity: 0; }
"""


def scene_html(sc):
    sid = sc["id"]
    dur = sc["dur"]
    wide = sc.get("layout") == "wide"
    cx, cy, cw, ch = (110, 420, 1700, 600) if wide else (CARD_X, CARD_Y, CARD_W, CARD_H)
    vw, vh = cw - 2 * PAD, ch - 2 * PAD
    css = BASE_CSS % {"id": sid, "cx": cx, "cy": cy, "cw": cw, "ch": ch,
                      "pad": PAD, "vw": vw, "vh": vh}
    if wide:
        css += f"""
#{sid}-text {{ top: 110px; bottom: auto; width: 1700px; gap: 18px; justify-content: flex-start; }}
#{sid}-title {{ font-size: 72px; }}
.{sid}-body {{ font-size: 42px; }}
"""
    js = []
    js.append(f'tl.fromTo("#{sid}-content", {{opacity: 0}}, {{opacity: 1, duration: {FADE}, ease: "sine.out"}}, 0);')
    js.append(f'tl.to("#{sid}-content", {{opacity: 0, duration: 0.45, ease: "sine.in"}}, {dur - 0.45:.2f});')
    kind = sc.get("kind", "feature")
    html = []

    if kind in ("hook", "card"):
        css += f"""
#{sid}-stack {{ position: absolute; left: 110px; top: 0; bottom: 0; width: 1100px; display: flex; flex-direction: column; justify-content: center; gap: 40px; }}
.{sid}-big {{ font-size: 84px; font-weight: 800; line-height: 1.08; letter-spacing: -0.02em; color: #000091; }}
.{sid}-big.second {{ color: #161616; }}
#{sid}-art {{ position: absolute; left: 1300px; top: 290px; width: 500px; height: 500px; border-radius: 50%; overflow: hidden;
  background: #ffffff; box-shadow: 0 30px 70px rgba(0, 0, 145, 0.12); }}
#{sid}-art img {{ display: block; width: 100%; height: 100%; }}
"""
        lines = "".join(
            f'<div class="{sid}-big{" second" if i else ""}" id="{sid}-l{i}">{esc(l)}</div>'
            for i, l in enumerate(sc["lines"]))
        html.append(f'<div id="{sid}-stack">{lines}</div>')
        html.append(f'<div id="{sid}-art"><img src="{sc["art"]}" alt="Nestor"></div>')
        for i in range(len(sc["lines"])):
            js.append(f'tl.fromTo("#{sid}-l{i}", {{opacity: 0, y: 30}}, {{opacity: 1, y: 0, duration: 0.8, ease: "power2.out"}}, {0.4 + i * 1.6:.2f});')
        js.append(f'tl.fromTo("#{sid}-art", {{opacity: 0, scale: 0.94}}, {{opacity: 1, scale: 1, duration: 1.0, ease: "power2.out"}}, 0.3);')
        js.append(f'tl.fromTo("#{sid}-art img", {{scale: 1}}, {{scale: 1.05, duration: {dur - 0.3:.2f}, ease: "none"}}, 0.3);')
    elif kind == "end":
        cw, ch = img_size("c40-entete.png")
        s = 1.25
        css += f"""
#{sid}-stack {{ position: absolute; left: 110px; top: 0; bottom: 0; width: 1050px; display: flex; flex-direction: column; justify-content: center; gap: 30px; }}
#{sid}-name {{ font-size: 150px; font-weight: 800; letter-spacing: -0.03em; color: #000091; line-height: 1; }}
#{sid}-tag {{ font-size: 64px; font-weight: 800; line-height: 1.1; color: #161616; }}
#{sid}-albert {{ font-size: 44px; font-weight: 500; color: #3a3f55; }}
#{sid}-help {{ display: flex; flex-direction: column; align-items: flex-start; gap: 22px; font-size: 44px; font-weight: 700; color: #000091; margin-top: 20px; }}
#{sid}-hdr {{ position: relative; width: {int(cw * s)}px; height: {int(ch * s)}px; border-radius: 24px; overflow: hidden; background: #fff;
  border: 2px solid #dde0ee; flex: none; }}
#{sid}-hdr img {{ display: block; width: 100%; height: 100%; }}
#{sid}-hring {{ position: absolute; left: {int(428 * s)}px; top: {int(28 * s)}px; width: {int(50 * s)}px; height: {int(72 * s)}px;
  border: 6px solid #e1000f; border-radius: 50%; opacity: 0; }}
#{sid}-art {{ position: absolute; left: 1290px; top: 250px; width: 540px; height: 540px; border-radius: 50%; overflow: hidden; background: #f6f8fc; box-shadow: 0 30px 70px rgba(0, 0, 145, 0.12); }}
#{sid}-art img {{ position: absolute; left: 0px; top: 48px; width: 540px; height: 435px; }}
"""
        html.append(f'''<div id="{sid}-stack">
  <div id="{sid}-name">Nestor</div>
  <div id="{sid}-tag">Apprendre à bien demander, en travaillant.</div>
  <div id="{sid}-albert">Avec Albert, l’IA de l’État.</div>
  <div id="{sid}-help"><span>Revoyez cette présentation avec le «\u00a0?\u00a0»</span><div id="{sid}-hdr"><img src="assets/shots/c40-entete.png" alt=""><div id="{sid}-hring"></div></div></div>
</div>
<div id="{sid}-art"><img src="assets/nestor.webp" alt="Nestor"></div>''')
        for i, (el, t) in enumerate([("name", 0.3), ("tag", 1.1), ("albert", 2.0), ("help", 3.0)]):
            js.append(f'tl.fromTo("#{sid}-{el}", {{opacity: 0, y: 26}}, {{opacity: 1, y: 0, duration: 0.8, ease: "power2.out"}}, {t});')
        js.append(f'tl.fromTo("#{sid}-hring", {{opacity: 0, scale: 1.4}}, {{opacity: 1, scale: 1, duration: 0.5, ease: "power2.out"}}, 4.0);')
        js.append(f'tl.fromTo("#{sid}-art", {{opacity: 0, y: 20}}, {{opacity: 1, y: 0, duration: 1.0, ease: "power2.out"}}, 0.5);')
        # no fade-out at the very end: hold the closing card
        js[1] = ""
    else:
        body = "".join(f'<div class="{sid}-body" id="{sid}-b{i}">{esc(b)}</div>' for i, b in enumerate(sc["body"]))
        html.append(f'''<div id="{sid}-text">
  <div id="{sid}-eyebrow">{esc(sc["eyebrow"])}</div>
  <div id="{sid}-title">{esc(sc["title"])}</div>
  {body}
</div>''')
        js.append(f'tl.fromTo("#{sid}-eyebrow", {{opacity: 0, y: 20}}, {{opacity: 1, y: 0, duration: 0.6, ease: "power2.out"}}, 0.15);')
        js.append(f'tl.fromTo("#{sid}-title", {{opacity: 0, y: 26}}, {{opacity: 1, y: 0, duration: 0.7, ease: "power2.out"}}, 0.35);')
        for i in range(len(sc["body"])):
            js.append(f'tl.fromTo("#{sid}-b{i}", {{opacity: 0, y: 20}}, {{opacity: 1, y: 0, duration: 0.6, ease: "power2.out"}}, {1.1 + i * 0.9:.2f});')
        js.append(f'tl.fromTo("#{sid}-card", {{opacity: 0, y: 30}}, {{opacity: 1, y: 0, duration: 0.7, ease: "power2.out"}}, 0.2);')
        views = []
        for k, sh in enumerate(sc["shots"]):
            w, h = img_size(sh["file"])
            s = min(vw / w, MAX_SCALE)
            dw, dh = w * s, h * s
            left = (vw - dw) / 2
            if dh <= vh:
                top0 = top1 = (vh - dh) / 2
            else:
                y0, y1 = sh.get("pan", (0, (dh - vh) / s))
                top0 = -min(y0 * s, dh - vh)
                top1 = -min(y1 * s, dh - vh)
            pid = f"{sid}-p{k}"
            vid = f"{sid}-v{k}"
            inner = [f'<img src="assets/shots/{sh["file"]}" alt="">']
            t0, d = sh["t"], sh["d"]
            for r, ring in enumerate(sh.get("rings", [])):
                x0, y0r, x1, y1r, tr = ring
                rid = f"{pid}-r{r}"
                inner.append(f'<div class="{sid}-ring" id="{rid}" style="left:{x0 * s - 8:.0f}px;top:{y0r * s - 8:.0f}px;'
                             f'width:{(x1 - x0) * s + 16:.0f}px;height:{(y1r - y0r) * s + 16:.0f}px"></div>')
                js.append(f'tl.fromTo("#{rid}", {{opacity: 0, scale: 1.25}}, {{opacity: 1, scale: 1, duration: 0.45, ease: "power2.out"}}, {t0 + tr:.2f});')
                hold = sh.get("ring_hold")
                if hold:
                    js.append(f'tl.to("#{rid}", {{opacity: 0, duration: 0.3}}, {t0 + tr + hold:.2f});')
            if "click" in sh:
                cx, cy, tc = sh["click"]
                cid = f"{pid}-c"
                inner.append(f'<div class="{sid}-cursor" id="{cid}" style="left:{cx * s - 4:.0f}px;top:{cy * s - 4:.0f}px">{CURSOR_SVG}</div>')
                js.append(f'tl.fromTo("#{cid}", {{opacity: 0, x: 160, y: 120}}, {{opacity: 1, x: 0, y: 0, duration: 1.0, ease: "power2.inOut"}}, {t0 + tc - 1.0:.2f});')
                js.append(f'tl.to("#{cid}", {{scale: 0.82, duration: 0.12, ease: "power1.in", transformOrigin: "10% 10%"}}, {t0 + tc:.2f});')
                js.append(f'tl.to("#{cid}", {{scale: 1, duration: 0.18, ease: "power1.out"}}, {t0 + tc + 0.13:.2f});')
            views.append(f'<div class="{sid}-view" id="{vid}" data-layout-allow-overflow><div class="{sid}-pan" id="{pid}" '
                         f'style="left:{left:.0f}px;width:{dw:.0f}px;height:{dh:.0f}px">{"".join(inner)}</div></div>')
            # shot visibility: crossfade on the view
            if k == 0:
                js.append(f'tl.fromTo("#{vid}", {{opacity: 0}}, {{opacity: 1, duration: 0.5}}, {t0:.2f});')
            else:
                js.append(f'tl.fromTo("#{vid}", {{opacity: 0}}, {{opacity: 1, duration: 0.5, ease: "sine.inOut"}}, {t0:.2f});')
            if k < len(sc["shots"]) - 1:
                js.append(f'tl.to("#{vid}", {{opacity: 0, duration: 0.5, ease: "sine.inOut"}}, {t0 + d:.2f});')
            # slow pan + slow zoom
            js.append(f'tl.fromTo("#{pid}", {{y: {top0:.0f}, scale: 1}}, {{y: {top1:.0f}, scale: 1.035, duration: {d + 0.5:.2f}, ease: "sine.inOut"}}, {t0:.2f});')
        html.append(f'<div id="{sid}-card">{"".join(views)}</div>')

    js_body = "\n      ".join(j for j in js if j)
    return f'''<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <title>{sid}</title>
  </head>
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


def index_html(total, slots):
    return f'''<!doctype html>
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
    <div id="root" data-composition-id="main" data-start="0" data-duration="{total:.2f}" data-width="1920" data-height="1080" data-fps="30">
{slots}
    </div>
    <script>
      const tl = gsap.timeline({{ paused: true }});
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
'''


def main():
    os.makedirs(os.path.join(PROJ, "compositions"), exist_ok=True)
    t = 0.0
    slots = []
    table = []
    for i, sc in enumerate(SCENES):
        path = os.path.join(PROJ, "compositions", f"{sc['id']}.html")
        with open(path, "w") as f:
            f.write(scene_html(sc))
        slots.append(
            f'      <div id="slot-{sc["id"]}" data-composition-id="{sc["id"]}" data-composition-src="compositions/{sc["id"]}.html" '
            f'data-start="{t:.2f}" data-duration="{sc["dur"]}" data-track-index="{1 + (i % 2)}" data-width="1920" data-height="1080"></div>')
        table.append((sc["id"], t, sc["dur"]))
        t += sc["dur"]
    with open(os.path.join(PROJ, "index.html"), "w") as f:
        f.write(index_html(t, "\n".join(slots)))
    json.dump([{"id": a, "start": round(b, 2), "duration": c} for a, b, c in table],
              open(os.path.join(PROJ, "scenes.json"), "w"), indent=1)
    for a, b, c in table:
        print(f"{a:22s} {b:7.2f} {c:5.1f}")
    print("total", t)


if __name__ == "__main__":
    main()
