// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://chenzhenyang.github.io',
	integrations: [
		starlight({
			title: 'My Docs',
			// social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/withastro/starlight' }],
			sidebar: [
				// {
				// 	label: 'Guides',
				// 	items: [
				// 		// Each item here is one entry in the navigation menu.
				// 		{ label: 'Example Guide', slug: 'guides/example' },
				// 	],
				// },
				{
					label: 'Agent',
					autogenerate: { directory: 'Agent' },
				},				
				{
					label: 'Exploring Generative AI',
					autogenerate: { directory: 'Exploring Generative AI' },
				},
				{
					label: 'Agentic Engineering Patterns',
					autogenerate: { directory: 'Agentic Engineering Patterns' },
				},
				{
					label: 'Agent Harness',
					autogenerate: { directory: 'Agent Harness' },
				},
				{
					label: 'Claude Code',
					autogenerate: { directory: 'Claude Code' },
				},
				{
					label: 'Oh My ClaudeCode',
					autogenerate: { directory: 'Oh My ClaudeCode' },
				},
				{
					label: 'Spec-Driven Development',
					autogenerate: { directory: 'Spec-Driven Development' },
				},
				{
					label: 'OpenClaw',
					autogenerate: { directory: 'OpenClaw' },
				},	
				{
					label: 'Hermes Agent',
					autogenerate: { directory: 'Hermes Agent' },
				},	
				{
					label: 'best practices',
					autogenerate: { directory: 'best practices' },
				},					
				{
					label: 'Mix',
					autogenerate: { directory: 'Mix' },
				},					
			],
		}),
	],
});
