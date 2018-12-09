import * as React from 'react';

import { Tab } from './Tab';
import { TabBar } from './TabBar';

export interface TabPaneProps {
	tabs: Tab[];
	defaultActive?: Tab;
}

interface TabPaneState {
	active?: Tab;
}

export class TabPane extends React.Component<TabPaneProps, TabPaneState> {
	public constructor(props: TabPaneProps) {
		super(props);

		this.state = {
			active: props.defaultActive,
		};
	}

	public render() {
		const { tabs } = this.props;
		const { active } = this.state;

		return (
			<div className='tabPane'>
				<TabBar
					tabs={tabs}
					active={active}
					onChange={this.handleChange}
				/>
				<div className='tabContent'>
					{active && active.content}
				</div>
			</div>
		);
	}

	private handleChange = (tab: Tab) => {
		this.setState({
			active: tab,
		});
	}
}
