# Log output

Log output consists of two applications: log output and ping-pong. The contents of log output are accessible from the `/status` endpoint and ping-pong is accessible through the `/pingpong` endpoint.

## deployment

Deploy the apps to k8s cluster with
```sh
kubectl apply -f manifests
```