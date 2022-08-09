// node spider-cli https://www.depor.pe 1 4
import { spider } from "./spider.js";

const url = process.argv[2];
const nesting = Number.parseInt(process.argv[3], 10) || 1;
const concurrency = Number.parseInt(process.argv[4], 10) || 2;

spider(url, nesting, concurrency)
  .then(() => console.log("Download complete"))
  .catch((err) => console.log(err));
