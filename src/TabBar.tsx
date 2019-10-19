import * as React from 'react';

import { TabDropArea } from './TabDropArea';
import { TabHeader } from './TabHeader';
import { moveTab } from './layout/actions';
import { InternalTabPaneProps } from './TabPane';

export function TabBar({ realm, tabs, id, layout, dispatch }: InternalTabPaneProps): JSX.Element {
	const { order, active } = layout;

	const entries = order.map((tabID, i) => {
		const tab = tabs.get(tabID);
		if (!tab) {
			return null;
		}

		return (
			<TabHeader
				realm={realm}
				pane={id}
				index={i}
				key={tabID}
				tab={tabID}
				desc={tab.desc}
				isActive={tabID === active}
				dispatch={dispatch}
			/>
		);
	});

	return (
		<div className='tabBar'>
			{entries}
			<TabDropArea
				realm={realm}
				onDrop={(tab, source): void => dispatch(moveTab(tab, source, id, order.length))}
				className='rest'
			/>
		</div>
	);
}
