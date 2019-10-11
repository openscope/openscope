# Scope Command Reference

Below is a detailed list outlining all of the available scope commands, including what they do, how to use them, and information on how they fit into the workflow of an air traffic controller.

Other than moving the data block or accepting handoffs, most commands require that the radar target be under your scope's control.

Please note that the bracketed words (and brackets themselves) used in the syntax examples should be replaced with the appropriate data. Also note that `CID` was used in the examples, but aircraft may be referenced with any of ~~(a) the CID~~, (b) the full callsign, or ~~(c) the squawk code~~.

## Table of Contents

~~### Accept Handoff~~
~~_Syntax -_ `[CID]`~~
~~_Description -_ This accepts a _pending, incoming_ handoff from another sector, thus giving the receiving sector control of the track.~~
~~_More Info -_ **THIS COMMAND IS NOT YET AVAILABLE**~~

~~### Amend Altitude~~
~~_Syntax -_ `QZ [FL] [CID]`~~
~~_Shortcut -_ `[F8] [FL] [CID]`~~
~~_Description -_ This accepts a _pending, incoming_ handoff from another sector, thus giving the receiving sector control of the track.~~
~~_More Info -_ **THIS COMMAND IS NOT YET AVAILABLE**~~

~~### Initiate Handoff~~
~~_Syntax -_ `[sector handoff code] [CID]`~~
~~_Description -_ This initiates a handoff to another sector, which they must accept to transfer control of the track.~~
~~_More Info -_ **THIS COMMAND IS NOT YET AVAILABLE**~~

### Move Data Block

_Syntax -_ `[direction] [CID]` or `[direction]/[length] [CID]` or `/[length] CID`
_Description -_ This command will move the leader line and data block for the specified radar target to the specified direction and/or length. Note that the direction is based on the physical placement of the buttons on a standard computer's numberpad (shown below). So position `8` is directly _up_, position `1` is down and to the left, etc. Position `5` is also available as another way to "shortstem" the data block, so it is centered directly over the target. Position `0` is not used. Leader line lengths 0 through 6 are permitted only.

```text
7 8 9
4 5 6
1 2 3
```

_More Info -_ On real ATC systems, moving the data block is sometimes used by controllers to indicate the status of the aircraft, in reference to whether or not they have been told to do something yet (for instance, approach might move all the blocks down for a/c that have been switched to tower frequency).

~~### Propogate Data Block (and Point Out)~~
~~_Syntax -_ `QP [CID]` or `QP [sector handoff code] [CID]`~~
~~_Shortcut -_ `[F10] [CID]` or `[F10] [sector handoff code] [CID]`~~

~~_Description -_ This controls whether a data block for a given target is suppressed on the specified scope. When no sector code is specified, this will toggle suppression of the data block on _your_ scope. You can also force a data block to appear (but not disappear) on another controller's scope by including the sector's handoff code. _Note that targets may not be suppressed on the scope who owns the track._~~

~~_More Info -_ **THIS COMMAND IS NOT YET AVAILABLE**~~

~~### Route~~
~~_Syntax -_ `QR [CID]` or `QR [new partial/full route string] [CID]`~~
~~_Shortcut -_ `[F6] [CID]` or `[F6] [new partial/full route string] [CID]`~~

~~_Description -_ This command can perform two unique functions. When only the CID is provided, the last known route for the specified target will be toggled on the scope. And when a route string (with or without continuity with previous route) is provided, the route stored in the scope for that flight will be combined with or changed to the route provided.~~

~~_More Info -_ **THIS COMMAND IS NOT YET AVAILABLE**~~

### Set Scratch Pad~~

_Syntax -_ `[scratchpad text] [CID]`

_Description -_ This will amend the value stored in the target's data block's scratch pad. This value can be a maximum of three alphanumeric characters.~~

More Info -

### Toggle Halo

_Syntax -_ `QP_J [CID]` or `QP_J [radius] [CID]`
_Shortcut -_ `[F7] [CID]` or `[F7] [radius] [CID]`

_Description -_ This toggles a circle around the center of the radar target, with a radius you can specify in the command. If the radius is not specified, the default halo size will be used (generally 3nm for terminal, or 5nm for en route).

_More Info -_ Note that if a resized halo exists, entering `[F7] [CID]` will actually be interpreted by the system as `[F7] 3 [CID]`-- meaning the halo will be resized to 3nm, not removed. With the halo back to 3nm, entering `[F7] [CID]` again will remove the halo. If you add a 10nm halo with `[F7] 10 [CID]`, it can be removed instead of resized by specifying `[F7] 10 [CID]`, or use the above method of entering `[F7] [CID]` twice.
