import { world, system, ItemStack, Block } from "@minecraft/server";

/**
 * Structure detection definitions.
 *
 * - Array  → existence check (at least one block exists)
 * - Object → minimum required block counts
 *
 * Order matters: first match wins.
 */
export const structures = {
    desert_pyramid: {
        "minecraft:chiseled_sandstone": 2,
        "minecraft:tnt": 2
    },
    buried_treasure: {
        "minecraft:sand": 8,
        "minecraft:sandstone": 4
    },
    shipwreck_treasure: [
        "minecraft:prismarine",
        "minecraft:dark_prismarine"
    ],
    ruined_portal: [
        "minecraft:obsidian",
        "minecraft:crying_obsidian"
    ]
};

/**
 * Loot tables applied when a structure is detected.
 */
export const structureLoot = {};

/**
 * Base loot tables per biome.
 */
export const biomeLoot = {};

export class ChestLootInjector {
    static PLACED_CHESTS_KEY = "dorios:placed_chests";
    static OPENED_CHESTS_KEY = "dorios:opened_chests";
    static REGION_SIZE = 256;

    /**
     * Registers a structure definition.
     * If the structure already exists, it is ignored.
     *
     * @param {string} id
     * @param {Object | string[]} definition
     */
    static registerStructure(id, definition) {
        if (structures[id]) return;

        structures[id] = definition;
    }

    /**
     * Registers loot for a structure.
     * If loot already exists, it is merged.
     * Duplicate items keep the entry with higher chance.
     *
     * @param {string} structureId
     * @param {Array<{item:string, chance:number, conditions?:Object}>} loot
     */
    static registerStructureLoot(structureId, loot) {
        if (!structureLoot[structureId]) {
            structureLoot[structureId] = [...loot];
            return;
        }

        const existing = structureLoot[structureId];
        const map = new Map();

        // Existing loot
        for (const entry of existing) {
            map.set(entry.item, entry);
        }

        // New loot
        for (const entry of loot) {
            const prev = map.get(entry.item);
            if (!prev || entry.chance > prev.chance) {
                map.set(entry.item, entry);
            }
        }

        structureLoot[structureId] = Array.from(map.values());
    }

    /**
     * Registers loot for a biome.
     * If loot already exists, it is merged.
     * Duplicate items keep the entry with higher chance.
     *
     * @param {string} biomeId
     * @param {Array<{item:string, chance:number}>} loot
     */
    static registerBiomeLoot(biomeId, loot) {
        if (!biomeLoot[biomeId]) {
            biomeLoot[biomeId] = [...loot];
            return;
        }

        const existing = biomeLoot[biomeId];
        const map = new Map();

        // Existing loot
        for (const entry of existing) {
            map.set(entry.item, entry);
        }

        // New loot
        for (const entry of loot) {
            const prev = map.get(entry.item);
            if (!prev || entry.chance > prev.chance) {
                map.set(entry.item, entry);
            }
        }

        biomeLoot[biomeId] = Array.from(map.values());
    }

    /**
        * Builds a unique string key for a block position.
        *
        * @param {{x:number,y:number,z:number}} pos
        * @returns {string}
        */
    static posKey(pos) {
        return `${pos.x},${pos.y},${pos.z}`;
    }

    /**
     * Returns the macro-chunk region key for a position.
     *
     * @param {{x:number,z:number}} pos
     * @returns {string}
     */
    static regionKey(pos) {
        const rx = Math.floor(pos.x / this.REGION_SIZE);
        const rz = Math.floor(pos.z / this.REGION_SIZE);
        return `${rx},${rz}`;
    }

    /**
     * Builds the full dynamic property key for a region.
     *
     * @param {string} baseKey
     * @param {{x:number,z:number}} pos
     * @returns {string}
     */
    static regionPropertyKey(baseKey, pos) {
        return `${baseKey}:${this.regionKey(pos)}`;
    }

    /**
     * Retrieves a regional chest set.
     *
     * @param {string} baseKey
     * @param {{x:number,z:number}} pos
     * @returns {{[key: string]: 1}}
     */
    static getChestSet(baseKey, pos) {
        const key = this.regionPropertyKey(baseKey, pos);
        const raw = world.getDynamicProperty(key);
        return raw ? JSON.parse(raw) : {};
    }

