/**
* DORIOS RPG CORE - GUIA DE REGISTRO DE ATRIBUTOS
* -----------------------------------------------
* Dorios RPG Core é um sistema modular de atributos criado pelo Dorios Studios.
* Ele permite que criadores definam estatísticas estilo RPG, efeitos e trinkets
* usando tags, itens e blocos no Minecraft Bedrock Edition.
*
* O sistema inclui:
* - Um motor de atributos unificado
* - Atualizações automáticas nos atributos dos jogadores
* - Suporte nativo a trinkets (acessórios)
* - Um sistema opcional de mana com barra funcional e visível
* - Compatibilidade total entre addons que utilizem o mesmo formato
*
* Ideal para sistemas de classes, magias, equipamentos avançados e mecânicas de RPG.
*/

/**
 * === FONTES SUPORTADAS ===
 * Você pode atribuir atributos a:
 * 
 * - Itens vanilla (ex: "minecraft:iron_sword")
 * - Itens ou armaduras personalizados (ex: "meuaddon:espada_de_fogo")
 * - Blocos (ex: "minecraft:diamond_block")
 * - Tags (ex: "Guerreiro", "Mago", "EspiritodeFogo")
 *
 * Todos são definidos com sua ID de item ou nome de tag como chave.
 */

/**
 * === ATUALIZAÇÃO AUTOMÁTICA ===
 * O sistema aplica ou remove os efeitos automaticamente quando:
 * - O jogador equipa ou desequipa armaduras
 * - O item na mão principal muda
 * - Um trinket é equipado ou removido
 * - Uma tag é adicionada ou removida
 *
 * Você também pode forçar uma atualização manual executando:
 */

player.runCommand(`scriptevent dorios:update_stats`)

/**
 * === TRINKETS (ACESSÓRIOS) ===
 * Qualquer item ou bloco (vanilla, custom, armadura, etc.) pode ser marcado como trinket com:
 *
 *   trinket: "slot"
 *
 * Slots disponíveis:
 *   "head", "body", "feet", "necklace", "ring", "charm",
 *   "talisman", "gauntlet", "heartycharm", "doll",
 *   "witherring", "archaiccharm", "amulet"
 */

/**
 * === ESTRUTURA DE ATRIBUTOS (STATS) ===
 * Todos os atributos devem ser definidos dentro do objeto `stats`.
 * Você pode misturar atributos vanilla e personalizados no mesmo lugar.
 *
 * Atributos vanilla usam valores em porcentagem com escala fixa:
 * 
 *   health: escala 2        (2, 4, 6, ...)
 *   attack: escala 1        (1, 2, 3, ...)
 *   knockbackRes: escala 1  (1, 2, ..., 100)
 *   damageReduction: escala 1  (-100 a 100)
 *   speed, waterSpeed, lavaSpeed: escala 5  (5, 10, 15, ..., 500)
 *
 * Atributos personalizados **não possuem escala fixa**. Use qualquer número inteiro.
 *
 * 🔻 É permitido usar valores negativos para reduzir atributos do jogador.
 * Útil para penalidades, maldições ou equilíbrio de gameplay.
 *
 * Atributos disponíveis:
 *   - health, attack, knockbackRes, damageReduction
 *   - speed, waterSpeed, lavaSpeed
 *   - mana, extraJumps, healthRegen, manaRegen
 *   - attackMulti, lifeSteal, manaSteal, thorns
 *   - critMulti, critChance, knockback, fireAspect
 */

/**
 * === EXEMPLOS ===
 */

const newData = {
  // Exemplo: trinket com item personalizado
  "meuaddon:nucleo_lendario": {
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

  // Exemplo: tag de classe
  "Guerreiro": {
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

  // Exemplo: espada vanilla
  "minecraft:diamond_sword": {
    stats: {
      attackMulti: 20,
      critChance: 5,
      knockback: 1
    }
  },

  // Exemplo: arma personalizada com penalidade
  "meuaddon:espada_de_chamas": {
    stats: {
      attackMulti: 30,
      fireAspect: 1,
      manaSteal: 10,
      speed: -10,   // Penalidade de velocidade
      health: -4    // Redução de vida máxima
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
 * === REGISTRO DOS DADOS ===
 * Registre os dados durante o carregamento do mundo com:
 */
world.afterEvents.worldLoad.subscribe(() => {
  console.warn('[Dorios RPG Core] Registro enviado');
  system.sendScriptEvent("dorios:register_stat_data", JSON.stringify({ newData }));
});

/**
 * === RESUMO ===
 * - Use o objeto "stats" para definir todos os atributos.
 * - Você pode adicionar efeitos passivos, ativos e imunidades.
 * - Atribua stats a itens, blocos ou tags.
 * - Marque itens como trinket com: trinket: "slot"
 * - Aceita valores negativos.
 * - Tudo é atualizado automaticamente.
 * - Use: player.runCommand("scriptevent dorios:update_stats") para forçar atualização.
 * - Inclui sistema de mana visual e funcional.
 *
 * Desenvolvido por Dorios Studios para facilitar a criação
 * de addons compatíveis, equilibrados e expansíveis.
 */
