import { all } from "@teamhanko/hanko-elements/i18n/all";
import { fr } from "@teamhanko/hanko-elements/i18n/fr";

export const HANKO_LANG = "fr";

fr.headlines.loginEmail = "Connexion à votre espace Repousse";
fr.headlines.loginEmailNoSignup = "Connexion à votre espace Repousse";
all.fr = fr;

// register() replaces its whole bundled translation set with whatever is passed
// here, so the full `all` map is spread through to keep every other language
// (e.g. "en") available instead of triggering a network fetch that 404s.
export const hankoTranslations = all;
