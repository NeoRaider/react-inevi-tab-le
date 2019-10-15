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

export interface InputSplitLayout {
	readonly split: Split;
	readonly children: ReadonlyArray<InputLayout>;
}

export interface SplitLayout extends InputSplitLayout {
	readonly id: string;
	readonly children: ReadonlyArray<Layout>;
}

export interface InputPaneLayout {
	readonly split: 'none';
	readonly order: ReadonlyArray<string>;
	readonly active: string | null;
}

export interface PaneLayout extends InputPaneLayout {
	readonly id: string;
}

export type InputLayout = InputPaneLayout | InputSplitLayout;
export type Layout = PaneLayout | SplitLayout;

interface FlatSplitLayout {
	readonly parent: string | null;
	readonly id: string;
	readonly split: Split;
	readonly children: ReadonlyArray<string>;
}

interface FlatPaneLayout extends PaneLayout {
	readonly parent: string | null;
}

type FlatLayout = FlatPaneLayout | FlatSplitLayout;

const emptyLayout: InputPaneLayout = {
	split: 'none',
	order: [],
	active: null,
};

export type LayoutUpdateListener<T> = (layout: Layout, tabs: ReadonlyMap<string, T>) => void;

export interface LayoutManager<T> {
	addUpdateListener(listener: LayoutUpdateListener<T>): void;
	removeUpdateListener(listener: LayoutUpdateListener<T>): void;

	selectTab(tab: string): boolean;
	closeTab(tab: string): boolean;
	moveTab(tab: string, dest: string, pos: number): boolean;
	moveTabSplit(tab: string, dest: string, dir: Direction): boolean;
}

function corrupt(): never {
	throw new Error('Data corruption');
}

export class DefaultLayoutManager<T> implements LayoutManager<T> {
	protected static clonePaneLayout(layout: InputPaneLayout, parent: string | null, id: string): FlatPaneLayout {
		const { order, active } = layout;
		return {
			split: 'none',
			order: order.slice(0),
			active,
			parent,
			id,
		};
	}

