import { system, ItemStack, world } from '@minecraft/server'
import { data, slots } from './config.js'
import { getStatCategory, displayStats } from './stats_manager.js'

// =============================================================================
// MULTI-SLOT HELPERS
// =============================================================================

/**
 * Normalizes a trinket's slot field to always return an array of slot names.
 * Supports both `trinket: "ring"` and `trinket: ["ring", "ring2"]`.
 */
function getTrinketSlots(entry) {
    if (!entry?.trinket) return [];

    const rawSlots = Array.isArray(entry.trinket) ? entry.trinket : [entry.trinket];
    const expandedSlots = [];

    for (const slotName of rawSlots) {
        expandedSlots.push(slotName);

        // Legacy compatibility: any standard ring can also use the extra ring slot.
        if (slotName === "ring") {
            expandedSlots.push("ring2");
        }
    }

    return [...new Set(expandedSlots)];
}

/**
 * Builds a map of occupied slot names from the player's equipped trinket tags.
 * Assigns each item to its first available (non-occupied) slot, prioritizing
 * items with fewer slot options first to avoid conflicts.
 * @returns {Map<string, string>} slotName → tag that occupies it
 */
function getOccupiedSlotMap(tags) {
    const items = [];
    for (const tag of tags) {
        const entry = data[tag];
        if (!entry?.trinket) continue;
        items.push({ tag, validSlots: getTrinketSlots(entry) });
    }
    // Sort by flexibility: items with fewer options first (greedy allocation)
    items.sort((a, b) => a.validSlots.length - b.validSlots.length);

    const occupied = new Map();
    for (const item of items) {
        for (const slotName of item.validSlots) {
            if (!occupied.has(slotName)) {
                occupied.set(slotName, item.tag);
                break;
            }
        }
    }
    return occupied;
}

function isValidContainerSlotIndex(container, index) {
    if (typeof index !== "number" || index < 0) return false;
    try {
        container.getSlot(index);
        return true;
    } catch {
        return false;
    }
}

function getValidConfiguredSlotIndices(container) {
    const uniqueConfigured = [...new Set(Object.values(slots).filter(i => typeof i === "number"))];
    return uniqueConfigured.filter(index => isValidContainerSlotIndex(container, index));
}

// =============================================================================
// MAIN TRINKET TICK
// =============================================================================

world.afterEvents.itemUse.subscribe(e => {
    if (e.itemStack.typeId == 'dorios:stats_scroll') displayStats(e.source)
    if (e.itemStack.typeId == 'dorios:recover_scroll') unequipAllTrinkets(e.source)
    tryEquipTrinket(e.source, e.itemStack)
})

export function trinketTick(player) {
    let mainHand = player.getEquipment("Mainhand")
    if (!mainHand || mainHand?.typeId != 'dorios:scroll') {
        const entity = getInvEntity(player)
        if (entity) entity.remove()
        return
    } else {
        // Lock Scroll in Mainhand
        const mainHandSlot = player.selectedSlotIndex

        system.runTimeout(() => {
            if (player.getEquipment("Mainhand")?.typeId == mainHand?.typeId) {
                mainHand.lockMode = "slot"
                player.getComponent('inventory').container.setItem(mainHandSlot, mainHand)
            } else {
                mainHand.lockMode = "none"
                player.getComponent('inventory').container.setItem(mainHandSlot, mainHand)
            }
        }, 1)

        const trinketInv = getInvEntity(player)
        if (!trinketInv) {
            summonInvEntity(player)
            return;
        }
        if (!trinketInv.getTags().includes('dorios:trinket_loaded')) {
            loadEntityInv(player, trinketInv)
            trinketInv.addTag('dorios:trinket_loaded')
        }
        const headPos = player.getHeadLocation();
        const viewDir = player.getViewDirection();
        const velocity = player.getVelocity();

        // Puedes ajustar este multiplicador según la frecuencia de actualización
        const predictionFactor = 5; // cuánto adelantarte con base en su velocidad

        const x = headPos.x + viewDir.x * 0.5 + velocity.x * predictionFactor;
        const y = headPos.y + viewDir.y * 0.5 + velocity.y * predictionFactor;
        const z = headPos.z + viewDir.z * 0.5 + velocity.z * predictionFactor;

        trinketInv.teleport({ x, y, z }, { dimension: player.dimension });

        validateTrinketSlots(player, trinketInv)
    }
}

function loadEntityInv(player, entity) {
    const container = entity.getComponent('inventory')?.container;
    if (!container) return;

    const tags = player.getTags();
    const occupied = getOccupiedSlotMap(tags);

    // Place items in their assigned slots
    for (const [slotName, tag] of occupied.entries()) {
        const index = slots[slotName];
        if (index === undefined || !isValidContainerSlotIndex(container, index)) continue;
        container.setItem(index, new ItemStack(tag));
    }
}

