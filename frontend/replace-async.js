const fs = require('fs');
const path = require('path');

const directoryToSearch = path.join(__dirname, 'app');
const libToSearch = path.join(__dirname, 'lib');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

function processFile(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.jsx')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replace () => (await api...) with async () => (await api...)
    content = content.replace(/queryFn:\s*\(\)\s*=>\s*\(await\s+api/g, "queryFn: async () => (await api");
    content = content.replace(/mutationFn:\s*\((.*?)\)\s*=>\s*\(await\s+api/g, "mutationFn: async ($1) => (await api");

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Processed', filePath);
    }
}

walkDir(directoryToSearch, processFile);
walkDir(libToSearch, processFile);
