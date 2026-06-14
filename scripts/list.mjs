#!/usr/bin/env node
/**
 * List all provisioned Artie artists.
 * Usage: node scripts/list.mjs
 */
import { printRegistry } from './registry.mjs'
console.log('\n  Artie Artist Registry')
printRegistry()
