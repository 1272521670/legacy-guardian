#!/bin/bash
set -e
REPO_DIR="/Users/sunkaixin/Projects/legacy-guardian"
REPO="1272521670/legacy-guardian"
BRANCH="main"
TOKEN_FILE="$REPO_DIR/.gh_token"

if [ ! -f "$TOKEN_FILE" ]; then
    echo "Error: Create $TOKEN_FILE with your GitHub token"
    exit 1
fi

GH_TOKEN=$(cat "$TOKEN_FILE" | tr -d '[:space:]')
AUTH="Authorization: token $GH_TOKEN"
API="https://api.github.com"

echo "Fetching current branch SHA..."
PARENT=$(curl -s -H "$AUTH" "$API/repos/$REPO/git/refs/heads/$BRANCH" | python3 -c "import sys,json; print(json.load(sys.stdin)['object']['sha'])")
echo "Current HEAD: $PARENT"

echo "Creating blobs..."
BLOBS=()
FILES=()

walk_dir() {
    local dir="$1"
    for entry in "$dir"/*; do
        [ -e "$entry" ] || continue
        local rel="${entry#$REPO_DIR/}"
        if [ -d "$entry" ]; then
            walk_dir "$entry"
        else
            local sha=$(curl -s -H "$AUTH" -H "Content-Type: application/json" \
                -X POST "$API/repos/$REPO/git/blobs" \
                -d "{\"content\":\"$(python3 -c "import base64,sys; print(base64.b64encode(open('$entry','rb').read()).decode())")\",\"encoding\":\"base64\"}" \
                | python3 -c "import sys,json; print(json.load(sys.stdin)['sha'])")
            FILES+=("$rel")
            BLOBS+=("$sha")
            echo "  $rel -> ${sha:0:7}"
        fi
    done
}

walk_dir "$REPO_DIR"

echo "Building tree..."
TREE_ITEMS="["
for i in "${!FILES[@]}"; do
    [ $i -gt 0 ] && TREE_ITEMS+=","
    TREE_ITEMS+="{\"path\":\"${FILES[$i]}\",\"mode\":\"100644\",\"type\":\"blob\",\"sha\":\"${BLOBS[$i]}\"}"
done
TREE_ITEMS+="]"

TREE_SHA=$(curl -s -H "$AUTH" -H "Content-Type: application/json" \
    -X POST "$API/repos/$REPO/git/trees" \
    -d "{\"tree\":$TREE_ITEMS}" \
    | python3 -c "import sys,json; print(json.load(sys.stdin)['sha'])")
echo "Tree: $TREE_SHA"

echo "Creating commit..."
COMMIT_SHA=$(curl -s -H "$AUTH" -H "Content-Type: application/json" \
    -X POST "$API/repos/$REPO/git/commits" \
    -d "{\"message\":\"Initial commit: digital legacy guardian app\n\n- User auth with Supabase\n- Digital will management with templates\n- Executor assignment\n- AI Guardian check-in\n- Digital assets inventory\n- Scheduled messages\n- PWA for mobile install\",\"tree\":\"$TREE_SHA\",\"parents\":[\"$PARENT\"]}" \
    | python3 -c "import sys,json; print(json.load(sys.stdin)['sha'])")
echo "Commit: $COMMIT_SHA"

echo "Updating branch..."
curl -s -H "$AUTH" -H "Content-Type: application/json" \
    -X PATCH "$API/repos/$REPO/git/refs/heads/$BRANCH" \
    -d "{\"sha\":\"$COMMIT_SHA\"}" | python3 -c "import sys,json; d=json.load(sys.stdin); print('Done! Ref:', d['ref'], '->', d['object']['sha'])"

echo "https://github.com/$REPO"
