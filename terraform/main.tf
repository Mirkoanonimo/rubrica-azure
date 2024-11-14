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

# Get current client configuration
data "azurerm_client_config" "current" {}

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
  sku_name       = "GP_S_Gen5_1"
  zone_redundant = false

  auto_pause_delay_in_minutes = 60
  min_capacity               = 0.5
  
  tags = {
    Environment = "Production"
    Service     = "Free-Tier-SQL"
  }

  lifecycle {
    ignore_changes = [
      sku_name,
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

# Backend Web App
resource "azurerm_linux_web_app" "backend_webapp" {
  name                = "${var.app_service_name}-backend"
  resource_group_name = data.azurerm_resource_group.rg_rubrica.name
  location            = data.azurerm_resource_group.rg_rubrica.location
  service_plan_id     = azurerm_service_plan.app_service_plan.id

  site_config {
    application_stack {
      python_version = "3.9"
    }
    always_on = false
    cors {
      allowed_origins     = ["https://${var.app_service_name}-frontend.azurewebsites.net"]
      support_credentials = true
    }
  }

  identity {
    type = "SystemAssigned"
  }

  app_settings = {
    # Impostazioni Web App
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE" = "true"
    "SCM_DO_BUILD_DURING_DEPLOYMENT"      = "true"
    "PYTHON_ENABLE_WORKER_MP"             = "true"
    "WEBSITES_PORT"                       = "8000"
    
    # Impostazioni Ambiente
    "ENVIRONMENT"                         = "production"
    "DEBUG"                               = "false"
    "AZURE_KEY_VAULT_ENDPOINT"           = azurerm_key_vault.rubrica_vault.vault_uri
    
    # Database
    "DATABASE_TYPE"                       = "azure_sql"
    "DATABASE_NAME"                       = azurerm_mssql_database.free_database.name
    "DATABASE_SERVER"                     = azurerm_mssql_server.sql_server.fully_qualified_domain_name
    "DATABASE_USERNAME"                   = var.database_username
    "DATABASE_PASSWORD"                   = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.db_password.id})"
    
    # Sicurezza
    "SECRET_KEY"                         = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.jwt_secret.id})"
    
    # CORS
    "CORS_ORIGINS"                       = "https://${var.app_service_name}-frontend.azurewebsites.net"
  }

  connection_string {
    name  = "Database"
    type  = "SQLAzure"
    value = "Server=${azurerm_mssql_server.sql_server.fully_qualified_domain_name};Database=${azurerm_mssql_database.free_database.name};User ID=${var.database_username};Password=@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.db_password.id})"
  }
}


# Frontend Web App
resource "azurerm_linux_web_app" "frontend_webapp" {
  name                = "${var.app_service_name}-frontend"
  resource_group_name = data.azurerm_resource_group.rg_rubrica.name
  location            = data.azurerm_resource_group.rg_rubrica.location
  service_plan_id     = azurerm_service_plan.app_service_plan.id

  site_config {
    application_stack {
      node_version = "16-lts"
    }
    always_on = false
  }

  app_settings = {
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE" = "true"
    "SCM_DO_BUILD_DURING_DEPLOYMENT"      = "true"
    "VITE_API_URL"                       = "https://${azurerm_linux_web_app.backend_webapp.name}.azurewebsites.net"
    "ENVIRONMENT"                         = "production"
    "WEBSITE_NODE_DEFAULT_VERSION"        = "~16"
  }

  identity {
    type = "SystemAssigned"
  }
}

# SQL AD Admin for Backend
resource "azurerm_mssql_server_azure_ad_administrator" "sql_ad_admin" {
  server_id               = azurerm_mssql_server.sql_server.id
  login_username         = "AzureAD Admin"
  object_id              = azurerm_linux_web_app.backend_webapp.identity[0].principal_id
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
    threshold        = 80000
  }

  action {
    action_group_id = azurerm_monitor_action_group.email_alert.id
  }
}

# Azure Key Vault - Free Tier
resource "azurerm_key_vault" "rubrica_vault" {
  name                        = "kv-rubrica-${var.environment}"
  location                    = data.azurerm_resource_group.rg_rubrica.location
  resource_group_name         = data.azurerm_resource_group.rg_rubrica.name
  enabled_for_disk_encryption = true
  tenant_id                   = data.azurerm_client_config.current.tenant_id
  soft_delete_retention_days  = 7
  purge_protection_enabled    = false
  sku_name                   = "standard"  # Free tier

  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id

    secret_permissions = [
      "Get",
      "List",
      "Set",
      "Delete",
      "Recover",
      "Backup",
      "Restore"
    ]
  }
}

# Segreti nel Key Vault
# Azure Key Vault - Free Tier
resource "azurerm_key_vault" "rubrica_vault" {
  name                        = var.key_vault_name
  location                    = data.azurerm_resource_group.rg_rubrica.location
  resource_group_name         = data.azurerm_resource_group.rg_rubrica.name
  enabled_for_disk_encryption = true
  tenant_id                   = data.azurerm_client_config.current.tenant_id
  soft_delete_retention_days  = 7
  purge_protection_enabled    = false
  sku_name                   = "standard"

  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id

    secret_permissions = [
      "Get",
      "List",
      "Set",
      "Delete",
      "Recover"
    ]
  }
}

# Segreti nel Key Vault
resource "azurerm_key_vault_secret" "jwt_secret" {
  name         = "jwt-secret-key"
  value        = var.secret_key
  key_vault_id = azurerm_key_vault.rubrica_vault.id

  depends_on = [
    azurerm_key_vault.rubrica_vault,
    azurerm_key_vault_access_policy.backend_policy
  ]
}

/*
resource "azurerm_key_vault_secret" "db_password" {
  name         = "db-password"
  value        = var.database_password
  key_vault_id = azurerm_key_vault.rubrica_vault.id
}
*/
# Accesso per Backend Web App
resource "azurerm_key_vault_access_policy" "backend_policy" {
  key_vault_id = azurerm_key_vault.rubrica_vault.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = azurerm_linux_web_app.backend_webapp.identity[0].principal_id

  secret_permissions = [
    "Get",
    "List"
  ]
}

