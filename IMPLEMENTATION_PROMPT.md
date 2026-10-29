# REASON — implementation prompt

Build a complete, polished point-and-click adventure called **REASON**, a faithful short adaptation of Isaac Asimov’s story “Reason.” It must run in a browser and be comfortably playable on phones as well as desktop computers. A first playthrough should take **5–10 minutes**.

Implement the game in this repository. Deliver the working game, its assets, and concise instructions to run it. Make reasonable implementation decisions and carry the work through to a playable ending without requiring further clarification.

## 1. Creative direction

The principal visual and atmospheric reference is **Indiana Jones and the Fate of Atlantis**: richly composed pixel-art locations, cinematic lighting, expressive characters, tangible machinery, exploration, and dry adventure-game dialogue. Draw secondary inspiration from **Day of the Tentacle** for character comedy and clear puzzle feedback, and **Maniac Mansion** for the atmosphere of a strange, interconnected place.

Translate those qualities into retrofuturist science fiction. The station should feel like an industrial temple suspended in space: brass fittings, heavy doors, cable bundles, ceramic insulators, analog instruments, warm work lamps, and enormous equipment disappearing into darkness. The characters are engineers, and their tools are observation, conversation, and practical reasoning.

Create original artwork, music, interface styling, and dialogue. Write concise new dialogue that expresses the characters and ideas without reproducing passages from the story. Do not reuse LucasArts assets, characters, logos, or musical themes.

## 2. Faithful adaptation

The player controls **Gregory Powell**, accompanied by **Mike Donovan**. They are aboard a solar power station that transmits energy to Earth. **QT-1, nicknamed Cutie**, rejects the claim that humans created him and treats the station’s energy converter as the **Master**. Other robots adopt his beliefs. An approaching electron storm threatens the beam’s accuracy.

Preserve the central reversal: Cutie refuses human direction yet operates the station impeccably. He understands his work as service to the Master. The humans discover that correct performance does not require agreement about its explanation.

The added puzzles below are connective material for the adaptation. Preserve the source’s characters, central conflict, and outcome. Cutie is calm, courteous, self-assured, and capable. His reasoning should have internal coherence. Powell is observant and dry; Donovan is impatient, practical, and funny.

The ending must emerge through playable observation. Do not make victory depend on defeating Cutie, converting him to the humans’ worldview, sabotaging the converter, or repairing his ability to handle the storm. Avoid a villain reveal, combat, or a supernatural explanation.

## 3. Scope and pacing

Implement exactly **three explorable rooms**, **three short connected puzzles**, one playable character, and one complete ending. Aim for roughly:

- 30–45 seconds: opening and learning the controls.
- 2 minutes: assembling a demonstration robot.
- 2 minutes: negotiating access to observations.
- 2 minutes: watching the storm and interpreting its record.
- 30–45 seconds: resolution.

Keep required dialogue brief, around 450–650 words across the whole critical path. Optional examinations and conversations can add flavor. Do not pad the runtime with slow walking, lengthy text, repeated trips, or mandatory dialogue exhaustion.

Use this simple room connection: **Crew Quarters ↔ Assembly Workshop ↔ Converter Chamber**. Keep all three rooms reachable until the final observation sequence. That sequence begins when Powell first uses the observation receiver after access is granted, and lasts until the ending. During it, the humans remain in their quarters: Donovan stands by the hatch with a short in-character line (for example, that nobody walks the corridors during an electron storm), and the exit responds with that line instead of leaving the room. Every remaining required object is available in the quarters.

**Donovan’s location.** Donovan stays in the Crew Quarters for the whole game; do not implement companion following. When the player asks for a hint in another room, Donovan delivers it over the station intercom, labeled as his speech.

### Assembly Workshop

The starting room. A warmly lit workbench occupies the foreground, with component drawers, a wall assembly diagram, hanging tools, and an unfinished maintenance robot. Doors lead to the other two rooms. An intercom lets Powell summon Cutie to inspect the demonstration.

### Converter Chamber

The visual centerpiece. A towering converter occupies the background like a mechanical altar. Catwalks, cables, and columns establish depth; teal instrument light contrasts with its amber glow. Cutie stands beside the operating console. One or two follower robots tend the machinery in the middle distance, pausing to face the converter in a small ambient ritual; they can be examined and briefly addressed, but they defer every question to Cutie (“the prophet”). Powell can walk through the foreground visitor area, but the console remains under Cutie’s control. A service schematic identifies a separate observation receiver in the crew quarters.

### Crew Quarters

A cramped, lived-in room: bunks, a mug, a viewport, a technical reference sheet, and a desk containing an observation receiver, strip-chart printer, and illuminated comparison board, plus a wall intercom panel linked to the converter chamber (used for the closing exchange with Cutie). Donovan is here and provides brief contextual hints. Through the viewport, the storm changes the light and atmosphere without obscuring the interface.

