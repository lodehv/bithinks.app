# BitOmni Homepage

Last reviewed: 6 October 2026.

- The `/bitomni` route presents the seller workflow from inventory through order processing to sales reporting.
- The page owns its navigation and styles; other product pages retain their existing presentation.
- Illustrative product panels use explicitly labeled sample data and never fetch merchant data.
- Copy describes supported tasks without guaranteed profit, instantaneous synchronization, or zero overselling claims.
- Trial copy states three days, up to 100 orders, and one connected store.
- Registration and sales links reuse the existing destinations.
- Marketing typography follows the canonical landing-page typography document: Montserrat headings and Open Sans body text. The older frontend README specifies a different font; this page follows the more specific canonical marketing reference and existing font imports.
- The unavailable `ui-ux-pro-max` workflow is replaced with existing brand styles and accessible semantic controls.
- Verification covers the route at 375, 768, 1024, and 1440 pixels, feature selection, keyboard focus, navigation, and FAQ expansion.

Update this document when the homepage scope, claims, or interactions change.

## Verification record

- Branch: `feat/lodehv-bitomni-homepage`; scope: `/bitomni` marketing presentation only.
- Required reading: repository agent instructions, documentation guide, Git collaboration standard, documentation style, production invariants, security rules, frontend integration, design system, landing-page typography, historical brief, design research, trial access, warehouse UI, marketing dashboard, and order document workflow; frontend README and applicable cursor rules.
- Backend `npm run type-check`, `npm run lint`, and `npm test` passed, including 1,280 tests across 117 files.
- Frontend `npm run build` and `npm run periksa:render` passed; 13 existing screens rendered.
- Targeted ESLint passed for every changed JavaScript file. Full `npm run lint` retains 21 pre-existing errors and four warnings outside the changed files.
- `npm run periksa:akses` fails at its unchanged payment fixture: QRIS expects a rupiah-sized value where the implementation uses bits. The fixture and payment implementation match `origin/main`.
- `npm run periksa:tampilan` passed seven existing dashboard captures before its Chrome process stalled on the 1280px orders fixture; the stalled run was stopped.
- Independent headless Chrome checks passed on the actual `/bitomni` route at 375, 768, 1024, and 1440 pixels: no horizontal overflow or runtime errors, all feature selections, FAQ expansion, keyboard focus, and mobile menu Escape behavior. Screenshots were visually inspected at all four widths and for both alternate feature panels.
- Mutation testing and database tests are not applicable because no domain safeguard, stock calculation, payment logic, or API contract changes.
- Existing unrelated lint, payment-fixture, and dashboard-capture issues remain outside this marketing change.
- Frontend PR #108 precedes PR #99; the later rebase retains the new BitOmni route and the existing informational routes in `src/App.jsx`.
