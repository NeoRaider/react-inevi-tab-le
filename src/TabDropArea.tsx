import * as React from 'react';
import { ConnectDropTarget, DropTarget, DropTargetConnector, DropTargetMonitor } from 'react-dnd';

import { TabDragType } from './Tab';

export interface TabDropAreaProps {
	realm: {};
	className: string;

	onDrop?: (tab: string, source: any) => void;
}

interface TabDropAreaTargetProps {
	connectDropTarget: ConnectDropTarget;
	active: boolean;
	hover: boolean;
}

const dropAreaTarget = {
	canDrop({ realm }: TabDropAreaProps, monitor: DropTargetMonitor) {
		return monitor.getItem().realm === realm;
	},
	drop({ onDrop }: TabDropAreaProps, monitor: DropTargetMonitor) {
		if (onDrop) {
			const tab = monitor.getItem();
			onDrop(tab.id, tab.source);
		}
	},
};

function collect(
	connect: DropTargetConnector,
	monitor: DropTargetMonitor,
): TabDropAreaTargetProps {
	return {
		connectDropTarget: connect.dropTarget(),
		active: monitor.canDrop(),
		hover: monitor.isOver() && monitor.canDrop(),
	};
}

function _TabDropArea({
	className,
	connectDropTarget,
	active,
	hover,
}: TabDropAreaProps & TabDropAreaTargetProps) {
	return connectDropTarget(
		<div className={
			'dropArea '
			+ className
			+ (active ? ' active' : '')
			+ (hover ? ' hover' : '')
		} />,
	);
}

export const TabDropArea = DropTarget<TabDropAreaProps>(TabDragType, dropAreaTarget, collect)(_TabDropArea);
