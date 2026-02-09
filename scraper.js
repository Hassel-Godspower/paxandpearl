// scraper.js
import axios from "axios";
import cheerio from "cheerio";

export async function scrapeWebsite(url) {
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  $("script, style, nav, footer").remove();

  const text = $("body").text();
  return text.replace(/\s+/g, " ").trim();
}