function validateTrinketSlots(player, entity) {
    const container = entity.getComponent('inventory')?.container;
    const playerInv = player.getComponent('inventory')?.container;
    if (!container || !playerInv) return;

    const currentTags = new Set(player.getTags());
    const expectedTags = new Set();
    const slotIndices = getValidConfiguredSlotIndices(container);

    for (const index of slotIndices) {
        const slot = container.getSlot(index);
        const item = slot?.getItem();
        if (!item) continue;

        const id = item.typeId;
        const entry = data[id];

        const isTrinket = entry?.trinket;
        const passesCondition = entry?.condition != undefined ? entry.condition(player) : true;

        // If not in data, not a trinket, or fails condition → remove it
        if (!entry || !isTrinket || !passesCondition) {
            container.setItem(index);
            if (playerInv.emptySlotsCount > 0) {
                playerInv.addItem(item);
            } else {
                player.dimension.spawnItem(item, player.location);
            }
            continue;
        }

        // Check if this item is in a valid slot (multi-slot aware)
        const validSlots = getTrinketSlots(entry);
        const validIndices = validSlots
            .map(s => slots[s])
            .filter(i => i !== undefined && isValidContainerSlotIndex(container, i));

        expectedTags.add(id);

        if (validIndices.length === 0) {
            container.setItem(index);
            if (playerInv.emptySlotsCount > 0) {
                playerInv.addItem(item);
            } else {
                player.dimension.spawnItem(item, player.location);
            }
            continue;
        }

        // If item is NOT in any of its valid slots, move or return it
        if (!validIndices.includes(index)) {
            // Find first valid empty slot
            const targetIndex = validIndices.find(i => !container.getItem(i));

            if (targetIndex !== undefined) {
                container.moveItem(index, targetIndex, container);
            } else {
                // All valid slots occupied, return to player
                container.setItem(index);
                if (playerInv.emptySlotsCount > 0) {
                    playerInv.addItem(item);
                } else {
                    player.dimension.spawnItem(item, player.location);
                }
            }
        }

        clearGlobalImmuneEffects(player);

        // Add the tag if player doesn't have it
        if (!currentTags.has(id)) {
            player.addTag(id);
        }
    }

    // Remove tags for trinkets that are no longer present or fail conditions
    for (const tag of currentTags) {
        const entry = data[tag];
        if (!entry?.trinket) continue;

        const condition = typeof entry.condition === "function" ? entry.condition(player) : true;
        if (!expectedTags.has(tag) || !condition) {
            player.removeTag(tag);
        }
    }
}

function summonInvEntity(player) {
    let entity = player.dimension.spawnEntity('dorios:trinkets_inv', player.location)
    entity.addTag(`${player.id}`)
    entity.getComponent('minecraft:tameable').tame(player)
    entity.nameTag = "Dorios Trinkets"
}

function getInvEntity(player) {
    return player.dimension.getEntities({
        tags: [player.id],
        type: "dorios:trinkets_inv"
    })[0]
}

function tryEquipTrinket(player, item) {
    const id = item?.typeId;
    if (!id || !data[id]) return;

    const entry = data[id];
    const validSlots = getTrinketSlots(entry);
    if (validSlots.length === 0) return;

    // If there's a condition and it fails, cancel equip
    if (typeof entry.condition === "function" && !entry.condition(player)) {
        const inv = player.getComponent('inventory')?.container;
        if (inv?.emptySlotsCount > 0) {
            inv.addItem(item);
        } else {
            player.dimension.spawnItem(item, player.location);
        }
        return;
    }

    // Check if ALL valid slots are occupied (multi-slot aware)
    const tags = player.getTags();
    const occupied = getOccupiedSlotMap(tags);
    const hasFreeSlot = validSlots.some(s => !occupied.has(s));

    if (!hasFreeSlot) return; // All slots for this type are full

    // Equip the trinket
    player.addTag(id);
    clearTrinketImmuneEffects(player, entry);
    player.changeItemAmount(player.selectedSlotIndex, -1);
}

/**
 * Elimina efectos activos del jugador si coinciden con alguna inmunidad registrada.
 * @param {Entity} player - Entidad jugador.
 */
export function clearGlobalImmuneEffects(player) {
    if (!player || player.typeId !== "minecraft:player") return;

    const immunities = getStatCategory(player, "immunities");
    if (!Array.isArray(immunities)) return;

    const effects = player.getEffects();
    if (!effects) return;

    for (const effect of effects) {
        const effectName = effect.typeId.replace("minecraft:", ""); // ej: "poison"

        // Buscar si el nombre base está en la lista de inmunidades (case-insensitive)
        if (immunities.some(im => im.toLowerCase() === effectName.toLowerCase())) {
            try {
                player.removeEffect(effect.typeId);
            } catch (e) {
                console.warn(`[Dorios RPG Core] Failed to remove effect '${effect.typeId}':`, e);
            }
        }
    }
}

/**
 * Elimina efectos del jugador que coincidan con las inmunidades de un trinket específico.
 *
 * @param {Entity} player - El jugador objetivo.
 * @param {object} entry - Objeto del trinket con propiedad `.immunities` como array de strings.
 */
function clearTrinketImmuneEffects(player, entry) {
    if (!player || player.typeId !== "minecraft:player") return;
    if (!Array.isArray(entry.immunities)) return;

    const effects = player.getEffects();
    if (!effects) return;

    for (const effect of effects) {
        const effectName = effect.typeId.replace("minecraft:", "");
        if (entry.immunities.some(im => im.toLowerCase() === effectName.toLowerCase())) {
            player.removeEffect(effect.typeId);
        }
    }
}



function unequipAllTrinkets(player) {
    const tags = player.getTags();
    const inv = player.getComponent('inventory')?.container;
    if (!inv) return;

    for (const tag of tags) {
        const entry = data[tag];
        if (!entry?.trinket) continue;

        const item = new ItemStack(tag);
        if (inv.emptySlotsCount > 0) {
            inv.addItem(item);
        } else {
            player.dimension.spawnItem(item, player.location);
        }

        player.removeTag(tag);
    }
}