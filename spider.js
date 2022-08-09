import { promises as fsPromises } from 'fs';
import { dirname } from 'path';
import superagent from 'superagent';
import mkdirp from 'mkdirp';
import { urlToFilename, getPageLinks } from './utils.js';
import { promisify } from 'util';
import { TaskQueue } from './TaskQueue.js'

const mkdirpPromise = promisify(mkdirp);

async function download(url, filename) {
    console.log(`Downloading ${url}`);
    const { text: content } = await superagent.get(url);
    await mkdirpPromise(dirname(filename));
    await fsPromises.writeFile(filename, content);
    console.log(`Downloaded and saved: ${url}`);
    return content;
}

function spiderLinks(currentUrl, body, nesting, queue) {
    if (nesting === 0) {
        return;
    }

    const links = getPageLinks(currentUrl, body);
    const promises = links.map(link => spiderTask(link, nesting - 1, queue))
    return Promise.all(promises) // llega a fallar cuando una promesa falla, entonces las demas siguientes ya no continuan
}
const spidering = new Set(); // [0,0,0,1,1] = [0,1]

async function spiderTask(url, nesting, queue) {
    if (spidering.has(url)) {
        return;
    }
    spidering.add(url);
    const filename = urlToFilename(url);

    const content = await queue.runTask(async () => {
        try {
            return await fsPromises.readFile(filename, "utf8")
        } catch (err) {
            if (err.code !== "ENOENT") {
                throw err;
            }
            return download(url, filename);
        }
    })
    return spiderLinks(url, content, nesting, queue);
}
export function spider(url, nesting, concurrency) {
    return spiderTask(url, nesting, new TaskQueue(concurrency));
}