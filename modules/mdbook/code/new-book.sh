#!/usr/bin/env bash
# Create the example book from this module in one go: init, write the
# SUMMARY.md from the tutorial, and build once so every chapter file exists.
#
# Usage: ./new-book.sh "Linux Notes"
# Preview it afterwards with:
#   cd linux-notes && mdbook serve --open

set -euo pipefail

TITLE="${1:?Usage: new-book.sh \"<Book Title>\"}"

# "Linux Notes" becomes "linux-notes": lower case, spaces to hyphens.
DIR=$(printf '%s' "$TITLE" | tr '[:upper:]' '[:lower:]' | tr -s ' ' '-')

if ! command -v mdbook > /dev/null; then
  echo "mdbook is not installed or not on your PATH." >&2
  echo "See the Installing mdBook section of the tutorial." >&2
  exit 1
fi

if [ -e "$DIR" ]; then
  echo "$DIR already exists; remove it or choose another title." >&2
  exit 1
fi

mdbook init "$DIR" --title "$TITLE" --ignore git

cat > "$DIR/src/SUMMARY.md" <<'EOF'
# Summary

[Introduction](README.md)

# Getting Around

- [Getting a shell](shell.md)
- [Files and directories](files/README.md)
  - [Permissions](files/permissions.md)

# Administration

- [Users and groups](users.md)
- [Services]()
EOF

# The placeholder chapter is no longer listed, so it would be ignored anyway.
rm -f "$DIR/src/chapter_1.md"

# Building creates every chapter that SUMMARY.md names but src/ lacks.
mdbook build "$DIR"

echo
echo "Created $DIR/ with these chapters:"
find "$DIR/src" -name '*.md' | sort | sed 's/^/  /'
echo
echo "Preview it with:"
echo "  cd $DIR && mdbook serve --open"
