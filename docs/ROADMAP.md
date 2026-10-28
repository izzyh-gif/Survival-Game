# Roadmap

Order follows SPEC "Priorities": basic functions first (materials, crafting, weapons, hunger, health, monsters); sound, bosses, rare loot and desert last.

## Done

- [x] Vite + TypeScript + Three.js project, GitHub Pages deploy workflow
- [x] Procedural island (forest biome + beach + water), desert region defined but locked
- [x] Instanced forest with trunk collision
- [x] Placeholder campfire with light
- [x] Day/night cycle and day counter
- [x] First-person controls: W/S/arrows, A/D turn, mouse look, Shift sprint
- [x] Pause overlay with sensitivity setting (persisted)

## Next (core loop)

1. Inventory data model + hotbar UI; Q drop / E pick up; click to use (Input already captures click)
2. Chop trees -> logs (use `Forest.removeTree`); tree-chop progress/axe
3. Hunger + health bars (hunger drains over time, faster while sprinting; health only from damage)
4. Livestock (cow/sheep/chicken): kill for raw meat, leather, wool, feathers
5. Campfire: add logs, levels, 10s out-timer, safe zone, cooking meat; hook level into `world.campfireLevel`
6. Crafting table + recipes (spear -> gun), metal ore mining
7. Monsters, night attacks every other night, difficulty +1 every 3 days, blood moon boss every 10 days
8. Win/lose, 50-night goal, highest streak tracking, game history screen
9. Tutorial (first-run), full home screen
10. Merchant (every other day), random loot chests, wolf taming

## Later

Sound/ambience, three bosses, rare drops, desert biome + snake king, shadows, grass/props, visual cue for locked map edge.

## Open questions for the product owner

- Campfire "level 50 unlocks desert": how many logs per level, and how fast should levels realistically rise over 50 nights?
- Camera: first-person assumed; is third-person wanted?
- Art direction: low-poly procedural (current) vs imported models?
- Monster/entity designs and what makes day feel "eerie" (ideas: silent animals, too-still wind, distant sounds).
