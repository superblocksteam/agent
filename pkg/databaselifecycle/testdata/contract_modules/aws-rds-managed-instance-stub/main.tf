# Provider-free stand-in for the real aws-rds-managed-instance /
# aws-aurora-managed-cluster modules (terraform-superblocks-databases).
# It declares no provider and creates no resources, so
# physical_credential_output_tofu_test.go can `tofu init`/`apply` it fully
# offline. The emit_* variables let a single module fixture reproduce every
# credential shape those real modules publish today, so the generated
# lifecycle root's try() fallback chain (materialize.go rootModuleHCL) is
# evaluated by real OpenTofu instead of a Go re-implementation of it.

variable "binding_key" {
  type = any
}

variable "desired_spec_hash" {
  type = any
}

variable "environment_class" {
  type = any
}

variable "environment_name" {
  type = any
}

variable "operation" {
  type = any
}

variable "profile_id" {
  type = any
}

variable "request_id" {
  type = any
}

variable "resource_key" {
  type = any
}

variable "emit_credential_refs" {
  type    = bool
  default = true
}

variable "emit_master_user_secret_arn" {
  type    = bool
  default = false
}

variable "host" {
  type    = any
  default = "pool.example.com"
}

variable "region" {
  type    = any
  default = "us-east-1"
}

locals {
  credential_refs = var.emit_credential_refs ? {
    password = {
      resolver = "aws_secrets_manager"
      ref      = "arn:aws:secretsmanager:us-east-1:123456789012:secret:rds!pool"
      field    = "password"
    }
    username = {
      resolver = "aws_secrets_manager"
      ref      = "arn:aws:secretsmanager:us-east-1:123456789012:secret:rds!pool"
      field    = "username"
    }
  } : {}
}

output "connection_metadata" {
  value = {
    aws_account_id      = "123456789012"
    cluster_resource_id = "db-ABCDEFGHIJKLMNOPQRSTUV"
    host                = var.host
    port                = 5432
    region              = var.region
  }
}

output "credential_refs" {
  value     = local.credential_refs
  sensitive = true
}

output "master_user_secret_arn" {
  value     = var.emit_master_user_secret_arn ? "arn:aws:secretsmanager:us-east-1:123456789012:secret:rds!pool-master" : null
  sensitive = true
}

output "capacity_max" {
  value = 4
}
