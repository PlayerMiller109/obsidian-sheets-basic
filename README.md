- In the current version you need to switch to reading mode before exporting PDF.
- If there are any unsatisfactory display results, you can use the plugin 'rebuildCurrent' command in editing mode to refresh (default hotkey `F5`).
    - It is recommended to refresh once before exporting PDF, then switch to reading mode and export.
- Do not use the upper merge in the first row of the table body, that is, do not merge the table header and the table body.

<details>
<summary>Test text, click to unfold</summary>

````markdown
| head1 | <      |
| ----- | ------ |
|       | table1 |
|       | ^      |

> | head2 | <      |
> | ----- | ------ |
> |       | table2 |
> |       | ^      |
> 
> | head3 | <      |
> | ----- | ------ |
> |       | table3 |
> |       | ^      |

> [!quote]
> | head4 | <      |
> | ----- | ------ |
> |       | table4 |
> |       | ^      |
> 
> | head5 | <      |
> | ----- | ------ |
> |       | table5 |
> |       | ^      |

```sheet
| head6 | <      |
| ----- | ------ |
|       | table6 |
|       | ^      |
```
````
</details>

(2024-06-24) Test in Obsidian v1.6.3 Sandbox Vault:

<div>
  <image width="420" src="https://github.com/PlayerMiller109/obsidian-sheets-basic/assets/145541890/4bdeae8a-d5e3-4baf-a40a-b7940a94467d">
  <br><sup>left: Live Preview; right: Reading Mode</sup>
</div>