# Todo app

## deployment

The course materials have the instructions for setting up a k3s cluster. Deploy the app to a Kubernetes cluster with
```sh
kubectl apply -f manifests/deployment.yaml
```
Now, the app can be accessed through `localhost:8081`