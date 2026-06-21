import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export default defineConfig({
	// Keep Vite's optimizer cache off OneDrive: its rename-into-place step
	// hits EACCES when OneDrive holds a lock on node_modules/.vite.
	cacheDir: join(tmpdir(), 'vite-mtg-collector'),
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'jsdom',
		setupFiles: ['src/tests/setup.ts'],
		globals: true
	}
});