    /**
     * Saves a regional chest set.
     *
     * @param {string} baseKey
     * @param {{x:number,z:number}} pos
     * @param {{[key: string]: 1}} set
     */
    static saveChestSet(baseKey, pos, set) {
        const key = this.regionPropertyKey(baseKey, pos);
        world.setDynamicProperty(key, JSON.stringify(set));
    }

    /**
     * Checks whether a chest is eligible for loot injection.
     *
     * Conditions:
     * - Must NOT be player-placed
     * - Must NOT have been opened before
     *
     * @param {Block} block
     * @returns {boolean}
     */
    static canInjectChest(block) {
        const pos = block.location;
        const key = this.posKey(pos);

        const placed = this.getChestSet(this.PLACED_CHESTS_KEY, pos);
        if (placed[key]) return false;

        const opened = this.getChestSet(this.OPENED_CHESTS_KEY, pos);
        if (opened[key]) return false;

        return true;
    }

    /**
     * Marks a chest as opened.
     *
     * @param {Block} block
     */
    static markChestOpened(block) {
        const pos = block.location;
        const key = this.posKey(pos);

        const opened = this.getChestSet(this.OPENED_CHESTS_KEY, pos);
        opened[key] = 1;

        this.saveChestSet(this.OPENED_CHESTS_KEY, pos, opened);
    }

    /**
     * Marks a chest as player-placed.
     *
     * @param {Block} block
     */
    static markChestPlaced(block) {
        const pos = block.location;
        const key = this.posKey(pos);

        const placed = this.getChestSet(this.PLACED_CHESTS_KEY, pos);
        placed[key] = 1;

        this.saveChestSet(this.PLACED_CHESTS_KEY, pos, placed);
    }

    /**
     * Resets all chest tracking data, including regional properties.
     *
     * WARNING:
     * - This clears ALL tracked chest data across the world.
     * - Intended for development, debugging, or admin commands only.
     */
    static resetChestTracking() {
        const ids = world.getDynamicPropertyIds();

        for (const id of ids) {
            if (
                id.startsWith(this.PLACED_CHESTS_KEY) ||
                id.startsWith(this.OPENED_CHESTS_KEY)
            ) {
                world.setDynamicProperty(id, undefined);
            }
        }

        console.warn("[Dorios RPG Core] All chest tracking data has been fully reset.");
    }

