import { Direction } from './types';

export interface LayoutActionSelectTab {
	type: 'selectTab';
	tab: string;
	pane: number;
}

export function selectTab(tab: string, pane: number): LayoutAction {
	return { type: 'selectTab', tab, pane };
}

export interface LayoutActionCloseTab {
	type: 'closeTab';
	tab: string;
	pane: number;
}

export function closeTab(tab: string, pane: number): LayoutAction {
	return { type: 'closeTab', tab, pane };
}

export interface LayoutActionMoveTab {
	type: 'moveTab';
	tab: string;
	source: number;
	dest: number;
	pos: number;
}

export function moveTab(tab: string, source: number, dest: number, pos: number): LayoutAction {
	return { type: 'moveTab', tab, source, dest, pos };
}

export interface LayoutActionMoveTabSplit {
	type: 'moveTabSplit';
	tab: string;
	source: number;
	dest: number;
	dir: Direction;
}

export function moveTabSplit(tab: string, source: number, dest: number, dir: Direction): LayoutAction {
	return { type: 'moveTabSplit', tab, source, dest, dir };
}

export type LayoutAction =
	| LayoutActionSelectTab
	| LayoutActionCloseTab
	| LayoutActionMoveTab
	| LayoutActionMoveTabSplit;
