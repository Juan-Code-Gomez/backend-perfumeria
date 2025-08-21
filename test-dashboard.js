// Test del Dashboard Ejecutivo
import { readFile } from 'fs/promises';
import { join } from 'path';

async function testDashboardService() {
  try {
    // Verificar que los archivos existen
    const dashboardService = join(__dirname, 'src/dashboard/dashboard.service.ts');
    const dashboardController = join(__dirname, 'src/dashboard/dashboard.controller.ts');
    
    console.log('✅ Verificando archivos del dashboard...');
    
    const serviceContent = await readFile(dashboardService, 'utf-8');
    const controllerContent = await readFile(dashboardController, 'utf-8');
    
    // Verificar que contienen las funciones necesarias
    if (serviceContent.includes('getExecutiveSummary')) {
      console.log('✅ Método getExecutiveSummary encontrado en el servicio');
    } else {
      console.log('❌ Método getExecutiveSummary NO encontrado en el servicio');
    }
    
    if (controllerContent.includes('executive-summary')) {
      console.log('✅ Endpoint executive-summary encontrado en el controlador');
    } else {
      console.log('❌ Endpoint executive-summary NO encontrado en el controlador');
    }
    
    console.log('✅ Test completado');
    
  } catch (error) {
    console.error('❌ Error en el test:', error);
  }
}

testDashboardService();
