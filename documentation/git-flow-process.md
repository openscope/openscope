## Git Flow Process

The post linked below has a thorough explanation of a very effective git branching strategy. Though slightly modified, our branching strategy and conventions are based heavily on this write-up.

[http://nvie.com/posts/a-successful-git-branching-model/](http://nvie.com/posts/a-successful-git-branching-model/)

Below you will find a helpful flow chart showing the exact git branching strategy employed at openScope. Additional information on the phases of our development lifecycle can be found [here](development-processes-checklists.md).

```
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
