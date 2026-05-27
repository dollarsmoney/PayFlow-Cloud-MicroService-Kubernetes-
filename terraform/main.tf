# ==============================================================================
# TERRAFORM — EKS CLUSTER INFRASTRUCTURE
# ==============================================================================
# This file provisions:
#   1. VPC with public/private subnets across 3 AZs
#   2. EKS cluster (version 1.30) with a managed node group
#   3. ECR repositories for all 9 PayFlow services
#   4. EBS CSI Driver addon + IRSA (required for gp3 PersistentVolumes)
#   5. Metrics Server addon (required for HPA autoscaling)
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. VPC — networking foundation for the EKS cluster
# ------------------------------------------------------------------------------
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${var.cluster_name}-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["${var.aws_region}a", "${var.aws_region}b", "${var.aws_region}c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = true

  # Required tags for EKS to discover subnets for load balancers
  public_subnet_tags = {
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
    "kubernetes.io/role/elb"                    = "1"
  }

  private_subnet_tags = {
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
    "kubernetes.io/role/internal-elb"           = "1"
  }

  tags = {
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
  }
}

# ------------------------------------------------------------------------------
# 2. EKS CLUSTER
# ------------------------------------------------------------------------------
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = var.cluster_name
  cluster_version = "1.30"

  vpc_id                   = module.vpc.vpc_id
  subnet_ids               = module.vpc.private_subnets
  control_plane_subnet_ids = module.vpc.public_subnets

  cluster_endpoint_public_access = true

  # EKS Managed Add-ons
  # These are AWS-managed Kubernetes components installed as EKS addons
  cluster_addons = {
    # CoreDNS — cluster DNS resolution (required)
    coredns = {
      most_recent = true
    }

    # kube-proxy — network proxy on each node (required)
    kube-proxy = {
      most_recent = true
    }

    # VPC CNI — pod networking (required)
    vpc-cni = {
      most_recent = true
    }

    # EBS CSI Driver — REQUIRED for PersistentVolumes using gp3 StorageClass
    # Without this addon, Postgres and Kafka PVCs will remain in Pending state.
    # The driver needs an IAM role (via IRSA) to create EBS volumes on AWS.
    aws-ebs-csi-driver = {
      most_recent              = true
      service_account_role_arn = module.ebs_csi_driver_irsa.iam_role_arn
    }
  }

  eks_managed_node_groups = {
    default = {
      min_size       = 1
      max_size       = 3
      desired_size   = 2
      instance_types = ["t3.medium"]

      # Add labels for node selection
      labels = {
        Environment = "production"
        Project     = "payflow"
      }

      tags = {
        Project     = "payflow"
        Environment = "production"
      }
    }
  }

  tags = {
    Project     = "payflow"
    Environment = "production"
  }
}

# ------------------------------------------------------------------------------
# 3. IRSA — IAM Role for EBS CSI Driver Service Account
# ------------------------------------------------------------------------------
# Why IRSA (IAM Roles for Service Accounts):
# The EBS CSI Driver needs AWS IAM permissions to create/attach/delete EBS volumes.
# IRSA lets a Kubernetes ServiceAccount assume an IAM Role — no hardcoded
# AWS credentials inside the cluster. Secure, auditable, and rotates automatically.
# ------------------------------------------------------------------------------
module "ebs_csi_driver_irsa" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "~> 5.0"

  role_name             = "ebs-csi-driver-${var.cluster_name}"
  attach_ebs_csi_policy = true

  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["kube-system:ebs-csi-controller-sa"]
    }
  }

  tags = {
    Project = "payflow"
  }
}

# ------------------------------------------------------------------------------
# 4. ECR REPOSITORIES — one per microservice
# ------------------------------------------------------------------------------
locals {
  services = [
    "api-gateway",
    "auth-service",
    "fraud-detection-service",
    "frontend",
    "notification-service",
    "payment-service",
    "transaction-history-service",
    "user-service",
    "wallet-service"
  ]
}

resource "aws_ecr_repository" "services" {
  for_each = toset(local.services)

  name                 = "payflow/${each.key}"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Project = "payflow"
    Service = each.key
  }
}

# ECR lifecycle policies — keep only the last 10 images per repo to save storage costs
resource "aws_ecr_lifecycle_policy" "services" {
  for_each   = aws_ecr_repository.services
  repository = each.value.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 10
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