    /**
     * Detects nearby structures using a single area scan.
     *
     * Detection order:
     * 1. Chest cluster (>= 6 chests)
     * 2. First matching structure (order matters)
     * 3. "default"
     *
     * @param {Block} block
     * @param {number} radius
     * @returns {string}
     */
    static detectNearbyStructure(block, radius = 6) {
        const dim = block.dimension;
        const origin = block.location;

        /** @type {Map<string, number>} */
        const blockCount = new Map();

        let chestCount = 0;

        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dz = -radius; dz <= radius; dz++) {

                    const b = dim.getBlock({
                        x: origin.x + dx,
                        y: origin.y + dy,
                        z: origin.z + dz
                    });

                    if (!b) continue;

                    const id = b.typeId;

                    // Count blocks
                    blockCount.set(id, (blockCount.get(id) ?? 0) + 1);

                    // Count chests
                    if (id === "minecraft:chest") {
                        chestCount++;
                    }
                }
            }
        }

        if (chestCount >= 6) {
            return "chest_cluster";
        }

        for (const [structureId, requirement] of Object.entries(structures)) {

            // Case A: Array -> existence
            if (Array.isArray(requirement)) {
                for (const blockId of requirement) {
                    if (blockCount.has(blockId)) {
                        return structureId;
                    }
                }
                continue;
            }

            // Case B: Object -> required counts
            let valid = true;

            for (const [blockId, requiredAmount] of Object.entries(requirement)) {
                if ((blockCount.get(blockId) ?? 0) < requiredAmount) {
                    valid = false;
                    break;
                }
            }

            if (valid) {
                return structureId;
            }
        }

        return "default";
    }

    /**
     * Merges biome and structure loot tables into a final loot table.
     *
     * Rules:
     * - Biome loot is always base
     * - Structure loot is additive
     * - Structure entries may have hard conditions
     * - Duplicate items sum chances
     *
     * @param {LootEntry[] | null} biomeTable
     * @param {LootEntry[] | null} structureTable
     * @param {{
     *   biomeId: string,
     *   dimensionId: string
     * }} context
     *
     * @returns {Map<string, number>}
     */
    static mergeLootTables(biomeTable, structureTable, context) {
        /** @type {Map<string, number>} */
        const finalLoot = new Map();

        // ── 1. Biome loot (base layer) ──────────────────
        if (biomeTable) {
            for (const entry of biomeTable) {
                finalLoot.set(
                    entry.item,
                    (finalLoot.get(entry.item) ?? 0) + entry.chance
                );
            }
        }

        // ── 2. Structure loot (conditional layer) ───────
        if (structureTable) {
            for (const entry of structureTable) {

                const cond = entry.conditions;
                if (cond) {
                    if (cond.dimension && cond.dimension !== context.dimensionId) continue;
                    if (cond.biomes && !cond.biomes.includes(context.biomeId)) continue;
                }

                finalLoot.set(
                    entry.item,
                    (finalLoot.get(entry.item) ?? 0) + entry.chance
                );
            }
        }

        return finalLoot;
    }

    /**
     * Injects loot into a chest container based on a resolved loot table.
     *
     * Rules:
     * - Each entry is rolled independently
     * - If chance passes, item is added to the chest
     *
     * @param {Map<string, number>} lootTable Final resolved loot table
     * @param {Block} block Chest block
     */
    static injectLoot(lootTable, block) {
        if (!lootTable || lootTable.size === 0) return;

        const container =
            block.getComponent("minecraft:inventory")?.container;

        if (!container) return;

        for (const [itemId, chance] of lootTable) {
            if (Math.random() <= chance) {
                container.addItem(new ItemStack(itemId, 1));
            }
        }
    }

    /**
     * Resolves, injects loot, and finalizes a chest interaction.
     *
     * This is the single entry point for chest loot injection.
     *
     * @param {Block} block Chest block
     */
    static resolve(block) {
        if (!this.canInjectChest(block)) return;

        const dimension = block.dimension;
        const dimensionId = dimension.id;

        // Biome is resolved from block position
        const biomeId = dimension.getBiome(block.location).id;

        // Structure detection (single scan)
        const structureId = this.detectNearbyStructure(block);

        // Obtain loot tables
        const biomeTable = biomeLoot[biomeId] ?? null;
        const structureTable = structureLoot[structureId] ?? null;

        // Merge loot tables
        const finalLoot = this.mergeLootTables(
            biomeTable,
            structureTable,
            {
                biomeId,
                dimensionId
            }
        );

        // Mark chest as opened
        this.markChestOpened(block);

        if (finalLoot.size === 0) return;

        // Inject loot
        this.injectLoot(finalLoot, block);
    }

    /**
     * Registers loot tables from a trinket definition.
     *
     * @param {string} trinketId
     * @param {Object} trinket
     */
    static registerTrinketLoot(trinketId, trinket) {
        const loot = trinket.loot;
        if (!loot) return;

        // ── Biome loot ──────────────────────────────────
        if (Array.isArray(loot.biomes)) {
            for (const entry of loot.biomes) {
                if (!entry.biome || typeof entry.chance !== "number") continue;

                this.registerBiomeLoot(entry.biome, [
                    {
                        item: trinketId,
                        chance: entry.chance
                    }
                ]);
            }
        }

        // ── Structure loot ──────────────────────────────
        if (Array.isArray(loot.structures)) {
            for (const entry of loot.structures) {
                if (!entry.structure || typeof entry.chance !== "number") continue;

                this.registerStructureLoot(entry.structure, [
                    {
                        item: trinketId,
                        chance: entry.chance,
                        conditions: entry.conditions
                    }
                ]);
            }
        }
    }

}

world.afterEvents.playerInteractWithBlock.subscribe(({ block }) => {
    if (block.typeId !== "minecraft:chest") return;
    ChestLootInjector.resolve(block);
});

world.afterEvents.playerPlaceBlock.subscribe(({ block }) => {
    if (block.typeId !== "minecraft:chest") return;
    ChestLootInjector.markChestPlaced(block);
});
