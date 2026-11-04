// What a shortcut does to the page: focus or click an element, move the selection of a Matrix or DataTable

export type TAction =
  | 'focus'
  | 'click'
  | 'event'
  | 'previousRow'
  | 'nextRow'
  | 'previousItem'
  | 'nextItem'
  | 'openRow';

export interface IShortcut {
  keys: string; // "mod+k", "g b", "arrowdown"
  action: TAction;
  target?: string; // CSS class ("bk_search") or selector (".bk_list", "#id", "[data-x]")
  id?: string; // name passed to the onShortcut event and written to the bound datasource
  when?: string; // only while the focus is inside this element (CSS class or selector); then also while typing
  disabled?: boolean;
}

const FOCUSABLE =
  'input:not([type=hidden]), textarea, select, button, [tabindex]:not([tabindex="-1"]), [contenteditable=true]';
const LISTS = '.fd-matrix, .fd-datatable';

// A bare word is a CSS class; anything else (".a, .b input", "#id") is a selector
export const toSelector = (target: string) =>
  /^[.#[]/.test(target) || /[\s>:,]/.test(target) ? target : `.${target}`;

export const isVisible = (el: Element) => {
  const r = (el as HTMLElement).getBoundingClientRect?.();
  return !!r && r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
};

// Not covered by a dialog overlay or a side sheet: the element is what the user sees at its center
const isOnTop = (el: Element) => {
  const r = el.getBoundingClientRect();
  const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return !!hit && (hit === el || el.contains(hit) || hit.contains(el));
};

// The first visible element matching the target, preferring one that no overlay covers
// (onTopOnly: only an uncovered one, for clicks)
export function findTarget(target?: string, onTopOnly = false): HTMLElement | null {
  if (!target?.trim()) return null;
  let found: Element[] = [];
  try {
    found = [...document.querySelectorAll(toSelector(target.trim()))];
  } catch {
    return null;
  }
  const visible = found.filter(isVisible);
  return (visible.find(isOnTop) ?? (onTopOnly ? null : visible[0]) ?? null) as HTMLElement | null;
}

// The target may appear a moment later (a previous row of the same shortcut opened it): wait up to ~0.5 s
export async function focusTarget(target?: string): Promise<boolean> {
  let el = findTarget(target);
  for (let i = 0; !el && i < 15; i++) {
    await frame();
    el = findTarget(target);
  }
  if (!el) return false;
  const field = el.matches(FOCUSABLE) ? el : el.querySelector<HTMLElement>(FOCUSABLE);
  if (!field) return false;
  field.focus();
  if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) field.select();
  return true;
}

// Only what the user could click: never an element under a dialog overlay or a side sheet
export function clickTarget(target?: string): boolean {
  const el = findTarget(target, true);
  if (!el) return false;
  el.click();
  return true;
}

// ---------- lists ----------

let lastList: Element | null = null;

// The list a row move applies to when the shortcut names none: the last list used, else the only visible one
export function trackLists(e: Event) {
  const list = (e.target as Element | null)?.closest?.(LISTS);
  if (list) lastList = list;
}

// The lists a target names (a list, or an element holding several, e.g. a dropdown with sections) and the one
// to move in: the last list used among them, else the first
function resolveLists(target?: string): { lists: Element[]; list: Element | null } {
  const named = findTarget(target);
  let lists: Element[];
  if (named) {
    lists = named.matches(LISTS) ? [named] : [...named.querySelectorAll(LISTS)].filter(isVisible);
  } else if (lastList?.isConnected && isVisible(lastList)) {
    lists = [lastList];
  } else {
    const visible = [...document.querySelectorAll(LISTS)].filter(isVisible);
    lists = visible.length === 1 ? visible : [];
  }
  const list = lists.find((l) => l === lastList) ?? lists[0] ?? null;
  return { lists, list };
}

const rowsOf = (list: Element): HTMLElement[] =>
  [...(list.querySelector('.innerScrollContainer')?.children ?? [])]
    .filter((r): r is HTMLElement => r instanceof HTMLElement && r.offsetHeight > 0)
    .sort((a, b) => a.offsetTop - b.offsetTop || a.offsetLeft - b.offsetLeft);

const isSelected = (r: Element) =>
  r.classList.contains('selected') || !!r.querySelector(':scope > .selected');

const frame = () =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

// Selects a row the way Qodly does on a click of the row itself: the list's On Select runs, the row's content
// (and its own On Click) does not. openRow clicks the content.
function selectRow(list: Element, scroller: HTMLElement, row: HTMLElement) {
  reveal(scroller, row);
  lastList = list;
  row.click();
}

// Next or previous row (vertically: the cell below / above in a mosaic), or item (reading order). Rows are
// virtualised: when the neighbour is not rendered yet, scroll by one row and look again. Past the end of a
// list, moves on to the next list of the target (sections of a dropdown).
export async function moveInList(
  target: string | undefined,
  step: 1 | -1,
  byRow: boolean,
): Promise<boolean> {
  const { lists, list } = resolveLists(target);
  const scroller = list?.querySelector('.innerScrollContainer')?.parentElement;
  if (!list || !scroller) return false;
  for (let attempt = 0; attempt < 4; attempt++) {
    const rows = rowsOf(list);
    const current = rows.find(isSelected);
    let next: HTMLElement | undefined;
    if (!current) {
      // nothing selected (or scrolled away): the first row in view
      next = rows.find((r) => r.offsetTop + r.offsetHeight > scroller.scrollTop) ?? rows[0];
    } else if (byRow) {
      const others = rows.filter((r) =>
        step > 0 ? r.offsetTop > current.offsetTop : r.offsetTop < current.offsetTop,
      );
      const top =
        step > 0
          ? Math.min(...others.map((r) => r.offsetTop))
          : Math.max(...others.map((r) => r.offsetTop));
      next = others
        .filter((r) => r.offsetTop === top)
        .sort(
          (a, b) =>
            Math.abs(a.offsetLeft - current.offsetLeft) -
            Math.abs(b.offsetLeft - current.offsetLeft),
        )[0];
    } else {
      next = rows[rows.indexOf(current) + step];
    }
    if (next) {
      selectRow(list, scroller, next);
      return true;
    }
    // neighbour not rendered: scroll one row and retry, unless already at the end
    const before = scroller.scrollTop;
    scroller.scrollTop += step * (current?.offsetHeight || 40);
    if (scroller.scrollTop === before) break;
    await frame();
  }
  // at the end of this list: the first (or last) row of the next (or previous) list of the target
  const other = lists[lists.indexOf(list) + step];
  const otherScroller = other?.querySelector('.innerScrollContainer')?.parentElement;
  if (!other || !otherScroller) return false;
  const rows = rowsOf(other);
  const row = step > 0 ? rows[0] : rows[rows.length - 1];
  if (!row) return false;
  selectRow(other, otherScroller, row);
  return true;
}

// Enter on a highlighted row: clicks its content, so the row's own On Click actions run
export function openRow(target?: string): boolean {
  const { list } = resolveLists(target);
  const row = list ? rowsOf(list).find(isSelected) : undefined;
  if (!row) return false;
  ((row.firstElementChild as HTMLElement | null) ?? row).click();
  return true;
}

function reveal(scroller: HTMLElement, row: HTMLElement) {
  if (row.offsetTop < scroller.scrollTop) scroller.scrollTop = row.offsetTop;
  else if (row.offsetTop + row.offsetHeight > scroller.scrollTop + scroller.clientHeight) {
    scroller.scrollTop = row.offsetTop + row.offsetHeight - scroller.clientHeight;
  }
}
