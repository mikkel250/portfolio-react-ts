---
name: langfuse-skill-feedback
description: Submit feedback about the Langfuse skill to its maintainers via GitHub Discussions. Use when the user indicates the skill gave incorrect guidance, is missing information, or could be improved.
metadata:
  required_access:
    - GITHUB
---

# Skill Feedback

Follow these steps exactly:

1. **Ask permission**: Ask the user if they'd like you to submit feedback to the skill maintainers. Make it clear this is about the skill (the agent instructions), not about Langfuse the product. If they decline, move on.
2. **Draft feedback**: Write the feedback using the form structure below. Present the draft to the user and ask if they'd like to change anything before submitting.
3. **Submit**: Once approved, submit via `gh` CLI as described below. Share the resulting discussion URL with the user.

## Feedback Form Structure

Draft the feedback using these two fields:

**Describe your idea or feedback** (required)
A clear description of what went wrong or what could be improved. Include:
- What the user was trying to do
- What the skill did vs what was expected
- Any specific instructions that were incorrect or missing

**What would the ideal outcome look like?** (optional)
What the correct behavior or guidance should be.

Format the body as markdown with the two field labels as headings.

## Submitting

Create a GitHub Discussion on the `langfuse/skills` repository using the GraphQL API.
Look up repository/category IDs as before, then pass title/body through structured JSON
(`gh api --input`) so user-controlled text is never interpolated into shell arguments:

```bash
REPO_ID="$(gh api graphql -f query='{ repository(owner: "langfuse", name: "skills") { id } }' --jq '.data.repository.id')"
CATEGORY_ID="$(gh api graphql -f query='{ repository(owner: "langfuse", name: "skills") { discussionCategories(first: 10) { nodes { id name } } } }' --jq '.data.repository.discussionCategories.nodes[] | select(.name == "Ideas & Improvements") | .id')"

INPUT_FILE="$(mktemp)"
export REPO_ID CATEGORY_ID
export FEEDBACK_TITLE="<concise title>"
export FEEDBACK_BODY="<formatted feedback>"
python3 - <<'PY' > "$INPUT_FILE"
import json, os
print(json.dumps({
  "query": """mutation($repoId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
    createDiscussion(input: {repositoryId: $repoId, categoryId: $categoryId, title: $title, body: $body}) {
      discussion { url }
    }
  }""",
  "variables": {
    "repoId": os.environ["REPO_ID"],
    "categoryId": os.environ["CATEGORY_ID"],
    "title": os.environ["FEEDBACK_TITLE"],
    "body": os.environ["FEEDBACK_BODY"],
  },
}))
PY

gh api graphql --input "$INPUT_FILE"
rm -f "$INPUT_FILE"
```

If the `gh` CLI is not authenticated or the request fails, give the user this link to create the discussion manually:

```
https://github.com/langfuse/skills/discussions/new?category=ideas-improvements
```

After submission, share the discussion URL with the user.
