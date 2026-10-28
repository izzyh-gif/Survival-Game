/**
 * Central tuning values. Put gameplay/world constants here (not inline in
 * classes) so the next developer can balance the game from one place.
 * Units: metres, seconds, radians unless noted.
 */

// ---- World ----------------------------------------------------------------
export const WORLD_SEED = 1337;
/** Side length of the square terrain mesh. Island sits in the middle. */
export const TERRAIN_SIZE = 500;
/** Grid cells per side of the terrain mesh (cell = TERRAIN_SIZE / this). */
export const TERRAIN_SEGMENTS = 250;
/** Nominal island radius; the coast is noisy around this. */
export const ISLAND_RADIUS = 150;
export const WATER_LEVEL = 0;
/** Ground below this height is too deep/wet to walk on. */
export const MIN_WALK_HEIGHT = 0.15;
/** Campfire is placed at world origin on flat ground of this height. */
export const CAMPFIRE_GROUND_HEIGHT = 3;
export const CAMPFIRE_FLAT_RADIUS = 7;
export const CAMPFIRE_BLEND_RADIUS = 16;

// ---- Map unlocking (SPEC: campfire level unlocks more of the map) ---------
/** Forest radius walkable at campfire level 1. */
export const BASE_UNLOCK_RADIUS = 45;
/** Extra radius unlocked per campfire level. */
export const UNLOCK_RADIUS_PER_LEVEL = 7;
/** Campfire level at which the desert biome becomes accessible. */
export const DESERT_UNLOCK_LEVEL = 50;
/** Desert sits where (z + noise) is below this value (i.e. north of camp). */
export const DESERT_START_Z = -70;

// ---- Forest ---------------------------------------------------------------
export const TREE_ATTEMPTS = 2500;
export const TREE_MIN_SPACING = 3.2;
export const TREE_CLEARING_RADIUS = 12; // no trees this close to campfire
export const TREE_MIN_HEIGHT = 1.0; // keep trees off the beach

// ---- Time of day ----------------------------------------------------------
/** Real seconds for one full 24h in-game day. */
export const DAY_LENGTH_SECONDS = 600;
export const START_HOUR = 8;

// ---- Player ---------------------------------------------------------------
export const PLAYER_RADIUS = 0.4;
export const EYE_HEIGHT = 1.7;
export const WALK_SPEED = 4;
export const SPRINT_MULTIPLIER = 1.7;
export const BACKWARD_MULTIPLIER = 0.6;
/** Keyboard turning speed (A/D, Left/Right) in radians per second. */
export const KEY_TURN_SPEED = 1.9;
/** Radians of rotation per pixel at sensitivity 1.0. */
export const MOUSE_RADIANS_PER_PIXEL = 0.0022;
export const DEFAULT_SENSITIVITY = 1;
