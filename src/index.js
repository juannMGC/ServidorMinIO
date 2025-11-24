require("dotenv").config();
const express = require("express");
const multer = require("multer");
const Minio = require("minio");

const app = express();
app.use(express.json());

// --- MinIO client ---
const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT,
    port: parseInt(process.env.MINIO_PORT),
    useSSL: false,
    accessKey: process.env.MINIO_ROOT_USER,
    secretKey: process.env.MINIO_ROOT_PASSWORD,
});

// --- Multer to handle file uploads ---
const upload = multer({ storage: multer.memoryStorage() });

// Create bucket on startup if not exists
const BUCKET = "files";

minioClient.bucketExists(BUCKET, (err, exists) => {
    if (!exists) {
        minioClient.makeBucket(BUCKET, "us-east-1", () => {
            console.log("Bucket creado:", BUCKET);
        });
    }
});

// --- Upload endpoint ---
app.post("/upload", upload.single("file"), async (req, res) => {
    try {
        const file = req.file;

        await minioClient.putObject(BUCKET, file.originalname, file.buffer);

        res.json({
            message: "Archivo subido correctamente",
            fileName: file.originalname
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "No se pudo subir el archivo" });
    }
});

app.listen(3000, () => console.log("Servidor Express listo en puerto 3000"));
