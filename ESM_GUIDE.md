# ES Modules (ESM) Guide

This project uses **ES Modules** (ESM), the modern JavaScript module system, instead of CommonJS.

## Configuration

### package.json
```json
{
  "type": "module"
}
```

This tells Node.js to treat all `.js` files as ES modules.

### tsconfig.json
```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
```

TypeScript compiles to ESNext modules, which are native ES modules.

## Key Differences from CommonJS

### Imports and Exports

**ESM (What we use):**
```typescript
// Named exports
export class Rental { }
export const calculateFee = () => { };

// Default export
export default class Equipment { }

// Imports
import { Rental, calculateFee } from './Rental.js';
import Equipment from './Equipment.js';
```

**CommonJS (Old way):**
```javascript
// Exports
module.exports = { Rental, calculateFee };
exports.Rental = Rental;

// Imports
const { Rental, calculateFee } = require('./Rental');
```

### Important: File Extensions in Imports

⚠️ **In ESM, you must include the `.js` extension** when importing local files (even though the source is `.ts`):

```typescript
// ✅ Correct (ESM)
import { Money } from './Money.js';
import { Rental } from '../entities/Rental.js';

// ❌ Wrong (will cause runtime errors)
import { Money } from './Money';
import { Rental } from '../entities/Rental';
```

**Why `.js` and not `.ts`?**
- TypeScript compiles `.ts` files to `.js` files
- At runtime, Node.js executes the compiled `.js` files
- Import paths reference the compiled output, not the source

**Path aliases still work without extensions:**
```typescript
// ✅ These work fine (path aliases configured in tsconfig.json)
import { Money } from '@domain/value-objects/Money';
import { Rental } from '@domain/entities/Rental';
```

### Top-Level Await

ESM supports top-level `await` (no need for async IIFE):

```typescript
// ✅ ESM - works directly
const config = await loadConfig();
const db = await connectDatabase(config);

// ❌ CommonJS - needs wrapper
(async () => {
  const config = await loadConfig();
  const db = await connectDatabase(config);
})();
```

### __dirname and __filename

ESM doesn't have `__dirname` and `__filename`. Use these alternatives:

```typescript
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __filename equivalent
const __filename = fileURLToPath(import.meta.url);

// Get __dirname equivalent
const __dirname = dirname(__filename);
```

### Dynamic Imports

ESM uses `import()` for dynamic imports:

```typescript
// Dynamic import (async)
const module = await import('./MyModule.js');

// CommonJS
const module = require('./MyModule');
```

## Development Workflow

### Running TypeScript in Development

We use **tsx** instead of ts-node for better ESM support:

```bash
npm run dev    # Uses: tsx watch src/index.ts
```

tsx provides:
- ✅ Native ESM support
- ✅ Fast hot reload
- ✅ No configuration needed
- ✅ Works with TypeScript path aliases

### Testing with Jest

Jest configuration for ESM:

```typescript
// jest.config.ts
export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true }],
  },
};
```

In test files, use ESM imports:

```typescript
import { describe, it, expect } from '@jest/globals';
import { Money } from '../Money.js';

describe('Money', () => {
  it('should add amounts', () => {
    const result = Money.dollars(10).add(Money.dollars(5));
    expect(result.amount).toBe(15);
  });
});
```

## Common Patterns

### Exporting Types and Values

```typescript
// domain/value-objects/Money.ts

// Export the class
export class Money {
  constructor(public readonly amount: number) {}

  static dollars(amount: number): Money {
    return new Money(amount);
  }
}

// Export a type alias
export type MoneyLike = Money | number;

// Export an interface
export interface PaymentResult {
  success: boolean;
  transaction: Money;
}
```

### Barrel Exports (index.ts)

```typescript
// domain/value-objects/index.ts
export { Money } from './Money.js';
export { DateRange } from './DateRange.js';
export * from './identifiers.js';

// Usage elsewhere
import { Money, DateRange } from '@domain/value-objects';
```

### Re-exporting

```typescript
// Re-export everything from a module
export * from './Rental.js';

// Re-export with rename
export { Rental as RentalEntity } from './Rental.js';

// Re-export default as named
export { default as Equipment } from './Equipment.js';
```

## Debugging ESM Issues

### Module Not Found

**Error:**
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module
```

**Solution:**
- Check that you included `.js` extension in relative imports
- Verify the file path is correct
- Ensure `package.json` has `"type": "module"`

### Named Export Not Found

**Error:**
```
SyntaxError: The requested module does not provide an export named 'X'
```

**Solution:**
- Verify the export exists in the source file
- Check for typos in export/import names
- Ensure you're not mixing default and named exports incorrectly

### Path Alias Not Working

**Error:**
```
Cannot find module '@domain/...'
```

**Solutions:**
1. Check `tsconfig.json` has correct `paths` configuration
2. Verify `baseUrl` is set to `"./src"`
3. For Jest: Check `moduleNameMapper` in `jest.config.ts`
4. For runtime: Consider using a path resolution library or build tool

## Benefits of ESM

✅ **Native Browser Support**: Same module system in Node.js and browsers
✅ **Better Tree Shaking**: Bundlers can eliminate dead code more effectively
✅ **Static Analysis**: Imports are analyzed at compile time
✅ **Async by Default**: Top-level await support
✅ **Future-Proof**: ESM is the standard going forward

## Migration from CommonJS

If you have CommonJS code, here's how to convert:

```javascript
// Before (CommonJS)
const express = require('express');
const { Rental } = require('./domain/Rental');

function createApp() {
  const app = express();
  return app;
}

module.exports = { createApp };
```

```typescript
// After (ESM)
import express from 'express';
import { Rental } from './domain/Rental.js';

export function createApp() {
  const app = express();
  return app;
}
```

## Package Compatibility

Most modern packages support ESM. If you encounter a CommonJS-only package:

1. **Check for ESM version**: Many packages have ESM builds
2. **Use dynamic import**: `const pkg = await import('commonjs-pkg');`
3. **Create a wrapper**: Write a thin ESM wrapper around the CommonJS module

## References

- [Node.js ESM Documentation](https://nodejs.org/api/esm.html)
- [TypeScript ESM Support](https://www.typescriptlang.org/docs/handbook/esm-node.html)
- [Pure ESM Package Guide](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c)

## Quick Reference

| CommonJS | ESM |
|----------|-----|
| `require('./file')` | `import from './file.js'` |
| `module.exports = X` | `export default X` |
| `exports.X = Y` | `export const X = Y` |
| `__dirname` | `dirname(fileURLToPath(import.meta.url))` |
| Dynamic: `require(path)` | `await import(path)` |
| `.js` extension optional | `.js` extension **required** for relative imports |
