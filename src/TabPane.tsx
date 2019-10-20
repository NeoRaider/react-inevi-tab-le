import * as React from 'react';
import { OutPortal, PortalNode } from 'react-reverse-portal';

import { LayoutAction, PaneLayout } from './layout/dockable';

import { TabBar } from './TabBar';
import { TabViewProps } from './LayoutProvider';
import { Tab } from './Tab';

export interface InternalTabPaneProps {
	realm: symbol;
	id: number;
	tabs: ReadonlyMap<string, Tab>;
	portals: ReadonlyMap<string, PortalNode>;

	dispatch(action: LayoutAction): void;
	layout: PaneLayout;

	children?: React.ReactNode;
}

export function InternalTabPane(props: InternalTabPaneProps): JSX.Element {
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

export function TabPane(props: TabViewProps): JSX.Element {
	const { realm, id, tabs, portals, dispatch, layouts } = props;

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const layout = layouts.get(id)!;

	if (layout.split !== 'none') {
		throw new Error('TabPane does not support split layouts');
	}

	return <InternalTabPane {...{ realm, id, tabs, portals, dispatch, layout }} />;
}
