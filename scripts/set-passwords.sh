#!/bin/bash
# Sets admin_password (MyArtie2026) in all 5 D1 databases
# and MASTER_PASSWORD (Galatians0522) as a Pages secret on all 5 projects.
# Run from the artie/ directory.

set -e
cd "$(dirname "$0")/.."

echo "Generating password hash..."
HASH=$(node -e "
const crypto = require('crypto');
const salt = crypto.randomUUID();
const hash = crypto.createHash('sha256').update(salt + 'MyArtie2026').digest('hex');
console.log(salt + ':' + hash);
")
echo "Hash generated."
echo ""

echo "=== Updating admin_password in D1 databases ==="

echo "Don..."
npx wrangler d1 execute artie-don-golden-db --config wrangler-don.toml \
  --command="UPDATE artists SET admin_password = '${HASH}' WHERE id = 1;" --remote

echo "Kathy..."
npx wrangler d1 execute artie-kathy-golden-db --config wrangler-kathy.toml \
  --command="UPDATE artists SET admin_password = '${HASH}' WHERE id = 1;" --remote

echo "Mary..."
npx wrangler d1 execute artie-mary-lynch-db --config wrangler-mary.toml \
  --command="UPDATE artists SET admin_password = '${HASH}' WHERE id = 1;" --remote

echo "Hannah..."
npx wrangler d1 execute artie-hannah-sanders-db --config wrangler-hannah-sanders.toml \
  --command="UPDATE artists SET admin_password = '${HASH}' WHERE id = 1;" --remote

echo "Taylor..."
npx wrangler d1 execute artie-taylor-mershon-db --config wrangler-taylor-mershon.toml \
  --command="UPDATE artists SET admin_password = '${HASH}' WHERE id = 1;" --remote

echo ""
echo "=== Setting MASTER_PASSWORD secret on all 5 Pages projects ==="

echo "Galatians0522" | npx wrangler pages secret put MASTER_PASSWORD --project-name=artie-don-golden
echo "Galatians0522" | npx wrangler pages secret put MASTER_PASSWORD --project-name=artie-kathy-golden
echo "Galatians0522" | npx wrangler pages secret put MASTER_PASSWORD --project-name=artie-mary-lynch
echo "Galatians0522" | npx wrangler pages secret put MASTER_PASSWORD --project-name=artie-hannah-sanders
echo "Galatians0522" | npx wrangler pages secret put MASTER_PASSWORD --project-name=artie-taylor-mershon

echo ""
echo "Done. All artists: admin password = MyArtie2026, master password = Galatians0522"
echo "Artists should log in and change their password via Admin bar > Change Password."
