# Sheets Basic

中文介绍见 [Obsidian Chinese Forum t35091](https://forum-zh.obsidian.md/t/topic/35091/1)

- Use the plugin command 'rebuildCurrent' (default hotkey `F5`) if you encounter any problems.
    - When used in a merged table cell, it will unmerge the cell, and the cell will become a normal cell.
    - When used in a normal table cell, it will refresh the table. Avoid placing your cursor in a signifier cell.
    - When used outside tables, it will refresh the active leaf.
- Switch to reading mode before exporting a PDF. It is recommended to refresh once before the export.
    - Because Obsidian has a reading mode cache, and no method is provided to precisely clear the cache currently.
    - The same applies before starting a slide presentation.
- Do not use the up Sign in the first row of the table body; that is, do not merge the table header and body.

<details>
<summary>Test text, click to unfold</summary>

````markdown
| head1 | <                       |
| ----- | ----------------------- |
|       | ![\|50](_test.png) [^1] |
|       | ^                       |

[^1]: footnote1

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

(2025-04-22) Test in Obsidian v1.8.10 Sandbox Vault. left: Live Preview; right: Reading Mode:

<image width="420" src="https://github.com/user-attachments/assets/1a6da7db-33ee-44c0-bd31-5f13725944d2">

## For Developers

不推荐二次开发，因为官方不赞成主要功能参涉私有接口，这样做不划算。

It is not recommended for secondary development because the official does not advocate that the main functions involve private APIs of Obsidian. It's not cost-effective.
