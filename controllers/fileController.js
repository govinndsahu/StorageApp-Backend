import {
  fileValidate,
  readfile,
  removeFile,
  renamefile,
  uploadFile,
} from "../utils/fileUtils.js";
import {
  updateDirectoriesSize,
  validateDirectory,
} from "../utils/directoryUtils.js";
import User from "../models/userModel.js";
import Directory from "../models/directoryModel.js";
import { fileSchema } from "../validator/fileSchema.js";
import { getObjectData } from "../utils/awsUtils.js";
import File from "../models/fileModel.js";

export const initiateUpload = async (req, res, next) => {
  const parentDirId = req.params.parentDirId || req.user.rootDirId.toString();

  const { success, data, error } = fileSchema.safeParse(req.body);

  if (!success)
    return res.status(400).json({
      error: z.flattenError(error).fieldErrors,
    });

  const { filename, filesize, filetype } = data;

  if (filesize > 50 * 1024 * 1024 * 1024) {
    console.log("File is too large!");
    return req.destroy();
  }

  try {
    const { maxStorageInBytes } = await User.findById(req.user._id)
      .select("maxStorageInBytes -_id")
      .lean();

    const { size: usedStorageInBytes } = await Directory.findById(
      req.user.rootDirId,
    )
      .select("size -_id -userId")
      .lean();

    const availableSizeInBytes = maxStorageInBytes - usedStorageInBytes;

    if (filesize > availableSizeInBytes) {
      console.log("You do not have enough storage for this file!");
      return req.destroy();
    }

    const { directory: parentDir } = await validateDirectory(res, parentDirId);

    if (parentDir.userId.toString() !== req.user._id.toString())
      return res.status(401).json({ error: "Unauthorized operation!" });

    const response = await uploadFile(
      res,
      req.user._id,
      filename,
      filesize,
      filetype,
      parentDirId,
      parentDir,
    );

    return response;
  } catch (error) {
    next(error);
  }
};

export const uploadComplete = async (req, res, next) => {
  const { id } = req.params;
  try {
    const file = await File.findOne({ _id: id, isUploading: true }).select(
      "size extention parentDirId",
    );

    if (!file)
      return res.status(404).json({ error: "File not found in our records" });

    const { response } = await getObjectData({ Key: `${id}${file.extention}` });

    if (response.ContentLength !== file.size) {
      await file.deleteOne();
      return res.status(400).json({ error: "File size does not match." });
    }

    file.isUploading = false;
    await file.save();

    await updateDirectoriesSize(file.parentDirId, file.size);

    return res.status(200).json({
      success: true,
      message: "File uploaded successfully!",
    });
  } catch (error) {
    next(error);
  }
};

export const readFile = async (req, res, next) => {
  const { id } = req.params;
  try {
    const { file } = await fileValidate(res, id);

    if (file.userId.toString() !== req.user._id.toString())
      return res.status(401).json({ error: "Unauthorized access!" });

    const { url } = await readfile(req, id, file);

    return res.redirect(url);
  } catch (err) {
    next(err);
  }
};

export const deleteFile = async (req, res, next) => {
  const { id } = req.params;
  try {
    const { file } = await fileValidate(res, id);

    if (file.userId.toString() !== req.user._id.toString())
      return res.status(404).json({ error: "Unauthorized operation!" });

    const response = await removeFile(res, id, file);

    return response;
  } catch (error) {
    next(error);
  }
};

export const renameFile = async (req, res, next) => {
  const { id } = req.params;
  try {
    const { file } = await fileValidate(res, id);

    if (file.userId.toString() !== req.user._id.toString())
      return res.status(401).json({ error: "Unauthorized Opreation!" });

    const response = await renamefile(req, res, id);
    return response;
  } catch (error) {
    error.status = 500;
    next(error);
  }
};
