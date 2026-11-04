# Qodly Keyboard Shortcuts

A [Qodly](https://developer.4d.com/qodly/) custom component that adds keyboard shortcuts to a page, without code.

Drop it on a page and list the shortcuts. Each one can:

- **focus** an element (⌘K / Ctrl+K focuses the search box),
- **click** an element (N clicks "New booking", so the button's own events run),
- move to the **next or previous row** of a Matrix or DataTable (↑ / ↓), which selects it as a click on the row
  would, and **open** the selected row (Enter clicks its content, so the row's own On Click runs),
- fire the component's **On Shortcut** event, so any standard action or server function can run.

The component listens while its page is shown and renders nothing at runtime. Put it on the outer page (the
shell that hosts the page loader) to have the shortcuts everywhere.

> Status: 0.2. Tested with 4D 21 (Qodly renderer 1.43).

## Install

Download `qodly-keyboard-shortcuts_v<version>.zip` from the [latest release](https://github.com/mathieu-ferry/qodly-keyboard-shortcuts/releases/latest), then upload it in Qodly Studio: see [Installing a custom component](https://developer.4d.com/qodly/4DQodlyPro/pageLoaders/components/uploadCustomComponents#installing-custom-component). **Keyboard shortcuts** then appears in the Studio component list.

## Example

| Keys | Action | Target |
| --- | --- | --- |
| `mod+k` | Click an element | `openSearch` |
| `mod+k` | Focus an element | `.searchBox, .fp-field-text .fp-input` |
| `arrowdown` | Next row (list) | |
| `arrowup` | Previous row (list) | |
| `g n` | Fire On Shortcut | (name `newBooking`) |

A search field with a dropdown of results (a box `searchBox` around the input, a `results` element holding one
or more lists):

| Keys | Action | Target | Only when focus is in |
| --- | --- | --- | --- |
| `arrowdown` / `arrowup` | Next row / Previous row | `results` | `searchBox` |
| `enter` | Open selected row | `results` | `searchBox` |
| `escape` | Click an element | `clearButton` | `searchBox` |

↑ / ↓ only highlight a row (the list's On Select runs); put the "open" actions on the row's On Click, which a
mouse click and Enter both trigger. With several lists in the target (sections), moving past the end of one
goes on to the next.

Rows with the same keys all run, in order: here ⌘K first clicks a "More filters" button (class `openSearch`)
when one is visible, then focuses the search field once it shows. The arrow keys move through the list the user
last clicked, or the only list on screen.

## Setup in Qodly Studio

1. Install the component (see [Install](#install)).
2. Drop **Keyboard shortcuts** on a page (it shows as a small chip in the editor).
3. Add one row per shortcut in **Shortcuts**.

### Shortcuts

| Setting | Meaning |
| --- | --- |
| Keys | One combination (`mod+k`, `ctrl+shift+f`, `escape`, `arrowdown`, `?`) or a sequence separated by spaces (`g b`: press g, then b within a second). `mod` is ⌘ on macOS and Ctrl elsewhere. Aliases: `esc`, `up`, `down`, `left`, `right`, `space`, `return`, `del`, `cmd`, `option`. |
| Action | `Focus an element`, `Click an element`, `Fire On Shortcut`, `Next row` / `Previous row` (the row below / above, also in a mosaic grid), `Next item` / `Previous item` (reading order), `Open selected row` (clicks the selected row's content). |
| Target | A CSS class (`searchBox`) or a selector (`.list`, `#id`, `.a, .b input`). Focus picks the first visible match that no dialog covers and focuses it, or the first field inside it. Click only clicks an element the user can see and reach. For row moves, the Matrix or DataTable (or an element around it); empty: the list last clicked, else the only visible one. |
| Only when focus is in | A CSS class or selector: the row only listens while the focus is inside it, and then also while typing (↑ / ↓ / Enter / Esc in a search field driving its dropdown). |
| Name (On Shortcut) | Passed to the On Shortcut event and written to the bound datasource (default: the keys). |
| Disabled | Keeps the row without listening to it. |

**Last shortcut (string)**: optional scalar datasource set to the shortcut's name before On Shortcut fires, so
the event's actions can tell shortcuts apart.

### While typing

In an input, a text area, a select or editable text, only combinations with ⌘ / Ctrl / Alt and Escape fire:
single keys (`n`, `g b`, `?`) and the arrows keep their usual meaning, except in rows scoped with **Only when
focus is in**.

### Events

| Event | When |
| --- | --- |
| On Shortcut | A `Fire On Shortcut` row matched. The event data holds `id` and `keys`. |

## Build from source

```bash
npm install
npm run build   # creates qodly_<app_id>.zip, the same file as a release
```

Upload the zip in Qodly Studio, or unzip it in `Project/Sources/Shared/CustomComponents/qodly_<app_id>/` and add its `manifest.json` entry (with `url`) to `Shared/CustomComponents/manifest.json`.

To publish a release, set `version` in `package.json`, then push a matching tag (`git tag v0.2.0 && git push origin v0.2.0`): the `release` workflow builds the zip and attaches it to a new GitHub release.

`@module-federation/vite` is pinned to 1.8.1: later versions bundle the shared `@ws-ui/webform-editor` fallback eagerly, with a bare `import '@ws-ui/code-editor'` the renderer cannot resolve, and the component is reported as "not resolved".

## How it works

One `keydown` listener on the window (capture phase), installed while the page is shown. Row moves read the
virtual grid of the Matrix or DataTable (`.innerScrollContainer` rows, `.selected` on the current one), click
the neighbour row and scroll it into view; when the neighbour is not rendered yet, they scroll by one row and
look again.

## Development

```bash
npm run dev   # standalone editor on http://localhost:5001, proxied to the 4D server (see .env.example)
```
