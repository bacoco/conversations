---
workflow: product-launch-video
flow: automation
storyboard: no
message: "L'Assistant est l'outil d'IA de l'État ; Nestor, le coach à droite, vous apprend à bien lui demander, en travaillant."
angle: for a ministry agent who has never used an AI (and a decision-maker) — first explain in everyday words what the Assistant is, why a vague request fails, who Nestor is and why he can be trusted (intro, 50 s); then one real task from start to finish (reply to an agent who asks for one more telework day), then progress, then one gesture to make now
destination: window opened by « ? » in Nestor's panel, full screen up to ~1200 px wide; must stay legible at 880 px wide
aspect: "16:9"
language: fr
length: ~135 s (intro 6 scenes, 50 s + v4 13 scenes; 134.5 s, 19 scenes)
audio: French voiceover by Nestor (OmniVoice reference voice `nestor-aventuriere`, fr, speed 1.0), no music
style_preset: none (identity of videos/robin-intro: lavender #f7f8fd, navy #000091, Marianne, tricolour dash, fox illustrations)
---

## Intent
Marketing film (Apple level) for agents and managers of the ministry. Follow-up of the senior marketing critique
(scratchpad `critique/critique.md`): one story, one promise, real proof, a clear end card.

Intro (2026-10-14, Loic): « celui qui va regarder ne sait même pas ce qu'est une IA, ni ce qu'est un assistant. Le but
c'est de lui dire ce que c'est et ce qu'il peut faire avec. » Spoken lines are plain explanatory French (subject-verb-object,
no ellipsis, no slogans, no metaphors); each line is transcribed back with `/audio/transcribe` before rendering.

## Hard rules (Loic)
1. Every demonstration shot shows Nestor's panel on the RIGHT, at real size and sharp. The app screenshot is never
   shrunk: captures are 1920x1080 screenshots shown 1:1 (layout 1010x568 CSS rendered at zoom 1.9, so panel text is
   ~27 px in the master, ~12 px in the 880 px window). The headline sits on a light scrim over the conversation area
   (x < 1160), never over the panel.
2. Master 1920x1080 30 fps; web file 1920x1080 30 fps H.264 CRF 25, -tune stillimage, preset slow, yuv420p, faststart.
3. Sound: AAC 128 kbit/s mono built from the WAV masters (never from the MP3 copies).
4. Text: benefit-led, short, human. Voice: sentences of 15 words max, only periods and commas, numbers in words,
   never the word « assistant », Nestor says « je », vouvoiement, never « prompt », no competitor,
   never « n'invente rien ». Only features that exist.
5. Real screenshots of the real app only (dev.bhub.cloud/nestor-chat, session `nestor`), no retouching; user avatar hidden;
   left conversation list closed (neutral state).

## Visual system
- Wide: the full app (centre + panel) with no scrim, one blue outline (scenes 2 and 7 open this way).
- Duo: lavender scrim over the conversation area with the headline (navy line + ink line + optional grey line or chip
  naming the button), the panel crisp on the right; crossfades between real states of the same screen.
- Title: lavender card with a fox illustration (« Et vous progressez. ») and the end card.
- Highlights: blue France #000091 outlines and click pulses; red #e1000f only on the personal-data alert.

## Must not
- Name or hint at any other product; show the account avatar; show text containing « prompt ».
- Present the attestation as an official certification (it is declarative, printable).
- Show features that do not exist.

## Deliverables
- `src/frontend/apps/conversations/public/assets/nestor-presentation-fr.mp4` (1920x1080, 30 fps, H.264, AAC 128k mono, faststart)
- `src/frontend/apps/conversations/public/assets/nestor-presentation-fr.jpg` (poster 1920x1080)
- Master outside git: `/data/loic/Bercy-Hub-Loic/projects/nestor-voix/film/nestor-presentation-intro-v4-master-1080p.mp4`
  (previous v4 master without intro kept beside it)

## Sources
- Narration: `tools/narration-intro.json` (intro + the two rewritten v4 lines) and `tools/narration-v4.json`; WAV masters + manifest: `/data/loic/Bercy-Hub-Loic/projects/nestor-voix/film/v4/`;
  MP3 copies (96 kbit/s mono) for the preview: `.media/audio/voice-v4/`.
- Build: `python3 tools/gen4.py` writes `compositions/in-*.html` + `compositions/v4-*.html`, `index.html` and `tools/timeline-v4.json`.
- Captures: `assets/v4/*.png` (2026-10-14, real app, telework thread); `assets/intro/*.png` (2026-10-14, real requests and answers, Nestor's remark).
