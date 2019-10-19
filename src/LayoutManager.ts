import { Map } from 'immutable';

import { appendElement, insertElementAt, moveElementAt, removeElement, removeElementAt } from './util';

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
export type LayoutMap = ReadonlyMap<number, Layout>;

export type LayoutUpdateListener = (layouts: LayoutMap) => void;

interface LayoutActionSelectTab {
	type: 'selectTab';
	tab: string;
	pane: number;
}

interface LayoutActionCloseTab {
	type: 'closeTab';
	tab: string;
	pane: number;
}

interface LayoutActionMoveTab {
	type: 'moveTab';
	tab: string;
	source: number;
	dest: number;
	pos: number;
}

interface LayoutActionMoveTabSplit {
	type: 'moveTabSplit';
	tab: string;
	source: number;
	dest: number;
	dir: Direction;
}

type LayoutAction = LayoutActionSelectTab | LayoutActionCloseTab | LayoutActionMoveTab | LayoutActionMoveTabSplit;

export interface LayoutManager {
	addUpdateListener(listener: LayoutUpdateListener): void;
	removeUpdateListener(listener: LayoutUpdateListener): void;

	selectTab(tab: string, pane: number): boolean;
	closeTab(tab: string, pane: number): boolean;
	moveTab(tab: string, source: number, dest: number, pos: number): boolean;
	moveTabSplit(tab: string, source: number, dest: number, dir: Direction): boolean;
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

type IdGen = () => [number, IdGen];

function idGen(n: number): IdGen {
	return (): [number, IdGen] => [n, idGen(n + 1)];
}

interface LayoutManagerState {
	readonly layouts: Map<number, Layout>;
	readonly newID: IdGen;
}

function setLayout(layouts: Map<number, Layout>, layout: Layout): Map<number, Layout> {
	return layouts.set(layout.id, layout);
}

function getLayout(layouts: Map<number, Layout>, id: number): Layout {
	return layouts.get(id) || corrupt();
}

function getSplitLayout(layouts: Map<number, Layout>, id: number): SplitLayout {
	const layout = getLayout(layouts, id);
	if (layout.split === 'none') {
		return corrupt();
	}
	return layout;
}

function getPaneLayout(layouts: Map<number, Layout>, id: number): PaneLayout {
	const layout = getLayout(layouts, id);
	if (layout.split !== 'none') {
		return corrupt();
	}
	return layout;
}

function checkUnsplit(state: LayoutManagerState, id: number): LayoutManagerState {
	let { layouts } = state;

	const layout = getPaneLayout(layouts, id);
	if (layout.order.length > 0 || !layout.parent) {
		return state;
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

	layouts = layouts.delete(id);

	return { ...state, layouts };
}

type LayoutActionType = LayoutAction['type'];
type LayoutActionOf<K extends LayoutActionType> = Extract<LayoutAction, { type: K }>;
type LayoutActionHandler<K extends LayoutActionType> = (
	state: LayoutManagerState,
	action: LayoutActionOf<K>,
) => LayoutManagerState;
type LayoutActionHandlerMap = {
	[K in LayoutActionType]: LayoutActionHandler<K>;
};

const HANDLERS: LayoutActionHandlerMap = {
	selectTab(state: LayoutManagerState, { tab, pane }: LayoutActionSelectTab): LayoutManagerState {
		let { layouts } = state;
		const layout = getPaneLayout(layouts, pane);

		if (layout.order.indexOf(tab) < 0) {
			return state;
		}

		layouts = setLayout(layouts, {
			...layout,
			active: tab,
		});

		return { ...state, layouts };
	},

	closeTab(state: LayoutManagerState, { tab, pane }: LayoutActionCloseTab): LayoutManagerState {
		let { layouts } = state;
		const layout = getPaneLayout(layouts, pane);

		const newLayout = removeTab(layout, tab);
		if (!newLayout) {
			return state;
		}

		layouts = setLayout(layouts, newLayout);
		return checkUnsplit({ ...state, layouts }, pane);
	},

	moveTab(state: LayoutManagerState, { tab, source, dest, pos }: LayoutActionMoveTab): LayoutManagerState {
		let { layouts } = state;
		const sourceLayout = getPaneLayout(layouts, source);

		if (source === dest) {
			const { order } = sourceLayout;
			const index = order.indexOf(tab);
			if (index < 0) {
				return state;
			}

			layouts = setLayout(layouts, {
				...sourceLayout,
				order: moveElementAt(order, index, pos),
			});

			return { ...state, layouts };
		}

		const destLayout = getPaneLayout(layouts, dest);

		const newSourceLayout = removeTab(sourceLayout, tab);
		if (!newSourceLayout) {
			return state;
		}

		const { order } = destLayout;
		const newDestLayout = {
			...destLayout,
			order: insertElementAt(order, tab, pos),
			active: tab,
		};

		layouts = setLayout(layouts, newSourceLayout);
		layouts = setLayout(layouts, newDestLayout);

		return checkUnsplit({ ...state, layouts }, source);
	},

	moveTabSplit(
		state: LayoutManagerState,
		{ tab, source, dest, dir }: LayoutActionMoveTabSplit,
	): LayoutManagerState {
		let { layouts, newID } = state;
		const destLayout = getPaneLayout(layouts, dest);
		if (source === dest && destLayout.order.length === 1) {
			return state;
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
			let movedID;
			[movedID, newID] = newID();
			const movedLayout = { ...destLayout, parent: dest, id: movedID };
			layouts = setLayout(layouts, movedLayout);
			if (source === dest) {
				source = movedID;
			}

			parentLayout = {
				id: destLayout.id,
				parent: destLayout.parent,
				split,
				children: [movedID],
			};
			layouts = setLayout(layouts, parentLayout);
		}

		if (dir === 'right' || dir === 'bottom') {
			index++;
		}

		let newLayoutID;
		// eslint-disable-next-line prefer-const
		[newLayoutID, newID] = newID();
		const newLayout: PaneLayout = {
			split: 'none',
			parent: parentLayout.id,
			id: newLayoutID,
			order: [],
			active: null,
		};
		layouts = setLayout(layouts, newLayout);
		layouts = setLayout(layouts, {
			...parentLayout,
			children: insertElementAt(parentLayout.children, newLayout.id, index),
		});

		return HANDLERS.moveTab(
			{ ...state, layouts, newID },
			{ type: 'moveTab', tab, source, dest: newLayout.id, pos: 0 },
		);
	},
};

function layoutAction(state: LayoutManagerState, action: LayoutAction): LayoutManagerState {
	const handler = HANDLERS[action.type] as LayoutActionHandler<typeof action.type>;
	return handler(state, action);
}

function fromNested(layout: NestedLayout): LayoutManagerState {
	let newID = idGen(1);
	let layouts = Map<number, Layout>();

	function flatten(layout: NestedLayout, parent: number): number {
		let id: number;
		[id, newID] = newID();
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

	return { layouts, newID };
}

export class DefaultLayoutManager implements LayoutManager {
	private state: LayoutManagerState;
	private listeners: ReadonlyArray<LayoutUpdateListener> = [];

	public constructor(layout: NestedLayout) {
		this.state = fromNested(layout);
	}

	public addUpdateListener(listener: LayoutUpdateListener): void {
		this.listeners = appendElement(this.listeners, listener);
		this.updateListeners([listener]);
	}

	public removeUpdateListener(listener: LayoutUpdateListener): void {
		this.listeners = removeElement(this.listeners, listener);
	}

	private dispatch(action: LayoutAction): boolean {
		this.state = layoutAction(this.state, action);
		this.updateListeners(this.listeners);
		return true;
	}

	public selectTab(tab: string, pane: number): boolean {
		return this.dispatch({ type: 'selectTab', tab, pane });
	}

	public closeTab(tab: string, pane: number): boolean {
		return this.dispatch({ type: 'closeTab', tab, pane });
	}

	public moveTab(tab: string, source: number, dest: number, pos: number): boolean {
		return this.dispatch({ type: 'moveTab', tab, source, dest, pos });
	}

	public moveTabSplit(tab: string, source: number, dest: number, dir: Direction): boolean {
		return this.dispatch({ type: 'moveTabSplit', tab, source, dest, dir });
	}

	private updateListeners(listeners: ReadonlyArray<LayoutUpdateListener>): void {
		for (const listener of listeners) {
			listener(this.state.layouts);
		}
	}
}
