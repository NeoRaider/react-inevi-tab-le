/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { DndProvider } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import { Map } from 'immutable';

import { fromNested } from 'react-split-tab-le/dist/layout/nested';
import { Tab } from 'react-inevi-tab-le/dist/Tab';
import { TabPane } from 'react-inevi-tab-le/dist/TabPane';
import { TabLayout } from 'react-split-tab-le/dist/TabLayout';

import 'react-split-tab-le/style.css';

let tabs = Map<string, Tab>();

function KeepScroll({ children }: { children: React.ReactNode }): JSX.Element {
	const scrollPos = React.useRef(0);
	const ref = React.useRef<HTMLDivElement | null>(null);

	React.useLayoutEffect(() => {
		if (ref.current) {
			ref.current.scrollTop = scrollPos.current;
		}
	});

	return (
		<div
			style={{ height: '100%', overflow: 'auto' }}
			ref={ref}
			onScroll={(): void => {
				if (ref.current) {
					scrollPos.current = ref.current.scrollTop;
				}
			}}
			onWheel={(): void => {}}
		>
			{children}
		</div>
	);
}

const loremipsum = (
	<div>
		<p>
			Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus finibus aliquet lectus, non
			tempus enim gravida in. Suspendisse ornare a orci ac rhoncus. Ut diam sapien, mattis eu egestas
			ut, condimentum non augue. Morbi nec lobortis augue, sit amet placerat lacus. Pellentesque vel
			scelerisque ex. Interdum et malesuada fames ac ante ipsum primis in faucibus. Praesent maximus
			porttitor varius. Sed luctus velit consequat ligula placerat ullamcorper. Proin pulvinar nibh
			quis efficitur lacinia.
		</p>
		<p>
			Fusce ut blandit sem, a ultricies sem. Aliquam laoreet ac felis ac varius. Pellentesque dictum
			pharetra lorem ac consectetur. Nunc arcu ipsum, tempor eu consectetur rutrum, efficitur eget
			eros. Nulla ut eros hendrerit, vehicula purus ut, tempus justo. Maecenas volutpat, ligula vitae
			auctor efficitur, turpis magna commodo mauris, pellentesque bibendum enim dui ac eros. Quisque
			convallis tincidunt dui vitae fermentum. Vivamus laoreet tristique leo non iaculis. Maecenas
			eros mauris, vulputate sed nunc at, sollicitudin pharetra tortor. Proin imperdiet vitae nulla id
			posuere. Pellentesque hendrerit blandit pretium. Aliquam sit amet suscipit nulla. Vivamus dictum
			eu nisi non tempus.
		</p>
		<p>
			Donec lacinia imperdiet arcu, at pretium felis dictum vitae. Nullam sed lacus id nisi
			pellentesque dapibus id ac neque. In in urna ut augue euismod ultricies at sed lectus. Nunc eget
			turpis orci. Suspendisse pellentesque velit nunc, vitae sodales dolor efficitur ut. Aenean at
			justo interdum, blandit lorem a, pharetra lorem. Ut non odio placerat mi interdum tristique.
			Duis eu libero id nulla vulputate eleifend. Maecenas bibendum convallis purus, in vestibulum
			enim efficitur non. Mauris iaculis, mi vel pellentesque auctor, ex ipsum scelerisque felis, vel
			fermentum lorem felis eget tellus. Proin velit leo, gravida et mi vel, sagittis euismod sapien.
		</p>
		<p>
			Vestibulum ante ante, fringilla dictum augue ut, fringilla ultrices tortor. Sed blandit neque
			dictum vulputate tincidunt. In eleifend risus a lacinia commodo. Phasellus vehicula sollicitudin
			posuere. Proin rhoncus vel dolor ultricies faucibus. Etiam quis mattis elit. Morbi pulvinar
			justo id eros elementum tempus. Etiam condimentum ipsum ut diam porta, in varius lorem tempus.
			Maecenas sodales rutrum diam, id sagittis lacus consectetur ac. Nunc semper arcu at risus
			aliquam euismod. Nullam pretium ut odio at sodales. In lobortis nunc sed metus ultricies
			pellentesque. Donec a mollis erat, eu luctus ante.
		</p>
		<p>
			Morbi ullamcorper tristique tempus. Ut in ipsum lectus. Suspendisse dignissim iaculis ligula, ac
			gravida diam lobortis non. Aenean quis risus facilisis, ultrices neque sit amet, iaculis mi.
			Vivamus mollis pretium consectetur. Mauris a lorem at sem euismod euismod vitae sed nibh. Nam
			lobortis tellus in purus suscipit rutrum. Cras facilisis ante arcu, in volutpat orci molestie
			id. Aliquam vel justo neque. Nulla tincidunt, purus sit amet efficitur tempus, turpis augue
			pulvinar leo, vitae condimentum leo erat vitae odio. Aenean dignissim sem sit amet dui lobortis
			semper. Integer sodales, sem in varius consequat, neque ipsum imperdiet ex, et accumsan ex mi
			sit amet metus. Ut in lectus ligula.
		</p>
		<p>
			Ut placerat consequat luctus. Orci varius natoque penatibus et magnis dis parturient montes,
			nascetur ridiculus mus. Suspendisse tellus mauris, faucibus ac malesuada eget, luctus et felis.
			Cras consectetur urna turpis, sed auctor mauris egestas vitae. Nam posuere non enim vel dictum.
			Donec ornare aliquet vehicula. Cras lobortis lectus a ligula congue suscipit. Integer dapibus,
			purus ut interdum lacinia, lorem nisl posuere diam, vel auctor erat massa vel nibh.
		</p>
		<p>
			Sed at finibus ante. Cras at ultrices est, at vestibulum libero. Sed ac mattis odio. Lorem ipsum
			dolor sit amet, consectetur adipiscing elit. Suspendisse dignissim vulputate nisl ac blandit.
			Phasellus turpis ipsum, volutpat eget molestie eget, euismod non diam. Nullam porttitor justo
			lacus, quis molestie ante viverra et. Donec ultricies ac mi ac dictum. Sed vel feugiat metus,
			nec euismod ante. Mauris id elit efficitur, pellentesque eros vitae, dictum felis. Mauris nulla
			nibh, blandit at cursus ut, congue quis odio.
		</p>
		<p>
			Pellentesque nec magna ac tellus faucibus dignissim. In tincidunt neque et est placerat, et
			malesuada nunc facilisis. Proin accumsan pretium pulvinar. Proin accumsan ligula sit amet massa
			eleifend lobortis. Nunc imperdiet aliquet eros sit amet pharetra. Nunc rhoncus iaculis urna, id
			molestie tortor cursus eu. Nam maximus nulla id enim blandit lobortis. Pellentesque iaculis
			lorem quis libero hendrerit ornare. Proin ornare sapien lacinia ante dignissim, et facilisis
			nulla elementum. Vivamus eget orci vel sem maximus posuere. Nullam elementum at felis id
			fermentum.
		</p>
		<p>
			Nullam metus eros, tristique vitae justo at, tempor auctor turpis. Nam vel purus euismod,
			condimentum nisl vel, finibus velit. Pellentesque viverra imperdiet nisl, at consequat tortor
			interdum ultricies. Duis eget ultrices lacus, sed bibendum justo. Maecenas varius, augue iaculis
			ultrices vehicula, massa leo facilisis enim, non elementum elit ante eget risus. Aenean eu quam
			dapibus, imperdiet lectus et, pulvinar nunc. Morbi at euismod velit. Etiam lobortis ipsum sit
			amet tristique pretium. Vivamus venenatis feugiat imperdiet. Duis tempus, lectus blandit
			sollicitudin pellentesque, purus felis varius purus, eu egestas mauris libero sit amet purus.
			Integer efficitur, elit id lacinia maximus, velit felis convallis mi, ut rutrum ipsum ipsum nec
			velit. Pellentesque ornare maximus tellus nec dictum.
		</p>
		<p>
			Morbi nec eleifend tortor, sed pulvinar elit. Phasellus id fermentum ipsum, scelerisque
			porttitor felis. Nunc pellentesque libero id consectetur dignissim. Morbi sem nibh, mollis eu
			convallis in, pharetra vel sem. Maecenas in ultricies tortor. Nam magna lacus, sollicitudin et
			dolor eu, efficitur convallis ex. Morbi tincidunt interdum pretium. Fusce ante nulla, lacinia
			sit amet arcu at, auctor pretium nulla. Ut commodo quis lacus sit amet condimentum. Praesent
			quis velit sed sem lacinia accumsan sed nec augue. Fusce odio est, semper ac hendrerit quis,
			luctus nec arcu. Morbi eget odio nulla. Sed feugiat sapien eget consequat sagittis. Vivamus
			aliquam sed libero sed aliquam.
		</p>
		<p>
			Nunc dictum mattis sagittis. Nulla auctor dolor sollicitudin lectus malesuada facilisis.
			Phasellus vel sem sed quam commodo ultricies. Ut congue dolor in arcu faucibus, a scelerisque
			felis vulputate. Curabitur vestibulum, quam vel lobortis laoreet, ligula arcu rutrum diam, sed
			tristique nisi est ut arcu. Mauris et lacus turpis. Pellentesque congue mauris nec aliquam
			laoreet. Morbi lectus mi, tempus quis ex quis, auctor ultricies augue.
		</p>
		<p>
			Praesent convallis nisi quis felis eleifend elementum. Vivamus vitae nisi nec justo pharetra
			accumsan sed sed sem. Suspendisse in risus ac nibh rhoncus faucibus non in mauris. In eu risus
			purus. Vivamus facilisis enim dui. Duis sagittis arcu eu mauris laoreet convallis. Quisque
			pharetra nisl eu elit mollis vestibulum. Proin luctus convallis tempus. Phasellus enim lacus,
			egestas nec elementum eu, commodo eu odio. Integer id ante ullamcorper, finibus nisi sit amet,
			scelerisque ex.
		</p>
		<p>
			Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.
			Phasellus sed pulvinar purus. Aliquam ut porta mauris. Pellentesque sollicitudin ligula erat, a
			condimentum tellus efficitur quis. Integer ut fringilla dui. Suspendisse id bibendum enim. Fusce
			pulvinar, nisl sit amet vestibulum viverra, ipsum tortor ultricies lorem, eu mollis arcu lorem
			ut ipsum.
		</p>
		<p>
			Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec ut nisi nec purus egestas
			ullamcorper nec ut elit. Donec suscipit et magna sit amet bibendum. Mauris fringilla egestas
			pretium. Duis ac pharetra nisi. Proin lacinia mollis sapien, sed varius justo blandit at. Donec
			convallis, ex ut rutrum ornare, justo lacus aliquam velit, et aliquet lorem justo sit amet
			augue. Integer eu scelerisque elit, sit amet iaculis quam. Duis lobortis massa quis lectus
			lobortis, ac tristique dolor aliquam. In euismod ex nec turpis volutpat pulvinar. Nullam vel
			lectus sed diam viverra congue.
		</p>
		<p>
			In at velit fringilla, sodales mauris non, rhoncus nulla. Fusce facilisis sit amet magna at
			vestibulum. Aenean rhoncus arcu nec orci sodales dapibus. Aliquam efficitur arcu ipsum, id
			blandit erat placerat sit amet. Praesent non pharetra nibh. Fusce non suscipit risus, nec mollis
			mauris. Fusce varius interdum dolor, auctor mollis eros tempor ac. Fusce volutpat scelerisque
			convallis. Aliquam vehicula purus at metus sodales convallis. Sed nec ligula maximus, luctus
			felis sit amet, finibus dui.
		</p>
		<p>
			Cras sollicitudin velit mi, a tincidunt risus ultricies id. Morbi ut leo metus. Donec tristique
			sagittis eros, in ornare leo. Donec pellentesque ac quam at pretium. Quisque non ullamcorper
			enim. Sed id accumsan justo. Suspendisse venenatis feugiat enim quis gravida. Maecenas mollis
			tellus massa, eu vehicula nisl viverra id. Duis non nisl diam. Proin pharetra erat erat, et
			vulputate magna rhoncus eu. Donec lobortis iaculis est ac luctus. Pellentesque nec leo ac nibh
			congue dictum. Fusce ultrices odio eget elit sodales ornare non quis eros.
		</p>
		<p>
			Integer at fringilla libero. Suspendisse augue nulla, consequat consequat urna ac, pretium
			volutpat dui. Pellentesque vel velit tempor justo lacinia sagittis. Pellentesque ut tincidunt
			ante. Nunc ultrices dui lobortis velit vestibulum, a cursus odio maximus. Donec erat est, rutrum
			et fringilla sed, ornare vel tellus. Integer lobortis, dolor et cursus vehicula, nisl erat
			posuere tortor, non tristique sem velit vitae justo. Sed lobortis magna sit amet quam gravida,
			quis viverra orci porttitor. Aenean sollicitudin urna ut augue laoreet, et tristique magna
			efficitur. Phasellus varius tellus ac risus laoreet placerat. Pellentesque ultricies velit eu
			porttitor malesuada. Etiam ut tempor felis, eget auctor massa. Aliquam eros velit, fermentum eu
			neque id, vehicula lacinia turpis.
		</p>
		<p>
			Praesent vel tellus interdum, tempor ligula venenatis, commodo quam. Pellentesque habitant morbi
			tristique senectus et netus et malesuada fames ac turpis egestas. Quisque id mattis magna. Morbi
			molestie semper libero, et finibus lorem laoreet ut. Quisque vehicula justo at lacinia porta.
			Pellentesque sodales volutpat ipsum, vel vehicula ligula aliquam eget. Donec velit erat, dictum
			quis suscipit et, bibendum vitae erat. In quis congue risus, ac maximus sem. Vivamus tempor
			velit libero, pellentesque rhoncus mi maximus sed. Sed ac varius mi. Donec imperdiet urna vel
			elementum varius.
		</p>
		<p>
			Aliquam et dolor vel orci porta elementum. Integer in pellentesque mauris, at elementum quam.
			Nulla vitae ex urna. In congue tristique justo, sit amet posuere lorem lacinia et. Sed
			vestibulum porta lectus, ut porttitor arcu lobortis et. Aenean posuere vehicula venenatis. Nunc
			auctor ante et lorem molestie venenatis. Donec at porta felis, sed condimentum ante. Ut accumsan
			dui sed laoreet vestibulum.
		</p>
		<p>
			Curabitur id dolor mauris. Maecenas ultricies luctus nibh, non congue nisl tempus nec. Etiam
			euismod, augue at eleifend molestie, nisl justo euismod arcu, at mattis nisi dolor id justo.
			Duis vitae varius est, in posuere ipsum. In diam lectus, rutrum ac dictum ac, hendrerit sit amet
			dolor. Sed tincidunt tortor ac ipsum finibus condimentum. Suspendisse maximus ante id ligula
			tincidunt tempus. Nam id interdum ipsum. Duis et consectetur diam. Vivamus elit risus, pulvinar
			ut finibus ut, efficitur vitae dui. Suspendisse ornare elementum lacinia. Vivamus commodo
			placerat arcu, laoreet porttitor nulla vehicula sed. Integer non urna sed erat elementum
			iaculis. Suspendisse ornare molestie nisl, et porttitor nunc gravida a. Morbi ac dignissim
			felis, ultrices iaculis tellus. Nullam vulputate est et lacinia tristique.
		</p>
	</div>
);

