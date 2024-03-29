[![openScope Current Release](https://img.shields.io/github/v/release/openscope/openscope.svg)](https://github.com/openscope/openscope/releases)
[![Production Build State](https://img.shields.io/github/actions/workflow/status/openscope/openscope/push.yml?branch=master)](https://github.com/openscope/openscope/tree/master)
[![Coverage Status](https://coveralls.io/repos/github/openscope/openscope/badge.svg?branch=develop)](https://coveralls.io/github/openscope/openscope?branch=develop)
[![Slack Status](https://img.shields.io/badge/slack-join-yellow)](https://join.slack.com/t/openscopeatc/shared_invite/zt-g9wq2mch-B7Z9IltlgxgCBC2dBYPjiw)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE.md)

# openScope Air Traffic Control Simulator

Visit http://openscope.io to begin playing now!

If you're just getting started, try the tutorial and see the [command reference](documentation/commands.md) for a full list of commands you can use. For information on each airport, see the [airport guide](documentation/airport-guides/airport-guide-directory.md).

Feel free to [join us on slack](https://join.slack.com/t/openscopeatc/shared_invite/zt-g9wq2mch-B7Z9IltlgxgCBC2dBYPjiw) if you have questions, comments or would like to contribute to the project. We can then add you to the organization so you can begin committing to this repo.

---

## Developer Quick Start

_Prerequisites: In order to successfully complete this quick start, you will need to have the following installed locally:_

- [Git](https://git-scm.com/downloads)
- [Node](https://nodejs.org/en/download/)

_Installation directions are beyond the scope of this document.  Instead, search the [Google](http://google.com).  Installing these two packages has been written about ad-nauseum._

From a terminal (or GitBash for Windows users), run the following commands:

1. `git clone https://github.com/openscope/openscope.git`
1. `cd openscope`
1. `npm install`
1. `npm run build`
1. `npm run start`

Once that finishes doing its thing, you should see something close to the following in the terminal:

```bash
> node ./public/assets/scripts/server/index.js

Listening on PORT 3003
```

Success!!

You you do not see this message and are having trouble getting set up, please join us on [Slack](https://join.slack.com/t/openscopeatc/shared_invite/zt-g9wq2mch-B7Z9IltlgxgCBC2dBYPjiw) and someone will be able to troubleshoot with you.

For more information on the available tools, please view the [Tools Readme](tools/README.md).

## Contributing

We do not use forks. Instead, we add to add all contributors to the openScope organization. This way, we can keep all branches local to the organization, and use testing integrations on pull requests. If you are interested in contributing, _please message Erik Quinn or Nate Geslin on slack_ so you can be added to the organization.

We use the [GitFlow Branching Model](http://nvie.com/posts/a-successful-git-branching-model) for managing branches.  If you would like to contribute, you will be expected to use appropriate branch names based on this methodology (and we can help if you have questions).

Don't know Javascript?  That's cool, we're always looking for beta testers and/or airport contributors.  If you would like to add a new airport, or help update existing airports, please read the [Airport Format Documentation](documentation/airport-format.md) and [Airport File Standards Documentation](documentation/airport-file-standards.md) to get up to speed on what is expected in that file.

## Privacy Disclosures

We use Google Analytics for gathering data about how our app is used. See [Event Tracking](documentation/event-tracking.md) for more information.

## License

[MIT License](LICENSE.md)
