const fs = require('fs');
const https = require('https');
const path = require('path');

const modelsDir = path.join(__dirname, 'public', 'models');

if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
}

const baseUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';

const files = [
    'ssd_mobilenetv1_model-weights_manifest.json',
    'ssd_mobilenetv1_model-shard1',
    'ssd_mobilenetv1_model-shard2',
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model-shard1',
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model-shard1',
    'face_recognition_model-shard2'
];

async function downloadFile(filename) {
    const dest = path.join(modelsDir, filename);
    if (fs.existsSync(dest)) {
        console.log(`Skipping ${filename}, already exists.`);
        return;
    }
    
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(baseUrl + filename, (response) => {
            if (response.statusCode !== 200) {
                fs.unlinkSync(dest);
                return reject(new Error(`Failed to download ${filename}, status code ${response.statusCode}`));
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
                console.log(`Downloaded ${filename}`);
            });
        }).on('error', (err) => {
            fs.unlinkSync(dest);
            reject(err);
        });
    });
}

async function main() {
    console.log('Downloading face-api models...');
    for (const file of files) {
        try {
            await downloadFile(file);
        } catch (e) {
            console.error(e);
        }
    }
    console.log('Done!');
}

main();
