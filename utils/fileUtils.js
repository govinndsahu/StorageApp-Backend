import { createWriteStream } from "fs";
import File from "../models/fileModel.js";
import { extname, normalize } from "path";
import { rm } from "fs/promises";
import z from "zod";
import { purify } from "./helpers.js";

export const getFile = async (id) => {
  const file = await File.findOne({
    _id: id,
  }).lean();
  return file;
};

export const fileValidate = async (res, id) => {
  const file = await getFile(id);
  if (!file) {
    return res.status(404).json({
      message: "File not found",
    });
  }
  return { file };
};

export const fetchFile = async (req, res, id, file) => {
  const filepath = `${import.meta.dirname}/../storage/${id}${file?.extention}`;
  if (req.query.action === "download") res.download(filepath, file.name);
  if (file.extention === ".mp4") res.set("Content-Type", `video/mp4`);
  return res.sendFile(normalize(filepath));
};

export const uploadFile = async (
  req,
  res,
  userId,
  filename,
  filesize,
  parentDirId,
  parentDir
) => {
  const extention = extname(filename);

  const insertFile = await File.insertOne({
    parentDirId,
    name: filename,
    size: filesize,
    extention,
    userId: userId,
    path: [...parentDir.path],
  });

  const fullFileName = `${insertFile._id.toString()}${extention}`;
  const writePath = normalize(
    `${import.meta.dirname}/../storage/${fullFileName}`
  );
  const writeStream = createWriteStream(writePath);

  let totalFileSize = 0;
  let aborted = false;

  req.on("data", async (chunk) => {
    if (aborted) return;
    totalFileSize += chunk.length;
    if (totalFileSize > filesize) {
      aborted = true;
      writeStream.close();
      await insertFile.deleteOne();
      await rm(writePath);
      return req.destroy();
    }
    const isEmpty = writeStream.write(chunk);
    if (!isEmpty) req.pause();
  });

  writeStream.on("drain", () => req.resume());

  req.on("end", () =>
    res.status(201).json({
      message: "File uploaded successfully",
    })
  );
  req.on("error", () =>
    res.status(400).json({
      error: "Failed to upload file!",
    })
  );
};

export const removeFile = async (res, id, file) => {
  const filePath = normalize(
    `${import.meta.dirname}/../storage/${id}${file.extention}`
  );

  await File.deleteOne({ _id: id });
  
  await rm(filePath, { recursive: true });

  return res.status(200).json({ message: "File deleted successfully." });
};

export const renamefile = async (req, res, id) => {
  const {
    success,
    data: newName,
    error,
  } = z.string().safeParse(purify.sanitize(req.body.newFilename));

  if (!success)
    return res.status(400).json({
      error: error.message,
    });

  if (!newName.suc)
    await File.updateOne(
      { _id: id },
      {
        $set: {
          name: `${newName}`,
        },
      }
    );
  return res.status(200).json({
    message: "File renamed successfully",
  });
};
