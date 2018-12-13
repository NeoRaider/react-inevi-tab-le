import * as React from 'react';

import { Tab } from './Tab';
import { TabDropArea } from './TabDropArea';
import { TabHeader } from './TabHeader';
import { ifset } from './util';

export interface TabBarProps {
	realm: {};
	source?: {};

	tabs: Record<string, Tab>;
	order: string[];
	active: string | null;

	onChange?: (tab: string) => void;
	onClose?: (tab: string) => void;

	onDrop?: (tab: string, index: number, source: any) => void;
}

export class TabBar extends React.Component<TabBarProps> {
	public render() {
		const {
			realm,
			source,
			active,
			order,
			tabs,
			onChange,
			onClose,
			onDrop,
		} = this.props;

		const entries = order.map((id, i) => {
			const tab = tabs[id];
			if (!tab) {
				return null;
			}

			return (
				<TabHeader
					realm={realm}
					source={source}
					key={id}
					id={id}
					tab={tab.desc}
					isActive={id === active}
					onSelect={() => ifset(onChange)(id)}
					onClose={() => ifset(onClose)(id)}
					onDropLeft={(t, s) => ifset(onDrop)(t, i, s)}
					onDropRight={(t, s) => ifset(onDrop)(t, i + 1, s)}
				/>
			);
		});

		return (
			<div className='tabBar'>
				{entries}
				<TabDropArea
					realm={realm}
					onDrop={(t, s) => ifset(onDrop)(t, order.length, s)}
					className='rest'
				/>
			</div>
		);
	}
}
