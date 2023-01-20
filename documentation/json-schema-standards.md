# JSON Schema Standards

## Overview

### Rationale

We use lots of JSON files to store various types of data, including simulator content such as aircraft, airlines and airports,
but also for configuration, e.g. the airport load list, and for other features, such as autcomplete and the tutorial. There is 
developer documentation that details the structure and format of some of these files, but even those sometimes get outdated as
new features get implemented.

[Issue #1777](https://github.com/openscope/openscope/issues/1777) is an initiative to adopt automatic JSON validation as part of
our development workflow. This will help with catching problems in JSON files, which has hitherto relied primarily on manual
review of pull requests and playtesting.

### What is JSON Schema?

[JSON Schema](https://json-schema.org/understanding-json-schema/about.html) is a specification that provides a way to describe
the structure of JSON data. Itself written in JSON, it offers a human- & machine-readable method to encode the data formats of
our JSON files. This helps serve as documentation of our data formats, and can be used to perform automated testing to ensure
that data is valid.

### This Document

This document outlines standards and conventions for JSON Schema used throughout this repository, providing for a greater level
of consistency beyond simply complying with the JSON Schema specification (i.e. being a valid JSON Schema). Just as coding
conventions improve the readability and maintainability of code, this document provides a checklist to help ensure that our
JSON Schema files look consistent with one another, and enforces a bare minimum level of information required to provide
meaningful documentation of the data formats being described.

As we are just beginning to adopt JSON Schema, this document currently only serves as a starting point. These conventions may
evolve to meet emerging needs as we gradually expand the use of JSON Schema and automatic validation to cover more types of
JSON data and files.

---

### JSON Schema Documents

Files with extension `*.schema.json`; these must:

- identify the version of JSON Schema meta-schema used, e.g.:  
  `"$schema": "https://json-schema.org/draft/2019-09/schema"`
- validate against the meta-schema specified (= be a valid schema)
- have `$id` specifying its absolute URI in the root schema  
  this should match glob `http://openscope.io/assets/**/*.schema.json`
- have a `title`; `description` is optional
- order: `$schema`, `$id`, `title`, `description` (optional), `type`, then etc.; and finally `$defs` (if any)

### Sub-schemas

i.e. each described field/property; these must:

- provide an explanatory `description`; `title` is optional
  - exception: description optional when inlining a re-usable sub-schema via `"$ref": "..."`  
    these would already have been described in their own definition, and have a meaningful name
  - exception: description optional for arrays using list validation  
    it's a list of whatever is described under its `items`, so further explanation may be elided to avoid being redundant
    - arrays using tuple validation are not exempt!
- order: `title` (optional), `description`, `type`, then etc.

### Re-usable Sub-schemas

These must:

- be defined in `$defs` property of root schema
  - do not use `definitions` (obsolete method, but still appears in some older tutorials/docs)
  - for ease of lookup, must be immediate child of `$defs`, not nested elsewhere
- be defined under a camelCase key, e.g. `tutorialStep`
  - key is a straightforward noun describing what it is
  - do not append "definition"/"def" e.g. ~`tutorialStepDefinition`~ / ~`tutorialStepDef`~
- have `$anchor` value, identical to the key
  - do not use `$id`!
- order: `$anchor`, `title` (optional), `description`, `type`, then etc.

### Comments

JSON does not allow javascript-style comments; these are workarounds that we use

- `$comment`
  - this key is defined by the JSON Schema specification as a way to add comments in schema documents

- `_comment`
  - standardized key to be used for comments in JSON files
  - this should be included as an allowable optional property of objects wherever someone might reasonably want to add a dev comment about the data in a JSON file
