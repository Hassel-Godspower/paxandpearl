import fetch from "node-fetch";
import { JSDOM } from "jsdom";

export async function scrapeSite(url) {
  const res = await fetch(url);
  const html = await res.text();

  const dom = new JSDOM(html);
  const document = dom.window.document;

  document.querySelectorAll("script,style,nav,footer").forEach(e => e.remove());

  return document.body.textContent.replace(/\s+/g, " ").trim();
}
