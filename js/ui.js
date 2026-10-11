import { productTotal } from './products.js';

const numberFormat = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
export const formatMoney = (cents) => numberFormat.format(cents / 100);

export function renderProducts(tbody, products, queryActive) {
  const fragment = document.createDocumentFragment();
  if (!products.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 10;
    cell.className = 'empty-state';
    cell.textContent = queryActive
      ? 'No products match your search.'
      : 'No products yet. Add your first product above.';
    row.append(cell);
    fragment.append(row);
  }
  products.forEach((product, index) => {
    const row = document.createElement('tr');
    const values = [
      index + 1,
      product.title,
      ...['price', 'taxes', 'ads', 'discount'].map((field) =>
        formatMoney(product[field]),
      ),
      formatMoney(productTotal(product)),
      product.category,
    ];
    for (const value of values) {
      const cell = document.createElement('td');
      cell.textContent = String(value);
      row.append(cell);
    }
    for (const action of ['edit', 'delete']) {
      const cell = document.createElement('td');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `row-action ${action}`;
      button.dataset.action = action;
      button.dataset.id = product.id;
      button.textContent = action === 'edit' ? 'Edit' : 'Delete';
      button.setAttribute(
        'aria-label',
        `${button.textContent} ${product.title}`,
      );
      cell.append(button);
      row.append(cell);
    }
    fragment.append(row);
  });
  tbody.replaceChildren(fragment);
}

export function renderErrors(form, errors) {
  for (const field of [
    'title',
    'price',
    'taxes',
    'ads',
    'discount',
    'count',
    'category',
  ]) {
    const input = form.elements.namedItem(field);
    input.setAttribute('aria-invalid', errors[field] ? 'true' : 'false');
    document.getElementById(`${field}-error`).textContent = errors[field] ?? '';
  }
}
