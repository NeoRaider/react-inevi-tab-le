import * as React from 'react';

import { SplitPane } from 'react-multi-split-pane';

import { TabPane } from './TabPane';
import { TabViewProps } from './LayoutProvider';

export function TabLayout(props: TabViewProps): JSX.Element | null {
	const { layout } = props;

	if (layout.split === 'none') {
		return <TabPane {...props} />;
	}

	const { children, split } = layout;
	return (
		<div className='tabLayout'>
			<SplitPane split={split} minSize={100}>
				{children.map((child) => (
					<TabLayout key={child.id} {...props} layout={child} />
				))}
			</SplitPane>
		</div>
	);
}
