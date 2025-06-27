import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';

import { config } from '../startup/config';

/**
 * Azure storage account setup
 * for blob file upload
 */
export const azureBlobUpload = async (
  fileName: string,
  fileBuffer: Buffer,
  container: string,
): Promise<string> => {
  const account = config.azure.storage.accessKey;
  const accountKey = config.azure.storage.secretAccessKey;
  const sharedKeyCredential = new StorageSharedKeyCredential(account, accountKey);
  const blobServiceClient = new BlobServiceClient(config.azure.storage.url, sharedKeyCredential);
  const containerName = container;
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(fileName);
  await blockBlobClient.uploadData(fileBuffer);
  return blockBlobClient.url;
};

/**
 * Azure storage account setup
 * for file upload
 */
export const azureUploadFile = async (
  file: { path: string },
  actualName: string,
  container: string,
): Promise<string> => {
  const fileName = actualName;
  const account = config.azure.storage.accessKey;
  const accountKey = config.azure.storage.secretAccessKey;
  const sharedKeyCredential = new StorageSharedKeyCredential(account, accountKey);
  const blobServiceClient = new BlobServiceClient(config.azure.storage.url, sharedKeyCredential);
  const containerName = container;
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(fileName);
  await blockBlobClient.uploadFile(file.path);
  return blockBlobClient.url;
};

/**
 * Convert Base64 image to file buffer
 */
type FileBufferResult = {
  originalname: string;
  buffer: Buffer;
};

export const convertBase64ToBuffer = (
  file: string,
  fileTypeObj: { fileName: string; type: string },
): FileBufferResult => {
  const base64Str: string = file;

  const parts = base64Str.split(';base64,');
  if (parts.length < 2) {
    throw new Error('Invalid base64 format');
  }
  // Decode the base64 data
  const base64Data = parts[1];
  if (base64Data === undefined || base64Data === null || base64Data.trim() === '') {
    throw new Error('No base64 data found');
  }
  const decodedData = Buffer.from(base64Data, 'base64');
  // Create a Buffer object from the decoded data
  const image = decodedData;
  return {
    originalname: `${fileTypeObj.fileName}.${fileTypeObj.type}`,
    buffer: image,
  };
};
