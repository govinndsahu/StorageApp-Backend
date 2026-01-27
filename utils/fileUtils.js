import File from "../models/fileModel.js";
import { extname } from "path";
import z from "zod";
import { purify } from "./helpers.js";
import { deleteObject, generateSignedUrl } from "./awsUtils.js";
import { updateDirectoriesSize } from "./directoryUtils.js";

export const getFile = async (id) => {
  const file = await File.findOne({
    _id: id,
  }).lean();
  return file;
};

export const readfile = async (req, id, file) => {
  if (req.query.action === "download") {
    const { url } = await generateSignedUrl({
      Key: `${id}${file.extention}`,
      Method: "GET",
      filename: file.name,
      download: true,
    });
    return { url };
  }

  const { url } = await generateSignedUrl({
    Key: `${id}${file.extention}`,
    Method: "GET",
    filename: file.name,
  });
  return { url };
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

export const uploadFile = async (
  res,
  userId,
  filename,
  filesize,
  filetype,
  parentDirId,
  parentDir,
) => {
  const extention = extname(filename);

  const insertFile = await File.insertOne({
    parentDirId,
    name: filename,
    size: filesize,
    extention,
    userId: userId,
    path: [...parentDir.path],
    isUploading: true,
  });

  const { url } = await generateSignedUrl({
    Key: `${insertFile.id}${extention}`,
    ContentType: filetype,
    Method: "PUT",
  });

  return res.status(200).json({
    message: "File is uploading...",
    id: insertFile.id,
    url,
  });
};

export const removeFile = async (res, id, file) => {
  await File.deleteOne({ _id: id });

  await deleteObject({ Key: `${file._id}${file.extention}` });

  await updateDirectoriesSize(file.parentDirId, -file.size);

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
      },
    );
  return res.status(200).json({
    message: "File renamed successfully",
  });
};
