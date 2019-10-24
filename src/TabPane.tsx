import * as React from 'react';

import { InternalTabPane } from './InternalTabPane';
import { TabViewProps } from './LayoutProvider';

export function TabPane(props: TabViewProps): JSX.Element {
	const { realm, id, tabs, portals, dispatch, layouts } = props;

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const layout = layouts.get(id)!;

	if (layout.split !== 'none') {
		throw new Error('TabPane does not support split layouts');
	}

	return <InternalTabPane {...{ realm, id, tabs, portals, dispatch, layout }} />;
}
