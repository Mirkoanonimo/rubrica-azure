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
  description = "Database Admin Username"
  type        = string
}

variable "database_password" {
  description = "Database Admin Password"
  type        = string
  sensitive   = true
}

variable "database_name" {
  description = "Name of the database"
  type        = string
  default     = "contacts"
}

variable "app_service_name" {
  description = "Name of the App Service"
  type        = string
  default     = "app-rubrica"
}

variable "app_service_plan_name" {
  description = "Name of the App Service Plan"
  type        = string
  default     = "plan-rubrica"
}