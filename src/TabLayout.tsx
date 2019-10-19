import * as React from 'react';

import { SplitPane } from 'react-multi-split-pane';

import { Direction } from './layout/types';
import { moveTabSplit, moveTab } from './layout/actions';

import { InternalTabPane } from './TabPane';
import { TabViewProps } from './LayoutProvider';
import { TabDropArea } from './TabDropArea';

interface TabSplitAreaProps extends TabViewProps {
	dir: Direction;
	ignore?: string;
}

function TabSplitArea({ realm, id, dir, ignore, dispatch }: TabSplitAreaProps): JSX.Element {
	return (
		<>
			<TabDropArea
				realm={realm}
				ignore={ignore}
				onDrop={(tab, source): void => {
					dispatch(moveTabSplit(tab, source, id, dir));
				}}
				className={dir}
			/>
			<div className='dropIndicator' />
		</>
	);
}

export function TabLayout(props: TabViewProps): JSX.Element {
	const { id, layouts } = props;

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const layout = layouts.get(id)!;

	if (layout.split === 'none') {
		const { realm, dispatch, tabs, portals } = props;
		const { order } = layout;

		const ignore = order.length === 1 ? order[0] : undefined;

		return (
			<InternalTabPane {...{ realm, id, tabs, portals, dispatch, layout }}>
				<TabSplitArea {...props} dir='top' ignore={ignore} />
				<TabSplitArea {...props} dir='bottom' ignore={ignore} />
				<TabSplitArea {...props} dir='left' ignore={ignore} />
				<TabSplitArea {...props} dir='right' ignore={ignore} />
				<TabDropArea
					realm={realm}
					ignore={ignore}
					onDrop={(tab, source): void => {
						if (!order.includes(tab)) {
							dispatch(moveTab(tab, source, id, order.length));
						}
					}}
					className='center'
				/>
				<div className='dropIndicator' />
			</InternalTabPane>
		);
	}

	const { children, split } = layout;
	return (
		<div className='tabLayout'>
			<SplitPane split={split} minSize={100}>
				{children.map((child) => (
					<TabLayout {...props} key={child} id={child} />
				))}
			</SplitPane>
		</div>
	);
}
