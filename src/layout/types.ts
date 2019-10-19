import { Map } from 'immutable';

export type Split = 'horizontal' | 'vertical';
export type Direction = 'left' | 'right' | 'top' | 'bottom';

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
