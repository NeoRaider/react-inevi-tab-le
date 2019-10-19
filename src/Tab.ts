export interface TabDesc {
	title: string;
	icon?: string;
	closable?: boolean;
}

export interface Tab {
	desc: TabDesc;
	content: React.ReactNode;
}

export interface TabDragDesc {
	type: symbol;
	id: string;
	source: number;
	realm: symbol;
}

export const TabDragType = Symbol('Tab');
