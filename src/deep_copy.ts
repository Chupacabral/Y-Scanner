// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function deepCopy(obj: any) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  if (obj instanceof Array) {
    return obj.reduce((arr, item, i) => {
      arr[i] = deepCopy(item);
      return arr;
    }, []);
  }

  if (obj instanceof Object) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Object.keys(obj).reduce((newObj: any, key) => {
      newObj[key] = deepCopy(obj[key]);
      return newObj;
    }, {});
  }
}
