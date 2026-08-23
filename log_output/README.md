# Log output

Log output consists of two applications: log output and ping-pong. The contents of log output are accessible from the `/status` endpoint and ping-pong is accessible through the `/pingpong` endpoint. The `/` endpoint gives both the random string and ping count.

## deployment

Deploy the apps to k8s cluster with
```sh
kubectl apply -f manifests
```
With the k3s cluster set as per the course material, the apps are available from `localhost:8081`.