import { S3Client } from "@aws-sdk/client-s3";

export const s3Client = process.env.AWS_LAMBDA_FUNCTION_VERSION
  ? new S3Client()
  : new S3Client({
      region: process.env.REGION,
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
      },
    });
