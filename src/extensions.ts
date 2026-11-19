// Add links for locally installed extensions here; each page enforces its own server permissions.
export interface WorkspaceLink {
	label: string;
	path: string;
	permission?: string;
}
export const workspaceLinks: WorkspaceLink[] = [];
