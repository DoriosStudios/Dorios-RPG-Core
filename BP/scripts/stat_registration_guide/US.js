/**
* DORIOS RPG CORE - STAT REGISTRATION GUIDE
* -----------------------------------------
* Dorios RPG Core is a modular stat engine created by Dorios Studios.
* It allows addon developers to define RPG-style stats, effects, and trinkets
* using tags, items, and blocks within Minecraft Bedrock Edition.
*
* The system includes:
* - A unified stat engine
* - Automatic stat updates for players
* - Built-in support for trinkets
* - An optional visible and functional mana bar
* - Full cross-addon compatibility
*
* Perfect for classes, magical items, and RPG mechanics.
*/

/**
 * === SUPPORTED SOURCES ===
 * You can assign stats to:
 * 
 * - Vanilla items (e.g. "minecraft:iron_sword")
 * - Custom items or armor (e.g. "myaddon:fire_blade")
 * - Blocks (e.g. "minecraft:diamond_block")
 * - Tags (e.g. "Warrior", "Mage", "BlazingSoul")
 *
 * All are defined using their item ID or tag name as the key.
 */

/**
 * === AUTOMATIC STAT UPDATES ===
 * The system automatically applies or removes stats when:
 * - The player equips or unequips armor
 * - The mainhand item changes
 * - A trinket is equipped or removed
 * - A tag is added or removed
 *
 * You can also manually force a stat update using:
 */

player.runCommand(`scriptevent dorios:update_stats`)

/**
 * === TRINKETS ===
 * Any item or block (vanilla, custom, armor, etc.) can be marked as a trinket using:
 *
 *   trinket: "slot"
 *
 * Valid slot strings:
 *   "head", "body", "feet", "necklace", "ring", "charm",
 *   "talisman", "gauntlet", "heartycharm", "doll",
 *   "witherring", "archaiccharm", "amulet"
 */

/**
 * === STAT STRUCTURE ===
 * All stats are defined inside the `stats` object.
 * Both vanilla stats and custom stats go in the same place.
 *
 * Vanilla stats are percentage-based and follow a fixed scale:
 * 
 *   health: scale 2        (2, 4, 6, ...)
 *   attack: scale 1        (1, 2, 3, ...)
 *   knockbackRes: scale 1  (1, 2, ..., 100)
 *   damageReduction: scale 1  (-100 to 100)
 *   speed, waterSpeed, lavaSpeed: scale 5  (5, 10, 15, ..., 500)
 *
 * Custom stats do **not** follow any scaling rules. Use any integer value you want.
 *
 * Negative values are allowed for both vanilla and custom stats. 
 * They can be used to apply penalties or balance mechanics.
 *
 * Available stats:
 *   - health, attack, knockbackRes, damageReduction
 *   - speed, waterSpeed, lavaSpeed
 *   - mana, extraJumps, healthRegen, manaRegen
 *   - attackMulti, lifeSteal, manaSteal, thorns
 *   - critMulti, critChance, knockback, fireAspect
 */

/**
 * === EXAMPLES ===
 */

const newData = {
  // Example: trinket using a custom item
  "myaddon:legendary_core": {
    trinket: "charm",
    stats: {
      health: 10,
      attack: 5,
      knockbackRes: 50,
      damageReduction: 20,
      speed: 20,
      waterSpeed: 30,
      lavaSpeed: 10,
      mana: 200,
      extraJumps: 2,
      healthRegen: 5,
      manaRegen: 10,
      attackMulti: 25,
      lifeSteal: 10,
      manaSteal: 5,
      thorns: 10,
      critMulti: 50,
      critChance: 20,
      knockback: 1,
      fireAspect: 1
    },
    passives: {
      resistance: 2,
      fire_resistance: 1
    },
    actives: {
      poison: 1
    },
    immunities: ['Poison', 'Wither'],
    condition: player => {
      return player.hasTag('hola') && player.isSneaking
    }
  },

  // Example: tag-based class
  "Warrior": {
    stats: {
      damageReduction: 10,
      attack: 3,
      speed: 10,
      mana: 50,
      critChance: 5
    },
    passives: {
      strength: 1
    }
  },

  // Example: vanilla sword
  "minecraft:diamond_sword": {
    stats: {
      attackMulti: 20,
      critChance: 5,
      knockback: 1
    }
  },

  // Example: custom weapon with penalty
  "myaddon:blazing_blade": {
    stats: {
      attackMulti: 30,
      fireAspect: 1,
      manaSteal: 10,
      speed: -10,   // Speed penalty
      health: -4    // Reduced max health
    },
    passives: {
      fire_resistance: 1
    },
    actives: {
      fire: 1,
      weakness: 1
    }
  }
};

/**
 * === REGISTRATION ===
 * Register your stat data during world load like this:
 */
world.afterEvents.worldLoad.subscribe(() => {
  console.warn('[Dorios RPG Core] Register Sent');
  system.sendScriptEvent("dorios:register_stat_data", JSON.stringify({ newData }));
});

/**
 * === SUMMARY ===
 * - Define both vanilla and custom stats inside the "stats" object.
 * - Add optional passive, active, and immunity effects.
 * - Assign stats to items, blocks, or tags.
 * - Mark items as trinkets using: trinket: "slot"
 * - Negative values are allowed and supported.
 * - Stats update automatically based on player equipment and tags.
 * - Manually update with: player.runCommand("scriptevent dorios:update_stats")
 * - The system includes a fully working, visible mana bar.
 *
 * Built by Dorios Studios to help developers create powerful, balanced,
 * and compatible Minecraft Bedrock addons with less effort.
 */
