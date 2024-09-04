import { StatusCode } from "../enums/StatusCode";

export const removeNestedIds: any = (doc: any) => {
  if (Array.isArray(doc)) {
    return doc.map((item) => removeNestedIds(item));
  } else if (doc !== null && typeof doc === "object") {
    const newDoc = { ...doc };
    delete newDoc._id;
    for (const key in newDoc) {
      if (newDoc.hasOwnProperty(key)) {
        newDoc[key] = removeNestedIds(newDoc[key]);
      }
    }
    return newDoc;
  }
  return doc;
};

export const updateCachedDataPerItem = (data: any, newItem: any, isDelete?: string) => {
  if (!data || !newItem) return;

  let updatedData = { ...data };

  if (isDelete) {
    if (updatedData[`${newItem._id}`]) {
      delete updatedData[`${newItem._id}`];
    }

    if (updatedData[newItem.name]) {
      delete updatedData[newItem.name];
    }

    if (updatedData[`all`]) {
      const itemExists = updatedData[`all`].find((item: any) => item._id === newItem._id);

      if (itemExists) {
        updatedData[`all`] = data[`all`].filter((item: any) => item._id !== newItem._id);
      }
    }

    if (newItem.foodGroup && updatedData[newItem.foodGroup]) {
      updatedData[newItem.foodGroup] = data[newItem.foodGroup].filter(
        (item: any) => item._id !== newItem._id
      );
    }

    return updatedData;
  }

  updatedData[`${newItem._id}`] = newItem;

  updatedData[newItem.name] = newItem;

  if (updatedData[`all`]) {
    const itemExists = updatedData[`all`].find((item: any) => item._id === newItem._id);

    if (itemExists) {
      updatedData[`all`] = data[`all`].map((item: any) =>
        item._id == newItem._id ? newItem : item
      );
    } else {
      updatedData[`all`] = [...data[`all`], newItem];
    }
  }

  if (newItem.foodGroup && updatedData[newItem.foodGroup]) {
    updatedData[newItem.foodGroup] = [...data[newItem.foodGroup], newItem];
  }

  return updatedData;
};

export const updateCachedArrays = (data: any, array: any, key: string) => {
  if (!data || array || key) return;

  let updatedData = { ...data };

  updatedData[key] = array;

  return updatedData;
};

export const createResponse = (statusCode: StatusCode, message?: string) => {
  return {
    statusCode: statusCode,
    body: JSON.stringify({
      message,
    }),
  };
};

export const createResponseWithData = (statusCode: StatusCode, data: any, message?: string) => {
  return {
    statusCode: statusCode,
    body: JSON.stringify({
      message,
      data,
    }),
  };
};

export const createServerErrorResponse = (err: any) => {
  return {
    statusCode: StatusCode.INTERNAL_SERVER_ERROR,
    body: JSON.stringify({
      message: err?.message || err,
    }),
  };
};
