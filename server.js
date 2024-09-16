const express = require('express')
const mysql = require('mysql2')
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express()
const port = 3000

//Database(MySql) configulation
const db = mysql.createConnection(
    {
        host: "localhost",
        user: "root",
        password: "Cs12345678",
        database: "db_midterm_jarugun"
    }
)
db.connect()

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// ใช้ diskStorage เพื่อบันทึกไฟล์ลงในโฟลเดอร์ uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const profileName = "profile_";
    const ext = path.extname(file.originalname);
    cb(null, profileName + Date.now() + ext);
  }
});

const upload = multer({ storage: storage });

db.connect();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadDir));


//เก็บข้อมูล
app.post('/api/addproduct',upload.single('Image'), (req, res) => {
    const { Namebrand, Model, Serilnumber, Amount, Price, Cpucom, Retention, Harddisk } = req.body;

    // Validate request data
    if (!Namebrand || !Model || !Serilnumber || !Amount || !Price || !Cpucom || !Retention || !Harddisk) {
        return res.status(400).send({ 'message': 'กรุณากรอกข้อมูลให้ครบถ้วน', 'status': false });
    }

    if (!req.file) {
        return res.json({ "message": "ต้องมีภาพประกอบ", "status": false });
    }    

    const ImageURL = `/uploads/${req.file.filename}`;

    // SQL query to insert data
    const sql = "INSERT INTO detail_com (Namebrand, Model, Serilnumber, Amount, Price, Cpucom, Retention, Harddisk, Image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

    db.query(sql, [Namebrand, Model, Serilnumber, Amount, Price, Cpucom, Retention, Harddisk, ImageURL], (err, result) => {
        if (err) {
            console.error('Error inserting data into the database:', err);
            // Handle error and send a response only if the headers haven't been sent yet
            if (!res.headersSent) {
                return res.status(500).send({ 'message': 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'status': false });
            }
        }
        // Send success response only if headers haven't been sent yet
        if (!res.headersSent) {
            return res.send({ 'message': 'บันทึกข้อมูลสำเร็จ', 'status': true });
        }
    });
});

//ดึงข้อมูล
app.get('/api/getproduct/:id', (req, res)=>{
    const id = req.params.id;
    const sql = "SELECT * FROM detail_com WHERE Com_ID=?"
    db.query(sql, [id], (err, result)=>{
        if(err) {
            console.error('Cant get the data in database.',err);
            res.status(500).send({'message':'เกิดข้อผิดพลาดในการดึงข้อมูล', 'status' : false});
        }
        result[0]['message'] = 'ดึงข้อมูลสำเร็จ'
        result[0]['status'] = true
        res.send(result[0]);    
    })    
})

//Web server
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
