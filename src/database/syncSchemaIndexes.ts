import mongoose from 'mongoose';

/**
 * Bring every registered Mongoose model's MongoDB indexes in line with its
 * current schema.
 *
 * Mongoose auto-creates indexes declared in the schema, but it never drops
 * indexes whose fields have been removed or renamed. Over time this leaves
 * "stale" indexes — e.g. a unique index on a field that no longer exists.
 * Stale unique indexes are especially harmful because every new document
 * ends up with the field as `null`, and inserts past the first collide.
 *
 * Mongoose 6+ provides `Model.syncIndexes()` which:
 *   - drops any index on the collection that isn't declared in the schema
 *   - creates any index declared in the schema that isn't yet on the collection
 *
 * We call it once on boot for every registered model. Safe for all sizes of
 * collection because it's a no-op when indexes already match; only does real
 * work on the first run after a schema change.
 *
 * Failures on individual models are logged but do not abort boot, so a single
 * broken model can't take down the whole server.
 */
export async function syncSchemaIndexes(): Promise<void> {
  const modelNames = mongoose.modelNames();
  if (modelNames.length === 0) {
    console.log('[INDEX SYNC] No models registered — skipping.');
    return;
  }

  console.log(`[INDEX SYNC] Syncing indexes for ${modelNames.length} model(s)…`);

  for (const name of modelNames) {
    const model = mongoose.model(name);
    try {
      // syncIndexes returns an array of *dropped* index names (if any).
      const dropped = await model.syncIndexes();
      if (Array.isArray(dropped) && dropped.length > 0) {
        console.log(
          `[INDEX SYNC] ${name}: dropped stale index(es) → ${dropped.join(', ')}`,
        );
      }
    } catch (err) {
      console.warn(
        `[INDEX SYNC] ${name}: failed to sync indexes.`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  console.log('[INDEX SYNC] Done.');
}
