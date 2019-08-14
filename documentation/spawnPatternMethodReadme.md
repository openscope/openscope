# spawnPattern methods

At the very least, an arrival stream MUST have definitions for the
following parameters. Additional may be required if the spawn method
is set to one other than 'random'.

```text
            BARE MINIMUM PARAMETERS:
   PARAMETER   REQ      PARAMETER DESCRIPTION
+-------------+---+-------------------------------+
| 'airlines'  | * | weighted array of airlines    |
+-------------+---+-------------------------------+
| 'altitude'  | * | altitude to spawn at          |
+-------------+---+-------------------------------+
| 'frequency' | * | spawn rate, aircraft per hour |
+-------------+---+-------------------------------+
| 'heading'   | * | heading to fly on spawn       |
|    (OR)     |   |                               |
|  'fixes'    | * | array of fixes to go to       |
|    (OR)     |   |                               |
|  'route'    | * | properly formatted route*     |
+-------------+---+-------------------------------+
| 'speed'     | * | speed to spawn at (knots)     |
+-------------+---+-------------------------------+
  * *see index.md for route format (ex: 'BSR.BSR1.KSFO')*
```

## Random (default)

If the 'type' key is omitted, this spawning method will be used. The
aircraft will be spawned at random intervals that average out to achieve
the prescribed spawn rate. Thus, you may randomly get some back-to-back,
and some massive gaps in your traffic, just as it is most likely to occur
in real life.

```text
       PARAMETERS SPECIFIC TO 'RANDOM':
+-----------------------------------------------+
| only the "bare minimum parameters" are needed |
+-----------------------------------------------+
```

## Cyclic

The cyclic algorithm creates a stream of varying density. This will be more
predictable than 'random', and can be shaped to your liking. Basically, you
define the 'frequency', which is the average spawn rate, and an additional
'variance' parameter that adds some swells and lulls in the traffic. During
the cycle, the spawn rate will range throughout frequency +/- variation in
a linear fashion. Spawn rate will start at 'frequency', and steadily
increase to ('frequency' + 'variation'), then steadily decrease to
('frequency' - 'variation').

```text
               PARAMETERS SPECIFIC TO 'CYCLIC':
   PARAMETER   REQ        PARAMETER DESCRIPTION         DEFAULT
+-------------+---+------------------------------------+-------+
| 'offset'    |   | min into the cycle to start at     | 0     |
+-------------+---+------------------------------------+-------+
| 'period'    |   | length of each cycle, in minutes   | 30    |
+-------------+---+------------------------------------+-------+
| 'variation' | * | the amount to +/- from 'frequency' | 0     |
+-------------+---+------------------------------------+-------+
|     (also include "bare minimum parameters" - see above)     |
+--------------------------------------------------------------+
```

## Wave

The wave algorithm works exactly like the cyclic algorithm, however,
instead of a linear shift between arrival rates, the arrival rate will
vary throughout ('frequency' +/- 'variation') in a sinusoidal pattern.
As a result, less time will be spent right at the average, and the flow
of traffic will have changes in arrival rates that come along slightly
sooner. Overall, very similar to cyclic though.

```text
                PARAMETERS SPECIFIC TO 'WAVE':
   PARAMETER   REQ        PARAMETER DESCRIPTION         DEFAULT
+-------------+---+------------------------------------+-------+
| 'offset'    |   | min into the cycle to start at     | 0     |
+-------------+---+------------------------------------+-------+
| 'period'    |   | length of each cycle, in minutes   | 30    |
+-------------+---+------------------------------------+-------+
| 'variation' | * | the amount to +/- from 'frequency' | 0     |
+-------------+---+------------------------------------+-------+
|     (also include "bare minimum parameters" - see above)     |
+--------------------------------------------------------------+
```

## Surge

The surge algorithm generates a group of aircraft back to back. For departures
the spacing is 10 seconds, for arrivals, you can specify the entrail distance
while in and out of the "surge". This way, a "surge" can be gentle, or extreme,
and at any arrival rate.

Note that if you request something that's impossible to deliver, like either...

- "frequency": 50, "entrail": [ 7, 15] <-- even if all are 7MIT, that's 35acph
- "frequency": 7,  "entrail": [10, 25] <-- even if all are 25MIT, that's 10acph
- Note: The above assumes spawn speed of 250kts, for example purposes

...the sim will throw a warning in the console advising you that it has
clamped the arrival rate to match the entrail and speed settings, and it tells
you what range of frequencies it is mathematically capable of delivering.

```text
              PARAMETERS SPECIFIC TO 'SURGE':
  PARAMETER  REQ        PARAMETER DESCRIPTION         DEFAULT
+-----------+---+---------------------------------------------+-------+
| 'offset'  |   | min into the cycle to start at              | 0     |
+-----------+---+---------------------------------------------+-------+
| 'period'  |   | length of each cycle, in minutes            | 30    |
+-----------+---+---------------------------------------------+-------+
|           |   | array of:                                   |       |
| 'entrail' | * | [ miles between arrivals during the surge,  | [5.5, | <-- only for arrivals
|           |   |   miles between arrivals during the lull  ] |  10]  |
+-----------+---+---------------------------------------------+-------+
|        (also include "bare minimum parameters" - see above)         |
+---------------------------------------------------------------------+
```
