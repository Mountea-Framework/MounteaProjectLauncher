# Static analysis

The Codacy report for dev commit `11a0871` contained 522 ESLint findings across 20 rules. Every reported rule remains enforced by `npm run lint`; the JavaScript unused-variable rule is replaced with its TypeScript-aware equivalent so interface parameter names are not treated as unused runtime variables.

## Report coverage

| Reported rule | Findings | Enforced rule |
| --- | ---: | --- |
| `@typescript-eslint/no-unsafe-argument` | 27 | `@typescript-eslint/no-unsafe-argument` |
| `@typescript-eslint/no-unsafe-member-access` | 129 | `@typescript-eslint/no-unsafe-member-access` |
| `no-unused-vars` | 16 | `@typescript-eslint/no-unused-vars` |
| `@typescript-eslint/no-unsafe-assignment` | 129 | `@typescript-eslint/no-unsafe-assignment` |
| `security/detect-non-literal-fs-filename` | 22 | `security/detect-non-literal-fs-filename` |
| `@typescript-eslint/no-confusing-void-expression` | 20 | `@typescript-eslint/no-confusing-void-expression` |
| `@typescript-eslint/no-unsafe-call` | 127 | `@typescript-eslint/no-unsafe-call` |
| `@typescript-eslint/no-floating-promises` | 12 | `@typescript-eslint/no-floating-promises` |
| `@typescript-eslint/no-unsafe-return` | 16 | `@typescript-eslint/no-unsafe-return` |
| `security/detect-object-injection` | 8 | `security/detect-object-injection` |
| `@typescript-eslint/no-unnecessary-type-assertion` | 2 | `@typescript-eslint/no-unnecessary-type-assertion` |
| `@typescript-eslint/prefer-nullish-coalescing` | 1 | `@typescript-eslint/prefer-nullish-coalescing` |
| `@typescript-eslint/no-non-null-assertion` | 3 | `@typescript-eslint/no-non-null-assertion` |
| `@typescript-eslint/no-unnecessary-condition` | 1 | `@typescript-eslint/no-unnecessary-condition` |
| `@typescript-eslint/no-explicit-any` | 2 | `@typescript-eslint/no-explicit-any` |
| `react-hooks/exhaustive-deps` | 1 | `react-hooks/exhaustive-deps` |
| `@typescript-eslint/use-unknown-in-catch-callback-variable` | 2 | `@typescript-eslint/use-unknown-in-catch-callback-variable` |
| `xss/no-mixed-html` | 1 | `xss/no-mixed-html` |
| `@typescript-eslint/no-redundant-type-constituents` | 2 | `@typescript-eslint/no-redundant-type-constituents` |
| `@typescript-eslint/consistent-type-definitions` | 1 | `@typescript-eslint/consistent-type-definitions` |

## Analyzer environments

Codacy's hosted ESLint engine does not install the project's Node, React, Radix, or Electron dependencies. Of the 428 unsafe-type findings, 380 explicitly referred to unresolved error types. The remaining reports included propagated any types and unchecked JSON; they were reviewed and the real unsafe inputs were fixed.

`.eslintrc.json` runs syntax, hooks, explicit-any, TypeScript unused-variable, and security checks without needing project type declarations. `eslint.typed.cjs` extends it with every reported type-aware rule, plus the TypeScript recommended type-checked rules. The Launcher quality workflow installs the locked dependencies before running both passes. Typed lint is deliberately not disabled when local or CI checks encounter missing dependencies: the command fails until dependencies are installed.

Filesystem access is intrinsic to reading user-selected Unreal projects and engines. Each filesystem exception is restricted to its access site and explains its trust boundary; writes remain limited to the Electron userData settings store. The build entrypoint HTML rewrite has a local exception because it edits Vite-generated markup using a fixed replacement. No security rule is disabled across a source directory.

## Validation

- Full type-aware lint: no warnings or errors.
- Syntax lint: no warnings or errors, also checked on a source copy without project node_modules.
- Core tests: 15 pass, including malformed disk/IPC data, omitted patch fields, invalid engine versions, and prototype-safe template names.
- Production TypeScript/Vite build and syntax checks for both Electron bundles pass.
- Built Electron app renders project cards and the drawer; map options open, no Close button is present, and drawer scrollbars remain hidden.
- Browser fixture verifies map selection, debounced saves, command preview, engine preselection, and visible errors for rejected clipboard, launch, details, settings, and scan operations, with no unhandled page errors.

The reported complexity of 336 is a whole-change metric for the Python-to-Electron migration, not 336 additional lint findings. Codacy reported its complexity gate as passing. The hosted report still refers to the prior pushed commit until these local fixes are pushed and reanalyzed.
