---
name: frontend-ui-review
description: Review Bithinks React interfaces for accessibility, responsive layout, visual consistency, interaction quality, and user-perceived performance. Use for UI/UX audits, design reviews, visual regressions, or interface polish.
---

# Frontend UI Review

## Workflow

1. Determine the affected routes, target users, primary tasks, and expected device sizes. Read the page, its components, CSS, design tokens, and existing visual-check scripts before judging it.
2. Render the actual interface and review each affected route at 375, 768, 1024, and 1440 pixels. Include loading, empty, error, validation, disabled, hover, focus, and open-overlay states where applicable.
3. Review in this priority order:
   - accessibility: semantics, labels, alternative text, keyboard flow, focus, contrast, and reduced motion;
   - interaction: clear affordances, 44 × 44 targets, nearby feedback, and safe async actions;
   - layout: hierarchy, spacing, readable type, fixed-element clearance, and no horizontal overflow;
   - consistency: existing tokens, icon family, component patterns, copy, and responsive behavior;
   - performance: stable content dimensions, appropriate assets, and smooth transform/opacity animation.
4. When asked only for a review, report concrete findings with route, element, impact, and recommended correction. When asked to fix or improve, implement the smallest coherent correction and preserve existing behavior.
5. Run `npm run periksa:render`, `npm run periksa:tampilan`, and `npm run periksa:akses`; inspect their artifacts. Run `npm run lint` and `npm run build` after any code change.

## Completion criteria

- Every affected route and state has been inspected at the required widths.
- Findings distinguish observable defects from subjective preferences.
- Critical accessibility and interaction failures appear before cosmetic issues.
- Any implementation includes before-and-after evidence and no new lint or build regression.
