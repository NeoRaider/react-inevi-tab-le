import * as React from 'react';
const { useReducer } = React;

import { HtmlPortalNode } from 'react-reverse-portal';

import { Layout, LayoutAction, reducer } from './layout/pane';

import { Tab } from './Tab';
import { useTabPortals } from './LayoutProvider';
import { InternalTabPane, useRealm } from './InternalTabPane';

function tabID(tab: string): string {
	return tab;
}

export interface TabPaneProps {
	initialLayout: Layout;
	tabs: ReadonlyMap<string, Tab>;
}

export function TabPane({ initialLayout, tabs }: TabPaneProps): JSX.Element {
	const realm = useRealm<string>();
	const [layout, dispatch] = useReducer<React.Reducer<Layout, LayoutAction>>(reducer, initialLayout);

	const tabPortals = useTabPortals(tabs);
	const portals = new Map<string, HtmlPortalNode>();
	const inPortals: JSX.Element[] = [];
	tabPortals.forEach(([portal, el], id) => {
		portals.set(id, portal);
		inPortals.push(el);
	});

	return (
		<>
			<InternalTabPane<string> {...{ realm, tabs, portals, dispatch, layout }} getID={tabID} />
			{inPortals}
		</>
	);
}
