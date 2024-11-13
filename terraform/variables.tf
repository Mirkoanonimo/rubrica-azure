# variables.tf

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

variable "app_service_name" {
  description = "Name of the App Service"
  type        = string
  default     = "app-rubrica"
  validation {
    condition     = can(regex("^[a-z0-9-]{2,60}$", var.app_service_name))
    error_message = "App service name must be 2-60 characters and can only contain lowercase letters, numbers, and hyphens."
  }
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

variable "alert_email_address" {
  description = "Email address for database monitoring alerts"
  type        = string
  validation {
    condition     = can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.alert_email_address))
    error_message = "Please provide a valid email address."
  }
}

variable "sql_server_name" {
  description = "Name of the Azure SQL Server"
  type        = string
  default     = "sql-rubrica"
  validation {
    condition     = can(regex("^[a-z0-9-]{1,63}$", var.sql_server_name))
    error_message = "SQL Server name must be 1-63 characters and can only contain lowercase letters, numbers, and hyphens."
  }
}