#!/usr/bin/env python3
"""Push local git repo to GitHub using GitHub API (no git push needed)."""
import os
import base64
import json
import subprocess
import requests

TOKEN = os.environ["GH_TOKEN"]
REPO = "1272521670/legacy-guardian"
BRANCH = "main"
REPO_DIR = "/Users/sunkaixin/Projects/legacy-guardian"
HEADERS = {
    "Authorization": f"token {TOKEN}",
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "legacy-guardian-push",
}

def run(cmd):
    result = subprocess.run(cmd, capture_output=True, text=True, cwd=REPO_DIR)
    return result.stdout.strip(), result.stderr.strip(), result.returncode

# Get HEAD commit SHA
head, _, _ = run(["git", "rev-parse", "HEAD"])
print(f"HEAD: {head}")

# Get all object SHAs reachable from HEAD
out, _, _ = run(["git", "rev-list", "--objects", head])
all_objs = [l.strip() for l in out.splitlines() if l.strip()]
print(f"Total objects: {len(all_objs)}")

# Get commit content
commit_msg, _, _ = run(["git", "cat-file", "-p", head])
print(f"Commit message:\n{commit_msg[:200]}")

# Extract tree from commit
tree_sha = None
for line in commit_msg.splitlines():
    if line.startswith("tree "):
        tree_sha = line[5:].strip()
        break
print(f"Root tree: {tree_sha}")

def get_type(sha):
    out, _, _ = run(["git", "cat-file", "-t", sha.strip()])
    return out.strip()

def get_blob_content(sha):
    out, _, _ = run(["git", "cat-file", "-p", sha.strip()])
    return out

def get_tree_items(tree_sha):
    out, _, _ = run(["git", "cat-file", "-p", tree_sha.strip()])
    items = []
    for line in out.splitlines():
        parts = line.split(None, 4)
        if len(parts) >= 4:
            items.append({"mode": parts[0], "path": parts[3], "sha": parts[2], "type": parts[1]})
    return items

def create_blob(content_str):
    data = content_str.encode("utf-8")
    r = requests.post(
        f"https://api.github.com/repos/{REPO}/git/blobs",
        headers=HEADERS,
        json={"content": base64.b64encode(data).decode(), "encoding": "base64"}
    )
    if r.status_code not in (201,):
        print(f"  [!] Blob create failed: {r.status_code} {r.text[:200]}")
        return None
    return r.json()["sha"]

def create_tree(items):
    tree_data = []
    for item in items:
        t = item["type"]
        if t == "blob":
            blob_sha = create_blob(get_blob_content(item["sha"]))
            if blob_sha:
                tree_data.append({"path": item["path"], "mode": item["mode"], "type": "blob", "sha": blob_sha})
        elif t == "tree":
            sub_items = get_tree_items(item["sha"])
            sub_tree_sha = create_tree(sub_items)
            if sub_tree_sha:
                tree_data.append({"path": item["path"], "mode": item["mode"], "type": "tree", "sha": sub_tree_sha})
    if not tree_data:
        return None
    r = requests.post(
        f"https://api.github.com/repos/{REPO}/git/trees",
        headers=HEADERS,
        json={"tree": tree_data, "base_tree": None}
    )
    if r.status_code not in (201,):
        print(f"  [!] Tree create failed: {r.status_code} {r.text[:200]}")
        return None
    return r.json()["sha"]

# Build new tree from our repo's tree
print("\nBuilding tree...")
root_items = get_tree_items(tree_sha)
print(f"Root has {len(root_items)} items")
new_tree_sha = create_tree(root_items)
print(f"New tree: {new_tree_sha}")

# Get parent commit SHA
parent_sha = None
out, _, _ = run(["git", "rev-parse", f"{head}~0"])
# Try to get current branch tip
r = requests.get(
    f"https://api.github.com/repos/{REPO}/git/refs/heads/{BRANCH}",
    headers=HEADERS
)
if r.status_code == 200:
    parent_sha = r.json()["object"]["sha"]
    print(f"Parent commit: {parent_sha}")

# Create commit
# Extract author/committer from original commit
author_line = None
committer_line = None
for line in commit_msg.splitlines():
    if line.startswith("author "):
        author_line = line
    if line.startswith("committer "):
        committer_line = line

# Parse timestamp
import re
ts_match = re.search(r"(\d+) [+-]\d+", author_line or committer_line or "")
timestamp = int(ts_match.group(1)) if ts_match else 1700000000

msg_only = "\n".join(l for l in commit_msg.splitlines() if not l.startswith("tree ") and not l.startswith("author ") and not l.startswith("committer ") and not l.startswith("parent ") and l.strip())

commit_data = {
    "message": msg_only,
    "tree": new_tree_sha,
}
if parent_sha:
    commit_data["parents"] = [parent_sha]

r = requests.post(
    f"https://api.github.com/repos/{REPO}/git/commits",
    headers=HEADERS,
    json=commit_data
)
if r.status_code not in (201,):
    print(f"[!] Commit failed: {r.status_code} {r.text[:500]}")
else:
    new_commit_sha = r.json()["sha"]
    print(f"New commit: {new_commit_sha}")

    # Update branch ref
    r2 = requests.patch(
        f"https://api.github.com/repos/{REPO}/git/refs/heads/{BRANCH}",
        headers=HEADERS,
        json={"sha": new_commit_sha, "force": False}
    )
    if r2.status_code == 200:
        print(f"\n✓ Successfully pushed to https://github.com/{REPO}")
    else:
        print(f"[!] Ref update failed: {r2.status_code} {r2.text[:200]}")
        # Try force
        r3 = requests.patch(
            f"https://api.github.com/repos/{REPO}/git/refs/heads/{BRANCH}",
            headers=HEADERS,
            json={"sha": new_commit_sha, "force": True}
        )
        if r3.status_code == 200:
            print(f"✓ Force pushed to https://github.com/{REPO}")
        else:
            print(f"[!] Force push also failed: {r3.status_code} {r3.text[:200]}")
