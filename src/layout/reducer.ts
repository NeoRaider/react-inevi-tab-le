import { insertElementAt, moveElementAt, removeElement, removeElementAt } from '../util';

import { Split, Direction, SplitLayout, PaneLayout, LayoutMap, Layout } from './types';
import {
	LayoutAction,
	LayoutActionSelectTab,
	LayoutActionCloseTab,
	LayoutActionMoveTab,
	LayoutActionMoveTabSplit,
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

function paneRemoveTab(layout: PaneLayout, tab: string): PaneLayout {
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

function paneMoveTab(layout: PaneLayout, tab: string, pos: number): PaneLayout {
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

function getParentLayout(layouts: LayoutMap, layout: Layout): [number, SplitLayout] {
	return [layout.parent, getSplitLayout(layouts, layout.parent) || corrupt()];
}

function checkUnsplit(layouts: LayoutMap, pane: number): LayoutMap {
	const paneLayout = getPaneLayout(layouts, pane);
	if (!paneLayout || paneLayout.order.length > 0 || !paneLayout.parent) {
		return layouts;
	}

	const [parent, parentLayout] = getParentLayout(layouts, paneLayout);

	layouts = layouts.delete(pane);

	const remaining = removeElement(parentLayout.children, pane);

	if (remaining.length > 1) {
		return layouts.set(parent, { ...parentLayout, children: remaining });
	}

	const other = remaining[0];
	const otherLayout = layouts.get(other) || corrupt();
	layouts = layouts.delete(other);

	layouts = layouts.set(parent, { ...otherLayout, parent: parentLayout.parent });

	if (otherLayout.split !== 'none') {
		for (const child of otherLayout.children) {
			const childLayout = layouts.get(child) || corrupt();
			layouts = layouts.set(child, { ...childLayout, parent });
		}
	}

	return layouts;
}

type LayoutActionType = LayoutAction['type'];
type LayoutActionOf<K extends LayoutActionType> = Extract<LayoutAction, { type: K }>;
type LayoutActionHandler<K extends LayoutActionType> = (layouts: LayoutMap, action: LayoutActionOf<K>) => LayoutMap;
type LayoutActionHandlerMap = {
	[K in LayoutActionType]: LayoutActionHandler<K>;
};

const HANDLERS: LayoutActionHandlerMap = {
	selectTab(layouts: LayoutMap, { tab, pane }: LayoutActionSelectTab): LayoutMap {
		return layouts.update(pane, (layout) => {
			if (layout.split !== 'none' || layout.order.indexOf(tab) < 0) {
				return layout;
			}
			return { ...layout, active: tab };
		});
	},

	closeTab(layouts: LayoutMap, { tab, pane }: LayoutActionCloseTab): LayoutMap {
		layouts = layouts.update(pane, (layout) => {
			if (layout.split !== 'none') {
				return layout;
			}
			return paneRemoveTab(layout, tab);
		});
		return checkUnsplit(layouts, pane);
	},

	moveTab(layouts: LayoutMap, { tab, source, dest, pos }: LayoutActionMoveTab): LayoutMap {
		if (source === dest) {
			return layouts.update(source, (layout) => {
				if (layout.split !== 'none' || layout.order.indexOf(tab) < 0) {
					return layout;
				}
				return paneMoveTab(layout, tab, pos);
			});
		}

		const sourceLayout = getPaneLayout(layouts, source);
		const destLayout = getPaneLayout(layouts, dest);

		if (!sourceLayout || !destLayout || sourceLayout.order.indexOf(tab) < 0) {
			return layouts;
		}

		layouts = layouts.set(source, paneRemoveTab(sourceLayout, tab));
		layouts = layouts.set(dest, {
			...destLayout,
			order: insertElementAt(destLayout.order, tab, pos),
			active: tab,
		});

		return checkUnsplit(layouts, source);
	},

	moveTabSplit(layouts: LayoutMap, { tab, source, dest, dir }: LayoutActionMoveTabSplit): LayoutMap {
		const destLayout = getPaneLayout(layouts, dest);
		if (!destLayout || (source === dest && destLayout.order.length === 1)) {
			return layouts;
		}

		const split = dirToSplit(dir);

		let index = 0;
		let parent: [number, SplitLayout] | undefined;

		if (destLayout.parent) {
			const destParent = getParentLayout(layouts, destLayout);
			if (destParent[1].split === split) {
				index = destParent[1].children.indexOf(dest);
				if (index < 0) {
					return corrupt();
				}

				parent = destParent;
			}
		}

		if (!parent) {
			const movedID = unusedID(layouts);
			layouts = layouts.set(movedID, { ...destLayout, parent: dest });
			if (source === dest) {
				source = movedID;
			}

			parent = [
				dest,
				{
					parent: destLayout.parent,
					split,
					children: [movedID],
				},
			];
			layouts = layouts.set(parent[0], parent[1]);
		}

		if (dir === 'right' || dir === 'bottom') {
			index++;
		}

		const newID = unusedID(layouts);
		layouts = layouts.set(newID, {
			split: 'none',
			parent: parent[0],
			order: [],
			active: null,
		});
		layouts = layouts.set(parent[0], {
			...parent[1],
			children: insertElementAt(parent[1].children, newID, index),
		});

		return HANDLERS.moveTab(layouts, { type: 'moveTab', tab, source, dest: newID, pos: 0 });
	},
};

export function layoutReducer(layouts: LayoutMap, action: LayoutAction): LayoutMap {
	const handler = HANDLERS[action.type] as LayoutActionHandler<typeof action.type>;
	return handler(layouts, action);
}
