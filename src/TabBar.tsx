import * as React from 'react';

import { Tab } from './Tab';
import { TabHeader } from './TabHeader';

export interface TabBarProps {
	tabs: Tab[];
	active?: Tab;

	onChange?: (tab: Tab) => void;
	onClose?: (tab: Tab) => void;
}

export class TabBar extends React.Component<TabBarProps> {
	public render() {
		const {
			active,
			tabs,
		} = this.props;

		const entries = tabs.map((tab) => (
			<TabHeader
				tab={tab.desc}
				active={tab === active}
				onSelect={() => this.handleChange(tab)}
				onClose={() => this.handleClose(tab)}
			/>
		));

		return (
			<div className='tabBar'>
				{entries}
			</div>
		);
	}

	private handleChange = (tab: Tab) => {
		const { onChange } = this.props;

		if (onChange) {
			onChange(tab);
		}
	}

	private handleClose = (tab: Tab) => {
		const { onClose } = this.props;

		if (onClose) {
			onClose(tab);
		}
	}
}
