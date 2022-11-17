terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.16"
    }
  }

  required_version = ">= 1.2.0"
}

provider "aws" {
  region = "us-east-1"
}

data "aws_availability_zones" "available" {
  state = "available"
}

variable "vpc_cidr_block" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_count" {
  description = "Number of public subnets."
  type        = number
  default     = 2
}

variable "private_subnet_count" {
  description = "Number of private subnets."
  type        = number
  default     = 2
}

variable "public_subnet_cidr_blocks" {
  description = "Available cidr blocks for public subnets"
  type        = list(string)
  default = [
    "10.0.1.0/24",
    "10.0.2.0/24",
    "10.0.3.0/24",
    "10.0.4.0/24",
    "10.0.5.0/24",
    "10.0.6.0/24",
    "10.0.7.0/24",
    "10.0.8.0/24",
  ]
}

variable "private_subnet_cidr_blocks" {
  description = "Available cidr blocks for private subnets"
  type        = list(string)
  default = [
    "10.0.101.0/24",
    "10.0.102.0/24",
    "10.0.103.0/24",
    "10.0.104.0/24",
    "10.0.105.0/24",
    "10.0.106.0/24",
    "10.0.107.0/24",
    "10.0.108.0/24",
  ]
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "2.64.0"

  name = "main-vpc"
  cidr = var.vpc_cidr_block

  azs             = data.aws_availability_zones.available.names
  private_subnets = slice(var.private_subnet_cidr_blocks, 0, var.private_subnet_count)
  public_subnets  = slice(var.public_subnet_cidr_blocks, 0, var.public_subnet_count)

  enable_nat_gateway = false
  enable_vpn_gateway = false
}

module "lb_security_group" {
  source  = "terraform-aws-modules/security-group/aws//modules/web"
  version = "3.17.0"

  name        = "lb-sg"
  description = "Security group for load balancer with HTTP ports open within VPC"
  vpc_id      = module.vpc.vpc_id

  ingress_cidr_blocks = ["0.0.0.0/0"]
}

resource "random_pet" "app" {
  length    = 2
  separator = "-"
}

resource "aws_lb" "opa_lb" {
  name               = "opa-lb"
  internal           = false
  load_balancer_type = "application"
  subnets            = module.vpc.public_subnets
  security_groups    = [module.lb_security_group.this_security_group_id]
}

resource "aws_lb_listener" "opa_lb" {
  load_balancer_arn = aws_lb.opa_lb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.opa_controller.arn
  }
}

resource "aws_lb_target_group" "opa_controller" {
  name        = "opa-${random_pet.app.id}-lb"
  port        = 80
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = module.vpc.vpc_id

  health_check {
    port     = 80
    protocol = "HTTP"
    timeout  = 5
    interval = 10
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_ecs_cluster" "cluster" {
  name = "superblocks-opa-cluster"
}

resource "aws_ecs_cluster_capacity_providers" "cluster" {
  cluster_name          = aws_ecs_cluster.cluster.name
  capacity_providers    = ["FARGATE"]

  default_capacity_provider_strategy {
    base                = 1
    weight              = 100
    capacity_provider   = "FARGATE"
  }
}

resource "aws_ecs_service" "opa_controller_service" {
  name               = "opa-controller-service"
  cluster            = aws_ecs_cluster.cluster.id
  task_definition    = aws_ecs_task_definition.opa_controller.arn
  launch_type        = "FARGATE"
  desired_count      = 1

  load_balancer {
    target_group_arn = aws_lb_target_group.opa_controller.arn
    container_name   = "opa-controller"
    container_port   = 8020
  }

  network_configuration {
    subnets          = module.vpc.public_subnets
  }
}

resource "aws_ecs_task_definition" "opa_controller" {
  family                     = "service"
  network_mode               = "awsvpc"
  # requires_compatibilities   = ["FARGATE", "EC2"]
  requires_compatibilities   = ["FARGATE"]
  cpu                        = 1024
  memory                     = 2048
  container_definitions      = <<DEFINITION
  [
    {
      "name": "opa-controller",
      "image": "ghcr.io/superblocksteam/agent-controller",
      "cpu": 1024,
      "memory": 2048,
      "essential": true,
      "portMappings": [
        {
          "containerPort"    : 8020,
          "hostPort"         : 8020
        }
      ],
      "environment": [
        { "name": "SUPERBLOCKS_AGENT_KEY", "value": "wwkBnn7VxYNDZgw4BK1Gu63ngSyG0kbvNygKK64dhsMEF6Qb" },
        { "name": "SUPERBLOCKS_AGENT_ENVIRONMENT", "value": "*" },
        { "name": "SUPERBLOCKS_WORKER_TLS_INSECURE", "value": "true" },
        { "name": "SUPERBLOCKS_AGENT_HOST_URL", "value": "http://localhost:8020" },
        { "name": "SUPERBLOCKS_AGENT_INTERNAL_HOST_AUTO", "value": "true" },
        { "name": "SUPERBLOCKS_AGENT_PORT", "value": "8020" },
        { "name": "SUPERBLOCKS_WORKER_PORT", "value": "5001" },
        { "name": "__SUPERBLOCKS_AGENT_SERVER_URL", "value": "https://app.superblocks.com" }
      ]
    }
  ]
  DEFINITION
}



# data "aws_ami" "amazon_linux" {
#   most_recent = true
#   owners      = ["amazon"]

#   filter {
#     name   = "name"
#     values = ["amzn2-ami-hvm-*-x86_64-gp2"]
#   }
# }

# resource "aws_instance" "app_server" {
#   ami           = data.aws_ami.amazon_linux.id
#   instance_type = "t2.micro"

#   tags = {
#     Name = "ExampleAppServerInstance"
#   }
# }
