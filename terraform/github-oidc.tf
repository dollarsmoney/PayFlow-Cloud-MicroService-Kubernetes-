# Create OIDC Provider for GitHub Actions
resource "aws_iam_openid_connect_provider" "github_actions" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  
  # GitHub's official current OIDC thumbprint
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

# IAM Role Trust Policy for GitHub Actions
data "aws_iam_policy_document" "github_actions_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github_actions.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      # Strict restriction to specific GitHub repository to prevent broad access
      values   = ["repo:dollarsmoney/PayFlow-Cloud-MicroService-Kubernetes-:*" ]
    }
  }
}

# The IAM Role
resource "aws_iam_role" "github_actions_role" {
  name               = "github-actions-payflow-deploy"
  assume_role_policy = data.aws_iam_policy_document.github_actions_assume_role.json
}

# Attach permissions to allow pushing to ECR (Least privilege for ECR)
resource "aws_iam_role_policy_attachment" "github_actions_ecr" {
  role       = aws_iam_role.github_actions_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser"
}

# Inline policy to allow describing the EKS cluster (needed for `aws eks update-kubeconfig`)
resource "aws_iam_role_policy" "github_actions_eks_deploy" {
  name = "github-actions-eks-deploy"
  role = aws_iam_role.github_actions_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "eks:DescribeCluster"
        ]
        Resource = "*"
      }
    ]
  })
}

output "github_actions_role_arn" {
  description = "The ARN of the IAM role for GitHub Actions to assume"
  value       = aws_iam_role.github_actions_role.arn
}
