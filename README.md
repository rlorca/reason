# REASON

A short point-and-click adventure by **Flickersoft**, adapted from Isaac Asimov's story "Reason". Play Gregory Powell: show the robot Cutie that humans can build a robot, win permission to watch his work, and read what the instruments say about the electron storm. About 5-10 minutes. Works on desktop and phones (portrait and landscape).

## Run

```bash
npm install
npm run dev        # builds the room art, then starts Vite
npm run build      # art + type check + production build into dist/
npm run preview    # serve dist/ on http://localhost:4173
npm test           # Vitest: progression, repeated actions, save restoration
npx playwright install chromium   # once
npm run e2e        # builds, then plays Start-to-credits at 1440x900, 390x844, 844x390
```

## Controls

Tap the floor to walk. Tap an object to look at it (doors take you through). Pick one of the six verbs, then an object; for **Use** and **Give**, tap an inventory item first, then the target. Eye button reveals hotspots, `?` asks Donovan for a hint, Menu has sound, reduced motion and restart. Escape or Cancel clears a selection.

## How it is made

- TypeScript + Vite + Canvas 2D (320x180 logical pixels, nearest-neighbour scaling); HTML/CSS for dialogue and controls.
- One 32-colour palette (`src/art/palette.ts`). Room backgrounds and foreground overlays are painted by `scripts/build-art.ts` into `public/assets/rooms/`. Character, prop and icon sprites are palette-indexed pixel strings (`src/art/sprites.ts`), composed by small pose routines at load. The Flickersoft splash is drawn in its own rainbow colours from a 5x7 bitmap font.
- All sound is synthesised at runtime with Web Audio. No downloaded assets or fonts.
- `window.__reason` is a read-only debug hook (hotspot screen rectangles, state snapshot) used by the Playwright walkthrough.

## Walkthrough (spoilers)

<details><summary>Show</summary>

1. Look at the wall diagram. Pick up the screwdriver, open the parts drawer, take the arm and module. Use arm and module on the robot, then the screwdriver. Use the intercom: Cutie inspects it and leaves.
2. Converter chamber: look at the service schematic, Talk to Cutie, ask what serving the Master involves, then ask permission to watch from the quarters.
3. Quarters: read the reference sheet, Use the observation receiver, take the strip from the printer, Use the strip on the comparison board. Match direction trace to direction reference and focus trace to focus reference (the storm trace matches neither). Then Use the intercom panel.

</details>

## Credits

A Flickersoft game. Inspired by Indiana Jones and the Fate of Atlantis, Day of the Tentacle and Maniac Mansion; not affiliated with or endorsed by LucasArts, Disney or the Asimov estate.
