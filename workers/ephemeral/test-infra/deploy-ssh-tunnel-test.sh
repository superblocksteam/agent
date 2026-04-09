#!/usr/bin/env bash
set -euo pipefail

# Deploy sshd + Postgres infrastructure for SSH tunnel e2e tests.
# Generates a throwaway RSA key pair, injects the public key into sshd,
# and writes the private key to a file for deploy-helm to pass via --set-file.

K8S_CONTEXT="${K8S_CONTEXT:-kind-superblocks}"
K8S_NAMESPACE="${K8S_NAMESPACE:-superblocks}"

TMPDIR="$(mktemp -d)"
trap 'rm -rf "${TMPDIR}"' EXIT

echo "==> Generating test RSA key pair..."
ssh-keygen -t rsa -b 2048 -f "${TMPDIR}/id_rsa" -N "" -q

PUBLIC_KEY=$(cat "${TMPDIR}/id_rsa.pub")

# Write private key to a well-known path so deploy-helm can pass it via --set-file
TUNNEL_KEY_PATH="${TUNNEL_KEY_PATH:-/tmp/tunnel-rsa-key}"
cp "${TMPDIR}/id_rsa" "${TUNNEL_KEY_PATH}"
echo "==> Wrote tunnel private key to ${TUNNEL_KEY_PATH}"

echo "==> Deploying Postgres..."
kubectl --context "${K8S_CONTEXT}" -n "${K8S_NAMESPACE}" delete pod tunnel-postgres --ignore-not-found
kubectl --context "${K8S_CONTEXT}" -n "${K8S_NAMESPACE}" delete svc tunnel-postgres --ignore-not-found
kubectl --context "${K8S_CONTEXT}" -n "${K8S_NAMESPACE}" run tunnel-postgres \
  --image=postgres:16-alpine \
  --image-pull-policy=IfNotPresent \
  --restart=Never \
  --port=5432 \
  --env="POSTGRES_USER=testuser" \
  --env="POSTGRES_PASSWORD=testpass" \
  --env="POSTGRES_DB=testdb"
kubectl --context "${K8S_CONTEXT}" -n "${K8S_NAMESPACE}" expose pod tunnel-postgres \
  --port=5432 --target-port=5432 --name=tunnel-postgres

echo "==> Creating sshd ConfigMap..."
kubectl --context "${K8S_CONTEXT}" -n "${K8S_NAMESPACE}" delete configmap sshd-config --ignore-not-found
kubectl --context "${K8S_CONTEXT}" -n "${K8S_NAMESPACE}" create configmap sshd-config \
  --from-literal=authorized_keys="${PUBLIC_KEY}" \
  --from-literal=sshd_config="$(cat <<'SSHD'
Port 22
PermitRootLogin no
PubkeyAuthentication yes
AuthorizedKeysFile /home/tunnel/.ssh/authorized_keys
PasswordAuthentication no
AllowTcpForwarding yes
GatewayPorts no
X11Forwarding no
Subsystem sftp /usr/lib/ssh/sftp-server
HostKey /etc/ssh/ssh_host_rsa_key
HostKey /etc/ssh/ssh_host_ed25519_key
SSHD
)"

echo "==> Deploying sshd..."
kubectl --context "${K8S_CONTEXT}" -n "${K8S_NAMESPACE}" delete pod tunnel-sshd --ignore-not-found
kubectl --context "${K8S_CONTEXT}" -n "${K8S_NAMESPACE}" delete svc tunnel-sshd --ignore-not-found
kubectl --context "${K8S_CONTEXT}" -n "${K8S_NAMESPACE}" apply -f - <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: tunnel-sshd
  namespace: ${K8S_NAMESPACE}
  labels:
    app: tunnel-sshd
spec:
  initContainers:
    - name: setup
      image: alpine:3.19
      command:
        - sh
        - -c
        - |
          apk add --no-cache openssh-keygen
          ssh-keygen -A -f /mnt/hostkeys
          adduser -D -s /bin/ash tunnel
          mkdir -p /mnt/home/tunnel/.ssh
          cp /mnt/config/authorized_keys /mnt/home/tunnel/.ssh/authorized_keys
          chown -R 1000:1000 /mnt/home/tunnel
          chmod 700 /mnt/home/tunnel/.ssh
          chmod 600 /mnt/home/tunnel/.ssh/authorized_keys
      volumeMounts:
        - name: host-keys
          mountPath: /mnt/hostkeys/etc/ssh
        - name: sshd-config
          mountPath: /mnt/config
        - name: home
          mountPath: /mnt/home
  containers:
    - name: sshd
      image: alpine:3.19
      command:
        - sh
        - -c
        - |
          apk add --no-cache openssh-server
          adduser -D -s /bin/ash -u 1000 tunnel
          cp -r /mnt/home/tunnel /home/tunnel
          chown -R tunnel:tunnel /home/tunnel
          cp /mnt/hostkeys/* /etc/ssh/ 2>/dev/null || true
          /usr/sbin/sshd -D -e -f /mnt/config/sshd_config
      ports:
        - containerPort: 22
      volumeMounts:
        - name: host-keys
          mountPath: /mnt/hostkeys
        - name: sshd-config
          mountPath: /mnt/config
        - name: home
          mountPath: /mnt/home
  volumes:
    - name: host-keys
      emptyDir: {}
    - name: sshd-config
      configMap:
        name: sshd-config
    - name: home
      emptyDir: {}
EOF

kubectl --context "${K8S_CONTEXT}" -n "${K8S_NAMESPACE}" expose pod tunnel-sshd \
  --port=22 --target-port=22 --name=tunnel-sshd

echo "==> Waiting for Postgres to be ready..."
kubectl --context "${K8S_CONTEXT}" -n "${K8S_NAMESPACE}" wait --for=condition=ready pod/tunnel-postgres --timeout=120s

echo "==> Waiting for sshd to be ready..."
kubectl --context "${K8S_CONTEXT}" -n "${K8S_NAMESPACE}" wait --for=condition=ready pod/tunnel-sshd --timeout=120s

echo "==> SSH tunnel test infrastructure deployed."
echo "    Postgres: tunnel-postgres.${K8S_NAMESPACE}.svc.cluster.local:5432"
echo "    sshd:     tunnel-sshd.${K8S_NAMESPACE}.svc.cluster.local:22"
echo "    User:     tunnel"
echo "    Auth:     PUB_KEY_RSA (key at ${TUNNEL_KEY_PATH})"
