import { Browser, BrowserContext, chromium } from "playwright";
import { appConfig } from "../configs/app.config";

export async function getBrowserContext() {
    const browser: Browser = await chromium.launch({ devtools: true, headless: appConfig.playwright.headless });
    let context: BrowserContext;
    if (appConfig.playwright.enableProxy) {
        context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.64 Safari/537.36',
            proxy: {
                server: appConfig.playwright.proxy.server,
                username: appConfig.playwright.proxy.username,
                password: appConfig.playwright.proxy.password,
            },
        });			
    } else {
        context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.64 Safari/537.36',
        });
    }
    return context
}