import * as React from 'react';
const { useReducer } = React;

import { PortalNode } from 'react-reverse-portal';

import { SplitPane } from 'react-multi-split-pane';

import * as Pane from 'react-inevi-tab-le/dist/layout/pane';

import { InternalTabPane, useRealm } from 'react-inevi-tab-le/dist/InternalTabPane';
import { TabDropArea } from 'react-inevi-tab-le/dist/TabDropArea';
import { Tab, Realm } from 'react-inevi-tab-le/dist/Tab';
import { useTabPortals } from 'react-inevi-tab-le/dist/LayoutProvider';

import { Direction, moveTabSplit, moveTab, DockableTab, LayoutAction, LayoutMap, reducer } from './layout/dockable';

interface TabSplitAreaProps {
	realm: Realm<DockableTab>;

	pane: number;
	dispatch: (action: LayoutAction) => void;

	dir: Direction;
	ignore?: DockableTab;
}

function TabSplitArea({ realm, pane, dir, ignore, dispatch }: TabSplitAreaProps): JSX.Element {
	return (
		<>
			<TabDropArea
				realm={realm}
				ignore={ignore}
				onDrop={(tab): void => {
					dispatch(moveTabSplit(tab, pane, dir));
				}}
				className={dir}
			/>
			<div className='dropIndicator' />
		</>
	);
}

interface InternalTabLayoutProps {
	realm: Realm<DockableTab>;
	tabs: ReadonlyMap<string, Tab>;
	portals: ReadonlyMap<string, PortalNode>;

	dispatch(action: LayoutAction): void;

	layouts: LayoutMap;
	id: number;
}

export function InternalTabLayout(props: InternalTabLayoutProps): JSX.Element {
	const { id, layouts } = props;

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const layout = layouts.get(id)!;

	if (layout.split !== 'none') {
		const { children, split } = layout;
		return (
			<div className='tabLayout'>
				<SplitPane split={split} minSize={100}>
					{children.map((child) => (
						<InternalTabLayout {...props} key={child} id={child} />
					))}
				</SplitPane>
			</div>
		);
	}

	const { realm, dispatch, tabs, portals } = props;
	const { order } = layout;

	const getID = (tab: string): DockableTab => [tab, id];
	const paneDispatch = (action: Pane.GenericLayoutAction<DockableTab>): void => {
		switch (action.type) {
			case 'selectTab':
			case 'closeTab':
				dispatch(action);
				break;

			case 'moveTab':
				dispatch({ ...action, dest: id });
				break;

			default:
				throw new Error(`unexpected ${action.type} pane action`);
		}
	};

	const ignore = order.length === 1 ? getID(order[0]) : undefined;

	return (
		<InternalTabPane<DockableTab>
			{...{ realm, id, tabs, portals, layout }}
			getID={getID}
			dispatch={paneDispatch}
		>
			<TabSplitArea realm={realm} pane={id} dispatch={dispatch} dir='top' ignore={ignore} />
			<TabSplitArea realm={realm} pane={id} dispatch={dispatch} dir='bottom' ignore={ignore} />
			<TabSplitArea realm={realm} pane={id} dispatch={dispatch} dir='left' ignore={ignore} />
			<TabSplitArea realm={realm} pane={id} dispatch={dispatch} dir='right' ignore={ignore} />
			<TabDropArea
				realm={realm}
				ignore={ignore}
				onDrop={(tab): void => {
					if (!order.includes(tab[0])) {
						dispatch(moveTab(tab, id, order.length));
					}
				}}
				className='center'
			/>
			<div className='dropIndicator' />
		</InternalTabPane>
	);
}

interface TabLayoutProps {
	initialLayout: LayoutMap;
	tabs: ReadonlyMap<string, Tab>;
}

export function TabLayout({ initialLayout, tabs }: TabLayoutProps): JSX.Element {
	const realm = useRealm<DockableTab>();
	const [layouts, dispatch] = useReducer<React.Reducer<LayoutMap, LayoutAction>>(reducer, initialLayout);

	const tabPortals = useTabPortals(tabs);
	const portals = new Map<string, PortalNode>();
	const inPortals: JSX.Element[] = [];
	tabPortals.forEach(([portal, el], id) => {
		portals.set(id, portal);
		inPortals.push(el);
	});

	return (
		<>
			<InternalTabLayout {...{ realm, tabs, portals, dispatch, layouts }} id={1} />
			{inPortals}
		</>
	);
}
