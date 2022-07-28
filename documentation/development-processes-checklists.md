# Development Processes Checklists

## Processes of Each Sprint

**Note**: In order to complete all of the steps below a user will need:

- to be a member of the `openscope-admins` team within the openScope team on GitHub
- have access to the openScope pipeline on Heroku

Each sprint is considered to progress through these three phases. Further details about each phase can be found in the sections below. The development phase lasts the majority of the sprint, with the first two days of the sprint being reserved to the initialization phase, and the last three being reserved to the testing phase.

1. __Initialization Phase__ _(first two days)_
1. __Development Phase__
1. __Testing Phase__ _(last three days)_

The checklists below must be completed at the beginning of the phase for which they are named.

_Note: Except on the first merge of a hotfix/bugfix/feature branch, please always use `git merge branchName` with up-to-date local branches, and not `git pull origin branchName`, as the latter forces a non-FF merge, which is often undesirable._

In total, each sprint cycle will include the following actions in the following order:

1. [Sprint Closeout Procedure](#sprint-closeout-procedure)
1. [Before Development Phase Checklist](#before-development-phase-checklist)
1. Proceed with development in accordance with the [Development Procedures](#development-procedures)
1. [Testing Phase Checklist](#testing-phase-checklist)
1. [Release Procedure](#release-procedure)

---

## Sprint Closeout Procedure

1. Clean up sprint board and milestone.
    - Ensure they only contain resolved items.
    - Move any items that have not been resolved.
1. Close sprint (Zube) and milestone (GitHub).

## Before Development Phase Checklist

1. Checkout `develop`.
1. Attempt to merge `master` into `develop` with `git merge master`.
    - By design, develop should contain no changes, resulting in git replying `Already up-to-date`.
1. If changes _were_ merged, push to origin.
1. Delete _previous_ release branch, and leave only the _latest_ release branch.

## Development Procedures

1. Merging feature and bugfix branches:
    - Use non-FF merges into `develop` via "the green button" or either of the below commands:
        - `git pull origin feature/###` (merges latest version of upstream branch)
        - `git merge --no-ff feature/###` (merges local version of branch)
    - Set/amend the merge commit's message to take the following form:
        - Include summary of `Merge [category]/### (#[PRNumber])`.
        - Include description that very briefly explains the purpose of that branch.
1. Merging hotfix branches:
    - Use non-FF merges into `master` via "the green button" or either of the below commands:
        - `git pull origin hotfix/###` (merges latest version of upstream branch)
        - `git merge --no-ff hotfix/###` (merges local version of branch)
    - Set/amend the merge commit's message to take the following form:
        - Include summary of `Merge hotfix/### (#[PRNumber])`.
        - Include description that very briefly explains the purpose of that branch.
    - Merge `master` into `develop` with `git merge master`.
        - Note that this merge _will_ have conflicts due to the different version numbers and CHANGELOG. Resolve and allow the merge commit.
        - Include summary of `Merge hotfix/### (#[PRNumber]) from master`.
        - Include the same description in the second line.

## Testing Phase Checklist

At least three days prior to the end of the sprint, we will create a `release` branch that represents the state of the simulator after the current sprint's work. This release branch is temporary and has a short lifespan.  It exists solely to provide a testing environment segregated from both the development and production versions of the app.

1. Checkout `develop`.
1. Create new branch `release/#.#.#` from `develop`.
1. Open a pull request for `release/#.#.#` into `master`.
    - Include a title of the version number, eg 'v#.#.#'.
    - Include a description of copied from the `CHANGELOG`.
1. On Heroku, change staging app to point to this new release branch.
1. Broadcast publishing of testing app and seek feedback and/or bug reports. Any bugs should be reported to the `#bugs` room in slack and will be triaged from there.
1. Merge any applicable bugfix branches into `release/#.#.#`.
    - Include summary of `Merge bugfix/ (#[PRNumber])`
    - Then on `develop`, run `git merge release/#.#.#` (results in a FF) and push.

_Only bugfix branches may be merged (to `release/#.#.# --> develop`) during this phase._

## Release Procedure

1. Checkout `release/#.#.#`.
1. Commit and push to origin the following finalizations to the release branch.
    - Set new release's version number in `package.json`.
    - Clean up changelog file.
        - Remove the extra empty lines in each section.
        - Update current sprint's version number and release date.
    - Use commit message `ARCH - Finalize CHANGELOG and set version number for v#.#.# release`
1. Merge `release/#.#.#` into `master` by accepting the existing pull request for the `release/#.#.#` branch.
    - Include summary of `Deploy v#.#.# (#[PRNumber])`.
1. Checkout `master`.
1. Create and push a new version tag.
    - `git tag v#.#.#` and `git push origin v#.#.#`
1. On the repository's [tags](https://github.com/openscope/openscope/tags) page, find the newly created tag and add release notes.
    - Include title of the version number, eg `v#.#.#`.
    - Include a description copied from the `CHANGELOG`.
1. On Heroku, change staging app to maintenance mode.
1. Checkout `develop`.
1. Merge `master` into `develop` with `git merge master` (results in a FF).
1. Commit with `ARCH - Prepare CHANGELOG and set beta version for upcoming sprint` and push.
    - Set version number to planned number for this sprint, plus `-BETA`, eg `v#.#.#-BETA`.
    - Prepare changelog for next sprint by adding sections and whitespace.

_Only hotfix branches may be merged (to `master --> develop`) during the initialization phase. Always add tags and release notes with each hotfix._
