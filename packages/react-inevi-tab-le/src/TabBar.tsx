import * as React from 'react';

import { TabDropArea } from './TabDropArea';
import { TabHeader } from './TabHeader';
import { moveTab } from './layout/pane';
import { InternalTabPaneProps } from './InternalTabPane';

export function TabBar<TabID>({ realm, tabs, layout, dispatch, getID }: InternalTabPaneProps<TabID>): JSX.Element {
	const { order, active } = layout;

	const entries = order.map((tabKey, i) => {
		const tab = tabs.get(tabKey);
		if (!tab) {
			return null;
		}

		return (
			<TabHeader<TabID>
				realm={realm}
				index={i}
				key={tabKey}
				tab={getID(tabKey)}
				desc={tab.desc}
				isActive={tabKey === active}
				dispatch={dispatch}
			/>
		);
	});

	return (
		<div className='tabBar'>
			{entries}
			<TabDropArea<TabID>
				realm={realm}
				onDrop={(tab): void => dispatch(moveTab(tab, order.length))}
				className='rest'
			/>
		</div>
	);
}
