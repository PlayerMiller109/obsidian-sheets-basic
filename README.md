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

(2024-10-16) Test in Obsidian v1.6.7 Sandbox Vault:

<image width="420" src="https://github.com/user-attachments/assets/d226b8da-c887-4c03-9276-a96879b1f91a">
<br><sup>left: Live Preview; right: Reading Mode</sup>
