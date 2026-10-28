# Architecture

## Layout

```
src/
  main.ts            entry; creates Game
  config.ts          ALL tuning constants (world size, speeds, unlock rules...)
  core/
    Game.ts          renderer, main loop, pause/resume, system wiring
    Input.ts         keyboard/mouse state (held, edge-triggered, mouse delta, click)
    Settings.ts      persisted user prefs (localStorage), e.g. mouse sensitivity
  world/
    World.ts         owns scene + world objects; spatial queries (isWalkable, groundHeight)
    Terrain.ts       seeded heightfield, biome function, vertex-coloured mesh
    Forest.ts        instanced trees + trunk colliders; removeTree()/findNearest()
    Colliders.ts     spatial-hash of circle colliders (trees, campfire)
    Campfire.ts      placeholder campfire visuals + lit flag
    DayNight.ts      in-game clock, sun/sky/fog; day counter
    noise.ts         seeded PRNG, value noise, math helpers
  player/
    Player.ts        first-person controller, camera, collision-aware movement
  ui/
    Overlay.ts       start/pause overlay (markup in index.html)
```

## Main loop

`Game.tick()`: `player.update` -> `world.update` -> `input.endFrame()` -> render. Updates are skipped while paused (pointer lock lost => pause). `dt` is clamped to 0.1s.

## Conventions

- Units: metres, seconds, radians. +Y is up. Camera looks down -Z at yaw 0.
- Tunables live in `config.ts`; avoid magic numbers in classes.
- World generation is deterministic from `WORLD_SEED`. Changing seed or generation order changes the map.
- Gameplay code asks `World` (`isWalkable`, `groundHeight`, `colliders`) instead of poking at Terrain/Forest internals.
- Input uses `KeyboardEvent.code` (physical keys). Add new bindings via `Input.anyDown/wasPressed` in the system that needs them.
- Prefer new systems as classes constructed in `Game` and ticked in `Game.tick()` while unpaused.
- No external assets yet: everything is procedural geometry and vertex colours. Keep it that way until art direction is decided, or put files in `public/` (served relative thanks to `base: './'`).

## Key design decisions

- **A/D turn, not strafe.** SPEC says they "change perspective". Interpreted as turning, so movement is only forward/back.
- **No jumping / no gravity.** The player is snapped to terrain height (smoothed).
- **Map unlocking.** `World.unlockedRadius` grows with `campfireLevel` (`BASE_UNLOCK_RADIUS + UNLOCK_RADIUS_PER_LEVEL * (level-1)`). The desert (north, z < ~-70) is blocked until level `DESERT_UNLOCK_LEVEL` (50). The block is currently an invisible wall; a visual cue is on the roadmap.
- **Day/night.** 10 real minutes per 24h (`DAY_LENGTH_SECONDS`). `DayNight.day` increments at midnight; `isNight` is the hook for monster spawns. The player currently starts at 8am on day 1. Day is bright and saturated on purpose (the "too perfect" feel); the horror layer should be added on top (silence, subtle wrongness).
- **Performance.** Trees are 3 InstancedMeshes; collisions use a spatial hash. No shadows yet.

## Extending: where things plug in

| Feature | Hook |
| --- | --- |
| Chop trees | `forest.findNearest(x,z,reach)` then `forest.removeTree(id)`; drop logs on click (`input.consumeClick()`) |
| Hunger | New system reading `player.isSprinting` / `isMoving`; drain faster when sprinting |
| Campfire levels / safe zone | `Campfire` (add logs, timer) and `world.campfireLevel` |
| Monsters, wolves | Use `world.colliders`, `world.groundHeight`, `dayNight.isNight` |
| Pause/home screen | Extend `ui/Overlay.ts` and `Settings.ts` |
