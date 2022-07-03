export const AUTOCOMPLETE_COMMAND_TEMPLATE = `
<table>
{{#each this}}
<tr data-command="{{command}}">
    <td class="autocomplete-suggestion">{{command}}</td>
    <td>{{{explanation}}}</td>
</tr>
{{else}}
<tr>
    <td>No matching commands</td>
</tr>
{{/each}}
</table>
`;
