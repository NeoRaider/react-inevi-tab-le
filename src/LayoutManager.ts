import { Map } from 'immutable';

import { insertElementAt, moveElementAt, removeElement, removeElementAt } from './util';

export type Split = 'horizontal' | 'vertical';
export type Direction = 'left' | 'right' | 'top' | 'bottom';

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

export interface NestedSplitLayout {
	readonly split: Split;
	readonly children: ReadonlyArray<NestedLayout>;
}

export interface NestedPaneLayout {
	readonly split: 'none';
	readonly order: ReadonlyArray<string>;
	readonly active: string | null;
}

export type NestedLayout = NestedPaneLayout | NestedSplitLayout;

export interface SplitLayout {
	readonly id: number;
	readonly parent: number;
	readonly split: Split;
	readonly children: ReadonlyArray<number>;
}

export interface PaneLayout {
	readonly id: number;
	readonly parent: number;
	readonly split: 'none';
	readonly order: ReadonlyArray<string>;
	readonly active: string | null;
}

export type Layout = PaneLayout | SplitLayout;
export type LayoutMap = Map<number, Layout>;

export interface LayoutActionSelectTab {
	type: 'selectTab';
	tab: string;
	pane: number;
}

export interface LayoutActionCloseTab {
	type: 'closeTab';
	tab: string;
	pane: number;
}

export interface LayoutActionMoveTab {
	type: 'moveTab';
	tab: string;
	source: number;
	dest: number;
	pos: number;
}

export interface LayoutActionMoveTabSplit {
	type: 'moveTabSplit';
	tab: string;
	source: number;
	dest: number;
	dir: Direction;
}

export type LayoutAction =
	| LayoutActionSelectTab
	| LayoutActionCloseTab
	| LayoutActionMoveTab
	| LayoutActionMoveTabSplit;

export function selectTab(tab: string, pane: number): LayoutAction {
	return { type: 'selectTab', tab, pane };
}

export function closeTab(tab: string, pane: number): LayoutAction {
	return { type: 'closeTab', tab, pane };
}

export function moveTab(tab: string, source: number, dest: number, pos: number): LayoutAction {
	return { type: 'moveTab', tab, source, dest, pos };
}

export function moveTabSplit(tab: string, source: number, dest: number, dir: Direction): LayoutAction {
	return { type: 'moveTabSplit', tab, source, dest, dir };
}

function corrupt(): never {
	throw new Error('Data corruption');
}

function removeTab(layout: PaneLayout, tab: string): PaneLayout | null {
	const { active: prevActive, order: prevOrder } = layout;

	const index = prevOrder.indexOf(tab);
	if (index < 0) {
		return null;
	}

	const order = removeElementAt(prevOrder, index);

	let active = prevActive;
	if (tab === prevActive) {
		active = order[Math.min(index, order.length - 1)];
	}
	if (active === undefined) {
		active = null;
	}

	return {
		...layout,
		active,
		order,
	};
}

function unusedID(layouts: LayoutMap): number {
	for (let i = 1; ; i++) {
		if (!layouts.has(i)) {
			return i;
		}
	}
}

function setLayout(layouts: LayoutMap, layout: Layout): LayoutMap {
	return layouts.set(layout.id, layout);
}

function getLayout(layouts: LayoutMap, id: number): Layout {
	return layouts.get(id) || corrupt();
}

function getSplitLayout(layouts: LayoutMap, id: number): SplitLayout {
	const layout = getLayout(layouts, id);
	if (layout.split === 'none') {
		return corrupt();
	}
	return layout;
}

function getPaneLayout(layouts: LayoutMap, id: number): PaneLayout {
	const layout = getLayout(layouts, id);
	if (layout.split !== 'none') {
		return corrupt();
	}
	return layout;
}

function checkUnsplit(layouts: LayoutMap, id: number): LayoutMap {
	const layout = getPaneLayout(layouts, id);
	if (layout.order.length > 0 || !layout.parent) {
		return layouts;
	}

	const parent = getSplitLayout(layouts, layout.parent);
	const remaining = removeElement(parent.children, id);

	if (remaining.length > 1) {
		layouts = setLayout(layouts, { ...parent, children: remaining });
	} else {
		const otherID = remaining[0];
		const other = getLayout(layouts, otherID);

		layouts = layouts.delete(otherID);

		layouts = setLayout(layouts, { ...other, parent: parent.parent, id: parent.id });

		if (other.split !== 'none') {
			for (const child of other.children) {
				const childLayout = getLayout(layouts, child);
				layouts = setLayout(layouts, { ...childLayout, parent: parent.id });
			}
		}
	}

	return layouts.delete(id);
}

