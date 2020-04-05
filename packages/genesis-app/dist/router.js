"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vue_1 = __importDefault(require("vue"));
const vue_router_1 = __importDefault(require("vue-router"));
vue_1.default.use(vue_router_1.default);
function getLocation(base) {
    let path = decodeURI(window.location.pathname);
    if (base && path.indexOf(base) === 0) {
        path = path.slice(base.length);
    }
    return (path || '/') + window.location.search + window.location.hash;
}
exports.getLocation = getLocation;
class GenesisAppRouter {
    constructor() {
        this.list = [];
        window.addEventListener('popstate', (e) => {
            this.sync((router) => {
                // Here is a Fang'f that vue-router does not disclose
                const location = getLocation(router.base);
                router.history.transitionTo(location);
            });
        });
    }
    set(router) {
        if (this.list.indexOf(router) > -1)
            return;
        this.list.push(router);
    }
    clear(router) {
        const index = this.list.indexOf(router);
        this.list.splice(index, 1);
    }
    dispatchTarget(target) {
        this.target = target;
        return this;
    }
    sync(fn) {
        this.list.forEach((router) => {
            if (this.target === router)
                return;
            fn(router);
        });
        this.target = null;
    }
    push(location) {
        this.sync((router) => {
            router.push(location);
        });
        if (!this.list.length)
            return;
        history.pushState({}, '', location);
    }
    replace(location) {
        this.sync((router) => {
            router.replace(location);
        });
        if (!this.list.length)
            return;
        history.replaceState({}, '', location);
    }
    go(n) {
        this.sync((router) => {
            router.go(n);
        });
    }
    back() {
        this.sync((router) => {
            router.back();
        });
    }
    forward() {
        this.sync((router) => {
            router.forward();
        });
    }
}
GenesisAppRouter.key = '__genesisAppRouter';
const getRoute = () => {
    if (typeof window === 'object') {
        const win = window;
        if (!win[GenesisAppRouter.key]) {
            win[GenesisAppRouter.key] = new GenesisAppRouter();
        }
        return win[GenesisAppRouter.key];
    }
    return null;
};
const route = getRoute();
class Router extends vue_router_1.default {
    constructor(options = {}) {
        super({
            ...options,
            mode: 'abstract'
        });
        if (!route || options.mode !== 'history')
            return;
        route.set(this);
        let app = this.app;
        let remove = false;
        Object.defineProperty(this, 'app', {
            set(v) {
                app = v;
                if (!app) {
                    route.clear(this);
                    remove = true;
                    return;
                }
                if (app && remove) {
                    route.set(this);
                    remove = false;
                }
            },
            get() {
                return app;
            }
        });
    }
    async push(location) {
        const url = this.resolve(location).href;
        const v = await super.push(location);
        route && route.dispatchTarget(this).push(url);
        return v;
    }
    async replace(location) {
        const url = this.resolve(location).href;
        const v = await super.replace(location);
        route && route.dispatchTarget(this).replace(url);
        return v;
    }
    go(n) {
        route && route.dispatchTarget(this).go(n);
        return super.go(n);
    }
    back() {
        route && route.dispatchTarget(this).back();
        return super.back();
    }
    forward() {
        route && route.dispatchTarget(this).forward();
        return super.forward();
    }
}
exports.Router = Router;