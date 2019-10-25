export type Realm<TabID> = { _brand: TabID };

export interface TabDesc {
	title: string;
	icon?: string;
	closable?: boolean;
}

export interface Tab {
	desc: TabDesc;
	content: React.ReactNode;
}

export interface TabDragDesc<TabID> {
	type: symbol;
	realm: Realm<TabID>;
	id: TabID;
}

export const TabDragType = Symbol('Tab');
