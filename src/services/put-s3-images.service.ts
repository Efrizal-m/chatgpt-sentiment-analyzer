import axios, { AxiosError } from 'axios';
import { readFileSync, unlink, writeFileSync } from 'fs';
import { config, S3 } from 'aws-sdk';
import Logger from '../library/logger/Logger';
config.loadFromPath('src/configs/config.json');

//write your bucket name
const bucketName = '';
const s3Bucket = new S3({
  params: {
    Bucket: bucketName,
  },
});

export const s3Image = {
  putS3Image: async (srcUrl: string, s3Key: string) => {
    try {
      const { data } = await axios.get(srcUrl, { responseType: 'arraybuffer' });
      const tempFile = 'tmp/logo/' + s3Key.replace('/', '');

      writeFileSync(tempFile, Buffer.from(data, 'binary'));

      s3Bucket.putObject(
        {
          Body: readFileSync(tempFile, null),
          Key: s3Key,
          ACL: 'public-read',
          Bucket: bucketName,
        },
        (err, data) => {
          if (err) Logger.warn(err);
          Logger.info('s3 put object data', data.ETag);
          unlink('./' + tempFile, (err) => {
            if (err) Logger.warn(err);
          });
        },
      );
    } catch (error) {
      Logger.warn('error on put s3 image', error instanceof AxiosError ? error.message : error);
    }
  },

  // your s3 image uri
  s3Uri: '',
};
