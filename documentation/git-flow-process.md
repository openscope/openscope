# Naming Convention

Each issue and corresponding pull request will be placed in one of the following categories:

- `feature`: addition of a _completely new feature_
- `enhancement`: notable _improvement or expansion upon an existing feature_
- `refactor`: code changes that _neither fix a defect nor add functionality_
- `bugfix`: fix a _defect of the simulator itself_ (regular bug fix)
- `hotfix`: fix a _defect of the simulator itself_ (emergency fix pushed straight to production)
- `documentation`: changes to _documentation files only_

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

## Git Flow Process

The post linked below has a thorough explanation of a very effective git branching strategy. Though slightly modified, our branching strategy and conventions are based heavily on this write-up.

[http://nvie.com/posts/a-successful-git-branching-model/](http://nvie.com/posts/a-successful-git-branching-model/)

Below you will find a helpful flow chart showing the exact git branching strategy employed at openScope. Additional information on the phases of our development lifecycle can be found [here](development-processes-checklists.md).

```text
         +------------------------+-------------------------+-----------------------------------+
         |      DEVELOPMENT       |         TESTING         |          INITIALIZATION           |
         +------------------------+-------------------------+-----------------------------------+
         |                        |                         |              hotfix    hotfix     |
         |                        |                         |              o-o-o-o   o-o-o-o    |
         |                        |                         |             /       \ /       \   |
 master  +------------------------+-------------------------+------------o---------o---------o--+--→ master
         |                        |                         |           /|         |         |  |
         |    feature   bugfix    |                         |          / |         |         |  |
         |    o-o-o-o   o-o-o-o   |                         |         /  |         |         |  |
         |   /       \ /       \  |                         |        /   ↓         ↓         ↓  |
develop  +--o---------o---------o-+------------o---------o--+------ / ---o---------o---------o--+--→ develop
         |                       \|            ↑         ↑  |      /                            |
         |                        +    bugfix  | bugfix  |  |     /                             |
         |                        |\   o-o-o-o | o-o-o-o |  |    /                              |
         |                        | \ /       \|/       \|  |   /                               |
         |               release  |  o---------o---------o--+--o                                |
         |                        |                         |                                   |
         +------------------------+-------------------------+-----------------------------------+
```
