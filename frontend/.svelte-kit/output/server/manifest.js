export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.png"]),
	mimeTypes: {".png":"image/png"},
	_: {
		client: {"start":"_app/immutable/entry/start.dc34441f.js","app":"_app/immutable/entry/app.8f763556.js","imports":["_app/immutable/entry/start.dc34441f.js","_app/immutable/chunks/scheduler.64c0ae6a.js","_app/immutable/chunks/singletons.67dcb63c.js","_app/immutable/chunks/index.675a9ea6.js","_app/immutable/entry/app.8f763556.js","_app/immutable/chunks/scheduler.64c0ae6a.js","_app/immutable/chunks/index.5f42ba5d.js"],"stylesheets":[],"fonts":[]},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js'))
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/test",
				pattern: /^\/test\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			}
		],
		matchers: async () => {
			
			return {  };
		}
	}
}
})();
