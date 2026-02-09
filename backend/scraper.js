import axios from "axios";
import cheerio from "cheerio";

export async function scrapeWebsite(url) {
  const { data } = await axios.get(url, {
    timeout: 15000,
    headers: { "User-Agent": "AI-Web-Reader" }
  });

  const $ = cheerio.load(data);

  $("script, style, nav, footer, iframe, noscript").remove();

  const title = $("title").text();

  const content = [];

  $("h1, h2, h3, p, li").each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 40) {
      content.push(text);
    }
  });

  return {
    title,
    url,
    text: content.join("\n")
  };
}
