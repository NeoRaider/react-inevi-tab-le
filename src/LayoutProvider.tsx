import * as React from 'react';
const { useReducer, useRef } = React;

import { PortalNode, createPortalNode, InPortal } from 'react-reverse-portal';

import { Direction, LayoutMap, layoutReducer, selectTab, closeTab, moveTab, moveTabSplit } from './LayoutManager';
import { Tab } from './Tab';

function useRefMap<K, V1, V2>(inMap: ReadonlyMap<K, V1>, f: (v: V1, k: K) => V2): Map<K, V2> {
	const map = useRef(new Map<K, V2>());

	const prevMap = map.current;
	map.current = new Map<K, V2>();

	inMap.forEach((v, k) => {
		map.current.set(k, prevMap.get(k) || f(v, k));
	});

	return map.current;
}

export interface TabViewProps {
	realm: symbol;
	id: number;
	layouts: LayoutMap;
	tabs: ReadonlyMap<string, Tab>;
	portals: ReadonlyMap<string, PortalNode>;

	onSelect(tab: string, pane: number): void;
	onClose(tab: string, pane: number): void;
	onMove(tab: string, source: number, dest: number, pos: number): void;
	onMoveSplit(tab: string, source: number, dest: number, dir: Direction): void;
}

export interface LayoutProviderProps {
	initialLayout: LayoutMap;
	tabs: ReadonlyMap<string, Tab>;

	view: React.ComponentType<TabViewProps>;
}

export function LayoutProvider({ initialLayout, tabs, view }: LayoutProviderProps): JSX.Element | null {
	const realm = useRef(Symbol('Realm'));

	const [layouts, dispatch] = useReducer(layoutReducer, initialLayout);

	const tabPortals = useRefMap(tabs, (tab): [Tab, PortalNode] => {
		const portal = createPortalNode();
		portal.className = 'tabContent';
		return [tab, portal];
	});

	const View = view;

	const portals = new Map<string, PortalNode>();
	const inPortals: JSX.Element[] = [];
	tabPortals.forEach(([{ content }, portal], id) => {
		portals.set(id, portal);
		inPortals.push(
			<InPortal key={id} node={portal}>
				{content}
			</InPortal>,
		);
	});

	return (
		<>
			<View
				id={1}
				layouts={layouts}
				realm={realm.current}
				tabs={tabs}
				portals={portals}
				onSelect={(tab, pane): void => {
					dispatch(selectTab(tab, pane));
				}}
				onClose={(tab, pane): void => {
					dispatch(closeTab(tab, pane));
				}}
				onMove={(tab: string, source: number, dest: number, pos: number): void => {
					dispatch(moveTab(tab, source, dest, pos));
				}}
				onMoveSplit={(tab: string, source: number, dest: number, dir: Direction): void => {
					dispatch(moveTabSplit(tab, source, dest, dir));
				}}
			/>
			{inPortals}
		</>
	);
}
