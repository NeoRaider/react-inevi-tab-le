import * as React from 'react';
import { useDrop } from 'react-dnd';

import { TabDragDesc, TabDragType, Realm } from './Tab';

export interface TabDropAreaProps<TabID> {
	realm: Realm<TabID>;
	ignore?: TabID;
	className: string;

	onDrop: (tab: TabID) => void;
}

export function TabDropArea<TabID>({ className, realm, ignore, onDrop }: TabDropAreaProps<TabID>): JSX.Element {
	const [{ active, hover }, drop] = useDrop({
		accept: TabDragType,
		canDrop: (tab: TabDragDesc<TabID>) => tab.realm === realm && tab.id !== ignore,
		drop: (tab: TabDragDesc<TabID>) => {
			onDrop(tab.id);
		},
		collect: (monitor) => ({
			active: monitor.canDrop(),
			hover: monitor.isOver() && monitor.canDrop(),
		}),
	});

	return (
		<div
			ref={drop}
			className={'dropArea ' + className + (active ? ' active' : '') + (hover ? ' hover' : '')}
		/>
	);
}
