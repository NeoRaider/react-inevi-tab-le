import * as React from 'react';

import SplitPane from 'react-split-pane';

import { Tab } from './Tab';
import { TabBar } from './TabBar';
import { removeTab, TabPaneState } from './TabPane';
import { def, insertElementAt, moveElement, uniqSorted } from './util';

export interface TabLayoutProps {
	tabs: Record<string, Tab>;

	order1?: string[];
	defaultOrder1?: string[];
	order2?: string[];
	defaultOrder2?: string[];

	active1?: string | null;
	defaultActive1?: string;
	active2?: string | null;
	defaultActive2?: string;
}

interface TabLayoutState {
	panes: TabPaneState[];
}

interface Rect {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

function diffRects(a: Rect, b: Rect): Rect {
	return {
		top: b.top - a.top,
		right: a.right - b.right,
		bottom: a.bottom - b.bottom,
		left: b.left - a.left,
	};
}

export class TabLayout extends React.Component<TabLayoutProps, TabLayoutState> {
	private layoutRef = React.createRef<HTMLDivElement>();
	private pane1Ref = React.createRef<HTMLDivElement>();
	private pane2Ref = React.createRef<HTMLDivElement>();

	private readonly tabRefs: Record<string, HTMLDivElement> = {};
	public constructor(props: TabLayoutProps) {
		super(props);

		const {
			defaultOrder1,
			defaultActive1,
			defaultOrder2,
			defaultActive2,
		} = props;

		this.state = {
			panes: [
				{
					active: def(defaultActive1, null),
					order: def(defaultOrder1, []),
				},
				{
					active: def(defaultActive2, null),
					order: def(defaultOrder2, []),
				},
			],
		};
	}

	public render() {
		const {
			tabs,
			order1: order1Prop,
			active1: active1Prop,
			order2: order2Prop,
			active2: active2Prop,
		} = this.props;
		const {
			panes: [
				{
					order: order1State,
					active: active1State,
				},
				{
					order: order2State,
					active: active2State,
				},
			],
		} = this.state;

		const active1 = def(active1Prop, active1State);
		const order1 = def(order1Prop, order1State);
		const active2 = def(active2Prop, active2State);
		const order2 = def(order2Prop, order2State);

		const alltabs = uniqSorted(order1.concat(...order2));

		return (
			<div className='tabLayout' ref={this.layoutRef}>
				{
					alltabs.map((tab) =>  (
						<div
							ref={(ref) => {
								if (ref) {
									this.tabRefs[tab] = ref;
								} else {
									delete this.tabRefs[tab];
								}
							}}
							key={tab}
							className='tabContentProvider'
						>
							{tabs[tab].content}
						</div>
					))
				}

				<SplitPane
					split='vertical'
					defaultSize='50%'
					onChange={this.handleSplitChange}
				>
					<div className='tabPane'>
						<TabBar
							realm={this}
							source={0}
							tabs={tabs}
							order={order1}
							active={active1}
							onChange={this.handleChange(0)}
							onClose={this.handleClose(0)}
							onDrop={this.handleDrop(0)}
						/>
						<div className='tabContentArea' ref={this.pane1Ref} />
					</div>
					<div className='tabPane'>
						<TabBar
							realm={this}
							source={1}
							tabs={tabs}
							order={order2}
							active={active2}
							onChange={this.handleChange(1)}
							onClose={this.handleClose(1)}
							onDrop={this.handleDrop(1)}
						/>
						<div className='tabContentArea' ref={this.pane2Ref} />
					</div>
				</SplitPane>
			</div>
		);
	}

	public componentDidMount() {
		this.handleResize();
		window.addEventListener('resize', this.handleResize);
	}

	public componentDidUpdate() {
		this.handleResize();
	}

	public componentWillUnmount() {
		window.removeEventListener('resize', this.handleResize);
	}

	private handleResize = () => this.handleSplitChange();

	private handleSplitChange = (pos?: number) => {
		const layout = this.layoutRef.current;
		if (!layout) {
			return;
		}

		const rect = layout.getBoundingClientRect();

		const pane1 = this.pane1Ref.current;
		const pane2 = this.pane2Ref.current;

		if (!(pane1 && pane2)) {
			return;
		}

		const bounds1 = diffRects(rect, pane1.getBoundingClientRect());
		const bounds2 = diffRects(rect, pane2.getBoundingClientRect());

		const active1 = def(this.props.active1, this.state.panes[0].active);
		const active2 = def(this.props.active2, this.state.panes[1].active);

		if (pos === undefined) {
			pos = bounds2.left - 1;
		}

		for (const tab of Object.keys(this.tabRefs)) {
			const content = this.tabRefs[tab];
			content.style.display = 'none';

			if (tab === active1) {
				content.style.top = bounds1.top + 'px';
				content.style.bottom = bounds1.bottom + 'px';
				content.style.left = bounds1.left + 'px';
				content.style.right = null;

				content.style.width = pos + 'px';

				content.style.display = 'block';
			} else if (tab === active2) {
				content.style.top = bounds2.top + 'px';
				content.style.right = bounds2.right + 'px';
				content.style.bottom = bounds2.bottom + 'px';

				content.style.width = null;
				content.style.left = (pos + 1) + 'px';

				content.style.display = 'block';
			}
		}
	}

	private withPane = (
		pane: number,
		f: (ps: Readonly<TabPaneState>) => Partial<TabPaneState> | null,
	) => (
		{ panes }: TabLayoutState,
	): TabLayoutState => {
		const front = panes.slice(0, pane);
		const prev = panes[pane];
		const after = f(panes[pane]) || {};
		const back = panes.slice(pane + 1);

		return {
			panes: front.concat([{ ...prev, ...after }], back),
		};
	}

	private setPaneState = (
		pane: number,
		f: (ps: Readonly<TabPaneState>) => Partial<TabPaneState> | null,
	) => {
		this.setState(this.withPane(pane, f));
	}

	private handleChange = (pane: number) => (tab: string) => {
		this.setPaneState(pane, () => {
			return {
				active: tab,
			};
		});
	}

	private handleClose = (pane: number) => (tab: string) => {
		this.setPaneState(pane, removeTab(tab));
	}

	private handleDrop = (pane: number) => (tab: string, index: number, source: number) => {
		if (pane === source) {
			this.setPaneState(pane, ({ order }) => {
				return {
					order: moveElement(order, tab, index),
				};
			});
		} else {
			this.setState((prevState) => {
				const tmpState = this.withPane(source, removeTab(tab))(prevState);
				const state = this.withPane(pane, ({ order }) => ({
					order: insertElementAt(order, tab, index),
					active: tab,
				}))(tmpState);
				return state;
			});
		}
	}
}
