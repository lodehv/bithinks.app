---
name: frontend-implementation
description: Build or modify React pages, components, client state, API interactions, and responsive behavior in the Bithinks Vite frontend. Use for frontend features, UI fixes, route changes, or React performance work.
---

# Frontend Implementation

## Workflow

1. Read the applicable files in `.cursor/rules/`, then trace the requested route from `src/App.jsx` to its page, components, styles, context, and API utilities. The trace is complete when every entry point and backend dependency affected by the change is identified.
2. Define observable acceptance criteria for behavior, responsive layouts, loading, empty, error, and accessibility states. Preserve existing contracts unless the request includes a coordinated migration.
3. Choose the shallowest maintainable boundary:
   - pages orchestrate route-level behavior;
   - focused components render coherent UI responsibilities;
   - hooks coordinate reusable stateful behavior;
   - API and utility modules own transport and pure transformations.
4. Implement with pure render logic and local state by default. Derive values during render, use Effects only for external synchronization, and clean up every subscription, listener, timer, or request lifecycle.
5. Use semantic HTML, existing design tokens, responsive CSS, visible focus, meaningful labels, and reduced-motion handling. Preserve intentionally localized product copy.
6. Profile before adding `memo`, `useMemo`, or `useCallback`. Lazy-load non-initial routes or measured heavy UI when it improves the initial experience.
7. Verify with `npm run lint` and `npm run build`. For visible changes also run `npm run periksa:render`, `npm run periksa:tampilan`, and `npm run periksa:akses`, then inspect affected routes at 375, 768, 1024, and 1440 pixels.

## Completion criteria

- The active render path reaches the implementation.
- Changed files add no lint failures, leaked secrets, or unintended contract changes.
- Every acceptance state has direct behavioral or visual evidence.
- The final handoff names residual risks or existing failures precisely.
