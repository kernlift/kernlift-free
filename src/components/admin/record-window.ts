/** Shared zero-based record window; remote rows are already paginated. */
export function recordWindow(input: {
	total: number;
	page: number;
	pageSize: number;
	loaded: number;
	remote: boolean;
}) {
	const total = Math.max(0, input.total);
	const pageSize = Math.max(1, input.pageSize);
	const lastPage = Math.max(0, Math.ceil(total / pageSize) - 1);
	const page = Math.min(Math.max(0, input.page), lastPage);
	const offset = page * pageSize;
	const count = Math.max(0, Math.min(input.loaded, pageSize, total - offset));
	return {
		page,
		lastPage,
		offset,
		first: count ? offset + 1 : 0,
		last: count ? offset + count : 0,
		sliceStart: input.remote ? 0 : offset,
		sliceEnd: input.remote ? input.loaded : offset + pageSize,
	};
}
