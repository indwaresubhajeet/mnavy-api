import jwt from 'jsonwebtoken';
import { StringValue } from 'ms';

import { config } from '../startup/config';
import { ApplicationAdmin } from '../types/application-admin';
import { DataObject, StringKeyObject, FilterObject } from '../types/common';
import { User } from '../types/user';

import { azureBlobUpload, convertBase64ToBuffer } from './upload';

/**
 * Image upload generic function for BASE64STR.
 * parameter base64 string
 */
export function imageUpload(base64Str: string, container: string): Promise<string> | false {
  //image extension check
  const ext = base64Str.split(';')[0]?.split(':')[1];
  let exttype = '';
  if (ext === 'image/png') {
    exttype = 'png';
  } else if (ext === 'image/jpg') {
    exttype = 'jpg';
  } else if (ext === 'image/jpeg') {
    exttype = 'jpeg';
  } else {
    return false;
  }

  //randomizing image names and converting base64 to image buffer
  const imageFileName = Date.now();
  const imageName = imageFileName.toString();
  const optionalObj = { fileName: imageName, type: exttype };
  const image = convertBase64ToBuffer(base64Str, optionalObj);
  const fileName = image.originalname;
  const filePath = image.buffer;

  //azure storage container name and getting image url after uploading image
  const imageUrl = azureBlobUpload(fileName, filePath, container);
  return imageUrl;
}

/**
 * Application Admin token generation for jwt
 * jwt signing with application admin data
 */
export async function generateAdminToken(
  admin: Pick<ApplicationAdmin, 'id' | 'email'>,
): Promise<string> {
  const tokenOptions: jwt.SignOptions = {
    expiresIn: `${config.jwt.expiresInDays}d`,
    algorithm: 'HS256', // Specify the signing algorithm (e.g., HS256)
  };

  return jwt.sign(
    {
      id: admin.id,
      email: admin.email,
      isAdmin: true,
      status: true, // Application admins are always active
      userType: 'Admin',
    },
    config.jwt.secret,
    tokenOptions,
  );
}

/**
 * User token generation for jwt
 * jwt signing with user data
 */
export async function generateUserToken(
  user: Pick<User, 'id' | 'name' | 'email' | 'isActive' | 'userType'>,
): Promise<string> {
  const tokenOptions: jwt.SignOptions = {
    expiresIn: `${config.jwt.expiresInDays}d`,
    algorithm: 'HS256', // Specify the signing algorithm (e.g., HS256)
  };

  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: false,
      status: user.isActive,
      userType: user.userType,
    },
    config.jwt.secret,
    tokenOptions,
  );
}

/**
 * Token generation for jwt
 * Generate normal token
 * jwt signing without admin data
 */
export function generateToken(payload: DataObject, expiry: StringValue | number): string {
  const tokenOptions: jwt.SignOptions = {
    expiresIn: expiry,
    algorithm: 'HS256', // Specify the signing algorithm (e.g., HS256)
  };

  return jwt.sign(payload, config.jwt.secret, tokenOptions);
}

/**
 * Token verify
 * jwt token verify
 */
export function verifyToken(token: string): jwt.JwtPayload | string {
  return jwt.verify(token, config.jwt.secret);
}

/**
 * Transform Populate response
 * from query-builder helper class
 */
export function transformResponse(response: DataObject[], prefixes: string[]): DataObject[] {
  return response.map((item): DataObject => {
    let res = {};
    prefixes.forEach((prefix): void => {
      const relatableTable: StringKeyObject = {};

      Object.keys(item).forEach((key): void => {
        const adjustedKey = key.split('_').slice(0, -1).join('_');
        if (adjustedKey === prefix) {
          relatableTable[key.substring(prefix.length + 1)] = item[key] as string;
          delete item[key];
        }
      });
      res = { ...res, [prefix]: relatableTable };
    });
    res = { ...item, ...res };
    return res;
  });
}

/**
 * Transform Populate response one
 * from query-builder helper class
 */
export function transformResponseOne(response: DataObject, prefixes: string[]): DataObject {
  let res = {};
  prefixes.forEach((prefix): void => {
    const relatableTable: StringKeyObject = {};
    Object.keys(response).forEach((key): void => {
      const adjustedKey = key.split('_').slice(0, -1).join('_');
      if (adjustedKey === prefix) {
        relatableTable[key.substring(prefix.length + 1)] = response[key] as string;
        delete response[key];
      }
    });
    res = { ...res, [prefix]: relatableTable };
  });
  return { ...response, ...res };
}

// Find fields whose values are changed in two objects
type ChangedFields = {
  previous: DataObject;
  current: DataObject;
};

export const findChangedFields = (reqObject: DataObject, dbObject: DataObject): ChangedFields => {
  const previous: DataObject = {};
  const current: DataObject = {};

  // Iterate over keys in the request object only
  Object.keys(reqObject).forEach((key): void => {
    if (dbObject[key] && reqObject[key] !== dbObject[key]) {
      previous[key] = dbObject[key];
      current[key] = reqObject[key];
    }
  });

  return { previous, current };
};

export const deepEqual = (obj1: DataObject, obj2: DataObject): boolean => {
  if (obj1 === obj2) return true;

  if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key] as DataObject, obj2[key] as DataObject)) {
      return false;
    }
  }

  return true;
};

/**
 * Check whether the input is base64 string or image url for edit apis mostly
 */
export function checkImageInput(input: string): 'Base64' | 'URL' | 'Unknown' {
  const base64Pattern = /^data:image\/(png|jpeg|jpg|gif);base64,/;
  const urlPattern = /\.(jpeg|jpg|gif|png)$/;

  if (base64Pattern.test(input)) {
    return 'Base64';
  } else if (urlPattern.test(input)) {
    return 'URL';
  } else {
    return 'Unknown';
  }
}

/**
 *
 * @param filters
 *
 * @returns filterObject
 */
export function getFilterObject(filters: { id: string; value: unknown }[]): FilterObject {
  const result = filters.reduce((acc: FilterObject, filter): FilterObject => {
    acc[filter.id] = `%${filter.value}%`;
    return acc;
  }, {});
  return result;
}

/**
 * Randomly generated otp
 */
export function generateOtp(): number {
  return Math.floor(1000 + Math.random() * 9000);
}
