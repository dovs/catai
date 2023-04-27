import path from 'path';
import { $, fs } from 'zx';
import { DOWNLOAD_LOCATION } from '../src/model-settings.js';
import ModelURL from './utils/model-url.js';
import { downloadFileCLI } from './utils/download/cli-download.js';

const modelURL = new ModelURL();
await modelURL.updateLink();

// if model not found, try to download with template
if (!modelURL.downloadLink) {
    const exitsModels = Object.keys(modelURL.modelsDownloadLinks).join(", ");
    console.warn("Model unknown, we will download with template URL. You can also try one of thous:" + exitsModels);
    modelURL.downloadLink = modelURL.templateLink;
}

const downloadDir = path.join(DOWNLOAD_LOCATION, "models");
await fs.ensureDir(downloadDir);
const downloadFile = path.join(downloadDir, modelURL.tag);

try {
    await downloadFileCLI(modelURL.downloadLink, downloadFile, modelURL.tag);
} catch (err) {
    console.error('\n' + err.message);

    if(modelURL.alterativeLink !== modelURL.downloadLink){
        console.log(`Downloading from alternative URL: ...${modelURL.alterativeLink.slice(-50)}\n`);
        await downloadFileCLI(modelURL.alterativeLink, downloadFile, modelURL.tag);
    }
}

console.log("Download complete");
await $`npm run use ${modelURL.tag}`;