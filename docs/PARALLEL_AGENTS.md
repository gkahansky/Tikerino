# Parallel agent lanes

Two coding agents can work on Tikerino at the same time without touching each
other's files. Each one works in its own git worktree, on its own branch, and
lands its change through its own pull request.

## Lanes

| Lane   | Worktree path (default)       | Who uses it                          |
|--------|-------------------------------|--------------------------------------|
| lane-a | `../Tikerino-lanes/lane-a`    | first agent (Gemini now)             |
| lane-b | `../Tikerino-lanes/lane-b`    | second agent (Gemini now, Claude from 1 Oct) |

Set `LANES_DIR` to put the worktrees somewhere else.

**Worktrees are scratch.** An agent workspace can be rebuilt at any time, and
the worktrees go with it. "Persistent" means reproducible: the lanes are
rebuilt from `scripts/worktrees.sh` and `origin`. Anything not pushed does not
exist. Push after every commit.

## One child per lane

- A lane holds exactly one pillar child (one todo) at a time.
- WIP-one still applies per pillar. Two lanes never carry two Doing items from
  the same pillar. A lane may not pull a new feature past its pillar's WIP limit.
- Branch name: `<lane>/<todo-slug>`, for example `lane-a/ops-board-typo`.

## Pick up a child

```bash
scripts/worktrees.sh setup lane-a <todo-slug>
cd ../Tikerino-lanes/lane-a
npm ci
```

`setup` fetches `origin/main` and branches from it. If `<lane>/<todo-slug>`
already exists on origin (a rebuilt workspace), it checks that branch out
instead, so work resumes where it was pushed.

## Work and open the PR

- Commit small, push often: `git push -u origin HEAD`.
- Keep the diff to the child's scope. Anything else becomes a new todo.
- Before asking for a merge run `scripts/worktrees.sh check lane-a`. It fails if
  the lane has uncommitted changes or is behind `origin/main`, then runs
  `git diff --check` against main and `npm run verify` (typecheck, tests,
  content).
- Open a PR against `main`. Both CI jobs must pass: `typecheck, tests, content`
  and `full loop, axe, every exercise`.

## Merge order: one at a time

1. The PR that is green first merges first.
2. Every other open lane PR then rebases: `git fetch origin && git rebase origin/main`,
   re-runs `scripts/worktrees.sh check <lane>`, and force-pushes with
   `git push --force-with-lease`.
3. Wait for both CI jobs to go green again on the new head, then merge.
4. Never merge two lane PRs back to back without the rebase and re-run in
   between.

No direct pushes to `main`. No change to branch protection or CI requirements
as part of lane work.

## Conflicts

- If a rebase conflicts, the lane that is rebasing resolves it. Keep both
  sides' intent. Never drop the other lane's merged change to make yours apply.
- After resolving, re-run the check and confirm the other lane's change is
  still present in the result (`git log origin/main` and the affected file).
- If the two children touch the same file by design, they are not parallel
  work. Run them one after the other.

## Secrets and data

- Never put secrets in an agent prompt or context: no .env contents, API keys,
  tokens, DATABASE_URL, Railway variables or the /ops password. Lanes never
  read .env files.
- The Gemini lanes run on Gemini CLI's free tier through Guy's Google account.
  Google may use that usage to improve its products. The repo is public, so
  code is fine, but private data and learner data never go into prompts.
- If an agent needs a secret to finish a task, it stops and reports. It never
  works around the gap.

## Release and clean up

After the PR merges:

```bash
scripts/worktrees.sh teardown lane-a
git push origin --delete lane-a/<todo-slug>   # if GitHub did not delete it
```

The lane is then free for the next child. `scripts/worktrees.sh list` shows
every worktree and its branch.

## Adding Claude on 1 October

Claude Code joins as a lane on the same rules. No new scripts:

1. Tear down whichever lane is free and set it up for Claude's child.
2. Claude works only inside that worktree and follows this document.
3. Claude Code uses the included session quota only. When the quota runs out
   it stops; it does not fall back to the paid Anthropic API.

Any paid option (API keys, a paid plan, hosted runners) is Guy's decision and
is outside this process.
