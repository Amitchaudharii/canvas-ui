# Topology Canvas Testing Architecture

This directory contains the enterprise-grade testing suite for the Topology Canvas rendering engine.

## Architecture

The testing suite is divided into two tiers:

### Tier 1: Unit & Integration (Vitest)
Located in `tests/unit/`.
These tests validate the framework-agnostic layers of the engine (registry, layout math, config factory, viewport math) in isolation. They run in a Node.js environment using a mock Canvas API provided by `tests/setup/vitest.setup.js`.
These tests are extremely fast and ideal for TDD when making changes to pure logic.

### Tier 2: E2E & Visual Regression (Playwright)
Located in `tests/e2e/` and `tests/visual/`.
These tests run in a real browser against the compiled Next.js application. They validate:
- Actual canvas rendering
- Complex user interactions (drag, zoom, pinch, selection flows)
- Performance benchmarks (`@perf`)
- Visual regressions (`@visual`)

## Running Tests

```bash
# Run everything (Unit + E2E)
npm test

# Run only unit tests
npm run test:unit

# Generate coverage report (outputs to /coverage)
npm run test:coverage

# Run E2E tests (headless)
npm run test:e2e

# Run performance benchmarks only
npm run test:perf

# Run visual regression tests
npm run test:visual

# Update visual regression baselines
npm run test:update-snapshots
```

## Writing Tests

### Unit Tests
When adding new pure logic, math, or registry features, write a Vitest unit test.
- Import `describe`, `it`, `expect` from `vitest`.
- If you need a fresh engine, use `import { createTestEngine } from '../helpers/engine-helpers.js'`.

### E2E Tests
When adding new UI features, API methods, or interactions, write a Playwright E2E test.
- Always use `navigateAndWait(page)` from `tests/setup/playwright.setup.js` to ensure the engine is fully loaded before interacting.
- Use `simulateHover`, `simulateClick`, etc., from `tests/helpers/mouse-simulation.js` instead of raw Playwright pointer events for better reliability.

### Visual Regression Tests
When making visual changes to rendering (e.g., changing colors, strokes, shapes):
1. Make your changes in the code.
2. Run `npm run test:update-snapshots` to generate new baseline images in `tests/visual/screenshots/`.
3. Review the diffs carefully before committing.
