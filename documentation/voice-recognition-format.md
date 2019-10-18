# Voice Recognition Format

## Example Voice Recognition File
```javascript
{
    "meaning": "heading r",
    "transcriptions":  [
        "turn right to heading",
        "turn white to heading",
        "turn right heading",
        "turn white heading",
        "turn right to",
        "turn right",
        "heading right to",
        "heading right",
        "heading white to",
        "heading white"
    ]
}
```

## Notes
**meaning**: any existing [aircraft command](aircraft-commands.md)

**transcriptions**: each possible word combination which could be interpreted for the meaning
If you think, that some crazy things can improve the quality don't hesitate to write them down.
i.e.:
- `to` instead of `two`
- `white` instead of `right` 
