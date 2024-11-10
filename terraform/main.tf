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
    key                 = "terraform.tfstate"
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
  os_type            = "Linux"
  sku_name           = "F1"
}

# Web App with PostgreSQL Database
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
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE" = "false"
    "SCM_DO_BUILD_DURING_DEPLOYMENT"      = "true"
    "PYTHON_ENABLE_WORKER_MP"             = "true"
    "DATABASE_TYPE"                       = "postgresql"
    "DATABASE_VERSION"                    = "13"
    "DATABASE_NAME"                       = var.database_name
    "DATABASE_USERNAME"                   = var.database_username
    "DATABASE_PASSWORD"                   = var.database_password
  }

  connection_string {
    name  = "Database"
    type  = "PostgreSQL"
    value = "Database=${var.database_name};Server=${var.app_service_name}-db;User Id=${var.database_username};Password=${var.database_password}"
  }
}