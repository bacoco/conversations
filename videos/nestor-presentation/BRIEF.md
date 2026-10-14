---
workflow: product-launch-video
flow: automation
storyboard: no
message: "Nestor, le coach de l'Assistant : il apprend à vos agents à bien demander, en travaillant."
angle: sell — one real ministry task followed through Nestor, then the training path (cases, weekly actions, progress)
destination: modal opened by the « ? » button of Nestor's panel (shown ~800 px wide), also usable in a meeting
aspect: "16:9"
language: fr
length: 75-100s
audio: silent (muted, no voice, no music) — music none
style_preset: none (reuse videos/robin-intro identity)
---

## Intent
Marketing video for decision makers and agents of the ministry. Sell Nestor by showing it working
on a real ministry task, then the training path. Real screenshots from
https://dev.bhub.cloud/nestor-chat/ (close-ups of one element each, 2× device scale), never retouched.

## Customizations
- Identity of `videos/robin-intro/`: lavender canvas `#f7f8fd`, blue-white-red dash top-left, Marianne,
  navy `#000091` titles, the fox illustrations (`assets/nestor-*.webp`).
- Sober, institutional: calm cross-fades, slow zooms on screenshot close-ups, a cursor that clicks, a
  highlight ring. No racing counters, no confetti, no "start-up" energy.
- Muted: every message is on screen. Minimum 40 px text (the modal shows the video ~800 px wide).
- Words: « demande », « l'Assistant », « Nestor », « vous ». Never « prompt », « LLM », « modèle de
  langage », « requête », « IA générative ».

## Must not
- Name or hint at any other product (no « contrairement à », « pas une extension », « pas de classement, lui »).
- Claim « n'invente jamais rien » / « rien d'inventé », or any ranking/leaderboard (there is none).
- Show features that do not exist today; no « En préparation » mockups presented as real.
- Show the account avatar, the left conversation list, or any on-screen text containing « prompt ».
- Present the attestation as an official certification (it is declarative, printable).

## Deliverables
- `src/frontend/apps/conversations/public/assets/nestor-presentation-fr.mp4` (1920×1080, 30 fps,
  H.264, faststart, no audio track, ≤ 12 MB)
- `src/frontend/apps/conversations/public/assets/nestor-presentation-fr.jpg` (poster, 1920×1080)

## Sources
- Earlier study: scratchpad `video/etude-video-jsl.md` (§1 « ne pas mettre », §2 « supériorité sans comparer »)
- Feature truth: the coordinator's list (100 cases = 10 per job × 10 jobs, 3 levels, weekly programme,
  attestation, trainer, close matches while typing, personal-data warning, « Le dire », answer check).
