# Environments

We use several environments hosted on Heroku.

## Production

The [`production`](https://openscope-prod.herokuapp.com/) app is what you see when you visit [www.openscope.io](http://www.openscope.io). This app is synced with our `master` branch and should be considered _production_ code. We want to keep this app as reliable and pristine as possible. The code in this branch has been tested and verified to be working. Any bugs discovered here will be addressed during a sprint and merged back into this branch following the standard procedures.

## Staging

The [`staging`](https://staging.openscope.io/) app is used only briefly at the end of each sprint. This app is synced with the current `release/#.#.#` branch. It represents code that _will be_ merged into `master` and should be considered _production-ready_. It is vital that we diligently test this app before pushing any changes to `master`. We want to prevent exposing our users to any bugs or incomplete code.

## Develop

The [`develop`](https://dev.openscope.io) app is where bugfixes and feature development happens during the development phase of the sprint. Occasionally, things might break here, but every effort should be made to make sure that doesn't happen. At the end of a sprint we review, and fix, anything that may have broken through the course of development.

## Review Apps

The [`Review Apps`](https://devcenter.heroku.com/articles/github-integration-review-apps) can be created (by admins only) at the click of a button for any open pull request. This can be very useful for those times a specific branch needs to be shared with the wider development group to facilitate heavier testing. Or, if you are unable to build and host the app locally because you can continue to see the results of your changes.
