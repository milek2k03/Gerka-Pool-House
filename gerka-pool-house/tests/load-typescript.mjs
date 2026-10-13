import { existsSync, readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

// Load the application's TypeScript directly without generated test artifacts.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && context.parentURL) {
      const url = new URL(specifier, context.parentURL)
      if (url.pathname.endsWith('.js') && existsSync(fileURLToPath(url).slice(0, -3) + '.ts')) return nextResolve(url.href.slice(0, -3) + '.ts', context)
      if (!existsSync(fileURLToPath(url))) {
        for (const extension of ['.ts', '.tsx']) {
          if (existsSync(fileURLToPath(url) + extension)) return nextResolve(url.href + extension, context)
        }
      }
    }
    return nextResolve(specifier, context)
  },
  load(url, context, nextLoad) {
    if (/\.(webp|avif|png)$/.test(url)) {
      return { format: 'module', shortCircuit: true, source: `export default ${JSON.stringify(url)}` }
    }
    if (/\.tsx?$/.test(url)) {
      const source = readFileSync(fileURLToPath(url), 'utf8').replaceAll('import.meta.env', '({})')
      return { format: 'module', shortCircuit: true, source: ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
      }).outputText }
    }
    return nextLoad(url, context)
  },
})

