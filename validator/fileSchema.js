import { z } from "zod/v4";

export const fileSchema = z.object({
  filename: z.string(),
  filesize: z.number(),
  filetype: z.string(),
});
