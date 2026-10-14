---
workflow: general-video
flow: automation
storyboard: no
message: "Nestor, votre coach pour bien demander à l’IA : commencez avec le Coach."
angle: calm welcome — who Nestor is, the home cards as they are today, the coach's four buttons, one closing line
destination: in-app welcome video, right panel of l'Assistant (shown ~480 px wide, first opening of the panel)
aspect: "9:16"
language: fr + en (variable `lang`, one render per language)
length: 25s
audio: none (muted, no audio track)
style_preset: none (identity of videos/robin-intro and videos/nestor-presentation)
---

## Intent
Replaces the obsolete `nestor-intro-fr.mp4` / `nestor-intro-en.mp4` (40 s, full of « prompt » wording and
screens that no longer exist). Plays muted above « Commencer » / « Regarder la vidéo d’introduction ».
Calm, sober, institutional.

## Assets
- assets/fonts/Marianne-*.woff2 — DSFR font (from videos/nestor-presentation/assets/fonts).
- assets/nestor*.webp — the fox illustrations, copied from src/frontend/apps/conversations/public/assets/.

## Customizations
- Lavender flat canvas `#f7f8fd`, blue-white-red dash top-left, Marianne, navy `#000091` titles.
- Panel elements rebuilt in HTML from the app's real strings (`src/i18n/translations.json`,
  `PanelHome.tsx`): home cards (Coach alone on top, then Enregistrer et transcrire, Cours, Outils du
  quotidien) and the coach's four fixed buttons. No new browser capture.
- Text ≥ 56 px (the panel shows the video at ~480 px wide), few words per screen.

## Notes
- Never « prompt » / « prompting », no English in the FR render, no jargon; say « demande ».
- Never « n'invente rien ». No counters, no confetti. Never the « ML » avatar.
- French typography: espaces insécables before « : ? ! », guillemets « ».
- Deliverables: 1080×1920, 30 fps, H.264, faststart, no audio track, ≤ 2 MB each, copied over
  `src/frontend/apps/conversations/public/assets/nestor-intro-fr.mp4` and `nestor-intro-en.mp4`.