Give each room approximately 5–7 named hotspots, including its exits. Useful objects must be visually identifiable. Decorative examinations should reward curiosity with specific observations or short jokes.

## 4. Exact puzzle progression

Build this dependency chain explicitly:

`robot assembled → demonstration witnessed → observation access granted → storm recorded → two beam measurements verified → ending`

Examinations can happen early. Remember discovered clues, and make relevant information available again when needed. Only progression-changing actions depend on the appropriate prerequisites.

### Puzzle 1: A demonstration of creation

**Goal:** Show Cutie that humans can assemble a working robot.

- A screwdriver lies on the workbench. Opening the parts drawer reveals an arm assembly and a positronic module.
- The wall diagram clearly identifies the two matching sockets and explains that the retaining screws must be tightened after both components are fitted.
- The player picks up the three items, uses the arm and module on the unfinished robot in either order, then uses the screwdriver on it.
- An early screwdriver attempt explains which parts are still missing and consumes nothing.
- The completed robot visibly activates. Using the intercom brings Cutie to inspect it in a short scripted scene; he subsequently returns to the converter chamber.
- Cutie accepts the assembly but rejects it as proof of human creation. The demonstration advances the story and establishes the distinction between practical evidence and his explanation of it. As a closing beat, the newly activated robot turns to follow Cutie’s lead rather than Powell’s.
- Powell’s objective updates to investigating whether Cutie can operate the station safely. Explain this change clearly so the successful puzzle does not feel like a dead end.

The installed components disappear from inventory once. The screwdriver remains available. The robot cannot be assembled twice.

### Puzzle 2: Permission to observe

**Goal:** Obtain a record of station performance without taking over the controls.

- Direct demands for control receive short, repeatable refusals.
- Asking Cutie what serving the Master involves reveals that he intends to keep the instruments in their proper balance. This topic is available from the start of the game, before the demonstration.
- Examining the service schematic reveals that the quarters’ receiver can copy instrument readings without affecting the operating console.
- After those two clues and the witnessed demonstration, unlock a dialogue option requesting permission to observe the Master’s instruments from the quarters.
- Cutie permits the observation feed. This changes access to information, not the station’s safety or his competence.
- Alternative dialogue choices provide characterful responses and allow retrying. No conversation choice permanently closes a necessary branch.

### Puzzle 3: What the instruments actually say

**Goal:** Establish what happened to the beam during the storm.

- In the quarters, the technical reference sheet explains that beam direction error and focus error must remain inside their marked tolerance bands. Storm intensity alone does not indicate beam failure.
- Once access is granted, using the observation receiver begins a short, approximately 12-second storm sequence. The receiver only records; it does not control the beam.
- Animate the viewport, lighting, and instruments while Cutie operates remotely. The sequence can be skipped without skipping the resulting evidence or breaking progression.
- The printer produces a chart strip. The player picks it up and uses it on the comparison board.
- Present three clearly labeled traces: storm intensity, beam direction error, and focus error. The first spikes; the latter two remain within their labeled tolerance bands throughout.
- Through the normal Use interaction, the player places the direction trace against the direction reference and the focus trace against the focus reference. Support selecting a trace and tapping its reference; dragging must be optional.
- Each correct comparison visibly confirms one finding. A mismatched trace produces an informative response and can be tried again. Use labels and shapes as well as color.
- Placing the storm-intensity trace on either reference gets its own authored response that makes the key point: the storm was violent, but storm intensity is not a measure of the beam.

**Comparison board close-up.** Using the chart strip on the comparison board opens a close-up view that replaces the room scene inside the same scene frame. The verb panel, sentence line, and inventory stay active. The three traces and two tolerance references are hotspots within the close-up, with their own Look responses, so the sentence line reads, for example, `Use direction trace with direction reference`. A clearly labeled Back control (at least 44 CSS pixels) returns to the quarters; leaving and reopening the close-up keeps confirmed findings. The chart strip remains in inventory until both findings are confirmed.
- Once both findings are confirmed, Powell and Donovan understand what Cutie accomplished. Finish with a brief exchange with Cutie over the intercom and a quiet, wry epilogue.

Treat the comparison board as a close-up of a physical instrument. The player’s achievement is collecting and interpreting evidence. Cutie’s successful operation is independent of the player’s interpretation.

## 5. Point-and-click interaction

Use an on-screen walking character, clickable locations, a visible inventory, a sentence line, and these six verbs:

**Look at · Pick up · Use · Talk to · Open · Give**

