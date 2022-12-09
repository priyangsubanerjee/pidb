require("dotenv").config();

const express = require("express");
const path = require("path");
const PORT = process.env.PORT || 3000;
const app = express();

const aws = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");

aws.config.update({
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  accessKeyId: process.env.ACCESS_KEY_ID,
  region: process.env.BUCKET_REGION,
});

const BUCKET = process.env.BUCKET_NAME;
const s3 = new aws.S3();

const upload = multer({
  storage: multerS3({
    s3: s3,
    acl: "public-read",
    bucket: BUCKET,
    key: function (req, file, cb) {
      console.log(file);
      cb(null, Date.now() + "." + file.originalname.split(".").pop());
    },
  }),
});

app.use("/", express.static(path.join(__dirname, "public")));

app.post("/upload", upload.single("file"), async function (req, res, next) {
  res.json({
    success: true,
    message: "File uploaded successfully",
    url: req.file.location,
    key: req.file.key,
  });
});

// app.get("/list", async (req, res) => {
//   let r = await s3.listObjectsV2({ Bucket: BUCKET }).promise();
//   let x = r.Contents.map((item) => item.Key);
//   res.send(x);
// });

app.get("/download/:filename", async (req, res) => {
  const filename = req.params.filename;
  let x = await s3.getObject({ Bucket: BUCKET, Key: filename }).promise();
  res.send(x.Body);
});

app.get("/delete/:filename", async (req, res) => {
  const filename = req.params.filename;
  await s3.deleteObject({ Bucket: BUCKET, Key: filename }).promise();
  res.send("File Deleted Successfully");
});

app.get("/v1/:filename", async (req, res) => {
  const filename = req.params.filename;
  let x = await s3
    .getObject({ Bucket: BUCKET, Key: filename })
    .createReadStream()
    .pipe(res);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
