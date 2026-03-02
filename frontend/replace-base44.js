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

    // Replace import
    content = content.replace(/import\s+{\s*base44\s*}\s+from\s+['"]@\/api\/base44Client['"];/g, "import { api } from '@/lib/api';");

    // Replace auth.me
    content = content.replace(/await\s+base44\.auth\.me\(\)/g, "(await api.get('/users/profile')).data");
    content = content.replace(/base44\.auth\.updateMe\((.*?)\)/g, "api.put('/users/profile', $1)");

    // Replace entities.list()
    content = content.replace(/base44\.entities\.([A-Za-z0-9_]+)\.list\((.*?)\)/g, (match, entity, args) => {
        let endpoint = '/' + entity.toLowerCase() + 's';
        return `(await api.get('${endpoint}')).data`;
    });

    // Replace entities.filter()
    content = content.replace(/base44\.entities\.([A-Za-z0-9_]+)\.filter\((.*?)\)/g, (match, entity, args) => {
        let endpoint = '/' + entity.toLowerCase() + 's';
        // The args are usually like `{ user_email: user?.email }`
        // We need to pass it as params to axios
        return `(await api.get('${endpoint}', { params: ${args} })).data`;
    });

    // Replace entities.create()
    content = content.replace(/base44\.entities\.([A-Za-z0-9_]+)\.create\((.*?)\)/g, (match, entity, args) => {
        let endpoint = '/' + entity.toLowerCase() + 's';
        return `(await api.post('${endpoint}', ${args})).data`;
    });

    // Replace entities.update()
    content = content.replace(/base44\.entities\.([A-Za-z0-9_]+)\.update\((.*?),\s*(.*?)\)/g, (match, entity, id, args) => {
        let endpoint = '/' + entity.toLowerCase() + 's';
        return `(await api.put(\`${endpoint}/\${${id}}\`, ${args})).data`;
    });

    // Replace entities.delete()
    content = content.replace(/base44\.entities\.([A-Za-z0-9_]+)\.delete\((.*?)\)/g, (match, entity, id) => {
        let endpoint = '/' + entity.toLowerCase() + 's';
        return `(await api.delete(\`${endpoint}/\${${id}}\`)).data`;
    });

    // appLogs fallback
    content = content.replace(/base44\.appLogs\.logUserInApp\((.*?)\)/g, "api.post('/logs', { page: $1 })");

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Processed', filePath);
    }
}

walkDir(directoryToSearch, processFile);
walkDir(libToSearch, processFile);
