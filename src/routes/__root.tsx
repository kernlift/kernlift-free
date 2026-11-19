import {
	createRootRoute,
	useRouterState,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import css from "../foundation.css?url";
export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width,initial-scale=1" },
			{ title: "Kernlift Free" },
		],
		links: [
			{ rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
			{ rel: "stylesheet", href: css },
		],
	}),
	component: () => (
		<html
			lang={useRouterState({
				select: (s) =>
					/^\/zh(?:\/|$)/.test(s.location.pathname) ? "zh-CN" : "en",
			})}
		>
			<head>
				<HeadContent />
			</head>
			<body>
				<Outlet />
				<Scripts />
			</body>
		</html>
	),
});
