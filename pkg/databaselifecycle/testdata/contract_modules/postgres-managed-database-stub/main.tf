# Provider-free stand-in for the real postgres-managed-database /
# postgres-managed-database-core modules (terraform-superblocks-databases) in
# auth_mode=aws_iam_role. It declares no provider and creates no resources
# (no local-exec psql calls), so worker_iam_ready_tofu_test.go can
# `tofu init`/`apply` it without a live Postgres server. Its source path
# contains "postgres-managed-database" so materialize.go's isSharedModeModule
# / isIAMAuthModule detection routes it through the same IAM wiring
# (deriveIAMSharedPhysicalDatabaseInputs, trustedIAMPhysicalDatabaseInputs,
# root credential/provider omission) as the real module.
#
# `tofu init` still needs network to fetch the hashicorp/aws and
# cyrilgdn/postgresql providers that materialize.go's rootModuleHCL declares
# unconditionally for every shared-mode root (even though IAM mode never
# configures or uses either provider) — the same cost the pre-existing
# pinned contract proof already pays. No AWS credentials or live database
# are required.

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

variable "application_id" {
  type = any
}

variable "binding_id" {
  type = any
}

variable "database_name" {
  type = any
}

variable "database_owner_role_name" {
  type = any
}

variable "runtime_role_name" {
  type = any
}

variable "auth_mode" {
  type = any
}

variable "connector_role_arn" {
  type = any
}

variable "aws_account_id" {
  type = any
}

variable "cluster_resource_id" {
  type = any
}

variable "host" {
  type = any
}

variable "port" {
  type = any
}

variable "region" {
  type = any
}

variable "postgres_admin_database" {
  type = any
}

variable "postgres_sslmode" {
  type = any
}

variable "postgres_sslrootcert" {
  type = any
}

# application_id and binding_id are intentionally omitted here: the real
# module doesn't need to echo them either, since
# bindTrustedIAMDispatchIdentity (output.go) fills them in from the trusted
# dispatch payload before the callback is validated.
output "connection_metadata" {
  value = {
    auth_descriptor_version = 1
    auth_mode               = var.auth_mode
    aws_account_id          = var.aws_account_id
    cluster_resource_id     = var.cluster_resource_id
    connector_role_arn      = var.connector_role_arn
    database                = var.database_name
    host                    = var.host
    port                    = var.port
    region                  = var.region
    username                = var.runtime_role_name
  }
}
