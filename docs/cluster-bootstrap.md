# PayFlow Cluster Bootstrap Guide

> End-to-end steps to provision the AWS EKS cluster and deploy all PayFlow microservices.
> Follow this guide **once** when setting up a brand-new environment.

---

## Prerequisites

Ensure the following tools are installed locally:

| Tool | Version | Install |
|------|---------|---------|
| AWS CLI | v2+ | `winget install Amazon.AWSCLI` |
| Terraform | v1.7+ | `winget install Hashicorp.Terraform` |
| kubectl | v1.30+ | `winget install Kubernetes.kubectl` |
| Helm | v3.14+ | `winget install Helm.Helm` |
| kustomize | v5+ | `winget install Kubernetes.kustomize` |

Configure your AWS credentials:
```bash
aws configure
# AWS Access Key ID: <your-key>
# AWS Secret Access Key: <your-secret>
# Default region: us-east-1
```

---

## Step 1 — Provision Infrastructure with Terraform

```bash
cd terraform/

# Download provider plugins
terraform init

# Preview what will be created
terraform plan

# Apply (takes ~15-20 minutes to create EKS + VPC)
terraform apply -auto-approve
```

**What gets created:**
- VPC with 3 public + 3 private subnets across 3 AZs
- EKS cluster `payflow-eks-cluster` (Kubernetes 1.30)
- Managed node group: 2× t3.medium EC2 instances (min 1, max 3)
- EKS Add-ons: CoreDNS, kube-proxy, VPC CNI, **EBS CSI Driver** (for gp3 PVCs)
- IRSA role for EBS CSI driver
- 9× ECR repositories (`payflow/<service-name>`)

---

## Step 2 — Configure kubectl

After Terraform completes, connect your local kubectl to the new cluster:

```bash
aws eks update-kubeconfig \
  --name payflow-eks-cluster \
  --region us-east-1

# Verify connection
kubectl get nodes
# Expected: 2 nodes in Ready state
```

---

## Step 3 — Install NGINX Ingress Controller

The Ingress Controller provisions a single AWS Network Load Balancer (NLB) for all external traffic:

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.type=LoadBalancer \
  --set controller.service.annotations."service\.beta\.kubernetes\.io/aws-load-balancer-type"=nlb \
  --set controller.replicaCount=2 \
  --wait

# Verify (get the external DNS of your NLB — takes ~2 min to provision)
kubectl get svc -n ingress-nginx
```

Copy the `EXTERNAL-IP` — this is your cluster's public endpoint.

---

## Step 4 — Install metrics-server (required for HPA)

HPAs need metrics-server to read CPU/memory from pods:

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Verify
kubectl get deployment metrics-server -n kube-system
```

---

## Step 5 — Install ArgoCD

```bash
kubectl create namespace argocd

helm repo add argo https://argoproj.github.io/argo-helm
helm repo update

helm install argocd argo/argo-cd \
  --namespace argocd \
  --set server.service.type=ClusterIP \
  --wait

# Get the initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 --decode && echo

# Port-forward to access ArgoCD UI locally
kubectl port-forward svc/argocd-server -n argocd 8080:443
# Open: https://localhost:8080
# Login: admin / <password from above>
```

---

## Step 6 — Deploy PayFlow via GitOps

Register the PayFlow application with ArgoCD:

```bash
kubectl apply -f argocd/payflow-app.yaml
```

ArgoCD will immediately:
1. Clone the Git repository
2. Run `kustomize build k8s/`
3. Apply all manifests to `payflow-system` namespace
4. Monitor for drift and auto-heal

**Watch the sync progress:**
```bash
# CLI (requires argocd CLI)
argocd app get payflow-system --watch

# OR watch pods come up directly
kubectl get pods -n payflow-system --watch
```

---

## Step 7 — Verify Everything is Running

```bash
# All pods should be Running
kubectl get pods -n payflow-system

# Services (all ClusterIP except api-gateway and frontend which use Ingress)
kubectl get svc -n payflow-system

# Ingress (shows the NLB hostname as ADDRESS)
kubectl get ingress -n payflow-system

# HPA (shows current replicas vs desired)
kubectl get hpa -n payflow-system

# PVCs (postgres and kafka storage — should be Bound)
kubectl get pvc -n payflow-system

# Kafka is running
kubectl exec -it kafka-0 -n payflow-system -- \
  kafka-topics.sh --bootstrap-server localhost:9092 --list
```

**Expected output:**
```
NAME                              READY   STATUS    RESTARTS   AGE
api-gateway-xxx                   1/1     Running   0          2m
auth-service-xxx                  1/1     Running   0          2m
fraud-detection-service-xxx       1/1     Running   0          2m
frontend-xxx                      1/1     Running   0          2m
kafka-0                           1/1     Running   0          3m
notification-service-xxx          1/1     Running   0          2m
payment-service-xxx               1/1     Running   0          2m
postgres-0                        1/1     Running   0          3m
transaction-history-service-xxx   1/1     Running   0          2m
user-service-xxx                  1/1     Running   0          2m
wallet-service-xxx                1/1     Running   0          2m
```

---

## Step 8 — Access the Application

```bash
# Get the NLB external hostname
INGRESS_HOST=$(kubectl get ingress payflow-ingress \
  -n payflow-system \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

echo "Frontend: http://$INGRESS_HOST"
echo "API:      http://$INGRESS_HOST/api"
echo "Health:   http://$INGRESS_HOST/api/health"
```

---

## GitOps Flow (After Bootstrap)

Once the cluster is bootstrapped, day-to-day deployments are **fully automated**:

```
Developer pushes to main
        ↓
GitHub Actions: validate-manifests (dry-run)
        ↓
GitHub Actions: build-and-push (all 9 services → ECR)
        ↓
GitHub Actions: update-manifests (kustomization.yaml image tags → git push)
        ↓
ArgoCD detects kustomization.yaml change in Git
        ↓
ArgoCD: kustomize build k8s/ + kubectl apply
        ↓
Rolling update deployed to EKS (zero downtime)
```

---

## Useful Commands

```bash
# View logs for a service
kubectl logs -n payflow-system -l app=auth-service --follow

# Scale a service manually (ArgoCD self-heal will revert this)
kubectl scale deployment auth-service -n payflow-system --replicas=4

# Check HPA current state
kubectl describe hpa auth-service-hpa -n payflow-system

# Force ArgoCD sync
kubectl -n argocd exec deploy/argocd-server -- argocd app sync payflow-system

# Restart a deployment (zero-downtime rolling restart)
kubectl rollout restart deployment/auth-service -n payflow-system

# Check resource usage (requires metrics-server)
kubectl top pods -n payflow-system
kubectl top nodes

# Connect to Postgres directly
kubectl exec -it postgres-0 -n payflow-system -- \
  psql -U payflow_user -d payflow_db
```

---

## Teardown

```bash
# Delete all K8s resources
kubectl delete namespace payflow-system argocd ingress-nginx

# Destroy AWS infrastructure (EKS, VPC, ECR)
cd terraform/
terraform destroy -auto-approve
```

> ⚠️ `terraform destroy` will permanently delete all EBS volumes (Postgres + Kafka data).
> Take a database backup first if you need to preserve data.
