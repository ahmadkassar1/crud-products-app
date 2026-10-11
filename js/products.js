export const MONEY_FIELDS = ['price', 'taxes', 'ads', 'discount'];
export const MAX_AMOUNT = 9_999_999.99;

function toCents(value, required = false) {
  const text = String(value ?? '').trim();
  if (!text && !required) return 0;
  if (!/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(text)) return null;
  const amount = Number(text);
  return amount <= MAX_AMOUNT ? Math.round(amount * 100) : null;
}

export function productTotal(product) {
  return product.price + product.taxes + product.ads - product.discount;
}

export function validateProduct(input, { includeQuantity = true } = {}) {
  const errors = {};
  const value = {};
  for (const field of ['title', 'category']) {
    value[field] = String(input[field] ?? '').trim();
    const limit = field === 'title' ? 120 : 60;
    if (!value[field] || value[field].length > limit) {
      errors[field] = `Enter a ${field} between 1 and ${limit} characters.`;
    }
  }
  for (const field of MONEY_FIELDS) {
    value[field] = toCents(input[field], field === 'price');
    if (value[field] === null)
      errors[field] =
        'Enter a nonnegative amount with up to two decimal places.';
  }
  if (!MONEY_FIELDS.some((field) => errors[field]) && productTotal(value) < 0) {
    errors.discount =
      'Discount cannot exceed the price plus taxes and advertising.';
  }
  if (includeQuantity) {
    const quantity = Number(input.count);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      errors.count = 'Enter a whole number from 1 to 99.';
    }
    value.quantity = quantity;
  }
  return { value, errors, valid: Object.keys(errors).length === 0 };
}

export function createProducts(value, makeId = () => crypto.randomUUID()) {
  const { quantity, ...fields } = value;
  return Array.from({ length: quantity }, () => ({ id: makeId(), ...fields }));
}

export function updateProduct(products, id, value) {
  if (!products.some((product) => product.id === id))
    throw new Error('This product no longer exists.');
  const { quantity, ...fields } = value;
  return products.map((product) =>
    product.id === id ? { id, ...fields } : product,
  );
}

export function filterProducts(products, query, field) {
  const term = query.trim().toLocaleLowerCase();
  return products.filter((product) =>
    product[field].toLocaleLowerCase().includes(term),
  );
}

export function isStoredProduct(product) {
  if (
    !product ||
    typeof product !== 'object' ||
    typeof product.id !== 'string' ||
    !product.id
  )
    return false;
  if (
    !['title', 'category'].every(
      (field) =>
        typeof product[field] === 'string' &&
        product[field].trim() &&
        product[field].length <= (field === 'title' ? 120 : 60),
    )
  )
    return false;
  return (
    MONEY_FIELDS.every(
      (field) =>
        Number.isSafeInteger(product[field]) &&
        product[field] >= 0 &&
        product[field] <= Math.round(MAX_AMOUNT * 100),
    ) && productTotal(product) >= 0
  );
}
