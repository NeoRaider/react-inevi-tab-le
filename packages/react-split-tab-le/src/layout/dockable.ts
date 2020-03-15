import { Map } from 'immutable';

import { ActionHandlerMap, ActionHandler } from 'react-inevi-tab-le/dist/layout/action';

import * as Pane from 'react-inevi-tab-le/dist/layout/pane';
const { selectTab, closeTab } = Pane;

import { insertElementAt, removeElement, removeElementAt, insertElementsAt } from './util';

export type Split = 'horizontal' | 'vertical';
export type Direction = 'left' | 'right' | 'top' | 'bottom';

export type DockableTab = [string, number];

export interface PaneLayout extends Pane.Layout {
	readonly parent: number;
	readonly split: 'none';
}

export interface SplitLayout {
	readonly parent: number;
	readonly split: Split;
	readonly children: ReadonlyArray<number>;
}

export type Layout = PaneLayout | SplitLayout;
export type LayoutMap = Map<number, Layout>;

export { selectTab, closeTab };

export type LayoutActionSelectTab = Pane.LayoutActionSelectTab<DockableTab>;
export type LayoutActionCloseTab = Pane.LayoutActionCloseTab<DockableTab>;

export interface LayoutActionMoveTab {
	type: 'moveTab';
	tab: DockableTab;
	dest: number;
	pos: number;
}

export function moveTab(tab: DockableTab, dest: number, pos: number): LayoutAction {
	return { type: 'moveTab', tab, dest, pos };
}

export interface LayoutActionMoveTabSplit {
	type: 'moveTabSplit';
	tab: DockableTab;
	dest: number;
	dir: Direction;
}

export function moveTabSplit(tab: DockableTab, dest: number, dir: Direction): LayoutAction {
	return { type: 'moveTabSplit', tab, dest, dir };
}

export type LayoutAction =
	| LayoutActionSelectTab
	| LayoutActionCloseTab
	| LayoutActionMoveTab
	| LayoutActionMoveTabSplit;

function dirToSplit(dir: Direction): Split {
	switch (dir) {
		case 'left':
		case 'right':
			return 'vertical';
		case 'top':
		case 'bottom':
			return 'horizontal';
	}
}

function corrupt(): never {
	throw new Error('Data corruption');
}

function insertLayoutChild(layout: Layout, child: number, pos: number): Layout {
	if (layout.split === 'none') {
		return layout;
	}

	return {
		...layout,
		children: insertElementAt(layout.children, child, pos),
	};
}

function unusedID(layouts: LayoutMap): number {
	for (let i = 1; ; i++) {
		if (!layouts.has(i)) {
			return i;
		}
	}
}

function getSplitLayout(layouts: LayoutMap, id: number): SplitLayout | null {
	const layout = layouts.get(id);
	if (!layout || layout.split === 'none') {
		return null;
	}
	return layout;
}

function getPaneLayout(layouts: LayoutMap, id: number): PaneLayout | null {
	const layout = layouts.get(id);
	if (!layout || layout.split !== 'none') {
		return null;
	}
	return layout;
}

// Similar to Map.prototype.update(), but ignores missing elements and split layouts
function updatePaneLayout(layouts: LayoutMap, id: number, action: Pane.LayoutAction): LayoutMap {
	const layout = layouts.get(id);
	if (layout && layout.split === 'none') {
		layouts = layouts.set(id, Pane.reducer(layout, action));
	}
	return layouts;
}

function reparentChildren(layouts: LayoutMap, children: ReadonlyArray<number>, parent: number): LayoutMap {
	for (const child of children) {
		const childLayout = layouts.get(child) || corrupt();
		layouts = layouts.set(child, { ...childLayout, parent });
	}

	return layouts;
}

function moveLayout(layouts: LayoutMap, from: number, to: number, parent: number): LayoutMap {
	const layout = layouts.get(from) || corrupt();

	layouts = layouts.delete(from);
	layouts = layouts.set(to, { ...layout, parent });

	if (layout.split !== 'none') {
		layouts = reparentChildren(layouts, layout.children, to);
	}

	return layouts;
}

