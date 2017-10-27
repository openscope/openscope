# Contribution Guidelines
Hello, and thank you for your interest in contributing to OpenScope! Please take a minute to review our Contribution Guidelines, as this will result in getting your issue resolved or pull request merged faster.
## Getting set up
OpenScope uses multiple tools for development, the basics being Git and Node. Getting these set up are covered in the quick start guide in README.md. To contribute, you will also need an IDE and eslint. After this, you are ready to create a branch and get developing!
## Submitting a pull request
Every pull request on OpenScope has a corresponding issue. Before opening a pull request, please create an issue on GitHub (if one does not already exist).

For the sake of simplicity, OpenScope discourages the use of repos outside of the main OpenScope/OpenScope repository, including forks. For access to the repository, you are asked to join OpenScope's [Slack channel](https://slack.openscope.co), and contact Nate Geslin or Erik Quinn for access. After this, you can push your branch to the main repository.

*Note that some members do maintain their own forks, mainly for testing purposes. There is nothing stopping you from doing so, however, PRs must be opened from a branch in the main repository.*

Whenever you are ready to open the pull request itself, go to GitHub and open a new PR. There is a template in place for ease of use. While it is not required, if you decide to forgo the template, please include what issue your PR addresses ("Resolves #XXX") and a brief description as well.

After your PR is opened, other contributors may approve your pull request, or request changes. After any needed changes are approved, n8rzz or erikquinn can merge your branch into the main `develop` branch.
## Pull request naming convention
PRs should be in the format of "category/number". More information can be found in our [Git Flow documentation](documentation/git-flow-process.md).
## Commits
Commits are also subject to certain conventions, the main one being that commits should start with the branch name. For example, working on a "bugfix/404" branch, commits could take the form of "bugfix/404 - resolved error where some files could not be found".
## Conclusion
Please attempt to conform to these guidelines, as it makes development a lot easier for everyone involved. More information can be found in the `documentation/` folder, and don't hesitate to ask around on [Slack](https://slack.openscope.co) if you have any questions!

Again, thank you for your desicion to help contribute to OpenScope, and welcome!

\- *The OpenScope team*
