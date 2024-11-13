terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.9.0"
    }
  }
  backend "azurerm" {
    resource_group_name  = "rg-rubrica-dev"
    storage_account_name = "storubricabackend"
    container_name      = "tfstate"
    key                = "terraform.tfstate"
  }
}

provider "azurerm" {
  features {}
  subscription_id = var.azure_subscription
}

# Use existing resource group
data "azurerm_resource_group" "rg_rubrica" {
  name = var.resource_group
}

# App Service Plan (F1: Free Tier)
resource "azurerm_service_plan" "app_service_plan" {
  name                = var.app_service_plan_name
  resource_group_name = data.azurerm_resource_group.rg_rubrica.name
  location            = data.azurerm_resource_group.rg_rubrica.location
  os_type             = "Linux"
  sku_name            = "F1"
}

# SQL Server
resource "azurerm_mssql_server" "sql_server" {
  name                         = "${var.app_service_name}-sqlserver"
  resource_group_name          = data.azurerm_resource_group.rg_rubrica.name
  location                     = data.azurerm_resource_group.rg_rubrica.location
  version                      = "12.0"
  administrator_login          = var.database_username
  administrator_login_password = var.database_password

  public_network_access_enabled = false
}

# Free SQL Database
resource "azurerm_mssql_database" "free_database" {
  name           = var.database_name
  server_id      = azurerm_mssql_server.sql_server.id
  collation      = "SQL_Latin1_General_CP1_CI_AS"
  license_type   = "LicenseIncluded"
  max_size_gb    = 32
  sku_name       = "GP_S_Gen5_1"  # General Purpose Serverless Gen5, 1 vCore
  zone_redundant = false

  auto_pause_delay_in_minutes = 60
  min_capacity               = 0.5
  
  tags = {
    Environment = "Production"
    Service     = "Free-Tier-SQL"
  }

  # Impostazioni specifiche per il Free Tier
  lifecycle {
    ignore_changes = [
      sku_name,  # Ignora cambiamenti al SKU per mantenere Free Tier
      max_size_gb
    ]
  }
}

# Allow Azure Services Firewall Rule
resource "azurerm_mssql_firewall_rule" "allow_azure_services" {
  name             = "AllowAzureServices"
  server_id        = azurerm_mssql_server.sql_server.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}


# Web App with Azure SQL Database
resource "azurerm_linux_web_app" "webapp_with_db" {
  name                = var.app_service_name
  resource_group_name = data.azurerm_resource_group.rg_rubrica.name
  location            = data.azurerm_resource_group.rg_rubrica.location
  service_plan_id     = azurerm_service_plan.app_service_plan.id
  
  

  site_config {
    application_stack {
      python_version = "3.9"
    }
    always_on = false
  }

  app_settings = {
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE" = "true"
    "SCM_DO_BUILD_DURING_DEPLOYMENT"      = "true"
    "PYTHON_ENABLE_WORKER_MP"             = "true"
    "DATABASE_TYPE"                       = "azure_sql"
    "DATABASE_NAME"                       = azurerm_mssql_database.free_database.name
    "DATABASE_SERVER"                     = azurerm_mssql_server.sql_server.fully_qualified_domain_name
    "DATABASE_USERNAME"                   = var.database_username
    "DATABASE_PASSWORD"                   = var.database_password
    "ENVIRONMENT"                         = "production"
  }

  connection_string {
    name  = "Database"
    type  = "SQLAzure"
    value = "Server=${azurerm_mssql_server.sql_server.fully_qualified_domain_name};Database=${azurerm_mssql_database.free_database.name};User ID=${var.database_username};Password=${var.database_password}"
  }
  identity {
    type = "SystemAssigned"
  }
}


resource "azurerm_mssql_server_azure_ad_administrator" "sql_ad_admin" {
  server_id               = azurerm_mssql_server.sql_server.id
  login_username         = "AzureAD Admin"
  object_id              = azurerm_linux_web_app.webapp_with_db.identity[0].principal_id
  tenant_id              = data.azurerm_client_config.current.tenant_id
}



# Monitoring Alert Action Group
resource "azurerm_monitor_action_group" "email_alert" {
  name                = "database-alerts"
  resource_group_name = data.azurerm_resource_group.rg_rubrica.name
  short_name          = "db-alerts"

  email_receiver {
    name          = "admin"
    email_address = var.alert_email_address
  }
}

# vCore Usage Alert
resource "azurerm_monitor_metric_alert" "vcore_alert" {
  name                = "vcores-usage-alert"
  resource_group_name = data.azurerm_resource_group.rg_rubrica.name
  scopes              = [azurerm_mssql_database.free_database.id]
  description         = "Alert when free vCore seconds usage exceeds threshold"

  criteria {
    metric_namespace = "Microsoft.Sql/servers/databases"
    metric_name      = "vcore_usage_seconds"
    aggregation      = "Total"
    operator         = "GreaterThan"
    threshold        = 80000  # 80% of free limit
  }

  action {
    action_group_id = azurerm_monitor_action_group.email_alert.id
  }
}