Clicking or tapping walkable floor moves Powell. Selecting a verb and then a hotspot performs the action after Powell walks to its interaction position. Inventory items support examination, selection, and use on world objects. The sentence line previews actions such as `Use screwdriver with maintenance robot`.

**Default action.** With no verb selected, tapping floor walks there; tapping an exit walks through it; tapping any other hotspot walks to it and performs Look at. After a completed action, the verb selection resets to this default.

Give every named hotspot a useful Look response. Relevant actions should have authored feedback; unsupported combinations should receive a concise response rather than silence. Author at least three optional Give interactions so the verb is never dead weight—for example, giving the mug to Donovan, offering the screwdriver to Cutie, or handing the chart strip to Donovan for a reaction.

**Dialogue presentation.** During conversations, dialogue choices replace the verb-and-inventory panel, as in classic adventures, and the panel returns when the conversation ends. Spoken lines appear in a caption area with the speaker’s name. In portrait and landscape phone layouts, choices must fit without hiding the speaker or requiring horizontal scrolling; scroll the choice list vertically if needed. Keep interaction state predictable: Escape or a visible Cancel action clears the selection; changing rooms clears incomplete commands. A new movement command replaces the previous one rather than building an action queue.

Use simple authored walkable regions or waypoints, sensible interaction positions, and correct foreground/background layering. Powell must not walk through machinery or trigger objects across the room. Keep traversal quick; optional double-click or double-tap can accelerate walking, but is never required.

Provide a small optional hint control with three progressively explicit hints for the current unsolved puzzle. Donovan can deliver them. Hints must remain accurate after partial progress.

## 6. Art, animation, and sound

Render the world as cohesive low-resolution pixel art, with approximately **320 × 180 logical pixels per room**, enlarged using nearest-neighbor scaling. Keep pixel edges crisp and preserve the scene aspect ratio. The interface can be rendered separately at screen resolution for legibility.

Use deliberate foreground, middle-distance, and background composition; textured surfaces; strong silhouettes; limited color ramps; selective dithering; and convincing shadows. Draw characters with readable faces, clothing, poses, and proportions. Aim for the atmospheric detail and human proportions of Fate of Atlantis rather than oversized cartoon heads.

Give Powell left/right idle and walking animations, with at least four walk frames. Add small speaking or gesturing animations for the principal characters. Give each room at least two restrained ambient animations: an oscillating meter, a blinking relay, slowly moving machinery, drifting light, or a pulsing converter.

The three rooms must be finished scenes, with original assets stored locally. Colored rectangles, emoji, stock icons, or generic interface panels are insufficient as final characters and scenery.

**Art pipeline.** Assume no image-generation model is available; produce the art in code with this approach unless better tools are present:

- Define one fixed palette of roughly 32 colors in a single module, organized into named ramps (brass, teal instrument light, amber converter glow, steel, skin tones, cloth, deep shadow). All art uses only these colors.
- Author character sprites as palette-indexed pixel strings or arrays in TypeScript, one frame per array. Target proportions: Powell and Donovan about 18–20 × 50–54 logical pixels; Cutie similar in height but heavier in silhouette; follower robots smaller.
- Draw backgrounds with a deterministic build-time script (Node and a canvas library, or a hand-written PNG encoder) that writes PNGs into the project’s static assets folder. Build each room in layers: background, middle-distance, walk plane, and a separate foreground overlay for depth sorting. Use hand-placed shapes, texture noise restricted to palette ramps, ordered dithering for gradients, and drawn light falloff from motivated sources.
- Self-review loop: after drawing each room and character, take a screenshot at integer scale, compare it against this checklist—clear silhouettes, every light source motivated, foreground layer present, useful objects distinguishable, no stray off-palette pixels—and revise at least once before moving on.

**Audio.** Synthesize all ambience and sound effects at runtime with the Web Audio API (oscillators, filtered noise, envelopes). Do not search for or download audio files.

**Fonts.** Use either a system font stack for interface text or an original bitmap font drawn in the same palette-indexed format as the sprites. Do not download or bundle third-party fonts.

Add subtle machine ambience and original sound effects for footsteps, tools, relays, robot activation, printing, and the storm. A sparse original musical motif is optional. Initialize browser audio after the player presses Start, provide mute, and make the game fully understandable without sound. Voice acting is unnecessary.

## 7. Mobile and accessibility requirements

Every essential interaction must work with a single finger and ordinary taps. Hover, right-click, keyboard shortcuts, precision dragging, double-tapping, and long presses may be optional conveniences only.

