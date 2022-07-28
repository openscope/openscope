# Contribution Guidelines
Hello, and thank you for your interest in contributing to openScope! Please take a minute to review our Contribution Guidelines, as this will result in getting your issue resolved or pull request merged faster.

## Getting set up
Here at openScope, we use multiple tools for development, the basics being Git and Node (see the quick start guide in our [README](README.md) file for help). Please use eslint to ensure your code conforms to our conventions. Hit us up on [slack](http://slack.openscope.io) if you need help getting this set up.

## Getting Push Access
To make work sharing and collaboration easier, we _heavily_ prefer to add you to the organization, so you can __keep your branch directly on the [openscope/openscope] repository instead of using forks__. There is nothing stopping you from also having a fork, but all pull requests must originate from a branch in the main repository. Pull requests originating from user forked repositories will closed, copied to a new branch on `openscope/openscope` and reopened there.

For access to the repository, contact Nate Geslin or Erik Quinn via [slack](http://slack.openscope.io). After you join, you will be able to push your branch to the main repository.

## Creating a pull request
Every pull request on openScope has a corresponding issue that describes the work to be done, and a category that it falls into. If no issue exists for the planned changes, create a new one. Remember to keep each issue and pull request focused and specific, and _keep the PR changes focused on the changes planned by the issue._ Generally, the smaller they are, the sooner they're merged.

__Branch names should take the format of `category/issuenumber`__ (see our [git flow document](documentation/git-flow-process.md) for more information).

So we can see what other team members are working on, we push branches to the main repo and open "work-in-progress" pull requests right away. Open up a pull request (using base of `develop`) on the GitHub website with a label of `WIP` (work-in-progress) and go about making your changes.

## Review Process
Once you're finished and your PR is ready, remove the `WIP` label and request a review from...

- Airport/Aircraft file changes - `airport-reviewers` team (or specific people as needed)
- Code related and all other changes - `code-reviewers` team (or specific people as needed)

Other contributors will leave reviews on your work, pointing out items you'll need to change. There are often many rounds of reviews. Once they _approve_ your pull request, a [repo admin](https://github.com/orgs/openscope/teams/simulator-admins/members) will merge your changes into the `develop` branch. We all test this branch at the end of every month, fix anything that broke, and update the website to that new version on the first of every month.

## Commit Messages
For all commit messages, please:

- prefix with the branch name
- use the present tense
- keep it brief, but descriptive

Example: `documentation/723 - Add contribution guidelines file`

## Additional Information
More information on our processes and file formats can be found in the [documentation folder](documentation/). If you have any questions, send us a message on [slack](http://slack.openscope.io), and we're always happy to help! We are a large, global team, so somebody is always awake and around to help you out.

We really appreciate your willingness to put your time into improving openScope! It is thanks to our dedicated contributors that the simulator continues to grow and improve every month.

\- *The openScope team*
