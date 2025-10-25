// Script para validar el payload del frontend
const payload = {
    "invoiceNumber": "prueba",
    "supplierId": 1,
    "invoiceDate": "2025-10-25T19:03:49.952Z",
    "dueDate": "2025-10-25T05:00:00.000Z",
    "discount": 0,
    "processInventory": true,
    "items": [
        {
            "productId": 31,
            "quantity": 1,
            "unitCost": 29000,
            "description": "212 vip black men"
        }
    ]
};

console.log('\n🔍 ANÁLISIS DEL PAYLOAD\n');
console.log('='.repeat(60));

// Validar tipos
console.log('\n📊 Validación de Tipos:\n');

console.log('invoiceNumber:', typeof payload.invoiceNumber, '→', payload.invoiceNumber.constructor.name);
console.log('supplierId:', typeof payload.supplierId, '→', payload.supplierId.constructor.name);
console.log('invoiceDate:', typeof payload.invoiceDate, '→', payload.invoiceDate.constructor.name);
console.log('dueDate:', typeof payload.dueDate, '→', payload.dueDate.constructor.name);
console.log('discount:', typeof payload.discount, '→', payload.discount.constructor.name);
console.log('processInventory:', typeof payload.processInventory, '→', payload.processInventory.constructor.name);

console.log('\n📦 Items[0]:');
const item = payload.items[0];
console.log('productId:', typeof item.productId, '→', item.productId.constructor.name, '✅');
console.log('quantity:', typeof item.quantity, '→', item.quantity.constructor.name, '✅');
console.log('unitCost:', typeof item.unitCost, '→', item.unitCost.constructor.name, '✅');
console.log('description:', typeof item.description, '→', item.description.constructor.name, '✅');

// Validaciones específicas
console.log('\n✅ Validaciones Específicas:\n');

const validations = [
  {
    field: 'invoiceNumber',
    type: 'string',
    value: payload.invoiceNumber,
    valid: typeof payload.invoiceNumber === 'string',
  },
  {
    field: 'supplierId',
    type: 'number',
    value: payload.supplierId,
    valid: typeof payload.supplierId === 'number' && Number.isInteger(payload.supplierId),
  },
  {
    field: 'invoiceDate',
    type: 'ISO string',
    value: payload.invoiceDate,
    valid: typeof payload.invoiceDate === 'string' && !isNaN(Date.parse(payload.invoiceDate)),
  },
  {
    field: 'discount',
    type: 'number',
    value: payload.discount,
    valid: typeof payload.discount === 'number',
  },
  {
    field: 'items[0].productId',
    type: 'number',
    value: item.productId,
    valid: typeof item.productId === 'number' && Number.isInteger(item.productId),
  },
  {
    field: 'items[0].quantity',
    type: 'number',
    value: item.quantity,
    valid: typeof item.quantity === 'number',
  },
  {
    field: 'items[0].unitCost',
    type: 'number',
    value: item.unitCost,
    valid: typeof item.unitCost === 'number',
  },
];

validations.forEach(v => {
  console.log(`${v.valid ? '✅' : '❌'} ${v.field.padEnd(25)} ${v.type.padEnd(15)} = ${v.value}`);
});

// Verificar que el supplierId existe
console.log('\n⚠️  POSIBLES PROBLEMAS:\n');

if (payload.supplierId === 1) {
  console.log('❓ supplierId = 1 → ¿Existe el proveedor con ID 1 en la BD?');
  console.log('   Esto podría causar error si el proveedor no existe.');
}

if (item.productId === 31) {
  console.log('❓ productId = 31 → ¿Existe el producto con ID 31 en la BD?');
  console.log('   Esto podría causar error si el producto no existe.');
}

console.log('\n' + '='.repeat(60));
console.log('\n📝 Payload JSON (para copiar):\n');
console.log(JSON.stringify(payload, null, 2));
console.log('\n');