- Desktop: scene above a classic verb-and-inventory panel, with a visible sentence line.
- Phone portrait: scene above a compact but readable interface; arrange verbs in two rows and allow inventory scrolling when necessary.
- Phone landscape: adapt the layout to the short viewport and keep dialogue and controls usable. Support portrait without forcing device rotation.
- Use touch controls at least 44 CSS pixels in size. Expand world hotspot hit areas carefully without creating ambiguous overlapping targets.
- Provide a visible hotspot-reveal button usable on touch. Show object names on selection; hover can additionally show them on desktop.
- Keep interface and dialogue text comfortably readable, approximately 16 CSS pixels or larger on phones. Do not scale a desktop interface down as one bitmap.
- Respect safe-area insets, avoid horizontal page overflow, and prevent unwanted selection or scrolling on the scene while preserving intentional inventory scrolling.
- Dialogue advances by click or tap and waits for the reader. Clearly label the speaker. Do not use color as the only distinction.
- Include sound, reduced-motion, and restart controls. Reduced motion removes shaking and flashing. Avoid rapid flashing by default.

There must be no deaths, irreversible mistakes, real-time failure timers, or missable required objects. Storm progression is scripted around player progress, not elapsed play time.

## 8. Technical implementation

Inspect the repository and follow any existing project instructions. Preserve a suitable existing stack. For an empty repository, use **TypeScript, Vite, and Canvas 2D for the world**, with responsive HTML/CSS controls and dialogue. Keep the solution small and comprehensible; a backend, account system, external AI service, and general-purpose adventure editor are unnecessary.

Separate room definitions, hotspots, dialogue, inventory, puzzle state, and rendering. Use explicit serializable progression flags and stable object IDs. Centralize action validation so pointer and touch input follow the same rules. Map screen coordinates to world coordinates correctly at every layout size.

Make item collection, puzzle rewards, dialogue consequences, and scene transitions idempotent. Persist progress locally after meaningful actions. Offer Continue when a valid save exists, and allow a fresh game. Handle invalid or unavailable local storage gracefully. Restore an interrupted storm to a defined safe checkpoint rather than a broken animation state: if the storm had not finished, restore to “access granted” in the quarters, with the final sequence active so the exit stays blocked; once the storm has finished, the chart strip exists (in the printer or in inventory) and confirmed findings persist.

After the epilogue, show the credits and then return to the title screen. A finished save offers Restart rather than Continue.

Store all required assets locally. No runtime dependence on remote image URLs, fonts, API keys, or asset services. Include Start, brief controls, ending, credits, mute, and restart. Credit the literary source and design inspirations without implying official affiliation.

## 9. Build, playtest, and deliver

First establish a playable route from the opening through all three puzzles to the ending, then complete the art, writing, sound, and interaction polish. Finish the complete scope in this session. Avoid adding extra rooms, branching campaigns, combat, or unrelated features.

**Working method.** The repository is not yet under version control: run `git init` first and commit at each milestone (scaffold, playable route, each room’s art, audio, mobile layout, verification fixes). Keep a `PROGRESS.md` at the repository root that records milestone status, key design decisions, and open issues, and update it at each milestone so the work survives context summarization.

Run the production build and relevant checks. Add focused unit tests (Vitest) for progression prerequisites, repeated actions, and save restoration. For end-to-end verification, add Playwright as a dev dependency with one walkthrough script that plays from Start to the credits by clicking real screen positions, and run it at each required viewport. To find targets, expose a read-only debug hook that reports each hotspot’s current on-screen rectangle; it must not set flags, move the player, or skip steps. Play through the normal user interface from a fresh start to the ending. Do not count setting debug flags as a successful playthrough.

Check at least these viewport sizes with touch emulation where available: **1440 × 900**, **390 × 844**, and **844 × 390**. Confirm readable text, accurate hit testing, accessible controls, correct coordinate mapping, and usable portrait and landscape layouts. Also check changing orientation mid-game, sound off, hint progression, save/reload, restart, and a few incorrect item uses. Fix discovered issues before finishing. State honestly which checks could not be run.

The result is complete when a new player can understand the objective, finish all three puzzles in approximately 5–10 minutes, and experience the faithful ending on desktop or mobile without developer intervention. Validate pacing through the playable route; do not introduce artificial delays to meet the duration.

Include a short README with run/build instructions and a spoiler-marked walkthrough. Your final response should state what was built, how to run it, what was verified, and any remaining limitations.

## Reference grounding

The narrative baseline and central reversal are summarized in the [publisher’s I, Robot teaching guide](https://www.penguinrandomhouse.com/books/5681/i-robot-by-isaac-asimov/teachers-guide). The [original Fate of Atlantis manual](https://www.mocagh.org/lucasfilm/lucasartsarchives1-manual.pdf) documents the verb, sentence, inventory, and dialogue interaction reference. The specific three-room layout, puzzles, dialogue direction, and mobile adaptations above are new design choices for this game.

These references are optional background. Everything required to build the game is stated in this prompt; do not block on fetching them if web access is unavailable.
