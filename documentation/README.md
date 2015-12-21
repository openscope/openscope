---
title: Documentation
---
[back to index](index.html)

# Documentation guide

This documentation is maintained as a
[Github pages](https://help.github.com/articles/using-jekyll-with-pages/)
[Jekyll](jekyllrb.com) site.  Individual pages should be markdown
format, when pushed to github these will be automatically converted to
html.

To add a new page add a link to the new page in `index.md`
(remembering that .md files will be converted to .html on
deployment).  Then create a new file in this folder of the appropriate name.

In order to be converted all `.md` files must begin with

```
---
title: <some title>
---
```

See the [jekyll documentation](http://jekyllrb.com/docs/home/)
for more information.
