# 🎨 Frontend - Implementación de Fecha Manual en POS

## 📦 Archivos a Modificar

### 1. `src/services/systemParametersService.ts` (Crear si no existe)

```typescript
import api from './api';

export const getManualSaleDateEnabled = async (): Promise<boolean> => {
  try {
    const response = await api.get('/system-parameters/pos/manual-sale-date-enabled');
    return response.data.enabled || false;
  } catch (error) {
    console.error('Error al verificar fecha manual:', error);
    return false;
  }
};

export const getPosConfiguration = async () => {
  try {
    const response = await api.get('/system-parameters/pos/configuration');
    return response.data.data;
  } catch (error) {
    console.error('Error al obtener configuración POS:', error);
    return {
      editCostEnabled: false,
      showProfitMargin: true,
      requireCustomer: false,
      negativeStockAllowed: false,
      allowManualSaleDate: false,
    };
  }
};
```

---

### 2. `src/pages/sales/POSPage.tsx` (Actualizar)

```tsx
import { useState, useEffect } from 'react';
import { Form, DatePicker, Alert, Switch, message } from 'antd';
import { CalendarOutlined, WarningOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../services/api';
import { getManualSaleDateEnabled } from '../../services/systemParametersService';

const POSPage = () => {
  const [form] = Form.useForm();
  const [manualDateEnabled, setManualDateEnabled] = useState(false);
  const [useManualDate, setUseManualDate] = useState(false);
  const [loading, setLoading] = useState(false);

  // Verificar si fecha manual está habilitada
  useEffect(() => {
    const checkManualDate = async () => {
      const enabled = await getManualSaleDateEnabled();
      setManualDateEnabled(enabled);
      
      if (enabled) {
        message.info({
          content: 'Modo de migración activo: Puedes seleccionar fechas personalizadas',
          duration: 5,
          icon: <WarningOutlined style={{ color: '#faad14' }} />
        });
      }
    };
    checkManualDate();
  }, []);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const saleData = {
        ...values,
        // Solo incluir fecha si está habilitado y el usuario eligió usarla
        date: useManualDate && values.saleDate 
          ? values.saleDate.format('YYYY-MM-DD') 
          : undefined,
        totalAmount: calculateTotal(values.details),
        details: values.details.map((detail: any) => ({
          productId: detail.productId,
          quantity: detail.quantity,
          unitPrice: detail.unitPrice,
          totalPrice: detail.quantity * detail.unitPrice,
        })),
      };

      await api.post('/sales', saleData);
      
      message.success(
        useManualDate 
          ? `Venta registrada con fecha ${values.saleDate.format('DD/MM/YYYY')}`
          : 'Venta registrada exitosamente'
      );
      
      form.resetFields();
      setUseManualDate(false);
    } catch (error: any) {
      message.error(
        error.response?.data?.message || 'Error al registrar venta'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pos-container">
      <h1>Punto de Venta</h1>

      {/* Alerta de modo migración */}
      {manualDateEnabled && (
        <Alert
          type="warning"
          message="🔧 Modo de Migración de Datos Activo"
          description={
            <div>
              <p>Puedes registrar ventas con fechas personalizadas.</p>
              <p>
                <strong>Importante:</strong> Usa esta función solo para 
                migrar datos históricos. Para ventas normales, deja desactivado.
              </p>
            </div>
          }
          showIcon
          icon={<CalendarOutlined />}
          closable
          style={{ marginBottom: 24 }}
        />
      )}

      <Form
        form={form}
        onFinish={handleSubmit}
        layout="vertical"
      >
        {/* Toggle para fecha manual */}
        {manualDateEnabled && (
          <Form.Item label="Usar Fecha Personalizada">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Switch 
                checked={useManualDate} 
                onChange={setUseManualDate}
                checkedChildren="Activado"
                unCheckedChildren="Desactivado"
              />
              {useManualDate && (
                <span style={{ color: '#faad14' }}>
                  <WarningOutlined /> Modo de fecha manual activado
                </span>
              )}
            </div>
          </Form.Item>
        )}

        {/* Campo de fecha (solo si está activado) */}
        {manualDateEnabled && useManualDate && (
          <Form.Item
            label="Fecha de la Venta"
            name="saleDate"
            rules={[
              { required: true, message: 'Selecciona la fecha de la venta' }
            ]}
            tooltip="Fecha real en que se realizó la venta"
            extra="La fecha no puede ser futura"
          >
            <DatePicker 
              format="DD/MM/YYYY"
              placeholder="Seleccionar fecha"
              style={{ width: '100%' }}
              disabledDate={(current) => {
                // No permitir fechas futuras
                return current && current > dayjs().endOf('day');
              }}
              defaultValue={dayjs()}
            />
          </Form.Item>
        )}

        {/* ... resto del formulario de venta ... */}
        
        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            size="large"
            block
          >
            {useManualDate ? 'Registrar Venta con Fecha Personalizada' : 'Registrar Venta'}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default POSPage;
```

---

### 3. `src/components/admin/SystemParameters.tsx` (Crear)

