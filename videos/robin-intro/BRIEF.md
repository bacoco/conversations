---
workflow: product-launch-video
flow: automation
storyboard: no
message: "Nestor, le copilote de prompts du panneau : coach, cours et outils du quotidien"
angle: show-it — tour of Nestor's three spaces (coach, course, everyday tools)
destination: in-app welcome video, right panel of L'Assistant (object-fit contain)
aspect: "9:16"
language: fr + en (variable `lang`, one render per language)
length: 40s
audio: silent (autoplays muted in the browser)
---

## Intent
Shown when the prompt-help right panel opens on Nestor's welcome. Fills the panel.
Two renders: `nestor-intro-fr.mp4`, `nestor-intro-en.mp4`.

## Notes
- No live capture: the dev realm has no usable test account, so the panel screens are
  rebuilt in HTML from the real Nestor illustrations and the app's FR/EN strings
  (`src/frontend/apps/conversations/src/i18n/translations.json`).
- Font: Marianne (DSFR), copied from `@gouvfr-lasuite/ui-kit`.
