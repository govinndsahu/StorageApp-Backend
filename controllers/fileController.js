import {
  fetchFile,
  fileValidate,
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

export const createFile = async (req, res, next) => {
  const filename = req.headers.filename || "untitled";
  const filesize = +req.headers.filesize;
  const parentDirId = req.params.parentDirId || req.user.rootDirId.toString();

  if (filesize > 50 * 1024 * 1024 * 1024) {
    console.log("File is too large!");
    return req.destroy();
  }

  try {
    const { maxStorageInBytes } = await User.findById(req.user._id)
      .select("maxStorageInBytes -_id")
      .lean();

    const { size: usedStorageInBytes } = await Directory.findById(
      req.user.rootDirId
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
      req,
      res,
      req.user._id,
      filename,
      filesize,
      parentDirId,
      parentDir
    );

    await updateDirectoriesSize(parentDirId, filesize);

    return response;
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

    const response = await fetchFile(req, res, id, file);
    return response;
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

    await updateDirectoriesSize(file.parentDirId, -file.size);

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
