import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Association Repousse",
  version: packageJson.version,
  copyright: `© ${currentYear}, Association Repousse.`,
  meta: {
    title: "Association Repousse - Pépinière participative à Nantes.",
    description:
      "Commun numérique pour une pépinière participative qui oeuvre dans la vraie vie en région nantaise",
  },
  defaultPath: "/dashboard/vie-associative",
};
