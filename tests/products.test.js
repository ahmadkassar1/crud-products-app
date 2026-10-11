import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createProducts,
  filterProducts,
  productTotal,
  updateProduct,
  validateProduct,
} from '../js/products.js';
import { createProductStore, STORAGE_KEY } from '../js/storage.js';

const input = {
  title: 'Keyboard',
  price: '50',
  taxes: '5',
  ads: '2',
  discount: '3',
  count: '1',
  category: 'Peripherals',
};
const product = (id, title = id) => ({
  id,
  title,
  price: 1000,
  taxes: 0,
  ads: 0,
  discount: 0,
  category: 'Audit',
});
function memoryStorage(initial = {}) {
  const items = new Map(Object.entries(initial));
  return {
    items,
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, value),
  };
}

test('money uses cents and validates decimal precision and discounts', () => {
  const result = validateProduct(input);
  assert.equal(result.valid, true);
  assert.equal(productTotal(result.value), 5400);
  assert.equal(
    productTotal(
      validateProduct({
        ...input,
        price: '0.1',
        taxes: '0.2',
        ads: '',
        discount: '',
      }).value,
    ),
    30,
  );
  for (const price of [
    '-1',
    'Infinity',
    'NaN',
    '1.001',
    '1e3',
    '10000000',
    '',
  ]) {
    assert.equal(validateProduct({ ...input, price }).valid, false, price);
  }
  assert.ok(validateProduct({ ...input, discount: '58' }).errors.discount);
});

test('blank text and invalid quantity cannot create products', () => {
  assert.ok(validateProduct({ ...input, title: '  ' }).errors.title);
  assert.ok(validateProduct({ ...input, category: '' }).errors.category);
  for (const count of ['', '0', '-1', '1.5', '100', 'Infinity']) {
    assert.ok(validateProduct({ ...input, count }).errors.count, count);
  }
  assert.equal(validateProduct({ ...input, count: '99' }).valid, true);
});

test('multiple products have distinct stable IDs and independent records', () => {
  let id = 0;
  const created = createProducts(
    validateProduct({ ...input, count: '2' }).value,
    () => String(++id),
  );
  assert.deepEqual(
    created.map((item) => item.id),
    ['1', '2'],
  );
  assert.notEqual(created[0], created[1]);
  created[0].title = 'Changed';
  assert.equal(created[1].title, 'Keyboard');
});

test('editing by ID after deleting an earlier row preserves the other product', () => {
  const records = [product('A'), product('B'), product('C')];
  const remaining = records.filter((item) => item.id !== 'A');
  const checked = validateProduct(
    { ...input, title: 'B updated', count: '' },
    { includeQuantity: false },
  );
  assert.equal(checked.valid, true);
  const updated = updateProduct(remaining, 'B', checked.value);
  assert.deepEqual(
    updated.map((item) => item.title),
    ['B updated', 'C'],
  );
  assert.throws(
    () => updateProduct(updated, 'missing', checked.value),
    /no longer exists/,
  );
  assert.equal(records[1].title, 'B');
});

test('search handles case and surrounding spaces without mutating records', () => {
  const records = [
    product('A', 'Mechanical Keyboard'),
    { ...product('B', 'Monitor'), category: 'Displays' },
  ];
  assert.equal(filterProducts(records, '  KEYBOARD ', 'title')[0].id, 'A');
  assert.equal(filterProducts(records, 'display', 'category')[0].id, 'B');
  assert.equal(filterProducts(records, 'missing', 'title').length, 0);
  assert.equal(records.length, 2);
});

test('legacy records migrate without overwriting the original on read', () => {
  const original = JSON.stringify([{ ...input, total: '999999' }]);
  const storage = memoryStorage({
    [STORAGE_KEY]: original,
    preferences: 'keep',
  });
  const store = createProductStore(
    () => storage,
    () => 'stable-id',
  );
  const loaded = store.load();
  assert.equal(loaded.writable, true);
  assert.equal(productTotal(loaded.products[0]), 5400);
  assert.equal(storage.getItem(STORAGE_KEY), original);
  assert.equal(store.save(loaded.products).ok, true);
  const restored = createProductStore(() => storage).load();
  assert.equal(restored.products[0].id, 'stable-id');
  assert.equal(store.save([]).ok, true);
  assert.equal(storage.getItem('preferences'), 'keep');
});

test('malformed, unknown, invalid or duplicate-ID data remains untouched and blocks writes', () => {
  const invalid = [
    '{invalid',
    'null',
    JSON.stringify({ version: 2, products: [] }),
    JSON.stringify([{ ...input, price: '-5' }]),
    JSON.stringify([{ ...input, title: { text: 'Not a string' } }]),
    JSON.stringify({
      version: 1,
      products: [product('same'), product('same')],
    }),
    JSON.stringify({
      version: 1,
      products: [{ ...product('bad'), price: 1.2 }],
    }),
  ];
  for (const raw of invalid) {
    const storage = memoryStorage({ [STORAGE_KEY]: raw });
    const store = createProductStore(() => storage);
    const loaded = store.load();
    assert.equal(loaded.writable, false);
    assert.equal(loaded.raw, raw);
    assert.equal(store.save([]).ok, false);
    assert.equal(storage.getItem(STORAGE_KEY), raw);
  }
});

test('blocked storage and quota errors return actionable results without destroying previous data', () => {
  const denied = createProductStore(() => {
    throw new Error('Denied');
  });
  assert.equal(denied.load().writable, false);
  assert.equal(denied.save([]).ok, false);
  const original = JSON.stringify({ version: 1, products: [product('A')] });
  const storage = memoryStorage({ [STORAGE_KEY]: original });
  const store = createProductStore(() => storage);
  store.load();
  storage.setItem = () => {
    throw new Error('QuotaExceededError');
  };
  assert.equal(store.save([]).ok, false);
  assert.equal(storage.getItem(STORAGE_KEY), original);
});