```tsx
import { useState, useEffect } from 'react';
import { Card, Switch, message, Spin, Descriptions, Alert } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import api from '../../services/api';

const SystemParameters = () => {
  const [loading, setLoading] = useState(false);
  const [parameters, setParameters] = useState({
    allowManualSaleDate: false,
    editCostEnabled: false,
    showProfitMargin: true,
  });

  useEffect(() => {
    loadParameters();
  }, []);

  const loadParameters = async () => {
    setLoading(true);
    try {
      const response = await api.get('/system-parameters/pos/configuration');
      setParameters(response.data.data);
    } catch (error) {
      message.error('Error al cargar parámetros');
    } finally {
      setLoading(false);
    }
  };

  const toggleParameter = async (key: string, value: boolean) => {
    setLoading(true);
    try {
      await api.put(`/system-parameters/${key}`, {
        parameterValue: value
      });
      
      // Limpiar cache
      await api.post('/system-parameters/cache/clear');
      
      message.success(`Parámetro ${value ? 'activado' : 'desactivado'} exitosamente`);
      await loadParameters();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Error al actualizar parámetro');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spin size="large" />;
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Configuración del Sistema</h1>
      
      <Card title="Parámetros de Ventas" style={{ marginBottom: 24 }}>
        <Descriptions column={1} bordered>
          <Descriptions.Item 
            label={
              <div>
                <div>Fecha Manual en Ventas</div>
                <small style={{ color: '#8c8c8c' }}>
                  Permite registrar ventas con fechas personalizadas
                </small>
              </div>
            }
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Switch
                checked={parameters.allowManualSaleDate}
                onChange={(checked) => toggleParameter('allow_manual_sale_date', checked)}
                disabled={loading}
              />
              {parameters.allowManualSaleDate && (
                <Alert
                  message="Modo de migración activo"
                  type="warning"
                  showIcon
                  icon={<WarningOutlined />}
                  style={{ flex: 1 }}
                />
              )}
            </div>
          </Descriptions.Item>
          
          <Descriptions.Item 
            label={
              <div>
                <div>Editar Costo en POS</div>
                <small style={{ color: '#8c8c8c' }}>
                  Permite modificar el costo de compra en el punto de venta
                </small>
              </div>
            }
          >
            <Switch
              checked={parameters.editCostEnabled}
              onChange={(checked) => toggleParameter('pos_edit_cost_enabled', checked)}
              disabled={loading}
            />
          </Descriptions.Item>
          
          <Descriptions.Item 
            label={
              <div>
                <div>Mostrar Margen de Ganancia</div>
                <small style={{ color: '#8c8c8c' }}>
                  Muestra el margen de ganancia en tiempo real
                </small>
              </div>
            }
          >
            <Switch
              checked={parameters.showProfitMargin}
              onChange={(checked) => toggleParameter('pos_show_profit_margin', checked)}
              disabled={loading}
            />
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Alert
        message="Importante"
        description={
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>
              <strong>Fecha Manual:</strong> Activar solo para migración de datos 
              históricos. Desactivar inmediatamente después de completar.
            </li>
            <li>
              <strong>Editar Costo:</strong> Activar solo si necesitas ajustar costos 
              durante la venta. Mantener desactivado normalmente.
            </li>
            <li>
              Los cambios se aplican inmediatamente en toda la aplicación.
            </li>
          </ul>
        }
        type="info"
        showIcon
      />
    </div>
  );
};

export default SystemParameters;
```

---

### 4. Agregar ruta en `src/router/index.tsx`

```tsx
import SystemParameters from '../components/admin/SystemParameters';

// Dentro de las rutas de SUPER_ADMIN
{
  element: <PrivateRoute allowedRoles={["SUPER_ADMIN"]} />,
  children: [
    { path: "/roles", element: <RolesPage /> },
    { path: "/system-parameters", element: <SystemParameters /> }, // ← Nueva ruta
  ],
}
```

---

### 5. Agregar al menú en `src/components/SidebarMenu.tsx`

```tsx
// Solo para SUPER_ADMIN
{userRoles.includes('SUPER_ADMIN') && (
  <Menu.Item key="/system-parameters" icon={<SettingOutlined />}>
    <Link to="/system-parameters">Configuración del Sistema</Link>
  </Menu.Item>
)}
```

---

## 📝 Resumen de Cambios Frontend

1. ✅ Servicio para verificar parámetros
2. ✅ Campo de fecha opcional en POS
3. ✅ Switch para activar/desactivar fecha manual
4. ✅ Validación de fecha (no futuras)
5. ✅ Alertas visuales cuando está activado
6. ✅ Página de administración de parámetros (SUPER_ADMIN)

---

## 🧪 Testing Frontend

```typescript
// Test 1: Verificar que campo no aparece por defecto
// Resultado esperado: Sin campo de fecha

// Test 2: Activar parámetro desde admin
// Resultado esperado: Aparece alerta amarilla en POS

// Test 3: Activar switch de fecha manual
// Resultado esperado: Aparece DatePicker

// Test 4: Seleccionar fecha y crear venta
// Resultado esperado: Venta creada con fecha seleccionada

// Test 5: Intentar seleccionar fecha futura
// Resultado esperado: Fecha deshabilitada en el picker
```

---

## 🎨 Estilos Recomendados

```css
/* styles/pos.css */

.pos-migration-alert {
  border-left: 4px solid #faad14;
  background: #fffbe6;
}

.manual-date-section {
  padding: 16px;
  background: #f0f2f5;
  border-radius: 8px;
  margin-bottom: 16px;
}

.date-warning {
  color: #faad14;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}
```

---

**Implementado**: Octubre 2025  
**Compatible con**: React 19 + Ant Design 5.x
