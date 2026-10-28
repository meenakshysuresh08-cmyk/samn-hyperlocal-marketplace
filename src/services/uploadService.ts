import axios from 'axios';
import * as FileSystem from 'expo-file-system';

import { UPLOAD_ENDPOINT } from '../config';

export type UploadFilePart = {
  uri: string;
  name: string;
  type: string;
};

export type UploadResponse = {
  id: string;
  url?: string;
};

const createMultipartBody = (file: UploadFilePart) => {
  const body = new FormData();

  body.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as unknown as Blob);

  return body;
};

export const inspectLocalFile = async (uri: string) => {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) {
      return null;
    }
    return info;
  } catch {
    return null;
  }
};

export const uploadFile = async (file: UploadFilePart) => {
  await inspectLocalFile(file.uri);

  const response = await axios.post<UploadResponse>(
    UPLOAD_ENDPOINT,
    createMultipartBody(file),
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data;
};