tabs = tabs.set('tab1', { desc: { title: 'Tab 1' }, content: <h1>Test 1</h1> });
tabs = tabs.set('tab2', { desc: { title: 'Tab 2' }, content: <h1>Test 2</h1> });
tabs = tabs.set('tab3', {
	desc: { title: 'Tab that cannot be closed', closable: false },
	content: <KeepScroll>{loremipsum}</KeepScroll>,
});
tabs = tabs.set('tab4', {
	desc: { title: 'Tab with an exceedingly long description in its title' },
	content: <div>The content is rather short.</div>,
});

const paneLayout = {
	order: ['tab1', 'tab2', 'tab3', 'tab4'],
	active: 'tab2',
};

const dynamicLayoutMap = fromNested({
	split: 'vertical',
	children: [
		{
			split: 'none',
			order: ['tab1', 'tab2'],
			active: 'tab2',
		},
		{
			split: 'horizontal',
			children: [
				{
					split: 'none',
					order: ['tab3'],
					active: 'tab3',
				},
				{
					split: 'none',
					order: ['tab4'],
					active: 'tab4',
				},
			],
		},
	],
});

const tabPane = (
	<DndProvider backend={HTML5Backend}>
		{/* <TabPane initialLayout={paneLayout} tabs={tabs} /> */}
		<TabLayout initialLayout={dynamicLayoutMap} tabs={tabs} />
	</DndProvider>
);

ReactDOM.render(tabPane, document.getElementById('app'));
