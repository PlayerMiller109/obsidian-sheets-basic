import esbuild from 'esbuild';
import process from 'process';
import builtins from 'builtin-modules'

const banner = '/* Esbuild-built. Source on GitHub. */';

const prod = (process.argv[2] === 'production');

const context = await esbuild.context({
  entryPoints: ['main_tobuild.js'],
  outfile: 'main1.js',
  bundle: true,
  minify: true,
  treeShaking: true,
  sourcemap: prod ? false : 'inline',
  format: 'cjs',
  target: 'esnext',
  external: [
    'obsidian',
    'electron',
    '@codemirror/autocomplete',
    '@codemirror/collab',
    '@codemirror/commands',
    '@codemirror/language',
    '@codemirror/lint',
    '@codemirror/search',
    '@codemirror/state',
    '@codemirror/view',
    '@lezer/common',
    '@lezer/highlight',
    '@lezer/lr',
    ...builtins,
  ],
  banner: {
    js: banner,
  },
});

if (prod) {
  await context.rebuild();
  process.exit(0);
} else {
  await context.watch();
}