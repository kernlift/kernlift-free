import type { Locale } from "./messages";

export const adminWorkspaceMessages = {
	en: {
		pageLoading: "Loading page",
		pageLoadFailed: "Unable to load this page",
		pageLoadRecovery: "Try again, or use the navigation to open another page.",
		retryPage: "Try again",
		retryingPage: "Retrying…",
		search: "Search records",
		updatingRecords: "Updating records…",
		skipToContent: "Skip to content",
		clearSearch: "Clear search",
		noResults: "No matching records.",
		recordMissing: "This record is unavailable.",
		backToList: "Back to list",
		previous: "Previous",
		next: "Next",
		pagination: "Record pages",
		records: "Records",
		range: (first: number, last: number, total: number) =>
			`${first}–${last} of ${total}`,
	},
	zh: {
		pageLoading: "正在加载页面",
		pageLoadFailed: "页面加载失败",
		pageLoadRecovery: "请重试，或通过导航打开其他页面。",
		retryPage: "重试",
		retryingPage: "正在重试…",
		search: "搜索记录",
		updatingRecords: "正在更新记录…",
		skipToContent: "跳转到主要内容",
		clearSearch: "清除搜索",
		noResults: "没有匹配的记录。",
		recordMissing: "这条记录不存在或已被删除。",
		backToList: "返回列表",
		previous: "上一页",
		next: "下一页",
		pagination: "记录分页",
		records: "记录",
		range: (first: number, last: number, total: number) =>
			`第 ${first}–${last} 条，共 ${total} 条`,
	},
} satisfies Record<
	Locale,
	{
		pageLoading: string;
		pageLoadFailed: string;
		pageLoadRecovery: string;
		retryPage: string;
		retryingPage: string;
		search: string;
		updatingRecords: string;
		skipToContent: string;
		clearSearch: string;
		noResults: string;
		recordMissing: string;
		backToList: string;
		previous: string;
		next: string;
		pagination: string;
		records: string;
		range: (first: number, last: number, total: number) => string;
	}
>;
