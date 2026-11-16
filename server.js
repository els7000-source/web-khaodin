const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// https://script.google.com/macros/s/AKfycbz-TN3kLWLNR20gHH3fnfTn2jcgecb-OkjWLq0phd5BQQj9uCgVu_T7Yy3ZfnB12KrC/exec
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz-TN3kLWLNR20gHH3fnfTn2jcgecb-OkjWLq0phd5BQQj9uCgVu_T7Yy3ZfnB12KrC/exec';

const upload = multer({ dest: 'uploads/' });
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 🔒 API เข้าสู่ระบบเจ้าหน้าที่
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin.khaodin' && password === 'kd2026') {
        res.json({ success: true, role: 'admin', token: 'secret-token-admin' });
    } else {
        res.status(401).json({ success: false, message: '❌ ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง' });
    }
});

// 📂 ดึงข้อมูลทั้งหมดจาก Google Sheets
app.get('/api/businesses', async (req, res) => {
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL);
        const data = await response.json();
        res.json(data.reverse()); // เรียงข้อมูลล่าสุดขึ้นก่อน
    } catch (err) {
        res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลจาก Google Sheets ได้: ' + err.message });
    }
});

// ➕ เพิ่มข้อมูลใหม่ลง Google Sheets
app.post('/api/businesses', upload.any(), async (req, res) => {
    if (req.headers['x-user-role'] !== 'admin') {
        return res.status(403).json({ error: '❌ Access Denied' });
    }
    try {
        const item = { id: Date.now().toString(), ...req.body };
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'add', data: item })
        });
        const result = await response.json();
        res.status(201).json({ success: true, result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✏️ แก้ไขข้อมูลใน Google Sheets
app.put('/api/businesses/:id', upload.any(), async (req, res) => {
    if (req.headers['x-user-role'] !== 'admin') {
        return res.status(403).json({ error: '❌ Access Denied' });
    }
    try {
        const item = { id: req.params.id, ...req.body };
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'edit', data: item })
        });
        const result = await response.json();
        res.json({ success: true, result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🗑️ ลบข้อมูลใน Google Sheets
app.delete('/api/businesses/:id', async (req, res) => {
    if (req.headers['x-user-role'] !== 'admin') {
        return res.status(403).json({ error: '❌ Access Denied' });
    }
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', data: { id: req.params.id } })
        });
        const result = await response.json();
        res.json({ success: true, result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
