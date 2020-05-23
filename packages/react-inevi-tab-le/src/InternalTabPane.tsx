import * as React from 'react';
const { useRef } = React;

import { OutPortal, HtmlPortalNode } from 'react-reverse-portal';

import { Layout, GenericLayoutAction } from './layout/pane';

import { TabBar } from './TabBar';
import { Tab, Realm } from './Tab';

export function useRealm<TabID>(): Realm<TabID> {
	return (useRef(Symbol('Realm')).current as unknown) as Realm<TabID>;
}

export interface InternalTabPaneProps<TabID> {
	realm: Realm<TabID>;
	tabs: ReadonlyMap<string, Tab>;
	portals: ReadonlyMap<string, HtmlPortalNode>;

	getID(tab: string): TabID;

	dispatch(action: GenericLayoutAction<TabID>): void;
	layout: Layout;

	children?: React.ReactNode;
}

export function InternalTabPane<TabID>(props: InternalTabPaneProps<TabID>): JSX.Element {
	const { children, layout, portals } = props;
	const { active } = layout;
	const activePortal = active ? portals.get(active) : undefined;

	return (
		<div className='tabPane'>
			<TabBar {...props} />
			<div className='tabContentArea'>
				{children}
				{active && activePortal && <OutPortal key={active} node={activePortal} />}
			</div>
		</div>
	);
}
