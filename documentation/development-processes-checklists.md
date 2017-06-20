## Naming Convention
We consider there to be essentially three basic categories of changes:
- `bugfix` (or `hotfix`): for change that fix a documented defect of the simulator
    - includes GitHub labels `bugfix` (regular bugfixes) and `hotfix` (critical bug fix pushed directly to production)
- `feature`: for changes that add or notably improve an existing feature
    - includes GitHub labels `airport work` (new airports only), `enhancement`, and of course `feature`
- `refactor`: for changes that neither add features nor fix bugs, like code reorganization
    - includes GitHub labels `airport work` (all airport updates), `devops`, `documentation`, and of course `refactor`

All GitHub issues will be have a label that places it in one of these categories. All branches and pull requests should use names in the shape of `ISSUE_CATEGORY/ISSUE_NUMBER`.
```bash
# Github issue #333 in category 'bugfix'
bugfix/333

# Github issue #321 in category 'feature'
feature/321

# GitHub issue #347 in category 'refactor'
refactor/347
```

Pull Requests should reference the issue number in the first line of the description:
```bash
Resolves #321.

Short description of the purpose of these changes
```

## Processes of Each Sprint
**Note**: In order to complete all of the steps below a user will need:
- to be a member of the `openscope-admins` team within the Openscope team on GitHub
- have access to the openscope pipeline on Heroku

Each sprint is considered to progress through these three phases. Further details about each phase can be found in the sections below. The development phase lasts the majority of the sprint, with the first two days of the sprint being reserved to the initialization phase, and the last three being reserved to the testing phase.

1. __Initialization Phase__ _(first two days)_
1. __Development Phase__
1. __Testing Phase__ _(last three days)_

The checklists below must be completed at the beginning of the phase for which they are named.

_Note: Except on the first merge of a hotfix/bugfix/feature branch, please always use `git merge branchName` with up-to-date local branches, and not `git pull origin branchName`, as the latter forces a non-FF merge, which is often undesirable._

In total, each sprint cycle will include the following actions in the following order:

1. [Initialization Phase Checklist](#initialization-phase-checklist)
1. [Sprint Closeout Procedure](#sprint-closeout-procedure)
1. [Before Development Phase Checklist](#before-development-phase-checklist)
1. Proceed with development in accordance with the [Development Procedures](#development-procedures)
1. [Testing Phase Checklist](#testing-phase-checklist)
1. [Release Procedure](#release-procedure)

---

### Initialization Phase Checklist
1. Checkout `develop`.
1. Commit with `ARCH - Prepare CHANGELOG and set beta version for upcoming sprint`.
    - Set version number to planned number for this sprint, plus `-BETA`, eg `v5.2.0-BETA`.
    - Prepare changelog for next sprint by adding sections and whitespace.
1. When build succeeds and all tests pass, push `develop` to origin.


_Only hotfix branches should be merged (to `master --> develop`) during this phase._


### Sprint Closeout Procedure
1. Clean up sprint board and milestone.
    - Ensure they only contain resolved items.
    - Move any items that have not been resolved.
1. Close sprint (Zube) and milestone (GitHub).


### Before Development Phase Checklist
1. Attempt to merge `master` into `develop` with `git merge master`.
    - If master contains no un-merged hotfixes, git should reply `Already up-to-date.`.
    - If master contains un-merged hotfixes, git will merge the changes (by FF if possible).
1. If changes _were_ merged, push to origin.
1. Delete _previous_ release branch, and leave only the _latest_ release branch.

_Any feature/bugfix/hotfix branch may be merged (to the appropriate branches) once this checklist has been completed._

### Development Procedures
1. Merging feature and bugfix branches:
    - Use non-FF merges into `develop` via "the green button" or either of the below commands:
        - `git pull origin feature/###` (merges local version of branch)
        - `git merge --no-ff feature/###` (merges latest version of upstream branch)
    - Set/amend the merge commit's message to take the following form:
        - Include summary of `Merge [category]/### (#PRNumber)`.
        - Include description that very briefly explains the purpose of that branch.
1. Merging hotfix branches:
    - Use non-FF merges into `master` via "the green button" or either of the below commands:
        - `git pull origin hotfix/###` (merges local version of branch)
        - `git merge --no-ff hotfix/###` (merges latest version of upstream branch)
    - Set/amend the merge commit's message to take the following form:
        - Include summary of `Merge hotfix/### (#PRNumber)`.
        - Include description that very briefly explains the purpose of that branch.
    - Merge `master` into `develop` with `git merge master`.
        - Note that this merge _will_ have conflicts due to the different version numbers and CHANGELOG. Resolve and allow the merge commit.
        - Include summary of `Merge hotfix/359 (#361) from master`.
        - Include the same description in the second line.

### Testing Phase Checklist
At least three days prior to the end of the sprint, we will create a `release` branch that represents the state of the simulator after the current sprint's work. This release branch is temporary and has a short lifespan.  It exists solely to provide a testing environment segregated from both the development and production versions of the app.

1. Create new branch `release/#.#.#` from `develop`.
1. Open a pull request for `release/#.#.#` into `master`.
    - Include a title of the version number, eg 'v5.2.0'.
    - Include a description of 'Deploy v5.2.0'.
1. On Heroku, change staging app to point to this new release branch.
1. Broadcast publishing of testing app and seek feedback and/or bug reports. Any bugs should be reported to the `#bugs` room and will be triaged from there.
1. Merge any applicable bugfix branches into `release/#.#.#`.
    - Include summary of `Merge bugfix/### (#PRNumber)`
    - Then on `develop`, run `git merge release/#.#.#` (results in a FF) and push.

_Only bugfix branches should be merged to `release/#.#.#` during this phase. Then, only the `release/#.#.#` branch should be merged into `develop`._

### Release Procedure
1. Checkout `release/#.#.#`.
1. Commit and push to origin the following finalizations to the release branch.
    - Set new release's version number:
        - in `package.json`.
        - in `VERSION` within `App.js`.
    - Clean up changelog file.
        - Remove the extra empty lines in each section.
        - Update current sprint's version number and release date.
    - Use commit message `ARCH - Finalize CHANGELOG and set version number for v#.#.# release`
1. Merge `release/#.#.#` into `master` by accepting the existing pull request for the `release/#.#.#` branch.
    - Include summary of `Deploy v5.2.0 (#123)`.
<!-- 1. Push `develop` and `release/#.#.#` to origin. -->
1. Checkout `master` locally and create and push a new version tag.
    - `git tag v#.#.#` and `git push v#.#.#`
1. On the repository's [tags](https://github.com/openscope/openscope/tags) page, find the newly created tag and add release notes.
    - Include title of the version number, eg `v5.2.0`.
    - Include a description copied from the `CHANGELOG`.
1. Merge `release/#.#.#` into `develop` with `git merge release/#.#.#`.
    - By design, `develop` should contain no changes, resulting in git replying `Already up-to-date.`.
1. Ensure the build succeeds and all tests are passing on `develop`, then push to origin.
