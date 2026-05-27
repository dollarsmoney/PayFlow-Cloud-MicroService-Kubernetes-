variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
  default     = "payflow-eks-cluster"
}

variable "github_repo" {
  description = "GitHub repository in format org/repo (e.g., octocat/hello-world)"
  type        = string
  default     = "dollarsmoney/PayFlow-Cloud-MicroService-Kubernetes-"
}
