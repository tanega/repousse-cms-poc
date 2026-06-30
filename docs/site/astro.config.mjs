// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'Repousse — Specs',
			description: 'Cahier de spécifications fonctionnelles de la plateforme numérique Repousse',
			defaultLocale: 'fr',
			locales: {
				root: { label: 'Français', lang: 'fr' },
			},
			sidebar: [
				{
					label: 'Vue d\'ensemble',
					items: [
						{ label: 'Roadmap', slug: 'roadmap' },
					],
				},
				{
					label: 'Épics',
					items: [
						{ label: 'EP-01 — Distributions', slug: 'roadmap/ep-01-distributions' },
						{ label: 'EP-02 — Authentification & accès', slug: 'roadmap/ep-02-authentification' },
						{ label: 'EP-03 — Profils utilisateurs', slug: 'roadmap/ep-03-profils-utilisateurs' },
						{ label: 'EP-04 — Projets de plantation', slug: 'roadmap/ep-04-projets-plantation' },
						{ label: 'EP-05 — Taxons végétaux', slug: 'roadmap/ep-05-gestion-taxons' },
						{ label: 'EP-06 — Tableau de bord', slug: 'roadmap/ep-06-tableau-de-bord' },
					],
				},
			],
		}),
	],
});
