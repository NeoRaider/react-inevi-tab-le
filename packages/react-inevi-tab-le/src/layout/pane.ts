import { ActionHandlerMap, ActionHandler } from './action';
import { insertElementAt, moveElementAt, removeElementAt } from './util';

// State type
export interface Layout {
	readonly order: ReadonlyArray<string>;
	readonly active: string | null;
}

// Actions and action creators
export interface LayoutActionSelectTab<TabID> {
	type: 'selectTab';
	tab: TabID;
}
export function selectTab<TabID>(tab: TabID): GenericLayoutAction<TabID> {
	return { type: 'selectTab', tab };
}

export interface LayoutActionInsertTab<TabID> {
	type: 'insertTab';
	tab: TabID;
	pos: number;
}
export function insertTab<TabID>(tab: TabID, pos: number): GenericLayoutAction<TabID> {
	return { type: 'insertTab', tab, pos };
}

export interface LayoutActionMoveTab<TabID> {
	type: 'moveTab';
	tab: TabID;
	pos: number;
}
export function moveTab<TabID>(tab: TabID, pos: number): GenericLayoutAction<TabID> {
	return { type: 'moveTab', tab, pos };
}

export interface LayoutActionCloseTab<TabID> {
	type: 'closeTab';
	tab: TabID;
}
export function closeTab<TabID>(tab: TabID): GenericLayoutAction<TabID> {
	return { type: 'closeTab', tab };
}

export type GenericLayoutAction<TabID> =
	| LayoutActionSelectTab<TabID>
	| LayoutActionInsertTab<TabID>
	| LayoutActionMoveTab<TabID>
	| LayoutActionCloseTab<TabID>;

export type LayoutAction = GenericLayoutAction<string>;

// Action handlers
const HANDLERS: ActionHandlerMap<LayoutAction, Layout> = {
	selectTab(layout: Layout, { tab }: LayoutActionSelectTab<string>): Layout {
		if (layout.order.indexOf(tab) < 0) {
			return layout;
		}

		return { ...layout, active: tab };
	},

	insertTab(layout: Layout, { tab, pos }: LayoutActionInsertTab<string>): Layout {
		return {
			...layout,
			order: insertElementAt(layout.order, tab, pos),
			active: tab,
		};
	},

	moveTab(layout: Layout, { tab, pos }: LayoutActionMoveTab<string>): Layout {
		const { order } = layout;
		const index = order.indexOf(tab);
		if (index < 0) {
			return layout;
		}

		return {
			...layout,
			order: moveElementAt(order, index, pos),
		};
	},

	closeTab(layout: Layout, { tab }: LayoutActionCloseTab<string>): Layout {
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
	},
};

export function reducer<L extends Layout>(layout: L, action: LayoutAction): L {
	const handler = HANDLERS[action.type] as ActionHandler<LayoutAction, Layout, typeof action.type>;
	return handler(layout, action) as L;
}
