import * as React from 'react';

import { Tab } from './Tab';
import { TabHeader } from './TabHeader';

export interface TabBarProps {
	realm: symbol;

	tabs: Record<string, Tab>;
	order: string[];
	active?: string;

	onChange?: (tab: string) => void;
	onClose?: (tab: string) => void;

	onDrop?: (tab: string, index: number) => void;
}

export class TabBar extends React.Component<TabBarProps> {
	public render() {
		const {
			realm,
			active,
			order,
			tabs,
		} = this.props;

		const entries: React.ReactNode[] = [
		];

		order.forEach((id, i) => {
			const tab = tabs[id];
			if (!tab) {
				return;
			}

			entries.push(
				<TabHeader
					realm={realm}
					key={id}
					id={id}
					tab={tab.desc}
					isActive={id === active}
					onSelect={() => this.handleChange(id)}
					onClose={() => this.handleClose(id)}
					onDropLeft={(t) => this.handleDrop(t, i)}
					onDropRight={(t) => this.handleDrop(t, i + 1)}
				/>,
			);
		});

		return (
			<div className='tabBar'>
				{entries}
			</div>
		);
	}

	private handleChange = (tab: string) => {
		const { onChange } = this.props;

		if (onChange) {
			onChange(tab);
		}
	}

	private handleClose = (tab: string) => {
		const { onClose } = this.props;

		if (onClose) {
			onClose(tab);
		}
	}

	private handleDrop = (tab: string, index: number) => {
		const { onDrop } = this.props;

		if (onDrop) {
			onDrop(tab, index);
		}
	}
}
