import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "../config/aws.js";

export const generateSignedUrl = async ({
  Bucket = "storage-app-backend",
  Key,
  ContentType,
  Method,
  download = false,
  filename,
}) => {
  const commandForPut = new PutObjectCommand({
    Bucket,
    Key,
    ContentType,
  });

  const commandForGet = new GetObjectCommand({
    Bucket,
    Key,
    ResponseContentDisposition: `${
      download ? "attachment" : "inline"
    }; filename=${filename}`,
  });

  const url = await getSignedUrl(
    s3Client,
    Method === "PUT" ? commandForPut : commandForGet,
    {
      expiresIn: 600,
      signableHeaders: new Set(["content-type"]),
    }
  );

  return { url };
};

export const generateDownloadSignedUrl = async ({
  Bucket = "storage-app-backend",
  Key,
}) => {
  const command = new GetObjectCommand({
    Bucket,
    Key,
  });

  const url = await getSignedUrl(s3Client, command, {
    expiresIn: 600,
  });

  return { url };
};

export const getObjectData = async ({ Bucket = "storage-app-backend", Key }) => {
  const command = new HeadObjectCommand({
    Bucket,
    Key,
  });

  const response = await s3Client.send(command);

  if (response.$metadata.httpStatusCode !== 200)
    return res.status(403).json({ error: "something went wrong!" });

  return { response };
};

export const deleteObject = async ({ Bucket = "storage-app-backend", Key }) => {
  const command = new DeleteObjectCommand({
    Bucket,
    Key,
  });

  const response = await s3Client.send(command);

  return { response };
};

export const deleteObjects = async ({
  Bucket = "storage-app-backend",
  Objects,
}) => {
  const command = new DeleteObjectsCommand({
    Bucket,
    Delete: {
      Objects,
    },
  });

  const response = await s3Client.send(command);

  if (response.$metadata.httpStatusCode !== 200)
    return res.status(403).json({ error: "something went wrong!" });

  return { response };
};
