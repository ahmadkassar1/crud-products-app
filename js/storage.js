import { isStoredProduct, validateProduct } from './products.js';

export const STORAGE_KEY = 'products_data';
const VERSION = 1;

export function createProductStore(
  getStorage = () => window.localStorage,
  makeId = () => crypto.randomUUID(),
) {
  let writable = false;
  let raw = null;

  function load() {
    writable = false;
    raw = null;
    try {
      raw = getStorage().getItem(STORAGE_KEY);
      if (raw === null) {
        writable = true;
        return { products: [], writable, raw: null, message: '' };
      }
      const saved = JSON.parse(raw);
      let products;
      if (Array.isArray(saved)) {
        products = saved.map((legacy) => {
          if (
            !legacy ||
            typeof legacy.title !== 'string' ||
            typeof legacy.category !== 'string'
          ) {
            throw new Error('Invalid legacy product');
          }
          const checked = validateProduct(legacy ?? {}, {
            includeQuantity: false,
          });
          if (!checked.valid) throw new Error('Invalid legacy product');
          return { id: makeId(), ...checked.value };
        });
      } else if (saved?.version === VERSION && Array.isArray(saved.products)) {
        products = saved.products;
      } else {
        throw new Error('Unknown storage format');
      }
      if (
        !products.every(isStoredProduct) ||
        new Set(products.map((product) => product.id)).size !== products.length
      ) {
        throw new Error('Invalid product records');
      }
      writable = true;
      return { products, writable, raw, message: '' };
    } catch {
      return {
        products: [],
        writable: false,
        raw,
        message:
          'Saved products could not be loaded. Your stored data has not been changed. Saving is paused to protect it.',
      };
    }
  }

  function save(products) {
    if (!writable)
      return {
        ok: false,
        message: 'Saving is paused because browser storage could not be read.',
      };
    if (
      !products.every(isStoredProduct) ||
      new Set(products.map((product) => product.id)).size !== products.length
    ) {
      return {
        ok: false,
        message: 'The product data is invalid. Nothing was saved.',
      };
    }
    try {
      getStorage().setItem(
        STORAGE_KEY,
        JSON.stringify({ version: VERSION, products }),
      );
      return { ok: true };
    } catch {
      return {
        ok: false,
        message:
          'Changes could not be saved. Browser storage may be full or unavailable. Your previous products and form entries are unchanged; please try again.',
      };
    }
  }

  return { load, save };
}
