- In the current version you need to switch to reading mode before exporting a PDF.
- Use the plugin command 'rebuildCurrent' (default hotkey `F5`) in editing mode to refresh.
    - It is recommended to refresh once before exporting a PDF, then switch to reading mode and export.
    - When used outside tables, it will refresh the active leaf.
    - When used in a normal table cell, it will refresh the table. Avoid placing your cursor in a signifier cell.
    - When used in a merged table cell, it will unmerge the cell, and the cell will become a normal cell.
- Do not use the up Sign in the first row of the table body; that is, do not merge the table header and the table body.

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
