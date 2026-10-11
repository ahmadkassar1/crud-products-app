import {
  createProducts,
  filterProducts,
  productTotal,
  updateProduct,
  validateProduct,
  MONEY_FIELDS,
} from './products.js';
import { createProductStore, STORAGE_KEY } from './storage.js';
import { formatMoney, renderErrors, renderProducts } from './ui.js';

const form = document.getElementById('product-form');
const tbody = document.getElementById('tbody');
const search = document.getElementById('search');
const searchField = document.getElementById('search-field');
const status = document.getElementById('status');
const undoButton = document.getElementById('undo');
const cancelButton = document.getElementById('cancel-edit');
const deleteAllButton = document.getElementById('delete-all');
const dialog = document.getElementById('delete-dialog');
const store = createProductStore();
let products = [];
let editingId = null;
let undoSnapshot = null;
let pendingDelete = [];
let writable = false;

function announce(message) {
  status.textContent = message;
}

function values() {
  return Object.fromEntries(new FormData(form));
}

function render() {
  const filtered = filterProducts(products, search.value, searchField.value);
  renderProducts(tbody, filtered, Boolean(search.value.trim()));
  document.getElementById('product-count').textContent =
    `${filtered.length} of ${products.length} products`;
  deleteAllButton.disabled = !writable || products.length === 0;
  deleteAllButton.textContent = `Delete all${products.length ? ` (${products.length})` : ''}`;
}

function resetForm() {
  editingId = null;
  form.reset();
  form.elements.count.disabled = false;
  document.getElementById('quantity-field').hidden = false;
  document.getElementById('form-heading').textContent = 'Add a product';
  document.getElementById('submit').textContent = 'Create product';
  document.getElementById('total').textContent = '—';
  cancelButton.hidden = true;
  renderErrors(form, {});
}

function commit(nextProducts, message, { undo = false } = {}) {
  const result = store.save(nextProducts);
  if (!result.ok) {
    announce(result.message);
    return false;
  }
  undoSnapshot = undo ? products : null;
  undoButton.hidden = !undo;
  products = nextProducts;
  render();
  announce(message);
  return true;
}

function load() {
  const result = store.load();
  products = result.products;
  writable = result.writable;
  document.getElementById('storage-warning').hidden = writable;
  document.getElementById('storage-message').textContent = result.message;
  document.getElementById('submit').disabled = !writable;
  const download = document.getElementById('download-saved');
  download.hidden = writable || result.raw === null;
  download.onclick = () => {
    const url = URL.createObjectURL(
      new Blob([result.raw], { type: 'application/json' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'products-recovery.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  render();
}

form.addEventListener('input', () => {
  const checked = validateProduct(values(), {
    includeQuantity: editingId === null,
  });
  const moneyValid = !MONEY_FIELDS.some((field) => checked.errors[field]);
  document.getElementById('total').textContent = moneyValid
    ? formatMoney(productTotal(checked.value))
    : '—';
  for (const input of form.querySelectorAll('[aria-invalid="true"]')) {
    const error = checked.errors[input.name];
    input.setAttribute('aria-invalid', error ? 'true' : 'false');
    document.getElementById(`${input.name}-error`).textContent = error ?? '';
  }
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!writable) return;
  const checked = validateProduct(values(), {
    includeQuantity: editingId === null,
  });
  renderErrors(form, checked.errors);
  if (!checked.valid) {
    announce('Please correct the highlighted fields. No products were saved.');
    form.elements.namedItem(Object.keys(checked.errors)[0]).focus();
    return;
  }
  try {
    const next =
      editingId === null
        ? [...products, ...createProducts(checked.value)]
        : updateProduct(products, editingId, checked.value);
    const message =
      editingId === null
        ? `Created ${checked.value.quantity} ${checked.value.quantity === 1 ? 'product' : 'products'}.`
        : 'Product updated.';
    if (commit(next, message)) {
      resetForm();
      form.elements.title.focus();
    }
  } catch (error) {
    announce(error.message);
  }
});

cancelButton.addEventListener('click', () => {
  resetForm();
  form.elements.title.focus();
  announce('Edit cancelled. Your products are unchanged.');
});
search.addEventListener('input', render);
searchField.addEventListener('change', render);

function requestDelete(ids) {
  pendingDelete = ids;
  const product = products.find((item) => item.id === ids[0]);
  document.getElementById('delete-message').textContent =
    ids.length === 1
      ? `Delete “${product.title}”? You can undo this until your next change or page refresh.`
      : `Delete all ${ids.length} products? You can undo this until your next change or page refresh.`;
  dialog.showModal();
  document.getElementById('cancel-delete').focus();
}

tbody.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button || !writable) return;
  const product = products.find((item) => item.id === button.dataset.id);
  if (!product) return;
  if (button.dataset.action === 'delete') {
    requestDelete([product.id]);
    return;
  }
  resetForm();
  editingId = product.id;
  for (const field of ['title', 'category'])
    form.elements.namedItem(field).value = product[field];
  for (const field of MONEY_FIELDS)
    form.elements.namedItem(field).value = (product[field] / 100).toFixed(2);
  form.elements.count.disabled = true;
  document.getElementById('quantity-field').hidden = true;
  document.getElementById('form-heading').textContent = 'Edit product';
  document.getElementById('submit').textContent = 'Save changes';
  document.getElementById('total').textContent = formatMoney(
    productTotal(product),
  );
  cancelButton.hidden = false;
  form.elements.title.focus();
  announce('Editing product. Save your changes or cancel.');
});

deleteAllButton.addEventListener('click', () =>
  requestDelete(products.map((product) => product.id)),
);
document
  .getElementById('cancel-delete')
  .addEventListener('click', () => dialog.close());
document.getElementById('confirm-delete').addEventListener('click', () => {
  const next = products.filter(
    (product) => !pendingDelete.includes(product.id),
  );
  const removed = products.length - next.length;
  if (
    !commit(
      next,
      `Deleted ${removed} ${removed === 1 ? 'product' : 'products'}. Undo is available.`,
      { undo: true },
    )
  )
    return;
  if (pendingDelete.includes(editingId)) resetForm();
  dialog.close();
  undoButton.focus();
});
dialog.addEventListener('close', () => {
  pendingDelete = [];
});
undoButton.addEventListener('click', () => {
  if (
    undoSnapshot &&
    commit(undoSnapshot, 'Deletion undone. Products restored.')
  )
    form.elements.title.focus();
});

window.addEventListener('storage', (event) => {
  if (event.key !== STORAGE_KEY && event.key !== null) return;
  undoSnapshot = null;
  undoButton.hidden = true;
  if (dialog.open) dialog.close();
  resetForm();
  load();
  announce(
    'Products changed in another tab. The list was refreshed; any open edit was cancelled.',
  );
});

load();