function checkMerge(layouts: LayoutMap, id: number): LayoutMap {
	const layout = layouts.get(id) || corrupt();

	const { parent } = layout;
	if (!parent || layout.split === 'none') {
		return layouts;
	}

	const parentLayout = getSplitLayout(layouts, parent) || corrupt();
	if (parentLayout.split !== layout.split) {
		return layouts;
	}

	const index = parentLayout.children.indexOf(id);
	if (index < 0) {
		corrupt();
	}

	const children = insertElementsAt(removeElementAt(parentLayout.children, index), layout.children, index);
	layouts = layouts.set(parent, { ...parentLayout, children });
	layouts = layouts.delete(id);
	layouts = reparentChildren(layouts, layout.children, parent);

	return layouts;
}

function checkUnsplit(layouts: LayoutMap, pane: number): LayoutMap {
	const paneLayout = getPaneLayout(layouts, pane);
	if (!paneLayout || paneLayout.order.length > 0 || !paneLayout.parent) {
		return layouts;
	}

	layouts = layouts.delete(pane);

	const parent = paneLayout.parent;
	const parentLayout = getSplitLayout(layouts, parent) || corrupt();
	const remaining = removeElement(parentLayout.children, pane);

	if (remaining.length > 1) {
		return layouts.set(parent, { ...parentLayout, children: remaining });
	}

	layouts = moveLayout(layouts, remaining[0], parent, parentLayout.parent);
	return checkMerge(layouts, parent);
}

const HANDLERS: ActionHandlerMap<LayoutAction, LayoutMap> = {
	selectTab(layouts: LayoutMap, { tab: [tab, pane] }: LayoutActionSelectTab): LayoutMap {
		return updatePaneLayout(layouts, pane, Pane.selectTab(tab));
	},

	closeTab(layouts: LayoutMap, { tab: [tab, pane] }: LayoutActionCloseTab): LayoutMap {
		layouts = updatePaneLayout(layouts, pane, Pane.closeTab(tab));
		return checkUnsplit(layouts, pane);
	},

	moveTab(layouts: LayoutMap, { tab: [tab, source], dest, pos }: LayoutActionMoveTab): LayoutMap {
		if (source === dest) {
			return updatePaneLayout(layouts, source, Pane.moveTab(tab, pos));
		}

		const sourceLayout = getPaneLayout(layouts, source);
		const destLayout = getPaneLayout(layouts, dest);

		if (!sourceLayout || !destLayout || sourceLayout.order.indexOf(tab) < 0) {
			return layouts;
		}

		layouts = layouts.set(source, Pane.reducer(sourceLayout, Pane.closeTab(tab)));
		layouts = layouts.set(dest, Pane.reducer(destLayout, Pane.insertTab(tab, pos)));

		return checkUnsplit(layouts, source);
	},

	moveTabSplit(layouts: LayoutMap, { tab: [tab, source], dest, dir }: LayoutActionMoveTabSplit): LayoutMap {
		const destLayout = getPaneLayout(layouts, dest);
		if (!destLayout) {
			return layouts;
		}
		if (source === dest && destLayout.order.length === 1) {
			return layouts;
		}

		const split = dirToSplit(dir);

		let parent = 0;
		let index = 0;

		if (destLayout.parent) {
			const destParentLayout = getSplitLayout(layouts, destLayout.parent) || corrupt();
			if (destParentLayout.split === split) {
				parent = destLayout.parent;
				index = destParentLayout.children.indexOf(dest);
				if (index < 0) {
					corrupt();
				}
			}
		}

		if (!parent) {
			parent = dest;

			const moved = unusedID(layouts);
			layouts = moveLayout(layouts, dest, moved, parent);
			layouts = layouts.set(parent, {
				parent: destLayout.parent,
				split,
				children: [moved],
			});

			if (source === dest) {
				source = moved;
			}
		}

		if (dir === 'right' || dir === 'bottom') {
			index++;
		}

		const newID = unusedID(layouts);
		layouts = layouts.set(newID, {
			split: 'none',
			parent,
			order: [],
			active: null,
		});
		layouts = layouts.update(parent, (layout) => insertLayoutChild(layout, newID, index));

		// eslint-disable-next-line @typescript-eslint/no-use-before-define
		return reducer(layouts, moveTab([tab, source], newID, 0));
	},
};

export function reducer(layouts: LayoutMap, action: LayoutAction): LayoutMap {
	const handler = HANDLERS[action.type] as ActionHandler<LayoutAction, LayoutMap, typeof action.type>;
	return handler(layouts, action);
}
