/**
* DORIOS RPG CORE - GUÍA DE REGISTRO DE STATS
* -------------------------------------------
* Dorios RPG Core es un sistema modular de estadísticas diseñado por Dorios Studios.
* Permite a los creadores definir estadísticas estilo RPG, efectos y trinkets
* utilizando etiquetas (tags), ítems y bloques dentro de Minecraft Bedrock Edition.
*
* El sistema incluye:
* - Un motor de estadísticas unificado
* - Actualización automática de estadísticas del jugador
* - Soporte nativo para trinkets
* - Un sistema opcional de maná con barra visual integrada
* - Compatibilidad total entre addons que usen este formato
*
* Ideal para clases, objetos mágicos, ítems mejorados y mecánicas de RPG.
*/

/**
 * === FUENTES SOPORTADAS ===
 * Puedes asignar estadísticas a:
 * 
 * - Ítems vanilla (ej. "minecraft:iron_sword")
 * - Ítems o armaduras custom (ej. "miaddon:fire_blade")
 * - Bloques (ej. "minecraft:diamond_block")
 * - Tags (ej. "Guerrero", "Mago", "BlazingSoul")
 *
 * Todos se definen usando su identificador (ID) o nombre del tag como clave.
 */

/**
 * === ACTUALIZACIÓN AUTOMÁTICA ===
 * El sistema aplica o elimina estadísticas automáticamente cuando:
 * - El jugador equipa o desequipa armaduras
 * - Cambia el ítem en la mano principal
 * - Equipa o retira un trinket
 * - Se le añade o remueve un tag
 *
 * También puedes forzar una actualización manual ejecutando:
 */

player.runCommand(`scriptevent dorios:update_stats`)


/**
 * === TRINKETS ===
 * Cualquier ítem o bloque (vanilla o personalizado) puede ser un trinket.
 * Solo debes agregar la propiedad:
 *
 *   trinket: "slot"
 *
 * Slots disponibles:
 *   "head", "body", "feet", "necklace", "ring", "charm",
 *   "talisman", "gauntlet", "heartycharm", "doll",
 *   "witherring", "archaiccharm", "amulet"
 */

/**
 * === ESTRUCTURA DE STATS ===
 * Todas las estadísticas se definen dentro del objeto `stats`.
 * Aquí se combinan tanto stats vanilla como personalizadas (custom).
 *
 * Las stats vanilla usan valores en porcentaje y obedecen escalas:
 * 
 *   health: escala 2        (2, 4, 6, ...)
 *   attack: escala 1        (1, 2, 3, ...)
 *   knockbackRes: escala 1  (1, 2, ..., 100)
 *   damageReduction: escala 1  (-100 a 100)
 *   speed, waterSpeed, lavaSpeed: escala 5  (5, 10, 15, ..., 500)
 *
 * Las stats personalizadas **NO** tienen escala fija. Puedes usar cualquier número entero.
 *
 * ✅ Puedes usar valores negativos en cualquier stat para reducir atributos del jugador.
 * Esto permite efectos como penalizaciones, maldiciones o balances de poder.
 *
 * Stats disponibles:
 *   - health, attack, knockbackRes, damageReduction
 *   - speed, waterSpeed, lavaSpeed
 *   - mana, extraJumps, healthRegen, manaRegen
 *   - attackMulti, lifeSteal, manaSteal, thorns
 *   - critMulti, critChance, knockback, fireAspect
 */

/**
 * === EJEMPLOS ===
 */

const newData = {
    // Ejemplo: trinket con ítem personalizado
    "miaddon:nucleo_legendario": {
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

    // Ejemplo: tag de clase
    "Guerrero": {
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

    // Ejemplo: espada vanilla
    "minecraft:diamond_sword": {
        stats: {
            attackMulti: 20,
            critChance: 5,
            knockback: 1
        }
    },

    // Ejemplo: arma custom con penalización
    "miaddon:espada_llameante": {
        stats: {
            attackMulti: 30,
            fireAspect: 1,
            manaSteal: 10,
            speed: -10,   // Penalización de velocidad
            health: -4    // Reducción de vida máxima
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
 * === REGISTRO DE DATOS ===
 * Registra tu configuración durante worldLoad así:
 */
world.afterEvents.worldLoad.subscribe(() => {
    console.warn('[Dorios RPG Core] Registro enviado');
    system.sendScriptEvent("dorios:register_stat_data", JSON.stringify({ newData }));
});

/**
 * === RESUMEN ===
 * - Usa el objeto "stats" para definir estadísticas.
 * - Puedes aplicar efectos pasivos, activos e inmunidades.
 * - Asigna estadísticas a ítems, bloques o tags.
 * - Marca ítems como trinket con: trinket: "slot"
 * - Soporta valores negativos en las estadísticas.
 * - Todo se actualiza automáticamente en el jugador.
 * - Puedes usar: player.runCommand("scriptevent dorios:update_stats") para forzar actualización.
 * - El sistema incluye una barra de maná funcional y visual.
 *
 * Creado por Dorios Studios para que los desarrolladores puedan
 * construir addons compatibles, balanceados y potentes con menos esfuerzo.
 */
