export type ProductPickerItem = {
  id: string;
  label: string;
  search: string;
  meta?: string;
  data?: Record<string, string>;
};

type ProductPickerOptions = {
  items?: ProductPickerItem[];
  value?: string;
  onSelect?: (item: ProductPickerItem | null) => void;
};

export type ProductPicker = {
  setItems: (items: ProductPickerItem[]) => void;
  setValue: (value: string) => void;
  getValue: () => string;
};

const normalize = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export function setupProductPicker(root: HTMLElement, options: ProductPickerOptions = {}): ProductPicker {
  const input = root.querySelector('[data-product-search]') as HTMLInputElement;
  const select = root.querySelector('[data-product-value]') as HTMLSelectElement;
  const results = root.querySelector('[data-product-results]') as HTMLElement;
  let items = options.items || [];

  const close = () => {
    results.hidden = true;
    input.setAttribute('aria-expanded', 'false');
  };

  const render = () => {
    const query = normalize(input.value);
    const matches = items.filter((item) => !query || normalize(item.search).includes(query)).slice(0, 10);
    results.replaceChildren();
    if (!matches.length) {
      const empty = document.createElement('p');
      empty.className = 'product-picker-empty';
      empty.textContent = 'No encontramos productos.';
      results.appendChild(empty);
    } else {
      matches.forEach((item) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'product-picker-option';
        button.setAttribute('role', 'option');
        button.dataset.productId = item.id;
        const label = document.createElement('span');
        label.textContent = item.label;
        button.appendChild(label);
        if (item.meta) {
          const meta = document.createElement('small');
          meta.textContent = item.meta;
          button.appendChild(meta);
        }
        results.appendChild(button);
      });
    }
    results.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  };

  const rebuildSelect = () => {
    const selected = select.value;
    select.replaceChildren(new Option('— Elegí —', ''));
    items.forEach((item) => {
      const option = new Option(item.label, item.id);
      Object.entries(item.data || {}).forEach(([key, value]) => {
        option.dataset[key] = value;
      });
      select.appendChild(option);
    });
    select.value = items.some((item) => item.id === selected) ? selected : '';
  };

  const setValue = (value: string) => {
    const item = items.find((candidate) => candidate.id === value) || null;
    select.value = item?.id || '';
    input.value = item?.label || '';
    close();
  };

  input.addEventListener('focus', render);
  input.addEventListener('input', () => {
    select.value = '';
    options.onSelect?.(null);
    render();
  });
  results.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest(
      '.product-picker-option',
    ) as HTMLButtonElement | null;
    if (!button?.dataset.productId) return;
    const item = items.find((candidate) => candidate.id === button.dataset.productId) || null;
    setValue(item?.id || '');
    options.onSelect?.(item);
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  document.addEventListener('click', (event) => {
    if (!root.contains(event.target as Node)) close();
  });

  rebuildSelect();
  setValue(options.value || '');

  return {
    setItems(nextItems) {
      const selected = select.value;
      items = nextItems;
      rebuildSelect();
      setValue(selected);
    },
    setValue,
    getValue: () => select.value,
  };
}
