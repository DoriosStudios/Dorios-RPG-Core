import { system, world, ItemStack } from '@minecraft/server'

/**
 * Utility functions related to entities for Dorios API.
 */
export const entities = {
    /**
     * Adds an item to the entity's inventory or drops it at the entity's location if the inventory is full.
     *
     * @param {Entity} entity The target entity to receive the item.
     * @param {ItemStack|string} item The item to add. Can be an ItemStack or an item identifier string.
     * @param {number} [amount=1] Amount of the item if a string is provided. Ignored if item is an ItemStack.
     */
    addItem(entity, item, amount = 1) {
        if (!entity?.getComponent || !entity.getComponent('inventory')) return;

        const inventory = entity.getComponent('inventory');
        const invContainer = inventory.container;

        const itemStack = typeof item === 'string'
            ? new ItemStack(item, amount)
            : item;

        const added = invContainer.addItem(itemStack);

        if (!added) {
            const loc = entity.location;
            entity.dimension.spawnItem(itemStack, loc);
        }
    },

    /**
     * Changes the amount of items in a specific inventory slot of an entity.
     *
     * - Positive `amount` adds items.
     * - Negative `amount` removes items.
     * - Fails if the slot is empty, exceeds the stack limit, or goes below zero.
     *
     * @param {Entity} entity The entity with an inventory.
     * @param {number} slot The inventory slot index to modify.
     * @param {number} amount The amount to add (positive) or remove (negative).
     * @returns {boolean} Whether the operation was successful.
     */
    changeItemAmount(entity, slot, amount) {
        const inventory = entity.getComponent('inventory');
        if (!inventory) return false;

        const inv = inventory.container;
        const item = inv.getItem(slot);
        if (!item) return false;

        const newAmount = item.amount + amount;

        if (newAmount > item.maxAmount || newAmount < 0) return false;

        if (newAmount === 0) {
            inv.setItem(slot, undefined); // Clears slot
        } else {
            item.amount = newAmount;
            inv.setItem(slot, item);
        }

        return true;
    },

    /**
     * Sets an item in a specific inventory slot of an entity.
     *
     * - Accepts either an ItemStack or a string with amount.
     * - Overwrites any existing item in the slot.
     *
     * @param {Entity} entity The entity with an inventory.
     * @param {number} slot The inventory slot index to set.
     * @param {ItemStack|string} item The item to place (ItemStack or item ID string).
     * @param {number} [amount=1] Amount if item is a string. Ignored for ItemStack.
     * @returns {boolean} Whether the operation was successful.
     */
    setItem(entity, slot, item, amount = 1) {
        const inventory = entity.getComponent('inventory');
        if (!inventory) return false;

        const inv = inventory.container;

        const itemStack = typeof item === 'string'
            ? new ItemStack(item, amount)
            : item;

        try {
            inv.setItem(slot, itemStack);
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Returns all items in the entity's inventory container as an array.
     * 
     * - Skips empty slots.
     * - Returns an empty array if the entity has no inventory.
     *
     * @param {Entity} entity The entity to get inventory items from.
     * @returns {ItemStack[]} Array of items present in the inventory.
     */
    getItems(entity) {
        const inventory = entity.getComponent('inventory');
        if (!inventory) return [];

        const container = inventory.container;
        const items = [];

        for (let i = 0; i < container.size; i++) {
            const item = container.getItem(i);
            if (item) items.push(item);
        }

        return items;
    },

    /**
     * Searches for an item in the entity's inventory.
     * 
     * - If a string is provided, searches by item identifier.
     * - If an ItemStack is provided, uses container.find to locate it.
     * 
     * @param {Entity} entity The entity to search in.
     * @param {string|ItemStack} item Item identifier or ItemStack to search for.
     * @returns {{ slot: number, item: ItemStack }|undefined} Found item with slot, or undefined.
     */
    findItem(entity, item) {
        const inventory = entity.getComponent('inventory');
        if (!inventory) return;

        const container = inventory.container;

        if (typeof item === 'string') {
            for (let i = 0; i < container.size; i++) {
                const slotItem = container.getItem(i);
                if (slotItem?.typeId === item) {
                    return { slot: i, item: slotItem };
                }
            }
        } else {
            try {
                const slot = container.find(item);
                if (slot !== -1) {
                    const found = container.getItem(slot);
                    return { slot, item: found };
                }
            } catch {
                return;
            }
        }

        return;
    },

    /**
     * Drops all items from the entity's inventory at its current location,
     * excluding any item with a typeId present in the optional exclude list.
     * 
     * @param {Entity} entity The entity whose inventory items will be dropped.
     * @param {string[]} [excludeIds=[]] Optional array of item identifiers to exclude.
     */
    dropAllItems(entity, excludeIds = []) {
        const inventory = entity.getComponent('inventory');
        if (!inventory) return;

        const container = inventory.container;
        const location = entity.location;
        const dimension = entity.dimension;

        for (let i = 0; i < container.size; i++) {
            const item = container.getItem(i);
            if (item && !excludeIds.includes(item.typeId)) {
                dimension.spawnItem(item, location);
                container.setItem(i, undefined);
            }
        }
    },

    /**
     * Gets the item in the specified inventory slot of an entity.
     * 
     * @param {Entity} entity The entity whose inventory to access.
     * @param {number} slot The inventory slot index to read.
     * @returns {ItemStack|undefined} The item in the slot, or undefined if empty or invalid.
     */
    getItem(entity, slot) {
        const inventory = entity.getComponent('inventory');
        if (!inventory) return;

        return inventory.container.getItem(slot);
    },

    /**
     * Checks if the entity has a specific item in its inventory.
     * 
     * @param {Entity} entity The entity to check.
     * @param {string} id The item identifier to look for.
     * @param {number} [amount=1] Minimum amount required.
     * @returns {boolean} Whether the item exists in sufficient quantity.
     */
    hasItem(entity, id, amount = 1) {
        const inventory = entity.getComponent('inventory');
        if (!inventory) return false;

        const container = inventory.container;
        let total = 0;

        for (let i = 0; i < container.size; i++) {
            const item = container.getItem(i);
            if (item?.typeId === id) total += item.amount;
            if (total >= amount) return true;
        }

        return false;
    },

    /**
     * Clears the entity's inventory, optionally skipping certain item IDs.
     * 
     * @param {Entity} entity - The entity whose inventory will be cleared.
     * @param {string[]} [excludeIds=[]] - Item IDs to keep.
     */
    clearInventory(entity, excludeIds = []) {
        const inventory = entity.getComponent('inventory');
        if (!inventory) return;

        const container = inventory.container;

        for (let i = 0; i < container.size; i++) {
            const item = container.getItem(i);
            if (item && !excludeIds.includes(item.typeId)) {
                container.setItem(i, undefined);
            }
        }
    },

    /**
     * Removes a specific amount of items from the entity's inventory.
     * 
     * @param {Entity} entity - The entity to remove items from.
     * @param {string} id - The item identifier to remove.
     * @param {number} [amount=1] - The quantity to remove.
     * @returns {boolean} Whether the removal was successful.
     */
    removeItem(entity, id, amount = 1) {
        const inventory = entity.getComponent('inventory');
        if (!inventory) return false;

        const container = inventory.container;
        let remaining = amount;

        for (let i = 0; i < container.size; i++) {
            const item = container.getItem(i);
            if (!item || item.typeId !== id) continue;

            if (item.amount > remaining) {
                item.amount -= remaining;
                container.setItem(i, item);
                return true;
            } else {
                remaining -= item.amount;
                container.setItem(i, undefined);
                if (remaining === 0) return true;
            }
        }

        return false;
    },

    /**
     * Counts the total number of items with a specific identifier in the entity's inventory.
     * 
     * @param {Entity} entity The entity to search in.
     * @param {string} id The item identifier to count.
     * @returns {number} Total amount found in the inventory.
     */
    countItem(entity, id) {
        const inventory = entity.getComponent('inventory');
        if (!inventory) return 0;

        const container = inventory.container;
        let total = 0;

        for (let i = 0; i < container.size; i++) {
            const item = container.getItem(i);
            if (item?.typeId === id) total += item.amount;
        }

        return total;
    },

    /**
     * Returns the current health of the entity.
     * 
     * @param {Entity} entity The entity to get health from.
     * @returns {number|undefined} The current health, or undefined if not available.
     */
    getHealth(entity) {
        const health = entity.getComponent('health');
        return health?.current;
    },

    /**
     * Sets the current health of the entity.
     * 
     * @param {Entity} entity The entity to modify.
     * @param {number} value The health value to set.
     * @returns {boolean} Whether the operation was successful.
     */
    setHealth(entity, value) {
        const health = entity.getComponent('health');
        if (!health) return false;

        health.setCurrent(value);
        return true;
    },

    /**
     * Adds or subtracts health from the entity.
     * 
     * @param {Entity} entity The entity to modify.
     * @param {number} delta Positive to heal, negative to damage.
     * @returns {boolean} Whether the operation was successful.
     */
    changeHealth(entity, delta) {
        const health = entity.getComponent('health');
        if (!health) return false;

        const newHealth = Math.max(0, Math.min(health.currentValue + delta, health.effectiveMax));
        health.setCurrentValue(newHealth);
        return true;
    },

    /**
     * Returns detailed health information of the entity.
     * 
     * @param {Entity} entity The entity to inspect.
     * @returns {{
     *   current: number,
     *   max: number,
     *   missing: number,
     *   percentage: number
     * }|undefined} Health data or undefined if not available.
     */
    getHealthInfo(entity) {
        const health = entity.getComponent('health');
        if (!health) return;

        const current = health.current;
        const max = health.max;
        const missing = max - current;
        const percentage = Math.floor((current / max) * 10000) / 100;

        return { current, max, missing, percentage };
    },

    /**
     * Returns equipped items from a specific slot or all equipment if no slot is given.
     * 
     * Works with any entity that has the "equippable" component.
     * 
     * @param {Entity} entity The entity to inspect.
     * @param {string} [slot] Optional slot to retrieve ("Mainhand", "Offhand", "Head", "Chest", "Legs", "Feet").
     * @returns {ItemStack|object|undefined} The item in the slot, or an object with all equipment.
     */
    getEquipment(entity, slot) {
        if (!entity?.getComponent) return;

        const equip = entity.getComponent('equippable');
        if (!equip) return;

        const validSlots = ['Mainhand', 'Offhand', 'Head', 'Chest', 'Legs', 'Feet'];

        if (slot) {
            if (!validSlots.includes(slot)) return;
            return equip.getEquipment(slot) ?? undefined;
        }

        const result = {};
        for (const s of validSlots) {
            result[s] = equip.getEquipment(s) ?? undefined;
        }
        return result;
    },

    /**
     * Sets an item in a specific equipment slot of an entity.
     * 
     * @param {Entity} entity The entity to equip.
     * @param {string} slot Slot name to set ("Mainhand", "Offhand", "Head", "Chest", "Legs", "Feet").
     * @param {ItemStack} item The item to equip.
     * @returns {boolean} Whether the operation was successful.
     */
    setEquipment(entity, slot, item) {
        if (!entity?.getComponent || !item) return false;

        const equip = entity.getComponent('equippable');
        if (!equip) return false;

        const validSlots = ['Mainhand', 'Offhand', 'Head', 'Chest', 'Legs', 'Feet'];
        if (!validSlots.includes(slot)) return false;

        try {
            equip.setEquipment(slot, item);
            return true;
        } catch {
            return false;
        }
    }
};

export const blocks = {}

export const register = {}

export const math = {}

export const utils = {

    /**
     * Prints a formatted JSON object to the player's chat.
     *
     * @param {Entity} player The player to send the message to.
     * @param {string} title A title to show before the JSON.
     * @param {Object} obj The object to stringify and print.
     */
    printJSON(player, title, obj) {
        const formatted = JSON.stringify(obj, null, 2).split("\n");
        player.sendMessage(`§6${title}:`);
        for (const line of formatted) {
            player.sendMessage(`§7${line}`);
        }
    }
}

