import { insertElementAt, moveElementAt, removeElement, removeElementAt } from '../util';

import { Split, Direction, SplitLayout, PaneLayout, LayoutMap, Layout } from './types';
import {
	LayoutAction,
	LayoutActionSelectTab,
	LayoutActionCloseTab,
	LayoutActionMoveTab,
	LayoutActionMoveTabSplit,
	moveTab,
} from './actions';

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

function selectLayoutTab(layout: Layout, tab: string): Layout {
	if (layout.split !== 'none') {
		return layout;
	}

	if (layout.order.indexOf(tab) < 0) {
		return layout;
	}

	return { ...layout, active: tab };
}

function insertLayoutTab(layout: Layout, tab: string, pos: number): Layout {
	if (layout.split !== 'none') {
		return layout;
	}

	return {
		...layout,
		order: insertElementAt(layout.order, tab, pos),
		active: tab,
	};
}

function moveLayoutTab(layout: Layout, tab: string, pos: number): Layout {
	if (layout.split !== 'none') {
		return layout;
	}

	const { order } = layout;
	const index = order.indexOf(tab);
	if (index < 0) {
		return layout;
	}

	return {
		...layout,
		order: moveElementAt(order, index, pos),
	};
}

function removeLayoutTab(layout: Layout, tab: string): Layout {
	if (layout.split !== 'none') {
		return layout;
	}

	let { active, order } = layout;

	const index = order.indexOf(tab);
	if (index < 0) {
		return layout;
	}

	order = removeElementAt(order, index);

	if (tab === active) {
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

function moveLayout(layouts: LayoutMap, from: number, to: number, parent: number): LayoutMap {
	const layout = layouts.get(from) || corrupt();

	layouts = layouts.delete(from);
	layouts = layouts.set(to, { ...layout, parent });

	if (layout.split !== 'none') {
		for (const child of layout.children) {
			const childLayout = layouts.get(child) || corrupt();
			layouts = layouts.set(child, { ...childLayout, parent: to });
		}
	}

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

	if (remaining.length == 1) {
		return moveLayout(layouts, remaining[0], parent, parentLayout.parent);
	}

	return layouts.set(parent, { ...parentLayout, children: remaining });
}

type LayoutActionType = LayoutAction['type'];
type LayoutActionOf<K extends LayoutActionType> = Extract<LayoutAction, { type: K }>;
type LayoutActionHandler<K extends LayoutActionType> = (layouts: LayoutMap, action: LayoutActionOf<K>) => LayoutMap;
type LayoutActionHandlerMap = {
	[K in LayoutActionType]: LayoutActionHandler<K>;
};

const HANDLERS: LayoutActionHandlerMap = {
	selectTab(layouts: LayoutMap, { tab, pane }: LayoutActionSelectTab): LayoutMap {
		return layouts.update(pane, (layout) => selectLayoutTab(layout, tab));
	},

	closeTab(layouts: LayoutMap, { tab, pane }: LayoutActionCloseTab): LayoutMap {
		layouts = layouts.update(pane, (layout) => removeLayoutTab(layout, tab));
		return checkUnsplit(layouts, pane);
	},

	moveTab(layouts: LayoutMap, { tab, source, dest, pos }: LayoutActionMoveTab): LayoutMap {
		if (source === dest) {
			return layouts.update(source, (layout) => moveLayoutTab(layout, tab, pos));
		}

		const sourceLayout = getPaneLayout(layouts, source);
		const destLayout = getPaneLayout(layouts, dest);

		if (!sourceLayout || !destLayout || sourceLayout.order.indexOf(tab) < 0) {
			return layouts;
		}

		layouts = layouts.set(source, removeLayoutTab(sourceLayout, tab));
		layouts = layouts.set(dest, insertLayoutTab(destLayout, tab, pos));

		return checkUnsplit(layouts, source);
	},

	moveTabSplit(layouts: LayoutMap, { tab, source, dest, dir }: LayoutActionMoveTabSplit): LayoutMap {
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
					return corrupt();
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
		return layoutReducer(layouts, moveTab(tab, source, newID, 0));
	},
};

export function layoutReducer(layouts: LayoutMap, action: LayoutAction): LayoutMap {
	const handler = HANDLERS[action.type] as LayoutActionHandler<typeof action.type>;
	return handler(layouts, action);
}
