# Core Azure Variables
variable "azure_subscription" {
  description = "Azure Subscription ID"
  type        = string
}

variable "azure_region" {
  description = "Azure Region for deployment"
  type        = string
}

variable "resource_group" {
  description = "Name of the Resource Group"
  type        = string
}

# Database Variables
variable "database_username" {
  description = "Azure SQL Server Admin Username"
  type        = string
  validation {
    condition     = can(regex("^[a-zA-Z0-9_-]{1,128}$", var.database_username))
    error_message = "Database username must be 1-128 characters and can only contain letters, numbers, underscores, and hyphens."
  }
}

variable "database_password" {
  description = "Azure SQL Server Admin Password"
  type        = string
  sensitive   = true
  validation {
    condition     = can(regex("^[a-zA-Z0-9!@#$%^&*()_+=-]{8,128}$", var.database_password))
    error_message = "Database password must be 8-128 characters and contain a mix of letters, numbers, and special characters."
  }
}

variable "database_name" {
  description = "Name of the Azure SQL Database"
  type        = string
  default     = "contacts"
  validation {
    condition     = can(regex("^[a-z0-9-]{1,63}$", var.database_name))
    error_message = "Database name must be 1-63 characters and can only contain lowercase letters, numbers, and hyphens."
  }
}

variable "database_type" {
  description = "Type of database (postgresql/azure_sql)"
  type        = string
  default     = "azure_sql"
}

# App Service Variables
variable "app_service_name" {
  description = "Base name for the App Services"
  type        = string
  default     = "app-rubrica"
  validation {
    condition     = can(regex("^[a-z0-9-]{2,40}$", var.app_service_name))
    error_message = "App service name must be 2-40 characters and can only contain lowercase letters, numbers, and hyphens."
  }
}

variable "frontend_app_name" {
  description = "Name of the Frontend App Service"
  type        = string
  default     = null # Will be constructed using app_service_name if not provided
}

variable "backend_app_name" {
  description = "Name of the Backend App Service"
  type        = string
  default     = null # Will be constructed using app_service_name if not provided
}

variable "app_service_plan_name" {
  description = "Name of the App Service Plan"
  type        = string
  default     = "plan-rubrica"
  validation {
    condition     = can(regex("^[a-z0-9-]{1,40}$", var.app_service_plan_name))
    error_message = "App service plan name must be 1-40 characters and can only contain lowercase letters, numbers, and hyphens."
  }
}

# Environment Variables
variable "environment" {
  description = "Environment name (dev/prod)"
  type        = string
  default     = "dev"
  validation {
    condition     = contains(["development", "production"], var.environment)
    error_message = "Environment must be either 'development' or 'production'."
  }
}

# Monitoring Variables
variable "alert_email_address" {
  description = "Email address for database monitoring alerts"
  type        = string
  validation {
    condition     = can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.alert_email_address))
    error_message = "Please provide a valid email address."
  }
}

# SQL Server Variables
variable "sql_server_name" {
  description = "Name of the Azure SQL Server"
  type        = string
  default     = "sql-rubrica"
  validation {
    condition     = can(regex("^[a-z0-9-]{1,63}$", var.sql_server_name))
    error_message = "SQL Server name must be 1-63 characters and can only contain lowercase letters, numbers, and hyphens."
  }
}

# Frontend Configuration
variable "node_version" {
  description = "Node.js version for frontend"
  type        = string
  default     = "16-lts"
  validation {
    condition     = contains(["14-lts", "16-lts", "18-lts"], var.node_version)
    error_message = "Node version must be one of: 14-lts, 16-lts, 18-lts."
  }
}

# Backend Configuration
variable "python_version" {
  description = "Python version for backend"
  type        = string
  default     = "3.9"
  validation {
    condition     = contains(["3.8", "3.9", "3.10", "3.11"], var.python_version)
    error_message = "Python version must be one of: 3.8, 3.9, 3.10, 3.11."
  }
}

variable "debug" {
  description = "Debug mode"
  type        = string
  default     = "false"
}

variable "key_vault_name" {
  description = "Nome del Key Vault"
  type        = string
  default     = "kv-rubrica-dev"
}

variable "secret_key" {
  description = "JWT Secret Key"
  type        = string
  sensitive   = true
}