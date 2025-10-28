# CalorieAI Android In‑App AAC Recording — Single‑Path Implementation Plan

Date: 2025‑10‑28
Owner: CalorieAI
Status: Approved for implementation (no code in this doc)

Decision
- One design only. In‑app recording using a lightweight native AAC (M4A) Cordova plugin.
- Remove all other strategies and fallbacks.
- Output format: audio/m4a (MPEG‑4 container, AAC codec) — fully supported by Gemini.

Non‑Goals
- No web MediaRecorder / WebAudio usage.
- No native capture UI or external recorder intents.
- No 3GP/AMR, no WebM, no client‑side re‑encoding.

Why AAC plugin (M4A)
- Consistent UX (stay on page), reliable first‑tap Android permission prompt, small file sizes, direct Gemini compatibility, simple to maintain.

---

Architecture
1) Cordova Plugin (Native Android)
- Name: cordova‑plugin‑aac‑recorder (project local; minimal surface)
- Android MediaRecorder:
  - OutputFormat: MPEG_4
  - AudioEncoder: AAC
  - channelCount: 1 (mono)
  - sampleRate: 16000 Hz
  - bitRate: 32 kbps (≈ 15–18 MB per hour; stays under 20 MB limit)
  - Extension: .m4a
- Storage location: Internal app data (cordova.file.dataDirectory), no external storage permission.

2) JS Plugin API (contract)
- window.AACRecorder methods (promises):
  - hasPermission(): Promise<boolean>
  - requestPermission(): Promise<boolean>  // Shows OS dialog on first call
  - start({ maxSeconds?: number }): Promise<{ started: true, filePath: string, mimeType: 'audio/m4a', startedAt: number }>
  - stop(): Promise<{ filePath: string, mimeType: 'audio/m4a', durationMs: number, sizeBytes: number }>
  - isRecording(): Promise<boolean>
- Error cases: permissionDenied, micInUse, startFailure, ioFailure, notRecording.

3) Permissions
- Use cordova‑plugin‑android‑permissions for RECORD_AUDIO.
- Flow on first Mic tap: check → request → OS prompt → if granted, start; if denied, show rationale + deep‑link to app settings.
- No other permission is required for internal storage.

4) App Integration (audio.js)
- Replace with single integration path that uses AACRecorder only.
- States: idle → requestingPermission → recording → stopping → saved → sending.
- UI: single Mic toggle; timer; Stop; Send to AI disabled while recording; auto‑stop at 60min.
- File handling: get filePath from stop(), read via cordova‑plugin‑file, send as base64 with mimeType: 'audio/m4a'.

5) Gemini Upload
- Inline upload (generateContent) while payload ≤ 20 MB (fits at 32 kbps/mono/16 kHz for 60 min).
- Do not use Files API unless we explicitly raise bitrate/sampleRate later.

---

Code Removals (must delete)
- Remove native capture path (navigator.device.capture.captureAudio) and all external recorder flows.
- Remove cordova‑plugin‑media and any 3GP/AMR usage.
- Remove Web MediaRecorder / WebAudio code paths.
- Remove any WebM re‑encoding logic.
- Remove mixed‑strategy permission workarounds; centralize on android‑permissions + plugin.

Config/Plugins
- Keep: cordova‑plugin‑android‑permissions, cordova‑plugin‑file.
- Remove: cordova‑plugin‑media, cordova‑plugin‑media‑capture, camera (if only used for old flows).
- Add: cordova‑plugin‑aac‑recorder (new, local plugin in repo).
- Ensure `config.xml` lists only the required plugins above.

File Paths & Naming
- Filename: calorieai_YYYYMMDD_HHMMSS.m4a (or calorieai_<timestamp>.m4a)
- Directory: cordova.file.dataDirectory (internal app storage)

---

CI / GitHub Actions
Goal: Build APK exclusively from `calorieai-android/` without overwriting Cordova www.

Key rules
- Do NOT copy `web/` into `calorieai-android/www` in CI.
- Ensure `www/index.html` includes `<script src="cordova.js"></script>` and that the built APK bundles `cordova_plugins.js`.
- Build steps (outline):
  1) actions/checkout
  2) Setup Node + Java + Android SDK
  3) `cd calorieai-android`
  4) `npm ci` (if needed) or ensure Cordova CLI is available
  5) `cordova build android --release` (or gradle via Cordova)
  6) Sign + zipalign (if releasing) and upload artifacts
- Add a guard step to fail if any step tries to sync from `web/`.

---

Testing Plan (physical device)
1) Fresh install test
- Launch app → Tap Mic → Android permission dialog appears.
- Allow → recording starts; stay on page; timer visible.

2) Deny flow
- Deny once → app shows rationale + button to open app settings → grant from settings → back → Mic tap starts recording.

3) Record/Stop
- Record 10–20 seconds → Stop → file saved; Send to AI enabled; metadata shows duration and size.

4) Long session
- Record 61 min attempt → auto‑stop triggers at 60:00; file saved; no crashes; size < 20 MB.

5) Send to AI
- With valid API key → Send → success; response parsed and stored; UI success message.
- Network off test (optional): error shown and handled gracefully.

6) Edge cases
- Mic already in use → clear error explaining mic is busy.
- Rapid tap start/stop → no stuck state; isRecording checks prevent race conditions.
- App background during record → continues or stops cleanly; stop works after resume.

Acceptance Criteria
- First Mic tap shows OS permission prompt on fresh install.
- Recording stays in‑app, no external UI; timer and Stop work.
- Output is audio/m4a; 60‑min cap enforced; size ≤ 20 MB.
- Send to AI succeeds with valid key; no conversion paths present in code.
- CI artifact uses Cordova app only; no web assets overwrite; plugins active in APK.

---

Rollback Plan
- Revert to previous commit; restore removed plugins only if needed.
- Keep this plan to re‑apply the single‑path approach.

Open Questions (none required to proceed)
- None. Implementation can start immediately.

Next Steps
- Implement the AAC plugin and JS shim.
- Refactor `calorieai-android/www/js/audio.js` to the single AAC path.
- Prune plugins in `config.xml`.
- Update CI to build only from `calorieai-android/` and add guard checks.
- Run device tests and confirm acceptance criteria.
