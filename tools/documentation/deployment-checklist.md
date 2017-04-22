## Pre-Deployment Checklist
This should happen one or two weeks prior to a release.  This step will create a new release branch and deploy to a staging server

_you will need and access to heroku in order to update deploy settings_

1. checkout and pull `develop`
1. create a new branch off of `develop` with the title `release/x.x.x` where the `X`s are the version number of the planned release
    - _We do not keep a long running release branch but, instead, create a new one every time off of develop_
1. push `release/x.x.x`
1. open a new pull request for this release branch. title it with the version number and target the `master` branch.

## New Release Deployment Checklist
_you will need admin access on the repo in order to make changes directly on the `master` and `develop` branches_

1. checkout and pull `master`
1. checkout and pull 'release/x.x.x'
1. run `npm run build`
    - _verify build succeeds and all tests pass_
1. checkout and pull `develop`
1. run `npm run build`
    - _verify build succeeds and all tests pass_
1. merge `release` into `develop` with `git merge release/x.x.x`
1. run `npm run build`
    - _verify build succeeds and all tests pass_
1. checkout `release/x.x.x`
1. bump version number in `package.json`
    - _This could be either a minor or major bump, depending on work completed in the sprint._
1. make the following changes to the `CHANGELOG` file:
    - update version number and release date
    - remove the extra empty lines in each section (which we use to mitigate possible merge conflicts)
1. after saving both `package.json` and `CHANGELOG` files, commit these changes with the following commit message:  `ARCH - update `CHANGELOG` and bump version number for release`
1. push `release/x.x.x`
    - _this will trigger a build on our [staging](https://openscope-staging.herokuapp.com/) server_
1. checkout `master`
1. pull `release/x.x.x` into `master`
1. run `npm run build`
    - _verify build succeeds and all tests pass_
1. create a version tag with `git tag vX.X.X`
1. push the new tag
1. push `master`
    - _this will trigger a build on our [production](https://openscope-prod.herokuapp.com/) server_
1. checkout `develop`
1. pull `master` into `develop`
1. run `npm run build`
    - _verify build succeeds and all tests pass_
1. create the next sprint's section in the `CHANGELOG` and commit with the following message: `ARCH - update `CHANGELOG` for next sprint's work`
1. push `develop`

## Add Release Notes
1. navigate to [https://github.com/openscope/openscope/tags](https://github.com/openscope/openscope/tags), find the tag that was pushed in the section above and click on the `add release notes` link
1. set the title to `vX.X.X`, where the `X`s are the version number of the release
1. copy the applicable sprint's section in the `CHANGELOG`
1. click `Publish Release`

## Sprint Cleanup
- close current milestone
- [zube] verify all items in active sprint have been either closed or deferred to another sprint
- [zube] close active sprint
