const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const directoryPath = path.join(__dirname, 'www');

function obfuscateFiles(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.lstatSync(fullPath).isDirectory()) {
            obfuscateFiles(fullPath);
        } else if (fullPath.endsWith('.js')) {
            const code = fs.readFileSync(fullPath, 'utf8');
            const obfuscatedCode = JavaScriptObfuscator.obfuscate(code, {
                compact: true,
                controlFlowFlattening: true
            }).getObfuscatedCode();
            fs.writeFileSync(fullPath, obfuscatedCode);
            console.log(`Obfuscated: ${file}`);
        }
    });
}

obfuscateFiles(directoryPath);
