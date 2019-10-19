import * as React from 'react';

import { TabDropArea } from './TabDropArea';
import { TabHeader } from './TabHeader';
import { selectTab, closeTab, moveTab } from './LayoutManager';
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
				key={tabID}
				id={tabID}
				tab={tab.desc}
				isActive={tabID === active}
				onSelect={(): void => dispatch(selectTab(tabID, id))}
				onClose={(): void => dispatch(closeTab(tabID, id))}
				onDropLeft={(tab, source): void => dispatch(moveTab(tab, source, id, i))}
				onDropRight={(tab, source): void => dispatch(moveTab(tab, source, id, i + 1))}
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
