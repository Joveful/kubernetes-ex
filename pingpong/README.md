# Pingpong

Keeps count of how many times the `/pingpong` endpoint has been requested.

## deployment

This app is deployed as part of `log-ouput` app, using its ingress to route traffic here. This means that `log-output` must be deployed alongside `pingpong`. 

The pingpong app is deployed to a k8s cluster with
```sh
kubectl apply -f manifests
```
The deployment manifest pulls an image from Docker Hub.