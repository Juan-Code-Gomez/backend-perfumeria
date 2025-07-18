import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ProtectedModule } from './protected/protected.module';
import { ProductsModule } from './products/products.module';
import { PrismaModule } from './prisma/prisma.module';
import { CategoryModule } from './category/category.module';
import { SupplierModule } from './supplier/supplier.module';
import { PurchaseModule } from './purchase/purchase.module';
import { SaleModule } from './sale/sale.module';
import { RoleModule } from './role/role.module';
import { UnitModule } from './unit/unit.module';
import { CashClosingModule } from './cash-closing/cash-closing.module';
import { ExpenseModule } from './expense/expense.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    ProtectedModule,
    ProductsModule,
    PrismaModule,
    CategoryModule,
    SupplierModule,
    PurchaseModule,
    SaleModule,
    RoleModule,
    UnitModule,
    CashClosingModule,
    ExpenseModule,
    DashboardModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
