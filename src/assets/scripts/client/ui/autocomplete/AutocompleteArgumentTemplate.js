export const AUTOCOMPLETE_ARGUMENT_TEMPLATE = `
<table>
{{#each paramsets}}
<tr class="{{validity}}">
    <td class="autocomplete-suggestion">{{../command}} {{{example}}}</td>
    <td class="autocomplete-param-explanation">{{{explain}}}</td>
</tr>
{{else}}
<tr class="{{validity}}">
    <td class="autocomplete-param-explanation">This command does not accept arguments</td>
</tr>
{{/each}}
</table>
`;
