# Alchemical Build Directive: Ancient Combat Evolution (ACE)

**Objective:** Construct a high-conversion, 3D-immersive "Digital Arena" that establishes ACE as the elite combat sports authority in Alwarpet.

**Priority Hierarchy:**
1. **CRO:** Lead capture is the "Finisher."
2. **SEO:** Domain authority and local ranking are the "Map."
3. **UI:** "Underground Luxury" aesthetic is the "Hook."

---

## 1. The Strategy: Conversion, Search, and Soul
To meet priorities (CRO > SEO > UI), the UI is treated as the **"Hook,"** the SEO as the **"Map,"** and the CRO as the **"Finisher."**

*   **CRO (The Finisher):** Reels are used as irrefutable proof. Use `hyperframes` to add synchronized text overlays (e.g., "12kg Lost in 90 Days") that appear at the exact moment a client hits a bag or smiles in their testimonial.
*   **SEO (The Map):** Counter video-heavy SEO issues by using `hyperframes transcribe` to turn Reels' audio into hidden, indexable text metadata and `schema-markup` to tag the "Technique Vault" videos as educational entities, establishing authority for "MMA Alwarpet."
*   **UI (The Hook):** A Three.js "Combat Arena" where the user isn't just scrolling; they are exploring.

---

## 2. Visual Narrative & Aesthetic: "Underground Luxury"
*   **Vibe:** "Underground Luxury" meets "Gritty Premium." Matte black background with metallic gold accents. It feels exclusive—like an elite training ground, not a casual fitness studio.
*   **Palette:** Matte Black (#0a0a0a), Deep Charcoal (#161616), and Championship Gold (sampled from logo, approx. #d4af37). No harsh white; use sharp gold for interactive elements and active hover states.
*   **Typography:** "Heavyweight Presence." Blocky, distressed, heavyweight all-caps sans-serif (Bebas Neue / Montserrat Ultra-Bold). Pack lettering tightly; titles must dominate viewport sections.
*   **Structure:** "Shield of Discipline." Sharp geometric lines, bento grids, and asymmetric frames. No soft curves or corporate fluff.

---

## 3. What’s Possible: The "Hyper-3D" Integration
Invoke the `hyperframes` skill to process raw MP4s found in `./user-inputs/`:

### A. The "Ghost Fighter" Hero (UI/HyperFrames)
*   **The Concept:** A 3D dark-void space. Using `hyperframes remove-background`, strip the background from "Pure Cinema" Reels.
*   **The Execution:** A transparent, high-energy fighter appears to be shadow-boxing inside the 3D space. As the user moves their mouse, the 3D perspective shifts, creating a holographic presence.

### B. The "Testimonial Catalyst" Center (CRO)
*   **The Concept:** A "Through-Line" of client photos that "combust" into video.
*   **The Execution:** Static, premium black-and-white portraits. On hover/tap, `hyperframes` triggers a seamless transition where the photo morphs into that client's specific transformation Reel. Use `audio-reactive` to make the UI pulse with the Reel's bass/heartbeat.

### C. The "Vault" (3D Bento Grid)
*   **The Concept:** A 3D "Rack" of video screens.
*   **The Execution:** A Three.js environment where training Reels are mapped onto 3D surfaces (like heavy bags or screens). Keeps the social media content contained within a high-end architectural space.

---

## 4. Visual Blueprint (The Experience Flow)
*   **Palette:** Obsidian (#0a0a0f), Acid Green (#1fe08a) or Champagne Gold (#f93) for interactivity, and Pure White for aggressive typography.
*   **Navigation:** Minimalist. Fixed "Book Trial" button with a subtle "Ember" glow.
*   **Phases:**
    *   **Phase 1 (Hero):** 3D Void + Ghost Fighter + Bold Headline.
    *   **Phase 2 (The Why):** 3D Bento Grid of Reels showing technique highlights.
    *   **Phase 3 (The Proof):** Client-Pic-to-Reel center.
    *   **Phase 4 (Final CTA):** High-contrast form with "WhatsApp Coach" floating FAB.

---

## 5. Execution Constraints for the Orchestrator
1.  **Scan Asset Folder:** All raw MP4s and pics are located in `portfolio/ace/user-inputs/`.
2.  **Prep Clips:** Use `hyperframes` to extract 5-8s highlight loops. Apply text overlays (Approved: DISCIPLINE, CONSISTENCY, EVOLUTION, STRIKING, POWER). NO narration on training reels.
3.  **No Hallucinations:** Use only provided assets.
4.  **Technical SEO:** Apply `seo-aeo-best-practices` and `schema-markup`.
5.  **Review Loop:** Present text overlays and 3D lighting intensities for approval before final injection.
