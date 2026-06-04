const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());
app.use(express.static('.'));

app.post('/save-coords', (req, res) => {
    const { id, position, rotation, scale } = req.body;
    try {
        let content = fs.readFileSync('index.html', 'utf8');
        
        // 1. REGEX PINTAR: Mencari seluruh tag (baik <a-gltf-model> atau <a-image>) yang memiliki id="${id}"
        // Regex ini akan menangkap satu baris tag itu secara utuh dari awal sampai penutupnya '>' atau '></a-...'
        const regexUtuh = new RegExp(`<a-(gltf-model|image)[^>]*id="${id}"[^>]*>([\\s\\S]*?<\\/a-(gltf-model|image)>)?`, 'g');

        // 2. TENTUKAN STRING BARU: Buat tag pengganti yang bersih murni berdasarkan jenis objeknya
        let tagBaru = '';
        if (id.startsWith('kaaba')) {
            tagBaru = `<a-gltf-model id="${id}" src="#modelMasjid" position="${position}" rotation="${rotation}" scale="${scale}"></a-gltf-model>`;
        } else {
            // Untuk karakter atau gambar biasa
            tagBaru = `<a-image id="${id}" src="#char0" position="${position}" rotation="${rotation}" width="0.6" height="0.9"></a-image>`;
        }

        // 3. JALANKAN REPLACE: Ganti tumpukan kode lama secara total dengan tagBaru yang bersih murni
        if (regexUtuh.test(content)) {
            content = content.replace(regexUtuh, tagBaru);
            fs.writeFileSync('index.html', content);
            console.log(`✅ [Auto-Save] File index.html berhasil di-replace bersih untuk ID: ${id}`);
            res.send({ status: 'success' });
        } else {
            console.log(`⚠️ ID "${id}" tidak ditemukan di index.html. Pastikan ID-nya cocok.`);
            res.status(404).send({ status: 'error', message: 'ID tidak ditemukan' });
        }

    } catch (err) {
        console.error("❌ Gagal menulis file:", err);
        res.status(500).send({ status: 'error' });
    }
});
app.get('/load-coords', (req, res) => {
    try {
        const content = fs.readFileSync('index.html', 'utf8');
        
        // Regex untuk mengambil atribut dari kaaba0
        const kaabaMatch = content.match(/<a-gltf-model[^>]*id="kaaba0"[^>]*position="([^"]*)"[^>]*rotation="([^"]*)"[^>]*scale="([^"]*)"/);
        // Regex untuk mengambil atribut dari karakter0
        const karakterMatch = content.match(/<a-image[^>]*id="karakter0"[^>]*position="([^"]*)"[^>]*rotation="([^"]*)"/);

        res.send({
            kaaba: kaabaMatch ? { pos: kaabaMatch[1], rot: kaabaMatch[2], scl: kaabaMatch[3] } : null,
            karakter: karakterMatch ? { pos: karakterMatch[1], rot: karakterMatch[2] } : null
        });
    } catch (err) {
        console.error("Gagal membaca file untuk load:", err);
        res.status(500).send({ status: 'error' });
    }
});

app.listen(3000, () => {
    console.log('🚀 Editor Berjalan! Buka: http://localhost:3000/editor.html');
});