	protected static removeTab(layout: FlatPaneLayout, tab: string): FlatPaneLayout | null {
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

	private nextID = 0;
	private root: string;
	private tabs: Map<string, T>;
	private layouts: Map<string, FlatLayout> = new Map();
	private tabPanes: Map<string, string> = new Map();
	private updateListeners: ReadonlyArray<LayoutUpdateListener<T>> = [];

	public constructor(tabs: Map<string, T> = new Map(), layout: InputLayout = emptyLayout) {
		this.tabs = new Map(tabs);
		this.root = this.flattenLayout(layout, null);
	}

	public addUpdateListener(listener: LayoutUpdateListener<T>): void {
		this.updateListeners = appendElement(this.updateListeners, listener);

		const layout = this.unflattenLayout();
		const tabs = new Map(this.tabs);

		this.updateOne(listener, layout, tabs);
	}

	public removeUpdateListener(listener: LayoutUpdateListener<T>): void {
		this.updateListeners = removeElement(this.updateListeners, listener);
	}

	public selectTab(tab: string): boolean {
		const pane = this.tabPanes.get(tab);
		if (!pane) {
			return false;
		}
		const layout = this.getPaneLayout(pane);

		if (layout.order.indexOf(tab) < 0) {
			return false;
		}

		this.setLayout({
			...layout,
			active: tab,
		});

		this.update();
		return true;
	}

	public closeTab(tab: string): boolean {
		const pane = this.tabPanes.get(tab);
		if (!pane) {
			return false;
		}
		const layout = this.getPaneLayout(pane);

		const newLayout = DefaultLayoutManager.removeTab(layout, tab);
		if (!newLayout) {
			return false;
		}

		this.setLayout(newLayout);
		this.tabs.delete(tab);
		this.tabPanes.delete(tab);

		this.checkUnsplit(pane);

		this.update();
		return true;
	}

	public moveTab(tab: string, dest: string, pos: number): boolean {
		const source = this.tabPanes.get(tab);
		if (!source) {
			return false;
		}

		const sourceLayout = this.getPaneLayout(source);

		if (source === dest) {
			const { order } = sourceLayout;
			const index = order.indexOf(tab);
			if (index < 0) {
				return false;
			}

			this.setLayout({
				...sourceLayout,
				order: moveElementAt(order, index, pos),
			});
		} else {
			const destLayout = this.getPaneLayout(dest);

			const newSourceLayout = DefaultLayoutManager.removeTab(sourceLayout, tab);
			if (!newSourceLayout) {
				return false;
			}

			const { order } = destLayout;
			const newDestLayout = {
				...destLayout,
				order: insertElementAt(order, tab, pos),
				active: tab,
			};

			this.setLayout(newSourceLayout);
			this.setLayout(newDestLayout);
			this.tabPanes.set(tab, dest);

			this.checkUnsplit(source);
		}

		this.update();
		return true;
	}

	public moveTabSplit(tab: string, dest: string, dir: Direction): boolean {
		const source = this.tabPanes.get(tab);
		if (!source) {
			return false;
		}

		const destLayout = this.getPaneLayout(dest);
		if (source === dest && destLayout.order.length === 1) {
			return true;
		}

		const split = dirToSplit(dir);

		let index = 0;
		let parentLayout: FlatSplitLayout | undefined;

		if (destLayout.parent !== null) {
			const destParentLayout = this.getSplitLayout(destLayout.parent);

			if (destParentLayout.split === split) {
				parentLayout = destParentLayout;

				index = parentLayout.children.indexOf(dest);
				if (index < 0) {
					return corrupt();
				}
			}
		}

		if (!parentLayout) {
			const movedLayout = DefaultLayoutManager.clonePaneLayout(destLayout, dest, this.newID());
			this.setLayout(movedLayout);

			for (const tab of destLayout.order) {
				this.tabPanes.set(tab, movedLayout.id);
			}

			parentLayout = {
				id: destLayout.id,
				parent: destLayout.parent,
				split,
				children: [movedLayout.id],
			};
			this.setLayout(parentLayout);
		}

		if (dir === 'right' || dir === 'bottom') {
			index++;
		}

		const newLayout = DefaultLayoutManager.clonePaneLayout(emptyLayout, parentLayout.id, this.newID());
		this.setLayout(newLayout);
		this.setLayout({
			...parentLayout,
			children: insertElementAt(parentLayout.children, newLayout.id, index),
		});

		if (!this.moveTab(tab, newLayout.id, 0)) {
			corrupt();
		}
		return true;
	}

	protected newID(): string {
		return (this.nextID++).toString(36);
	}

	protected flattenLayout(layout: InputLayout, parent: string | null): string {
		const id = this.newID();

		switch (layout.split) {
			case 'horizontal':
			case 'vertical':
				const { split, children } = layout;
				if (children.length < 2) {
					throw new Error('Split layout with single child');
				}
				this.setLayout({
					split,
					children: children.map((c) => this.flattenLayout(c, id)),
					parent,
					id,
				});
				break;

			case 'none':
				this.setLayout(DefaultLayoutManager.clonePaneLayout(layout, parent, id));
				for (const tab of layout.order) {
					this.tabPanes.set(tab, id);
				}
				break;

			default:
				throw new Error("Layout with invalid 'split' property");
		}

		return id;
	}

	protected unflattenLayout(id: string = this.root): Layout {
		const layout = this.getLayout(id);

		switch (layout.split) {
			case 'horizontal':
			case 'vertical':
				const { split, children } = layout;
				return {
					id,
					split,
					children: children.map(this.unflattenLayout, this),
				};

			case 'none':
				return DefaultLayoutManager.clonePaneLayout(layout, layout.parent, layout.id);
		}
	}

	private setLayout(layout: FlatLayout): void {
		this.layouts.set(layout.id, layout);
	}

	private getLayout(id: string): FlatLayout {
		return this.layouts.get(id) || corrupt();
	}

	private getSplitLayout(id: string): FlatSplitLayout {
		const layout = this.getLayout(id);
		if (layout.split === 'none') {
			return corrupt();
		}
		return layout;
	}

	private getPaneLayout(id: string): FlatPaneLayout {
		const layout = this.getLayout(id);
		if (layout.split !== 'none') {
			return corrupt();
		}
		return layout;
	}

	private checkUnsplit(id: string): void {
		const layout = this.getPaneLayout(id);
		if (layout.order.length > 0 || layout.parent === null) return;

		const parent = this.getSplitLayout(layout.parent);
		const remaining = removeElement(parent.children, id);

		if (remaining.length > 1) {
			this.setLayout({ ...parent, children: remaining });
		} else {
			const otherID = remaining[0];
			const other = this.getLayout(otherID);

			this.layouts.delete(otherID);

			this.setLayout({ ...other, parent: parent.parent, id: parent.id });

			if (other.split !== 'none') {
				for (const child of other.children) {
					const childLayout = this.getLayout(child);
					this.setLayout({ ...childLayout, parent: parent.id });
				}
			} else {
				for (const tab of other.order) {
					this.tabPanes.set(tab, parent.id);
				}
			}
		}

		this.layouts.delete(id);
	}

	private updateOne(listener: LayoutUpdateListener<T>, layout: Layout, tabs: Map<string, T>): void {
		listener(layout, tabs);
	}

	private update(): void {
		const layout = this.unflattenLayout();
		const tabs = new Map(this.tabs);

		for (const listener of this.updateListeners) {
			this.updateOne(listener, layout, tabs);
		}
	}
}