type LayoutActionType = LayoutAction['type'];
type LayoutActionOf<K extends LayoutActionType> = Extract<LayoutAction, { type: K }>;
type LayoutActionHandler<K extends LayoutActionType> = (layouts: LayoutMap, action: LayoutActionOf<K>) => LayoutMap;
type LayoutActionHandlerMap = {
	[K in LayoutActionType]: LayoutActionHandler<K>;
};

const HANDLERS: LayoutActionHandlerMap = {
	selectTab(layouts: LayoutMap, { tab, pane }: LayoutActionSelectTab): LayoutMap {
		const layout = getPaneLayout(layouts, pane);

		if (layout.order.indexOf(tab) < 0) {
			return layouts;
		}

		return setLayout(layouts, {
			...layout,
			active: tab,
		});
	},

	closeTab(layouts: LayoutMap, { tab, pane }: LayoutActionCloseTab): LayoutMap {
		const layout = getPaneLayout(layouts, pane);

		const newLayout = removeTab(layout, tab);
		if (!newLayout) {
			return layouts;
		}

		layouts = setLayout(layouts, newLayout);
		return checkUnsplit(layouts, pane);
	},

	moveTab(layouts: LayoutMap, { tab, source, dest, pos }: LayoutActionMoveTab): LayoutMap {
		const sourceLayout = getPaneLayout(layouts, source);

		if (source === dest) {
			const { order } = sourceLayout;
			const index = order.indexOf(tab);
			if (index < 0) {
				return layouts;
			}

			layouts = setLayout(layouts, {
				...sourceLayout,
				order: moveElementAt(order, index, pos),
			});

			return layouts;
		}

		const destLayout = getPaneLayout(layouts, dest);

		const newSourceLayout = removeTab(sourceLayout, tab);
		if (!newSourceLayout) {
			return layouts;
		}

		const { order } = destLayout;
		const newDestLayout = {
			...destLayout,
			order: insertElementAt(order, tab, pos),
			active: tab,
		};

		layouts = setLayout(layouts, newSourceLayout);
		layouts = setLayout(layouts, newDestLayout);

		return checkUnsplit(layouts, source);
	},

	moveTabSplit(layouts: LayoutMap, { tab, source, dest, dir }: LayoutActionMoveTabSplit): LayoutMap {
		const destLayout = getPaneLayout(layouts, dest);
		if (source === dest && destLayout.order.length === 1) {
			return layouts;
		}

		const split = dirToSplit(dir);

		let index = 0;
		let parentLayout: SplitLayout | undefined;

		if (destLayout.parent) {
			const destParentLayout = getSplitLayout(layouts, destLayout.parent);

			if (destParentLayout.split === split) {
				parentLayout = destParentLayout;

				index = parentLayout.children.indexOf(dest);
				if (index < 0) {
					return corrupt();
				}
			}
		}

		if (!parentLayout) {
			const movedLayout = { ...destLayout, parent: dest, id: unusedID(layouts) };
			layouts = setLayout(layouts, movedLayout);
			if (source === dest) {
				source = movedLayout.id;
			}

			parentLayout = {
				id: destLayout.id,
				parent: destLayout.parent,
				split,
				children: [movedLayout.id],
			};
			layouts = setLayout(layouts, parentLayout);
		}

		if (dir === 'right' || dir === 'bottom') {
			index++;
		}

		const newLayout: PaneLayout = {
			split: 'none',
			parent: parentLayout.id,
			id: unusedID(layouts),
			order: [],
			active: null,
		};
		layouts = setLayout(layouts, newLayout);
		layouts = setLayout(layouts, {
			...parentLayout,
			children: insertElementAt(parentLayout.children, newLayout.id, index),
		});

		return HANDLERS.moveTab(layouts, { type: 'moveTab', tab, source, dest: newLayout.id, pos: 0 });
	},
};

export function layoutReducer(layouts: LayoutMap, action: LayoutAction): LayoutMap {
	const handler = HANDLERS[action.type] as LayoutActionHandler<typeof action.type>;
	return handler(layouts, action);
}

export function fromNested(layout: NestedLayout): LayoutMap {
	let layouts = Map<number, Layout>();
	let nextID = 1;

	function flatten(layout: NestedLayout, parent: number): number {
		const id = nextID++;
		switch (layout.split) {
			case 'horizontal':
			case 'vertical':
				const { split, children } = layout;
				if (children.length < 2) {
					throw new Error('Split layout with single child');
				}
				const flatChildren = children.map((c) => flatten(c, id));
				layouts = layouts.set(id, {
					split,
					children: flatChildren,
					parent,
					id,
				});
				break;

			case 'none':
				layouts = layouts.set(id, { ...layout, parent, id });
				break;

			default:
				throw new Error("Layout with invalid 'split' property");
		}

		return id;
	}

	flatten(layout, 0);

	return layouts;
}
