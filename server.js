const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 🗄️ เชื่อมต่อระบบฐานข้อมูล SQLite
const db = new sqlite3.Database('./database.db', (err) => {
    if (!err) {
        console.log('Connected to SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS businesses (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            status TEXT, 
            statusText TEXT, 
            licenseNo TEXT, 
            bizName TEXT, 
            ownerName TEXT, 
            type TEXT, 
            typeText TEXT, 
            address TEXT, 
            village TEXT, 
            expireDate TEXT, 
            updateTime TEXT
        )`, (err) => {
            if (!err) {
                db.get("SELECT COUNT(*) as count FROM businesses", (e, row) => {
                    if (row && row.count === 0) {
                        const sql = `INSERT INTO businesses (status, statusText, licenseNo, bizName, ownerName, type, typeText, address, village, expireDate, updateTime) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                        db.run(sql, ["normal", "🟢 เปิดบริการปกติ", "เลขที่ 123/2566", "โรงสีข้าวเขาดินเจริญพาณิชย์", "นายสมชาย มั่นคง", "หมวดโลหะ", "สีข้าวด้วยเครื่องจักร (หมวดโลหะ)", "45/1 หมู่ 2 ตำบลเขาดิน", "หมู่ 2", "31 ธ.ค. 2570", "2 พ.ย. 2569"]);
                        db.run(sql, ["warning", "🟡 ใกล้หมดอายุ", "เลขที่ 87/2566", "ฟาร์มหมูผู้ใหญ่สมศักดิ์", "นายสมศักดิ์ รักดี", "หมวดเลี้ยงสัตว์", "การเลี้ยงสุกร (หมวดเลี้ยงสัตว์)", "12 หมู่ 4 ตำบลเขาดิน", "หมู่ 4", "31 ธ.ค. 2569", "2 พ.ย. 2569"]);
                        db.run(sql, ["danger", "🔴 หมดอายุ/ระงับ", "เลขที่ 05/2565", "อู่ซ่อมรถยนต์สปีดเซอร์วิส", "นายวิชัย ยนต์เจริญ", "หมวดรถยนต์", "อู่ซ่อมและพ่นสีรถยนต์ (หมวดรถยนต์)", "9/3 หมู่ 1 ตำบลเขาดิน", "หมู่ 1", "31 ต.ค. 2569", "1 พ.ย. 2569"]);
                    }
                });
            }
        });
    }
});

// 🔒 API เข้าสู่ระบบ (LOGIN)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin.khaodin' && password === 'kd2026') {
        res.json({ success: true, role: 'admin', token: 'secret-token-admin' });
    } else {
        res.status(401).json({ success: false, message: '❌ ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง' });
    }
});

// 📂 API ดึงข้อมูลทั้งหมดไปแสดงหน้าแรก
app.get('/api/businesses', (req, res) => {
    db.all("SELECT * FROM businesses ORDER BY id DESC", (err, rows) => { 
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows); 
    });
});

// 🔒 API เพิ่มข้อมูลผู้ประกอบการ (สำหรับเจ้าหน้าที่)
app.post('/api/businesses', (req, res) => {
    const userRole = req.headers['x-user-role'];

    // ตรวจสอบสิทธิ์การเข้าถึง
    if (userRole !== 'admin') {
        return res.status(403).json({ error: "❌ Access Denied: คุณไม่มีสิทธิ์ทำรายการนี้" });
    }

    const { status, statusText, licenseNo, bizName, ownerName, type, typeText, address, village, expireDate, updateTime } = req.body;
    
    // ตรวจสอบว่ากรอกข้อมูลสำคัญครบถ้วนหรือไม่
    if (!bizName || !ownerName || !licenseNo) {
        return res.status(400).json({ error: "❌ กรุณากรอกข้อมูล ชื่อร้าน ผู้ประกอบการ และเลขใบอนุญาต" });
    }

    const sql = `INSERT INTO businesses (status, statusText, licenseNo, bizName, ownerName, type, typeText, address, village, expireDate, updateTime) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [status, statusText, licenseNo, bizName, ownerName, type, typeText, address, village, expireDate, updateTime], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ success: true, id: this.lastID });
    });
});

app.listen(PORT, () => { console.log(`🚀 Server running on http://localhost:${PORT}`); });