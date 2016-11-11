## Git Flow Process

Below you will find information about the main git branches as well as the overall branching strategy.

![Git flow process](images/git-flow-process.jpg)  

- **gh-pages** - represents the code that is deployed. only a release branch should merge into this branch. anytime a release branch is merged, you will need to run `npm run build`, commit the updated `bundle.min.js` and `bundle.min.css` files. then push the new changes and the build will execute on successful push.

- **bugfix/ATC-XX** - branches off of `release/3.0.0` for current `v3.0.0` bugfixes. should have a corresponding github issue where the `XX` in `ATC-XX` is the issue number. once a fix is finished, a pull request should be submitted targeting the branch it was created from.

- **release/3.0.0** - `v3.0.0` release branch. currently the only branch getting merged into `gh-pages`. only bugfix branches should be merged into this branch. when new fixes are merged, this branch is pulled into both `release/3.x.x` _and_ `develop`. at the conclusion of UAT, `gh-pages` will be tagged `release/3.0.0` and this branch will be deleted. unless there is a good reason, there should not be any direct commits to this branch.

- **release/3.x.x** - the next release. post `v3`, this will become the main release branch and will be the only branch merging into `gh-pages`. same bugfix rules from `release/3.0.0` apply to this branch. bugfix changes here get pulled into develop. feature merges in develop get pulled into this branch once a feature is complete. unless there is a good reason, there should not be any direct commits to this branch.

- **develop** - current working state with completed new features. should be in working code, with no console errors or failing tests. new features branch off of this branch. this branch gets pulled into `release/3.x.x` in preparation for deploy with `gh-pages` (post v3). unless there is a good reason, there should not be any direct commits to this branch.

- **feature/ATC-XX** - new features or refactor work. should have a corresponding github issue where the `XX` in `ATC-XX` is the issue number. should only ever branch off `develop`. may contain code that is under active development. may have failing tests or non-working pieces. should stay current with `develop` and should be conflict free when submitting a PR. developer may open a [WIP] PR for visibility, though not required.
