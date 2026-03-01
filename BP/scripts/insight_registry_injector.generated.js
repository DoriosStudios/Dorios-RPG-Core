import { system } from "@minecraft/server";

const REGISTRATION_MARKER = "__insightNamespaceRegistry_dorios_rpg_core";
const REGISTRATION_RETRY_TICKS = 20;
const MAX_REGISTRATION_ATTEMPTS = 180;

const ADDON_CONTENT = Object.freeze({
  "key": "dorios_rpg_core",
  "name": "Dorios RPG Core",
  "type": "core",
  "namespace": "dorios",
  "content": [
    "dorios:recover_scroll",
    "dorios:scroll",
    "dorios:stats_scroll",
    "dorios:trinkets_inv"
  ]
});

function tryRegisterAddonContent() {
    if (globalThis[REGISTRATION_MARKER]) {
        return true;
    }

    const api = globalThis.InsightNamespaceRegistry;
    if (!api || typeof api.registerAddonContent !== "function") {
        return false;
    }

    api.registerAddonContent(ADDON_CONTENT, false);
    globalThis[REGISTRATION_MARKER] = true;
    return true;
}

function registerAddonContentWithRetry(attempt = 0) {
    if (tryRegisterAddonContent() || attempt >= MAX_REGISTRATION_ATTEMPTS) {
        return;
    }

    system.runTimeout(() => {
        registerAddonContentWithRetry(attempt + 1);
    }, REGISTRATION_RETRY_TICKS);
}

registerAddonContentWithRetry();
